
create table public.engagex_crm_handoffs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.engagex_workspaces(id),
  record_kind text not null check(record_kind in ('contact','prospect')),
  record_id uuid not null,
  lead_id uuid references public.st_crm_leads(id) on delete set null,
  lead_ref text,
  status text not null check(status in ('synced','blocked','failed')),
  error text,
  synced_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(workspace_id,record_kind,record_id)
);
alter table public.engagex_crm_handoffs enable row level security;
revoke all on public.engagex_crm_handoffs from public,anon,authenticated;
grant select on public.engagex_crm_handoffs to authenticated;
grant all on public.engagex_crm_handoffs to service_role;
create policy engagex_crm_handoffs_read on public.engagex_crm_handoffs for select to authenticated
using(engagex_private.workspace_role(workspace_id) is not null);
create index engagex_crm_handoffs_lead_idx on public.engagex_crm_handoffs(lead_id);

create function engagex_private.crm_phone(value text) returns text
language sql immutable strict set search_path='' as $$
 select case when length(n)=10 then '91'||n when length(n)=11 and left(n,1)='0' then '91'||substring(n from 2) else n end
 from (select regexp_replace(value,'[^0-9]','','g') n) s
$$;
revoke all on function engagex_private.crm_phone(text) from public,anon,authenticated;
create index st_crm_leads_sync_phone_idx on public.st_crm_leads(engagex_private.crm_phone(mobile));
create index st_crm_leads_sync_whatsapp_idx on public.st_crm_leads(engagex_private.crm_phone(whatsapp));
create index st_crm_leads_sync_email_idx on public.st_crm_leads(lower(trim(email)));

create function engagex_private.crm_handoff() returns trigger
language plpgsql security definer set search_path='' as $$
declare
 kind text := case when TG_TABLE_NAME='engagex_contacts' then 'contact' else 'prospect' end;
 eligible boolean;
 phone_value text; email_value text; business_value text; contact_value text;
 city_value text; category_value text; website_value text; notes_value text;
 source_value text; source_url_value text; product_value text;
 dest public.st_crm_leads%rowtype;
 matches uuid[]; existing_link public.engagex_crm_handoffs%rowtype;
 contact_uuid uuid; campaign_uuid uuid; campaign_name text; channel_value text;
 origin jsonb; activity jsonb; existing_origin jsonb;
 now_at timestamptz := now();
 is_new_link boolean;
begin
 -- Only the Savrdh Technology workspace is routed into the Savrdh sales CRM.
 if not exists(select 1 from public.engagex_workspaces where id=NEW.workspace_id and slug='savrdh-engagex') then return NEW; end if;
 if auth.uid() is not null and engagex_private.workspace_role(NEW.workspace_id) not in ('Owner','Admin','Manager') then
   raise exception 'Qualification requires workspace management access';
 end if;
 if auth.uid() is null and session_user not in ('postgres','supabase_admin','service_role') and coalesce(auth.role(),'')<>'service_role' then
   raise exception 'Authentication required';
 end if;
 if kind='contact' then
   eligible := NEW.status='active' and exists(select 1 from unnest(NEW.tags) tag where lower(trim(tag)) in ('qualified','sales-qualified'));
   phone_value:=engagex_private.crm_phone(nullif(trim(NEW.mobile),''));
   email_value:=lower(nullif(trim(NEW.email),''));
   business_value:=coalesce(nullif(trim(NEW.company),''),NEW.name); contact_value:=NEW.name;
   city_value:=NEW.city; category_value:='Others'; notes_value:=NEW.notes;
   source_value:='EngageX Contact'; contact_uuid:=NEW.id;
 else
   eligible:=NEW.status='qualified' and coalesce(NEW.outreach_eligibility,'') not in ('do_not_contact','blocked','unsubscribed');
   phone_value:=engagex_private.crm_phone(nullif(trim(NEW.phone),''));
   email_value:=lower(nullif(trim(NEW.email),''));
   business_value:=NEW.business_name; contact_value:=null;
   city_value:=coalesce(NEW.location,NEW.address); category_value:=coalesce(NEW.business_type,NEW.category,'Others');
   website_value:=NEW.website; notes_value:=NEW.notes; source_value:=NEW.source;
   source_url_value:=NEW.source_url; product_value:=NEW.recommended_product;
 end if;
 if not eligible then return NEW; end if;
 perform pg_advisory_xact_lock(hashtextextended('engagex-savrdh-crm-handoff',0));
 select * into existing_link from public.engagex_crm_handoffs
 where workspace_id=NEW.workspace_id and record_kind=kind and record_id=NEW.id;
 is_new_link:=existing_link.id is null or existing_link.status<>'synced';
 if coalesce(length(phone_value),0) not between 10 and 15 then phone_value:=null; end if;
 if email_value is not null and email_value !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then email_value:=null; end if;
 if phone_value is null and email_value is null then
   insert into public.engagex_crm_handoffs(workspace_id,record_kind,record_id,status,error)
   values(NEW.workspace_id,kind,NEW.id,'blocked','A valid phone or email is required')
   on conflict(workspace_id,record_kind,record_id) do update set status='blocked',error=excluded.error,updated_at=now();
   return NEW;
 end if;
 if existing_link.lead_id is not null then
   select * into dest from public.st_crm_leads where id=existing_link.lead_id for update;
 end if;
 if dest.id is null then
   select array_agg(id) into matches from public.st_crm_leads
   where (phone_value is not null and (engagex_private.crm_phone(mobile)=phone_value or engagex_private.crm_phone(whatsapp)=phone_value))
      or (email_value is not null and lower(trim(email))=email_value);
   if coalesce(cardinality(matches),0)>1 then
     insert into public.engagex_crm_handoffs(workspace_id,record_kind,record_id,status,error)
     values(NEW.workspace_id,kind,NEW.id,'blocked','Multiple CRM leads match this phone/email; review required')
     on conflict(workspace_id,record_kind,record_id) do update set status='blocked',error=excluded.error,updated_at=now();
     return NEW;
   end if;
   if cardinality(matches)=1 then
     select * into dest from public.st_crm_leads where id=matches[1] for update;
   end if;
 end if;
 if contact_uuid is null then
   select id into contact_uuid from public.engagex_contacts
   where workspace_id=NEW.workspace_id and
   ((phone_value is not null and engagex_private.crm_phone(mobile)=phone_value) or (email_value is not null and lower(trim(email))=email_value))
   order by created_at limit 1;
 end if;
 if contact_uuid is not null then
   select m.campaign_id,c.name,m.channel into campaign_uuid,campaign_name,channel_value
   from public.engagex_messages m left join public.engagex_campaigns c on c.id=m.campaign_id and c.workspace_id=m.workspace_id
   where m.workspace_id=NEW.workspace_id and m.contact_id=contact_uuid
   order by (m.campaign_id is not null) desc,m.created_at desc limit 1;
 end if;
 origin:=jsonb_build_object('workspaceId',NEW.workspace_id,'recordKind',kind,'recordId',NEW.id,
   'contactId',contact_uuid,'originalSource',source_value,'sourceUrl',source_url_value,
   'campaignId',campaign_uuid,'campaignName',campaign_name,'channel',channel_value,
   'qualifiedAt',coalesce(existing_link.synced_at,now_at),'syncedAt',now_at);
 activity:=jsonb_build_object('id','engagex-'||kind||'-'||NEW.id,'type','EngageX Qualified',
   'note','Qualified in EngageX and handed to Savrdh Technology sales CRM','at',now_at);
 if dest.id is null then
   insert into public.st_crm_leads(client_ref,business_name,contact_name,mobile,whatsapp,email,city,category,website_url,
     lead_source,priority,status,package_name,quoted_price,notes,metadata)
   values('engagex-'||kind||'-'||NEW.id,business_value,contact_value,phone_value,null,email_value,city_value,
     coalesce(category_value,'Others'),website_value,'EngageX','Warm','Interested',product_value,0,notes_value,
     jsonb_build_object('engagex',origin,'activities',jsonb_build_array(activity),'clientCreatedAt',now_at))
   returning * into dest;
 else
   existing_origin:=coalesce(dest.metadata->'engagex','{}'::jsonb);
   origin:=existing_origin || origin;
   update public.st_crm_leads set
     client_ref=coalesce(client_ref,'engagex-existing-'||id),
     contact_name=coalesce(nullif(contact_name,''),contact_value),
     mobile=coalesce(nullif(mobile,''),phone_value),email=coalesce(nullif(email,''),email_value),
     city=coalesce(nullif(city,''),city_value),website_url=coalesce(nullif(website_url,''),website_value),
     metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('engagex',origin,
       'activities',case when is_new_link then coalesce(metadata->'activities','[]'::jsonb)||jsonb_build_array(activity)
                         else coalesce(metadata->'activities','[]'::jsonb) end)
   where id=dest.id returning * into dest;
 end if;
 insert into public.engagex_crm_handoffs(workspace_id,record_kind,record_id,lead_id,lead_ref,status,synced_at)
 values(NEW.workspace_id,kind,NEW.id,dest.id,dest.client_ref,'synced',now_at)
 on conflict(workspace_id,record_kind,record_id) do update
 set lead_id=excluded.lead_id,lead_ref=excluded.lead_ref,status='synced',error=null,synced_at=excluded.synced_at,updated_at=now();
 return NEW;
exception when others then
 insert into public.engagex_crm_handoffs(workspace_id,record_kind,record_id,status,error)
 values(NEW.workspace_id,kind,NEW.id,'failed','CRM handoff failed ('||SQLSTATE||'); retry qualification or contact an administrator')
 on conflict(workspace_id,record_kind,record_id) do update set status='failed',error=excluded.error,updated_at=now();
 return NEW;
end
$$;
revoke all on function engagex_private.crm_handoff() from public,anon,authenticated;
create trigger engagex_contact_crm_handoff after insert or update on public.engagex_contacts
for each row execute function engagex_private.crm_handoff();
create trigger engagex_prospect_crm_handoff after insert or update on public.engagex_prospects
for each row execute function engagex_private.crm_handoff();
comment on table public.engagex_crm_handoffs is 'Server-written qualification handoff receipts; no CRM sales or payment data exposed.';

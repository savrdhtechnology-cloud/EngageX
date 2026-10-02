CREATE OR REPLACE FUNCTION public.engagex_sync_record_to_st_crm()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_workspace_slug text;
  v_external_id uuid;
  v_kind text;
  v_name text;
  v_company text;
  v_mobile text;
  v_email text;
  v_city text;
  v_source text;
  v_status text;
  v_score integer;
  v_created timestamptz;
  v_updated timestamptz;
  v_notes text;
  v_product text;
  v_search_id uuid;
  v_campaign_id uuid;
  v_campaign_name text;
  v_channel text;
  v_context jsonb := '{}'::jsonb;
  v_lead_id uuid;
  v_lead_ref text;
  v_assignee uuid;
  v_norm_mobile text;
  v_norm_email text;
  v_existing_meta jsonb;
  v_existing_source text;
begin
  select slug into v_workspace_slug from public.engagex_workspaces where id = new.workspace_id;
  if v_workspace_slug is distinct from 'savrdh-engagex' then return new; end if;

  if tg_table_name = 'engagex_prospects' then
    v_kind := 'prospect'; v_external_id := new.id; v_name := coalesce(new.business_name,'Unnamed EngageX Lead');
    v_company := new.business_name; v_mobile := new.phone; v_email := new.email; v_city := new.location;
    v_source := coalesce(new.source,'EngageX'); v_status := coalesce(new.status,'New'); v_score := coalesce(new.lead_score,0);
    v_created := new.created_at; v_updated := coalesce(new.updated_at,new.created_at); v_notes := new.notes; v_product := new.recommended_product; v_search_id := new.search_history_id;
    if v_search_id is not null then
      select jsonb_build_object('searchTerm',search_term,'category',category,'area',area,'city',city,'source',source)
      into v_context from public.engagex_lead_search_history where id=v_search_id;
    end if;
  else
    v_kind := 'contact'; v_external_id := new.id; v_name := coalesce(new.name,trim(concat_ws(' ',new.first_name,new.last_name)),new.company,'Unnamed EngageX Lead');
    v_company := new.company; v_mobile := new.mobile; v_email := new.email; v_city := new.city;
    v_source := 'EngageX'; v_status := coalesce(new.status,'New'); v_score := 0; v_created := new.created_at; v_updated := new.created_at; v_notes := new.notes; v_search_id := new.source_search_history_id;
    if v_search_id is not null then
      select jsonb_build_object('searchTerm',search_term,'category',category,'area',area,'city',city,'source',source)
      into v_context from public.engagex_lead_search_history where id=v_search_id;
    end if;
  end if;

  perform pg_advisory_xact_lock(hashtextextended('engagex-savrdh-crm-handoff',0));
  if exists(select 1 from public.engagex_crm_handoffs where workspace_id=new.workspace_id and record_kind=v_kind and record_id=new.id and crm_deleted) then return new; end if;
  select m.campaign_id, c.name, m.channel into v_campaign_id,v_campaign_name,v_channel
  from public.engagex_messages m left join public.engagex_campaigns c on c.id=m.campaign_id
  where m.workspace_id=new.workspace_id and ((tg_table_name='engagex_contacts' and m.contact_id=new.id) or (m.contact_phone is not null and regexp_replace(m.contact_phone,'\\D','','g')=regexp_replace(coalesce(v_mobile,''),'\\D','','g')) or (m.contact_email is not null and lower(m.contact_email)=lower(coalesce(v_email,''))))
  order by m.created_at desc limit 1;

  v_norm_mobile := nullif(regexp_replace(coalesce(v_mobile,''),'\\D','','g'),'');
  if v_norm_mobile is not null and length(v_norm_mobile)>10 then v_norm_mobile := right(v_norm_mobile,10); end if;
  v_norm_email := nullif(lower(trim(coalesce(v_email,''))),'');

  select id,client_ref,metadata,lead_source into v_lead_id,v_lead_ref,v_existing_meta,v_existing_source
  from public.st_crm_leads
  where metadata->'engagex'->>'externalLeadId'=v_external_id::text
     or (v_norm_mobile is not null and right(regexp_replace(coalesce(mobile,''),'\\D','','g'),10)=v_norm_mobile)
     or (v_norm_email is not null and lower(trim(coalesce(email,'')))=v_norm_email)
  order by case when metadata->'engagex'->>'externalLeadId'=v_external_id::text then 0 else 1 end, created_at asc limit 1;

  if v_lead_id is null then
    select id into v_assignee from public.st_crm_team_members where status='Active' and access_role='sales_executive' order by coalesce((select count(*) from public.st_crm_leads l where l.assigned_team_member_id=st_crm_team_members.id and coalesce(l.status,'') not in ('Won','Lost','Completed')),0), created_at asc limit 1;
    v_lead_ref := 'EX-' || upper(substr(replace(v_external_id::text,'-',''),1,12));
    insert into public.st_crm_leads(client_ref,business_name,contact_name,mobile,whatsapp,email,city,lead_source,priority,status,notes,product_name,assigned_team_member_id,metadata)
    values(v_lead_ref,coalesce(nullif(v_company,''),v_name),v_name,v_mobile,v_mobile,v_email,v_city,'EngageX',case when v_score>=70 then 'Hot' when v_score>=40 then 'Warm' else 'Cold' end,'New',v_notes,v_product,v_assignee,
      jsonb_build_object('engagex',jsonb_build_object('externalLeadId',v_external_id,'recordKind',v_kind,'status',v_status,'leadScore',v_score,'source',v_source,'campaignId',v_campaign_id,'campaignName',v_campaign_name,'channel',v_channel,'createdAt',v_created,'updatedAt',v_updated,'context',coalesce(v_context,'{}'::jsonb),'syncedAt',now()),'clientCreatedAt',v_created))
    returning id into v_lead_id;
    if v_lead_id is null then return new; end if;
    insert into engagex_private.crm_owned_leads(lead_id,client_ref) values(v_lead_id,v_lead_ref);
  else
    update public.st_crm_leads set
      business_name=coalesce(nullif(v_company,''),business_name), contact_name=coalesce(nullif(v_name,''),contact_name),
      mobile=coalesce(nullif(v_mobile,''),mobile), whatsapp=coalesce(nullif(v_mobile,''),whatsapp), email=coalesce(nullif(v_email,''),email), city=coalesce(nullif(v_city,''),city),
      notes=coalesce(nullif(v_notes,''),notes), product_name=coalesce(nullif(v_product,''),product_name),
      lead_source=case when coalesce(v_existing_source,'') in ('','Other','EngageX') then 'EngageX' else v_existing_source end,
      metadata=coalesce(v_existing_meta,'{}'::jsonb) || jsonb_build_object('engagex',coalesce(v_existing_meta->'engagex','{}'::jsonb) || jsonb_build_object('externalLeadId',v_external_id,'recordKind',v_kind,'status',v_status,'leadScore',v_score,'source',v_source,'campaignId',v_campaign_id,'campaignName',v_campaign_name,'channel',v_channel,'createdAt',v_created,'updatedAt',v_updated,'context',coalesce(v_context,'{}'::jsonb),'syncedAt',now())), updated_at=now()
    where id=v_lead_id;
  end if;

  insert into public.engagex_crm_handoffs(workspace_id,record_kind,record_id,lead_id,lead_ref,status,error,synced_at,updated_at)
  values(new.workspace_id,v_kind,v_external_id,v_lead_id,v_lead_ref,'synced',null,now(),now())
  on conflict(workspace_id,record_kind,record_id) do update set lead_id=excluded.lead_id,lead_ref=excluded.lead_ref,status='synced',error=null,synced_at=now(),updated_at=now();
  return new;
exception when others then
  begin
    insert into public.engagex_crm_handoffs(workspace_id,record_kind,record_id,status,error,updated_at)
    values(new.workspace_id,coalesce(v_kind,tg_table_name),new.id,'failed',sqlerrm,now())
    on conflict(workspace_id,record_kind,record_id) do update set status='failed',error=sqlerrm,updated_at=now();
  exception when others then null; end;
  return new;
end;
$function$
; 
insert into engagex_private.crm_owned_leads(lead_id,client_ref)
select l.id,l.client_ref from public.st_crm_leads l where l.lead_source='EngageX' and exists(
 select 1 from public.engagex_crm_handoffs h where h.lead_id=l.id
 and l.client_ref='EX-'||upper(substr(replace(h.record_id::text,'-',''),1,12))
 and l.metadata->'engagex'->>'externalLeadId'=h.record_id::text
 and exists(select 1 from public.engagex_workspaces w where w.id=h.workspace_id and w.slug='savrdh-engagex')
) on conflict do nothing;
create policy crm_owned_server_only on engagex_private.crm_owned_leads to service_role using(true) with check(true);
create policy crm_deleted_server_only on engagex_private.crm_deleted_refs to service_role using(true) with check(true);

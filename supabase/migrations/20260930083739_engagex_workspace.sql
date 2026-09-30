-- Additive EngageX schema; existing Savrdh Technology tables are untouched.
create schema if not exists engagex_private;
revoke all on schema engagex_private from public, anon;
grant usage on schema engagex_private to authenticated;

create table public.engagex_workspaces (
 id uuid primary key default gen_random_uuid(), slug text not null unique,
 name text not null, owner_id uuid not null references auth.users(id),
 settings jsonb not null default '{}'::jsonb check (jsonb_typeof(settings) = 'object'),
 created_at timestamptz not null default now()
);
create table public.engagex_members (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.engagex_workspaces(id) on delete cascade,
 user_id uuid references auth.users(id), email text not null, name text not null default '',
 role text not null check (role in ('Owner','Admin','Manager','Employee','Viewer')),
 status text not null default 'invited' check (status in ('active','invited')),
 avatar text not null default 'U', created_at timestamptz not null default now(),
 unique(workspace_id,user_id), check (status <> 'active' or user_id is not null)
);
create unique index engagex_members_email on public.engagex_members(workspace_id, lower(email));
create index engagex_members_user on public.engagex_members(user_id,workspace_id);
create index engagex_workspaces_owner on public.engagex_workspaces(owner_id);

-- Private, read-only membership lookup avoids recursive membership RLS.
-- Caller identity is always auth.uid(), never supplied by the client.
create function engagex_private.workspace_role(wid uuid) returns text
language sql stable security definer set search_path = '' as $$
 select case when w.owner_id = auth.uid() then 'Owner' else
 (select m.role from public.engagex_members m where m.workspace_id=w.id and m.user_id=auth.uid() and m.status='active') end
 from public.engagex_workspaces w where w.id=wid and auth.uid() is not null
$$;
revoke all on function engagex_private.workspace_role(uuid) from public, anon;
grant execute on function engagex_private.workspace_role(uuid) to authenticated;

create table public.engagex_contacts (
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.engagex_workspaces(id),
 name text not null check(length(trim(name))>0), first_name text, last_name text,
 mobile text not null default '', email text not null default '', company text not null default '', job_title text,
 city text not null default '', state text, country text, tags text[] not null default '{}', notes text,
 status text not null default 'active' check(status in ('active','unsubscribed','bounced')),
 whatsapp_consent boolean not null default false, sms_consent boolean not null default false, email_consent boolean not null default false,
 created_at timestamptz not null default now(), unique(workspace_id,id),
 check(length(trim(mobile))>0 or length(trim(email))>0)
);
create unique index engagex_contacts_email on public.engagex_contacts(workspace_id,lower(trim(email))) where length(trim(email))>0;
create unique index engagex_contacts_phone on public.engagex_contacts(workspace_id,regexp_replace(mobile,'[^0-9]','','g')) where length(trim(mobile))>0;
create table public.engagex_campaigns (
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.engagex_workspaces(id),
 name text not null, objective text, channels text[] not null check(channels <@ array['whatsapp','sms','email'] and cardinality(channels)>0),
 status text not null default 'draft' check(status in ('draft','scheduled','running','completed','paused')),
 subject text, body text not null, send_mode text not null default 'draft' check(send_mode in ('draft','now','schedule')),
 scheduled_at timestamptz, target_audience text not null default 'All eligible contacts',
 sent_count integer not null default 0 check(sent_count>=0), delivered_count integer not null default 0 check(delivered_count>=0),
 read_count integer not null default 0 check(read_count>=0), failed_count integer not null default 0 check(failed_count>=0),
 created_at timestamptz not null default now(), unique(workspace_id,id)
);
create table public.engagex_messages (
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.engagex_workspaces(id),
 contact_id uuid not null, contact_name text not null, contact_phone text, contact_email text,
 channel text not null check(channel in ('whatsapp','sms','email')), direction text not null check(direction in ('inbound','outbound')),
 status text not null default 'pending' check(status in ('pending','sent','delivered','read','failed')),
 subject text, body text not null check(length(trim(body))>0), provider_message_id text,
 created_at timestamptz not null default now(),
 foreign key(workspace_id,contact_id) references public.engagex_contacts(workspace_id,id) on delete cascade
);
create index engagex_messages_contact on public.engagex_messages(workspace_id,contact_id,created_at);
create table public.engagex_templates (
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.engagex_workspaces(id),
 name text not null, channel text not null check(channel in ('whatsapp','sms','email')),
 category text not null check(category in ('Marketing','Utility','Authentication','Transactional')),
 status text not null default 'draft' check(status in ('approved','pending','draft')),
 subject text, body text not null, dlt_template_id text, variables text[] not null default '{}',
 created_at timestamptz not null default now(), unique(workspace_id,name,channel)
);
create table public.engagex_automations (
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.engagex_workspaces(id),
 name text not null, trigger_event text not null, trigger_condition text not null default '',
 steps jsonb not null default '[]' check(jsonb_typeof(steps)='array'),
 status text not null default 'paused' check(status in ('active','paused')),
 executions_count integer not null default 0, last_run timestamptz, created_at timestamptz not null default now()
);
create table public.engagex_integrations (
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.engagex_workspaces(id),
 provider text not null, title text not null, channel text not null check(channel in ('whatsapp','sms','email','webhook')),
 status text not null default 'disconnected' check(status in ('configured','connected','disconnected')),
 "desc" text not null default '', config jsonb not null default '{}', last_synced timestamptz,
 created_at timestamptz not null default now(), unique(workspace_id,provider),
 check(jsonb_typeof(config)='object'),
 check(not (config ?| array['api_key','access_token','secret_token','password','secret','token','service_role_key']))
);
create table public.engagex_billing (
 workspace_id uuid primary key references public.engagex_workspaces(id),
 plan_code text not null default 'unconfigured', plan_name text not null default 'Not activated', status text not null default 'pending',
 monthly_price numeric(12,2) not null default 0, message_credits integer not null default 0 check(message_credits>=0),
 contact_limit integer not null default 10000, monthly_message_limit integer not null default 0,
 whatsapp_usage integer not null default 0, sms_usage integer not null default 0, email_usage integer not null default 0
);
create table public.engagex_audit_logs (
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.engagex_workspaces(id),
 user_id uuid, user_email text not null default '', action text not null, resource_type text not null,
 resource_id text, details text not null default '', created_at timestamptz not null default now()
);
create table public.engagex_notifications (
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.engagex_workspaces(id),
 user_id uuid not null references auth.users(id), title text not null, description text not null default '',
 time text not null default '', type text not null default 'system', "targetTab" text not null default 'dashboard', "targetId" text,
 read boolean not null default false, created_at timestamptz not null default now()
);
create index engagex_notifications_user on public.engagex_notifications(user_id,workspace_id);
create table public.engagex_inquiries (
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.engagex_workspaces(id),
 name text not null, email text not null, mobile text not null default '', company text not null default '',
 interest text not null default '', message text not null default '', created_at timestamptz not null default now()
);

alter table public.engagex_workspaces enable row level security;
revoke all on public.engagex_workspaces from public, anon, authenticated;
grant all on public.engagex_workspaces to service_role;
grant select on public.engagex_workspaces to authenticated;
create policy engagex_workspaces_read on public.engagex_workspaces for select to authenticated using (engagex_private.workspace_role(id) is not null);
comment on table public.engagex_workspaces is 'EngageX product data; isolated from existing Savrdh CRM tables';

alter table public.engagex_members enable row level security;
revoke all on public.engagex_members from public, anon, authenticated;
grant all on public.engagex_members to service_role;
grant select on public.engagex_members to authenticated;
create index engagex_members_workspace on public.engagex_members(workspace_id);
create policy engagex_members_read on public.engagex_members for select to authenticated using (engagex_private.workspace_role(workspace_id) is not null);
comment on table public.engagex_members is 'EngageX product data; isolated from existing Savrdh CRM tables';

alter table public.engagex_contacts enable row level security;
revoke all on public.engagex_contacts from public, anon, authenticated;
grant all on public.engagex_contacts to service_role;
grant select on public.engagex_contacts to authenticated;
create index engagex_contacts_workspace on public.engagex_contacts(workspace_id);
create policy engagex_contacts_read on public.engagex_contacts for select to authenticated using (engagex_private.workspace_role(workspace_id) is not null);
comment on table public.engagex_contacts is 'EngageX product data; isolated from existing Savrdh CRM tables';

alter table public.engagex_campaigns enable row level security;
revoke all on public.engagex_campaigns from public, anon, authenticated;
grant all on public.engagex_campaigns to service_role;
grant select on public.engagex_campaigns to authenticated;
create index engagex_campaigns_workspace on public.engagex_campaigns(workspace_id);
create policy engagex_campaigns_read on public.engagex_campaigns for select to authenticated using (engagex_private.workspace_role(workspace_id) is not null);
comment on table public.engagex_campaigns is 'EngageX product data; isolated from existing Savrdh CRM tables';

alter table public.engagex_messages enable row level security;
revoke all on public.engagex_messages from public, anon, authenticated;
grant all on public.engagex_messages to service_role;
grant select on public.engagex_messages to authenticated;
create index engagex_messages_workspace on public.engagex_messages(workspace_id);
create policy engagex_messages_read on public.engagex_messages for select to authenticated using (engagex_private.workspace_role(workspace_id) is not null);
comment on table public.engagex_messages is 'EngageX product data; isolated from existing Savrdh CRM tables';

alter table public.engagex_templates enable row level security;
revoke all on public.engagex_templates from public, anon, authenticated;
grant all on public.engagex_templates to service_role;
grant select on public.engagex_templates to authenticated;
create index engagex_templates_workspace on public.engagex_templates(workspace_id);
create policy engagex_templates_read on public.engagex_templates for select to authenticated using (engagex_private.workspace_role(workspace_id) is not null);
comment on table public.engagex_templates is 'EngageX product data; isolated from existing Savrdh CRM tables';

alter table public.engagex_automations enable row level security;
revoke all on public.engagex_automations from public, anon, authenticated;
grant all on public.engagex_automations to service_role;
grant select on public.engagex_automations to authenticated;
create index engagex_automations_workspace on public.engagex_automations(workspace_id);
create policy engagex_automations_read on public.engagex_automations for select to authenticated using (engagex_private.workspace_role(workspace_id) is not null);
comment on table public.engagex_automations is 'EngageX product data; isolated from existing Savrdh CRM tables';

alter table public.engagex_integrations enable row level security;
revoke all on public.engagex_integrations from public, anon, authenticated;
grant all on public.engagex_integrations to service_role;
grant select on public.engagex_integrations to authenticated;
create index engagex_integrations_workspace on public.engagex_integrations(workspace_id);
create policy engagex_integrations_read on public.engagex_integrations for select to authenticated using (engagex_private.workspace_role(workspace_id) in ('Owner','Admin'));
comment on table public.engagex_integrations is 'EngageX product data; isolated from existing Savrdh CRM tables';

alter table public.engagex_billing enable row level security;
revoke all on public.engagex_billing from public, anon, authenticated;
grant all on public.engagex_billing to service_role;
grant select on public.engagex_billing to authenticated;
create policy engagex_billing_read on public.engagex_billing for select to authenticated using (engagex_private.workspace_role(workspace_id) is not null);
comment on table public.engagex_billing is 'EngageX product data; isolated from existing Savrdh CRM tables';

alter table public.engagex_audit_logs enable row level security;
revoke all on public.engagex_audit_logs from public, anon, authenticated;
grant all on public.engagex_audit_logs to service_role;
grant select on public.engagex_audit_logs to authenticated;
create index engagex_audit_logs_workspace on public.engagex_audit_logs(workspace_id);
create policy engagex_audit_logs_read on public.engagex_audit_logs for select to authenticated using (engagex_private.workspace_role(workspace_id) is not null);
comment on table public.engagex_audit_logs is 'EngageX product data; isolated from existing Savrdh CRM tables';

alter table public.engagex_notifications enable row level security;
revoke all on public.engagex_notifications from public, anon, authenticated;
grant all on public.engagex_notifications to service_role;
grant select on public.engagex_notifications to authenticated;
create index engagex_notifications_workspace on public.engagex_notifications(workspace_id);
create policy engagex_notifications_read on public.engagex_notifications for select to authenticated using (engagex_private.workspace_role(workspace_id) is not null and user_id=(select auth.uid()));
comment on table public.engagex_notifications is 'EngageX product data; isolated from existing Savrdh CRM tables';

alter table public.engagex_inquiries enable row level security;
revoke all on public.engagex_inquiries from public, anon, authenticated;
grant all on public.engagex_inquiries to service_role;
grant select on public.engagex_inquiries to authenticated;
create index engagex_inquiries_workspace on public.engagex_inquiries(workspace_id);
create policy engagex_inquiries_read on public.engagex_inquiries for select to authenticated using (engagex_private.workspace_role(workspace_id) is not null);
comment on table public.engagex_inquiries is 'EngageX product data; isolated from existing Savrdh CRM tables';
grant insert,delete on public.engagex_contacts to authenticated;
grant update on public.engagex_contacts to authenticated;
create policy engagex_contacts_insert on public.engagex_contacts for insert to authenticated with check (engagex_private.workspace_role(workspace_id) in ('Owner','Admin','Manager'));
create policy engagex_contacts_update on public.engagex_contacts for update to authenticated using (engagex_private.workspace_role(workspace_id) in ('Owner','Admin','Manager')) with check (engagex_private.workspace_role(workspace_id) in ('Owner','Admin','Manager'));
create policy engagex_contacts_delete on public.engagex_contacts for delete to authenticated using (engagex_private.workspace_role(workspace_id) in ('Owner','Admin','Manager'));
grant insert,delete on public.engagex_campaigns to authenticated;
grant update (name,objective,channels,status,subject,body,send_mode,scheduled_at,target_audience) on public.engagex_campaigns to authenticated;
create policy engagex_campaigns_insert on public.engagex_campaigns for insert to authenticated with check (engagex_private.workspace_role(workspace_id) in ('Owner','Admin','Manager') and status in ('draft','paused') and sent_count=0 and delivered_count=0 and read_count=0 and failed_count=0);
create policy engagex_campaigns_update on public.engagex_campaigns for update to authenticated using (engagex_private.workspace_role(workspace_id) in ('Owner','Admin','Manager')) with check (engagex_private.workspace_role(workspace_id) in ('Owner','Admin','Manager') and status in ('draft','paused') and sent_count=0 and delivered_count=0 and read_count=0 and failed_count=0);
create policy engagex_campaigns_delete on public.engagex_campaigns for delete to authenticated using (engagex_private.workspace_role(workspace_id) in ('Owner','Admin','Manager'));
grant insert,delete on public.engagex_templates to authenticated;
grant update (name,channel,category,subject,body,dlt_template_id,variables) on public.engagex_templates to authenticated;
create policy engagex_templates_insert on public.engagex_templates for insert to authenticated with check (engagex_private.workspace_role(workspace_id) in ('Owner','Admin','Manager') and status='draft');
create policy engagex_templates_update on public.engagex_templates for update to authenticated using (engagex_private.workspace_role(workspace_id) in ('Owner','Admin','Manager')) with check (engagex_private.workspace_role(workspace_id) in ('Owner','Admin','Manager') and status='draft');
create policy engagex_templates_delete on public.engagex_templates for delete to authenticated using (engagex_private.workspace_role(workspace_id) in ('Owner','Admin','Manager'));
grant insert,delete on public.engagex_automations to authenticated;
grant update (name,trigger_event,trigger_condition,steps,status) on public.engagex_automations to authenticated;
create policy engagex_automations_insert on public.engagex_automations for insert to authenticated with check (engagex_private.workspace_role(workspace_id) in ('Owner','Admin','Manager') and status='paused' and executions_count=0 and last_run is null);
create policy engagex_automations_update on public.engagex_automations for update to authenticated using (engagex_private.workspace_role(workspace_id) in ('Owner','Admin','Manager')) with check (engagex_private.workspace_role(workspace_id) in ('Owner','Admin','Manager') and status='paused' and executions_count=0 and last_run is null);
create policy engagex_automations_delete on public.engagex_automations for delete to authenticated using (engagex_private.workspace_role(workspace_id) in ('Owner','Admin','Manager'));
grant insert,delete on public.engagex_integrations to authenticated;
grant update (title,"desc",config) on public.engagex_integrations to authenticated;
create policy engagex_integrations_insert on public.engagex_integrations for insert to authenticated with check (engagex_private.workspace_role(workspace_id) in ('Owner','Admin') and status in ('configured','disconnected'));
create policy engagex_integrations_update on public.engagex_integrations for update to authenticated using (engagex_private.workspace_role(workspace_id) in ('Owner','Admin')) with check (engagex_private.workspace_role(workspace_id) in ('Owner','Admin') and status in ('configured','disconnected'));
create policy engagex_integrations_delete on public.engagex_integrations for delete to authenticated using (engagex_private.workspace_role(workspace_id) in ('Owner','Admin'));

grant update(name,settings) on public.engagex_workspaces to authenticated;
create policy engagex_workspace_update on public.engagex_workspaces for update to authenticated
 using(engagex_private.workspace_role(id) in ('Owner','Admin')) with check(engagex_private.workspace_role(id) in ('Owner','Admin'));
-- Member invitations are records only; activation requires a trusted backend.
grant insert,delete on public.engagex_members to authenticated;
create policy engagex_members_invite on public.engagex_members for insert to authenticated
 with check(engagex_private.workspace_role(workspace_id) in ('Owner','Admin') and role in ('Manager','Employee','Viewer') and status='invited' and user_id is null);
create policy engagex_members_remove on public.engagex_members for delete to authenticated
 using(engagex_private.workspace_role(workspace_id) in ('Owner','Admin') and role <> 'Owner' and user_id is distinct from (select auth.uid()));
-- Only a dispatcher may insert messages or advance delivery status.
-- Billing and audit writes are also server-only.
grant update(read),delete on public.engagex_notifications to authenticated;
create policy engagex_notifications_update on public.engagex_notifications for update to authenticated
 using(user_id=(select auth.uid()) and engagex_private.workspace_role(workspace_id) is not null)
 with check(user_id=(select auth.uid()) and engagex_private.workspace_role(workspace_id) is not null);
create policy engagex_notifications_delete on public.engagex_notifications for delete to authenticated
 using(user_id=(select auth.uid()) and engagex_private.workspace_role(workspace_id) is not null);

-- Append-only audit events are generated by the database, never accepted from browser text.
create function engagex_private.record_audit() returns trigger
language plpgsql security definer set search_path = '' as $$
declare r jsonb; wid uuid;
begin
 if auth.uid() is null then return coalesce(new,old); end if;
 r := case when TG_OP='DELETE' then to_jsonb(old) else to_jsonb(new) end;
 wid := case when TG_TABLE_NAME='engagex_workspaces' then (r->>'id')::uuid else (r->>'workspace_id')::uuid end;
 insert into public.engagex_audit_logs(workspace_id,user_id,user_email,action,resource_type,resource_id,details)
 values(wid,auth.uid(),coalesce(auth.jwt()->>'email',''),TG_OP,TG_TABLE_NAME,r->>'id','Database-confirmed '||lower(TG_OP));
 return coalesce(new,old);
end $$;
revoke all on function engagex_private.record_audit() from public,anon,authenticated;
create trigger engagex_workspaces_audit after insert or update or delete on public.engagex_workspaces for each row execute function engagex_private.record_audit();
create trigger engagex_members_audit after insert or update or delete on public.engagex_members for each row execute function engagex_private.record_audit();
create trigger engagex_contacts_audit after insert or update or delete on public.engagex_contacts for each row execute function engagex_private.record_audit();
create trigger engagex_campaigns_audit after insert or update or delete on public.engagex_campaigns for each row execute function engagex_private.record_audit();
create trigger engagex_templates_audit after insert or update or delete on public.engagex_templates for each row execute function engagex_private.record_audit();
create trigger engagex_automations_audit after insert or update or delete on public.engagex_automations for each row execute function engagex_private.record_audit();
create trigger engagex_integrations_audit after insert or update or delete on public.engagex_integrations for each row execute function engagex_private.record_audit();

insert into public.engagex_workspaces(slug,name,owner_id,settings)
 select 'savrdh-engagex','Savrdh Technology — EngageX',id,
 '{"workspaceName":"Savrdh Technology — EngageX","supportEmail":"savrdhtechnology@gmail.com","timezone":"Asia/Kolkata","optOutKeyword":"STOP,UNSUBSCRIBE,CANCEL","dltEntityId":"","senderHeader":""}'::jsonb
 from auth.users where lower(email)='savrdhtechnology@gmail.com' and email_confirmed_at is not null;
insert into public.engagex_members(workspace_id,user_id,email,name,role,status,avatar)
 select w.id,w.owner_id,u.email,'Savrdh Technology','Owner','active','S' from public.engagex_workspaces w join auth.users u on u.id=w.owner_id where w.slug='savrdh-engagex';
insert into public.engagex_billing(workspace_id) select id from public.engagex_workspaces where slug='savrdh-engagex';
insert into public.engagex_integrations(workspace_id,provider,title,channel,"desc")
 select w.id,p.provider,p.title,p.channel,p.description from public.engagex_workspaces w cross join
 (values ('meta_whatsapp','Meta WhatsApp Cloud API','whatsapp','Connect an approved WhatsApp Business sender.'),
 ('sms_gateway','SMS Gateway','sms','Configure a DLT-approved SMS provider.'),
 ('resend','Resend Email','email','Connect a verified email sending domain.'),
 ('webhook','Delivery Webhooks','webhook','Verify inbound provider events and delivery receipts.')) p(provider,title,channel,description)
 where w.slug='savrdh-engagex';
notify pgrst, 'reload schema';

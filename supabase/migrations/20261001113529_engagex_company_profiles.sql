-- Company identity is stored once on the workspace and used by every message.
create or replace function engagex_private.company_profile_settings(p_name text,p_email text,p_phone text,p_website text)
returns jsonb language plpgsql immutable security invoker set search_path='' as $$
declare
 v_name text:=btrim(coalesce(p_name,''));v_email text:=lower(btrim(coalesce(p_email,'')));
 v_phone text:=btrim(coalesce(p_phone,''));v_site text:=btrim(coalesce(p_website,''));v_digits text;
begin
 if v_name='' or length(v_name)>200 then raise exception 'Enter a company name of up to 200 characters';end if;
 if v_email<>'' and (length(v_email)>254 or v_email!~'^[^[:space:],;<>@]+@[^[:space:],;<>@]+\.[^[:space:],;<>@]+$') then raise exception 'Enter a valid company email address';end if;
 if v_phone<>'' then
  if v_phone!~'^[+0-9() .-]+$' then raise exception 'Enter a valid company contact number';end if;
  v_digits:=regexp_replace(v_phone,'[^0-9]','','g');
  if length(v_digits)=10 then v_digits:='91'||v_digits;end if;
  if v_digits!~'^[1-9][0-9]{7,14}$' then raise exception 'Enter a valid company contact number with country code';end if;
  v_phone:='+'||v_digits;
 end if;
 if v_site<>'' then
  if v_site~*'^[a-z][a-z0-9+.-]*:' and v_site!~*'^https?://' then raise exception 'Enter a valid http or https company website';end if;
  if v_site!~*'^https?://' then v_site:='https://'||v_site;end if;
  if length(v_site)>2048 or v_site!~*'^https?://[^[:space:]<>/@]+([/?#][^[:space:]<>]*)?$' then raise exception 'Enter a valid http or https company website';end if;
 end if;
 return jsonb_build_object('workspaceName',v_name,'companyName',v_name,'contactEmail',v_email,'supportEmail',v_email,
  'contactPhone',v_phone,'contactNumber',v_phone,'supportNumber',v_phone,'companyWebsite',v_site,'website',v_site,'demoLink',v_site,'applicationLink',v_site);
end $$;
revoke all on function engagex_private.company_profile_settings(text,text,text,text) from public,anon;
grant execute on function engagex_private.company_profile_settings(text,text,text,text) to authenticated;

create or replace function engagex_private.seed_company_templates(p_workspace_id uuid)
returns void language plpgsql security invoker set search_path='' as $$
begin
 insert into public.engagex_templates(workspace_id,name,channel,category,status,subject,body,variables)
 values
 (p_workspace_id,'company_whatsapp_introduction','whatsapp','Marketing','draft',null,
 E'Namaste {{first_name}} ji,\n\n{{company_name}} se aapko hamari services aur updates ki jankari dena chahte hain.\n\nDetails: {{website}}\n\nRegards,\n{{company_name}}\nContact: {{contact_number}}',array['first_name','company_name','website','contact_number']),
 (p_workspace_id,'company_email_introduction','email','Marketing','draft','{{company_name}} — Information & Support',
 E'Dear {{first_name}},\n\nThank you for connecting with {{company_name}}. Please visit our website for information about our services and updates.\n\nWebsite: {{website}}\n\nRegards,\n{{company_name}}\nContact: {{contact_number}}',array['first_name','company_name','website','contact_number']),
 (p_workspace_id,'company_sms_introduction','sms','Marketing','draft',null,
 '{{company_name}}: Details at {{website}}. Contact: {{contact_number}}.',array['company_name','website','contact_number'])
 on conflict(workspace_id,name,channel) do nothing;
end $$;
revoke all on function engagex_private.seed_company_templates(uuid) from public,anon,authenticated;

create or replace function engagex_private.create_client_with_profile(p_name text,p_slug text,p_contact_email text,p_contact_phone text,p_website text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_root uuid;v_id uuid;v_settings jsonb;v_slug text:=lower(btrim(coalesce(p_slug,'')));
begin
 if v_user is null then raise exception 'Authentication required' using errcode='42501';end if;
 select id into v_root from public.engagex_workspaces where slug='savrdh-engagex';
 if v_root is null or coalesce(engagex_private.workspace_role(v_root),'') not in ('Owner','Admin') then
  raise exception 'Only EngageX Owner/Admin can create client workspaces' using errcode='42501';
 end if;
 if v_slug!~'^[a-z0-9]+(-[a-z0-9]+)*$' or length(v_slug)>64 then raise exception 'Enter a valid company workspace slug';end if;
 v_settings:=engagex_private.company_profile_settings(p_name,p_contact_email,p_contact_phone,p_website)||
  jsonb_build_object('workspaceType','Client','primaryChannel','WhatsApp','purpose','Client communication, campaigns and follow-up','timezone','Asia/Kolkata','optOutKeyword','STOP');
 insert into public.engagex_workspaces(slug,name,owner_id,settings) values(v_slug,btrim(p_name),v_user,v_settings) returning id into v_id;
 insert into public.engagex_members(workspace_id,user_id,email,name,role,status,avatar)
 select v_id,u.id,coalesce(u.email,''),'EngageX Admin','Owner','active','A' from auth.users u where u.id=v_user;
 insert into public.engagex_billing(workspace_id,plan_code,plan_name,status,monthly_price,message_credits,contact_limit,monthly_message_limit,whatsapp_usage,sms_usage,email_usage)
 values(v_id,'client_workspace','Client Workspace','active',0,0,10000,0,0,0,0);
 perform engagex_private.seed_company_templates(v_id);
 insert into public.engagex_integrations(workspace_id,provider,title,channel,status,"desc",config)
 values(v_id,'resend','Resend Email','email','disconnected','Company identity is filled automatically. Connect a verified sender before API delivery.',jsonb_build_object('from_name',btrim(p_name),'reply_to',lower(btrim(coalesce(p_contact_email,'')))));
 return v_id;
end $$;
revoke all on function engagex_private.create_client_with_profile(text,text,text,text,text) from public,anon,authenticated;

-- Preserve the existing four-argument API for older deployed clients.
create or replace function public.engagex_create_client_workspace(p_name text,p_slug text,p_contact_email text default '',p_contact_phone text default '')
returns uuid language sql security definer set search_path='' as $$
 select engagex_private.create_client_with_profile(p_name,p_slug,p_contact_email,p_contact_phone,'');
$$;
revoke all on function public.engagex_create_client_workspace(text,text,text,text) from public,anon;
grant execute on function public.engagex_create_client_workspace(text,text,text,text) to authenticated;

create or replace function public.engagex_create_client_workspace_with_profile(p_name text,p_slug text,p_contact_email text,p_contact_phone text,p_website text)
returns uuid language plpgsql security definer set search_path='' as $$
begin
 if nullif(btrim(p_contact_phone),'') is null or nullif(btrim(p_website),'') is null then raise exception 'Company contact number and website are required';end if;
 return engagex_private.create_client_with_profile(p_name,p_slug,p_contact_email,p_contact_phone,p_website);
end $$;
revoke all on function public.engagex_create_client_workspace_with_profile(text,text,text,text,text) from public,anon;
grant execute on function public.engagex_create_client_workspace_with_profile(text,text,text,text,text) to authenticated;

create or replace function public.engagex_update_client_profile(p_workspace_id uuid,p_name text,p_contact_email text,p_contact_phone text,p_website text)
returns uuid language plpgsql security invoker set search_path='' as $$
declare v_profile jsonb;v_old jsonb;v_site text;v_old_site text;
begin
 if auth.uid() is null or coalesce(engagex_private.workspace_role(p_workspace_id),'') not in ('Owner','Admin') then
  raise exception 'Only this client workspace Owner/Admin can update company details' using errcode='42501';
 end if;
 if nullif(btrim(p_contact_phone),'') is null or nullif(btrim(p_website),'') is null then raise exception 'Company contact number and website are required';end if;
 select settings into v_old from public.engagex_workspaces where id=p_workspace_id and settings->>'workspaceType'='Client' for update;
 if not found then raise exception 'Client workspace not found or access denied' using errcode='42501';end if;
 v_profile:=engagex_private.company_profile_settings(p_name,p_contact_email,p_contact_phone,p_website);
 v_site:=v_profile->>'website';v_old_site:=coalesce(nullif(v_old->>'companyWebsite',''),nullif(v_old->>'website',''),v_old->>'applicationLink','');
 if coalesce(v_old->>'demoLink','') not in ('',v_old_site) then v_profile:=v_profile||jsonb_build_object('demoLink',v_old->>'demoLink');end if;
 if coalesce(v_old->>'applicationLink','') not in ('',v_old_site) then v_profile:=v_profile||jsonb_build_object('applicationLink',v_old->>'applicationLink');end if;
 update public.engagex_workspaces set name=btrim(p_name),settings=v_old||v_profile where id=p_workspace_id;
 update public.engagex_integrations set config=config||jsonb_build_object('from_name',btrim(p_name)) where workspace_id=p_workspace_id and provider='resend';
 return p_workspace_id;
end $$;
revoke all on function public.engagex_update_client_profile(uuid,text,text,text,text) from public,anon;
grant execute on function public.engagex_update_client_profile(uuid,text,text,text,text) to authenticated;

-- Fill the known Savrdh identity without replacing existing profile values.
update public.engagex_workspaces set settings=settings||jsonb_build_object(
 'companyName',coalesce(nullif(settings->>'companyName',''),'Savrdh Technology'),
 'contactPhone',coalesce(nullif(settings->>'contactPhone',''),nullif(settings->>'supportNumber',''),'+91 8109995906'),
 'companyWebsite',coalesce(nullif(settings->>'companyWebsite',''),nullif(settings->>'website',''),'https://www.savrdhtechnology.com/'),
 'website',coalesce(nullif(settings->>'companyWebsite',''),nullif(settings->>'website',''),'https://www.savrdhtechnology.com/'),
 'demoLink',coalesce(nullif(settings->>'demoLink',''),'https://engagex-version-2.vercel.app/')) where slug='savrdh-engagex';

-- Existing clients keep their own details and application/group links.
update public.engagex_workspaces set settings=settings||jsonb_build_object(
 'companyName',coalesce(nullif(settings->>'companyName',''),name),
 'contactPhone',coalesce(nullif(settings->>'contactPhone',''),nullif(settings->>'supportNumber',''),settings->>'contactNumber',''),
 'companyWebsite',coalesce(nullif(settings->>'companyWebsite',''),nullif(settings->>'website',''),settings->>'applicationLink',''),
 'website',coalesce(nullif(settings->>'companyWebsite',''),nullif(settings->>'website',''),settings->>'applicationLink',''),
 'demoLink',coalesce(nullif(settings->>'demoLink',''),nullif(settings->>'companyWebsite',''),nullif(settings->>'website',''),settings->>'applicationLink',''))
 where settings->>'workspaceType'='Client';
do $$ declare wid uuid;begin
 for wid in select id from public.engagex_workspaces where settings->>'workspaceType'='Client' loop
  perform engagex_private.seed_company_templates(wid);
 end loop;
end $$;

-- Upgrade the supplied introduction while retaining the existing template IDs.
update public.engagex_templates t set
 body=replace(t.body,'Savrdh Technology','{{company_name}}')||case when t.body not like '%{{website}}%' then E'\nWebsite: {{website}}' else '' end,
 variables=array['first_name','company_name','demo_link','contact_number','website']
 from public.engagex_workspaces w where t.workspace_id=w.id and w.slug='savrdh-engagex'
 and t.name in ('savrdh_whatsapp_engagex_demo','savrdh_email_engagex_demo');

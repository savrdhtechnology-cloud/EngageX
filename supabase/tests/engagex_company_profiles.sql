-- Create/update probes use the existing owner and roll back all rows and audits.
begin;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select owner_id from public.engagex_workspaces where slug='savrdh-engagex'),'role','authenticated','email','owner@example.invalid')::text,true);
set local role authenticated;
do $$
declare wid uuid;legacy_wid uuid;s jsonb;probe_slug text:='branding-probe-'||replace(gen_random_uuid()::text,'-','');
begin
 wid:=public.engagex_create_client_workspace_with_profile('Branding Test Company',probe_slug,'company@example.invalid','+44 20 7946 0001','https://company.example.invalid/');
 select settings into strict s from public.engagex_workspaces where id=wid;
 if s->>'companyName'<>'Branding Test Company' or s->>'contactPhone'<>'+442079460001' or s->>'website'<>'https://company.example.invalid/' or s->>'demoLink'<>'https://company.example.invalid/' or s->>'supportEmail'<>'company@example.invalid' then raise exception 'Client identity was not filled automatically';end if;
 if (select count(*) from public.engagex_templates where workspace_id=wid)<>3 then raise exception 'Client message templates were not created';end if;
 if exists(select 1 from public.engagex_templates where workspace_id=wid and (status<>'draft' or body like '%Savrdh%' or body like '%AKBS%')) then raise exception 'Client template contains another company or false approval';end if;
 if not exists(select 1 from public.engagex_integrations where workspace_id=wid and provider='resend' and status='disconnected' and config->>'from_name'='Branding Test Company') then raise exception 'Sender identity metadata missing';end if;
 update public.engagex_workspaces set settings=settings||jsonb_build_object('applicationLink','https://company.example.invalid/apply','whatsappGroupLink','https://chat.whatsapp.com/test-only-link') where id=wid;
 perform public.engagex_update_client_profile(wid,'Updated Company','support@example.invalid','+44 20 7946 0002','https://updated.example.invalid/');
 select settings into strict s from public.engagex_workspaces where id=wid;
 if s->>'companyName'<>'Updated Company' or s->>'website'<>'https://updated.example.invalid/' or s->>'contactNumber'<>'+442079460002' or s->>'demoLink'<>'https://updated.example.invalid/' then raise exception 'Updated company identity was not applied';end if;
 if s->>'applicationLink'<>'https://company.example.invalid/apply' or s->>'whatsappGroupLink'<>'https://chat.whatsapp.com/test-only-link' then raise exception 'Custom application/group links were changed';end if;
 if not exists(select 1 from public.engagex_integrations where workspace_id=wid and config->>'from_name'='Updated Company' and status='disconnected') then raise exception 'Sender name was not synced or provider falsely connected';end if;
 if not exists(select 1 from public.engagex_audit_logs where workspace_id=wid and action='UPDATE') then raise exception 'Company profile audit missing';end if;
 legacy_wid:=public.engagex_create_client_workspace('Legacy Test Company',probe_slug||'-old','legacy@example.invalid','+44 20 7946 0003');
 if not exists(select 1 from public.engagex_workspaces where id=legacy_wid and settings->>'companyName'='Legacy Test Company') then raise exception 'Legacy create API broke';end if;
 begin
  perform public.engagex_create_client_workspace_with_profile('Invalid website',probe_slug||'-bad','company@example.invalid','+44 20 7946 0004','javascript:alert(1)');
  raise exception 'FAIL: unsafe website accepted';
 exception when others then
  if sqlerrm<>'Enter a valid http or https company website' then raise;end if;
 end;
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
set local role authenticated;
do $$ begin
 begin
  perform public.engagex_create_client_workspace('Outside caller','outsider-branding-probe','outside@example.invalid','+44 20 7946 0004');
  raise exception 'FAIL: outsider can create company workspaces';
 exception when insufficient_privilege then null;end;
 begin
  perform public.engagex_update_client_profile((select id from public.engagex_workspaces limit 1),'Outside Company','outside@example.invalid','+44 20 7946 0004','https://outside.example.invalid');
  raise exception 'FAIL: outsider can change another company profile';
 exception when insufficient_privilege then null;end;
end $$;
reset role;
set local role anon;
do $$ begin
 begin
  perform public.engagex_create_client_workspace_with_profile('Anonymous Company','anonymous-branding-probe','anon@example.invalid','+44 20 7946 0004','https://anon.example.invalid');
  raise exception 'FAIL: anonymous workspace creation';
 exception when insufficient_privilege then null;end;
end $$;
reset role;
select 'PASS: automatic profiles/templates, updates, custom links, provider metadata, legacy API, audits, outsider and anonymous denial' as result;
rollback;

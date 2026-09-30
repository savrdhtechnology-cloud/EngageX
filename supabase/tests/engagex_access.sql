-- Integration verification. Run against the configured project in one transaction.
-- All probes are rolled back, including database-generated audit events.
begin;
select set_config('request.jwt.claims',json_build_object('sub',(select owner_id from public.engagex_workspaces where slug='savrdh-engagex'),'email','savrdhtechnology@gmail.com','role','authenticated')::text,true);
set local role authenticated;
do $$
declare wid uuid; cid uuid;
begin
 select id into strict wid from public.engagex_workspaces where slug='savrdh-engagex';
 insert into public.engagex_contacts(workspace_id,name,email,mobile) values(wid,'Rollback probe','engagex-test@example.invalid','9893345906') returning id into cid;
 if not exists(select 1 from public.engagex_contacts where id=cid and mobile='+919893345906') then raise exception 'Normalization failed'; end if;
 update public.engagex_contacts set status='unsubscribed',whatsapp_consent=true where id=cid;
 if exists(select 1 from public.engagex_contacts where id=cid and whatsapp_consent) then raise exception 'Consent enforcement failed'; end if;
 if not exists(select 1 from public.engagex_audit_logs where resource_id=cid::text and action='INSERT') then raise exception 'Audit missing'; end if;
 begin
  update public.engagex_billing set message_credits=99999 where workspace_id=wid;
  raise exception 'FAIL: browser can mutate credits';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.engagex_campaigns(workspace_id,name,channels,body,status,sent_count) values(wid,'Probe',array['email'],'test','completed',100);
  raise exception 'FAIL: browser can forge delivery counts';
 exception when insufficient_privilege then null; end;
 delete from public.engagex_contacts where id=cid;
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
set local role authenticated;
do $$ begin
 if exists(select 1 from public.engagex_workspaces) or exists(select 1 from public.engagex_members) then raise exception 'Cross-workspace access leak'; end if;
end $$;
reset role;
set local role anon;
do $$ begin
 begin perform * from public.engagex_workspaces; raise exception 'FAIL: anonymous data access';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'PASS: owner CRUD, normalization, consent, audit, billing/status protection, outsider and anonymous isolation' as result;
rollback;

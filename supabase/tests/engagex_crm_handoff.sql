
begin;
do $$
declare w uuid; other_w uuid; owner uuid; c uuid:=gen_random_uuid(); p uuid:=gen_random_uuid();
 lead uuid; leadref text; outsider uuid:=gen_random_uuid(); k integer; bad uuid:=gen_random_uuid();
begin
 select id,owner_id into w,owner from public.engagex_workspaces where slug='savrdh-engagex';
 select id into other_w from public.engagex_workspaces where slug='akbs-poultry-farming';
 insert into public.engagex_contacts(id,workspace_id,name,email,status,tags)
 values(c,w,'Sync rollback probe','sync-probe-'||c||'@example.invalid','active','{}');
 if exists(select 1 from public.engagex_crm_handoffs where record_id=c) then raise exception 'Unqualified contact synced'; end if;
 update public.engagex_contacts set tags=array['qualified'] where id=c;
 select lead_id,lead_ref into lead,leadref from public.engagex_crm_handoffs where record_id=c and status='synced';
 if lead is null then raise exception 'Qualified contact did not sync: %',(select error from public.engagex_crm_handoffs where record_id=c); end if;
 if not exists(select 1 from public.st_crm_leads where id=lead and status='Interested' and lead_source='EngageX' and quoted_price=0 and paid_amount=0 and payment_status='UNPAID' and auto_email=false) then raise exception 'Incorrect sales/payment defaults'; end if;
 update public.engagex_contacts set notes='Edited after handoff' where id=c;
 if (select count(*) from public.st_crm_leads where email='sync-probe-'||c||'@example.invalid')<>1 then raise exception 'Repeat sync duplicated'; end if;
 insert into public.engagex_prospects(id,workspace_id,source,business_name,email,status)
 values(p,w,'manual','Probe same identity','sync-probe-'||c||'@example.invalid','qualified');
 if not exists(select 1 from public.engagex_crm_handoffs where record_id=p and lead_id=lead and status='synced') then raise exception 'Contact/prospect dedup failed'; end if;
 update public.st_crm_leads set status='Negotiation',quoted_price=1234 where id=lead;
 update public.engagex_contacts set city='Probe City' where id=c;
 if not exists(select 1 from public.st_crm_leads where id=lead and status='Negotiation' and quoted_price=1234) then raise exception 'Sync overwrote sales'; end if;
 insert into public.engagex_prospects(id,workspace_id,source,business_name,status)
 values(bad,w,'manual','Probe missing identity','qualified');
 if not exists(select 1 from public.engagex_crm_handoffs where record_id=bad and status='blocked') then raise exception 'Missing identity not blocked'; end if;
 if other_w is not null then
  insert into public.engagex_contacts(workspace_id,name,email,tags)
  values(other_w,'Other workspace rollback','other-'||c||'@example.invalid',array['qualified']);
  if exists(select 1 from public.st_crm_leads where email='other-'||c||'@example.invalid') then raise exception 'Cross-workspace leak'; end if;
 end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',owner,'role','authenticated')::text,true);
 set local role authenticated;
 select count(*) into k from public.engagex_crm_handoffs where record_id=c;
 if k<>1 then raise exception 'Owner receipt access failed'; end if;
 begin
   update public.engagex_crm_handoffs set status='failed' where record_id=c;
   raise exception 'Authenticated receipt write allowed';
 exception when insufficient_privilege then null; end;
 reset role;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',outsider,'role','authenticated')::text,true);
 set local role authenticated;
 select count(*) into k from public.engagex_crm_handoffs;
 if k<>0 then raise exception 'Outsider receipt leakage'; end if;
 begin
  perform engagex_private.crm_handoff();
  raise exception 'Trigger function externally callable';
 exception when insufficient_privilege then null; end;
 reset role;
 perform set_config('request.jwt.claims','{}',true);
end $$;
rollback;
select 'PASS: qualification, duplicate prevention, sales/payment preservation, missing identity, tenant isolation and receipt permissions; all probes rolled back' as verification;


begin;
do $$
declare w uuid; other_w uuid; c uuid; p uuid; l uuid; r text; phone text; label text; x text;
begin
 select id into strict w from public.engagex_workspaces where slug='savrdh-engagex';
 select id into strict other_w from public.engagex_workspaces where slug='akbs-poultry-farming';
 -- Contacts created by EngageX cascade.
 phone:='919'||lpad(floor(random()*1e12)::bigint::text,12,'0');
 insert into public.engagex_contacts(workspace_id,name,mobile,tags) values(w,'ROLLBACK cascade contact',phone,array['qualified']) returning id into c;
 select lead_id,lead_ref into l,r from public.engagex_crm_handoffs where record_id=c and record_kind='contact';
 if l is null or not exists(select 1 from engagex_private.crm_owned_leads where lead_id=l) then raise exception 'No owned contact handoff'; end if;
 delete from public.engagex_contacts where id=c;
 if exists(select 1 from public.st_crm_leads where id=l) or exists(select 1 from public.engagex_crm_handoffs where record_id=c) then raise exception 'Contact cascade failed'; end if;
 insert into public.st_crm_leads(client_ref,business_name) values(r,'ROLLBACK stale contact snapshot');
 if exists(select 1 from public.st_crm_leads where client_ref=r) then raise exception 'Stale snapshot resurrected deleted lead'; end if;
 -- CRM-only delete preserves contact and suppresses auto recreation.
 phone:='919'||lpad(floor(random()*1e12)::bigint::text,12,'0');
 insert into public.engagex_contacts(workspace_id,name,mobile,tags) values(w,'ROLLBACK CRM-only contact',phone,array['qualified']) returning id into c;
 select lead_id,lead_ref into l,r from public.engagex_crm_handoffs where record_id=c and record_kind='contact';
 if l is null then raise exception 'No CRM-only handoff'; end if;
 delete from public.st_crm_leads where id=l;
 if not exists(select 1 from public.engagex_contacts where id=c) then raise exception 'CRM delete removed contact'; end if;
 update public.engagex_contacts set notes='retry sync' where id=c;
 if exists(select 1 from public.st_crm_leads where client_ref=r) then raise exception 'Requalification resurrected lead'; end if;
 if not exists(select 1 from public.engagex_crm_handoffs where record_id=c and crm_deleted) then raise exception 'Deletion receipt missing'; end if;
 -- Every pre-existing non-EngageX source remains, even if linked to both kinds.
 foreach label in array array['Manual','Website','Partner','Direct'] loop
 phone:='919'||lpad(floor(random()*1e12)::bigint::text,12,'0'); r:='test-'||gen_random_uuid();
 insert into public.st_crm_leads(client_ref,business_name,mobile,lead_source,status,quoted_price) values(r,'ROLLBACK existing '||label,phone,label,'Negotiation',4321) returning id into l;
 insert into public.engagex_contacts(workspace_id,name,mobile,tags) values(w,'ROLLBACK linked contact',phone,array['qualified']) returning id into c;
 insert into public.engagex_prospects(workspace_id,source,business_name,phone,status) values(w,'manual','ROLLBACK linked prospect',phone,'qualified') returning id into p;
 if not exists(select 1 from public.engagex_crm_handoffs where record_id=c and lead_id=l) or not exists(select 1 from public.engagex_crm_handoffs where record_id=p and lead_id=l) then raise exception 'Duplicate linking failed'; end if;
 if exists(select 1 from engagex_private.crm_owned_leads where lead_id=l) then raise exception 'Existing lead treated as owned'; end if;
 delete from public.engagex_contacts where id=c;
 delete from public.engagex_prospects where id=p;
 if not exists(select 1 from public.st_crm_leads where id=l and status='Negotiation' and quoted_price=4321 and lead_source=label) then raise exception 'Existing % CRM lead deleted or changed',label; end if;
 end loop;
 -- Prospect created by EngageX cascades.
 phone:='919'||lpad(floor(random()*1e12)::bigint::text,12,'0');
 insert into public.engagex_prospects(workspace_id,source,business_name,phone,status) values(w,'manual','ROLLBACK owned prospect',phone,'qualified') returning id into p;
 select lead_id into l from public.engagex_crm_handoffs where record_id=p and record_kind='prospect';
 if l is null then raise exception 'No prospect handoff'; end if;
 delete from public.engagex_prospects where id=p;
 if exists(select 1 from public.st_crm_leads where id=l) then raise exception 'Prospect cascade failed'; end if;
 -- Other workspace deletion cannot delete matching Savrdh lead.
 phone:='919'||lpad(floor(random()*1e12)::bigint::text,12,'0');
 insert into public.st_crm_leads(client_ref,business_name,mobile) values('test-'||gen_random_uuid(),'ROLLBACK isolated',phone) returning id into l;
 insert into public.engagex_contacts(workspace_id,name,mobile,tags) values(other_w,'ROLLBACK isolated contact',phone,array['qualified']) returning id into c;
 delete from public.engagex_contacts where id=c;
 if not exists(select 1 from public.st_crm_leads where id=l) then raise exception 'Workspace isolation failed'; end if;
 if has_table_privilege('authenticated','engagex_private.crm_owned_leads','INSERT') or has_function_privilege('authenticated','engagex_private.crm_origin_delete()','EXECUTE') then raise exception 'Private authorization failed'; end if;
end $$;
select 'PASS: contact/prospect cascade, CRM-only delete, no resurrection, Manual/Website/Partner/Direct preservation, workspace isolation, private privileges' as tests;
rollback;
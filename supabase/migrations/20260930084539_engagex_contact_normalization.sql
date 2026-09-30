-- Normalize contact identity inside the database as well as in the UI.
create function engagex_private.normalize_contact() returns trigger
language plpgsql security invoker set search_path='' as $$
declare digits text;
begin
 new.name := trim(new.name);
 new.email := lower(trim(new.email));
 digits := regexp_replace(new.mobile,'[^0-9]','','g');
 if length(digits)=10 then digits := '91'||digits; end if;
 new.mobile := case when digits='' then '' else '+'||digits end;
 if new.status='unsubscribed' then
   new.whatsapp_consent:=false; new.sms_consent:=false; new.email_consent:=false;
 end if;
 return new;
end $$;
revoke all on function engagex_private.normalize_contact() from public,anon,authenticated;
create trigger engagex_contacts_normalize before insert or update on public.engagex_contacts
 for each row execute function engagex_private.normalize_contact();
notify pgrst,'reload schema';

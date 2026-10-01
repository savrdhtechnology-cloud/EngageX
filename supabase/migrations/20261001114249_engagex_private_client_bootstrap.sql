-- Keep privileged bootstrap inside the unexposed schema. Its auth.uid() and
-- root Owner/Admin checks remain the authority for every call.
alter function public.engagex_create_client_workspace(text,text,text,text) security invoker;
alter function public.engagex_create_client_workspace_with_profile(text,text,text,text,text) security invoker;
grant execute on function engagex_private.create_client_with_profile(text,text,text,text,text) to authenticated;

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { createContactEmailHandler } from '../_shared/contactEmailHandler.ts';

Deno.serve(createContactEmailHandler({
  userClient:authorization=>createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:authorization}},auth:{persistSession:false}}),
  adminClient:()=>createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}}),
  apiKey:()=>Deno.env.get('RESEND_API_KEY'),
  fetch:(...args)=>fetch(...args),
}));

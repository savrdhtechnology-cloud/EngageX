type Dependencies = {
  userClient: (authorization: string) => any;
  adminClient: () => any;
  apiKey: () => string | undefined;
  fetch: typeof fetch;
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const email = /^[^\s,;<>@]+@[^\s,;<>@]+\.[^\s,;<>@]+$/;
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Content-Type': 'application/json' };

export function createContactEmailHandler(deps: Dependencies) {
  return async (req: Request) => {
    const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {status,headers:cors});
    if (req.method === 'OPTIONS') return new Response('ok',{headers:cors});
    if (req.method !== 'POST') return json({error:'Method not allowed'},405);
    try {
      const authorization = req.headers.get('Authorization') || '';
      if (!authorization.startsWith('Bearer ')) return json({error:'Please sign in to EngageX.'},401);
      const userClient = deps.userClient(authorization);
      const {data:auth,error:authError} = await userClient.auth.getUser();
      if (authError || !auth?.user) return json({error:'Your EngageX session has expired.'},401);
      const input = await req.text();
      if (input.length > 32768) return json({error:'Message is too long.'},413);
      const body = JSON.parse(input);
      if (!body || typeof body !== 'object' || Array.isArray(body)) return json({error:'Invalid request JSON.'},400);
      const workspaceId = String(body.workspace_id || '');
      const subject = String(body.subject || '').trim(), text = String(body.text || '').trim();
      const requestId = body.request_id ? String(body.request_id) : crypto.randomUUID();
      if (!uuid.test(workspaceId) || !uuid.test(requestId) || !subject || subject.length>500 || /[\r\n]/.test(subject) || !text)
        return json({error:'Select a workspace, contact and enter an email subject and message.'},400);
      const {data:member,error:memberError} = await userClient.from('engagex_members').select('role,status').eq('workspace_id',workspaceId).eq('user_id',auth.user.id).maybeSingle();
      if (memberError || member?.status !== 'active' || !['Owner','Admin','Manager'].includes(member?.role))
        return json({error:'Owner, Admin or Manager workspace access is required.'},403);
      let query = userClient.from('engagex_contacts').select('*').eq('workspace_id',workspaceId);
      if (body.contact_id && uuid.test(String(body.contact_id))) query = query.eq('id',String(body.contact_id));
      else {
        const addresses = Array.isArray(body.to) ? body.to : [body.to];
        if (addresses.length !== 1 || !email.test(String(addresses[0] || '')))
          return json({error:'Choose one saved contact for each email request.'},400);
        query = query.eq('email',String(addresses[0]).trim().toLowerCase());
      }
      const {data:contact,error:contactError} = await query.maybeSingle();
      if (contactError || !contact) return json({error:'Contact not found in this workspace.'},404);
      if (contact.status !== 'active' || !contact.email_consent || !email.test(contact.email))
        return json({error:'This contact needs an active email address and recorded email consent.'},409);
      const admin = deps.adminClient();
      const {data:previous,error:previousError} = await admin.from('engagex_messages').select('*').eq('id',requestId).maybeSingle();
      if (previousError) return json({error:'Unable to check email delivery history.'},503);
      if (previous) {
        if (previous.workspace_id !== workspaceId || previous.contact_id !== contact.id || previous.channel !== 'email' || previous.direction !== 'outbound' || previous.body !== text || previous.subject !== subject || previous.contact_email !== contact.email)
          return json({error:'This email request ID already belongs to another message.'},409);
        if (previous.provider_message_id) return json({ok:true,id:previous.provider_message_id,reused:true});
      }
      const {data:integration,error:integrationError} = await admin.from('engagex_integrations').select('config,status').eq('workspace_id',workspaceId).eq('provider','resend').maybeSingle();
      if (integrationError || !integration || !['configured','connected'].includes(integration.status))
        return json({error:'Configure this workspace email provider in Integrations. You can also use Open Email to send from your mail app.'},409);
      const config = integration.config || {};
      let fromEmail = String(config.from_email || ''), fromName = String(config.from_name || '');
      // Preserve the sender of the existing, explicitly configured AKBS workspace.
      if (!fromEmail) {
        const {data:workspace} = await admin.from('engagex_workspaces').select('slug').eq('id',workspaceId).maybeSingle();
        if (workspace?.slug === 'akbs-poultry-farming' && config.domain === 'akbspoultry.com' && config.domain_status === 'verified') {
          fromEmail = 'updates@akbspoultry.com'; fromName = 'AKBS Poultry Farming Private Limited';
        }
      }
      if (!email.test(fromEmail) || !fromName || /[<>\r\n]/.test(fromName))
        return json({error:'Configure a verified From email address and sender name for this workspace.'},409);
      if (config.reply_to && !email.test(String(config.reply_to))) return json({error:'Workspace Reply-to email is invalid.'},409);
      const key = deps.apiKey();
      if (!key) return json({error:'The workspace email provider secret is missing. Use Open Email or complete provider setup.'},503);
      const controller = new AbortController(); const timeout = setTimeout(()=>controller.abort(),10000);
      let response: Response;
      try {
        response = await deps.fetch('https://api.resend.com/emails',{method:'POST',signal:controller.signal,
          headers:{Authorization:'Bearer '+key,'Content-Type':'application/json','Idempotency-Key':`engagex-contact-${workspaceId}-${requestId}`},
          body:JSON.stringify({from:`${fromName} <${fromEmail}>`,to:[contact.email],subject,text,...(config.reply_to?{reply_to:config.reply_to}:{})})});
      } finally { clearTimeout(timeout); }
      const result = await response.json();
      if (!response.ok || typeof result.id !== 'string' || !result.id)
        return json({error:result.message || 'Email was not accepted by the provider.'},response.status>=400?response.status:502);
      const {error:logError} = await admin.from('engagex_messages').insert({id:requestId,workspace_id:workspaceId,contact_id:contact.id,
        contact_name:contact.name,contact_email:contact.email,contact_phone:contact.mobile,channel:'email',direction:'outbound',status:'sent',subject,body:text,provider_message_id:result.id});
      if (logError && logError.code !== '23505') console.warn(JSON.stringify({event:'ENGAGEX_EMAIL_LOG_FAILED',requestId,emailId:result.id}));
      if (!logError) {
        const {error:auditError} = await admin.from('engagex_audit_logs').insert({workspace_id:workspaceId,user_id:auth.user.id,user_email:auth.user.email||'',
          action:'EMAIL_ACCEPTED',resource_type:'engagex_messages',resource_id:requestId,details:'Email accepted for the selected contact. Provider ID: '+result.id});
        if (auditError) console.warn(JSON.stringify({event:'ENGAGEX_EMAIL_AUDIT_FAILED',requestId,emailId:result.id}));
      }
      return json({ok:true,id:result.id,contact_id:contact.id});
    } catch (error) {
      if (error instanceof SyntaxError) return json({error:'Invalid request JSON.'},400);
      console.warn(JSON.stringify({event:'ENGAGEX_CONTACT_EMAIL_FAILED',kind:error instanceof Error?error.name:'Error'}));
      return json({error:'Unable to send the email. Retry the same message or use Open Email.'},502);
    }
  };
}

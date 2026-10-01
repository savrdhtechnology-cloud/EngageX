import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createContactEmailHandler } from '../supabase/functions/_shared/contactEmailHandler';

const workspace='10000000-0000-4000-8000-000000000001',otherWorkspace='10000000-0000-4000-8000-000000000002';
const contactId='20000000-0000-4000-8000-000000000001',otherId='20000000-0000-4000-8000-000000000002';
const requestId='30000000-0000-4000-8000-000000000001';
function fixture(options:{role?:string;consent?:boolean;providerStatus?:number;providerId?:string|null;integration?:string;secret?:boolean}={}) {
  const rows:Record<string,any[]>={
    engagex_members:[{workspace_id:workspace,user_id:'user',role:options.role||'Owner',status:'active'}],
    engagex_contacts:[{id:contactId,workspace_id:workspace,name:'Selected Contact',email:'selected@example.invalid',mobile:'+919876543210',status:'active',email_consent:options.consent??true},
      {id:otherId,workspace_id:otherWorkspace,name:'Other Contact',email:'other@example.invalid',status:'active',email_consent:true}],
    engagex_integrations:[{workspace_id:workspace,provider:'resend',status:options.integration||'configured',config:{from_email:'sender@example.invalid',from_name:'Example Sender'}}],
    engagex_messages:[],engagex_audit_logs:[],engagex_workspaces:[{id:workspace,slug:'test-workspace'}]
  };
  const client={auth:{getUser:async()=>({data:{user:{id:'user'}},error:null})},from:(table:string)=>{
    const filters:[string,unknown][]=[];
    const query:any={select:()=>query,eq:(key:string,value:unknown)=>{filters.push([key,value]);return query;},
      maybeSingle:async()=>({data:rows[table].find(row=>filters.every(([key,value])=>row[key]===value))||null,error:null}),
      insert:async(record:any)=>{rows[table].push(record);return {error:null};}};
    return query;
  }};
  const calls:any[]=[];
  const handler=createContactEmailHandler({userClient:()=>client,adminClient:()=>client,apiKey:()=>options.secret===false?undefined:'test-key',fetch:async(_url,init)=>{
    calls.push({payload:JSON.parse(String(init?.body)),headers:init?.headers});
    return new Response(JSON.stringify(options.providerStatus&&options.providerStatus>=400?{message:'Provider rejected'}:{id:options.providerId===null?undefined:options.providerId||'provider-email-id'}),{status:options.providerStatus||200});
  }});
  const send=(overrides:Record<string,unknown>={})=>handler(new Request('https://example.invalid/send',{method:'POST',headers:{Authorization:'Bearer test-session'},body:JSON.stringify({workspace_id:workspace,contact_id:contactId,request_id:requestId,subject:'Hello',text:'Message',...overrides})}));
  return {send,calls,rows};
}
test('email API resolves one registered recipient and logs only actual provider acceptance',async()=>{
  const {send,calls,rows}=fixture();const response=await send({to:['injected@example.invalid','another@example.invalid']});
  assert.equal(response.status,200);assert.deepEqual(calls[0].payload.to,['selected@example.invalid']);
  assert.equal(rows.engagex_messages.length,1);assert.equal(rows.engagex_messages[0].contact_id,contactId);
  assert.equal(rows.engagex_audit_logs.length,1);
  assert.equal(rows.engagex_messages[0].status,'sent');assert.ok(calls[0].headers['Idempotency-Key'].includes(requestId));
});
test('retries reuse recorded acceptance and never email all contacts',async()=>{
  const {send,calls}=fixture();await send();const response=await send();
  assert.equal(response.status,200);assert.equal((await response.json()).reused,true);assert.equal(calls.length,1);
});
test('API rejects another workspace contact and does not call the provider',async()=>{
  const {send,calls}=fixture();assert.equal((await send({contact_id:otherId})).status,404);assert.equal(calls.length,0);
});
test('Viewer role and missing email consent cannot dispatch',async()=>{
  const viewer=fixture({role:'Viewer'});assert.equal((await viewer.send()).status,403);assert.equal(viewer.calls.length,0);
  const noConsent=fixture({consent:false});assert.equal((await noConsent.send()).status,409);assert.equal(noConsent.calls.length,0);
});
test('disconnected provider or absent secret reports setup requirement without delivery',async()=>{
  const disconnected=fixture({integration:'disconnected'});assert.equal((await disconnected.send()).status,409);assert.equal(disconnected.calls.length,0);
  const missing=fixture({secret:false});assert.equal((await missing.send()).status,503);assert.equal(missing.calls.length,0);
});
test('provider error or missing acceptance ID cannot create a sent message',async()=>{
  const rejected=fixture({providerStatus:422});assert.equal((await rejected.send()).status,422);assert.equal(rejected.rows.engagex_messages.length,0);
  const missingId=fixture({providerId:null});assert.equal((await missingId.send()).status,502);assert.equal(missingId.rows.engagex_messages.length,0);
});
test('an existing request ID cannot be reused for another payload',async()=>{
  const {send,calls}=fixture();await send();assert.equal((await send({text:'Changed message'})).status,409);assert.equal(calls.length,1);
});
test('legacy bulk recipient arrays are rejected unless a specific saved contact is selected',async()=>{
  const {send,calls}=fixture();assert.equal((await send({contact_id:undefined,to:['one@example.invalid','two@example.invalid']})).status,400);assert.equal(calls.length,0);
});

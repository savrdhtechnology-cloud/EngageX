import { test } from 'node:test';
import assert from 'node:assert/strict';
import { channelReady, composeUrl, contactDirectory, planProspectImport, selectedContactAudience } from '../src/lib/contactDirectory';
import { campaignAudience, campaignAudienceLabel } from '../src/lib/metrics';
import type { Contact, Campaign } from '../src/types';

const contact = (id='contact-1', overrides:Partial<Contact>={}):Contact=>({id,name:'Test Contact',first_name:'Test',mobile:'+919876543210',email:'contact@example.invalid',company:'Test Company',city:'Pune',tags:[],status:'active',whatsapp_consent:true,sms_consent:true,email_consent:true,created_at:'2026-10-01T00:00:00Z',...overrides});
test('batch import normalizes Indian phones and skips existing and within-batch duplicates',()=>{
  const result=planProspectImport([{business_name:'Existing',phone:'9876543210'},
    {business_name:'New',phone:'8765432109',email:'NEW@example.invalid'},
    {business_name:'Duplicate',phone:'+91 8765432109'},
    {business_name:'Email duplicate',email:'new@EXAMPLE.invalid'},
    {business_name:'No contact details'}],[contact()]);
  assert.equal(result.items.length,1);assert.equal(result.duplicates,3);assert.equal(result.missing,1);
  assert.equal(result.items[0].email,'new@example.invalid');assert.equal(result.items[0].email_consent,false);
});
test('directory keeps old contacts and joins extracted metadata without invented scores',()=>{
  const rows=contactDirectory([contact(),contact('old',{mobile:'',email:'old@example.invalid',notes:'Lead Score: 73%\nWebsite: https://example.invalid'})],
    [{business_name:'Matched Company',phone:'9876543210',lead_score:92,category:'Healthcare',address:'Saved address'}]);
  assert.equal(rows.length,2);assert.equal(rows[0].score,92);assert.equal(rows[0].industry,'Healthcare');
  assert.equal(rows[1].score,73);assert.equal(rows[1].website,'https://example.invalid');
  assert.equal(contactDirectory([contact()],[])[0].score,null);
});
test('each compose URL contains only that contact and safely encodes its personalized message',()=>{
  const c=contact();
  const wa=composeUrl(c,'whatsapp','Hello {{first_name}} & {{company}}');
  assert.equal(new URL(wa).pathname,'/919876543210');assert.equal(new URL(wa).searchParams.get('text'),'Hello Test & Test Company');
  const mail=composeUrl(c,'email','Hi {{first_name}}','Subject & details');
  assert.ok(mail.startsWith('mailto:contact%40example.invalid?'));
  assert.equal(new URL(mail).searchParams.get('subject'),'Subject & details');
  assert.ok(composeUrl(c,'sms','Hello').startsWith('sms:+919876543210?body=Hello'));
});
test('unsubscribed, missing consent and invalid addresses are excluded from outreach',()=>{
  assert.equal(channelReady(contact('1',{email_consent:false}),'email'),false);
  assert.equal(channelReady(contact('2',{email:'a@example.invalid,b@example.invalid'}),'email'),false);
  assert.equal(channelReady(contact('3',{mobile:'+91'}),'whatsapp'),false);
  assert.equal(channelReady(contact('4',{status:'unsubscribed'}),'sms'),false);
  assert.throws(()=>composeUrl(contact('1',{email_consent:false}),'email','Hello'));
});
test('selected campaign audience persists exactly the selected contact IDs and fails closed',()=>{
  const campaign={channels:['email'],target_audience:selectedContactAudience(['contact-1','contact-1'])} as Campaign;
  assert.deepEqual(campaignAudience(campaign,[contact(),contact('other')]).map(c=>c.id),['contact-1']);
  assert.equal(campaignAudienceLabel(campaign.target_audience),'1 selected contacts');
  assert.deepEqual(campaignAudience({...campaign,target_audience:'Contacts: broken'},[contact()]),[]);
});

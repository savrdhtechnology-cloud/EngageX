import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Contact } from '../src/types';
import { composeUrl, gmailComposeUrl, personalize } from '../src/lib/contactDirectory';
import { normalizeCompanyWebsite, personalizeMessage, renderCompanyMessage, resolveWorkspaceBranding, templateVariables } from '../src/lib/workspaceBranding';

const recipient:Contact={id:'contact',name:'Shailendra Test',first_name:'Shailendra',mobile:'+442079460001',email:'customer@example.invalid',company:'Recipient Company',city:'Pune',status:'active',tags:[],whatsapp_consent:false,email_consent:false,sms_consent:false,created_at:'2026-10-01T00:00:00Z'};
const savrdh=resolveWorkspaceBranding({name:'Savrdh Technology — EngageX',slug:'savrdh-engagex'},
 {companyName:'Savrdh Technology',companyWebsite:'https://www.savrdhtechnology.com/',contactPhone:'+91 8109995906',supportEmail:'support@example.invalid',demoLink:'https://engagex-version-2.vercel.app/'});
const akbs=resolveWorkspaceBranding({name:'AKBS Poultry Farming Private Limited',slug:'akbs-poultry-farming'},
 {companyName:'AKBS Poultry Farming Private Limited',supportNumber:'+91 9893345906',applicationLink:'https://akbspoultry.com/'});

test('workspace details fill sender variables while recipient company remains separate',()=>{
 const text=personalize('Namaste {{ first_name }} ji, {{company}} ke liye {{company_name}}. {{website}} {{contact_number}} {{demo_link}}',recipient,savrdh);
 assert.ok(text.includes('Shailendra ji'));assert.ok(text.includes('Recipient Company ke liye Savrdh Technology'));
 assert.ok(text.includes(savrdh.website));assert.ok(text.includes(savrdh.contactNumber));assert.ok(text.includes(savrdh.demoLink));assert.deepEqual(templateVariables(text),[]);
});
test('AKBS and a new client use only their own website, support number and company',()=>{
 for(const brand of [akbs,resolveWorkspaceBranding({name:'New Client'}, {contactPhone:'+442079460003',contactEmail:'client@example.invalid',companyWebsite:'client.example.invalid'})]) {
  const text=renderCompanyMessage('Hello {{first_name}}, details: {{demo_link}}',recipient,brand);
  assert.ok(text.includes(brand.companyName));assert.ok(text.includes(brand.website));assert.ok(text.includes(brand.contactNumber));
  assert.ok(!text.includes('Savrdh'));assert.ok(!text.includes('8109995906'));assert.ok(!text.includes('engagex-version-2'));
 }
});
test('legacy AKBS support/application aliases resolve without a separate configuration',()=>{
 assert.equal(akbs.website,'https://akbspoultry.com/');assert.equal(akbs.demoLink,akbs.website);
 assert.equal(personalizeMessage('{{support_number}} {{application_link}}',recipient,akbs),'+91 9893345906 https://akbspoultry.com/');
 assert.equal(resolveWorkspaceBranding({name:'Client'},{}).contactNumber,'');
 assert.equal(resolveWorkspaceBranding({name:'Client'},{}).website,'');
});
test('company signature adds missing details once and remains stable across preview and CRM rendering',()=>{
 const text=renderCompanyMessage('Hello {{first_name}}',recipient,savrdh);
 assert.ok(text.includes('Website: '+savrdh.website));assert.ok(text.includes('Contact: '+savrdh.contactNumber));
 assert.equal(renderCompanyMessage(text,recipient,savrdh),text);
 assert.equal(renderCompanyMessage('Regards,\nSavrdh Technology\nwww.savrdhtechnology.com\n8109995906',recipient,savrdh),'Regards,\nSavrdh Technology\nwww.savrdhtechnology.com\n8109995906');
 assert.equal(renderCompanyMessage('',recipient,savrdh),'');
});
test('WhatsApp and Gmail carry personalized company details for only the selected recipient',()=>{
 const text=renderCompanyMessage('Namaste {{first_name}} ji, {{company_name}} details: {{website}}',recipient,akbs);
 const wa=new URL(composeUrl(recipient,'whatsapp',text));assert.equal(wa.pathname,'/442079460001');assert.equal(wa.searchParams.get('text'),text);
 const gmail=new URL(gmailComposeUrl(recipient,text,personalizeMessage('{{company_name}} details',recipient,akbs)));
 assert.equal(gmail.searchParams.get('to'),'customer@example.invalid');assert.equal(gmail.searchParams.get('su'),'AKBS Poultry Farming Private Limited details');
 assert.equal(gmail.searchParams.get('body'),text);assert.equal(gmail.searchParams.has('cc'),false);assert.equal(gmail.searchParams.has('bcc'),false);
});
test('website normalization accepts a domain but rejects unsafe schemes and embedded credentials',()=>{
 assert.equal(normalizeCompanyWebsite(' company.example.invalid '),'https://company.example.invalid/');
 for(const input of ['javascript:alert(1)','data:text/html,test','https://user:password@example.invalid','https://bad host.invalid']) assert.throws(()=>normalizeCompanyWebsite(input));
});
test('unavailable message values remain visible and are detected before a send',()=>{
 const text=personalizeMessage('Hello {{first_name}}, {{order_id}} {{order_id}}',recipient,savrdh);
 assert.deepEqual(templateVariables(text),['order_id']);
 assert.equal(personalizeMessage('{{company_name}}',undefined,{}),'');
});

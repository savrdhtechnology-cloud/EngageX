import React from 'react';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { AppContext, type AppContextType } from '../src/context/AppContext';
import { TemplatesView } from '../src/components/TemplatesView';
import { SettingsView } from '../src/components/SettingsView';
import { ContactOutreach } from '../src/components/ContactOutreach';

const value={contacts:[{id:'contact',name:'Saved Person',first_name:'Saved',company:'Customer Company',mobile:'+442079460001',email:'customer@example.invalid',city:'',tags:[],status:'active',whatsapp_consent:false,email_consent:false,sms_consent:false}],
 templates:[{id:'tpl',name:'Company introduction',channel:'email',category:'Marketing',status:'draft',subject:'{{company_name}} information',body:'Hello {{first_name}}, contact {{company_name}} at {{website}} or {{contact_number}}.',variables:['first_name','company_name','website','contact_number']}],
 activeWorkspace:{id:'client',slug:'akbs-poultry-farming',name:'AKBS Poultry Farming Private Limited'},workspaceSettings:{companyName:'AKBS Poultry Farming Private Limited',supportNumber:'+91 9893345906',applicationLink:'https://akbspoultry.com/'},
 userSession:{name:'Owner',role:'Owner',isAuthenticated:true},integrations:[],auditLogs:[],billing:{message_credits:0},messages:[],campaigns:[],team:[],notifications:[],unreadNotificationsCount:0,setAppTab:()=>{},addTemplate:()=>{},updateTemplate:()=>{},deleteTemplate:()=>{},sendMessage:()=>{},addCampaign:()=>{}} as unknown as AppContextType;
const render=(element:React.ReactNode)=>renderToStaticMarkup(<AppContext.Provider value={value}>{element}</AppContext.Provider>);
test('template preview shows the client company with its actual website and mobile',()=>{
 const html=render(<TemplatesView/>);assert.ok(html.includes('AKBS Poultry Farming Private Limited information'));
 assert.ok(html.includes('Hello Saved, contact AKBS Poultry Farming Private Limited at https://akbspoultry.com/ or +91 9893345906.'));
 assert.ok(!html.includes('8109995906'));assert.ok(!html.includes('contact Savrdh Technology at'));assert.ok(!html.includes('Aarav'));
});
test('company profile and composer display the current client without another company’s defaults',()=>{
 const settings=render(<SettingsView/>);assert.ok(settings.includes('value="https://akbspoultry.com/"'));assert.ok(settings.includes('value="+91 9893345906"'));
 const composer=render(<ContactOutreach contacts={value.contacts} initialChannel="email" onClose={()=>{}}/>);
 assert.ok(composer.includes('Company: AKBS Poultry Farming Private Limited'));assert.ok(composer.includes('https://akbspoultry.com/'));assert.ok(composer.includes('+91 9893345906'));
});

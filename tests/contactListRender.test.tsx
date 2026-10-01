import React from 'react';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderToString } from 'react-dom/server';
import { AppContext, type AppContextType } from '../src/context/AppContext';
import { ContactsView } from '../src/components/ContactsView';

test('contact directory opens existing contacts with the requested columns and row communication actions',()=>{
  const value=new Proxy({live:true,appTab:'contacts',contacts:[{id:'test-contact',name:'Saved Contact',mobile:'+919876543210',email:'contact@example.invalid',company:'Saved Company',city:'Pune',job_title:'Director',tags:['healthcare'],notes:'Lead Score: 87%',status:'active',whatsapp_consent:false,sms_consent:false,email_consent:false,created_at:'2026-10-01T00:00:00Z'}],
    templates:[],campaigns:[],messages:[],automations:[],integrations:[],team:[],auditLogs:[],notifications:[],unreadNotificationsCount:0,
    userSession:{email:'owner@example.invalid',name:'Owner',role:'Owner',avatar:'O',isAuthenticated:true},workspaceSettings:{},activeWorkspace:{id:'test-workspace',slug:'preview',name:'Test Workspace'},
    billing:{plan_code:'unconfigured',plan_name:'Not activated',status:'pending',monthly_price:0,message_credits:0,contact_limit:10000,monthly_message_limit:0,whatsapp_usage:0,sms_usage:0,email_usage:0}
  },{get:(target,key)=>key in target?target[key as keyof typeof target]:()=>{}}) as unknown as AppContextType;
  const html=renderToString(<AppContext.Provider value={value}><ContactsView/></AppContext.Provider>);
  for(const text of ['Saved Contact','Saved Company','Pune','Director','87%','Contact Name &amp; Role','Company &amp; Industry','Business Email','CRM Actions','Select All','Export Excel']) assert.ok(html.includes(text),text);
  for(const action of ['WhatsApp','Email','SMS','Edit','Delete']) assert.ok(html.includes(`aria-label="${action} Saved Contact"`),action);
  assert.ok(!html.includes('WhatsApp verified'));assert.ok(!html.includes('98%'));
});

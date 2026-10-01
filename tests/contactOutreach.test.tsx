import React from 'react';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { AppContext, type AppContextType } from '../src/context/AppContext';
import { ContactOutreach } from '../src/components/ContactOutreach';
import type { Contact, ChannelType, Integration } from '../src/types';

const contact = (id='first', overrides:Partial<Contact>={}):Contact=>({id,name:'Saved Contact',first_name:'Saved',mobile:'+919876543210',email:'contact@example.invalid',company:'Saved Company',city:'Pune',tags:[],status:'active',whatsapp_consent:false,sms_consent:false,email_consent:false,created_at:'2026-10-01T00:00:00Z',...overrides});
function render(contacts:Contact[], channel:ChannelType, integrations:Integration[]=[]) {
  const value={templates:[],integrations,workspaceSettings:{},userSession:{role:'Owner'},setAppTab:()=>{},sendMessage:()=>{throw new Error('Opening a composer must not send a CRM message');},addCampaign:()=>{}} as unknown as AppContextType;
  return renderToStaticMarkup(<AppContext.Provider value={value}><ContactOutreach contacts={contacts} initialChannel={channel} onClose={()=>{}} onEditContact={()=>{}}/></AppContext.Provider>);
}
const links=(html:string)=>[...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/g)].map((m)=>({url:m[1].replaceAll('&amp;','&'),text:m[2]}));

test('a saved email without marketing consent can open Email App and Gmail even with an empty message',()=>{
  const html=render([contact()],'email'); const actions=links(html);
  assert.equal(actions.length,2);
  assert.equal(actions[0].text.trim(),'Open Email App');
  assert.ok(actions[0].url.startsWith('mailto:contact%40example.invalid'));
  assert.equal(actions[1].text.trim(),'Open Gmail');
  assert.equal(new URL(actions[1].url).searchParams.get('to'),'contact@example.invalid');
  assert.ok(html.includes('1 available to open EMAIL'));
  assert.ok(html.includes('This workspace email provider is not configured'));
  assert.ok(html.includes('Email provider setup'));
  assert.ok(html.includes('Review details for Saved Contact'));
  assert.match(html,/<button[^>]*disabled=""[^>]*>Send email from CRM<\/button>/);
});
test('WhatsApp opens the saved normalized phone without requiring a message or campaign opt-in',()=>{
  const html=render([contact()],'whatsapp'); const actions=links(html);
  assert.equal(actions.length,1); assert.equal(actions[0].text.trim(),'Open WhatsApp');
  assert.equal(new URL(actions[0].url).pathname,'/919876543210');
  assert.ok(html.includes('target="_blank" rel="noopener noreferrer"'));
  assert.ok(html.includes('Individual compose available'));
});
test('multiple selection provides one explicit manual recipient and never creates a combined mail recipient',()=>{
  const html=render([contact(),contact('second',{name:'Second Contact',email:'second@example.invalid'})],'email');
  assert.ok(html.includes('Open message for one contact')); assert.ok(html.includes('Second Contact'));
  for(const action of links(html)) {assert.ok(!action.url.includes('second%40'));assert.ok(!action.url.includes('second@'));}
});
test('inactive or invalid contact addresses show an actionable reason and no compose link',()=>{
  for(const c of [contact('1',{status:'unsubscribed'}),contact('2',{email:''}),contact('3',{email:'a@example.invalid,b@example.invalid'})]) {
    const html=render([c],'email'); assert.equal(links(html).length,0);
    assert.ok(html.includes('No selected contact has an active status and a valid email address'));
  }
});
test('configured CRM email still needs recorded consent and shows the reason',()=>{
  const integration={channel:'email',status:'configured'} as Integration;
  const html=render([contact()],'email',[integration]);
  assert.ok(html.includes('CRM email needs recorded email consent'));
  assert.match(html,/<button[^>]*disabled=""[^>]*>Send email from CRM<\/button>/);
  assert.equal(links(html).length,2);
  const ready=render([contact('ready',{email_consent:true})],'email',[integration]);
  assert.match(ready,/<button class="cbtn primary" title="Send to the listed contacts with recorded email consent">Send email from CRM \(1\)<\/button>/);
});

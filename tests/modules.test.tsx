import React from 'react';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderToString } from 'react-dom/server';
import { AppContext, type AppContextType } from '../src/context/AppContext';
import { DashboardView } from '../src/components/DashboardView';
import { ContactsView } from '../src/components/ContactsView';
import { CampaignsView } from '../src/components/CampaignsView';
import { MessagesView } from '../src/components/MessagesView';
import { TemplatesView } from '../src/components/TemplatesView';
import { AutomationsView } from '../src/components/AutomationsView';
import { AnalyticsView } from '../src/components/AnalyticsView';
import { IntegrationsView } from '../src/components/IntegrationsView';
import { TeamView } from '../src/components/TeamView';
import { BillingView } from '../src/components/BillingView';
import { SettingsView } from '../src/components/SettingsView';
import { ClientsView } from '../src/components/ClientsView';
const value = new Proxy({
  live:true, appTab:'dashboard', activeChatContactId:'', contacts:[],campaigns:[],messages:[],templates:[],automations:[],integrations:[],team:[],auditLogs:[],notifications:[],unreadNotificationsCount:0,
  userSession:{email:'owner@example.invalid',name:'Owner',role:'Owner',avatar:'O',isAuthenticated:true},workspaceSettings:{},
  billing:{plan_code:'unconfigured',plan_name:'Not activated',status:'pending',monthly_price:0,message_credits:0,contact_limit:10000,monthly_message_limit:0,whatsapp_usage:0,sms_usage:0,email_usage:0}
}, {get:(target,key)=>key in target ? target[key as keyof typeof target] : ()=>{}}) as unknown as AppContextType;
for(const Component of [DashboardView,ContactsView,CampaignsView,MessagesView,TemplatesView,AutomationsView,AnalyticsView,IntegrationsView,TeamView,BillingView,SettingsView,ClientsView]) {
  test(`${Component.name} renders an empty live workspace`,()=>{
    const html=renderToString(<AppContext.Provider value={value}><Component/></AppContext.Provider>);
    assert.ok(html.length>100); assert.ok(!html.includes('NaN')); assert.ok(!html.includes('Infinity'));
  });
}

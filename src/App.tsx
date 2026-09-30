/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from './context/AppContext';
import { LiveAppProvider as AppProvider } from './context/LiveAppProvider';
import { LandingPage } from './components/LandingPage';
import { AboutPage } from './components/AboutPage';
import { ContactPage } from './components/ContactPage';
import { LoginPage } from './components/LoginPage';
import { DashboardView } from './components/DashboardView';
import { ContactsView } from './components/ContactsView';
import { CampaignsView } from './components/CampaignsView';
import { MessagesView } from './components/MessagesView';
import { TemplatesView } from './components/TemplatesView';
import { AutomationsView } from './components/AutomationsView';
import { AnalyticsView } from './components/AnalyticsView';
import { IntegrationsView } from './components/IntegrationsView';
import { TeamView } from './components/TeamView';
import { BillingView } from './components/BillingView';
import { SettingsView } from './components/SettingsView';

const AppContent: React.FC = () => {
  const { currentView, appTab, userSession } = useApp();

  if (currentView === 'landing') return <LandingPage />;
  if (currentView === 'about') return <AboutPage />;
  if (currentView === 'contact') return <ContactPage />;
  if (currentView === 'login' || !userSession.isAuthenticated) return <LoginPage />;

  // CRM Workspace views
  switch (appTab) {
    case 'dashboard':
      return <DashboardView />;
    case 'contacts':
      return <ContactsView />;
    case 'campaigns':
      return <CampaignsView />;
    case 'messages':
      return <MessagesView />;
    case 'templates':
      return <TemplatesView />;
    case 'automations':
      return <AutomationsView />;
    case 'analytics':
      return <AnalyticsView />;
    case 'integrations':
      return <IntegrationsView />;
    case 'team':
      return <TeamView />;
    case 'billing':
      return <BillingView />;
    case 'settings':
      return <SettingsView />;
    default:
      return <DashboardView />;
  }
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

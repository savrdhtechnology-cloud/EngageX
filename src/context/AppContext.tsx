import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  Contact,
  Campaign,
  Message,
  Template,
  Automation,
  Integration,
  TeamMember,
  WorkspaceBilling,
  AuditItem,
  UserSession,
  ChannelType,
  AppNotification,
} from '../types';
import {
  initialContacts,
  initialCampaigns,
  initialMessages,
  initialTemplates,
  initialAutomations,
  initialIntegrations,
  initialTeam,
  initialBilling,
  initialAuditLogs,
  initialNotifications,
} from '../data/mockData';

export interface AppContextType {
  live?: boolean;
  workspaceSettings?: Record<string, string>;
  activeWorkspace?: { id: string; slug: string; name: string } | null;
  switchWorkspace?: (slug: string) => Promise<void>;
  saveWorkspaceSettings?: (settings: Record<string, string>) => Promise<void>;
  reportError?: (error: unknown) => void | Promise<void>;
  // Navigation
  currentView: 'landing' | 'about' | 'contact' | 'login' | 'app';
  setCurrentView: (view: 'landing' | 'about' | 'contact' | 'login' | 'app') => void | Promise<void>;
  appTab: string;
  setAppTab: (tab: string) => void | Promise<void>;
  activeChatContactId: string;
  setActiveChatContactId: (id: string) => void | Promise<void>;

  // Notifications
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  markNotificationRead: (id: string) => void | Promise<void>;
  markAllNotificationsRead: () => void | Promise<void>;
  deleteNotification: (id: string) => void | Promise<void>;
  addNotification: (data: Omit<AppNotification, 'id' | 'time' | 'read'> & { time?: string }) => void | Promise<void>;

  // Session
  userSession: UserSession;
  login: (email: string, password?: string) => void | Promise<void>;
  logout: () => void | Promise<void>;

  // Contacts
  contacts: Contact[];
  refreshContacts?: () => Promise<void>;
  addContact: (data: Omit<Contact, 'id' | 'created_at'>) => Contact | Promise<Contact>;
  updateContact: (id: string, data: Partial<Contact>) => void | Promise<void>;
  deleteContact: (id: string) => void | Promise<void>;
  bulkDeleteContacts: (ids: string[]) => void | Promise<void>;
  importContacts: (items: Omit<Contact, 'id' | 'created_at'>[]) => { inserted: number; duplicates: number } | Promise<{ inserted: number; duplicates: number }>;

  // Campaigns
  campaigns: Campaign[];
  addCampaign: (data: Omit<Campaign, 'id' | 'created_at' | 'sent_count' | 'delivered_count' | 'read_count' | 'failed_count'>) => Campaign | Promise<Campaign>;
  updateCampaign: (id: string, data: Partial<Campaign>) => void | Promise<void>;
  deleteCampaign: (id: string) => void | Promise<void>;
  queueCampaign: (id: string) => void | Promise<void>;
  simulateCampaignRun: (id: string) => void | Promise<void>;

  // Messages
  messages: Message[];
  sendMessage: (payload: { contact_id: string; channel: ChannelType; body: string; subject?: string; request_id?: string; campaign_id?: string }) => void | Promise<void>;
  simulateCustomerReply: (contact_id: string, text?: string) => void | Promise<void>;

  // Templates
  templates: Template[];
  addTemplate: (data: Omit<Template, 'id' | 'created_at'>) => void | Promise<void>;
  updateTemplate: (id: string, data: Partial<Template>) => void | Promise<void>;
  deleteTemplate: (id: string) => void | Promise<void>;

  // Automations
  automations: Automation[];
  toggleAutomation: (id: string) => void | Promise<void>;
  addAutomation: (data: Omit<Automation, 'id' | 'executions_count'>) => void | Promise<void>;
  testAutomation: (autoId: string, contactId: string) => Promise<string[]>;

  // Integrations
  integrations: Integration[];
  updateIntegration: (id: string, config: Record<string, string>, status?: 'connected' | 'configured' | 'disconnected') => void | Promise<void>;
  testIntegration: (provider: string, config: Record<string, string>) => Promise<{ success: boolean; message: string; latency_ms: number }>;

  // Team
  team: TeamMember[];
  inviteTeamMember: (email: string, role: TeamMember['role'], name?: string) => void | Promise<void>;
  removeTeamMember: (id: string) => void | Promise<void>;

  // Billing
  billing: WorkspaceBilling;
  addCredits: (amount: number) => void | Promise<void>;
  changePlan: (planCode: string) => void | Promise<void>;

  // Audit Logs
  auditLogs: AuditItem[];
  addAuditLog: (action: string, resource_type: string, details: string, resource_id?: string) => void | Promise<void>;

  // Utilities
  resetToDefaults: () => void | Promise<void>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

import { campaignAudience, normalizePhone } from '../lib/metrics';

const STORAGE_KEY = 'engagex_savrdh_state_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation states
  const [currentView, setCurrentView] = useState<'landing' | 'about' | 'contact' | 'login' | 'app'>('landing');
  const [appTab, setAppTab] = useState<string>('dashboard');
  const [activeChatContactId, setActiveChatContactId] = useState<string>('cnt-1');

  const campaignTimers = useRef(new Map<string, ReturnType<typeof setInterval>>());
  useEffect(() => () => { campaignTimers.current.forEach(clearInterval); }, []);

  // Notifications state
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_notifications');
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : initialNotifications;
    } catch {
      return initialNotifications;
    }
  });

  // Session state
  const [userSession, setUserSession] = useState<UserSession>(() => {
    return {
      email: 'savrdhtechnology@gmail.com',
      name: 'Administrator',
      role: 'Owner',
      avatar: 'A',
      isAuthenticated: false,
    };
  });

  // Main domain entities
  const [contacts, setContacts] = useState<Contact[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_contacts');
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : initialContacts;
    } catch {
      return initialContacts;
    }
  });

  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_campaigns');
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : initialCampaigns;
    } catch {
      return initialCampaigns;
    }
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_messages');
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : initialMessages;
    } catch {
      return initialMessages;
    }
  });

  const [templates, setTemplates] = useState<Template[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_templates');
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : initialTemplates;
    } catch {
      return initialTemplates;
    }
  });

  const [automations, setAutomations] = useState<Automation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_automations');
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : initialAutomations;
    } catch {
      return initialAutomations;
    }
  });

  const [integrations, setIntegrations] = useState<Integration[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_integrations');
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : initialIntegrations;
    } catch {
      return initialIntegrations;
    }
  });

  const [team, setTeam] = useState<TeamMember[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_team');
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : initialTeam;
    } catch {
      return initialTeam;
    }
  });

  const [billing, setBilling] = useState<WorkspaceBilling>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_billing');
      return saved ? JSON.parse(saved) : initialBilling;
    } catch {
      return initialBilling;
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_audit');
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : initialAuditLogs;
    } catch {
      return initialAuditLogs;
    }
  });

  // Local storage auto-sync
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY + '_contacts', JSON.stringify(contacts));
      localStorage.setItem(STORAGE_KEY + '_campaigns', JSON.stringify(campaigns));
      localStorage.setItem(STORAGE_KEY + '_messages', JSON.stringify(messages));
      localStorage.setItem(STORAGE_KEY + '_templates', JSON.stringify(templates));
      localStorage.setItem(STORAGE_KEY + '_automations', JSON.stringify(automations));
      localStorage.setItem(STORAGE_KEY + '_integrations', JSON.stringify(integrations));
      localStorage.setItem(STORAGE_KEY + '_team', JSON.stringify(team));
      localStorage.setItem(STORAGE_KEY + '_billing', JSON.stringify(billing));
      localStorage.setItem(STORAGE_KEY + '_audit', JSON.stringify(auditLogs));
      localStorage.setItem(STORAGE_KEY + '_notifications', JSON.stringify(notifications));
    } catch {
      // storage limit or private mode ignore
    }
  }, [contacts, campaigns, messages, templates, automations, integrations, team, billing, auditLogs, notifications]);

  // Notifications operations
  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const addNotification = (data: Omit<AppNotification, 'id' | 'time' | 'read'> & { time?: string }) => {
    const newNotif: AppNotification = {
      ...data,
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      time: data.time || 'Just now',
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Audit logger helper
  const addAuditLog = (action: string, resource_type: string, details: string, resource_id?: string) => {
    const item: AuditItem = {
      id: 'aud-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      user_email: userSession.email || 'savrdhtechnology@gmail.com',
      action,
      resource_type,
      resource_id,
      details,
      created_at: new Date().toISOString(),
    };
    setAuditLogs((prev) => [item, ...prev]);
  };

  // Auth operations
  const login = (email: string, role = 'Owner') => {
    setUserSession({
      email,
      name: email.split('@')[0] || 'User',
      role,
      avatar: (email[0] || 'U').toUpperCase(),
      isAuthenticated: true,
    });
    addAuditLog('USER_LOGIN', 'Auth', `User logged in as ${role}: ${email}`);
    setCurrentView('app');
  };

  const logout = () => {
    setUserSession((prev) => ({ ...prev, isAuthenticated: false }));
    addAuditLog('USER_LOGOUT', 'Auth', `User logged out`);
    setCurrentView('login');
  };

  // Contact operations
  const addContact = (data: Omit<Contact, 'id' | 'created_at'>): Contact => {
    const newContact: Contact = {
      ...data,
      id: 'cnt-' + crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    setContacts((prev) => [newContact, ...prev]);
    addAuditLog('CONTACT_CREATED', 'Contact', `Added contact: ${newContact.name} (${newContact.mobile || newContact.email})`, newContact.id);
    return newContact;
  };

  const updateContact = (id: string, data: Partial<Contact>) => {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
    addAuditLog('CONTACT_UPDATED', 'Contact', `Updated details for contact ID: ${id}`, id);
  };

  const deleteContact = (id: string) => {
    const found = contacts.find((c) => c.id === id);
    setContacts((prev) => prev.filter((c) => c.id !== id));
    addAuditLog('CONTACT_DELETED', 'Contact', `Deleted contact: ${found?.name || id}`, id);
  };

  const bulkDeleteContacts = (ids: string[]) => {
    setContacts((prev) => prev.filter((c) => !ids.includes(c.id)));
    addAuditLog('CONTACTS_BULK_DELETED', 'Contact', `Bulk deleted ${ids.length} contacts`);
  };

  const importContacts = (items: Omit<Contact, 'id' | 'created_at'>[]) => {
    const existingEmails = new Set(contacts.map((c) => c.email.toLowerCase().trim()).filter(Boolean));
    const existingPhones = new Set(contacts.map((c) => normalizePhone(c.mobile)).filter(Boolean));

    let duplicates = 0;
    const toInsert: Contact[] = [];

    items.forEach((item) => {
      const emailClean = (item.email || '').toLowerCase().trim();
      const phoneClean = normalizePhone(item.mobile || '');

      if ((emailClean && existingEmails.has(emailClean)) || (phoneClean && existingPhones.has(phoneClean))) {
        duplicates++;
      } else {
        toInsert.push({
          ...item,
          id: 'cnt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          created_at: new Date().toISOString(),
        });
        if (emailClean) existingEmails.add(emailClean);
        if (phoneClean) existingPhones.add(phoneClean);
      }
    });

    if (toInsert.length > 0) {
      setContacts((prev) => [...toInsert, ...prev]);
      addAuditLog('CONTACTS_IMPORTED', 'Contact', `Imported ${toInsert.length} contacts (${duplicates} duplicates skipped)`);
    }

    return { inserted: toInsert.length, duplicates };
  };

  // Campaign operations
  const addCampaign = (
    data: Omit<Campaign, 'id' | 'created_at' | 'sent_count' | 'delivered_count' | 'read_count' | 'failed_count'>
  ): Campaign => {
    const newCamp: Campaign = {
      ...data,
      id: 'cmp-' + Date.now(),
      sent_count: 0,
      delivered_count: 0,
      read_count: 0,
      failed_count: 0,
      created_at: new Date().toISOString(),
    };

    setCampaigns((prev) => [newCamp, ...prev]);
    addAuditLog('CAMPAIGN_CREATED', 'Campaign', `Created campaign "${newCamp.name}" [${newCamp.channels.join(', ')}]`, newCamp.id);

    if (newCamp.send_mode === 'now') {
      runCampaign(newCamp);
    }

    return newCamp;
  };

  const updateCampaign = (id: string, data: Partial<Campaign>) => {
    if (data.status === 'paused') { clearInterval(campaignTimers.current.get(id)); campaignTimers.current.delete(id); }
    setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
  };

  const deleteCampaign = (id: string) => {
    const found = campaigns.find((c) => c.id === id);
    clearInterval(campaignTimers.current.get(id)); campaignTimers.current.delete(id);
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
    addAuditLog('CAMPAIGN_DELETED', 'Campaign', `Deleted campaign: ${found?.name || id}`, id);
  };

  const queueCampaign = (id: string) => {
    if (!campaigns.some(c => c.id === id && c.status !== 'completed') || campaignTimers.current.has(id)) return;
    addAuditLog('CAMPAIGN_QUEUED', 'Campaign', `Queued campaign for dispatch`, id);
    simulateCampaignRun(id);
  };

  const simulateCampaignRun = (id: string) => {
    const campaign = campaigns.find(c => c.id === id);
    if (campaign) runCampaign(campaign);
  };

  const runCampaign = (camp: Campaign) => {
    const id = camp.id;
    if (campaignTimers.current.has(id) || camp.status === 'completed') return;
    updateCampaign(id, { status: 'running' });
    const targetChannels = camp.channels;
    const eligible = campaignAudience(camp, contacts);
    const totalToSend = eligible.reduce((n, c) => n + targetChannels.filter(ch => ch === 'email' ? c.email_consent && !!c.email : ch === 'sms' ? c.sms_consent && !!normalizePhone(c.mobile) : c.whatsapp_consent && !!normalizePhone(c.mobile)).length, 0);
    if (!totalToSend) { updateCampaign(id, { status: 'draft' }); return; }

    // Simulate progressive delivery ticks
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.max(1, Math.ceil(totalToSend / 4));
      if (progress >= totalToSend) {
        clearInterval(interval);
        campaignTimers.current.delete(id);
        const delivered = Math.floor(totalToSend * 0.96);
        const read = Math.floor(delivered * 0.78);
        const failed = totalToSend - delivered;

        updateCampaign(id, {
          status: 'completed',
          sent_count: totalToSend,
          delivered_count: delivered,
          read_count: read,
          failed_count: failed,
        });

        // Update billing usage
        setBilling((b) => ({
          ...b,
          whatsapp_usage: targetChannels.includes('whatsapp') ? b.whatsapp_usage + delivered : b.whatsapp_usage,
          sms_usage: targetChannels.includes('sms') ? b.sms_usage + delivered : b.sms_usage,
          email_usage: targetChannels.includes('email') ? b.email_usage + delivered : b.email_usage,
          message_credits: Math.max(0, b.message_credits - totalToSend),
        }));

        addAuditLog(
          'CAMPAIGN_COMPLETED',
          'Campaign',
          `Demo campaign simulation finished. Sent: ${totalToSend}, Delivered: ${delivered} (96%), Failed: ${failed}`,
          id
        );

        addNotification({
          title: 'Demo Campaign Finished',
          description: `"${camp?.name || 'Campaign'}" delivered to ${delivered} contacts.`,
          type: 'campaign',
          targetTab: 'campaigns',
          targetId: id,
          time: 'Just now',
        });
      } else {
        const delivered = Math.floor(progress * 0.95);
        updateCampaign(id, {
          sent_count: progress,
          delivered_count: delivered,
          read_count: Math.floor(delivered * 0.7),
          failed_count: progress - delivered,
        });
      }
    }, 400);
    campaignTimers.current.set(id, interval);
  };

  // Demo schedules run only while this browser workspace is open.
  useEffect(() => {
    const timer = setInterval(() => {
      campaigns.filter(c => c.status === 'scheduled' && c.scheduled_at && Date.parse(c.scheduled_at) <= Date.now()).forEach(runCampaign);
    }, 1000);
    return () => clearInterval(timer);
  }, [campaigns, contacts]);

  // Message operations
  const sendMessage = (payload: { contact_id: string; channel: ChannelType; body: string; subject?: string }) => {
    const contact = contacts.find((c) => c.id === payload.contact_id);
    if (!contact || contact.status !== 'active' || !payload.body.trim()) throw new Error('Select an active contact and enter a message.');
    const consent = payload.channel === 'email' ? contact.email_consent && contact.email : payload.channel === 'sms' ? contact.sms_consent && normalizePhone(contact.mobile) : contact.whatsapp_consent && normalizePhone(contact.mobile);
    if (!consent) throw new Error('This contact has no consent or address for the selected channel.');
    const newMsg: Message = {
      id: 'msg-' + Date.now(),
      contact_id: payload.contact_id,
      contact_name: contact?.name || 'Customer',
      contact_phone: contact?.mobile,
      contact_email: contact?.email,
      channel: payload.channel,
      direction: 'outbound',
      status: 'sent',
      subject: payload.subject,
      body: payload.body,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [newMsg, ...prev]);

    // Progressive status update: sent -> delivered -> read
    setTimeout(() => {
      setMessages((prev) => prev.map((m) => (m.id === newMsg.id ? { ...m, status: 'delivered' } : m)));
    }, 900);

    setTimeout(() => {
      setMessages((prev) => prev.map((m) => (m.id === newMsg.id ? { ...m, status: 'read' } : m)));
    }, 2200);

    // Decrement credits & increment usage
    setBilling((b) => ({
      ...b,
      message_credits: Math.max(0, b.message_credits - 1),
      whatsapp_usage: payload.channel === 'whatsapp' ? b.whatsapp_usage + 1 : b.whatsapp_usage,
      sms_usage: payload.channel === 'sms' ? b.sms_usage + 1 : b.sms_usage,
      email_usage: payload.channel === 'email' ? b.email_usage + 1 : b.email_usage,
    }));

    addAuditLog('DEMO_MESSAGE_SENT', 'Message', `Simulated ${payload.channel.toUpperCase()} message to ${contact?.name || 'Customer'}`);
  };

  const simulateCustomerReply = (contact_id: string, text?: string) => {
    const contact = contacts.find((c) => c.id === contact_id);
    const replies = [
      'Hi! Thank you for the update. Could you share more details about your pricing plans?',
      'Yes, please confirm our meeting for tomorrow at 3:00 PM.',
      'Received with thanks! Great to see WhatsApp automation in action.',
      'Can we schedule a quick demo call with your product engineer?',
      'Awesome offer! We are subscribing to the Pro tier today.',
    ];
    const replyText = text || replies[Math.floor(Math.random() * replies.length)];

    let keywords = ['STOP', 'UNSUBSCRIBE', 'CANCEL'];
    try { const settings = JSON.parse(localStorage.getItem(STORAGE_KEY + '_settings') || '{}'); if (settings.optOutKeyword) keywords = settings.optOutKeyword.split(',').map((k: string) => k.trim().toUpperCase()); } catch {}
    if (keywords.includes(replyText.trim().toUpperCase())) setContacts(prev => prev.map(c => c.id === contact_id ? { ...c, status: 'unsubscribed', whatsapp_consent: false, sms_consent: false, email_consent: false } : c));

    const inMsg: Message = {
      id: 'msg-in-' + Date.now(),
      contact_id,
      contact_name: contact?.name || 'Customer',
      contact_phone: contact?.mobile,
      contact_email: contact?.email,
      channel: 'whatsapp',
      direction: 'inbound',
      status: 'read',
      body: replyText,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [inMsg, ...prev]);
    addAuditLog('INBOUND_REPLY', 'Message', `Received inbound WhatsApp reply from ${contact?.name || 'Customer'}`);
    addNotification({
      title: 'New Inbound WhatsApp Message',
      description: `${contact?.name || 'Customer'} replied: "${replyText.slice(0, 48)}..."`,
      type: 'whatsapp',
      targetTab: 'messages',
      targetId: contact_id,
      time: 'Just now',
    });
  };

  // Template operations
  const addTemplate = (data: Omit<Template, 'id' | 'created_at'>) => {
    const newTpl: Template = {
      ...data,
      id: 'tpl-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    setTemplates((prev) => [newTpl, ...prev]);
    addAuditLog('TEMPLATE_CREATED', 'Template', `Created ${data.channel.toUpperCase()} template: ${data.name}`, newTpl.id);
  };

  const updateTemplate = (id: string, data: Partial<Template>) => {
    setTemplates((prev) => prev.map((t) => t.id === id ? { ...t, ...data } : t));
    addAuditLog('TEMPLATE_UPDATED', 'Template', `Updated template: ${id}`, id);
  };

  const deleteTemplate = (id: string) => {
    const found = templates.find((t) => t.id === id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    addAuditLog('TEMPLATE_DELETED', 'Template', `Deleted template: ${found?.name || id}`, id);
  };

  // Automation operations
  const toggleAutomation = (id: string) => {
    setAutomations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: a.status === 'active' ? 'paused' : 'active' } : a))
    );
    const found = automations.find((a) => a.id === id);
    const newStatus = found?.status === 'active' ? 'paused' : 'active';
    addAuditLog('AUTOMATION_TOGGLED', 'Automation', `Set automation "${found?.name}" status to ${newStatus}`, id);
  };

  const addAutomation = (data: Omit<Automation, 'id' | 'executions_count'>) => {
    const newAuto: Automation = {
      ...data,
      id: 'auto-' + Date.now(),
      executions_count: 0,
    };
    setAutomations((prev) => [newAuto, ...prev]);
    addAuditLog('AUTOMATION_CREATED', 'Automation', `Created workflow: ${newAuto.name}`, newAuto.id);
  };

  const testAutomation = async (autoId: string, contactId: string): Promise<string[]> => {
    const auto = automations.find((a) => a.id === autoId);
    const contact = contacts.find((c) => c.id === contactId);
    const logs: string[] = [];

    logs.push(`[${new Date().toLocaleTimeString()}] Trigger evaluated: "${auto?.trigger_event}" on ${contact?.name || 'Contact'}`);
    logs.push(`[${new Date().toLocaleTimeString()}] Checking channel consent: WA=${contact?.whatsapp_consent}, SMS=${contact?.sms_consent}, Email=${contact?.email_consent}`);

    for (const step of auto?.steps || []) {
      await new Promise((r) => setTimeout(r, 250));
      if (step.type === 'send_whatsapp') {
        logs.push(`[${new Date().toLocaleTimeString()}] Executed step: ${step.title} -> Dispatched Meta WhatsApp payload (200 OK)`);
      } else if (step.type === 'send_sms') {
        logs.push(`[${new Date().toLocaleTimeString()}] Executed step: ${step.title} -> DLT message sent via SVRDTC header`);
      } else if (step.type === 'send_email') {
        logs.push(`[${new Date().toLocaleTimeString()}] Executed step: ${step.title} -> Resend API accepted message ID <res_982>`);
      } else if (step.type === 'wait_delay') {
        logs.push(`[${new Date().toLocaleTimeString()}] Step: ${step.title} -> Timer scheduled for ${step.delay_hours || 1}h (simulated pass)`);
      } else {
        logs.push(`[${new Date().toLocaleTimeString()}] Step: ${step.title} -> Success`);
      }
    }

    logs.push(`[${new Date().toLocaleTimeString()}] Workflow execution completed successfully.`);

    // Increment execution count
    setAutomations((prev) =>
      prev.map((a) => (a.id === autoId ? { ...a, executions_count: a.executions_count + 1, last_run: new Date().toISOString() } : a))
    );

    addAuditLog('AUTOMATION_TESTED', 'Automation', `Simulated test run of "${auto?.name}" on ${contact?.name}`);
    return logs;
  };

  // Integrations operations
  const updateIntegration = (
    id: string,
    config: Record<string, string>,
    status: 'connected' | 'configured' | 'disconnected' = 'configured'
  ) => {
    const safeConfig = Object.fromEntries(Object.entries(config).filter(([key]) => !/secret|token|password|api.?key|auth.?key/i.test(key)));
    setIntegrations((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, config: safeConfig, status, last_synced: new Date().toISOString() } : item
      )
    );
    addAuditLog('INTEGRATION_CONFIGURED', 'Integration', `Updated configuration for integration ID: ${id}`, id);
  };

  const testIntegration = async (
    provider: string,
    _config: Record<string, string>
  ): Promise<{ success: boolean; message: string; latency_ms: number }> => {
    return {
      success: false,
      message: `${provider}: live connection testing requires a server-side provider integration. No API request was sent.`,
      latency_ms: 0,
    };
  };

  // Team operations
  const inviteTeamMember = (email: string, role: TeamMember['role'], name?: string) => {
    const newMember: TeamMember = {
      id: 'team-' + Date.now(),
      user_id: 'usr-' + Date.now(),
      email,
      name: name || email.split('@')[0],
      role,
      status: 'invited',
      avatar: (email[0] || 'U').toUpperCase(),
      created_at: new Date().toISOString(),
    };
    setTeam((prev) => [...prev, newMember]);
    addAuditLog('TEAM_MEMBER_INVITED', 'Team', `Invited ${email} as ${role}`, newMember.id);
  };

  const removeTeamMember = (id: string) => {
    const found = team.find((t) => t.id === id);
    setTeam((prev) => prev.filter((t) => t.id !== id));
    addAuditLog('TEAM_MEMBER_REMOVED', 'Team', `Removed team member: ${found?.email}`, id);
  };

  // Billing operations
  const addCredits = (amount: number) => {
    setBilling((b) => ({
      ...b,
      message_credits: b.message_credits + amount,
    }));
    addAuditLog('BILLING_TOPUP', 'Billing', `Recharged workspace with ${amount.toLocaleString()} message credits`);
  };

  const changePlan = (planCode: string) => {
    const plans: Record<string, { name: string; price: number; contacts: number; limit: number }> = {
      starter: { name: 'Starter Tier', price: 2499, contacts: 25000, limit: 50000 },
      pro_scale: { name: 'Pro Scale Tier', price: 7999, contacts: 100000, limit: 250000 },
      enterprise: { name: 'Enterprise Custom', price: 19999, contacts: 500000, limit: 1000000 },
    };
    const target = plans[planCode] || plans.pro_scale;
    setBilling((b) => ({
      ...b,
      plan_code: planCode,
      plan_name: target.name,
      monthly_price: target.price,
      contact_limit: target.contacts,
      monthly_message_limit: target.limit,
    }));
    addAuditLog('PLAN_UPGRADED', 'Billing', `Changed subscription tier to ${target.name}`);
  };

  // Reset to initial defaults
  const resetToDefaults = () => {
    campaignTimers.current.forEach(clearInterval); campaignTimers.current.clear();
    setContacts(initialContacts);
    setCampaigns(initialCampaigns);
    setMessages(initialMessages);
    setTemplates(initialTemplates);
    setAutomations(initialAutomations);
    setIntegrations(initialIntegrations);
    setTeam(initialTeam);
    setBilling(initialBilling);
    setAuditLogs(initialAuditLogs);
    setNotifications(initialNotifications);
    try {
      Object.keys(localStorage).filter(key => key.startsWith(STORAGE_KEY)).forEach(key => localStorage.removeItem(key));
    } catch {
      // ignore
    }
    addAuditLog('WORKSPACE_RESET', 'System', 'Workspace data restored to factory demo defaults');
  };

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        appTab,
        setAppTab,
        activeChatContactId,
        setActiveChatContactId,
        notifications,
        unreadNotificationsCount,
        markNotificationRead,
        markAllNotificationsRead,
        deleteNotification,
        addNotification,
        userSession,
        login,
        logout,
        contacts,
        addContact,
        updateContact,
        deleteContact,
        bulkDeleteContacts,
        importContacts,
        campaigns,
        addCampaign,
        updateCampaign,
        deleteCampaign,
        queueCampaign,
        simulateCampaignRun,
        messages,
        sendMessage,
        simulateCustomerReply,
        templates,
        addTemplate,
        updateTemplate,
        deleteTemplate,
        automations,
        toggleAutomation,
        addAutomation,
        testAutomation,
        integrations,
        updateIntegration,
        testIntegration,
        team,
        inviteTeamMember,
        removeTeamMember,
        billing,
        addCredits,
        changePlan,
        auditLogs,
        addAuditLog,
        resetToDefaults,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

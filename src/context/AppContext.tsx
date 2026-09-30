import React, { createContext, useContext, useState, useEffect } from 'react';
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

interface AppContextType {
  // Navigation
  currentView: 'landing' | 'about' | 'contact' | 'login' | 'app';
  setCurrentView: (view: 'landing' | 'about' | 'contact' | 'login' | 'app') => void;
  appTab: string;
  setAppTab: (tab: string) => void;
  activeChatContactId: string;
  setActiveChatContactId: (id: string) => void;

  // Notifications
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => void;
  addNotification: (data: Omit<AppNotification, 'id' | 'time' | 'read'> & { time?: string }) => void;

  // Session
  userSession: UserSession;
  login: (email: string, role?: string) => void;
  logout: () => void;

  // Contacts
  contacts: Contact[];
  addContact: (data: Omit<Contact, 'id' | 'created_at'>) => Contact;
  updateContact: (id: string, data: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  bulkDeleteContacts: (ids: string[]) => void;
  importContacts: (items: Omit<Contact, 'id' | 'created_at'>[]) => { inserted: number; duplicates: number };

  // Campaigns
  campaigns: Campaign[];
  addCampaign: (data: Omit<Campaign, 'id' | 'created_at' | 'sent_count' | 'delivered_count' | 'read_count' | 'failed_count'>) => Campaign;
  updateCampaign: (id: string, data: Partial<Campaign>) => void;
  deleteCampaign: (id: string) => void;
  queueCampaign: (id: string) => void;
  simulateCampaignRun: (id: string) => void;

  // Messages
  messages: Message[];
  sendMessage: (payload: { contact_id: string; channel: ChannelType; body: string; subject?: string }) => void;
  simulateCustomerReply: (contact_id: string, text?: string) => void;

  // Templates
  templates: Template[];
  addTemplate: (data: Omit<Template, 'id' | 'created_at'>) => void;
  deleteTemplate: (id: string) => void;

  // Automations
  automations: Automation[];
  toggleAutomation: (id: string) => void;
  addAutomation: (data: Omit<Automation, 'id' | 'executions_count'>) => void;
  testAutomation: (autoId: string, contactId: string) => Promise<string[]>;

  // Integrations
  integrations: Integration[];
  updateIntegration: (id: string, config: Record<string, string>, status?: 'connected' | 'configured' | 'disconnected') => void;
  testIntegration: (provider: string, config: Record<string, string>) => Promise<{ success: boolean; message: string; latency_ms: number }>;

  // Team
  team: TeamMember[];
  inviteTeamMember: (email: string, role: TeamMember['role'], name?: string) => void;
  removeTeamMember: (id: string) => void;

  // Billing
  billing: WorkspaceBilling;
  addCredits: (amount: number) => void;
  changePlan: (planCode: string) => void;

  // Audit Logs
  auditLogs: AuditItem[];
  addAuditLog: (action: string, resource_type: string, details: string, resource_id?: string) => void;

  // Utilities
  resetToDefaults: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'engagex_savrdh_state_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation states
  const [currentView, setCurrentView] = useState<'landing' | 'about' | 'contact' | 'login' | 'app'>('landing');
  const [appTab, setAppTab] = useState<string>('dashboard');
  const [activeChatContactId, setActiveChatContactId] = useState<string>('cnt-1');

  // Notifications state
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_notifications');
      return saved ? JSON.parse(saved) : initialNotifications;
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
      isAuthenticated: true,
    };
  });

  // Main domain entities
  const [contacts, setContacts] = useState<Contact[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_contacts');
      return saved ? JSON.parse(saved) : initialContacts;
    } catch {
      return initialContacts;
    }
  });

  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_campaigns');
      return saved ? JSON.parse(saved) : initialCampaigns;
    } catch {
      return initialCampaigns;
    }
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_messages');
      return saved ? JSON.parse(saved) : initialMessages;
    } catch {
      return initialMessages;
    }
  });

  const [templates, setTemplates] = useState<Template[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_templates');
      return saved ? JSON.parse(saved) : initialTemplates;
    } catch {
      return initialTemplates;
    }
  });

  const [automations, setAutomations] = useState<Automation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_automations');
      return saved ? JSON.parse(saved) : initialAutomations;
    } catch {
      return initialAutomations;
    }
  });

  const [integrations, setIntegrations] = useState<Integration[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_integrations');
      return saved ? JSON.parse(saved) : initialIntegrations;
    } catch {
      return initialIntegrations;
    }
  });

  const [team, setTeam] = useState<TeamMember[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_team');
      return saved ? JSON.parse(saved) : initialTeam;
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
      return saved ? JSON.parse(saved) : initialAuditLogs;
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
      id: 'cnt-' + Date.now(),
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
    const existingPhones = new Set(contacts.map((c) => c.mobile.replace(/[^+\d]/g, '')).filter(Boolean));

    let duplicates = 0;
    const toInsert: Contact[] = [];

    items.forEach((item) => {
      const emailClean = (item.email || '').toLowerCase().trim();
      const phoneClean = (item.mobile || '').replace(/[^+\d]/g, '');

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
      simulateCampaignRun(newCamp.id);
    }

    return newCamp;
  };

  const updateCampaign = (id: string, data: Partial<Campaign>) => {
    setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
  };

  const deleteCampaign = (id: string) => {
    const found = campaigns.find((c) => c.id === id);
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
    addAuditLog('CAMPAIGN_DELETED', 'Campaign', `Deleted campaign: ${found?.name || id}`, id);
  };

  const queueCampaign = (id: string) => {
    updateCampaign(id, { status: 'running' });
    addAuditLog('CAMPAIGN_QUEUED', 'Campaign', `Queued campaign for dispatch`, id);
    simulateCampaignRun(id);
  };

  const simulateCampaignRun = (id: string) => {
    updateCampaign(id, { status: 'running' });

    // Deduce eligible contacts based on channel consents
    const camp = campaigns.find((c) => c.id === id);
    const targetChannels = camp?.channels || ['whatsapp'];

    const eligible = contacts.filter((c) => {
      return targetChannels.some((ch) => {
        if (ch === 'whatsapp') return c.whatsapp_consent;
        if (ch === 'sms') return c.sms_consent;
        if (ch === 'email') return c.email_consent;
        return false;
      });
    });

    const totalToSend = Math.max(eligible.length * 15, 120);

    // Simulate progressive delivery ticks
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(totalToSend / 4);
      if (progress >= totalToSend) {
        clearInterval(interval);
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
          `Campaign delivery finished. Sent: ${totalToSend}, Delivered: ${delivered} (96%), Failed: ${failed}`,
          id
        );

        addNotification({
          title: 'Campaign Finished',
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
  };

  // Message operations
  const sendMessage = (payload: { contact_id: string; channel: ChannelType; body: string; subject?: string }) => {
    const contact = contacts.find((c) => c.id === payload.contact_id);
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

    addAuditLog('MESSAGE_SENT', 'Message', `Dispatched ${payload.channel.toUpperCase()} message to ${contact?.name || 'Customer'}`);
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
    status: 'connected' | 'configured' | 'disconnected' = 'connected'
  ) => {
    setIntegrations((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, config: { ...item.config, ...config }, status, last_synced: new Date().toISOString() } : item
      )
    );
    addAuditLog('INTEGRATION_CONFIGURED', 'Integration', `Updated configuration for integration ID: ${id}`, id);
  };

  const testIntegration = async (
    provider: string,
    _config: Record<string, string>
  ): Promise<{ success: boolean; message: string; latency_ms: number }> => {
    await new Promise((r) => setTimeout(r, 600));
    const latency = Math.floor(Math.random() * 45) + 35;
    return {
      success: true,
      message: `Handshake successful with ${provider}. Real-time API response verified in ${latency}ms.`,
      latency_ms: latency,
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
      localStorage.clear();
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

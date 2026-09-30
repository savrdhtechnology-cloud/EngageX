export type ChannelType = 'whatsapp' | 'sms' | 'email';

export interface Contact {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  mobile: string;
  email: string;
  company: string;
  job_title?: string;
  city: string;
  state?: string;
  country?: string;
  tags: string[];
  notes?: string;
  status: 'active' | 'unsubscribed' | 'bounced';
  whatsapp_consent: boolean;
  sms_consent: boolean;
  email_consent: boolean;
  created_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  objective?: string;
  channels: ChannelType[];
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'paused';
  subject?: string;
  body: string;
  send_mode: 'draft' | 'now' | 'schedule';
  scheduled_at: string | null;
  target_audience: string;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;
  created_at: string;
}

export interface Message {
  id: string;
  contact_id: string;
  contact_name: string;
  contact_phone?: string;
  contact_email?: string;
  channel: ChannelType;
  direction: 'inbound' | 'outbound';
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  subject?: string;
  body: string;
  created_at: string;
}

export interface Template {
  id: string;
  name: string;
  channel: ChannelType;
  category: 'Marketing' | 'Utility' | 'Authentication' | 'Transactional';
  status: 'approved' | 'pending' | 'draft';
  subject?: string;
  body: string;
  dlt_template_id?: string;
  variables: string[];
  created_at: string;
}

export interface AutomationStep {
  id: string;
  type: 'trigger' | 'send_whatsapp' | 'send_sms' | 'send_email' | 'wait_delay' | 'add_tag' | 'condition';
  title: string;
  details: string;
  delay_hours?: number;
  template_name?: string;
}

export interface Automation {
  id: string;
  name: string;
  trigger_event: string;
  trigger_condition: string;
  steps: AutomationStep[];
  status: 'active' | 'paused';
  executions_count: number;
  last_run?: string;
}

export interface Integration {
  id: string;
  provider: string;
  title: string;
  channel: ChannelType | 'webhook';
  status: 'configured' | 'connected' | 'disconnected';
  desc: string;
  config: Record<string, string>;
  last_synced?: string;
}

export interface TeamMember {
  id: string;
  user_id: string;
  email: string;
  name: string;
  role: 'Owner' | 'Admin' | 'Manager' | 'Employee' | 'Viewer';
  status: 'active' | 'invited';
  avatar: string;
  created_at: string;
}

export interface WorkspaceBilling {
  plan_code: string;
  plan_name: string;
  status: string;
  monthly_price: number;
  message_credits: number;
  contact_limit: number;
  monthly_message_limit: number;
  whatsapp_usage: number;
  sms_usage: number;
  email_usage: number;
}

export interface AuditItem {
  id: string;
  user_email: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details: string;
  created_at: string;
}

export interface UserSession {
  email: string;
  name: string;
  role: string;
  avatar: string;
  isAuthenticated: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'whatsapp' | 'campaign' | 'integration' | 'billing' | 'system';
  targetTab: string;
  targetId?: string;
  read: boolean;
}


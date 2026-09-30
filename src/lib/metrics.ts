import type { Campaign, Message, ChannelType, Contact } from '../types/index.ts';

export function summarize(campaigns: Campaign[], messages: Message[], days: number | null = null, channel: ChannelType | 'all' = 'all', now = Date.now()) {
  const since = days === null ? -Infinity : now - days * 86400000;
  const inRange = (date: string) => Date.parse(date) >= since && Date.parse(date) <= now;
  const cs = campaigns.filter(c => inRange(c.created_at) && (channel === 'all' || (c.channels.length === 1 && c.channels[0] === channel)));
  const ms = messages.filter(m => inRange(m.created_at) && (channel === 'all' || m.channel === channel));
  const out = ms.filter(m => m.direction === 'outbound');
  const totalSent = cs.reduce((n,c) => n + c.sent_count, 0) + out.filter(m => ['sent','delivered','read'].includes(m.status)).length;
  const delivered = cs.reduce((n,c) => n + c.delivered_count, 0) + out.filter(m => ['delivered','read'].includes(m.status)).length;
  const read = cs.reduce((n,c) => n + c.read_count, 0) + out.filter(m => m.status === 'read').length;
  const failed = cs.reduce((n,c) => n + c.failed_count, 0) + out.filter(m => m.status === 'failed').length;
  return { totalSent, delivered, read, failed, replies: ms.filter(m => m.direction === 'inbound').length, clicks: 0, ctr: 0,
    deliveryRate: totalSent ? Math.round(delivered / totalSent * 100) : 0,
    openRate: delivered ? Math.round(read / delivered * 100) : 0 };
}

export function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, '');
  return digits.length === 10 ? '91' + digits : digits;
}

export function csvCell(value: unknown) {
  let text = String(value ?? '');
  if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}

export function campaignAudience(campaign: Campaign, contacts: Contact[]) {
  const tag = campaign.target_audience.startsWith('Tags: #') ? campaign.target_audience.slice(7) : null;
  return contacts.filter(c => c.status === 'active' && (!tag || c.tags.includes(tag)) && campaign.channels.some(ch =>
    ch === 'email' ? c.email_consent && !!c.email : ch === 'sms' ? c.sms_consent && !!normalizePhone(c.mobile) : c.whatsapp_consent && !!normalizePhone(c.mobile)));
}

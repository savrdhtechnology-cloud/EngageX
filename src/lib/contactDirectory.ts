import type { Contact, ChannelType } from '../types';
import { normalizePhone } from './metrics';

export type BusinessProspect = {
  id?: string; business_name?: string | null; business_type?: string | null; category?: string | null;
  location?: string | null; address?: string | null; phone?: string | null; email?: string | null; website?: string | null;
  source_url?: string | null; source?: string | null; lead_score?: number | null; recommended_product?: string | null;
};
export const contactEmail = (value: unknown) => String(value || '').trim().toLowerCase();
export const contactPhone = (value: unknown) => normalizePhone(String(value || ''));
export const validEmail = (value: string) => /^[^\s,;<>@]+@[^\s,;<>@]+\.[^\s,;<>@]+$/.test(value);
export const validPhone = (value: string) => /^[1-9]\d{7,14}$/.test(contactPhone(value));

export function prospectToContact(p: BusinessProspect): Omit<Contact, 'id' | 'created_at'> {
  const name = String(p.business_name || '').trim() || 'Business Prospect';
  return {
    name, first_name: name.split(/\s+/)[0], last_name: '', mobile: String(p.phone || ''),
    email: contactEmail(p.email), company: name, job_title: p.business_type || p.category || 'Business Prospect',
    city: p.location || '', state: '', country: '',
    tags: ['lead-intelligence', String(p.business_type || p.category || 'prospect').toLowerCase()],
    notes: ['Imported from EngageX Lead Intelligence', p.address && 'Address: ' + p.address,
      p.website && 'Website: ' + p.website, p.source_url && 'Source: ' + p.source_url,
      p.lead_score != null && 'Lead Score: ' + p.lead_score + '%',
      p.recommended_product && 'Recommended Product: ' + p.recommended_product].filter(Boolean).join('\n'),
    status: 'active', whatsapp_consent: false, sms_consent: false, email_consent: false,
  };
}

export function planProspectImport(prospects: BusinessProspect[], contacts: Pick<Contact, 'mobile' | 'email'>[]) {
  const phones = new Set(contacts.map(c => contactPhone(c.mobile)).filter(Boolean));
  const emails = new Set(contacts.map(c => contactEmail(c.email)).filter(Boolean));
  const items: Omit<Contact, 'id' | 'created_at'>[] = [];
  let duplicates = 0, missing = 0;
  for (const p of prospects) {
    const phone = contactPhone(p.phone), email = contactEmail(p.email);
    if (!phone && !email) { missing++; continue; }
    if ((phone && phones.has(phone)) || (email && emails.has(email))) { duplicates++; continue; }
    if (phone) phones.add(phone); if (email) emails.add(email);
    items.push(prospectToContact(p));
  }
  return { items, duplicates, missing };
}

const noteValue = (notes: string | undefined, key: string) =>
  (notes || '').split('\n').find(line => line.startsWith(key + ': '))?.slice(key.length + 2) || '';

export function contactDirectory(contacts: Contact[], prospects: BusinessProspect[]) {
  const phones = new Map<string, BusinessProspect>(), emails = new Map<string, BusinessProspect>();
  for (const p of prospects) {
    const phone = contactPhone(p.phone), email = contactEmail(p.email);
    if (phone && !phones.has(phone)) phones.set(phone, p);
    if (email && !emails.has(email)) emails.set(email, p);
  }
  return contacts.map(contact => {
    const p = phones.get(contactPhone(contact.mobile)) || emails.get(contactEmail(contact.email));
    const scoreText = noteValue(contact.notes, 'Lead Score');
    const rawScore = p?.lead_score ?? (scoreText ? Number(scoreText.replace('%', '')) : null);
    const score = rawScore != null && Number.isFinite(rawScore) && rawScore >= 0 && rawScore <= 100 ? rawScore : null;
    return { contact, industry: p?.business_type || p?.category || contact.tags.find(t => !['lead-intelligence','imported','prospect'].includes(t)) || '',
      address: p?.address || noteValue(contact.notes, 'Address'), city: contact.city || p?.location || '', score,
      website: p?.website || noteValue(contact.notes, 'Website'), source: p?.source_url || noteValue(contact.notes, 'Source'),
      product: p?.recommended_product || noteValue(contact.notes, 'Recommended Product') };
  });
}

export function channelReady(contact: Contact, channel: ChannelType) {
  if (contact.status !== 'active') return false;
  return channel === 'email' ? contact.email_consent && validEmail(contact.email)
    : channel === 'sms' ? contact.sms_consent && validPhone(contact.mobile)
    : contact.whatsapp_consent && validPhone(contact.mobile);
}

export function personalize(text: string, contact: Contact, groupLink = '') {
  const values: Record<string, string> = { first_name: contact.first_name || contact.name.split(/\s+/)[0],
    name: contact.name, company: contact.company, mobile: contact.mobile, email: contact.email, city: contact.city, group_link: groupLink };
  return text.replace(/\{\{(first_name|name|company|mobile|email|city|group_link)\}\}/g, (_, key) => values[key] || '');
}

export function composeUrl(contact: Contact, channel: ChannelType, body: string, subject = '') {
  if (!channelReady(contact, channel)) throw new Error('This contact needs an active address and consent for the selected channel.');
  const message = encodeURIComponent(personalize(body, contact));
  if (channel === 'email') return `mailto:${encodeURIComponent(contact.email)}?subject=${encodeURIComponent(personalize(subject,contact))}&body=${message}`;
  if (channel === 'sms') return `sms:+${contactPhone(contact.mobile)}?body=${message}`;
  return `https://wa.me/${contactPhone(contact.mobile)}?text=${message}`;
}

export const selectedContactAudience = (ids: string[]) => 'Contacts: ' + JSON.stringify([...new Set(ids)]);
export function audienceContactIds(audience: string): string[] | null {
  if (!audience.startsWith('Contacts: ')) return null;
  try { const ids = JSON.parse(audience.slice(10)); return Array.isArray(ids) && ids.every(id => typeof id === 'string') ? ids : []; }
  catch { return []; }
}

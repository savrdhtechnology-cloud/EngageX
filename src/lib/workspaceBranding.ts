import type { Contact } from '../types';
import { normalizePhone } from './metrics';

export type WorkspaceBranding = {
  companyName: string; website: string; contactNumber: string; supportEmail: string;
  demoLink: string; applicationLink: string; groupLink: string;
};
type Workspace = { name?: string; slug?: string } | null | undefined;
const value = (settings: Record<string, unknown>, ...keys: string[]) => {
  for (const key of keys) if (typeof settings[key] === 'string' && (settings[key] as string).trim()) return (settings[key] as string).trim();
  return '';
};

export function normalizeCompanyWebsite(input: string) {
  const text = input.trim();
  if (!text) return '';
  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(text) ? text : 'https://' + text);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || /[\s\u0000-\u001f]/.test(text)) throw new Error();
    return url.href;
  } catch { throw new Error('Enter a valid company website, for example https://company.com.'); }
}
const website = (input: string) => { try { return normalizeCompanyWebsite(input); } catch { return ''; } };

export function resolveWorkspaceBranding(workspace: Workspace, settings: Record<string, unknown> = {}): WorkspaceBranding {
  const companyWebsite = website(value(settings,'companyWebsite','website','applicationLink'));
  return {
    companyName: value(settings,'companyName') || workspace?.name || value(settings,'workspaceName'),
    website: companyWebsite,
    contactNumber: value(settings,'contactPhone','contactNumber','supportNumber','supportPhone'),
    supportEmail: value(settings,'contactEmail','supportEmail'),
    demoLink: website(value(settings,'demoLink')) || companyWebsite,
    applicationLink: website(value(settings,'applicationLink')) || companyWebsite,
    groupLink: website(value(settings,'whatsappGroupLink')),
  };
}

export const COMPANY_TEMPLATE_VARIABLES = ['company_name','company_website','website','contact_number','support_number','support_email','demo_link','application_link','group_link'] as const;
export const CONTACT_TEMPLATE_VARIABLES = ['first_name','last_name','name','company','mobile','email','city'] as const;
export const templateVariables = (text: string) => [...new Set([...text.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g)].map(m=>m[1]))];

export function personalizeMessage(text: string, contact?: Contact, branding: Partial<WorkspaceBranding> = {}) {
  const values: Record<string, string> = {
    ...(contact ? {first_name:contact.first_name || contact.name.split(/\s+/)[0],last_name:contact.last_name || '',
      name:contact.name,company:contact.company,mobile:contact.mobile,email:contact.email,city:contact.city} : {}),
    company_name:branding.companyName || '',company_website:branding.website || '',website:branding.website || '',
    contact_number:branding.contactNumber || '',support_number:branding.contactNumber || '',support_email:branding.supportEmail || '',
    demo_link:branding.demoLink || '',application_link:branding.applicationLink || '',group_link:branding.groupLink || '',
  };
  return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,(tag,key)=>Object.prototype.hasOwnProperty.call(values,key)?values[key]:tag);
}

export function renderCompanyMessage(text: string, contact: Contact | undefined, branding: WorkspaceBranding) {
  const rendered = personalizeMessage(text,contact,branding);
  if (!rendered.trim()) return rendered;
  const lower = rendered.toLowerCase();
  const lines: string[] = [];
  if (branding.companyName && !lower.includes(branding.companyName.toLowerCase())) lines.push('Regards,',branding.companyName);
  const site = branding.website.replace(/^https?:\/\//,'').replace(/\/$/,'').toLowerCase();
  if (site && !lower.includes(site)) lines.push('Website: ' + branding.website);
  const phone = normalizePhone(branding.contactNumber);
  const digits = rendered.replace(/\D/g,'');
  if (branding.contactNumber && (!phone || (!digits.includes(phone) && !(phone.startsWith('91') && digits.includes(phone.slice(2)))))) lines.push('Contact: ' + branding.contactNumber);
  return rendered + (lines.length ? '\n\n' + lines.join('\n') : '');
}

export const DEFAULT_COMPANY_INVITE = 'Namaste {{first_name}} ji,\n\n{{company_name}} ke official updates group me join karne ka invite hai.\n\nJoin Group: {{group_link}}\n\nRegards,\n{{company_name}}\nWebsite: {{website}}\nContact: {{contact_number}}';

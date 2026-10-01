import React, { useRef, useState } from 'react';
import { Mail, MessageCircle, MessageSquareText } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Contact, ChannelType } from '../types';
import { channelReady, composeUrl, gmailComposeUrl, manualChannelReady, personalize, selectedContactAudience } from '../lib/contactDirectory';

export const ContactOutreach: React.FC<{ contacts: Contact[]; initialChannel: ChannelType; onClose: () => void; onEditContact?: (contact: Contact) => void }> = ({ contacts, initialChannel, onClose, onEditContact }) => {
  const { templates, sendMessage, addCampaign, workspaceSettings, integrations, setAppTab, userSession } = useApp();
  const [channel, setChannel] = useState(initialChannel);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [manualContactId, setManualContactId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [acceptedIds, setAcceptedIds] = useState<string[]>([]);
  const requestIds = useRef(new Map<string, string>());
  const sending = useRef(false);
  const eligible = contacts.filter(contact => channelReady(contact, channel));
  const manualContacts = contacts.filter(contact => manualChannelReady(contact, channel));
  const manualContact = manualContacts.find(c => c.id === manualContactId) || manualContacts[0];
  const canManage = ['Owner', 'Admin', 'Manager'].includes(userSession.role);
  const emailConfigured = integrations.some(i => i.channel === 'email' && ['configured','connected'].includes(i.status));
  const rendered = (text: string, contact: Contact) => personalize(text, contact, workspaceSettings?.whatsappGroupLink || '');
  const changeChannel = (value: ChannelType) => { setChannel(value); setNotice(''); setError(''); setManualContactId(''); setTemplateId(''); };
  const validate = () => {
    if (!body.trim() || (channel === 'email' && !subject.trim())) throw new Error('Enter a message' + (channel === 'email' ? ' and email subject.' : '.'));
    if (!eligible.length) throw new Error('No selected contacts have an active address and consent for this channel. Use Edit Contact to update recorded consent.');
    if (!canManage) throw new Error('Owner, Admin or Manager workspace access is required.');
  };
  const manualUrl = manualContact ? composeUrl(manualContact, channel, rendered(body,manualContact), rendered(subject,manualContact)) : '';
  const gmailUrl = manualContact && channel === 'email' ? gmailComposeUrl(manualContact, rendered(body,manualContact), rendered(subject,manualContact)) : '';
  const opened = (app: string) => {
    setError('');
    setNotice(`${app} compose link opened for ${manualContact?.name}. Review and press Send in that app. You can reopen the same contact here.`);
  };
  const emailUnavailable = !canManage ? 'Owner, Admin or Manager access is required to send from CRM.'
    : !emailConfigured ? 'This workspace email provider is not configured. Use Open Gmail or Open Email App, or configure the provider in Integrations.'
    : !eligible.length ? 'CRM email needs recorded email consent. Review contact details to record permission already received. You can open an individual email in Gmail or your mail app.' : '';
  const emailSelected = async () => {
    if (sending.current || channel !== 'email' || !emailConfigured) return;
    try {
      validate();
      sending.current=true;
      setBusy(true); setError(''); let sent = acceptedIds.length;
      for (const contact of eligible.filter(c => !acceptedIds.includes(c.id))) {
        const contentKey = contact.id + '\n' + subject + '\n' + body;
        let requestId = requestIds.current.get(contentKey);
        if (!requestId) { requestId = crypto.randomUUID(); requestIds.current.set(contentKey,requestId); }
        await sendMessage({ contact_id: contact.id, channel: 'email', body: rendered(body,contact), subject: rendered(subject,contact), request_id: requestId });
        setAcceptedIds(prev => [...prev,contact.id]); sent++;
        setNotice(`${sent} of ${eligible.length} emails accepted by the email provider.`);
      }
    } catch (e) { setError((e as Error).message); }
    finally { sending.current=false; setBusy(false); }
  };
  const saveDraft = async () => {
    if (sending.current) return;
    try {
      validate();
      sending.current=true;
      setBusy(true); setError('');
      await addCampaign({ name: `${channel.toUpperCase()} · ${eligible.length} selected contacts · ${new Date().toLocaleDateString('en-IN')}`,
        objective: 'Selected contacts from Contact Management', channels: [channel], status: 'draft', subject: channel === 'email' ? subject : undefined,
        body, send_mode: 'draft', scheduled_at: null, target_audience: selectedContactAudience(eligible.map(c => c.id)) });
      onClose(); setAppTab('campaigns');
    } catch (e) { setError((e as Error).message); }
    finally { sending.current=false; setBusy(false); }
  };
  return <div className="modalBackdrop"><div className="modalCard contactOutreach" role="dialog" aria-modal="true" aria-label="Contact message composer" style={{maxWidth:760}}>
    <div className="modalHead"><div><small>CONTACT COMMUNICATION</small><h3>Message selected contacts</h3></div><button disabled={busy} onClick={onClose} aria-label="Close message composer">×</button></div>
    <div className="contactChannelButtons">{([['whatsapp',MessageCircle],['sms',MessageSquareText],['email',Mail]] as const).map(([value,Icon])=>
      <button key={value} disabled={busy} className={channel===value?'cbtn primary':'cbtn secondary'} onClick={()=>changeChannel(value)}><Icon size={14}/>{value.toUpperCase()}</button>)}</div>
    <p>{contacts.length} selected · <b>{manualContacts.length} available to open {channel.toUpperCase()}</b> · {eligible.length} with recorded channel consent.</p>
    <div className="contactRecipientList">{contacts.map(c=><div key={c.id}><b>{c.name}</b><span>{channel==='email'?c.email:c.mobile}</span>
      <small>{!manualChannelReady(c,channel)?`Unavailable: ${c.status!=='active'?c.status:'missing or invalid '+(channel==='email'?'email':'mobile')}`:channelReady(c,channel)?'Channel consent recorded':'Individual compose available · channel consent not recorded'}</small>
      {onEditContact&&canManage&&<button className="contactReview" disabled={busy} onClick={()=>onEditContact(c)} aria-label={`Review details for ${c.name}`}>Review details</button>}
    </div>)}</div>
    {!manualContacts.length&&<div className="notice errorNotice" role="alert">No selected contact has an active status and a valid {channel==='email'?'email address':'mobile number'} for this channel. Review contact details.</div>}
    {error&&<div className="notice errorNotice" role="alert">{error}</div>}{notice&&<div className="notice" role="status">{notice}</div>}
    <div className="formGrid">
      {manualContacts.length>1&&<div className="field full"><label htmlFor="manual-message-contact">Open message for one contact</label><select id="manual-message-contact" disabled={busy} value={manualContact?.id||''} onChange={e=>{setManualContactId(e.target.value);setNotice('');setError('');}}>
        {manualContacts.map(c=><option key={c.id} value={c.id}>{c.name} · {channel==='email'?c.email:c.mobile}</option>)}
      </select><small>Each Open button opens only this contact. Choose another contact here to message them.</small></div>}
      <div className="field full"><label htmlFor="contact-message-template">Saved template</label><select id="contact-message-template" disabled={busy} value={templateId} onChange={e=>{
        setTemplateId(e.target.value); const template=templates.find(t=>t.id===e.target.value); if(template){setBody(template.body);setSubject(template.subject||'');setAcceptedIds([]);setNotice('');}
      }}><option value="">Write a custom message</option>{templates.filter(t=>t.channel===channel).map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
      {channel==='email'&&<div className="field full"><label htmlFor="contact-message-subject">Email subject</label><input id="contact-message-subject" value={subject} disabled={busy} onChange={e=>{setSubject(e.target.value);setAcceptedIds([]);setNotice('');}}/></div>}
      <div className="field full"><label htmlFor="contact-message-body">Message</label><textarea id="contact-message-body" rows={5} value={body} disabled={busy} onChange={e=>{setBody(e.target.value);setAcceptedIds([]);setNotice('');}} placeholder="Hello {{first_name}}, ..."/><small>Variables: {'{{first_name}}, {{company}}, {{city}}, {{mobile}}'}</small></div>
      {manualContact&&body&&<div className="field full"><div className="previewCard"><b>Preview for {manualContact.name}</b><p style={{whiteSpace:'pre-wrap'}}>{rendered(body,manualContact)}</p></div></div>}
    </div>
    <p className="contactComposeHelp">Open buttons prepare one contact’s message in your app. You press Send there. Opening a link does not change recorded consent or mark a CRM message as sent. If your mail app does not open, use Open Gmail.</p>
    <div className="modalActions">
      {manualContact&&!busy?<>
        <a className="cbtn primary" href={manualUrl} target={channel==='whatsapp'?'_blank':undefined} rel={channel==='whatsapp'?'noopener noreferrer':undefined} onClick={()=>opened(channel==='email'?'Email app':channel==='sms'?'SMS':'WhatsApp')}>
          Open {channel==='whatsapp'?'WhatsApp':channel==='sms'?'SMS':'Email App'}
        </a>
        {channel==='email'&&<a className="cbtn primary" href={gmailUrl} target="_blank" rel="noopener noreferrer" onClick={()=>opened('Gmail')}>Open Gmail</a>}
      </>:<button className="cbtn primary" disabled>Open {channel==='whatsapp'?'WhatsApp':channel==='sms'?'SMS':'Email App'}</button>}
    </div>
    <div className="contactCampaignActions">
      {channel==='email'&&emailUnavailable&&<p className="contactComposeHelp" role="status">{emailUnavailable}</p>}
      {channel==='email'&&!emailConfigured&&canManage&&<button className="cbtn secondary" disabled={busy} onClick={()=>{onClose();setAppTab('integrations');}}>Email provider setup</button>}
      <div className="modalActions"><button className="cbtn secondary" disabled={busy||!canManage||!eligible.length} title={eligible.length?'Save a draft for contacts with recorded consent':'Record channel consent in contact details to prepare a campaign'} onClick={saveDraft}>Save selected campaign draft{eligible.length?` (${eligible.length})`:''}</button>
      {channel==='email'&&<button className="cbtn primary" disabled={busy||!!emailUnavailable||eligible.every(c=>acceptedIds.includes(c.id))} title={emailUnavailable||'Send to the listed contacts with recorded email consent'} onClick={emailSelected}>{busy?'Sending…':acceptedIds.length===eligible.length&&eligible.length?'Emails accepted':'Send email from CRM'}{eligible.length&&!busy&&acceptedIds.length!==eligible.length?` (${eligible.length})`:''}</button>}
      </div>
    </div>
  </div></div>;
};

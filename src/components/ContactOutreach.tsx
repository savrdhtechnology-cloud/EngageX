import React, { useRef, useState } from 'react';
import { Mail, MessageCircle, MessageSquareText } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Contact, ChannelType } from '../types';
import { channelReady, composeUrl, personalize, selectedContactAudience } from '../lib/contactDirectory';

export const ContactOutreach: React.FC<{ contacts: Contact[]; initialChannel: ChannelType; onClose: () => void }> = ({ contacts, initialChannel, onClose }) => {
  const { templates, sendMessage, addCampaign, workspaceSettings, integrations, setAppTab } = useApp();
  const [channel, setChannel] = useState(initialChannel);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [openedIds, setOpenedIds] = useState<string[]>([]);
  const [acceptedIds, setAcceptedIds] = useState<string[]>([]);
  const requestIds = useRef(new Map<string, string>());
  const sending = useRef(false);
  const eligible = contacts.filter(contact => channelReady(contact, channel));
  const next = eligible.find(c => !openedIds.includes(c.id));
  const preview = eligible[0];
  const emailConfigured = integrations.some(i => i.channel === 'email' && i.status !== 'disconnected');
  const rendered = (text: string, contact: Contact) => personalize(text, contact, workspaceSettings?.whatsappGroupLink || '');
  const changeChannel = (value: ChannelType) => { setChannel(value); setNotice(''); setError(''); setOpenedIds([]); };
  const validate = () => {
    if (!body.trim() || (channel === 'email' && !subject.trim())) throw new Error('Enter a message' + (channel === 'email' ? ' and email subject.' : '.'));
    if (!eligible.length) throw new Error('No selected contacts have an active address and consent for this channel. Use Edit Contact to update recorded consent.');
  };
  const openNext = () => {
    try {
      validate(); if (!next) return;
      const url = composeUrl(next, channel, rendered(body,next), rendered(subject,next));
      if (channel === 'whatsapp') {
        const opened = window.open(url, '_blank');
        if (!opened) throw new Error('Allow pop-ups to open WhatsApp.');
        opened.opener = null;
      } else window.location.href = url;
      setOpenedIds(prev => [...prev,next.id]);
      setNotice(`Opened ${channel.toUpperCase()} composer for ${next.name}. Send from that app to deliver it.`);
      setError('');
    } catch (e) { setError((e as Error).message); }
  };
  const emailSelected = async () => {
    if (sending.current || channel !== 'email') return;
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
      await addCampaign({ name: `${channel.toUpperCase()} · ${contacts.length} selected contacts · ${new Date().toLocaleDateString('en-IN')}`,
        objective: 'Selected contacts from Contact Management', channels: [channel], status: 'draft', subject: channel === 'email' ? subject : undefined,
        body, send_mode: 'draft', scheduled_at: null, target_audience: selectedContactAudience(eligible.map(c => c.id)) });
      onClose(); setAppTab('campaigns');
    } catch (e) { setError((e as Error).message); }
    finally { sending.current=false; setBusy(false); }
  };
  return <div className="modalBackdrop"><div className="modalCard" role="dialog" aria-modal="true" aria-label="Contact message composer" style={{maxWidth:760}}>
    <div className="modalHead"><div><small>CONTACT COMMUNICATION</small><h3>Message selected contacts</h3></div><button disabled={busy} onClick={onClose} aria-label="Close message composer">×</button></div>
    <div className="contactChannelButtons">{([['whatsapp',MessageCircle],['sms',MessageSquareText],['email',Mail]] as const).map(([value,Icon])=>
      <button key={value} disabled={busy} className={channel===value?'cbtn primary':'cbtn secondary'} onClick={()=>changeChannel(value)}><Icon size={14}/>{value.toUpperCase()}</button>)}</div>
    <p>{contacts.length} selected · <b>{eligible.length} ready for {channel.toUpperCase()}</b> · {contacts.length-eligible.length} missing consent, address or active status.</p>
    <div className="contactRecipientList">{contacts.map(c=><div key={c.id}><b>{c.name}</b><span>{channel==='email'?c.email:c.mobile}</span><small>{channelReady(c,channel)?'Ready':'Review contact consent / details'}</small></div>)}</div>
    {error&&<div className="notice errorNotice" role="alert">{error}</div>}{notice&&<div className="notice" role="status">{notice}</div>}
    <div className="formGrid">
      <div className="field full"><label htmlFor="contact-message-template">Saved template</label><select id="contact-message-template" disabled={busy} defaultValue="" onChange={e=>{
        const template=templates.find(t=>t.id===e.target.value); if(template){setBody(template.body);setSubject(template.subject||'');setOpenedIds([]);setAcceptedIds([]);}
      }}><option value="">Write a custom message</option>{templates.filter(t=>t.channel===channel).map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
      {channel==='email'&&<div className="field full"><label htmlFor="contact-message-subject">Email subject</label><input id="contact-message-subject" value={subject} disabled={busy} onChange={e=>{setSubject(e.target.value);setAcceptedIds([]);setOpenedIds([]);}}/></div>}
      <div className="field full"><label htmlFor="contact-message-body">Message</label><textarea id="contact-message-body" rows={5} value={body} disabled={busy} onChange={e=>{setBody(e.target.value);setAcceptedIds([]);setOpenedIds([]);}} placeholder="Hello {{first_name}}, ..."/><small>Variables: {'{{first_name}}, {{company}}, {{city}}, {{mobile}}'}</small></div>
      {preview&&body&&<div className="field full"><div className="previewCard"><b>Preview for {preview.name}</b><p style={{whiteSpace:'pre-wrap'}}>{rendered(body,preview)}</p></div></div>}
    </div>
    <p style={{fontSize:12,color:'#64748b'}}>WhatsApp and SMS open your messaging app. Email can open your mail app or use the workspace email provider. Bulk SMS and WhatsApp API delivery require a connected provider.</p>
    <div className="modalActions"><button className="cbtn secondary" disabled={busy} onClick={saveDraft}>Save selected campaign draft</button>
      <button className="cbtn primary" disabled={busy||!next} onClick={openNext}>Open {channel==='whatsapp'?'WhatsApp':channel==='sms'?'SMS':'Email'}{eligible.length>1?' for next contact':''}</button>
      {channel==='email'&&<button className="cbtn primary" disabled={busy||!emailConfigured||!eligible.length||eligible.every(c=>acceptedIds.includes(c.id))} title={emailConfigured?'Send to the listed eligible contacts':'Configure this workspace email provider in Integrations'} onClick={emailSelected}>{busy?'Sending…':'Send email from CRM'}</button>}
    </div>
  </div></div>;
};

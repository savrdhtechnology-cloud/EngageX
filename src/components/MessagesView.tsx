import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  MessageCircle,
  MessageSquareText,
  Mail,
  Send,
  Sparkles,
  Check,
  CheckCheck,
  User,
  Phone,
  Search,
  Bot,
  Paperclip,
  Smile,
  ShieldCheck,
  Building,
  MapPin,
  Clock,
} from 'lucide-react';
import { CommercialShell } from './CommercialShell';
import { useApp } from '../context/AppContext';
import { ChannelType, Contact } from '../types';
import { personalizeMessage, resolveWorkspaceBranding } from '../lib/workspaceBranding';

export const MessagesView: React.FC = () => {
  const { contacts, messages, sendMessage, simulateCustomerReply, templates, activeWorkspace, workspaceSettings, activeChatContactId, setActiveChatContactId } = useApp();
  const branding=resolveWorkspaceBranding(activeWorkspace,workspaceSettings);

  const [selectedContactId, setSelectedContactId] = useState<string>(activeChatContactId || contacts[0]?.id || '');
  const [channelFilter, setChannelFilter] = useState<'all' | ChannelType>('all');
  const [search, setSearch] = useState('');
  const [textBody, setTextBody] = useState('');
  const [activeChannel, setActiveChannel] = useState<ChannelType>('whatsapp');
  const [emailSubject, setEmailSubject] = useState('');
  const [error, setError] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(()=>{setSelectedContactId('');setTextBody('');setEmailSubject('');setError('');setShowTemplates(false);},[activeWorkspace?.id]);

  useEffect(() => {
    if (activeChatContactId) {
      setSelectedContactId(activeChatContactId);
    }
  }, [activeChatContactId]);

  // Active contact
  const selectedContact = useMemo(() => {
    return contacts.find((c) => c.id === selectedContactId) || contacts[0];
  }, [contacts, selectedContactId]);

  // Filtered contacts list
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      const q = search.toLowerCase();
      const matches = c.name.toLowerCase().includes(q) || c.mobile.includes(q) || c.company.toLowerCase().includes(q);
      return matches;
    });
  }, [contacts, search]);

  // Messages for active contact
  const activeMessages = useMemo(() => {
    if (!selectedContact) return [];
    return messages
      .filter((m) => m.contact_id === selectedContact.id)
      .filter((m) => channelFilter === 'all' || m.channel === channelFilter)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [messages, selectedContact, channelFilter]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!textBody.trim() || !selectedContact) return;

    try {
    await sendMessage({
      contact_id: selectedContact.id,
      channel: activeChannel,
      body: textBody,
      subject: activeChannel === 'email' ? emailSubject || 'Message from '+branding.companyName : undefined,
    });

    setError('');
    } catch (error) { setError(error instanceof Error ? error.message : 'Message could not be sent.'); return; }

    setTextBody('');
    setEmailSubject('');
    setShowTemplates(false);
  };

  const handleSimulateReply = () => {
    if (!selectedContact) return;
    setIsSimulating(true);
    setTimeout(() => {
      simulateCustomerReply(selectedContact.id);
      setIsSimulating(false);
    }, 1200);
  };

  const handleInsertTemplate = (tplBody: string) => {
    if (!selectedContact) return;
    const personalized = personalizeMessage(tplBody,selectedContact,branding);
    const template=templates.find(t=>t.body===tplBody&&t.channel===activeChannel);
    if(activeChannel==='email') setEmailSubject(personalizeMessage(template?.subject||'Message from {{company_name}}',selectedContact,branding));
    setTextBody(personalized);
    setShowTemplates(false);
  };

  return (
    <CommercialShell
      title="Omnichannel Live Inbox"
      subtitle="Interactive two-way conversations across WhatsApp Cloud API, SMS, and Email."
    >
      {error && <div className="notice errorNotice">{error}</div>}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '300px 1fr 280px',
          gap: '14px',
          height: 'calc(100vh - 210px)',
          minHeight: '620px',
        }}
      >
        {/* Left Column: Contact List */}
        <section
          className="panel"
          style={{
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            padding: '14px',
            overflow: 'hidden',
          }}
        >
          <div style={{ marginBottom: '10px' }}>
            <div style={{ position: 'relative' }}>
              <Search
                size={14}
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations..."
                style={{
                  width: '100%',
                  padding: '8px 10px 8px 30px',
                  borderRadius: '8px',
                  border: '1px solid #dce7ec',
                  fontSize: '11px',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
              {(['all', 'whatsapp', 'sms', 'email'] as const).map((ch) => (
                <button
                  key={ch}
                  onClick={() => setChannelFilter(ch)}
                  style={{
                    flex: 1,
                    fontSize: '9px',
                    padding: '4px',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: channelFilter === ch ? '#0891b2' : '#e2e8f0',
                    background: channelFilter === ch ? '#0891b2' : '#ffffff',
                    color: channelFilter === ch ? '#ffffff' : '#475569',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    fontWeight: 700,
                  }}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {filteredContacts.map((c) => {
              const isSelected = c.id === selectedContact?.id;
              const contactMsgs = messages.filter((m) => m.contact_id === c.id);
              const lastMsg = contactMsgs[0];

              return (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedContactId(c.id);
                    setActiveChatContactId(c.id);
                  }}
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    background: isSelected ? '#f0fdfa' : '#ffffff',
                    border: '1px solid',
                    borderColor: isSelected ? '#99f6e4' : '#f1f5f9',
                    transition: '0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <b style={{ fontSize: '11px', color: '#0f172a' }}>{c.name}</b>
                    <small style={{ fontSize: '8px', color: '#94a3b8' }}>
                      {lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </small>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3px' }}>
                    <small style={{ fontSize: '9px', color: '#64748b' }}>{c.company}</small>
                    <div style={{ display: 'flex', gap: '3px' }}>
                      {c.whatsapp_consent && <span style={{ fontSize: '7px', color: '#16a34a' }}>● WA</span>}
                      {c.sms_consent && <span style={{ fontSize: '7px', color: '#0284c7' }}>● SMS</span>}
                    </div>
                  </div>
                  {lastMsg && (
                    <p
                      style={{
                        margin: '4px 0 0',
                        fontSize: '9px',
                        color: '#94a3b8',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {lastMsg.direction === 'outbound' ? 'You: ' : ''}
                      {lastMsg.body}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Center Column: Live Conversation Timeline */}
        <section
          className="panel"
          style={{
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            overflow: 'hidden',
            background: '#ffffff',
          }}
        >
          {/* Chat Header */}
          <div
            style={{
              padding: '12px 18px',
              borderBottom: '1px solid #edf2f4',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#fafcfd',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0284c7, #06b6d4)',
                  color: '#ffffff',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 800,
                  fontSize: '13px',
                }}
              >
                {selectedContact?.name?.[0] || 'C'}
              </div>
              <div>
                <b style={{ fontSize: '13px', display: 'block', color: '#0f172a' }}>{selectedContact?.name}</b>
                <span style={{ fontSize: '9px', color: '#64748b' }}>
                  {selectedContact?.mobile} · {selectedContact?.company}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                className="cbtn secondary"
                onClick={handleSimulateReply}
                disabled={isSimulating}
                style={{
                  fontSize: '10px',
                  padding: '5px 10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#f0fdf4',
                  borderColor: '#bbf7d0',
                  color: '#166534',
                }}
              >
                <Bot size={13} /> {isSimulating ? 'Customer typing…' : 'Simulate Customer Reply'}
              </button>
            </div>
          </div>

          {/* Messages Thread Container */}
          <div
            style={{
              flex: 1,
              padding: '18px',
              overflowY: 'auto',
              background: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {activeMessages.length === 0 ? (
              <div style={{ margin: 'auto', textAlign: 'center', color: '#94a3b8' }}>
                <MessageCircle size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                <b style={{ fontSize: '12px', display: 'block' }}>No message history with {selectedContact?.name}</b>
                <span style={{ fontSize: '10px' }}>Start the conversation below using WhatsApp, SMS, or Email.</span>
              </div>
            ) : (
              activeMessages.map((m) => {
                const isOutbound = m.direction === 'outbound';
                return (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isOutbound ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '75%',
                        padding: '10px 14px',
                        borderRadius: isOutbound ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                        background: isOutbound
                          ? m.channel === 'whatsapp'
                            ? '#dcfce7'
                            : m.channel === 'sms'
                            ? '#e0f2fe'
                            : '#fef3c7'
                          : '#ffffff',
                        border: '1px solid',
                        borderColor: isOutbound
                          ? m.channel === 'whatsapp'
                            ? '#bbf7d0'
                            : m.channel === 'sms'
                            ? '#bae6fd'
                            : '#fde68a'
                          : '#e2e8f0',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        fontSize: '11px',
                        lineHeight: 1.5,
                        color: '#1e293b',
                      }}
                    >
                      {/* Channel Pill */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '4px',
                          gap: '12px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '8px',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            color: m.channel === 'whatsapp' ? '#15803d' : m.channel === 'sms' ? '#0369a1' : '#b45309',
                          }}
                        >
                          {m.channel}
                        </span>
                        <span style={{ fontSize: '8px', color: '#94a3b8' }}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {m.subject && (
                        <b style={{ display: 'block', marginBottom: '4px', color: '#0f172a' }}>{m.subject}</b>
                      )}

                      <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{m.body}</p>

                      {/* Delivery Status Tick */}
                      {isOutbound && (
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            marginTop: '4px',
                            gap: '2px',
                            alignItems: 'center',
                          }}
                        >
                          {m.status === 'read' ? (
                            <span title="Read by recipient"><CheckCheck size={13} color="#0284c7" /></span>
                          ) : m.status === 'delivered' ? (
                            <span title="Delivered to device"><CheckCheck size={13} color="#94a3b8" /></span>
                          ) : (
                            <span title="Sent"><Check size={13} color="#94a3b8" /></span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Interactive Composer Footer */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid #edf2f4', background: '#ffffff' }}>
            {/* Quick Template Picker Drawer */}
            {showTemplates && (
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '10px',
                  marginBottom: '10px',
                  maxHeight: '150px',
                  overflowY: 'auto',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <b style={{ fontSize: '10px' }}>Choose Pre-approved Template:</b>
                  <button
                    onClick={() => setShowTemplates(false)}
                    style={{ fontSize: '10px', background: 'transparent', border: 0, cursor: 'pointer' }}
                  >
                    ×
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {templates
                    .filter((t) => t.channel === activeChannel)
                    .map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => handleInsertTemplate(tpl.body)}
                        style={{
                          textAlign: 'left',
                          padding: '6px 8px',
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '9px',
                        }}
                      >
                        <b>{tpl.name}</b>: {tpl.body.slice(0, 60)}…
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Channel Switcher Tabs */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 700 }}>Dispatch Channel:</span>
              {(['whatsapp', 'sms', 'email'] as const).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setActiveChannel(ch)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '9px',
                    border: '1px solid',
                    borderColor: activeChannel === ch ? '#0891b2' : '#cbd5e1',
                    background: activeChannel === ch ? '#e0f7fa' : '#ffffff',
                    color: activeChannel === ch ? '#006064' : '#475569',
                    cursor: 'pointer',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                >
                  {ch}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setShowTemplates(!showTemplates)}
                style={{
                  marginLeft: 'auto',
                  fontSize: '9px',
                  color: '#0891b2',
                  background: 'transparent',
                  border: 0,
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                + Insert Template
              </button>
            </div>

            {activeChannel === 'email' && (
              <input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Email Subject Line..."
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '11px',
                  marginBottom: '6px',
                  outline: 'none',
                }}
              />
            )}

            <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px' }}>
              <input
                value={textBody}
                onChange={(e) => setTextBody(e.target.value)}
                placeholder={`Type a message via ${activeChannel.toUpperCase()}...`}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '11px',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                className="cbtn primary"
                style={{ padding: '0 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Send size={14} /> Send
              </button>
            </form>
          </div>
        </section>

        {/* Right Column: Customer Info & Compliance Card */}
        <section
          className="panel"
          style={{
            margin: 0,
            padding: '16px',
            overflowY: 'auto',
            background: '#ffffff',
          }}
        >
          <div style={{ textAlign: 'center', paddingBottom: '14px', borderBottom: '1px solid #e2e8f0' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: '#e0f2fe',
                color: '#0284c7',
                margin: '0 auto 8px',
                display: 'grid',
                placeItems: 'center',
                fontSize: '18px',
                fontWeight: 800,
              }}
            >
              {selectedContact?.name?.[0] || 'C'}
            </div>
            <b style={{ fontSize: '14px', display: 'block', color: '#0f172a' }}>{selectedContact?.name}</b>
            <span style={{ fontSize: '10px', color: '#64748b' }}>{selectedContact?.job_title || 'Customer Profile'}</span>
          </div>

          <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '10px' }}>
            <div>
              <small style={{ color: '#94a3b8', display: 'block' }}>PHONE</small>
              <b style={{ color: '#0f172a' }}>{selectedContact?.mobile || '—'}</b>
            </div>

            <div>
              <small style={{ color: '#94a3b8', display: 'block' }}>EMAIL</small>
              <b style={{ color: '#0f172a' }}>{selectedContact?.email || '—'}</b>
            </div>

            <div>
              <small style={{ color: '#94a3b8', display: 'block' }}>ORGANIZATION</small>
              <b style={{ color: '#0f172a' }}>{selectedContact?.company || '—'}</b>
            </div>

            <div>
              <small style={{ color: '#94a3b8', display: 'block' }}>LOCATION</small>
              <b style={{ color: '#0f172a' }}>{selectedContact?.city || '—'}</b>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
              <small style={{ color: '#94a3b8', display: 'block', marginBottom: '4px' }}>OPT-IN CONSENT STATUS</small>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ color: selectedContact?.whatsapp_consent ? '#15803d' : '#94a3b8' }}>
                  {selectedContact?.whatsapp_consent ? '✓' : '✗'} WhatsApp Cloud Opt-in
                </span>
                <span style={{ color: selectedContact?.sms_consent ? '#0284c7' : '#94a3b8' }}>
                  {selectedContact?.sms_consent ? '✓' : '✗'} Carrier SMS Opt-in
                </span>
                <span style={{ color: selectedContact?.email_consent ? '#0d9488' : '#94a3b8' }}>
                  {selectedContact?.email_consent ? '✓' : '✗'} Promotional Email Opt-in
                </span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
              <small style={{ color: '#94a3b8', display: 'block', marginBottom: '4px' }}>ASSIGNED TAGS</small>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {selectedContact?.tags.map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: '8px',
                      background: '#f1f5f9',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      color: '#475569',
                    }}
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            {selectedContact?.notes && (
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                <small style={{ color: '#94a3b8', display: 'block', marginBottom: '2px' }}>CUSTOMER NOTES</small>
                <p style={{ margin: 0, fontSize: '9px', color: '#475569', lineHeight: 1.4 }}>
                  {selectedContact.notes}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </CommercialShell>
  );
};

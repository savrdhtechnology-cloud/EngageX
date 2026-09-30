import React, { useState, useMemo } from 'react';
import {
  Megaphone,
  Plus,
  Play,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  MessageSquareText,
  Mail,
  ArrowRight,
  Sparkles,
  Users,
  Send,
  Trash2,
  Copy,
  ChevronRight,
} from 'lucide-react';
import { CommercialShell } from './CommercialShell';
import { useApp } from '../context/AppContext';
import { Campaign, ChannelType } from '../types';

export const CampaignsView: React.FC = () => {
  const { campaigns, contacts, addCampaign, queueCampaign, updateCampaign, deleteCampaign } = useApp();

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [notice, setNotice] = useState<string>('');

  // Wizard form state
  const [name, setName] = useState('');
  const [objective, setObjective] = useState('');
  const [targetAudience, setTargetAudience] = useState('all');
  const [channels, setChannels] = useState<ChannelType[]>(['whatsapp']);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sendMode, setSendMode] = useState<'now' | 'schedule' | 'draft'>('now');
  const [scheduledAt, setScheduledAt] = useState('');

  // Metrics
  const counts = useMemo(() => {
    return {
      draft: campaigns.filter((c) => c.status === 'draft').length,
      scheduled: campaigns.filter((c) => c.status === 'scheduled').length,
      running: campaigns.filter((c) => c.status === 'running').length,
      completed: campaigns.filter((c) => c.status === 'completed').length,
    };
  }, [campaigns]);

  // Filtered campaigns
  const filteredCampaigns = useMemo(() => {
    if (filterStatus === 'all') return campaigns;
    return campaigns.filter((c) => c.status === filterStatus);
  }, [campaigns, filterStatus]);

  // Audience calculation
  const audienceCount = useMemo(() => {
    let pool = contacts.filter((c) => c.status === 'active');
    if (targetAudience !== 'all') {
      pool = pool.filter((c) => c.tags.includes(targetAudience));
    }
    // Filter by consent
    const eligible = pool.filter((c) => {
      return channels.some((ch) => {
        if (ch === 'whatsapp') return c.whatsapp_consent;
        if (ch === 'sms') return c.sms_consent;
        if (ch === 'email') return c.email_consent;
        return false;
      });
    });
    return eligible.length;
  }, [contacts, targetAudience, channels]);

  const handleOpenWizard = () => {
    setName('');
    setObjective('');
    setTargetAudience('all');
    setChannels(['whatsapp']);
    setSubject('');
    setBody('Hello {{first_name}}, special festive celebration at {{company}}! Check out our new update: https://savrdh.com');
    setSendMode('now');
    setScheduledAt('');
    setWizardStep(1);
    setIsWizardOpen(true);
  };

  const handleToggleChannel = (ch: ChannelType) => {
    setChannels((prev) => (prev.includes(ch) ? (prev.length > 1 ? prev.filter((x) => x !== ch) : prev) : [...prev, ch]));
  };

  const insertVariable = (variable: string) => {
    setBody((prev) => prev + ` {{${variable}}}`);
  };

  const handleCreateCampaign = () => {
    if (!name.trim()) return;

    addCampaign({
      name,
      objective: objective || 'Omnichannel communication broadcast',
      channels,
      status: sendMode === 'now' ? 'running' : sendMode === 'schedule' ? 'scheduled' : 'draft',
      subject: channels.includes('email') ? subject : undefined,
      body,
      send_mode: sendMode,
      scheduled_at: sendMode === 'schedule' && scheduledAt ? scheduledAt : null,
      target_audience: targetAudience === 'all' ? 'All eligible contacts' : `Tags: #${targetAudience}`,
    });

    setNotice(
      sendMode === 'now'
        ? `Campaign "${name}" has been launched! Real-time dispatch is running.`
        : `Campaign "${name}" saved.`
    );
    setIsWizardOpen(false);
  };

  return (
    <CommercialShell
      title="Campaign Management"
      subtitle="Broadcast targeted communications across WhatsApp, SMS and Email with regulatory consent compliance."
    >
      {notice && (
        <div className="notice" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{notice}</span>
          <button onClick={() => setNotice('')} style={{ background: 'transparent', border: 0, cursor: 'pointer' }}>×</button>
        </div>
      )}

      {/* Toolbar */}
      <div className="commercialToolbar">
        <div className="leftActions" style={{ display: 'flex', gap: '6px' }}>
          {['all', 'running', 'completed', 'scheduled', 'draft'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={filterStatus === st ? 'filterPill active' : 'filterPill'}
              style={{
                cursor: 'pointer',
                background: filterStatus === st ? '#0891b2' : '#eefbfe',
                color: filterStatus === st ? '#ffffff' : '#0a7891',
                border: '1px solid #cceef4',
                textTransform: 'capitalize',
              }}
            >
              {st} {st !== 'all' && `(${campaigns.filter((c) => c.status === st).length})`}
            </button>
          ))}
        </div>
        <button
          className="cbtn primary"
          onClick={handleOpenWizard}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={15} /> Create Campaign
        </button>
      </div>

      {/* Metric Grid */}
      <div className="metricGrid">
        <article>
          <span>DRAFT</span>
          <strong>{counts.draft}</strong>
          <small>Unpublished campaigns</small>
        </article>
        <article>
          <span>SCHEDULED</span>
          <strong>{counts.scheduled}</strong>
          <small>Upcoming automated broadcasts</small>
        </article>
        <article>
          <span>QUEUED / RUNNING</span>
          <strong style={{ color: '#0284c7' }}>{counts.running}</strong>
          <small>Active dispatch queue</small>
        </article>
        <article>
          <span>COMPLETED</span>
          <strong style={{ color: '#059669' }}>{counts.completed}</strong>
          <small>Finished with delivery logs</small>
        </article>
      </div>

      {/* Campaigns Table */}
      <section className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div>
            <h3>Campaign Directory</h3>
            <p>Monitor multi-channel delivery rates, message throughput, and dispatch statuses.</p>
          </div>
          <span style={{ fontSize: '10px', color: '#64748b' }}>
            {filteredCampaigns.length} campaigns listed
          </span>
        </div>

        {filteredCampaigns.length === 0 ? (
          <div className="emptyBox">
            <div>
              <Megaphone size={32} style={{ margin: '0 auto 10px', color: '#94a3b8' }} />
              <b>No campaigns found in this view</b>
              <p>Create your first multi-channel campaign using the step-by-step wizard.</p>
              <button
                className="cbtn primary"
                onClick={handleOpenWizard}
                style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={14} /> New Campaign
              </button>
            </div>
          </div>
        ) : (
          <div className="responsiveTable">
            <table className="dataTable">
              <thead>
                <tr>
                  <th>Campaign Name & Objective</th>
                  <th>Channels</th>
                  <th>Audience</th>
                  <th>Sent / Delivered</th>
                  <th>Read / Open</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.map((c) => {
                  const deliveryPct = c.sent_count > 0 ? Math.round((c.delivered_count / c.sent_count) * 100) : null;
                  return (
                    <tr key={c.id}>
                      <td>
                        <b>{c.name}</b>
                        <small className="cellSub">{c.objective || 'Broadcast'}</small>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {c.channels.map((ch) => (
                            <span
                              key={ch}
                              style={{
                                fontSize: '8px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: ch === 'whatsapp' ? '#dcfce7' : ch === 'sms' ? '#e0f2fe' : '#fef3c7',
                                color: ch === 'whatsapp' ? '#15803d' : ch === 'sms' ? '#0369a1' : '#b45309',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                              }}
                            >
                              {ch}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '10px' }}>{c.target_audience}</span>
                      </td>
                      <td>
                        <b>{c.delivered_count.toLocaleString()}</b>
                        <small className="cellSub">
                          {c.sent_count > 0 ? `of ${c.sent_count.toLocaleString()} (${deliveryPct}%)` : 'Not sent yet'}
                        </small>
                      </td>
                      <td>
                        <b>{c.read_count.toLocaleString()}</b>
                        <small className="cellSub">Read / Opened</small>
                      </td>
                      <td>
                        <span
                          className="status"
                          style={{
                            background:
                              c.status === 'completed'
                                ? '#dcfce7'
                                : c.status === 'running'
                                ? '#dbeafe'
                                : c.status === 'scheduled'
                                ? '#fef3c7'
                                : '#f1f5f9',
                            color:
                              c.status === 'completed'
                                ? '#15803d'
                                : c.status === 'running'
                                ? '#1d4ed8'
                                : c.status === 'scheduled'
                                ? '#b45309'
                                : '#475569',
                          }}
                        >
                          {c.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          {['draft', 'scheduled', 'paused'].includes(c.status) && (
                            <button
                              className="tableAction"
                              onClick={() => queueCampaign(c.id)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                background: '#0891b2',
                                color: '#ffffff',
                                padding: '3px 7px',
                                borderRadius: '5px',
                              }}
                            >
                              <Play size={10} fill="currentColor" /> Queue
                            </button>
                          )}
                          {c.status === 'running' && (
                            <span
                              style={{
                                fontSize: '8px',
                                background: '#e0f2fe',
                                color: '#0284c7',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: 700,
                              }}
                            >
                              Dispatching...
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 6-Step Multi-channel Campaign Wizard */}
      {isWizardOpen && (
        <div className="modalBackdrop">
          <div className="modalCard" style={{ maxWidth: '780px' }}>
            <div className="modalHead">
              <div>
                <small>CAMPAIGN WIZARD · STEP {wizardStep} OF 4</small>
                <h3>Create Multi-Channel Campaign</h3>
              </div>
              <button onClick={() => setIsWizardOpen(false)}>×</button>
            </div>

            {/* Stepper Navigation */}
            <div className="stepFlow" style={{ marginBottom: '20px' }}>
              <span style={{ background: wizardStep >= 1 ? '#0891b2' : '#eefbfe', color: wizardStep >= 1 ? '#ffffff' : '#0b7891' }}>
                1 Campaign Details
              </span>
              <i>→</i>
              <span style={{ background: wizardStep >= 2 ? '#0891b2' : '#eefbfe', color: wizardStep >= 2 ? '#ffffff' : '#0b7891' }}>
                2 Channels & Audience
              </span>
              <i>→</i>
              <span style={{ background: wizardStep >= 3 ? '#0891b2' : '#eefbfe', color: wizardStep >= 3 ? '#ffffff' : '#0b7891' }}>
                3 Message Content
              </span>
              <i>→</i>
              <span style={{ background: wizardStep >= 4 ? '#0891b2' : '#eefbfe', color: wizardStep >= 4 ? '#ffffff' : '#0b7891' }}>
                4 Schedule & Dispatch
              </span>
            </div>

            {/* Step 1: Details */}
            {wizardStep === 1 && (
              <div className="formGrid">
                <div className="field full">
                  <label>Campaign Name *</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Diwali Mega Sale Announcement 2026"
                  />
                </div>
                <div className="field full">
                  <label>Campaign Objective</label>
                  <input
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    placeholder="e.g. Promote 30% discount to retail and enterprise accounts"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Channels & Audience */}
            {wizardStep === 2 && (
              <div className="formGrid">
                <div className="field full">
                  <label>Select Delivery Channels</label>
                  <div className="channelChecks">
                    <label>
                      <input
                        type="checkbox"
                        checked={channels.includes('whatsapp')}
                        onChange={() => handleToggleChannel('whatsapp')}
                      />
                      WhatsApp Business Cloud API
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={channels.includes('sms')}
                        onChange={() => handleToggleChannel('sms')}
                      />
                      Carrier SMS (DLT Header)
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={channels.includes('email')}
                        onChange={() => handleToggleChannel('email')}
                      />
                      Rich Email (Resend)
                    </label>
                  </div>
                </div>

                <div className="field full">
                  <label>Target Audience Segment</label>
                  <select value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)}>
                    <option value="all">All Opted-in Contacts (Across entire workspace)</option>
                    <option value="hot lead">Hot Leads (#hot lead)</option>
                    <option value="vip">VIP Accounts (#vip)</option>
                    <option value="enterprise">Enterprise Decision Makers (#enterprise)</option>
                    <option value="retail">Retail Clients (#retail)</option>
                  </select>
                </div>

                <div className="field full">
                  <div
                    style={{
                      background: '#e0f7fa',
                      border: '1px solid #b2ebf2',
                      borderRadius: '10px',
                      padding: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <Users size={20} color="#00838f" />
                    <div>
                      <b style={{ fontSize: '11px', color: '#006064' }}>
                        Estimated Reach: {audienceCount} contacts
                      </b>
                      <p style={{ margin: 0, fontSize: '9px', color: '#00838f' }}>
                        Filtered by channel consent. Contacts without opt-in will be automatically excluded to prevent spam violations.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Message */}
            {wizardStep === 3 && (
              <div className="formGrid">
                {channels.includes('email') && (
                  <div className="field full">
                    <label>Email Subject Line *</label>
                    <input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Exclusive Festive Offer from {{company}}"
                    />
                  </div>
                )}

                <div className="field full">
                  <label>Message Content</label>
                  <textarea
                    rows={5}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Type your message here..."
                  />
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '6px', flexWrap: 'wrap' }}>
                    <small style={{ fontSize: '9px', color: '#64748b' }}>Quick insert variables:</small>
                    {['first_name', 'company', 'mobile', 'city'].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => insertVariable(v)}
                        style={{
                          fontSize: '8px',
                          background: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          borderRadius: '4px',
                          padding: '2px 6px',
                          cursor: 'pointer',
                        }}
                      >
                        +{`{{${v}}}`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="field full">
                  <div className="previewCard">
                    <b>Live Render Preview:</b>
                    <p>
                      {body
                        .replaceAll('{{first_name}}', 'Aarav')
                        .replaceAll('{{company}}', 'TechCorp India')
                        .replaceAll('{{mobile}}', '+91 98765 43210')
                        .replaceAll('{{city}}', 'Bengaluru') || 'Your message preview will appear here.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Schedule & Review */}
            {wizardStep === 4 && (
              <div className="formGrid">
                <div className="field">
                  <label>Dispatch Mode</label>
                  <select value={sendMode} onChange={(e) => setSendMode(e.target.value as any)}>
                    <option value="now">Send Immediately (Instant Blast)</option>
                    <option value="schedule">Schedule for Future Time</option>
                    <option value="draft">Save as Draft (Do Not Send)</option>
                  </select>
                </div>

                <div className="field">
                  <label>Scheduled Date & Time</label>
                  <input
                    type="datetime-local"
                    disabled={sendMode !== 'schedule'}
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                  />
                </div>

                <div className="field full">
                  <div className="reviewBox">
                    <b>Ready to Launch Campaign</b>
                    <span>
                      "{name || 'Untitled'}" · {channels.join(', ').toUpperCase()} · {audienceCount} recipients
                    </span>
                    <small>
                      Execution is managed through the Savrdh EngageX gateway. Delivery logs and read receipts will appear live on the dashboard.
                    </small>
                  </div>
                </div>
              </div>
            )}

            <div className="modalActions" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
              <div>
                {wizardStep > 1 && (
                  <button className="cbtn secondary" onClick={() => setWizardStep((s) => s - 1)}>
                    ← Back
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="cbtn secondary" onClick={() => setIsWizardOpen(false)}>
                  Cancel
                </button>
                {wizardStep < 4 ? (
                  <button
                    className="cbtn primary"
                    onClick={() => {
                      if (wizardStep === 1 && !name.trim()) return;
                      setWizardStep((s) => s + 1);
                    }}
                  >
                    Next Step →
                  </button>
                ) : (
                  <button className="cbtn primary" onClick={handleCreateCampaign}>
                    {sendMode === 'now' ? 'Dispatch Now 🚀' : 'Confirm Campaign'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </CommercialShell>
  );
};

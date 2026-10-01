import React, { useState, useMemo, useEffect } from 'react';
import {
  MessageSquareText,
  Plus,
  Trash2,
  Copy,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  Smartphone,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { CommercialShell } from './CommercialShell';
import { useApp } from '../context/AppContext';
import { Template, ChannelType } from '../types';
import { COMPANY_TEMPLATE_VARIABLES, CONTACT_TEMPLATE_VARIABLES, personalizeMessage, renderCompanyMessage, resolveWorkspaceBranding, templateVariables } from '../lib/workspaceBranding';

const ALLOWED_VARS: readonly string[] = [...CONTACT_TEMPLATE_VARIABLES,...COMPANY_TEMPLATE_VARIABLES,'order_id','delivery_date','tracking_url','otp','discount_percent','offer_url','blog_url'];

export const TemplatesView: React.FC = () => {
  const { templates, contacts, activeWorkspace, workspaceSettings, addTemplate, updateTemplate, deleteTemplate } = useApp();
  const branding=resolveWorkspaceBranding(activeWorkspace,workspaceSettings);

  const [activeChannel, setActiveChannel] = useState<'all' | ChannelType>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState<Template | null>(templates[0] || null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  // Form
  const [name, setName] = useState('');
  const [channel, setChannel] = useState<ChannelType>('whatsapp');
  const [category, setCategory] = useState<Template['category']>('Marketing');
  const [dltTemplateId, setDltTemplateId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  useEffect(()=>{setSelectedPreview(prev=>templates.find(t=>t.id===prev?.id)||templates[0]||null);},[templates,activeWorkspace?.id]);
  useEffect(()=>{setIsModalOpen(false);setEditingTemplate(null);setError('');},[activeWorkspace?.id]);

  const filteredTemplates = useMemo(() => {
    if (activeChannel === 'all') return templates;
    return templates.filter((t) => t.channel === activeChannel);
  }, [templates, activeChannel]);

  const channelCounts = useMemo(() => {
    return {
      whatsapp: templates.filter((t) => t.channel === 'whatsapp').length,
      sms: templates.filter((t) => t.channel === 'sms').length,
      email: templates.filter((t) => t.channel === 'email').length,
    };
  }, [templates]);

  const extractVariables = templateVariables;

  const openEditor = (template: Template) => {
    setEditingTemplate(template);
    setName(template.name);
    setChannel(template.channel);
    setCategory(template.category);
    setDltTemplateId(template.dlt_template_id || '');
    setSubject(template.subject || '');
    setBody(template.body);
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    try {
    e.preventDefault();
    if (!name.trim() || !body.trim()) {
      setError('Template name and content body are required.');
      return;
    }

    const vars = extractVariables(subject+'\n'+body);
    const unapproved = vars.filter((v) => !ALLOWED_VARS.includes(v));
    if (unapproved.length > 0) {
      setError(`Unsupported variables: ${unapproved.join(', ')}. Use supported tags like {{first_name}}, {{company}}`);
      return;
    }

    const payload = {
      name: name.toLowerCase().replace(/\s+/g, '_'),
      channel,
      category,
      status: 'draft' as const,
      dlt_template_id: channel === 'sms' ? dltTemplateId || undefined : undefined,
      subject: channel === 'email' ? subject : undefined,
      body,
      variables: vars,
    };

    if (editingTemplate) {
      await updateTemplate(editingTemplate.id, payload);
      setSelectedPreview({ ...editingTemplate, ...payload });
      setNotice(`Template "${name}" updated.`);
    } else {
      await addTemplate(payload);
      setNotice(`Template "${name}" saved as a draft.`);
    }
    setIsModalOpen(false);
    setName('');
    setBody('');
    setSubject('');
    setEditingTemplate(null);
    setError('');
    } catch (error) { setError(error instanceof Error?error.message:'Could not save the template.'); }
  };

  return (
    <CommercialShell
      title="Communication Templates"
      subtitle="Meta WhatsApp Business, Carrier SMS (DLT), and HTML Email templates library."
    >
      {error && <div className="notice errorNotice">{error}</div>}
      {notice && <div className="notice">{notice}</div>}

      {/* Toolbar */}
      <div className="commercialToolbar">
        <div className="leftActions" style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setActiveChannel('all')}
            className={activeChannel === 'all' ? 'filterPill active' : 'filterPill'}
            style={{
              background: activeChannel === 'all' ? '#0891b2' : '#eefbfe',
              color: activeChannel === 'all' ? '#ffffff' : '#0a7891',
              cursor: 'pointer',
            }}
          >
            All Templates ({templates.length})
          </button>
          <button
            onClick={() => setActiveChannel('whatsapp')}
            className={activeChannel === 'whatsapp' ? 'filterPill active' : 'filterPill'}
            style={{
              background: activeChannel === 'whatsapp' ? '#0891b2' : '#eefbfe',
              color: activeChannel === 'whatsapp' ? '#ffffff' : '#0a7891',
              cursor: 'pointer',
            }}
          >
            WhatsApp ({channelCounts.whatsapp})
          </button>
          <button
            onClick={() => setActiveChannel('sms')}
            className={activeChannel === 'sms' ? 'filterPill active' : 'filterPill'}
            style={{
              background: activeChannel === 'sms' ? '#0891b2' : '#eefbfe',
              color: activeChannel === 'sms' ? '#ffffff' : '#0a7891',
              cursor: 'pointer',
            }}
          >
            SMS DLT ({channelCounts.sms})
          </button>
          <button
            onClick={() => setActiveChannel('email')}
            className={activeChannel === 'email' ? 'filterPill active' : 'filterPill'}
            style={{
              background: activeChannel === 'email' ? '#0891b2' : '#eefbfe',
              color: activeChannel === 'email' ? '#ffffff' : '#0a7891',
              cursor: 'pointer',
            }}
          >
            Email ({channelCounts.email})
          </button>
        </div>

        <button
          className="cbtn primary"
          onClick={() => {
            setEditingTemplate(null);
            setName('');
            setBody('');
            setSubject('');
            setError('');
            setIsModalOpen(true);
          }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={15} /> New Template
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '16px' }}>
        {/* Templates Directory */}
        <section className="panel" style={{ margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div>
              <h3>Template Library</h3>
              <p>Standardized templates ensure message deliverability and telecom compliance.</p>
            </div>
            <span style={{ fontSize: '10px', color: '#64748b' }}>{filteredTemplates.length} records</span>
          </div>

          <div className="responsiveTable">
            <table className="dataTable">
              <thead>
                <tr>
                  <th>Template Name</th>
                  <th>Channel & Category</th>
                  <th>DLT / Status</th>
                  <th>Variables</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTemplates.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedPreview(t)}
                    style={{
                      cursor: 'pointer',
                      background: selectedPreview?.id === t.id ? '#f0fdfa' : 'transparent',
                    }}
                  >
                    <td>
                      <b>{t.name}</b>
                      <small className="cellSub">{t.body.slice(0, 50)}…</small>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span
                          style={{
                            fontSize: '8px',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            color: t.channel === 'whatsapp' ? '#15803d' : t.channel === 'sms' ? '#0369a1' : '#b45309',
                          }}
                        >
                          {t.channel}
                        </span>
                        <small className="cellSub">{t.category}</small>
                      </div>
                    </td>
                    <td>
                      <span className="status" style={{ background: '#dcfce7', color: '#15803d' }}>
                        APPROVED
                      </span>
                      {t.dlt_template_id && <small className="cellSub">ID: {t.dlt_template_id}</small>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap' }}>
                        {t.variables.map((v) => (
                          <code key={v} style={{ fontSize: '7px', background: '#e0f2fe', color: '#0369a1', padding: '1px 4px', borderRadius: '3px' }}>
                            {`{{${v}}}`}
                          </code>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          className="tableAction"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPreview(t);
                          }}
                        >
                          Preview
                        </button>
                        <button
                          className="tableAction"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditor(t);
                          }}
                        >
                          Customize
                        </button>
                        <button
                          className="tableAction dangerText"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete template ${t.name}?`)) deleteTemplate(t.id);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Live Device / Screen Mockup Preview */}
        <section className="panel" style={{ margin: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '100%', marginBottom: '14px', borderBottom: '1px solid #edf2f4', paddingBottom: '8px' }}>
            <small style={{ fontSize: '8px', color: '#7e95a3', fontWeight: 800 }}>LIVE RENDERING PREVIEW</small>
            <h3 style={{ margin: '3px 0 0', fontSize: '15px' }}>{selectedPreview?.name || 'Template Preview'}</h3>
          </div>

          {selectedPreview?.channel === 'whatsapp' ? (
            /* WhatsApp Smartphone Mockup */
            <div
              style={{
                width: '280px',
                background: '#075e54',
                borderRadius: '32px',
                padding: '12px 10px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.18)',
                border: '6px solid #1f2937',
              }}
            >
              <div
                style={{
                  background: '#075e54',
                  color: '#ffffff',
                  padding: '8px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderRadius: '16px 16px 0 0',
                }}
              >
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#25d366', display: 'grid', placeItems: 'center' }}>
                  <Sparkles size={14} color="#ffffff" />
                </div>
                <div>
                  <b style={{ fontSize: '10px', display: 'block' }}>Savrdh EngageX Official</b>
                  <small style={{ fontSize: '7px', color: '#bbf7d0' }}>Verified Business Account ✓</small>
                </div>
              </div>

              <div
                style={{
                  background: '#efeae2',
                  minHeight: '260px',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                }}
              >
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: '8px 8px 8px 2px',
                    padding: '10px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    fontSize: '10px',
                    lineHeight: 1.5,
                    color: '#111827',
                  }}
                >
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                    {renderCompanyMessage(selectedPreview.body,contacts[0],branding)}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px', fontSize: '8px', color: '#6b7280' }}>
                    10:45 AM ✓✓
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Email / SMS Card Mockup */
            <div
              style={{
                width: '100%',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '14px',
                overflow: 'hidden',
                boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
              }}
            >
              <div style={{ background: '#f8fafc', padding: '10px 14px', borderBottom: '1px solid #e2e8f0', fontSize: '10px' }}>
                <div><b style={{ color: '#64748b' }}>Channel:</b> <span style={{ textTransform: 'uppercase', fontWeight: 800 }}>{selectedPreview?.channel}</span></div>
                {selectedPreview?.subject && (
                  <div style={{ marginTop: '4px' }}>
                    <b style={{ color: '#64748b' }}>Subject:</b> {personalizeMessage(selectedPreview.subject,contacts[0],branding)}
                  </div>
                )}
                {selectedPreview?.dlt_template_id && (
                  <div style={{ marginTop: '4px' }}>
                    <b style={{ color: '#64748b' }}>DLT Template:</b> {selectedPreview.dlt_template_id}
                  </div>
                )}
              </div>
              <div style={{ padding: '16px', fontSize: '11px', lineHeight: 1.6, color: '#334155', minHeight: '180px', whiteSpace: 'pre-wrap' }}>
                {selectedPreview&&renderCompanyMessage(selectedPreview.body,contacts[0],branding)}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* New Template Modal */}
      {isModalOpen && (
        <div className="modalBackdrop">
          <div className="modalCard" style={{ maxWidth: '640px' }}>
            <div className="modalHead">
              <div>
                <small>{editingTemplate ? 'TEMPLATE EDITOR' : 'TEMPLATE BUILDER'}</small>
                <h3>{editingTemplate ? 'Customize Communication Template' : 'Create Reusable Communication Template'}</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleSave}>
              <div className="formGrid">
                <div className="field">
                  <label>Template Identifier *</label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. whatsapp_diwali_flash_sale"
                  />
                </div>

                <div className="field">
                  <label>Target Channel</label>
                  <select value={channel} onChange={(e) => setChannel(e.target.value as ChannelType)}>
                    <option value="whatsapp">WhatsApp Business Platform</option>
                    <option value="sms">Carrier SMS (DLT Approved)</option>
                    <option value="email">Rich Email (Resend)</option>
                  </select>
                </div>

                <div className="field">
                  <label>Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value as any)}>
                    <option value="Marketing">Marketing / Promotional</option>
                    <option value="Utility">Utility / Transactional</option>
                    <option value="Authentication">Authentication / OTP</option>
                    <option value="Transactional">Transactional</option>
                  </select>
                </div>

                {channel === 'sms' && (
                  <div className="field">
                    <label>DLT Template ID (TRAI)</label>
                    <input
                      value={dltTemplateId}
                      onChange={(e) => setDltTemplateId(e.target.value)}
                      placeholder="e.g. 1407168923005"
                    />
                  </div>
                )}

                {channel === 'email' && (
                  <div className="field full">
                    <label>Email Subject Line *</label>
                    <input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Important Account Notification for {{first_name}}"
                    />
                  </div>
                )}

                <div className="field full">
                  <label>Message Content *</label>
                  <textarea
                    rows={5}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Hello {{first_name}}, welcome to {{company}}! ..."
                  />
                </div>
              </div>

              <div className="variableHelp" style={{ marginTop: '10px' }}>
                <b>Supported Tags:</b>
                {ALLOWED_VARS.map((v) => (
                  <code
                    key={v}
                    onClick={() => setBody((b) => b + ` {{${v}}}`)}
                    style={{ cursor: 'pointer' }}
                    title="Click to insert"
                  >
                    {`{{${v}}}`}
                  </code>
                ))}
              </div>

              <div className="modalActions">
                <button type="button" className="cbtn secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="cbtn primary">
                  {editingTemplate ? 'Save Changes' : 'Save & Validate Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </CommercialShell>
  );
};

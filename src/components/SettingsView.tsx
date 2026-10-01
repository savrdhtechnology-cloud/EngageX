import React, { useState, useMemo, useEffect } from 'react';
import {
  Settings,
  Building,
  ShieldCheck,
  RotateCcw,
  Search,
  CheckCircle2,
  Clock,
  User,
  Key,
} from 'lucide-react';
import { CommercialShell } from './CommercialShell';
import { useApp } from '../context/AppContext';

export const SettingsView: React.FC = () => {
  const { auditLogs, resetToDefaults, addAuditLog, workspaceSettings, saveWorkspaceSettings } = useApp();

  const saved = workspaceSettings || {};
  const [timezone, setTimezone] = useState(saved.timezone || 'Asia/Kolkata');
  const [workspaceName, setWorkspaceName] = useState(saved.workspaceName || 'Savrdh Technology Enterprise');
  const [supportEmail, setSupportEmail] = useState(saved.supportEmail || 'support@savrdh.com');
  const [dltEntityId, setDltEntityId] = useState(saved.dltEntityId || '110156982300001');
  const [senderHeader, setSenderHeader] = useState(saved.senderHeader || 'SVRDTC');
  const [optOutKeyword, setOptOutKeyword] = useState(saved.optOutKeyword || 'STOP');
  const [whatsappGroupLink, setWhatsappGroupLink] = useState(saved.whatsappGroupLink || 'https://chat.whatsapp.com/KdCB01biJWTH6ihxLjFO8O');
  const [whatsappInviteMessage, setWhatsappInviteMessage] = useState(saved.whatsappInviteMessage || `Namaste {{first_name}} ji,\n\nAKBS Poultry Farming Private Limited se aapko hamare official WhatsApp updates group me join karne ka invite hai.\n\n*Join Group:* {{group_link}}\n\nYahan aapko project updates, process information aur important notices milenge.\n\nDhanyavaad,\n*AKBS Poultry Farming Private Limited*`);
  const [auditSearch, setAuditSearch] = useState('');
  const [notice, setNotice] = useState('');

  const filteredLogs = useMemo(() => {
    if (!auditSearch) return auditLogs;
    const q = auditSearch.toLowerCase();
    return auditLogs.filter(
      (log) =>
        log.action.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.user_email.toLowerCase().includes(q)
    );
  }, [auditLogs, auditSearch]);

  useEffect(() => {
    setWorkspaceName(saved.workspaceName || ''); setSupportEmail(saved.supportEmail || '');
    setDltEntityId(saved.dltEntityId || ''); setSenderHeader(saved.senderHeader || '');
    setOptOutKeyword(saved.optOutKeyword || 'STOP'); setTimezone(saved.timezone || 'Asia/Kolkata');
    setWhatsappGroupLink(saved.whatsappGroupLink || 'https://chat.whatsapp.com/KdCB01biJWTH6ihxLjFO8O');
    setWhatsappInviteMessage(saved.whatsappInviteMessage || `Namaste {{first_name}} ji,\n\nAKBS Poultry Farming Private Limited se aapko hamare official WhatsApp updates group me join karne ka invite hai.\n\n*Join Group:* {{group_link}}\n\nYahan aapko project updates, process information aur important notices milenge.\n\nDhanyavaad,\n*AKBS Poultry Farming Private Limited*`);
  }, [workspaceSettings]);
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!saveWorkspaceSettings) throw new Error('Workspace is unavailable.');
      await saveWorkspaceSettings({...saved,workspaceName,supportEmail,dltEntityId,senderHeader,optOutKeyword,timezone,whatsappGroupLink,whatsappInviteMessage});
      setNotice('Workspace settings saved to the database.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Settings could not be saved.'); }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset workspace data to demo defaults? All custom changes will be restored.')) {
      resetToDefaults();
      setNotice('Demo reset is disabled for the live database.');
    }
  };

  return (
    <CommercialShell
      title="Settings & Audit Trail"
      subtitle="Workspace profile, TRAI DLT telecom headers, and system security activity logs."
    >
      {notice && <div className="notice">{notice}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
        {/* Workspace Configuration */}
        <section className="panel" style={{ margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Building size={18} color="#0891b2" />
            <h3 style={{ margin: 0 }}>Workspace Profile</h3>
          </div>

          <form onSubmit={handleSaveProfile}>
            <div className="formGrid">
              <div className="field full">
                <label>Workspace Organization Name</label>
                <input
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                />
              </div>

              <div className="field">
                <label>Support Email Address</label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                />
              </div>

              <div className="field">
                <label>Timezone</label>
                <select value={timezone} onChange={e => setTimezone(e.target.value)}>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST - GMT+5:30)</option>
                  <option value="UTC">UTC (Universal Coordinated Time)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                </select>
              </div>

              <div className="field">
                <label>TRAI DLT Principal Entity ID</label>
                <input
                  value={dltEntityId}
                  onChange={(e) => setDltEntityId(e.target.value)}
                />
              </div>

              <div className="field">
                <label>Registered DLT Sender Header</label>
                <input
                  value={senderHeader}
                  onChange={(e) => setSenderHeader(e.target.value)}
                />
              </div>

              <div className="field full">
                <label>WhatsApp Group Invite Link</label>
                <input
                  value={whatsappGroupLink}
                  onChange={(e) => setWhatsappGroupLink(e.target.value)}
                  placeholder="https://chat.whatsapp.com/..."
                />
                <small className="fieldHint">Used by the manual WhatsApp invite workflow. No API is required.</small>
              </div>

              <div className="field full">
                <label>Default WhatsApp Group Invite Message</label>
                <textarea
                  rows={8}
                  value={whatsappInviteMessage}
                  onChange={(e) => setWhatsappInviteMessage(e.target.value)}
                />
                <small className="fieldHint">Supported placeholders: {"{{first_name}}"} and {"{{group_link}}"}. Keep the group link only once for a cleaner WhatsApp preview.</small>
              </div>

              <div className="field full">
                <label>Automatic Opt-Out Keywords</label>
                <input
                  value={optOutKeyword}
                  onChange={(e) => setOptOutKeyword(e.target.value)}
                  placeholder="e.g. STOP, UNSUBSCRIBE, CANCEL"
                />
                <small className="fieldHint">
                  When a customer replies with these keywords on WhatsApp or SMS, their consent is automatically flagged as unsubscribed.
                </small>
              </div>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="cbtn primary">
                Save Workspace Settings
              </button>
            </div>
          </form>
        </section>

        {/* System Diagnostics & Reset */}
        <section className="panel" style={{ margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <ShieldCheck size={18} color="#059669" />
              <h3 style={{ margin: 0 }}>System Health & Environment</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '10px', marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ color: '#64748b' }}>Platform:</span>
                <b>EngageX Enterprise v1.4</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ color: '#64748b' }}>Meta Graph API:</span>
                <b>v20.0 (Cloud API)</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ color: '#64748b' }}>Data Storage:</span>
                <b>Supabase · Savrdh Technology</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ color: '#64748b' }}>Delivery Uptime SLA:</span>
                <b style={{ color: '#059669' }}>Not monitored</b>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '24px', padding: '14px', background: '#fff1f2', borderRadius: '12px', border: '1px solid #fecdd3' }}>
            <b style={{ display: 'block', fontSize: '11px', color: '#9f1239', marginBottom: '4px' }}>
              Factory Demo Reset
            </b>
            <p style={{ margin: '0 0 10px', fontSize: '9px', color: '#be123c', lineHeight: 1.4 }}>
              Restore original preloaded Savrdh Technology contacts, campaigns, templates, and automations.
            </p>
            <button
              onClick={handleReset}
              className="cbtn secondary"
              style={{
                width: '100%',
                color: '#9f1239',
                borderColor: '#fda4af',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <RotateCcw size={13} /> Reset to Initial Demo Data
            </button>
          </div>
        </section>
      </div>

      {/* Audit Trail Section */}
      <section className="panel" style={{ marginTop: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div>
            <h3>Security & Compliance Audit Trail</h3>
            <p>Every campaign dispatch, contact modification, and role assignment is permanently journaled.</p>
          </div>
          <div style={{ position: 'relative', width: '240px' }}>
            <Search size={13} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              placeholder="Search audit trail..."
              style={{
                width: '100%',
                padding: '6px 8px 6px 26px',
                borderRadius: '8px',
                border: '1px solid #dce7ec',
                fontSize: '10px',
              }}
            />
          </div>
        </div>

        <div className="responsiveTable">
          <table className="dataTable">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action Code</th>
                <th>Resource</th>
                <th>Event Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <small style={{ color: '#64748b' }}>
                      {new Date(log.created_at).toLocaleString()}
                    </small>
                  </td>
                  <td><b>{log.user_email}</b></td>
                  <td>
                    <code
                      style={{
                        fontSize: '8px',
                        background: '#e0f2fe',
                        color: '#0369a1',
                        padding: '2px 5px',
                        borderRadius: '4px',
                        fontWeight: 700,
                      }}
                    >
                      {log.action}
                    </code>
                  </td>
                  <td>{log.resource_type}</td>
                  <td>{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </CommercialShell>
  );
};

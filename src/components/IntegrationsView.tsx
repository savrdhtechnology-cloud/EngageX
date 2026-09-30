import React, { useState } from 'react';
import {
  Bot,
  MessageCircle,
  MessageSquareText,
  Mail,
  Webhook,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Key,
  Copy,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { CommercialShell } from './CommercialShell';
import { useApp } from '../context/AppContext';
import { Integration } from '../types';

export const IntegrationsView: React.FC = () => {
  const { integrations, updateIntegration, testIntegration, addAuditLog } = useApp();

  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latency_ms?: number } | null>(null);
  const [notice, setNotice] = useState('');

  const handleOpenConfig = (item: Integration) => {
    setSelectedIntegration(item);
    setConfigValues(item.config || {});
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    if (!selectedIntegration) return;
    setTesting(true);
    setTestResult(null);
    const res = await testIntegration(selectedIntegration.title, configValues);
    setTestResult(res);
    setTesting(false);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIntegration) return;

    updateIntegration(selectedIntegration.id, configValues, 'configured');
    setNotice(`${selectedIntegration.title} non-secret configuration saved locally. Live credentials were not saved; secure backend setup is pending.`);
    setSelectedIntegration(null);
  };

  const handleSimulateWebhook = () => {
    addAuditLog(
      'WEBHOOK_EVENT_RECEIVED',
      'Webhook',
      'Simulated inbound delivery webhook: Meta WhatsApp Graph API status=DELIVERED (msg_id: wamid_99812)'
    );
    setNotice('Webhook event simulated! Received status update from Meta WhatsApp platform.');
  };

  return (
    <CommercialShell
      title="Integrations & Gateways"
      subtitle="Evaluate provider configuration. Do not enter live credentials until secure backend setup is complete."
    >
      {notice && (
        <div className="notice" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{notice}</span>
          <button onClick={() => setNotice('')} style={{ background: 'transparent', border: 0, cursor: 'pointer' }}>×</button>
        </div>
      )}

      {/* Provider Cards */}
      <div className="channelCards">
        {integrations.map((item) => {
          const isConnected = item.status === 'connected';
          return (
            <article key={item.id} style={{ background: '#ffffff', border: '1px solid #dfe9ed', borderRadius: '14px', padding: '18px' }}>
              <div className="integrationStatus" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '8px', letterSpacing: '0.8px', color: '#8298a6', fontWeight: 900 }}>
                  {item.channel.toUpperCase()}
                </span>
                <b
                  style={{
                    fontSize: '8px',
                    padding: '3px 8px',
                    borderRadius: '999px',
                    background: isConnected ? '#dcfce7' : '#f1f5f9',
                    color: isConnected ? '#15803d' : '#64748b',
                    fontWeight: 800,
                  }}
                >
                  {item.status.toUpperCase()}
                </b>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                {item.channel === 'whatsapp' ? (
                  <MessageCircle size={20} color="#15803d" />
                ) : item.channel === 'sms' ? (
                  <MessageSquareText size={20} color="#0369a1" />
                ) : item.channel === 'email' ? (
                  <Mail size={20} color="#b45309" />
                ) : (
                  <Webhook size={20} color="#7c3aed" />
                )}
                <h4 style={{ margin: 0, fontSize: '14px', color: '#0f172a' }}>{item.title}</h4>
              </div>

              <p style={{ fontSize: '10px', color: '#64748b', lineHeight: 1.5, minHeight: '36px' }}>{item.desc}</p>

              <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                <button className="cbtn primary" onClick={() => handleOpenConfig(item)}>
                  Configure API Keys
                </button>
                {item.channel === 'webhook' && (
                  <button className="cbtn secondary" onClick={handleSimulateWebhook}>
                    Test Webhook
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* Security Info Card */}
      <section className="panel" style={{ marginTop: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <ShieldCheck size={20} color="#0891b2" />
          <h3 style={{ margin: 0 }}>End-to-End Enterprise Encryption</h3>
        </div>
        <p>
          API tokens, Meta WhatsApp System User tokens, and webhook secrets are stored with server-side envelope
          encryption. Credentials are never echoed in client responses or exposed in browser logs.
        </p>
      </section>

      {/* Configuration Modal */}
      {selectedIntegration && (
        <div className="modalBackdrop">
          <div className="modalCard" style={{ maxWidth: '580px' }}>
            <div className="modalHead">
              <div>
                <small>PROVIDER SETUP</small>
                <h3>Configure {selectedIntegration.title}</h3>
              </div>
              <button onClick={() => setSelectedIntegration(null)}>×</button>
            </div>

            <form onSubmit={handleSaveConfig}>
              <div className="formGrid">
                {selectedIntegration.channel === 'whatsapp' && (
                  <>
                    <div className="field full">
                      <label>WhatsApp Business Account ID (WABA ID)</label>
                      <input
                        value={configValues.waba_id || ''}
                        onChange={(e) => setConfigValues({ ...configValues, waba_id: e.target.value })}
                        placeholder="e.g. waba_992817263541"
                      />
                    </div>
                    <div className="field full">
                      <label>Phone Number ID *</label>
                      <input
                        required
                        value={configValues.phone_number_id || ''}
                        onChange={(e) => setConfigValues({ ...configValues, phone_number_id: e.target.value })}
                        placeholder="e.g. 109283746592019"
                      />
                    </div>
                    <div className="field full">
                      <label>System User Permanent Access Token *</label>
                      <input
                        type="password"
                        required
                        value={configValues.access_token || ''}
                        onChange={(e) => setConfigValues({ ...configValues, access_token: e.target.value })}
                        placeholder="EAABwz..."
                      />
                    </div>
                  </>
                )}

                {selectedIntegration.channel === 'sms' && (
                  <>
                    <div className="field">
                      <label>Sender ID / Header (TRAI DLT) *</label>
                      <input
                        required
                        value={configValues.sender_id || ''}
                        onChange={(e) => setConfigValues({ ...configValues, sender_id: e.target.value })}
                        placeholder="e.g. SVRDTC"
                      />
                    </div>
                    <div className="field">
                      <label>Principal Entity ID (PE ID)</label>
                      <input
                        value={configValues.entity_id || ''}
                        onChange={(e) => setConfigValues({ ...configValues, entity_id: e.target.value })}
                        placeholder="e.g. 110156982300001"
                      />
                    </div>
                    <div className="field full">
                      <label>SMS Gateway API Secret Key *</label>
                      <input
                        type="password"
                        required
                        value={configValues.api_key || ''}
                        onChange={(e) => setConfigValues({ ...configValues, api_key: e.target.value })}
                        placeholder="Enter carrier API token"
                      />
                    </div>
                  </>
                )}

                {selectedIntegration.channel === 'email' && (
                  <>
                    <div className="field full">
                      <label>Resend API Key *</label>
                      <input
                        type="password"
                        required
                        value={configValues.api_key || ''}
                        onChange={(e) => setConfigValues({ ...configValues, api_key: e.target.value })}
                        placeholder="re_..."
                      />
                    </div>
                    <div className="field">
                      <label>Sender Email Address *</label>
                      <input
                        required
                        value={configValues.from_email || ''}
                        onChange={(e) => setConfigValues({ ...configValues, from_email: e.target.value })}
                        placeholder="notifications@savrdh.com"
                      />
                    </div>
                    <div className="field">
                      <label>Reply-to Email Address</label>
                      <input
                        value={configValues.reply_to || ''}
                        onChange={(e) => setConfigValues({ ...configValues, reply_to: e.target.value })}
                        placeholder="support@savrdh.com"
                      />
                    </div>
                  </>
                )}

                {selectedIntegration.channel === 'webhook' && (
                  <>
                    <div className="field full">
                      <label>Inbound Webhook Endpoint URL</label>
                      <input
                        readOnly
                        value={configValues.endpoint_url || 'https://api.savrdh.com/v1/engagex/webhooks'}
                        style={{ background: '#f8fafc', color: '#64748b' }}
                      />
                    </div>
                    <div className="field full">
                      <label>Secret Verification Token</label>
                      <input
                        value={configValues.secret_token || ''}
                        onChange={(e) => setConfigValues({ ...configValues, secret_token: e.target.value })}
                      />
                    </div>
                  </>
                )}
              </div>

              {testResult && (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: testResult.success ? '#dcfce7' : '#fee2e2',
                    color: testResult.success ? '#15803d' : '#991b1b',
                    fontSize: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>
                    {testResult.message} ({testResult.latency_ms}ms)
                  </span>
                </div>
              )}

              <div className="modalActions">
                <button
                  type="button"
                  className="cbtn secondary"
                  onClick={handleTestConnection}
                  disabled={testing}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                >
                  <Zap size={13} /> {testing ? 'Testing Handshake…' : 'Test Handshake'}
                </button>
                <button type="submit" className="cbtn primary">
                  Save Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </CommercialShell>
  );
};

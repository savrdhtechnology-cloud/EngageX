import React, { useState } from 'react';
import {
  Workflow,
  Plus,
  Play,
  CheckCircle2,
  Clock,
  ArrowRight,
  GitBranch,
  MessageCircle,
  MessageSquareText,
  Mail,
  Zap,
  Tag,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { CommercialShell } from './CommercialShell';
import { useApp } from '../context/AppContext';
import { Automation, AutomationStep } from '../types';

export const AutomationsView: React.FC = () => {
  const { automations, toggleAutomation, addAutomation, testAutomation, contacts } = useApp();

  const [selectedAuto, setSelectedAuto] = useState<Automation | null>(automations[0] || null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testContactId, setTestContactId] = useState(contacts[0]?.id || '');
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [isRunningTest, setIsRunningTest] = useState(false);

  // New automation modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTrigger, setNewTrigger] = useState('contact_created');
  const [newCondition, setNewCondition] = useState('whatsapp_consent == true');

  const handleStartTest = async () => {
    if (!selectedAuto || !testContactId) return;
    setIsRunningTest(true);
    setTestLogs(['[INIT] Starting automation runner engine...']);
    const logs = await testAutomation(selectedAuto.id, testContactId);
    setTestLogs(logs);
    setIsRunningTest(false);
  };

  const handleCreateAutomation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    addAutomation({
      name: newName,
      trigger_event: newTrigger,
      trigger_condition: newCondition,
      status: 'active',
      steps: [
        {
          id: 'step-' + Date.now() + '-1',
          type: 'trigger',
          title: `Trigger: ${newTrigger}`,
          details: `Fires when ${newTrigger} event occurs with condition (${newCondition})`,
        },
        {
          id: 'step-' + Date.now() + '-2',
          type: 'send_whatsapp',
          title: 'Action: Send WhatsApp Notification',
          details: 'Dispatches instant WhatsApp template to user',
        },
        {
          id: 'step-' + Date.now() + '-3',
          type: 'wait_delay',
          title: 'Delay: Wait 24 Hours',
          details: 'Monitors customer engagement',
          delay_hours: 24,
        },
        {
          id: 'step-' + Date.now() + '-4',
          type: 'send_email',
          title: 'Action: Send Follow-up Email',
          details: 'Sends detailed email summary',
        },
      ],
    });

    setIsNewModalOpen(false);
    setNewName('');
  };

  return (
    <CommercialShell
      title="Automations & Workflows"
      subtitle="Visual event-driven customer journey sequences across WhatsApp, SMS, and Email."
    >
      {/* Metric Grid */}
      <div className="metricGrid">
        <article>
          <span>TOTAL WORKFLOWS</span>
          <strong>{automations.length}</strong>
          <small>Configured sequences</small>
        </article>
        <article>
          <span>ACTIVE AUTOMATIONS</span>
          <strong style={{ color: '#059669' }}>
            {automations.filter((a) => a.status === 'active').length}
          </strong>
          <small>Listening for live events</small>
        </article>
        <article>
          <span>TOTAL EXECUTIONS</span>
          <strong>
            {automations.reduce((acc, a) => acc + a.executions_count, 0).toLocaleString()}
          </strong>
          <small>Automated customer touchpoints</small>
        </article>
        <article>
          <span>EVENT TRIGGERS</span>
          <strong>5 Active</strong>
          <small>Webhooks & contact events</small>
        </article>
      </div>

      <div className="commercialToolbar">
        <div />
        <button
          className="cbtn primary"
          onClick={() => setIsNewModalOpen(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={15} /> New Automation Flow
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '16px' }}>
        {/* Workflows List */}
        <section className="panel" style={{ margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div>
              <h3>Configured Workflows</h3>
              <p>Select a flow to inspect its multi-step execution diagram.</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {automations.map((auto) => {
              const isSelected = selectedAuto?.id === auto.id;
              return (
                <div
                  key={auto.id}
                  onClick={() => setSelectedAuto(auto)}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    border: '1px solid',
                    borderColor: isSelected ? '#0891b2' : '#dfe9ed',
                    background: isSelected ? '#f0fdfa' : '#ffffff',
                    cursor: 'pointer',
                    transition: '0.2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <b style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>{auto.name}</b>
                      <small style={{ fontSize: '9px', color: '#64748b' }}>
                        Trigger: <code style={{ color: '#0369a1' }}>{auto.trigger_event}</code>
                      </small>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleAutomation(auto.id);
                      }}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '999px',
                        border: 0,
                        fontSize: '9px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        background: auto.status === 'active' ? '#dcfce7' : '#f1f5f9',
                        color: auto.status === 'active' ? '#15803d' : '#64748b',
                      }}
                    >
                      {auto.status.toUpperCase()}
                    </button>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '10px',
                      paddingTop: '8px',
                      borderTop: '1px solid #f1f5f9',
                      fontSize: '9px',
                      color: '#94a3b8',
                    }}
                  >
                    <span>{auto.steps.length} sequential steps</span>
                    <span>{auto.executions_count.toLocaleString()} runs</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Visual Workflow Steps Diagram & Simulation */}
        <section className="panel" style={{ margin: 0 }}>
          {selectedAuto ? (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '14px',
                  borderBottom: '1px solid #edf2f4',
                }}
              >
                <div>
                  <small style={{ fontSize: '8px', color: '#0891b2', fontWeight: 800 }}>VISUAL JOURNEY MAP</small>
                  <h3 style={{ margin: '3px 0 0', fontSize: '16px' }}>{selectedAuto.name}</h3>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="cbtn primary"
                    onClick={() => {
                      setTestLogs([]);
                      setIsTestModalOpen(true);
                    }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  >
                    <Play size={13} fill="currentColor" /> Run Test Simulation
                  </button>
                </div>
              </div>

              {/* Steps Visual Tree */}
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {selectedAuto.steps.map((step, idx) => (
                  <div key={step.id} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                      }}
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '10px',
                          background:
                            step.type === 'trigger'
                              ? '#fef3c7'
                              : step.type === 'send_whatsapp'
                              ? '#dcfce7'
                              : step.type === 'send_sms'
                              ? '#e0f2fe'
                              : step.type === 'send_email'
                              ? '#ede9fe'
                              : '#f1f5f9',
                          color:
                            step.type === 'trigger'
                              ? '#b45309'
                              : step.type === 'send_whatsapp'
                              ? '#15803d'
                              : step.type === 'send_sms'
                              ? '#0369a1'
                              : step.type === 'send_email'
                              ? '#6d28d9'
                              : '#475569',
                          display: 'grid',
                          placeItems: 'center',
                          fontWeight: 800,
                          fontSize: '12px',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        {idx + 1}
                      </div>
                      {idx < selectedAuto.steps.length - 1 && (
                        <div style={{ width: '2px', height: '24px', background: '#cbd5e1', margin: '4px 0' }} />
                      )}
                    </div>

                    <div
                      style={{
                        flex: 1,
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <b style={{ fontSize: '11px', color: '#0f172a' }}>{step.title}</b>
                        <span
                          style={{
                            fontSize: '8px',
                            background: '#f8fafc',
                            color: '#64748b',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                            fontWeight: 700,
                          }}
                        >
                          {step.type.replace('_', ' ')}
                        </span>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: '10px', color: '#64748b' }}>{step.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="emptyBox">
              <b>Select an automation</b>
            </div>
          )}
        </section>
      </div>

      {/* Test Simulation Modal */}
      {isTestModalOpen && selectedAuto && (
        <div className="modalBackdrop">
          <div className="modalCard" style={{ maxWidth: '640px' }}>
            <div className="modalHead">
              <div>
                <small>SIMULATION ENGINE</small>
                <h3>Test Workflow: {selectedAuto.name}</h3>
              </div>
              <button onClick={() => setIsTestModalOpen(false)}>×</button>
            </div>

            <p style={{ fontSize: '11px', color: '#64748b', marginTop: 0 }}>
              Simulate this automated journey against a real customer record to inspect conditional routing and delivery handshakes.
            </p>

            <div style={{ margin: '14px 0' }}>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>
                Select Contact to Test Against:
              </label>
              <select
                value={testContactId}
                onChange={(e) => setTestContactId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '11px',
                }}
              >
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.mobile || c.email}) - {c.company}
                  </option>
                ))}
              </select>
            </div>

            <div
              style={{
                background: '#091e2b',
                color: '#a5f3fc',
                borderRadius: '10px',
                padding: '14px',
                fontFamily: 'monospace',
                fontSize: '10px',
                minHeight: '160px',
                maxHeight: '240px',
                overflowY: 'auto',
                lineHeight: 1.6,
              }}
            >
              {testLogs.length === 0 ? (
                <span style={{ color: '#4a7082' }}>Click "Start Test Execution" to run the simulation engine...</span>
              ) : (
                testLogs.map((log, i) => <div key={i}>{log}</div>)
              )}
            </div>

            <div className="modalActions">
              <button className="cbtn secondary" onClick={() => setIsTestModalOpen(false)}>
                Close
              </button>
              <button
                className="cbtn primary"
                disabled={isRunningTest}
                onClick={handleStartTest}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Play size={13} fill="currentColor" /> {isRunningTest ? 'Running Simulation…' : 'Start Test Execution'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Automation Modal */}
      {isNewModalOpen && (
        <div className="modalBackdrop">
          <div className="modalCard" style={{ maxWidth: '580px' }}>
            <div className="modalHead">
              <div>
                <small>WORKFLOW BUILDER</small>
                <h3>Create New Automated Journey</h3>
              </div>
              <button onClick={() => setIsNewModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleCreateAutomation}>
              <div className="formGrid">
                <div className="field full">
                  <label>Automation Name *</label>
                  <input
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Inactive Subscriber Re-engagement SMS"
                  />
                </div>

                <div className="field">
                  <label>Trigger Event</label>
                  <select value={newTrigger} onChange={(e) => setNewTrigger(e.target.value)}>
                    <option value="contact_created">New Contact Created</option>
                    <option value="tag_added">Tag Applied</option>
                    <option value="inbound_reply">Inbound Customer Message</option>
                    <option value="cart_abandoned">Cart Abandonment Webhook</option>
                  </select>
                </div>

                <div className="field">
                  <label>Trigger Filter Condition</label>
                  <input
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value)}
                    placeholder="e.g. whatsapp_consent == true"
                  />
                </div>
              </div>

              <div className="modalActions">
                <button type="button" className="cbtn secondary" onClick={() => setIsNewModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="cbtn primary">
                  Create Sequence
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </CommercialShell>
  );
};

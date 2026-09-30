import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  CheckCircle2,
  Zap,
  ArrowRight,
  Download,
  ShieldCheck,
  Receipt,
  Sparkles,
} from 'lucide-react';
import { CommercialShell } from './CommercialShell';
import { useApp } from '../context/AppContext';

const PLANS = [
  {
    code: 'starter',
    name: 'Starter Plan',
    price: 2499,
    desc: 'Ideal for growing businesses getting started with multi-channel campaigns.',
    contacts: '25,000',
    messages: '50,000',
    features: ['WhatsApp Cloud API access', 'SMS campaign broadcast', 'Resend transactional email', 'Standard analytics'],
  },
  {
    code: 'pro_scale',
    name: 'Pro Scale Plan',
    price: 7999,
    desc: 'Designed for scaling omnichannel brands with high broadcast volumes.',
    contacts: '100,000',
    messages: '250,000',
    popular: true,
    features: [
      'Everything in Starter',
      'Visual Automation builder',
      'Two-way Live Inbox with instant replies',
      'Custom DLT Carrier Header',
      'Priority 99.98% delivery route',
    ],
  },
  {
    code: 'enterprise',
    name: 'Enterprise Custom',
    price: 19999,
    desc: 'For large organizations needing dedicated IP pools, custom SLAs and multi-client access.',
    contacts: '500,000+',
    messages: '1,000,000+',
    features: [
      'Everything in Pro Scale',
      'Dedicated Meta WhatsApp Account Manager',
      'Custom SLA & 24/7 Phone Support',
      'Unlimited sub-workspaces',
      'SOC2 & ISO 27001 data isolation',
    ],
  },
];

export const BillingView: React.FC = () => {
  const { billing, addCredits, changePlan } = useApp();

  const [isTopupOpen, setIsTopupOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState(25000);
  const [notice, setNotice] = useState('');

  const handleTopup = () => {
    addCredits(topupAmount);
    setNotice('Payment setup is pending. No credits were added and no payment was collected.');
    setIsTopupOpen(false);
  };

  const handleDownloadInvoice = (invNumber: string) => {
    setNotice(`Invoice ${invNumber} is sample data. No real invoice exists to download.`);
  };

  return (
    <CommercialShell
      title="Billing & Subscription"
      subtitle="Workspace quotas, message credits ledger, and commercial invoices."
    >
      {notice && <div className="notice">{notice}</div>}

      {/* Top Metric Grid */}
      <div className="metricGrid">
        <article>
          <span>CURRENT PLAN</span>
          <strong>{billing.plan_name}</strong>
          <small>{billing.status}</small>
        </article>
        <article>
          <span>MESSAGE CREDITS</span>
          <strong style={{ color: '#0284c7' }}>{billing.message_credits.toLocaleString()}</strong>
          <small>Available balance for broadcasts</small>
        </article>
        <article>
          <span>CONTACTS ALLOWANCE</span>
          <strong>{billing.contact_limit.toLocaleString()}</strong>
          <small>Up to {billing.contact_limit.toLocaleString()} contacts</small>
        </article>
        <article>
          <span>MONTHLY QUOTA</span>
          <strong>{billing.monthly_message_limit.toLocaleString()}</strong>
          <small>Messages / billing cycle</small>
        </article>
      </div>

      {/* Channel Usage Meters */}
      <section className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div>
            <h3>Current Cycle Usage Breakdown</h3>
            <p>Consumed message units recorded across active provider pipelines.</p>
          </div>
          <button
            className="cbtn primary"
            onClick={() => setIsTopupOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={14} /> Add Credits
          </button>
        </div>

        <div className="usageGrid">
          <div>
            <span>WhatsApp Cloud Conversations</span>
            <b style={{ color: '#15803d' }}>{billing.whatsapp_usage.toLocaleString()}</b>
            <small style={{ fontSize: '9px', color: '#64748b' }}>Includes marketing & utility sessions</small>
          </div>
          <div>
            <span>Carrier SMS Dispatches</span>
            <b style={{ color: '#0369a1' }}>{billing.sms_usage.toLocaleString()}</b>
            <small style={{ fontSize: '9px', color: '#64748b' }}>DLT registered promotional & OTP SMS</small>
          </div>
          <div>
            <span>Email Campaigns</span>
            <b style={{ color: '#b45309' }}>{billing.email_usage.toLocaleString()}</b>
            <small style={{ fontSize: '9px', color: '#64748b' }}>Resend transactional and broadcast emails</small>
          </div>
        </div>
      </section>

      {/* Available Plans */}
      <section className="panel" style={{ marginTop: '16px' }}>
        <h3>Available Subscription Tiers</h3>
        <p>Choose the plan that fits your business scale. Switch anytime.</p>

        <div className="planCards" style={{ marginTop: '16px' }}>
          {PLANS.map((plan) => {
            const isCurrent = billing.plan_code === plan.code;
            return (
              <article
                key={plan.code}
                style={{
                  background: '#ffffff',
                  border: isCurrent ? '2px solid #0891b2' : '1px solid #dfe9ed',
                  borderRadius: '16px',
                  padding: '20px',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {isCurrent && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-10px',
                      right: '20px',
                      background: '#0891b2',
                      color: '#ffffff',
                      fontSize: '8px',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '999px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Current Plan
                  </span>
                )}

                <h4 style={{ margin: '0 0 6px', fontSize: '15px', color: '#0f172a' }}>{plan.name}</h4>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#0c2d48', margin: '8px 0' }}>
                  ₹{plan.price.toLocaleString('en-IN')}
                  <small style={{ fontSize: '10px', color: '#64748b' }}> / month</small>
                </div>
                <p style={{ fontSize: '10px', color: '#64748b', minHeight: '32px' }}>{plan.desc}</p>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginTop: '12px', flex: 1 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '10px' }}>
                    {plan.features.map((feat) => (
                      <span key={feat} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155' }}>
                        <CheckCircle2 size={13} color="#059669" /> {feat}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  className={isCurrent ? 'cbtn secondary' : 'cbtn primary'}
                  disabled={isCurrent}
                  onClick={() => {
                    changePlan(plan.code);
                    setNotice('Subscription checkout is not configured. Your plan has not changed.');
                  }}
                  style={{ marginTop: '16px', width: '100%' }}
                >
                  {isCurrent ? 'Active Plan' : `Upgrade to ${plan.name}`}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      {/* Invoice History */}
      <section className="panel" style={{ marginTop: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div>
            <h3>Invoice History</h3>
            <p>Download GST tax invoices for business accounting.</p>
          </div>
        </div>

        <div className="responsiveTable">
          <table className="dataTable">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Billing Date</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {([] as {id:string;date:string;desc:string;amount:string;status:string}[]).map((inv) => (
                <tr key={inv.id}>
                  <td><b>{inv.id}</b></td>
                  <td>{inv.date}</td>
                  <td>{inv.desc}</td>
                  <td><b>{inv.amount}</b></td>
                  <td>
                    <span className="status" style={{ background: '#dcfce7', color: '#15803d' }}>
                      {inv.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="tableAction"
                      onClick={() => handleDownloadInvoice(inv.id)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Download size={11} /> PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Topup Modal */}
      {isTopupOpen && (
        <div className="modalBackdrop">
          <div className="modalCard" style={{ maxWidth: '480px' }}>
            <div className="modalHead">
              <div>
                <small>CREDIT RECHARGE</small>
                <h3>Add Omnichannel Message Credits</h3>
              </div>
              <button onClick={() => setIsTopupOpen(false)}>×</button>
            </div>

            <p style={{ fontSize: '11px', color: '#64748b', marginTop: 0 }}>
              Credits are valid across WhatsApp Cloud API, Carrier SMS, and Email. Credits never expire.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', margin: '14px 0' }}>
              {[10000, 25000, 50000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setTopupAmount(amt)}
                  style={{
                    padding: '12px 10px',
                    borderRadius: '10px',
                    border: '2px solid',
                    borderColor: topupAmount === amt ? '#0891b2' : '#e2e8f0',
                    background: topupAmount === amt ? '#e0f7fa' : '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  <b style={{ display: 'block', fontSize: '13px', color: '#0f172a' }}>{amt.toLocaleString()}</b>
                  <small style={{ fontSize: '8px', color: '#64748b' }}>Credits</small>
                </button>
              ))}
            </div>

            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', fontSize: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Recharge Amount:</span>
                <b>{topupAmount.toLocaleString()} credits</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Cost:</span>
                <b>₹{(topupAmount * 0.1).toFixed(2)}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                <span>Payment Method:</span>
                <b>Corporate Card (•• 4920)</b>
              </div>
            </div>

            <div className="modalActions">
              <button className="cbtn secondary" onClick={() => setIsTopupOpen(false)}>
                Cancel
              </button>
              <button className="cbtn primary" onClick={handleTopup}>
                Confirm Instant Recharge
              </button>
            </div>
          </div>
        </div>
      )}
    </CommercialShell>
  );
};

import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Printer,
  Calendar,
  MessageCircle,
  MessageSquareText,
  Mail,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';
import { CommercialShell } from './CommercialShell';
import { summarize } from '../lib/metrics';
import { useApp } from '../context/AppContext';

export const AnalyticsView: React.FC = () => {
  const { campaigns, messages, billing } = useApp();

  const [dateRange, setDateRange] = useState<'7d' | '14d' | '30d' | 'all'>('14d');
  const [channelFilter, setChannelFilter] = useState<'all' | 'whatsapp' | 'sms' | 'email'>('all');

  const stats = useMemo(() => summarize(campaigns, messages, dateRange === 'all' ? null : parseInt(dateRange), channelFilter), [campaigns, messages, dateRange, channelFilter]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(stats, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `engagex_analytics_${Date.now()}.json`);
    dlAnchor.click();
  };

  return (
    <CommercialShell
      title="Analytics & Delivery Intelligence"
      subtitle="Comprehensive metrics across message volume, read receipts, and channel conversions."
    >
      {/* Date Filter & Export Bar */}
      <div className="commercialToolbar">
        <div className="leftActions" style={{ display: 'flex', gap: '6px' }}>
          {(['7d', '14d', '30d', 'all'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={dateRange === r ? 'filterPill active' : 'filterPill'}
              style={{
                background: dateRange === r ? '#0891b2' : '#eefbfe',
                color: dateRange === r ? '#ffffff' : '#0a7891',
                cursor: 'pointer',
              }}
            >
              {r === '7d' ? 'Last 7 Days' : r === '14d' ? 'Last 14 Days' : r === '30d' ? 'Last 30 Days' : 'All Time'}
            </button>
          ))}
        </div>

        <div className="rightActions" style={{ display: 'flex', gap: '8px' }}>
          <button className="cbtn secondary" onClick={handleExportJSON} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <Download size={13} /> Export JSON
          </button>
          <button className="cbtn primary" onClick={handlePrint} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <Printer size={13} /> Print Report
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="metricGrid">
        <article>
          <span>TOTAL SENT</span>
          <strong>{stats.totalSent.toLocaleString()}</strong>
          <small>Across all campaigns & live chats</small>
        </article>
        <article>
          <span>DELIVERED</span>
          <strong style={{ color: '#059669' }}>{stats.delivered.toLocaleString()}</strong>
          <small>{stats.deliveryRate}% overall success rate</small>
        </article>
        <article>
          <span>READ / OPENED</span>
          <strong style={{ color: '#0284c7' }}>{stats.read.toLocaleString()}</strong>
          <small>{stats.openRate}% engagement rate</small>
        </article>
        <article>
          <span>LINK CLICKS</span>
          <strong>{stats.clicks.toLocaleString()}</strong>
          <small>Click tracking not configured</small>
        </article>
      </div>

      <div className="metricGrid">
        <article>
          <span>CUSTOMER REPLIES</span>
          <strong>{stats.replies.toLocaleString()}</strong>
          <small>Interactive two-way conversations</small>
        </article>
        <article>
          <span>FAILED / BOUNCED</span>
          <strong style={{ color: '#dc2626' }}>{stats.failed.toLocaleString()}</strong>
          <small>Unreachable or blocked by telco</small>
        </article>
        <article>
          <span>WHATSAPP MESSAGES</span>
          <strong style={{ color: '#0284c7' }}>{billing.whatsapp_usage.toLocaleString()}</strong>
          <small>Workspace usage total</small>
        </article>
        <article>
          <span>SMS & EMAIL</span>
          <strong>{(billing.sms_usage + billing.email_usage).toLocaleString()}</strong>
          <small>Carrier SMS + Resend</small>
        </article>
      </div>

      {/* Visual Delivery Funnel & Channel Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '16px', marginTop: '16px' }}>
        {/* Funnel Progress Bars */}
        <section className="panel" style={{ margin: 0 }}>
          <h3>Delivery & Conversion Funnel</h3>
          <p>End-to-end trace from dispatch initiation to customer response.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <b>1. Sent to Gateway</b>
                <span>{stats.totalSent.toLocaleString()} (100%)</span>
              </div>
              <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '100%', background: '#0284c7' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <b>2. Delivered to Recipient Device</b>
                <span>{stats.delivered.toLocaleString()} ({stats.deliveryRate}%)</span>
              </div>
              <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${stats.deliveryRate}%`, background: '#059669' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <b>3. Read / Opened</b>
                <span>{stats.read.toLocaleString()} ({stats.openRate}%)</span>
              </div>
              <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${stats.openRate}%`, background: '#06b6d4' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <b>4. Link Clicks / CTA Engagement</b>
                <span>{stats.clicks.toLocaleString()} ({stats.ctr}%)</span>
              </div>
              <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${stats.ctr}%`, background: '#8b5cf6' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <b>5. Direct Inbound Customer Reply</b>
                <span>{stats.replies.toLocaleString()} (Two-way conversion)</span>
              </div>
              <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '18%', background: '#f59e0b' }} />
              </div>
            </div>
          </div>
        </section>

        {/* Channel Comparison Card */}
        <section className="panel" style={{ margin: 0 }}>
          <h3>Channel Comparison</h3>
          <p>Performance comparison by carrier and protocol.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageCircle size={18} color="#15803d" />
                  <b style={{ fontSize: '12px' }}>WhatsApp Business</b>
                </div>
                <span style={{ fontSize: '12px', color: '#15803d', fontWeight: 800 }}>Not measured</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#64748b', marginTop: '6px' }}>
                <span>Latency: not measured</span>
                <span>Read rate: not measured</span>
              </div>
            </div>

            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageSquareText size={18} color="#0369a1" />
                  <b style={{ fontSize: '12px' }}>Carrier SMS (DLT)</b>
                </div>
                <span style={{ fontSize: '12px', color: '#0369a1', fontWeight: 800 }}>Not measured</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#64748b', marginTop: '6px' }}>
                <span>Latency: not measured</span>
                <span>Throughput: not measured</span>
              </div>
            </div>

            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={18} color="#b45309" />
                  <b style={{ fontSize: '12px' }}>Email (Resend)</b>
                </div>
                <span style={{ fontSize: '12px', color: '#b45309', fontWeight: 800 }}>Not measured</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#64748b', marginTop: '6px' }}>
                <span>Bounce: not measured</span>
                <span>Open rate: not measured</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </CommercialShell>
  );
};

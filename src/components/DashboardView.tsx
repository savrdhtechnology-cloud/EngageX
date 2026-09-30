import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  ContactRound,
  Megaphone,
  MessageCircle,
  MessageSquareText,
  Mail,
  Zap,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Send,
  Plus,
  Play,
  Upload,
  Workflow,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Activity,
  Layers,
  Flame,
  CheckCheck,
} from 'lucide-react';
import { CommercialShell } from './CommercialShell';
import { useApp } from '../context/AppContext';

export const DashboardView: React.FC = () => {
  const { contacts, campaigns, messages, billing, setAppTab, queueCampaign, auditLogs, setActiveChatContactId } = useApp();

  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d'>('14d');
  const [selectedChannel, setSelectedChannel] = useState<'all' | 'whatsapp' | 'sms' | 'email'>('all');
  const [hoveredBar, setHoveredBar] = useState<any | null>(null);
  const [selectedBar, setSelectedBar] = useState<any | null>(null);
  const [hoveredHour, setHoveredHour] = useState<any | null>(null);
  const [selectedHour, setSelectedHour] = useState<any | null>(null);

  const activeBar = hoveredBar || selectedBar;
  const activeHour = hoveredHour || selectedHour;

  // Metrics computation
  const stats = useMemo(() => {
    const totalContacts = contacts.length;
    const activeContacts = contacts.filter((c) => c.status === 'active').length;
    const totalCampaigns = campaigns.length;
    const runningCampaigns = campaigns.filter((c) => c.status === 'running' || c.status === 'scheduled').length;

    const totalSent = campaigns.reduce((acc, c) => acc + c.sent_count, 0) + messages.length;
    const totalDelivered = campaigns.reduce((acc, c) => acc + c.delivered_count, 0) + messages.filter((m) => m.status === 'delivered' || m.status === 'read').length;
    const totalFailed = campaigns.reduce((acc, c) => acc + c.failed_count, 0);

    const deliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 96.4;

    const waCount = billing.whatsapp_usage;
    const smsCount = billing.sms_usage;
    const emailCount = billing.email_usage;

    return {
      totalContacts,
      activeContacts,
      totalCampaigns,
      runningCampaigns,
      totalSent,
      totalDelivered,
      totalFailed,
      deliveryRate,
      waCount,
      smsCount,
      emailCount,
    };
  }, [contacts, campaigns, messages, billing]);

  // Timeseries simulation (7d, 14d, 30d)
  const timeseries = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 30;
    const data = [];
    const baseDate = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - i);
      const dayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const rawVal = Math.floor(130 + Math.sin(i * 0.7) * 75 + (i % 4 === 0 ? 190 : 35));
      const wa = Math.floor(rawVal * 0.56);
      const sms = Math.floor(rawVal * 0.26);
      const em = rawVal - wa - sms;

      let displayVal = rawVal;
      if (selectedChannel === 'whatsapp') displayVal = wa;
      if (selectedChannel === 'sms') displayVal = sms;
      if (selectedChannel === 'email') displayVal = em;

      data.push({
        date: dayLabel,
        total: rawVal,
        displayVal,
        whatsapp: wa,
        sms,
        email: em,
        deliveryRate: Math.min(99, Math.floor(95 + Math.random() * 4)),
      });
    }
    return data;
  }, [timeRange, selectedChannel]);

  const maxVolume = Math.max(...timeseries.map((t) => t.displayVal), 240);

  // 24-Hour Dispatch Peak Curve Data
  const hourlyData = useMemo(() => {
    const hours = [];
    for (let h = 0; h < 24; h++) {
      const label = `${h.toString().padStart(2, '0')}:00`;
      let count = 40;
      if (h >= 7 && h < 10) count = 280 + (h - 7) * 90;
      else if (h >= 10 && h <= 13) count = 750 + Math.floor(Math.sin(h) * 160);
      else if (h > 13 && h < 17) count = 440 + Math.floor(Math.sin(h) * 80);
      else if (h >= 17 && h <= 20) count = 890 + Math.floor(Math.cos(h) * 120);
      else if (h > 20) count = 180 - (h - 20) * 45;
      else count = 35 + Math.floor(Math.random() * 25);

      hours.push({
        hour: label,
        count,
        openRate: h >= 10 && h <= 20 ? 84 : 52,
      });
    }
    return hours;
  }, []);

  const maxHourly = Math.max(...hourlyData.map((h) => h.count), 950);

  // Quick Action navigation
  const handleQuickAction = (tab: string, extra?: () => void) => {
    setAppTab(tab);
    if (extra) extra();
  };

  return (
    <CommercialShell
      title="Communication Overview"
      subtitle="Interactive omnichannel intelligence, dispatch analytics, and customer conversion telemetry."
    >
      {/* Welcome Banner */}
      <div className="welcomeBand">
        <div>
          <span>SAVRDH TECHNOLOGY · ENTERPRISE WORKSPACE</span>
          <h2>Connect with every customer on WhatsApp, SMS and Email.</h2>
          <p>
            One intelligent CRM to orchestrate broadcast campaigns, handle two-way live customer replies, and
            automate retention workflows.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className="welcomeAction"
            onClick={() => setAppTab('campaigns')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} /> New Campaign
          </button>
          <button
            className="welcomeAction"
            onClick={() => setAppTab('messages')}
            style={{
              background: 'rgba(255,255,255,0.15)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <MessageCircle size={16} /> Open Live Inbox
          </button>
        </div>
      </div>

      {/* Clickable Quick Action Launchpad */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <div
          onClick={() => setAppTab('campaigns')}
          style={{
            background: '#ffffff',
            border: '1px solid #dcfce7',
            borderRadius: '12px',
            padding: '12px 14px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(22, 163, 74, 0.12)';
            e.currentTarget.style.borderColor = '#86efac';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.02)';
            e.currentTarget.style.borderColor = '#dcfce7';
          }}
        >
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#dcfce7', color: '#15803d', display: 'grid', placeItems: 'center' }}>
            <MessageCircle size={17} />
          </div>
          <div style={{ flex: 1 }}>
            <b style={{ fontSize: '11px', display: 'block', color: '#0f172a' }}>WhatsApp Broadcast</b>
            <small style={{ fontSize: '8px', color: '#64748b' }}>Launch Meta Cloud campaign →</small>
          </div>
        </div>

        <div
          onClick={() => setAppTab('messages')}
          style={{
            background: '#ffffff',
            border: '1px solid #e0f2fe',
            borderRadius: '12px',
            padding: '12px 14px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(2, 132, 199, 0.12)';
            e.currentTarget.style.borderColor = '#7dd3fc';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.02)';
            e.currentTarget.style.borderColor = '#e0f2fe';
          }}
        >
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#e0f2fe', color: '#0284c7', display: 'grid', placeItems: 'center' }}>
            <Send size={17} />
          </div>
          <div style={{ flex: 1 }}>
            <b style={{ fontSize: '11px', display: 'block', color: '#0f172a' }}>Live Chat Simulator</b>
            <small style={{ fontSize: '8px', color: '#64748b' }}>Simulate 2-way replies →</small>
          </div>
        </div>

        <div
          onClick={() => setAppTab('contacts')}
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '12px 14px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(71, 85, 105, 0.12)';
            e.currentTarget.style.borderColor = '#94a3b8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.02)';
            e.currentTarget.style.borderColor = '#e2e8f0';
          }}
        >
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f1f5f9', color: '#475569', display: 'grid', placeItems: 'center' }}>
            <Upload size={17} />
          </div>
          <div style={{ flex: 1 }}>
            <b style={{ fontSize: '11px', display: 'block', color: '#0f172a' }}>Import Audience</b>
            <small style={{ fontSize: '8px', color: '#64748b' }}>Excel / CSV spreadsheet →</small>
          </div>
        </div>

        <div
          onClick={() => setAppTab('automations')}
          style={{
            background: '#ffffff',
            border: '1px solid #fef3c7',
            borderRadius: '12px',
            padding: '12px 14px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(217, 119, 6, 0.12)';
            e.currentTarget.style.borderColor = '#fcd34d';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.02)';
            e.currentTarget.style.borderColor = '#fef3c7';
          }}
        >
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef3c7', color: '#b45309', display: 'grid', placeItems: 'center' }}>
            <Workflow size={17} />
          </div>
          <div style={{ flex: 1 }}>
            <b style={{ fontSize: '11px', display: 'block', color: '#0f172a' }}>Customer Journeys</b>
            <small style={{ fontSize: '8px', color: '#64748b' }}>Automated event flows →</small>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Grid - FULLY CLICKABLE */}
      <div className="crmMetrics">
        <article
          onClick={() => setAppTab('contacts')}
          style={{ cursor: 'pointer', transition: 'all 0.18s ease' }}
          title="Click to view Contact Directory"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>TOTAL CONTACTS</span>
            <ChevronRight size={12} color="#0891b2" />
          </div>
          <strong>{stats.totalContacts.toLocaleString()}</strong>
          <small>Verified audience list · Click to open</small>
        </article>

        <article
          onClick={() => setAppTab('contacts')}
          style={{ cursor: 'pointer', transition: 'all 0.18s ease' }}
          title="Click to view Active Reachable Contacts"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>ACTIVE REACHABLE</span>
            <ChevronRight size={12} color="#0891b2" />
          </div>
          <strong>{stats.activeContacts.toLocaleString()}</strong>
          <small>Opted-in for communication · Click to view</small>
        </article>

        <article
          onClick={() => setAppTab('campaigns')}
          style={{ cursor: 'pointer', transition: 'all 0.18s ease' }}
          title="Click to view Campaigns"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>TOTAL CAMPAIGNS</span>
            <ChevronRight size={12} color="#0891b2" />
          </div>
          <strong>{stats.totalCampaigns}</strong>
          <small>{stats.runningCampaigns} active / queued · Click to manage</small>
        </article>

        <article
          onClick={() => setAppTab('analytics')}
          style={{ cursor: 'pointer', transition: 'all 0.18s ease' }}
          title="Click to view Sent Telemetry in Analytics"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>TOTAL SENT</span>
            <ChevronRight size={12} color="#0891b2" />
          </div>
          <strong>{stats.totalSent.toLocaleString()}</strong>
          <small>Across all channels · Click for report</small>
        </article>

        <article
          onClick={() => setAppTab('analytics')}
          style={{ cursor: 'pointer', transition: 'all 0.18s ease' }}
          title="Click to view Delivery Performance"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>DELIVERY RATE</span>
            <ChevronRight size={12} color="#059669" />
          </div>
          <strong style={{ color: '#059669' }}>{stats.deliveryRate}%</strong>
          <small>{stats.totalDelivered.toLocaleString()} delivered · Click to inspect</small>
        </article>

        <article
          onClick={() => setAppTab('messages')}
          style={{ cursor: 'pointer', transition: 'all 0.18s ease' }}
          title="Click to open Live Inbox"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>WHATSAPP MESSAGES</span>
            <ChevronRight size={12} color="#0284c7" />
          </div>
          <strong style={{ color: '#0284c7' }}>{stats.waCount.toLocaleString()}</strong>
          <small>Meta Cloud API verified · Open chat</small>
        </article>

        <article
          onClick={() => setAppTab('campaigns')}
          style={{ cursor: 'pointer', transition: 'all 0.18s ease' }}
          title="Click to view SMS Campaigns"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>SMS BROADCASTS</span>
            <ChevronRight size={12} color="#0891b2" />
          </div>
          <strong>{stats.smsCount.toLocaleString()}</strong>
          <small>DLT compliant sender ID · Click to view</small>
        </article>

        <article
          onClick={() => setAppTab('templates')}
          style={{ cursor: 'pointer', transition: 'all 0.18s ease' }}
          title="Click to view Email Templates"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>EMAIL CAMPAIGNS</span>
            <ChevronRight size={12} color="#0891b2" />
          </div>
          <strong>{stats.emailCount.toLocaleString()}</strong>
          <small>Resend verified domain · Open templates</small>
        </article>
      </div>

      {/* GRAPH 1 & 2: Interactive Dispatch Volume & 24-Hour Heatmap */}
      <div className="crmGrid" style={{ alignItems: 'start' }}>
        {/* GRAPH 1: Interactive Omnichannel Volume Timeseries */}
        <article className="performance" style={{ boxSizing: 'border-box' }}>
          <div className="cardTitle" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <small style={{ fontSize: '8px', color: '#7e95a3', fontWeight: 800 }}>GRAPH 1 · INTERACTIVE DISPATCH VOLUME</small>
              <h3 style={{ margin: '3px 0 0', fontSize: '15px' }}>
                Daily Omnichannel Activity ({timeRange.toUpperCase()})
              </h3>
            </div>

            {/* Interactive Filters: Time Range & Channel Switcher */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '2px' }}>
                {(['7d', '14d', '30d'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setTimeRange(r);
                      setSelectedBar(null);
                    }}
                    style={{
                      border: 0,
                      background: timeRange === r ? '#ffffff' : 'transparent',
                      color: timeRange === r ? '#0284c7' : '#64748b',
                      fontSize: '9px',
                      fontWeight: timeRange === r ? 800 : 600,
                      padding: '4px 8px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      boxShadow: timeRange === r ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    }}
                  >
                    {r === '7d' ? '7 Days' : r === '14d' ? '14 Days' : '30 Days'}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '2px' }}>
                {(['all', 'whatsapp', 'sms', 'email'] as const).map((ch) => (
                  <button
                    key={ch}
                    onClick={() => setSelectedChannel(ch)}
                    style={{
                      border: 0,
                      background: selectedChannel === ch ? '#0891b2' : 'transparent',
                      color: selectedChannel === ch ? '#ffffff' : '#64748b',
                      fontSize: '9px',
                      fontWeight: selectedChannel === ch ? 800 : 600,
                      padding: '4px 8px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {ch}
                  </button>
                ))}
              </div>

              <span
                style={{
                  fontSize: '9px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#e0f2fe',
                  color: '#0369a1',
                  padding: '3px 8px',
                  borderRadius: '999px',
                  fontWeight: 700,
                }}
              >
                <TrendingUp size={12} /> +18.4% WoW
              </span>
            </div>
          </div>

          {/* Zero-Shift Fixed-Height Details Banner */}
          <div
            style={{
              marginTop: '12px',
              height: '40px',
              padding: '0 12px',
              background: activeBar ? '#f0fdfa' : '#f8fafc',
              border: `1px solid ${activeBar ? '#99f6e4' : '#e2e8f0'}`,
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '10px',
              boxSizing: 'border-box',
              overflow: 'hidden',
              transition: 'background-color 0.15s ease, border-color 0.15s ease',
            }}
          >
            {activeBar ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0284c7' }} />
                  <b>{activeBar.date}:</b>
                  <span style={{ color: '#0f172a', fontWeight: 700 }}>{activeBar.displayVal.toLocaleString()} msgs</span>
                  {selectedBar && selectedBar.date === activeBar.date && (
                    <span style={{ fontSize: '7.5px', background: '#0284c7', color: '#ffffff', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                      PINNED
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ color: '#15803d', fontWeight: 600 }}>● WA: {activeBar.whatsapp}</span>
                  <span style={{ color: '#0369a1', fontWeight: 600 }}>● SMS: {activeBar.sms}</span>
                  <span style={{ color: '#b45309', fontWeight: 600 }}>● Email: {activeBar.email}</span>
                  <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 7px', borderRadius: '999px', fontWeight: 800 }}>
                    SLA: {activeBar.deliveryRate}%
                  </span>
                  {selectedBar && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBar(null);
                      }}
                      style={{
                        border: 0,
                        background: 'transparent',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        fontSize: '11px',
                        padding: '0 2px',
                        fontWeight: 700,
                      }}
                      title="Clear pinned day"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', color: '#64748b' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={13} color="#0891b2" />
                  <span>Hover or click any bar to inspect daily breakdown & SLA delivery rate.</span>
                </span>
                <span style={{ fontSize: '9px', color: '#94a3b8' }}>
                  Total {timeRange.toUpperCase()}: {timeseries.reduce((acc, t) => acc + t.displayVal, 0).toLocaleString()} msgs
                </span>
              </div>
            )}
          </div>

          {/* Interactive Stacked Bar Chart */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: timeRange === '30d' ? '3px' : '8px',
              height: '170px',
              paddingTop: '20px',
              borderBottom: '1px solid #e2e8f0',
              position: 'relative',
              overflow: 'hidden',
              boxSizing: 'border-box',
            }}
          >
            {timeseries.map((item, idx) => {
              const heightPct = Math.max(8, (item.displayVal / maxVolume) * 100);
              const isHovered = hoveredBar?.date === item.date;
              const isSelected = selectedBar?.date === item.date;
              const isActive = isHovered || isSelected;

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedBar(selectedBar?.date === item.date ? null : item)}
                  onMouseEnter={() => setHoveredBar(item)}
                  onMouseLeave={() => setHoveredBar(null)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%',
                    justifyContent: 'flex-end',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                  title={`Click to pin ${item.date}: ${item.displayVal} msgs`}
                >
                  <div
                    style={{
                      width: '100%',
                      maxWidth: timeRange === '30d' ? '14px' : '26px',
                      height: `${heightPct}%`,
                      background: isActive
                        ? '#0284c7'
                        : selectedChannel === 'whatsapp'
                        ? 'linear-gradient(180deg, #22c55e 0%, #15803d 100%)'
                        : selectedChannel === 'sms'
                        ? 'linear-gradient(180deg, #38bdf8 0%, #0369a1 100%)'
                        : selectedChannel === 'email'
                        ? 'linear-gradient(180deg, #f59e0b 0%, #b45309 100%)'
                        : 'linear-gradient(180deg, #06b6d4 0%, #0369a1 100%)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'background 0.15s ease, opacity 0.15s ease, filter 0.15s ease',
                      opacity: activeBar && !isActive ? 0.45 : 1,
                      filter: isActive ? 'brightness(1.15)' : 'none',
                      outline: isSelected ? '2px solid #0f172a' : 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {(timeRange !== '30d' || idx % 3 === 0) && (
                    <span
                      style={{
                        fontSize: '7.5px',
                        color: isActive ? '#0284c7' : '#64748b',
                        marginTop: '6px',
                        height: '16px',
                        lineHeight: '16px',
                        whiteSpace: 'nowrap',
                        fontWeight: 600,
                        transition: 'color 0.15s ease',
                      }}
                    >
                      {item.date}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '16px',
              paddingTop: '6px',
            }}
          >
            <div style={{ display: 'flex', gap: '14px', fontSize: '10px' }}>
              <span
                onClick={() => setSelectedChannel('whatsapp')}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontWeight: selectedChannel === 'whatsapp' ? 800 : 500 }}
              >
                <span style={{ width: '8px', height: '8px', background: '#16a34a', borderRadius: '2px' }} /> WhatsApp (56%)
              </span>
              <span
                onClick={() => setSelectedChannel('sms')}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontWeight: selectedChannel === 'sms' ? 800 : 500 }}
              >
                <span style={{ width: '8px', height: '8px', background: '#0284c7', borderRadius: '2px' }} /> SMS (26%)
              </span>
              <span
                onClick={() => setSelectedChannel('email')}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontWeight: selectedChannel === 'email' ? 800 : 500 }}
              >
                <span style={{ width: '8px', height: '8px', background: '#d97706', borderRadius: '2px' }} /> Email (18%)
              </span>
            </div>
            <button
              onClick={() => setAppTab('analytics')}
              style={{
                fontSize: '10px',
                color: '#0284c7',
                background: 'transparent',
                border: 0,
                cursor: 'pointer',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              Full Analytics Report <ArrowRight size={12} />
            </button>
          </div>
        </article>

        {/* GRAPH 2: 24-Hour Dispatch Peak Curve / Hourly Traffic */}
        <article style={{ background: '#ffffff', borderRadius: '14px', padding: '18px', border: '1px solid #dfe9ed', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div>
              <small style={{ fontSize: '8px', color: '#7e95a3', fontWeight: 800 }}>GRAPH 2 · 24-HOUR TRAFFIC CURVE</small>
              <h3 style={{ margin: '3px 0 0', fontSize: '15px' }}>Hourly Dispatch Heatmap</h3>
            </div>
            <span
              style={{
                fontSize: '8px',
                background: '#fef3c7',
                color: '#b45309',
                padding: '3px 7px',
                borderRadius: '999px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <Flame size={11} /> Peak: 10AM & 6PM
            </span>
          </div>

          <p style={{ margin: '0 0 10px', fontSize: '9px', color: '#64748b' }}>
            Shows message throughput and response rates throughout the day. Hover or click to inspect.
          </p>

          {/* Hourly Mini Bar Chart */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '3px',
              height: '110px',
              paddingTop: '10px',
              borderBottom: '1px solid #e2e8f0',
              overflow: 'hidden',
              boxSizing: 'border-box',
            }}
          >
            {hourlyData.map((slot, i) => {
              const heightPct = Math.max(8, (slot.count / maxHourly) * 100);
              const isPeak = slot.count > 600;
              const isHovered = hoveredHour?.hour === slot.hour;
              const isSelected = selectedHour?.hour === slot.hour;
              const isActive = isHovered || isSelected;

              return (
                <div
                  key={i}
                  onClick={() => setSelectedHour(selectedHour?.hour === slot.hour ? null : slot)}
                  onMouseEnter={() => setHoveredHour(slot)}
                  onMouseLeave={() => setHoveredHour(null)}
                  style={{
                    flex: 1,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                  title={`Click to pin ${slot.hour}: ${slot.count} messages (${slot.openRate}% engagement)`}
                >
                  <div
                    style={{
                      width: '100%',
                      height: `${heightPct}%`,
                      background: isActive
                        ? '#0284c7'
                        : isPeak
                        ? 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)'
                        : '#cbd5e1',
                      borderRadius: '2px 2px 0 0',
                      transition: 'background 0.15s ease, opacity 0.15s ease',
                      opacity: activeHour && !isActive ? 0.45 : 1,
                      outline: isSelected ? '1.5px solid #0f172a' : 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Fixed-Height Zero-Shift Info Strip */}
          <div
            style={{
              height: '24px',
              marginTop: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '9px',
              boxSizing: 'border-box',
              overflow: 'hidden',
            }}
          >
            {activeHour ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', color: '#0f172a' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <b>{activeHour.hour} Slot:</b>
                  <span style={{ color: '#0284c7', fontWeight: 700 }}>{activeHour.count} msgs/hr</span>
                  {selectedHour && selectedHour.hour === activeHour.hour && (
                    <span style={{ fontSize: '7px', background: '#0284c7', color: '#fff', padding: '1px 4px', borderRadius: '3px', fontWeight: 700 }}>
                      PINNED
                    </span>
                  )}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <b style={{ color: '#059669' }}>{activeHour.openRate}% Response Rate</b>
                  {selectedHour && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedHour(null);
                      }}
                      style={{
                        border: 0,
                        background: 'transparent',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        fontSize: '10px',
                        padding: '0 2px',
                        fontWeight: 700,
                      }}
                      title="Reset pinned slot"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '8px', color: '#94a3b8' }}>
                <span>00:00 (Night)</span>
                <span>10:00 (Morning Peak)</span>
                <span>18:00 (Evening Rush)</span>
                <span>23:00</span>
              </div>
            )}
          </div>

          {/* Quick Gateway Health summary with Click Navigation */}
          <div style={{ marginTop: '14px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '9px', fontWeight: 800, color: '#475569' }}>GATEWAY STATUS</span>
              <button
                onClick={() => setAppTab('integrations')}
                style={{ fontSize: '8px', color: '#0891b2', background: 'transparent', border: 0, cursor: 'pointer', fontWeight: 700 }}
              >
                Configure All →
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              <div
                onClick={() => setAppTab('integrations')}
                style={{
                  padding: '6px 8px',
                  borderRadius: '6px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <b style={{ display: 'block', fontSize: '9px', color: '#15803d' }}>WhatsApp</b>
                <small style={{ fontSize: '7px', color: '#166534' }}>99.98% SLA</small>
              </div>

              <div
                onClick={() => setAppTab('integrations')}
                style={{
                  padding: '6px 8px',
                  borderRadius: '6px',
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <b style={{ display: 'block', fontSize: '9px', color: '#0369a1' }}>Carrier SMS</b>
                <small style={{ fontSize: '7px', color: '#0284c7' }}>SVRDTC</small>
              </div>

              <div
                onClick={() => setAppTab('integrations')}
                style={{
                  padding: '6px 8px',
                  borderRadius: '6px',
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <b style={{ display: 'block', fontSize: '9px', color: '#b45309' }}>Resend</b>
                <small style={{ fontSize: '7px', color: '#92400e' }}>Verified</small>
              </div>
            </div>
          </div>
        </article>
      </div>

      {/* GRAPH 3 & 4: Multi-Channel Success Benchmark + Delivery Outcome Funnel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', marginTop: '16px' }}>
        {/* GRAPH 3: Channel Delivery Success & Latency Comparison */}
        <section className="panel" style={{ margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div>
              <small style={{ fontSize: '8px', color: '#7e95a3', fontWeight: 800 }}>GRAPH 3 · SUCCESS BENCHMARKS</small>
              <h3 style={{ margin: '3px 0 0' }}>Channel Delivery & Latency Comparison</h3>
            </div>
            <button
              onClick={() => setAppTab('analytics')}
              style={{ fontSize: '9px', color: '#0891b2', background: 'transparent', border: 0, cursor: 'pointer', fontWeight: 700 }}
            >
              Detailed Funnel →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
            {/* WhatsApp */}
            <div
              onClick={() => setAppTab('messages')}
              style={{
                padding: '10px 12px',
                background: '#f8fafc',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#16a34a')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageCircle size={16} color="#15803d" />
                  <b style={{ fontSize: '11px', color: '#0f172a' }}>WhatsApp Cloud API (Meta)</b>
                </div>
                <div style={{ display: 'flex', gap: '10px', fontSize: '9px' }}>
                  <span style={{ color: '#64748b' }}>Latency: 1.2s</span>
                  <b style={{ color: '#15803d' }}>98.1% Delivered</b>
                </div>
              </div>
              <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '98.1%', background: '#16a34a' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: '#94a3b8', marginTop: '4px' }}>
                <span>Read Rate: 84.6%</span>
                <span style={{ color: '#0284c7' }}>Open conversation inbox →</span>
              </div>
            </div>

            {/* Carrier SMS */}
            <div
              onClick={() => setAppTab('campaigns')}
              style={{
                padding: '10px 12px',
                background: '#f8fafc',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#0284c7')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageSquareText size={16} color="#0369a1" />
                  <b style={{ fontSize: '11px', color: '#0f172a' }}>Carrier SMS (DLT SVRDTC)</b>
                </div>
                <div style={{ display: 'flex', gap: '10px', fontSize: '9px' }}>
                  <span style={{ color: '#64748b' }}>Latency: 2.8s</span>
                  <b style={{ color: '#0369a1' }}>94.8% Delivered</b>
                </div>
              </div>
              <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '94.8%', background: '#0284c7' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: '#94a3b8', marginTop: '4px' }}>
                <span>Throughput: 1,000 SMS / sec</span>
                <span style={{ color: '#0284c7' }}>Create broadcast campaign →</span>
              </div>
            </div>

            {/* Resend Email */}
            <div
              onClick={() => setAppTab('templates')}
              style={{
                padding: '10px 12px',
                background: '#f8fafc',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#d97706')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={16} color="#b45309" />
                  <b style={{ fontSize: '11px', color: '#0f172a' }}>Rich Email (Resend)</b>
                </div>
                <div style={{ display: 'flex', gap: '10px', fontSize: '9px' }}>
                  <span style={{ color: '#64748b' }}>Bounce: 1.4%</span>
                  <b style={{ color: '#b45309' }}>96.3% Delivered</b>
                </div>
              </div>
              <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '96.3%', background: '#d97706' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: '#94a3b8', marginTop: '4px' }}>
                <span>Open Rate: 42.1% · Domain Verified</span>
                <span style={{ color: '#0284c7' }}>Manage HTML templates →</span>
              </div>
            </div>
          </div>
        </section>

        {/* GRAPH 4: Delivery Outcome Distribution & Progress */}
        <section className="panel" style={{ margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div>
                <small style={{ fontSize: '8px', color: '#7e95a3', fontWeight: 800 }}>GRAPH 4 · OUTCOME BREAKDOWN</small>
                <h3 style={{ margin: '3px 0 0' }}>Overall Delivery Health</h3>
              </div>
              <span
                style={{
                  fontSize: '9px',
                  background: '#dcfce7',
                  color: '#15803d',
                  padding: '2px 6px',
                  borderRadius: '999px',
                  fontWeight: 800,
                }}
              >
                Healthy SLA
              </span>
            </div>

            <p style={{ margin: '0 0 14px', fontSize: '9px', color: '#64748b' }}>
              Aggregated outcome conversion across 5,928 total message events.
            </p>

            {/* Segmented Distribution Bar */}
            <div style={{ height: '14px', borderRadius: '99px', overflow: 'hidden', display: 'flex', marginBottom: '14px' }}>
              <div style={{ width: '96.4%', background: '#10b981' }} title="Delivered: 96.4%" />
              <div style={{ width: '3.6%', background: '#ef4444' }} title="Failed: 3.6%" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: '#f8fafc', borderRadius: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                  Delivered Successfully
                </span>
                <b>96.4% (5,707 msgs)</b>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: '#f8fafc', borderRadius: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0284c7' }} />
                  Read / Opened
                </span>
                <b>74.2% (4,235 msgs)</b>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: '#f8fafc', borderRadius: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
                  Two-Way Customer Replies
                </span>
                <b>18.6% (1,061 replies)</b>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: '#f8fafc', borderRadius: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
                  Network & DLT Bounces
                </span>
                <b style={{ color: '#dc2626' }}>3.6% (213 msgs)</b>
              </div>
            </div>
          </div>

          <button
            className="cbtn secondary"
            onClick={() => setAppTab('analytics')}
            style={{ width: '100%', marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <BarChart3 size={13} /> Open Analytics Funnel
          </button>
        </section>
      </div>

      {/* Campaigns & Activity Split View - FULLY CLICKABLE */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '16px', marginTop: '16px' }}>
        {/* Recent Campaigns Table */}
        <section className="panel" style={{ margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div>
              <h3>Recent Campaigns</h3>
              <p>Click any campaign to inspect delivery logs and audience reach.</p>
            </div>
            <button
              onClick={() => setAppTab('campaigns')}
              style={{
                fontSize: '10px',
                color: '#0891b2',
                background: 'transparent',
                border: 0,
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              View All ({campaigns.length}) →
            </button>
          </div>

          <div className="responsiveTable">
            <table className="dataTable">
              <thead>
                <tr>
                  <th>Campaign Name</th>
                  <th>Channels</th>
                  <th>Delivered</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.slice(0, 5).map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setAppTab('campaigns')}
                    style={{ cursor: 'pointer', transition: 'background 0.15s ease' }}
                    title="Click to view campaign details"
                  >
                    <td>
                      <b>{c.name}</b>
                      <small className="cellSub">{new Date(c.created_at).toLocaleDateString()} · Click to inspect</small>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {c.channels.map((ch) => (
                          <span
                            key={ch}
                            style={{
                              fontSize: '7px',
                              padding: '2px 5px',
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
                      <b>{c.delivered_count}</b>
                      <small className="cellSub">of {c.sent_count || '—'}</small>
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
                      {['draft', 'scheduled', 'paused'].includes(c.status) ? (
                        <button
                          className="tableAction"
                          onClick={(e) => {
                            e.stopPropagation();
                            queueCampaign(c.id);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#0891b2',
                            color: '#ffffff',
                            padding: '3px 8px',
                            borderRadius: '6px',
                          }}
                        >
                          <Play size={10} fill="currentColor" /> Queue
                        </button>
                      ) : (
                        <span style={{ fontSize: '9px', color: '#0891b2', fontWeight: 700 }}>Inspect →</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Live Workspace Activity Feed - CLICKABLE */}
        <section className="panel" style={{ margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div>
              <h3>Workspace Activity</h3>
              <p>Click any event to navigate to that module.</p>
            </div>
            <button
              onClick={() => setAppTab('settings')}
              style={{
                fontSize: '10px',
                color: '#0891b2',
                background: 'transparent',
                border: 0,
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              Audit Log →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {auditLogs.slice(0, 6).map((log) => {
              const targetTab =
                log.resource_type === 'Campaign'
                  ? 'campaigns'
                  : log.resource_type === 'Contact'
                  ? 'contacts'
                  : log.resource_type === 'Integration'
                  ? 'integrations'
                  : log.resource_type === 'Message'
                  ? 'messages'
                  : log.resource_type === 'Billing'
                  ? 'billing'
                  : log.resource_type === 'Template'
                  ? 'templates'
                  : 'settings';

              return (
                <div
                  key={log.id}
                  onClick={() => setAppTab(targetTab)}
                  style={{
                    padding: '9px 12px',
                    background: '#f8fafc',
                    border: '1px solid #f1f5f9',
                    borderRadius: '10px',
                    fontSize: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f0f9ff';
                    e.currentTarget.style.borderColor = '#bae6fd';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.borderColor = '#f1f5f9';
                  }}
                  title={`Click to view in ${targetTab}`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <b style={{ color: '#0369a1', fontSize: '9px' }}>{log.action}</b>
                    <span style={{ color: '#94a3b8', fontSize: '8px' }}>
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ margin: 0, color: '#334155', lineHeight: 1.4 }}>{log.details}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <small style={{ color: '#94a3b8', fontSize: '8px' }}>by {log.user_email}</small>
                    <span style={{ fontSize: '8px', color: '#0891b2', fontWeight: 700 }}>Open {targetTab} →</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </CommercialShell>
  );
};

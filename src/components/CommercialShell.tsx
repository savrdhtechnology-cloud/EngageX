import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  ContactRound,
  Megaphone,
  MessageSquareText,
  Workflow,
  BarChart3,
  Bot,
  Users,
  Building2,
  CreditCard,
  Settings,
  Sparkles,
  LogOut,
  Bell,
  Globe,
  MessageCircle,
  ExternalLink,
  CheckCheck,
  X,
  Clock,
  ChevronRight,
  ShieldCheck,
  DatabaseZap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AppNotification } from '../types';

const menuItems = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
  { id: 'clients', name: 'Clients', icon: Building2 },
  { id: 'data-extractor', name: 'EngageX Lead Intelligence', icon: DatabaseZap },
  { id: 'contacts', name: 'Contacts', icon: ContactRound },
  { id: 'campaigns', name: 'Campaigns', icon: Megaphone },
  { id: 'messages', name: 'Live Inbox', icon: MessageCircle, badge: 'Live' },
  { id: 'templates', name: 'Templates', icon: MessageSquareText },
  { id: 'automations', name: 'Automations', icon: Workflow },
  { id: 'analytics', name: 'Analytics', icon: BarChart3 },
  { id: 'integrations', name: 'Integrations', icon: Bot },
  { id: 'team', name: 'Team & Roles', icon: Users },
  { id: 'billing', name: 'Billing', icon: CreditCard },
  { id: 'settings', name: 'Settings', icon: Settings },
];

export const CommercialShell: React.FC<{
  title: string;
  subtitle: string;
  children: React.ReactNode;
}> = ({ title, subtitle, children }) => {
  const {
    appTab,
    setAppTab,
    userSession,
    logout,
    setCurrentView,
    billing,
    notifications,
    unreadNotificationsCount,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    setActiveChatContactId,
    activeWorkspace,
    switchWorkspace,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Reset viewport on module/workspace navigation so admin pages always open from the top.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    const main = document.querySelector('.crmMain');
    if (main instanceof HTMLElement) main.scrollTop = 0;
  }, [appTab, activeWorkspace?.slug]);

  // Close notifications on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const handleNotificationClick = (notif: AppNotification) => {
    markNotificationRead(notif.id);
    if (notif.targetId && notif.targetTab === 'messages') {
      setActiveChatContactId(notif.targetId);
    }
    setAppTab(notif.targetTab);
    setShowNotifications(false);
  };

  const getNotificationIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'whatsapp':
        return (
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: '#dcfce7',
              color: '#15803d',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <MessageCircle size={15} />
          </div>
        );
      case 'campaign':
        return (
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: '#e0f2fe',
              color: '#0369a1',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <Megaphone size={15} />
          </div>
        );
      case 'integration':
        return (
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: '#cffafe',
              color: '#0891b2',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <Bot size={15} />
          </div>
        );
      case 'billing':
        return (
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: '#fef3c7',
              color: '#b45309',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <CreditCard size={15} />
          </div>
        );
      default:
        return (
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: '#f1f5f9',
              color: '#475569',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <Bell size={15} />
          </div>
        );
    }
  };

  return (
    <main className="crmShell">
      {/* Sidebar */}
      <aside className="crmSide">
        <div
          className="crmLogo"
          style={{ cursor: 'pointer' }}
          onClick={() => setCurrentView('landing')}
          title="Go to EngageX Website"
        >
          <div>
            <Sparkles size={18} />
          </div>
          <span>
            <b>EngageX</b>
            <small>Omnichannel CRM</small>
          </span>
        </div>

        {activeWorkspace?.slug && activeWorkspace.slug !== 'savrdh-engagex' && (
          <div style={{
            margin: '10px 8px 12px',
            padding: '11px 12px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,.06)',
            border: '1px solid rgba(125,211,252,.18)'
          }}>
            <small style={{display:'block',fontSize:'8px',letterSpacing:'1.4px',color:'#7dd3fc',fontWeight:900,marginBottom:5}}>
              CLIENT WORKSPACE
            </small>
            <b style={{display:'block',fontSize:'11px',lineHeight:1.35,color:'#f8fafc'}}>
              {activeWorkspace.name}
            </b>
            <button
              type="button"
              onClick={() => void switchWorkspace?.('savrdh-engagex')}
              style={{
                marginTop:9,width:'100%',border:'1px solid rgba(255,255,255,.14)',background:'rgba(255,255,255,.05)',
                color:'#bae6fd',borderRadius:8,padding:'6px 8px',fontSize:9,fontWeight:800,cursor:'pointer'
              }}
            >
              ← Back to Clients
            </button>
          </div>
        )}

        <nav>
          {(activeWorkspace?.slug && activeWorkspace.slug !== 'savrdh-engagex' ? menuItems.filter(item => !['clients','data-extractor'].includes(item.id)) : menuItems).map((item) => {
            const Icon = item.icon;
            const isActive = appTab === item.id;
            return (
              <button
                key={item.id}
                className={isActive ? 'active' : ''}
                onClick={() => setAppTab(item.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '11px',
                  background: 'transparent',
                  border: 0,
                  textAlign: 'left',
                  cursor: 'pointer',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  color: isActive ? '#0891b2' : '#557181',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: '12px',
                  transition: '0.2s ease',
                }}
              >
                <Icon size={18} />
                <span style={{ flex: 1 }}>{item.name}</span>
                {item.badge && (
                  <span
                    style={{
                      fontSize: '8px',
                      background: '#e0f2fe',
                      color: '#0369a1',
                      padding: '2px 6px',
                      borderRadius: '999px',
                      fontWeight: 800,
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="sideBottom">
          <div
            style={{
              padding: '10px 12px',
              background: '#f8fafc',
              borderRadius: '10px',
              marginBottom: '12px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#64748b' }}>
              <span>Credits Available</span>
              <b style={{ color: '#0f172a' }}>{billing.message_credits.toLocaleString()}</b>
            </div>
            <div
              style={{
                height: '4px',
                background: '#e2e8f0',
                borderRadius: '99px',
                marginTop: '6px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, (billing.message_credits / 50000) * 100)}%`,
                  background: 'linear-gradient(90deg, #0284c7, #06b6d4)',
                }}
              />
            </div>
          </div>

          <small>PRODUCT BY</small>
          <b>Savrdh Technology</b>

          <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
            <button
              onClick={() => setCurrentView('landing')}
              style={{
                flex: 1,
                fontSize: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: '6px 8px',
                background: '#e0f7fa',
                color: '#006064',
                border: '1px solid #b2ebf2',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 700,
              }}
              title="View Public Landing Page"
            >
              <Globe size={13} /> Website
            </button>
            <button
              onClick={logout}
              style={{
                fontSize: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: '6px 8px',
                background: '#f1f5f9',
                color: '#475569',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              <LogOut size={13} /> Exit
            </button>
          </div>
        </div>
      </aside>

      {/* Main Panel */}
      <section className="crmMain">
        <header>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <small>{activeWorkspace?.slug && activeWorkspace.slug !== 'savrdh-engagex' ? `${activeWorkspace.name.toUpperCase()} · CLIENT CRM` : 'ENGAGEX COMMERCIAL CRM'}</small>
              <span
                style={{
                  fontSize: '8px',
                  background: '#dcfce7',
                  color: '#15803d',
                  padding: '1px 6px',
                  borderRadius: '999px',
                  fontWeight: 800,
                }}
              >
                LIVE
              </span>
            </div>
            <h1>{title}</h1>
            <p className="pageSub">{subtitle}</p>
            {activeWorkspace && (
              <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 800, color: '#075985', background: '#e0f7fa', border: '1px solid #bae6fd', borderRadius: 999, padding: '4px 8px' }}>
                <Building2 size={12} /> {activeWorkspace.name}
              </div>
            )}
          </div>

          <div className="crmHeaderActions" style={{ position: 'relative' }}>
            {/* Quick Switch to website */}
            <button
              onClick={() => setCurrentView('landing')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              <ExternalLink size={14} /> Public Website
            </button>

            {/* Notifications */}
            <button
              aria-label="Notifications"
              onClick={() => setShowNotifications(!showNotifications)}
              style={{
                position: 'relative',
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: showNotifications ? '#f0fdfa' : '#ffffff',
                color: showNotifications ? '#0891b2' : '#334155',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                transition: '0.15s ease',
              }}
              title="View Notifications"
            >
              <Bell size={18} />
              {unreadNotificationsCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    minWidth: '17px',
                    height: '17px',
                    borderRadius: '999px',
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: '9px',
                    fontWeight: 800,
                    display: 'grid',
                    placeItems: 'center',
                    padding: '0 3px',
                    boxShadow: '0 2px 5px rgba(239, 68, 68, 0.4)',
                  }}
                >
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div
                ref={notifRef}
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '360px',
                  maxWidth: '90vw',
                  background: '#ffffff',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.18)',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  padding: '16px',
                  zIndex: 100,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px',
                    paddingBottom: '10px',
                    borderBottom: '1px solid #f1f5f9',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <b style={{ fontSize: '13px', color: '#0f172a' }}>Notifications</b>
                    {unreadNotificationsCount > 0 && (
                      <span
                        style={{
                          fontSize: '8px',
                          background: '#fee2e2',
                          color: '#b91c1c',
                          padding: '2px 6px',
                          borderRadius: '999px',
                          fontWeight: 800,
                        }}
                      >
                        {unreadNotificationsCount} new
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {unreadNotificationsCount > 0 && (
                      <button
                        onClick={markAllNotificationsRead}
                        style={{
                          fontSize: '10px',
                          color: '#0891b2',
                          background: 'transparent',
                          border: 0,
                          cursor: 'pointer',
                          fontWeight: 700,
                          padding: '2px 4px',
                        }}
                      >
                        Mark all read
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotifications(false)}
                      style={{
                        background: '#f1f5f9',
                        border: 0,
                        width: '22px',
                        height: '22px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'grid',
                        placeItems: 'center',
                        color: '#64748b',
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>

                {notifications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 10px', color: '#94a3b8' }}>
                    <CheckCheck size={28} style={{ margin: '0 auto 8px', color: '#10b981' }} />
                    <b style={{ fontSize: '12px', display: 'block', color: '#334155' }}>All caught up!</b>
                    <span style={{ fontSize: '10px' }}>No notifications to display.</span>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      maxHeight: '340px',
                      overflowY: 'auto',
                      paddingRight: '2px',
                    }}
                  >
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          padding: '10px',
                          borderRadius: '10px',
                          background: notif.read ? '#ffffff' : '#f0fdfa',
                          border: '1px solid',
                          borderColor: notif.read ? '#f1f5f9' : '#ccfbf1',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          position: 'relative',
                        }}
                      >
                        {getNotificationIcon(notif.type)}

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                            <b
                              style={{
                                fontSize: '11px',
                                color: '#0f172a',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                fontWeight: notif.read ? 600 : 800,
                              }}
                            >
                              {notif.title}
                            </b>
                            {!notif.read && (
                              <span
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  background: '#0891b2',
                                  flexShrink: 0,
                                }}
                                title="Unread"
                              />
                            )}
                          </div>

                          <p
                            style={{
                              margin: '3px 0 5px',
                              fontSize: '10px',
                              color: '#475569',
                              lineHeight: 1.4,
                            }}
                          >
                            {notif.description}
                          </p>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '8px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Clock size={10} /> {notif.time}
                            </span>
                            <span
                              style={{
                                fontSize: '8px',
                                color: '#0891b2',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2px',
                              }}
                            >
                              Open {notif.targetTab} <ChevronRight size={10} />
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notif.id);
                          }}
                          style={{
                            background: 'transparent',
                            border: 0,
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: '2px',
                            borderRadius: '4px',
                            display: 'grid',
                            placeItems: 'center',
                            marginLeft: '2px',
                          }}
                          title="Dismiss"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div
                  style={{
                    marginTop: '12px',
                    paddingTop: '10px',
                    borderTop: '1px solid #f1f5f9',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '9px', color: '#94a3b8' }}>Real-time workspace alerts</span>
                  <button
                    onClick={() => {
                      setAppTab('settings');
                      setShowNotifications(false);
                    }}
                    style={{
                      fontSize: '9px',
                      color: '#0891b2',
                      background: 'transparent',
                      border: 0,
                      cursor: 'pointer',
                      fontWeight: 700,
                    }}
                  >
                    Full Audit Trail →
                  </button>
                </div>
              </div>
            )}

            {/* Admin Avatar */}
            <div className="adminAvatar">{userSession.avatar}</div>
            <span>
              <b>{userSession.name}</b>
              <small>{userSession.email}</small>
            </span>
          </div>
        </header>

        {children}
      </section>
    </main>
  );
};

import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  MessageCircle,
  MessageSquareText,
  Mail,
  BarChart3,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LoginPage: React.FC = () => {
  const { login, setCurrentView } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setNotice('');
    try { await login(email, password); } catch (error) { setNotice(error instanceof Error ? error.message : 'Sign-in failed.'); } finally { setLoading(false); }
  };

  const handleQuickLogin = (demoEmail: string, role: string) => {
    setEmail(demoEmail);
    setPassword('');
    setNotice('Enter the password for your existing Savrdh account. Your role is verified by the database.');
  };

  return (
    <main className="loginPage">
      {/* Left Brand Panel */}
      <section className="loginBrandPanel">
        <div className="loginBrand" style={{ cursor: 'pointer' }} onClick={() => setCurrentView('landing')}>
          <div className="brandMark">
            <Sparkles size={19} />
          </div>
          <div>
            <strong>EngageX</strong>
            <span>A Product by Savrdh Technology</span>
          </div>
        </div>

        <div className="loginPitch">
          <div className="loginPill">
            <ShieldCheck size={15} /> Secure Enterprise CRM Workspace
          </div>
          <h1>
            Connect. Engage.
            <br />
            <span>Grow.</span>
          </h1>
          <p>
            Manage contacts, broadcasts, and live conversations across WhatsApp, SMS, and Email from one unified
            intelligent workspace.
          </p>

          <div className="loginChannels">
            <div>
              <MessageCircle />
              <span>
                WhatsApp<strong>Campaigns</strong>
              </span>
            </div>
            <div>
              <MessageSquareText />
              <span>
                SMS<strong>Messaging</strong>
              </span>
            </div>
            <div>
              <Mail />
              <span>
                Email<strong>Broadcasts</strong>
              </span>
            </div>
          </div>

          <div className="loginMiniDash">
            <div>
              <BarChart3 size={20} />
              <span>
                <small>Carrier delivery benchmark</small>
                <strong>96.4% Delivery SLA</strong>
              </span>
            </div>
            <div className="miniBars">
              <i style={{ height: '40%' }} />
              <i style={{ height: '70%' }} />
              <i style={{ height: '55%' }} />
              <i style={{ height: '85%' }} />
              <i style={{ height: '65%' }} />
              <i style={{ height: '95%' }} />
              <i style={{ height: '100%' }} />
            </div>
          </div>
        </div>

        <div className="loginCopyright">© 2026 Savrdh Technology · EngageX SaaS</div>
      </section>

      {/* Right Form Panel */}
      <section className="loginFormPanel">
        <div className="loginBox">
          <div className="mobileLoginBrand">
            <div className="brandMark">
              <Sparkles size={18} />
            </div>
            <strong>EngageX</strong>
          </div>

          <div className="loginHeading">
            <span>SAVRDH TECHNOLOGY CRM</span>
            <h2>Sign in to EngageX</h2>
            <p>Access your omnichannel workspace and live campaign manager.</p>
          </div>

          {/* Quick Demo Logins Bar */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '10px 12px',
              marginBottom: '16px',
            }}
          >
            <small style={{ fontSize: '9px', color: '#64748b', display: 'block', marginBottom: '6px', fontWeight: 800 }}>
              SELECT ACCOUNT — PASSWORD REQUIRED:
            </small>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handleQuickLogin('savrdhtechnology@gmail.com', 'Owner')}
                style={{
                  fontSize: '9px',
                  background: '#e0f7fa',
                  color: '#006064',
                  border: '1px solid #b2ebf2',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                Owner / Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('karan.mehra@savrdh.com', 'Manager')}
                style={{
                  fontSize: '9px',
                  background: '#f1f5f9',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                Campaign Manager
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('rohan.joshi@savrdh.com', 'Employee')}
                style={{
                  fontSize: '9px',
                  background: '#f1f5f9',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                Support Agent
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <label>Business Email Address</label>
            <div className="loginInput">
              <Mail size={18} />
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
              />
            </div>

            <div className="passwordRow">
              <label>Password</label>
              <button
                type="button"
                onClick={() => setNotice('Use your existing Savrdh account password, or contact your workspace administrator for account recovery.')}
              >
                Forgot password?
              </button>
            </div>

            <div className="loginInput">
              <LockKeyhole size={18} />
              <input
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
              />
              <button type="button" className="eyeBtn" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <label className="remember">
              <input type="checkbox" defaultChecked />
              <span>Keep me signed in on this device</span>
            </label>

            <button className="loginSubmit" disabled={loading} type="submit">
              {loading ? 'Authenticating…' : 'Sign In to Workspace'} <ArrowRight size={18} />
            </button>

            {notice && <div className="loginNotice">{notice}</div>}
          </form>

          <p className="loginTerms">Connected to Savrdh Technology. Access is verified by your workspace membership.</p>

          <button
            onClick={() => setCurrentView('landing')}
            className="backWebsite"
            style={{ background: 'transparent', border: 0, cursor: 'pointer', font: 'inherit' }}
          >
            ← Back to EngageX website
          </button>
        </div>
      </section>
    </main>
  );
};

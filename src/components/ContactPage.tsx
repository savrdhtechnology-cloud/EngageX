import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  MessageCircle,
  MessageSquareText,
  Mail,
  Clock3,
  CheckCircle2,
  Building,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ContactPage: React.FC = () => {
  const { setCurrentView, setAppTab, addAuditLog } = useApp();

  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [interest, setInterest] = useState('Growth / Business Plan');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    addAuditLog('CONTACT_INQUIRY', 'Lead', `Received contact enquiry from ${name} (${company || 'Individual'}) - ${interest}`);
    setSubmitted(true);
  };

  const navigateToSection = (sectionId: string) => {
    setCurrentView('landing');
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  };

  return (
    <main>
      {/* Top Nav */}
      <nav className="nav shell">
        <div className="brand" style={{ cursor: 'pointer' }} onClick={() => setCurrentView('landing')}>
          <div className="brandMark">
            <Sparkles size={18} />
          </div>
          <div>
            <strong>EngageX</strong>
            <span>by Savrdh Technology</span>
          </div>
        </div>

        <div className="navLinks">
          <button onClick={() => setCurrentView('landing')} style={{ background: 'transparent', border: 0, cursor: 'pointer', font: 'inherit', color: 'inherit' }}>
            Home
          </button>
          <button onClick={() => navigateToSection('about')} style={{ background: 'transparent', border: 0, cursor: 'pointer', font: 'inherit', color: 'inherit' }}>
            About Us
          </button>
          <button onClick={() => navigateToSection('features')} style={{ background: 'transparent', border: 0, cursor: 'pointer', font: 'inherit', color: 'inherit' }}>
            Features
          </button>
          <button onClick={() => navigateToSection('pricing')} style={{ background: 'transparent', border: 0, cursor: 'pointer', font: 'inherit', color: 'inherit' }}>
            Pricing
          </button>
          <button onClick={() => navigateToSection('contact')} style={{ background: 'transparent', border: 0, cursor: 'pointer', fontWeight: 800, font: 'inherit', color: 'inherit' }}>
            Contact
          </button>
        </div>

        <div className="navActions">
          <button className="ghostBtn" onClick={() => setCurrentView('landing')}>
            Back to Website
          </button>
          <button className="primaryBtn small" onClick={() => { setAppTab('dashboard'); setCurrentView('app'); }}>
            CRM Demo <ArrowRight size={16} />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="innerHero compactHero">
        <div className="shell pageIntro centered">
          <div className="eyebrow">
            <span>Contact</span> EngageX Sales & Solutions Team
          </div>
          <h1>
            Let’s build better <span>customer communication.</span>
          </h1>
          <p>
            Tell us how your business communicates with customers and what you want to achieve with EngageX by Savrdh
            Technology.
          </p>
        </div>
      </section>

      {/* Contact Layout */}
      <section className="section shell contactLayout">
        <div className="contactInfo">
          <div className="kicker">GET IN TOUCH</div>
          <h2>Start a conversation with our team.</h2>
          <p>
            EngageX is developed by Savrdh Technology. For enterprise onboarding, high-volume WhatsApp Business Cloud
            API accounts, or multi-client agency requirements, get in touch below.
          </p>

          <div className="contactChannels">
            <div>
              <span className="featureIcon">
                <MessageCircle size={20} />
              </span>
              <b>WhatsApp Support</b>
              <small>+91 80 4719 2800</small>
            </div>
            <div>
              <span className="featureIcon">
                <MessageSquareText size={20} />
              </span>
              <b>DLT Carrier Advisory</b>
              <small>TRAI Registration guidance</small>
            </div>
            <div>
              <span className="featureIcon">
                <Mail size={20} />
              </span>
              <b>Direct Email</b>
              <small>savrdhtechnology@gmail.com</small>
            </div>
            <div>
              <span className="featureIcon">
                <Clock3 size={20} />
              </span>
              <b>Business Hours</b>
              <small>Mon - Sat, 9:00 AM - 7:00 PM IST</small>
            </div>
          </div>
        </div>

        {submitted ? (
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #dce8ee',
              borderRadius: '22px',
              padding: '40px',
              boxShadow: '0 22px 55px rgba(8,47,73,0.08)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: '#dcfce7',
                color: '#15803d',
                margin: '0 auto 16px',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <CheckCircle2 size={32} />
            </div>
            <h3 style={{ fontSize: '22px', margin: '0 0 10px', color: '#0f172a' }}>Thank you, {name}!</h3>
            <p style={{ color: '#64748b', fontSize: '13px', lineHeight: 1.6, maxWidth: '420px', margin: '0 auto 20px' }}>
              Your enquiry has been received by the Savrdh Technology solutions team. We will reach out to you within 2 hours.
            </p>
            <button
              className="primaryBtn"
              onClick={() => {
                setSubmitted(false);
                setAppTab('dashboard');
                setCurrentView('app');
              }}
              style={{ margin: 'auto' }}
            >
              Open EngageX Workspace Demo <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <form className="contactForm" onSubmit={handleSubmit}>
            <div>
              <label>Full Name *</label>
              <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div>
              <label>Company / Brand Name</label>
              <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company name" />
            </div>
            <div>
              <label>Business Email *</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label>Mobile Number (WhatsApp Preferred)</label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>
            <div className="full">
              <label>What are you interested in?</label>
              <select value={interest} onChange={(e) => setInterest(e.target.value)}>
                <option>Growth / Business Plan</option>
                <option>EngageX Starter</option>
                <option>Agency / Multi-client Solution</option>
                <option>Enterprise Custom SLA</option>
                <option>Dedicated WhatsApp Cloud API Consultation</option>
              </select>
            </div>
            <div className="full">
              <label>Message / Campaign Goals</label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us about your estimated monthly message volumes and target audience..."
              />
            </div>
            <button type="submit" className="primaryBtn formBtn">
              Send Enquiry <ArrowRight size={17} />
            </button>
            <small className="formNote">
              Savrdh Technology respects your data privacy. Your contact details will never be shared with third parties.
            </small>
          </form>
        )}
      </section>

      {/* Brand Footer */}
      <footer className="footer shell">
        <div className="brand" style={{ cursor: 'pointer' }} onClick={() => setCurrentView('landing')}>
          <div className="brandMark">
            <Sparkles size={18} />
          </div>
          <div>
            <strong>EngageX</strong>
            <span>A Product by Savrdh Technology</span>
          </div>
        </div>
        <p>Connect. Engage. Grow.</p>
        <span>© 2026 Savrdh Technology. All rights reserved.</span>
      </footer>
    </main>
  );
};

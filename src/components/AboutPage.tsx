import React from 'react';
import {
  Sparkles,
  ArrowRight,
  Target,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Building2,
  MessageCircle,
  Workflow,
  BarChart3,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AboutPage: React.FC = () => {
  const { setCurrentView, setAppTab } = useApp();

  return (
    <main className="subPage">
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
          <button onClick={() => setCurrentView('landing')} style={{ background: 'transparent', border: 0, cursor: 'pointer' }}>
            Home
          </button>
          <button onClick={() => setCurrentView('about')} style={{ background: 'transparent', border: 0, cursor: 'pointer', fontWeight: 800 }}>
            About Us
          </button>
          <button onClick={() => setCurrentView('contact')} style={{ background: 'transparent', border: 0, cursor: 'pointer' }}>
            Contact
          </button>
        </div>

        <div className="navActions">
          <button className="primaryBtn small" onClick={() => { setAppTab('dashboard'); setCurrentView('app'); }}>
            Open CRM Workspace <ArrowRight size={16} />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="innerHero aboutHeroNoNav">
        <div className="shell innerHeroGrid">
          <div className="pageIntro">
            <div className="eyebrow">
              <span>About</span> A Savrdh Technology product
            </div>
            <h1>
              Customer communication, <span>built for modern businesses.</span>
            </h1>
            <p>
              EngageX is an omnichannel customer communication platform designed to help businesses connect, engage,
              and grow through WhatsApp, SMS, and Email from one unified workspace.
            </p>
            <div className="heroActions">
              <button className="primaryBtn" onClick={() => setCurrentView('contact')}>
                Talk to our team <ArrowRight size={18} />
              </button>
              <button className="secondaryBtn" onClick={() => setCurrentView('landing')}>
                Back to EngageX
              </button>
            </div>
          </div>

          <div className="aboutOrb">
            <div className="orbCore">
              <Sparkles size={38} />
              <strong>EngageX</strong>
              <span>Connect. Engage. Grow.</span>
            </div>
            <div className="orbit orbit1">
              <MessageCircle size={20} />
            </div>
            <div className="orbit orbit2">
              <Workflow size={20} />
            </div>
            <div className="orbit orbit3">
              <BarChart3 size={20} />
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Value Section */}
      <section className="section shell">
        <div className="aboutStatement">
          <div>
            <div className="kicker">OUR PRODUCT</div>
            <h2>EngageX is an enterprise product by Savrdh Technology.</h2>
          </div>
          <p>
            Savrdh Technology develops digital products and software solutions focused on making business operations
            smarter, connected, and scalable. EngageX extends that vision to customer communication by bringing
            essential messaging channels, campaigns, analytics, and visual automations into a single platform.
          </p>
        </div>

        <div className="valueGrid">
          <article>
            <div className="featureIcon">
              <Target size={22} />
            </div>
            <h3>Our Mission</h3>
            <p>Make customer communication easier to manage, measure, and scale for businesses of all sizes.</p>
          </article>
          <article>
            <div className="featureIcon">
              <Zap size={22} />
            </div>
            <h3>Our Approach</h3>
            <p>Keep workflows simple for everyday teams while building enterprise architecture for automation.</p>
          </article>
          <article>
            <div className="featureIcon">
              <ShieldCheck size={22} />
            </div>
            <h3>Built for Business</h3>
            <p>Organization-based access, role controls, and multi-client capabilities are baked into every layer.</p>
          </article>
        </div>
      </section>

      {/* Dark Value Strip */}
      <section className="workflowSection">
        <div className="shell aboutDark">
          <div>
            <div className="kicker">WHY ENGAGEX</div>
            <h2>One unified workspace instead of disconnected communication tools.</h2>
            <p>
              Contacts, audiences, templates, campaigns, delivery analytics, and visual automated workflows work together
              in one seamless product experience.
            </p>
          </div>
          <div className="aboutChecks">
            <span>
              <CheckCircle2 /> WhatsApp Cloud API
            </span>
            <span>
              <CheckCircle2 /> Carrier DLT SMS
            </span>
            <span>
              <CheckCircle2 /> Transactional Email
            </span>
            <span>
              <CheckCircle2 /> Real-time Analytics
            </span>
            <span>
              <CheckCircle2 /> Scheduled Automations
            </span>
            <span>
              <CheckCircle2 /> Agency & Multi-client Ready
            </span>
          </div>
        </div>
      </section>

      {/* Parent Brand Card */}
      <section className="section shell">
        <div className="companyCard">
          <div className="companyIcon">
            <Building2 size={28} />
          </div>
          <div>
            <div className="kicker">PARENT BRAND</div>
            <h2>Savrdh Technology</h2>
            <p>
              EngageX is developed and operated as a flagship Savrdh Technology SaaS solution for businesses that want
              a reliable way to communicate with customers across multiple channels with enterprise security.
            </p>
          </div>
          <button className="primaryBtn" onClick={() => setCurrentView('contact')}>
            Contact Us <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Footer */}
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

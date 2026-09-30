import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  ChevronRight,
  Play,
  CheckCircle2,
  MessageCircle,
  MessageSquareText,
  Mail,
  Workflow,
  BarChart3,
  ShieldCheck,
  Zap,
  Target,
  ExternalLink,
  Users,
  Building2,
  Monitor,
  Cog,
  Cloud,
  Phone,
  Send,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const slides = [
  {
    tag: 'Enterprise Omnichannel Platform',
    title: 'Customer communication, ',
    accent: 'simplified and automated.',
    text: 'Bring WhatsApp Business, Carrier SMS, and Transactional Email together in one unified CRM workspace. Built by Savrdh Technology for modern scaling brands.',
    visual: 'workspace',
  },
  {
    tag: 'Meta WhatsApp Cloud API',
    title: 'High-converting campaigns, ',
    accent: 'with 98% delivery rate.',
    text: 'Broadcast verified WhatsApp templates, interactive quick-replies, and rich catalogs with telecom DLT compliance and real-time read receipts.',
    visual: 'workspace',
  },
  {
    tag: 'Visual Journey Builder',
    title: 'Automated workflows that ',
    accent: 'turn leads into buyers.',
    text: 'Design trigger-based drip sequences, abandoned cart recovery, and customer review requests with multi-channel fallback and zero coding required.',
    visual: 'workspace',
  },
  {
    tag: 'Savrdh Technology · Build · Automate · Grow',
    title: 'Let’s build better ',
    accent: 'customer communication.',
    text: 'EngageX combines customer messaging with the wider Savrdh Technology ecosystem — CRM solutions, automation tools, web applications, and custom software built to help businesses scale.',
    visual: 'savrdh',
  },
];

const features = [
  {
    icon: MessageCircle,
    title: 'WhatsApp Business Cloud API',
    text: 'Official Meta Graph API integration with verified green tick support, approved templates, and zero carrier blockages.',
  },
  {
    icon: MessageSquareText,
    title: 'Carrier-Grade SMS Engine',
    text: 'TRAI DLT compliant sender ID mapping with instant delivery receipts and automatic high-throughput carrier routing.',
  },
  {
    icon: Mail,
    title: 'Rich Email Infrastructure',
    text: 'Resend email delivery engine with SPF, DKIM, and DMARC verification for maximum inbox placement.',
  },
  {
    icon: Workflow,
    title: 'Visual Workflow Builder',
    text: 'Event-driven customer journeys with conditional branches, timed delays, and automated multi-channel follow-ups.',
  },
  {
    icon: Users,
    title: 'Audience & Consent Management',
    text: 'Smart contact segmentation, tag assignment, Excel/CSV spreadsheet imports, and TRAI opt-in compliance enforcement.',
  },
  {
    icon: BarChart3,
    title: 'Real-Time Delivery Analytics',
    text: 'Granular tracking of sent, delivered, read, clicked, and replied messages with exportable audit logs.',
  },
];

const plans = [
  {
    name: 'Starter Tier',
    price: '₹2,499',
    desc: 'For growing businesses starting their multi-channel journey.',
    items: ['25,000 Contacts Allowance', '50,000 Monthly Messages', 'WhatsApp Cloud API access', 'Carrier SMS Broadcast', 'Standard Reporting'],
  },
  {
    name: 'Pro Scale Tier',
    price: '₹7,999',
    popular: true,
    desc: 'Our most popular tier for high-volume customer engagement.',
    items: [
      '100,000 Contacts Allowance',
      '250,000 Monthly Messages',
      'Interactive Live Inbox & Replies',
      'Visual Automation Workflow Builder',
      'Custom TRAI DLT Sender ID',
      'Priority 99.98% SLA Delivery Route',
    ],
  },
  {
    name: 'Enterprise Custom',
    price: '₹19,999',
    desc: 'Dedicated infrastructure for enterprises and digital agencies.',
    items: [
      '500,000+ Contacts Allowance',
      '1,000,000+ Messages / Month',
      'Dedicated WhatsApp Account Manager',
      'Multi-workspace & Sub-accounts',
      'Custom Webhook Integrations',
      '24/7 Dedicated Priority Support',
    ],
  },
];

export const LandingPage: React.FC = () => {
  const { setCurrentView, setAppTab } = useApp();
  const [slide, setSlide] = useState(0);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', message: '' });

  useEffect(() => {
    const timer = setInterval(() => {
      setSlide((s) => (s + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const s = slides[slide];

  const handleOpenApp = (tab = 'dashboard') => {
    setAppTab(tab);
    setCurrentView('app');
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <main>
      {/* Top Navigation */}
      <nav className="nav shell">
        <div className="brand" style={{ cursor: 'pointer' }} onClick={() => scrollTo('top')}>
          <div className="brandMark">
            <Sparkles size={18} />
          </div>
          <div>
            <strong>EngageX</strong>
            <span>by Savrdh Technology</span>
          </div>
        </div>

        <div className="navLinks">
          <a
            href="#about"
            onClick={(e) => {
              e.preventDefault();
              scrollTo('about');
            }}
          >
            About Us
          </a>
          <a
            href="#features"
            onClick={(e) => {
              e.preventDefault();
              scrollTo('features');
            }}
          >
            Features
          </a>
          <a
            href="#workflow"
            onClick={(e) => {
              e.preventDefault();
              scrollTo('workflow');
            }}
          >
            Workflows
          </a>
          <a
            href="#pricing"
            onClick={(e) => {
              e.preventDefault();
              scrollTo('pricing');
            }}
          >
            Pricing
          </a>
          <a
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              scrollTo('contact');
            }}
          >
            Contact
          </a>
          <button
            onClick={() => handleOpenApp('dashboard')}
            style={{
              background: '#e0f7fa',
              color: '#006064',
              border: '1px solid #b2ebf2',
              borderRadius: '6px',
              padding: '4px 10px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '11px',
            }}
          >
            CRM Demo
          </button>
        </div>

        <div className="navActions">
          <button className="ghostBtn" onClick={() => setCurrentView('login')}>
            Sign In
          </button>
          <button className="primaryBtn small" onClick={() => handleOpenApp('dashboard')}>
            Launch Workspace <ArrowRight size={16} />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero shell" id="top">
        <div className="heroCopy animatedSlide" key={slide}>
          <div className="eyebrow">
            <span>EngageX</span>
            {s.tag}
            <ChevronRight size={15} />
          </div>

          <h1>
            {s.title}
            <span>{s.accent}</span>
          </h1>

          <p>{s.text}</p>

          <div className="heroActions">
            <button className="primaryBtn" onClick={() => s.visual === 'savrdh' ? scrollTo('features') : handleOpenApp('dashboard')}>
              {s.visual === 'savrdh' ? 'Explore Product' : 'Open CRM Workspace'} <ArrowRight size={18} />
            </button>
            <button className="secondaryBtn" onClick={() => s.visual === 'savrdh' ? scrollTo('contact') : handleOpenApp('messages')}>
              {s.visual === 'savrdh' ? <><Building2 size={17} /> Contact Solutions Team</> : <><Play size={17} fill="currentColor" /> Test Live Chat Simulator</>}
            </button>
          </div>

          <div className="sliderDots">
            {slides.map((_, i) => (
              <button
                key={i}
                aria-label={`Slide ${i + 1}`}
                className={i === slide ? 'active' : ''}
                onClick={() => setSlide(i)}
              />
            ))}
          </div>

          <div className="trustRow">
            <span>
              <CheckCircle2 size={16} /> Multi-channel ready
            </span>
            <span>
              <CheckCircle2 size={16} /> Visual automations
            </span>
            <span>
              <CheckCircle2 size={16} /> Built by Savrdh Technology
            </span>
          </div>
        </div>

        {/* Hero Visual Mockup with Floating Elements */}
        <div className={`heroVisual ${s.visual === 'savrdh' ? 'brandHeroVisual' : ''}`}>
          <div className="glow" />
          {s.visual === 'savrdh' && (
            <div className="savrdhBrandPanel animatedSlide">
              <div className="brandPanelGlow" />
              <div className="savrdhScript">Savrdh<br/><span>Technology</span></div>
              <div className="brandUnderline" />
              <p className="brandGroup">SAVRDH GROUP OF COMPANIES</p>
              <div className="buildStack">
                <span>BUILD</span>
                <span>AUTOMATE</span>
                <span>GROW</span>
              </div>
              <div className="brandServiceDock">
                <div><Monitor size={23}/><span>Web Applications</span></div>
                <div><Cog size={23}/><span>CRM Solutions</span></div>
                <div><Cloud size={23}/><span>Automation Tools</span></div>
                <div><Sparkles size={23}/><span>Custom Software</span></div>
              </div>
            </div>
          )}
          <div className="dashboardCard floatingDashboard" style={{ cursor: 'pointer', display: s.visual === 'savrdh' ? 'none' : undefined }} onClick={() => handleOpenApp('dashboard')}>
            <div className="dashTop">
              <div>
                <span className="muted">EngageX Workspace</span>
                <h3>Live Communication Console</h3>
              </div>
              <div className="statusPill">Online · 99.98% SLA</div>
            </div>

            <div className="metrics">
              <div>
                <span>Active Audience</span>
                <strong>24,892</strong>
                <small>+12.8% this month</small>
              </div>
              <div>
                <span>Campaigns</span>
                <strong>186</strong>
                <small>Active dispatch</small>
              </div>
              <div>
                <span>Messages Sent</span>
                <strong>1.4M</strong>
                <small>+18.2% delivered</small>
              </div>
              <div>
                <span>Delivery Rate</span>
                <strong>96.4%</strong>
                <small>Meta Cloud SLA</small>
              </div>
            </div>

            <div className="chartCard">
              <div className="chartHeader">
                <div>
                  <span>Daily Dispatch Activity</span>
                  <strong>Messages Delivered</strong>
                </div>
                <small>Real-time telemetry</small>
              </div>
              <div className="chart">
                {[44, 62, 51, 76, 67, 88, 82, 95, 72, 90, 84, 100].map((h, i) => (
                  <i key={i} style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>

            <div className="channelRow">
              <div className="channel whatsapp">
                <MessageCircle size={18} />
                <span>
                  WhatsApp<strong>98.1%</strong>
                </span>
              </div>
              <div className="channel sms">
                <MessageSquareText size={18} />
                <span>
                  SMS (DLT)<strong>94.8%</strong>
                </span>
              </div>
              <div className="channel email">
                <Mail size={18} />
                <span>
                  Email<strong>96.3%</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="floatingCard fc1" style={{ display: s.visual === 'savrdh' ? 'none' : undefined }} onClick={() => handleOpenApp('messages')}>
            <div className="floatIcon whatsapp">
              <MessageCircle size={19} />
            </div>
            <div>
              <small>WhatsApp Business</small>
              <strong>Message Delivered ✓✓</strong>
            </div>
            <CheckCircle2 size={17} color="#25d366" />
          </div>

          <div className="floatingCard fc2" style={{ display: s.visual === 'savrdh' ? 'none' : undefined }} onClick={() => handleOpenApp('campaigns')}>
            <div className="floatIcon email">
              <Mail size={19} />
            </div>
            <div>
              <small>Email Campaign</small>
              <strong>12,480 sent · 42% open</strong>
            </div>
          </div>
        </div>
      </section>

      {/* Omnichannel Channel Strip */}
      <section className="channelStrip">
        <div className="shell stripInner">
          <span>Enterprise Channels Unified</span>
          <div>
            <MessageCircle size={19} /> WhatsApp Cloud API
          </div>
          <div>
            <MessageSquareText size={19} /> Carrier SMS (DLT)
          </div>
          <div>
            <Mail size={19} /> Resend Email
          </div>
          <div>
            <Workflow size={19} /> Visual Automations
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="section shell" id="about" style={{ scrollMarginTop: '80px' }}>
        <div className="sectionHead">
          <div className="kicker">ABOUT ENGAGEX</div>
          <h2>
            Customer communication, <span>built for modern businesses.</span>
          </h2>
          <p>
            EngageX is an enterprise-grade omnichannel customer engagement platform designed by Savrdh Technology to help
            growing brands connect, engage, and scale across WhatsApp, Carrier SMS, and Email from one unified workspace.
          </p>
        </div>

        <div className="aboutStatement">
          <div>
            <div className="kicker">OUR PRODUCT</div>
            <h2>Enterprise communication engineered by Savrdh Technology.</h2>
          </div>
          <p>
            Savrdh Technology develops digital products and software solutions focused on making business operations
            smarter, connected, and scalable. EngageX extends that vision to customer communication by bringing
            essential messaging channels, campaigns, analytics, and visual automations into a single reliable platform.
          </p>
        </div>

        <div className="valueGrid" style={{ marginBottom: '40px' }}>
          <article>
            <div className="featureIcon">
              <Target size={22} />
            </div>
            <h3>Our Mission</h3>
            <p>Make customer communication easier to manage, measure, and scale for businesses of all sizes with zero carrier friction.</p>
          </article>
          <article>
            <div className="featureIcon">
              <Zap size={22} />
            </div>
            <h3>Our Approach</h3>
            <p>Keep everyday workflows intuitive for marketing and support teams while delivering high-throughput enterprise infrastructure.</p>
          </article>
          <article>
            <div className="featureIcon">
              <ShieldCheck size={22} />
            </div>
            <h3>Built for Business</h3>
            <p>TRAI DLT compliance, Meta Graph Cloud API verification, role controls, and multi-workspace architecture baked in.</p>
          </article>
        </div>

        {/* Parent Brand Card */}
        <div className="companyCard">
          <div className="companyIcon">
            <Building2 size={28} />
          </div>
          <div>
            <div className="kicker">PARENT BRAND</div>
            <h2>Savrdh Technology</h2>
            <p>
              EngageX is developed and operated as a flagship SaaS platform by Savrdh Technology for organizations that want
              a reliable way to communicate with their customers across multiple channels with enterprise security.
            </p>
          </div>
          <a
            href="#contact"
            className="primaryBtn"
            onClick={(e) => {
              e.preventDefault();
              scrollTo('contact');
            }}
          >
            Contact Team <ArrowRight size={18} />
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section className="section shell" id="features" style={{ scrollMarginTop: '80px' }}>
        <div className="sectionHead">
          <div className="kicker">COMPLETE OMNICHANNEL SUITE</div>
          <h2>
            Engineered to make customer communication <span>simple and powerful.</span>
          </h2>
          <p>
            From contact directory management to multi-channel campaign broadcasts and real-time delivery analytics,
            EngageX gives your team one unified workspace.
          </p>
        </div>

        <div className="featureGrid">
          {features.map(({ icon: Icon, title, text }) => (
            <article className="featureCard" key={title}>
              <div className="featureIcon">
                <Icon size={22} />
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
              <button
                onClick={() => handleOpenApp('dashboard')}
                style={{
                  background: 'transparent',
                  border: 0,
                  color: '#0891b2',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '11px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: 0,
                  marginTop: '10px',
                }}
              >
                Explore in CRM <ArrowRight size={14} />
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* Interactive 5-Step Workflow Section */}
      <section className="workflowSection" id="workflow">
        <div className="shell workflowWrap">
          <div className="workflowCopy">
            <div className="kicker">CAMPAIGN BUILDER</div>
            <h2>Launch multi-channel campaigns in simple steps.</h2>
            <p>
              Orchestrate targeted messages across WhatsApp, SMS, and Email without fragmented dashboards or messy
              spreadsheets.
            </p>

            <div className="steps">
              {[
                { title: 'Campaign Objective', desc: 'Define your campaign title and marketing goals.' },
                { title: 'Audience & Consent', desc: 'Filter active contacts by opt-in tags to respect regulations.' },
                { title: 'Channel Selection', desc: 'Choose WhatsApp, SMS, Email, or simultaneous multi-channel.' },
                { title: 'Personalized Message', desc: 'Compose with variables like {{first_name}} and {{company}}.' },
                { title: 'Instant Dispatch', desc: 'Queue live delivery with automated retry and read receipts.' },
              ].map((step, i) => (
                <div className="step" key={step.title}>
                  <b>{i + 1}</b>
                  <span>
                    <strong>{step.title}</strong>
                    <small>{step.desc}</small>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="builderMockup">
            <div className="browserBar">
              <i />
              <i />
              <i />
              <span>engagex.savrdh.com / campaigns / wizard</span>
            </div>
            <div className="builderBody">
              <aside>
                <div className="miniBrand">X</div>
                <div className="sideActive">⌁</div>
                <div>◎</div>
                <div>◫</div>
                <div>▥</div>
              </aside>
              <div className="builderMain">
                <span className="muted">Multi-Channel Dispatcher</span>
                <h3>Choose Delivery Channels</h3>
                <p>Select one or more verified routes for this campaign.</p>

                <div className="channelSelect active">
                  <MessageCircle size={20} color="#15803d" />
                  <div>
                    <strong>WhatsApp Business Platform</strong>
                    <small>Official Meta Cloud API (98.1% delivered)</small>
                  </div>
                  <CheckCircle2 size={18} color="#15803d" />
                </div>

                <div className="channelSelect active smsC">
                  <MessageSquareText size={20} color="#0369a1" />
                  <div>
                    <strong>Carrier SMS (DLT Approved)</strong>
                    <small>Header: SVRDTC (1,000 SMS / sec)</small>
                  </div>
                  <CheckCircle2 size={18} color="#0369a1" />
                </div>

                <div className="channelSelect">
                  <Mail size={20} color="#b45309" />
                  <div>
                    <strong>Rich HTML Email</strong>
                    <small>Resend transactional infrastructure</small>
                  </div>
                  <span className="circle" />
                </div>

                <button className="primaryBtn builderNext" onClick={() => handleOpenApp('campaigns')}>
                  Try Interactive Wizard <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="section shell" id="pricing">
        <div className="sectionHead">
          <div className="kicker">COMMERCIAL PLANS</div>
          <h2>Transparent pricing that scales with your business.</h2>
          <p>Start small, scale seamlessly as your customer base and broadcast volume grow.</p>
        </div>

        <div className="pricingGrid">
          {plans.map((plan) => (
            <article className={`priceCard ${plan.popular ? 'popular' : ''}`} key={plan.name}>
              {plan.popular && <div className="popularTag">Most Popular</div>}
              <span className="planName">{plan.name}</span>
              <div className="price">
                {plan.price}
                <small>/month</small>
              </div>
              <p>{plan.desc}</p>
              <button
                className={plan.popular ? 'primaryBtn priceBtn' : 'secondaryBtn priceBtn'}
                onClick={() => handleOpenApp('billing')}
              >
                Choose {plan.name}
              </button>
              <div className="planItems">
                {plan.items.map((item) => (
                  <span key={item}>
                    <CheckCircle2 size={16} />
                    {item}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
        <p className="billingNote">
          Telecom operator DLT fees and Meta WhatsApp conversation fees are billed directly via transparent usage ledgers.
        </p>
      </section>

      {/* Contact Section */}
      <section className="section shell" id="contact" style={{ scrollMarginTop: '80px' }}>
        <div className="sectionHead">
          <div className="kicker">GET IN TOUCH</div>
          <h2>
            Let’s build better <span>customer communication.</span>
          </h2>
          <p>
            Have questions about Meta WhatsApp Cloud API approval, telecom DLT registration, custom webhooks, or enterprise tier onboarding? Our solutions team is here to assist.
          </p>
        </div>

        <div className="contactLayout">
          <div className="contactInfo">
            <div className="kicker">SAVRDH TECHNOLOGY</div>
            <h2>Talk directly with our product team.</h2>
            <p>
              Whether you need guidance on high-volume WhatsApp broadcasts, transactional SMS sender IDs, or custom enterprise CRM integrations, we respond within hours.
            </p>

            <div className="contactChannels">
              <div>
                <div className="featureIcon">
                  <Mail size={18} />
                </div>
                <b>Email Support</b>
                <span style={{ fontSize: '12px', color: '#0891b2', fontWeight: 600 }}>savrdhtechnology@gmail.com</span>
                <small>24/7 technical & sales support</small>
              </div>

              <div>
                <div className="featureIcon">
                  <MessageCircle size={18} />
                </div>
                <b>WhatsApp Desk</b>
                <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>Official Cloud API</span>
                <small>Instant answers & sandbox access</small>
              </div>
            </div>
          </div>

          <form
            className="contactForm"
            onSubmit={(e) => {
              e.preventDefault();
              setContactSubmitted(true);
            }}
          >
            {contactSubmitted ? (
              <div style={{ gridColumn: '1 / -1', padding: '30px', textAlign: 'center', background: '#ecfdf5', borderRadius: '12px', border: '1px solid #a7f3d0' }}>
                <CheckCircle2 size={36} style={{ color: '#059669', margin: '0 auto 10px' }} />
                <h3 style={{ color: '#065f46', margin: '0 0 6px' }}>Thank you! Your message has been sent.</h3>
                <p style={{ color: '#047857', fontSize: '13px', margin: 0 }}>Our solutions team at Savrdh Technology will reach out to you shortly.</p>
                <button
                  type="button"
                  onClick={() => setContactSubmitted(false)}
                  style={{ marginTop: '15px', background: '#059669', color: '#fff', border: 0, padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                >
                  Send another inquiry
                </button>
              </div>
            ) : (
              <>
                <div>
                  <label>YOUR NAME</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label>BUSINESS EMAIL</label>
                  <input
                    type="email"
                    required
                    placeholder="rahul@company.com"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  />
                </div>
                <div className="full">
                  <label>PHONE / WHATSAPP NUMBER</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  />
                </div>
                <div className="full">
                  <label>HOW CAN WE HELP?</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Tell us about your estimated monthly message volumes and target audience..."
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  />
                </div>
                <button type="submit" className="primaryBtn formBtn">
                  Send Inquiry <Send size={15} />
                </button>
                <div className="formNote">
                  We respect your privacy. No spam, ever.
                </div>
              </>
            )}
          </form>
        </div>
      </section>

      {/* CTA Box */}
      <section className="ctaSection">
        <div className="shell ctaBox">
          <div>
            <div className="kicker light">READY TO SCALE?</div>
            <h2>Turn every customer conversation into a growth opportunity.</h2>
            <p>Connect your business to WhatsApp, SMS, and Email with EngageX by Savrdh Technology.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="whiteBtn" onClick={() => handleOpenApp('dashboard')}>
              Open CRM Workspace <ArrowRight size={18} />
            </button>
            <a
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                scrollTo('contact');
              }}
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.3)',
                padding: '14px 20px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              Contact Sales Team
            </a>
          </div>
        </div>
      </section>

      {/* Brand Footer */}
      <footer className="footer shell">
        <div className="brand" style={{ cursor: 'pointer' }} onClick={() => scrollTo('top')}>
          <div className="brandMark">
            <Sparkles size={18} />
          </div>
          <div>
            <strong>EngageX</strong>
            <span>A Product by Savrdh Technology</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '12px' }}>
          <a
            href="#about"
            onClick={(e) => {
              e.preventDefault();
              scrollTo('about');
            }}
            style={{ color: '#607589', textDecoration: 'none' }}
          >
            About Us
          </a>
          <a
            href="#features"
            onClick={(e) => {
              e.preventDefault();
              scrollTo('features');
            }}
            style={{ color: '#607589', textDecoration: 'none' }}
          >
            Features
          </a>
          <a
            href="#workflow"
            onClick={(e) => {
              e.preventDefault();
              scrollTo('workflow');
            }}
            style={{ color: '#607589', textDecoration: 'none' }}
          >
            Workflows
          </a>
          <a
            href="#pricing"
            onClick={(e) => {
              e.preventDefault();
              scrollTo('pricing');
            }}
            style={{ color: '#607589', textDecoration: 'none' }}
          >
            Pricing
          </a>
          <a
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              scrollTo('contact');
            }}
            style={{ color: '#607589', textDecoration: 'none' }}
          >
            Contact
          </a>
        </div>

        <p style={{ margin: 0 }}>Connect. Engage. Grow.</p>
        <span>© 2026 Savrdh Technology. All rights reserved.</span>
      </footer>
    </main>
  );
};

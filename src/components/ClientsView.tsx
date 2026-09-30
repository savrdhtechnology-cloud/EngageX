import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Plus, Search, Users, MessageCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { CommercialShell } from './CommercialShell';
import { supabase } from '../lib/supabase';

type ClientWorkspace = {
  id: string;
  slug: string;
  name: string;
  owner_id: string;
  settings: Record<string, any>;
  created_at: string;
};

const slugify = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 56);

export const ClientsView: React.FC = () => {
  const [clients, setClients] = useState<ClientWorkspace[]>([]);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '' });

  const loadClients = async () => {
    setLoading(true); setNotice('');
    const { data, error } = await supabase
      .from('engagex_workspaces')
      .select('id,slug,name,owner_id,settings,created_at')
      .eq('settings->>workspaceType', 'Client')
      .order('created_at', { ascending: false });
    if (error) setNotice(error.message);
    setClients((data || []) as ClientWorkspace[]);
    setLoading(false);
  };

  useEffect(() => { void loadClients(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? clients.filter(c => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)) : clients;
  }, [clients, query]);

  const createClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true); setNotice('');
    const slug = slugify(form.name);
    const { error } = await supabase.rpc('engagex_create_client_workspace', {
      p_name: form.name.trim(),
      p_slug: slug,
      p_contact_email: form.email.trim(),
      p_contact_phone: form.phone.trim(),
    });
    if (error) setNotice(error.message);
    else {
      setNotice('Client workspace created successfully.');
      setForm({ name: '', email: '', phone: '' });
      setShowForm(false);
      await loadClients();
    }
    setSaving(false);
  };

  return (
    <CommercialShell
      title="Clients"
      subtitle="Create and manage separate company workspaces for campaigns, contacts and WhatsApp follow-ups."
    >
      <div style={{ padding: '18px 26px 34px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 1, minWidth: 260 }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 420 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search client company..."
                style={{ width: '100%', padding: '11px 12px 11px 36px', border: '1px solid #dbe7ee', borderRadius: 10, background: '#fff' }}
              />
            </div>
            <button onClick={() => void loadClients()} title="Refresh" style={{ width: 40, height: 40, borderRadius: 10, border: '1px solid #dbe7ee', background: '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
              <RefreshCw size={16} />
            </button>
          </div>
          <button onClick={() => setShowForm(v => !v)} className="primaryBtn small">
            <Plus size={16} /> Add Client Company
          </button>
        </div>

        {notice && <div className="notice" style={{ marginBottom: 14 }}>{notice}</div>}

        {showForm && (
          <form onSubmit={createClient} style={{ background: '#fff', border: '1px solid #dbe7ee', borderRadius: 16, padding: 18, marginBottom: 18, display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr auto', gap: 10, alignItems: 'end' }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: '#475569' }}>
              Company Name
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="e.g. ABC Private Limited" style={{ display: 'block', width: '100%', marginTop: 6, padding: 10, border: '1px solid #dbe7ee', borderRadius: 9 }} />
            </label>
            <label style={{ fontSize: 11, fontWeight: 800, color: '#475569' }}>
              Contact Email
              <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" placeholder="optional" style={{ display: 'block', width: '100%', marginTop: 6, padding: 10, border: '1px solid #dbe7ee', borderRadius: 9 }} />
            </label>
            <label style={{ fontSize: 11, fontWeight: 800, color: '#475569' }}>
              Contact Phone
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="optional" style={{ display: 'block', width: '100%', marginTop: 6, padding: 10, border: '1px solid #dbe7ee', borderRadius: 9 }} />
            </label>
            <button disabled={saving} className="primaryBtn small" type="submit">{saving ? 'Creating…' : 'Create Workspace'}</button>
          </form>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14 }}>
          {loading ? (
            <div className="featureCard">Loading client workspaces…</div>
          ) : filtered.length === 0 ? (
            <div className="featureCard" style={{ gridColumn: '1/-1', textAlign: 'center', padding: 42 }}>
              <Building2 size={34} style={{ margin: '0 auto 10px', color: '#0891b2' }} />
              <h3 style={{ margin: '0 0 6px' }}>No client companies found</h3>
              <p style={{ margin: 0, color: '#64748b' }}>Add a company to create a separate EngageX workspace.</p>
            </div>
          ) : filtered.map(client => (
            <article key={client.id} className="featureCard" style={{ minHeight: 190, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <div className="featureIcon"><Building2 size={21} /></div>
                <span style={{ fontSize: 9, fontWeight: 900, color: '#047857', background: '#ecfdf5', padding: '5px 8px', borderRadius: 999 }}>ACTIVE</span>
              </div>
              <h3 style={{ marginBottom: 6 }}>{client.name}</h3>
              <p style={{ minHeight: 0, margin: '0 0 12px' }}>{client.settings?.purpose || 'Separate client communication workspace.'}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 'auto' }}>
                <span style={{ fontSize: 10, background: '#f0f9ff', color: '#0369a1', padding: '5px 8px', borderRadius: 999 }}><Users size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Contacts isolated</span>
                <span style={{ fontSize: 10, background: '#ecfdf5', color: '#15803d', padding: '5px 8px', borderRadius: 999 }}><MessageCircle size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} /> WhatsApp ready</span>
              </div>
              <div style={{ marginTop: 14, fontSize: 10, color: '#64748b', display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <span>{client.slug}</span>
                <span style={{ color: '#0891b2', fontWeight: 800 }}>Workspace <ArrowRight size={12} style={{ verticalAlign: 'middle' }} /></span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </CommercialShell>
  );
};

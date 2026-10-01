import React, { useState, useMemo, useEffect, ChangeEvent } from 'react';
import {
  ContactRound,
  Search,
  Plus,
  Download,
  Upload,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  AlertTriangle,
  Tag,
  Phone,
  Mail,
  Building,
  Check,
} from 'lucide-react';
import { csvCell, normalizePhone } from '../lib/metrics';
import * as XLSX from 'xlsx';
import { CommercialShell } from './CommercialShell';
import { useApp } from '../context/AppContext';
import { Contact } from '../types';
import { supabase } from '../lib/supabase';

const DEFAULT_WHATSAPP_GROUP_LINK = 'https://chat.whatsapp.com/KdCB01biJWTH6ihxLjFO8O';
const DEFAULT_INVITE_MESSAGE = `Namaste {{first_name}} ji,\n\nAKBS Poultry Farming Private Limited se aapko hamare official WhatsApp updates group me join karne ka invite hai.\n\n*Join Group:* {{group_link}}\n\nYahan aapko project updates, process information aur important notices milenge.\n\nDhanyavaad,\n*AKBS Poultry Farming Private Limited*`;

export const ContactsView: React.FC = () => {
  const { contacts, templates, addContact, updateContact, deleteContact, bulkDeleteContacts, importContacts, workspaceSettings, activeWorkspace } = useApp();

  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [notice, setNotice] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [bulkWhatsAppQueue, setBulkWhatsAppQueue] = useState<Contact[]>([]);
  const [bulkIndex, setBulkIndex] = useState(0);
  const [directoryMode, setDirectoryMode] = useState<'prospects' | 'contacts'>('prospects');
  const [prospects, setProspects] = useState<any[]>([]);
  const [prospectsLoading, setProspectsLoading] = useState(false);
  const [prospectCategory, setProspectCategory] = useState('all');
  const [prospectCity, setProspectCity] = useState('all');
  const [prospectProduct, setProspectProduct] = useState('all');
  const [prospectDate, setProspectDate] = useState<'all' | 'today' | '7d' | '30d'>('all');

  useEffect(() => {
    const loadProspects = async () => {
      if (!activeWorkspace?.id) {
        setProspects([]);
        return;
      }
      setProspectsLoading(true);
      const { data, error } = await supabase
        .from('engagex_prospects')
        .select('*')
        .eq('workspace_id', activeWorkspace.id)
        .order('created_at', { ascending: false });
      if (error) setError(error.message);
      setProspects(data || []);
      setProspectsLoading(false);
    };
    void loadProspects();
  }, [activeWorkspace?.id]);

  const prospectCategories = useMemo(
    () => Array.from(new Set(prospects.map((p:any) => (p.business_type || p.category || '').trim()).filter(Boolean))).sort(),
    [prospects]
  );

  const prospectCities = useMemo(
    () => Array.from(new Set(prospects.map((p:any) => (p.location || p.address || '').trim()).filter(Boolean))).sort(),
    [prospects]
  );

  const prospectProducts = useMemo(
    () => Array.from(new Set(prospects.map((p:any) => (p.recommended_product || '').trim()).filter(Boolean))).sort(),
    [prospects]
  );

  const filteredProspects = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = new Date();
    let cutoff: Date | null = null;
    if (prospectDate === 'today') {
      cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (prospectDate === '7d') {
      cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (prospectDate === '30d') {
      cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return prospects.filter((p:any) => {
      const categoryValue = (p.business_type || p.category || '').trim();
      const cityValue = (p.location || p.address || '').trim();
      const searchable = [
        p.business_name, p.phone, p.email, p.website, p.address,
        p.location, p.business_type, p.category, p.recommended_product
      ].map((v:any) => String(v || '').toLowerCase());
      const matchesSearch = !q || searchable.some(v => v.includes(q));
      const matchesCategory = prospectCategory === 'all' || categoryValue === prospectCategory;
      const matchesCity = prospectCity === 'all' || cityValue === prospectCity;
      const matchesProduct = prospectProduct === 'all' || (p.recommended_product || '') === prospectProduct;
      const matchesDate = !cutoff || (p.created_at && new Date(p.created_at) >= cutoff);
      return matchesSearch && matchesCategory && matchesCity && matchesProduct && matchesDate;
    });
  }, [prospects, search, prospectCategory, prospectCity, prospectProduct, prospectDate]);


  const openWhatsAppInvite = (contact: Contact) => {
    const phone = normalizePhone(contact.mobile || '');
    if (!phone) {
      setError('This contact does not have a valid mobile number.');
      return;
    }
    const message = encodeURIComponent(buildGroupInviteMessage(contact.name));
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank', 'noopener,noreferrer');
    setNotice(`WhatsApp invite opened for ${contact.name}. Press Send in WhatsApp to deliver it.`);
  };

  const startBulkWhatsAppInvites = () => {
    const selected = contacts.filter((contact) => selectedIds.includes(contact.id));
    const eligible = selected.filter((contact) => contact.whatsapp_consent && !!normalizePhone(contact.mobile || ''));
    const skipped = selected.length - eligible.length;
    if (!eligible.length) {
      setError('No selected contacts have both a valid mobile number and WhatsApp consent.');
      return;
    }
    setBulkWhatsAppQueue(eligible);
    setBulkIndex(0);
    setNotice(`${eligible.length} WhatsApp invites prepared${skipped ? `; ${skipped} skipped due to missing consent/mobile.` : '.'}`);
  };

  const openNextBulkInvite = () => {
    const contact = bulkWhatsAppQueue[bulkIndex];
    if (!contact) return;
    openWhatsAppInvite(contact);
    setBulkIndex((i) => i + 1);
  };

  const closeBulkWhatsApp = () => {
    setBulkWhatsAppQueue([]);
    setBulkIndex(0);
  };

  const copyGroupInvite = async (contact: Contact) => {
    try {
      await navigator.clipboard.writeText(buildGroupInviteMessage(contact.name));
      setNotice(`Group invite message copied for ${contact.name}.`);
    } catch {
      setError('Could not copy the invite message.');
    }
  };

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Import state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importPreviewRows, setImportPreviewRows] = useState<any[]>([]);
  const [importSummary, setImportSummary] = useState<{ total: number; valid: number; duplicates: number }>({
    total: 0,
    valid: 0,
    duplicates: 0,
  });

  // Form state
  const groupInviteLink = workspaceSettings?.whatsappGroupLink || DEFAULT_WHATSAPP_GROUP_LINK;
  const defaultTemplate = templates.find((t) => t.id === workspaceSettings?.defaultWhatsAppTemplateId && t.channel === 'whatsapp');
  const groupInviteTemplate = defaultTemplate?.body || workspaceSettings?.whatsappInviteMessage || DEFAULT_INVITE_MESSAGE;
  const buildGroupInviteMessage = (name: string) => {
    const firstName = (name || 'Ji').trim().split(/\s+/)[0] || 'Ji';
    return groupInviteTemplate
      .replaceAll('{{first_name}}', firstName)
      .replaceAll('{{group_link}}', groupInviteLink)
      .trim();
  };

  const [form, setForm] = useState({
    name: '',
    first_name: '',
    last_name: '',
    mobile: '',
    email: '',
    company: '',
    job_title: '',
    city: '',
    state: '',
    country: 'India',
    tags: '',
    notes: '',
    status: 'active' as 'active' | 'unsubscribed' | 'bounced',
    whatsapp_consent: false,
    sms_consent: false,
    email_consent: false,
  });

  // Unique tags across all contacts
  const allTags = useMemo(() => {
    const set = new Set<string>();
    contacts.forEach((c) => c.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [contacts]);

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.mobile.includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q));

      const matchesTag = selectedTag === 'all' || c.tags.includes(selectedTag);

      return matchesSearch && matchesTag;
    });
  }, [contacts, search, selectedTag]);

  // Open modal for new contact
  const handleOpenNew = () => {
    setEditingContact(null);
    setForm({
      name: '',
      first_name: '',
      last_name: '',
      mobile: '+91',
      email: '',
      company: '',
      job_title: '',
      city: '',
      state: '',
      country: 'India',
      tags: 'hot lead',
      notes: '',
      status: 'active',
      whatsapp_consent: false,
      sms_consent: false,
      email_consent: false,
    });
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (c: Contact) => {
    setEditingContact(c);
    setForm({
      name: c.name,
      first_name: c.first_name || '',
      last_name: c.last_name || '',
      mobile: c.mobile,
      email: c.email,
      company: c.company,
      job_title: c.job_title || '',
      city: c.city,
      state: c.state || '',
      country: c.country || 'India',
      tags: c.tags.join(', '),
      notes: c.notes || '',
      status: c.status,
      whatsapp_consent: c.whatsapp_consent,
      sms_consent: c.sms_consent,
      email_consent: c.email_consent,
    });
    setIsModalOpen(true);
  };

  // Save contact
  const handleSaveContact = async (e: React.FormEvent) => {
    try {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Contact full name is required');
      return;
    }
    if (!form.mobile.trim() && !form.email.trim()) {
      setError('Provide either a mobile number or email address');
      return;
    }

    if (contacts.some(c => c.id !== editingContact?.id && ((form.email.trim() && c.email.trim().toLowerCase() === form.email.trim().toLowerCase()) || (normalizePhone(form.mobile) && normalizePhone(c.mobile) === normalizePhone(form.mobile))))) {
      setError('A contact with this email or mobile number already exists.'); return;
    }

    const tagList = form.tags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    if (editingContact) {
      await updateContact(editingContact.id, {
        ...form,
        tags: tagList,
      });
      setNotice(`Updated ${form.name}`);
    } else {
      await addContact({
        ...form,
        tags: tagList,
      });
      setNotice(`Created contact: ${form.name}`);
    }

    setIsModalOpen(false);
    setError('');
    } catch (error) { console.error(error); }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const listToExport = selectedIds.length > 0 ? contacts.filter((c) => selectedIds.includes(c.id)) : filteredContacts;

    const headers = ['Name', 'Mobile', 'Email', 'Company', 'City', 'Tags', 'WhatsApp Consent', 'SMS Consent', 'Email Consent', 'Status'];
    const rows = listToExport.map((c) => [
      c.name,
      c.mobile,
      c.email,
      c.company,
      c.city,
      c.tags.join(';'),
      c.whatsapp_consent ? 'YES' : 'NO',
      c.sms_consent ? 'YES' : 'NO',
      c.email_consent ? 'YES' : 'NO',
      c.status,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.map(csvCell).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `engagex_contacts_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setNotice(`Exported ${listToExport.length} contacts to CSV`);
  };

  // Import File (Excel / CSV)
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (rawJson.length === 0) {
          setError('The uploaded sheet is empty.');
          return;
        }

        // Map column variations intelligently
        const parsed = rawJson.map((row: any) => {
          const name = String(row.Name || row.name || row['Full Name'] || row.Customer || `${row['First Name'] || ''} ${row['Last Name'] || ''}`.trim() || 'Customer');
          const mobile = String(row.Mobile || row.mobile || row.Phone || row.phone || row['Phone Number'] || row.Whatsapp || '').trim();
          const email = String(row.Email || row.email || row['Email Address'] || '').trim();
          const company = String(row.Company || row.company || row.Organization || 'Enterprise').trim();
          const city = String(row.City || row.city || row.Location || 'Bengaluru').trim();
          const tagsStr = String(row.Tags || row.tags || row.Category || 'imported').trim();

          return {
            name,
            first_name: name.split(' ')[0],
            last_name: name.split(' ').slice(1).join(' '),
            mobile: mobile ? '+' + normalizePhone(mobile) : '',
            email,
            company,
            city,
            tags: tagsStr.split(/[,;]/).map((t: string) => t.trim().toLowerCase()).filter(Boolean),
            status: 'active' as const,
            whatsapp_consent: /^(yes|true|1)$/i.test(String(row['WhatsApp Consent'] ?? row.whatsapp_consent ?? '')),
            sms_consent: /^(yes|true|1)$/i.test(String(row['SMS Consent'] ?? row.sms_consent ?? '')),
            email_consent: /^(yes|true|1)$/i.test(String(row['Email Consent'] ?? row.email_consent ?? '')),
          };
        });

        const validList = parsed.filter((p) => p.name && (p.mobile || p.email));
        setImportPreviewRows(validList);
        setImportSummary({
          total: parsed.length,
          valid: validList.length,
          duplicates: parsed.length - validList.length,
        });
        setIsImportOpen(true);
      } catch (err: any) {
        setError('Failed to parse file: ' + (err?.message || 'Check CSV/XLSX structure.'));
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleCommitImport = async () => {
    try {
    if (importPreviewRows.length === 0) return;
    const res = await importContacts(importPreviewRows);
    setNotice(`Successfully imported ${res.inserted} contacts (${res.duplicates} duplicates skipped).`);
    setIsImportOpen(false);
    setImportPreviewRows([]);
    } catch (error) { console.error(error); }
  };

  // Toggle selection
  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredContacts.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <CommercialShell
      title="Contact Management"
      subtitle="Audiences, consent preferences and omnichannel customer directory."
    >
      {/* Alert Notices */}
      {error && (
        <div className="notice errorNotice" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{error}</span>
          <button onClick={() => setError('')} style={{ background: 'transparent', border: 0, cursor: 'pointer' }}>×</button>
        </div>
      )}
      {notice && (
        <div className="notice" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{notice}</span>
          <button onClick={() => setNotice('')} style={{ background: 'transparent', border: 0, cursor: 'pointer' }}>×</button>
        </div>
      )}


      <div style={{display:'flex',gap:8,marginBottom:12,alignItems:'center',flexWrap:'wrap'}}>
        <button
          className={directoryMode === 'prospects' ? 'cbtn primary' : 'cbtn secondary'}
          onClick={() => setDirectoryMode('prospects')}
        >
          Saved Prospects ({prospects.length})
        </button>
        <button
          className={directoryMode === 'contacts' ? 'cbtn primary' : 'cbtn secondary'}
          onClick={() => setDirectoryMode('contacts')}
        >
          Contacts ({contacts.length})
        </button>
        {directoryMode === 'prospects' && (
          <span style={{fontSize:10,color:'#64748b'}}>
            Google/Lead Intelligence data saved in this workspace
          </span>
        )}
      </div>

      {/* Toolbar */}
      <div className="commercialToolbar">
        <div className="leftActions" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <Search
              size={14}
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
            />
            <input
              className="searchField"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone, email, company..."
              style={{ paddingLeft: '32px' }}
            />
          </div>

          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '10px',
              border: '1px solid #dce7ec',
              fontSize: '11px',
              background: '#ffffff',
              color: '#334155',
            }}
          >
            <option value="all">All Tags ({allTags.length})</option>
            {allTags.map((t) => (
              <option key={t} value={t}>
                #{t}
              </option>
            ))}
          </select>
        </div>

        <div className="rightActions" style={{ display: 'flex', gap: '8px' }}>
          <label className="cbtn secondary fileBtn" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Upload size={14} /> Import Excel / CSV
            <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} />
          </label>
          <button className="cbtn secondary" onClick={handleExportCSV} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Download size={14} /> Export CSV
          </button>
          <button className="cbtn primary" onClick={handleOpenNew} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={14} /> Add Contact
          </button>
        </div>
      </div>


      {directoryMode === 'prospects' && (
        <div style={{
          display:'grid',
          gridTemplateColumns:'repeat(4,minmax(140px,1fr))',
          gap:8,
          margin:'0 0 12px'
        }}>
          <select value={prospectCategory} onChange={e=>setProspectCategory(e.target.value)} className="searchField">
            <option value="all">All Categories</option>
            {prospectCategories.map((v:string)=><option key={v} value={v}>{v}</option>)}
          </select>
          <select value={prospectCity} onChange={e=>setProspectCity(e.target.value)} className="searchField">
            <option value="all">All Cities / Areas</option>
            {prospectCities.map((v:string)=><option key={v} value={v}>{v}</option>)}
          </select>
          <select value={prospectDate} onChange={e=>setProspectDate(e.target.value as any)} className="searchField">
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <select value={prospectProduct} onChange={e=>setProspectProduct(e.target.value)} className="searchField">
            <option value="all">All Recommended Products</option>
            {prospectProducts.map((v:string)=><option key={v} value={v}>{v}</option>)}
          </select>
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bulkBar">
          <b>{selectedIds.length} contacts selected</b>
          <span>WhatsApp Opted-in</span>
          <span>SMS Opted-in</span>
          <span>Email Opted-in</span>
          <button onClick={handleExportCSV}>Export Selected</button>
          <button
            onClick={startBulkWhatsAppInvites}
            style={{ background: '#16a34a', color: '#fff', border: 0, borderRadius: 8, padding: '7px 10px', fontWeight: 800, cursor: 'pointer' }}
          >
            Prepare WhatsApp Invites
          </button>
          <button
            className="danger"
            onClick={async () => {
              if (confirm(`Are you sure you want to delete ${selectedIds.length} contacts?`)) {
                try { await bulkDeleteContacts(selectedIds); } catch { return; }
                setSelectedIds([]);
                setNotice(`Deleted ${selectedIds.length} contacts`);
              }
            }}
          >
            Delete Selected
          </button>
        </div>
      )}

      {/* Metric Grid */}
      <div className="metricGrid">
        <article>
          <span>{directoryMode === 'prospects' ? 'SAVED PROSPECTS' : 'TOTAL CONTACTS'}</span>
          <strong>{directoryMode === 'prospects' ? prospects.length : contacts.length}</strong>
          <small>{directoryMode === 'prospects' ? 'Lead Intelligence repository' : 'Audience repository'}</small>
        </article>
        <article>
          <span>FILTERED RESULTS</span>
          <strong>{directoryMode === 'prospects' ? filteredProspects.length : filteredContacts.length}</strong>
          <small>Active search view</small>
        </article>
        <article>
          <span>WHATSAPP OPT-IN</span>
          <strong style={{ color: '#0284c7' }}>
            {directoryMode === 'prospects' ? prospects.filter((p:any) => !!p.phone).length : contacts.filter((c) => c.whatsapp_consent).length}
          </strong>
          <small>{directoryMode === 'prospects' ? 'Prospects with public phone' : 'Reachable via Cloud API'}</small>
        </article>
        <article>
          <span>SMS & EMAIL OPT-IN</span>
          <strong>
            {directoryMode === 'prospects' ? prospects.filter((p:any) => !!p.email || !!p.website).length : contacts.filter((c) => c.sms_consent || c.email_consent).length}
          </strong>
          <small>{directoryMode === 'prospects' ? 'Prospects with email / website' : 'Compliant broadcast targets'}</small>
        </article>
      </div>

      {/* Directory Panel */}
      {directoryMode === 'prospects' ? (
        <section className="panel">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10,gap:12,flexWrap:'wrap'}}>
            <div>
              <h3>Saved Prospect Directory</h3>
              <p>Category, city/area, date and recommended-product filters for saved Lead Intelligence data.</p>
            </div>
            <span style={{fontSize:10,color:'#64748b'}}>Showing {filteredProspects.length} of {prospects.length} saved prospects</span>
          </div>

          {prospectsLoading ? (
            <div className="emptyBox"><div><b>Loading saved prospects…</b></div></div>
          ) : filteredProspects.length === 0 ? (
            <div className="emptyBox">
              <div>
                <ContactRound size={34} style={{ margin: '0 auto 10px', color: '#94a3b8' }} />
                <b>No saved prospects match these filters</b>
                <p>Save businesses from EngageX Lead Intelligence, or clear the current filters.</p>
              </div>
            </div>
          ) : (
            <div className="responsiveTable">
              <table className="dataTable">
                <thead>
                  <tr>
                    <th>Business</th>
                    <th>Category</th>
                    <th>City / Area</th>
                    <th>Phone / Email</th>
                    <th>Source</th>
                    <th>Lead Score</th>
                    <th>Recommended Product</th>
                    <th>Saved Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProspects.map((p:any) => (
                    <tr key={p.id}>
                      <td>
                        <b>{p.business_name}</b>
                        <small className="cellSub">{p.website || p.source_url || '—'}</small>
                      </td>
                      <td>{p.business_type || p.category || '—'}</td>
                      <td>
                        <b>{p.location || '—'}</b>
                        <small className="cellSub">{p.address || ''}</small>
                      </td>
                      <td>
                        <div style={{display:'flex',flexDirection:'column'}}>
                          <span style={{fontSize:11,fontWeight:700}}>{p.phone || '—'}</span>
                          <small className="cellSub">{p.email || '—'}</small>
                        </div>
                      </td>
                      <td>{p.source === 'google_maps' ? 'Google Maps' : (p.source || '—')}</td>
                      <td>
                        <span className="status" style={{
                          background:(p.lead_score || 0) >= 80 ? '#dcfce7' : '#fff7ed',
                          color:(p.lead_score || 0) >= 80 ? '#15803d' : '#c2410c'
                        }}>
                          {p.lead_score ?? '—'}{p.lead_score != null ? '%' : ''}
                        </span>
                      </td>
                      <td><b style={{color:'#0369a1'}}>{p.recommended_product || '—'}</b></td>
                      <td>{p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : (
        <section className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div>
              <h3>Contact Directory</h3>
              <p>Every messaging dispatch strictly respects WhatsApp, SMS, and Email opt-in consent flags.</p>
            </div>
            <span style={{ fontSize: '10px', color: '#64748b' }}>
              Showing {filteredContacts.length} of {contacts.length} records
            </span>
          </div>

          {filteredContacts.length === 0 ? (
            <div className="emptyBox">
              <div>
                <ContactRound size={34} style={{ margin: '0 auto 10px', color: '#94a3b8' }} />
                <b>No matching contacts found</b>
                <p>Try clearing your search filters or import an audience spreadsheet.</p>
                <button
                  className="cbtn primary"
                  onClick={handleOpenNew}
                  style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={14} /> Add Contact
                </button>
              </div>
            </div>
          ) : (
            <div className="responsiveTable">
              <table className="dataTable">
                <thead>
                  <tr>
                    <th style={{ width: '30px' }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.length === filteredContacts.length && filteredContacts.length > 0}
                        onChange={(e) => handleToggleSelectAll(e.target.checked)}
                      />
                    </th>
                    <th>Contact Profile</th>
                    <th>Phone / Email</th>
                    <th>Company & City</th>
                    <th>Tags</th>
                    <th>Channel Consent</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(c.id)}
                          onChange={() => handleToggleSelectOne(c.id)}
                        />
                      </td>
                      <td>
                        <b>{c.name}</b>
                        <small className="cellSub">{c.job_title || 'Customer'}</small>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '10px', fontWeight: 600 }}>{c.mobile || '—'}</span>
                          <small className="cellSub">{c.email || '—'}</small>
                        </div>
                      </td>
                      <td>
                        <b>{c.company || '—'}</b>
                        <small className="cellSub">{c.city || '—'}</small>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {c.tags.slice(0, 2).map((tag) => (
                            <span key={tag} style={{fontSize:'8px',background:'#f1f5f9',color:'#475569',padding:'2px 6px',borderRadius:'4px'}}>
                              #{tag}
                            </span>
                          ))}
                          {c.tags.length > 2 && <span style={{fontSize:'8px',color:'#94a3b8'}}>+{c.tags.length - 2}</span>}
                        </div>
                      </td>
                      <td>
                        <div className="consentBadges">
                          <span className={c.whatsapp_consent ? 'on' : ''}>WA</span>
                          <span className={c.sms_consent ? 'on' : ''}>SMS</span>
                          <span className={c.email_consent ? 'on' : ''}>Email</span>
                        </div>
                      </td>
                      <td>
                        <span className="status" style={{background:c.status==='active'?'#dcfce7':'#fee2e2',color:c.status==='active'?'#15803d':'#991b1b'}}>
                          {c.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                          <button className="tableAction" onClick={() => openWhatsAppInvite(c)} style={{color:'#15803d'}}>WhatsApp Invite</button>
                          <button className="tableAction" onClick={() => void copyGroupInvite(c)}>Copy Invite</button>
                          <button className="tableAction" onClick={() => handleOpenEdit(c)}>Edit</button>
                          <button className="tableAction dangerText" onClick={() => { if (confirm(`Delete contact ${c.name}?`)) deleteContact(c.id); }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {bulkWhatsAppQueue.length > 0 && (
        <div className="modalBackdrop">
          <div className="modalCard" style={{ maxWidth: '560px' }}>
            <div className="modalHead">
              <div>
                <small>MANUAL WHATSAPP QUEUE</small>
                <h3>Send AKBS Group Invites</h3>
              </div>
              <button onClick={closeBulkWhatsApp}>×</button>
            </div>
            <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
              API is not connected, so EngageX will open one opted-in contact at a time with the group invite prefilled.
              Press Send in WhatsApp, then return here and open the next contact.
            </p>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, margin: '14px 0' }}>
              <div style={{ fontSize: 11, color: '#64748b' }}>Progress</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a' }}>
                {Math.min(bulkIndex, bulkWhatsAppQueue.length)} / {bulkWhatsAppQueue.length}
              </div>
              {bulkIndex < bulkWhatsAppQueue.length ? (
                <div style={{ marginTop: 8, fontSize: 12 }}>
                  Next: <b>{bulkWhatsAppQueue[bulkIndex].name}</b> · {bulkWhatsAppQueue[bulkIndex].mobile}
                </div>
              ) : (
                <div style={{ marginTop: 8, fontSize: 12, color: '#15803d', fontWeight: 800 }}>Queue completed.</div>
              )}
            </div>
            <div className="modalActions">
              <button className="cbtn secondary" onClick={closeBulkWhatsApp}>Close</button>
              {bulkIndex < bulkWhatsAppQueue.length && (
                <button className="cbtn primary" onClick={openNextBulkInvite}>
                  Open Next WhatsApp
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Contact Modal */}
      {isModalOpen && (
        <div className="modalBackdrop">
          <div className="modalCard">
            <div className="modalHead">
              <div>
                <small>{editingContact ? 'EDIT CONTACT' : 'NEW CONTACT'}</small>
                <h3>{editingContact ? 'Update Contact Record' : 'Add New Customer Profile'}</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleSaveContact}>
              <div className="formGrid">
                <div className="field">
                  <label>Full Name *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Aarav Sharma"
                  />
                </div>
                <div className="field">
                  <label>Mobile Number (with Country Code) *</label>
                  <input
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    placeholder="e.g. +91 9876543210"
                  />
                </div>
                <div className="field">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="name@company.com"
                  />
                </div>
                <div className="field">
                  <label>Company / Organization</label>
                  <input
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    placeholder="e.g. TechCorp India"
                  />
                </div>
                <div className="field">
                  <label>Job Title</label>
                  <input
                    value={form.job_title}
                    onChange={(e) => setForm({ ...form, job_title: e.target.value })}
                    placeholder="e.g. Marketing Director"
                  />
                </div>
                <div className="field">
                  <label>City / Location</label>
                  <input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="e.g. Bengaluru"
                  />
                </div>
                <div className="field full">
                  <label>Audience Tags (comma separated)</label>
                  <input
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    placeholder="e.g. hot lead, enterprise, retail, vip"
                  />
                </div>
                <div className="field full">
                  <label>Internal Notes</label>
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Campaign requirements, conversation notes, or customer preferences..."
                  />
                </div>
                <div className="field full">
                  <label>Channel Opt-in & Regulatory Consent</label>
                  <div className="consentChecks">
                    <label>
                      <input
                        type="checkbox"
                        checked={form.whatsapp_consent}
                        onChange={(e) => setForm({ ...form, whatsapp_consent: e.target.checked })}
                      />
                      WhatsApp Messaging Consent
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={form.sms_consent}
                        onChange={(e) => setForm({ ...form, sms_consent: e.target.checked })}
                      />
                      TRAI DLT SMS Consent
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={form.email_consent}
                        onChange={(e) => setForm({ ...form, email_consent: e.target.checked })}
                      />
                      Commercial Email Consent
                    </label>
                  </div>
                </div>
              </div>

              <div className="modalActions">
                <button type="button" className="cbtn secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="cbtn primary">
                  {editingContact ? 'Save Changes' : 'Create Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Spreadsheet Modal */}
      {isImportOpen && (
        <div className="modalBackdrop">
          <div className="modalCard" style={{ maxWidth: '640px' }}>
            <div className="modalHead">
              <div>
                <small>IMPORT PREVIEW</small>
                <h3>Audience Spreadsheet Validation</h3>
              </div>
              <button onClick={() => setIsImportOpen(false)}>×</button>
            </div>

            <p style={{ fontSize: '11px', color: '#64748b', marginTop: 0 }}>
              EngageX has parsed your spreadsheet. Review the detected rows before adding them to your workspace.
            </p>

            <div className="metricGrid compact">
              <article>
                <span>TOTAL ROWS DETECTED</span>
                <strong>{importSummary.total}</strong>
              </article>
              <article>
                <span>VALID FOR IMPORT</span>
                <strong style={{ color: '#059669' }}>{importSummary.valid}</strong>
              </article>
              <article>
                <span>INVALID / SKIPPED</span>
                <strong>{importSummary.duplicates}</strong>
              </article>
            </div>

            <div style={{ maxHeight: '200px', overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px', marginTop: '10px' }}>
              <table className="dataTable">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Mobile</th>
                    <th>Email</th>
                    <th>Company</th>
                  </tr>
                </thead>
                <tbody>
                  {importPreviewRows.slice(0, 5).map((r, i) => (
                    <tr key={i}>
                      <td><b>{r.name}</b></td>
                      <td>{r.mobile || '—'}</td>
                      <td>{r.email || '—'}</td>
                      <td>{r.company}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {importPreviewRows.length > 5 && (
              <small style={{ display: 'block', textAlign: 'center', marginTop: '6px', color: '#94a3b8' }}>
                Showing 5 of {importPreviewRows.length} rows...
              </small>
            )}

            <div className="modalActions">
              <button className="cbtn secondary" onClick={() => setIsImportOpen(false)}>
                Cancel
              </button>
              <button className="cbtn primary" onClick={handleCommitImport}>
                Import {importSummary.valid} Valid Contacts
              </button>
            </div>
          </div>
        </div>
      )}
    </CommercialShell>
  );
};

import React, { useState, useMemo, ChangeEvent } from 'react';
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

export const ContactsView: React.FC = () => {
  const { contacts, addContact, updateContact, deleteContact, bulkDeleteContacts, importContacts } = useApp();

  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [notice, setNotice] = useState<string>('');
  const [error, setError] = useState<string>('');

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
  const handleSaveContact = (e: React.FormEvent) => {
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
      updateContact(editingContact.id, {
        ...form,
        tags: tagList,
      });
      setNotice(`Updated ${form.name}`);
    } else {
      addContact({
        ...form,
        tags: tagList,
      });
      setNotice(`Created contact: ${form.name}`);
    }

    setIsModalOpen(false);
    setError('');
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

  const handleCommitImport = () => {
    if (importPreviewRows.length === 0) return;
    const res = importContacts(importPreviewRows);
    setNotice(`Successfully imported ${res.inserted} contacts (${res.duplicates} duplicates skipped).`);
    setIsImportOpen(false);
    setImportPreviewRows([]);
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

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bulkBar">
          <b>{selectedIds.length} contacts selected</b>
          <span>WhatsApp Opted-in</span>
          <span>SMS Opted-in</span>
          <span>Email Opted-in</span>
          <button onClick={handleExportCSV}>Export Selected</button>
          <button
            className="danger"
            onClick={() => {
              if (confirm(`Are you sure you want to delete ${selectedIds.length} contacts?`)) {
                bulkDeleteContacts(selectedIds);
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
          <span>TOTAL CONTACTS</span>
          <strong>{contacts.length}</strong>
          <small>Audience repository</small>
        </article>
        <article>
          <span>FILTERED RESULTS</span>
          <strong>{filteredContacts.length}</strong>
          <small>Active search view</small>
        </article>
        <article>
          <span>WHATSAPP OPT-IN</span>
          <strong style={{ color: '#0284c7' }}>
            {contacts.filter((c) => c.whatsapp_consent).length}
          </strong>
          <small>Reachable via Cloud API</small>
        </article>
        <article>
          <span>SMS & EMAIL OPT-IN</span>
          <strong>
            {contacts.filter((c) => c.sms_consent || c.email_consent).length}
          </strong>
          <small>Compliant broadcast targets</small>
        </article>
      </div>

      {/* Contacts Table Panel */}
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
                          <span
                            key={tag}
                            style={{
                              fontSize: '8px',
                              background: '#f1f5f9',
                              color: '#475569',
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            #{tag}
                          </span>
                        ))}
                        {c.tags.length > 2 && (
                          <span style={{ fontSize: '8px', color: '#94a3b8' }}>+{c.tags.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="consentBadges">
                        <span className={c.whatsapp_consent ? 'on' : ''} title="WhatsApp Opt-in">
                          WA
                        </span>
                        <span className={c.sms_consent ? 'on' : ''} title="SMS Opt-in">
                          SMS
                        </span>
                        <span className={c.email_consent ? 'on' : ''} title="Email Opt-in">
                          Email
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        className="status"
                        style={{
                          background: c.status === 'active' ? '#dcfce7' : '#fee2e2',
                          color: c.status === 'active' ? '#15803d' : '#991b1b',
                        }}
                      >
                        {c.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="tableAction" onClick={() => handleOpenEdit(c)}>
                          Edit
                        </button>
                        <button
                          className="tableAction dangerText"
                          onClick={() => {
                            if (confirm(`Delete contact ${c.name}?`)) deleteContact(c.id);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

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

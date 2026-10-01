import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Database, Download, Filter, Globe2, MapPin, Plus, Search, ShieldCheck, Upload } from 'lucide-react';
import { CommercialShell } from './CommercialShell';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';

type Prospect = {
  id: string;
  workspace_id: string;
  source: 'google_maps' | 'web_search' | 'indiamart' | 'justdial' | 'csv' | 'manual';
  business_name: string;
  category: string | null;
  location: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  rating: number | null;
  source_url: string | null;
  business_type?: string | null;
  match_score?: number | null;
  lead_score?: number | null;
  recommended_product?: string | null;
  source_domain?: string | null;
  enrichment_status?: string | null;
  status: 'new' | 'reviewed' | 'contacted' | 'qualified' | 'converted' | 'do_not_contact';
  outreach_eligibility: 'review_required' | 'allowed' | 'do_not_contact';
  notes: string | null;
  created_at: string;
};

const sourceLabel: Record<Prospect['source'], string> = {
  google_maps: 'Google Maps',
  web_search: 'Web Intelligence',
  indiamart: 'IndiaMART',
  justdial: 'Justdial',
  csv: 'CSV Import',
  manual: 'Manual'
};

export const DataExtractorView: React.FC = () => {
  const { activeWorkspace, setAppTab } = useApp();
  const [rows, setRows] = useState<Prospect[]>([]);
  const [query, setQuery] = useState('');
  const [source, setSource] = useState<'all' | Prospect['source']>('all');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [area, setArea] = useState('');
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [liveResults, setLiveResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedLive, setSelectedLive] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState({
    source: 'manual' as Prospect['source'],
    business_name: '',
    category: '',
    location: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    source_url: '',
    notes: ''
  });

  const load = async () => {
    if (!activeWorkspace?.id) return;
    setLoading(true);
    setNotice('');
    const { data, error } = await supabase
      .from('engagex_prospects')
      .select('*')
      .eq('workspace_id', activeWorkspace.id)
      .order('created_at', { ascending: false });
    if (error) setNotice(error.message);
    setRows((data || []) as Prospect[]);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [activeWorkspace?.id]);

  const runLiveSearch = async () => {
    if (!category.trim() && !query.trim() && !location.trim() && !area.trim()) {
      setNotice('Enter a business/category, area or city first.');
      return;
    }
    setSearching(true);
    setNotice('');
    setLiveResults([]);
    setSelectedLive({});
    setNextPageToken(null);
    try {
      const { data, error } = await supabase.functions.invoke('engagex-lead-search', {
        body: {
          query: query.trim(),
          category: category.trim(),
          area: area.trim(),
          city: location.trim(),
          limit: 20
        }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setLiveResults(data?.results || []);
      setNextPageToken(data?.nextPageToken || null);
      if (!(data?.results || []).length) setNotice('No Google Maps businesses found for this area/search.');
      else setNotice('Google Maps/Places results loaded for the selected area. Select the businesses you want to save.');
    } catch (e: any) {
      setNotice(e?.message || 'Live search failed.');
    } finally {
      setSearching(false);
    }
  };


  const loadMoreResults = async () => {
    if (!nextPageToken || searching) return;
    setSearching(true);
    setNotice('');
    try {
      const { data, error } = await supabase.functions.invoke('engagex-lead-search', {
        body: {
          query: query.trim(),
          category: category.trim(),
          area: area.trim(),
          city: location.trim(),
          limit: 20,
          pageToken: nextPageToken
        }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setLiveResults(prev => {
        const seen = new Set(prev.map((r:any) => r.external_id));
        return [...prev, ...(data?.results || []).filter((r:any) => !seen.has(r.external_id))];
      });
      setNextPageToken(data?.nextPageToken || null);
      setNotice((data?.results || []).length ? 'More Google Maps businesses loaded.' : 'No more results available for this search.');
    } catch (e:any) {
      setNotice(e?.message || 'Could not load more results.');
    } finally {
      setSearching(false);
    }
  };


  const allLiveSelected = liveResults.length > 0 && liveResults.every((r:any,i:number) =>
    !!selectedLive[r.external_id || String(i)]
  );

  const toggleSelectAllLive = (checked:boolean) => {
    if (!checked) {
      setSelectedLive({});
      return;
    }
    const next: Record<string, boolean> = {};
    liveResults.forEach((r:any,i:number) => {
      next[r.external_id || String(i)] = true;
    });
    setSelectedLive(next);
  };

  const saveLiveProspects = async () => {
    if (!activeWorkspace?.id) return;
    const selected = liveResults.filter((r, i) => selectedLive[r.external_id || String(i)]);
    if (!selected.length) {
      setNotice('Select at least one live result first.');
      return;
    }
    setNotice('');
    const payload = selected.map((r: any) => ({
      workspace_id: activeWorkspace.id,
      source: r.source === 'google_places' || r.source === 'google_web' ? 'google_maps' : 'web_search',
      business_name: r.business_name,
      category: r.category || category.trim() || null,
      location: [area.trim(), location.trim()].filter(Boolean).join(', ') || null,
      address: r.address || null,
      phone: r.phone || null,
      email: null,
      website: r.website || null,
      rating: r.rating,
      source_url: r.source_url || null,
      business_type: r.business_type || null,
      match_score: r.match_score ?? null,
      lead_score: r.lead_score ?? null,
      recommended_product: r.recommended_product || null,
      source_domain: r.source_domain || null,
      enrichment_status: r.enrichment_status || 'basic',
      status: 'new',
      outreach_eligibility: 'review_required'
    }));
    const { error } = await supabase.from('engagex_prospects').upsert(payload, {
      onConflict: 'workspace_id,source,business_name,phone,website',
      ignoreDuplicates: true
    });
    if (error) {
      setNotice(error.message);
      return;
    }
    setNotice(selected.length + ' prospect(s) saved for review.');
    setSelectedLive({});
    await load();
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(r => {
      const matchesQuery = !q || [r.business_name, r.phone, r.email, r.website, r.address].some(v => (v || '').toLowerCase().includes(q));
      const matchesSource = source === 'all' || r.source === source;
      const matchesCategory = !category.trim() || (r.category || '').toLowerCase().includes(category.trim().toLowerCase());
      const matchesLocation = !location.trim() || (r.location || r.address || '').toLowerCase().includes(location.trim().toLowerCase());
      return matchesQuery && matchesSource && matchesCategory && matchesLocation;
    });
  }, [rows, query, source, category, location]);

  const saveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace?.id || !form.business_name.trim()) return;
    setNotice('');
    const { error } = await supabase.from('engagex_prospects').insert({
      ...form,
      workspace_id: activeWorkspace.id,
      business_name: form.business_name.trim(),
      category: form.category.trim() || null,
      location: form.location.trim() || null,
      address: form.address.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim().toLowerCase() || null,
      website: form.website.trim() || null,
      source_url: form.source_url.trim() || null,
      notes: form.notes.trim() || null,
      outreach_eligibility: 'review_required'
    });
    if (error) {
      setNotice(error.code === '23505' ? 'Duplicate prospect skipped.' : error.message);
      return;
    }
    setForm({ source: 'manual', business_name: '', category: '', location: '', address: '', phone: '', email: '', website: '', source_url: '', notes: '' });
    setShowAdd(false);
    await load();
  };

  const exportCsv = () => {
    const header = ['Business','Source','Category','Location','Phone','Email','Website','Status','Outreach Eligibility'];
    const lines = filtered.map(r => [
      r.business_name, sourceLabel[r.source], r.category || '', r.location || '', r.phone || '', r.email || '', r.website || '', r.status, r.outreach_eligibility
    ].map(v => '"' + String(v).replace(/"/g, '""') + '"').join(','));
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'engagex-lead-intelligence.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const kpis = useMemo(() => ({
    total: rows.length,
    review: rows.filter(r => r.outreach_eligibility === 'review_required').length,
    allowed: rows.filter(r => r.outreach_eligibility === 'allowed').length,
    converted: rows.filter(r => r.status === 'converted').length
  }), [rows]);

  return (
    <CommercialShell
      title="EngageX Lead Intelligence"
      subtitle="Discover, organize and qualify business prospects by source, category and location for Savrdh Technology outreach workflows."
    >
      <div style={{maxWidth:1540,margin:'0 auto',padding:'2px 2px 24px'}}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,minmax(0,1fr))', gap:16, marginBottom:18 }}>
        {[
          ['TOTAL PROSPECTS', kpis.total, 'Saved business records'],
          ['REVIEW REQUIRED', kpis.review, 'Check contact basis before outreach'],
          ['OUTREACH ALLOWED', kpis.allowed, 'Approved for contact workflow'],
          ['CONVERTED', kpis.converted, 'Moved into CRM pipeline']
        ].map(([label,value,note]) => (
          <article key={String(label)} style={{background:'#fff',border:'1px solid #dfe9ed',borderRadius:16,padding:'18px 20px',minHeight:112,boxShadow:'0 8px 24px rgba(15,23,42,.04)'}}>
            <span style={{fontSize:10,fontWeight:900,color:'#78909c',letterSpacing:.8}}>{label}</span>
            <strong style={{display:'block',fontSize:32,lineHeight:1.05,margin:'9px 0 6px'}}>{Number(value).toLocaleString()}</strong>
            <small style={{fontSize:10,color:'#94a3b8'}}>{note}</small>
          </article>
        ))}
      </div>

      <section style={{background:'#fff',border:'1px solid #dfe9ed',borderRadius:16,padding:20,marginBottom:18,boxShadow:'0 8px 24px rgba(15,23,42,.035)'}}>
        <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'}}>
          <div>
            <small style={{fontSize:10,color:'#64748b',fontWeight:900,letterSpacing:.7}}>SOURCE CONNECTORS</small>
            <h3 style={{margin:'5px 0 5px',fontSize:20}}>Prospecting Sources</h3>
            <p style={{margin:0,fontSize:11,color:'#64748b'}}>Google Places API powers live business discovery with structured business details.</p>
          </div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {[
              ['Google Maps','Google Places API connected'],
              ['IndiaMART','API / export connector ready'],
              ['Justdial','Licensed feed / export ready']
            ].map(([name,status]) => (
              <div key={name} style={{border:'1px solid #e2e8f0',borderRadius:12,padding:'12px 14px',minWidth:180}}>
                <b style={{display:'block',fontSize:12}}>{name}</b>
                <small style={{fontSize:10,color:'#64748b'}}>{status}</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{background:'#fff',border:'1px solid #dfe9ed',borderRadius:16,padding:20,marginBottom:18,boxShadow:'0 8px 24px rgba(15,23,42,.035)'}}>
        <div style={{display:'grid',gridTemplateColumns:'1.6fr .9fr 1.1fr 1.15fr 1.05fr auto auto auto',gap:8,alignItems:'center'}}>
          <div style={{position:'relative'}}>
            <Search size={17} style={{position:'absolute',left:12,top:14,color:'#94a3b8'}}/>
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search company, phone, email, website..." style={{width:'100%',padding:'13px 12px 13px 38px',border:'1px solid #dbe7ee',borderRadius:9}}/>
          </div>
          <select value={source} onChange={e=>setSource(e.target.value as any)} style={{padding:13,border:'1px solid #dbe7ee',borderRadius:10,fontSize:12}}>
            <option value="all">All sources</option>
            <option value="google_maps">Google Maps</option>
            <option value="indiamart">IndiaMART</option>
            <option value="justdial">Justdial</option>
            <option value="csv">CSV Import</option>
            <option value="manual">Manual</option>
          </select>
          <input value={category} onChange={e=>setCategory(e.target.value)} placeholder="Business / Category (optional)" style={{padding:13,border:'1px solid #dbe7ee',borderRadius:10,fontSize:12}}/>
          <input value={area} onChange={e=>setArea(e.target.value)} placeholder="Area / Locality e.g. Mandideep" style={{padding:13,border:'1px solid #dbe7ee',borderRadius:10,fontSize:12}}/>
          <input value={location} onChange={e=>setLocation(e.target.value)} placeholder="City e.g. Bhopal" style={{padding:13,border:'1px solid #dbe7ee',borderRadius:10,fontSize:12}}/>
          <button onClick={runLiveSearch} disabled={searching} className="primaryBtn small"><Search size={14}/> {searching ? 'Searching…' : 'Search Live'}</button>
          <button onClick={()=>setShowAdd(v=>!v)} className="primaryBtn small"><Plus size={14}/> Add</button>
          <button onClick={exportCsv} style={{padding:'9px 10px',border:'1px solid #dbe7ee',borderRadius:9,background:'#fff',cursor:'pointer',fontWeight:800,fontSize:10,display:'inline-flex',gap:5,alignItems:'center'}}><Download size={13}/> Export</button>
        </div>
      </section>

      {liveResults.length > 0 && (
        <section style={{background:'#fff',border:'1px solid #dfe9ed',borderRadius:16,overflow:'hidden',marginBottom:18,boxShadow:'0 10px 28px rgba(15,23,42,.04)'}}>
          <div style={{padding:'16px 18px',borderBottom:'1px solid #edf2f4',display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}>
            <div>
              <b style={{fontSize:15}}>Live Google Maps Results</b>
              <small style={{display:'block',fontSize:10,color:'#94a3b8',marginTop:2}}>{liveResults.length} Google Maps businesses found for {[area, location].filter(Boolean).join(', ') || 'your search'} · select records to save</small>
            </div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <span style={{fontSize:11,fontWeight:800,color:'#64748b'}}>
                {Object.values(selectedLive).filter(Boolean).length} selected
              </span>
              {nextPageToken && <button onClick={loadMoreResults} disabled={searching} className="primaryBtn small" style={{background:'#fff',color:'#0f7490',border:'1px solid #bfe4ee'}}>{searching ? 'Loading…' : 'Load More'}</button>}
              <button onClick={saveLiveProspects} className="primaryBtn small">Save Selected</button>
            </div>
          </div>
          <div style={{overflowX:'auto'}}>
            <table className="dashTable" style={{marginTop:0,fontSize:13,minWidth:1180,lineHeight:1.45}}>
              <thead>
                <tr>
                  <th style={{width:42,textAlign:'center'}}>
                    <input
                      type="checkbox"
                      aria-label="Select all live results"
                      checked={allLiveSelected}
                      onChange={e=>toggleSelectAllLive(e.target.checked)}
                      style={{width:17,height:17,cursor:'pointer'}}
                    />
                  </th>
                  <th style={{minWidth:250,fontSize:11,padding:'13px 12px'}}>Business</th>
                  <th style={{minWidth:170,fontSize:11,padding:'13px 12px'}}>Business Type</th>
                  <th style={{minWidth:145,fontSize:11,padding:'13px 12px'}}>Phone</th>
                  <th style={{minWidth:180,fontSize:11,padding:'13px 12px'}}>Email</th>
                  <th style={{minWidth:140,fontSize:11,padding:'13px 12px'}}>Source</th>
                  <th style={{minWidth:90,fontSize:11,padding:'13px 12px'}}>Match</th>
                  <th style={{minWidth:105,fontSize:11,padding:'13px 12px'}}>Lead Score</th>
                  <th style={{minWidth:155,fontSize:11,padding:'13px 12px'}}>Recommended Product</th>
                </tr>
              </thead>
              <tbody>
                {liveResults.map((r:any,i:number)=>{
                  const key=r.external_id || String(i);
                  return (
                    <tr key={key}>
                      <td style={{textAlign:'center',padding:'14px 10px'}}><input type="checkbox" checked={!!selectedLive[key]} onChange={e=>setSelectedLive(prev=>({...prev,[key]:e.target.checked}))} style={{width:17,height:17,cursor:'pointer'}}/></td>
                      <td style={{padding:'14px 12px',fontSize:13}}><b style={{fontSize:13}}>{r.business_name}</b>{r.website && <small style={{display:'block',fontSize:10,color:'#94a3b8',marginTop:3,maxWidth:260,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.source_domain || r.website}</small>}</td>
                      <td style={{padding:'14px 12px',fontSize:12}}>{r.business_type || r.category || '—'}</td>
                      <td style={{padding:'14px 12px',fontSize:12,fontWeight:700}}>{r.phone || '—'}</td>
                      <td style={{padding:'14px 12px',fontSize:12}}>{r.email || '—'}</td>
                      <td style={{padding:'14px 12px',fontSize:12}}>{r.source_domain || 'Google Maps'}</td>
                      <td style={{padding:'14px 12px'}}><span className="dashBadge" style={{fontSize:11,padding:'5px 9px'}}>{r.match_score ?? '—'}{r.match_score != null ? '%' : ''}</span></td>
                      <td style={{padding:'14px 12px'}}><span className="dashBadge" style={{fontSize:11,padding:'5px 9px',background:(r.lead_score||0)>=80?'#ecfdf5':(r.lead_score||0)>=60?'#fff7ed':'#f8fafc',color:(r.lead_score||0)>=80?'#047857':(r.lead_score||0)>=60?'#c2410c':'#64748b'}}>{r.lead_score ?? '—'}{r.lead_score != null ? '%' : ''}</span></td>
                      <td style={{padding:'14px 12px'}}><b style={{fontSize:12,color:'#0369a1'}}>{r.recommended_product || 'EngageX'}</b></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {notice && <div className="notice" style={{marginBottom:12}}>{notice}</div>}

      {showAdd && (
        <form onSubmit={saveManual} style={{background:'#fff',border:'1px solid #dfe9ed',borderRadius:14,padding:16,marginBottom:14}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:9}}>
            <select value={form.source} onChange={e=>setForm({...form,source:e.target.value as Prospect['source']})} style={{padding:13,border:'1px solid #dbe7ee',borderRadius:10,fontSize:12}}>
              <option value="manual">Manual</option><option value="csv">CSV Import</option><option value="google_maps">Google Maps</option><option value="indiamart">IndiaMART</option><option value="justdial">Justdial</option>
            </select>
            <input required value={form.business_name} onChange={e=>setForm({...form,business_name:e.target.value})} placeholder="Business name" style={{padding:13,border:'1px solid #dbe7ee',borderRadius:10,fontSize:12}}/>
            <input value={form.category} onChange={e=>setForm({...form,category:e.target.value})} placeholder="Category" style={{padding:13,border:'1px solid #dbe7ee',borderRadius:10,fontSize:12}}/>
            <input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} placeholder="Location" style={{padding:13,border:'1px solid #dbe7ee',borderRadius:10,fontSize:12}}/>
            <input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="Public business phone" style={{padding:13,border:'1px solid #dbe7ee',borderRadius:10,fontSize:12}}/>
            <input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="Public business email" style={{padding:13,border:'1px solid #dbe7ee',borderRadius:10,fontSize:12}}/>
            <input value={form.website} onChange={e=>setForm({...form,website:e.target.value})} placeholder="Website" style={{padding:13,border:'1px solid #dbe7ee',borderRadius:10,fontSize:12}}/>
            <input value={form.source_url} onChange={e=>setForm({...form,source_url:e.target.value})} placeholder="Source URL" style={{padding:13,border:'1px solid #dbe7ee',borderRadius:10,fontSize:12}}/>
          </div>
          <div style={{display:'flex',justifyContent:'flex-end',marginTop:10}}><button className="primaryBtn small" type="submit">Save Prospect</button></div>
        </form>
      )}

      <section style={{background:'#fff',border:'1px solid #dfe9ed',borderRadius:16,overflow:'hidden',boxShadow:'0 10px 28px rgba(15,23,42,.04)'}}>
        <div style={{padding:'16px 18px',borderBottom:'1px solid #edf2f4',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <b style={{fontSize:15}}>Prospect Database</b>
            <small style={{display:'block',fontSize:8,color:'#94a3b8',marginTop:2}}>{filtered.length} visible records</small>
          </div>
          <div style={{display:'flex',gap:6,alignItems:'center',fontSize:8,color:'#64748b'}}><ShieldCheck size={13}/> Deduplication + outreach review enabled</div>
        </div>
        <div style={{overflowX:'auto'}}>
          <table className="dashTable" style={{marginTop:0}}>
            <thead><tr><th>Business</th><th>Business Type</th><th>Source</th><th>Location</th><th>Phone</th><th>Email</th><th>Lead Score</th><th>Recommended Product</th><th>Status</th><th>Outreach</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={8}>Loading prospects…</td></tr> : filtered.length===0 ? <tr><td colSpan={8}>No prospects found. Add manually or connect an official data source.</td></tr> : filtered.map(r=>(
                <tr key={r.id}>
                  <td><b>{r.business_name}</b>{r.website && <small style={{display:'block',fontSize:8,color:'#94a3b8'}}>{r.website}</small>}</td>
                  <td>{r.business_type || r.category || '—'}</td>
                  <td>{sourceLabel[r.source] || 'Web Search'}</td>
                  <td>{r.location || '—'}</td>
                  <td>{r.phone || '—'}</td>
                  <td>{r.email || '—'}</td>
                  <td><span className="dashBadge" style={{background:(r.lead_score||0)>=80?'#ecfdf5':(r.lead_score||0)>=60?'#fff7ed':'#f8fafc',color:(r.lead_score||0)>=80?'#047857':(r.lead_score||0)>=60?'#c2410c':'#64748b'}}>{r.lead_score ?? '—'}{r.lead_score != null ? '%' : ''}</span></td>
                  <td><b style={{fontSize:9,color:'#0369a1'}}>{r.recommended_product || '—'}</b></td>
                  <td><span className="dashBadge">{r.status}</span></td>
                  <td><span className="dashBadge" style={{background:r.outreach_eligibility==='allowed'?'#ecfdf5':r.outreach_eligibility==='do_not_contact'?'#fef2f2':'#fff7ed',color:r.outreach_eligibility==='allowed'?'#047857':r.outreach_eligibility==='do_not_contact'?'#b91c1c':'#c2410c'}}>{r.outreach_eligibility.replace('_',' ')}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      </div>
    </CommercialShell>
  );
};

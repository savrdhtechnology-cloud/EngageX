import React from 'react';
import { FlaskConical, ShieldCheck, Sparkles } from 'lucide-react';
import { LEADFORGE_ENABLED } from '../lib/leadForge';

type Props = {
  campaignName: string;
  setCampaignName: (value: string) => void;
};

export const LeadForgeBetaPanel: React.FC<Props> = ({ campaignName, setCampaignName }) => {
  if (!LEADFORGE_ENABLED) return null;

  return (
    <section style={{
      background:'linear-gradient(135deg,#07111f 0%,#0f1d31 58%,#111827 100%)',
      border:'1px solid rgba(234,179,8,.32)', borderRadius:18, padding:'18px 20px',
      marginBottom:18, color:'#f8fafc', boxShadow:'0 18px 42px rgba(15,23,42,.16)'
    }}>
      <div style={{display:'flex',justifyContent:'space-between',gap:18,alignItems:'center',flexWrap:'wrap'}}>
        <div style={{minWidth:260,flex:'1 1 520px'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
            <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'5px 9px',borderRadius:999,background:'rgba(234,179,8,.13)',border:'1px solid rgba(234,179,8,.25)',color:'#fde68a',fontSize:9,fontWeight:900,letterSpacing:.8}}>
              <FlaskConical size={12}/> LEADFORGE BETA
            </span>
            <span style={{fontSize:9,fontWeight:900,color:'#86efac',display:'inline-flex',gap:4,alignItems:'center'}}><ShieldCheck size={12}/> ISOLATED</span>
          </div>
          <h2 style={{fontSize:21,margin:'0 0 6px',letterSpacing:'-.35px'}}>Savrdh LeadForge inside EngageX Lead Intelligence</h2>
          <p style={{margin:0,color:'#a8b6c8',fontSize:11,lineHeight:1.65,maxWidth:760}}>
            Uses the existing EngageX live business search, then records an isolated LeadForge campaign/job,
            normalizes duplicate candidates and stores transparent lead-score reasons. Contacts are added to
            EngageX only when you explicitly select and import them.
          </p>
        </div>
        <div style={{flex:'0 1 360px',minWidth:260}}>
          <label style={{display:'block',fontSize:9,fontWeight:900,letterSpacing:.7,color:'#cbd5e1',marginBottom:6}}>CAMPAIGN NAME</label>
          <div style={{position:'relative'}}>
            <Sparkles size={15} style={{position:'absolute',left:12,top:12,color:'#facc15'}}/>
            <input
              value={campaignName}
              onChange={e=>setCampaignName(e.target.value)}
              placeholder="e.g. Bhopal Rice Mill Campaign"
              style={{width:'100%',padding:'11px 12px 11px 36px',border:'1px solid rgba(255,255,255,.14)',borderRadius:10,background:'rgba(255,255,255,.07)',color:'#fff',outline:'none',fontSize:11}}
            />
          </div>
          <small style={{display:'block',marginTop:7,color:'#7f8ea3',fontSize:9}}>
            Turn off instantly with VITE_ENABLE_LEADFORGE=false.
          </small>
        </div>
      </div>
    </section>
  );
};

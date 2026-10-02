import { supabase } from './supabase';

export const LEADFORGE_ENABLED = String(import.meta.env.VITE_ENABLE_LEADFORGE ?? 'true').toLowerCase() !== 'false';

export type LeadForgeJobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export type LeadForgeResult = {
  external_id?: string;
  business_name?: string;
  category?: string | null;
  business_type?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  rating?: number | null;
  review_count?: number | null;
  source?: string | null;
  source_url?: string | null;
  lead_score?: number | null;
  match_score?: number | null;
};

const normalize = (value: unknown) => String(value ?? '').trim().toLowerCase();
const normalizePhone = (value: unknown) => String(value ?? '').replace(/\D/g, '').slice(-10);
const normalizeUrl = (value: unknown) => normalize(value).replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');

export const leadForgeDedupeKey = (r: LeadForgeResult) => [
  normalize(r.business_name),
  normalizePhone(r.phone),
  normalizeUrl(r.website),
  normalize(r.address)
].join('|');

export const scoreLeadForgeResult = (r: LeadForgeResult) => {
  const reasons: string[] = [];
  let score = 0;
  if (normalizePhone(r.phone)) { score += 25; reasons.push('Public phone available +25'); }
  if (normalize(r.email)) { score += 25; reasons.push('Public email available +25'); }
  if (normalize(r.website)) { score += 15; reasons.push('Website available +15'); }
  if (normalize(r.category || r.business_type)) { score += 10; reasons.push('Category identified +10'); }
  if (typeof r.rating === 'number') { score += 10; reasons.push('Rating data available +10'); }
  if (typeof r.review_count === 'number' && r.review_count > 0) { score += 10; reasons.push('Review data available +10'); }
  if (normalize(r.source_url)) { score += 5; reasons.push('Traceable source URL +5'); }
  return { score: Math.min(score, 100), reasons };
};

export const createLeadForgeJob = async (input: {
  workspaceId: string;
  campaignName: string;
  keyword: string;
  area: string;
  city: string;
  requestedResults: number;
}) => {
  if (!LEADFORGE_ENABLED) return { campaignId: null, jobId: null };
  try {
    const campaignInsert = await supabase.from('leadforge_campaigns').insert({
      workspace_id: input.workspaceId,
      name: input.campaignName || [input.keyword || 'Business Search', input.city].filter(Boolean).join(' · '),
      keyword: input.keyword || null,
      location: [input.area, input.city].filter(Boolean).join(', ') || null,
      status: 'active'
    }).select('id').single();
    const campaignId = campaignInsert.data?.id || null;

    const jobInsert = await supabase.from('leadforge_jobs').insert({
      workspace_id: input.workspaceId,
      campaign_id: campaignId,
      keyword: input.keyword || null,
      location: [input.area, input.city].filter(Boolean).join(', ') || null,
      requested_results: input.requestedResults,
      status: 'running',
      started_at: new Date().toISOString()
    }).select('id').single();

    return { campaignId, jobId: jobInsert.data?.id || null };
  } catch {
    // Beta job tracking is deliberately non-blocking. The existing EngageX search must keep working.
    return { campaignId: null, jobId: null };
  }
};

export const completeLeadForgeJob = async (input: {
  workspaceId: string;
  campaignId: string | null;
  jobId: string | null;
  results: LeadForgeResult[];
}) => {
  if (!input.jobId || !LEADFORGE_ENABLED) return;
  const unique = new Map<string, LeadForgeResult>();
  input.results.forEach((r) => {
    const key = leadForgeDedupeKey(r);
    if (!unique.has(key)) unique.set(key, r);
  });
  const cleaned = Array.from(unique.values());

  try {
    if (cleaned.length) {
      const payload = cleaned.map((r) => {
        const scoring = scoreLeadForgeResult(r);
        return {
          workspace_id: input.workspaceId,
          campaign_id: input.campaignId,
          job_id: input.jobId,
          external_id: r.external_id || null,
          business_name: r.business_name || 'Unknown business',
          category: r.category || r.business_type || null,
          phone: r.phone || null,
          email: r.email || null,
          website: r.website || null,
          address: r.address || null,
          rating: r.rating ?? null,
          review_count: r.review_count ?? null,
          source: r.source || 'engagex-lead-search',
          source_url: r.source_url || null,
          lead_score: typeof r.lead_score === 'number' ? r.lead_score : scoring.score,
          score_reasons: scoring.reasons
        };
      });
      await supabase.from('leadforge_leads').upsert(payload, { onConflict: 'workspace_id,dedupe_key', ignoreDuplicates: true });
    }
    await supabase.from('leadforge_jobs').update({
      status: 'completed',
      results_found: input.results.length,
      valid_leads: cleaned.filter((r) => Boolean(normalizePhone(r.phone) || normalize(r.email))).length,
      duplicate_leads: Math.max(0, input.results.length - cleaned.length),
      completed_at: new Date().toISOString()
    }).eq('workspace_id', input.workspaceId).eq('id', input.jobId);
  } catch {
    // Search results remain available in the existing EngageX UI even if beta tracking fails.
  }
};

export const failLeadForgeJob = async (workspaceId: string, jobId: string | null, message: string) => {
  if (!jobId || !LEADFORGE_ENABLED) return;
  try {
    await supabase.from('leadforge_jobs').update({
      status: 'failed',
      error_count: 1,
      error_message: message.slice(0, 1000),
      completed_at: new Date().toISOString()
    }).eq('workspace_id', workspaceId).eq('id', jobId);
  } catch {
    // Never block the existing Lead Intelligence flow.
  }
};

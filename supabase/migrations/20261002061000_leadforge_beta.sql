-- Savrdh LeadForge beta for EngageX.
-- Additive only: no existing EngageX tables or policies are modified.

create table if not exists public.leadforge_campaigns (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.engagex_workspaces(id) on delete cascade,
  name text not null,
  keyword text,
  location text,
  status text not null default 'active' check (status in ('active','paused','completed','archived')),
  created_at timestamptz not null default now()
);

create table if not exists public.leadforge_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.engagex_workspaces(id) on delete cascade,
  campaign_id uuid references public.leadforge_campaigns(id) on delete set null,
  keyword text,
  location text,
  requested_results integer not null default 20 check (requested_results between 1 and 500),
  results_found integer not null default 0 check (results_found >= 0),
  valid_leads integer not null default 0 check (valid_leads >= 0),
  duplicate_leads integer not null default 0 check (duplicate_leads >= 0),
  error_count integer not null default 0 check (error_count >= 0),
  error_message text,
  status text not null default 'queued' check (status in ('queued','running','completed','failed','cancelled')),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.leadforge_leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.engagex_workspaces(id) on delete cascade,
  campaign_id uuid references public.leadforge_campaigns(id) on delete set null,
  job_id uuid references public.leadforge_jobs(id) on delete set null,
  external_id text,
  business_name text not null,
  category text,
  phone text,
  email text,
  website text,
  address text,
  rating numeric,
  review_count integer,
  source text not null default 'engagex-lead-search',
  source_url text,
  lead_score integer not null default 0 check (lead_score between 0 and 100),
  score_reasons text[] not null default '{}',
  status text not null default 'new' check (status in ('new','reviewed','qualified','contacted','converted','rejected')),
  dedupe_key text generated always as (
    lower(trim(coalesce(business_name,''))) || '|' ||
    right(regexp_replace(coalesce(phone,''),'[^0-9]','','g'),10) || '|' ||
    lower(regexp_replace(regexp_replace(coalesce(website,''),'^https?://','','i'),'^www\\.','','i')) || '|' ||
    lower(trim(coalesce(address,'')))
  ) stored,
  created_at timestamptz not null default now()
);

create unique index if not exists leadforge_leads_workspace_dedupe on public.leadforge_leads(workspace_id,dedupe_key);
create index if not exists leadforge_campaigns_workspace on public.leadforge_campaigns(workspace_id,created_at desc);
create index if not exists leadforge_jobs_workspace on public.leadforge_jobs(workspace_id,created_at desc);
create index if not exists leadforge_leads_job on public.leadforge_leads(workspace_id,job_id);

alter table public.leadforge_campaigns enable row level security;
alter table public.leadforge_jobs enable row level security;
alter table public.leadforge_leads enable row level security;

revoke all on public.leadforge_campaigns, public.leadforge_jobs, public.leadforge_leads from public, anon, authenticated;
grant all on public.leadforge_campaigns, public.leadforge_jobs, public.leadforge_leads to service_role;
grant select, insert, update, delete on public.leadforge_campaigns, public.leadforge_jobs, public.leadforge_leads to authenticated;

drop policy if exists leadforge_campaigns_read on public.leadforge_campaigns;
drop policy if exists leadforge_campaigns_write on public.leadforge_campaigns;
drop policy if exists leadforge_jobs_read on public.leadforge_jobs;
drop policy if exists leadforge_jobs_write on public.leadforge_jobs;
drop policy if exists leadforge_leads_read on public.leadforge_leads;
drop policy if exists leadforge_leads_write on public.leadforge_leads;

create policy leadforge_campaigns_read on public.leadforge_campaigns
for select to authenticated using (engagex_private.workspace_role(workspace_id) is not null);
create policy leadforge_campaigns_write on public.leadforge_campaigns
for all to authenticated
using (engagex_private.workspace_role(workspace_id) in ('Owner','Admin','Manager'))
with check (engagex_private.workspace_role(workspace_id) in ('Owner','Admin','Manager'));

create policy leadforge_jobs_read on public.leadforge_jobs
for select to authenticated using (engagex_private.workspace_role(workspace_id) is not null);
create policy leadforge_jobs_write on public.leadforge_jobs
for all to authenticated
using (engagex_private.workspace_role(workspace_id) in ('Owner','Admin','Manager'))
with check (engagex_private.workspace_role(workspace_id) in ('Owner','Admin','Manager'));

create policy leadforge_leads_read on public.leadforge_leads
for select to authenticated using (engagex_private.workspace_role(workspace_id) is not null);
create policy leadforge_leads_write on public.leadforge_leads
for all to authenticated
using (engagex_private.workspace_role(workspace_id) in ('Owner','Admin','Manager'))
with check (engagex_private.workspace_role(workspace_id) in ('Owner','Admin','Manager'));

comment on table public.leadforge_campaigns is 'Removable LeadForge beta data isolated inside EngageX.';
comment on table public.leadforge_jobs is 'Removable LeadForge beta job history isolated inside EngageX.';
comment on table public.leadforge_leads is 'Removable LeadForge beta lead snapshots; EngageX contacts are written only by explicit user import.';

# EngageX — existing Savrdh Technology database

Updated 30 September 2026. The user explicitly chose the existing Savrdh Technology website/CRM project instead of provisioning another Supabase project.

## Applied database changes

Project: `ldffgetuzoeupuhoaubn` (Savrdh Technology).
Workspace slug: `savrdh-engagex`.

Two additive migrations create 12 `public.engagex_*` tables and private helper functions. Existing CRM tables, authentication settings, passwords and records were not changed. The existing confirmed `savrdhtechnology@gmail.com` Supabase account owns EngageX. The application verifies its existing password with Supabase Auth; it does not invent a new password or reset that shared account.

Tables: workspaces, members, contacts, campaigns, messages, templates, automations, integrations, billing, audit_logs, notifications, inquiries.

All 12 tables have RLS and explicit grants. Non-members see no EngageX data. Anonymous callers cannot access tables. Browser users cannot modify credits, impersonate owners, approve provider templates, forge delivery counters, or write audit logs. Private database triggers normalize contact identities, enforce opt-out, and generate audit events. No sample contacts or campaigns were inserted.

## Connected application modules

- Password login, persistent session and local-app logout use Supabase Auth with an EngageX-specific storage key.
- Contacts: load/create/update/delete/import/export; database uniqueness, normalized phones, explicit consent.
- Campaigns: database drafts; unavailable dispatch does not manufacture successful delivery.
- Templates: saved drafts, pending real provider approval.
- Automations: persisted paused workflow definitions; activation requires a worker/provider.
- Integrations: database-backed non-secret configuration; no API keys stored in browser/local state.
- Team: member list and invitation request records. Request storage does not send email or activate a member.
- Settings: persisted workspace settings, timezone and database-generated audit trail.
- Dashboard/analytics: database records, no mock-data hydration.
- Inbox, billing and notifications read database records; privileged events remain backend-controlled.

The frontend includes only the public Supabase project URL and publishable key. No service-role key is present. CSS/layout files remain unchanged. Forms await server confirmation before success or modal closure. Data refreshes on module navigation/window focus; this is not a realtime subscription.

## Remaining external setup

WhatsApp/SMS/email credentials and verified senders, secure dispatcher + webhooks, automation worker, payment checkout, invitation email/acceptance and public inquiry submission are not configured. These controls report that state instead of simulating success. No outbound messages or payments were performed during this task. Password recovery is not implemented inside EngageX; existing account recovery remains with the administrator.

## Verification

- Applied migrations successfully to the live project.
- Transactional SQL integration tests pass: owner CRUD, contact normalization/consent, immutable audit events, denied billing/status tampering, outsider isolation, anonymous denial. Probes rolled back; no test records remain.
- Security advisor: no EngageX-specific findings. Existing unrelated findings were not modified.
- TypeScript and production build pass.
- 6 regression tests plus 11 empty-workspace module render tests pass. These are not browser interaction tests.
- Interactive browser/login and external-provider delivery are not yet verified end-to-end.

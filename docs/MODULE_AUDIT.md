# Historical audit

The initial audit below describes the original prototype. For the current database integration and remaining provider requirements, see [SHARED_DATABASE.md](SHARED_DATABASE.md). The user superseded the separate-project choice and authorized the existing Savrdh Technology database.

# EngageX module audit — 30 September 2026

Production Vercel deployment dpl_7apA322uqdwomCnCBRKhZemogojo is READY at commit 0e86488. Its historical repository name engagex.Version-2 redirects to engageX (same repository ID 1397268861).

## Scope and design

This patch preserves the existing layout, CSS, colors, sidebar and component structure. Copy changes distinguish evaluation behavior from actual authentication, messaging and payments. This repository is a browser-local prototype; it has no server API, shared database, provider dispatch worker, payment processing, or server-enforced roles. Deployment readiness does not establish that these services exist.

## Corrections

- Removed conflicting unused esbuild dependency; added npm lockfile and explicit Vercel npm build configuration.
- Settings persist on the current device, including timezone, and report storage failures.
- Analytics date filtering now affects totals. Inbound/pending/failed messages are not counted as successful outbound sends. Removed fabricated fallback totals and channel benchmark percentages. Dashboard volume/peak charts derive from available records.
- Contact duplicates normalize Indian mobile formats and email case. CSV escaping handles quotes and formula prefixes. Imported consent is opt-in from explicit columns rather than forced true; country codes are not duplicated.
- Newly created campaigns use their actual selected channels rather than stale React state. Audience tags/status/consent are respected. Tiny audiences finish; duplicate starts, pause/delete/reset cleanup and browser-open schedules are handled.
- Chat sends validate recipient consent/address and report failures without clearing the draft. Opt-out replies update consent.
- Workspace reset only removes EngageX keys, not unrelated browser data. Malformed array storage falls back safely.
- Team invitation duplicates are blocked; sample invitations no longer claim an email was sent.
- Integration tests no longer manufacture a successful API handshake; save does not mark credentials verified. New secret values are excluded from local persistence.
- Normal login no longer accepts arbitrary passwords as real authentication; existing explicitly labeled evaluation buttons remain available. Workspace entry requires an evaluation session. Reset-password feedback no longer claims delivery.
- Sample invoices no longer claim a download occurred, and credit top-ups are identified as demo changes.
- Website inquiry form retains entered details locally instead of dropping them after logging a partial summary.

## Still required for production

The user selected a **dedicated EngageX Supabase project**. It has not been created. Supabase requires organization selection and cost confirmation before project provisioning. The available organization is savrdhtechnology-cloud (tkllxmslwvrosfnujzft).

1. Dedicated database with workspace-scoped tables, authenticated CRUD, RLS, role membership and migrations.
2. Real authentication, invite delivery, password reset, and server-enforced permissions. Demo roles are not security boundaries.
3. Server-side secret storage, WhatsApp/SMS/email credentials, verified senders, dispatch queue, retry/idempotency, consent checks, signed delivery webhooks, and durable scheduling.
4. Payment gateway verification before credit/plan changes; real invoices.
5. Persisted automation execution; current tests remain simulations. Never report their sample log output as actual provider responses.
6. Real click tracking and per-channel campaign events. Historical multi-channel aggregate counters cannot be truthfully attributed to a single channel.
7. Backend contact inquiry endpoint and shared notification/audit history.

Existing sample data remains for evaluation and must not be migrated as real customer data. Local demo campaign/message receipts remain simulations. Browser-open scheduling is not a replacement for a backend worker.

## Validation

- TypeScript check and production build pass.
- Regression tests cover zero-data metrics, directions/statuses, date/channel filters, phone normalization, CSV escaping and targeted consent audiences.
- Browser automation startup was unavailable in this execution environment; no complete browser/provider/payment end-to-end verification is claimed.

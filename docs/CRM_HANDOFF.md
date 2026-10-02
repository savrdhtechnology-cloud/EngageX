# EngageX → Savrdh sales CRM handoff

Only workspace slug `savrdh-engagex` routes into Savrdh Technology CRM. Client workspaces remain isolated.
Owners/Admins/Managers can mark a contact Qualified (exact tag `qualified` or `sales-qualified`) or set a saved prospect status to `qualified`. Active contacts and contactable prospects are eligible; valid phone/email is required. A high score, campaign delivery, or a "hot lead" tag alone is not qualification.

The database trigger creates an Interested/Warm CRM lead with zero quoted value, UNPAID state, and outbound automation off. Existing CRM phone/email matches are linked instead; existing sales status, quotations, payments and partner attribution remain unchanged. Ambiguous multiple matches are blocked for review. A workspace-wide transactional lock and receipt uniqueness serialize handoffs.

Only server code writes `engagex_crm_handoffs`. Workspace members can read their own receipts through RLS; outsiders and anonymous users cannot. Private trigger functions are not executable from the Data API. Source/campaign/channel metadata is recorded when it exists. No campaign is invented if the contact has no recorded campaign message.

CRM Edge Function `website-sales-crm` version 9 is deployed to the existing Supabase project. Its credential-free patch is stored in the website repo. It includes origin metadata in load responses, preserves server metadata on browser saves, excludes handoff rows from snapshot-based deletion, and skips stale handoff lead updates. A skipped update returns a conflict notice. Imported lead removal requires a deliberate administrative action rather than omission from a browser snapshot.

Frontend: EngageX Contacts has qualification actions for contacts and saved prospects, receipt status and retry. CRM polls every 10 seconds while visible and not saving, preserves edits made while a request is in flight, and updates its existing React state without page reload.

Verification: rolled-back SQL probes passed qualification, repeated sync, contact/prospect duplicate prevention, existing sales/payment preservation, missing identity blocking, client workspace isolation, receipt read/write authorization, and authenticated owner qualification. No test leads or contacts remain. No feature-specific security advisor findings. No outbound messages were sent. Real authenticated browser handoff must still be verified by the workspace owner.

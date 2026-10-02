# CRM deletion ownership

Main CRM uses the authenticated website-sales-crm action deleteLeads with leadRefs and confirmCount. Bulk selection is limited to current filters and requires typing DELETE followed by the count. A successful delete removes CRM records only; it never deletes EngageX contacts or prospects.

EngageX contact/prospect deletion cascades only when the linked lead is registered in the private crm_owned_leads table. Both sync paths register newly inserted CRM leads, never matched existing leads. Historical registrations require exact generated client_ref and origin identity. Manual/Website/Partner/Direct matched leads are retained.

CRM deletion sets linked handoff receipts to crm_deleted and blocked. Both sync paths respect this marker. Private deleted_refs prevents stale browser inserts/upserts from restoring deleted client_refs. Trigger functions are private and not callable by anon/authenticated. Existing workspace RLS governs EngageX deletion.

Applied production migrations: 20261002044625 and 20261002045003. Tests run in a transaction and roll back all fixtures. They cover contact/prospect cascade, CRM-only deletion, repeat sync, stale snapshot upsert, preservation of four existing source types, workspace isolation and private privileges.

Edge function version 11 adds deleteLeads after existing requireSession authorization; JWT configuration remains unchanged because custom CRM sessions are verified. Missing/malformed IDs and mismatched confirmation counts return 400. Authentication failure returns 401. DB errors return failure without claiming local deletion.

Existing database restrictions on leads with linked deals or financial records remain in force. Main CRM returns 409 with a review message; a failed bulk delete is atomic and leaves every selected lead in place.

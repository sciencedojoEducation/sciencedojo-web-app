# Personal Aspekte neu B2 Lehrbuch in ScienceDojo

Owner correction, 23 October 2026: this interactive book belongs inside ScienceDojo. The separate private Sites deployment was the wrong destination. Reuse its reading interface and source renderings; do not create another standalone service.

## Entry and scope

- App route: `/workbooks/aspekte-neu-b2-lehrbuch`.
- Admin sidebar: **Private workbooks → B2 Lehrbuch**. The existing `/dashboard/admin/workbooks` page also has an explicit book card.
- ScienceDojo email/Google login and verified, active database-backed admin role are required outside the loopback development preview. This personal book is not added to public or learner catalogs. No ChatGPT sign-in is used.
- All 202 owner-supplied textbook pages, ten chapter destinations, question pins, editable exercise answers, reflections, vocabulary, bookmarks, journal search/filter and JSON/Markdown exports are retained.
- Old Sites JSON journal backups can be imported as new copies. No previously saved account data has been silently migrated or overwritten.
- Original pages are scans. No invented automatic grades, answer keys or absent audio/video. Scanned source images are not fully screen-reader accessible.

## Private sources and saving

Source pages: ignored `private-materials/aspekte-neu-b2-lehrbuch/derived/pages/`. They are outside `public/` and excluded by the existing deployment trace configuration. Hosted page requests authenticate and proxy the existing private Supabase bucket prefix `private-workbooks/aspekte-neu-b2-lehrbuch/pages/`; storage signatures never reach the browser. No changes to the Arbeitsbuch source prefix.

Migration `sql/081_workbook_reflections.sql` adds a separate, RLS-protected table and a service-only compare-and-swap writer. Admins can read only their own reflections; neither admin role nor this feature grants access to another person's journal. Direct authenticated database writes are denied. Account deletion cascades. Existing memberships, invitation rules, Arbeitsbuch progress/scoring and recordings remain unchanged.

The development loopback preview saves atomically to ignored `derived/reflections-preview.json`. Local mode is explicitly labelled. Hosted mode saves to the authenticated ScienceDojo account. The client binds mutations to its rendered account identity; the server rejects mismatches after an account switch, and the reader remounts for a new identity. Pending browser drafts remain account/book-scoped, and stale writes produce a conflict with an option to save a recovered copy.

## Preparation and validation

```sh
node --experimental-strip-types --test tests/lehrbuch.test.mjs tests/workbook-access.test.mjs tests/aspekte-workbook.test.mjs tests/workbook-database.test.mjs
npx tsc --noEmit
node scripts/verify-lehrbuch.mjs http://localhost:3003
node --env-file=.env.local scripts/publish-lehrbuch-private.mjs
# After confirming the reviewed private upload target:
node --env-file=.env.local scripts/publish-lehrbuch-private.mjs --apply
```

Verified locally on 23 October:

- Five new model/local-store/actual-PostgreSQL/account-switch tests passed; 22 existing workbook/access/database regressions passed. Checks include own-admin RLS, anonymous/non-admin denial, service-only writes, Unicode, atomic conflicts, suspension and account cleanup.
- TypeScript and the isolated current-main production build passed. Both new function traces exclude private materials, environment files and public static assets.
- Actual isolated Next webpack preview served the page. All 202 protected JPEG responses matched local SHA-256, invalid media paths were denied, Unicode answers survived GET/reopen, stale writes conflicted and foreign-origin requests were rejected. Synthetic API fixtures were removed.
- Browser exercise-answer save and reload passed inside the ScienceDojo route. The 390px journal/document layout had no horizontal overflow (document 386px). Temporary viewport reset. Preview examples are explicitly synthetic.
- The source uploader confirmed the existing bucket is private, then uploaded all 202 pages / 54,146,731 bytes to the isolated textbook prefix. First/chapter-one/final cloud page SHA-256 checks matched local source. No learner records were uploaded.

## Release state

Prepared in an isolated branch from current main so unrelated campus/business/homepage edits are excluded. Private source upload is complete. Migration 081 and production application release remain pending; SQL Editor access has been requested because the available server credentials cannot apply schema changes. Existing production workbook configuration remains unchanged. Do not present the local URL or tests as a published ScienceDojo release. Hosted account saving and actual admin navigation require a post-release check. The built production server rejects anonymous notes read/write/delete and image access with 401; both document and RSC requests redirect to normal ScienceDojo login without book content.


### Status rechecked — 30 October 2026

PR #22 remains open/draft and is not merged into main. The current main branch has no Lehrbuch route, and a read-only live Supabase probe reports the reflection table unavailable (`PGRST205`), so migration 081 has not been confirmed applied. The final account-switch safeguard passed a fresh TypeScript check and all 27 focused model/access/PostgreSQL regressions. It is included in the updated draft release branch. No production merge, schema application or live admin saving acceptance is claimed.


### Owner-applied migration — 30 October 2026

The owner reported running migration 081. A live schema probe confirms `workbook_reflections` is available and `workbook_save_reflection` exists; the function returns false for a nonexistent account without writing a row. The release branch was updated with current main and both admin workbook links/cards are retained, including the already-published Intensivtrainer. Production application deployment and live acceptance are still pending at this checkpoint.

# Personal Aspekte neu B2 Lehrbuch in ScienceDojo

Owner correction, 23 October 2026: this interactive book belongs inside ScienceDojo. The separate private Sites deployment was the wrong destination. Reuse its reading interface and source renderings; do not create another standalone service.

## Entry and scope

- App route: `/workbooks/aspekte-neu-b2-lehrbuch`.
- Admin sidebar: **Private workbooks → B2 Lehrbuch**. The existing `/dashboard/admin/workbooks` page also has an explicit book card.
- ScienceDojo email/Google login and verified, active database-backed admin role are required outside the loopback development preview. This personal book is not added to public or learner catalogs. No ChatGPT sign-in is used.
- All 202 owner-supplied textbook pages, ten chapter destinations, question pins, editable exercise answers, reflections, vocabulary, bookmarks, journal search/filter and JSON/Markdown exports are retained.
- Old Sites JSON journal backups can be imported as new copies. No previously saved account data has been silently migrated or overwritten.
- Native exercise pages are the default. The original scans remain an optional comparison view with earlier pins. No invented automatic grades, answer keys or absent audio/video. OCR text can contain transcription errors; original scans are not fully screen-reader accessible.

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

Published on 30 October 2026 at `https://www.sciencedojo.co.uk/workbooks/aspekte-neu-b2-lehrbuch`. The owner applied migration 081; live schema/function probes passed. PR #22 is merged into main at software revision `bd0760a910177f15567d830252cd5ca970842c65`, whose tree matches the checked release `73f0f1c`. The production deployment succeeded. Normal ScienceDojo admin entry, private page loading, a pinned question/answer save, full reload and journal persistence passed in the existing owner's browser. The synthetic test entry was removed with exact ID/content/revision guards. Existing learning records were not edited.


### Status rechecked — 30 October 2026

PR #22 remains open/draft and is not merged into main. The current main branch has no Lehrbuch route, and a read-only live Supabase probe reports the reflection table unavailable (`PGRST205`), so migration 081 has not been confirmed applied. The final account-switch safeguard passed a fresh TypeScript check and all 27 focused model/access/PostgreSQL regressions. It is included in the updated draft release branch. No production merge, schema application or live admin saving acceptance is claimed.


### Owner-applied migration — 30 October 2026

The owner reported running migration 081. A live schema probe confirms `workbook_reflections` is available and `workbook_save_reflection` exists; the function returns false for a nonexistent account without writing a row. The release branch was updated with current main and both admin workbook links/cards are retained, including the already-published Intensivtrainer. Production application deployment and live acceptance are still pending at this checkpoint.


### Production completion — 30 October 2026

- PR #22 merged into main; production Vercel deployment `84FSRHdW2cMie8Ks8QRd6N6SiSwv` succeeded for `bd0760a910177f15567d830252cd5ca970842c65`.
- Hosted build/regression/engineering-browser/private-trace and cron checks passed on the identical release tree. Updated-main local type/build and 32 focused workbook/database regressions passed.
- Existing authenticated admin navigation shows both Lehrbuch and Intensivtrainer links/cards. Actual canonical-site source images loaded, and a clearly synthetic question pin plus answer survived reload and appeared in My journal. Its exact database content matched before the single test row was removed; no real answers were modified.
- Four anonymous API/media requests returned 401/no-store. Both anonymous document and RSC requests redirected to ScienceDojo login without book content.
- Private evidence: `private-materials/aspekte-neu-b2-lehrbuch/derived/production-verification-2026-10-30.json` and `production-preview.jpg`. The current reading position was left unchanged after the owner began navigating.
- Migration 081 is already applied: do not rerun its non-idempotent creation SQL. This completes the requested private admin textbook release, not public/learner publication, perfect scan accessibility or independent device/usability acceptance.


### Native exercise correction — 30 October 2026

The owner rejected the first release as scanned pages with notes and requested the Arbeitsbuch-style interactions immediately. That correction supersedes the earlier claim that the scan reader completed the intended interactive-book scope.

The replacement reuses `NativeWorkbookExercise` from Arbeitsbuch/Intensivtrainer. All 202 source pages have private native data; the ten teaching chapters contain 541 source tasks with 939 answer fields, including 494 inline placements, selectable answers, matching banks, editable tables and writing drafts. There are 154 cropped source illustrations. Front matter, chapter openings, grammar summaries and appendix remain reading/reference pages. Original scans and all earlier journal/pin entries remain available.

- Answers bind to stable book/page/task/field UUIDs in the existing own-account 081 table. Questions, reflections and self-review attach to actual tasks. Review lists collect “Noch üben”; retry queues a preserved previous-attempt copy before clearing the current fields. All entries appear in the searchable/exportable journal. Journal reads paginate beyond the database's default row cap.
- Content and figures are authenticated server proxies with private/no-store responses. Source JSON, word-box OCR, manual source corrections, illustrations and QA evidence remain ignored private material, outside public assets and deployment traces. No new schema, account authority, public catalog or learner release is involved. Migration 081 is already applied and must not be rerun.
- Local macOS Vision plus the PDF's independent text layer produce the source conversion. `scripts/prepare-lehrbuch-native.py` rebuilds the private package. Manual overrides stay private. Source task markers, columns, numbered gaps, actual choices and source illustration crops were checked and corrected on representative pages; full independent proofreading is not established. The original comparison view and OCR qualification remain in the book.
- This source has no verified answer key or audio/video files. All fields use manual review, with explicit missing-media notices. No grades, recordings or external AI feedback are introduced. The optional renderer flags keep the other two books' existing defaults.

Local evidence: all 485 regression tests passed (including privacy/CAS, account isolation, source-route gates, paginated loading and private package validation), TypeScript passed, scoped lint had no errors (the retained authenticated scan image has the existing image-optimization warning), and the production webpack build passed. The default Turbopack build cannot follow this worktree's shared dependency symlink; CI uses its own installed dependencies. Production traces contained no private source or environment files. Browser checks passed for inline text saving/reload, task questions, multiple word-bank selections, editable grammar choices, multiple choice, review status and preserved retry history. The 390px phone document measured 386px wide with no horizontal overflow; viewport restored. These checks do not establish perfect transcription or independent device/human acceptance.

Private publication uses `node --env-file=.env.local scripts/publish-lehrbuch-private.mjs --native-only --apply`. Its strict allowlist includes only the 202 native pages, manifest and referenced illustration JPEGs; every uploaded object is downloaded and SHA-256 verified. It excludes OCR, overrides, notes and credentials. See private `derived/native-upload-verification.json` and `derived/native-build-verification.json` for actual evidence. Application production deployment/live acceptance are recorded separately below once verified.

Private source publication completed: all 357 allowlisted native/illustration objects (8,074,422 bytes) were uploaded and downloaded with matching SHA-256 hashes. No journal data was uploaded. Local browser/check evidence is recorded in ignored `derived/native-local-verification-2026-10-30.json`.

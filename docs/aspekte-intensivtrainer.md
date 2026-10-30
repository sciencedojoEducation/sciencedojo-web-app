# Admin Aspekte neu B2 Intensivtrainer

The owner supplied `Aspekte neu Intensivtrainer B2 (1).pdf` on 23 October 2026,
then requested a native interactive book inspired by the existing Arbeitsbuch on
ScienceDojo. The owner selected **admin accounts only for now**. The earlier
scan-crop/local-only prototype is superseded by this native reader and admin-only
release preparation. It is separate from Lehrbuch, business and campus changes.

## Current reader

Live admin-only reader: [Aspekte neu B2 Intensivtrainer](https://www.sciencedojo.co.uk/workbooks/aspekte-neu-b2-intensivtrainer).
Admin navigation and the private workbook library link to it. The separate local
review remains on `http://localhost:3002`.

- Ten chapters and 80 printed-page destinations, pages 4–83; 283 native exercises,
  1,484 answer fields, 1,309 inline controls, 16 word banks and 619 vocabulary entries.
- Reuses `NativeWorkbookExercise`, extracted from the existing Arbeitsbuch without
  changing its exercise behavior. Text, tables, dropdowns, segmented answers and
  word banks are native controls. Thirty-eight source illustrations/puzzles/charts
  remain figures. Whole source pages are optional references, rather than the
  primary exercise interface. Chapter one has additional manual source review.
- Self-review/revision, vocabulary meanings and flashcards, page notes, JSON/text
  export and validated import. Retrying an exercise archives its nonempty answers;
  a bounded previous-answer history remains visible and exportable.
- Separate account/book state, revision-based saves, independent-edit merging and
  explicit resolution when two devices edit the same field. Account-scoped local
  pending/recovery copies support failures and import recovery. Account changes
  pause saves; the server checks the account ID on requests. Local preview saving
  is a synthetic development mode, not evidence of hosted account sync.
- Optional, explicit text-only Gemini feedback reuses the existing provider and
  quota controls. Its button discloses transmission of the submitted answer and
  bounded exercise context to Google. No automatic/bulk book upload to AI, official
  answer key or numerical grading is added. No live provider call was made during
  the native rebuild checks.

The source has OCR-derived text and may contain recognition/grouping errors;
original references remain available. Software checks do not establish complete
independent proofreading or owner acceptance of every exercise.

## Source limits

The PDF declares 82 pages; only PDF pages 1–81 render. The final PDF object is
invalid. Printed pages 39–41 contain large corrupt regions, 42 is partly damaged,
and 43 is absent. The solutions listed from printed page 84 are not supplied.
These five destinations are explicitly marked damaged/missing and unreadable tasks
are not invented or counted as completed. No audio is supplied; separate Lehrbuch
dependencies remain labelled. A similarly named Downloads copy showed the same
inspected damage and was not substituted as a complete source.

## Access and private storage

Hosted access always calls the existing database-backed workbook admin check,
including confirmed account and suspension checks. An admin receives a separate
Intensivtrainer membership on first visit; an explicitly revoked membership stays
revoked. All source/state/figure requests recheck access. Feature controls retain
`WORKBOOK_ENABLED` and add `INTENSIVTRAINER_ENABLED=false` as a book-specific switch.
There is no learner invitation/access mode for this book.

All source pages, local Vision OCR, native authored JSON, helper scripts and QA
evidence remain in ignored `private-materials/aspekte-neu-b2-intensivtrainer/derived`.
They must never be committed or placed in `public/`. Production reads the existing
private Supabase `private-workbooks` bucket under the exact prefix
`aspekte-neu-b2-intensivtrainer/`. Asset URLs are proxied after access checks with
private/no-store responses; short-lived storage URLs stay server-side. No source
or learner files are bundled into production traces.

`sql/082_intensivtrainer.sql` expands the two existing workbook book-key constraints,
adds restrictive admin-only read policies for the new book and a service-only
fixed-book save function. It preserves the existing Arbeitsbuch, private bucket,
invitations and recording policies. The function rechecks verified, unsuspended
admin status and active membership before the existing compare-and-swap save.
Client roles cannot execute it. No new service or paid infrastructure is required.

Development bypass requires development mode and a validated loopback host/origin;
`WORKBOOK_ACCOUNT_MODE=true` forces normal accounts locally. Production never uses
this bypass. `WORKBOOK_STORAGE=local` is for private development source only.

## Release status — 26 October 2026

Prepared in isolated branch `codex/intensivtrainer-admin` from main `3cea310`,
without the original checkout's unrelated campus/business/Lehrbuch changes.

Completed locally:

- 37 focused model, source-sanitization, existing-workbook and actual PostgreSQL
  (PGlite) access/save regression tests passed. Coverage includes separate accounts,
  nonadmin denial, demotion/suspension/unconfirmed/revoked access, anonymous/direct
  writes, revision conflicts and old-book preservation.
- TypeScript and scoped ESLint passed. Production `npm run build -- --webpack`
  passed; webpack is needed because this isolated checkout links dependencies.
- Production traces: 167 route traces checked, including six trainer routes;
  zero private files or environment files, including resolved symlinks.
- Live development HTTP: all 80 native page records, 283 exercises, 1,484 fields,
  619 words and 117 permitted source/figure assets passed. Invalid paths, cross-site
  origins, actual remote Host, account mismatch and wrong-book saves were denied.
- Actual built production server: anonymous page streamed its normal login redirect;
  page-data, state, original-page and figure APIs returned 401. This is local
  production-mode evidence, not a hosted deployment result.
- Browser: native word-bank selection, inline choices, reload persistence,
  previous-answer archive and backup restore passed; later-chapter tasks and
  damaged-page notice inspected. Existing Arbeitsbuch exercise rendering passed
  after extraction. At 390px/320px the document widths were 386px/316px with no
  page overflow; visible answer controls were 16px. Synthetic answers were cleared
  through backup restore. No physical-device or independent usability claim.
- Native source audit passed. Upload dry-run allowlists 198 objects (about 20.5 MB):
  manifest, 80 native records, 79 original-page JPEGs and 38 figures. No learner
  saves, original PDF, raw OCR, helper scripts or obsolete task crops are included.

Hosted PR evidence at code revision `2ed5569`: GitHub Build and regression checks
and Cron security succeeded; Vercel reported its Preview Ready. Anonymous access
to that preview redirected to Vercel sign-in, so this does not prove the workbook's
hosted admin flow. [Draft PR #23](https://github.com/sciencedojoEducation/sciencedojo-web-app/pull/23)
remains open and unmerged. A follow-up adds scoped native-workbook lint and the
resolved-path private/environment trace verifier to CI, including clean checkouts
without private sources; do not treat that follow-up as hosted-checked until its
own checks pass.

After the owner explicitly approved the exact upload on
26 October, the bounded uploader completed 198 objects / 20,517,294 bytes in the
existing private bucket and verified representative SHA-256 hashes. All 198 cloud
objects also matched their local hashes in a separate readback;
eight anonymous download/signing attempts were denied. No learner saves, raw OCR,
helper scripts or source PDF were uploaded. Evidence:
`derived/private-upload-verification.json` and `derived/source-cloud-verification.json`.

Migration 082 was applied on 26 October through the owner-opened authenticated
SQL Editor after verifying the configured ScienceDojo project and the original
old-book-only constraints. The transaction returned success. Postflight confirmed
both expanded book-key constraints, both RESTRICTIVE admin policies, retained RLS,
service-role execute permission and denied anon/authenticated execute permission.
Do not reapply this non-idempotent migration. The private source bucket stayed
private. Evidence: `migration082-result.jpg` and `migration082-verification.json`.

Actual hosted-database/account checks through the isolated loopback production
server passed on 26 October: native source withholding/proxying, verified nonadmin
and anonymous denial, independent-session resume including previous-answer history,
account binding, concurrent-save conflict, direct RLS/RPC denial, raw storage
protection, demotion/suspension/revocation and old-book separation. All three owned
fixture accounts and their data were removed. The initial run found missing
no-store headers on invalid page/asset 404 responses; those headers were corrected,
the production server rebuilt, and the whole account verifier passed on the rerun.
Both runs' three fixture accounts/data were cleaned. Evidence:
`account-verification-b088624a-0dcd-4263-a6e0-3b40e6706fe7.json` and its matching
`account-fixtures-*.json` ownership/cleanup record. No Gemini request was made.

A further disposable admin for browser-only QA was rejected by automatic approval
review because production admin creation requires specific authorization. It was
not created and must not be retried indirectly. The remaining browser check will
use the owner's existing admin account. The in-app sign-in tab is open; native
Edge control was unsuitable while windows changed and then timed out. The later
mismatched captures were discarded, not used as evidence. At that checkpoint, canonical admin browser acceptance and publication were
incomplete; the later publication result is recorded below.

## Production publication — 26 October 2026

[PR #23](https://github.com/sciencedojoEducation/sciencedojo-web-app/pull/23) was
merged from checked source revision `a8409a1` as main commit
`d2de1025481d2e207f21c7a1c8e9ea570a3c9cb0`. Build/regression checks, cron security
and Vercel Preview all passed for that source revision. Main's subsequent
Build/regression run `40341787088` and Cron security run `40341787058` also passed.
Vercel deployment `2FFPL1kHUDbvLjbmiUqQqsREJq4n` reported success for the merged
revision; the canonical `www.sciencedojo.co.uk` reader is deployed.

Nine anonymous canonical HTTPS checks passed: six content/state/source/invalid-path
GETs and two state/feedback POSTs returned no-store 401 responses; the page used
its normal login redirect and withheld exercise content. Evidence:
`canonical-production-verification.json`. This proves deployment and the anonymous
boundary, not positive signed-in browser saving on that domain.

### Existing owner admin browser check and first-visit correction

On 26 October the owner signed into the canonical site with the existing admin
account. The reader loaded its native exercises; navigation to page 5 saved to the
account and survived a full page reload. The original page 4 was restored, the UI
reported account save success and a read-only database check confirmed page 4.
Automation edited no answer fields. Private evidence: `live-browser-verification.json`
and `native-live-preview.jpg`. No additional admin fixture was created.

The first server-rendered visit initially returned “Book access could not be
confirmed” even though its membership insert succeeded. The installed Next fetch
guide documents why: identical GETs are memoized within a server render, so the
post-insert lookup reused the earlier empty response. Route handlers do not use
that render memoization, which is why the earlier API acceptance did not expose it.

The focused follow-up uses `readTrainerMembership` with the caller's abort signal,
Next's documented memoization opt-out. It keeps both reads fresh and retains
conflict-ignore enrollment, so a concurrent revocation cannot be overwritten.
Two synthetic Supabase regressions reproduce the old memoized miss and the revoked
membership race without creating production accounts. Twelve focused tests, scoped
lint, TypeScript and the production build passed locally. CI checks and rollout
revision are tracked with the first-visit follow-up. Independent proofreading,
owner usability acceptance and broader learner publication are not inferred.

## Concrete release sequence

1. **Completed 26 October:** Migration 082 was applied and its permissions/RLS
   checked. Do not reapply it or unrelated Lehrbuch/campus migrations.
2. **Completed 26 October with explicit owner approval.** Re-run only for an
   intentional reviewed source update:
   `node --env-file=.env.local scripts/publish-intensivtrainer-private.mjs --apply`.
   The default command is a read-only dry-run that verifies the existing private
   bucket and prior Arbeitsbuch source identity. Apply uses only its exact allowlist
   and verifies representative uploaded hashes. Credentials and destination project
   identifiers must remain private.
3. **Account API checks completed 26 October** against the isolated production
   server and the actual hosted database. The maintained verifier is
   `scripts/verify-intensivtrainer-accounts.mjs`; it creates three production
   disposable identities, including admin fixtures, and cleans them in `finally`.
   Following the later approval rejection, any further such account creation needs
   specific owner authorization. Do not rerun it or reuse cleaned fixture records
   merely to repeat completed checks. Use the existing owner admin for any further
   canonical HTTPS/browser checks. Keep the old Arbeitsbuch and account work intact.
   The isolated code branch is now merged and deployed, with the anonymous
   canonical checks passed. The existing-admin browser save/reload check has now passed, as recorded above.
4. If release verification fails, set `INTENSIVTRAINER_ENABLED=false` and retain
   private source/state for recovery. Do not remove old-book constraints/policies
   or delete account work as a rollback. No broader learner publication is approved.

## Maintained local commands and evidence

```sh
node scripts/audit-intensivtrainer.mjs
node scripts/verify-intensivtrainer.mjs http://localhost:3002
node --experimental-strip-types --test tests/intensivtrainer.test.mjs tests/intensivtrainer-database.test.mjs tests/aspekte-workbook.test.mjs tests/workbook-study.test.mjs tests/workbook-database.test.mjs
npx tsc --noEmit --incremental false
npm run build -- --webpack
node scripts/verify-intensivtrainer-build.mjs
node --env-file=.env.local scripts/verify-intensivtrainer-cloud.mjs
```

The original `prepare-intensivtrainer.py`/local Vision tool produce base source/OCR
metadata. They do not reproduce the subsequent native authoring and manual review;
do not overwrite `native/` with prototype output. Private native authoring helpers
and source adjustments remain alongside the private derived content.

Evidence is private: `native-audit.json`, `http-verification.json`,
`native-build-verification.json`, `production-anonymous-verification.json`,
`migration082-verification.json`, `canonical-production-verification.json`,
`private-upload-dry-run.json`, `private-upload-verification.json`,
`source-cloud-verification.json`, `native-book-preview.jpg`, `native-phone-preview.jpg`.
Historical `book-preview.jpg` is the superseded crop prototype.

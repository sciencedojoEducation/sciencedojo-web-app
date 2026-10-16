# Personal Aspekte neu B2 workbook

Private workbook, separate from ScienceDojo business work.

Current account/mobile upgrade: deployed privately at `https://www.sciencedojo.co.uk/workbooks/aspekte-neu-b2`. Migration 069, private source upload, preview browser checks, and production HTTPS access/saving/media checks are complete. Production activation followed explicit owner approval. Physical phone/tablet and microphone acceptance remain pending; the full goal is not yet marked complete. The original delivery below is historical; see the latest dated entry at the end.

## Original delivered implementation (before account upgrade)

Local URL: `http://localhost:3000/workbooks/aspekte-neu-b2`.
Source: `/Users/piumalmahawasala/Downloads/Aspekte Neu B2 Arbeitsbuch.pdf`.

- All ten chapters, printed pages 6–145 (140 pages), have interactive book content.
  There are 403 exercise groups, including vocabulary notes and self-assessment.
- The main view recreates the book with passages, tables, inline blanks, matching,
  selections and writing fields. Original photos, cartoons, comics, maps and diagrams
  are extracted from the supplied PDF. Detailed reading/ad cards retain their original
  typography as cropped source graphics; illustrations have an in-book enlarge view.
- All 185 PDF pages remain available in the optional original reference, including
  answer key and listening transcripts. It is not a separate reading pane.
- All 51 imported CD tracks are browser-compatible WAVs, with source originals kept.
  Listening tasks have their corresponding tracks and speed controls; the full audio
  library includes the introductory track as well.
- Page, chapter and whole-book checks use 1,334 fixed-answer items. The 565 open-review
  fields show published examples where available and offer Gemini review; personal
  responses and vocabulary notes do not inflate fixed scores. Whole sentences with
  exact-key checks also offer Gemini review when an alternative differs from the key.
- Set answers require every member, independent of order; token assignment appends to
  multiword sets. Separate verb positions share one checked answer. Punctuation-only
  answers preserve the difference between a full stop and question mark.
- Existing server-side Gemini key/provider reused for requested learner feedback.
  Supports writing and audio, with English/Sinhala explanations. No bulk source
  transcription was sent to Google.
- Answers, notes and position save in localStorage. Audio recordings save in IndexedDB.
  Text/notes backups support JSON download/import and an editable text export/restore
  fallback. Audio recordings are explicitly excluded from those backups.
- Book files, content JSON and audio remain in gitignored `private-materials/`.
  Routes are development-only, loopback-only and enforce same-origin POST requests.
  Nothing was published or deployed.

## Verification

Agent checks on 16 October 2026:

- `scripts/audit-aspekte-workbook.mjs --require-complete`: PASS. All 140 pages native,
  no missing page or structural issue; 185 source JPEGs and 51 source/derived tracks.
- Unit/provider tests: 15 PASS, including spelling preservation, multi-answer sets,
  segmented answers, punctuation distinctions, key hiding, audio ranges and origins.
- Final TypeScript and ESLint passed after the backup, image zoom and whole-book
  checking changes; all 15 unit/provider tests passed again.
- Live local HTTP: all ten chapters return 140 ready/native pages; no field answer keys
  leak before checking. Whole-book submission of all 1,334 canonical answers scores
  1,334/1,334. Cross-origin POST returns 403. Opposite punctuation correctly fails.
  Evidence: `private-materials/aspekte-neu-b2/derived/http-verification.json`.
- Previously checked all 51 WAV range responses; original track 2 plays at 0.75×.
- Browser: native source artwork/passages, multiword tap assignment and checking,
  answer persistence across reload, segmented verb answers on mobile, whole-book
  summary, and original-image enlarge dialog passed.
- Browser: backup text round-trip restored the test answer; invalid backup preserved
  current answers. Blob download did not produce an automation download event in the
  in-app browser; text export/restore provides a verified fallback. Native file
  download receipt is not claimed.
- Live Gemini feedback appeared in the workbook for a fictional German response;
  no invented corrections appeared. Test entries were cleared afterward.
- Phone breakpoint 390×844: passages and inline controls readable, no document-level
  horizontal overflow, original images loaded; chapter drawer and checking worked.
  Temporary viewport override reset after the check.
- Original-asset crops inspected and refined, including complete adverts A–L,
  maps, comics, photos and text-bearing graphics. This is agent QA, not independent
  proofreading or an independent learner usability study.

## Practical limits

Some exercises explicitly require the separate Lehrbuch, which was not supplied.
Those dependencies are flagged rather than filled with invented source material.
The original is available for checking any transcription discrepancy. Source text
and keys have been authored/reviewed by the agent; a structural audit alone is not
proof of perfect semantic transcription. Live human microphone capture has not been
verified; the browser requires the user's microphone permission. Recording API
handling/provider audio payloads are covered by the existing provider tests.

## Source transcription permission history

Automatic approval review rejected the initial bulk Gemini transcription call because
permission covered learner feedback, not exporting scanned pages, OCR and answer-key
content to Google. An explicit question was sent; no approval arrived. All remaining
source authoring was therefore completed locally. Bulk export is no longer needed.
Do not run `scripts/extract-aspekte-workbook.mjs` without explicit approval for that
specific transmission. Learner-triggered feedback remains within the authorized scope.

## Local authoring and maintenance

Private material root: `private-materials/aspekte-neu-b2/`.
Derived data: `derived/manifest.json`, `content/006.json` through `145.json`, `figures/`,
`pages/`, `audio/`, `text/` and `source-text.json`.

Private local authoring helpers (`derived/local-chapter-*.py`) write field-only data.
Never rerun them over native pages without preserving enrichment. Native scripts
(`derived/native-chapter-*.py`) add source passages and assets. Some final fixes are
manual: chapter 2 page 20 segmented verb, chapter 2 page 28 full-height reading cards,
chapter 3 page 35 word grid and refined crops. Run `native-post-review.py` after any
chapter 4/10 native regeneration to retain final readability/word-building hint fixes.
The shared `native-common.py` vocabulary helper provides writable meaning fields.
Keep the ignored authoring directory; it contains the personal book itself.

Preparation is resumable:

```sh
python3 scripts/prepare-aspekte-workbook.py --pdf '/Users/piumalmahawasala/Downloads/Aspekte Neu B2 Arbeitsbuch.pdf'
node scripts/audit-aspekte-workbook.mjs --require-complete
```

Owned development server exec session: 36359, bound to 127.0.0.1:3000. It uses the installed Next.js documented `--webpack` development mode after the
Turbopack session again served stale SSR HTML. Fresh HTTP confirmed the current
whole-book check and backup dialog in SSR; a fresh browser reload logged no errors.
The server
is intentionally left running for the owner. Existing business-backlog edits belong
to other work and were not modified by this workbook task.

Verified screenshot: `private-materials/aspekte-neu-b2/derived/native-book-preview.jpg`.


## Account/mobile upgrade — 16 October 2026

The active goal is implementation of the approved symbols/accounts/mobile/revision plan.
It is **not complete** until the remaining deployment and device verification gates pass.
The owner has now applied migration 069 and the prepared private workbook package has been uploaded. A local workbook release commit is ready; learner rollout and production deployment remain pending. See the latest cloud verification entry below; earlier blocked-audit entries are historical.

Implemented locally:

- All 140 pages carry reviewed source symbol metadata. Original margin glyphs were detected against page images, checked on contact sheets, and matched to the printed CD index on PDF page 184. Totals: 241 solution keys, 21 GI/TELC exam markers, 50 exercise-linked track buttons for tracks 2–51 (track 1 is the introduction).
- One shared CD player supports marker tapping, pause/resume, switching, restart, rewind, speed, native seeking, errors and saved position. The audio library uses that player too. Markers appear with their exercises in book/quick/revision views. Solution references record assistance, including server-side reference/legacy checking routes. Supplementary exam worksheet panels identify material not supplied.
- All 51 AAC/M4A streaming copies decoded successfully: 40,874,062 bytes versus 742,845,840 WAV bytes. Originals are retained. `scripts/prepare-aspekte-streaming.py` uses FFmpeg; the temporary helper was installed under `/private/tmp/aspekte-media-tools` after the system converter lacked an AAC codec.
- Existing email/Google authentication reused, verified active membership required outside the loopback preview. Production defaults disabled (`WORKBOOK_ENABLED`), private sources use Supabase, and signed media links last five minutes. New account entry selects the general learner role; invitation-return URLs do not mount marketing tags.
- Migration `sql/069_private_workbooks.sql`: private memberships, email-bound single-use seven-day invitations, learner state/recordings, service-only compare-and-swap saves, persistent per-user Gemini quotas, private source/recording buckets. Administrators can manage access but have no direct learner-progress reading policy.
- Administrator UI `/dashboard/admin/workbooks` grants/revokes verified accounts and creates/revokes invitation links for manual sharing. No emails are sent by this feature.
- Account-scoped autosave and pending browser backups; independent device edits merge, conflicting answers/notes require a choice. Changed chapter/exercise run identities preserve the server's fresh run and keep local backups. Account-switch requests cannot store the previous learner's data.
- Resume page/exercise/view/audio, explicit import of old browser answers/notes, five-exercise chapter/listening/revision sessions, private chapter first/latest/best/best-unassisted results, immutable answer history, fresh chapter/exercise retries, due revision, manual uncertainty/skipping, self-review of open tasks without numeric grades.
- Fixed scores exclude four exercises requiring the absent Lehrbuch: page 15/1, 50/1a, 85/2, 91/3a. The 1,334 source fixed fields remain authored; **1,310** are currently eligible for numeric scoring. Open/source-dependent review count is 589. Missing material never becomes an automatic weakness signal.
- Review intervals: 1/3/7/14 days, then completion; a failed due review returns after one day. Repeating an early review does not advance its schedule. Completed chapter attempts below 80% need practice; unfinished chapters show coverage.
- Audio recordings remain account/run/exercise-scoped on device, with optional per-recording cloud saving, playback/deletion for current and historical attempts, optional legacy-device recording import, and account-deletion cleanup. Capture stops on leaving an exercise and saves the completed blob locally. Real microphone behavior remains unverified.
- Requested Gemini feedback is saved with its source answer/run for later revision; it does not alter numeric scores. Feedback can still be shown if history saving fails, with a visible message.
- Workbook-scoped manifest, icons and home-screen instructions. Online chapters only, no offline downloads, notification scheduler, or service-worker private content cache.

Verification completed so far:

- Source/asset audit passed on all 140 pages, including marker/page-track correspondence.
- Focused model/provider/database/public-render suite: 29 tests passed before the latest final verification rerun. Database tests execute the actual migration and RLS in disposable PostgreSQL (PGlite).
- Local integration passed all 140 sanitized content pages, 51 audio range responses, three original symbols, CAS conflicts, server grading, idempotent submissions, preserved history/fresh retries, separate exercise runs, self-review scheduling, listening bookmarks, account-switch guards and cross-origin rejection. Its preview state was backed up/restored. Evidence: `private-materials/aspekte-neu-b2/derived/study-http-verification.json`.
- Every M4A decoded fully; evidence `derived/streaming-verification.json`.
- TypeScript and targeted ESLint passed during implementation. The final production build passed. The full application test suite passed **421/421** with no failures, and final targeted ESLint passed without warnings.

External/device gates still required:

1. **Supabase schema and source upload — resolved.** The owner applied migration 069. A live inspection confirmed all five workbook tables, required functions, and both private buckets. The private uploader dry-run and `--apply` succeeded for 496 files / 94,489,142 bytes. Cloud verification is continuing. HTTPS release and device testing remain required before learner rollout.
2. **Browser/device verification.** The existing IAB tab was on a connection-error `data:` page; attempting to bind it was rejected by browser URL policy. Inventory also reported the Mac locked. An async request asked the owner to unlock and reopen the workbook. Do not bypass that rejection with another browser automation surface. UI/touch/current screenshots and live microphone checks are not claimed. Continue when the owner provides a usable browser state.
3. **Deployment access and release verification.** There is no Vercel CLI login/project attachment in this checkout. Preserve unrelated business-backlog edits and unpublished business maintenance. No cloud/HTTPS rollout has been attempted.

Release instructions: `docs/aspekte-workbook-accounts.md`.
Private upload tool: `scripts/publish-aspekte-private.mjs` (dry-run default, refuses public buckets).
Current development server session: **13610**, loopback port 3000, webpack.
Old session 36359 no longer existed. Current final build log: `/private/tmp/aspekte-final-build.log`.
Do not mark this active goal complete using local code/tests as proof of the pending cloud/device gates.


### Final local verification / remaining gates

- Final application build: passed (`next build --webpack`).
- Full application tests: **421 passed, 0 failed**. Targeted ESLint and TypeScript passed.
- Standalone production gates checked with the feature enabled and disabled. Enabled: every tested content/media/checking/study/admin/feedback API rejects anonymous requests with 401; the book page streams a login redirect and no private content. Disabled: all tested private APIs return 404. The generic install manifest remains accessible. Temporary production servers were stopped.
- Evidence: `derived/production-gates-enabled-verification.json`, `derived/production-gates-disabled-verification.json`.
- Live Gemini request with a fictional German letter returned HTTP 200; the exact feedback was found in private history. Preview state was restored afterward. Evidence: `derived/feedback-history-verification.json`.
- Quick/revision source fidelity includes 38 explicit earlier-exercise references and seven repeat-listening references. Context remains read-only learner/source material, with linked passages and source illustrations. Multi-track markers include their A/B/dialog/person labels from the CD index. Runtime manifests include verified chapter counts to avoid 140 storage downloads just to open the book.
- Final local integration evidence includes all 140 sanitized pages, all 51 AAC range streams, fresh exercise/run identities, self-review, idempotency, conflicts and account-switch protection. Temporary preview work was removed/restored; the old browser-only backup was not touched.
- Owner questions remain pending: unlock/reopen the workbook for browser/device verification, and provide the existing Supabase SQL Editor session or apply migration 069. No schema/admin deployment credentials are available in this environment. The active goal remains unfinished pending those external gates.

Current summary: `private-materials/aspekte-neu-b2/derived/upgrade-verification.json`.


### Save conflict and playback follow-up

- Added regression coverage for audio-position changes arriving during fresh-attempt requests. Server resets keep old saved answers cleared, preserve independent edits, and require an explicit choice for responses typed while a run resets.
- Conflict choices show complete response text. A separate account-scoped recovery copy survives successful autosave; learners can inspect/export, restore or delete it. Reloading during a conflict preserves its original baseline and unsent device responses, including when listening bookmarks continue changing.
- A learner can explicitly carry selected unsent responses into a new run. Unchanged responses from the prior run stay cleared. Answer and note editing waits until conflicting versions are resolved.
- Switching speakers clears the old pending seek position, normal pause/resume retains buffered playback, and retrying a failed recording reloads its source while retaining its bookmark. Late rejections from earlier play requests do not overwrite the active player state.
- Full application suite: **421 passed, 0 failed**; targeted ESLint passed. The final production build rerun passed, including TypeScript checks. Local integration also verified simultaneous same-revision device saves: one succeeds, the other gets a conflict, and independent edits merge without loss.
- A fresh read-only live Supabase inspection still found no workbook schema interfaces or private workbook buckets. No cloud data was changed. The previously requested SQL Editor access, unlocked usable browser, and deployment access remain outstanding; no learner rollout is claimed.


### External-access blocked audit

The same access gates were confirmed across three consecutive goal turns. The latest read-only Supabase probe returned no workbook schema interfaces and no workbook buckets. Deployment environment variables and CLI/project credential files are absent. Fresh computer inventory reports the Mac locked, no accessible native apps, and the existing IAB tab still on its connection-error data page. No alternative browser surface was used to bypass the earlier URL-policy rejection.

Local code, source auditing, integration checks, 421 tests, TypeScript, lint and the production build are complete. The overall goal is **blocked, not complete** pending owner access: apply migration 069 or provide the existing SQL Editor session; unlock the Mac and reopen the localhost workbook; provide the existing deployment workflow. Then continue private upload, HTTPS deployment, real-account isolation/invitation tests, cross-device resume and real phone/tablet/microphone checks. No learner rollout has occurred.


### Migration applied and private package uploaded

The owner reported applying migration 069. Live schema inspection confirmed workbook memberships, invitations, learning states, recordings and feedback requests, plus the required functions. Both storage buckets are private. The uploader validated and uploaded **496 runtime files / 94,489,142 bytes** into `private-workbooks/aspekte-neu-b2/`. Originals, authoring files and learner preview data were not uploaded.

A temporary standalone production server on loopback port 3002 uses private Supabase source storage and account enforcement for live API verification. The cloud verifier checks every uploaded object's SHA-256, anonymous/raw source withholding, disposable account isolation, invitations, optimistic saves, quotas and synthetic recording deletion. Real browser/device capture and private HTTPS deployment remain pending. The overall goal resumed after the owner resolved the migration blocker.


### Live cloud verification completed

- All **496 files / 94,489,142 bytes** downloaded through the private service connection matched local SHA-256 values. Anonymous storage access, public URLs and learner-created signatures cannot expose the source. Evidence: `derived/cloud-assets-verification.json`.
- Two disposable verified accounts exercised live RLS, email-bound/single-use/expired/revoked invitations, service-only writes, stale-revision rejection, per-user quotas, and membership revocation. No real learner records were used.
- The standalone production API read chapter content from private Supabase storage and withheld source answers. Saved answers resumed through an independent authentication session; another learner could not read them or save under the first account. Practice grading, duplicate submission handling, fresh attempts and correction hiding passed.
- Authorized audio returned a private signed stream with byte-range support. A synthetic recording could be stored, retrieved through another session, isolated from the other learner, and deleted from both database and storage. This does not verify real microphone capture or browser playback.
- All disposable accounts, invitations and recording objects were removed. The first API run used a noncanonical loopback origin and was rejected by the origin check; its disposable data was removed too. Using the temporary server's canonical `http://localhost:3002` origin passed. No application origin protection was relaxed.
- Evidence: `derived/cloud-api-verification.json` and combined `derived/cloud-verification.json`. The temporary standalone production server was stopped; the existing development preview remains separate. The verifier script passed targeted ESLint. No production build rerun was needed: only verification scripts and documentation changed.
- **Remaining:** existing deployment workflow/access, private HTTPS release, real-account browser flow, phone/tablet/touch and microphone verification. The current computer inventory still reports the Mac locked and the IAB tab on a connection-error data page. An async question asks which deployment workflow to use. No production feature flag was enabled and no learner invitation was distributed.


### Review branch preparation

The connected GitHub repository's current `main` matches local HEAD `f9e46167e5e065dc4f72b88b77485b39bcfdb94d`. Its Vercel commit status is successful and points to deployment `6YFjQuANXQ9g2UwkxqfCdQ7BsbRt`, confirming the existing GitHub-to-Vercel workflow. No new production deployment is claimed. Repository metadata reports push permission, but the connector later rejected blob creation with HTTP 403, `Resource not accessible by integration`; it cannot publish this snapshot. The initial restricted-network CLI probe reported invalid authentication; an explicit network-enabled recheck confirmed the existing CLI login is valid.

A scoped review snapshot includes the 53 workbook source, route, test, script, icon and documentation files. It excludes the unrelated business backlog edit, all private source/media/learner files, and environment files; configured secret values were checked absent. The workbook remains disabled by default in production. The valid network-enabled GitHub CLI can publish the review branch; browser and Vercel environment verification remain pending. No remote branch or pull request was created by the rejected blob calls.


### Local release snapshot

Preparing the 53 reviewed workbook files on a local `codex/private-b2-workbook` branch. This retains the current tested source and excludes the unrelated business backlog edit. Private book/source/media/learner state and environment files are ignored and absent from the snapshot. The connector rejects writes, but the existing GitHub CLI login works when network access is allowed. Vercel project: `sciencedojo-s-projects/sciencedojo-web-app`, deployed from the connected repository. Production enabling still requires `WORKBOOK_STORAGE=supabase` and `WORKBOOK_ENABLED=true`, followed by private HTTPS and device checks. Do not merge or enable access on the strength of local or synthetic API checks alone.


### Network-authentication correction

An explicit network-enabled `gh auth status` confirmed the existing user login is valid with repository scope. The earlier default-sandbox probe misleadingly reported invalid authentication when networking was restricted. The connector's separate HTTP 403 still applies to that integration, but valid user GitHub CLI authentication provides the normal authorized publication workflow. A network-enabled remote check confirmed `main` still at `f9e46167e5e065dc4f72b88b77485b39bcfdb94d` and no existing workbook branch. Fresh computer inventory now reports the Mac unlocked; the original browser tab remains a stale connection-error page.


### Published review and browser verification

Draft PR #12: https://github.com/sciencedojoEducation/sciencedojo-web-app/pull/12 . The valid network-enabled GitHub CLI published the review branch. GitHub build/regression and cron-security checks passed for `222d8d3`. The Mac is now unlocked. The documented recovery workflow opened a fresh HTTP tab in the same selected IAB provider; workbook interaction works. The Vercel project is also available through its existing signed-in browser session.

Browser checks found and repaired chapter-action overflow on narrow phones. Actions now wrap below the heading. Loaded-page document widths were 371px at 375px, 316px at 320px, and 830px at 834px, with 16px answer inputs. Tap-to-fill and keyboard Tab progression passed; the trial response was cleared. Track 3 starts its exact recording, switching to track 4 replaces it in the single audio element, and pointer/keyboard pause/resume plus 1.25x speed work. The page-16 key opens printed appendix page 147 / PDF page 148, matching source metadata. Original image enlargement closes with Escape. The page-8 TELC marker identifies the unavailable worksheet. These are desktop-browser responsive checks, not claims of a physical phone or microphone test.

The first Vercel preview failed its 250MB function limit (272.13MB reported). Production tracing now explicitly excludes the local private directory and public CDN assets from workbook API bundles. The media route's local trace is 1,924,902 bytes with no private source or public static files. All eight workbook API traces passed the actual-artifact guard in `scripts/verify-aspekte-build.mjs`; CI now runs it after building. The local production build and targeted lint passed after these changes. Private local development remains available; production fetches from Supabase.

The Vercel dashboard confirmed both `WORKBOOK_ENABLED=true` and `WORKBOOK_STORAGE=supabase` saved for **Preview / codex/private-b2-workbook only**; Production was explicitly deselected. No production enabling or invited rollout has occurred. The owner supplied the intended learner account email privately; membership will be enabled only after the private deployment is ready.


### Quick-session source context — 17 October 2026

The first quick speaking prompt (6/1b) exposed an implicit dependency on the adjective list in 6/1a. The source authoring helper now includes preceding lettered subparts within the same numbered exercise, retaining chapter boundaries and printed order, as well as explicit references. Runtime data contains **176 source references** and seven repeated-listening references. Quick context now shows candidate options and original source markers, plus an explicit notice when a source refers to the absent Lehrbuch. Prior answers remain read-only. Native browser verification confirmed the full adjective list appears above 6/1b.

The private uploader's `--content-only` mode validated and uploaded 141 JSON files / 1,661,381 bytes, preserving all audio and image objects. The 140-page source audit passed, 23 focused tests passed, targeted lint passed, and the updated production build and trace guard passed. The expanded trace guard also checks all 157 server traces and the standalone package: no local private material was included.

The first successful HTTPS preview (`5o7RB7UiqT8miexLR8GpesUvyzh5`, source `8d6321f`) passed actual disposable-account sign-in and return to the workbook, private chapter loading, autosave/checking (1/12 correct with ten unanswered), fresh exercise clearing with preserved practice/archive history, and a five-exercise quick session. A fictional open response returned Gemini feedback in the browser. An unauthenticated shell probe encounters Vercel's preview protection (302), so it is not counted as proving application-level anonymous gates on this host. Do not weaken preview protection to run that probe. Production application-level HTTPS gates remain to be checked on the normal site. The disposable account remains active only for the ongoing browser checks and must be removed afterward.

The original local preview state was restored after both browser scenarios; its state file was originally absent and was removed again only after verifying no answers, notes, attempts, reviews or feedback had been introduced. The legacy browser-only backup was not imported or altered.


### Private HTTPS acceptance and disabled production release — 17 October 2026

PR #12 source head `1c0389f971bf3c27d80829d9a351d45318456df1` passed build/regression checks, cron security, and Vercel Preview. It was merged as `880a6ad2cf322ed0d594e9828825fd15a4d514b6`. Production workbook flags remain unset. Deployment `HEZvQg5LPnqhTy6UwGThrD8cBHUZ` is ready. All merged-commit CI checks passed. Fifteen live HTTPS checks on `https://www.sciencedojo.co.uk` passed with the feature disabled: content/media/check/save/admin/invitation routes returned 404, the page exposed no source content, and the install manifest was valid. Evidence: `derived/production-gates-disabled-verification.json`. The first probe used the separate apex `sciencedojo.uk`, which serves a parked lander; its manifest check failed and it is not counted as application evidence. The Vercel assigned-domain list confirmed the canonical `www.sciencedojo.co.uk` target. The overall release still awaits explicit activation approval and physical-device acceptance.

The latest private HTTPS preview passed an independent learner sign-in that restored the saved response, quick-session position and Gemini feedback. Earlier-subpart choices appeared as read-only context. The uncertainty action added an exercise to revision, and the performance view preserved practice history without inventing a chapter result. Page-16 speaker markers streamed exact tracks 3 (40.052993 seconds) and 4 (44.76 seconds); one audio element switched tracks and paused without media errors. The symbol legend and online-only home-screen instructions opened. All disposable browser account data and credentials were removed afterward. Evidence: `derived/browser-https-verification.json`.

The owner-supplied verified, active sciencedojo account now has only the requested workbook membership. Its existing role was preserved; no email or general learner invitation was sent. Email and account identifiers remain in ignored private evidence.

Automatic approval review rejected saving Production `WORKBOOK_ENABLED=true` and `WORKBOOK_STORAGE=supabase`, stating that the rollout plan did not authorize this exact activation before live-production and device checks. The unsaved form was discarded; no Production values were saved and the action has not been retried. Obtain explicit owner approval for this exact activation. Publishing the reviewed code with the feature disabled does not enable workbook access. Real phone/tablet use and microphone capture remain unverified; the overall goal remains active and unfinished.


### Approved production activation — 17 October 2026

The owner explicitly instructed “activate it”. Production-only `WORKBOOK_ENABLED=true` and `WORKBOOK_STORAGE=supabase` were saved through the existing signed-in Vercel settings; Preview and Development selections were not changed. Redeployment `EBHTqcyNtsRi2K7Kjn9USE4SozTm` uses the checked main commit `880a6ad2cf322ed0d594e9828825fd15a4d514b6`. This supersedes the earlier activation-approval gate; no further approval for this same activation is needed. Enabled HTTPS checks are in progress. The previously completed disabled checks remain historical evidence. Real phone/tablet and microphone checks are still pending.


### Enabled production HTTPS verification — 17 October 2026

Activation deployment `EBHTqcyNtsRi2K7Kjn9USE4SozTm` reached Ready on the checked main commit, with Production-only workbook flags enabled. The canonical live workbook is `https://www.sciencedojo.co.uk/workbooks/aspekte-neu-b2`.

- All 15 anonymous HTTPS checks passed: content, media, study, checking, feedback, invitation and administrator APIs return 401; the workbook page redirects to login without source content; the workbook installation manifest is valid.
- A disposable verified account without membership was denied. After granting only that test membership, all ten chapters returned 140 interactive pages without raw answer keys or model answers.
- Answers, notes and page/exercise/audio position resumed in an independent authentication session. Stale saves and account mismatches were rejected. Server grading returned 1/12 with 11 unanswered; duplicate submissions did not create another attempt. A fresh exercise cleared answers/corrections and preserved its history.
- CD audio, original symbol artwork and appendix pages returned private signed streams with byte-range support. Learner administrator access and cross-origin saves were denied. Revoking test membership blocked content and new media requests across both sessions.
- The disposable identity, learner rows and local credentials were removed. The requested owner account was rechecked as verified, unsuspended and a current workbook member; its role was not changed. The existing live-site desktop login was preserved rather than replaced for testing.

Evidence: `derived/production-gates-enabled-verification.json`, `derived/production-live-api-verification.json`, and private owner-access verification. These are production HTTP/API checks; prior real browser interaction was verified in the private HTTPS preview of the same source build. They do not prove physical-phone/tablet touch/audio behavior or real microphone capture. The owner has been given the live link and asked to test answer persistence, numbered playback and recording on the phone. Those acceptance results remain pending. No general learner invitations have been distributed.

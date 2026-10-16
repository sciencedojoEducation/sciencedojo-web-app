# Private workbook accounts and mobile study

The existing workbook remains a private local preview by default in development.
Production defaults to disabled and never uses the loopback preview bypass.

## Release sequence

1. Apply `sql/069_private_workbooks.sql` through the existing Supabase SQL/migration workflow. It creates private learner data, service-only write RPCs, email-bound invitation redemption, persistent feedback quotas, and private media buckets. Keep production `WORKBOOK_ENABLED` unset/false.
2. Validate the migration with `node --experimental-strip-types --test tests/workbook-database.test.mjs`. These tests execute the real migration and RLS policies in disposable PostgreSQL, not the production database.
3. Prepare streaming copies with `python3 scripts/prepare-aspekte-streaming.py` (FFmpeg required). The private authoring/audit directory records reviewed printed symbol positions; runtime source JSON and symbol images must be preserved with the private source directory.
4. Run `node --env-file=.env.local scripts/publish-aspekte-private.mjs` to inspect the package and private bucket settings; add `--apply` to upload the prepared runtime JSON, images, symbols, and M4A audio. No source material goes in public/ or Git.
5. Deploy the application with the existing Supabase and Gemini server credentials. Set `WORKBOOK_STORAGE=supabase`; `WORKBOOK_ENABLED=true` enables authenticated workbook routes. For testing account access on localhost, also set `WORKBOOK_ACCOUNT_MODE=true`.
6. Open `/dashboard/admin/workbooks` with an existing verified administrator. Grant an existing verified learner by email or create a seven-day invitation link for manual sharing. No invitation emails are sent automatically.
7. Verify HTTPS login, invite redemption, two learner accounts, cross-device resume, recordings, real phone/tablet audio and touch interactions before sharing learner invitations.

The runtime fetches private content server-side. Media uses five-minute signed URLs after membership checks. Revocation blocks new API/media requests; already-issued signed media links can remain usable until they expire.

## Local verification

- `node scripts/audit-aspekte-workbook.mjs --require-complete`
- `node --experimental-strip-types --test tests/aspekte-workbook.test.mjs tests/workbook-study.test.mjs tests/workbook-database.test.mjs tests/workbook-audio-player.test.mjs`
- `node --experimental-strip-types scripts/verify-aspekte-study.mjs` against the loopback development server. This script backs up and restores the private preview state; never use it against a real learner account.
- `node scripts/verify-aspekte-production.mjs` against a temporary standalone production server on port 3002; set `EXPECT_WORKBOOK_ENABLED=false` for the disabled-flag check. It sends no login credentials and creates no learner data.
- `node --env-file=.env.local scripts/verify-aspekte-cloud.mjs` compares every private cloud file to its local SHA-256 and verifies anonymous source protection. Add `--test-accounts` for live database/RLS checks using two disposable identities, with cleanup. Set `WORKBOOK_VERIFY_ORIGIN=http://localhost:3002` to also exercise authenticated APIs on a temporary standalone production server configured with `WORKBOOK_ENABLED=true` and `WORKBOOK_STORAGE=supabase`. This tests backend behavior; actual browser/device and microphone checks remain separate. Never use real learner credentials for the verifier.
- TypeScript plus targeted ESLint on the workbook files, proxy, and account lifecycle changes.

Study saving uses optimistic revisions. Independent device answer/note changes merge; same-field conflicts require a learner choice. Earlier attempts remain in the private account payload. A fresh chapter archives drafts, starts empty and resets assistance. Chapter checking exposes solutions, so subsequent checks in that run are assisted.

Original browser-only answers remain under `aspekte-neu-b2-study-v1` until explicitly imported. Current unsent work is keyed by account ID. Resolving a conflict first stores a separate `workbook-recovery:<account>:<id>` copy of the device draft; clearing the pending autosave buffer does not delete that copy. Learners can inspect/export, explicitly restore, or delete their recovery copies. During a conflict, answer/note editing waits for the learner's choice; listening position can still update without replacing the preserved device answers. Recordings are keyed by account, run and exercise in IndexedDB, with per-recording optional private cloud saving. Text backups exclude recordings and attempt history.

Online-only means no chapter/audio downloads or offline service-worker cache. Unsent answers are retained locally through connection gaps. Gemini feedback is optional, uses the existing server key, and never changes fixed-answer scores.


## Current release evidence

Migration 069 is present in the existing live project. The complete private runtime package (496 files, 94,489,142 bytes) has been uploaded and checksum-verified. Live RLS, disposable invitation/account tests, cloud saving across independent sessions, server grading, fresh attempts, private audio range streaming and synthetic recording deletion passed. The disposable data was removed and the temporary production server stopped. Evidence is under the ignored private material root in `derived/cloud-verification.json`.

Production HTTPS deployment and real browser/device/microphone verification remain pending. No invited learner rollout has occurred. The standalone verification server expects canonical origin `http://localhost:3002`; using the numeric loopback host can fail its strict origin check. Use `--api-only --test-accounts` only when intentionally rerunning the API portion; it writes separate API evidence and does not claim to recheck object hashes.

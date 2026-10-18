# Private workbook accounts and mobile study

The existing workbook remains a private local preview by default in development.
Production defaults to disabled and never uses the loopback preview bypass.

## Current access policy — 18 October 2026

The owner requested direct access for anyone signing in for the workbook, replacing the original invite-only default. On first workbook access, the server verifies the signed-in user, confirmed email and active profile, then inserts only their own workbook membership. Existing registered classmates with no membership gain access on their next visit. No migration or bulk account update is required.

Insertion uses conflict-ignore semantics and rechecks membership: existing and concurrent administrator revocations remain effective. Anonymous, unverified, suspended and revoked accounts remain blocked; administrators alone manage access. Per-user saving, recording isolation, server grading, private storage and persistent Gemini limits remain in place. Account creation by itself does not enroll a user until they open the workbook.

Share `/workbooks/aspekte-neu-b2` or `/signup?role=user&next=%2Fworkbooks%2Faspekte-neu-b2`. Existing invitation pages also offer direct workbook entry; accepting a personal invitation remains optional. The original release sequence below records the earlier invitation-based setup.

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
- `node scripts/verify-aspekte-build.mjs` after a production build checks the actual workbook function traces for private source/learner files and public CDN assets. CI runs this guard after its build. Production workbook functions fetch source content from Supabase; local development still uses the private source directory.

Study saving uses optimistic revisions. Independent device answer/note changes merge; same-field conflicts require a learner choice. Earlier attempts remain in the private account payload. A fresh chapter archives drafts, starts empty and resets assistance. Chapter checking exposes solutions, so subsequent checks in that run are assisted.

Original browser-only answers remain under `aspekte-neu-b2-study-v1` until explicitly imported. Current unsent work is keyed by account ID. Resolving a conflict first stores a separate `workbook-recovery:<account>:<id>` copy of the device draft; clearing the pending autosave buffer does not delete that copy. Learners can inspect/export, explicitly restore, or delete their recovery copies. During a conflict, answer/note editing waits for the learner's choice; listening position can still update without replacing the preserved device answers. Recordings are keyed by account, run and exercise in IndexedDB, with per-recording optional private cloud saving. Text backups exclude recordings and attempt history.

Online-only means no chapter/audio downloads or offline service-worker cache. Unsent answers are retained locally through connection gaps. Gemini feedback is optional, uses the existing server key, and never changes fixed-answer scores.


## Current release evidence

Migration 069 is present in the existing live project. The complete private runtime package (496 files, 94,489,142 bytes) has been uploaded and checksum-verified. Live RLS, disposable invitation/account tests, cloud saving across independent sessions, server grading, fresh attempts, private audio range streaming and synthetic recording deletion passed. The disposable data was removed and the temporary production server stopped. Evidence is under the ignored private material root in `derived/cloud-verification.json`.

Private HTTPS browser verification passed sign-in, checking, saving, fresh attempts, independent-session resume, saved Gemini feedback, revision, and exact-track audio playback. PR #12 is merged. After the owner explicitly instructed “activate it”, Production-only `WORKBOOK_ENABLED=true` and `WORKBOOK_STORAGE=supabase` were saved and deployment `EBHTqcyNtsRi2K7Kjn9USE4SozTm` reached Ready. The live workbook at `https://www.sciencedojo.co.uk/workbooks/aspekte-neu-b2` passed 15 anonymous HTTPS gates and authenticated production acceptance across all 140 pages, answer-key withholding, cross-session saving, scoring, fresh attempts, private audio/symbol/appendix streams and revocation. The production disposable identity and data were removed. The owner-supplied verified, active account has workbook membership with its role unchanged. Physical phone/tablet/microphone acceptance remains pending; the full goal is not yet complete. No general learner invitations have been distributed. The standalone verification server expects canonical origin `http://localhost:3002`; using the numeric loopback host can fail its strict origin check. Use `--api-only --test-accounts` only when intentionally rerunning the API portion; it writes separate API evidence and does not claim to recheck object hashes.


For reviewed context-only source updates, add `--content-only` to the private uploader's dry-run and `--apply` commands. It still validates the full local runtime package and both private buckets, but uploads only the manifest and 140 exercise JSON files. Preserve the existing media and its checksum evidence.


## Recording upload and playback follow-up

Cloud recording saves use a small authenticated preparation request, a signed upload directly into the existing private bucket, and a small authenticated finalization request. This avoids Vercel's 4.5 MB function request limit while retaining the workbook's 10 MB file limit. The server binds its ten-minute finalization ticket to the account, speaking exercise, active attempt, MIME type, exact byte count and prior recording version. It verifies private storage metadata and performs the existing compare-and-swap update. Duplicate successful finalization is idempotent; stale attempts and competing saves preserve the local recording. Existing multipart saves remain compatible with already-open clients. No additional migration or public bucket policy is required.

Requested Gemini audio feedback uses the same private upload transport with a separate feedback-only purpose. It does not create an account recording. The feedback route removes that temporary object on completion or failure, including rate-limit rejection; the client also requests cleanup. Interrupted unreferenced uploads older than one day are removed on the learner's next upload preparation. Account deletion enumerates the entire learner recording prefix, including unfinished uploads. Upload capabilities are storage-provider tokens valid for two hours; the app's finalization permission expires after ten minutes.

Saved recording and history URLs now point to authenticated workbook media routes. Each GET/HEAD/range request checks the active verified membership and the learner's recording row, then streams privately with `no-store`. Storage download signatures are kept server-side. Deletion blocks the old app media URL and membership revocation blocks existing playback URLs, independently of storage CDN invalidation. Previously issued storage URLs can remain in provider caches temporarily; the app no longer issues them for saved recordings.

Use `node --env-file=.env.local scripts/verify-aspekte-recording-upload.mjs --test-accounts --fixture=/absolute/path/to/generated-small.m4a --fixture=/absolute/path/to/generated-large.m4a` against the isolated loopback production server, or set `WORKBOOK_VERIFY_ORIGIN=https://www.sciencedojo.co.uk` after deployment. Fixtures must be generated test audio, including a valid file over 4.5 MB. The verifier creates only disposable identities, uses independent normal authentication sessions, never calls Gemini, and removes its test identities and objects in `finally`. It checks upload/metadata binding, full hashes, range playback, privacy, concurrent saves, idempotency, fresh attempts, history deletion, temporary-feedback cleanup and revocation. Physical microphone and phone playback remain separate acceptance steps.

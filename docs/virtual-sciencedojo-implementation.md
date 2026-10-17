# Virtual ScienceDojo implementation and runbook

Updated 17 October 2026. The owner requested completing the project after approving the Phase 0 direction. This record tracks software delivery toward the agreed 5–10-person, adult EU/EEA, presence-only pilot. It does not declare the broader roadmap or pilot launch complete.

## Current software

- Optional beta boundary, clarified by the owner on 17 October: existing public website and dashboards are retained. The flag-gated dashboard entry and campus header explicitly say beta. Library computers and laptops offer the signed-in learner's existing dashboard in a separate tab, with existing courses still available in the retained Study Hub frame. The shortcut uses trusted profile/internal membership for its destination; it grants no additional access. No classroom zone is claimed.
- `/campus`: closed/invitation state, explicit notice acceptance, lazy-loaded 3D library, capsule avatars, keyboard/touch direction controls, four exclusive desks, participant list and accessible HTML controls.
- Study Hub: native modal, existing authorized Academy routes in a same-origin frame, course-identity notice, retained iframe when closed, direct-course fallback. Learning content never enters room state.
- Admission: verified account and private reviewed membership, default-disabled feature flag, separate release setting, random one-use 60-second tickets stored as hashes, same-origin mutations and bounded request bodies.
- Multiplayer: separate Colyseus process, static authentication before reservation, join-time and periodic eligibility checks, one library with ten connections, authoritative movement and seat state, per-participant blocked views, disconnect cleanup and fresh admission to reconnect.
- Safety: durable reason-only reports and blocks, staff-only member/report/audit reads, reviewed invitations and revocation in `/dashboard/admin/campus`, immediate removal notification with periodic-check fallback.
- Privacy integration: campus and Academy routes and their login/signup return paths skip new marketing tag initialization and manual analytics events. The campus document boundary withholds its UI after a public-page SPA transition and opens a fresh document before rendering study content, clearing prior marketing globals. Automatic retries are bounded; a full-page fallback link remains available. A broader vendor/telemetry assessment remains part of G4/G5.
- Build isolation: existing Next.js layout retained; the service has its own lockfile. CI installs both dependency sets and matching Chromium, runs the synthetic beta browser acceptance before the build, and retains fixture screenshots/evidence for seven days. Root type checking excludes the service directory. Hosted quality and cron checks passed on software commit `41d02a7`; see the evidence below.

Migrations 067/070 were applied to showcase staging on 17 October after the owner's explicit approval, and disposable real-service QA completed. Both original staging beta flags are restored off and all owned fixtures removed. Neither migration has been applied to production. No paid service has been provisioned, production setting enabled or real learner invited.

## Evidence and limits

| Check | Evidence on 17 October |
| --- | --- |
| Protocol and SQL | Nine tests passed against actual simulation and PGlite policies: replay/invalid inputs, bounded movement, seat contention, block filtering, identity projection, capacity, one-use/expiry/service-only tickets, metadata spoofing, RLS, report limit, revocation, suspension, disabled flag, actual byte limits and bounded admission counters |
| Actual multiplayer | `tests/campus-server.test.mjs` passed with real Colyseus/WebSocket clients: foreign origin and invalid credentials denied, unauthorized room creation denied, two peers/seat contention, per-client filtering, periodic revocation and ten-client capacity. A subsequent regression case also passed for duplicate reservations: a failed duplicate cannot remove the avatar owned by the successful session |
| Browser fixture | `scripts/check-campus-browser.mjs` passed in two Chromium contexts: keyboard walk/sit, notice/Study Hub, Escape from inside the frame and focus return, synthetic course save, unsaved input retained across close/reopen, stand, forced WebSocket loss with retained course input and cleaned-up presence, block/unblock/report, leave/fresh admission and 390px layout without overflow or uncaught browser errors |
| Hosted build and checks | [Quality 39010543985](https://github.com/sciencedojoEducation/sciencedojo-web-app/actions/runs/39010543985) and [cron 39010543990](https://github.com/sciencedojoEducation/sciencedojo-web-app/actions/runs/39010543990) passed on `41d02a7`, including the production build, synthetic browser acceptance, type checking, lint and private workbook trace checks. These supersede the earlier local prerender-timeout limitation |
| Regression | Latest local and hosted `npm test` passed **452 tests**, zero failures/skips, including explicit campus staff isolation and privileged flag-action checks |
| Real staging database | Five synthetic accounts and one owned course: reviewed fixture admission/notice, default-off denial, unprovisioned-admin denial, course entitlement independence, two enrollments, ten-place cap/waitlist, private-note save/relogin/reload, one-use/service-only ticket redemption, block/report/staff resolution and cleanup passed. Eight null-identity synthetic enrollment rows filled only the disposable course's remaining seats |
| Real application/service | Loopback Next.js and the actual room entry point used real staging auth and RPCs. Two peers joined through real admission/service endpoints; foreign origin, replay and outsider admission were denied; block/unblock filtering and periodic revocation passed. Final clean-exit run inspected 60 WebSocket frames without account IDs/emails, course key/title, private-note canary or issued tickets; revocation took 1,926 ms (under the 15-second bound) |
| Real Academy browser | Actual staging login, shared presence, walk/sit and course identity notice passed. The existing lesson's Finish course action saved 100% completion inside the real Study Hub frame; a fresh authenticated session confirmed progress and peer isolation. Close/stand/reopen preserved unsent private notes. With campus disabled, the retained frame reopened and its existing Save notes action persisted work. Fresh campus admission preserved another unsent edit. The final disconnect cleared stale participants/seat claims and allowed offline reopening again |
| Peer observation | Two real staging-backed peer sessions inspected 2,697 frames during the browser study/recovery flow. Only coarse absent/walking/seated/studying transitions were recorded; none of the synthetic account identifiers/emails, course key/title, private-note canaries or observer admission ticket appeared |
| Staging cleanup | All five auth fixtures, temporary staff membership, owned course/version/listing/memberships, progress, notes, reports, audit, blocks and tickets removed and checked. Both original flags restored false. Read-only SQL confirmed six campus tables with RLS and normal immutable-version protection enabled. QA services stopped; disposable credentials erased |
| Clean service release | `npm run test:campus:release` passed on Node 22.22.2: explicit-file archive and standalone checksums, tampered/symlinked payload and manifest rejection, overwrite protection, clean service-only dependency installation, missing-credential startup denial, actual packaged-process callback/admission/seat ownership, SIGTERM/restart cleanup and consumed-ticket rejection/fresh admission. Captured logs contained no issued synthetic credential. This uses a synthetic loopback application callback, not a hosted deployment |
| Existing workbook protection | `node scripts/verify-aspekte-build.mjs` passed: no private source or static-public files in server traces |
| Built disabled app | Loopback production server: `/campus` displayed closed state; admission/safety/service returned 403 without release configuration; a foreign-origin admission was denied |
| Preservation | The pre-existing business backlog edit retained SHA-256 `0cf8997b87ddc6c511861116bc87c6c15fddb4bafe3bcc162135b3ec3c169c1b`; B3/S1/R1 and approved business scope/pricing were not changed |
| Dependency check | Separate service installation reported zero advisories. A shared root `ws` advisory was removed by updating within the existing range to 8.22.0. The root audit still reports 21 other advisories; their applicability and upgrades remain part of the broader production review, not a claim of security certification |

Browser fixture screenshots were visually inspected on desktop and 390px phone width. That maintained fixture uses synthetic admission/course responses. The separate local-app/staging check above exercised real Supabase auth, enrollment and embedded Academy saves; accounts were admin-created without email, so public signup/delivery was not tested. An initial cold development opening reloaded the campus page; the repeated flow completed after the routes were compiled. Cold entry on the intended deployment must still be tested. Hosted TLS/WSS/framing/CSP, infrastructure/marketing logs, named moderator operation, intended-device performance and independent usability remain unverified. Local network canaries do not replace hosted-network inspection. No 50-user or 60fps claim is made.

Reproduce software checks from the repository root using Node 22.18+:

```sh
npm ci
npm ci --prefix services/campus-server
npm run test:campus
npm run test:campus:release
npm test
npm run typecheck
npm run build
node scripts/verify-aspekte-build.mjs
```

Browser verification requires a Playwright Chromium installation (`npx playwright install chromium`) or `CAMPUS_CHROMIUM_PATH` set to an existing Chromium executable. Then run `npm run test:campus:browser`. The script binds only to loopback, uses ports 3012/2569, creates temporary synthetic evidence and cleans up its browser/servers. It never reads production secrets or exposes a production auth bypass. Transport tests use loopback port 2568; avoid running duplicate copies simultaneously.

For an interactive local review, run `npm run campus:preview` and open `http://127.0.0.1:3012` in two tabs. This uses the same UI and room service with explicitly labelled synthetic accounts/course; it does not require Chromium or a database. Press Ctrl+C to stop. Do not run it at the same time as the browser verification, which uses the same fixture ports.

## Configuration and deployment preparation

Read [the architecture](ARCHITECTURE.md), [Phase 0 gates G1–G9](virtual-sciencedojo-phase-0.md) and the additive [migration 070](../sql/070_virtual_campus.sql). Obtain dated operator/vendor/region and privacy evidence privately. Preserve current hosting and course data; do not reset the database or enable the campus merely because local checks pass.

| Setting | Where | Meaning |
| --- | --- | --- |
| Existing Supabase configuration | Next.js only | Continue existing session and privileged clients; never send the service-role key to the room process |
| `CAMPUS_PILOT_READY` | Next.js only | Leave unset/false until launch gates are evidenced; `true` is a manual release setting, not automatic legal certification |
| `CAMPUS_PUBLIC_URL` | Next.js | Exact external service origin, e.g. `wss://campus.example.test`; used for admission and build-time CSP, so rebuild after changing it |
| `CAMPUS_SERVICE_KEY` | Next.js and room service | Same independently generated secret of at least 32 characters; server-only, never `NEXT_PUBLIC_*` or logged |
| `CAMPUS_APP_ORIGIN` | Room service | Exact approved web origin, e.g. `https://www.sciencedojo.co.uk`, for origin checks and restricted admission/revalidation requests |
| `CAMPUS_INTERNAL_URL` | Next.js | Service HTTP(S) origin for immediate authenticated staff removal; HTTPS outside loopback. If unavailable, periodic revocation remains in force |
| `CAMPUS_BIND_HOST`, `PORT` | Room service | Default `127.0.0.1:2567`; place behind the approved TLS reverse proxy. Do not expose an unauthenticated admin/monitor console |
| `virtual_campus_enabled` | Existing database feature flags | Default false; both this flag and the release setting are required. Existing course flags remain independent |

Generate the service secret privately, not in chat or committed files. The room process runs with its dedicated service key and app origin; it needs no Supabase credentials. Use `npm run campus:server` to start it. The repository layout, including shared `lib/campus` modules, must be available to that process. Run one process/replica for this pilot; no auto-provisioning or multi-process presence is configured.

Prepare a provider-independent room release with `npm run campus:package -- /absolute/output/campus-service.tar.gz`. The packager copies ten explicit public runtime/setup files, preserving shared-module paths, and adds a SHA-256 manifest; it never recursively archives a checkout. Follow the [service deployment guide](../services/campus-server/DEPLOYMENT.md) for clean extraction, standalone verification, service-only dependency installation, private environment setup and shutdown/rollback. Check the archive hash and reviewed source through the approved release channel; hashes alone do not authenticate a source. The quality workflow now runs the clean-release/restart check and retains the archive, checksum and synthetic evidence for seven days. [Quality run 39013774052](https://github.com/sciencedojoEducation/sciencedojo-web-app/actions/runs/39013774052) passed that step on software head `54dc36e`, along with all 452 regression tests, browser/type/lint/build and private workbook trace checks. [Cron 39013774071](https://github.com/sciencedojoEducation/sciencedojo-web-app/actions/runs/39013774071) also passed. The release artifact was downloaded, matched against both SHA-256 records, extracted and verified independently. GitHub tested merge revision `63ae9b3` (parents `ed6d210` and `54dc36e`); the manifest records that actual checkout rather than the PR branch head. Artifact 12093527975 expires 24 October at 07:30 UTC. A passing package does not establish target-host configuration or pilot readiness. These commands configure no host, reverse proxy, TLS, firewall, process supervisor, live application setting or database.

For controlled local testing against a separately approved development database, set a loopback `ws://` origin in development, apply migration 070 to that database only, and use synthetic verified accounts. Do not copy production learner records into fixtures. Production requires WSS/HTTPS and an owner-approved spend ceiling before procurement.

Staff bootstrap is separate from learner admission: a trusted operator must provision the reviewed admin account in `campus_staff` through the service/database boundary. The RPC also requires an active, email-verified admin profile. No staff entry is inferred from profile or signup metadata, and authenticated accounts cannot read or write the allowlist directly. Disable the staff entry to revoke this extra authority. In staging tests, provision only the newly created disposable QA staff account and remove it during cleanup; this is not verification of a human moderator.

## Before a real pilot

1. Resolve G1–G7 with actual operator, safety lead, adult/residence verification policy, privacy notices and lawful bases, vendor/region/transfer review, retention/export/deletion arrangements, staffed supervision/report response targets and a numerical spending ceiling. Store private evidence outside the repository. No retention period or legal outcome is invented by this implementation.
2. Review/apply migration 070 once through the normal migration process; it leaves the flag disabled. Confirm existing enrollment/progress and RLS behavior on that target database. Do not create course listings or change the ten-place cap to fit the campus cohort.
3. Deploy the web app and one approved EU/EEA room service with exact origins, TLS, request/log controls, bounded infrastructure counts and health checks. Check the actual application framing policy and CSP. Confirm no credentials, profile identity or course/answer/progress data enter room traffic or infrastructure/marketing logs.
4. Select the published pilot course and test verified disposable accounts through real signup/login, reviewed membership, notice acceptance, admission, enrollment/denial/waitlist, save/reload and simultaneous study. Verify actual learner progress directly through existing course routes. Test revocation, blocking/report resolution, service loss/restart, no-WebGL fallback, reduced motion, keyboard/modal behavior and intended devices. Remove disposable accounts afterward.
5. Review results against V1–V11 and G8. Rehearse report/block/removal and shutdown with named staff; record actual response times. Resolve defects before recording owner approval/cohort/schedule under G9. Only then enable the release setting and flag for invited learners.

For removal, revoke the member in the admin screen. Next.js attempts immediate service removal; otherwise the healthy service checks eligibility every ten seconds with a five-second timeout and removes presence within 15 seconds. A failed authorization check also removes the participant. Existing course authorization operates independently.

For shutdown, disable `virtual_campus_enabled` and unset `CAMPUS_PILOT_READY`; active sessions are removed by the next check. Stop the room service immediately when needed. Leave existing Academy routes and data intact. Rotate the service key in both processes if compromised; outstanding tickets expire after 60 seconds, and fresh issuance clears that member's previous ticket.

## Remaining project work

### Vercel shared-room adaptation — implementation plan, 17 October 2026

Continue the owner's existing-project Vercel trial and authorized pilot software
work with an opt-in `CAMPUS_TRANSPORT=vercel` path. Preserve the currently tested
Colyseus transport as the default and keep all admission/release controls off.
Use one short-lived private presence row per connected campus identity in the
existing Supabase database, with a singleton transaction lock for atomic capacity,
duplicate connection and seat decisions. Database time governs speed, input
expiry and connection leases across Vercel instances. Reuse migration 070's
one-use tickets, eligibility/revocation, block rules and course authorization;
do not give a browser direct table or runtime-function access.

Add an additive, separately reviewed migration with RLS and service-only runtime
functions, a bounded same-origin WebSocket handler, and a browser adapter exposing
the current campus UI's message/leave interface. Validate concurrent connections,
seat races, global capacity, input replay/speed, per-viewer blocking, revocation,
lease cleanup and function-duration disconnect recovery with independent server
handlers using the same database. Run the real UI/recovery acceptance for both
transports. SQL physics must be tested against the established world invariants.
Measure request rate/latency; do not infer the intended host's capacity from a
local test. Additional schema deployment, live fixture provisioning and any
paid-resource decision must be checked against the owner's specific approvals;
prepare and verify the code before requesting any remaining deployment approval.
Do not apply this new migration to production or enable learner admission.

**Implementation outcome:** Added the opt-in same-origin Vercel socket/adapter
and additive migration 071. The actual SQL enforces shared capacity, seats,
speed/replay/input expiry, block filtering, eligibility/revocation and expiring
ownership. A database-backed upgrade marker allows one socket attempt per
fresh ticket. Fresh account-bound handover transfers a mature connection before
the function duration limit, retaining the seat and mounted course; old cleanup
cannot delete new ownership. The original Colyseus path remains the default.
See the [Vercel guide](virtual-sciencedojo-vercel.md) for implementation limits
and the exact proposed staging procedure.

The full local regression passed 465 tests before the final upgrade-claim
addition; the final ten targeted SQL/config/socket checks passed afterward.
The shared-room browser passed the study/recovery flow and forced handover with
294 inspected non-handshake frames plus five separately validated, fixture-issued
admission handshakes. Its local PGlite runtime recorded 107 calls, p95 2ms and
maximum 6ms; these numbers do not establish hosted latency, contention, capacity
or cost. The original Colyseus browser also passed, inspecting 385 frames.
Type checking and scoped lint passed before the final upgrade-claim addition;
current-source final CI must be checked after publication. No 071 migration,
branch credential change, live fixture creation, production change, purchase or
learner admission has occurred. Earlier schema approval covers only 067/070;
obtain scoped approval for 071 and staging credentials in the Vercel preview
after preparing the concrete reviewed implementation.

### Vercel preview experiment — approved 17 October 2026

The owner asked to try hosting within the existing ScienceDojo Vercel project.
The first bounded experiment uses `/campus/hosting-check` and an isolated
`/api/campus-hosting-check` Next.js WebSocket endpoint. It tests two simultaneous
synthetic connections, closes them and makes two fresh connections. The endpoint
accepts only the fixed `probe` message, returns a random process marker, limits
payloads to 32 bytes and terminates each connection after eight seconds. It is
available only on this branch's Vercel preview, expires at 00:00 UTC on 18 October
and returns 404 in production. No learner admission, database access, environment
secret, new subscription, production setting or existing course flow is involved.

Acceptance: verify the preview actually upgrades to WSS and exchanges the fixed
message; verify production/other-branch/expiry/wrong-origin guards; retain actual
hosted evidence separately from local verification. A passing probe establishes
transport feasibility only. Vercel can route new connections to different
instances and closes sockets at function duration limits. The current single-
process Colyseus room therefore cannot be installed unchanged. A later shared-
state implementation must preserve authoritative movement, atomic seats, capacity,
admission/revocation, blocking and course recovery across instances. Do not enable
the student beta or call it Vercel-ready based on a successful connection probe.

Sources checked 17 October: [Vercel WebSockets](https://vercel.com/docs/functions/websockets)
and [Next.js upgrade helper](https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package#upgradewebsocket).
Use the existing preview workflow for this experiment; do not convert the whole
project to Services or provision a state store merely to test the transport.

**Hosted outcome:** Software revision `17e2637` deployed successfully in the
existing project as [preview 318bhYMfp](https://vercel.com/sciencedojo-s-projects/sciencedojo-web-app/318bhYMfpAnkDCe7YQqKyzUwP5HR).
The signed-in Vercel browser at
[`/campus/hosting-check`](https://sciencedojo-web-oieaphpd0-sciencedojo-s-projects.vercel.app/campus/hosting-check)
passed all four real WSS exchanges, including closing and making fresh
connections, and observed **two distinct process markers**. This demonstrates
that in-memory state cannot be assumed to be shared even in this tiny test.
The existing campus admission flags remain disabled. Local type checking,
scoped lint and all 454 regression tests passed.
[Hosted quality 39015584841](https://github.com/sciencedojoEducation/sciencedojo-web-app/actions/runs/39015584841)
and [cron 39015584969](https://github.com/sciencedojoEducation/sciencedojo-web-app/actions/runs/39015584969)
passed, including the maintained library browser acceptance, service release,
production build and private workbook traces. A separate unauthenticated CLI
request received the preview's 302 protection redirect; no credentials were
extracted or protection bypassed to attempt further probes. Origin/expiry/
production guards were tested locally; payload and idle limits are implemented,
not separately verified against the protected host. The screenshot and private
trial record are retained locally. No production deployment/configuration,
database, paid plan or account fixture was changed. This result establishes
Vercel transport feasibility, not a deployed shared-library beta.

The adult presence-only software, real staging course loop and clean service-release installation/restart are locally verified. The owner selected the existing Vercel project for a trial and its synthetic WSS test passed; the opt-in shared-state adaptation is now locally verified but its new staging schema/deployment remains pending. Intended-deployment, device and operational checks remain incomplete; the project is not launch-complete. A numerical spending ceiling is still needed before any new paid infrastructure commitment. Nature/weather, custom avatars, extra zones, text/voice, tutor lectures, autoscaling/50-player hardening and the broader roadmap remain deferred by the agreed pilot decisions. They have not been implemented or silently declared complete.

### Continuation evidence — 17 October 2026

- **Deployment preparation:** Added a provider-independent service archive, standalone integrity verifier, blank credential template and operator guide. The clean-extraction check passed locally with the actual entry point and service-only lockfile install, protected synthetic app callbacks, seat ownership, graceful shutdown/restart, cleared state, consumed-ticket denial and fresh admission. It also rejects altered/symlinked payloads/manifests and existing-output overwrite, and scans process logs for synthetic credentials. Scoped lint, type checking and whitespace checks passed. The added step subsequently passed in hosted quality 39013774052. Its archive/evidence/checksum were downloaded and independently verified; see the configuration section for the tested merge revision and expiry. No procurement, service configuration, database mutation or learner admission occurred.
- Previous software head `03e6c24` passed [quality 39012961588](https://github.com/sciencedojoEducation/sciencedojo-web-app/actions/runs/39012961588) and [cron 39012961614](https://github.com/sciencedojoEducation/sciencedojo-web-app/actions/runs/39012961614), including the recovery fixes, 452 tests, production build and private workbook traces. Its hosted browser evidence inspected 817 frames and its seven-day artifact was verified. These runs precede the release-packaging workflow addition.
- **Latest software acceptance:** Fixed quick direction taps/native button activation producing no movement, and retained courses being inaccessible after closing the Hub while disconnected. Timed steps stop on blur/leave/disconnect; old client participant and seat snapshots clear, while the existing course frame remains reopenable offline. The maintained two-browser acceptance passed with the new regressions and 383 inspected synthetic wire frames. The separate real staging browser/peer run passed the embedded-course and recovery checks above, with 2,697 inspected peer frames and zero canary violations. This run's five accounts, course/version/data and temporary staff authority were removed, original flags restored false and disposable credentials erased. Private evidence remains ignored. Local final regression: 452 passed; type checking, scoped/latency lint, production build and private workbook traces passed. A separate Next.js compatibility fix moved the shared lesson renderer byte-for-byte into `lib/academy-course-lesson-page.tsx`; both route wrappers retain the existing behavior, and generated development route types now pass. Hosted checks for these new software changes must be verified after publication.
- **Migration outcome:** The owner's “Yes apply” explicitly approved only staging migrations 067/070 and disposable QA with flag restoration/fixture cleanup. Both SQL editor runs returned success and the schema API exposed the new tables/RPCs. Applied source SHA-256: 067 `817020755fd8e64a2fbc5cc7836420ad7091588e3297282f628e3af4145fa3ff`; 070 `10f793252be7dfb703f276fc48c89127b43414d101cc46b57ac96168620b03b4`. QA passed as detailed above; final read-only SQL and API checks confirmed cleanup, disabled flags, RLS and restored immutable-version protection. Private manifests/scripts and detailed deployed findings remain ignored under `.campus-private/`; no real account records were copied into fixtures. These results supersede earlier entries saying schema approval or live staging integration was pending, while hosted deployment and operational gates remain open.
- Hosted quality **39010543985** and cron **39010543990** both passed on `41d02a7`, covering the final staff hardening and 452 tests. The Vercel preview status reported success; no hosted campus service or full preview integration was tested. Later documentation-only commits do not alter that software evidence.
- The approved restoration completed: dashboard **Healthy**, schema API HTTP 200, read-only SQL reporting **Postgres 17.6**. Its schema lacks course-pilot/campus tables and RPCs. Read-only preflight confirmed the Academy policy names required by 067; deployed authorization findings remain in the ignored `.campus-private/` record. Campus migration 070 adds private service-provisioned staff membership and restrictive flag-write policies; moderation and the privileged flag action independently check `campus_is_staff`. SQL tests cover an untrusted admin profile, self-provisioning denial, legacy permissive flag policies, staff revocation and the legitimate provisioned path. The action test proves that a profile/metadata admin and an RPC outage cannot reach the service-role writer. All **452** local regression tests, type checking and scoped lint passed. Broader authorization review is not claimed complete.
- [Quality run 39009871396](https://github.com/sciencedojoEducation/sciencedojo-web-app/actions/runs/39009871396) and [cron run 39009871413](https://github.com/sciencedojoEducation/sciencedojo-web-app/actions/runs/39009871413) passed on `c3fcc34`, including the full production build, browser acceptance, type/lint checks and private workbook trace check. The synthetic browser artifact was saved (384,010 bytes, seven-day retention). These runs precede the new staff hardening, which requires its own current-head checks.
- Migration 067 was prepared in the staging SQL editor but its Run action was rejected by automatic approval review: restoring staging did not explicitly authorize a separate schema migration. No migration was executed. The next requested integration step is applying only 067 and 070 to this staging project, testing disposable synthetic accounts/course with temporary staging-only flags, restoring those flags and cleaning up only the newly created fixtures. Unrelated business/workbook migrations 068/069 and all production data remain outside that step.
- After the owner approved the pending actions, [public draft PR #17](https://github.com/sciencedojoEducation/sciencedojo-web-app/pull/17) was created and attached to the chat. Hosted quality/cron checks started on `ded912a`. The approved staging resume was confirmed through Supabase's dashboard; it accepted the request and changed from paused to “Coming up…”. The announced Postgres update is part of that restoration. Health and schema completion must be verified before applying migration 070. No production change, paid provisioning or real-learner admission is authorized by this approval.
- The first hosted quality run passed all 450 regression tests. The separate cron workflow initially failed one test-file import because it also runs the full suite but did not install `services/campus-server` dependencies. Its missing `npm ci --prefix services/campus-server` step is now added; a passing replacement run is still required. This is a workflow repair, not a reduction in test coverage.
- Added the maintained two-user browser check to `.github/workflows/quality.yml`, with a ten-minute check timeout and seven-day synthetic screenshot/evidence artifacts under the runner's temporary directory. The installed Playwright CLI confirms the browser-install options; the workflow parses successfully. Its browser command passed locally with `TMPDIR=/private/tmp`, generating the expected four screenshots and `evidence.json`; 320 inspected WebSocket frames contained no dashboard/course paths, course title, answer canary or issued tickets. This is local workflow preparation, not a claim that GitHub Actions has executed. A bounded read-only primary public-feature-flags request still returned HTTP 504; the separately configured showcase staging health check still failed `ENOTFOUND`. No full-build retry, staging resume, migration or production modification was attempted in this continuation.
- Delivery is recorded on `codex/virtual-sciencedojo-beta`: foundation commit `32f7c98`, followed by the library/privacy implementation and CI/documentation commits. Publishing and hosted CI must be checked against the actual pull request/run; a draft review does not establish deployment or authorize admission. No campus migration or release enablement is recorded here. The pre-existing business-backlog edit remains outside these commits.
- Owner's beta clarification is implemented: the existing platform is retained, the optional entry/header are labelled beta (including phone width), two library desks use laptop models, and the Study Hub links to the signed-in account's existing role dashboard in a separate tab. The maintained browser fixture verified that the dashboard tab has no opener, the library/modal remain open, course work survives close/disconnect, and the launcher fits 390px width. Desktop and phone screenshots were inspected. The wire audit inspected 340 frames without finding the dashboard/course paths, course title, answer canary or issued tickets. This uses a synthetic dashboard destination, not live account-data integration. The current regression suite passed all 450 tests; type checking, scoped ESLint and latency lint passed. The updated production build compiled and passed TypeScript but its prerender phase encountered existing public-data gateway timeouts; final build outcome is recorded below when available.
- Final beta-update build outcome: compilation and TypeScript passed, then existing public-data requests returned repeated gateway timeouts and several prerender routes exceeded 60 seconds. After identifying the exact local `next build` process, it was deliberately stopped (exit 130). Full current-source production-build verification remains incomplete; the local synthetic preview continues running. No backend, infrastructure or production data was changed to bypass this failure.
- Closed the previously recorded SPA tracking gap with `CampusDocumentBoundary`, shared route classification and an event guard. Three new tests cover exact/nested/auth-return paths, document-reload decisions and suppression of manual study events through an existing `gtag`. The real browser fixture also proves that a simulated tracked public document reloads before any campus UI mounts, and the earlier globals are absent afterward. Existing walk/sit/study, Escape/focus, block/report and forced-disconnect checks still pass. At that point the production build, type check and scoped/latency lint passed; the subsequent beta-update build limitation is recorded above.
- The configured showcase staging API failed DNS resolution (`ENOTFOUND`); no schema or user data was read from it. A read-only Supabase dashboard check then identified the cause: **sciencedojo-showcase-staging** is paused. Its dashboard reports **eu-west-2 / London**. This is staging evidence only; it does not establish the production project's region or settle G5's transfer review.
- The dashboard states that resuming this project updates Postgres to the newest version. Resume approval was requested because it restores a hosted database/API and changes the backend version. No resume, upgrade, migration, account creation or production change was performed. Real-service integration remains pending that approval and schema inspection; no successful live course or human pilot result is inferred.
- Further local acceptance audit: the browser study flow's actual WebSocket frames were inspected for its course title/path, a typed answer canary and issued admission tickets. An initial run inspected 291 frames; a combined run inspected 297, with none of those values found. The combined run also proved the no-WebGL direct-Academy fallback without an uncaught error and exercised the authenticated HTTP moderator-removal endpoint, preserving open course input, cleaning up presence and permitting fresh admission. These checks are now retained in the maintained browser-check script. They are fixture evidence for parts of V4/V9/V10, not proof of production traffic, live enrollment, moderator staffing or hardware performance.

Read-only production hosting metadata has been checked and recorded privately. Consult the ignored private hosting record before repeating that investigation; do not publish its locations or detailed deployed findings without explicit owner authorization for the public destination. G5 vendor/privacy review remains pending. No production configuration, deployment or data was changed by that check.

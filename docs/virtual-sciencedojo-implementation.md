# Virtual ScienceDojo implementation and runbook

Updated 17 October 2026. The owner requested completing the project after approving the Phase 0 direction. This record tracks software delivery toward the agreed 5–10-person, adult EU/EEA, presence-only pilot. It does not declare the broader roadmap or pilot launch complete.

## Current software

- Optional beta boundary, clarified by the owner on 17 October: existing public website and dashboards are retained. The flag-gated dashboard entry and campus header explicitly say beta. Library computers and laptops offer the signed-in learner's existing dashboard in a separate tab, with existing courses still available in the retained Study Hub frame. The shortcut uses trusted profile/internal membership for its destination; it grants no additional access. The owner subsequently requested the whole-school software expansion recorded below.
- `/campus`: closed/invitation state, explicit notice acceptance, lazy-loaded 15-place 3D school, capsule avatars, keyboard/touch direction controls, ten exclusive study stations, participant list and accessible HTML controls.
- Study Hub: native modal, existing authorized Academy routes in a same-origin frame, course-identity notice, retained iframe when closed, direct-course fallback. Learning content never enters room state.
- Admission: verified account and private reviewed membership, default-disabled feature flag, separate release setting, random one-use 60-second tickets stored as hashes, same-origin mutations and bounded request bodies.
- Multiplayer: default separate Colyseus process, static authentication before reservation, join-time and periodic eligibility checks, one library with ten connections, authoritative movement and seat state, per-participant blocked views, disconnect cleanup and fresh admission to reconnect.
- Optional Vercel transport: a service-only shared SQL room coordinates capacity/seats and expiring ownership across function instances; actual staging Preview and bounded backend verification are recorded below and in the [transport guide](virtual-sciencedojo-vercel.md).
- Safety: durable reason-only reports and blocks, staff-only member/report/audit reads, reviewed invitations and revocation in `/dashboard/admin/campus`, immediate removal notification with periodic-check fallback.
- Privacy integration: campus and Academy routes and their login/signup return paths skip new marketing tag initialization and manual analytics events. The campus document boundary withholds its UI after a public-page SPA transition and opens a fresh document before rendering study content, clearing prior marketing globals. Automatic retries are bounded; a full-page fallback link remains available. A broader vendor/telemetry assessment remains part of G4/G5.
- Build isolation: existing Next.js layout retained; the service has its own lockfile. CI installs both dependency sets and matching Chromium, runs the synthetic beta browser acceptance before the build, and retains fixture screenshots/evidence for seven days. Root type checking excludes the service directory. Verified quality and cron checks passed on documentation head `a3379be`, with unchanged application code from `280319a`; see the evidence below.

Migrations 067/070 and subsequently 071 were applied to showcase staging on 17 October after explicit owner approvals, and bounded disposable QA completed. Both original staging beta flags are restored off and all owned fixtures removed. None of these migrations has been applied to production. No paid service has been provisioned, production setting enabled or real learner invited.

## Evidence and limits

| Check | Evidence on 17 October |
| --- | --- |
| Protocol and SQL | Nine tests passed against actual simulation and PGlite policies: replay/invalid inputs, bounded movement, seat contention, block filtering, identity projection, capacity, one-use/expiry/service-only tickets, metadata spoofing, RLS, report limit, revocation, suspension, disabled flag, actual byte limits and bounded admission counters |
| Actual multiplayer | `tests/campus-server.test.mjs` passed with real Colyseus/WebSocket clients: foreign origin and invalid credentials denied, unauthorized room creation denied, two peers/seat contention, per-client filtering, periodic revocation and ten-client capacity. A subsequent regression case also passed for duplicate reservations: a failed duplicate cannot remove the avatar owned by the successful session |
| Browser fixture | `scripts/check-campus-browser.mjs` passed in two Chromium contexts: keyboard walk/sit, notice/Study Hub, Escape from inside the frame and focus return, synthetic course save, unsaved input retained across close/reopen, stand, forced WebSocket loss with retained course input and cleaned-up presence, block/unblock/report, leave/fresh admission and 390px layout without overflow or uncaught browser errors |
| Hosted build and checks | [Quality 39021927850](https://github.com/sciencedojoEducation/sciencedojo-web-app/actions/runs/39021927850) and [cron 39021927863](https://github.com/sciencedojoEducation/sciencedojo-web-app/actions/runs/39021927863) passed on `a3379be`, including 467 tests, both browser transports, service release/restart, type checking, lint, production build and private workbook trace checks |
| Regression | Latest local and hosted `npm test` passed **467 tests**, zero failures/skips, including explicit campus staff isolation and privileged flag-action checks |
| Real staging database | Five synthetic accounts and one owned course: reviewed fixture admission/notice, default-off denial, unprovisioned-admin denial, course entitlement independence, two enrollments, ten-place cap/waitlist, private-note save/relogin/reload, one-use/service-only ticket redemption, block/report/staff resolution and cleanup passed. Eight null-identity synthetic enrollment rows filled only the disposable course's remaining seats |
| Real application/service | Loopback Next.js and the actual room entry point used real staging auth and RPCs. Two peers joined through real admission/service endpoints; foreign origin, replay and outsider admission were denied; block/unblock filtering and periodic revocation passed. Final clean-exit run inspected 60 WebSocket frames without account IDs/emails, course key/title, private-note canary or issued tickets; revocation took 1,926 ms (under the 15-second bound) |
| Real Academy browser | Actual staging login, shared presence, walk/sit and course identity notice passed. The existing lesson's Finish course action saved 100% completion inside the real Study Hub frame; a fresh authenticated session confirmed progress and peer isolation. Close/stand/reopen preserved unsent private notes. With campus disabled, the retained frame reopened and its existing Save notes action persisted work. Fresh campus admission preserved another unsent edit. The final disconnect cleared stale participants/seat claims and allowed offline reopening again |
| Peer observation | Two real staging-backed peer sessions inspected 2,697 frames during the browser study/recovery flow. Only coarse absent/walking/seated/studying transitions were recorded; none of the synthetic account identifiers/emails, course key/title, private-note canaries or observer admission ticket appeared |
| Original staging cleanup | All five auth fixtures, temporary staff membership, owned course/version/listing/memberships, progress, notes, reports, audit, blocks and tickets removed and checked. Both original flags restored false. Read-only SQL confirmed six campus tables with RLS and normal immutable-version protection enabled. QA services stopped; disposable credentials erased |
| Clean service release | `npm run test:campus:release` passed on Node 22.22.2: explicit-file archive and standalone checksums, tampered/symlinked payload and manifest rejection, overwrite protection, clean service-only dependency installation, missing-credential startup denial, actual packaged-process callback/admission/seat ownership, SIGTERM/restart cleanup and consumed-ticket rejection/fresh admission. Captured logs contained no issued synthetic credential. This uses a synthetic loopback application callback, not a hosted deployment |
| Existing workbook protection | `node scripts/verify-aspekte-build.mjs` passed: no private source or static-public files in server traces |
| Built disabled app | Loopback production server: `/campus` displayed closed state; admission/safety/service returned 403 without release configuration; a foreign-origin admission was denied |
| Preservation | The pre-existing business backlog edit retained SHA-256 `0cf8997b87ddc6c511861116bc87c6c15fddb4bafe3bcc162135b3ec3c169c1b`; B3/S1/R1 and approved business scope/pricing were not changed |
| Dependency check | Separate service installation reported zero advisories. A shared root `ws` advisory was removed by updating within the existing range to 8.22.0. The root audit still reports 21 other advisories; their applicability and upgrades remain part of the broader production review, not a claim of security certification |

Browser fixture screenshots were visually inspected on desktop and 390px phone width. That maintained fixture uses synthetic admission/course responses. The separate local-app/staging check above exercised real Supabase auth, enrollment and embedded Academy saves; accounts were admin-created without email, so public signup/delivery was not tested. An initial cold development opening reloaded the campus page; the repeated flow completed after the routes were compiled. Actual Vercel Preview TLS/WSS, course framing and handover/recovery subsequently passed, as detailed below. Intended-device cold entry/performance, broader CSP/network/log assessment, named moderator operation and independent usability remain unverified. Local network canaries do not replace hosted-network inspection. No 50-user or 60fps claim is made.

Reproduce software checks from the repository root using Node 22.18+:

```sh
npm ci
npm ci --prefix services/campus-server
npm run test:campus
npm run test:campus:release
npm run test:campus:render
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
3. Deploy the reviewed web app and selected transport (the existing Vercel/shared-SQL path or an approved Colyseus service) with reviewed hosting, exact origins, TLS, request/log controls, bounded infrastructure counts and health checks. Check the actual application framing policy and CSP. Confirm no credentials, profile identity or course/answer/progress data enter room traffic or infrastructure/marketing logs.
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
At that pre-approval checkpoint, final hosted CI and scoped approval for 071
and staging credentials were still required. No migration 071, branch credential
change, live fixture creation, production change, purchase or learner admission
had occurred. The subsequent approved procedure and outcomes are recorded below.

**Recovery follow-up:** A local failure regression reproduced a stalled renewal
HTTP request suppressing the old socket's disconnect event indefinitely. The
unfixed browser test timed out waiting for safe disconnection. Renewal admission
now aborts after ten seconds and remains cancellable by Leave; the replacement
socket retains its independent twelve-second deadline. The regression requires
cleared presence, retained offline course input and fresh admission after the
old socket closes. An additional injected RPC-outage test passed, including
sanitized errors, failed immediate cleanup and expired-seat release on recovery.
This follow-up changes no schema or staging-approval scope. Current-source
browser and hosted checks are recorded with the follow-up PR evidence.

**Liveness follow-up:** Further failure controls reproduced the server renewing
a no-pong peer's presence indefinitely and a browser retaining a silent channel's
old presence. Native ping/pong checks now terminate unresponsive peers and release
their seats; healthy peers stay connected. A visible-client snapshot watchdog
ends silent channels with course input retained, while hidden tabs get a fresh
grace period on return. Initial and renewal HTTP admission now share a ten-second
abort deadline; Leave cancels initial entry and invalidates late results. The
local full shared-room browser passed these added failures along with healthy
handover and recovery, inspecting 948 world frames and eight separately validated
handshakes. All six socket tests and all 467 regression tests passed; the original
Colyseus browser also passed, inspecting 414 world frames. Type checking, scoped
lint and whitespace checks passed. These are local fault-injection results;
current-source hosted checks and actual staging integration remain distinct.
At that checkpoint, migration 071 still required the scoped staging approval recorded below.

### Shared-room staging procedure — approved 17 October 2026

The owner explicitly approved applying migration 071 to showcase staging only,
temporary staging Supabase URL/anon/server credentials in the beta branch's
Vercel Preview, and disposable QA with fixture cleanup and exact flag/environment
restoration. No production change, paid service or learner release is authorized.
The migration's reviewed SHA-256 is
`1ca2e865e923c2c0c065db7901b753e026061643c7fc12d81b90c8acb29b6f6a`.
The SQL editor reported success. A subsequent actual database check confirmed two
runtime tables with RLS, service-only runtime execution, denied direct runtime
table access and both original flags off. The five branch-only Preview values
were saved and the actual deployment on
software head `280319a` reached Ready. Hosted quality 39018702720 and cron
39018702689 also passed that exact software head, including 467 tests and both
browser transports. The downloaded browser artifact contains 17 shared-room
checks with 1,398 world frames and eight separately checked admission handshakes;
the original transport inspected 953 frames. These maintained fixtures remain
separate from the following actual staging check.

**Actual integration outcome:** The deployed 3D library was visually verified.
A staging-only synthetic account signed in through the actual Next.js Preview,
entered TLS/WSS, walked/sat and opened its authorized Academy course in the Study
Hub. It completed the existing lesson to 100%; a fresh login verified persistence
and peer isolation. Retained notes survived Hub close/reopen and actual duration
handover. Database ownership changed after approximately 203 seconds with seat,
studying state and unsaved input retained. Duplicate hosted-tab admission was
denied. Hosted report/block, provisioned staff resolution, revocation/denied
readmission, fresh standing admission and switch-off passed. The retained course
saved notes while campus was off; fresh login and peer isolation passed.

Actual hosted SQL concurrent admissions respected the ten-place cap including
the GUI learner; simultaneous seat claims produced one owner. The successful
bounded run recorded 57 RPC calls, p95 146ms and maximum 153ms at the local API
caller. A direct SQL observer inspected 488 snapshots without credential or
learning-canary violations. This observer is not a second Vercel socket, and
these timings are not sustained throughput, server SQL time or a cost estimate.

**Cleanup:** All fourteen disposable accounts, the owned course/data and temporary
staff/membership authority were removed. Both original flags were restored off;
all eight campus tables have RLS, immutable-version protection is enabled and
owned auth/course/presence rows are absent. All five temporary branch-only
Preview overrides were removed. Original shared/Production variables and Vercel
Authentication were unchanged. Private manifests were scrubbed of disposable
passwords. Detailed evidence remains ignored under `.campus-private/`.

**Remaining hosted scope:** Vercel sign-in blocks external automated clients.
At that checkpoint a temporary deployment link was still awaiting approval;
the later approved multi-user procedure and cleanup are recorded below. Broader
hosted DB outage/endurance/cost, intended devices, independent human usability
and G1–G9 remain open. The beta is closed; no production change, paid
service or real learner admission occurred. See the Vercel guide for continuation
and keep newly owned fixtures in a fresh manifest rather than reusing cleaned
accounts.

### Additional bounded backend checks — 17 October 2026

The same approved staging-QA scope subsequently measured one, five and ten SQL
occupants for 10/15/30 seconds using 200ms ticks with no overlapping per-peer
RPCs. It completed 1,891 updates without RPC error, lost presence, projection or
canary violations. Ten occupants achieved 49.18 updates/sec against the 50/sec
design ceiling, with caller-measured p95 128ms, p99 228ms and maximum 470ms.
Five occupants achieved 24.20/sec and one achieved 5.00/sec. Busy peers skipped
ticks rather than queueing work; see the transport guide for all stage timings.

A guarded transaction then held the isolated room-lock row. The seven-second
pulse caused a bounded update timeout, with cleanup recovering as the lock
released.
An eleven-second pulse exercised both failures: update timeout 2,091ms, cleanup
timeout 3,984ms, then expired-seat release after 15,214ms while the recovering
second SQL peer remained present. No persistent schema/configuration changed.
These are actual API/SQL results, not Vercel-client or database-wide outage proof.

All seventeen accounts across the three new backend runs, temporary authority,
memberships, audit and tickets were removed; passwords were scrubbed and both
original flags restored off. Final SQL confirmed no owned auth fixtures or campus
memberships/presence, eight RLS-protected campus tables and enabled immutable
version protection. No course or deployment setting changed. The bounded load
and lock scenarios have evidence; subsequent actual multi-user WSS is recorded
below. Broader outage/endurance/cost, intended devices, independent human
usability and G1–G9 remain pending. Detailed scripts/manifests/results are private and ignored.

### Actual multi-user Preview and cleanup — 17 October 2026

After the owner approved both the single staging Preview link and its disclosed
Hobby replacement effect, the unchanged `280319a` application passed actual
Next.js/Supabase/WSS multi-user checks: ten sockets stayed live for 30 seconds
while an eleventh was denied; two peers shared snapshots, duplicate connections
were denied, concurrent seat requests had one owner, blocking retained occupied
seats and reporting succeeded. Genuine duration handover retained seat/studying
state, and old-owner commands/cleanup could not remove the replacement. The
check completed at about 209 seconds. Staff removal denied readmission and stopped
updates, as did global switch-off. The revocation check's 15,299ms includes a
fixed 14-second quiescence wait; removal plus admission denial were verified
within an upper bound of 1,299ms.

The isolated no-pong test required both healthy peers to observe the seat before
the fault. Authoritative removal/seat release took 7,118ms, with raw close after
16,942ms and healthy peers retained. Keep the browser snapshot watchdog as well
as server heartbeat/lease cleanup; raw proxy close delivery has its own timing.
Actual hosted UI sign-in/3D entry and staff revocation also passed: disconnected
status, zero stale peers and disabled controls. These are automated/synthetic
results, not intended-device or human usability acceptance.

Across the core scratch attempts/continuation and isolated fault, 5,030 inbound
world frames and 32 separately formed handshakes were checked with no canary
violations. Private evidence retains the early too-short rejoin wait, too-distant
seat target and premature snapshot/frame assertions; no product code was changed
to satisfy them. The later corrected checks passed. The earlier real-course
persistence result is reused; this run created no course or learning data.

All thirteen new accounts and their authority/reports/audit/tickets were removed,
passwords scrubbed and original flags restored off. Final SQL confirmed zero
memberships/presence/owned auth/staff, eight RLS tables and enabled immutable
protection. The link was revoked; its old URL and previously issued cookie both
redirected to Vercel sign-in, as did ordinary unauthenticated access. Access
secrets were scrubbed. No schema, course, branch override or production setting
changed. Detailed evidence is private under `.campus-private/`; do not reuse its
cleaned manifests. Broader outage/endurance/cost, intended devices, independent
human usability and G1–G9 remain pending. The beta is closed and PR #17 stays draft.

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

The adult presence-only software, real staging course loop and clean service-release installation/restart are locally verified. The owner selected the existing Vercel project for a trial and its synthetic WSS test passed; the opt-in shared-state adaptation now has bounded actual Preview and staging SQL evidence, with fixtures/settings cleaned afterward. Actual bounded multi-user Preview WSS subsequently passed as recorded in the transport guide. Broader outage/endurance/cost and operational/device checks remain pending; the project is not launch-complete. A numerical spending ceiling is still needed before any new paid infrastructure commitment. Nature/weather, custom avatars, extra zones, text/voice, tutor lectures, autoscaling/50-player hardening and the broader roadmap remain deferred by the agreed pilot decisions. They have not been implemented or silently declared complete.

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

## Movement continuity fix — 17 October 2026

The owner reported that controls work but movement feels discontinuous in the local preview. Avatars previously snapped directly to shared-room snapshots, normally five per second. The scene now interpolates locally between confirmed targets and follows that displayed position with the camera. Seat/stand transitions, corrections over three units and gaps over one second snap immediately. There is no extrapolation, client-position submission or change to server authority, networking frequency, account/course data or release controls.

Fixed library boxes now share an instanced geometry/material, static shadows are cached, avatar ground shadows use inexpensive geometry and the canvas uses pixel ratio one with demand rendering. Rendering remains paused in the Study Hub; reduced motion anchors the camera. These changes follow the [React Three Fiber performance guidance](https://r3f.docs.pmnd.rs/advanced/scaling-performance).

A sequential before/after probe used the actual scene, twenty synthetic targets at 200ms intervals, a 900×600 canvas and installed Chrome 155/headless SwiftShader. Draw calls fell from **265 to 17**, geometries from **133 to 17**, and distinct displayed positions during the four-second walk increased from **21 to 219**. Observed p95 frame gaps were 26ms and 17ms. These are bounded software-rendered fixture measurements, not hardware/hosted FPS guarantees. The resulting scene screenshot was visually inspected.

Local verification passed: **471 tests**, both maintained browser transports (1,239 world frames and eight separately checked handshakes without canary violations), scoped ESLint, type checking, production build and private workbook traces. The actual-scene render check asserts intermediate positions, a draw-call budget and exact final target; it is added to quality CI with seven-day JSON/screenshot artifacts. Hosted results for this revision must be checked separately. The earlier actual staging tests used application revision `280319a` and do not verify this new rendering code on that deployment.

The rebuilt synthetic preview is available for owner retesting at `http://127.0.0.1:3012/`. Refresh and re-enter to load the fix. The owner initially replied **“Yes, much smoother,”** then clarified that the moving character still repeatedly pauses. The earlier reply is not final smoothness acceptance. All operational gates remain pending. No staging fixture, hosted setting, production data or paid service was changed for this fix.

### Follow-up: uneven update timing

The first fix could reach its target before the next packet arrived. A new deterministic jitter regression reproduced **160ms stationary intervals** during a sustained walk. Presentation now keeps a **300ms buffer of confirmed poses** and samples that timeline, instead of restarting a segment at every arrival. This adds a bounded display delay; it does not predict movement or submit positions. Duplicate stationary samples retain stop timing; seat/stand, long-gap recovery and large corrections still snap. A buffer underrun holds the last confirmed position. Old samples are discarded, and settled avatars stop requesting frames.

The jitter regression now passes without intermediate stops. The actual-scene browser probe now varies arrivals across 120/280/160/240/140/260/180/220ms rather than only evenly spaced updates, and asserts a stationary-pause limit. Its local result recorded **0ms stationary pauses** in the middle of the walk, 17 draw calls, exact final target and no browser errors (software rendering only). On **18 October 2026**, the owner retested the second fix and confirmed: **“its good and movement is smooth.”** This closes the reported movement-continuity defect on the tested local browser; it does not establish numerical hardware FPS, a full independent walkthrough or pilot release readiness.

Software revision `c7bc88b` passed **473 tests**, both browser transports, service release/restart, rendering continuity, type/lint, production build and workbook checks in [quality 39027927647](https://github.com/sciencedojoEducation/sciencedojo-web-app/actions/runs/39027927647). [Cron 39027927677](https://github.com/sciencedojoEducation/sciencedojo-web-app/actions/runs/39027927677) and the [Vercel Preview build](https://vercel.com/sciencedojo-s-projects/sciencedojo-web-app/6JaXQGEPJmnNZtSZMmZ1mPv79LiC) also passed. These hosted results cover the second fix; the separate actual staging integration remains historical evidence on `280319a`. The PR remains draft/unmerged and operational gates remain pending.

### Owner library acceptance — 18 October 2026

After receiving the study-loop instructions and an explicitly requested private same-network phone-preview link, the owner reported **“all works in the library.”** Record this as owner acceptance of the tested library experience, alongside the earlier smooth-movement confirmation. Do not request the same general library test again without a specific new defect or evidence gap. The phone model/browser and separate independent-participant observations were not supplied; numerical hardware FPS and real-course persistence are not inferred from this general feedback.

The temporary network gateway forwards only the synthetic local fixture and requires an access link. Unauthorized assets/admission, invalid access/Host and unauthorized WebSocket upgrades were denied. A fresh phone-width Chrome context verified private-link entry, URL cleanup, real shared-room admission, touch direction controls and leave without browser errors. The link expires automatically; its access material and detailed evidence remain ignored/private. No application code, hosted release flag, real account/course data or production setting changed.

Remaining release work is the actual operator/eligibility/privacy/vendor/retention record, named supervision and rehearsal, spending/shutdown controls, intended-deployment validation and selected cohort/course/schedule/release decision under G1–G9. Existing owner library feedback is complete for the scope reported; it is not approval to admit learners.

## Whole-school implementation — 18 October 2026

The owner clarified that the environment should feel like a real school, with more places than the accepted library. The expanded local software includes reception, the original library, computer lab, science lab, Classrooms A/B, art studio, music room, auditorium, cafeteria, sports hall/court, quiet garden, greenhouse and courtyard. Rooms have distinct props and open cutaway views, connected paths, wall collision and usable doorways. The whole-school camera, follow camera, 15-place map and ordinary-input walking routes allow discovery without position teleports. The original four library desks remain; four computer-lab stations and two classroom laptops open the same authorized Study Hub. No new enrollment, learning, payments, chat or voice system was introduced.

The shared layout governs Colyseus authority, client wayfinding and prepared SQL migration `072_campus_school.sql`. SQL/JS parity and reachability tests cover every room/study station, walls, doors, bounds and seat coordinates. The server-only world revision fails closed against an older SQL schema and is not broadcast to peers. Migration 072 has been exercised only in fresh disposable local fixtures; it has not been applied to staging or production. The existing release switch and beta flag remain default-off.

Local whole-school verification passed 475 tests before the additional revision-compatibility regression, both browser transports (including navigation to the computer lab and retained course work at its workstation), type checking, scoped lint, production build/workbook traces and clean service release/restart. The service's explicit allowlist now includes the shared school layout. The actual-scene probe retained seven draw calls, no browser errors and no stationary pause in its synthetic jitter walk; screenshots include a whole-school overview. These are local fixture results, not new hosted integration or intended-device performance proof. The final suite/hosted result is recorded separately when available.

The existing local and private LAN previews are rebuilt with the school. The private access link stays in ignored records and expires automatically. The prior owner acceptance concerned the library; the newly expanded school still needs owner feedback. Existing operational and learner-release gates remain pending, without repeating the already accepted general library walkthrough.

Final local suite: **476 tests passed**, including denial/cleanup against an old world revision. The final production build and scoped lint/type checks passed. Both full browser transports passed the expanded-school flow; the private LAN gateway was then checked against the final shared-runtime preview, with 15 destinations, touch controls, admission and leave. A separate reduced-motion actual-scene check passed camera anchoring and movement continuity. These checks preserve the original library/course recovery paths; no hosted database or real accounts were changed.

### Whole-school rendering follow-up

The first hosted school run passed 485 regression tests, clean service release/restart and both browser flows, then failed the unchanged render-continuity threshold on the software-rendered runner. The renderer now batches by room with accurate bounding-box-derived culling spheres while sharing the box geometry/material. Off-screen rooms can be skipped. A sustained slow-frame budget can lower only the canvas pixel ratio to 0.65; HTML map/text remain full resolution. Normal and reduced-motion probes still require intermediate movement positions, bounded stationary gaps, fewer than 40 draw calls and the exact final target. Failure JSON is saved before assertions for diagnosis. Local updated probes passed; the replacement hosted result must be verified separately.

The larger school map keeps participant safety close: a scene-toolbar shortcut focuses the participant controls directly, a route can be stopped from that toolbar, and the participant card retains its own leave action. The browser check observes authoritative keyboard arrival within eight seconds instead of assuming a fixed number of network ticks during a 1.4-second sleep; SQL/JS speed constraints and the separate rendering thresholds remain unchanged.

The follow-up hosted run passed all 485 regressions and both browser flows but still recorded only 33 distinct walking positions on SwiftShader (17 draw calls, no browser errors, exact final target). Diffuse school props now use Lambert lighting rather than per-fragment metal/roughness shading, with a cached 1024-pixel shadow map and normal bias to prevent floor self-shadow stripes. The continuity assertions remain unchanged; local normal/reduced-motion probes passed, and hosted verification of this material change is tracked in the draft PR.

The diffuse-material hosted run still failed continuity (23 distinct positions, p95 frame gap 335ms); all 485 regressions and both browser transports passed. The slow-device fallback disables decorative canvas shadows at the first resolution reduction (1 → 0.65), then permits 0.45 if sustained frames remain slow; HTML remains sharp and the avatar keeps its inexpensive ground marker. The frame window clamps idle gaps so a resumed demand canvas cannot count one idle pause as sustained load. The actual-scene probe records shadow fallback and retains all movement thresholds; `--slow-device` exercises four times the canvas pixels with CPU throttling in isolated QA and requires the fallback to activate.

Software revision `ae7d51f` passed [quality 39141290501](https://github.com/sciencedojoEducation/sciencedojo-web-app/actions/runs/39141290501): 485 regressions, clean service release/restart, both browser transports, normal/reduced-motion rendering, type/lint, production build and workbook traces. Hosted render probes recorded47/48 distinct positions,6/0ms stationary pauses,DPR 0.45,decorative shadows disabled,17/34 draw calls, exact final target and no browser errors; these remain SwiftShader fixture measurements. Final review also resets the slow-frame duration whenever its average returns below 40ms, so prior fast frames cannot accumulate toward a later quality downgrade. The corrected high-pixel/CPU-throttled local probe passed 109 distinct positions and 6ms pauses; current-head hosted verification is tracked in draft PR 17. Migration 072 and real learner release remain unapplied/unapproved.

The final guard revision passed 485 regressions and both browser flows but failed the four-second render-position count on its runner (23 positions;DPR 0.45, shadows off, exact final target). Review found the probe truncated its measurement at nominal 4000ms even if the runner delivered its 20 target timers late. It now records actual arrival timestamps/count and walk duration, measures the whole observed 20-target walk plus the 300ms display buffer, and excludes only the actual start/stop margins from its pause check. The position>35, pause<80ms, draw-call<40 and exact-target assertions remain unchanged. This corrects the measurement window; it is not an intended-device FPS claim. Current-head hosted results remain tracked in draft PR 17.

Final demand-rendering review: quality sampling now counts only frames that an avatar or camera requested continuously. Idle/snapshot redraws and Hub pauses do not indicate slow rendering; behavioral regressions cover these cases and load recovery. A sustained slow animation switches once from DPR 1 to DPR 0.45 and disables decorative shadows together, avoiding repeated resize/shader transitions. HTML remains full resolution. The earlier progressive 0.65 step is superseded. The current 20-arrival hosted diagnostic recorded 657/708ms timer gaps and 31 positions despite exact settlement; current software verification remains tracked in the draft PR.

### Verified school software — final record, 18 October 2026

Software revision `f9a791e` passed **488 tests**, clean service release/restart, both maintained browser transports, normal/reduced-motion graphics, type/lint, production build and private workbook traces in [quality 39142972519](https://github.com/sciencedojoEducation/sciencedojo-web-app/actions/runs/39142972519). [Cron 39142972562](https://github.com/sciencedojoEducation/sciencedojo-web-app/actions/runs/39142972562) and the [Vercel Preview build](https://vercel.com/sciencedojo-s-projects/sciencedojo-web-app/8GJPoyg2aNBdN2zwS2PFBVfCiMy6) also passed.

The hosted actual-scene probes observed all 20 targets, 47/64 distinct displayed positions, no stationary pause, 17/34 draw calls, exact final settlement and no browser errors; the reduced-motion camera remained anchored. Both slow-runner probes made one DPR 1 → 0.45/shadows-off transition. Actual arrival timing and transitions are retained with screenshots in seven-day CI artifacts. These are bounded SwiftShader fixture measurements, not phone/native GPU FPS or an independent human outcome.

The final renderer samples only continuously requested animation frames; three behavioral regressions protect intentional idle/snapshot redraws, sustained load and recovery. The local high-pixel/CPU-throttled probe also passed with the fallback active. All 15 camera destinations were rendered in the synthetic preview without browser errors, and the refreshed private LAN fixture passed phone-width entry, touch, focused safety and leave. The original library acceptance is preserved; expanded-school owner review is still pending.

The local/temporary private LAN preview remains available for that review. This records software verification only. Migration 072 remains local-only, hosted flags remain disabled, PR 17 stays draft/unmerged, and actual G1–G9 operating/release evidence remains pending. Do not recreate completed staging fixtures or repeat the accepted original library walkthrough. A subsequent documentation-only record update does not change the verified application source or establish a new hosted check.

## Glass Cube iteration —18 October 2026

The owner requested modern glass architecture inside a literal cube, multiple camera angles including first person, nature and a 24-hour sun/moon/star sky, explicitly authorizing this private-beta software work. See [the Cube record](virtual-sciencedojo-cube.md) for the design and limits. Existing 15 ground destinations, 10 study stations, authoritative movement/collision/seats and all existing learning/access systems remain in place. Upper planted terraces frame the atrium visually; they are not additional accessible floors.

Local checks passed 492 tests, scoped lint/type checking, both maintained browser transports, normal/reduced-motion/high-pixel/CPU-throttled render probes, production build and workbook trace exclusion. Browser checks cover bounded camera-relative input, first-person look/orbit/zoom, night selection, keyboard time slider, resumed local clock and unchanged private-course/safety/recovery paths. Wire checks retain the credential/course canaries and add camera/clock metadata canaries. Actual-scene checks confirm 70-degree eye-level perspective with hidden self avatar, aerial cutaway, daylight sun and nighttime moon/stars. Existing interpolation, stationary-pause and draw-call thresholds stay intact. The school props now batch into five columns plus global paths to keep the expanded environment within that budget.

Rendering remains demand driven and pauses while the Study Hub is open. The local clock updates by the minute; camera and sky settings remain client-only. Transparent glazing uses inexpensive tinting; no multipass transmission, live reflections or new external assets/services are used. Hosted checks for this iteration must be read separately. No hosted migration, production setting, paid service or real-learner admission changed. Expanded-Cube owner/device acceptance and G1–G9 remain pending.

Cube CI exposed an intermittent long pause around the low-device quality switch. Three.js includes `shadowMapEnabled` in its shader cache key, while mesh `receiveShadow` is an existing uniform. The fallback therefore keeps the renderer shadow pipeline/map cached and switches off receiving on school props as it reduces DPR. The graphics probe observes actual receiving meshes and requires the pipeline to remain enabled; existing continuity, draw-call and authoritative-target checks remain unchanged. This addresses the transition rather than loosening the movement buffer or test limits.

The warm-pipeline hosted run passed all 492 regressions and both browser flows. Its graphics probe passed continuity (42 positions, 3ms pause, 30 draw calls, stable pipeline) but the fixed 600ms terminal sample still preceded the last displayed target (3.915 versus 4). Terminal observation now waits for the actual displayed target with a three-second deadline and records its delay. It does not extend the walking measurement window, change the exact-target tolerance or weaken continuity limits. Current hosted results remain separate in draft PR 17.

The next hosted run settled exactly at 4 (519ms terminal observation) but recorded only 35 distinct positions, missing the unchanged >35 continuity limit. Its quality switch came after 3.07 seconds of the 4.54-second walk. The continuous-load detector now responds after 450ms of slow-frame average instead of 900ms, preserving intentional-idle and load-recovery exclusions. The existing behavioral test additionally requires a response within the first second of sustained ten-FPS animation. No movement, target-window or graphics assertion is weakened.

The earlier fallback passed the hosted normal probe (37 positions, 6ms pause), but the reduced-motion software runner still stalled around canvas resizing (1005ms target gap, 270ms stationary pause). Known software rasterizers now select the light profile at WebGL context creation, before movement; hardware/unknown contexts retain full initial quality and demand-aware adaptation. A transient renderer string chooses this local setting without retention or transmission. The dedicated stress fixture simulates only hardware classification, preserving its actual software rendering, fourfold pixels and CPU throttle; it explicitly requires a full-quality start and later reduction. Normal/reduced-motion probes follow actual production capability selection. All movement/graphics limits remain unchanged.

## Humanoid avatar refinement — owner request, 18 October 2026

The owner requested hands, legs and a little hair. The built-in character now has a torso, sleeves, forearms, rounded hands/head, thighs, lower legs, shoes, short hair and eyes, using three body draw calls and the existing constrained shirt palette. Walk animation derives from confirmed displayed distance with opposite arm/leg swings; large corrections reset it. Sitting bends the knees and reaches toward the keyboard. Reduced motion removes limb/bob animation, first person hides the self model, and the gait settles to a demand-rendered rest. No identity, appearance customization, networking fields, course behavior or hosted schema changed.

Local type/scoped lint and normal/reduced-motion/high-pixel/CPU-throttled scene checks passed unchanged limits: 159/176/89 distinct positions, 0/0/19ms pauses and 24/24/31 draw calls, exact final targets and no browser errors. An isolated actual-model portrait check passed standing stability, walking articulation, distinct seating, idle rendering stop and reduced-motion stillness. These are synthetic checks; new avatar owner acceptance and operational release gates remain pending. Current hosted verification stays in draft PR 17.

## FPS-style controls — owner request, 18 October 2026

Implemented the owner-authorized first-person mouse hover look and optional click-to-lock continuous turning. Mouse deltas change local camera refs and invalidate the scene without rerendering the whole campus client or adding wire fields. Escape pauses hover and releases lock; blur, tab hiding, Hub pause, view change, disconnect and scene cleanup release capture. Browser denial leaves hover/touch and visible controls available. Touch/orbit drag and accessible look/direction buttons remain. Camera facing survives a Hub pause.

E now interacts rather than turning: the nearest unoccupied study desk within the existing 2.1-unit server bound offers Sit; E while seated opens the existing Study Hub; after returning, E stands up. A visible contextual button provides the same touch/keyboard action. Repeated/modified E and events from child controls or course inputs do not trigger world actions. Closing the modal restores focus after closing it synchronously, retaining the mounted course and unsaved work.

Local verification passed **493 regressions**, both maintained browser transports, type/scoped lint and production build. Browser acceptance covers distant/repeated E, sit/use/stand, typing isolation, actual mouse lock/release, camera-relative walking and existing course/privacy/safety/recovery paths. Actual-scene normal/reduced-motion probes passed the unchanged movement/draw-call limits (152/145 distinct positions, 0/0ms stationary pauses, 24/24 draw calls), hover/locked rotation, Escape pause, view/Hub release and denied-lock fallback; the final normal probe additionally verifies facing retention across pause/resume. These are local synthetic Chrome/SwiftShader checks, not current-head hosted CI or hardware FPS evidence. The existing synthetic preview was refreshed in First person for owner review. No hosted schema, service, paid infrastructure or learner-release gate changed.

## Fullscreen school — owner request, 18 October 2026

The campus shell now fills the screen, including its existing camera controls, contextual E action and retained Study Hub. A compact in-world toolbar opens map, sky/look and desk panels; the existing safety shortcut and movement controls open their respective panels. Connection, presence, leave and exit remain available. Controls and course frames keep their mounted DOM. Closing a panel or fullscreen course returns focus to the scene.

Native fullscreen is requested from the explicit button. Unsupported/denied requests use the same viewport-filling layout. Browser fullscreen changes synchronize the UI; fallback Escape and the exit button restore page scrolling/focus. Outside siblings become temporarily inert in the fallback, then recover their earlier state. Mouse lock is released for panels and fullscreen transitions. Panels scroll within the available desktop/phone/landscape viewport. No camera/fullscreen preference enters world messages, and existing access/course/release boundaries remain intact.

Local verification passed 493 regressions, type/scoped lint, production build and both maintained browser transports with native/fallback fullscreen, the retained E/course loop and bounded desktop/390px phone/844px landscape panels. Final shared-SQL acceptance additionally checks Escape from the already-mounted course, quick browser-driven fullscreen exit, original page-position restoration and unobscured phone guidance. An isolated actual-hook Chromium check passed six native enter/exit cycles, including three quick browser-driven exits, restored scroll position, denied-native fallback/Escape and restored outside inert state. These remain local synthetic checks, not actual phone hardware, current-head hosted CI or a learner-release outcome.

Review fixed native exit sequencing and ownership before the queued fullscreen event, preventing a quick exit from leaving the viewport layout active. Exit restores scroll after the browser transition without focus scrolling. A retained iframe's Escape listener now reads the current scene/fullscreen state when choosing its return focus. Acceptance waits for the actual E interaction prompt after server arrival; snapshot delivery can lag by one shared-room cadence. Existing movement/graphics thresholds remain unchanged. The local synthetic preview was refreshed in fullscreen for owner review; all launch and hosted-schema gates remain separately recorded.

## Playable basketball — core implementation, 18 October 2026

The owner requested actually playable basketball at the sports court. The first software slice adds one deterministic authority for bounded pickup, ownership, lofted shots, rim/backboard/floor contacts, 2/3-point downward hoop crossings, out-of-bounds return and abandoned-ball cleanup. Colyseus uses this module directly; the Vercel service computes the same physics from database-time envelopes and commits against a shared SQL version, under the existing room lock with four bounded attempts. Idle courts require no game commit. Private service envelopes and versions never enter public snapshots. Per-viewer projections hide blocked ownership/held-ball location and expose only constrained game geometry and room totals. No course or player-performance data is added.

Migration 073 prepares RLS/service-only ephemeral state and CAS, preserves original admission/seat/movement authority behind its wrapper and requires `school-v2-basketball`. It has been applied only to disposable local PGlite fixtures. No hosted schema is changed or approved. Focused physics, ownership, CAS, RLS, blocking, lease and original movement/admission/seat checks passed locally; rendered controls and end-to-end acceptance follow in the next software slice.

## Playable basketball — completed private software, 18 October 2026

The sports court now has a shared visible ball, two real rims/nets and a responsive in-world score/power panel. E takes a reachable free ball; holding and releasing E charges and shoots. Pickup enters first person and faces a hoop. Mouse aim, a dotted local trajectory, selected-hoop power marker, native power slider, face-hoop buttons and a Shoot ball button support keyboard and touch play. The held ball stays visible below the eye-level rim view; peers see dribbling and a holding arm. Reduced motion uses a still held pose. Loose-ball distance and a gold floor ring aid retrieval at night. Fullscreen retains these controls alongside the existing school/course/safety panels.

Shots use server physics, including real floor/rim/backboard rebounds, retrievable misses and downward hoop crossings worth two or three points at either hoop. Totals belong to this court session, with no player statistics or rankings. Ownership is exclusive; only pickup has the recatch cooldown, so an owner can shoot or put down immediately. Disconnect, lease expiry, revocation, leaving court and an empty room release/reset state; duration handover retains legitimate ownership and rejects the old connection. Blocked ownership and its held-ball location are hidden. SQL catches allow the bounded advance of a falling ball before the versioned commit, without trusting client geometry. Paused Study Hub rendering keeps only a bounded confirmed ball-history window.

Local verification passed **501 tests**, scoped lint/type checking, production build/workbook traces and the clean service archive/install/process-restart check. Both complete browser transports passed ordinary school navigation to the court, pickup contention/repeat protection, actual E-charge/release misses, walking to retrieve a rebound, carry/dribble, a physical three-point basket with peer score agreement, immediate put-down, disconnect release, phone-width fullscreen and actual touch charge/release. Unit cases cover clean two/three-point crossings at both hoops, collisions, CAS/RLS/privacy and lifecycle/handover. Existing course retention, mouse look, fullscreen and safety/recovery checks remain in both flows.

Final normal actual-scene rendering passed 97 distinct walking positions, no stationary pause, 24 maximum walking draw calls and exact settlement. Its basketball probe saw 81 distinct ball positions, two rims/nets, a visible first-person held ball, local trajectory and a physical basket with 23 draw calls. Reduced-motion and high-pixel/8x-CPU stress court checks also passed (64/48 ball positions, 23 draw calls), retaining all previous continuity thresholds. Evidence/screenshots are retained with the local private review artifacts; these are synthetic Chromium/SwiftShader checks, not actual phone hardware, human basketball acceptance or current-head hosted CI.

Migration 073 and the school-v2-basketball revision were exercised only in disposable local PGlite fixtures. Neither 072 nor 073 was applied to a hosted database. Hosted switches stay disabled, PR 17 remains draft/unmerged, and operational/learner-release gates remain pending. This completes the requested playable private-beta software; hosted integration and subjective owner feedback remain separate.

## Mouse-look range and cursor continuity — 18 October 2026

The owner reported incomplete up/down/left/right looking and uneven control. First-person pitch previously stopped at ±1.35 radians (about 77°); it now reaches about ±89.4°, avoiding the pole singularity and camera flips. Captured mouse deltas still update the local camera immediately. When the mouse is uncaptured, the outer 40 CSS pixels of the scene continue turning with elapsed time, allowing complete rotations without running out of cursor travel. The centre retains direct movement. The hint identifies capture/edge/paused behavior and wraps within phone width.

Edge animation runs only while useful, stops at a vertical limit and cancels on capture, scene leave, Escape, focus/visibility loss, view changes, disconnect and Study Hub pause. A zero initial animation interval waits for the next frame rather than abandoning the turn. Pausing clears the old cursor baseline, so the first movement after returning cannot jump from coordinates recorded before the course opened. Touch/orbit, E interactions, existing movement authority and privacy boundaries stay intact; no camera state enters shared messages.

Local verification passed **501 regressions**, final scoped lint/type/production build and both full browser transports, retaining fullscreen, safety, course recovery, basketball and canary checks. Normal/reduced-motion actual-scene checks passed real captured full circles in both directions, near-vertical looking, denied-capture edge full turns and vertical range, exact input/render angle agreement, Escape/leave/Hub stopping and fresh cursor baselines. Original graphics limits remain unchanged: the completed initial normal/reduced probes recorded 75/118 distinct positions, zero stationary pauses and 24 draw calls, with exact authoritative settlement. A strengthened final normal probe additionally requires a genuinely new avatar snapshot before checking retained camera facing; its evidence is retained separately. Measurements remain synthetic local Chromium/SwiftShader, without hardware FPS, independent human acceptance or current-head hosted claims. No hosted schema, service configuration or learner-release gate changed.

The strengthened final normal probe also passed: 139 distinct walking positions, 0ms stationary pause, 24 draw calls, exact settlement and all mouse-range/pause/snapshot-facing assertions. The synthetic preview was refreshed in First person/Daylight at the library with the new guidance visible. This is preparation for owner review, without assuming subjective acceptance.

## Shot-power reduction and proposed basketball breaks — 18 October 2026

The owner reported that power rises while E is held but cannot be lowered without firing. Held power now cycles continuously up and down; the first rise keeps its original timing. Release E (or the touch button) fires at the current value. Escape cancels charging and retains the ball. The readout, meter, animated slider thumb, trajectory and final release use the same charge function/clock. The slider remains manually adjustable when not charging, with the existing Shoot ball alternative. Its value is owned by the HUD animation effect during charge, preventing unrelated React parent/snapshot updates from resetting the thumb to the earlier selected value.

Local verification passed **502 regressions**, final scoped lint/type/production build and clean service-only package/install/process-restart. Both complete browser transports passed holding E past the peak until power decreased while possession remained, Escape cancellation followed by E release without a shot, the existing deliberate miss/rebound/retrieval/shared physical basket flow and touch holding through decreasing power before release. Existing fullscreen, retained course, safety and wire checks passed. A separate final actual-HUD fixture sampled 206 frequent parent updates, with meter/slider difference at most 0.0025 (range-step rounding), working manual keyboard adjustment after cancellation and no uncaught errors. These are synthetic local browser checks; no human control acceptance, actual device or hosted integration outcome is inferred.

The requested [two/four-player match plan](virtual-sciencedojo-basketball-matches.md) proposes voluntary 1v1 and 2v2 ready-up, constrained teams, E/button passing, short games, shared authoritative scores/timer/check-in, safe leave/block/reconnect and a return to existing study. Current free play continues to use the shared physical ball. Team/match software is proposed for owner review and has not been implemented or tested. The plan retains ephemeral game data and existing admission/privacy/learner-release boundaries. No hosted schema, real learner admission or paid infrastructure changed.

## Camera-relative Orbit movement — 18 October 2026

The owner reported awkward Orbit WASD controls and asked for familiar GTA-style movement. Manual Orbit input now uses the same horizontal camera-relative transform as first person: W/S move forward/back through the view, A/D move across it, diagonals remain normalized and the existing authority turns the avatar toward travel. Automatic map routes retain their world-space coordinates. Orbit camera rotation now applies the requested heading in the rendered frame; the confirmed-pose buffer already smooths following, so a separate angular easing no longer makes the visible view lag the movement axes. Reduced-motion anchoring and other camera modes remain intact.

Held movement keys are tracked independently, including arrow-key aliases. Opposites cancel, releasing one restores the still-held key, and aliases do not double speed. Stop/focus/leave cleanup clears the whole set. Modified browser shortcuts are not consumed as walking. Visible instructions describe Orbit movement. No server movement/speed/seat/collision rule, world payload, camera privacy or course behavior is changed.

Local verification passed **503 regressions**, scoped lint/type and production build. Both full browser transports observed actual authoritative Orbit movement in all four directions after camera rotation, normalized diagonals, opposite-key cancellation, release/alias restoration and stopped input on control focus, alongside all existing course/safety/fullscreen/mouse-look/basketball/power checks and wire canaries. Actual-scene normal/reduced-motion probes additionally verified immediate per-frame heading agreement while dragging and receiving a moving avatar pose, visible third-person self and existing first-person/release behavior. They recorded 167/152 distinct walking positions, no stationary pause, 24 draw calls and exact settlement under the unchanged graphics thresholds. Heading error stayed below 1e-6 radians in the fixtures. These are local synthetic Chromium/SwiftShader observations, not hardware FPS, subjective owner acceptance or current-head hosted CI.

The synthetic preview was refreshed in connected Orbit/Daylight at the library, zoomed to the existing minimum distance with keyboard focus on the school. Prepared evidence is retained with the private review artifacts. No hosted schema, paid service or learner-release setting changed; the 1v1/2v2 match plan remains proposed separately.

## Living Cube — implementation, 19 October 2026

The owner authorized the [private software plan](virtual-sciencedojo-living-cube.md).
Three usable levels now contain 27 places and 20 existing-course workstations.
The two new floors add furnished classrooms, physics/botanical rooms, reading and
quiet-study lounges with rounded beanbags, planted commons, a conservatory and a
fitness studio. Their slabs, bounded atrium/outer edges, room walls and furniture
are represented in the school geometry. Cutaway/map views select a level; follow
and eye-level views track actual confirmed elevation. Upper computers reuse the
retained Study Hub and existing authorization. No live lesson broadcasting,
teacher dashboard or new entitlement is introduced.

Shift runs, Space jumps, C toggles crouching and Z toggles lying prone, with
visible Controls-panel alternatives. Authority owns speeds, jump timing and
posture. Confirmed vertical positions use the existing presentation buffer;
rendered crouch/prone bodies and eye heights change accordingly. Solid horizontal
footprints are shared with procedural furniture, walls and transport structures.
They remain solid during jumps; this slice does not add jumping onto furniture.
Prone clearance uses a larger conservative footprint, including its transition.
Wayfinding stands the character before following an ordinary bounded input route.

Every enclosed room has a physical focus-glass switch and an accessible room
button. E works near the switch; room buttons also work while seated. The server
requires the current room and floor, and peers share the resulting opaque panels.
This is visual screening: doorways remain open and presence remains shared, with
no confidential room, locked admission, chat or voice claim.

The glass lift, moving escalator and garden slide use E/button boarding and
server-owned journeys, with visible map routes to their connections. The lift
reaches any of the three floors, escalators connect adjacent floors in either
direction, and slides return from an upper floor to ground. Horizontal input,
seating and another boarding request cannot take over a journey. Floor/seat and
basketball checks are floor-aware. Disconnect/expiry removes travel with presence;
fresh admission returns safely to ground, while legitimate duration handover
retains authority. Journey paths/times stay private; peers receive only bounded
current geometry and fixed travel labels.

Migration 074 adds service-only focus state and collision geometry, extends the
existing protected presence row, and updates shared SQL authority and basketball
eligibility. The matching revision fails closed against older SQL. A short jump
edge survives replacement of its queued movement sample before the 200ms SQL tick;
the newest axes/sequence and one bounded jump remain. No hosted migration is
applied. Existing release flags, operating gates and the draft/unmerged PR remain
unchanged. Verification and review evidence follow below.

Review also split the upper slabs around real elevator/escalator openings, moved
the lift landing away from the slide exit, and kept those openings inaccessible
to ordinary walking. Lift travel boards horizontally at the external landing,
rises inside the glass shaft and exits onto a solid destination landing. Its
boarding canopies sit outside the shaft, and landing-height glass has doorway
openings. The slide descends in the direction of its actual ramp. Geometry tests
check the openings and safe landings in addition to authority/SQL parity.

The floor subtraction now also opens the middle-level passage for the top slide.
Renderer voids and authoritative shaft obstacles share one fixed blueprint, with
a regression requiring actual slab openings and solid boarding/exit landings.

## Living Cube — verification and private review, 19 October 2026

A clean snapshot of committed campus source `6ab25c8` passed **513 regressions**,
excluding concurrent unrelated business edits in the shared working directory.
Type checking, scoped lint, production build, private-workbook build traces and
the explicit-file clean service package/install/process-restart check passed
locally. The service archive includes the shared plan, geometry and locomotion
modules and retains its manifest/checksum verification. No environment/private
files were added to its allowlist.

Both complete synthetic browser transports passed the existing retained-course,
safety/recovery, fullscreen, mouse/Orbit and basketball flows plus the three-level
tour. A final focused Colyseus tour additionally passed the corrected E boarding,
external lift landing, upper classroom screening, escalator, level-2 Study Hub and
slide return. The shared-SQL full tour observed the same authoritative behavior.
Navigation uses actual ordinary inputs and map routes, without test teleports.
Protected handshakes and all other world frames retain their separate wire audit;
no course path/title, answer canary or admission ticket enters the shared frames.

Normal/reduced-motion/throttled actual-scene probes retained all previous limits:
84/109/48 distinct walking positions, 0/0/23ms stationary pauses,
27 maximum walking draw calls, exact authoritative settlement and no browser
errors. Rendered eye/body checks passed crouch, horizontal prone, confirmed jump
elevation, five opaque room panels and rounded beanbags. The normal probe was
repeated after consolidating all transport openings. These remain synthetic local
Chromium/SwiftShader observations, not hardware FPS or human usability evidence.

Review corrected short jump edges lost by input coalescing, phone controls that
overlaid existing actions, prone clearance near furniture, floor-label overlap,
disabled contextual transport buttons and solid slabs across transport paths.
The maintained browser check now supports a focused floor-tour mode; its two full
CI steps have a bounded 15-minute allowance for the additional walking coverage.
Movement and graphics assertions are unchanged. Screenshots/evidence retain the
existing seven-day hosted artifact policy; no current-head hosted run is claimed
by these local results.

The synthetic preview was refreshed and actually traversed to the level-2 Quiet
study lounge, left in Orbit/Daylight for owner review. Evidence is retained in the
ignored private review record and prepared local artifacts. No new-feature owner
acceptance, live lesson operation, hosted migration or G1–G9 completion is inferred.
072/073/074 remain local-only; the PR remains draft and the release controls stay
disabled on hosted environments. The existing platform/course boundary remains.

## Pixelation correction — 19 October 2026

The owner reported blocky graphics. Read-only inspection of the actual preview
found a 351 × 264 framebuffer stretched over about 781 × 588 CSS pixels on a
DPR-2 display: the earlier permanent DPR-0.45 fallback caused the visible softness.
The correction plan preserves the motion fallback, restores detail at rest, and
provides an explicit local quality choice instead of silently forcing more GPU
work during all movement.

Auto now returns to DPR 1 after 600ms without continuous animation; walking,
camera settling and mouse look use the selected/adaptive motion profile. Sharp
uses the display ratio capped at 2 and Performance keeps DPR 0.45. These controls
work with pointer/keyboard and inside fullscreen Sky & view. The choice belongs
only to the mounted browser client; no graphics preference, renderer string or
camera data enters shared state. The cached shadow pipeline, course-frame pause,
300ms confirmed interpolation and existing acceptance limits are retained.

All 68 campus regressions, scoped lint/type checks and the local production build
passed. Focused two-peer UI checks passed on both maintained transports, including
fullscreen, actual framebuffer changes and the shared-frame privacy audit. Actual
scene checks passed normal, reduced-motion and CPU-throttled modes with the
unchanged walking/pause/draw-call limits; the final normal run additionally checks
mouse-only motion fallback and recovery. DPR-2 Sharp retained resolution through
confirmed movement, and Auto restored DPR 1 afterward. These are synthetic local
Chrome/SwiftShader checks, not intended-device FPS or new learner-release evidence.

The refreshed owner preview was inspected with Sharp selected: its actual canvas
is now 1562 × 1176 over the same display area. Sharp may reduce frame rate on slow
devices; Auto remains the default. Owner visual/performance acceptance is pending.
No schema, hosted settings, course rules, operational gates or unrelated platform
features changed. Evidence is retained with the private local review artifacts;
no current-head hosted CI result is claimed.

## Owner account and embedded dashboard — 19 October 2026

The owner clarified that the requested account is their own, for owner testing
before a separate student test. The read-only account preflight is private; it
found an active, email-confirmed student account and existing course-pilot tables,
but no campus flag/membership/presence/game/focus tables in the connected database.
Zero-row GET requests verified missing-table errors; HEAD results that omitted
error bodies were discarded. No hosted account, schema, flag or configuration
was changed. A real-account invitation alone cannot make this backend usable.

The authorized local software work adds **My dashboard** within the desk's Study
Hub. It embeds the existing server-selected dashboard destination, keeps the
dashboard and course documents mounted independently, retains drafts across
Escape/school pauses/tool switches, and preserves the external-tab shortcuts.
Normal dashboard links require configured release/service settings, the beta flag
and successful admitted `campus_self` identity. Editable metadata and RPC failure
cannot grant the entry. Inside the owned dashboard frame the campus link is hidden
to prevent a nested world. All dashboard routes now exclude marketing tag
initialization/events under the shared private-study boundary.

Local campus regressions, scoped lint/type checks and the production build passed.
Focused two-peer checks on both transports verified actual E desk access,
dashboard/course draft retention, keyboard isolation, phone panel fit, native
fullscreen containment, Escape return and clean shared-frame canaries. These use
synthetic local dashboards/courses; they are not evidence that the owner's hosted
account has entered the world. The ordinary full acceptance keeps its existing
movement/course/recovery assertions; focused dashboard mode skips unrelated timed
direction activation and long campus/game tours. Its first attempt hit the
existing fixed-time direction threshold under concurrent test load; this was not
reported as a dashboard failure or resolved by relaxing the full-test assertion.

The [owner-review plan](virtual-sciencedojo-owner-review.md) prepares exact
070–074 application, protected Preview configuration, private eligibility review,
only the owner invitation, actual account tests and rollback. Existing staging
approvals are not approval to modify this separate database. Hosted activation,
real account evidence, separate-student admission and G1–G9 remain pending.

## Approved owner-account preparation and runtime repair — 19 October 2026

The owner approved the [protected review plan](virtual-sciencedojo-owner-review.md).
The separately bound account database had the required 067 helpers and no campus
schema. A scoped schema/authorization baseline was saved privately; automatic
full backups were unavailable, and this baseline is not a learner-data backup.
Exact 070–074 source statements passed a local atomic rehearsal and were applied
in one guarded transaction. An initial editor attempt failed SQL parsing before
any transaction began; the complete editor model was replaced and copy-verified
against the reviewed source before the successful run. Do not replay these
non-idempotent migrations. Showcase staging and the production application
configuration/deployment were unchanged.

The actual service RPC then returned PostgreSQL 21000, “UPDATE requires a WHERE
clause.” The target's safety guard exposed two unqualified singleton focus-glass
updates in 074. Forward migration [075](../sql/075_campus_focus_safe_updates.sql)
adds only explicit `room='library'` predicates through source-guarded function
replacement, preserving ownership, grants, settings and the existing safe-update
protection. It passed local tests and was applied to this same approved target.
The real service RPC now returns HTTP 200 with `{ended:true}` for an unknown
connection. Anonymous runtime execution remains denied (42501); direct runtime
table access by the service remains forbidden, as designed. Eleven campus tables
have RLS, three restrictive flag-write policies remain, and the Living Cube
revision is present. The beta is disabled, with zero members, staff and presence.
Exact hashes, scoped baseline, catalog and API outcomes remain private.

All **70 campus regressions** passed locally, including the repair's room filters
and preserved outer/internal function grants. A hosted quality failure on 82242ea
occurred when direction activation started immediately after asynchronous native
fullscreen focus restoration. The browser harness now waits for actual fullscreen,
scroll-style and focus restoration before retaining the original movement
assertions. The full shared-SQL browser flow passed locally, including the court,
three floors, retained learning, safety and wire checks. Original-transport focused
graphics/fullscreen and direction activation also passed. A first focused attempt
timed out waiting for Auto idle resolution while other checks ran; that failure
is retained, and the isolated rerun passed without changing the quality behavior
or assertion. Actual hosted status is recorded separately; local results do not
establish current-head hosted integration.

Vercel two-factor sign-in is pending, so the protected branch Preview is not yet
configured for this environment. Adult/EU/EEA confirmation is pending; no owner
invitation or release flag was enabled and no notice accepted on their behalf.
Approval is retained. Actual owner-account interaction, a separate student and
G1–G9 remain pending. No paid infrastructure or public protection bypass was used.

## Protected owner Preview configuration — 19 October 2026

The owner completed Vercel sign-in and directly confirmed adulthood and EU/EEA
residence. Evidence is recorded privately as owner self-confirmation, without
claiming independent identity-document verification. An action-time automatic
review required confirmation before saving the hosting settings; the owner
explicitly approved both settings, and the subsequent save succeeded.
`CAMPUS_TRANSPORT=vercel` and `CAMPUS_PILOT_READY=true` are scoped only to the beta
Git branch's protected Preview. Existing server credentials are inherited;
no credential values, production settings, public bypass or paid plan changed.
The matching e83cd0c source deployment is rebuilding with these settings. An
unauthenticated external request still redirects to Vercel sign-in; the signed-in
browser reaches the ScienceDojo login page. Owner invitation activation and
actual account notice/dashboard/desk interaction remain pending at this checkpoint.

The actual initial hosted quality attempt on e83cd0c failed its first-person
movement assertion after pointer capture; its failure screenshot shows the view
at the upper pitch limit. Cron and the Vercel build passed. Retained evidence was
inspected and one unchanged hosted quality rerun requested. Do not infer that the
rerun passed or that the failure is a confirmed application defect from that
screenshot. Local software checks and the earlier scoped owner library acceptance
remain distinct from this hosted outcome and the new real-account review.

The configured protected Preview subsequently reached **Ready** on e83cd0c
(build 3m 40s). After a fresh account/environment/eligibility baseline check,
only the owner's existing account was provisioned as an enabled member, with an
audit entry and the campus flag enabled for this review. Independent post-write
queries verify one member, zero staff, unchanged active student profile and no
accepted notice. Service identity still returns null before personal notice
acceptance; an unknown runtime connection returns an ended session. No staff/admin
role, course entitlement or notice acceptance was granted by the agent. The
Preview's ScienceDojo login is open for the account holder; actual sidebar,
notice, school, dashboard/desk and leave interaction remain pending. Disable the
owner membership/flag and restore the two branch-only settings when this owner
review ends; do not mistake the enabled owner review for a separate learner launch.
The hosted quality rerun is still in progress at this checkpoint.

## Hosted movement responsiveness — owner report, 19 October 2026

The owner said they like the experience but movement feels slightly slow/laggy.
This is scoped experience feedback, not evidence of a complete independent study
walkthrough. Inspection found a periodic browser input wait, fixed-slot SQL polling
that skipped a further interval after slow RPCs, and Follow camera easing behind
an already-buffered character.

The correction sends/coalesces changed input within 50ms, suppresses idle repeats
and keeps active refreshes at 100ms. Its 20-input/second bound stays below the
unchanged total 30-message socket guard. Sequence numbers are allocated on actual
send; pending work samples the latest intent and disposal cancels delayed input.
The shared-SQL handler resumes at the next eligible instant after a slow call,
keeping one in-flight operation, the existing 200ms minimum start interval,
bounded latest-input/action queues and deferred cleanup. Follow view directly
tracks the interpolated avatar; exterior/overview easing and reduced-motion
anchoring remain. The 300ms confirmed-pose buffer, authoritative speed/collision,
seats, posture/journey rules and graphics thresholds are unchanged. No prediction,
new protocol fields, schema, hosting configuration or learning entitlement change.

All **74 campus regressions** passed locally, including deterministic input
start/stop/reversal/rate tests and actual shared-SQL/WebSocket slow-response timing,
no-overlap and cadence checks. The first new slow-response test assumed a zero
spawn and timed out; its assertion now uses displacement from the fixture's
actual spawn, with the same timing/cadence requirements. Scoped lint and type
checking passed before final browser/render/build verification. The actual-scene
probe adds Follow/character position agreement without changing its original
continuity, exact-target, buffer or draw-call assertions. Final full transport,
scene/build and hosted application outcomes are recorded below when available.

The complete original-transport school/course/basketball walkthrough passed.
Normal/reduced-motion actual-scene checks also passed; Follow position error was
zero and the original continuity/exact-target/draw-call limits held. A clean
committed-snapshot webpack production build passed, excluding concurrent business
work. The new render probe initially referenced an undefined CLI flag variable;
that fixture typo was corrected without changing application behavior.

The first shared browser run then exposed a pre-existing stationary-ball redraw
classification defect: its repeated identical samples counted as continuous motion,
keeping Auto at its movement pixel ratio while idle. A dedicated actual-scene
repeated-idle-snapshot regression reproduced the failure before repair. The court
now requests continuous flight frames only while buffered confirmed positions
differ from the displayed ball; held dribble remains separately gated by reduced
motion. Idle snapshots still invalidate a frame, but do not trigger continuous
animation. Normal/reduced-motion scene checks, an isolated original entry check,
the complete shared browser flow and the final build are being verified against
this follow-up. No graphics assertion or movement threshold was relaxed.

### Final responsiveness verification and protected Preview

The final original-transport entry/graphics check and the complete shared-SQL
browser flow passed after the idle repair. Combined with the complete original
walkthrough and both normal/reduced-motion actual-scene probes, these retain real
E/touch movement, run/jump/crouch/prone, furniture/glass, all three journeys,
basketball power/rebounds/scoring, retained dashboard/course drafts, safety,
recovery and full world-frame/handshake canary checks. Normal/reduced probes
recorded 103/118 distinct walking positions, zero stationary pauses and 27 draw
calls; Follow tracking error was zero in the normal probe, reduced-motion
anchoring held, and repeated stationary ball snapshots kept Auto sharp. These
are synthetic local Chrome/SwiftShader results, not intended-device FPS.

All 74 campus regressions, final scoped lint/type checks and the clean application
production build passed. The final shared run made 3,165 local fixture SQL calls
(p95 3ms, maximum 13ms); those are not hosted latency/throughput/cost measurements.
The generated clean-build copy was removed after success; logs, hashes and browser
artifacts remain in private evidence and the maintained seven-day CI artifacts.

Application revision **7c43836** was pushed to the existing draft beta branch and
its Vercel deployment check succeeded. The same protected Preview link serves the
update; an unauthenticated request still redirects to Vercel sign-in. Hosted
quality/cron workflows were still in progress at the last check, so no completed
hosted CI result is inferred. No schema, account/course authorization, hosting
setting, production deployment or operational gate changed. The owner's retest
of this lag correction remains pending. Refresh the existing private Preview to
load its new client bundle; the existing Shift run control remains available.
## Games Lounge — 19 October 2026

The owner approved the prepared Games Lounge implementation plan. Local feature
commits `9d77e5b` and `ff5cb72`, followed by verified corrections through
`4d376a2`, implement two-player Four in a Row and two-to-four-
player Dots & Boxes in the existing Level 2 Sky Commons. Existing table surfaces
and beanbags are reused, with thin instanced board markings. Exact SQL collision
parity and the existing movement revision remain unchanged. E and an accessible
Games Lounge button open the native fullscreen-compatible game dialog; existing
course/dashboard documents remain mounted.

Joining deliberately shares the previewed existing picture and chosen game
username only with fellow table participants. Account/campus identity mapping
stays private. An authenticated same-origin image proxy restricts origin/path,
redirects, raster signatures, bytes and time; unsupported/missing images use
initials. No profile information or new game data enters either world transport.
Game reports/blocks resolve opaque game IDs privately through existing safety
operations. Direct reads of game records are denied to anonymous, authenticated
and service roles; the privileged application uses a service-only RPC.

Migration 076 has not been applied to a hosted environment by this work. It adds two RLS
tables, serialized membership/capacity/lease/CAS operations and a restricted
switch-off cleanup trigger. The latter clears private names and boards even
when the disabled campus switch prevents application admission. Ready intents
are independent within a round; moves/start retain strict version checks. A
short client scheduling delay protects fast bonus turns without weakening the
server command limit. Incomplete games are abandoned on lost participants,
not recorded as fabricated wins. Empty games reset; idle lease cleanup is lazy
on the next RPC and is not a physical backup/log-retention guarantee.

Actual local evidence on the feature revision:

- All 81 campus regressions passed. The seven board-game tests execute the real
  rules, application request factory and SQL/role grants. They cover every win
  direction/draw, two-box capture, 2/3/4-player rotation, scores/ties, unanimous
  rematch, concurrent capacity/Ready/move/version behavior, origin/payload
  validation, cross-table/unjoined photo denial, blocks/reports, revocation,
  expiration and transactional switch-off/deletion cleanup. A native unfinished
  upstream-image response is closed immediately on rejection.
- Both maintained transports completed two- and four-browser game walkthroughs,
  including a real E table entry, rendered distinct synthetic profile pictures
  and usernames, keyboard Four in a Row, touch-enabled phone-context Dots &
  Boxes, a completed physical board with equal shared results, a rematch,
  fullscreen, no horizontal phone overflow, retained unsent course input and
  report/block/complete table cleanup, plus a delayed repeated-touch school exit
  that releases the final seat once and preserves fresh admission. This is loopback fixture evidence, not
  real sign-in, actual phone hardware or friend usability.
- Final original/shared game checks observed 2,042 original and 1,219 shared world frames, plus five exact protected
  admission handshakes checked separately. Existing course/dashboard
  canaries plus game usernames, profile paths and synthetic account IDs were
  absent from observed world traffic. Exact shared-transport admission
  handshakes were checked separately; credentials were not saved as evidence.
- The clean application build passed from an isolated tracked-source snapshot
  with only campus edits overlaid. No concurrent business edits or environment
  files were copied. The first macOS temporary-path alias build compiled and
  generated pages but failed standalone tracing; the canonical temporary-path
  build completed. Scoped type/lint checks passed, including the final avatar correction; the clean
  final build matches all 12 changed application files by SHA-256.
- Clean service release/install/actual-process restart passed on `ff5cb72` with
  the original explicit file allowlist. The later avatar-only correction does
  not change the service package contents. This is not a deployed service test.

The graphics check also reproduced a pre-existing final-step scheduling defect:
the final confirmed pose could consume the last requested movement frame while
the visible gait was still active. Auto then restored full resolution before
that gait finished and briefly lowered it again on a subsequent snapshot. The
avatar now requests frames for walking as well as settling. Keep all continuity,
draw-call, 300ms interpolation, reduced-motion and shadow thresholds unchanged.
The probe retains exact idle frame counts/ratios. Final graphics outcomes are recorded
in the completion addendum below.

Hosted activation and an actual friend walkthrough are still pending. No source
was pushed/deployed for this phase, no hosted SQL/settings/memberships changed,
and no friend was invited. The existing owner-only review remains as previously
approved. Follow the Games Lounge activation sequence for exact 076 approval,
named accounts, deployment-protection access, eligibility/notices and the
applicable operating requirements. The added browser CI commands retain
synthetic evidence for seven days; local checks do not establish hosted CI.


### Local verification complete; hosted activation pending

All requested game software is implemented locally. Final code includes the
one-shot game exit guard and closed rejected avatar streams. Both new game
walkthroughs passed on both transports (9/10 checks, real keyboard/touch, distinct
rendered synthetic pictures/usernames, safe delayed exit and fresh admission).
The existing full campus walkthroughs also passed: 23 original / 28 shared
checks, retaining courses/dashboard work, controls, basketball, disconnect and
handover/revocation recovery, all three floors and ordinary lift/escalator/slide
journeys. Their additional wire checks observed 8,199 / 5,005 world frames and
ten protected shared handshakes. These are fixture observations, not hosted
sessions or real-account acceptance.

Final normal/reduced-motion actual-scene checks passed in headed Chrome with
SwiftShader: 111/118 distinct walking positions, no observed stationary pause,
27 maximum draw calls, exact terminal pose, retained shadow pipeline, idle Auto
DPR 1 throughout all eight sampled stationary frames, full native mouse capture,
turns/range/release/denial fallback, first-person eye/self hiding, sky, manual
quality, physical basketball and Living Cube posture/glass/levels. No numerical
hardware FPS claim follows. This macOS headless environment rejected native
capture with a recorded `WrongDocumentError`; a Playwright maintainer documents
this [native macOS view-focus failure](https://github.com/microsoft/playwright/issues/20956).
The explicit `--headed` test mode keeps every capture assertion; it does not mock
success or weaken default CI. The probe now waits for its requested camera reset
to actually render before measuring full circles. Browser drivers foreground the
active student after interacting with a peer, preserving all timed input checks.

Final type checking, scoped lint and the clean webpack application build passed.
The isolated build matches all 12 changed application files by SHA-256 and leaves
concurrent business work out. The unchanged service-only release contents retain
the earlier clean-install/restart proof. All synthetic processes/contexts closed
and fixture game rows were cleared; no hosted account/data cleanup was necessary
because this phase used no hosted fixtures. Exact evidence and final source hashes
are in ignored `.campus-private/board-games-evidence.json`; CI fixture retention
is seven days, including native-capture failure details. Hosted CI was not run for
these local commits.

The remote beta branch remains on `7c43836`; no source/configuration/schema or
membership was published by this work. Apply 076 and publish the game update only
after its separate environment-specific approval. Named friend accounts,
applicable eligibility/notices/operating decisions, deployment-protection access
and the real friend walkthrough remain pending. The full goal is still active.

## Games Lounge — approved hosted owner update, 19 October 2026

The owner replied “approve” to the pending 076/protected Preview activation and
WortQuest software plan. Read-only duplicate/prerequisite checks found no 076
objects, existing admission/RLS and one owner membership with zero staff. Exact
076 was applied in the verified owner-review database. The complete editor
document was compared with the reviewed source before successful execution.
Both game tables have RLS; direct anon/authenticated/service table access is
denied; only the service role may execute the game RPC. An actual service call
for an unadmitted opaque identity returns Campus access required, anonymous RPC
and direct-table requests are denied, and the Preview remains Vercel-protected.
No friend account, staff authority, course grant, production app/settings, paid
plan or hosting bypass was added. Private activation evidence retains the hash
and actual results; do not replay 076.

The tested committed board-games source `1358e11` was pushed to the beta branch
and Vercel reports Ready/Preview (deployment `uTgUHiwvp4aFqXxgsxBucM9NdLcS`).
PR #17 is still open/draft/unmerged. Hosted quality checks for that new revision
were not observed; previous-run success is not current-head evidence. Real
signed-in multiplayer games and a human friend walkthrough remain pending.

The owner also approved the WortQuest software plan. Core vocabulary authority
and content are committed as `4977946`; the UI/browser checks as `373e431`.
The new 077 migration is forward-only local preparation, not covered by the
076 hosted SQL approval. Local vocabulary verification subsequently completed as recorded below. The
owner confirmed their friends are 18+; exact account emails and EU/EEA residence
confirmation remain pending, along with deployment access and operating gates.

### WortQuest — completed local verification

The game contains 180 original starter cards across A1/A2/B1/B2/C1/C2, with
English explanations, German examples/translations, grammar forms, shuffled
four-option ten-card quizzes, 0–100 points, private missed-word review and
unanimous friend rematches. Pictures/names/scores appear above the friend quiz.
All 85 campus regressions, both full two/four-browser vocabulary flows and both
existing board-game browser flows passed. The final full original flow also
checks an incorrect answer yields a 90-point total/private review; the shared
flow checks all six levels and shared score agreement. Focused checks on both
transports cover the final physical side-table E location without replaying the
already completed matches. No geometry, collision/SQL parity, speed, pose buffer,
render thresholds or world protocol changed.

Original/shared full vocabulary evidence inspected 3,024/1,421 world frames and
four separately validated shared admission handshakes without identity/course/
quiz canaries. Original/shared board games inspected 2,390/1,246 frames and five
shared handshakes without canaries. These are loopback synthetic observations,
not hosted throughput, device FPS or human acceptance. Course input remained
mounted, and game members/answers were cleared on empty/switch off; level resets
to A1. Final-answer retries do not rescore, reviewers get only their own choices,
and migration drift/replay guards passed.

Type/scoped lint and the isolated clean webpack build passed. Build archive
`39aaa61` matches all six application files by SHA-256. Test-only commit
`00a957a` adds a focused location check; it changes no build application file.
No local environment file was copied into the archive. The explicit service
release allowlist is unchanged from `ff5cb72`; the earlier clean service
release/restart remains its evidence rather than a new application-wide test.
The maintained CI commands include both vocabulary transports and seven-day
evidence retention. Current local commits are not hosted CI or hosted games
integration evidence. The retained local preview is synthetic/loopback-only and
shows an A1 card with its English explanation; no owner notice was accepted.

Read-only hosted preflight confirms the exact reviewed 076 game authority body,
no 077 helper, zero game members, one existing owner membership and zero staff.
077 and the vocabulary source remain local pending their separate approval. The
owner's completed 076/protected board-games approval must not be requested or
applied again. Private source hashes, actual outputs and evidence paths are in
`.campus-private/wortquest-evidence.json`. Specific friends/EU/EEA confirmation,
deployment access, actual multiplayer/human results and applicable operating
gates remain pending. Keep the full requested friend-test goal incomplete.

### Shared database security maintenance

Shared profile/flag authorization and storage controls are documented in [security hardening](security-hardening.md), with independent forward migrations 078/079 and role-based SQL regressions. These changes do not apply WortQuest migration 077, admit friends, change learning data or establish a new campus release gate. Use the ignored security-advisor baseline/final/API records for environment-specific execution evidence; do not copy deployed authorization findings into public PR descriptions.


### Approved WortQuest publication and two-account owner review — 19 October 2026

The owner approved the concrete 077/Preview step, then selected their existing
owner account and admin account for the initial test. Exact guarded 077 source
was compared with the SQL editor and applied once after current-state preflight;
076 was not replayed. RLS/direct-access/service-RPC/private-helper restrictions
passed afterward. Live denied requests confirmed anonymous/unadmitted game
access and direct helper execution remain unavailable. Seven focused SQL/deck
regressions passed before deployment; the broader local evidence retains its
previously recorded scope.

Source `c0bf028` was pushed to the beta branch and Vercel deployment
`2xsPK9PjtT6HCgxsbEMpMR9hubML` reached Ready as Preview. All six application hashes
still match the earlier clean build. Vercel/Preview-comment checks passed for
this head; no hosted full quality/cron success was observed. PR #17 remains
open/draft/unmerged. No production application/settings, paid plan or bypass was
changed; the approved owner database did receive 077.

The owner explicitly confirmed that the identified existing admin account is
also theirs and uses their existing 18+/EU/EEA self-confirmation. Its one new
campus invitation and audit entry were applied in a guarded transaction. Existing
student/admin roles and course permissions are unchanged; no campus staff was
granted. The owner account can read the live WortQuest authority. The newly
invited account remains denied world/game access until the owner accepts its
notice; the agent did not accept it. Record exact identity/baseline/rollback in
ignored private files, not public PR material.

The hosted sign-in page is prepared with a campus return path. Human sign-in,
new-account notice acceptance and an actual shared match remain pending. Use
two isolated browser sessions/devices for the two accounts. Later real friends
still need specifically identified accounts and applicable admission/operating
evidence. The original full friend-test goal stays open.

### Approved room games and nearby invitations — 20 October 2026

The owner requested games inside a room and a meet/invite/play flow, then approved
[the concrete software phase](virtual-sciencedojo-game-invitations.md). Application
revision `f56eeb2` is implemented locally. The existing website/dashboard and
hosted beta remain within their prior scope; migration 080 is not hosted and no
branch push/deployment, environment, invitation, notice or role change occurred.

Games require the real Level 2 lounge/table position, correct floor, a live
admitted connection and explicit Join. Find Games Lounge locates/focuses the map
and guides ordinary walking/lift use. A nearby player's fixed invitation carries
only campus pseudonyms; replies last 30 seconds and accepted pairs reserve table
capacity for two minutes. Profiles are shared only after voluntary Join. Phone/
keyboard/fullscreen controls reuse the exclusive school tools panel. Fresh
invitations clear an earlier expiry message. Course/dashboard documents and
unsent input survive game tools, school pauses and recovery.

Private HTTP credentials bind game requests to the admitted connection without
entering world frames or photo URLs. Vercel rotates them atomically during a
legitimate duration handover while preserving the existing match/participant
identities. Fresh admission requires a new Join; stale keys and late callbacks
cannot affect a new generation. Colyseus uses authenticated, fresh, monotonic
service context. This bounded cross-service snapshot is not a distributed atomic
transaction. Explicit SQL Leave and exact-generation Colyseus departure clean
up without requiring a remaining browser poll. Outage fallback is logical TTL/
leases plus next-activity/switch cleanup, not a physical-erasure claim.

080 keeps all five new tables under RLS and denies direct application-role
access. Preserved legacy authorities and helpers remain private. Stable member
key-share locks precede room/game locks; the feature-switch lock prevents a late
insert escaping switch-off cleanup. The guarded rollback restores the preserved
previous authorities, empties only game/invitation/key state and refuses an
unreviewed replay. Neither forward nor rollback SQL was applied to a host.

Verification (synthetic/local; retain exact source scopes):

- 98 campus regressions, including 13 focused room/invitation authority cases,
  pass. Type checking and scoped lint pass. The isolated tracked-source Next.js
  build and private-workbook trace guard pass; all 15 changed application sources
  match the final build. Clean service install/actual-process restart passes,
  with all 15 release sources unchanged through the final revision.
- Both complete game transports pass decline/real expiry, phone keyboard
  acceptance, ground-floor walking, E lift to level 2, reserved-table arrival,
  explicit Join, profile pictures, two-player win/rematch, four-player play,
  touch/fullscreen, room exit, safety and retained learning input. The Vercel
  game run also preserves the open board/participant identities across actual
  duration renewal. Focused invitation rechecks cover the final expiry-message
  correction and release both joined places; they do not repeat match scoring.
- Both vocabulary transports pass A1–C2 solo scoring, two/four-player points/
  ties, private answers/review, pictures, touch/fullscreen and retained course
  work. Those runs precede only the final invitation-panel/message refinement;
  keep their source hashes rather than claiming an unchanged full application.
- Both complete school transports pass recovery, retained dashboard/course
  input, native mouse capture, fullscreen/phone, camera-relative movement,
  basketball and real three-level lift/escalator/slide journeys. The Vercel run
  includes the final fullscreen panel; the earlier Colyseus run precedes that
  panel-only refinement. Final game checks exercise that panel on both paths.
- Normal/reduced actual-scene continuity passes unchanged thresholds: 100/92
  distinct positions, no stationary pause, 27 maximum draw calls, exact target,
  stable shadow pipeline and sharp idle Auto. Full graphics commands later
  fail at native capture with WrongDocumentError; computer-use inventory reports
  the Mac locked. These partial graphics results do not constitute full camera
  probe passes, despite earlier full-school native capture passing. Preserve
  every native capture assertion and the prior macOS guidance above.

Private evidence records exact outputs, source hashes/differences, screenshots,
SQL checksums and the seven-day synthetic CI retention scope. No current-head
hosted quality run, real friend match, intended-device FPS, independent human
usability or G1–G9 completion is established. The protected beta still has only
the two previously approved owner accounts and zero campus staff; personal
notice acceptance remains the owner's action.

[The protected Preview procedure](virtual-sciencedojo-game-invitations-hosted.md)
is prepared for one separate environment-specific approval: exact guarded 080
in the existing owner-review database, then only the matching protected branch
Preview. No production application, new accounts, staff/course authority, paid
plan, environment change or protection bypass is included. Keep PR #17 draft/
unmerged. The local synthetic loopback preview is for owner review only.

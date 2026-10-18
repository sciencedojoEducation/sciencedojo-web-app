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

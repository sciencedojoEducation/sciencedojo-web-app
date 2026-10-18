# sciencedojo. Vercel beta transport

17 October 2026. The optional shared-SQL transport is implemented and tested
locally and in the bounded staging checks below. Migration 071 is applied only
to showcase staging after explicit owner approval. This does not authorize
learner admission. Preserve the existing website, dashboards and course player.

## How it works

Set `CAMPUS_TRANSPORT=vercel` only in the intended environment. The existing
admission route issues the same one-use ticket and returns a same-origin socket
path. `/api/campus/socket` independently checks the account, invitation, accepted
notice, release control and exact secure Origin. A database-backed upgrade claim
permits one WebSocket attempt per issued ticket; existing issuance permits at most
one new ticket per member every three seconds across instances.

The first WSS message is an exact admission handshake. Only its SHA-256 digest
enters the service-only runtime function. The socket is bound to the independently
verified campus identity, not a caller-supplied account. Later messages accept
only bounded movement intent, fixed seats/actions and refresh. Payloads are capped
at 2 KiB, messages at 30/second, pending actions at four and concurrent DB work at
one call per socket. The latest movement input is coalesced, not queued indefinitely.

Migration [071](../sql/071_campus_vercel_presence.sql) adds two RLS-protected,
non-public runtime tables, an upgrade marker on the existing private ticket table
and restricted functions. Browsers cannot read or mutate runtime tables or call
the runtime function. A singleton transaction lock serializes capacity, duplicate
identity and seat ownership across instances. Database time governs normalized
three-unit/second movement, world bounds, replay protection, a 350ms stale-input
stop and 15-second connection leases. Every runtime transaction removes expired
or ineligible presence; every snapshot applies the existing viewer's block rules.
Only the established snapshot fields leave the server. Connection ownership,
leases, input queues, account mappings and learning data are excluded.

Each socket requests fresh admission at 200 seconds. A new account-bound one-use
ticket can transfer an existing presence row after 180 seconds, preserving its
position, seat and coarse state while invalidating the old connection. Old
cleanup cannot delete the replacement. The UI retains its existing iframe,
including unsaved input. A socket closes at 240 seconds if renewal fails; the
route's maximum duration is 300 seconds. Any failure still provides leave/direct
course access and permits fresh admission. No unbounded reconnect loop runs.
Renewal admission requests have a ten-second abort deadline; opening their
replacement socket has a separate twelve-second deadline. Leaving cancels both.
A stalled admission response cannot indefinitely suppress notification that the
old socket closed or leave a stale connected/seat display.
Initial admission uses the same ten-second HTTP deadline and can be cancelled
with Leave while connecting. Cancelled attempts cannot later overwrite the new
UI state. Server-native ping/pong checks run every three seconds and terminate
an unresponsive connection after the six-second pong allowance is exceeded at a
check; continued database polling is not treated as browser liveness. A visible
browser also watches for missing application snapshots for twelve seconds,
checking once a second, and ends the connection locally if the channel is silent.
Hidden tabs receive a fresh grace period when visible again, while native pongs
avoid depending on throttled tab JavaScript for server liveness. Bounded actual Vercel
network/proxy checks are recorded below; retain both independent liveness paths.

The 200ms SQL interval implies up to approximately 50 runtime RPC calls/second
for ten healthy connected users, plus admission/cleanup calls. This is a design
bound, not measured hosted throughput, availability or a cost estimate. Measure
the selected staging deployment before a live-service decision. Presence stores
current state, not a movement-history table; database backups/logging and physical
retention after an abrupt final disconnect still require the data-handling review.

## Verified locally

The maintained SQL tests execute the actual migrations and role grants in
PGlite. Independent WebSocket handlers share that runtime and cover seats,
capacity, blocking, revocation, admission/messaging/byte/time limits, delayed-join
cleanup and ownership transfer. PGlite serializes its client transactions; this
does not establish real hosted Postgres contention behavior.

`npm run test:campus:vercel:browser` runs the existing library UI against the
actual shared runtime using synthetic auth/course fixtures. It covers walking,
tap/keyboard controls, dashboard access, study/save/retention, removal, offline
Hub reopening, fresh admission, report/block, phone layout and a forced duration
handover retaining the seat and unsaved course input.
The failure regression also stalls renewal HTTP entirely, closes the old socket,
and requires bounded disconnection, cleared presence, retained offline input and
fresh admission. Injected RPC outage checks cover sanitized connection failure,
failed immediate cleanup and release of expired seat ownership after recovery.
Additional failure controls first reproduced an unresponsive peer retaining its
seat and a silent application channel leaving stale browser presence. Regressions
now require server heartbeat cleanup, retention of a healthy peer, client-side
silent-channel detection and cancellable/bounded initial entry with retained
course input. These are loopback fault injections, not a real hosted outage.
Handshake shape and
fixture-issued ticket digests are checked separately; all other wire frames are
scanned for credentials and learning canaries. No handshake credentials enter
saved evidence. The quality workflow runs this check alongside the original
Colyseus browser acceptance and retains both sets of synthetic evidence for seven
days. Local fixture auth is not proof of hosted Next.js/Supabase integration.

## Approved staging verification — 17 October 2026

1. **071 is now applied** to **sciencedojo-showcase-staging**. Inspect the
   existing schema and original flags before continuation; do not replay
   067/070/071. Do not touch production or unrelated 068/069.
2. Configure only branch-specific **Preview** environment values in the existing
   ScienceDojo Vercel project: the staging Supabase URL, staging anon key and
   staging service-role credential; `CAMPUS_TRANSPORT=vercel`; and
   `CAMPUS_PILOT_READY=true` for disposable QA. Keep credentials out of Git, chat,
   screenshots and logs. Changing the project's default/Production environment
   is outside this staging procedure. Confirm the actual branch scoping before
   saving any credential. No additional hosting plan, store or subscription is
   required by this implementation.
3. Verify the deployment and branch-scoped staging configuration before
   provisioning fixtures, then confirm staging-only sign-in. Use newly owned
   synthetic confirmed accounts, explicit fixture-only staff/membership and one
   disposable authorized course. Record original flags and temporarily change
   only the approved staging flags. Never copy production learner data.
4. Exercise actual session-bound WSS admission, duplicate tabs, shared snapshots
   across instances, simultaneous seat/capacity attempts, blocking/reporting,
   staff removal, switch-off and DB failure, duration transfer, course save/reload
   and iframe recovery. Inspect actual wire payloads, TLS/CSP/framing, RPC latency
   and database load. The earlier expiring connection probe proves transport only.
5. Close sessions; remove only the owned fixture accounts/course/data/staff and
   presence; restore exact original flags. Remove the temporary branch-only
   staging credentials/release values or leave the release control explicitly
   false after QA. Verify cleanup, RLS, disabled admission and successful current
   hosted checks. Keep detailed account/host evidence private.

The owner explicitly approved 071, the branch-scoped staging credentials
(including the private server key), and disposable QA with cleanup/restoration.
The migration applied successfully, with RLS, service-only runtime execution and
denied direct table access verified through SQL and actual API requests.

### Actual staging outcome

Preview software head `280319a` built successfully with the five temporary
branch-only values. A newly owned staging account signed in through the actual
Next.js Preview, entered the TLS/WSS room, walked using tap controls, sat at a
desk and opened its authorized existing Academy course. The deployed 3D library
was visually verified. The course reached 100%; completion persisted across a
fresh staging login and remained hidden from the peer. Unsent notes survived Hub
close/reopen, actual connection handover, staff removal and switch-off. The
existing course still saved those notes offline; a fresh login reloaded them,
while the peer could not read them. Campus removal did not remove course access.

The actual 200-second duration renewal changed server connection ownership after
approximately 203 seconds, retaining the desk, studying state and course input.
A second hosted tab was denied as already connected. Hosted report/block actions,
trusted staging staff report resolution, revocation, denied readmission, fresh
standing admission and switch-off all passed. A direct hosted-SQL observer
inspected 488 snapshots without a credential or learning-canary violation; this
was a database observer, not a second Vercel WebSocket client.

Concurrent calls against actual staging Postgres enforced the ten-place cap
(including the connected Preview learner) and one owner for simultaneous seat
claims. The successful bounded run made 57 RPC calls, with p95 146ms and maximum
153ms measured at the local API caller. This small check does not establish
sustained ten-client throughput, server-only SQL latency, cost or outage behavior.

All fourteen disposable accounts, the owned course/data and temporary authority
were removed; both original flags were restored off. Final checks confirmed all
eight campus tables have RLS, immutable-version protection is enabled and owned
fixtures/presence are absent. All five temporary branch-only Preview overrides
were removed; original shared/Production variables were unchanged. Detailed
manifests, timings and account/host evidence remain ignored and private.

### Bounded backend update-rate and contention checks

A subsequent isolated staging run used ten newly owned synthetic members. It
called the actual shared runtime through the staging API with the same 200ms
interval and one-call-per-peer limit as the server. A busy peer skipped its next
tick rather than building a queue. The three stages completed 1,891 world updates
with no RPC errors, lost presence, invalid snapshot fields or credential/learning
canary violations:

| Occupants | Duration | Target updates/sec | Measured updates/sec | API p95 / p99 / max |
| --- | --- | --- | --- | --- |
| 1 | 10 seconds | 5 | 5.00 | 108 / 132 / 132ms |
| 5 | 15 seconds | 25 | 24.20 | 137 / 540 / 594ms |
| 10 | 30 seconds | 50 | 49.18 | 128 / 228 / 470ms |

A separate guarded SQL transaction held only the synthetic library's lock row.
The first seven-second pulse produced a bounded update timeout and cleanup
recovered as the lock released. An eleven-second pulse then produced an actual
update timeout after 2,091ms and failed cleanup after 3,984ms. The recovering
second SQL peer remained present; the stopped peer's seat disappeared through
lease expiry after 15,214ms from its last healthy response. No persistent schema,
role, timeout configuration, course data or deployment protection changed.

These three backend runs used seventeen disposable accounts in total. All were
removed, their temporary staff/memberships/audit/tickets cleaned and passwords
scrubbed; both original flags were restored off. Final SQL verified no remaining
owned accounts, campus memberships or presence, all eight campus tables with RLS
and enabled immutable-version protection.

This is short, direct-SQL staging evidence. It is not ten Vercel WebSocket clients,
a database-wide/network outage, server-only SQL timing, a long session, a cost
estimate or intended-device/human acceptance. Those scopes remain distinct.

### Actual multi-user Preview checks

The owner subsequently approved a temporary share link for the single staging
Preview, including Vercel Hobby's disclosed replacement of any existing shareable
link. Project-wide protection was retained. Actual Next.js/Supabase/WSS clients
then verified ten connected occupants for 30 seconds and rejection of an
eleventh, shared two-peer snapshots, duplicate-account denial, one owner in a
simultaneous seat race, block filtering with retained occupied-seat state,
reporting, genuine duration handover and old-owner invalidation. The handover
check completed after about 209 seconds with the seat/studying state retained.
Staff revocation removed the peer and denied new admission; switch-off stopped
world updates and denied admission. Both raw close events were delivered.

A corrected isolated native-pong fault first required both healthy peers to see
the occupied seat. Stopping pongs released it after 7,118ms while the healthy
peers remained. Raw close arrived after 16,942ms. Keep the browser snapshot
watchdog: authoritative room cleanup and delivery of a proxy close event are
separate observations. Actual hosted UI revocation also displayed disconnection,
zero peers and disabled controls; its 3D library was visually verified.

Across the bounded core attempts/continuation and isolated fault, 5,030 inbound
world frames and 32 separately formed handshakes were checked, with no
credential/learning-canary violations. Early scratch attempts needed a full lease
cleanup wait, a closer movement target and an occupied-seat observation barrier;
the private evidence retains those limitations. No application code changed.
This is a short ten-client check, not endurance/cost, intended-device or human
acceptance. Earlier separate real-course persistence evidence remains applicable;
this run created no course or learning data.

All thirteen new disposable accounts, memberships, staff authority, reports,
audit and tickets were removed, passwords scrubbed and original flags restored
off. Final SQL confirmed zero memberships/presence/owned auth/staff, all eight
campus tables with RLS and enabled immutable-version protection. The temporary
share link was revoked; plain access, its old URL and its previously issued
cookie each redirected to Vercel sign-in. Access secrets were scrubbed. The five
branch overrides remain absent; no schema, course or environment value changed.

Broader hosted outage/endurance/cost assessment, intended devices, independent
human usability and G1–G9 remain pending. No production change, paid service or
real-learner admission occurred; the beta remains closed.

## Cutover and rollback

For any later approved live cutover, disable admission first and let existing
presence close. Switching to Vercel makes the old Colyseus callback fail closed;
do not run two authorities for one live cohort. The Vercel path needs no
`CAMPUS_SERVICE_KEY`, `CAMPUS_PUBLIC_URL` or `CAMPUS_INTERNAL_URL`; do not send an
obsolete service key to the previous host. SQL eligibility revocation takes
effect at the next shared runtime step.

Rollback keeps course data intact: disable admission, close/expire current
presence and restore the reviewed transport configuration. Keep 071 additive;
do not drop tables during an incident merely to roll back app code. Use the
separate service release guide for the default Colyseus transport. Restore
admission only after that specific deployment passes the agreed gates.

## Whole-school follow-up — 18 October 2026

Migration 072 prepares the expanded school bounds, solid wall/door physics and ten study stations while preserving existing admission/privacy controls. It is tested in disposable local PGlite only and is not applied to any hosted database. The new socket consumer requires its server-only `school-v1` revision and rejects older runtimes. Before any hosted whole-school QA, separately review/apply 072 under actual owner authorization; do not replay 067/070/071 or reuse cleaned fixtures. The beta remains closed and prior actual staging evidence belongs to the older library software revision.

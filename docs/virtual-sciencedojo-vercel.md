# sciencedojo. Vercel beta transport

17 October 2026. The optional shared-SQL transport is implemented and tested
locally. It has not been applied to staging or production, and does not authorize
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
Handshake shape and
fixture-issued ticket digests are checked separately; all other wire frames are
scanned for credentials and learning canaries. No handshake credentials enter
saved evidence. The quality workflow runs this check alongside the original
Colyseus browser acceptance and retains both sets of synthetic evidence for seven
days. Local fixture auth is not proof of hosted Next.js/Supabase integration.

## Proposed staging verification, after scoped approval

1. Apply **only 071** to **sciencedojo-showcase-staging**, after inspecting the
   actual schema and original flags. 067/070 are already applied and must not be
   replayed. Do not touch production or unrelated 068/069.
2. Configure only branch-specific **Preview** environment values in the existing
   ScienceDojo Vercel project: the staging Supabase URL, staging anon key and
   staging service-role credential; `CAMPUS_TRANSPORT=vercel`; and
   `CAMPUS_PILOT_READY=true` for disposable QA. Keep credentials out of Git, chat,
   screenshots and logs. Changing the project's default/Production environment
   is outside this staging procedure. Confirm the actual branch scoping before
   saving any credential. No additional hosting plan, store or subscription is
   required by this implementation.
3. Verify the preview uses staging before provisioning fixtures. Use newly owned
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

Your earlier explicit database approval covered staging migrations 067/070.
071 and the scoped staging credentials in Vercel must be separately approved
before this procedure is performed. Legal/vendor/staffing/device/pilot release
gates remain unchanged and are not satisfied by synthetic tests.

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

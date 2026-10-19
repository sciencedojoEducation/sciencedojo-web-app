# sciencedojo. campus service release

This package contains the separate presence service and its shared protocol/world files.
It does not contain the Next.js app, Supabase credentials, course data or real accounts.
Use one process/replica for the ten-connection pilot. A release package is not pilot approval.

## Prepare and inspect

From the repository, use Node.js 22.18+ and an available `tar` command:

```sh
npm run campus:package -- /absolute/output/campus-service.tar.gz
```

The command refuses to overwrite an existing output file and prints the archive SHA-256.
It copies an explicit file list and writes per-file hashes in `release-manifest.json`.
The manifest records the checkout's HEAD and the actual packaged bytes; local edits can
differ from that commit. Prepare operator releases from a reviewed clean revision and
compare the outer archive hash through the approved release channel. For CI artifacts,
select a successful quality run; artifacts from a failed run are diagnostic only. The manifest is
an integrity check, not a signature or independent source-authenticity proof.

After transferring the reviewed archive to the approved host, extract into an empty
release directory. Keep the `lib/campus` and `services/campus-server` relative paths:

```sh
tar -xzf /absolute/path/campus-service.tar.gz -C /absolute/empty/release
cd /absolute/empty/release
node verify-release.mjs
npm ci --omit=dev --prefix services/campus-server
node verify-release.mjs
```

Only the service lockfile/dependencies are needed. A root Next.js installation is not
required on this host. Node.js and OS/runtime maintenance remain the operator's job.

## Configure and operate after approval

Provision one reviewed EU/EEA host only after a provider/account, numerical spending
ceiling, operator and shutdown owner are approved. Complete the repository's Phase 0
gates and intended-deployment checks before admitting learners. Store the actual
environment outside the release directory with owner-only access (for example mode
0600), using `.env.example` as the field reference. Set the exact approved HTTPS web
origin and a new private service secret of at least 32 characters. Share that secret
only with the Next.js server; the room process needs no database credential.

```sh
node --env-file=/absolute/private/campus.env --experimental-strip-types services/campus-server/index.mjs
```

Run as a dedicated unprivileged account under the host's process supervisor. Leave
the bind address at loopback when using a TLS reverse proxy on the same host. Expose
only the approved HTTPS/WSS endpoint; proxy WebSocket upgrades and preserve the web
Origin header. Do not add an unauthenticated room monitor. Review proxy/access/error
logging, request limits, timeouts, TLS and firewall settings for the selected host;
this archive does not install or verify those controls.

`GET /health` returning `{"ready":true}` proves the library process exists. It does
not prove app/database availability, admission eligibility or pilot readiness.
Check actual admission with approved disposable fixtures before release. The web
app needs matching `CAMPUS_SERVICE_KEY`, exact `CAMPUS_PUBLIC_URL` (WSS), and the
`CAMPUS_INTERNAL_URL` used for staff removal; rebuild the web app for its CSP. Keep
`CAMPUS_PILOT_READY` and `virtual_campus_enabled` off until release gates pass.

SIGTERM/SIGINT gracefully close the service. Restart drops all presence/seat state;
clients require fresh admission. Existing course work remains in the web app.
Before an upgrade or rollback, close admission with the campus controls, stop the
service, select the reviewed release directory, verify/install its lockfile, and
restart. Rehearse actual shutdown/restart and course recovery on the target host.
No database migration, account creation, feature switch or hosting purchase is
performed by the packager or verifier.

### Private room-game context and departure cleanup

Room games use the existing service credential for the application's private
`GET /games-context` callback. It returns bounded live poses, connection
ownership and a derived game-credential hash; it is never a browser/world feed.
The application rechecks fresh context for each game/invitation request. Keep
this endpoint behind the same TLS/origin/service controls as removal; never
publish its response or credential in a URL, snapshot or log.

The service also notifies `/api/campus/service` with the fixed `depart` operation
and the departed opaque campus ID/current connection. Migration 080 provides its
service-only, generation-bound cleanup. Public world removal is immediate;
graceful disposal awaits bounded callbacks (two-second HTTP deadline). If an
application/database outage prevents cleanup, membership/meeting eligibility
still expires, and the next admitted game request/switch-off clears stale state.
This is logical expiry, not a promise of immediate erasure during an outage.

Use the matching application/080 schema for this local service revision. The
owner-review hosted procedure currently targets the existing Vercel transport;
this package does not authorize a new hosted Colyseus service or infrastructure.

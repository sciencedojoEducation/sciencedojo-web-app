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
- Build isolation: existing Next.js layout retained; the service has its own lockfile. CI installs both dependency sets and matching Chromium, runs the synthetic beta browser acceptance before the build, and retains fixture screenshots/evidence for seven days. Root type checking excludes the service directory. Hosted CI execution remains unverified until an actual run completes.

The SQL migration is prepared and tested in a disposable database. It has **not** been applied to the production Supabase project. No paid service has been provisioned, production setting enabled or real learner invited.

## Evidence and limits

| Check | Evidence on 17 October |
| --- | --- |
| Protocol and SQL | Nine tests passed against actual simulation and PGlite policies: replay/invalid inputs, bounded movement, seat contention, block filtering, identity projection, capacity, one-use/expiry/service-only tickets, metadata spoofing, RLS, report limit, revocation, suspension, disabled flag, actual byte limits and bounded admission counters |
| Actual multiplayer | `tests/campus-server.test.mjs` passed with real Colyseus/WebSocket clients: foreign origin and invalid credentials denied, unauthorized room creation denied, two peers/seat contention, per-client filtering, periodic revocation and ten-client capacity. A subsequent regression case also passed for duplicate reservations: a failed duplicate cannot remove the avatar owned by the successful session |
| Browser fixture | `scripts/check-campus-browser.mjs` passed in two Chromium contexts: keyboard walk/sit, notice/Study Hub, Escape from inside the frame and focus return, synthetic course save, unsaved input retained across close/reopen, stand, forced WebSocket loss with retained course input and cleaned-up presence, block/unblock/report, leave/fresh admission and 390px layout without overflow or uncaught browser errors |
| Production build | Before the dashboard-shortcut clarification, `npm run build` passed: compile, TypeScript and 147 static pages; all campus page/API/admin routes were included. The beta update compiled and passed TypeScript, but current full-build verification was stopped after repeated existing public-data gateway timeouts during prerendering; it is not recorded as a successful current-source build. Current `npm run typecheck`, scoped ESLint and `npm run lint:latency` passed. Earlier supported Webpack/default builds passed after a restricted-environment stall |
| Regression | Latest `npm test` passed **450 tests**, zero failures/skips, including thirteen campus tests |
| Existing workbook protection | `node scripts/verify-aspekte-build.mjs` passed: no private source or static-public files in server traces |
| Built disabled app | Loopback production server: `/campus` displayed closed state; admission/safety/service returned 403 without release configuration; a foreign-origin admission was denied |
| Preservation | The pre-existing business backlog edit retained SHA-256 `0cf8997b87ddc6c511861116bc87c6c15fddb4bafe3bcc162135b3ec3c169c1b`; B3/S1/R1 and approved business scope/pricing were not changed |
| Dependency check | Separate service installation reported zero advisories. A shared root `ws` advisory was removed by updating within the existing range to 8.22.0. The root audit still reports 21 other advisories; their applicability and upgrades remain part of the broader production review, not a claim of security certification |

Browser screenshots were visually inspected on desktop and 390px phone width. The browser fixture uses synthetic admission and course responses around the real UI/room service. It does **not** prove live Supabase signup, enrolled Academy saves, production framing/CSP, moderator staffing, real-device performance or independent usability. Local canary/projection tests do not replace deployed-network inspection. No 50-user or 60fps claim is made.

Reproduce software checks from the repository root using Node 22.18+:

```sh
npm ci
npm ci --prefix services/campus-server
npm run test:campus
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

For controlled local testing against a separately approved development database, set a loopback `ws://` origin in development, apply migration 070 to that database only, and use synthetic verified accounts. Do not copy production learner records into fixtures. Production requires WSS/HTTPS and an owner-approved spend ceiling before procurement.

## Before a real pilot

1. Resolve G1–G7 with actual operator, safety lead, adult/residence verification policy, privacy notices and lawful bases, vendor/region/transfer review, retention/export/deletion arrangements, staffed supervision/report response targets and a numerical spending ceiling. Store private evidence outside the repository. No retention period or legal outcome is invented by this implementation.
2. Review/apply migration 070 once through the normal migration process; it leaves the flag disabled. Confirm existing enrollment/progress and RLS behavior on that target database. Do not create course listings or change the ten-place cap to fit the campus cohort.
3. Deploy the web app and one approved EU/EEA room service with exact origins, TLS, request/log controls, bounded infrastructure counts and health checks. Check the actual application framing policy and CSP. Confirm no credentials, profile identity or course/answer/progress data enter room traffic or infrastructure/marketing logs.
4. Select the published pilot course and test verified disposable accounts through real signup/login, reviewed membership, notice acceptance, admission, enrollment/denial/waitlist, save/reload and simultaneous study. Verify actual learner progress directly through existing course routes. Test revocation, blocking/report resolution, service loss/restart, no-WebGL fallback, reduced motion, keyboard/modal behavior and intended devices. Remove disposable accounts afterward.
5. Review results against V1–V11 and G8. Rehearse report/block/removal and shutdown with named staff; record actual response times. Resolve defects before recording owner approval/cohort/schedule under G9. Only then enable the release setting and flag for invited learners.

For removal, revoke the member in the admin screen. Next.js attempts immediate service removal; otherwise the healthy service checks eligibility every ten seconds with a five-second timeout and removes presence within 15 seconds. A failed authorization check also removes the participant. Existing course authorization operates independently.

For shutdown, disable `virtual_campus_enabled` and unset `CAMPUS_PILOT_READY`; active sessions are removed by the next check. Stop the room service immediately when needed. Leave existing Academy routes and data intact. Rotate the service key in both processes if compromised; outstanding tickets expire after 60 seconds, and fresh issuance clears that member's previous ticket.

## Remaining project work

The adult presence-only software is locally reviewable. The real-course/deployment and operational checks above remain incomplete; the project is not launch-complete. Nature/weather, custom avatars, extra zones, text/voice, tutor lectures, autoscaling/50-player hardening and the broader roadmap remain deferred by the agreed pilot decisions. They have not been implemented or silently declared complete.

### Continuation evidence — 17 October 2026

- Added the maintained two-user browser check to `.github/workflows/quality.yml`, with a ten-minute check timeout and seven-day synthetic screenshot/evidence artifacts under the runner's temporary directory. The installed Playwright CLI confirms the browser-install options; the workflow parses successfully. Its browser command passed locally with `TMPDIR=/private/tmp`, generating the expected four screenshots and `evidence.json`; 320 inspected WebSocket frames contained no dashboard/course paths, course title, answer canary or issued tickets. This is local workflow preparation, not a claim that GitHub Actions has executed. A bounded read-only primary public-feature-flags request still returned HTTP 504; the separately configured showcase staging health check still failed `ENOTFOUND`. No full-build retry, staging resume, migration or production modification was attempted in this continuation.
- Delivery is recorded on `codex/virtual-sciencedojo-beta`: foundation commit `32f7c98`, followed by the library/privacy implementation and CI/documentation commits. Publishing and hosted CI must be checked against the actual pull request/run; a draft review does not establish deployment or authorize admission. No campus migration or release enablement is recorded here. The pre-existing business-backlog edit remains outside these commits.
- Owner's beta clarification is implemented: the existing platform is retained, the optional entry/header are labelled beta (including phone width), two library desks use laptop models, and the Study Hub links to the signed-in account's existing role dashboard in a separate tab. The maintained browser fixture verified that the dashboard tab has no opener, the library/modal remain open, course work survives close/disconnect, and the launcher fits 390px width. Desktop and phone screenshots were inspected. The wire audit inspected 340 frames without finding the dashboard/course paths, course title, answer canary or issued tickets. This uses a synthetic dashboard destination, not live account-data integration. The current regression suite passed all 450 tests; type checking, scoped ESLint and latency lint passed. The updated production build compiled and passed TypeScript but its prerender phase encountered existing public-data gateway timeouts; final build outcome is recorded below when available.
- Final beta-update build outcome: compilation and TypeScript passed, then existing public-data requests returned repeated gateway timeouts and several prerender routes exceeded 60 seconds. After identifying the exact local `next build` process, it was deliberately stopped (exit 130). Full current-source production-build verification remains incomplete; the local synthetic preview continues running. No backend, infrastructure or production data was changed to bypass this failure.
- Closed the previously recorded SPA tracking gap with `CampusDocumentBoundary`, shared route classification and an event guard. Three new tests cover exact/nested/auth-return paths, document-reload decisions and suppression of manual study events through an existing `gtag`. The real browser fixture also proves that a simulated tracked public document reloads before any campus UI mounts, and the earlier globals are absent afterward. Existing walk/sit/study, Escape/focus, block/report and forced-disconnect checks still pass. At that point the production build, type check and scoped/latency lint passed; the subsequent beta-update build limitation is recorded above.
- The configured showcase staging API failed DNS resolution (`ENOTFOUND`); no schema or user data was read from it. A read-only Supabase dashboard check then identified the cause: **sciencedojo-showcase-staging** is paused. Its dashboard reports **eu-west-2 / London**. This is staging evidence only; it does not establish the production project's region or settle G5's transfer review.
- The dashboard states that resuming this project updates Postgres to the newest version. Resume approval was requested because it restores a hosted database/API and changes the backend version. No resume, upgrade, migration, account creation or production change was performed. Real-service integration remains pending that approval and schema inspection; no successful live course or human pilot result is inferred.
- Further local acceptance audit: the browser study flow's actual WebSocket frames were inspected for its course title/path, a typed answer canary and issued admission tickets. An initial run inspected 291 frames; a combined run inspected 297, with none of those values found. The combined run also proved the no-WebGL direct-Academy fallback without an uncaught error and exercised the authenticated HTTP moderator-removal endpoint, preserving open course input, cleaning up presence and permitting fresh admission. These checks are now retained in the maintained browser-check script. They are fixture evidence for parts of V4/V9/V10, not proof of production traffic, live enrollment, moderator staffing or hardware performance.

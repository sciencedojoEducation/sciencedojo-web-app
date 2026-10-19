# sciencedojo. — protected owner-account review

Approved by the owner on 19 October 2026. **Owner invitation enabled; personal sign-in and notice acceptance pending.** This plan
covers the owner's existing account, not admission of a separate student cohort.
Account identifiers, environment details and read-only evidence are held in
`.campus-private/owner-account-preflight.json`, outside Git and public PR material.

## Prepared experience

An admitted account sees **Optional beta → Virtual ScienceDojo · Beta** in its
existing dashboard when the campus service is configured and enabled. Its normal
role, permissions, learning and payments remain unchanged. At a Cube computer:

1. Press E to sit, then E to open Study Hub.
2. Select **My dashboard** to use the existing personal dashboard in the computer
   panel, or **My courses** for existing authorized courses.
3. Return to the school with the visible button or Escape. Opened dashboard and
   course documents remain mounted, retaining unsent input across tool switches
   and school pauses. External-tab shortcuts remain available.

Dashboard documents exclude marketing tag initialization/events, and the campus
link is hidden within the owned dashboard frame to avoid opening a nested world.
Only existing coarse presence enters the room; private dashboard input never does.

## Initial read-only findings

The specified account exists, has the student role, is not suspended and has a
confirmed email. This does not establish age/residence review or pilot readiness.
Zero-row GET requests found Academy/course-pilot tables but no campus membership,
presence, lock, basketball or focus-glass tables in the connected database. The
campus feature flag was absent. An invitation alone cannot activate this backend.

The earlier showcase-staging approvals and applied migrations do not authorize
changes to this separate account database. Do not reapply schemas to staging or
infer that missing tables alone verify every prerequisite, policy or backup.

## Approved hosted scope

- Use a **protected branch Preview** in the existing ScienceDojo Vercel project,
  with the database containing the owner's existing account. Do not merge the
  draft PR, change the production deployment, create a share-link bypass or buy
  infrastructure. Changes to this account database are still hosted schema
  changes, even though the app runs as a Preview.
- First verify the deployment/database binding, migration history, prerequisite
  functions/policies and available recovery point. Reuse completed 067; leave
  unrelated 068/069 and existing course records alone. Abort if the actual
  catalog differs from the reviewed plan.
- Apply only these reviewed, non-idempotent campus migrations in order:
  [070](../sql/070_virtual_campus.sql),
  [071](../sql/071_campus_vercel_presence.sql),
  [072](../sql/072_campus_school.sql),
  [073](../sql/073_campus_basketball.sql),
  [074](../sql/074_campus_living_cube.sql).
  Record exact source hashes and results privately. Verify RLS, service-only
  grants, restrictive flag policies and the `school-v3-living-cube` revision.
- Reuse only appropriately configured server credentials. Set branch-specific
  `CAMPUS_TRANSPORT=vercel` and `CAMPUS_PILOT_READY=true` for the protected Preview;
  preserve other environments and original values. Do not expose server keys in
  browser bundles, documents, logs or world traffic.
- After the owner's adult/EU/EEA eligibility review is recorded, admit **only the
  specified existing account** and enable the campus flag for this bounded owner
  review. Do not grant an admin/staff role, fabricate verification evidence or
  accept the notice on the account holder's behalf. The owner signs in and
  accepts the existing notice through the application.
- Verify the real account's sidebar entry, admission, E desk interaction,
  embedded dashboard identity, course authorization, unsent-input retention,
  fullscreen, leave/revocation and clean shared frames. Record actual outcomes;
  synthetic local tests do not establish this hosted result.

## End and rollback

Revoke the owner invitation and turn the campus flag/release controls off at the
end of a bounded review or on failure; restore original branch configuration.
Verify denied fresh admission and expired/cleared presence. Keep the additive
schema available for reviewed recovery; do not drop tables as a casual rollback.
Existing dashboard/course access must keep working. Retain private evidence
without credentials. G1–G9 and separate-student admission remain pending.

## Execution — 19 October 2026

The owner approved this plan. The target binding and existing 067 prerequisites
were verified privately. No automatic full backup was available; a scoped
schema/authorization baseline was saved, explicitly not a learner-data backup.
Exact 070–074 source statements were rehearsed locally and then applied in one
guarded transaction. Post-application checks found 11 campus tables with RLS,
three restrictive flag-write policies, the Living Cube revision and service-only
runtime execution. At this schema checkpoint the beta flag remained false, with zero members/staff/presence.

The first service RPC exposed the target's safe-update protection rejecting two
unqualified focus-glass updates in 074. A bounded forward repair is prepared in
[075](../sql/075_campus_focus_safe_updates.sql), adding explicit singleton room
predicates while retaining the guard and existing function grants/settings.
It was applied after local checks. The actual service RPC now returns HTTP 200
with an ended session for an unknown connection; anonymous execution remains
denied and direct service-table access remains forbidden. At that repair checkpoint the flag remained off
and membership empty; the later owner activation is recorded below.

The owner completed Vercel sign-in and explicitly confirmed adulthood and
EU/EEA residence. After a required action-time confirmation, the two campus
variables were saved only for the beta branch's protected Preview. No credentials,
production settings or public protection bypass were changed. Its matching
source revision rebuilt successfully. The owner-only invitation and campus flag
are enabled, with one member and zero campus staff. The existing student profile
and course authorization are unchanged. The owner has not yet signed in to this
Preview or accepted the notice; service identity remains unavailable until that
acceptance. Actual school/dashboard/desk interaction remains pending.
Approval is retained; do not request the completed confirmations again.

## Movement responsiveness follow-up

The owner likes the experience but reported slow/lagging movement. The correction
is deployed on the same protected Preview at application revision 7c43836: bounded
prompt input, no skipped polling interval after slow RPCs, direct Follow tracking
and no continuous redraw for stationary ball snapshots. The 300ms confirmed-pose
buffer and authoritative speed/collision rules remain. All 74 campus regressions,
both browser transport flows, normal/reduced rendering, type/lint and clean build
passed locally; the Vercel deployment passed, while hosted quality/cron completion
and subjective owner acceptance were not inferred. Refresh this Preview to retest.
This does not establish a full independent study walkthrough or learner launch.


## Initial games review using two owner accounts

On 19 October the owner chose their existing admin account alongside their
already admitted owner account, and confirmed both belong to them under the same
previous 18+/EU/EEA self-confirmation. The additional invitation is enabled;
no campus staff or course access was granted and its notice remains for the owner
to accept. WortQuest 077 and protected Preview publication were separately
approved and completed. Read the vocabulary guide/runbook and ignored private
identity/rollback evidence. Actual sign-in/shared-game testing remains a human
step, using separate browser sessions/devices. Later friends and a wider release
remain separately scoped.

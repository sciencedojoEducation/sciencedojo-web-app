# sciencedojo. — room games protected Preview procedure

20 October 2026. Prepared for a separate environment-specific owner approval.
**Not executed.** Local software approval does not approve this hosted step.

Scope: apply exactly forward migration
[`080_campus_room_games_invitations.sql`](../sql/080_campus_room_games_invitations.sql)
to the already approved owner-review account database, then publish this reviewed
beta branch to its existing protected Vercel Preview. No production application,
showcase database, new infrastructure, bypass, account invitation, notice
acceptance, course/role/staff change or environment setting is included.

## Action-time preflight

Use the ignored owner-review records to verify the account database and Preview
identity privately. Read the actual schema/function definitions, current owner
membership/notice state, campus flags, RLS/grants and deployed application source.
The migration guards require exact reviewed 077 game and 075 runtime bodies;
unknown differences mean stop and inspect, not bypass a guard or replay an older
migration. All prior 070–079 statements remain historical/applied.

Retain a scoped authorization/schema baseline privately. This is not a full
learner-data backup. Capture the exact reviewed SQL checksum and compare the
entire SQL editor content before Run. Use one guarded transaction and the exact
saved file, never a truncated paste. Explain the brief game maintenance window:
the previous Preview cannot use the new location gate until the matching app is
Ready. Current owners should leave games/school before the change and reload
with fresh admission afterward.

## Approved-step sequence, if the owner approves this document

1. Apply exact 080 once in the verified owner database. Verify all new tables
   retain RLS/no direct application-role access, private helpers and preserved
   legacy authorities deny execution, and only service callers can reach the
   new gated game/invitation/runtime functions. Check atomic admission/key
   binding, unchanged world revision/geometry and course/staff authorization.
2. Push only the reviewed campus branch commits. Inspect the Vercel deployment
   source/hash and wait for Ready on the existing protected Preview alias.
   Preserve existing Preview-only transport/readiness values and deployment
   protection. Do not change production or create a public/share bypass.
3. Check hosted anonymous/unadmitted denial and schema/grant restrictions with
   no mutation of a learner record. Prepare the protected sign-in/campus return
   link for the owner. The owner signs in and accepts any outstanding personal
   notice; the agent does not do this. Real signed-in two-account invitation,
   room navigation, explicit Join and match feedback remain human evidence.
4. Record actual outcomes privately and publish only non-sensitive software
   evidence in the runbook/PR. Keep PR #17 draft/unmerged and all wider pilot
   operating/admission gates intact. No disposable hosted accounts, new staff
   authority or synthetic hosted data are included in this approval scope.

## Bounded rollback

If the exact migration transaction fails, it rolls back; do not retry an unknown
outcome without checking definitions. If post-deployment verification fails,
restore the previous protected Preview application, end game sessions and use
the reviewed [`rollback SQL`](virtual-sciencedojo-game-invitations-rollback.sql).
It verifies the exact new and preserved function bodies before restoring the
previous 077 game and 075 world runtime authorities. It clears only campus game/
invitation/key state; new additive tables remain empty, inaccessible and under
RLS for inspection. It does not remove school/course data, disable RLS or modify
owner admission, roles or hosting protection. Reconnect/reload the prior Preview
afterward. The migration cannot then be replayed as if it were absent; inspect
and prepare a separately reviewed forward recovery.

Both the forward migration and this contingency must pass local rollback/replay
protection checks before requesting hosted approval. Exact final hashes and
software verification are recorded in the invitation plan/runbook.

Prepared SQL SHA-256 (compare again before action):

- `sql/080_campus_room_games_invitations.sql`: `a48abf5d51ed55684cc2dbba917c987bb53c92fde6c8be63e16b8baecb71f5ef`.
- `docs/virtual-sciencedojo-game-invitations-rollback.sql`: `b0fbe6ba1270ac8a43115d783fa5d4fa8acdf0dd82880b436e1ec08f1e0a5c9d`.

# Virtual ScienceDojo — Phase 0

Recorded 17 October 2026. Status: documentation foundation prepared; implementation and pilot admission are not approved by this record.

Later on 17 October, the owner requested completion of the project. That authorizes continuing software implementation within the agreed pilot scope. Foundation and study-slice code now exist locally; see the [implementation/runbook record](virtual-sciencedojo-implementation.md). Real-learner admission, paid infrastructure and the gates below remain pending.

Read with [the architecture](ARCHITECTURE.md) and [repository instructions](../AGENTS.md). This is an educational campus initiative. It does not replace the corporate-learning offer, change its pricing or open a fourth active business task. B3, S1 and R1 and their paid-work and tested-delivery gates remain governed by the [business backlog](business-master-backlog.md).

## Confirmed owner decisions

The owner selected these options during planning and requested implementation of the documentation plan:

| Decision | Agreed scope |
| --- | --- |
| Current deliverable | Phase 0 and architecture documents, plus instructions for future sessions |
| Audience | Invite-only cohort of 5–10 adults aged 18+, resident in the EU/EEA |
| Learning purpose | Study existing published Academy courses using their existing authorization, enrollment and progress |
| Social interaction | Shared presence only; other learners appear under campus pseudonyms |
| Identity promise | Pseudonymity within the campus; existing course discussions and public reviews retain their own identity rules |
| First future milestone | Enter → walk to a library computer → sit → open an authorized real course → close it → stand up |

These decisions define the intended pilot. They do not verify anyone's age, residence, enrollment, legal authority, operational readiness or learning outcomes.

**Owner clarification, 17 October 2026:** Virtual ScienceDojo is an optional beta alongside the current platform. Preserve the existing website and dashboards. Learners enter the library and use its computers/laptops to access their own existing dashboard and authorized learning. The implemented beta retains the library; classrooms are a possible later environment, not a replacement dashboard or a new course entitlement. The adult, invite-only and operational gates above remain unchanged.

The owner subsequently approved the public draft PR and restoring the configured showcase staging project, including its announced Postgres update. [Draft PR #17](https://github.com/sciencedojoEducation/sciencedojo-web-app/pull/17) is open and the restore request was accepted. This authorizes the reviewed staging/software checks, not paid provisioning or real-learner admission; all operational gates remain pending until actual evidence is recorded.

The restore completed with a Healthy dashboard and Postgres 17.6. After automatic approval review required separate schema approval, the owner explicitly said “Yes apply” to migrations 067/070 and disposable staging QA. Both migrations are now applied to showcase staging only. Real staging authorization, course enrollment/waitlist, private notes, direct Academy completion/save/reload, two-peer application/service integration, blocking/reporting and timed revocation passed. Five synthetic accounts and their course/data were removed, temporary staff authority was removed, and both beta flags were restored off. See the runbook for evidence and limits. The local real-course library-frame flow subsequently passed; hosted cold-entry/deployment checks and G1–G9 remain pending. Deployed authorization findings remain in the ignored private preflight record; broader platform authorization review is not declared complete.

## Pilot experience and design defaults

On 17 October the owner approved trying a Vercel preview within the existing
ScienceDojo project. This permits the bounded synthetic transport experiment in
the implementation record; it does not enable the beta, approve paid services,
apply production schemas or establish any operational gate as complete.
The hosted probe subsequently passed four WSS exchanges and observed two server
instances. The existing-project transport is feasible. The coordinated room
subsequently gained an opt-in, locally verified shared-SQL implementation; its
new migration 071 and scoped staging deployment were subsequently approved explicitly. Migration 071 is applied to showcase staging only. Bounded actual Preview sign-in/WSS/course/handover/recovery and hosted SQL concurrency checks passed with synthetic accounts, followed by fixture removal, original flag restoration and removal of temporary branch overrides. Bounded direct hosted SQL update-rate and controlled room-lock recovery checks also subsequently passed, with fixtures/flags cleaned afterward. Actual multi-user Preview WSS subsequently passed a short ten-client capacity check, contention, duration handover, revocation, shutdown and isolated native-pong cleanup. Its separately approved temporary link was revoked, all thirteen new accounts/authority/data removed and original flags restored off. Broader outage/endurance/cost, intended-device and human checks remain pending. See
the [Vercel transport guide](virtual-sciencedojo-vercel.md). No new paid plan,
production change or admission occurred.

The first world is a calm, stylized, low-poly blockout of the Cube's library: readable paths, a computer interaction, simple lighting and capsule avatars. Use generated pseudonyms and a constrained built-in colour palette. Avoid user-uploaded avatars, free-text names, photorealism, competitive scoring, streak pressure and collectible rewards. These are implementation defaults from the approved plan, not evidence of an owner-approved final art design. Use the lowercase **sciencedojo.** wordmark for logos and follow the [brand guidelines](brand-guidelines.md).

Opening the Study Hub displays a full-screen HTML course surface. Movement stops while studying; others see only a coarse studying state. Explain before opening it: “Your campus pseudonym is used in the shared world. Course discussions use your existing profile name and avatar; course reviews can show your name publicly.” Private notes remain private under the existing course rules. Do not imply that the whole platform is anonymous.

Provide visible keyboard-operable sit, open course, close course, stand and leave controls, clear focus and a way to release pointer capture. Course access must also work without 3D, including on unsupported or low-performance devices. A networking failure must not discard course work or prevent leaving the campus.

Defer campus text chat, voice, direct messages, friends, tutor broadcasts, screen sharing, younger learners, public discovery, new payments and enrollment flows, custom avatar creation, nature/weather, extra zones and production autoscaling. Fifty concurrent users per instance is a later capacity target. It is not a first-pilot requirement or a demonstrated capability.

## Pilot questions and evidence

Use a supervised session to assess whether adults can enter, find the computer, study and leave, and whether shared presence supports focus and belonging. Record the tested course, device/browser, assistance required, failed steps, confusion and participant feedback in private storage. Select one published course and confirm each learner's access before the session; no course or learner has been selected by this document.

| Measure | Planned evidence and interpretation |
| --- | --- |
| Study-loop completion | Observe each step and record help required; a successful scripted test is not an independent usability result |
| Learning access | Confirm existing enrollment and authorized course opening; record new enrollment only if the existing flow actually completes |
| Focus and belonging | Ask brief optional questions after the session; describe the small cohort and avoid causal learning claims |
| Study time and return visits | Use coarse, disclosed measurements only after privacy review; idle/open-tab time is not proven study time |
| Shared use | Count simultaneous presence without capturing course choices or individual learning activity in multiplayer logs |
| Safety operation | Record reports, blocks and actual response times privately; no reports is not proof of safety |

No new analytics collection is authorized in Phase 0. Existing root analytics and marketing pixels must be reviewed before campus admission; campus credentials, identifiers and course activity must not enter marketing telemetry. Proposed measurements require defined purpose, access and retention before collection.

## Gates and outstanding evidence

All gates below are **pending** on 17 October 2026. Piumal coordinates owner decisions and obtains the relevant evidence; no safety lead, legal reviewer or moderator is appointed by this document. Keep personal identities, account lists, legal advice and vendor documents privately; record a dated outcome and evidence location here when available.

| Gate | Required outcome before real learners are invited |
| --- | --- |
| G1 — Accountable operation | Confirm the actual operating legal entity, controller, relevant establishments, contact route and accountable safety lead; do not infer the operator from the website brand or a prior company reference |
| G2 — Eligibility and admission | Approve a proportionate method for establishing 18+ eligibility and EU/EEA residence, an invite allowlist, acceptance of notices/rules and revocation process; do not treat an account role or unchecked self-declaration as age assurance |
| G3 — Privacy and legal applicability | Obtain a qualified review outcome covering the actual operator, target audience, GDPR/EEA requirements, DSA classification where relevant, any other applicable jurisdiction and risk assessment/DPIA need; do not assume an adult-only pilot automatically removes child-access obligations |
| G4 — Data handling | Approve purposes and lawful bases per processing activity, notices, any required consent, data minimisation, access controls, retention/deletion schedules, export and deletion handling, and the limits of campus pseudonymity |
| G5 — Vendors and hosting | Verify current hosting and Supabase region from authoritative account settings; review processors, contracts/DPAs, subprocessors, support access, backups, logs and international transfers for existing and proposed services |
| G6 — Human safety operation | Name a supervisor and moderator for each scheduled session, publish the monitored reporting route, agree response targets and escalation contacts, and rehearse report, block, removal and incident handling; do not advertise unstaffed 24/7 support |
| G7 — Spending and infrastructure | Approve a numerical recurring-cost ceiling, instance limit, operator and shutdown procedure before provisioning; no budget, VPS provider or paid service is approved yet |
| G8 — Tested delivery | Pass the architecture's security, recovery and study-loop checks on the intended pilot deployment, plus actual supported-device and keyboard checks; synthetic accounts do not establish human usability |
| G9 — Pilot release | Owner records explicit approval, dates, cohort, selected course, completed gate evidence and staffed session schedule; maintain a default-disabled switch and a rollback plan |

Use EU/EEA hosting as a proposed procurement constraint, subject to verifying the existing setup. EU hosting alone does not settle international transfers, including remote access; review the [EDPB transfer guidance](https://www.edpb.europa.eu/sme/be-compliant/international-data-transfers_en). Use the [European Commission DSA overview](https://digital-strategy.ec.europa.eu/en/policies/digital-services-act) as an applicability-review starting point, not a determination that this service has a particular classification. This document is a review checklist, not completed legal advice.

Do not collect dates of birth, identity-document copies or precise location by default. If the eligibility review requires additional evidence, agree its necessity, collection route, access and retention before collecting it. An adults-only pilot does not authorize admitting minors under a parental-consent shortcut.

## Delivery sequence and completion record

1. **Original documentation foundation:** recorded decisions, architecture, future acceptance checks and unresolved gates without code or infrastructure changes. Subsequent authorized software work is recorded separately in the implementation log.
2. **Foundation, after a separately approved phase plan:** implement isolated campus identity, RLS, admission and revocation, then validate two synthetic users sharing a local capsule room. Include report/block and safe-exit foundations before real users.
3. **Milestone 1, after its separately approved plan:** add the library/computer interaction and existing-course Study Hub; validate authorization, progress and recovery end to end.
4. **Pilot readiness:** resolve G1–G9, rehearse operations, then run supervised sessions. Broader art, social and scaling work needs its own plan and approval.

For each phase: plan only → owner approval → small implementation commits with appropriate checks → review and fix → update these documents and AGENTS.md before moving on. The subsequent request to complete the project authorizes the agreed pilot software work; it does not authorize provisioning paid services or admitting learners before the launch gates. The earlier multi-month timeline and cost ranges are unvalidated estimates; re-estimate against measured work and actual vendor quotes.

Phase 0 documentation can be complete while operational gates remain pending. Automated software/deployment checks do not establish completed legal/vendor review, safeguarding rehearsal, independent usability or learner outcomes.

The software/runbook now includes 467 passing regression tests, hosted CI evidence, maintained synthetic browser acceptance and disposable real staging integration. The local real-course library-frame loop passed, including course completion, close/stand, unsent-note retention, offline saving/reopening and fresh admission; the second peer saw coarse presence only. Both staging flags were restored off and each run's fixtures removed. Bounded actual Preview sign-in/WSS/course/multi-user/recovery checks subsequently passed as recorded in the transport guide; broader deployment/device evidence, human usability and G1–G9 remain pending. Automated checks do not authorize admission.

Deployment preparation now includes an explicit-file service release and standalone verifier, with clean-install and actual process restart/admission checks passing locally. The quality workflow is configured to retain the archive/checksum/synthetic evidence for seven days; its added step passed in hosted quality 39013774052 on software head 54dc36e, and the downloaded archive/checksum/manifest were independently verified. This prepares reviewed software for a future selected host and does not complete G5, G7, G8 or G9.

Read-only production hosting metadata has been checked and recorded privately. Consult the ignored private hosting record before repeating that investigation; do not publish its locations or detailed deployed findings without explicit owner authorization for the public destination. G5 vendor/privacy review remains pending. No production configuration, deployment or data was changed by that check.

Owner feedback on 17 October confirmed that controls work but movement feels discontinuous. A scoped rendering fix and synthetic regression checks are recorded in the runbook. The owner initially said “Yes, much smoother,” then clarified that the character still repeatedly pauses. A second fix buffers confirmed positions across uneven arrivals; on 18 October the owner confirmed that movement is smooth in the local preview. This closes the reported movement defect only. No G8 or independent usability completion is inferred.

On 18 October the owner subsequently confirmed **“all works in the library”** after the walkthrough and requested private local-network phone preview. Owner acceptance of that tested library experience is recorded in the runbook. Device/browser details, independent participant observations and G1–G9 release evidence remain separately scoped; do not repeat the same general owner walkthrough as if no feedback was provided.

**Later owner scope change, 18 October:** after accepting the library, the owner requested that the beta feel like a real school with the full school and additional places. The approved software plan now includes the connected school environment in ARCHITECTURE.md. Existing learning/dashboard integration, adult presence-only scope and operational gates stay intact; the earlier library-only environment boundary is superseded for this software expansion.

## Glass Cube experience — owner direction, 18 October 2026

The owner also explicitly requested hands, legs and a little hair for campus characters. This supersedes the initial capsule-body art default with a built-in stylized humanoid, modest walking limbs and a seated pose. The constrained appearance palette, local presentation/privacy boundary and all operational gates remain unchanged; no user-uploaded or profile-based customization is added.

The owner explicitly requested modern glass-based architecture, the school contained in a literal cube, multiple camera angles including an inside/eye-level view, nature, sun and a 24-hour day/night sky with stars and moon, and said to go ahead. This authorizes the next private-beta software iteration and supersedes earlier deferral of environmental nature/sky and camera work. It does not authorize hosted schemas, paid services or real learner admission.

Plan: wrap the existing authoritative ground campus in a cubic glass/metal envelope with a planted island, surrounding landscape, clear internal pavilions and a suspended scientific orbital sculpture. Keep all 15 places and 10 study stations at their existing server coordinates; do not advertise decorative structure as additional accessible floors. Provide exterior, aerial/cutaway, follow, orbit and first-person cameras, drag/touch/keyboard look controls and camera-relative first-person movement using ordinary bounded direction inputs. Keep camera/time preferences local. Add a deterministic sky, visible sun/moon/stars and accessible local-clock/manual time controls. Preserve direct courses, reduced motion, safety/leave and Study Hub rendering pause.

Use instanced geometry, inexpensive tinted glazing rather than multipass transmission/reflections, cached shadows and the existing demand-aware low-device fallback. Batch room props to leave room within the existing graphics budget. Verify camera/input math, day/night boundaries, all previous movement/privacy/course checks, camera/clock browser interactions, mobile layout, render continuity and actual screenshots. No production or staging service changes are needed.

## Mouse look and E interaction — owner request, 18 October 2026

The owner requested FPS-style mouse movement to turn the view and E as the interaction key. Authorized private-beta plan: first-person hover look with click-to-lock for continuous turning; Escape, focus loss, Study Hub, view change and disconnect release the pointer and stop movement. Keep touch drag, visible look/direction controls and existing course keyboard input. E selects the nearest free desk within the existing server distance, opens its Study Hub when seated, and stands after returning; held/repeated E and keys from controls/course inputs must not trigger world actions. Mouse deltas stay local and invalidate only the scene, preserving demand rendering and authoritative bounded movement. Verify both browser transports, actual pointer-lock release/fallback, E study/stand, typing isolation and the established scene checks. No service/schema or learner-release change.

## Fullscreen school — owner request, 18 October 2026

Authorized plan: fullscreen the campus shell so the 3D scene, existing controls and retained Study Hub share the same fullscreen ancestor. Add compact in-world map, sky/view, study-desk, movement and safety panels, persistent connection/leave controls and a clear exit button. Reuse mounted controls and course frames. Use native fullscreen when available with a viewport-filling fallback; restore scrolling/focus on exit, release mouse lock before panels and respect browser Escape. Verify native/fallback entry and exit, desktop/phone panel layout, E/course retention and both browser transports. Camera/fullscreen preferences remain local; no service/schema or learner-release change.

## Playable basketball — owner request, 18 October 2026

The owner requested actually playable basketball on the sports court. Authorized software plan: one shared ball, E pickup and hold/release shooting, mouse aim with a local trajectory/power guide, touch/keyboard buttons, carry/dribble, rim/backboard/floor rebounds, retrievable misses, automatic out-of-bounds recovery and bounded session-only baskets at both hoops. Keep existing movement, fullscreen, safety, course access and retained work. This expands presence-only world geometry only as needed for the requested game: bounded ball position/ownership and court totals, never learning data, account IDs, camera preferences, persistent player statistics or rankings. Blocked ownership stays hidden.

Use one deterministic server physics module for Colyseus and the shared-SQL transport. Prepare service-only RLS game storage and compare-and-swap commits under the existing room lock, with bounded conflict retries; never trust browser positions, scores or ownership. The service computes proposals from authenticated intents and database-time state. Idle courts add no game write; active physics is bounded and commands retain socket limits. A new world revision fails closed against older hosted schemas. Migration 073 is local-only unless separately approved for a hosted database. Release, lease/revocation and room-empty cleanup must free/reset the ball.

Sequence: physics/protocol and disposable shared-state/security checks; rendered hoops/ball and integrated E/touch/aim UI; both real browser transports, scoring/miss/rebound/peer/cleanup and fullscreen/mobile checks, graphics limits, type/lint/build and refreshed private preview. No hosted schema, paid infrastructure or real learner admission is authorized by this request.

### Basketball private-beta verification — 18 October 2026

Owner-requested shared basketball is implemented and locally verified, including physical makes/misses/rebounds, E/mouse/touch/fullscreen controls, exclusive ownership and peer totals. Both browser transports, 501 regressions, graphics, type/lint/build and clean service packaging/restart passed. The implementation record contains the evidence and bounds. Schema 073 is local-only, and these synthetic results do not complete hosted deployment, human acceptance or any operational/learner-release gate.

## Mouse-look range correction — owner report, 18 October 2026

The owner reports incomplete up/down/left/right turning and uneven view control. Authorized fix plan: retain immediate local mouse deltas and native pointer capture, widen first-person pitch to nearly vertical without flipping, and continue turning at the scene edges when uncaptured so cursor bounds cannot prevent a full turn. Stop edge motion on leaving the scene, Escape, focus/view loss, disconnect and Study Hub pause; keep touch/orbit and world messages unchanged. Verify actual captured and denied-capture camera ranges, full turns in both directions, input/render agreement and stationary state after release, plus existing graphics/course checks.

## Shot-power control — owner report, 18 October 2026

The owner cannot lower power while holding E because release immediately shoots. Authorized fix: keep hold/release shooting, but cycle charge up and down continuously while held, retaining the existing first-rise timing, selected-power slider and Shoot ball alternative. Explain the cycle and Escape cancellation in the court HUD. Verify rising/falling/repeated cycles and actual keyboard/touch control, including no release while held and cancellation retaining the ball, against both existing transports. The owner also requested a plan for two/four-player school-break basketball; see the [proposed match plan](virtual-sciencedojo-basketball-matches.md). Team/match implementation remains a subsequent scope decision.

## Orbit movement correction — owner request, 18 October 2026

The owner reports awkward Orbit WASD movement and requests familiar GTA-style third-person controls. Authorized fix: map manual Orbit movement to the horizontal camera direction, keep automatic routes in world coordinates and let the existing server-owned avatar heading face travel. Keep Orbit rotation responsive so visible heading and movement axes agree while turning. Track held keys independently so opposite keys cancel and releasing one restores the other, including arrow-key aliases. Preserve normalized diagonals, existing first-person input, touch buttons, focus/leave cleanup, reduced motion and private camera state. Verify actual Orbit movement after rotation, combinations/releases and renderer alignment in both browser transports, plus existing camera/graphics/course checks.

## Living Cube — owner request, 19 October 2026

The owner authorized movement/posture, furniture collision, shared focus glass and
usable upper floors. The [implementation plan](virtual-sciencedojo-living-cube.md)
supersedes the earlier decorative-terrace limit for this private software phase.
Existing learning, identity and operational gates remain unchanged.

## Owner-account review approval — 19 October 2026

The owner approved the bounded [owner-review plan](virtual-sciencedojo-owner-review.md).
070–074 are applied to that separately verified account database, with all campus
RLS enabled, zero invitations and the beta off. Earlier local-only schema notes
remain historical. Preview setup awaits Vercel two-factor sign-in; adult/EU/EEA
confirmation and actual account acceptance/testing are pending. The safe-update
compatibility repair (075) passed local checks and the actual service API; it
retains the target database safety guard and existing authorization. This does not admit a
student cohort or complete the operational gates.

The owner subsequently completed Vercel sign-in and self-confirmed adulthood and
EU/EEA residence. Branch-only protected Preview transport/release settings were
saved after explicit action-time confirmation. The actual owner account's notice
acceptance and school/dashboard interaction remain to be observed; separate
student admission and operational gates are unchanged.

The protected Preview subsequently reached Ready. Exactly one owner invitation
and the campus flag are now enabled for the approved review, with zero campus
staff and unchanged student/course permissions. Notice acceptance remains a
personal application action; actual owner walkthrough evidence remains pending.
Close this review by disabling its membership/flag and restoring branch controls.

## Hosted movement responsiveness — owner report, 19 October 2026

The owner likes the experience but reports slightly slow/lagging movement and
requests a fix. Authorized correction: send bounded changed input without waiting
for the periodic browser sample, keep active-input refreshes and idle suppression,
resume slow shared-SQL calls at the next eligible instant without overlapping or
raising the 5Hz ceiling, and remove duplicate Follow camera easing behind the
already-interpolated avatar. Preserve the 300ms confirmed-pose buffer, server
speed/collision/seat authority, immediate corrections, graphics limits and course
retention. Verify input/start/stop/rapid-change timing, slow-RPC lifecycle/cadence,
both transports, actual Follow tracking and existing rendering/privacy checks.
No schema, hosting settings, cohort or learning entitlement change is needed.
## Games Lounge extension — 19 October 2026

The owner approved implementing the [Games Lounge plan](virtual-sciencedojo-board-games.md)
for easy games with friends: two-player Four in a Row and two-to-four-player
Dots & Boxes in the existing upper Sky Commons. This extends the beta software
with session-only game turns/results and explicit table-level picture/username
sharing. After a sharing preview and deliberate Join, only fellow players see
those identities. It does not change campus pseudonyms, add chat, replace
dashboards/courses, or authorize disclosure through world messages.

The prepared additive 076 migration uses service-only game operations and
RLS-protected ephemeral records. The owner subsequently approved applying 076 and publishing the board games
to the protected Preview (`1358e11`, Ready). Friend admission remains pending. The approved owner review
still admits only the owner; friend accounts, deployment access, environment-
specific changes and applicable operating/admission requirements remain pending.
See the implementation runbook for actual software evidence. Synthetic matches
do not establish a real friend walkthrough, current-head hosted CI or G1–G9.

## German vocabulary — owner-approved software, 19 October 2026

The owner approved [WortQuest](virtual-sciencedojo-german-vocabulary.md): original
A1–C2 practice cards with English explanations, examples and translations; solo
and two-to-four-player ten-card quizzes with session points. Joining a friend
quiz deliberately shares the chosen level and aggregate game points only with
its participants. Selected answers/private review and all existing course data
remain outside world state. No certified proficiency, teacher review or learner
outcome is established. Migration 077 and vocabulary publication remain pending
separate hosted approval. The owner confirmed friends are adults; account emails,
EU/EEA confirmation, deployment access, actual friend tests and applicable
operating/release evidence remain pending. No general learner launch is inferred.

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

Phase 0 documentation can be complete while operational gates remain pending. No legal review, vendor verification, deployment check, safeguarding rehearsal, independent usability result or client/learner outcome is claimed here.

The software/runbook now includes 452 passing regression tests, hosted CI evidence, maintained synthetic browser acceptance and disposable real staging integration. The local real-course library-frame loop passed, including course completion, close/stand, unsent-note retention, offline saving/reopening and fresh admission; the second peer saw coarse presence only. Both staging flags were restored off and each run's fixtures removed. Hosted cold-entry/deployment checks, intended devices, human usability and G1–G9 remain pending; automated checks do not authorize admission.

Deployment preparation now includes an explicit-file service release and standalone verifier, with clean-install and actual process restart/admission checks passing locally. The quality workflow is configured to retain the archive/checksum/synthetic evidence for seven days; its added step passed in hosted quality 39013774052 on software head 54dc36e, and the downloaded archive/checksum/manifest were independently verified. This prepares reviewed software for a future selected host and does not complete G5, G7, G8 or G9.

Read-only production hosting metadata has been checked and recorded privately. Consult the ignored private hosting record before repeating that investigation; do not publish its locations or detailed deployed findings without explicit owner authorization for the public destination. G5 vendor/privacy review remains pending. No production configuration, deployment or data was changed by that check.

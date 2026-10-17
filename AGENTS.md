<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## ScienceDojo business work

Before planning or continuing the business offer, business website, demonstration or sales work, read `docs/business-master-backlog.md`. It records the execution order, completion evidence and the next three active tasks. Keep it current when work is completed or priorities change, and keep only three tasks active.

Reuse completed work rather than rebuilding it. Preserve owner-approved claims, pricing and scope, and use `docs/business-website-release.md` for historical website verification. Keep the paid-work permission and tested-delivery gates in the backlog intact. Do not mark owner decisions, inbox receipt, independent usability checks or client outcomes complete without evidence.

## ScienceDojo branding

Use the simple lowercase wordmark **sciencedojo.**, with one trailing dot, in all logos and branded documents. Follow `docs/brand-guidelines.md`. Preserve the registered company name in legal/prose references; the wordmark rule applies to the logo.

## Virtual ScienceDojo

The owner clarified on 17 October 2026 that Virtual ScienceDojo is an optional beta alongside the existing platform. Preserve the existing website and dashboards. Library computers/laptops provide access to the learner's existing dashboard and authorized courses; do not rebuild learning, enrollment, progress or payments inside the world. The current beta uses the library; additional classroom zones remain future scope.

Before planning or implementing the virtual campus, read [Phase 0](docs/virtual-sciencedojo-phase-0.md) and [the architecture](docs/ARCHITECTURE.md). The agreed first pilot is invite-only, 5–10 adults aged 18+ resident in the EU/EEA, studying existing courses with shared presence only. Operational gates remain pending until dated evidence is recorded; documentation completion is not permission to launch or provision services.

Keep multiplayer state limited to opaque campus identifiers, generated pseudonyms, constrained avatars, movement/seat state and coarse presence. Never broadcast account identifiers, credentials, course choices, answers, grades or progress. Authentication tickets belong only in the protected handshake. Keep private campus identity mapping and learning data in the application/Supabase boundary; campus pseudonymity does not change the identity rules of existing course discussions and public reviews.

Reuse current auth, course authorization, enrollment, progress and payments. Campus admission grants no course entitlement. Enforce admission/revocation and default-disabled feature controls on the server, with explicit RLS and trusted database-backed staff roles; user-editable auth metadata is not authorization. Include accessible direct-course access, report/block/leave and safe disconnect/seat cleanup before real learners enter.

For each phase, prepare a plan and obtain owner approval before implementation, then use small commits with appropriate checks, review/fix the result and update both documents and AGENTS.md before advancing. Approval of Phase 0 documentation does not approve the next implementation phase. Preserve the separate business backlog, its three active tasks and its paid-work/tested-delivery gates. Do not mark legal/vendor review, safeguarding operation, human usability or learner outcomes complete without actual evidence.

On 17 October 2026 the owner subsequently requested completing the project, authorizing the agreed pilot software implementation. Do not ask again to perform that software work. Read [the implementation/runbook record](docs/virtual-sciencedojo-implementation.md) for current evidence and remaining work; this authorization does not establish launch readiness or approve paid infrastructure or admitting learners before the recorded gates.

Preserve the campus document boundary and private-study analytics exclusions: an SPA transition must not render campus content in a document carrying earlier marketing scripts. On 17 October the owner approved the public beta draft PR and resuming the paused showcase staging project, including its dashboard-announced Postgres update. Draft PR #17 is open and restoration was requested; use the implementation/runbook record for the verified outcome. Do not ask again for those approved actions, or mistake staging's region or branch label for production verification. Launch, paid infrastructure and real-learner admission remain separately gated.

The quality workflow now includes the synthetic campus Chromium acceptance check and retains its screenshots/evidence for seven days. Keep these fixtures separate from real account/learner data. Local CI-command verification is not evidence that a hosted GitHub Actions run or live integration has passed.

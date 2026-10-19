# ScienceDojo Engineering Page Implementation Plan

19 October 2026 · Owner-authorised local implementation

Build an original engineering page at `/business/engineering` around **advanced + simple**: visitors recognise their problem, see how a focused engineering contribution could help, inspect relevant evidence and start a direct conversation. Use a restrained modern visual system and one useful interactive demonstration. Keep engineer portraits on a future People route, away from the engineering homepage.

This plan covers the page, its enquiry adaptation and affected navigation. It preserves the existing learning offer at `/business`, its €1,490 starting price, scope, demonstration, downloads and enquiry behaviour. The owner authorised implementation on 19 October. The local route, explorer, example, enquiry adaptation and discovery metadata are implemented. E1 temporarily replaced S1 during implementation and verification; the local work is complete and B3/S1/R1 are restored. Publication and human comprehension/inbox checks remain separate. See the dated business website release record for actual verification.

## First release scope

### Main-site For Business menu — owner request, 19 October 2026

Use the existing `/business` route for Instructional design and `/business/engineering` for Engineering. The main public header exposes both via a desktop hoverable native disclosure with click/keyboard, Escape/focus return, outside-pointer and focus-leave dismissal; its padded panel remains connected to the trigger. The mobile drawer groups both links under For Business, sharing the destination data. Keep route names stable, existing page-specific headers and normal account/feature-flag behavior. Align arm labels without changing the instructional-design service, price, form or demo. A small no-script navigation fallback lives inside the existing public chrome/Suspense boundary because the streamed header otherwise remains hidden without scripts; private/auth/business chrome exclusions remain in place. Verify actual navigation and layout; publication is recorded separately.

### Client comprehension and visual UX refinement — 19 October 2026

The [focused design/UX review](business-engineering-client-ux-review-2026-10-19.md) extends the company audit with primary UX guidance, likely buyer questions and explicit evidence limits. Retain the visual system and actual proof; improve descriptive headings, desired-change choices with service subtitles and selected-state cues, the continuous five-block SVG route and concept caption, and the first-contact explanation around Piumal. Keep persistent form instructions associated through validation. No new animation, runtime dependency, commercial promise, tracking or backend change is needed. Psychological/conversion effects remain hypotheses until actual visitor research; the proposed human review is not completed by automation. The dated release record must distinguish scoped software results from unrelated repository build failures. This remains E1 maintenance with B3/S1/R1 and all existing gates intact.

### Web/IT company audit and buyer clarity — 19 October 2026

The owner explicitly requested a broader supplier study, complete page audit and implementation of supported findings. See `docs/business-engineering-company-audit-2026-10-19.md` for eight-company primary sources, the baseline and full disposition matrix. The local revision makes websites/web applications/integrations explicit while retaining learning experience; exposes possible first-project scope without interaction; makes detailed synthetic demo controls optional with close/reset cancellation; explains the own-product problem/contribution/decision; and adds scoped/continuing engagement, cost/timeframe, source/handover, quality, support and managed-IT boundary information. It includes a fictional sample brief, registered company name in footer prose, compact phone profiles and aligned metadata/share wording. No engineering price, immediate capacity, independent client result, certification or SLA is invented, and the existing private form contract stays intact. Verification is in the dated release record; B3/S1/R1 and publication/commercial gates are unchanged.

### Selected Lovable design adaptation — owner request, 19 October 2026

Piumal explicitly requested bringing the useful parts of the Lovable exploration into the existing page after its design review. Adapt its stronger headline hierarchy, spacing, compact navigation, problem-first order, connected-interface artwork and pale-blue/navy section rhythm. Keep the original exact brand tokens, existing Next.js app, actual sample-data product views, consequential demo/recovery logic, illustrated team and private enquiry implementation. No wholesale app migration or new backend is involved.

The selected SVG artwork is adapted from `src/components/site/HeroArt.tsx` at Lovable revision `b1b6fec87b4a21baad83909c750ad37bfee97aab`, retrieved through read-only project access. Use the existing local motion controller for pause/reduced-motion/offscreen handling and readable static markup; do not import the prototype's reveal-hidden/no-script limitation or its separate global font/CSS system. The local problem explorer now precedes the compact own-product case, with vertical buyer choices, optional scope detail and distinct synthetic course-handoff, saved-learning-step and enquiry-retention visuals. Existing decision outcomes and cancellation/retry controls remain.

This changes only the local engineering experience. Responsive/interaction verification and actual evidence are recorded in the dated release record when complete. B3/S1/R1, current learning scope/price, paid-work/tested-delivery gates and owner visual acceptance remain separate. The external Lovable project itself is unchanged.

### Illustrated team portraits — owner request, 19 October 2026

Piumal requested three cartoon-style images for Piumal, Tharindu and Yelka. This authorises illustrated portraits in the existing lower team section, replacing its initials; the opening remains problem-led. It supersedes the earlier blanket homepage-portrait exclusion for this specific team treatment. Use a matching, clearly drawn editorial cartoon style with adult proportions, softly coloured backgrounds and the owner-confirmed responsibilities. Reference photos guide features only; do not publish the real photographs or invent personal interests.

Tharindu/Yelka's selected cartoon drafts were prepared as `public/images/business/engineering/tharindu-cartoon-v1.webp` and `yelka-cartoon-v1.webp` (800×800). Piumal subsequently supplied his reference photograph on 19 October, resolving the missing input. A matching `piumal-cartoon-v1.webp` is now prepared and all three are integrated into the lower team section. See the [artwork/prompt record](business-engineering-team-artwork.md) and dated release evidence for checks; final likeness acceptance remains the owner's review. No raw photographs are website assets. Existing commercial claims, three active tasks and release gates remain unchanged.

### Visual and motion refinement — owner request, 19 October 2026

Piumal found the page too text-heavy and requested more images and impressive animation. This authorises an original visual/motion increment beyond the first release's restrained one-interaction baseline. Keep the original ScienceDojo colours, structure, buyer problems and no-portraits direction. The LMS should support the engineering story rather than dominate the page.

Implemented locally: three original, AI-generated concept images (connected glass-frame hero, reliable-workflow illustration and sunlit studio still life); pointer-responsive hero depth, floating explanatory labels, a light sweep, visual scroll entrances, hover details and a reading-progress line. The LMS is now a compact two-column in-house case with its actual sample-data views and full-size image access; duplicate narrative paragraphs and the product-tour promotion were removed. The workflow and approach sections gain imagery without representing it as a real implementation screenshot or office photo.

The new client motion boundary composes server-rendered children. Manual pause, live reduced-motion preferences, no-script static presentation, offscreen/background pause and cleanup are required. Pointer/scroll work uses event-triggered RAF updates rather than a continuous JS loop; no WebGL, animation dependency, video, tracking or service is added. Generated art is distinct from actual product evidence and uses project-owned versioned WebP assets. The dated release record records the final passing build, 37 focused tests and expanded browser acceptance. No publication or business gate is changed.

### Research-informed refinement — 19 October 2026

After the first local implementation, Piumal delegated audience research, selected in-house LMS/website implementations as the evidence base and confirmed team responsibilities: Piumal leads discovery, requirements, learning design and client communication; Tharindu covers architecture, full-stack delivery and integrations; Yelka covers frontend, interface design and usability. Both scoped projects and ongoing work can be discussed, with delivery responsibilities and availability confirmed per brief. These roles do not establish individual authorship of past work or dedicated full-time capacity.

The [dated positioning research and case inventory](business-engineering-reference-lessons.md#engineering-positioning-research-and-owner-inputs--19-october-2026) recommends leading with specific website, learning-platform and workflow improvements for established training/education businesses, while retaining suitable work in other sectors. This is a provisional fit recommendation, not verified buyer demand or an approved new commercial offer. It supplies two own-product case narratives, source/verification boundaries, a proposed revised opening and a concrete six-part page brief. Reuse the existing approved sample-data product tours. Replace the generic learning demonstration as primary engineering proof with an actual, freshly checked in-house flow; never imply a client case or measured commercial result.

Piumal subsequently requested developing this revision. It is now implemented locally: education-focused opening with a broader-sector invitation, an early in-house product case with three actual sample-data dashboard views, a distinct website/enquiry implementation case, three consequential synthetic design decisions, the confirmed team responsibilities, scoped/ongoing engagement wording and explicit Engineering/Learning Design navigation. The original blue/navy/cyan palette and separate learning offer are preserved. No portraits, client results or capacity promises were added.

Production build, scoped lint, type checking, 37 focused demo/enquiry/SQL/email tests and production-mode Chromium acceptance passed. The dated release record contains the exact evidence and remaining checks. The three product views are inspectable screenshots, not authenticated dashboards; the explorer remains local synthetic data, not a live integration. Public case readiness does not imply every underlying authoring/course/workbook feature was freshly exercised. No price, publication, capacity or paid-work gate changed; B3/S1/R1 remain the three active business tasks.

| Include | Result |
| --- | --- |
| Engineering landing page | A distinct, problem-led business journey with responsive navigation, explanatory copy and an enquiry form |
| One problem explorer | Three relevant situations using a shared interface, with complete initial content and optional synthetic demonstrations |
| One evidence feature | An accurately attributed own-product example or a clearly labelled synthetic example; never an invented client case |
| Concise approach | Inputs, scope, review and handover explained without unsupported durations or prices |
| Working enquiries | Existing private storage and notification pipeline reused with engineering context |
| Business discovery links | A small Engineering entry on the current business page, a Learning Design return link, unique metadata and eventual sitemap entry |

Keep the first release to one new page. Its navigation can use Problems, Work, Approach and Contact anchors. Do not create dead People, Solutions or case-study links. A People route and detailed case studies are later increments, published only when their content is ready. A complete two-arm For Businesses hub is a separate later change: the current learning sales page should not be silently moved, redirected or replaced.

No new CMS, chat service, AI API, authentication, booking system, pricing calculator, production database migration or paid infrastructure is needed for this first release. No private campus experience belongs in a public sales demonstration.

## Existing implementation to reuse

| Current source | Relevant behaviour and plan |
| --- | --- |
| `app/business/page.tsx` | Existing learning offer and local business header/footer. Add only an Engineering discovery link and a clear arm label if needed. Keep the rest of the approved learning journey intact. |
| `components/PublicChromeGate.tsx` | Already excludes `/business` and `/business/*` from tutoring header/footer and public conversion chrome. Reuse this boundary; a new global exception should not be necessary. |
| `app/layout.tsx` | Owns the document main landmark, existing Inter font and tracking gates. Add no nested `main`, new document layout or tracking integration. |
| `app/business/BusinessEnquiryForm.tsx` | Existing controlled drafts, field errors, pending state and focused outcome. Reuse its interaction patterns without changing its learning labels or required fields. |
| `app/business/actions.ts` | Existing server action. Leave its default learning behaviour stable; add an engineering-specific boundary. |
| `lib/business-enquiry-validation.ts` | Limits, normalisation, email checks, honeypot handling and notification escaping. Preserve these safeguards. |
| `lib/business-enquiry-service.ts` | Saves before notifying; preserves errors, duplicate handling and retryable notifications. Reuse this pipeline. |
| `lib/business-enquiries.ts` | Uses server-only Supabase RPCs, hashed rate limits and the existing recipient/notification worker. No new browser-side database writes. |
| `sql/068_business_enquiries.sql` | Organisation is non-empty in the actual table constraint, not just the current form. Do not reapply the migration. |
| `app/sitemap.ts` and `lib/seo.ts` | Reuse configured site origin and add only routes ready for public indexing. |
| Existing business tests and release record | Retain historical evidence; run affected regression checks and record new evidence separately. |

The installed Next.js version is 16.2.1. The local guides for pages/layouts, Server and Client Components, Server Functions and metadata were consulted. Before writing the related code, reread the relevant installed guide, particularly async request APIs and dynamic token generation. Keep route exports limited to supported Next.js entries.

## Page structure and content

| Section | Buyer question | Planned presentation | Completion condition |
| --- | --- | --- | --- |
| Header | Where am I and where can I go? | Lowercase `sciencedojo.` wordmark, separate Engineering descriptor, For Businesses return link, four short section links and one clear action. Compact mobile menu if needed. | No duplicate tutoring chrome, all links resolve, menu opens/closes with keyboard and touch. |
| Opening | Can you help with my situation? | One specific proposition, short supporting explanation and a primary Discuss your challenge action. A quieter route leads to the example. The explorer's initial task visual may sit beside the copy on desktop. | Scope is understandable without operating the demonstration; the primary action remains visible on narrow screens. |
| Problem explorer | What would you improve or build? | Three clear choices: Simplify a workflow, Improve an application and Connect systems. The selected choice supplies one explanation, deliverable example, synthetic visual and relevant enquiry action. | All choices work without hover and have textual selected states. No second repetitive services grid. |
| Evidence | What can I actually inspect? | One generous feature showing a relevant task, exact contribution, constraints and a real inspectable screen/flow. | No fake dashboard, fabricated results or private data; own products and demonstrations are clearly distinguished. |
| Approach | What would working together involve? | Understand the task; agree a bounded scope and completion criteria; build and review; hand over. Explain what the client supplies and that continuation is scoped separately. | No unvalidated delivery deadlines, free trials, unlimited support or engineering price borrowed from the learning offer. |
| Short FAQ | What could prevent a fit? | A small set addressing existing applications, a bounded first project, handover and further support. Use direct answers and native disclosures for optional detail. | Answers match actual arrangements and do not imply a ScienceDojo subscription is required. |
| Enquiry and footer | How do I begin, and what happens next? | Short form, visible/editable selected interest, email alternative, a realistic account of review and reply, privacy/company/learning links. | Honest receipt wording, preserved input on failure and a working direct-email path. |

Opening copy is drafted during the first milestone around the strongest supportable work: improving React/Next.js business applications and integrations. Avoid implying that the team offers every technology or full-time capacity. “Advanced + simple” is an internal design direction, not a substitute for a customer-facing proposition.

The team's Sri Lankan identity can appear in a small supporting statement. Do not repeat the three-person portrait strip from the earlier concepts. Do not use generated pictures as implemented-page evidence.

## Problem explorer behaviour

Use one small client-side interaction with typed fixture data and local state. Each scenario defines the customer's problem, intended user, bounded deliverable, illustrative visual, optional recovery example and enquiry interest. Static descriptive content remains available before hydration and when scripts are unavailable. A direct enquiry anchor and email alternative remain usable independently of the explorer.

| Scenario | Concrete illustration | Engineering idea communicated |
| --- | --- | --- |
| Simplify a workflow | A synthetic request becomes a structured item for review instead of being copied across several places. | Clear input, useful status and one obvious next action |
| Improve an application | A deliberately awkward synthetic screen becomes a focused flow with clearer validation and completion. | Interface reasoning and error recovery, rather than a visual reskin alone |
| Connect systems | Synthetic information is checked once, passed to a second system and acknowledged; an optional temporary failure can be retried. | Validation, bounded processing and understandable recovery |

The initial example is complete and explanatory. A visitor can choose an optional Run example or Show recovery action; there is no automatic typing, fake live support or continuous loop. Local simulations have explicit ready, checking, blocked/recoverable and complete states. Scenario changes and reset cancel outstanding timers so an old example cannot overwrite a new selection. Announce meaningful status changes politely, without reading every animation frame.

Use ordinary labelled buttons with `aria-pressed` for scenario selection unless a complete tab interaction is implemented. A selection updates the explanation, visual, deliverable and enquiry context together. Do not transmit form drafts, persist browsing choices in cookies or create real integration requests. Reduced-motion mode shows the same result and recovery explanation without animated travel. Decorative activity stops offscreen or in a hidden tab.

The visual must remain comprehensible as text. Use DOM/CSS and existing icons; use SVG only where spatial relationships need it. Do not add WebGL, a new animation framework or an external demonstration service.

## Visual implementation rules

Use a CSS module scoped to the engineering route. Reuse the existing Inter font for the first slice; choose another locally optimised family only if real browser review shows a clear need. Do not change the root font or global element styles to improve this single page.

| Element | Starting specification |
| --- | --- |
| Canvas | White with broad, consistent page margins; owner requested original ScienceDojo colours on 19 October |
| Text | Original ScienceDojo navy `#001A44`; readable slate supporting text |
| Action | Original ScienceDojo blue `#0066FF`, hover/text accent `#0052CC`, cyan `#00D2FF` for restrained brand details |
| Supporting surfaces | Pale blue illustrations, white panels and a navy evidence section; semantic warning/error colours retained |
| Typography | Deliberate hierarchy and line breaks; initial ranges of 64–80px desktop headline, 36–44px phone headline and 17–19px body, adjusted after actual layout review |
| Layout | One coherent alignment system, varied section composition and comfortable body measure; no fixed full-screen hero |
| Geometry | Shared spacing scale, restrained corners and quiet separators; no repeated card grid throughout the page |
| Motion | Short state transitions and one explanatory interaction; no hidden-until-revealed essential content |
| Decoration | No decorative underlines, doodles, orbit/ribbon copies, stock café hero, animated cursor, generic 3D object or engineer portraits on this page |

Preserve necessary functional link affordances and visible keyboard focus. The root already provides a `main`; use sections and labelled navigation inside the new page. A sticky local header needs scroll offsets and must not obscure focused controls. At 320px, controls wrap or stack instead of creating page-level horizontal scrolling. Inputs remain at least 16px on phones.

## Enquiry integration

For the first release, require **name, email, organisation and project description**, with timing optional. This deliberately retains the existing backend contract. The earlier suggestion to make organisation optional would require a separate schema/RPC/validation design; do not fake an organisation value or quietly weaken the learning form to achieve it.

The engineering form changes the visible brief label to “What needs to work better?” and exposes an optional interest choice from an allowlist: workflow, application, integration or not sure. Visitors can override the selection and keep their typed description when changing it.

Reuse the existing `goal` field by constructing a bounded server-side brief that includes a fixed Engineering service label, the validated interest and the visitor's description. Reserve part of the 3,000-character goal allowance for this prefix and make the visible description limit agree with the server limit. The interest is context, not authority. The engineering server action supplies the fixed service context; do not trust a submitted notification recipient, service permission, arbitrary URL or free-form context field.

Keep the existing UUID submission token, duplicate/conflict behaviour, IP/email rate limits, HTML escaping, notification timeout, leases and durable retries. The final implementation keeps the page prerenderable and assigns a fresh UUID to each mounted browser form. No token is frozen into shared HTML. The shared server action generates and returns a token for an unenhanced form and preserves it through recovery. The existing learning page retains its request-scoped pattern. A scoped no-script stylesheet reveals completed engineering markup from the shared streaming boundary and hides its generic loading placeholder; interactive visits retain ordinary loading behaviour.

The existing staff notification currently says pilot enquiry and asks about learner ability. Make its presentation neutral—new business enquiry and project brief—so engineering messages are not mislabeled. Preserve all stored fields, reply-to, idempotency keys and retry handling, including older queued learning enquiries. The learning action and validation defaults stay unchanged.

Success means the database recorded the enquiry. It must not claim inbox delivery, a booked consultation or a confirmed project. Preserve the current email alternative and privacy links. With scripts disabled, show a clear direct-email route; do not assume the current Client Component form has full no-JavaScript recovery without testing it.

Use local fixtures and isolated SQL tests during development. A controlled integration test against a designated environment/recipient and actual inbox confirmation belongs in release preparation, with its destination and procedure agreed before sending. Do not use real prospects, silently write production test records or reapply migration 068. A new commercial quote still depends on the backlog's paid-work permission and tested-delivery gates.

## Content and evidence requirements

| Item | Responsibility and fallback |
| --- | --- |
| Initial customer/problem focus | Codex drafts from the recorded capabilities; Piumal settles what the team wants to offer and can support. |
| Engineering scope and availability | Piumal and partners confirm before those claims are published. Do not infer capacity from old form responses or a three-person illustration. |
| Own-product proof | Select one public or safely synthetic ScienceDojo flow; state the actual contributor and what is demonstrable. Masking private learner records is not a substitute for using clean evidence. |
| Previous-employer work | Publish only with disclosure permission and an accurate personal contribution. |
| Missing case evidence | Ship an honestly named illustrative engineering example, or defer the work section; do not frame a synthetic prototype as a completed client engagement. |
| People profiles | Follow later with person-approved roles, interests and artistic features. Piumal's concept portrait is not a likeness. No empty People link in the first release. |
| Contact expectations and legal references | Reuse the existing company/contact references; Piumal confirms any new response-time or commercial commitment. Preserve the registered company name in legal/prose contexts. |

Keep the existing learning offer, its evidence labels and its existing price separate from engineering. Do not promote private beta availability or client outcomes without recorded evidence.

## Delivery milestones

These are sequential implementation milestones, not additional active business-backlog tasks. Use small coherent commits that exclude the unrelated campus changes currently in the working tree.

| Milestone | Work and dependency | Reviewable output and completion requirement |
| --- | --- | --- |
| 1 Content and interaction specification | Draft the proposition, three scenarios, evidence choice, enquiry wording and approved-claim list. Resolve enough content for a real first slice. | A short content model and scenario/state definitions; unknown facts are omitted or explicitly drafted. |
| 2 Responsive first slice | Create the new route, scoped styles, local header, opening, one complete explorer state and enquiry/email anchors. Reuse the existing chrome boundary. | Working desktop and phone preview with real type/layout, keyboard focus and a meaningful static state. Piumal can assess the actual design rather than another generated image. |
| 3 Complete the explorer | Add the other two scenarios, selection, explicit simulation/recovery, reduced motion and safe cancellation. | Every scenario communicates a specific problem and deliverable; rapid changes cannot produce stale output. |
| 4 Add evidence and buying clarity | Add the verified/labelled example, approach and short FAQ; retain distinct section compositions. | All project assertions map to an actual source/contribution. No placeholder portraits, fabricated UI or dead detail links reach release. |
| 5 Connect engineering enquiries | Add the dedicated form/action, allowlisted context and bounded brief; neutralise staff notification presentation with backwards compatibility. | Existing learning regressions and engineering storage/retry/error tests pass locally. Context is visible/editable and recorded correctly. |
| 6 Finish navigation and metadata | Add the Engineering link on `/business`, return routes, accurate page metadata and sharing image. Add indexing entries only for release-ready routes. | Anonymous entry and direct reload work; no tutoring metadata or duplicate chrome; learning price, demo/downloads and main actions still match their baseline. |
| 7 Verify and prepare release | Run the checks below, fix findings and present the actual preview. Prepare isolated commit/PR scope and rollback notes. | Reviewable page plus recorded evidence. Publication follows the owner's concrete release instruction; actual deployed checks are recorded after deployment. |

Prefer completing and reviewing milestone 2 before polishing every lower section. This makes visual quality a browser-tested input to the rest of the work. Do not set a customer-facing delivery deadline from this plan; effort estimates should follow the first slice and confirmed content.

## Proposed file map

| File or area | Intended change |
| --- | --- |
| `app/business/engineering/page.tsx` | Server-rendered page, supported metadata export and composition |
| `app/business/engineering/engineering.module.css` | Scoped responsive tokens/layout and reduced-motion styles |
| `app/business/engineering/EngineeringNavigation.tsx` | Minimal client menu when required; tested Escape/focus return |
| `app/business/engineering/EngineeringExperience.tsx` | Small client coordinator for selected interest, explorer and form; compose server content as children rather than making the entire page a Client Component |
| `app/business/engineering/ProblemExplorer.tsx` | Synthetic scenarios, explanatory states and optional simulation |
| `app/business/engineering/EngineeringEnquiryForm.tsx` and `actions.ts` | Separate engineering labels/action with shared safe submission behaviour |
| `app/business/engineering/content.ts` | Structured draft/approved page content; no route-module helper exports |
| `lib/engineering-demo.ts` | Pure scenario/state logic, with no network or real account data |
| `lib/business-enquiry-*` | Small compatible refactor for a fixed engineering context and neutral notification presentation; keep learning defaults |
| `public/images/business/engineering/` | Optimised, permission-cleared product visuals; no raw reference photos or private materials |
| `app/business/engineering/opengraph-image.tsx` | Accurate branded share image if a generated route is used |
| `app/business/page.tsx`, `app/sitemap.ts` | Minimal discovery link and release-ready indexing entry |
| `tests/engineering-demo.test.mjs`, `tests/business-enquiries*.test.mjs` | State/cancellation and compatible submission/queue cases |
| `scripts/check-engineering-browser.mjs` | Synthetic Chromium acceptance, using existing Playwright infrastructure |
| `package.json`, `.github/workflows/quality.yml` | Scoped lint/browser commands and integration into existing checks; retain all campus jobs |
| `docs/business-website-release.md` | New dated local/preview/live evidence, without rewriting historical checks |

Names may be consolidated during implementation if a smaller component boundary is clearer. The responsibilities above are the contract; a new abstraction or dependency must justify itself.

## Acceptance checks

| Area | Required check |
| --- | --- |
| Comprehension | An unfamiliar visitor can identify the problem, contribution, example and next step. Arrange human review and record observations separately; automation cannot establish this. |
| Desktop and mobile | Inspect 320, 390, 768, 1280 and 1440 CSS-pixel layouts, a short phone viewport, and real browser zoom. No clipped controls, page-level overflow, unreadable work preview or fixed-height hero gap. |
| Keyboard and semantics | Heading order, existing main landmark, skip route, selection labels, visible focus, menu dismissal/focus return and contact errors work without a mouse. Essential content needs no hover. |
| Demo behaviour | Test all scenarios, blocked/retry/reset, rapid selection, reduced motion, offscreen/hidden pause and cancellation/unmount. No real service calls or stale scenario results. |
| Hydration and failure | Readable initial content, stable layout and working enquiry/email anchors before hydration. Slow/failed client enhancement must not replace the page with a blank or loading-only view. |
| Enquiry | Missing/invalid/overlong/duplicate fields, tampered interest, honeypot, stale token, rate limit, persistence failure, provider timeout and notification retry. The description limit includes server context. Test old queued learning enquiries as well. |
| Form presentation | Draft retained on error, selected interest editable, no duplicate pending submissions, accessible field errors and accurate recorded-receipt wording. A real notification/inbox check is separate from mocked tests. |
| Existing business journey | Preserve approved learning wording/price/scope, demo, document downloads, form requirements and normal notification behaviour. Recheck only affected routes and links, using the historical release record as baseline. |
| Metadata | Engineering-specific title/description/canonical/share content, successful direct reload and no indexing of incomplete People/case routes. |
| Performance | Inspect production output and network requests. Avoid a new font family, video autoplay, 3D runtime or decorative network dependency in the first release; reserve image dimensions and keep client code focused. Measure actual results before claiming speed. |
| Privacy and boundaries | No form text or screenshots in analytics/logs or public evidence; no new tracking integration. Preserve existing private-study tracking and full-document campus boundaries. |

Run scoped ESLint for changed files, `npm run typecheck`, the existing business enquiry/SQL/email tests plus meaningful new demo/enquiry tests, the proposed browser acceptance and `npm run build`. Run the repository's required quality workflow before release; do not remove unrelated checks to make this change pass. If dirty campus work or an environment dependency causes an unrelated failure, record the exact blocker and verify the isolated change rather than claiming a clean build.

Local passing commands are not evidence of hosted CI or live delivery. Save non-sensitive screenshots and a concise evidence summary; keep real enquiry details private. Record independent human comprehension and actual inbox confirmation only when they occur.

## Release and rollback

Prepare an isolated change set from the approved base, keeping the current unrelated campus edits out. If implementation uses a managed worktree, inspect attachments and reuse a suitable one before creating another. Do not copy a checkout or private environment files recursively.

Before production publication, present the working preview, final claims, enquiry destination, completed checks and remaining gaps. Add the public discovery link and sitemap entry with the release, so an incomplete page is not advertised. A technical preview does not approve new commercial claims, paid infrastructure or accepting paid work under unresolved business gates.

Rollback should remove the new discovery/indexing entries and revert the engineering route and its bounded compatible application changes. Preserve the original learning page and valid enquiries already recorded. The shared notification queue must remain able to process both existing learning records and any engineering records; retain neutral notification handling until those records are safely handled. No database rollback is expected for the proposed schema-free first release.

## References

- [Business master backlog](business-master-backlog.md)
- [Engineering lessons and owner direction](business-engineering-reference-lessons.md)
- [Brand guidelines](brand-guidelines.md)
- [Business website release evidence](business-website-release.md)
- [Installed Next.js pages and layouts guide](../node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md)
- [Installed Next.js Server and Client Components guide](../node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md)
- [Installed Next.js data mutation guide](../node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md)
- [Installed Next.js metadata guide](../node_modules/next/dist/docs/01-app/01-getting-started/14-metadata-and-og-images.md)

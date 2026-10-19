# ScienceDojo Engineering — company study and page audit

19 October 2026. Owner request: study web/IT solution companies, audit the engineering page and implement supported improvements. This is an expert comparative/content/technical review, not a conversion experiment, certification, legal review, demand validation or independent human usability study.

## Main finding

The page's visual craft has improved faster than its buying clarity. A buyer can see engineering ability but still has to infer the service categories, a proportionate first engagement, what an estimate depends on, what they receive at handover and how further work is arranged. Own-product evidence is useful, but fictional demos and large mobile sections delay it. The greatest unresolved trust gap is independent client evidence; no design change can manufacture that.

Keep the education/learning experience as a reason to trust the team while stating websites, web applications and integrations clearly enough for other suitable businesses. Do not change the business into a managed IT provider or imitate large-company staffing, compliance, AI, native-app or service-level claims.

## Method and limitations

- Fresh primary-source review of eight companies: thoughtbot, Netguru, 10up, Fcode Labs, 99x, Atomic Object, Thoughtworks and Electric. Selected official home/service, case, process, commercial and enquiry pages were read on 19 October. Company outcome/certification figures are their own marketing statements, not independently verified results. We do not reproduce those metrics as ScienceDojo claims or treat supplier pricing as our pricing research.
- Sources were assessed for buyer/offer fit, service labels, evidence structure, engagement, risk reduction, continuity and next action. This fresh study uses published page content; it does not claim live mobile/interaction/performance testing of every competitor. Earlier visual lessons remain in the reference record. Zero Gravity's homepage and an attempted 10up services URL were unavailable through the web reader today; that is not evidence that their websites are down. 10up's homepage, case and contact pages were accessible.
- Current local source and saved release evidence were inspected. A repeatable read-only Chromium audit (`scripts/audit-engineering-page.mjs`) records anonymous layout/markup/resource observations. The maintained browser acceptance separately exercises interactions and invalid form recovery. No real enquiry, external contact or email is sent.
- Only local website changes are authorised here. B3/S1/R1, owner approval of commercial commitments, paid-work permission and tested-delivery gates remain intact. No production publishing, new infrastructure, third-party integration or client outcome is inferred.

## What the companies teach us

| Company and primary pages | Observed presentation | Apply at our scale | Do not copy |
| --- | --- | --- | --- |
| [thoughtbot services](https://thoughtbot.com/services), [first conversation](https://thoughtbot.com/hire-us), [Real Simple Energy case](https://thoughtbot.com/case-studies/real-simple-energy) | Services are named by product stage and discipline; enquiry framing asks about the intended result; the case connects the business situation, work and client account. | Make service names explicit and let a short problem description start a fit conversation. Explain our own contribution beside evidence. | Senior-team breadth, client outcomes, regulated-sector delivery or a discovery-sprint timetable that we have not established. |
| [Netguru web development](https://www.netguru.com/services/web-development), [enquiry](https://www.netguru.com/estimate-project) | Website/application services, process, relevant cases and contact routes reinforce each other. Email is an alternative to the form. | Name websites, apps and integrations; expose the next step and an email alternative. Add cost drivers rather than an invented price. | A large technology catalogue, partnerships, enterprise team sizes or quoted supplier budgets as our own rates. |
| [10up home](https://10up.com/), [WCG case](https://10up.com/our-work/wcg/), [contact](https://10up.com/contact/) | A specific web specialism is backed by visible projects. WCG explains a concrete navigation problem and how the work addressed it. | Use a problem/contribution/engineering-decision explanation around our actual sample-data interfaces. Keep proof inspectable. | Client logos, measured conversion results, WordPress specialism or inherited credibility. The current site also references a transition to Fueled; this is a presentation sample, not a claim that its identity is static. |
| [Fcode home](https://www.fcodelabs.com/), [Exazyme case](https://www.fcodelabs.com/case-studies/transforming-protein-analysis-with-a-remote-dream-team), [contact](https://www.fcodelabs.com/contact-us) | Product strategy, remote delivery and engineering are connected to named cases. The case identifies platform, deliverables and collaboration context; contact is direct. | Describe a bounded contribution and named responsibilities. Explain how scoped and continuing work can begin. | Retention, certification, cost-saving, staffing and time-zone coverage claims. No attribution of historical work to a current teammate without evidence. |
| [99x product engineering](https://99x.io/services/product-engineering), [Easy2You case](https://99x.io/case-studies/product-engineering/easy2you) | Capability groups connect to customer stories. The Easy2You narrative moves from a small initial workstream into a longer relationship. | Show a focused first piece and a separate possible continuing arrangement, agreed to actual capacity. | Team scaling, customer portfolio, longevity and outcome numbers. The story establishes how 99x presents the relationship, not a ScienceDojo forecast. |
| [Atomic Object process](https://atomicobject.com/process), [commercial explanation](https://atomicobject.com/money) | Planning, iterative creation and maintenance are explained alongside budget/scope decisions and availability. | Explain what must be agreed before building: brief, priorities, acceptance, fee, dates and continuing responsibilities. | Its minimum budgets, fixed-budget commercial model, employment capacity or promised delivery rhythm. These require owner decisions and our own cost/capacity evidence. |
| [Thoughtworks product development](https://www.thoughtworks.com/what-we-do/product-development) | Strategy, design, delivery and modernisation are distinguishable contributions rather than one generic technology promise. | Let buyers understand whether the next need is a website journey, an application feature or a tool connection. | Transformation programmes, enterprise credentials, AI acceleration or numerical outcomes. |
| [Electric solutions](https://electric.ai/solutions) | Managed IT includes devices, employee support, systems administration and operational coverage, a different responsibility from a web build. | State that our current offer is web software and scoped development. Make ongoing development/support arrangements explicit. | Help-desk availability, response SLAs, device/network management or cybersecurity operations. They are not established ScienceDojo services. |

Interpretation: the useful shared pattern is **clear fit → specific contribution → inspectable evidence → understandable engagement → clear next action**. This is a design inference from the sample, not proof of conversion performance. More logos, AI language, animation, a larger service list or a new generic “IT solutions” label would not close our actual gaps.

## Baseline of our page

Before this increment, the local production fixture measured:

| Viewport | Page height | First real product-proof section | Contact section |
| --- | ---: | ---: | ---: |
| 1440×1000 | 7,407 CSS px | 2,244 | 6,363 |
| 390×844 | 11,746 | 3,052 | 9,776 |
| 320×568 | 12,289 | 3,380 | 10,328 |
| 768×1024 | 8,414 | 2,695 | 7,216 |

These are local document positions, not attention, abandonment or conversion measures. The first proof begins about 3.6 viewport heights down at 390×844. The header CTA still provides a direct contact route; a long document does not mean contact is inaccessible. Default demo detail and large phone portraits are concrete places to reduce reading/scrolling cost.

The baseline probe found no horizontal page overflow, duplicate IDs, unresolved local anchors, missing image alt attributes, missing visible field labels or dangling descriptions at these four sizes. Its button/summary/select/input size screen found no controls below its 44px-height/24px-width heuristic. This is a useful limited screen, not a complete accessibility audit. Initially requested script bodies totalled 234,357 encoded bytes across 13 script resources in this fixture; cache, compression and route/runtime affect these numbers. No field Core Web Vitals or intended-device performance is inferred.

Baseline evidence: `output/design/engineering-audit-before/audit.json` and screenshots. The preview had stopped before the audit and was restored; the first failed connection was not reported as a page defect or passing audit.

## Complete page audit and disposition

Priority means relevance to a buyer completing this page's task, not a numerical conversion score.

| Area | Baseline assessment | Priority | Change / disposition |
| --- | --- | --- | --- |
| Service comprehension | Hero emphasises learning; general website/app/integration offer is partly inferred | High | State three concrete web services, with education experience retained in supporting copy |
| Audience fit | Useful domain experience; other suitable businesses may assume exclusion | High | Welcome suitable business applications explicitly without claiming all-industry expertise |
| Deliverables | A scope sentence exists inside optional detail | High | Expose a bounded first-project example for each service without a click |
| Evidence ordering | Fictional demo detail competes with real own-product proof | High | Keep a static visual, make the detailed decision exercise optional; retain problem-before-proof order |
| Case quality | Authentic images and in-house label; little problem/contribution/decision framing | High | Add concise case facts; keep images and labels; no client or uplift claim |
| Independent trust | No verified engineering-client case/testimonial | High, evidence gap | Remains open; obtain permission and evidence from real work, never manufacture |
| Engagement | Scoped/ongoing options are a sentence | High | Explain both options, first step and project-specific capacity in a compact treatment |
| Price and schedule | No engineering price; no explanation of estimation inputs | High | Add cost/timeframe FAQ covering scope, access, integrations, review and acceptance; do not invent rates or durations |
| Handover / continuity | Source/setup/support mentioned generally | High | Clarify account/source/licence/setup responsibilities and separately agreed continuing work |
| Quality / risk | Working implementation, but broad assurance would overclaim | Medium | Explain agreeing key-journey checks and required environments; no blanket certification or compliance badge |
| Technology | React/Next.js evidence exists, but service scope may be unclear | Medium | Put specific existing-application fit in FAQ; avoid a wall of unverified platform logos |
| IT category boundary | “IT solutions” could imply managed operations | High | Answer what kind of work we take on; no help-desk/network/security service promises |
| First conversation | Named contact and email exist; the reply's purpose is vague | Medium | Explain fit → agreed brief/estimate → development decision; no response-time promise |
| Form friction | Organisation required by existing server/SQL contract; privacy hint and recovery work | Medium | Keep required contract; add a fictional example brief via native disclosure; no new sensitive fields |
| Mobile hierarchy | Tall portraits and fully expanded exercise delay reading | High | Compact phone profiles, optional demo depth; retain readable controls, images and roles |
| Visual identity | Coherent exact blue/navy/cyan, connected artwork and restrained motion | Retain | Preserve; adjust spacing rather than rebuild the visual system |
| Navigation | Direct anchors/skip/menu exist | Retain | Name Services clearly and retain Work/Approach/Team/contact; test focus and anchor clearance |
| Accessibility | Limited structural screen passes; full human/device audit absent | Medium | Recheck semantics, names, disclosure keyboard, focus/error recovery, reduced motion and no-script. Real zoom/device and independent assistive-technology assessment remain open |
| SEO / sharing | Canonical/metadata/share PNG/sitemap exist; title is learning-led | Medium | Align title, description and share wording with actual web-service scope. No invented ratings or guaranteed ranking |
| Performance | Lightweight SVG, local WebP and no new decorative runtime; field data absent | Retain / measure | Keep no new dependency. Record bounded before/after local payload/layout observations, not a Lighthouse/real-device score |
| Privacy / enquiry reliability | Existing private pipeline, validation/retry tests and retained errors | Retain | No new backend, tracking, storage or live enquiry submission. Engineering-specific inbox receipt remains unverified |
| Legal / commercial identity | Generic ScienceDojo footer | Medium | Use the established registered company name in prose; no unverified address/registration/certification details |
| Conversion evidence | No independent comprehension or engineering conversion study | Evidence gap | Keep open. Proposed next human task: identify service, find relevant proof, explain first step and draft a non-confidential brief |

## Implementable scope

1. Clarify the service promise, selector labels and always-visible first-project examples; align metadata/sharing.
2. Keep three distinct illustrative visuals but move detailed controls into an optional native disclosure. Cancel/reset a closed exercise so old timers cannot overwrite a later interaction.
3. Improve the own-product case facts without recasting the LMS as client work.
4. Explain focused versus continuing work, estimation, handover, quality checks and operational boundaries using the existing confirmed arrangements. Prices, availability and commercial terms remain per brief.
5. Add a fictional sample brief and a clearer reply expectation. Preserve existing required fields, validation, private queue, success/error meaning and email alternative.
6. Compact phone team profiles, retain the mature visual direction and test the result. Preserve all three portraits and no raw photographs.

## Evidence still needed outside a website edit

- A real engineering engagement with permission to show the brief, delivered slice, personal contribution and observed result; a relevant approved testimonial if the client offers one.
- Numerical capacity, actual workload, engineering pricing/quotation rules and business permission, owned through B3/R1; the existing learning price is unchanged.
- Intended-device/zoom/assistive-technology testing and unfamiliar-buyer comprehension. Automated fixtures do not establish these outcomes.
- Engineering-specific real inbox receipt and production verification before claiming a released conversion path. Prior learning-enquiry evidence remains historical and distinct.
- Real buyer conversations about willingness to commission this bounded work. Competitor websites establish neither our demand nor sustainable economics.

## Implementation and verification

Implementation results, final measurements and screenshots are appended after checks complete. Proposed actions above are not recorded as passed, published or owner-accepted merely because this audit exists.

### Implemented and checked locally

All six implementable items above are now in the local page. The service promise and sharing metadata name websites, web applications and integrations; training/education experience remains in the supporting copy. Services have visible first-scope examples, the deeper synthetic exercise is optional, the in-house case explains need/contribution/decision, and engagement/estimate/handover/quality/support answers are present. The form provides a clearly fictional brief and explains fit/brief/agreement before development. The established registered company name appears in footer prose. Phone profiles retain the three drawn portraits at smaller square sizes with matching responsive image requests; no new library, backend, commercial rate or operational service was introduced.

Final like-for-like local layout measurements (default disclosures closed):

| Viewport | Before → after page height | Before → after real proof top | Before → after contact top |
| --- | ---: | ---: | ---: |
| 1440×1000 | 7,407 → 7,636 | 2,244 → 1,990 | 6,363 → 6,530 |
| 390×844 | 11,746 → 11,273 | 3,052 → 2,858 | 9,776 → 9,112 |
| 320×568 | 12,289 → 12,019 | 3,380 → 3,055 | 10,328 → 9,865 |
| 768×1024 | 8,414 → 8,801 | 2,695 → 2,625 | 7,216 → 7,539 |

At 390px, contact begins 664px earlier and proof 194px earlier. Desktop/tablet documents are longer because buying/engagement information was added; this trade-off is retained explicitly rather than described as a universal reduction. These positions show layout change only, not attention, conversion or comprehension. The fixture's 13 initially requested script resources remained 13, with encoded bodies increasing from 234,357 to 234,736 bytes (+379). No new runtime dependency was added. This is neither a complete lazy-loaded transfer total nor a field performance result.

Final checks passed:

- Scoped engineering ESLint (including the repeatable audit script), type checking, final production build and whitespace checks.
- All 37 focused demo/enquiry/SQL/email regressions; no valid live form or email was submitted.
- Final maintained production-mode Chromium acceptance: responsive widths 320/390/768/1280/1440 and a short phone; original motion pause/tilt cleanup/live reduced-motion/background/offscreen checks; no-script copy; actual sample-data previews and illustrated portraits; service/context choices; optional-exercise keyboard use and close cancellation; decision/failure/retry/reset/stale-result paths; scoped/continuing modes; estimate/handover/quality/support FAQ keyboard use; fictional brief guidance; focused invalid-form errors and retained drafts; learning offer/demo/download preservation; no browser errors.
- The final read-only structure audit passed at the four tabled sizes with no overflow or the enumerated label/ID/anchor/alt/description defects. Its control-size screen returned no candidates. This does not establish full assistive-technology or WCAG conformance.
- Desktop opening and actual case, phone engagement/contact/profiles and the updated sharing PNG were visually inspected. Images and essential content render without an additional external design runtime.

Final evidence: `output/design/engineering-audit-after/audit.json`, matching viewport captures and `sharing.png`; comparison input is `output/design/engineering-audit-before/`. Maintained acceptance evidence is temporary `sciencedojo-engineering-browser-DB3Aih` (existing CI policy retains hosted synthetic evidence seven days; no hosted run is inferred). Earlier intermediate failures were test-locator issues corrected before the final pass; an initially removed icon import was restored and the final build/type check passed. No unresolved application check failure is hidden by the final result.

The final build is served locally at `http://127.0.0.1:3105/business/engineering`. This increment is unpublished. Owner visual/likeness acceptance, real-device/zoom/independent buyer tests, engineering inbox receipt, live production checks and the commercial evidence gaps above remain open. No outbound approach, account/schema change, paid infrastructure or production deployment occurred.


### Subsequent visual UX follow-through

The [client-comprehension review](business-engineering-client-ux-review-2026-10-19.md) adds primary UX principles, buyer-question mapping and refinements to headings, selection cues, artwork coherence and first contact. Its final measurements are a subsequent local revision, not replacements for the like-for-like company-audit table above. Final normal build/type/scoped lint, 37 focused regressions, expanded browser acceptance and the four-size layout audit passed; see the dated release record. Independent client proof and buyer comprehension remain open.

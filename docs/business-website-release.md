# Business website verification and release

The business page now presents the Custom Onboarding Module for English-working IT service and software implementation teams. It was first published as the Onboarding Task Pilot on 9 October 2026, after the owner explicitly approved publication, including the claims, €1,490 starting price, scope, founder copy, and handover terms. That release was published to [the business page](https://www.sciencedojo.co.uk/business), and its live content, demo, form, links, and sharing image were verified. The follow-up improvement is recorded below; earlier checks describe the release on their stated date.

## Verification on 9 October 2026

| Requirement | Evidence | Release status |
| --- | --- | --- |
| W1 Opening section | Names the audience and the problem of applying an established process. The main actions are “Discuss a pilot” and “Try the demo”. Both live anchors were checked in the browser. | Approved and verified live. |
| W2 Pilot offer | Shows the €1,490 starting price, source and interaction limits, all nine inclusions, two consolidated reviews, exclusions, and proposal conditions. No unconditional delivery date, LMS compatibility, or continuing hosting promise is made. | Approved and verified live. |
| W3 Workplace demo | Fictional label remains visible at the demo anchor. Live keyboard checks covered all three decisions, feedback, review, focus movement, and restart. | Verified live. |
| W4 Founder | Copy describes teaching, learning design, development, thesis research, and direct collaboration. Portfolio and thesis case study links returned HTTP 200. Exact degree completion, current employment, commercial outcomes, and sole OwlMentor software ownership are not claimed. | Approved and verified live. |
| W5 Enquiry form | Name, email, organisation, and workplace task are required; timing is optional. Labels, privacy notice, email alternative, public access, and draft retention were checked. The live form displayed required-field errors and then accepted a valid enquiry with timing blank. | Verified live. |
| W6 Enquiry route | The owner confirmed both the earlier real-backend test and the further live-site browser submission reached the hello inbox. The production enquiry was saved and its notification accepted on the first attempt with no recorded error. Visitor confirmation reflected database receipt. Validation, provider failure, timeout, deduplication, retries, spam checks, and private SQL access are covered by focused tests. | Live storage, visitor confirmation, and actual inbox receipt verified. |
| W7 Usability | Keyboard controls and focus, field labels, 16px form text, and responsive widths of 320, 375, 640, 1280, and 1440 CSS pixels were checked locally. Live checks at 375px confirmed no horizontal overflow, 16px field text, and a visible 2px keyboard focus outline. The owner tested the enquiry form and three-decision demo at actual 200% browser zoom and confirmed both remained usable without clipped controls or sideways scrolling. | Local, live mobile/keyboard, and owner zoom checks passed. These checks are not accessibility certification. |
| W8 Links and sharing | Live corporate title, description, canonical URL, Open Graph, and Twitter metadata were verified. The sharing endpoint returned a valid 1200×630 PNG. Portfolio, product, privacy, terms, and artwork links returned HTTP 200; local anchors resolved. | Verified live. |

The founder statements are supported by the founder's own [portfolio](https://piumal.com/) and [thesis case study](https://piumal.com/projects/owlmentor?lang=en), and the owner approved the wording before publication.

The owner subsequently approved a pricing clarification: “From €1,490 per pilot project”, a five-item deliverables summary immediately below the price, and an explanation that 5–10 minutes is learner practice time while the fee covers briefing, design, development, assessment, reviews, and handover. The existing nine detailed inclusions, scope boundaries, and proposal terms were preserved. Scoped ESLint and local desktop, 375px, and 320px layout checks passed; the summary had no horizontal overflow at either phone width.

The complete focused test command passed 28 tests:

```sh
node --experimental-strip-types --test tests/business-enquiries.test.mjs tests/business-enquiries-sql.test.mjs tests/email-delivery.test.mjs
```

Scoped ESLint, `git diff --check`, and `npm run build` passed. Node's module-format warning during the tests did not affect the result.

The business implementation was introduced in commit `5313447`. A further build of that commit in an isolated temporary checkout could not be completed: Turbopack rejected its external dependency symlink, and the Webpack fallback could not download the existing Google Fonts through the sandbox. That additional build remains unverified; these environment failures did not identify a source defect or change the earlier successful standard build.

The approved release commit `29008b87aa58c542c639b5d2c06732e80f6d9034` was pushed to `main`. [Vercel deployment 2R8YQn5V6QQCcF2ZCYVaNtAUryjf](https://vercel.com/sciencedojo-s-projects/sciencedojo-web-app/2R8YQn5V6QQCcF2ZCYVaNtAUryjf) reported success, confirming that the published release built successfully. Unrelated German academy changes remained outside the committed release. The existing site URL configuration uses apex metadata URLs, which redirect to `www`; the redirected page and image present the correct corporate offer.

## Database and notification configuration

[Migration 068](../sql/068_business_enquiries.sql) was applied once to the production Supabase project configured in `.env.local`. Both tables were absent before application. An anonymous REST read was denied with PostgreSQL permission error `42501`; the server account could read the table. Do not rerun the creation migration against that project without checking its state.

The action needs the existing Supabase URL and service-role key, plus a working Resend key and verified sender. The recipient defaults to `hello@sciencedojo.co.uk`; `BUSINESS_ENQUIRY_RECIPIENT_EMAIL` can override it. A stable `BUSINESS_ENQUIRY_RATE_LIMIT_SECRET` is optional, with the private service key as fallback. Changing that secret changes deduplication fingerprints.

Production IP handling expects Vercel's overwritten `x-forwarded-for` header. Unsupported production proxy configurations fail closed. Abuse limits are three new enquiries per email and five per IP in each ten-minute window. Only hashes are stored for those request limits.

The retry route requires the existing `CRON_SECRET`. The deployed business retry route rejected an unauthenticated request with HTTP 401 and `Unauthorized`. The published Vercel configuration includes its daily 06:30 UTC schedule.

## Notification operation

Each enquiry is saved before notification. Email submission has an eight-second abort deadline. Failed or timed-out notifications remain queued; a successful visitor confirmation means the enquiry was recorded. No automatic acknowledgement email is sent to the prospect.

The daily worker processes at most five queued notifications per invocation. It permits five attempts within seven days, recovers expired leases, and retains exhausted enquiries. A prolonged outage or larger backlog needs operator attention before that window expires. Check queue states in the private database:

```sql
SELECT notification_status, count(*)
FROM public.business_enquiries
GROUP BY notification_status;
```

`sent` records provider acceptance, not an inbox read. HTTP 200 from the worker can coexist with queued or exhausted notifications; inspect its counts and the stored queue state. If a provider accepts a message but recording that result fails, a later retry beyond the provider's idempotency window can duplicate the staff email while keeping one enquiry record.

The retained QA enquiries are labelled `ScienceDojo — website verification 2026-10-09` and `ScienceDojo — production website verification 2026-10-09`. Treat them as website tests, not prospects. The production test has enquiry ID `ca4e4cfd-31bf-4cc6-b4b4-b8ebf18a0bb2` and provider message ID `01a1226a-02dd-714f-98d2-7c74f3c32597`. It was recorded as `sent` on attempt 1 with no notification error. A read-only provider-event lookup returned HTTP 401, so provider delivery events were not independently verified. The owner independently confirmed the production test was received in the inbox, completing the receipt check.

## Completed release checks

1. Owner approval received for the commercial claims, price, pilot scope, founder wording, and handover terms.
2. Business upgrade committed and published; unrelated German academy work excluded.
3. Deployed page, metadata, sharing image, main anchors, and full keyboard demo journey verified.
4. Clearly labelled production enquiry saved, accurate visitor confirmation shown, and actual inbox receipt confirmed by the owner. Unauthenticated retry-route access rejected.
5. Deployed release and results recorded here. The actual 200% browser zoom check on the contact and demo journeys was completed by the owner before publication.

## Offer and evidence improvement — 10 October 2026

The owner asked to implement the recommended improvements after reviewing competitor prices. The offer name is now **Custom Onboarding Module**, with **From €1,490 per project**, one task, one audience, English, up to three decisions, an application exercise, a scoring guide, two consolidated reviews, and agreed checks. The duration is consistently an estimate of **5–10 minutes of total learner practice**, including decisions, application, and review; it is not a measured learner completion time or a universal course-development price.

The standard handover is a self-contained HTML browser module with its readable, editable HTML/CSS/JavaScript, approved learning design, the exercise/scoring guide, and setup instructions. The organisation may keep and use the delivered module internally without a ScienceDojo subscription or per-learner charge. It supplies suitable hosting if required. Reusable components and third-party assets retain their applicable licences. Browser and delivery-route suitability, final price, taxes, and dates are confirmed before signing. Managed hosting, updates, rollout support, SCORM, LMS reporting, integrations, accounts, certificates, and central response storage are outside the base package.

The unchanged three-decision example is labelled a quick excerpt. The complete fictional example now includes an application exercise, an illustrative learner response, a worked four-criterion review and revision, learning brief/storyboard, review checklist, and proposed evaluation plan. It has not been evaluated with a client team. The worked response acknowledges an outstanding policy-link check but omits its owner, deadline, and follow-up; the rubric correctly rates that criterion as partly demonstrated.

Five downloadable files live in `public/business/examples`. Regenerate them with:

```sh
node scripts/build-business-example.mjs
```

The generator reads the same pure decision logic and example data as the page. It embeds styles and JavaScript without API, CDN, font, or asset dependencies. Typed practice responses are neither submitted nor persisted. The companion documents are editable Markdown; keep them beside the HTML file for relative document links to work.

Local verification:

- Scoped ESLint and the four existing decision tests passed, including all 27 decision paths.
- The generator passed syntax, deterministic-generation, ID, label, anchor, document-link, and external-dependency checks.
- `npm run build` passed compilation, TypeScript, and production output. An existing unrelated SEO page retried after a timeout and then completed successfully.
- The module ran from both the existing Next development server and an ordinary Python static server with no ScienceDojo application dependency. Browser checks covered a mistake followed by repair, feedback, completion, restart, heading focus, visible keyboard focus, and response clearing/reload.
- The on-page application exercised temporary input, clearing, and a keyboard-operated sample-review disclosure. Mobile layouts were checked at 375 and 320 pixels with no horizontal page overflow; the new input and enquiry fields use 16px text on mobile.
- The independent module also had no horizontal overflow at 320 and 375 pixels, with 16px input and control text. All five downloadable responses returned HTTP 200, explicit attachment filenames, and `nosniff`; their bodies matched the generated files byte for byte. A browser download saved the HTML file successfully, and that saved copy also matched the generated source.
- The updated social-sharing image returned a valid PNG and was visually checked for readable offer and price text.
- Automated direct-file navigation was blocked by the browser's URL policy. A manual saved-file check was requested; it must not be recorded as passed without the owner's response. Static-server operation and source dependency checks do not substitute for that check.

The existing enquiry backend and notification configuration are unchanged. The owner-confirmed inbox tests above remain the receipt evidence; fictional practice responses are not enquiries.

### Validation for the next client conversations

Use a private sales record for the next three to five qualified opportunities. Do not put prospect details or raw learner responses in this repository or the public example. Record:

| Item | What to capture |
| --- | --- |
| Fit | An established task/process, approved source material, subject expert, learner group, and decision maker. |
| Comprehension | What the buyer believes the €1,490 starting fee includes, where the module runs, and whether they understand continued internal use. |
| Buying decision | Actual budget disclosed, quoted scope/price, accepted or declined outcome, and stated objections. Do not infer a budget from employee count. |
| Effort and costs | Actual briefing, design, development, assessment, revision, QA/handover, and sales hours; direct costs and any separately priced work. |
| Evidence agreement | Task criteria, comparable before/after exercises if suitable, who reviews them, permission and agreed handling of learner work. |

The original planning allowance was 20 project hours plus four contingency hours, not a measured delivery result. Recalculate price or scope from actual work rather than stretching the package or advertising a market average.

For the first real case study, agree the task and rubric before building, use different comparable requests before/after where appropriate, record participation and review method, note other training or support, and inspect workplace transfer with the client. Publish only with permission, including the limits and contrary findings. Do not publish the fictional example's ratings as client results. These are ready-to-use evaluation instructions, not a claim that a real client project has already happened.

## Homepage navigation maintenance — 13 October 2026

A read-only live check returned HTTP 200 for the homepage and business page. The homepage had one business link, Company → For Business in the footer, without an account requirement. Desktop navigation and the mobile menu had no business link.

For Business is now an unconditional local link to `/business` in the desktop navigation and mobile menu. Desktop focus has a visible 2px outline and a 44px-high target. The mobile link uses the existing focus styling and closes the menu on activation. The drawer now scrolls vertically, after the short-phone check showed Sign up below the viewport with all currently enabled menu items.

Local verification passed:

- Scoped ESLint for NavbarClient and MobileNavbarMenu, plus `npm run typecheck`.
- At 1280 × 900, all six desktop navigation links fit without overlapping the guest account/assessment controls; the business link is visible after Resources.
- At 375 × 667, the menu has 659px of content in a 587px scroll area. Keyboard access reaches the lower utilities; Sign up is visible after scrolling.
- Escape closes the drawer and returns focus to its trigger. Keyboard Enter on the mobile business link and clicking its desktop counterpart reach the public business page, whose heading is visible. Body scrolling is restored after navigation.

Screenshots: [desktop navigation](../output/qa/business-nav-desktop-2026-10-13.jpg) and [mobile navigation](../output/qa/business-nav-mobile-2026-10-13.jpg).

**Release status:** local implementation and checks only; no commit, push or deployment has been performed for this maintenance. The previously deployed footer route remains the live-site evidence. No enquiry submission, owner approval of new commercial claims, or accessibility certification is implied by these navigation checks.

## Readable supporting documents — 14 October 2026

After the owner reported confusion about Markdown-only downloads, the four supporting documents now have complete PDF reading copies alongside their editable text sources. The page's primary action is Download PDF; each card also has a distinct Editable text (.md) link. The heading is Explore a sample delivery package, with a plain-language explanation of the formats. The package has an `example-package` anchor. The HTML demonstration, commercial offer, fictional label and human-review assessment remain intact.

The PDFs are generated from the canonical Markdown, which itself comes from the shared example data through the existing Node generator. Regenerate in this order:

```sh
node scripts/build-business-example.mjs
python3 scripts/build-business-documents.py
```

The Python step requires ReportLab, supplied by the Codex bundled Python runtime. If the system Python lacks it, use the bundled Python executable. It builds all four by default, accepts an individual document name, and rejects unknown names clearly. It uses available Unicode fonts with fallbacks and invariant metadata for repeatable output on the same runtime/fonts. No new runtime or build dependency was added to the website; the generated PDFs are static assets.

| PDF | Pages | Bytes |
| --- | --- | --- |
| learning-design.pdf | 1 | 46,426 |
| assessment-guide.pdf | 3 | 50,468 |
| client-review-checklist.pdf | 1 | 45,602 |
| setup-and-use.pdf | 2 | 50,226 |

Verification passed:

- All seven pages rendered with Poppler and were visually inspected for legibility, pagination, glyphs, headers and footers. All 105 source blocks and source hashes matched; 24 public link annotations were verified. Consecutive regeneration produced identical PDF hashes.
- Scoped ESLint and type checking passed. The Node example generator parses the standalone runtime and rejects remote runtime assets/response persistence as before. Actual Node → Python regeneration succeeded; the no-argument, single-document and invalid-name parser paths were checked.
- All four local PDF routes returned HTTP 200, `application/pdf`, explicit attachment filenames and `nosniff`. Response bodies matched the PDF assets byte for byte. A browser click saved learning-design.pdf, whose saved bytes matched the source asset.
- The business page presents four PDF and four editable-text links with distinct accessible names, sibling anchors and visible 2px inset keyboard outlines. Layout checks at 1280px, 375px and 320px found no horizontal page overflow; secondary links have 44px-high targets.
- The standalone HTML has separate links to all four PDFs and their four editable text versions. It explains that these companions are separate downloads and must be kept alongside the HTML for relative links. Setup notes distinguish reading PDFs from editing text and qualify direct saved-file use: check the chosen browser/delivery route before relying on it with learners. This does not complete the still-pending saved-file operation test.

Screenshots: [desktop document downloads](../output/qa/business-documents-desktop-2026-10-14.jpg) and [phone document downloads](../output/qa/business-documents-mobile-2026-10-14.jpg).

**Release status:** generated assets and website changes are local, uncommitted and unpublished. Public PDF links embedded in the documents will be available after deployment. No Word-document capability, client outcome, enquiry receipt or certification has been inferred from these format improvements.

### Document wordmark alignment

On 14 October, Piumal confirmed the logo should use the simple lowercase wordmark **sciencedojo.**, with a trailing dot. Both PDF generators now render navy lowercase lettering and a teal dot on the same baseline, matching the existing business-page wordmark. The four supporting documents and two-page brochure were regenerated. All nine pages were rendered and visually checked: the wordmark and dot are present without clipping or overlap. Body content, legal company naming, page counts and all 28 PDF link annotations match their previous versions. The table above reflects the updated PDF sizes. [Brand guidelines](brand-guidelines.md) record the rule, and AGENTS.md directs future document work to follow it. Publication remains pending.

## Engineering page — local implementation, 19 October 2026

The owner requested implementation of the saved engineering-page plan. `/business/engineering` now has a restrained cream/navy/teal design, a problem-led opening, three selectable workflow/application/integration scenarios, explicit run/recovery/retry/reset controls, a labelled excerpt from the existing fictional workplace example, approach, FAQ and an engineering enquiry form. No portraits, invented client outcomes or engineering prices were added. The original `/business` offer, €1,490 price, demo, downloads and learning form are retained; its header gains an Engineering link. Canonical/social metadata, a generated PNG sharing image and the sitemap entry are prepared locally.

The enquiry adapter validates an allowlisted interest and a 2,800-character description, then constructs fixed engineering context inside the existing 3,000-character goal contract. It reuses private RPC storage, hashed limits, UUID duplicate/conflict handling and the durable notification queue. Staff notification wording now covers either business arm. Organisation remains required. No migration, provider configuration, deployment or paid service changed; no valid live enquiry was submitted.

The page is prerenderable. Browser forms receive a fresh mounted-form UUID rather than a shared cached token. The shared action can generate/return a token for an unenhanced submission. The inherited streaming loading boundary initially hid the finished HTML without scripts. A page-local no-script stylesheet now reveals only the completed container containing `#engineering-content`, hides the generic loading marker and removes inactive demo buttons. Its hidden-container override uses the existing `theme` cascade layer to precede the global reset's important hidden rule. `RouteLoading` only gains a data marker. Scripts-enabled loading and the campus document boundary are unchanged. No-script content/email fallback was tested; native no-script form recovery is not claimed.

Verified locally against the production build:

- `npm run build`, scoped engineering ESLint, type checking and `git diff --check` passed. The private workbook build-trace exclusion check passed.
- 36 focused demo/enquiry/SQL/email tests passed. Synthetic PGlite coverage exercises the actual existing SQL contract, context persistence, duplicate/conflict handling and notification retry; it makes no external provider claim.
- Chromium acceptance passed at 320×667, 390×844, 768×1024, 1280×900, 1440×1000 and 390×568. Checks include direct anonymous entry, one main/header, metadata/share-image response, no horizontal page overflow, mobile menu focus/Escape, all scenarios and recovery states, rapid cancellation, offscreen pause/resume, reduced motion, focused invalid-form errors, retained draft/interest, no-script opening/default explanation/email fallback, learning price/demo/download responses, and absence of browser page/hydration errors.
- Synthetic screenshots and `evidence.json` are in the local temporary directory `sciencedojo-engineering-browser-hwAM2r`. The acceptance script accepts a loopback `--url`; without one it owns a production-mode server after `npm run build`. The existing local browser binary was selected through `ENGINEERING_CHROMIUM_PATH`. CI installs its own matching Chromium. New CI steps retain synthetic engineering evidence for seven days; hosted CI has not run for this change.
- The full `npm test` attempt could not finish because the unrelated Colyseus fixture uses fixed port 2568, which is already occupied (`EADDRINUSE`). The existing service was left alone. This is not a full-suite pass.

Desktop and phone visuals were inspected. Real 200% browser zoom, intended-device checks, independent human comprehension, owner design acceptance, live engineering receipt/inbox delivery and production deployment remain pending. Local acceptance does not establish accessibility certification, buyer conversion or service capacity. The localhost preview is for owner review and is not publication.

Rollback removes the new route, Engineering discovery/indexing entries and bounded form adaptation. Preserve any saved enquiries and keep neutral queue notification handling for records from either arm. Keep unrelated campus changes out of any eventual engineering commit/PR.

### Original ScienceDojo palette — owner refinement, 19 October 2026

Piumal requested returning the engineering page to the original ScienceDojo colours. The engineering stylesheet now reuses the main-site primary blue `#0066FF`, navy `#001A44` and cyan tokens, with white/pale-blue surfaces, darker blue for small accent text and the existing semantic warning/error colours. Header/footer/example wordmarks and the sharing image use the continuous lowercase navy/blue/cyan treatment. Layout, content, interactions, enquiry logic and the existing learning offer are unchanged. The engineering plan, lessons, brand guidelines and AGENTS.md now record this palette correction; B3/S1/R1 and all business gates remain unchanged.

Production build (including TypeScript), scoped engineering ESLint, whitespace checks and the existing production-mode Chromium acceptance passed again. Desktop, navy evidence-section and phone visuals were inspected. New synthetic screenshots/evidence are in local temporary directory `sciencedojo-engineering-browser-EJqxfp`. The existing local preview was refreshed at port 3105; this is not publication, hosted CI or a new live enquiry/inbox check.

### Research-informed engineering revision — owner-requested local development, 19 October 2026

The owner requested implementing the audience/case/team refinement after reviewing the research. The opening now explains websites, learning platforms and connected workflows for training/education teams, with an explicit invitation for suitable web-product work in other sectors. Two accurately labelled in-house narratives replace the fictional workplace lesson as primary engineering evidence: the ScienceDojo learning platform and its website/enquiry operations. The existing learning offer, price, workplace demo and downloads remain at `/business`.

The product case reuses the existing approved learner/parent/tutor sample-data screenshots and mobile variants. Keyboard-operable view buttons update the actual screen and explanatory caption; a full-size image link and public walkthrough are available. Authoring/publication, course access/progress and private saving are described as implementation examples, without claiming every underlying flow received a fresh live walkthrough or attributing historical code to individual team members. No copyrighted workbook pages, real learner records, private campus evidence or generated interface screenshots were added.

The three buyer entry points are Website journey, Learner experience and Connected operations. Each synthetic sketch now has a real design choice: the selection changes its result, a problematic choice produces an explanation, and an explicit correction/retry restores the useful route. Temporary-failure recovery, reset, stale-attempt cancellation, offscreen pause and reduced motion remain. No live integration is called. The existing server allowlist keys remain workflow/application/integration/unsure; their readable enquiry labels now match the broader buyer descriptions. The SQL fixture assertion was updated to verify the new integration label while retaining persistence/deduplication/retry checks. No schema or notification-provider setting changed.

The page includes the owner-confirmed Piumal/Tharindu/Yelka responsibilities and Piumal as initial contact, with project-specific scope, delivery team and availability. Scoped projects and ongoing development can both be discussed. No full-time capacity, staffing guarantee, response-time promise or engineering price was introduced. There are no portraits. Typography, controls and captions were enlarged, section compositions vary, the original blue/navy/cyan palette is retained, the engineering wordmark returns to its own page and Learning Design has an explicit route. Metadata and the sharing image reflect the revised proposition.

Verified locally on the final application output:

- `npm run lint:engineering`, `npm run typecheck`, `npm run build` and whitespace checks passed. All 102 CSS-module references resolve after removal of two unused references.
- **37 focused tests passed** across the engineering demo/enquiry, shared enquiry/SQL and email-delivery suites. New coverage verifies that a visitor's choice affects the outcome and that late completion cannot overwrite a changed input.
- Maintained Chromium acceptance passed against the production build on local port 3105 at 320×667, 390×844, 768×1024, 1280×900, 1440×1000 and 390×568. It checks actual image loading and keyboard view switching, explicit arm links, team names, a heading clearing the sticky header after navigation, all three meaningful decision/correction/failure/reset paths, cancelled attempts, offscreen/reduced-motion behaviour, focused invalid-form recovery and retained drafts, no-script content/email fallback, metadata/share-image response, existing learning price/demo/download responses and no browser page/hydration errors.
- Final screenshots and `evidence.json`: local temporary directory `sciencedojo-engineering-browser-tnP2pK`. Additional desktop/product/explorer/team and phone/menu viewport images were inspected; the share image was inspected at 1200×630. CI's existing seven-day synthetic evidence retention remains; no hosted CI result is inferred.
- The first restricted browser invocation could not access loopback (`EPERM`); the authorised outside-sandbox run passed. The helper now fails immediately on that restriction instead of polling for two minutes. A concurrent-compiler build rerun stalled; only this task's preview/build processes were stopped, and the final build and browser verification completed. The local production preview is serving at `http://127.0.0.1:3105/business/engineering`.

No valid live enquiry, provider email, deployment, hosted migration, paid service or outreach was performed. Owner design acceptance, real browser 200% zoom, intended-device and independent human comprehension checks, actual engineering inbox receipt and publication remain separate. The unrelated campus suite was not rerun for this page-only revision; its earlier fixed-port blocker remains historical. B3/S1/R1 and the paid-work/tested-delivery gates are unchanged.

### More imagery and controlled motion — owner-requested local refinement, 19 October 2026

The owner requested more images and impressive animation because the page felt text-heavy. The engineering page now has three original AI-generated conceptual assets in its original blue/navy/cyan art direction. They were visually inspected, converted to versioned 1440×960 WebP assets and placed in `public/images/business/engineering/`:

| Asset | Purpose | Encoded source bytes |
| --- | --- | ---: |
| `connected-systems-hero-v1.webp` | Connected glass frames turning scattered pieces into a usable path | 111,796 |
| `reliable-workflow-v1.webp` | Connected channels illustrating retained work between systems | 132,532 |
| `studio-process-v1.webp` | Warm studio still life supporting discovery/design | 137,740 |

These are labelled concept/studio imagery, not product evidence, a real office/team photograph or client work. The actual learner/parent/tutor dashboard screenshots remain approved sample-data views. The LMS case is now a compact two-column supporting feature, with less repeated explanation and no product-tour promotion. Its three view controls and full-size image link remain. The workflow and approach sections use the new images to break up text while preserving the offer and confirmed team responsibilities. No portraits, new delivery claims, engineering price or service-capacity promise were added.

`EngineeringVisualMotion.tsx` composes server-rendered content inside a small client boundary. It adds bounded pointer tilt, offscreen-aware floating labels and light sweep, one-time entrances for visual blocks, hover details and a reading-progress line. Browser media/visibility state uses `useSyncExternalStore` with a static server snapshot. Pointer/scroll updates request frames only in response to input, with cleanup on leave/pause/unmount; no continuous JS frame loop, WebGL, new animation package, video, tracking or network service was added. Manual pause/resume and live OS reduced-motion changes stop the effects; hidden documents and offscreen scenes pause. Essential copy is never hidden behind a reveal. No-script users receive static imagery and the existing readable content/email fallback, with inactive motion controls hidden.

Final local verification:

- Scoped engineering ESLint, type checking, production build and whitespace checks passed. **37 focused demo/enquiry/SQL/email tests passed.** No database, provider or private learner fixture was changed.
- Expanded production-mode Chromium acceptance passed at the existing six viewport sizes. It verifies manual motion pause/resume, actual running/paused animation styles, pointer-property cleanup, live reduced-motion suppression, synthetic hidden-document pause, offscreen decorative pause, all three new image loads and a hero source resolution sufficient for its rendered crop at the fixture's DPR 1. It retains the product-view keyboard/image checks, anchor clearance, all synthetic decision/recovery/cancellation checks, reduced-motion demo behaviour, no-script fallback, focused invalid-form errors/retained drafts, learning offer price/demo/download checks and absence of browser page/hydration errors.
- Responsive image sizing was increased after visual review found that the hero's cover crop needed a larger source. No hardware/retina performance, measured FPS or accessibility certification is inferred from this fixture assertion.
- Desktop hero, compact case, fully loaded workflow, studio approach and phone/menu layouts were inspected. Final maintained evidence/screenshots are in local temporary directory `sciencedojo-engineering-browser-Ao8A50`; extra viewport captures remain temporary. The existing CI evidence retention is seven days; hosted CI is not established by local commands.
- The final production build is serving on the existing local port 3105 in a retained terminal session. No new browser tab, production deployment or hosted configuration was required.

Owner design acceptance, intended-device and real browser zoom checks, independent comprehension, actual engineering inbox receipt and publication remain separate. B3/S1/R1, the learning offer and all paid-work/tested-delivery gates remain unchanged.

## Illustrated engineering team — 19 October 2026

After requesting three cartoon portraits, Piumal supplied his own missing reference. The lower engineering team section now uses matching square editorial cartoons for Piumal, Tharindu and Yelka, with existing confirmed roles below them. The opening stays problem-led. No raw photographs or invented hobbies were added; the separate Lovable prototype was not modified. See the [artwork, selected files and generation prompt](business-engineering-team-artwork.md).

Scoped engineering ESLint, type checking, production build, whitespace and maintained production-mode Chromium acceptance passed. Browser coverage includes the new three-image desktop/phone load and square-crop checks, responsive overflow, existing motion/reduced-motion, menu, no-script, product previews, synthetic decision/recovery/cancellation, invalid enquiry retention and learning offer/download checks. No valid enquiry/email was attempted. Desktop and phone team framing were visually inspected. Evidence is in temporary `sciencedojo-engineering-browser-wwF9LO`, with a desktop reading copy in `output/design/engineering-team-portraits-desktop.png`. The refreshed production preview is running locally on port 3105. Final owner likeness/design acceptance, hosted CI, intended devices, independent human checks, engineering inbox delivery and publication remain unverified; no commercial or release gate is changed.

## Selected Lovable design adapted to the existing app — 19 October 2026

Piumal explicitly requested applying the useful parts of the reviewed Lovable prototype to the local engineering page. Its connected-interface SVG was read from `src/components/site/HeroArt.tsx` at revision `b1b6fec87b4a21baad83909c750ad37bfee97aab` and adapted into the existing Next.js component, with exact local brand colors, scoped CSS and the established bounded motion controller. No new font, routing framework, service or backend was imported; the external Lovable project was not edited.

The local page now has a compact header with an accessible Team destination, stronger headline hierarchy, clearer actions, the problem explorer before own-product proof, vertical problem choices, native optional scope detail and three distinct synthetic UI fragments. The course handoff shows retained/missing context; learner return shows its saved second step; enquiry recovery shows a kept record and retry state. Existing reducer/cancellation and private enquiry behavior remain. Actual sample-data learner/parent/tutor screenshots and all three illustrated portraits are retained. A pale-blue in-house case and navy operations section create contrast, while two original supporting concept images remain. Generated hero raster artwork remains on disk but the selected inline SVG now supplies the opening visual. Static essential markup is visible; the prototype's opacity-zero reveal limitation was not imported.

Verification:

- Scoped engineering ESLint, type checking, final production build and whitespace checks passed. The 37 focused demo/enquiry/SQL/email regressions passed; no backend logic changed after that run.
- Final maintained production-mode Chromium acceptance passed at 320, 390, 768, 1280 and 1440 widths, including a short phone. It checks static/no-script reading, SVG visibility, existing motion pause/resume/tilt cleanup/live reduced-motion/synthetic background and offscreen handling, actual product previews and three portraits, problem-before-proof order, keyboard scope disclosure, distinct visual variants, consequential decisions/failure/correction/retry/reset/cancellation, invalid enquiry draft retention, learning price/demo/downloads and no browser errors.
- Final acceptance evidence: temporary `sciencedojo-engineering-browser-noH96F`. Desktop and phone close-up captures of the hero, problem selection, three variants and loaded workflow artwork are saved as `output/design/engineering-refined-*.png`; the actual close-ups were visually inspected. These capture checks do not establish intended-device performance, real browser zoom, independent usability or owner acceptance.
- The final production preview remains available at `http://127.0.0.1:3105/business/engineering` in a retained terminal session. No publication, valid live enquiry, email attempt, hosted CI or production configuration change was performed.

B3/S1/R1 remain the three active tasks. Existing learning scope/price, owner decisions, paid-work/tested-delivery and independent evidence gates are unchanged.

## Eight-company study and buyer-clarity audit — 19 October 2026

The owner requested a deep study of business web/IT suppliers, a complete engineering-page audit and supported improvements. The [dated research/audit](business-engineering-company-audit-2026-10-19.md) records eight companies' primary-source presentation, category boundaries, a 23-area disposition matrix, evidence gaps and before/after local measurements. It distinguishes source/content observations, design judgment, synthetic checks and unverified business outcomes.

Implemented locally: explicit websites/web-apps/integrations proposition and matching metadata/share PNG; visible first-project examples; optional detailed synthetic demos with close/reset cancellation; a need/contribution/decision explanation around the actual in-house screens; focused/continuing engagement choices; estimate, source/accounts/handover, post-delivery, quality and IT-support boundary FAQs; a fictional example brief and clear reply/qualification steps; registered company name in footer prose; compact phone portraits and appropriate image sizes. Existing roles, exact brand palette, actual sample-data views, private enquiry contract, learning offer and commercial/release gates are retained. No new runtime dependency, backend, service provisioning or live submission was added.

Scoped lint/type checking/final build/whitespace and 37 focused tests passed. Final production-mode browser acceptance passed with new native-disclosure/cancellation, service/scope, FAQ and brief-guidance checks, retaining the existing responsive/motion/no-script/images/demos/enquiry/learning checks. A separate read-only structure audit passed at 1440/390/320/768 widths with no enumerated overflow/label/ID/anchor/alt/description defects. At 390×844, real proof moved 3,052→2,858px and contact 9,776→9,112px; desktop/tablet are slightly longer due to the new buying detail. These are layout facts, not conversion results. The 13 initially requested script resources remain 13 (+379 encoded bytes in this local fixture), not a whole-page/field performance claim.

Saved before/after screenshots and JSON are in `output/design/engineering-audit-before/` and `engineering-audit-after/`; the sharing PNG and desktop/phone details were visually inspected. Final maintained acceptance evidence is temporary `sciencedojo-engineering-browser-DB3Aih`. The final local preview is running on port 3105. No hosted CI, real inbox receipt, owner visual acceptance, independent human/device/zoom acceptance, new client evidence or publication is established. B3/S1/R1 and all paid-work/tested-delivery gates remain unchanged.

## Client comprehension, aesthetics and visual UX — 19 October 2026

A focused follow-through to the company/page audit is saved in `docs/business-engineering-client-ux-review-2026-10-19.md`. It reviews seven primary UX sources, maps likely buyer questions, separates observations from hypotheses and proposes a nonleading human review. No client psychology, conversion effect or independent comprehension result is claimed.

Implemented locally: descriptive section headings; desired-change prompts with explicit service categories, correct selection/check cues and keyboard state; a continuous five-block SVG journey with its final check unobscured and concept label retained; a proportionate first-step sentence under the hero actions; named Piumal contact guidance; and persistent organisation/brief instructions associated through validation. The organisation hint sits below its field so desktop inputs align. Existing typography/blue/navy/cyan, sample-data product proof, lower cartoon team, optional demos/cancellation, motion/privacy safeguards and private enquiry requirements remain. No new runtime dependency, tracking, backend or commercial promise was added.

Final local results:

- Scoped engineering ESLint, normal type check, normal final `npm run build` and whitespace check passed. All 37 focused demo/enquiry/SQL/email regressions passed; subsequent changes were confined to artwork and form presentation, with final normal build and browser checks below.
- Maintained production-mode Chromium acceptance passed at 320/390/768/1280/1440 widths and the short-phone fixture. New checks exercise keyboard desired-change selection with no navigation, exactly one selected state, explicit category context and persistent organisation descriptions before/after invalid validation. Existing motion/manual pause/live reduced-motion/background/offscreen, no-script, menu/focus, real product images, portraits, optional-demo/cancellation/recovery, FAQ/brief guidance, retained invalid drafts, learning price/demo/downloads and no-page-error checks remain passing. Evidence: temporary `sciencedojo-engineering-browser-he0GFx`.
- The final anonymous structure audit passed at 1440×1000, 390×844, 320×568 and 768×1024: no enumerated page overflow, duplicate ID, broken local anchor, absent visible field label, missing image alt or dangling description. Its limited control-size screen returned no candidates. This is not full assistive-technology/WCAG or real-device acceptance.
- Final screenshots/JSON: `output/design/engineering-audit-psychology-after/`, with baseline `engineering-audit-psychology-before/`. Desktop opening/services/product/approach/contact and phone opening/services/team/contact were inspected, including final corrected artwork and form alignment. Section capture now explicitly frames the section's start below the header instead of centring a tall section.
- Final page/proof/contact positions in CSS px: 1440 = 7,590 / 1,990 / 6,451; 390 = 11,376 / 2,908 / 9,155; 320 = 12,235 / 3,042 / 9,898; 768 = 8,910 / 2,629 / 7,591. Compared with the immediately preceding company-audit revision, phone/tablet length increases slightly because of explanatory copy and heading wrapping; this is an explicit clarity/length trade-off, not a universal scroll reduction. There are still 13 initially requested script resources, 234,878 encoded bytes in this local cache-dependent fixture. These are neither psychological measures nor field performance results.
- An initial full type/build attempt stopped at unrelated concurrent campus board-game code (`TS2538`); that code was corrected by the concurrent work without this task editing it. The normal type check and two subsequent normal production builds passed. A supplementary compile-mode attempt stalled and was terminated; it is not counted as successful evidence, and the final preview uses the normal build. Initial browser/audit failures were ambiguous text and incorrect team-ID selectors, corrected before final passing runs. Repository type checks/configuration were not disabled or relaxed.

The final production preview remains running locally on port 3105. No valid live enquiry/email, outreach, production deployment, hosted CI or service/schema change was performed by this increment. Owner design/likeness approval, intended devices/real zoom, independent buyer comprehension, real engineering inbox receipt, independent client proof and publication remain separate. B3/S1/R1 and all paid-work/tested-delivery gates remain intact.

## Main-site For Business menu — 19 October 2026

Piumal requested that hovering For Business expose Instructional design and Engineering. The main desktop header now uses a compact native disclosure linking the existing `/business` instructional-design page and `/business/engineering`. It opens on mouse hover and via click/keyboard, keeps the pointer route to the panel connected, supports Arrow Down/Up entry, Tab through links, Escape with focus return, outside-pointer dismissal and closing when focus leaves. It uses ordinary navigation links rather than ARIA menu-item semantics. Mobile exposes both routes together under a For Business group in the existing scrollable drawer. Shared destination data keeps labels/URLs consistent. The instructional-design page subtitle and engineering return link use the same arm name; the learning service/price, forms and demos are preserved.

The initial no-script check found that the pre-existing streamed public header remains inside a hidden React segment without JavaScript. A small native no-script navigation fallback now sits in the existing public-only Suspense/chrome boundary, preserving the normal loading space and private/auth/business exclusions. No tracking, auth/session, feature-flag or backend logic changed.

Final verification:

- Scoped engineering/navigation ESLint, normal type check, final normal production build and whitespace check passed. No dependency or type-check bypass was added.
- Expanded production-mode Chromium acceptance passed. It retains all engineering responsive/motion/no-script/images/portraits/demo/cancellation/invalid-enquiry checks and the existing learning price/demo/download checks. Main-site tests cover actual hover/leave and movement into the panel, correct link targets, keyboard entry/Tab/Escape/focus return/outside dismissal, navigation to engineering at 1280 and 1440 widths, viewport/control bounds, both mobile destinations at 375×667 and restored document scrolling after navigation. Native no-script menu opening and navigation to instructional design passed. The no-script fallback is absent on the engineering and sign-in pages; engineering retains a single header. No page/hydration errors were recorded.
- Final browser evidence: temporary `sciencedojo-engineering-browser-3CKKrK`. Saved desktop 1280/1440 and phone 375 screenshots are in `output/design/business-navigation/` and were visually inspected. These are synthetic local browser checks, not authenticated-session, intended-device or independent human evidence.
- The final production-mode preview is running on the existing local port 3105. Earlier acceptance passed the requested desktop/mobile interactions but stopped at the inherited no-script header issue; the added bounded fallback resolved it before the final complete pass.

This connects the routes in the local main-site navigation. No commit/push, production publication, live enquiry/email or account/schema/hosting change was performed by this request. B3/S1/R1 and paid-work/tested-delivery gates remain intact. The local result does not establish a deployed main-site release.


## Main-based engineering release preparation — 19 October 2026

The owner explicitly requested pushing the current engineering page and For Business menu to main for sciencedojo.co.uk. The release was prepared from origin/main `9cf9def805f4f2dbc1caf457bfce2672b4e366a3` in an isolated checkout. Only engineering/navigation/business-support files were transferred; the original beta checkout and its uncommitted work were preserved. No campus source, migrations, runtime dependencies, configuration, private records or environment files were imported. Main's own workflow/configuration and account/feature-flag behavior are preserved.

Actual release checks: all **455** main-based regression tests passed, normal type check and engineering/latency lint passed, normal production build passed, private-workbook trace verification found no private source/static/standalone files, and expanded production-mode engineering/navigation Chromium acceptance passed. Browser evidence is temporary `sciencedojo-engineering-browser-DMrJaT`. Local build/browser configuration was explicitly synthetic; no valid live enquiry/email or account/database mutation was performed. The matching Playwright 1.64.1 development dependency and its minimal three-package lock entries were added for reproducible CI. Main runtime dependencies are unchanged. CI now installs Chromium, uses synthetic public build configuration and retains synthetic browser evidence for seven days.

The owner's request authorises publishing the current visual treatment and navigation; independent likeness, human/device/zoom, actual engineering inbox delivery and client-outcome evidence remain separate. Successful push, hosted checks and live verification must be recorded from actual observations, not inferred from this local preparation. B3/S1/R1 and commercial/delivery gates remain intact.


## Shared public scroll-progress indicator — 19 October 2026

Piumal requested reusing the engineering page's scroll-filling line across public website pages, with no dashboard indicator. The update uses one root component with a public-path boundary and explicit public-header markers. It replaces the old engineering-only indicator/listener, follows sticky or scrolling-away headers, updates after content/viewport changes and hides when no scrolling is needed. Its 2px blue/cyan styling, direct scroll response and decorative/pointer-free semantics are preserved. There is no tracking, storage, network service, new dependency, backend or learner-progress change. Account, onboarding, booking, dashboard/admin, academy, workbook and campus screens are excluded. Existing tracking/private-study/campus document gates are unchanged. See `docs/public-scroll-progress.md` for the implementation contract.

Main-based verification passed: **458** regressions (including three public/private boundary cases), normal type check, engineering/latency lint, normal production build, private-workbook trace guard and expanded production-mode Chromium acceptance. The latter checks one indicator on home/privacy/both business arms at 1440/390 widths; empty/half/full fill; actual header alignment; native FAQ height changes; short-page hiding; resize; direct reduced-motion response; private-path removal/return; and the pre-existing engineering, motion, no-script, navigation and enquiry checks. Private paths are synthetic Next native-history boundary fixtures, not authenticated dashboard/learner visits. No valid live enquiry/email or account/database mutation was performed.

Main-based browser evidence: temporary `sciencedojo-engineering-browser-c2rGXY`; selected desktop/phone screenshots and evidence are retained locally in `output/design/public-scroll-progress/` and were visually inspected. The original beta/local preview also passed its normal build and was restored on port 3105. The release checkout imports only this public UI change from the beta workspace; no campus code/configuration is released. Hosted push/deployment/public smoke results are recorded when observed. B3/S1/R1 and commercial/delivery gates remain intact.


## Instructional-design brand alignment — 19 October 2026

Piumal requested fixing the instructional-design website's deviation from the original brand colours. `/business` now uses the main-site navy/blue/cyan palette throughout its wordmark, actions, links, surfaces, embedded demos, process SVGs, enquiry form and sharing image. Cyan is a small accent or appears on navy; interactive text and white-label buttons use blue. The softer learning artwork, layout, offer/€1,490 price, downloadable materials, form logic and private handling are preserved. This is E1 maintenance; B3/S1/R1 and commercial/tested-delivery gates remain unchanged. Verification and publication are recorded after actual checks.

Local verification passed: all 458 main-based regressions; scoped business/engineering and latency ESLint; normal type check/build; private-workbook trace guard; and maintained engineering/navigation/public-progress Chromium acceptance (`sciencedojo-engineering-browser-vfy0OV`). Separate read-only 1440px/390px captures confirmed rendered navy headings, blue actions/dojo, cyan dot, preserved €1,490 price, no horizontal overflow/page errors and a 200 sharing PNG. Hero/process/demo/contact/sharing captures in `output/design/instructional-brand/` were inspected. Blue text on the lightest selected surface was corrected to retain at least 4.5:1 calculated contrast. Original workspace build also passed and its local preview was restarted on port 3105. This records software/visual checks, not human or client outcomes. No valid enquiry was submitted.

Hosted quality run `39323469281` passed regression/type/lint/build but failed the existing reduced-motion scroll acceptance at `check-public-scroll-progress.mjs:61`: the fixed half-scroll assertion ran immediately after navigating to streamed `/privacy`, unlike the earlier cases that wait for its heading/fonts. The trace guard was skipped after that failure; local trace verification had passed. The follow-up adds the same page/font/indicator readiness plus verified top reset before measuring halfway, preserving the 0.01 accuracy threshold and all production scroll behaviour. Actual public colour verification passed separately. This is a test-readiness repair, not a colour or scrolling implementation change.

The bounded readiness correction passed the normal clean-main build, scoped lint, private trace guard and complete production-mode browser acceptance locally (`sciencedojo-engineering-browser-qZxhnC`). No application code or accuracy threshold changed. The original brand commit retains its 458-test local/hosted regression success and actual public colour evidence. The follow-up is released separately to obtain final hosted browser verification.


## Instructional-design route relocation — 19 October 2026

Piumal requested `/business/instructional-design` alongside `/business/engineering`. The existing page and share-image modules move to the new leaf route; shared components/actions stay in place. Current menu, footer, engineering cross-links, canonical/Open Graph/Twitter URLs and sitemap use the new destination. Exact Next permanent redirects preserve `/business` and `/business/opengraph-image`; there is no wildcard redirect and example download paths remain unchanged. The approved offer/price, palette, demos, private form and public/private chrome/scroll boundaries are preserved. Checks/publication are recorded after actual results. E1 maintenance; B3/S1/R1 and commercial/tested-delivery gates remain intact.

Local clean-main verification passed: all 458 regressions; engineering/latency plus changed Footer/config ESLint; normal type/build; private-workbook trace guard; and expanded production-mode Chromium acceptance (`sciencedojo-engineering-browser-8Mn1oW`). The latter verifies exact 308 page/share redirects, query/hash preservation, new canonical/Open Graph route and sharing PNG, menu/footer/cross-route and no-script navigation, retained download responses/price and invalid instructional-design server action with retained draft and no save attempt. Existing engineering/motion/demo/scroll/private-path checks remain passing. The original workspace build also passed and its local preview was restarted at port 3105. No valid enquiry or account/database write was exercised.


## Business header refinements — 20 October 2026

At Piumal’s request, the engineering wordmark/descriptor now stack on desktop as well as phone. The instructional-design header sticks to the viewport top and section targets reserve space for its responsive wrapped navigation. Existing wordmark colours, routes, offer/price, enquiry behaviour, native links and shared scroll-progress marker remain. This uses CSS only with no new runtime dependency or listener. Verification/publication are recorded after actual checks. E1 maintenance; B3/S1/R1 and all permission/delivery gates remain intact.

Clean-main verification passed: all 458 regressions; scoped engineering/latency lint; normal type/build; private-workbook trace guard; and expanded production-mode Chromium acceptance. The final compact phone spacing passed another normal build/lint and complete browser run (`sciencedojo-engineering-browser-I4GMB1`). Checks cover descriptor placement at 320/390/768/1280/1440 widths; sticky instructional navigation with all five section headings below the header at 320×568, 390×844, 768×1024 and 1440×1000; retained public-progress geometry; and existing redirect/menu/no-script/demo/form/download behaviour. Original workspace build also passed and its local preview was restarted on 3105. Final desktop/phone captures in `output/design/business-headers/local/` were inspected. No valid enquiry/account/database write was made; these are software checks, not independent intended-device acceptance.

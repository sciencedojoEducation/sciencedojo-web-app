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

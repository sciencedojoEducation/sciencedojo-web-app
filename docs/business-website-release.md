# Business website verification and release

The business page presents the Onboarding Task Pilot for English-working IT service and software implementation teams. On 9 October 2026 the owner explicitly approved publication, including the claims, €1,490 starting price, pilot scope, founder copy, and handover terms. The approved release was published to [the business page](https://www.sciencedojo.co.uk/business), and its live content, demo, form, links, and sharing image were verified.

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

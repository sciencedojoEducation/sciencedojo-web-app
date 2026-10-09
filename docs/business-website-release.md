# Business website verification and release

The business page presents the Onboarding Task Pilot for English-working IT service and software implementation teams. The implementation is ready for owner review. Publication requires approval of the claims, starting price, scope, and handover wording, followed by checks against the deployed page.

## Verification on 9 October 2026

| Requirement | Evidence | Release status |
| --- | --- | --- |
| W1 Opening section | Names the audience and the problem of applying an established process. The main actions are “Discuss a pilot” and “Try the demo”. Both anchors were checked in the browser. | Owner copy approval pending. |
| W2 Pilot offer | Shows the €1,490 starting price, source and interaction limits, deliverables, two consolidated reviews, exclusions, and proposal conditions. No unconditional delivery date, LMS compatibility, or continuing hosting promise is made. | Owner price and scope approval pending. |
| W3 Workplace demo | Fictional label remains visible at the demo anchor. Keyboard checks covered all three decisions, feedback, review, and restart. | Local checks passed. |
| W4 Founder | Copy describes teaching, learning design, development, thesis research, and direct collaboration. Portfolio and thesis case study links returned HTTP 200. Exact degree completion, current employment, commercial outcomes, and sole OwlMentor software ownership are not claimed. | Owner factual approval pending. |
| W5 Enquiry form | Name, email, organisation, and workplace task are required; timing is optional. Labels, privacy notice, email alternative, public access, and draft retention were checked. | Local checks passed. |
| W6 Enquiry route | A browser submission reached the real database. Its notification was accepted on the first attempt, and the owner confirmed receipt in the hello inbox. Visitor confirmation reflected database receipt. Validation, provider failure, timeout, deduplication, retries, spam checks, and private SQL access are covered by focused tests. | Production form submission remains to be checked after deployment. |
| W7 Usability | Keyboard controls and focus, field labels, 16px form text, and responsive widths of 320, 375, 640, 1280, and 1440 CSS pixels were checked. The owner tested the enquiry form and three-decision demo at actual 200% browser zoom and confirmed both remained usable without clipped controls or sideways scrolling. | Local checks and owner zoom check passed. These checks are not accessibility certification. |
| W8 Links and sharing | Corporate title, description, canonical URL, and social images were inspected in production HTML. The 1200×630 sharing image rendered successfully. Portfolio, product, privacy, and terms links were checked. | Verify deployed metadata and image after publication. |

The founder statements are supported by the founder's own [portfolio](https://piumal.com/) and [thesis case study](https://piumal.com/projects/owlmentor?lang=en). They remain subject to owner factual review.

The complete focused test command passed 28 tests:

```sh
node --experimental-strip-types --test tests/business-enquiries.test.mjs tests/business-enquiries-sql.test.mjs tests/email-delivery.test.mjs
```

Scoped ESLint, `git diff --check`, and `npm run build` passed. Node's module-format warning during the tests did not affect the result.

The business implementation is saved locally in commit `5313447`. A further build of that commit in an isolated temporary checkout could not be completed: Turbopack rejected its external dependency symlink, and the Webpack fallback could not download the existing Google Fonts through the sandbox. That additional build remains unverified; these environment failures did not identify a source defect or change the earlier successful standard build.

## Database and notification configuration

[Migration 068](../sql/068_business_enquiries.sql) was applied once to the production Supabase project configured in `.env.local`. Both tables were absent before application. An anonymous REST read was denied with PostgreSQL permission error `42501`; the server account could read the table. Do not rerun the creation migration against that project without checking its state.

The action needs the existing Supabase URL and service-role key, plus a working Resend key and verified sender. The recipient defaults to `hello@sciencedojo.co.uk`; `BUSINESS_ENQUIRY_RECIPIENT_EMAIL` can override it. A stable `BUSINESS_ENQUIRY_RATE_LIMIT_SECRET` is optional, with the private service key as fallback. Changing that secret changes deduplication fingerprints.

Production IP handling expects Vercel's overwritten `x-forwarded-for` header. Unsupported production proxy configurations fail closed. Abuse limits are three new enquiries per email and five per IP in each ten-minute window. Only hashes are stored for those request limits.

The retry route requires the existing `CRON_SECRET`. An unauthenticated request to the existing production cron route returned HTTP 401, confirming that production cron authentication is configured. The new business route and its daily 06:30 UTC schedule take effect when this revision is deployed.

## Notification operation

Each enquiry is saved before notification. Email submission has an eight-second abort deadline. Failed or timed-out notifications remain queued; a successful visitor confirmation means the enquiry was recorded. No automatic acknowledgement email is sent to the prospect.

The daily worker processes at most five queued notifications per invocation. It permits five attempts within seven days, recovers expired leases, and retains exhausted enquiries. A prolonged outage or larger backlog needs operator attention before that window expires. Check queue states in the private database:

```sql
SELECT notification_status, count(*)
FROM public.business_enquiries
GROUP BY notification_status;
```

`sent` records provider acceptance, not an inbox read. HTTP 200 from the worker can coexist with queued or exhausted notifications; inspect its counts and the stored queue state. If a provider accepts a message but recording that result fails, a later retry beyond the provider's idempotency window can duplicate the staff email while keeping one enquiry record.

The retained QA enquiry is labelled `ScienceDojo — website verification 2026-10-09`. Treat it as a website test, not a prospect.

## Release sequence

1. Confirm owner approval of the commercial claims, price, pilot scope, founder wording, and handover terms.
2. Commit and publish only the business upgrade files; unrelated German academy work is outside this change.
3. Verify the deployed business page, metadata, sharing image, main anchors, and demo.
4. Submit one clearly labelled production enquiry, confirm its private record and inbox receipt, and verify the deployed retry route rejects unauthenticated requests.
5. Record the deployed commit and results here. The actual 200% browser zoom check on the contact and demo journeys was completed by the owner before publication.

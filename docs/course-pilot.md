# Public course pilot

## Rollout

1. Apply `sql/067_course_pilot.sql` after the existing Academy migrations, through your normal database migration process. It runs in a transaction and leaves the pilot flag disabled.
2. Open `/dashboard/admin/course-pilot`. Select published courses and supply learning outcomes and prerequisites. Courses without a published version cannot be listed.
3. Enable **Public course pilot** in `/dashboard/admin/feature-flags`. This exposes the Courses navigation and public catalog. Smoke-test registration, verification, enrollment, lesson completion, notes, discussions, and reviews with a test account.
4. Uncheck **List publicly** to stop new enrollments while preserving existing enrolled access. Disabling the feature flag hides the pilot and pauses pilot access; it does not delete any learner records. Re-enable it to restore access.

No courses are automatically selected. Choosing a course for the pilot changes its learner authorization from audience roles to enrollment. Leave induction/internal courses unconfigured to retain their existing access. Do not create a pilot listing for an internal course simply to save unused marketing text.

## Enrollment and privacy

- Verified, active accounts of any role can claim one of 10 free places per course. Signup itself never claims a place. Enrollment is idempotent; claims and promotions serialize on the course row.
- When full, a claim becomes a unique waitlist entry. Waitlisting grants no learning or discussion access and sends no notifications.
- Enrollment has no expiry. Deleted accounts leave an anonymous membership record that still consumes the enrolled place, so account deletion does not recycle capacity.
- Administrators can manually promote waitlisted learners only if the course has fewer than 10 consumed places. Promotions use the same locking and capacity checks as enrollment.
- Notes are course- or lesson-specific and readable/editable only by their owner, including through direct database APIs. Administrators do not have a note-reading policy.
- Discussions show profile display names and avatars to enrolled learners and admins. Replies belong to the same course and lesson; hiding a parent also hides its replies from learners. Reports are visible only to admins.
- One editable 1–5-star review is available after the learner completes a lesson. Names, ratings, and optional review text become public. Hidden reviews remain hidden after edits and do not contribute to the displayed average.
- Anonymous marketing reads use a database projection of the published version: no lesson blocks, quizzes, drafts, progress, private notes, or email addresses are returned.
- The migration replaces the legacy metadata-based Academy admin predicate with a trusted, non-suspended profile-role check. Existing admins must have `profiles.role = 'admin'`; user-editable auth metadata cannot grant admin access.

## Validation

- `npm run typecheck`
- `node --experimental-strip-types --test tests/course-pilot*.test.mjs`
- `npm test`

The pilot database tests use PGlite, a disposable PostgreSQL engine, and execute the migration and real RLS policies. They cover the last place, duplicates, waitlisting, unverified/suspended accounts, unlisting, private notes, replies, reports, reviews, and legacy audience access. PGlite serializes requests. `scripts/check-course-pilot-concurrency.mjs` separately creates a temporary local PostgreSQL cluster and verifies that competing connections wait on the course row, duplicate requests produce one membership, and a promotion racing with enrollment cannot exceed the ten-place cap. It never connects to an existing database.

Desktop and 390px browser layout checks use fixture data and the actual page components. They do not validate a live Supabase rollout or send signup emails.

To repeat the separate-connection test, install the optional test runtime outside the repository and pass its absolute directory:

```sh
npm install --prefix /tmp/sciencedojo-course-pilot-postgres --no-package-lock embedded-postgres@18.4.0-beta.17 pg@8.23.1
node scripts/check-course-pilot-concurrency.mjs /tmp/sciencedojo-course-pilot-postgres
```

The local cluster uses loopback only, creates no system accounts, and removes its database files when stopped. Production Supabase auth and email delivery still require a rollout smoke test.

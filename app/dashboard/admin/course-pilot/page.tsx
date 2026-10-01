import Link from "next/link";
import { requirePilotAdmin } from "@/lib/course-pilot";
import { isFeatureEnabled } from "@/lib/feature-flags";
import SubmitButton from "@/components/course-pilot/SubmitButton";
import { managePilot } from "./actions";
export const metadata = { title: "Course pilot | ScienceDojo Admin" };
export default async function PilotAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { supabase } = await requirePilotAdmin();
  const enabled = await isFeatureEnabled("course_pilot_enabled");
  const query = await searchParams;
  const results = await Promise.all([
    supabase
      .from("academy_courses")
      .select("id,course_key,title,status,published_version_id")
      .order("title"),
    supabase.from("course_pilot_listings").select("*"),
    supabase.from("course_pilot_memberships").select("*").order("created_at"),
    supabase
      .from("course_pilot_posts")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("course_pilot_reports")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("course_pilot_reviews")
      .select("*")
      .order("updated_at", { ascending: false }),
  ]);
  if (results.some((r) => r.error))
    throw new Error(
      "Unable to load the course pilot. Apply migration 067_course_pilot.sql first.",
    );
  const [courses, listings, memberships, posts, reports, reviews] = results.map(
    (r) => r.data || [],
  );
  const authorResults = await Promise.all(
    courses.map((c) => supabase.rpc("course_pilot_authors", { target: c.id })),
  );
  if (authorResults.some((r) => r.error))
    throw new Error("Unable to load learner names.");
  const authors = authorResults.flatMap(
    (r) => (r.data || []) as { id: string; name: string }[],
  );
  const learnerName = (id: string | null) =>
    id
      ? authors.find((a) => a.id === id)?.name || "Learner"
      : "Deleted account (place retained)";
  const textStyle =
    "mt-2 w-full rounded-xl border border-slate-300 p-3 text-sm";
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <Link
        href="/dashboard/admin/academy"
        className="inline-flex min-h-11 items-center text-blue-700"
      >
        ← Academy studio
      </Link>
      <h1 className="mt-4 text-3xl font-semibold">Public course pilot</h1>
      <p className="mt-3 text-slate-600">
        10 free places per course. Listing a course switches learner access to
        enrollment. Unlisting preserves existing enrollments.
      </p>
      <p className="mt-3 rounded-xl bg-blue-50 p-4 text-sm">
        Pilot is {enabled ? "enabled" : "disabled"}. Manage{" "}
        <strong>Public course pilot</strong> in{" "}
        <Link href="/dashboard/admin/feature-flags" className="underline">
          feature settings
        </Link>
        .
      </p>
      {query.message && (
        <p
          role={query.message === "failed" ? "alert" : "status"}
          className="mt-4 rounded-xl bg-slate-100 p-4"
        >
          {query.message === "failed"
            ? "Unable to save. Ensure the course is published, inputs are valid, and promotions have an available place and an active verified learner."
            : "Saved."}
        </p>
      )}
      <div className="mt-8 space-y-8">
        {courses.map((course) => {
          const listing = listings.find((l) => l.course_id === course.id);
          const learners = memberships.filter((m) => m.course_id === course.id);
          const coursePosts = posts.filter((p) => p.course_id === course.id);
          const courseReviews = reviews.filter(
            (r) => r.course_id === course.id,
          );
          const enrolledCount = learners.filter(
            (m) => m.status === "enrolled",
          ).length;
          return (
            <section
              key={course.id}
              className="rounded-2xl border bg-white p-5 sm:p-7"
            >
              <h2 className="text-xl font-semibold">{course.title}</h2>
              <p className="mt-2 text-sm text-slate-600">
                {course.status} · {enrolledCount}/10 enrolled ·{" "}
                {learners.filter((m) => m.status === "waitlisted").length}{" "}
                waiting
              </p>
              <form action={managePilot.bind(null, "listing")} className="mt-5">
                <input type="hidden" name="course" value={course.id} />
                <label className="flex min-h-11 items-center gap-3 text-sm font-semibold">
                  <input
                    type="checkbox"
                    name="listed"
                    defaultChecked={listing?.listed || false}
                    disabled={
                      course.status !== "published" ||
                      !course.published_version_id
                    }
                  />
                  List publicly
                </label>
                <label className="mt-3 block text-sm">
                  Learning outcomes
                  <textarea
                    name="outcomes"
                    rows={3}
                    maxLength={10000}
                    defaultValue={listing?.outcomes || ""}
                    className={textStyle}
                  />
                </label>
                <label className="mt-3 block text-sm">
                  Prerequisites
                  <textarea
                    name="prerequisites"
                    rows={2}
                    maxLength={10000}
                    defaultValue={listing?.prerequisites || ""}
                    className={textStyle}
                  />
                </label>
                <SubmitButton>Save listing</SubmitButton>
              </form>
              <h3 className="mt-7 font-semibold">Enrollments & waitlist</h3>
              {!learners.length && (
                <p className="mt-2 text-sm text-slate-500">No learners yet.</p>
              )}
              <ul className="mt-3 divide-y">
                {learners.map((m) => (
                  <li
                    key={m.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <span className="text-sm">
                      {learnerName(m.user_id)} · {m.status} ·{" "}
                      {new Date(m.created_at).toLocaleDateString("en-GB")}
                    </span>
                    {m.user_id &&
                      m.status === "waitlisted" &&
                      enabled &&
                      enrolledCount < 10 && (
                        <form action={managePilot.bind(null, "promote")}>
                          <input
                            type="hidden"
                            name="course"
                            value={course.id}
                          />
                          <input
                            type="hidden"
                            name="learner"
                            value={m.user_id}
                          />
                          <SubmitButton>Promote to free place</SubmitButton>
                        </form>
                      )}
                  </li>
                ))}
              </ul>
              <details className="mt-6">
                <summary className="cursor-pointer py-3 font-semibold">
                  Discussions & reports ({coursePosts.length})
                </summary>
                <div className="space-y-3">
                  {coursePosts.map((post) => (
                    <article key={post.id} className="rounded-xl border p-4">
                      <p className="text-sm font-semibold">
                        {learnerName(post.author_id)} ·{" "}
                        {post.lesson_slug || "Whole course"}
                        {post.parent_id ? " · Reply" : ""}
                        {post.hidden ? " · Hidden" : ""}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm">
                        {post.body}
                      </p>
                      {reports
                        .filter((r) => r.post_id === post.id)
                        .map((r) => (
                          <p
                            key={r.id}
                            className="mt-3 rounded-lg bg-amber-50 p-3 text-sm"
                          >
                            Report: {r.reason}
                          </p>
                        ))}
                      {!post.hidden && (
                        <form
                          action={managePilot.bind(null, "hide-post")}
                          className="mt-3"
                        >
                          <input
                            type="hidden"
                            name="course"
                            value={course.id}
                          />
                          <input type="hidden" name="post" value={post.id} />
                          <SubmitButton>Hide post</SubmitButton>
                        </form>
                      )}
                    </article>
                  ))}
                </div>
              </details>
              <details className="mt-4">
                <summary className="cursor-pointer py-3 font-semibold">
                  Reviews ({courseReviews.length})
                </summary>
                <div className="space-y-3">
                  {courseReviews.map((r) => (
                    <article key={r.user_id} className="rounded-xl border p-4">
                      <p className="text-sm font-semibold">
                        {learnerName(r.user_id)} · {r.rating}/5
                        {r.hidden ? " · Hidden" : ""}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm">
                        {r.body}
                      </p>
                      {!r.hidden && (
                        <form
                          action={managePilot.bind(null, "hide-review")}
                          className="mt-3"
                        >
                          <input
                            type="hidden"
                            name="course"
                            value={course.id}
                          />
                          <input
                            type="hidden"
                            name="learner"
                            value={r.user_id}
                          />
                          <SubmitButton>Hide review</SubmitButton>
                        </form>
                      )}
                    </article>
                  ))}
                </div>
              </details>
            </section>
          );
        })}
      </div>
    </main>
  );
}

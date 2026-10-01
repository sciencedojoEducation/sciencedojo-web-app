import Link from "next/link";
import Image from "next/image";
import { requirePilotEnrollment } from "@/lib/course-pilot";
import { getPublishedAcademyCourse } from "@/lib/academy-courses";
import { getTutorAcademyProgress } from "@/lib/tutor-academy-progress";
import SubmitButton from "@/components/course-pilot/SubmitButton";
import { saveLearnerWork } from "./actions";
export const metadata = { title: "Course notes and discussions | ScienceDojo" };
export default async function CommunityPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseKey: string }>;
  searchParams: Promise<{ lesson?: string; message?: string }>;
}) {
  const { courseKey } = await params;
  const { supabase, user, course } = await requirePilotEnrollment(courseKey);
  const content = await getPublishedAcademyCourse(courseKey);
  const progress = await getTutorAcademyProgress(courseKey);
  const query = await searchParams;
  const slug = content?.lessons.some((l) => l.slug === query.lesson)
    ? query.lesson!
    : "";
  const results = await Promise.all([
    supabase
      .from("course_pilot_notes")
      .select("body")
      .eq("course_id", course.id)
      .eq("user_id", user.id)
      .eq("lesson_slug", slug)
      .maybeSingle(),
    supabase
      .from("course_pilot_posts")
      .select("id,author_id,body,parent_id,lesson_slug,created_at")
      .eq("course_id", course.id)
      .eq("lesson_slug", slug)
      .order("created_at"),
    supabase.rpc("course_pilot_authors", { target: course.id }),
    supabase
      .from("course_pilot_reviews")
      .select("rating,body,hidden")
      .eq("course_id", course.id)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);
  if (results.some((r) => r.error))
    throw new Error("Unable to load your course community.");
  const [noteResult, postsResult, authorsResult, reviewResult] = results;
  const authors = (authorsResult.data || []) as {
    id: string;
    name: string | null;
    avatar: string | null;
  }[];
  const posts = postsResult.data || [];
  const eligible =
    progress.completedLessons.length > 0 ||
    progress.completedLessonIds.length > 0;
  const textStyle =
    "mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm focus-visible:outline-blue-600";
  function author(post: (typeof posts)[number]) {
    const person = authors.find((a) => a.id === post.author_id);
    return (
      <div className="flex items-center gap-2">
        {person?.avatar && (
          <Image
            src={person.avatar}
            alt=""
            width={28}
            height={28}
            className="rounded-full"
          />
        )}
        <span className="font-semibold">{person?.name || "Learner"}</span>
        <time dateTime={post.created_at} className="text-xs text-slate-500">
          {new Date(post.created_at).toLocaleDateString("en-GB")}
        </time>
      </div>
    );
  }
  function report(post: (typeof posts)[number]) {
    return (
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer py-2 text-slate-600">
          Report this post
        </summary>
        <form action={saveLearnerWork.bind(null, courseKey, "report")}>
          <input type="hidden" name="post" value={post.id} />
          <input type="hidden" name="lesson" value={slug} />
          <label className="block">
            Reason
            <textarea
              name="body"
              required
              maxLength={1000}
              className={textStyle}
            />
          </label>
          <SubmitButton>Send report</SubmitButton>
        </form>
      </details>
    );
  }
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
      <Link
        href={`/dashboard/academy/${courseKey}`}
        className="inline-flex min-h-11 items-center font-semibold text-blue-700"
      >
        ← {course.title}
      </Link>
      <h1 className="mt-4 text-3xl font-semibold">
        Notes & learner discussions
      </h1>
      {query.message && (
        <p
          role={query.message === "failed" ? "alert" : "status"}
          className="mt-4 rounded-xl bg-slate-100 p-4"
        >
          {query.message === "failed"
            ? "Unable to save. Check your entry and try again."
            : query.message === "reported"
              ? "Report sent to the course administrator."
              : query.message === "saved"
                ? "Saved."
                : ""}
        </p>
      )}
      <form className="mt-6 flex flex-wrap items-end gap-3">
        <label className="min-w-0 flex-1 text-sm font-medium">
          Choose a discussion and notes area
          <select name="lesson" defaultValue={slug} className={textStyle}>
            <option value="">Whole course</option>
            {content?.lessons.map((l) => (
              <option key={l.slug} value={l.slug}>
                {l.title}
              </option>
            ))}
          </select>
        </label>
        <button className="min-h-11 rounded-xl border px-5">Open area</button>
      </form>
      <section className="mt-8 rounded-2xl border bg-slate-50 p-5">
        <h2 className="text-xl font-semibold">Private notes</h2>
        <p className="mt-2 text-sm text-slate-600">
          Only you can read these reflections. Your progress is also private.
        </p>
        <form
          action={saveLearnerWork.bind(null, courseKey, "note")}
          className="mt-4"
        >
          <input type="hidden" name="lesson" value={slug} />
          <label className="block text-sm">
            Your notes
            <textarea
              key={slug}
              name="body"
              rows={6}
              maxLength={10000}
              defaultValue={noteResult.data?.body || ""}
              className={textStyle}
            />
          </label>
          <SubmitButton>Save notes</SubmitButton>
        </form>
      </section>
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Learn together</h2>
        <p className="mt-2 text-sm text-slate-600">
          Ask questions, share an insight, or tell other learners how it’s
          going. Posts are visible to enrolled learners and administrators.
        </p>
        <form
          action={saveLearnerWork.bind(null, courseKey, "post")}
          className="mt-4"
        >
          <input type="hidden" name="lesson" value={slug} />
          <label className="block text-sm">
            Start a discussion
            <textarea
              name="body"
              rows={3}
              required
              maxLength={4000}
              className={textStyle}
            />
          </label>
          <SubmitButton>Post discussion</SubmitButton>
        </form>
        <div className="mt-6 space-y-5">
          {posts
            .filter((p) => !p.parent_id)
            .map((post) => (
              <article key={post.id} className="rounded-2xl border p-5">
                {author(post)}
                <p className="mt-3 whitespace-pre-wrap break-words text-slate-700">
                  {post.body}
                </p>
                {report(post)}
                <div className="ml-3 mt-4 space-y-4 border-l pl-4">
                  {posts
                    .filter((p) => p.parent_id === post.id)
                    .map((reply) => (
                      <div key={reply.id}>
                        {author(reply)}
                        <p className="mt-2 whitespace-pre-wrap break-words">
                          {reply.body}
                        </p>
                        {report(reply)}
                      </div>
                    ))}
                </div>
                <details className="mt-4">
                  <summary className="cursor-pointer py-2 font-semibold text-blue-700">
                    Reply
                  </summary>
                  <form action={saveLearnerWork.bind(null, courseKey, "post")}>
                    <input type="hidden" name="parent" value={post.id} />
                    <input type="hidden" name="lesson" value={slug} />
                    <label className="block text-sm">
                      Your reply
                      <textarea
                        name="body"
                        required
                        maxLength={4000}
                        className={textStyle}
                      />
                    </label>
                    <SubmitButton>Post reply</SubmitButton>
                  </form>
                </details>
              </article>
            ))}
          {!posts.length && (
            <p className="text-sm text-slate-500">
              Be the first to start a discussion.
            </p>
          )}
        </div>
      </section>
      <section className="mt-10 rounded-2xl border p-5">
        <h2 className="text-xl font-semibold">Rate this course</h2>
        {eligible ? (
          <form
            action={saveLearnerWork.bind(null, courseKey, "review")}
            className="mt-4"
          >
            <label className="block text-sm">
              Rating
              <select
                name="rating"
                defaultValue={reviewResult.data?.rating || 5}
                className={textStyle}
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} / 5
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-4 block text-sm">
              Review (optional)
              <textarea
                name="body"
                maxLength={2000}
                rows={3}
                defaultValue={reviewResult.data?.body || ""}
                className={textStyle}
              />
            </label>
            <p className="mb-3 text-xs text-slate-600">
              Your name, rating, and review will be public. You can edit your
              review here.
            </p>
            {reviewResult.data?.hidden && (
              <p className="mb-3 text-sm">
                Your review has been hidden by an administrator; edits will not
                republish it.
              </p>
            )}
            <SubmitButton>Save review</SubmitButton>
          </form>
        ) : (
          <p className="mt-3 text-sm text-slate-600">
            Complete your first lesson to leave a rating and review.
          </p>
        )}
      </section>
    </main>
  );
}

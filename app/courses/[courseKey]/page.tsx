import { courseMarketingCopy } from "@/lib/course-pilot-copy";
import { formatCourseDuration } from "@/lib/formatTime";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPilotCatalog } from "@/lib/course-pilot";
import { createClient } from "@/utils/supabase/server";
import { joinPilotCourse } from "../actions";
import SubmitButton from "@/components/course-pilot/SubmitButton";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ courseKey: string }>;
}) {
  const { courseKey } = await params;
  const [course] = await getPilotCatalog(courseKey);
  return {
    title: course?.title || "Course",
    alternates: { canonical: `/courses/${courseKey}` },
    openGraph: {
      title: course?.title,
      description: course?.description,
      url: `/courses/${courseKey}`,
      ...(course?.heroImage
        ? { images: [{ url: course.heroImage, alt: course.title }] }
        : {}),
    },
    description: course?.description,
  };
}
export default async function CoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ courseKey: string }>;
  searchParams: Promise<{ message?: string }>;
}) {
  const { courseKey } = await params;
  const [course] = await getPilotCatalog(courseKey);
  if (!course) notFound();
  const copy = courseMarketingCopy(course.key);
  const { message } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const membership = user
    ? await supabase
        .from("course_pilot_memberships")
        .select("status")
        .eq("course_id", course.id)
        .eq("user_id", user.id)
        .maybeSingle()
    : null;
  if (membership?.error)
    throw new Error("Unable to check your enrollment. Please try again.");
  const status = membership?.data?.status;
  const full = course.placesRemaining === 0;
  const next = encodeURIComponent(`/courses/${course.key}`);
  const average = course.reviews.length
    ? (
        course.reviews.reduce((sum, r) => sum + r.rating, 0) /
        course.reviews.length
      ).toLocaleString(copy.language, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })
    : null;
  return (
    <main
      lang={copy.language}
      className="min-h-screen bg-[#F6F8FC] px-4 py-10 sm:px-8"
    >
      <div className="mx-auto max-w-5xl">
        <Link
          href="/courses"
          className="inline-flex min-h-11 items-center font-semibold text-blue-700"
        >
          ← {copy.allCourses}
        </Link>
        <div className="mt-5 grid gap-8 md:grid-cols-[1fr_300px]">
          <article>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">
              {course.title}
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              {course.description}
            </p>
            {course.heroImage && (
              <div className="relative mt-6 h-64 overflow-hidden rounded-2xl">
                <Image
                  src={course.heroImage}
                  alt=""
                  fill
                  loading="eager"
                  sizes="(max-width:768px) 100vw, 640px"
                  className="object-cover"
                />
              </div>
            )}
            <section className="mt-8">
              <h2 className="text-2xl font-semibold">{copy.outcomes}</h2>
              <p className="mt-3 whitespace-pre-line leading-7 text-slate-600">
                {course.outcomes || course.description}
              </p>
            </section>
            <section className="mt-8">
              <h2 className="text-2xl font-semibold">{copy.prerequisites}</h2>
              <p className="mt-3 whitespace-pre-line leading-7 text-slate-600">
                {course.prerequisites || copy.noPrerequisites}
              </p>
            </section>
            <section className="mt-8">
              <h2 className="text-2xl font-semibold">{copy.curriculum}</h2>
              <ol className="mt-4 list-none divide-y rounded-2xl border bg-white">
                {course.curriculum.map((lesson, i) => (
                  <li key={i} className="p-4 text-slate-700">
                    {lesson.title}
                  </li>
                ))}
              </ol>
            </section>
          </article>
          <aside className="h-fit rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-3xl font-bold text-slate-900">{copy.pilot}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {copy.lessonCount(course.curriculum.length)} ·{" "}
              {formatCourseDuration(course.estimatedMinutes, copy.language)}
              <br />
              {copy.pace} · {copy.access}
            </p>
            <p className="mt-4 font-semibold text-blue-700">
              {full ? copy.full : copy.remaining(course.placesRemaining)}
            </p>
            {message === "join-failed" && (
              <p role="alert" className="mt-4 text-sm text-red-700">
                {copy.joinFailed}
              </p>
            )}
            {status === "enrolled" ? (
              <Link
                href={`/dashboard/academy/${course.key}`}
                className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-blue-700 px-5 text-sm font-semibold text-white"
              >
                {copy.continueLearning} →
              </Link>
            ) : status === "waitlisted" ? (
              <p
                role="status"
                className="mt-5 rounded-xl bg-blue-50 p-4 text-sm text-blue-800"
              >
                {copy.waitlisted}
              </p>
            ) : user?.email_confirmed_at ? (
              <form
                action={joinPilotCourse.bind(null, course.key, full)}
                className="mt-6"
              >
                <SubmitButton pendingLabel={copy.pending}>
                  {full ? copy.joinWaitlist : copy.enroll}
                </SubmitButton>
              </form>
            ) : user ? (
              <p className="mt-5 text-sm text-slate-700">{copy.verify}</p>
            ) : (
              <div className="mt-6 space-y-3">
                <Link
                  href={`/signup?role=user&next=${next}`}
                  className="flex min-h-11 items-center justify-center rounded-xl bg-blue-700 px-4 text-sm font-semibold text-white"
                >
                  {full ? copy.registerWaitlist : copy.register}
                </Link>
                <Link
                  href={`/login?next=${next}`}
                  className="inline-flex min-h-11 items-center text-sm font-semibold text-blue-700 underline"
                >
                  {copy.login}
                </Link>
              </div>
            )}
            <p className="mt-4 text-xs leading-5 text-slate-500">
              {copy.noReservation}
            </p>
          </aside>
        </div>
        <section className="mt-12">
          <h2 className="text-2xl font-semibold">{copy.reviewsHeading}</h2>
          <p className="mt-3 text-slate-600">
            {average
              ? `${average} / 5 · ${copy.reviewCount(course.reviews.length)}`
              : copy.noReviews}
          </p>
          <div className="mt-4 space-y-3">
            {course.reviews.map((review, i) => (
              <article key={i} className="rounded-xl border bg-white p-5">
                <p className="font-semibold">
                  {review.name} · {review.rating} / 5
                </p>
                {review.body && (
                  <p className="mt-2 whitespace-pre-wrap text-slate-600">
                    {review.body}
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

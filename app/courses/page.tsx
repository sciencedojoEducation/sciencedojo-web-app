import { courseMarketingCopy } from "@/lib/course-pilot-copy";
import { formatCourseDuration } from "@/lib/formatTime";
import Link from "next/link";
import Image from "next/image";
import { getPilotCatalog } from "@/lib/course-pilot";
export const metadata = {
  title: "Courses",
  alternates: { canonical: "/courses" },
  openGraph: { title: "ScienceDojo Courses", url: "/courses" },
  description:
    "Learn at your own pace with ScienceDojo. Join our free course pilot, save your progress, and learn together.",
};
export const dynamic = "force-dynamic";
export default async function CoursesPage() {
  const courses = await getPilotCatalog();
  return (
    <main className="min-h-screen bg-[#F6F8FC] px-4 py-12 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="max-w-3xl">
          <p className="font-semibold text-blue-700">ScienceDojo Academy</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Make room for something new.
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Learn at your pace, keep track of your progress, and connect with
            learners along the way.
          </p>
          <p className="mt-4 text-sm font-medium text-slate-700">
            Our pilot offers 10 free places per course. An account is required
            to join.
          </p>
          <Link
            href="/dashboard/academy"
            className="mt-5 inline-block py-2 font-semibold text-blue-700 underline"
          >
            My Courses →
          </Link>
        </header>
        <section
          aria-label="Available courses"
          className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {courses.map((course) => {
            const copy = courseMarketingCopy(course.key);
            return (
              <article
                lang={copy.language}
                key={course.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                {course.heroImage && (
                  <div className="relative h-48">
                    <Image
                      src={course.heroImage}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <p className="text-xs font-semibold text-blue-700">
                    {course.placesRemaining
                      ? copy.remaining(course.placesRemaining)
                      : copy.waitlistOpen}
                  </p>
                  <h2 className="mt-3 text-xl font-semibold text-slate-900">
                    <Link href={`/courses/${course.key}`}>{course.title}</Link>
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {course.description}
                  </p>
                  <p className="mt-4 text-sm text-slate-600">
                    {copy.lessonCount(course.curriculum.length)} ·{" "}
                    {formatCourseDuration(
                      course.estimatedMinutes,
                      copy.language,
                    )}{" "}
                    · {copy.pace}
                  </p>
                  <Link
                    href={`/courses/${course.key}`}
                    className="mt-5 inline-flex min-h-11 items-center font-semibold text-blue-700 underline"
                  >
                    {copy.explore} →
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
        {!courses.length && (
          <p className="mt-10 rounded-2xl bg-white p-8 text-slate-600">
            New courses are on their way. Check back soon.
          </p>
        )}
      </div>
    </main>
  );
}

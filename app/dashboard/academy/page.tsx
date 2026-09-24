import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import { getEligibleAcademyCourses } from "@/lib/academy-courses";
import { getAcademyProgressPercent } from "@/lib/tutor-academy";
import { getTutorAcademyProgress } from "@/lib/tutor-academy-progress";

export default async function AcademyCataloguePage() {
  const courses = await getEligibleAcademyCourses();
  const items = await Promise.all(courses.map(async (course) => ({ course, progress: await getTutorAcademyProgress(course.key) })));

  return (
    <main className="min-h-full bg-[#F6F8FC] px-4 py-7 sm:px-8 md:py-10">
      <div className="mx-auto max-w-6xl">
        <header>
          <p className="text-sm font-semibold text-[#4f53a5]">ScienceDojo Academy</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">Your courses</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Explore the courses available for your learning journey. You can return to a course whenever you&apos;re ready.</p>
        </header>
        {items.length ? (
          <div className="mt-7 grid gap-4 md:grid-cols-2">
            {items.map(({ course, progress }) => {
              const percent = getAcademyProgressPercent(progress, course);
              return (
                <article key={course.key} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  {course.heroImage && <div className="relative h-40 bg-slate-100"><Image src={course.heroImage} alt="" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" /></div>}
                  <div className="p-5">
                    <h2 className="text-xl font-semibold text-slate-900">{course.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{course.description}</p>
                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-600">
                      <span className="inline-flex items-center gap-1.5"><BookOpen size={15} aria-hidden="true" />{course.lessons.length} lessons</span>
                      <span className="inline-flex items-center gap-1.5"><Clock size={15} aria-hidden="true" />{course.estimatedMinutes} min</span>
                    </div>
                    <div className="mt-5 flex items-center justify-between text-xs font-medium text-slate-700"><span>Course progress</span><span>{percent}%</span></div>
                    <div role="progressbar" aria-label={`${course.title} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#4f53a5]" style={{ width: `${percent}%` }} /></div>
                    <Link href={`/dashboard/academy/${course.key}`} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#1E5AA8] px-5 text-sm font-semibold text-white hover:bg-[#174a8b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f53a5] focus-visible:ring-offset-2">{percent ? "Continue course" : "Start course"}<ArrowRight size={16} aria-hidden="true" /></Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <section className="mt-7 rounded-xl border border-slate-200 bg-white p-6"><h2 className="text-lg font-semibold text-slate-900">No courses assigned yet</h2><p className="mt-1 text-sm text-slate-600">Available Academy courses will appear here.</p></section>
        )}
      </div>
    </main>
  );
}

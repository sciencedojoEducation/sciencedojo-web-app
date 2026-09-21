import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import AcademyLessonBlocks from "@/components/tutor-academy/AcademyLessonBlocks";
import AcademyLessonTracker from "@/components/tutor-academy/AcademyLessonTracker";
import { completeAcademyLesson } from "@/app/dashboard/tutor/academy/actions";
import { getAcademyLesson, getAcademyLessonIndex, tutorAcademyCourse } from "@/lib/tutor-academy";
import { getTutorAcademyProgress } from "@/lib/tutor-academy-progress";
import { getPublishedAcademyCourse } from "@/lib/academy-courses";

export default async function TutorAcademyLessonPage({ params, searchParams }: { params: Promise<{ lessonSlug: string }>; searchParams: Promise<{ error?: string }> }) {
  const { lessonSlug } = await params;
  const { error } = await searchParams;
  const course = await getPublishedAcademyCourse(tutorAcademyCourse.key) || tutorAcademyCourse;
  const lesson = getAcademyLesson(lessonSlug, course);
  if (!lesson) notFound();

  const progress = await getTutorAcademyProgress();
  const index = getAcademyLessonIndex(lesson.slug, course);
  const previousLesson = course.lessons[index - 1];
  const nextLesson = course.lessons[index + 1];
  const completed = progress.completedLessons.includes(lesson.slug);
  const completeAction = completeAcademyLesson.bind(null, course.key, lesson.slug);

  return (
    <article>
      <AcademyLessonTracker lessonSlug={lesson.slug} courseKey={course.key} />
      <header className="border-b border-[#DEDFE1] bg-white px-6 pb-10 pt-12 sm:px-10 sm:pb-12 sm:pt-16">
        <div className="mx-auto max-w-[728px]">
          <div className="flex flex-wrap items-center gap-3 text-[13px] font-semibold text-[#717376]">
            <span>{lesson.section}</span><span aria-hidden="true">·</span><span>Lesson {index + 1} of {course.lessons.length}</span><span aria-hidden="true">·</span><span className="inline-flex items-center gap-1.5"><Clock size={14} aria-hidden="true" /> {lesson.durationMinutes} min</span>
          </div>
          <h1 className="mt-5 text-[32px] font-bold leading-[1.2] tracking-[-0.025em] text-[#101010] sm:text-[40px] sm:leading-[48px]">{lesson.title}</h1>
          <div className="mt-5 h-1 w-12 bg-[#1E5AA8]" aria-hidden="true" />
          <p className="mt-6 max-w-[660px] font-[family-name:var(--font-academy-serif)] text-[17px] leading-[30px] text-[#4A4B4E] sm:leading-[33px]">{lesson.summary}</p>
        </div>
      </header>

      <div className="px-6 py-12 sm:px-10 sm:py-16">
        <div className="mx-auto max-w-[728px]">
          {error === "progress" && <div role="alert" className="mb-8 border-l-4 border-red-700 bg-red-50 px-5 py-4 text-sm font-semibold leading-6 text-red-900">Progress could not be saved. Confirm that the Tutor Academy database migration has been applied, then try again.</div>}
          <AcademyLessonBlocks blocks={lesson.blocks} />

          <footer className="mt-16 border-t border-[#DEDFE1] pt-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {previousLesson ? (
                <Link href={`/dashboard/tutor/academy/lessons/${previousLesson.slug}`} className="inline-flex min-h-11 items-center justify-center gap-2 border border-[#C9CDD2] bg-white px-6 text-xs font-bold uppercase tracking-[0.1em] text-[#4A4B4E] hover:border-[#1E5AA8] hover:text-[#1E5AA8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E5AA8]">
                  <ArrowLeft size={16} /> Previous
                </Link>
              ) : <Link href="/dashboard/tutor/academy" className="inline-flex min-h-11 items-center justify-center gap-2 border border-[#C9CDD2] bg-white px-6 text-xs font-bold uppercase tracking-[0.1em] text-[#4A4B4E]"><ArrowLeft size={16} /> Course home</Link>}
              <form action={completeAction}>
                <button className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-[#1E5AA8] px-7 text-xs font-bold uppercase tracking-[0.1em] text-white hover:bg-[#174A8B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E5AA8] sm:w-auto">
                  {completed ? <CheckCircle2 size={17} /> : null}
                  {nextLesson ? completed ? "Continue" : "Complete and continue" : completed ? "Go to final check" : "Complete and take final check"}
                  <ArrowRight size={16} />
                </button>
              </form>
            </div>
          </footer>
        </div>
      </div>
    </article>
  );
}

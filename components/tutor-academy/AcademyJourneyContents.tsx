import Link from "next/link";
import { ArrowRight, BookOpen, Check, Clock3, LockKeyhole, Sparkles } from "lucide-react";
import { getAcademyJourneyLessonState, getAcademyJourneyResumeTarget } from "@/lib/academy-journey";
import {
  getAcademyLessonProgressState,
  getAcademyProgressPercent,
  getAcademyQuizProgressState,
  type AcademyCourse,
  type AcademyProgress,
} from "@/lib/tutor-academy";

export default function AcademyJourneyContents({
  course,
  progress,
  lessonHref,
  quizHref,
}: {
  course: AcademyCourse;
  progress: AcademyProgress;
  lessonHref: (slug: string) => string;
  quizHref: string;
}) {
  const completedCount = course.lessons.filter(
    (lesson) => getAcademyLessonProgressState(progress, lesson.slug, lesson.id) === "completed",
  ).length;
  const progressPercent = getAcademyProgressPercent(progress, course);
  const resumeTarget = getAcademyJourneyResumeTarget(course, progress);
  const nextHref = resumeTarget?.kind === "lesson" ? lessonHref(resumeTarget.slug) : resumeTarget?.kind === "assessment" ? quizHref : null;
  const sections = Array.from(new Set(course.lessons.map((lesson) => lesson.section)));

  return (
    <main className="bg-[#FBFCFD] px-5 py-12 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-[1020px]">
        <div className="grid gap-5 rounded-[28px] bg-[var(--academy-accent-soft)] p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-bold text-[var(--academy-accent-ink)]"><Sparkles size={16} aria-hidden="true" /> Your learning journey</span>
            <h2 className="mt-2 text-2xl font-bold leading-tight text-[#17202C] sm:text-3xl">Small steps, real progress</h2>
            <p className="mt-2 text-sm text-[#384554]">{completedCount} of {course.lessons.length} lessons complete · About {course.estimatedMinutes} minutes in total</p>
          </div>
          <strong className="grid h-20 w-20 place-items-center rounded-full border-4 border-[var(--academy-accent)] bg-white text-xl text-[var(--academy-accent-ink)]" aria-label={`${progressPercent}% course progress`}>
            {progressPercent}%
          </strong>
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#E3E8EF]" role="progressbar" aria-label="Course progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent}>
          <div className="h-full rounded-full bg-[var(--academy-accent)] transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${progressPercent}%` }} />
        </div>
        {nextHref ? (
          <Link href={nextHref} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--academy-accent)] px-6 text-sm font-bold text-white outline-none focus-visible:ring-2 focus-visible:ring-[var(--academy-accent)] focus-visible:ring-offset-2">
            {resumeTarget?.kind === "assessment" ? "Go to final check" : "Continue learning"} <ArrowRight size={17} aria-hidden="true" />
          </Link>
        ) : <p className="mt-6 text-sm font-semibold text-[var(--academy-accent-ink)]">Journey complete — revisit any lesson whenever you like.</p>}

        {sections.map((section) => (
          <section key={section} className="mt-12">
            <h3 className="mb-4 text-sm font-bold text-[#263548]">{section}</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {course.lessons.filter((lesson) => lesson.section === section).map((lesson) => {
                const index = course.lessons.findIndex((candidate) => candidate.id === lesson.id || candidate.slug === lesson.slug);
                const { status: state, locked } = getAcademyJourneyLessonState(course, progress, index)!;
                const card = (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--academy-spark)] text-sm font-bold text-[#17202C]" aria-hidden="true">{state === "completed" ? <Check size={20} /> : index + 1}</span>
                      <span className="text-xs font-bold text-[#435164]">{locked ? "Locked" : state === "completed" ? "Completed" : state === "started" ? "In progress" : "Not started"}</span>
                    </div>
                    <h4 className="mt-5 text-lg font-bold leading-snug text-[#17202C]">{lesson.title}</h4>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#4A5766]">{lesson.summary}</p>
                    <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-xs font-semibold text-[#435164]">
                      <span className="inline-flex items-center gap-1"><Clock3 size={14} aria-hidden="true" /> {lesson.durationMinutes} min</span>
                      {locked ? <LockKeyhole size={16} aria-hidden="true" /> : <ArrowRight size={17} aria-hidden="true" />}
                    </div>
                  </>
                );
                return locked ? (
                  <div key={lesson.id || lesson.slug} aria-label={`Step ${index + 1}: ${lesson.title}. Locked until the previous lesson is complete.`} className="flex min-h-56 flex-col rounded-2xl border border-[#D9E1E9] bg-[#F3F5F8] p-5 opacity-75">{card}</div>
                ) : (
                  <Link key={lesson.id || lesson.slug} href={lessonHref(lesson.slug)} aria-label={`Step ${index + 1}: ${lesson.title}. ${state === "completed" ? "Completed" : state === "started" ? "In progress" : "Not started"}.`} className="flex min-h-56 flex-col rounded-2xl border border-[#D9E1E9] bg-white p-5 outline-none transition hover:-translate-y-0.5 hover:border-[var(--academy-accent)] hover:shadow-lg focus-visible:ring-2 focus-visible:ring-[var(--academy-accent)] motion-reduce:transition-none">{card}</Link>
                );
              })}
            </div>
          </section>
        ))}
        {course.rules?.requireFinalAssessment !== false ? (
          <Link href={quizHref} className="mt-10 flex min-h-24 items-center gap-4 rounded-2xl border border-[var(--academy-accent)] bg-[var(--academy-accent-soft)] p-5 outline-none focus-visible:ring-2 focus-visible:ring-[var(--academy-accent)]">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--academy-spark)] text-[#17202C]"><BookOpen size={20} aria-hidden="true" /></span>
            <span className="flex-1"><strong className="block text-base text-[#17202C]">Final knowledge check</strong><span className="text-xs text-[#435164]">{getAcademyQuizProgressState(progress, course) === "completed" ? "Completed" : "See what you have learned"}</span></span>
            <ArrowRight size={19} className="text-[var(--academy-accent)]" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </main>
  );
}

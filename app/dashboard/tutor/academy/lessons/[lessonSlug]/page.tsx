import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import AcademyLessonBlocks from "@/components/tutor-academy/AcademyLessonBlocks";
import AcademyLessonTracker from "@/components/tutor-academy/AcademyLessonTracker";
import { completeAcademyLesson } from "@/app/dashboard/tutor/academy/actions";
import { getAcademyLesson, getAcademyLessonIndex, tutorAcademyCourse } from "@/lib/tutor-academy";
import { getTutorAcademyProgress } from "@/lib/tutor-academy-progress";

export default async function TutorAcademyLessonPage({ params, searchParams }: { params: Promise<{ lessonSlug: string }>; searchParams: Promise<{ error?: string }> }) {
  const { lessonSlug } = await params;
  const { error } = await searchParams;
  const lesson = getAcademyLesson(lessonSlug);
  if (!lesson) notFound();

  const progress = await getTutorAcademyProgress();
  const index = getAcademyLessonIndex(lesson.slug);
  const previousLesson = tutorAcademyCourse.lessons[index - 1];
  const nextLesson = tutorAcademyCourse.lessons[index + 1];
  const completed = progress.completedLessons.includes(lesson.slug);
  const completeAction = completeAcademyLesson.bind(null, lesson.slug);

  return (
    <article>
      <AcademyLessonTracker lessonSlug={lesson.slug} />
      <header className="border-b border-secondary/8 bg-white px-5 py-10 sm:px-9 sm:py-14 lg:px-12">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-[0.17em] text-primary/65">
            <span>{lesson.section}</span><span className="text-secondary/20">•</span><span>Lesson {index + 1} of {tutorAcademyCourse.lessons.length}</span><span className="text-secondary/20">•</span><span className="inline-flex items-center gap-1"><Clock size={13} /> {lesson.durationMinutes} minutes</span>
          </div>
          <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.05] tracking-tight text-secondary sm:text-5xl">{lesson.title}</h1>
          <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-secondary/58">{lesson.summary}</p>
        </div>
      </header>

      <div className="px-5 py-10 sm:px-9 sm:py-14 lg:px-12">
        <div className="mx-auto max-w-4xl">
          {error === "progress" && <div role="alert" className="mb-7 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-800">Progress could not be saved. Confirm that the Tutor Academy database migration has been applied, then try again.</div>}
          <AcademyLessonBlocks blocks={lesson.blocks} />

          <footer className="mt-12 border-t border-secondary/10 pt-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {previousLesson ? (
                <Link href={`/dashboard/tutor/academy/lessons/${previousLesson.slug}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-secondary/10 bg-white px-6 text-xs font-black uppercase tracking-[0.12em] text-secondary/55 hover:border-primary/25 hover:text-primary">
                  <ArrowLeft size={16} /> Previous
                </Link>
              ) : <Link href="/dashboard/tutor/academy" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-secondary/10 bg-white px-6 text-xs font-black uppercase tracking-[0.12em] text-secondary/55"><ArrowLeft size={16} /> Course home</Link>}
              <form action={completeAction}>
                <button className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-7 text-xs font-black uppercase tracking-[0.12em] text-white shadow-lg shadow-primary/15 transition-transform hover:-translate-y-0.5 sm:w-auto">
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

import Link from "next/link";
import { ArrowRight, BookOpen, Check, Clock, ShieldCheck, Trophy } from "lucide-react";
import {
  getAcademyProgressPercent,
  getAcademyResumeHref,
  tutorAcademyCourse,
} from "@/lib/tutor-academy";
import { getTutorAcademyProgress } from "@/lib/tutor-academy-progress";

export default async function TutorAcademyWelcomePage() {
  const progress = await getTutorAcademyProgress();
  const progressPercent = getAcademyProgressPercent(progress);
  const resumeHref = getAcademyResumeHref(progress);
  const hasStarted = progress.completedLessons.length > 0 || Boolean(progress.currentLesson);

  return (
    <div className="px-4 py-8 sm:px-7 sm:py-10 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#001a3d] via-[#063d7a] to-[#0066ff] p-7 text-white shadow-2xl shadow-blue-950/15 sm:p-10 lg:p-12">
          <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full border-[3rem] border-cyan-300/10" />
          <div className="relative max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100">
              <ShieldCheck size={15} /> New tutor induction
            </span>
            <h2 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">Teach with clarity, care, and confidence.</h2>
            <p className="mt-5 max-w-2xl text-base font-medium leading-8 text-white/72 sm:text-lg">
              {tutorAcademyCourse.description}
            </p>
            <div className="mt-7 flex flex-wrap gap-4 text-sm font-bold text-white/70">
              <span className="inline-flex items-center gap-2"><BookOpen size={17} /> {tutorAcademyCourse.lessons.length} lessons</span>
              <span className="inline-flex items-center gap-2"><Clock size={17} /> About {tutorAcademyCourse.estimatedMinutes} minutes</span>
              <span className="inline-flex items-center gap-2"><Trophy size={17} /> 80% final check</span>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={resumeHref} className="inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-white px-7 text-xs font-black uppercase tracking-[0.14em] text-primary shadow-xl transition-transform hover:-translate-y-0.5">
                {progress.completedAt ? "Review your course" : hasStarted ? "Continue course" : "Start course"} <ArrowRight size={17} />
              </Link>
              <Link href="/dashboard/tutor" className="inline-flex min-h-13 items-center justify-center rounded-full border border-white/15 bg-white/8 px-7 text-xs font-black uppercase tracking-[0.14em] text-white transition-colors hover:bg-white/15">
                Go to dashboard
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[1.75rem] border border-secondary/8 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Your progress</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-secondary">{progress.completedAt ? "Foundations complete" : `${progressPercent}% complete`}</h2>
            </div>
            <p className="text-sm font-bold text-secondary/45">Best quiz score: {progress.bestScore || 0}%</p>
          </div>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100" aria-label={`${progressPercent}% course progress`}>
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-400 transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-5">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Course map</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-secondary">What you will learn</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {tutorAcademyCourse.lessons.map((lesson, index) => {
              const complete = progress.completedLessons.includes(lesson.slug);
              return (
                <Link key={lesson.slug} href={`/dashboard/tutor/academy/lessons/${lesson.slug}`} className="group rounded-[1.5rem] border border-secondary/8 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-lg">
                  <div className="flex items-start gap-4">
                    <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-black ${complete ? "bg-teal-500 text-white" : "bg-primary/8 text-primary"}`}>{complete ? <Check size={18} strokeWidth={3} /> : index + 1}</span>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.15em] text-secondary/35">{lesson.section} · {lesson.durationMinutes} min</p>
                      <h3 className="mt-2 text-lg font-black leading-6 text-secondary group-hover:text-primary">{lesson.title}</h3>
                      <p className="mt-2 text-sm font-medium leading-6 text-secondary/55">{lesson.summary}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

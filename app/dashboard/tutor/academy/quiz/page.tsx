import Link from "next/link";
import { ArrowLeft, Award, CheckCircle2 } from "lucide-react";
import AcademyQuiz from "@/components/tutor-academy/AcademyQuiz";
import { getPublicQuizQuestions, tutorAcademyCourse } from "@/lib/tutor-academy";
import { getTutorAcademyProgress } from "@/lib/tutor-academy-progress";

export default async function TutorAcademyQuizPage() {
  const progress = await getTutorAcademyProgress();
  const allLessonsComplete = tutorAcademyCourse.lessons.every((lesson) => progress.completedLessons.includes(lesson.slug));
  const firstIncomplete = tutorAcademyCourse.lessons.find((lesson) => !progress.completedLessons.includes(lesson.slug));

  return (
    <div className="px-4 py-8 sm:px-7 sm:py-10 lg:px-10">
      <div className="mx-auto max-w-4xl">
        <header className="rounded-[2rem] bg-secondary p-7 text-white sm:p-10">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-cyan-200"><Award size={25} /></span>
          <p className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200/70">Final knowledge check</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Show what you know.</h1>
          <p className="mt-4 max-w-2xl font-medium leading-7 text-white/65">Answer all ten questions. You need 80% to complete Tutor Foundations, and you can retry whenever you are ready.</p>
          <div className="mt-5 flex flex-wrap gap-4 text-xs font-black uppercase tracking-[0.12em] text-white/55">
            <span className="inline-flex items-center gap-2"><CheckCircle2 size={15} /> 10 questions</span>
            <span>Best score: {progress.bestScore}%</span>
            <span>Attempts: {progress.quizAttempts}</span>
          </div>
        </header>

      <div className="mt-6">
          {progress.completedAt ? (
            <section className="rounded-[2rem] border border-teal-100 bg-gradient-to-br from-white to-teal-50 p-7 text-center shadow-xl shadow-teal-900/5 sm:p-10">
              <span className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-teal-500 text-white shadow-lg shadow-teal-500/20"><Award size={38} /></span>
              <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-teal-600">Tutor Foundations complete</p>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-secondary">Best score: {progress.bestScore}%</h2>
              <p className="mx-auto mt-4 max-w-xl font-medium leading-7 text-secondary/62">Your completion is saved. Revisit the lessons whenever you need a refresher on ScienceDojo teaching and platform standards.</p>
              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/dashboard/tutor" className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-7 text-xs font-black uppercase tracking-[0.13em] text-white">Go to dashboard</Link>
                <Link href={`/dashboard/tutor/academy/lessons/${tutorAcademyCourse.lessons[0].slug}`} className="inline-flex min-h-12 items-center justify-center rounded-full border border-secondary/10 bg-white px-7 text-xs font-black uppercase tracking-[0.13em] text-secondary/60">Review lessons</Link>
              </div>
            </section>
          ) : !allLessonsComplete && firstIncomplete ? (
            <section className="rounded-[2rem] border border-amber-100 bg-amber-50 p-7 text-center sm:p-10">
              <h2 className="text-2xl font-black text-amber-950">Finish the lessons first</h2>
              <p className="mx-auto mt-3 max-w-xl font-medium leading-7 text-amber-900/65">The knowledge check unlocks after all six lessons have been completed.</p>
              <Link href={`/dashboard/tutor/academy/lessons/${firstIncomplete.slug}`} className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-amber-900 px-7 text-xs font-black uppercase tracking-[0.13em] text-white">Continue course</Link>
            </section>
          ) : (
            <AcademyQuiz questions={getPublicQuizQuestions()} previousBestScore={progress.bestScore} />
          )}
        </div>

        <Link href="/dashboard/tutor/academy" className="mt-7 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.13em] text-secondary/45 hover:text-primary"><ArrowLeft size={15} /> Back to course overview</Link>
      </div>
    </div>
  );
}

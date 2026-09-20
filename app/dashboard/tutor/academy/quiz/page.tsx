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
    <div className="px-6 py-12 sm:px-10 sm:py-16">
      <div className="mx-auto max-w-[728px]">
        <header className="border-b border-[#DEDFE1] pb-10">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#EDF4FB] text-[#1E5AA8]"><Award size={23} /></span>
          <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.18em] text-[#717376]">Final knowledge check</p>
          <h1 className="mt-3 text-[32px] font-bold leading-[1.2] tracking-[-0.025em] text-[#101010] sm:text-[40px] sm:leading-[48px]">Show what you know.</h1>
          <div className="mt-5 h-1 w-12 bg-[#1E5AA8]" aria-hidden="true" />
          <p className="mt-6 max-w-[660px] font-[family-name:var(--font-academy-serif)] text-[17px] leading-[30px] text-[#4A4B4E] sm:leading-[33px]">Answer all ten questions. You need 80% to complete Tutor Foundations, and you can retry whenever you are ready.</p>
          <div className="mt-5 flex flex-wrap gap-4 text-[11px] font-bold uppercase tracking-[0.1em] text-[#717376]">
            <span className="inline-flex items-center gap-2"><CheckCircle2 size={15} /> 10 questions</span>
            <span>Best score: {progress.bestScore}%</span>
            <span>Attempts: {progress.quizAttempts}</span>
          </div>
        </header>

      <div className="mt-10">
          {progress.completedAt ? (
            <section className="border-y border-[#DEDFE1] py-10 text-center">
              <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#1E5AA8] text-white"><Award size={31} /></span>
              <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.18em] text-[#1E5AA8]">Tutor Foundations complete</p>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.02em] text-[#101010]">Best score: {progress.bestScore}%</h2>
              <p className="mx-auto mt-4 max-w-xl font-[family-name:var(--font-academy-serif)] text-[16px] leading-8 text-[#4A4B4E]">Your completion is saved. Revisit the lessons whenever you need a refresher on ScienceDojo teaching and platform standards.</p>
              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/dashboard/tutor" className="inline-flex min-h-11 items-center justify-center bg-[#1E5AA8] px-7 text-xs font-bold uppercase tracking-[0.1em] text-white">Go to dashboard</Link>
                <Link href={`/dashboard/tutor/academy/lessons/${tutorAcademyCourse.lessons[0].slug}`} className="inline-flex min-h-11 items-center justify-center border border-[#C9CDD2] bg-white px-7 text-xs font-bold uppercase tracking-[0.1em] text-[#4A4B4E]">Review lessons</Link>
              </div>
            </section>
          ) : !allLessonsComplete && firstIncomplete ? (
            <section className="border-l-4 border-[#C4943F] bg-[#FBF7EE] p-7 text-center sm:p-9">
              <h2 className="text-2xl font-bold text-[#4A3A1C]">Finish the lessons first</h2>
              <p className="mx-auto mt-3 max-w-xl font-[family-name:var(--font-academy-serif)] text-[16px] leading-8 text-[#59451F]">The knowledge check unlocks after all six lessons have been completed.</p>
              <Link href={`/dashboard/tutor/academy/lessons/${firstIncomplete.slug}`} className="mt-6 inline-flex min-h-11 items-center justify-center bg-[#59451F] px-7 text-xs font-bold uppercase tracking-[0.1em] text-white">Continue course</Link>
            </section>
          ) : (
            <AcademyQuiz questions={getPublicQuizQuestions()} previousBestScore={progress.bestScore} />
          )}
        </div>

        <Link href="/dashboard/tutor/academy" className="mt-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-[#717376] hover:text-[#1E5AA8]"><ArrowLeft size={15} /> Back to course overview</Link>
      </div>
    </div>
  );
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Award, CheckCircle2 } from "lucide-react";
import AcademyQuiz from "@/components/tutor-academy/AcademyQuiz";
import { getPublishedAcademyCourse } from "@/lib/academy-courses";
import {
  getAcademyLessonProgressState,
  getPublicQuizQuestions,
} from "@/lib/tutor-academy";
import { getTutorAcademyProgress } from "@/lib/tutor-academy-progress";

export async function renderAcademyCourseQuizPage(
  courseKey: string,
  basePath: string,
) {
  const course = await getPublishedAcademyCourse(courseKey);
  if (!course) notFound();
  if (course.rules?.requireFinalAssessment === false) redirect(basePath);
  const progress = await getTutorAcademyProgress(course.key);
  const isLessonComplete = (lesson: (typeof course.lessons)[number]) =>
    getAcademyLessonProgressState(progress, lesson.slug, lesson.id) ===
    "completed";
  const allLessonsComplete = course.lessons.every(isLessonComplete);
  const firstIncomplete = course.lessons.find(
    (lesson) => !isLessonComplete(lesson),
  );
  const completed =
    allLessonsComplete &&
    progress.passedQuizRevision >= (course.quizRevision || 1);
  return (
    <div className="px-6 py-12 sm:px-10 sm:py-16">
      <div className="mx-auto max-w-[728px]">
        <header className="border-b border-[#DEDFE1] pb-10">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#EDF4FB] text-[#1E5AA8]">
            <Award size={23} />
          </span>
          <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.18em] text-[#717376]">
            Final knowledge check
          </p>
          <h1 className="mt-3 text-[32px] font-bold sm:text-[40px]">
            Show what you know.
          </h1>
          <div className="mt-5 h-1 w-12 bg-[#1E5AA8]" />
          <p className="mt-6 font-[family-name:var(--font-academy-serif)] text-[17px] leading-[33px] text-[#4A4B4E]">
            Answer every question. You need {course.passMark || 80}% to complete
            this course.
          </p>
          <div className="mt-5 flex gap-4 text-xs font-bold text-[#717376]">
            <span className="inline-flex gap-2">
              <CheckCircle2 size={15} />
              {course.quiz.length} questions
            </span>
            <span>Best score: {progress.bestScore}%</span>
          </div>
        </header>
        <div className="mt-10">
          {completed ? (
            <section className="border-y border-[#DEDFE1] py-10 text-center">
              <Award className="mx-auto text-[#1E5AA8]" size={48} />
              <h2 className="mt-5 text-3xl font-bold">Course complete</h2>
              <p className="mt-3 text-[#717376]">
                Best score: {progress.bestScore}%
              </p>
            </section>
          ) : !allLessonsComplete && firstIncomplete ? (
            <section className="border-l-4 border-amber-500 bg-amber-50 p-7 text-center">
              <h2 className="text-2xl font-bold">Finish the lessons first</h2>
              <Link
                href={`${basePath}/lessons/${firstIncomplete.slug}`}
                className="mt-6 inline-flex min-h-11 items-center bg-amber-900 px-6 text-xs font-bold uppercase text-white"
              >
                Continue course
              </Link>
            </section>
          ) : (
            <AcademyQuiz
              questions={getPublicQuizQuestions(course)}
              previousBestScore={progress.bestScore}
              courseKey={course.key}
            />
          )}
        </div>
        <Link
          href={basePath}
          className="mt-8 inline-flex items-center gap-2 text-xs font-bold uppercase text-[#717376]"
        >
          <ArrowLeft size={15} />
          Back to overview
        </Link>
      </div>
    </div>
  );
}

export default async function AcademyCourseQuizPage({
  params,
}: {
  params: Promise<{ courseKey: string }>;
}) {
  const { courseKey } = await params;
  return renderAcademyCourseQuizPage(
    courseKey,
    `/dashboard/tutor/academy/courses/${courseKey}`,
  );
}

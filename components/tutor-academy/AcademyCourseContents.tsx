import { formatCourseDuration } from "@/lib/formatTime";
import Link from "next/link";
import { BookOpen, Clock } from "lucide-react";
import AcademyProgressRing from "./AcademyProgressRing";
import AcademyJourneyContents from "./AcademyJourneyContents";
import { resolveAcademyTheme } from "@/lib/academy-theme";
import {
  getAcademyLessonProgressState,
  getAcademyProgressPercent,
  getAcademyRequiredLessons,
  getAcademyCoreLessons,
  getAcademyQuizProgressState,
  type AcademyCourse,
  type AcademyProgress,
} from "@/lib/tutor-academy";

export default function AcademyCourseContents({
  course,
  progress,
  lessonHref,
  quizHref,
  preview = false,
}: {
  course: AcademyCourse;
  progress: AcademyProgress;
  lessonHref: (slug: string) => string;
  quizHref: string;
  preview?: boolean;
}) {
  const progressPercent = getAcademyProgressPercent(progress, course);
  if (resolveAcademyTheme(course).preset === "journey")
    return <AcademyJourneyContents course={course} progress={progress} lessonHref={lessonHref} quizHref={quizHref} preview={preview} />;
  const requiredLessons = preview ? course.lessons : getAcademyRequiredLessons(course, progress);
  const sections = Array.from(
    new Set(requiredLessons.map((lesson) => lesson.section)),
  );
  const examChoiceReady = Boolean(course.examTracks?.length && !progress.selectedExamTrack &&
    getAcademyCoreLessons(course).every((lesson) =>
      getAcademyLessonProgressState(progress, lesson.slug, lesson.id) === "completed") &&
    (course.rules?.requireFinalAssessment === false ||
      getAcademyQuizProgressState(progress, course) === "completed"));

  return (
    <main className="px-6 py-14 sm:py-20">
      <div className="mx-auto max-w-[600px]">
        <div className="flex flex-wrap gap-6 border-y border-[#DEDFE1] py-4 text-xs font-bold text-[#717376]">
          <span className="inline-flex gap-2">
            <BookOpen size={15} aria-hidden="true" />
            {requiredLessons.length} lessons
          </span>
          <span className="inline-flex gap-2">
            <Clock size={15} aria-hidden="true" />
            About {formatCourseDuration(requiredLessons.reduce((minutes, lesson) => minutes + lesson.durationMinutes, 0))}
          </span>
          {course.rules?.requireFinalAssessment !== false ? (
            <span>{course.passMark || 80}% pass mark</span>
          ) : null}
          {examChoiceReady ? (
            <Link href={`${quizHref.replace(/\/quiz$/, "")}/choose-exam`}
              className="flex min-h-14 items-center gap-4 border-b border-[#DEDFE1] py-3 text-sm font-bold text-[var(--academy-accent)]">
              Choose your exam route
            </Link>
          ) : null}
        </div>
        <div className="mt-12 flex items-end justify-between">
          <h2 className="text-3xl font-bold">Course contents</h2>
          <strong className="text-sm text-[var(--academy-accent)]">
            {progressPercent}%
          </strong>
        </div>
        <div
          className="mt-4 h-1 bg-[#E6E7E9]"
          role="progressbar"
          aria-label="Course progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPercent}
        >
          <div
            className="h-full bg-[var(--academy-accent)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="mt-10">
          {sections.map((section) => (
            <section key={section} className="mb-9">
              <h3 className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#717376]">
                {section}
              </h3>
              <div className="border-b border-[#DEDFE1]">
                {requiredLessons
                  .filter((lesson) => lesson.section === section)
                  .map((lesson) => (
                    <Link
                      key={lesson.id || lesson.slug}
                      href={lessonHref(lesson.slug)}
                      className="flex min-h-14 items-center gap-4 border-t border-[#DEDFE1] py-3 outline-none transition-colors hover:bg-[#F7F7F7] focus-visible:ring-2 focus-visible:ring-[var(--academy-accent)] motion-reduce:transition-none"
                    >
                      <BookOpen size={16} className="text-[#717376]" aria-hidden="true" />
                      <span className="flex-1 text-sm font-bold text-[#252629]">
                        {lesson.title}
                      </span>
                      <AcademyProgressRing
                        state={getAcademyLessonProgressState(
                          progress,
                          lesson.slug,
                          lesson.id,
                        )}
                      />
                    </Link>
                  ))}
              </div>
            </section>
          ))}
          {course.rules?.requireFinalAssessment !== false ? (
            <Link
              href={quizHref}
              className="flex min-h-14 items-center gap-4 border-y border-[#DEDFE1] py-3 outline-none transition-colors hover:bg-[#F7F7F7] focus-visible:ring-2 focus-visible:ring-[var(--academy-accent)] motion-reduce:transition-none"
            >
              <BookOpen size={16} className="text-[#717376]" aria-hidden="true" />
              <span className="flex-1 text-sm font-bold">
                Final knowledge check
              </span>
              <AcademyProgressRing
                state={getAcademyQuizProgressState(progress, course)}
              />
            </Link>
          ) : null}
        </div>
      </div>
    </main>
  );
}

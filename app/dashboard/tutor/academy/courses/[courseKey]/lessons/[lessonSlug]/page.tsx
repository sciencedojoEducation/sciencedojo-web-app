import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import AcademyLessonBlocks from "@/components/tutor-academy/AcademyLessonBlocks";
import AcademyLessonHeader from "@/components/tutor-academy/AcademyLessonHeader";
import AcademyLessonTracker from "@/components/tutor-academy/AcademyLessonTracker";
import AcademyThemeScope from "@/components/tutor-academy/AcademyThemeScope";
import { completeAcademyLesson } from "@/app/dashboard/tutor/academy/actions";
import { getPublishedAcademyCourse } from "@/lib/academy-courses";
import {
  getAcademyLesson,
  getAcademyLessonIndex,
  getAcademyLessonProgressState,
} from "@/lib/tutor-academy";
import { getTutorAcademyProgress } from "@/lib/tutor-academy-progress";

export async function renderAcademyCourseLessonPage(
  courseKey: string,
  lessonSlug: string,
  error: string | undefined,
  basePath: string,
) {
  const course = await getPublishedAcademyCourse(courseKey);
  if (!course) notFound();
  const lesson = getAcademyLesson(lessonSlug, course);
  if (!lesson) notFound();
  const progress = await getTutorAcademyProgress(course.key);
  const index = getAcademyLessonIndex(lesson.slug, course);
  const previousLesson = course.lessons[index - 1];
  const nextLesson = course.lessons[index + 1];
  if (
    course.rules?.navigation === "linear" &&
    previousLesson &&
    getAcademyLessonProgressState(
      progress,
      previousLesson.slug,
      previousLesson.id,
    ) !== "completed"
  )
    redirect(`${basePath}/lessons/${previousLesson.slug}`);
  const completed =
    getAcademyLessonProgressState(progress, lesson.slug, lesson.id) ===
    "completed";
  const completeAction = completeAcademyLesson.bind(
    null,
    course.key,
    lesson.slug,
  );
  return (
    <AcademyThemeScope course={course}>
    <article>
      <AcademyLessonTracker lessonSlug={lesson.slug} courseKey={course.key} />
      <AcademyLessonHeader course={course} lesson={lesson} index={index} />
      <div className="px-6 py-12 sm:px-10 sm:py-16">
        <div className="mx-auto max-w-[728px]">
          {error === "progress" ? (
            <div className="mb-8 border-l-4 border-red-700 bg-red-50 p-5 text-sm font-semibold text-red-900">
              Progress could not be saved. Please try again.
            </div>
          ) : null}
          {error === "interactions" ? (
            <div className="mb-8 border-l-4 border-amber-600 bg-amber-50 p-5 text-sm font-semibold text-amber-950">
              Complete the required activities in this lesson before continuing.
            </div>
          ) : null}
          <AcademyLessonBlocks blocks={lesson.blocks} courseKey={course.key} />
          <footer className="mt-16 flex flex-col justify-between gap-3 border-t border-[#DEDFE1] pt-7 sm:flex-row">
            {previousLesson ? (
              <Link
                href={`${basePath}/lessons/${previousLesson.slug}`}
                className="inline-flex min-h-11 items-center justify-center gap-2 border border-[#C9CDD2] px-6 text-xs font-bold uppercase"
              >
                <ArrowLeft size={16} />
                Previous
              </Link>
            ) : (
              <Link
                href={basePath}
                className="inline-flex min-h-11 items-center justify-center gap-2 border border-[#C9CDD2] px-6 text-xs font-bold uppercase"
              >
                <ArrowLeft size={16} />
                Course home
              </Link>
            )}
            <form action={completeAction}>
              <button className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-[var(--academy-accent)] px-7 text-xs font-bold uppercase text-white">
                {completed ? <CheckCircle2 size={17} /> : null}
                {nextLesson
                  ? completed
                    ? "Continue"
                    : "Complete and continue"
                  : course.rules?.requireFinalAssessment === false
                    ? completed
                      ? "Return to course"
                      : "Complete course"
                    : "Complete and take final check"}
                <ArrowRight size={16} />
              </button>
            </form>
          </footer>
        </div>
      </div>
    </article>
    </AcademyThemeScope>
  );
}

export default async function AcademyCourseLessonPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseKey: string; lessonSlug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { courseKey, lessonSlug } = await params;
  const { error } = await searchParams;
  return renderAcademyCourseLessonPage(
    courseKey,
    lessonSlug,
    error,
    `/dashboard/tutor/academy/courses/${courseKey}`,
  );
}

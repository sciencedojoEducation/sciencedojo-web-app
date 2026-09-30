import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import AcademyLessonBlocks from "@/components/tutor-academy/AcademyLessonBlocks";
import AcademyLessonHeader from "@/components/tutor-academy/AcademyLessonHeader";
import AcademyLessonTracker from "@/components/tutor-academy/AcademyLessonTracker";
import AcademyThemeScope from "@/components/tutor-academy/AcademyThemeScope";
import { completeAcademyLesson } from "@/app/dashboard/tutor/academy/actions";
import { getAcademyJourneyLessonState } from "@/lib/academy-journey";
import { getAcademyLessonOutline } from "@/lib/academy-lesson-outline";
import { isGermanAcademyCourse } from "@/lib/german-academy-course";
import { getPublishedAcademyCourse } from "@/lib/academy-courses";
import {
  getAcademyLesson,
  getAcademyLessonIndex,
  getAcademyLessonProgressState,
  getAcademyRequiredLessons,
  getAcademyQuizProgressState,
  isAcademyBlockRequiredForCompletion,
  isAcademyPracticeSubmissionSaved,
} from "@/lib/tutor-academy";
import { getTutorAcademyProgress, requireTutorAcademyUser } from "@/lib/tutor-academy-progress";

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
  const requiredLessons = getAcademyRequiredLessons(course, progress);
  const pathIndex = requiredLessons.indexOf(lesson);
  const previousLesson = requiredLessons[pathIndex - 1];
  const nextLesson = requiredLessons[pathIndex + 1];
  const finalCheckPending = course.rules?.requireFinalAssessment !== false &&
    getAcademyQuizProgressState(progress, course) !== "completed";
  const nextStepLabel = !lesson.examTrack && finalCheckPending &&
    !requiredLessons.slice(pathIndex + 1).some((item) => !item.examTrack)
      ? isGermanAcademyCourse(course.key) ? "Als Nächstes: Abschlusstest" : "Next: final knowledge check"
      : !nextLesson && lesson.examTrack
        ? isGermanAcademyCourse(course.key) ? "Letzter Schritt auf Ihrem Prüfungsweg" : "Final step in your exam route"
        : undefined;
  if (lesson.examTrack && lesson.examTrack !== progress.selectedExamTrack)
    redirect(`${basePath}/choose-exam`);
  if (getAcademyJourneyLessonState(course, progress, index)?.locked)
    redirect(previousLesson
      ? `${basePath}/lessons/${previousLesson.slug}`
      : basePath);
  const completed =
    getAcademyLessonProgressState(progress, lesson.slug, lesson.id) ===
    "completed";
  const completedBlockIds = new Set(progress.completedBlockIds);
  const requiredPracticeIds = lesson.blocks
    .filter((block) => block.id && isAcademyBlockRequiredForCompletion(block) &&
      (block.type === "writing-practice" || block.type === "speaking-practice"))
    .map((block) => block.id!);
  const { supabase, user } = await requireTutorAcademyUser(course.key);
  const { data: submissions, error: submissionError } = requiredPracticeIds.length
    ? await supabase.from("academy_learner_submissions")
      .select("block_id, submission_type, text_response, audio_path")
      .eq("user_id", user.id)
      .eq("course_key", course.key)
      .eq("lesson_id", lesson.id || `legacy:${course.key}:${lesson.slug}`)
      .in("block_id", requiredPracticeIds)
    : { data: [], error: null };
  if (submissionError)
    console.error("[tutor-academy] Unable to load required portfolio submissions:", submissionError.message);
  const savedPracticeById = new Map((submissions || []).map((item) => [item.block_id, item]));
  const missingRequiredBlocks = course.rules?.lessonCompletion === "required-blocks"
    ? lesson.blocks.filter((block) =>
        isAcademyBlockRequiredForCompletion(block) &&
        block.id && (!completedBlockIds.has(block.id) ||
          !isAcademyPracticeSubmissionSaved(block, savedPracticeById.get(block.id))),
      )
    : [];
  const outline = getAcademyLessonOutline(lesson);
  const completeAction = completeAcademyLesson.bind(
    null,
    course.key,
    lesson.slug,
    basePath,
  );
  return (
    <AcademyThemeScope course={course}>
    <article>
      <AcademyLessonTracker lessonSlug={lesson.slug} courseKey={course.key} basePath={basePath} />
      <AcademyLessonHeader course={course} lesson={lesson} index={pathIndex} sequence={requiredLessons} nextStepLabel={nextStepLabel} />
      <div className="px-6 py-12 sm:px-10 sm:py-16">
        <div className="mx-auto max-w-[728px]">
          {error === "progress" ? (
            <div className="mb-8 border-l-4 border-red-700 bg-red-50 p-5 text-sm font-semibold text-red-900">
              Progress could not be saved. Please try again.
            </div>
          ) : null}
          {error === "interactions" ? (
            <div className="mb-8 border-l-4 border-amber-600 bg-amber-50 p-5 text-sm font-semibold text-amber-950">
              <p>This lesson is not complete yet. Finish and save the following required {missingRequiredBlocks.length === 1 ? "activity" : "activities"}:</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                {missingRequiredBlocks.map((block) => (
                  <li key={block.id}>
                    <a className="underline underline-offset-2" href={`#academy-block-${block.id}`}>
                      {block.type === "speaking-practice"
                        ? "Sprechen — record, stop, then select ‘Aufnahme speichern’"
                        : block.type === "writing-practice"
                          ? "Schreiben — select ‘Antwort speichern’"
                          : block.type === "knowledge-check"
                            ? block.question.prompt
                            : ("heading" in block && block.heading) || "Required activity"}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {!completed && missingRequiredBlocks.length && error !== "interactions" ? (
            <div className="mb-8 border-l-4 border-amber-600 bg-amber-50 p-5 text-sm text-amber-950">
              <p className="font-bold">Noch {missingRequiredBlocks.length} Pflicht{missingRequiredBlocks.length === 1 ? "aufgabe" : "aufgaben"} offen</p>
              <p className="mt-1">
                {missingRequiredBlocks[0].type === "speaking-practice"
                  ? "Sprechen ist noch nicht gespeichert: Aufnahme starten, stoppen und anschließend „Aufnahme speichern“ wählen. Erst dann geht es zum nächsten Kapitel."
                  : missingRequiredBlocks[0].type === "writing-practice"
                    ? "Schreiben ist noch nicht gespeichert: Wählen Sie „Antwort speichern“, um weiterzugehen."
                    : "Erst nach dem Speichern aller Pflichtaufgaben können Sie zum nächsten Kapitel weitergehen."}
              </p>
              <a className="mt-2 inline-block font-bold underline underline-offset-2" href={`#academy-block-${missingRequiredBlocks[0].id}`}>
                Zur nächsten offenen Aufgabe
              </a>
            </div>
          ) : null}
          {outline.length ? (
            <nav aria-label="In diesem Kapitel" className="mb-10 border border-[#C9D5E2] bg-[#F7FAFD] p-5 sm:p-6">
              <details>
                <summary className="cursor-pointer text-sm font-bold text-[#17202C]">
                  In diesem Kapitel · {outline.length} Abschnitte und Aufgaben
                </summary>
                <ol className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                  {outline.map((item) => (
                    <li key={item.id}>
                      <a className="block rounded py-1 text-[var(--academy-accent)] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--academy-accent)]" href={`#academy-block-${item.id}`}>
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ol>
              </details>
            </nav>
          ) : null}
          <AcademyLessonBlocks blocks={lesson.blocks} courseKey={course.key} lessonId={lesson.id} />
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
            {missingRequiredBlocks.length ? (
              <div className="w-full border-l-4 border-amber-500 bg-amber-50 p-4 text-sm text-amber-950 sm:max-w-sm">
                <p className="font-bold">Noch {missingRequiredBlocks.length} Pflicht{missingRequiredBlocks.length === 1 ? "aufgabe" : "aufgaben"} offen</p>
                <p className="mt-1">
                  {missingRequiredBlocks[0].type === "speaking-practice"
                    ? "Sprechen: Nehmen Sie Ihre Antwort auf und wählen Sie „Aufnahme speichern“."
                    : missingRequiredBlocks[0].type === "writing-practice"
                      ? "Schreiben: Wählen Sie „Antwort speichern“."
                      : "Beantworten Sie die offene Aufgabe, bevor Sie zum nächsten Kapitel gehen."}
                </p>
                <a className="mt-3 inline-flex min-h-11 items-center gap-2 font-bold underline underline-offset-2" href={`#academy-block-${missingRequiredBlocks[0].id}`}>
                  Zur nächsten offenen Aufgabe <ArrowRight size={16} />
                </a>
              </div>
            ) : (
              <form action={completeAction}>
                <button className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-[var(--academy-accent)] px-7 text-xs font-bold uppercase text-white">
                  {completed ? <CheckCircle2 size={17} /> : null}
                  {nextLesson
                    ? completed
                      ? "Continue"
                      : "Complete and continue"
                    : lesson.examTrack
                      ? completed
                        ? "Return to course"
                        : "Complete exam route"
                    : course.rules?.requireFinalAssessment === false
                      ? completed
                        ? "Return to course"
                        : "Complete course"
                      : "Complete and take final check"}
                  <ArrowRight size={16} />
                </button>
              </form>
            )}
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

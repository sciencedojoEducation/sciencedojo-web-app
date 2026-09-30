import { notFound, redirect } from "next/navigation";
import { chooseAcademyExamTrack } from "@/app/dashboard/tutor/academy/actions";
import AcademyThemeScope from "@/components/tutor-academy/AcademyThemeScope";
import { getPublishedAcademyCourse } from "@/lib/academy-courses";
import { getAcademyCoreLessons, getAcademyLessonProgressState, getAcademyResumeHref } from "@/lib/tutor-academy";
import { getTutorAcademyProgress } from "@/lib/tutor-academy-progress";

export async function renderChooseAcademyExamPage(
  courseKey: string,
  query: { error?: string },
  basePath: string,
) {
  const course = await getPublishedAcademyCourse(courseKey);
  if (!course?.examTracks?.length) notFound();
  const progress = await getTutorAcademyProgress(course.key);
  const coreComplete = getAcademyCoreLessons(course).every((lesson) =>
    getAcademyLessonProgressState(progress, lesson.slug, lesson.id) === "completed");
  const assessmentComplete = course.rules?.requireFinalAssessment === false ||
    progress.passedQuizRevision >= (course.quizRevision || 1);
  if (!coreComplete || !assessmentComplete)
    redirect(getAcademyResumeHref(progress, course, basePath));

  return (
    <AcademyThemeScope course={course} className="min-h-screen bg-[#FBFCFD] px-5 py-12 text-[#17202C] sm:py-20">
      <main className="mx-auto max-w-[900px]">
        <p className="text-xs font-bold uppercase tracking-[0.17em] text-[var(--academy-accent)]">Prüfungsvorbereitung</p>
        <h1 className="mt-4 text-3xl font-bold sm:text-5xl">Welche A1-Prüfung möchten Sie vorbereiten?</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[#435164]">
          Beide Wege nutzen das gleiche Deutschwissen. Wählen Sie das Format Ihrer geplanten Prüfung.
          Ihre Wahl und Ihr Lernfortschritt werden gespeichert.
        </p>
        {query.error === "progress" ? (
          <p role="alert" className="mt-5 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900">
            Ihre Wahl konnte nicht gespeichert werden. Bitte versuchen Sie es noch einmal.
          </p>
        ) : null}
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {course.examTracks.map((track) => {
            const choose = chooseAcademyExamTrack.bind(null, course.key, track.id, basePath);
            return (
              <form action={choose} key={track.id} className="flex flex-col rounded-2xl border border-[#D9E1E9] bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-2xl font-bold">{track.title}</h2>
                <p className="mt-3 flex-1 text-sm leading-7 text-[#435164]">{track.description}</p>
                <button type="submit" className="mt-7 min-h-12 rounded-full bg-[var(--academy-accent)] px-6 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--academy-accent)] focus-visible:ring-offset-2">
                  {progress.selectedExamTrack === track.id ? "Diesen Weg fortsetzen" : "Diesen Weg wählen"}
                </button>
              </form>
            );
          })}
        </div>
      </main>
    </AcademyThemeScope>
  );
}

export default async function ChooseAcademyExamPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseKey: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ courseKey }, query] = await Promise.all([params, searchParams]);
  return renderChooseAcademyExamPage(
    courseKey,
    query,
    `/dashboard/tutor/academy/courses/${courseKey}`,
  );
}

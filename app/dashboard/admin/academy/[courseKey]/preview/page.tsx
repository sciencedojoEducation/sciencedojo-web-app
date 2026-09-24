import { Merriweather } from "next/font/google";
import { notFound } from "next/navigation";
import AcademyDraftQuizPreview from "@/components/admin/academy-builder/AcademyDraftQuizPreview";
import AcademyCourseContents from "@/components/tutor-academy/AcademyCourseContents";
import AcademyCourseCover from "@/components/tutor-academy/AcademyCourseCover";
import AcademyLessonBlocks from "@/components/tutor-academy/AcademyLessonBlocks";
import AcademyLessonHeader from "@/components/tutor-academy/AcademyLessonHeader";
import AcademyThemeScope from "@/components/tutor-academy/AcademyThemeScope";
import { getAcademyCourseDraft, getAcademySnapshotContent } from "@/lib/academy-courses";
import { emptyAcademyProgress } from "@/lib/tutor-academy";

const academySerif = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-academy-serif",
});

export default async function AcademyDraftPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseKey: string }>;
  searchParams: Promise<{ view?: string; lesson?: string; snapshot?: string }>;
}) {
  const [{ courseKey }, query] = await Promise.all([params, searchParams]);
  const record = await getAcademyCourseDraft(courseKey);
  if (!record) notFound();

  const course = query.snapshot
    ? record.id
      ? await getAcademySnapshotContent(record.id, query.snapshot)
      : null
    : record.draft;
  if (!course) notFound();
  const view =
    query.view === "quiz" || query.view === "lesson" ? query.view : "cover";
  const lesson =
    course.lessons.find((item) => item.slug === query.lesson) ||
    course.lessons[0];
  const lessonIndex = lesson ? course.lessons.indexOf(lesson) : 0;
  const previewHref = (nextView: "cover" | "lesson" | "quiz", slug?: string) => {
    const search = new URLSearchParams({ view: nextView });
    if (slug) search.set("lesson", slug);
    if (query.snapshot) search.set("snapshot", query.snapshot);
    return `/dashboard/admin/academy/${course.key}/preview?${search.toString()}`;
  };

  return (
    <AcademyThemeScope
      course={course}
      className={`${academySerif.variable} min-h-screen bg-white text-[#101010]`}
    >
      <div className="sticky top-0 z-30 flex min-h-9 items-center justify-center border-b border-amber-200 bg-amber-50 px-4 text-center text-[9px] font-black uppercase tracking-[0.14em] text-amber-900">
        {query.snapshot ? "Snapshot preview" : "Admin draft preview"} · interactions stay in preview and are not saved as learner progress
      </div>

      {view === "cover" ? (
        <main>
          <AcademyCourseCover
            course={course}
            ctaHref={
              lesson
                ? previewHref("lesson", lesson.slug)
                : previewHref("quiz")
            }
            ctaLabel="Start course"
          />
          <AcademyCourseContents
            course={course}
            progress={emptyAcademyProgress}
            lessonHref={(slug) => previewHref("lesson", slug)}
            quizHref={previewHref("quiz")}
          />
        </main>
      ) : null}

      {view === "lesson" && lesson ? (
        <main className="pb-20">
          <AcademyLessonHeader
            course={course}
            lesson={lesson}
            index={lessonIndex}
          />
          <div className="mx-auto max-w-[728px] px-6 py-14">
            <AcademyLessonBlocks blocks={lesson.blocks} />
          </div>
        </main>
      ) : null}

      {view === "quiz" ? (
        <main className="mx-auto max-w-[760px] px-6 py-14 sm:py-20">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--academy-accent)]">
            Final assessment
          </p>
          <h1 className="mt-3 text-4xl font-black">Knowledge check</h1>
          <p className="academy-reading-copy mt-5 text-[17px] leading-8 text-secondary/65">
            Pass mark {course.passMark || 80}% · {course.quiz.length} questions
          </p>
          <div className="mt-10">
            <AcademyDraftQuizPreview
              questions={course.quiz}
              passMark={course.passMark || 80}
            />
          </div>
        </main>
      ) : null}
    </AcademyThemeScope>
  );
}

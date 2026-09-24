import Link from "next/link";
import { Merriweather } from "next/font/google";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import AcademyDraftQuizPreview from "@/components/admin/academy-builder/AcademyDraftQuizPreview";
import AcademyTemplatePreviewStudio from "@/components/admin/academy-builder/AcademyTemplatePreviewStudio";
import AcademyCourseContents from "@/components/tutor-academy/AcademyCourseContents";
import AcademyCourseCover from "@/components/tutor-academy/AcademyCourseCover";
import AcademyLessonBlocks from "@/components/tutor-academy/AcademyLessonBlocks";
import AcademyLessonHeader from "@/components/tutor-academy/AcademyLessonHeader";
import AcademyThemeScope from "@/components/tutor-academy/AcademyThemeScope";
import { academyTemplates } from "@/lib/academy-templates";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { emptyAcademyProgress } from "@/lib/tutor-academy";

const academySerif = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-academy-serif",
});

export default async function AcademyTemplatePreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string; view?: string; lesson?: string; embedded?: string }>;
}) {
  const {
    template: key,
    view: requestedView,
    lesson: slug,
    embedded,
  } = await searchParams;
  if (!(await isFeatureEnabled("academy_builder_v2_enabled"))) notFound();
  const template = academyTemplates.find((item) => item.key === key);
  if (!template) notFound();
  const course = template.course;
  if (embedded !== "1")
    return (
      <AcademyTemplatePreviewStudio
        templateKey={template.key}
        templateName={template.name}
        lessons={course.lessons.map((lesson) => ({
          slug: lesson.slug,
          title: lesson.title,
        }))}
        hasQuiz={course.quiz.length > 0}
      />
    );
  const view =
    requestedView === "lesson" || requestedView === "quiz"
      ? requestedView
      : "cover";
  const lesson =
    course.lessons.find((item) => item.slug === slug) || course.lessons[0];
  const href = (nextView: "cover" | "lesson" | "quiz", nextSlug?: string) => {
    const query = new URLSearchParams({
      template: template.key,
      view: nextView,
      embedded: "1",
    });
    if (nextSlug) query.set("lesson", nextSlug);
    return `/dashboard/admin/academy/new/preview?${query.toString()}`;
  };

  return (
    <AcademyThemeScope
      course={course}
      className={`${academySerif.variable} min-h-screen bg-white text-[#18212B]`}
    >
      {view === "cover" ? (
        <main>
          <AcademyCourseCover
            course={course}
            ctaHref={lesson ? href("lesson", lesson.slug) : href("quiz")}
            ctaLabel="Explore lessons"
          />
          <AcademyCourseContents
            course={course}
            progress={emptyAcademyProgress}
            lessonHref={(lessonSlug) => href("lesson", lessonSlug)}
            quizHref={href("quiz")}
          />
        </main>
      ) : null}
      {view === "lesson" && lesson ? (
        <main className="pb-20">
          <AcademyLessonHeader
            course={course}
            lesson={lesson}
            index={course.lessons.indexOf(lesson)}
          />
          <div className="mx-auto max-w-[728px] px-6 py-14">
            <AcademyLessonBlocks blocks={lesson.blocks} />
            <div className="mt-14 flex flex-wrap gap-3 border-t border-black/10 pt-6">
              <Link
                href={href("cover")}
                className="inline-flex min-h-11 items-center rounded-full border border-black/15 px-4 text-xs font-semibold"
              >
                Course contents
              </Link>
              {course.lessons[course.lessons.indexOf(lesson) + 1] ? (
                <Link
                  href={href(
                    "lesson",
                    course.lessons[course.lessons.indexOf(lesson) + 1].slug,
                  )}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-4 text-xs font-semibold text-white"
                >
                  Next lesson <ArrowRight size={14} />
                </Link>
              ) : course.quiz.length ? (
                <Link
                  href={href("quiz")}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-4 text-xs font-semibold text-white"
                >
                  Final assessment <ArrowRight size={14} />
                </Link>
              ) : null}
            </div>
          </div>
        </main>
      ) : null}
      {view === "quiz" ? (
        <main className="mx-auto max-w-[760px] px-6 py-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            Template assessment preview
          </p>
          <h1 className="mt-3 text-4xl font-semibold">Final assessment</h1>
          {course.quiz.length ? (
            <div className="mt-8">
              <AcademyDraftQuizPreview
                questions={course.quiz}
                passMark={course.passMark || 80}
              />
            </div>
          ) : (
            <p className="mt-5 text-sm text-[#6C747C]">
              This template uses practice inside its lessons and has no final
              assessment.
            </p>
          )}
          <Link
            href={href("cover")}
            className="mt-8 inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-primary"
          >
            <ArrowLeft size={14} /> Course contents
          </Link>
        </main>
      ) : null}
    </AcademyThemeScope>
  );
}

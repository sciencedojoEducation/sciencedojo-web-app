import AcademyCourseContents from "@/components/tutor-academy/AcademyCourseContents";
import AcademyCourseCover from "@/components/tutor-academy/AcademyCourseCover";
import AcademyThemeScope from "@/components/tutor-academy/AcademyThemeScope";
import { getPublishedAcademyCourse } from "@/lib/academy-courses";
import { getTutorAcademyProgress } from "@/lib/tutor-academy-progress";
import { getAcademyResumeHref } from "@/lib/tutor-academy";
import { notFound } from "next/navigation";

export async function renderAcademyCoursePage(
  courseKey: string,
  basePath: string,
) {
  const course = await getPublishedAcademyCourse(courseKey);
  if (!course) notFound();
  const progress = await getTutorAcademyProgress(course.key);
  return (
    <AcademyThemeScope course={course} className="min-h-full bg-white">
      <AcademyCourseCover
        course={course}
        ctaHref={getAcademyResumeHref(progress, course, basePath)}
        ctaLabel={progress.startedLessons.length ? "Continue course" : "Start course"}
      />
      <AcademyCourseContents
        course={course}
        progress={progress}
        lessonHref={(lessonSlug) => `${basePath}/lessons/${lessonSlug}`}
        quizHref={`${basePath}/quiz`}
      />
    </AcademyThemeScope>
  );
}

export default async function AcademyCoursePage({
  params,
}: {
  params: Promise<{ courseKey: string }>;
}) {
  const { courseKey } = await params;
  return renderAcademyCoursePage(
    courseKey,
    `/dashboard/tutor/academy/courses/${courseKey}`,
  );
}

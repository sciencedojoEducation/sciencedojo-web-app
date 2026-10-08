import AcademyCourseContents from "@/components/tutor-academy/AcademyCourseContents";
import AcademyCourseCover from "@/components/tutor-academy/AcademyCourseCover";
import AcademyThemeScope from "@/components/tutor-academy/AcademyThemeScope";
import { getPublishedAcademyCourse } from "@/lib/academy-courses";
import { getTutorAcademyProgress } from "@/lib/tutor-academy-progress";
import { getAcademyResumeHref } from "@/lib/tutor-academy";
import { notFound } from "next/navigation";
import { getAcademyLearnerPosition } from "@/lib/academy-learner-position";
import { academyBookmarkedResumeHref } from "@/lib/academy-resume-position";

export async function renderAcademyCoursePage(
  courseKey: string,
  basePath: string,
) {
  const course = await getPublishedAcademyCourse(courseKey);
  if (!course) notFound();
  const [progress, position] = await Promise.all([
    getTutorAcademyProgress(course.key),
    getAcademyLearnerPosition(course.key),
  ]);
  return (
    <AcademyThemeScope course={course} className="min-h-full bg-white">
      <AcademyCourseCover
        course={course}
        ctaHref={academyBookmarkedResumeHref(course, progress, position, basePath, getAcademyResumeHref(progress, course, basePath))}
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

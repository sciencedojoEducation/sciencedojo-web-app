import { renderAcademyCourseLessonPage } from "@/lib/academy-course-lesson-page";

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

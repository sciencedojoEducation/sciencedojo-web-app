import { renderAcademyCoursePage } from "@/lib/academy-course-page";

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

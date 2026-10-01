import { renderAcademyCourseQuizPage } from "@/lib/academy-quiz-page";

export default async function AcademyCourseQuizPage({
  params,
}: {
  params: Promise<{ courseKey: string }>;
}) {
  const { courseKey } = await params;
  return renderAcademyCourseQuizPage(
    courseKey,
    `/dashboard/tutor/academy/courses/${courseKey}`,
  );
}

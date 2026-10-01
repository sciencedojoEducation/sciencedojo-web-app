import { renderAcademyCourseQuizPage } from "@/lib/academy-quiz-page";
export default async function AcademyQuizPage({ params }: { params: Promise<{ courseKey: string }> }) { const { courseKey } = await params; return renderAcademyCourseQuizPage(courseKey, `/dashboard/academy/${courseKey}`); }

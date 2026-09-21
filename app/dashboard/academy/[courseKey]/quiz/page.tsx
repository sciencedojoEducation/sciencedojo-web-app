import { renderAcademyCourseQuizPage } from "@/app/dashboard/tutor/academy/courses/[courseKey]/quiz/page";
export default async function AcademyQuizPage({ params }: { params: Promise<{ courseKey: string }> }) { const { courseKey } = await params; return renderAcademyCourseQuizPage(courseKey, `/dashboard/academy/${courseKey}`); }

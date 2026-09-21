import { renderAcademyCoursePage } from "@/app/dashboard/tutor/academy/courses/[courseKey]/page";
export default async function AcademyCoursePage({ params }: { params: Promise<{ courseKey: string }> }) { const { courseKey } = await params; return renderAcademyCoursePage(courseKey, `/dashboard/academy/${courseKey}`); }

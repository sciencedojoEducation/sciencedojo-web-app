import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Merriweather } from "next/font/google";
import AcademyCourseNavigation from "@/components/tutor-academy/AcademyCourseNavigation";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { getPublishedAcademyCourse } from "@/lib/academy-courses";
import { getTutorAcademyProgress } from "@/lib/tutor-academy-progress";

const academySerif = Merriweather({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-academy-serif" });

export default async function AcademyLayout({ children }: { children: React.ReactNode }) {
  if (!(await isFeatureEnabled("tutor_academy_enabled"))) redirect("/dashboard");
  const pathname = (await headers()).get("x-next-pathname") || "";
  const courseKey = pathname.match(/\/dashboard\/academy\/([^/]+)/)?.[1];
  if (!courseKey) return <>{children}</>;
  const course = await getPublishedAcademyCourse(courseKey); if (!course) redirect("/dashboard/academy");
  const progress = await getTutorAcademyProgress(course.key);
  const basePath = `/dashboard/academy/${course.key}`;
  const navigationCourse = { key: course.key, shortTitle: course.shortTitle, heroImage: course.heroImage, lessons: course.lessons, quizRevision: course.quizRevision };
  return <div className={`${academySerif.variable} h-full min-h-0 bg-white text-[#101010]`}><AcademyCourseNavigation course={navigationCourse} progress={progress} basePath={basePath}>{children}</AcademyCourseNavigation></div>;
}

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Merriweather } from "next/font/google";
import AcademyCourseNavigation from "@/components/tutor-academy/AcademyCourseNavigation";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { tutorAcademyCourse } from "@/lib/tutor-academy";
import { getTutorAcademyProgress } from "@/lib/tutor-academy-progress";
import { getPublishedAcademyCourse } from "@/lib/academy-courses";
import { academyThemeStyle } from "@/lib/academy-theme";

const academySerif = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-academy-serif",
});

export default async function TutorAcademyLayout({ children }: { children: React.ReactNode }) {
  const enabled = await isFeatureEnabled("tutor_academy_enabled");
  if (!enabled) redirect("/dashboard/tutor");

  const pathname = (await headers()).get("x-next-pathname") || "";
  const courseKey = pathname.match(/\/dashboard\/tutor\/academy\/courses\/([^/]+)/)?.[1] || tutorAcademyCourse.key;
  const course = await getPublishedAcademyCourse(courseKey);
  if (!course) redirect("/dashboard/tutor/academy");
  const progress = await getTutorAcademyProgress(course.key);
  const basePath = course.key === tutorAcademyCourse.key ? "/dashboard/tutor/academy" : `/dashboard/tutor/academy/courses/${course.key}`;
  const navigationCourse = { key: course.key, shortTitle: course.shortTitle, heroImage: course.heroImage, lessons: course.lessons, quizRevision: course.quizRevision, rules: course.rules };

  return (
    <div className={`${academySerif.variable} h-full min-h-0 bg-white text-[#101010]`} style={academyThemeStyle(course)}>
      <AcademyCourseNavigation course={navigationCourse} progress={progress} basePath={basePath}>
        {children}
      </AcademyCourseNavigation>
    </div>
  );
}

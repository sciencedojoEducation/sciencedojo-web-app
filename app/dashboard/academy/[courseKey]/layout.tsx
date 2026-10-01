import AcademyCourseUtilityLinks from "@/components/tutor-academy/AcademyCourseUtilityLinks";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Merriweather } from "next/font/google";
import { academyBodyFont } from "@/lib/academy-fonts";
import AcademyCourseNavigation from "@/components/tutor-academy/AcademyCourseNavigation";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { getPublishedAcademyCourse } from "@/lib/academy-courses";
import { getTutorAcademyProgress } from "@/lib/tutor-academy-progress";
import { academyThemeStyle } from "@/lib/academy-theme";

const academySerif = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-academy-serif",
});

export default async function AcademyCourseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ courseKey: string }>;
}) {
  if (!(await isFeatureEnabled("tutor_academy_enabled")) && !(await isFeatureEnabled("course_pilot_enabled")))
    redirect("/dashboard");
  // Cached catalogue layouts cannot resolve the course entered later.
  const { courseKey } = await params;
  const supabase = await createClient();
  const { data: access, error: accessError } = await supabase.rpc("course_pilot_access", { target_key: courseKey });
  if (accessError && !["PGRST202", "42883"].includes(accessError.code)) throw new Error("Unable to check course access");
  if (access?.managed && !access.allowed) redirect(`/courses/${courseKey}`);
  if (!access?.managed && !(await isFeatureEnabled("tutor_academy_enabled"))) redirect("/dashboard/academy");
  const course = await getPublishedAcademyCourse(courseKey);
  if (!course) redirect("/dashboard/academy");
  const progress = await getTutorAcademyProgress(course.key);
  const { data: enrolled } = await supabase.rpc("course_pilot_enrolled", { target: course.id });
  const basePath = `/dashboard/academy/${course.key}`;
  const navigationCourse = {
    key: course.key,
    shortTitle: course.shortTitle,
    heroImage: course.heroImage,
    lessons: course.lessons,
    quizRevision: course.quizRevision,
    rules: course.rules,
  };
  return (
    <div
      className={`${academySerif.variable} ${academyBodyFont.variable} academy-course-typography h-full min-h-0 bg-white text-[#101010]`}
      style={academyThemeStyle(course)}
    >
      <AcademyCourseNavigation
        course={navigationCourse}
        progress={progress}
        basePath={basePath}
        exitHref="/dashboard"
      >
        {enrolled && <AcademyCourseUtilityLinks basePath={basePath} />}
        {children}
      </AcademyCourseNavigation>
    </div>
  );
}

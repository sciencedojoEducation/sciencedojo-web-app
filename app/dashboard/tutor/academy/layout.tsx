import { redirect } from "next/navigation";
import { Merriweather } from "next/font/google";
import AcademyCourseNavigation from "@/components/tutor-academy/AcademyCourseNavigation";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { tutorAcademyCourse } from "@/lib/tutor-academy";
import { getTutorAcademyProgress } from "@/lib/tutor-academy-progress";

const academySerif = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-academy-serif",
});

export default async function TutorAcademyLayout({ children }: { children: React.ReactNode }) {
  const enabled = await isFeatureEnabled("tutor_academy_enabled");
  if (!enabled) redirect("/dashboard/tutor");

  const progress = await getTutorAcademyProgress();

  return (
    <div className={`${academySerif.variable} h-full min-h-0 bg-white text-[#101010]`}>
      <AcademyCourseNavigation lessons={tutorAcademyCourse.lessons} progress={progress}>
        {children}
      </AcademyCourseNavigation>
    </div>
  );
}

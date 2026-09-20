import { redirect } from "next/navigation";
import AcademyCourseNavigation from "@/components/tutor-academy/AcademyCourseNavigation";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { tutorAcademyCourse } from "@/lib/tutor-academy";
import { getTutorAcademyProgress } from "@/lib/tutor-academy-progress";

export default async function TutorAcademyLayout({ children }: { children: React.ReactNode }) {
  const enabled = await isFeatureEnabled("tutor_academy_enabled");
  if (!enabled) redirect("/dashboard/tutor");

  const progress = await getTutorAcademyProgress();

  return (
    <div className="min-h-full bg-[#f6f9fc] text-secondary">
      <div className="border-b border-secondary/8 bg-secondary px-5 py-5 text-white sm:px-8">
        <div className="mx-auto flex max-w-[90rem] items-center justify-between gap-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200/70">ScienceDojo Tutor Academy</p>
            <h1 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">{tutorAcademyCourse.shortTitle}</h1>
          </div>
          <div className="min-w-32 text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">Course progress</p>
            <p className="mt-1 text-lg font-black">{progress.completedLessons.length}/{tutorAcademyCourse.lessons.length} lessons</p>
          </div>
        </div>
      </div>
      <div className="mx-auto flex max-w-[90rem] items-stretch">
        <AcademyCourseNavigation lessons={tutorAcademyCourse.lessons} progress={progress} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

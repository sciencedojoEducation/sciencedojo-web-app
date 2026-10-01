import { redirect } from "next/navigation";
import { isFeatureEnabled } from "@/lib/feature-flags";

export default async function AcademyLayout({ children }: { children: React.ReactNode }) {
  if (!(await isFeatureEnabled("tutor_academy_enabled")) && !(await isFeatureEnabled("course_pilot_enabled")))
    redirect("/dashboard");
  return <>{children}</>;
}

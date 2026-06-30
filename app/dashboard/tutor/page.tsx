import TutorHomeDashboardUI from "./TutorHomeDashboardUI";
import { getTutorDashboardData } from "./data";
import FeatureUnavailable from "@/components/FeatureUnavailable";
import { isFeatureEnabled } from "@/lib/feature-flags";

export default async function TutorDashboard() {
  const tutorDashboardEnabled = await isFeatureEnabled("tutor_dashboard_enabled");
  if (!tutorDashboardEnabled) {
    return (
      <FeatureUnavailable
        eyebrow="Dashboard preparing"
        title="Your dashboard is being prepared."
        message="Your tutor dashboard is being prepared. Please contact ScienceDojo support if you need help."
        ctaHref="/dashboard/support"
        ctaLabel="Contact support"
      />
    );
  }

  const data = await getTutorDashboardData();

  if (!data) {
    return <div>Please log in.</div>;
  }

  return <TutorHomeDashboardUI {...data} />;
}

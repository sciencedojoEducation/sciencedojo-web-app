import TutorHomeDashboardUI from "./TutorHomeDashboardUI";
import { getTutorDashboardData } from "./data";

export default async function TutorDashboard() {
  const data = await getTutorDashboardData();

  if (!data) {
    return <div>Please log in.</div>;
  }

  return <TutorHomeDashboardUI {...data} />;
}

import TutorDashboardUI, { type TutorWorkspaceTab } from "../TutorDashboardUI";
import { getTutorDashboardData } from "../data";

const VALID_TABS: TutorWorkspaceTab[] = [
  "schedule",
  "requests",
  "sessions",
  "students",
  "availability",
];

function normalizeTab(value: string | string[] | undefined): TutorWorkspaceTab {
  const tab = Array.isArray(value) ? value[0] : value;
  return VALID_TABS.includes(tab as TutorWorkspaceTab) ? (tab as TutorWorkspaceTab) : "schedule";
}

export default async function TutorSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const data = await getTutorDashboardData();

  if (!data) {
    return <div>Please log in.</div>;
  }

  const params = await searchParams;
  const initialTab = normalizeTab(params.tab);

  return (
    <TutorDashboardUI
      {...data}
      initialTab={initialTab}
      workspaceOnly
    />
  );
}

export type DashboardDayPeriod = "morning" | "afternoon" | "evening" | "night";

export function getDashboardDayPeriod(hour: number): DashboardDayPeriod {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

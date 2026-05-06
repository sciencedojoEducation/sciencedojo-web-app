import type { Step } from "react-joyride";

export type DashboardTourRole = "student" | "parent" | "tutor";

export type DashboardTourStep = Step & {
  title: string;
};

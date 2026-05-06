import type { DashboardTourStep } from "./types";

export const studentTour: DashboardTourStep[] = [
  {
    target: '[data-tour="student-sidebar"]',
    title: "Your learning menu",
    content: "This is your learning menu.",
    placement: "right",
  },
  {
    target: '[data-tour="student-classes"]',
    title: "My Classes",
    content: "Access your learning sessions here.",
  },
  {
    target: '[data-tour="student-tasks"]',
    title: "Missions",
    content: "Complete your daily practice and homework.",
  },
  {
    target: '[data-tour="student-messages"]',
    title: "Messages",
    content: "Ask your tutor when you need help.",
  },
  {
    target: '[data-tour="student-progress"]',
    title: "Progress",
    content: "Track how you are improving.",
  },
  {
    target: '[data-tour="student-sessions"]',
    title: "Lessons",
    content: "Join confirmed sessions from here.",
  },
  {
    target: '[data-tour="student-homework"]',
    title: "Start learning",
    content: "Start your learning here.",
  },
];

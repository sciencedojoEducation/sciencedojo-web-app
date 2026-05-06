import type { DashboardTourStep } from "./types";

export const tutorTour: DashboardTourStep[] = [
  {
    target: '[data-tour="tutor-sidebar"]',
    title: "Teaching control panel",
    content: "This is your teaching control panel.",
    placement: "right",
  },
  {
    target: '[data-tour="tutor-sessions"]',
    title: "My Schedule",
    content: "View and manage your upcoming lessons.",
  },
  {
    target: '[data-tour="tutor-students"]',
    title: "My Classes",
    content: "See student details and progress.",
  },
  {
    target: '[data-tour="tutor-messages"]',
    title: "Messages",
    content: "Communicate with students and parents.",
  },
  {
    target: '[data-tour="tutor-availability"]',
    title: "Availability",
    content: "Update when you are available to teach.",
  },
  {
    target: '[data-tour="tutor-tabs"]',
    title: "Dashboard tabs",
    content: "Switch between schedule, requests, sessions, students, and availability.",
  },
  {
    target: '[data-tour="tutor-stats"]',
    title: "Tutor stats",
    content: "Track earnings, hours taught, and open requests.",
  },
  {
    target: '[data-tour="tutor-main-action"]',
    title: "Next session",
    content: "Start with your next session here.",
  },
];

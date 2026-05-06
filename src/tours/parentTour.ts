import type { DashboardTourStep } from "./types";

export const parentTour: DashboardTourStep[] = [
  {
    target: '[data-tour="parent-sidebar"]',
    title: "Your menu",
    content: "Use this menu to move around ScienceDojo.",
    placement: "right",
  },
  {
    target: '[data-tour="parent-bookings"]',
    title: "My Bookings",
    content: "View and manage your child’s sessions.",
  },
  {
    target: '[data-tour="parent-browse"]',
    title: "Browse Tutors",
    content: "Find and book the right tutor.",
  },
  {
    target: '[data-tour="parent-messages"]',
    title: "Messages",
    content: "Chat with tutors and stay updated.",
  },
  {
    target: '[data-tour="parent-support"]',
    title: "Support",
    content: "Get help anytime from ScienceDojo.",
  },
  {
    target: '[data-tour="parent-progress"]',
    title: "Progress",
    content: "Check how tutoring is building up over time.",
  },
  {
    target: '[data-tour="parent-homework"]',
    title: "Homework",
    content: "See practice your child should complete between lessons.",
  },
  {
    target: '[data-tour="parent-sessions"]',
    title: "Upcoming lessons",
    content: "Join confirmed sessions from here when it is time.",
  },
  {
    target: '[data-tour="parent-main-action"]',
    title: "Find a tutor",
    content: "Start here to find a tutor for your child.",
  },
];

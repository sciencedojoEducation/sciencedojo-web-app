import type { FeatureFlagKey } from "@/lib/feature-flags";

export type ShowcaseRole = "parent" | "student" | "tutor";

export type ShowcaseItem = {
  role: ShowcaseRole;
  label: string;
  headline: string;
  introduction: string;
  homeScreenshot: string;
  homeMobileScreenshot: string;
  tourScreenshot: string;
  screenshotAlt: string;
  requiredFlags: FeatureFlagKey[];
  journey: { title: string; description: string }[];
  otherTools: string[];
};

export const showcaseItems: ShowcaseItem[] = [
  {
    role: "parent",
    label: "For parents",
    headline: "Know what happened, and what comes next.",
    introduction: "See the next lesson, tutor practice and recent learning together in your family workspace.",
    homeScreenshot: "/images/product-tour/parent-home.webp",
    homeMobileScreenshot: "/images/product-tour/parent-home-mobile.webp",
    tourScreenshot: "/images/product-tour/parent-tour.webp",
    screenshotAlt: "Parent dashboard showing a scheduled Maths lesson and Jamie's recent lesson count, with sample data",
    requiredFlags: ["parent_dashboard_enabled", "booking_enabled"],
    journey: [
      { title: "Prepare for the next lesson", description: "Keep the next session and its subject in view." },
      { title: "Review practice", description: "See the work your child can do between lessons." },
      { title: "Follow progress", description: "Find recent learning and the current focus in one place." },
    ],
    otherTools: ["Tutor messages", "Lesson history", "Booking management"],
  },
  {
    role: "student",
    label: "For students",
    headline: "Always know your next learning step.",
    introduction: "Move from a lesson to focused practice, with your classes and Missions close by.",
    homeScreenshot: "/images/product-tour/student-home.webp",
    homeMobileScreenshot: "/images/product-tour/student-home-mobile.webp",
    tourScreenshot: "/images/product-tour/student-tour.webp",
    screenshotAlt: "Student dashboard showing lesson progress and a Ratios and Proportions Mission, with sample data",
    requiredFlags: ["student_dashboard_enabled"],
    journey: [
      { title: "See your next step", description: "Start from a clear plan for your learning." },
      { title: "Open your class", description: "Find lessons and tutor practice in your class space." },
      { title: "Complete a Mission", description: "Work through guided questions between lessons." },
    ],
    otherTools: ["Lesson history", "Tutor messages", "Subject overview"],
  },
  {
    role: "tutor",
    label: "For tutors",
    headline: "Keep teaching and follow-up connected.",
    introduction: "Review requests, see upcoming lessons and keep class activity in view.",
    homeScreenshot: "/images/product-tour/tutor-home.webp",
    homeMobileScreenshot: "/images/product-tour/tutor-home-mobile.webp",
    tourScreenshot: "/images/product-tour/tutor-tour.webp",
    screenshotAlt: "Tutor dashboard showing a lesson request and upcoming teaching count, with sample data",
    requiredFlags: ["tutor_dashboard_enabled", "booking_enabled"],
    journey: [
      { title: "Review requests", description: "Respond to families from your teaching home." },
      { title: "Prepare for lessons", description: "See your upcoming schedule and open your classes." },
      { title: "Follow up", description: "Review activity and guide the next practice step." },
    ],
    otherTools: ["Availability", "Student overview", "Class activity"],
  },
];

export function getVisibleShowcaseItems(flags: Record<FeatureFlagKey, boolean>) {
  return showcaseItems.filter((item) => item.requiredFlags.every((key) => flags[key]));
}

export function getShowcaseCta(role: ShowcaseRole, flags: Record<FeatureFlagKey, boolean>) {
  if (role === "parent") {
    if (flags.free_assessment_enabled) return { href: "/free-assessment", label: "Request a free assessment" };
    if (flags.tutor_marketplace_enabled) return { href: "/find-tutors", label: "Find a tutor" };
  }
  if (role === "student") {
    if (flags.practice_dojo_enabled) return { href: "/ai-practice-studio", label: "Try free practice" };
    if (flags.focus_dojo_enabled) return { href: "/focus-dojo", label: "Try FocusDojo" };
  }
  if (role === "tutor") {
    if (flags.tutor_applications_enabled) return { href: "/tutor/onboarding", label: "Apply to tutor" };
    return { href: "/support/tutors", label: "Explore tutor support" };
  }
  return null;
}

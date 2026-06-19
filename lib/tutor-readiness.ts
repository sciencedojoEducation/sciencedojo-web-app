import type { AvailabilitySlot, TutorProfile } from "@/lib/supabase-queries";

export type TutorReadinessAction = {
  label: string;
  href?: string;
  action?: "availability";
};

export type TutorReadinessItem = {
  id: "photo" | "bio" | "video" | "availability" | "payments";
  label: string;
  helper: string;
  weight: number;
  completed: boolean;
  href?: string;
  action?: "availability";
  actionLabel: string;
};

export type TutorJourneyStep = {
  id: string;
  label: string;
  completed: boolean;
};

export type TutorReadinessResult = {
  percent: number;
  completedWeight: number;
  totalWeight: number;
  completed: number;
  total: number;
  items: TutorReadinessItem[];
  actionsRemaining: number;
  recommendedNextAction: {
    title: string;
    body: string;
    cta: TutorReadinessAction;
  };
  healthSummary: {
    readinessLabel: string;
    availabilityLabel: string;
    payoutsLabel: string;
    reviewsLabel: string;
    launchStatus: string;
  };
  journey: TutorJourneyStep[];
};

type BuildTutorReadinessInput = {
  tutor: TutorProfile | null;
  applicationData?: Record<string, any> | null;
  availabilitySlots?: AvailabilitySlot[];
  stripeOnboardingComplete?: boolean;
  publicReviewCount?: number;
  bookingRequestCount?: number;
  completedLessonCount?: number;
};

const TOTAL_WEIGHT = 100;

function hasText(value: unknown, minLength = 1) {
  return typeof value === "string" && value.trim().length >= minLength;
}

function hasIntroVideo(tutor: TutorProfile | null, applicationData: Record<string, any>) {
  return Boolean(
    tutor?.youtube_intro_url ||
    applicationData.demo_video_url ||
    applicationData.youtube_url
  );
}

export function buildTutorReadiness({
  tutor,
  applicationData,
  availabilitySlots = [],
  stripeOnboardingComplete = false,
  publicReviewCount = 0,
  bookingRequestCount = 0,
  completedLessonCount = 0,
}: BuildTutorReadinessInput): TutorReadinessResult {
  const appData = applicationData || {};
  const items: TutorReadinessItem[] = [
    {
      id: "photo",
      label: "Profile photo",
      helper: "Students and parents trust profiles faster when they can recognize the tutor.",
      weight: 15,
      completed: Boolean(tutor?.avatar_url),
      href: "/dashboard/tutor/settings",
      actionLabel: "Add photo",
    },
    {
      id: "bio",
      label: "Tutor bio",
      helper: "Explain who you support, what you teach, and how your lessons feel.",
      weight: 15,
      completed: hasText(tutor?.bio, 40),
      href: "/dashboard/tutor/settings",
      actionLabel: "Complete bio",
    },
    {
      id: "video",
      label: "Introduction video",
      helper: "Parents are more likely to trust tutors who introduce themselves clearly.",
      weight: 25,
      completed: hasIntroVideo(tutor, appData),
      href: "/dashboard/tutor/settings",
      actionLabel: "Upload video",
    },
    {
      id: "availability",
      label: "Availability",
      helper: "Set teaching hours so students know when they can request lessons.",
      weight: 25,
      completed: availabilitySlots.length > 0,
      action: "availability",
      actionLabel: "Set availability",
    },
    {
      id: "payments",
      label: "Payouts",
      helper: "Connect payouts before your first paid lesson is confirmed.",
      weight: 20,
      completed: stripeOnboardingComplete,
      href: "/dashboard/tutor/earnings",
      actionLabel: "Connect payouts",
    },
  ];

  const completedWeight = items.reduce((sum, item) => sum + (item.completed ? item.weight : 0), 0);
  const completed = items.filter((item) => item.completed).length;
  const missingItems = items.filter((item) => !item.completed);
  const percent = Math.round((completedWeight / TOTAL_WEIGHT) * 100);
  const recommended = missingItems.sort((a, b) => b.weight - a.weight)[0];

  const recommendedNextAction = recommended
    ? {
        title: recommended.actionLabel,
        body: recommended.helper,
        cta: {
          label: recommended.actionLabel,
          href: recommended.href,
          action: recommended.action,
        },
      }
    : {
        title: "Review your public profile",
        body: "Your launch essentials are complete. Review what families see and keep your profile current.",
        cta: {
          label: "View profile",
          href: tutor?.id ? `/tutor/${tutor.id}` : "/dashboard/tutor",
        },
      };

  const journey: TutorJourneyStep[] = [
    {
      id: "profile",
      label: "Complete profile",
      completed: percent >= 55,
    },
    {
      id: "payouts",
      label: "Connect payouts",
      completed: stripeOnboardingComplete,
    },
    {
      id: "share",
      label: "Share mentor profile",
      completed: percent >= 100,
    },
    {
      id: "enquiry",
      label: "Receive first enquiry",
      completed: bookingRequestCount > 0,
    },
    {
      id: "lesson",
      label: "Deliver first lesson",
      completed: completedLessonCount > 0,
    },
    {
      id: "review",
      label: "Receive first review",
      completed: publicReviewCount > 0,
    },
    {
      id: "grow",
      label: "Grow your profile",
      completed: percent === 100 && publicReviewCount > 0,
    },
  ];

  return {
    percent,
    completedWeight,
    totalWeight: TOTAL_WEIGHT,
    completed,
    total: items.length,
    items,
    actionsRemaining: missingItems.length,
    recommendedNextAction,
    healthSummary: {
      readinessLabel: `${percent}%`,
      availabilityLabel: availabilitySlots.length > 0 ? "Set" : "Needs attention",
      payoutsLabel: stripeOnboardingComplete ? "Connected" : "Not connected",
      reviewsLabel: publicReviewCount > 0 ? `${publicReviewCount} public review${publicReviewCount === 1 ? "" : "s"}` : "No public reviews yet",
      launchStatus: percent >= 100 ? "Ready for students" : `${missingItems.length} action${missingItems.length === 1 ? "" : "s"} remaining`,
    },
    journey,
  };
}

export function buildTutorLaunchChecklist(readiness: TutorReadinessResult, tutorId?: string) {
  return [
    ...readiness.items,
    {
      id: "guide",
      label: "Read Getting Started Guide",
      helper: "Review how lessons, records, payments, and support work.",
      completed: false,
      weight: 0,
      href: "/support/tutors",
      actionLabel: "Open guide",
    },
    {
      id: "public-profile",
      label: "Review your public profile",
      helper: "See what families will view when your profile is ready.",
      completed: readiness.percent === 100,
      weight: 0,
      href: tutorId ? `/tutor/${tutorId}` : "/dashboard/tutor",
      actionLabel: "View profile",
    },
  ];
}

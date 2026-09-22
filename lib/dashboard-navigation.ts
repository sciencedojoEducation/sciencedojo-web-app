import type { DashboardBadgeKey, DashboardRole } from "@/lib/dashboard-badges";

export type DashboardNavIconName =
  | "overview"
  | "funnel"
  | "leads"
  | "tutors"
  | "users"
  | "team"
  | "bookings"
  | "payouts"
  | "messages"
  | "safeguards"
  | "disputes"
  | "projects"
  | "community"
  | "broadcast"
  | "communications"
  | "academy"
  | "settings"
  | "flags"
  | "home"
  | "focus"
  | "subscription"
  | "practice"
  | "guide"
  | "classes"
  | "search"
  | "missions"
  | "profile"
  | "support"
  | "success";

export interface DashboardNavItem {
  name: string;
  href: string;
  iconName: DashboardNavIconName;
  badgeKey?: DashboardBadgeKey;
  exact?: boolean;
  tourId?: string;
}

export interface DashboardNavSection {
  title?: string;
  items: DashboardNavItem[];
}

export const adminNavSections: DashboardNavSection[] = [
  {
    title: "Insights",
    items: [
      { name: "Overview", href: "/dashboard/admin", iconName: "overview", exact: true },
      { name: "Funnel Overview", href: "/dashboard/admin/overview", iconName: "funnel" },
    ],
  },
  {
    title: "People & Operations",
    items: [
      { name: "Assessment Leads", href: "/dashboard/admin/leads", iconName: "leads", badgeKey: "assessmentLeads" },
      { name: "Manage Tutors", href: "/dashboard/admin/tutors", iconName: "tutors", badgeKey: "manageTutors" },
      { name: "User Directory", href: "/dashboard/admin/users", iconName: "users" },
      { name: "Internal Team", href: "/dashboard/admin/team", iconName: "team" },
      { name: "Bookings", href: "/dashboard/admin/bookings", iconName: "bookings" },
      { name: "Tutor Payouts", href: "/dashboard/admin/payouts", iconName: "payouts" },
    ],
  },
  {
    title: "Safety & Support",
    items: [
      { name: "Messages", href: "/dashboard/messages", iconName: "messages", badgeKey: "messages" },
      { name: "Dojo Safeguards", href: "/dashboard/admin/safeguards", iconName: "safeguards", badgeKey: "safeguards" },
      { name: "Disputes", href: "/dashboard/admin/disputes", iconName: "disputes" },
    ],
  },
  {
    title: "Content & Engagement",
    items: [
      { name: "Project Ideas", href: "/dashboard/admin/projects", iconName: "projects", badgeKey: "projectIdeas" },
      { name: "Exam Community", href: "/dashboard/admin/community", iconName: "community" },
      { name: "Broadcast Center", href: "/dashboard/admin/broadcast", iconName: "broadcast" },
      { name: "Communications", href: "/dashboard/admin/communications", iconName: "communications" },
      { name: "Academy Courses", href: "/dashboard/admin/academy", iconName: "academy" },
    ],
  },
  {
    title: "System",
    items: [
      { name: "Platform Settings", href: "/dashboard/admin/settings", iconName: "settings" },
      { name: "Feature Flags", href: "/dashboard/admin/feature-flags", iconName: "flags" },
    ],
  },
];

interface DashboardNavFeatures {
  tutorMarketplaceEnabled: boolean;
  tutorAcademyEnabled: boolean;
}

export function getDashboardNavSections(role: DashboardRole, features: DashboardNavFeatures): DashboardNavSection[] {
  if (role === "admin") return adminNavSections;

  if (role === "user") return [
    {
      title: "Your Dojo",
      items: [
        { name: "My Dojo", href: "/dashboard/user", iconName: "home", exact: true },
        { name: "FocusDojo", href: "/focus-dojo", iconName: "focus" },
        { name: "PracticeDojo", href: "/ai-practice-studio", iconName: "practice" },
      ],
    },
    {
      title: "Account & Help",
      items: [
        { name: "Subscription", href: "/focus-dojo/pricing", iconName: "subscription", badgeKey: "subscriptionIssues" },
        { name: "Account", href: "/dashboard/user#account", iconName: "profile" },
        { name: "Support", href: "/dashboard/support", iconName: "support" },
      ],
    },
  ];

  if (role === "parent") return [
    {
      title: "Your Learning",
      items: [
        { name: "Dashboard", href: "/dashboard/parent", iconName: "overview", badgeKey: "bookingPayments", exact: true, tourId: "parent-bookings" },
        { name: "My Classes", href: "/dashboard/classes", iconName: "classes", tourId: "parent-classes" },
        ...(features.tutorAcademyEnabled ? [{ name: "Academy", href: "/dashboard/academy", iconName: "academy" as const }] : []),
        { name: "Learning Guide", href: "/support", iconName: "guide" },
        ...(features.tutorMarketplaceEnabled ? [{ name: "Browse Tutors", href: "/dashboard/parent/tutors", iconName: "search" as const, tourId: "parent-browse" }] : []),
      ],
    },
    {
      title: "Communication",
      items: [
        { name: "Messages", href: "/dashboard/messages", iconName: "messages", badgeKey: "messages", tourId: "parent-messages" },
        { name: "Support", href: "/dashboard/support", iconName: "support", tourId: "parent-support" },
      ],
    },
    { title: "Account", items: [{ name: "Settings", href: "/dashboard/parent/settings", iconName: "settings" }] },
  ];

  if (role === "student") return [
    {
      title: "Learning",
      items: [
        { name: "My Bookings", href: "/dashboard/student", iconName: "bookings", badgeKey: "bookingPayments", exact: true, tourId: "student-bookings" },
        { name: "My Classes", href: "/dashboard/classes", iconName: "classes", tourId: "student-classes" },
        ...(features.tutorAcademyEnabled ? [{ name: "Academy", href: "/dashboard/academy", iconName: "academy" as const }] : []),
        { name: "Learning Guide", href: "/support", iconName: "guide" },
      ],
    },
    {
      title: "Practice & Focus",
      items: [
        { name: "Missions", href: "/dashboard/student/missions", iconName: "missions", badgeKey: "studentMissions", tourId: "student-tasks" },
        { name: "Focus Timers", href: "/dashboard/student/timers", iconName: "focus" },
      ],
    },
    {
      title: "People & Support",
      items: [
        ...(features.tutorMarketplaceEnabled ? [{ name: "Browse Tutors", href: "/dashboard/student/tutors", iconName: "search" as const }] : []),
        { name: "Messages", href: "/dashboard/messages", iconName: "messages", badgeKey: "messages", tourId: "student-messages" },
        { name: "Support", href: "/dashboard/support", iconName: "support" },
      ],
    },
    { title: "Account", items: [{ name: "Settings", href: "/dashboard/student/settings", iconName: "settings" }] },
  ];

  if (role === "tutor") return [
    {
      title: "Teaching",
      items: [
        { name: "Dashboard", href: "/dashboard/tutor", iconName: "home", exact: true },
        { name: "Schedule", href: "/dashboard/tutor/schedule", iconName: "bookings", badgeKey: "tutorRequests", tourId: "tutor-sessions" },
        { name: "Students & Classes", href: "/dashboard/classes", iconName: "classes", tourId: "tutor-students" },
        { name: "Mission Reviews", href: "/dashboard/tutor/missions", iconName: "missions", badgeKey: "missionReviews" },
        ...(features.tutorAcademyEnabled ? [{ name: "Tutor Academy", href: "/dashboard/tutor/academy", iconName: "academy" as const }] : []),
      ],
    },
    {
      title: "Business",
      items: [
        { name: "Earnings", href: "/dashboard/tutor/earnings", iconName: "payouts" },
        { name: "Profile", href: "/dashboard/tutor/settings", iconName: "profile", tourId: "tutor-availability" },
      ],
    },
    {
      title: "Communication & Help",
      items: [
        { name: "Messages", href: "/dashboard/messages", iconName: "messages", badgeKey: "messages", tourId: "tutor-messages" },
        { name: "Success Center", href: "/support/tutors", iconName: "success" },
        { name: "Support", href: "/dashboard/support", iconName: "support" },
      ],
    },
  ];

  return [
    {
      title: "Workspace",
      items: [
        { name: "Internal Dashboard", href: "/dashboard/internal", iconName: "home", exact: true },
        { name: "My Projects", href: "/dashboard/internal/projects", iconName: "projects", badgeKey: "projectIdeas" },
        { name: "Messages", href: "/dashboard/messages", iconName: "messages", badgeKey: "messages" },
      ],
    },
    { title: "Account", items: [{ name: "Settings", href: "/dashboard/internal/settings", iconName: "settings" }] },
  ];
}

export function isDashboardNavItemActive(pathname: string, item: Pick<DashboardNavItem, "href" | "exact">) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
}

import { getActiveInternalMemberByUserId } from "@/lib/internal-auth";
import { getUnreadMessageCount } from "@/lib/messaging-queries";
import { FOCUSDOJO_PRO_PRODUCT_KEY } from "@/lib/focusdojo/access-levels";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export type DashboardRole = "user" | "admin" | "tutor" | "parent" | "student" | "internal";

export type DashboardBadgeKey =
  | "subscriptionIssues"
  | "bookingPayments"
  | "messages"
  | "studentMissions"
  | "tutorRequests"
  | "missionReviews"
  | "projectIdeas"
  | "assessmentLeads"
  | "safeguards"
  | "manageTutors";

export type DashboardBadgeCounts = Record<DashboardBadgeKey, number>;

const ROLE_BADGE_KEYS: Record<DashboardRole, readonly DashboardBadgeKey[]> = {
  user: ["subscriptionIssues"],
  parent: ["bookingPayments", "messages"],
  student: ["bookingPayments", "messages", "studentMissions"],
  tutor: ["tutorRequests", "messages", "missionReviews"],
  admin: ["projectIdeas", "assessmentLeads", "messages", "safeguards", "manageTutors"],
  internal: ["projectIdeas", "messages"],
};

const ALL_BADGE_KEYS = new Set<DashboardBadgeKey>(Object.values(ROLE_BADGE_KEYS).flat());
const NEVER_VIEWED_AT = "1970-01-01T00:00:00.000Z";

export function isDashboardBadgeKey(value: unknown): value is DashboardBadgeKey {
  return typeof value === "string" && ALL_BADGE_KEYS.has(value as DashboardBadgeKey);
}

export function roleCanViewDashboardBadge(role: DashboardRole, badgeKey: DashboardBadgeKey) {
  return ROLE_BADGE_KEYS[role].includes(badgeKey);
}

export function createEmptyDashboardBadgeCounts(): DashboardBadgeCounts {
  return {
    subscriptionIssues: 0,
    bookingPayments: 0,
    messages: 0,
    studentMissions: 0,
    tutorRequests: 0,
    missionReviews: 0,
    projectIdeas: 0,
    assessmentLeads: 0,
    safeguards: 0,
    manageTutors: 0,
  };
}

type DashboardBadgeQueryError = {
  code?: string;
  message?: string;
};

export function isMissingDashboardBadgeViewsTableError(
  error?: DashboardBadgeQueryError | null,
) {
  return Boolean(
    error &&
      (error.code === "42P01" ||
        error.code === "PGRST205" ||
        (error.message?.includes("dashboard_badge_views") &&
          error.message.includes("schema cache"))),
  );
}

function logCountError(label: string, error?: DashboardBadgeQueryError | null) {
  if (error) console.error(`[dashboard-badges] ${label}:`, error.message || error);
}

export async function getDashboardBadgeCounts(
  role: DashboardRole,
  userId: string,
): Promise<DashboardBadgeCounts> {
  const counts = createEmptyDashboardBadgeCounts();
  const supabase = await createClient();

  const { data: badgeViews, error: badgeViewsError } = await supabase
    .from("dashboard_badge_views")
    .select("badge_key, viewed_at")
    .eq("user_id", userId);
  // Badge view state is optional infrastructure. If its migration has not yet
  // reached an environment, fail closed instead of treating every historical
  // item as unread or turning a dashboard render into a console error.
  if (isMissingDashboardBadgeViewsTableError(badgeViewsError)) return counts;
  logCountError("badge views", badgeViewsError);

  const viewedAt = new Map<DashboardBadgeKey, string>();
  for (const view of badgeViews || []) {
    if (isDashboardBadgeKey(view.badge_key)) viewedAt.set(view.badge_key, view.viewed_at);
  }
  const after = (badgeKey: DashboardBadgeKey) => viewedAt.get(badgeKey) || NEVER_VIEWED_AT;

  const messagePromise = role === "user"
    ? Promise.resolve(0)
    : getUnreadMessageCount({ after: after("messages") });

  if (role === "user") {
    const { count, error } = await supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("product_key", FOCUSDOJO_PRO_PRODUCT_KEY)
      .in("status", ["past_due", "unpaid"])
      .gt("updated_at", after("subscriptionIssues"));
    logCountError("subscription issues", error);
    counts.subscriptionIssues = count || 0;
    return counts;
  }

  if (role === "parent" || role === "student") {
    const bookingPaymentsPromise = supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("student_id", userId)
      .eq("status", "accepted")
      .or("payment_status.is.null,payment_status.eq.unpaid,payment_status.eq.failed")
      .gt("updated_at", after("bookingPayments"));

    const studentMissionsPromise = role === "student"
      ? supabase
        .from("student_missions")
        .select("id", { count: "exact", head: true })
        .eq("student_id", userId)
        .eq("status", "pending_assessment")
        .gt("created_at", after("studentMissions"))
      : Promise.resolve({ count: 0, error: null });

    const [messages, bookingPayments, studentMissions] = await Promise.all([
      messagePromise,
      bookingPaymentsPromise,
      studentMissionsPromise,
    ]);

    logCountError("booking payments", bookingPayments.error);
    logCountError("student missions", studentMissions.error);
    counts.messages = messages;
    counts.bookingPayments = bookingPayments.count || 0;
    counts.studentMissions = studentMissions.count || 0;
    return counts;
  }

  if (role === "tutor") {
    const [messages, tutorRequests, missionReviews] = await Promise.all([
      messagePromise,
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("tutor_id", userId)
        .eq("status", "requested")
        .gt("created_at", after("tutorRequests")),
      supabase
        .from("student_missions")
        .select("id", { count: "exact", head: true })
        .eq("tutor_id", userId)
        .eq("status", "pending_tutor_approval")
        .gt("updated_at", after("missionReviews")),
    ]);

    logCountError("tutor requests", tutorRequests.error);
    logCountError("mission reviews", missionReviews.error);
    counts.messages = messages;
    counts.tutorRequests = tutorRequests.count || 0;
    counts.missionReviews = missionReviews.count || 0;
    return counts;
  }

  if (role === "internal") {
    const [messages, projectIdeas] = await Promise.all([
      messagePromise,
      supabase
        .from("internal_projects")
        .select("id", { count: "exact", head: true })
        .eq("status", "idea")
        .is("archived_at", null)
        .gt("created_at", after("projectIdeas")),
    ]);

    logCountError("internal project ideas", projectIdeas.error);
    counts.messages = messages;
    counts.projectIdeas = projectIdeas.count || 0;
    return counts;
  }

  const admin = createAdminClient();
  const [
    messages,
    projectIdeas,
    assessmentLeads,
    flaggedMessages,
    pendingApplications,
    pendingReviews,
  ] = await Promise.all([
    messagePromise,
    admin
      .from("internal_projects")
      .select("id", { count: "exact", head: true })
      .eq("status", "idea")
      .is("archived_at", null)
      .gt("created_at", after("projectIdeas")),
    admin
      .from("assessment_leads")
      .select("id", { count: "exact", head: true })
      .in("status", ["new", "new_inquiry", "awaiting_review"])
      .gt("created_at", after("assessmentLeads")),
    admin
      .from("messages")
      .select("conversation_id")
      .eq("is_flagged", true)
      .gt("created_at", after("safeguards")),
    admin
      .from("applications")
      .select("user_id", { count: "exact", head: true })
      .eq("status", "pending")
      .gt("updated_at", after("manageTutors")),
    admin
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .gt("created_at", after("manageTutors")),
  ]);

  logCountError("admin project ideas", projectIdeas.error);
  logCountError("assessment leads", assessmentLeads.error);
  logCountError("safeguards", flaggedMessages.error);
  logCountError("pending tutor applications", pendingApplications.error);
  logCountError("pending reviews", pendingReviews.error);

  counts.messages = messages;
  counts.projectIdeas = projectIdeas.count || 0;
  counts.assessmentLeads = assessmentLeads.count || 0;
  counts.safeguards = new Set(
    (flaggedMessages.data || []).map((message) => message.conversation_id).filter(Boolean),
  ).size;
  counts.manageTutors = (pendingApplications.count || 0) + (pendingReviews.count || 0);
  return counts;
}

export async function getAuthenticatedDashboardBadgeIdentity() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, internalMember] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
    getActiveInternalMemberByUserId(supabase, user.id),
  ]);

  let role: DashboardRole = "user";
  if (internalMember) {
    role = "internal";
  } else if (
    profile?.role === "admin" ||
    profile?.role === "tutor" ||
    profile?.role === "parent" ||
    profile?.role === "student" ||
    profile?.role === "user"
  ) {
    role = profile.role;
  } else {
    const metadataRole = user.user_metadata?.role;
    if (metadataRole === "tutor" || metadataRole === "parent" || metadataRole === "student") {
      role = metadataRole;
    }
  }

  return { role, userId: user.id };
}

export async function getAuthenticatedDashboardBadgeContext() {
  const identity = await getAuthenticatedDashboardBadgeIdentity();
  if (!identity) return null;

  return {
    ...identity,
    counts: await getDashboardBadgeCounts(identity.role, identity.userId),
  };
}

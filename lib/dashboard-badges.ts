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

function logCountError(label: string, error?: { message?: string } | null) {
  if (error) console.error(`[dashboard-badges] ${label}:`, error.message || error);
}

export async function getDashboardBadgeCounts(
  role: DashboardRole,
  userId: string,
): Promise<DashboardBadgeCounts> {
  const counts = createEmptyDashboardBadgeCounts();
  const supabase = await createClient();

  const messagePromise = role === "user"
    ? Promise.resolve(0)
    : getUnreadMessageCount();

  if (role === "user") {
    const { count, error } = await supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("product_key", FOCUSDOJO_PRO_PRODUCT_KEY)
      .in("status", ["past_due", "unpaid"]);
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
      .or("payment_status.is.null,payment_status.eq.unpaid,payment_status.eq.failed");

    const studentMissionsPromise = role === "student"
      ? supabase
        .from("student_missions")
        .select("id", { count: "exact", head: true })
        .eq("student_id", userId)
        .eq("status", "pending_assessment")
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
        .eq("status", "requested"),
      supabase
        .from("student_missions")
        .select("id", { count: "exact", head: true })
        .eq("tutor_id", userId)
        .eq("status", "pending_tutor_approval"),
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
        .is("archived_at", null),
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
      .is("archived_at", null),
    admin
      .from("assessment_leads")
      .select("id", { count: "exact", head: true })
      .in("status", ["new", "new_inquiry", "awaiting_review"]),
    admin
      .from("messages")
      .select("conversation_id")
      .eq("is_flagged", true),
    admin
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    admin
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
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

export async function getAuthenticatedDashboardBadgeContext() {
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

  return {
    role,
    counts: await getDashboardBadgeCounts(role, user.id),
  };
}

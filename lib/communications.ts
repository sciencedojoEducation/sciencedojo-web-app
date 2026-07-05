import { createAdminClient } from "@/utils/supabase/admin";
import { buildScienceDojoEmailTemplate, getEmailProviderStatus, sendEmail } from "@/lib/email";

export type CommunicationAudience = "all" | "tutor" | "parent" | "student" | "user";
export type CommunicationCategory = "account" | "onboarding" | "service" | "product" | "tutor_growth" | "policy";
export type CommunicationTemplateKey =
  | "tutor_welcome"
  | "incomplete_tutor_application"
  | "dbs_clarification"
  | "application_submitted"
  | "tutor_profile_approved_listed"
  | "profile_improvement"
  | "parent_student_product_update"
  | "policy_update";

type EmailRecipient = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
};

type SendTrackedEmailInput = {
  userId: string;
  recipientEmail: string;
  recipientName?: string | null;
  category: CommunicationCategory;
  audience: CommunicationAudience;
  templateKey: CommunicationTemplateKey;
  title?: string;
  message?: string;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  missingSteps?: string[];
  dedupeHours?: number;
};

function sharedSuppressionCategories(category: CommunicationCategory): CommunicationCategory[] | null {
  if (category === "onboarding" || category === "tutor_growth") return ["onboarding", "tutor_growth"];
  if (category === "product") return ["product"];
  return null;
}

function preferenceColumnFor(category: CommunicationCategory) {
  if (category === "account") return "account_updates_enabled";
  if (category === "onboarding") return "onboarding_emails_enabled";
  if (category === "service") return "service_updates_enabled";
  if (category === "product") return "product_updates_enabled";
  if (category === "tutor_growth") return "tutor_growth_emails_enabled";
  return "service_updates_enabled";
}

function getProviderMessageId(result: Awaited<ReturnType<typeof sendEmail>>) {
  if (!result.success || result.mock) return null;
  const data = result.data as { data?: { id?: string } | null; id?: string } | null;
  return data?.data?.id || data?.id || null;
}

export async function ensureEmailPreferences(userId: string) {
  const adminClient = createAdminClient();
  await adminClient.from("email_preferences").upsert({ user_id: userId }, { onConflict: "user_id" });
}

export async function canSendEmailToUser(userId: string, category: CommunicationCategory) {
  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from("email_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const preferences = data || {};
  if (preferences.unsubscribed_all && category !== "account" && category !== "service" && category !== "policy") return false;
  if (category === "policy") return true;

  const column = preferenceColumnFor(category);
  return preferences[column] !== false;
}

export async function hasRecentEmailEvent(userId: string, templateKey: string, hours: number) {
  const adminClient = createAdminClient();
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const { data } = await adminClient
    .from("email_events")
    .select("id")
    .eq("user_id", userId)
    .eq("template_key", templateKey)
    .in("status", ["sent", "pending"])
    .gte("created_at", since)
    .limit(1);

  return Boolean(data?.length);
}

export async function hasRecentCategoryEmail(userId: string, category: CommunicationCategory, hours: number) {
  const adminClient = createAdminClient();
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const { data } = await adminClient
    .from("email_events")
    .select("id")
    .eq("user_id", userId)
    .eq("category", category)
    .in("status", ["sent", "pending"])
    .gte("created_at", since)
    .limit(1);

  return Boolean(data?.length);
}

async function hasRecentCategoryGroupEmail(userId: string, categories: CommunicationCategory[], hours: number) {
  const adminClient = createAdminClient();
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const { data } = await adminClient
    .from("email_events")
    .select("id")
    .eq("user_id", userId)
    .in("category", categories)
    .in("status", ["sent", "pending"])
    .gte("created_at", since)
    .limit(1);

  return Boolean(data?.length);
}

export async function sendTrackedEmail(input: SendTrackedEmailInput) {
  const adminClient = createAdminClient();
  await ensureEmailPreferences(input.userId);

  const dedupeHours = input.dedupeHours ?? 24;
  const allowed = await canSendEmailToUser(input.userId, input.category);
  const recentlySentTemplate = await hasRecentEmailEvent(input.userId, input.templateKey, dedupeHours);
  const sharedCategories = sharedSuppressionCategories(input.category);
  const recentlySentSharedCategory = sharedCategories
    ? await hasRecentCategoryGroupEmail(input.userId, sharedCategories, 72)
    : false;
  const template = buildScienceDojoEmailTemplate({
    templateKey: input.templateKey,
    name: input.recipientName,
    title: input.title,
    message: input.message,
    ctaLabel: input.ctaLabel,
    ctaUrl: input.ctaUrl,
    missingSteps: input.missingSteps,
  });

  if (!allowed || recentlySentTemplate || recentlySentSharedCategory) {
    await adminClient.from("email_events").insert({
      user_id: input.userId,
      recipient_email: input.recipientEmail,
      category: input.category,
      audience: input.audience,
      template_key: input.templateKey,
      subject: template.subject,
      status: "skipped",
      provider: getEmailProviderStatus().provider,
      error_message: !allowed ? "Email preference disabled" : "Duplicate suppression window active",
    });
    return { skipped: true };
  }

  const result = await sendEmail({
    to: input.recipientEmail,
    subject: template.subject,
    html: template.html,
  });

  await adminClient.from("email_events").insert({
    user_id: input.userId,
    recipient_email: input.recipientEmail,
    category: input.category,
    audience: input.audience,
    template_key: input.templateKey,
    subject: template.subject,
    status: result.success ? "sent" : "failed",
    provider: getEmailProviderStatus().mockMode ? "mock" : getEmailProviderStatus().provider,
    provider_message_id: getProviderMessageId(result),
    error_message: result.success ? null : String(result.error),
    sent_at: result.success ? new Date().toISOString() : null,
  });

  return result.success ? { sent: true } : { error: result.error };
}

export async function getRecipientsForAudience(audience: CommunicationAudience): Promise<EmailRecipient[]> {
  const adminClient = createAdminClient();
  let query = adminClient
    .from("profiles")
    .select("id, email, full_name, role")
    .not("email", "is", null);

  if (audience !== "all") {
    query = query.eq("role", audience);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Failed to fetch communication recipients:", error.message);
    return [];
  }

  return (data || []) as EmailRecipient[];
}

export function getTutorMissingSteps(applicationData: Record<string, unknown>) {
  const missing: string[] = [];
  if (!applicationData.full_name) missing.push("Add your full name");
  if (!applicationData.phone) missing.push("Add a phone number");
  if (!applicationData.subjects) missing.push("Add the subjects you want to teach");
  if (!Array.isArray(applicationData.education) || applicationData.education.length === 0) missing.push("Add education or qualifications");
  if (!applicationData.government_id_url) missing.push("Upload photo ID");
  if (applicationData.gdpr_accepted !== "true" || applicationData.terms_accepted !== "true") missing.push("Accept the tutor agreements");
  return missing;
}

function hasWeakListedTutorProfile(applicationData: Record<string, unknown>) {
  const bio = String(applicationData.bio || applicationData.experience_summary || "");
  const availability = String(applicationData.availability_summary || "");
  const demo = String(applicationData.demo_video_url || "");
  return bio.length < 120 || availability.length < 12 || !demo;
}

export async function runTutorOnboardingFollowUps() {
  const adminClient = createAdminClient();
  const { data: tutors, error } = await adminClient
    .from("profiles")
    .select("id, email, full_name, created_at, applications(status, data, created_at), tutors(is_publicly_listed, is_verified, background_check_status, verification_checklist)")
    .eq("role", "tutor")
    .not("email", "is", null);

  if (error) {
    console.error("Tutor follow-up fetch failed:", error.message);
    return { sent: 0, skipped: 0, error: error.message };
  }

  let sent = 0;
  let skipped = 0;

  for (const tutor of tutors || []) {
    const application = Array.isArray(tutor.applications) ? tutor.applications[0] : tutor.applications;
    const tutorRow = Array.isArray(tutor.tutors) ? tutor.tutors[0] : tutor.tutors;
    const applicationData = application?.data && typeof application.data === "object" ? application.data as Record<string, unknown> : {};
    const ageHours = (Date.now() - new Date(application?.created_at || tutor.created_at).getTime()) / (1000 * 60 * 60);
    const missingSteps = getTutorMissingSteps(applicationData);
    const base = {
      userId: tutor.id,
      recipientEmail: tutor.email!,
      recipientName: tutor.full_name,
      audience: "tutor" as const,
    };

    let response: Awaited<ReturnType<typeof sendTrackedEmail>> | null = null;
    if (!application) {
      response = await sendTrackedEmail({ ...base, category: "onboarding", templateKey: "tutor_welcome", dedupeHours: 168 });
    } else if (application.status === "draft" && missingSteps.length > 0 && ageHours >= 24) {
      const templateKey = ageHours >= 336 ? "incomplete_tutor_application" : "incomplete_tutor_application";
      response = await sendTrackedEmail({ ...base, category: "onboarding", templateKey, missingSteps, dedupeHours: 72 });
    } else if (application.status === "pending") {
      response = await sendTrackedEmail({ ...base, category: "onboarding", templateKey: "application_submitted", dedupeHours: 720 });
    } else if (tutorRow?.is_publicly_listed && !tutorRow?.is_verified && tutorRow.background_check_status !== "approved") {
      response = await sendTrackedEmail({ ...base, category: "tutor_growth", templateKey: "dbs_clarification", dedupeHours: 720 });
    } else if (tutorRow?.is_publicly_listed && hasWeakListedTutorProfile(applicationData)) {
      response = await sendTrackedEmail({ ...base, category: "tutor_growth", templateKey: "profile_improvement", dedupeHours: 168 });
    }

    if (response && "sent" in response) sent += 1;
    else skipped += 1;
  }

  return { sent, skipped };
}

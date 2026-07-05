"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import {
  CommunicationAudience,
  CommunicationCategory,
  getRecipientsForAudience,
  sendTrackedEmail,
} from "@/lib/communications";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" as const };

  const { data: profile } = await supabase.from("profiles").select("role, email, full_name").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Unauthorized" as const };

  return { user, profile, adminClient: createAdminClient() };
}

function normalizeAudience(value: FormDataEntryValue | null): CommunicationAudience {
  const raw = String(value || "all");
  return raw === "tutor" || raw === "parent" || raw === "student" || raw === "user" || raw === "all" ? raw : "all";
}

function normalizeCategory(value: FormDataEntryValue | null): CommunicationCategory {
  const raw = String(value || "product");
  return raw === "account" || raw === "onboarding" || raw === "service" || raw === "product" || raw === "tutor_growth" || raw === "policy"
    ? raw
    : "product";
}

function templateForCategory(category: CommunicationCategory) {
  if (category === "policy") return "policy_update" as const;
  if (category === "tutor_growth") return "profile_improvement" as const;
  return "parent_student_product_update" as const;
}

export async function createPlatformAnnouncement(formData: FormData) {
  const context = await requireAdmin();
  if ("error" in context) throw new Error(context.error);

  const audience = normalizeAudience(formData.get("audience"));
  const category = normalizeCategory(formData.get("category"));
  const title = String(formData.get("title") || "").trim();
  const message = String(formData.get("message") || "").trim();
  const ctaLabel = String(formData.get("cta_label") || "").trim() || null;
  const ctaUrl = String(formData.get("cta_url") || "").trim() || null;
  const sendEmail = formData.get("send_email") === "on";
  const showDashboard = formData.get("show_dashboard") === "on";
  const showPublicUpdatesPage = formData.get("show_public_updates_page") === "on";

  if (!title || !message) throw new Error("Title and message are required.");

  const { data: announcement, error } = await context.adminClient
    .from("platform_announcements")
    .insert({
      title,
      message,
      audience,
      category,
      send_email: sendEmail,
      show_dashboard: showDashboard,
      show_public_updates_page: showPublicUpdatesPage,
      cta_label: ctaLabel,
      cta_url: ctaUrl,
      created_by: context.user.id,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  if (sendEmail && announcement) {
    const recipients = await getRecipientsForAudience(audience);
    for (const recipient of recipients) {
      if (!recipient.email) continue;
      await sendTrackedEmail({
        userId: recipient.id,
        recipientEmail: recipient.email,
        recipientName: recipient.full_name,
        category,
        audience,
        templateKey: templateForCategory(category),
        title,
        message,
        ctaLabel,
        ctaUrl,
        dedupeHours: category === "policy" ? 1 : 72,
      });
    }
  }

  revalidatePath("/dashboard/admin/communications");
  revalidatePath("/dashboard/tutor");
  revalidatePath("/dashboard/parent");
  revalidatePath("/dashboard/student");
  revalidatePath("/updates");
}

export async function sendTestAnnouncementEmail(formData: FormData) {
  const context = await requireAdmin();
  if ("error" in context) throw new Error(context.error);

  const adminEmail = context.profile.email;
  if (!adminEmail) throw new Error("Your admin profile does not have an email address.");

  const category = normalizeCategory(formData.get("category"));
  await sendTrackedEmail({
    userId: context.user.id,
    recipientEmail: adminEmail,
    recipientName: context.profile.full_name,
    category,
    audience: "all",
    templateKey: templateForCategory(category),
    title: String(formData.get("title") || "ScienceDojo test update"),
    message: String(formData.get("message") || "This is a ScienceDojo communication preview."),
    ctaLabel: String(formData.get("cta_label") || "") || null,
    ctaUrl: String(formData.get("cta_url") || "") || null,
    dedupeHours: 0,
  });

  revalidatePath("/dashboard/admin/communications");
}

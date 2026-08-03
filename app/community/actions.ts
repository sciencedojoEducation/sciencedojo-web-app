"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

const blockedPatterns = [
  { pattern: /\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/i, label: "email address" },
  { pattern: /(?:\+?44\s?7\d{3}|07\d{3})[\s-]?\d{3}[\s-]?\d{3}/, label: "phone number" },
  { pattern: /\b(?:snapchat|whatsapp|telegram|discord|instagram)\s*[:@-]?\s*[a-z0-9_.-]+/i, label: "social contact details" },
  { pattern: /\b(?:leaked? paper|exam leak|live paper|candidate number|centre number)\b/i, label: "exam-security or candidate information" },
  { pattern: /\b(?:kill myself|suicide|self[- ]harm)\b/i, label: "urgent safeguarding language" },
];

function safeSlug(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80);
}

function validateText(value: FormDataEntryValue | null, min: number, max: number, field: string) {
  const text = String(value || "").trim();
  if (text.length < min || text.length > max) throw new Error(`${field} must be between ${min} and ${max} characters.`);
  const match = blockedPatterns.find(({ pattern }) => pattern.test(text));
  if (match) throw new Error(`Please remove ${match.label}. If someone may be in immediate danger, contact a trusted adult or emergency service now.`);
  return text;
}

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/community");
  return { supabase, user, admin: createAdminClient() };
}

export async function createCommunityProfile(formData: FormData) {
  const { supabase, user } = await requireUser();
  const pseudonym = validateText(formData.get("pseudonym"), 3, 30, "Pseudonym");
  if (!/^[a-zA-Z0-9][a-zA-Z0-9 _-]*$/.test(pseudonym)) throw new Error("Use only letters, numbers, spaces, hyphens, or underscores in your pseudonym.");
  const { error } = await supabase.from("community_profiles").insert({ user_id: user.id, pseudonym });
  if (error) throw new Error(error.code === "23505" ? "That pseudonym is already taken." : error.message);
  revalidatePath("/community", "layout");
}

export async function createTopic(formData: FormData) {
  const { supabase, user, admin } = await requireUser();
  const title = validateText(formData.get("title"), 10, 140, "Title");
  const body = validateText(formData.get("body"), 20, 8000, "Question");
  const categoryId = String(formData.get("category_id") || "");
  const { data: profile } = await admin.from("community_profiles").select("is_restricted").eq("user_id", user.id).maybeSingle();
  if (!profile) redirect("/community/new?setup=1");
  if (profile.is_restricted) throw new Error("This account cannot currently contribute.");
  const slug = `${safeSlug(title)}-${crypto.randomUUID().slice(0, 8)}`;
  const { error } = await supabase.from("community_topics").insert({ category_id: categoryId, author_id: user.id, slug, title, body, status: "pending" });
  if (error) throw new Error(error.message);
  revalidatePath("/community");
  redirect("/community/submitted");
}

export async function createReply(formData: FormData) {
  const { supabase, user, admin } = await requireUser();
  const body = validateText(formData.get("body"), 2, 5000, "Reply");
  const topicId = String(formData.get("topic_id") || "");
  const topicSlug = String(formData.get("topic_slug") || "");
  const { data: profile } = await admin.from("community_profiles").select("is_trusted, is_restricted").eq("user_id", user.id).maybeSingle();
  if (!profile) redirect(`/community/new?setup=1&next=${encodeURIComponent(`/community/topic/${topicSlug}`)}`);
  if (profile.is_restricted) throw new Error("This account cannot currently contribute.");
  const { error } = await supabase.from("community_replies").insert({ topic_id: topicId, author_id: user.id, body, status: profile.is_trusted ? "published" : "pending", published_at: profile.is_trusted ? new Date().toISOString() : null });
  if (error) throw new Error(error.message);
  revalidatePath(`/community/topic/${topicSlug}`);
  redirect(`/community/topic/${topicSlug}?reply=${profile.is_trusted ? "published" : "pending"}`);
}

export async function toggleBookmark(formData: FormData) {
  const { supabase, user } = await requireUser();
  const topicId = String(formData.get("topic_id") || "");
  const slug = String(formData.get("topic_slug") || "");
  const { data } = await supabase.from("community_bookmarks").select("topic_id").eq("user_id", user.id).eq("topic_id", topicId).maybeSingle();
  if (data) await supabase.from("community_bookmarks").delete().eq("user_id", user.id).eq("topic_id", topicId);
  else await supabase.from("community_bookmarks").insert({ user_id: user.id, topic_id: topicId });
  revalidatePath(`/community/topic/${slug}`);
}

export async function reportContent(formData: FormData) {
  const { supabase, user } = await requireUser();
  const reason = String(formData.get("reason") || "other");
  const allowed = ["safeguarding", "personal_information", "harassment", "cheating", "exam_leak", "misinformation", "spam", "other"];
  if (!allowed.includes(reason)) throw new Error("Invalid report reason.");
  const topicId = String(formData.get("topic_id") || "") || null;
  const replyId = String(formData.get("reply_id") || "") || null;
  const details = String(formData.get("details") || "").trim().slice(0, 1000) || null;
  const { error } = await supabase.from("community_reports").insert({ reporter_id: user.id, topic_id: topicId, reply_id: replyId, reason, details, priority: reason === "safeguarding" || reason === "personal_information" || reason === "exam_leak" ? "urgent" : "normal" });
  if (error) throw new Error(error.message);
  redirect(`/community/topic/${String(formData.get("topic_slug") || "")}?reported=1`);
}

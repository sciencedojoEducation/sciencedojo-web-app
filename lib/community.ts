import "server-only";
import { createAdminClient, createClient } from "@/utils/supabase/server";

export type CommunityStatus = "pending" | "published" | "rejected" | "hidden" | "locked";
export type CommunityCategory = { id: string; slug: string; name: string; description: string; stage: string; icon: string; display_order: number };
export type CommunityAuthor = { pseudonym: string; badge: string; is_verified: boolean } | null;
export type CommunityTopic = {
  id: string; slug: string; title: string; body: string; status: CommunityStatus; is_pinned: boolean; is_sensitive: boolean;
  seeded_author_name: string | null; view_count: number; reply_count: number; last_activity_at: string; published_at: string | null; created_at: string;
  category: CommunityCategory; author: CommunityAuthor;
};
export type CommunityReply = { id: string; body: string; is_accepted: boolean; seeded_author_name: string | null; created_at: string; author: CommunityAuthor };

export const COMMUNITY_RULES = [
  "Use a pseudonym and never share your full name, school, location, contact details, candidate number, or private messages.",
  "Do not request or share leaked papers, live exam content, cheating methods, or copyrighted paper scans.",
  "Be respectful. Harassment, pressure, discrimination, grade guarantees, and dangerous advice are not allowed.",
  "Report anything unsafe. Community guidance does not replace support from a parent, teacher, school, or safeguarding professional.",
] as const;

export function communityUrl(path = "") { return `/community${path ? `/${path.replace(/^\//, "")}` : ""}`; }

export async function getCommunityCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("community_categories").select("*").eq("is_active", true).order("display_order");
  if (error) { console.error("[community] categories:", error.message); return []; }
  return (data || []) as CommunityCategory[];
}

const topicSelect = `id, slug, title, body, status, is_pinned, is_sensitive, seeded_author_name, view_count, reply_count, last_activity_at, published_at, created_at,
  category:community_categories!community_topics_category_id_fkey!inner(id, slug, name, description, stage, icon, display_order),
  author:community_profiles!community_topics_author_profile_fkey(pseudonym, badge, is_verified)`;

export async function getCommunityTopics(options: { category?: string; q?: string; limit?: number } = {}) {
  const supabase = await createClient();
  let query = supabase.from("community_topics").select(topicSelect).in("status", ["published", "locked"]);
  if (options.category) query = query.eq("category.slug", options.category);
  if (options.q) query = query.or(`title.ilike.%${options.q.replace(/[%_,()]/g, "")}%,body.ilike.%${options.q.replace(/[%_,()]/g, "")}%`);
  query = query.order("is_pinned", { ascending: false }).order("last_activity_at", { ascending: false }).limit(options.limit || 30);
  const { data, error } = await query;
  if (error) { console.error("[community] topics:", error.message); return []; }
  return (data || []) as unknown as CommunityTopic[];
}

export async function getCommunityTopic(slug: string) {
  const supabase = await createClient();
  const [{ data, error }, { data: userData }] = await Promise.all([
    supabase.from("community_topics").select(topicSelect).eq("slug", slug).in("status", ["published", "locked"]).maybeSingle(),
    supabase.auth.getUser(),
  ]);
  if (error) { console.error("[community] topic:", error.message); return null; }
  if (!data) return null;
  const topic = data as unknown as CommunityTopic;
  const { data: replies } = await supabase.from("community_replies")
    .select("id, body, is_accepted, seeded_author_name, created_at, author:community_profiles!community_replies_author_profile_fkey(pseudonym, badge, is_verified)")
    .eq("topic_id", topic.id).eq("status", "published").order("is_accepted", { ascending: false }).order("created_at");
  let viewer = null;
  if (userData.user) {
    const admin = await createAdminClient();
    const { data: profile } = await admin.from("community_profiles").select("pseudonym, badge, is_verified, is_trusted, is_restricted").eq("user_id", userData.user.id).maybeSingle();
    viewer = profile;
  }
  return { topic, replies: (replies || []) as unknown as CommunityReply[], user: userData.user, viewer };
}

export async function getPublishedExamUpdates(limit = 10) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("community_exam_updates").select("*").eq("status", "published").order("source_published_at", { ascending: false }).limit(limit);
  if (error) return [];
  return data || [];
}

export function displayAuthor(author: CommunityAuthor, seeded: string | null) {
  return author?.pseudonym || seeded || "Community member";
}

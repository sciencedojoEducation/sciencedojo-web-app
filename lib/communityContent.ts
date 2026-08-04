import "server-only";
import OpenAI from "openai";
import { createAdminClient } from "@/utils/supabase/server";

// Editorial drafts are generated daily and queued as `pending` topics. A human
// moderator publishes them from /dashboard/admin/community, so this never posts
// unreviewed AI content to students. The seeded_author_name keeps authorship
// transparent, exactly like the hand-written seed topics.
const MODEL = "gemini-2.5-flash";
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/";
export const EDITORIAL_AUTHOR = "ScienceDojo Editorial Team";

// Official Exam Updates is reserved for sourced, human-verified board updates —
// an unsourced AI draft must never land there.
const EXCLUDED_CATEGORY_SLUGS = ["official-exam-updates"];

const SYSTEM_PROMPT = `You are the editorial voice of ScienceDojo, a UK GCSE and A-Level tutoring community used by students, many of whom are minors.

Write ONE short community discussion topic that starts a genuinely useful conversation for the given category.

Rules:
- UK exam context only (GCSE / A-Level). British spelling.
- Focus on study methods, exam technique, understanding concepts, revision routines, or wellbeing.
- NEVER invent facts that could be wrong: no specific exam dates, grade boundaries, statistics, specification codes, pass rates, or named sources. Frame everything as durable principles and open questions.
- No personal data, no contact details, no promises or guarantees about grades.
- Warm, calm, non-clickbait. End the body with one open question that invites replies.

Return ONLY valid JSON, no markdown, in this exact shape:
{"title": string of 10-140 characters, "body": string of 40-1200 characters}`;

type Draft = { title: string; body: string };

function safeSlug(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80);
}

function dayOfYear(date = new Date()) {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  return Math.floor((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - start) / 86_400_000);
}

function parseDraft(text: string): Draft {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Model did not return JSON.");
  const parsed = JSON.parse(match[0]) as Partial<Draft>;
  const title = String(parsed.title || "").trim();
  const body = String(parsed.body || "").trim();
  // Enforce the community_topics CHECK constraints so the insert cannot fail.
  if (title.length < 10 || title.length > 140) throw new Error("Generated title out of range.");
  if (body.length < 20 || body.length > 8000) throw new Error("Generated body out of range.");
  return { title, body };
}

async function generateDraft(category: { name: string; description: string; stage: string }): Promise<Draft> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");
  // Gemini via its OpenAI-compatible endpoint — no separate SDK needed.
  const client = new OpenAI({ apiKey, baseURL: GEMINI_BASE_URL });
  const response = await client.chat.completions.create({
    model: MODEL,
    // Gemini 2.5 spends "thinking" tokens before output, so the budget must
    // cover reasoning plus the JSON draft or the content comes back truncated.
    max_tokens: 2048,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Category: ${category.name} (${category.stage}). ${category.description}\nWrite today's discussion topic for this category.` },
    ],
  });
  return parseDraft(response.choices[0]?.message?.content || "");
}

// Generates one editorial draft and queues it as a pending topic for moderator
// approval. Returns a status the cron can log. Skips if an editorial draft is
// already waiting, so an unapproved backlog never piles up.
export async function generateAndQueueDailyPost() {
  const admin = await createAdminClient();

  const { data: pendingDrafts } = await admin
    .from("community_topics")
    .select("id")
    .eq("status", "pending")
    .not("seeded_author_name", "is", null)
    .limit(1);
  if (pendingDrafts && pendingDrafts.length > 0) {
    return { status: "skipped", reason: "An editorial draft is already awaiting review." };
  }

  const { data: categories, error: catError } = await admin
    .from("community_categories")
    .select("id, slug, name, description, stage")
    .eq("is_active", true)
    .not("slug", "in", `(${EXCLUDED_CATEGORY_SLUGS.join(",")})`)
    .order("display_order");
  if (catError) throw new Error(catError.message);
  if (!categories || categories.length === 0) return { status: "skipped", reason: "No eligible categories." };

  // Rotate deterministically so subjects vary across the week.
  const category = categories[dayOfYear() % categories.length];
  const draft = await generateDraft(category);
  const slug = `${safeSlug(draft.title)}-${crypto.randomUUID().slice(0, 8)}`;

  const { error } = await admin.from("community_topics").insert({
    category_id: category.id,
    slug,
    title: draft.title,
    body: draft.body,
    status: "pending",
    seeded_author_name: EDITORIAL_AUTHOR,
  });
  if (error) throw new Error(error.message);

  return { status: "queued", slug, category: category.slug, title: draft.title };
}

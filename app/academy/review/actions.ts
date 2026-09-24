"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { AcademyCourse } from "@/lib/tutor-academy";

export async function postAcademyReviewComment(input: {
  invitationId: string;
  lessonId: string;
  blockId?: string | null;
  parentId?: string | null;
  body: string;
}) {
  const body = input.body.trim();
  if (!body || body.length > 2000)
    return { ok: false, message: "Comment must be 1–2000 characters." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sign in to comment." };
  const { data: invitation } = await supabase
    .from("academy_review_invitations")
    .select("course_id, snapshot_id")
    .eq("id", input.invitationId)
    .maybeSingle();
  if (!invitation) return { ok: false, message: "This invitation is no longer available." };
  const { data: snapshot } = await supabase
    .from("academy_course_snapshots")
    .select("content")
    .eq("id", invitation.snapshot_id)
    .eq("course_id", invitation.course_id)
    .maybeSingle();
  const course = snapshot?.content as AcademyCourse | undefined;
  const lesson = course?.lessons.find((item) => item.id === input.lessonId);
  if (!lesson) return { ok: false, message: "Choose a lesson in this review." };
  if (input.blockId && !lesson.blocks.some((block) => block.id === input.blockId))
    return { ok: false, message: "That block is not in the selected lesson." };
  if (input.parentId) {
    const { data: parent } = await supabase
      .from("academy_review_comments")
      .select("id")
      .eq("id", input.parentId)
      .eq("invitation_id", input.invitationId)
      .maybeSingle();
    if (!parent) return { ok: false, message: "The reply target is unavailable." };
  }
  const { error } = await supabase.from("academy_review_comments").insert({
    invitation_id: input.invitationId,
    course_id: invitation.course_id,
    snapshot_id: invitation.snapshot_id,
    lesson_id: lesson.id,
    block_id: input.blockId || null,
    parent_id: input.parentId || null,
    body,
    author_id: user.id,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/academy/review/${input.invitationId}`);
  return { ok: true, message: "Comment added." };
}

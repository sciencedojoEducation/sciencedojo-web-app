import "server-only";
import { createClient } from "@/utils/supabase/server";
import { migrateAcademyCourse } from "@/lib/academy-schema";
import type { AcademyCourse } from "@/lib/tutor-academy";

export type AcademyReviewInvitation = {
  id: string;
  course_id: string;
  snapshot_id: string;
  email: string;
  expires_at: string;
  revoked_at: string | null;
  created_at: string;
};

export type AcademyReviewComment = {
  id: string;
  invitation_id: string;
  course_id: string;
  snapshot_id: string;
  lesson_id: string | null;
  block_id: string | null;
  parent_id: string | null;
  body: string;
  author_id: string;
  resolved_at: string | null;
  created_at: string;
};

export async function getAdminAcademyReviews(courseId: string) {
  const supabase = await createClient();
  const [{ data: invitations }, { data: comments }] = await Promise.all([
    supabase
      .from("academy_review_invitations")
      .select("id, course_id, snapshot_id, email, expires_at, revoked_at, created_at")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false }),
    supabase
      .from("academy_review_comments")
      .select("id, invitation_id, course_id, snapshot_id, lesson_id, block_id, parent_id, body, author_id, resolved_at, created_at")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false }),
  ]);
  return {
    invitations: (invitations || []) as AcademyReviewInvitation[],
    comments: (comments || []) as AcademyReviewComment[],
  };
}

export async function getAcademyReviewForInvite(invitationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { signedOut: true as const };
  const { data: invitation, error } = await supabase
    .from("academy_review_invitations")
    .select("id, course_id, snapshot_id, email, expires_at, revoked_at, created_at")
    .eq("id", invitationId)
    .maybeSingle();
  if (error || !invitation) return null;
  const [{ data: snapshot }, { data: comments }] = await Promise.all([
    supabase
      .from("academy_course_snapshots")
      .select("content")
      .eq("id", invitation.snapshot_id)
      .eq("course_id", invitation.course_id)
      .maybeSingle(),
    supabase
      .from("academy_review_comments")
      .select("id, invitation_id, course_id, snapshot_id, lesson_id, block_id, parent_id, body, author_id, resolved_at, created_at")
      .eq("invitation_id", invitationId)
      .order("created_at"),
  ]);
  if (!snapshot?.content) return null;
  return {
    signedOut: false as const,
    invitation: invitation as AcademyReviewInvitation,
    course: migrateAcademyCourse(snapshot.content as AcademyCourse),
    comments: (comments || []) as AcademyReviewComment[],
  };
}

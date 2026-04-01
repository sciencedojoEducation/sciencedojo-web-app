import { createClient } from "@/utils/supabase/server";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isValidUUID(id: string) {
  return id && uuidRegex.test(id);
}

export interface ClassRoom {
  id: string;
  student_id: string;
  tutor_id: string;
  subject: string;
  display_name: string;
  cover_color: string;
  is_archived: boolean;
  created_at: string;
  // Resolved member info
  student_name?: string;
  student_avatar?: string;
  tutor_name?: string;
  tutor_avatar?: string;
  // Computed
  post_count?: number;
  last_activity?: string;
}

export interface ClassPost {
  id: string;
  class_id: string;
  author_id: string;
  content: string;
  post_type: 'post' | 'assignment' | 'lesson_report' | 'link';
  link_url?: string;
  due_date?: string;
  booking_id?: string;
  file_url?: string;
  file_name?: string;
  is_pinned: boolean;
  created_at: string;
  // Resolved
  author_name?: string;
  author_avatar?: string;
  author_role?: string;
  comment_count?: number;
}

export interface ClassComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  file_url?: string;
  file_name?: string;
  is_submission: boolean;
  created_at: string;
  // Resolved
  author_name?: string;
  author_avatar?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Find or Create a Class (upsert by unique triple)
// ─────────────────────────────────────────────────────────────────────────────

export async function findOrCreateClass(
  studentId: string,
  tutorId: string,
  subject: string
): Promise<string> {
  const supabase = await createClient();

  if (!isValidUUID(studentId) || !isValidUUID(tutorId)) {
    console.error("Invalid UUIDs provided to findOrCreateClass", { studentId, tutorId });
    throw new Error("Invalid member IDs");
  }

  // Try to find existing class
  const { data: existing } = await supabase
    .from("classes")
    .select("id")
    .eq("student_id", studentId)
    .eq("tutor_id", tutorId)
    .eq("subject", subject)
    .maybeSingle();

  if (existing) return existing.id;

  // Create new class
  const { data: newClass, error } = await supabase
    .from("classes")
    .insert({
      student_id: studentId,
      tutor_id: tutorId,
      subject: subject,
      display_name: subject, // Default display name = subject
    })
    .select("id")
    .single();

  if (error) {
    // Race condition: another request created it first, try find again
    if (error.code === "23505") {
      const { data: retry } = await supabase
        .from("classes")
        .select("id")
        .eq("student_id", studentId)
        .eq("tutor_id", tutorId)
        .eq("subject", subject)
        .single();
      return retry!.id;
    }
    console.error("Error creating class:", error.message);
    throw new Error("Failed to create class");
  }

  return newClass.id;
}

// ─────────────────────────────────────────────────────────────────────────────
// Get all classes for a user (student or tutor)
// ─────────────────────────────────────────────────────────────────────────────

export async function getClassesForUser(userId: string, includeArchived: boolean = false): Promise<ClassRoom[]> {
  const supabase = await createClient();

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!userId || !uuidRegex.test(userId)) return [];

  let query = supabase
    .from("classes")
    .select("*")
    .or(`student_id.eq.${userId},tutor_id.eq.${userId}`);
  
  if (!includeArchived) {
    query = query.eq("is_archived", false);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching classes:", error.message);
    return [];
  }

  if (!data || data.length === 0) return [];

  // Resolve member profiles
  const allMemberIds = [...new Set(data.flatMap(c => [c.student_id, c.tutor_id]))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", allMemberIds);

  const profileMap: Record<string, { full_name: string; avatar_url: string }> = {};
  for (const p of (profiles || []) as any[]) {
    profileMap[p.id] = { full_name: p.full_name || "User", avatar_url: p.avatar_url || "" };
  }

  // Get post counts and last activity per class
  const classIds = data.map(c => c.id);
  const { data: postStats } = await supabase
    .from("class_posts")
    .select("class_id, created_at")
    .in("class_id", classIds)
    .order("created_at", { ascending: false });

  const statsMap: Record<string, { count: number; last: string }> = {};
  for (const p of (postStats || []) as any[]) {
    if (!statsMap[p.class_id]) {
      statsMap[p.class_id] = { count: 0, last: p.created_at };
    }
    statsMap[p.class_id].count++;
  }

  return data.map((c: any) => ({
    ...c,
    student_name: profileMap[c.student_id]?.full_name || "Student",
    student_avatar: profileMap[c.student_id]?.avatar_url,
    tutor_name: profileMap[c.tutor_id]?.full_name || "Tutor",
    tutor_avatar: profileMap[c.tutor_id]?.avatar_url,
    post_count: statsMap[c.id]?.count || 0,
    last_activity: statsMap[c.id]?.last || c.created_at,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Get single class by ID
// ─────────────────────────────────────────────────────────────────────────────

export async function getClassById(classId: string): Promise<ClassRoom | null> {
  const supabase = await createClient();

  // Validate UUID format to prevent DB crashes from "undefined" strings in URL
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!classId || !uuidRegex.test(classId)) {
     console.warn(`Attempted to fetch class with invalid ID format: ${classId}`);
     return null;
  }

  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .eq("id", classId)
    .single();

  if (error || !data) {
    console.error("Error fetching class:", error?.message);
    return null;
  }

  // Resolve both member profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", [data.student_id, data.tutor_id]);

  const profileMap: Record<string, any> = {};
  for (const p of (profiles || []) as any[]) {
    profileMap[p.id] = p;
  }

  return {
    ...data,
    student_name: profileMap[data.student_id]?.full_name || "Student",
    student_avatar: profileMap[data.student_id]?.avatar_url,
    tutor_name: profileMap[data.tutor_id]?.full_name || "Tutor",
    tutor_avatar: profileMap[data.tutor_id]?.avatar_url,
  } as ClassRoom;
}

// ─────────────────────────────────────────────────────────────────────────────
// Get posts for a class
// ─────────────────────────────────────────────────────────────────────────────

export async function getClassPosts(classId: string): Promise<ClassPost[]> {
  const supabase = await createClient();

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!classId || !uuidRegex.test(classId)) return [];

  const { data, error } = await supabase
    .from("class_posts")
    .select("*")
    .eq("class_id", classId)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching class posts:", error.message);
    return [];
  }

  if (!data || data.length === 0) return [];

  // Resolve author profiles
  const authorIds = [...new Set(data.map(p => p.author_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role")
    .in("id", authorIds);

  const profileMap: Record<string, any> = {};
  for (const p of (profiles || []) as any[]) {
    profileMap[p.id] = p;
  }

  // Get comment counts per post
  const postIds = data.map(p => p.id);
  const { data: commentCounts } = await supabase
    .from("class_comments")
    .select("post_id")
    .in("post_id", postIds);

  const countMap: Record<string, number> = {};
  for (const c of (commentCounts || []) as any[]) {
    countMap[c.post_id] = (countMap[c.post_id] || 0) + 1;
  }

  return data.map((post: any) => ({
    ...post,
    author_name: profileMap[post.author_id]?.full_name || "User",
    author_avatar: profileMap[post.author_id]?.avatar_url || "",
    author_role: profileMap[post.author_id]?.role || "student",
    comment_count: countMap[post.id] || 0,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Get comments for a post
// ─────────────────────────────────────────────────────────────────────────────

export async function getClassComments(postId: string): Promise<ClassComment[]> {
  const supabase = await createClient();

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!postId || !uuidRegex.test(postId)) return [];

  const { data, error } = await supabase
    .from("class_comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching comments:", error.message);
    return [];
  }

  if (!data || data.length === 0) return [];

  // Resolve author profiles
  const authorIds = [...new Set(data.map(c => c.author_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", authorIds);

  const profileMap: Record<string, any> = {};
  for (const p of (profiles || []) as any[]) {
    profileMap[p.id] = p;
  }

  return data.map((comment: any) => ({
    ...comment,
    author_name: profileMap[comment.author_id]?.full_name || "User",
    author_avatar: profileMap[comment.author_id]?.avatar_url || "",
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Get homework assignments for a student (powers HomeworkFeed widget)
// ─────────────────────────────────────────────────────────────────────────────

export async function getHomeworkForStudent(studentId: string): Promise<(ClassPost & { class_display_name: string; tutor_name: string; tutor_avatar: string })[]> {
  const supabase = await createClient();

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!studentId || !uuidRegex.test(studentId)) return [];

  // Get all classes where the user is the student
  const { data: classes } = await supabase
    .from("classes")
    .select("id, display_name, tutor_id")
    .eq("student_id", studentId)
    .eq("is_archived", false);

  if (!classes || classes.length === 0) return [];

  const classIds = classes.map(c => c.id);
  const classMap: Record<string, any> = {};
  for (const c of classes) {
    classMap[c.id] = c;
  }

  // Get assignment posts from those classes
  const { data: posts } = await supabase
    .from("class_posts")
    .select("*")
    .in("class_id", classIds)
    .eq("post_type", "assignment")
    .order("created_at", { ascending: false })
    .limit(10);

  if (!posts || posts.length === 0) return [];

  // Resolve tutor profiles
  const tutorIds = [...new Set(classes.map(c => c.tutor_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", tutorIds);

  const profileMap: Record<string, any> = {};
  for (const p of (profiles || []) as any[]) {
    profileMap[p.id] = p;
  }

  return posts.map((post: any) => {
    const cls = classMap[post.class_id];
    return {
      ...post,
      class_display_name: cls?.display_name || post.class_id,
      tutor_name: profileMap[cls?.tutor_id]?.full_name || "Tutor",
      tutor_avatar: profileMap[cls?.tutor_id]?.avatar_url || "",
      author_name: profileMap[cls?.tutor_id]?.full_name || "Tutor",
      author_avatar: profileMap[cls?.tutor_id]?.avatar_url || "",
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Get all bookings linked to a class (including historical backfill)
// ─────────────────────────────────────────────────────────────────────────────

export async function getClassBookings(classId: string, studentId: string, tutorId: string, subject: string) {
  const supabase = await createClient();

  // 1. Fetch the bookings (match by class_id OR the student-tutor-subject triplet for backfill)
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .or(`class_id.eq.${classId},and(student_id.eq.${studentId},tutor_id.eq.${tutorId},subject.eq.${subject})`)
    .order("requested_date", { ascending: false });

  if (error) {
    console.error("Error fetching class bookings:", error.message);
    return [];
  }

  if (!data || data.length === 0) return [];

  // 2. Resolve instructor profiles separately to avoid join errors
  const allTutorIds = [...new Set(data.map(b => b.tutor_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", allTutorIds);

  const profileMap: Record<string, any> = {};
  for (const p of (profiles || []) as any[]) {
    profileMap[p.id] = p;
  }

  // 3. Fetch lesson notes
  const bookingIds = data.map(b => b.id);
  const { data: notes } = await supabase
    .from("lesson_notes")
    .select("*")
    .in("booking_id", bookingIds);

  const notesMap: Record<string, any> = {};
  for (const n of (notes || []) as any[]) {
    notesMap[n.booking_id] = { summary: n.summary, homework: n.homework };
  }

  // 4. Combine everything
  return data.map((b: any) => ({
    ...b,
    tutor_name: profileMap[b.tutor_id]?.full_name || b.tutor_name,
    tutor_avatar: profileMap[b.tutor_id]?.avatar_url || b.tutor_avatar,
    lesson_notes: notesMap[b.id] || null,
  }));
}
// ─────────────────────────────────────────────────────────────────────────────
// Archive / Unarchive Class
// ─────────────────────────────────────────────────────────────────────────────

export async function archiveClass(classId: string) {
  const supabase = await createClient();
  if (!isValidUUID(classId)) return { error: "Invalid ID" };

  const { error } = await supabase
    .from("classes")
    .update({ is_archived: true })
    .eq("id", classId);

  return { error };
}

export async function unarchiveClass(classId: string) {
  const supabase = await createClient();
  if (!isValidUUID(classId)) return { error: "Invalid ID" };

  const { error } = await supabase
    .from("classes")
    .update({ is_archived: false })
    .eq("id", classId);

  return { error };
}

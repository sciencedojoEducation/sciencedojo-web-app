"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ─────────────────────────────────────────────────────────────────────────────
// Create a Post (text, link, assignment)
// ─────────────────────────────────────────────────────────────────────────────

export async function createClassPost(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const classId = formData.get("classId") as string;
  const content = formData.get("content") as string;
  const postType = (formData.get("postType") as string) || "post";
  const linkUrl = formData.get("linkUrl") as string;
  const dueDateStr = formData.get("dueDate") as string;
  const file = formData.get("file") as File | null;

  if (!classId || !content) {
    throw new Error("Class ID and content are required");
  }

  // Verify membership
  const { data: cls } = await supabase
    .from("classes")
    .select("id")
    .eq("id", classId)
    .or(`student_id.eq.${user.id},tutor_id.eq.${user.id}`)
    .single();

  if (!cls) throw new Error("Not a member of this class");

  // Handle file upload
  let fileUrl: string | null = null;
  let fileName: string | null = null;

  if (file && file.size > 0) {
    const ext = file.name.split(".").pop();
    const path = `${classId}/${user.id}-${Date.now()}.${ext}`;
    
    const { error: uploadError } = await supabase.storage
      .from("class-files")
      .upload(path, file);

    if (uploadError) {
      console.error("File upload error:", uploadError.message);
      throw new Error("Failed to upload file");
    }

    const { data: publicUrl } = supabase.storage
      .from("class-files")
      .getPublicUrl(path);

    fileUrl = publicUrl.publicUrl;
    fileName = file.name;
  }

  const { data: insertedPost, error } = await supabase
    .from("class_posts")
    .insert({
      class_id: classId,
      author_id: user.id,
      content,
      post_type: postType,
      link_url: linkUrl || null,
      due_date: dueDateStr || null,
      file_url: fileUrl,
      file_name: fileName,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Create post error:", error.message);
    throw new Error("Failed to create post");
  }

  revalidatePath(`/dashboard/classes/${classId}`);
  revalidatePath("/dashboard/classes");
  revalidatePath("/dashboard/student");

  if (!insertedPost?.id) return null;

  return await fetchPostById(insertedPost.id);
}

// ─────────────────────────────────────────────────────────────────────────────
// Create a Comment (or homework submission)
// ─────────────────────────────────────────────────────────────────────────────

export async function createClassComment(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const postId = formData.get("postId") as string;
  const content = formData.get("content") as string;
  const isSubmission = formData.get("isSubmission") === "true";
  const classId = formData.get("classId") as string;
  const file = formData.get("file") as File | null;

  if (!postId || !content) {
    throw new Error("Post ID and content are required");
  }

  // Handle file upload for submissions
  let fileUrl: string | null = null;
  let fileName: string | null = null;

  if (file && file.size > 0) {
    const ext = file.name.split(".").pop();
    const path = `submissions/${postId}/${user.id}-${Date.now()}.${ext}`;
    
    const { error: uploadError } = await supabase.storage
      .from("class-files")
      .upload(path, file);

    if (uploadError) {
      console.error("File upload error:", uploadError.message);
      throw new Error("Failed to upload file");
    }

    const { data: publicUrl } = supabase.storage
      .from("class-files")
      .getPublicUrl(path);

    fileUrl = publicUrl.publicUrl;
    fileName = file.name;
  }

  const { error } = await supabase
    .from("class_comments")
    .insert({
      post_id: postId,
      author_id: user.id,
      content,
      file_url: fileUrl,
      file_name: fileName,
      is_submission: isSubmission,
    });

  if (error) {
    console.error("Create comment error:", error.message);
    throw new Error("Failed to create comment");
  }

  revalidatePath(`/dashboard/classes/${classId}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Toggle Pin on a Post (tutor only)
// ─────────────────────────────────────────────────────────────────────────────

export async function togglePinPost(postId: string, classId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get current pin state
  const { data: post } = await supabase
    .from("class_posts")
    .select("is_pinned")
    .eq("id", postId)
    .single();

  if (!post) throw new Error("Post not found");

  const { error } = await supabase
    .from("class_posts")
    .update({ is_pinned: !post.is_pinned })
    .eq("id", postId);

  if (error) {
    console.error("Toggle pin error:", error.message);
    throw new Error("Failed to toggle pin");
  }

  revalidatePath(`/dashboard/classes/${classId}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Update Class Name (tutor only)
// ─────────────────────────────────────────────────────────────────────────────

export async function updateClassSettings(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const classId = formData.get("classId") as string;
  const displayName = formData.get("displayName") as string;
  const coverColor = formData.get("coverColor") as string;

  if (!classId) throw new Error("Class ID is required");

  const updates: any = {};
  if (displayName) updates.display_name = displayName;
  if (coverColor) updates.cover_color = coverColor;

  if (Object.keys(updates).length === 0) return;

  const { error } = await supabase
    .from("classes")
    .update(updates)
    .eq("id", classId)
    .eq("tutor_id", user.id); // Security: only the tutor can manage settings

  if (error) {
    console.error("Update class settings error:", error.message);
    throw new Error("Failed to update class settings");
  }

  revalidatePath(`/dashboard/classes/${classId}`);
  revalidatePath("/dashboard/classes");
}

// ─────────────────────────────────────────────────────────────────────────────
// Archive Class (tutor only)
// ─────────────────────────────────────────────────────────────────────────────

export async function archiveClass(classId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("classes")
    .update({ is_archived: true })
    .eq("id", classId)
    .eq("tutor_id", user.id);

  if (error) {
    console.error("Archive class error:", error.message);
    throw new Error("Failed to archive class");
  }

  revalidatePath(`/dashboard/classes/${classId}`);
  revalidatePath("/dashboard/classes");
  return { success: true };
}

export async function unarchiveClass(classId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("classes")
    .update({ is_archived: false })
    .eq("id", classId)
    .eq("tutor_id", user.id);

  if (error) {
    console.error("Unarchive class error:", error.message);
    throw new Error("Failed to unarchive class");
  }

  revalidatePath(`/dashboard/classes/${classId}`);
  revalidatePath("/dashboard/classes");
  return { success: true };
}


// ─────────────────────────────────────────────────────────────────────────────
// Fetch comments for a post (called from client)
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchCommentsForPost(postId: string) {
  const { getClassComments } = await import("@/lib/class-queries");
  return await getClassComments(postId);
}

export async function fetchPostById(postId: string) {
  const { getClassPosts } = await import("@/lib/class-queries");
  const supabase = await createClient();
  
  // Since we already have a specialized getClassPosts that resolves profiles, 
  // we can just call it and filter for the specific ID to keep logic centralized.
  // First, get the class_id for this post
  const { data: postRef } = await supabase
    .from("class_posts")
    .select("class_id")
    .eq("id", postId)
    .single();
    
  if (!postRef) return null;
  
  const allPosts = await getClassPosts(postRef.class_id);
  return allPosts.find(p => p.id === postId) || null;
}

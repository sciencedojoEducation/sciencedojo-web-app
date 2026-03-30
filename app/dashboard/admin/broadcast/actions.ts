"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createAnnouncement(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const target_role = formData.get("target_role") as string;
  const is_pinned = formData.get("is_pinned") === "on";

  const { error } = await supabase
    .from("announcements")
    .insert({
      sender_id: user.id,
      title,
      content,
      target_role,
      is_pinned
    });

  if (error) {
    console.error("Error creating announcement:", error.message);
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/admin/broadcast");
  revalidatePath("/dashboard/tutor");
  revalidatePath("/dashboard/parent");
}

export async function toggleAnnouncementActive(id: string, currentStatus: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("announcements")
    .update({ is_active: !currentStatus })
    .eq("id", id);

  if (error) {
    console.error("Error toggling announcement:", error.message);
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/admin/broadcast");
  revalidatePath("/dashboard/tutor");
  revalidatePath("/dashboard/parent");
}

export async function deleteAnnouncement(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("announcements")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting announcement:", error.message);
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/admin/broadcast");
  revalidatePath("/dashboard/tutor");
  revalidatePath("/dashboard/parent");
}

import { createClient } from "@/utils/supabase/server";
import { getClassById, getClassPosts, getClassBookings } from "@/lib/class-queries";
import ClassDetailUI from "@/app/dashboard/classes/[id]/ClassDetailUI";
import { redirect } from "next/navigation";

export default async function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const classRoom = await getClassById(id);
  if (!classRoom) redirect("/dashboard/classes");

  // Verify access privileges
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isMember = classRoom.student_id === user.id || classRoom.tutor_id === user.id;
  const isAdmin = profile?.role === "admin";
  if (!isMember && !isAdmin) redirect("/dashboard/classes");

  const posts = await getClassPosts(id);
  const bookings = await getClassBookings(id, classRoom.student_id, classRoom.tutor_id, classRoom.subject);
  const isTutor = classRoom.tutor_id === user.id;

  return (
    <ClassDetailUI
      classRoom={classRoom}
      posts={posts}
      bookings={bookings}
      isTutor={isTutor}
      currentUserId={user.id}
    />
  );
}

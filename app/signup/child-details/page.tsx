import { redirect } from "next/navigation";
import AuthCard from "@/components/AuthCard";
import { createClient } from "@/utils/supabase/server";
import ChildDetailsForm from "./ChildDetailsForm";

export default async function ChildDetailsPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role, student_name")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role || user.user_metadata?.role || "parent";

  if (role !== "parent" && role !== "student") {
    redirect(`/dashboard/${role}`);
  }

  if (role === "parent" && profile?.student_name && user.user_metadata?.onboarding_completed !== false) {
    redirect("/dashboard/parent");
  }

  if (role === "student" && user.user_metadata?.onboarding_completed !== false) {
    redirect("/dashboard/student");
  }

  const fullName = profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || "";
  const email = profile?.email || user.email || "";
  const next = params.next && params.next.startsWith("/") && !params.next.startsWith("//") ? params.next : "";

  return (
    <AuthCard
      title={role === "student" ? "Complete Your Student Profile" : "Add Your Child’s Details"}
      subtitle={role === "student" ? "Just one more step so we can personalize your learning." : "Just one more step so we can personalize your child’s learning."}
      footer={null}
    >
      <ChildDetailsForm role={role} fullName={fullName} email={email} next={next} />
    </AuthCard>
  );
}

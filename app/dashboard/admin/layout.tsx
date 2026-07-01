import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

function normalizeDashboardRole(role?: unknown) {
  return role === "user" || role === "admin" || role === "tutor" || role === "parent" || role === "student" || role === "internal" ? role : null;
}

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const profileRole = normalizeDashboardRole(profile?.role);
  const metadataRole = normalizeDashboardRole(user.user_metadata?.role);

  if (profileRole !== "admin" && metadataRole !== "admin") {
    redirect(`/dashboard/${profileRole || metadataRole || "user"}`);
  }

  return <>{children}</>;
}

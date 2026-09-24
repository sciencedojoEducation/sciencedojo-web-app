import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function AdminAcademyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") notFound();
  return <div className="academy-authoring-ui min-h-full">{children}</div>;
}

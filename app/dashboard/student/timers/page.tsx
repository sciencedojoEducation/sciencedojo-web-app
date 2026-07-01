import FocusZone from "@/components/focus/FocusZone";
import { ThemeProvider } from "@/lib/themeProvider";
import { createClient } from "@/utils/supabase/server";

export const metadata = {
  title: "Focus Zone | ScienceDojo",
  description: "A calm academic study environment for focused practice and exam timing.",
};

function getFirstName(name?: string | null) {
  return name?.trim().split(/\s+/)[0]?.slice(0, 32) ?? "";
}

export default async function TimersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  const initialDisplayName = getFirstName(
    profile?.full_name || user?.user_metadata?.full_name,
  );

  return (
    <ThemeProvider>
      <div className="min-h-full bg-[var(--fd-bg-primary)] p-3 sm:p-4 md:p-6">
        <FocusZone accessLevel="member" initialDisplayName={initialDisplayName} />
      </div>
    </ThemeProvider>
  );
}

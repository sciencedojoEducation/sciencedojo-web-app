import FocusZone from "@/components/focus/FocusZone";
import { getFocusDojoAccessLevel } from "@/lib/focusdojo/access";
import { ThemeProvider } from "@/lib/themeProvider";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

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
  const accessLevel = await getFocusDojoAccessLevel(user?.id);

  return (
    <ThemeProvider>
      <div className="min-h-full bg-[var(--fd-bg-primary)] p-3 sm:p-4 md:p-6">
        <header className="mx-auto mb-4 flex max-w-7xl flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div><p className="text-xs font-semibold text-[#4f53a5]">Focus tool</p><h1 className="text-base font-semibold text-slate-900">Focus Timers</h1></div>
          <Link href="/dashboard/student" className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-[#1E5AA8] hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f53a5]">Back to dashboard</Link>
        </header>
        <FocusZone accessLevel={accessLevel} initialDisplayName={initialDisplayName} />
      </div>
    </ThemeProvider>
  );
}

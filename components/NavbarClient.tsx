"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { signOut } from "@/app/login/actions";
import BookAssessmentLink from "@/components/analytics/BookAssessmentLink";
import Logo from "@/components/Logo";
import MobileNavbarMenu from "@/components/MobileNavbarMenu";
import type { FeatureFlagKey } from "@/lib/feature-flags";
import { createClient } from "@/utils/supabase/client";

type PublicFlagMap = Record<FeatureFlagKey, boolean>;

export default function NavbarClient({ flags }: { flags: PublicFlagMap }) {
  const [session, setSession] = useState<{ userId: string; role: string } | null>(null);
  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    async function hydrateSession() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active || !user) return;

      const rawRole = user.user_metadata?.role || "user";
      const role = rawRole === "student" ? "parent" : rawRole;
      setSession({ userId: user.id, role });

      if (role === "tutor") {
        const { count } = await supabase
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .eq("tutor_id", user.id)
          .eq("status", "requested");
        if (active) setPendingRequests(count || 0);
      }
    }

    void hydrateSession();
    return () => {
      active = false;
    };
  }, []);

  const role = session?.role || "user";
  const dashboardHref = session ? `/dashboard/${role}` : undefined;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/[0.08] bg-white/90 shadow-[0_1px_14px_rgba(0,26,68,0.05)] backdrop-blur-lg transition-all">
      <div className={`${session ? "w-full px-8" : "container mx-auto px-4 md:px-8"} h-20 flex items-center justify-between transition-all duration-300`}>
        <div className="flex items-center gap-3">
          <MobileNavbarMenu
            isLoggedIn={Boolean(session)}
            dashboardHref={dashboardHref}
            showTutorMarketplace={flags.tutor_marketplace_enabled}
            showLearningHub={flags.learning_hub_enabled}
            showCommunity={flags.community_enabled}
            showPracticeDojo={flags.practice_dojo_enabled}
            showFocusDojo={flags.focus_dojo_enabled}
            showFreeAssessment={flags.free_assessment_enabled}
          />
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Logo className="text-xl md:text-2xl" dotClassName="w-1.5 h-1.5 md:w-2 md:h-2" />
          </Link>
        </div>

        <nav className="hidden items-center gap-5 xl:flex">
          {flags.tutor_marketplace_enabled && <Link href="/find-tutors" className="text-sm font-medium text-secondary/70 hover:text-primary transition-colors">Find a Tutor</Link>}
          <Link href="/how-it-works" className="text-sm font-medium text-secondary/70 hover:text-primary transition-colors">How It Works</Link>
          {flags.practice_dojo_enabled && <Link href="/ai-practice-studio" className="text-sm font-medium text-secondary/70 hover:text-primary transition-colors">Free Practice</Link>}
          {flags.learning_hub_enabled && <Link href="/learning-hub" className="text-sm font-medium text-secondary/70 hover:text-primary transition-colors">Resources</Link>}
        </nav>

        <div className="hidden items-center gap-4 xl:flex">
          {session ? (
            <>
              <Link href={dashboardHref!} className="relative flex items-center gap-2 text-sm font-medium text-secondary hover:text-primary">
                Dashboard
                {pendingRequests > 0 && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white shadow-sm">{pendingRequests}</span>}
              </Link>
              <form action={signOut}>
                <button type="submit" className="inline-flex h-9 items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-secondary/90">Log out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-secondary hover:text-primary">Log in</Link>
              <Link href="/signup" className="text-sm font-medium text-secondary hover:text-primary">Sign up</Link>
              {flags.free_assessment_enabled && (
                <BookAssessmentLink source="navbar" className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 py-3 text-center text-xs font-black text-white shadow-lg shadow-primary/15 transition-all hover:-translate-y-0.5 hover:bg-primary-hover">
                  Request a Free Learning Assessment
                </BookAssessmentLink>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}

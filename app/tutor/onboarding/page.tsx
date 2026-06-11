import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import OnboardingStepper from "./OnboardingStepper";
import { signOut } from "@/app/login/actions";
import { Clock, HelpCircle, LogOut } from "lucide-react";
import Logo from "@/components/Logo";
import SDLogoBadge from "@/components/brand/SDLogoBadge";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const role = user.user_metadata?.role;
  
  if (role !== "tutor") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "tutor") {
      // One last check: maybe they have a DRAFT tutor application? 
      // If so, they ARE a tutor in progress!
      const { data: appDraft } = await supabase
        .from('applications')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!appDraft) {
        redirect("/dashboard/parent");
      }
    }
  }

  const { data: application } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (application?.status === 'pending' || application?.status === 'approved') {
    redirect("/dashboard/tutor");
  }

  const displayName =
    application?.data?.full_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Tutor";

  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || "";

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-white via-[#F8FBFF] to-[#ECF7FF] text-navy">
      <div className="pointer-events-none absolute inset-0 opacity-[0.045]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, #001A3D 1px, transparent 1px), linear-gradient(to bottom, #001A3D 1px, transparent 1px)",
            backgroundSize: "4.25rem 4.25rem",
          }}
        />
      </div>
      <div className="pointer-events-none absolute right-4 top-24 hidden h-28 w-28 text-primary/10 lg:block">
        <svg viewBox="0 0 100 100" fill="none" className="h-full w-full">
          <ellipse cx="50" cy="50" rx="40" ry="15" stroke="currentColor" strokeWidth="1.5" transform="rotate(45 50 50)" />
          <ellipse cx="50" cy="50" rx="40" ry="15" stroke="currentColor" strokeWidth="1.5" transform="rotate(-45 50 50)" />
          <circle cx="50" cy="50" r="4" fill="currentColor" />
        </svg>
      </div>

      <header className="relative z-10 border-b border-navy/10 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="ScienceDojo home">
            <SDLogoBadge size="md" variant="light" alt="" priority />
            <Logo className="text-xl sm:text-2xl" dotClassName="h-1.5 w-1.5 sm:h-2 sm:w-2" />
          </Link>

          <div className="flex items-center gap-3 text-sm font-semibold text-navy/65">
            <Link href="/support/tutors" className="hidden items-center gap-2 rounded-full px-3 py-2 transition-colors hover:bg-primary/5 hover:text-navy sm:flex">
              Need help?
              <HelpCircle size={16} />
            </Link>
            <div className="flex items-center gap-2 rounded-full border border-navy/10 bg-white px-2 py-1.5 shadow-sm">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt=""
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">
                  {displayName.slice(0, 1).toUpperCase()}
                </div>
              )}
              <span className="hidden max-w-[9rem] truncate text-sm font-bold text-navy sm:inline">{displayName}</span>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-navy/10 bg-white text-navy/55 shadow-sm transition-colors hover:bg-navy hover:text-white"
                aria-label="Log out"
                title="Log out"
              >
                <LogOut size={16} />
              </button>
            </form>
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 md:pt-12 lg:px-8 lg:pb-16">
        <div className="mb-8 space-y-4 md:mb-10">
          <div className="space-y-3">
            <h1 className="text-4xl font-black tracking-tight text-navy sm:text-5xl">Tutor Application</h1>
            <p className="max-w-2xl text-base font-medium leading-relaxed text-navy/65 sm:text-lg">
              Complete your profile so we can learn more about you.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-navy/10 bg-white/75 px-4 py-2 text-sm font-semibold text-navy/65 shadow-sm">
            <Clock size={16} className="text-primary" />
            Average completion time: 6-8 minutes
          </div>
        </div>

        <OnboardingStepper initialData={application || {}} userId={user.id} />
      </section>
    </main>
  );
}

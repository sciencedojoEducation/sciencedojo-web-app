import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { signOut } from "@/app/login/actions";
import Logo from "@/components/Logo";
import BookAssessmentLink from "@/components/analytics/BookAssessmentLink";
import MobileNavbarMenu from "@/components/MobileNavbarMenu";

export default async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const rawRole = user?.user_metadata?.role || 'parent';
  const role = rawRole === 'student' ? 'parent' : rawRole;

  let pendingRequests = 0;
  if (user && role === "tutor") {
    const { count } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("tutor_id", user.id)
      .eq("status", "requested");
    pendingRequests = count || 0;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/[0.08] bg-white/90 shadow-[0_1px_14px_rgba(0,26,68,0.05)] backdrop-blur-lg transition-all">
      <div className={`${user ? 'w-full px-8' : 'container mx-auto px-4 md:px-8'} h-20 flex items-center justify-between transition-all duration-300`}>
        <div className="flex items-center gap-3">
          <MobileNavbarMenu isLoggedIn={!!user} dashboardHref={user ? `/dashboard/${role}` : undefined} />
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Logo className="text-xl md:text-2xl" dotClassName="w-1.5 h-1.5 md:w-2 md:h-2" />
          </Link>
        </div>

        {!user && (
          <nav className="hidden md:flex items-center gap-7">
            <Link href="/#directory" className="text-sm font-medium text-secondary/70 hover:text-primary transition-colors">
              Find Tutors
            </Link>
            <Link href="/learning-hub" className="text-sm font-medium text-secondary/70 hover:text-primary transition-colors">
              Learning Hub
            </Link>
            <Link href="/ai-practice-studio" className="text-sm font-medium text-secondary/70 hover:text-primary transition-colors">
              Practice Dojo
            </Link>
            <BookAssessmentLink source="navbar" className="text-sm font-medium text-secondary/70 hover:text-primary transition-colors">
              Request Free Assessment
            </BookAssessmentLink>
          </nav>
        )}

        <div className="hidden items-center gap-4 md:flex">
          {user ? (
            <>
              <Link href={`/dashboard/${role}`} className="relative text-sm font-medium text-secondary hover:text-primary transition-colors flex items-center gap-2">
                Dashboard
                {pendingRequests > 0 && (
                  <span className="flex items-center justify-center w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full shadow-sm animate-pulse">
                    {pendingRequests}
                  </span>
                )}
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="inline-flex h-9 items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-secondary/90 transition-colors"
                >
                  Log out
                </button>
              </form>

            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-secondary hover:text-primary transition-colors">
                Log in
              </Link>
              <Link
                href="/signup"
                className="inline-flex h-9 items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

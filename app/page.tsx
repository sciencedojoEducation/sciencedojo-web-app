import { getTutors } from "@/lib/supabase-queries";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import SearchFilterBar from "@/components/SearchFilterBar";
import TutorCard from "@/components/TutorCard";
import Link from "next/link";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; subject?: string }>;
}) {
  const params = await searchParams;
  const searchTerm = params.query || "";
  const selectedSubject = params.subject || "All";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // 1. Check Profiles Table (Source of Truth)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    let role = profile?.role || user.user_metadata.role;

    // 2. If Role is still missing or defaults to parent, check for Tutor Application Status
    if (!role || role === 'parent') {
      const { data: application } = await supabase
        .from('applications')
        .select('status')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (application) {
        role = 'tutor'; // They are in the tutor flow!
      }
    }

    // Default to parent if all else fails
    const finalRole = role || 'parent';
    redirect(`/dashboard/${finalRole}`);
  }

  const tutors = await getTutors(searchTerm, selectedSubject);

  return (
    <div className="flex flex-col flex-1 items-center bg-background">
      {/* Hero Section */}
      <section className="w-full bg-gradient-to-br from-[#002244] via-[#004488] to-[#0066cc] py-28 px-4 md:px-8 text-center relative overflow-hidden">
        {/* Subdued brand cyan mesh light */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_top_right,_var(--color-cyan)_0%,_transparent_60%)]"></div>
        
        <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center">
          <div className="flex items-center gap-2 mb-8 bg-white/5 backdrop-blur-sm border border-white/10 px-4 py-1.5 rounded-full shadow-inner animate-in fade-in slide-in-from-top-4 duration-1000">
             <span className="flex h-1.5 w-1.5 rounded-full bg-green-400"></span>
             <span className="text-[10px] uppercase font-black tracking-[0.3em] text-white/50">Trusted by over 500+ British Families</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight leading-[1.1]">
            Unlock Potential with <span className="text-green-400/90 italic">Expert</span> 1-1 Tutoring
          </h1>
          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
            The <span className="font-bold text-white lowercase">sciencedojo</span> platform connects your child with vetted, world-class tutors who adapt to their unique learning style.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
             <Link 
               href="/#directory"
               className="px-10 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary-hover transition-all shadow-xl hover:-translate-y-1 active:scale-95"
             >
                Find Your Perfect Tutor
             </Link>
             <Link 
               href="/signup" 
               className="px-10 py-4 bg-white/5 backdrop-blur-md border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-all"
             >
                Join for Free
             </Link>
          </div>
        </div>
      </section>

      {/* Directory Section */}
      <section id="directory" className="w-full max-w-7xl mx-auto px-4 md:px-8 py-12 -mt-8 relative z-20">
        <SearchFilterBar />

        <div className="mb-6 flex justify-between items-end">
          <h2 className="text-2xl font-bold text-secondary">
            {selectedSubject === "All" ? "All Tutors" : `${selectedSubject} Tutors`}
          </h2>
          <span className="text-sm font-medium text-secondary/60">
            Showing {tutors.length} {tutors.length === 1 ? 'tutor' : 'tutors'}
          </span>
        </div>

        {tutors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tutors.map((tutor) => (
              <TutorCard key={tutor.id} tutor={tutor as any} currentUserRole={null} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-secondary/10 shadow-sm text-center">
            <div className="w-16 h-16 bg-secondary/5 rounded-full flex items-center justify-center mb-4 text-secondary/30">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-secondary mb-2">No tutors found</h3>
            <p className="text-secondary/60 max-w-sm">We couldn't find any tutors matching your search criteria. Try adjusting your filters.</p>
            <Link
              href="/"
              className="mt-6 px-4 py-2 text-primary font-medium hover:bg-primary/5 rounded-lg transition-colors border border-primary/20"
            >
              Clear Filters
            </Link>
          </div>
        )}
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="w-full bg-white border-y border-secondary/10 py-24 mt-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <span className="text-primary font-bold tracking-wider text-sm uppercase mb-2 block">The Process</span>
            <h2 className="text-3xl md:text-5xl font-bold text-secondary mb-6">How <span className="text-primary tracking-tight">sciencedojo</span> Works</h2>
            <p className="text-lg text-secondary/60 max-w-2xl mx-auto">Three simple steps to start mastering your hardest subjects and unlocking your full potential.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-surface rounded-3xl p-10 border border-secondary/10 shadow-sm text-center hover:shadow-md transition-shadow">
              <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-8 text-3xl font-black">1</div>
              <h3 className="text-2xl font-bold text-secondary mb-4">Find an Expert</h3>
              <p className="text-secondary/70 leading-relaxed">Browse our exclusive directory of vetted, world-class tutors. Filter by subject, price, and precise specialties to find your perfect match.</p>
            </div>

            <div className="bg-surface rounded-3xl p-10 border border-secondary/10 shadow-sm text-center hover:shadow-md transition-shadow">
              <div className="w-20 h-20 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto mb-8 text-3xl font-black">2</div>
              <h3 className="text-2xl font-bold text-secondary mb-4">Book Instantly</h3>
              <p className="text-secondary/70 leading-relaxed">Check live availability and reserve a time slot that seamlessly works for your schedule. Checkout securely with our integrated payment ledger.</p>
            </div>

            <div className="bg-surface rounded-3xl p-10 border border-secondary/10 shadow-sm text-center hover:shadow-md transition-shadow">
              <div className="w-20 h-20 bg-green-500/10 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 text-3xl font-black">3</div>
              <h3 className="text-2xl font-bold text-secondary mb-4">Start Learning</h3>
              <p className="text-secondary/70 leading-relaxed">Join your personalized interactive 1-1 session automatically via Zoom or Teams. Get post-session summary notes directly to your email after every class.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="w-full max-w-7xl mx-auto px-4 md:px-8 py-24 text-center">
        <span className="text-primary font-bold tracking-wider text-sm uppercase mb-2 block">Transparent Costs</span>
        <h2 className="text-3xl md:text-5xl font-bold text-secondary mb-6">Simple, Fair Pricing</h2>
        <p className="text-lg text-secondary/60 max-w-2xl mx-auto mb-16">No monthly subscriptions, no hidden platform percentage cuts. You pay strictly for the high-quality hours you learn.</p>

        <div className="bg-secondary text-left text-white rounded-3xl max-w-4xl mx-auto overflow-hidden shadow-2xl flex flex-col md:flex-row">
          <div className="p-10 md:p-12 md:w-2/3">
            <h3 className="text-2xl font-bold mb-4">Pay Per Session</h3>
            <p className="text-slate-300 mb-8 leading-relaxed">Every tutor sets their own competitive hourly rate based on their expertise, education level, and experience. Rates typically range from £30 to £90 an hour.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                <span className="font-medium text-slate-200">No recurring fees</span>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                <span className="font-medium text-slate-200">100% Secure Checkout</span>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                <span className="font-medium text-slate-200">Cancel up to 24h prior</span>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                <span className="font-medium text-slate-200">Direct tutor messaging</span>
              </div>
            </div>
          </div>
          <div className="bg-primary p-10 md:p-12 md:w-1/3 flex flex-col justify-center items-center text-center">
            <span className="text-primary-hover font-bold text-sm bg-white/20 px-3 py-1 rounded-full mb-4">Average Rate</span>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-5xl font-black text-white">£45</span>
              <span className="text-xl text-white/70">/hr</span>
            </div>
             <Link 
               href="/#directory"
               className="w-full bg-white text-primary font-bold py-3 rounded-xl hover:bg-slate-50 transition-colors flex justify-center"
             >
                Find a Tutor
             </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

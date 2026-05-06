import { getTutors } from "@/lib/supabase-queries";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import SearchFilterBar from "@/components/SearchFilterBar";
import TutorCard from "@/components/TutorCard";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import AiPracticeStudioCtaLink from "@/components/analytics/AiPracticeStudioCtaLink";
import BookAssessmentLink from "@/components/analytics/BookAssessmentLink";
import HomepageSectionTracker from "@/components/analytics/HomepageSectionTracker";
import { faqJsonLd, localBusinessJsonLd, organizationJsonLd } from "@/lib/seo";

const homeFaqs = [
  {
    question: "How do I find a good online tutor?",
    answer: "Look for a tutor who explains clearly, understands the student's goals, and gives structured practice after each lesson. ScienceDojo helps families compare tutors and book support from one platform.",
  },
  {
    question: "Which subjects does ScienceDojo support?",
    answer: "ScienceDojo focuses on high-intent academic support including math, physics, chemistry, GCSE, IB, and A-Level tutoring.",
  },
  {
    question: "Can I book a free assessment?",
    answer: "Yes. Parents can browse tutors, ask questions, and take the next step toward a free assessment or first session.",
  },
];

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
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={localBusinessJsonLd()} />
      <JsonLd data={faqJsonLd(homeFaqs)} />

      {/* Hero Section */}
      <section className="w-full bg-gradient-to-br from-[#06172f] via-[#073f7b] to-[#0b64bd] py-28 px-4 md:px-8 text-center relative overflow-hidden">
        {/* Subdued brand cyan mesh light */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_top_right,_var(--color-cyan)_0%,_transparent_60%)]"></div>
        
        <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center">
          <div className="flex items-center gap-2 mb-8 bg-white/5 backdrop-blur-sm border border-white/10 px-4 py-1.5 rounded-full shadow-inner animate-in fade-in slide-in-from-top-4 duration-1000">
             <span className="flex h-1.5 w-1.5 rounded-full bg-green-400"></span>
             <span className="text-[10px] uppercase font-black tracking-[0.3em] text-white/50">Supporting students across British and international curricula</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight leading-[1.1]">
            Unlock Potential with <span className="text-cyan-200/90 italic">Expert</span> 1-1 Tutoring
          </h1>
          <p className="text-lg md:text-xl text-white/65 max-w-2xl mx-auto mb-4 font-medium leading-relaxed">
            The <span className="font-bold text-white lowercase">sciencedojo</span> platform connects your child with carefully reviewed tutors who adapt to their unique learning style.
          </p>
          <p className="mb-12 text-base font-semibold text-white/75">
            Helping students build confidence through structured online learning.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
             <BookAssessmentLink
               source="homepage_hero"
               className="px-10 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary-hover transition-all shadow-xl hover:-translate-y-1 active:scale-95"
             >
                Book Free Assessment
             </BookAssessmentLink>
             <Link 
               href="/signup" 
               className="px-10 py-4 bg-white/5 backdrop-blur-md border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-all"
             >
                Join for Free
             </Link>
          </div>

          <div className="mt-10 grid gap-3 text-left sm:grid-cols-3">
            {["International curricula", "AI-supported learning", "Flexible online tutoring"].map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white/70 backdrop-blur-sm">
                <svg className="h-4 w-4 shrink-0 text-cyan-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full border-b border-secondary/10 bg-white px-4 py-20 md:px-8">
        <HomepageSectionTracker eventName="homepage_ai_practice_visible" />
        <div className="group relative mx-auto grid max-w-7xl gap-8 overflow-hidden rounded-[2rem] border border-primary/10 bg-surface p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl transition-transform duration-700 group-hover:scale-125"></div>
          <div className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl"></div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-primary">Free AI study tool</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-secondary md:text-5xl">AI Practice Studio</h2>
            <p className="mt-4 text-xl font-black text-secondary">Generate curriculum-aligned practice instantly.</p>
            <p className="mt-4 max-w-2xl leading-7 text-secondary/65">
              Create targeted practice questions for UK National Curriculum, Cambridge, Edexcel, AQA, SQA, IB, and more.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <AiPracticeStudioCtaLink
                href="/ai-practice-studio"
                cta="try_free_tool"
                source="homepage_ai_practice_studio"
                className="inline-flex justify-center rounded-2xl bg-primary px-7 py-4 text-sm font-black uppercase tracking-[0.14em] text-white transition-colors hover:bg-primary-hover"
              >
                Try Free Tool
              </AiPracticeStudioCtaLink>
              <AiPracticeStudioCtaLink
                href="/free-assessment"
                cta="request_free_assessment"
                source="homepage_ai_practice_studio"
                className="inline-flex justify-center rounded-2xl border border-secondary/10 bg-white px-7 py-4 text-sm font-black uppercase tracking-[0.14em] text-secondary transition-colors hover:border-primary/30 hover:text-primary"
              >
                Request Free Assessment
              </AiPracticeStudioCtaLink>
            </div>
          </div>
          <div className="relative rounded-3xl border border-secondary/10 bg-white/95 p-6 shadow-sm transition-all group-hover:border-primary/20">
            <h3 className="text-xl font-black text-secondary">Built Around Real Curricula</h3>
            <div className="mt-5 grid gap-3">
              {[
                "Educational stage matching",
                "Curriculum-specific generation",
                "Level-appropriate questions",
                "Subject-focused revision",
                "Topic-based practice",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl bg-surface px-5 py-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span className="text-sm font-black text-secondary">{item}</span>
                </div>
              ))}
            </div>
            <p className="mt-5 rounded-2xl border border-secondary/10 bg-white px-5 py-4 text-sm font-bold leading-6 text-secondary/65">
              Supports: UK National Curriculum, Cambridge, Edexcel, AQA, SQA, and IB
            </p>
          </div>
        </div>
      </section>

      <section className="w-full bg-gradient-to-b from-[#f2f8ff] via-white to-surface px-4 py-24 md:px-8">
        <HomepageSectionTracker eventName="homepage_why_sciencedojo_visible" />
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-primary">Why ScienceDojo</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-secondary md:text-5xl">A Smarter Way to Learn</h2>
            <p className="mt-5 text-lg leading-8 text-secondary/65">
              ScienceDojo combines expert tutors, structured learning systems, and AI-powered study tools to help students learn with confidence.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                title: "Targeted AI Practice",
                text: "Generate targeted curriculum-aligned revision instantly.",
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                ),
              },
              {
                title: "Adaptive Tutor Support",
                text: "Connect with carefully reviewed tutors who adapt to each learner.",
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422A12.083 12.083 0 0118 16.5c0 1.657-2.686 3-6 3s-6-1.343-6-3c0-1.994.32-3.938.917-5.722L12 14z" />
                ),
              },
              {
                title: "Track Learning Progress",
                text: "Track lessons, practice, and learning progress in one place.",
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6m4 6V7m4 10v-4M5 19h14" />
                ),
              },
              {
                title: "Curriculum-Aligned Learning",
                text: "Supports UK National Curriculum, Cambridge, Edexcel, AQA, SQA, and IB.",
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c2.5-2.4 4-5.4 4-9s-1.5-6.6-4-9m0 18c-2.5-2.4-4-5.4-4-9s1.5-6.6 4-9" />
                ),
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group rounded-3xl border border-secondary/10 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl"
              >
                <div className="mb-7 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {feature.icon}
                  </svg>
                </div>
                <h3 className="text-xl font-black text-secondary">{feature.title}</h3>
                <p className="mt-3 leading-7 text-secondary/65">{feature.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-3xl border border-secondary/10 bg-white p-6 shadow-sm">
            <div className="grid gap-4 md:grid-cols-4">
              {[
                "Generate targeted practice",
                "Identify weak areas",
                "Connect with the right tutor",
                "Improve with structured support",
              ].map((step, index) => (
                <div key={step} className="flex items-center gap-4 rounded-2xl bg-surface px-5 py-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-black text-white">
                    {index + 1}
                  </span>
                  <span className="text-sm font-black leading-5 text-secondary">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Directory Section */}
      <section id="directory" className="w-full max-w-7xl mx-auto px-4 md:px-8 py-20 relative z-20 bg-white">
        <HomepageSectionTracker eventName="homepage_tutor_marketplace_visible" />
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-primary">Tutor marketplace</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-secondary md:text-5xl">Find the Right Tutor</h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-secondary/65">
              Connect with tutors who match your child&apos;s learning goals, curriculum, and learning style.
            </p>
          </div>
          <span className="text-sm font-black uppercase tracking-[0.16em] text-secondary/50">
            Showing {tutors.length} {tutors.length === 1 ? 'tutor' : 'tutors'}
          </span>
        </div>

        <SearchFilterBar />

        <div className="mb-6 mt-8 flex justify-between items-end">
          <h2 className="text-2xl font-bold text-secondary">
            {selectedSubject === "All" ? "All Tutors" : `${selectedSubject} Tutors`}
          </h2>
          <span className="text-sm font-medium text-secondary/60">
            Showing {tutors.length} {tutors.length === 1 ? 'tutor' : 'tutors'}
          </span>
        </div>

        {tutors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tutors.map((tutor, index) => (
              <TutorCard key={tutor.id} tutor={tutor as any} currentUserRole={null} isFeatured={index === 0} />
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
      <section id="how-it-works" className="w-full border-y border-secondary/10 bg-gradient-to-b from-surface to-white py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <span className="text-primary font-bold tracking-wider text-sm uppercase mb-2 block">The Process</span>
            <h2 className="text-3xl md:text-5xl font-bold text-secondary mb-6">How <span className="text-primary tracking-tight">sciencedojo</span> Works</h2>
            <p className="text-lg text-secondary/60 max-w-2xl mx-auto">A connected learning journey from targeted practice to confident progress.</p>
          </div>

          <div className="relative grid grid-cols-1 gap-6 md:grid-cols-4">
            <div className="absolute left-[12%] right-[12%] top-10 hidden h-px bg-gradient-to-r from-primary/10 via-primary/30 to-primary/10 md:block"></div>
            {[
              ["1", "Generate targeted practice", "Use AI Practice Studio to create curriculum-aligned questions by subject and topic."],
              ["2", "Identify weak areas", "See where explanations, practice habits, or confidence need extra support."],
              ["3", "Connect with a tutor", "Choose a carefully reviewed tutor matched to the student's goals and curriculum."],
              ["4", "Build confidence", "Turn lessons, practice, and feedback into steady structured progress."],
            ].map(([number, title, text]) => (
              <div key={title} className="relative rounded-3xl border border-secondary/10 bg-white p-8 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-full border-8 border-surface bg-primary text-3xl font-black text-white shadow-sm">
                  {number}
                </div>
                <h3 className="text-xl font-black text-secondary mb-4">{title}</h3>
                <p className="text-sm leading-7 text-secondary/65">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEO Pathways Section */}
      <section className="w-full border-y border-secondary/10 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="mb-2 block text-sm font-bold uppercase tracking-wider text-primary">Find support faster</span>
              <h2 className="text-3xl font-bold text-secondary md:text-4xl">Popular online tutoring paths</h2>
            </div>
            <Link href="/complete-guide-to-online-tutoring" className="font-black text-primary hover:text-primary-hover">
              Read the complete guide
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ["Online Math Tutor", "/online-math-tutor"],
              ["Online Physics Tutor", "/online-physics-tutor"],
              ["Online Chemistry Tutor", "/online-chemistry-tutor"],
              ["GCSE Math Tutor", "/gcse-math-tutor"],
              ["IB Physics Tutor", "/ib-physics-tutor"],
              ["AI Practice Studio", "/ai-practice-studio"],
            ].map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="rounded-2xl border border-secondary/10 bg-surface p-5 font-black text-secondary shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="w-full bg-secondary px-4 py-24 text-center md:px-8">
        <div className="mx-auto max-w-7xl">
        <span className="text-cyan-200 font-bold tracking-wider text-sm uppercase mb-2 block">Transparent Costs</span>
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Flexible Learning Support</h2>
        <p className="text-lg text-white/65 max-w-2xl mx-auto mb-16">Personalized support matched to your child&apos;s goals and curriculum, without monthly subscriptions or hidden platform percentage cuts.</p>

        <div className="bg-white/5 text-left text-white rounded-3xl max-w-5xl mx-auto overflow-hidden shadow-2xl flex flex-col border border-white/10 md:flex-row">
          <div className="p-10 md:p-12 md:w-2/3">
            <h3 className="text-2xl font-bold mb-4">Structured Online Tutoring</h3>
            <p className="text-slate-300 mb-8 leading-relaxed">Every tutor sets their own hourly rate based on subject focus, education level, and experience. Families can start with the support level that fits their goals.</p>
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
          <div className="bg-gradient-to-br from-primary to-[#004db8] p-10 md:p-12 md:w-1/3 flex flex-col justify-center items-center text-center">
            <span className="text-cyan-100 font-bold text-sm bg-white/15 px-3 py-1 rounded-full mb-4">Typical starting point</span>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-5xl font-black text-white">£45</span>
              <span className="text-xl text-white/70">/hr</span>
            </div>
             <BookAssessmentLink
               source="homepage_pricing"
               className="w-full bg-white text-primary font-bold py-3 rounded-xl hover:bg-slate-50 transition-colors flex justify-center"
             >
                Book Free Assessment
             </BookAssessmentLink>
          </div>
        </div>
        </div>
      </section>

      <section className="w-full bg-white px-4 py-24 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <span className="mb-2 block text-sm font-bold uppercase tracking-wider text-primary">Learning journeys</span>
            <h2 className="text-3xl font-bold text-secondary md:text-5xl">Success Stories</h2>
            <p className="mt-5 text-lg leading-8 text-secondary/65">
              ScienceDojo is designed for the moments families care about most: confidence, consistency, and clearer learning support.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              ["Improved confidence in GCSE Maths", "A calm structure for students who need clearer steps and guided practice."],
              ["Structured support for IB Physics", "Topic-focused sessions help learners connect concepts, practice, and exam technique."],
              ["Consistent online learning support", "Flexible tutoring and AI-supported practice help families keep learning moving."],
            ].map(([title, text]) => (
              <div key={title} className="rounded-3xl border border-secondary/10 bg-surface p-8 shadow-sm">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M7 20h10a4 4 0 004-4V8a4 4 0 00-4-4H7a4 4 0 00-4 4v8a4 4 0 004 4z" />
                  </svg>
                </div>
                <h3 className="text-xl font-black text-secondary">{title}</h3>
                <p className="mt-4 leading-7 text-secondary/65">{text}</p>
                {/* TODO: Replace placeholder-safe story cards with real parent/student testimonials once approved. */}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full bg-gradient-to-b from-surface to-white px-4 py-24 md:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="mb-2 block text-sm font-bold uppercase tracking-wider text-primary">FAQ</span>
            <h2 className="text-3xl font-bold text-secondary md:text-5xl">Online tutoring questions</h2>
          </div>
          <div className="mt-10 divide-y divide-secondary/10 rounded-3xl border border-secondary/10 bg-surface text-left shadow-sm">
            {homeFaqs.map((faq) => (
              <div key={faq.question} className="p-6">
                <h3 className="font-black text-secondary">{faq.question}</h3>
                <p className="mt-3 leading-7 text-secondary/65">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full bg-gradient-to-br from-[#071a35] via-[#0a4d95] to-primary px-4 py-24 text-center md:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-4xl font-black tracking-tight text-white md:text-6xl">Helping Students Learn With Confidence</h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/70">
            From AI-powered practice to expert online tutoring, ScienceDojo supports modern learners through structured, curriculum-aligned learning.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
            <BookAssessmentLink
              source="homepage_final_cta"
              className="rounded-2xl bg-white px-8 py-4 text-sm font-black uppercase tracking-[0.14em] text-primary shadow-xl transition-all hover:-translate-y-0.5 hover:bg-slate-50"
            >
              Request Free Assessment
            </BookAssessmentLink>
            <AiPracticeStudioCtaLink
              href="/ai-practice-studio"
              cta="final_cta_try_tool"
              source="homepage_final_cta"
              className="rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-sm font-black uppercase tracking-[0.14em] text-white backdrop-blur transition-all hover:bg-white/10"
            >
              Try AI Practice Studio
            </AiPracticeStudioCtaLink>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-4">
            {["Online tutoring", "International curricula", "AI-supported study tools", "Flexible online learning"].map((item) => (
              <div key={item} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-white/65">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}

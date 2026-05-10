import { getTutors } from "@/lib/supabase-queries";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Video, LayoutDashboard, ListChecks, Zap, BarChart2, Calendar, MessageSquare, Users } from "lucide-react";
import SearchFilterBar from "@/components/SearchFilterBar";
import TutorCard from "@/components/TutorCard";
import Link from "next/link";
import HomeHowItWorksIllustration from "@/components/HomeHowItWorksIllustration";
import JsonLd from "@/components/JsonLd";
import AiPracticeStudioCtaLink from "@/components/analytics/AiPracticeStudioCtaLink";
import BookAssessmentLink from "@/components/analytics/BookAssessmentLink";
import HomepageSectionTracker from "@/components/analytics/HomepageSectionTracker";
import HeroIntroMedia from "@/components/HeroIntroMedia";
import { AchievementStoryCard, FeaturedTestimonialCard, REAL_TESTIMONIALS, TestimonialCard } from "@/components/Testimonials";
import { homeImages } from "@/lib/homeImages";
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

const platformFeatures = [
  {
    title: "Video Classroom",
    text: "Join booked lessons directly inside ScienceDojo, without separate meeting tools.",
    icon: "video",
  },
  {
    title: "Learner Dashboard",
    text: "Students can see sessions, lesson-linked missions, tasks, and priorities.",
    icon: "dashboard",
  },
  {
    title: "Assignment Tracking",
    text: "Keep practice, homework, and completion visible.",
    icon: "tasks",
  },
  {
    title: "Practice Dojo",
    text: "Test existing knowledge with targeted curriculum-aligned questions.",
    icon: "spark",
  },
  {
    title: "Progress Analytics",
    text: "Spot strengths, weak areas, and learning momentum.",
    icon: "chart",
  },
  {
    title: "Lesson Scheduling",
    text: "Book and manage tutoring sessions in one place.",
    icon: "calendar",
  },
  {
    title: "Tutor Messaging",
    text: "Stay connected with tutors and learning updates.",
    icon: "message",
  },
  {
    title: "Parent Visibility",
    text: "Families get clearer insight into learning support.",
    icon: "parent",
  },
];

const platformFeatureIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  video: Video,
  dashboard: LayoutDashboard,
  tasks: ListChecks,
  spark: Zap,
  chart: BarChart2,
  calendar: Calendar,
  message: MessageSquare,
  parent: Users,
};

function PlatformFeatureIcon({ type, className = "h-7 w-7" }: { type: string; className?: string }) {
  const Icon = platformFeatureIcons[type] ?? LayoutDashboard;
  return <Icon className={className} aria-hidden="true" />;
}

const heroPills = ["Expert Tutors", "Structured Support", "Online Learning", "Visible Progress"] as const;

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
      <section id="hero" aria-label="Expert online tutoring" className="sd-ambient-gradient relative flex min-h-[86vh] w-full items-center overflow-hidden bg-[linear-gradient(135deg,#06172f_0%,#073f7b_42%,#0b64bd_72%,#06376f_100%)] px-4 py-16 text-center md:px-10 md:py-24 lg:py-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_26%,rgba(0,245,212,0.16),transparent_33%),radial-gradient(circle_at_18%_78%,rgba(255,255,255,0.1),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent_42%)]"></div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-white/10"></div>

        <div className="relative z-10 mx-auto grid w-full max-w-[1400px] items-center gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
          <div className="sd-fade-up flex flex-col items-center text-center lg:items-start lg:text-left">
          <div className="flex items-center gap-2 mb-6 md:mb-8 bg-white/5 backdrop-blur-sm border border-white/10 px-4 py-1.5 rounded-full shadow-inner animate-in fade-in slide-in-from-top-4 duration-1000">
             <span className="flex h-1.5 w-1.5 rounded-full bg-green-400"></span>
             <span className="text-[10px] uppercase font-black tracking-[0.3em] text-white/50">Supporting students across British and international curricula</span>
          </div>

          <h1 className="mb-6 text-5xl font-bold leading-[1.04] tracking-tight text-white md:mb-10 md:text-6xl lg:text-[5.25rem]">
            Helping students learn with <span className="text-cyan-200/90 italic">confidence</span> anywhere.
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mb-3 md:mb-5 font-medium leading-relaxed">
            ScienceDojo combines expert online tutoring with structured practice, smarter learning tools, and visible progress for families.
          </p>
          <p className="mx-auto mb-6 max-w-[21rem] text-base font-medium italic leading-8 text-white/80 sm:max-w-2xl lg:mx-0 lg:mb-12">
            &ldquo;We believe distance is just a number. Learning is limitless when students have the right support.&rdquo;
          </p>

          <div className="hidden items-center gap-4 lg:flex">
             <BookAssessmentLink
               source="homepage_hero"
               className="px-10 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary-hover transition-all shadow-xl shadow-primary/30 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/40 active:scale-95"
             >
                Book Free Assessment
             </BookAssessmentLink>
             <Link 
               href="/ai-practice-studio" 
               className="px-10 py-4 bg-white/5 backdrop-blur-md border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-all"
             >
                Try Practice Dojo
             </Link>
          </div>

          </div>

          <div className="sd-fade-up relative mb-3 w-full max-w-[calc(100vw-1rem)] justify-self-center sm:max-w-[43rem] lg:-mr-24 lg:mb-0 lg:max-w-none">
            <div className="sd-glow-pulse pointer-events-none absolute -inset-10 rounded-[3.5rem] bg-[radial-gradient(circle_at_50%_45%,rgba(0,245,212,0.18),rgba(0,102,255,0.1)_38%,transparent_68%)] blur-2xl"></div>
            <div className="sd-shimmer relative aspect-[4/3] overflow-hidden rounded-[2.75rem] border border-white/15 bg-white/10 shadow-[0_48px_130px_rgba(0,0,0,0.42)] lg:scale-[1.04] lg:origin-center">
              <HeroIntroMedia imageSrc={homeImages.heroStem.src} imageAlt={homeImages.heroStem.alt} videoSrc="/videos/hero-video.mp4" />
              <div className="absolute inset-0 bg-gradient-to-tr from-secondary/65 via-primary/10 to-cyan-300/15"></div>
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-secondary/55 to-transparent"></div>
            </div>
            <div className="sd-float-soft absolute right-0 top-8 hidden w-56 rounded-3xl border border-white/15 bg-white/95 px-5 py-4 text-left shadow-2xl shadow-black/25 backdrop-blur md:block md:translate-x-1/2">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">Built-in Classroom</p>
              <p className="mt-1 text-sm font-black text-secondary">Lessons inside ScienceDojo</p>
            </div>
            <div className="sd-float-soft-delayed absolute -left-6 top-1/2 hidden w-52 rounded-3xl border border-white/15 bg-secondary/95 px-5 py-4 text-left text-white shadow-2xl shadow-black/25 backdrop-blur md:block">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">Weekly Progress</p>
              <p className="mt-1 text-sm font-black">Clear next steps after lessons</p>
            </div>
            <div className="absolute -bottom-8 left-6 grid w-[46%] min-w-[10.5rem] gap-2 sm:grid-cols-2 sm:w-[54%] lg:-bottom-7 lg:left-10 lg:right-auto lg:w-[74%] lg:gap-3">
              {[
                { label: "Practice Dojo", detail: "Targeted checks" },
                { label: "Parent Updates", detail: "Visible support" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2.5 rounded-[1.05rem] border border-white/15 bg-white/95 px-3.5 py-2.5 text-left text-secondary shadow-2xl shadow-black/15 backdrop-blur transition-transform hover:-translate-y-0.5 lg:gap-3 lg:rounded-2xl lg:px-5 lg:py-4">
                  <svg className="h-3.5 w-3.5 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>
                    <span className="block text-[10px] font-black uppercase tracking-[0.14em]">{item.label}</span>
                    <span className="mt-1 block text-xs font-bold text-secondary/50">{item.detail}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 grid w-full max-w-[calc(100vw-1rem)] justify-self-center gap-5 lg:hidden">
            <div className="mt-6 flex flex-col gap-3 md:mt-10">
              <BookAssessmentLink
                source="homepage_hero_mobile"
                className="mx-auto w-[40%] min-w-max whitespace-nowrap rounded-2xl border border-white/80 bg-white px-6 py-3.5 text-center text-sm font-bold text-secondary shadow-xl shadow-white/20 transition-all active:scale-95"
              >
                Book Free Assessment
              </BookAssessmentLink>
              <Link
                href="/ai-practice-studio"
                className="mx-auto w-[40%] min-w-max whitespace-nowrap rounded-2xl border border-white/20 bg-secondary/35 px-6 py-3.5 text-center text-sm font-bold text-white shadow-lg shadow-secondary/15 backdrop-blur-md transition-all hover:bg-secondary/45"
              >
                Try Practice Dojo
              </Link>
            </div>
            <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex w-max gap-2 text-center">
                {heroPills.map((item) => (
                  <div key={item} className="inline-flex shrink-0 rounded-full border border-white/15 bg-white/[0.07] px-4 py-2 text-[10px] font-black uppercase tracking-[0.1em] text-white/60 backdrop-blur">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="relative z-10 mx-auto mt-14 hidden w-full max-w-[860px] grid-cols-2 gap-3 px-4 text-center sm:grid-cols-4 lg:absolute lg:bottom-8 lg:left-1/2 lg:grid lg:-translate-x-1/2">
          {heroPills.map((item) => (
            <div key={item} className="rounded-full border border-white/15 bg-white/[0.07] px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.16em] text-white/65 backdrop-blur">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section aria-label="Practice Dojo" className="w-full border-b border-secondary/10 bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)] px-4 py-24 md:px-10 md:py-28">
        <HomepageSectionTracker eventName="homepage_ai_practice_visible" />
        <div className="group relative mx-auto grid max-w-[1360px] gap-12 overflow-hidden rounded-[2.5rem] border border-primary/10 bg-white p-8 shadow-2xl shadow-secondary/5 transition-all hover:-translate-y-1 hover:shadow-primary/10 lg:grid-cols-[0.78fr_1.22fr] lg:items-center lg:p-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_20%,rgba(0,102,255,0.08),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.9),rgba(242,248,255,0.72))]"></div>
          <div className="relative z-10">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-primary">Free knowledge-check tool</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-secondary md:text-5xl">Practice Dojo</h2>
            <p className="mt-4 text-xl font-black text-secondary">Test what you know. Find what needs support.</p>
            <p className="mt-4 max-w-2xl leading-7 text-secondary/65">
              Create targeted practice questions for UK National Curriculum, Cambridge, Edexcel, AQA, SQA, IB, and more. If a concept feels difficult, book a free assessment and get matched with tutor support.
            </p>
            <div className="mt-7 grid gap-3 text-sm font-bold text-secondary/65 sm:grid-cols-2">
              {["Knowledge checks by topic", "Curriculum-aligned questions", "Weak-area discovery", "Free assessment next step"].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <AiPracticeStudioCtaLink
                href="/ai-practice-studio"
                cta="try_free_tool"
                source="homepage_ai_practice_studio"
                className="inline-flex justify-center rounded-2xl bg-primary px-7 py-4 text-sm font-black uppercase tracking-[0.14em] text-white transition-colors hover:bg-primary-hover"
              >
                Try Practice Dojo
              </AiPracticeStudioCtaLink>
              <AiPracticeStudioCtaLink
                href="/free-assessment"
                cta="request_free_assessment"
                source="homepage_ai_practice_studio"
                className="inline-flex justify-center whitespace-nowrap rounded-2xl border border-secondary/10 bg-white px-7 py-4 text-sm font-black uppercase tracking-[0.14em] text-secondary transition-colors hover:border-primary/30 hover:text-primary"
              >
                Request Free Assessment
              </AiPracticeStudioCtaLink>
            </div>
          </div>
          <div className="relative z-10 overflow-hidden rounded-[2.25rem] border border-secondary/10 bg-[#f8fbff] p-5 shadow-2xl shadow-secondary/10 transition-all group-hover:border-primary/20 lg:p-6">
            {/* Sample data — replace with real user data when available */}
            <span className="absolute right-5 top-5 z-20 rounded-full bg-secondary/5 px-2.5 py-1 text-[10px] font-bold text-secondary/40 ring-1 ring-secondary/10">Sample view</span>
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(236,247,255,0.74))]"></div>
            <div className="sd-float-soft absolute right-8 top-28 z-10 hidden rounded-2xl border border-primary/10 bg-white/90 px-4 py-3 shadow-xl shadow-primary/10 backdrop-blur md:block">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-secondary/40">Smart Recommendation</p>
              <p className="mt-1 text-sm font-black text-secondary">Practise vectors next</p>
            </div>
            <div className="sd-float-soft-delayed absolute bottom-8 left-8 z-10 hidden rounded-2xl border border-primary/10 bg-secondary px-4 py-3 text-white shadow-xl shadow-secondary/20 backdrop-blur md:block">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/45">Completion</p>
              <p className="mt-1 text-sm font-black">Strong progress</p>
            </div>
            <div className="relative rounded-[1.75rem] border border-secondary/10 bg-white p-5 shadow-xl shadow-secondary/5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Practice Dojo</p>
                  <p className="mt-2 text-2xl font-black text-secondary">Knowledge check</p>
                </div>
                <div className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-primary">Live Plan</div>
              </div>
              <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-2xl bg-surface p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm font-black text-secondary">Smart Practice Questions</span>
                    <span className="rounded-full bg-cyan-100 px-2 py-1 text-[10px] font-black text-primary">6 new</span>
                  </div>
                  <div className="grid gap-3">
                    {["Algebra equations", "Forces and motion", "Bonding practice"].map((item, index) => (
                      <div key={item} className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">{index + 1}</span>
                        <span className="text-sm font-bold text-secondary/70">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid gap-4">
                  <div className="rounded-2xl bg-secondary p-5 text-white">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Study Streak</p>
                        <p className="mt-2 text-lg font-black">Active streak</p>
                      </div>
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                        <svg className="h-7 w-7 text-cyan-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-surface p-5">
                    <p className="text-sm font-black text-secondary">Progress Graph</p>
                    <div className="mt-4 flex h-24 items-end gap-2">
                      {([ { day: "Mon", h: 35 }, { day: "Tue", h: 48 }, { day: "Wed", h: 44 }, { day: "Thu", h: 62 }, { day: "Fri", h: 70 }, { day: "Sat", h: 76 }, { day: "Sun", h: 88 } ] as const).map(({ day, h }) => (
                        <div key={day} className="flex-1 rounded-t-lg bg-primary/15" style={{ height: `${h}%` }}>
                          <div className="sd-bar-rise h-full rounded-t-lg bg-gradient-to-t from-primary to-cyan-300 opacity-80"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-primary/10 bg-gradient-to-r from-primary/5 via-white to-cyan-300/10 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Topic Mastery</p>
                    <p className="mt-2 text-sm font-bold text-secondary/70">Algebra is improving, trigonometry needs targeted practice.</p>
                  </div>
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-lg font-black text-white">82</div>
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-4">
                {[
                  { label: "Weak Topics", value: "Trigonometry", progress: 42, status: "Needs practice" },
                  { label: "Strength Areas", value: "Number", progress: 86, status: "Mastered" },
                  { label: "Tutor Feedback", value: "Clear next step", progress: 72, status: "In progress" },
                  { label: "Learning Goals", value: "Exam confidence", progress: 64, status: "In progress" },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-secondary/10 bg-white p-4 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-secondary/40">{item.label}</p>
                    <p className="mt-2 text-sm font-black text-secondary">{item.value}</p>
                    <div className="mt-3 h-2 rounded-full bg-surface">
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${item.progress}%` }}></div>
                    </div>
                    <p className="mt-1.5 text-[10px] font-bold text-secondary/45">{item.status}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="ScienceDojo learning system" className="w-full bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_45%,#f7fbff_100%)] px-4 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-[1360px]">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-primary">Learning support system</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-secondary md:text-5xl">The <span className="text-primary">sciencedojo</span> Learning System</h2>
            <p className="mt-6 text-lg leading-8 text-secondary/65">
              Everything around booked lessons is designed to make online tutoring feel calmer, clearer, and easier to follow.
            </p>
          </div>

          <div className="mt-16 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {platformFeatures.map((feature) => {
              const isFeatured = feature.title === "Video Classroom" || feature.title === "Learner Dashboard";
              return (
              <div
                key={feature.title}
                className={`group rounded-[2rem] border transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 ${
                  isFeatured
                    ? "border-primary/20 bg-gradient-to-br from-white to-[#f2f9ff] p-8 md:col-span-1 xl:col-span-2 sd-calm-glow shadow-md"
                    : "border-secondary/5 bg-white/80 p-6 shadow-[0_8px_30px_rgba(0,26,68,0.035)]"
                }`}
              >
                <div className={`${isFeatured ? "mb-7 h-20 w-20" : "mb-5 h-11 w-11"} flex items-center justify-center rounded-3xl bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-white`}>
                  <PlatformFeatureIcon type={feature.icon} className={isFeatured ? "h-7 w-7" : "h-4 w-4"} />
                </div>
                <h3 className={`${isFeatured ? "text-2xl" : "text-base"} font-black text-secondary`}>{feature.title}</h3>
                <p className={`${isFeatured ? "mt-4 text-base leading-7 text-secondary/65" : "mt-2 text-sm leading-6 text-secondary/48"}`}>{feature.text}</p>
              </div>
              );
            })}
          </div>

          <div className="mt-12 grid gap-3 rounded-[2rem] border border-secondary/5 bg-white/60 p-5 md:grid-cols-3">
            {[
              "Built by educators and technologists",
              "Designed around real student learning",
              "Structured support that keeps students motivated",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-secondary/5 bg-white px-5 py-4 text-sm font-bold text-secondary/50">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary/70">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section aria-label="Learning method" className="relative w-full overflow-hidden bg-[#f2f7ff] px-4 py-28 md:px-10 md:py-32">
        <HomepageSectionTracker eventName="homepage_why_sciencedojo_visible" />
        <div className="mx-auto max-w-[1360px]">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-primary">Learning method</p>
            <h2 className="mt-5 text-4xl font-black tracking-tight text-secondary md:text-5xl">The <span className="text-primary">sciencedojo</span> Learning Method</h2>
            <p className="mt-6 text-lg leading-8 text-secondary/65">
              Students grow when practice is targeted, support adapts, and every lesson has a clear next step.
            </p>
          </div>

          <div className="relative mt-16">
            <div className="absolute left-[10%] right-[10%] top-[2.25rem] hidden h-0.5 rounded-full bg-gradient-to-r from-transparent via-primary/30 to-transparent lg:block"></div>
            <div className="grid gap-12 lg:grid-cols-4 lg:gap-6">
              {[
                {
                  title: "Targeted Practice",
                  text: "Focus revision on the topics that need attention now.",
                  stage: "Foundation",
                },
                {
                  title: "Adaptive Support",
                  text: "Adjust the pace and explanation style around each learner.",
                  stage: "Guided Practice",
                },
                {
                  title: "Tutor Guidance",
                  text: "Use expert feedback to turn confusion into clear next steps.",
                  stage: "Tutor Feedback",
                },
                {
                  title: "Confidence Through Structure",
                  text: "Build confidence through routine, feedback, and steady progress.",
                  stage: "Confidence",
                },
              ].map((step, index) => (
                <div key={step.title} className="group relative flex items-start gap-5 lg:flex-col lg:items-center lg:gap-0 lg:text-center">
                  {index < 3 && (
                    <div className="absolute -right-3 top-[2.25rem] z-20 hidden h-5 w-5 -translate-y-1/2 items-center justify-center lg:flex" aria-hidden="true">
                      <svg className="h-3.5 w-3.5 text-primary/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                  <div className="relative z-10 flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-full bg-white text-xl font-black text-primary shadow-[0_0_0_6px_rgba(0,102,255,0.08)] ring-1 ring-primary/20 lg:mb-6">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="flex-1 pt-2 lg:flex-none lg:pt-0">
                    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-primary/70">{step.stage}</p>
                    <h3 className="text-lg font-black text-secondary">{step.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-secondary/60">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 rounded-[2rem] border border-secondary/10 bg-white px-6 py-6 md:flex md:items-center md:justify-between md:gap-8">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">The sciencedojo rhythm</p>
              <p className="mt-2 text-lg font-black text-secondary">Foundation to growth to mastery, with tutor guidance at every step.</p>
            </div>
            <p className="mt-3 text-sm font-medium leading-6 text-secondary/45 md:mt-0 md:max-w-sm">
              Practice builds momentum. Lessons turn that momentum into clearer understanding.
            </p>
          </div>

          <div className="mt-8 rounded-[2rem] border border-white bg-white/80 p-5 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-5">
              {["Cambridge", "Edexcel", "IB", "AQA", "SQA"].map((curriculum) => (
                <div key={curriculum} className="rounded-2xl border border-secondary/10 bg-surface px-4 py-4 text-center text-sm font-black uppercase tracking-[0.2em] text-secondary/45 transition-colors hover:text-primary">
                  {curriculum}
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-3 text-sm font-bold text-secondary/65 md:grid-cols-4">
              {["Mentorship-led support", "Personalized tutoring", "International curriculum support", "Smart practice support"].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary"></span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Support parents can trust" className="relative w-full overflow-hidden bg-[#fffdf8] px-4 py-28 md:px-10 md:py-32">
        <div className="mx-auto grid max-w-[1360px] items-center gap-14 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative order-2 lg:order-1">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2.25rem] border border-secondary/10 bg-surface shadow-2xl shadow-primary/10">
              <Image
                src={homeImages.parentSupport.src}
                alt={homeImages.parentSupport.alt}
                fill
                sizes="(max-width: 1024px) 92vw, 42vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-secondary/35 via-transparent to-cyan-300/15"></div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-primary">Parent trust</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-secondary md:text-5xl">Support Parents Can Trust</h2>
            <p className="mt-5 text-lg leading-8 text-secondary/65">
              ScienceDojo helps families feel informed, reassured, and connected while their child learns online with structured tutor support.
            </p>
            <div className="mt-9 grid gap-3 sm:grid-cols-2">
              {["Clear Communication", "Visible Progress", "Structured Learning", "International Curricula"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-secondary/10 bg-white/70 px-5 py-4 text-sm font-black text-secondary shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:bg-white hover:shadow-lg">
                  <svg className="h-5 w-5 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Curriculum support" className="w-full bg-gradient-to-b from-surface to-white px-4 pb-12 pt-20 md:px-10">
        <div className="mx-auto max-w-[1360px]">
          <div className="grid gap-8 rounded-[2rem] border border-secondary/10 bg-white/80 p-6 shadow-sm backdrop-blur lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:p-8">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-primary">Curriculum support</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-secondary md:text-4xl">Support Across Learning Stages</h2>
              <p className="mt-4 max-w-2xl leading-7 text-secondary/65">
                From early foundations to advanced international pathways, sciencedojo helps families find structured tutor support for the right stage.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              {["Primary", "KS3", "GCSE", "IGCSE", "A-Level", "IB"].map((stage, index) => (
                <span
                  key={stage}
                  className={`${index % 2 === 0 ? "sd-float-soft" : "sd-float-soft-delayed"} rounded-full border border-secondary/15 bg-white px-7 py-4 text-sm font-black uppercase tracking-[0.14em] text-secondary/55 shadow-[0_12px_30px_rgba(0,26,68,0.10)] transition-all hover:border-primary/25 hover:bg-primary/5 hover:text-primary hover:shadow-[0_16px_36px_rgba(0,102,255,0.14)]`}
                >
                  {stage}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Directory Section */}
      <section id="directory" aria-label="Tutor marketplace" className="relative z-20 mx-auto w-full max-w-[1360px] bg-white px-4 pb-28 pt-10 md:px-10">
        <HomepageSectionTracker eventName="homepage_tutor_marketplace_visible" />
        <div className="mb-8 border-t border-secondary/5 pt-10">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-primary">Tutor marketplace</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-secondary md:text-5xl">Find the Right Tutor</h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-secondary/65">
              Connect with tutors who match your child&apos;s learning goals, curriculum, and learning style.
            </p>
          </div>
        </div>

        <SearchFilterBar />

        <div className="mb-6 mt-8 flex justify-between items-end">
          <h3 className="text-2xl font-bold text-secondary">
            {selectedSubject === "All" ? "All Tutors" : `${selectedSubject} Tutors`}
          </h3>
          <span className="text-sm font-medium text-secondary/60">
            Showing {tutors.length} {tutors.length === 1 ? 'tutor' : 'tutors'}
          </span>
        </div>

        {tutors.length > 0 ? (
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
            {tutors.map((tutor) => (
              <TutorCard key={tutor.id} tutor={tutor} currentUserRole={null} />
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
      <section id="how-it-works" aria-label="How ScienceDojo works" className="relative w-full overflow-hidden border-y border-secondary/5 bg-gradient-to-b from-surface to-white py-24 md:py-28">
        <div className="max-w-[1360px] mx-auto px-4 md:px-10">
          <div className="text-center mb-16">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-primary mb-4">The process</p>
            <h2 className="text-3xl md:text-5xl font-black text-secondary mb-6">How <span className="text-primary tracking-tight">sciencedojo</span> Works</h2>
            <p className="text-lg text-secondary/60 max-w-2xl mx-auto">A connected learning journey from targeted practice to confident progress.</p>
          </div>

          <div className="relative grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="absolute left-[12%] right-[12%] top-12 hidden h-px bg-gradient-to-r from-primary/10 via-primary/35 to-primary/10 md:block"></div>
            {[
              {
                type: "roadmap",
                number: "1",
                title: "Book Free Assessment",
                text: "Start with the student's curriculum, subject, and learning priorities.",
              },
              {
                type: "match",
                number: "2",
                title: "Match With Right Tutor",
                text: "Match support to the learner's goals, age, and academic pathway.",
              },
              {
                type: "structure",
                number: "3",
                title: "Receive Structured Lessons",
                text: "Join lessons inside ScienceDojo and use tutor feedback to build steadier habits.",
              },
              {
                type: "growth",
                number: "4",
                title: "Build Confidence & Results",
                text: "Move from foundation to growth to mastery with clear next steps.",
              },
            ].map((step) => (
              <div key={step.title} className="sd-fade-up group relative rounded-3xl border border-secondary/10 bg-white p-7 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/10">
                <span className="sd-path-dot absolute left-1/2 top-[2.8rem] z-20 hidden h-3 w-3 -translate-x-1/2 rounded-full border-2 border-white bg-primary shadow-lg shadow-primary/20 md:block"></span>
                <div className="relative">
                  <HomeHowItWorksIllustration type={step.type as "roadmap" | "match" | "structure" | "growth"} />
                </div>
                <div className="relative z-10 mx-auto mt-5 mb-6 flex h-14 w-14 items-center justify-center rounded-full border-4 border-primary/10 bg-primary text-xl font-black text-white shadow-sm">
                  {step.number}
                </div>
                <h3 className="text-xl font-black text-secondary mb-4">{step.title}</h3>
                <p className="text-sm leading-7 text-secondary/65">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEO Pathways Section */}
      <section aria-label="Popular tutoring paths" className="w-full border-y border-secondary/5 bg-white py-20">
        <div className="mx-auto max-w-[1360px] px-4 md:px-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-3 text-xs font-black uppercase tracking-[0.28em] text-primary">Find support faster</p>
              <h2 className="text-3xl font-black text-secondary md:text-4xl">Popular online tutoring paths</h2>
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
              ["Practice Dojo", "/ai-practice-studio"],
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
      <section id="pricing" aria-label="Pricing" className="w-full bg-[linear-gradient(180deg,#071a35_0%,#06172f_100%)] px-4 py-24 text-center md:px-10 md:py-28">
        <div className="mx-auto max-w-[1360px]">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-200/70 mb-4">How it works</p>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Flexible Learning Support</h2>
          <p className="text-lg text-white/65 max-w-2xl mx-auto mb-14 leading-8">Personalized support matched to your child&apos;s goals, curriculum, and pace, with clear pricing before families book.</p>

          <div className="bg-white/[0.06] text-left text-white rounded-[2rem] max-w-5xl mx-auto overflow-hidden shadow-2xl shadow-black/15 border border-white/10 flex flex-col md:flex-row">
            <div className="p-10 md:p-12 md:w-2/3">
              <h3 className="text-2xl font-bold mb-5">Structured Online Tutoring</h3>
              <p className="text-slate-300 mb-8 leading-relaxed">Start with a free assessment, then choose tutor support that fits your child&apos;s goals and learning stage. Rates are shown clearly before booking.</p>
              <div className="flex flex-col gap-4">
                {([
                  "Start with a free assessment",
                  "100% secure checkout",
                  "Cancel bookings up to 24 hours prior",
                  "Direct messaging with your tutor",
                ] as const).map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <svg className="w-5 h-5 shrink-0 text-cyan-300/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-medium text-slate-200">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary to-[#004db8] p-10 md:p-12 md:w-1/3 flex flex-col justify-center items-center text-center">
              <span className="text-cyan-100/90 font-semibold text-sm bg-white/10 px-4 py-1.5 rounded-full mb-5">Typical starting rate</span>
              <div className="flex items-baseline gap-1 mb-7">
                <span className="text-5xl font-black text-white">£45</span>
                <span className="text-xl text-white/70">/hr</span>
              </div>
              <BookAssessmentLink
                source="homepage_pricing"
                className="w-full bg-white text-primary font-bold py-3.5 rounded-xl hover:bg-slate-50 transition-colors flex justify-center"
              >
                Book Free Assessment
              </BookAssessmentLink>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Family testimonials" className="relative w-full overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_48%,#fffefe_100%)] px-4 py-24 md:px-10 md:py-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_24%,rgba(0,102,255,0.065),transparent_31%),radial-gradient(circle_at_78%_40%,rgba(0,245,212,0.05),transparent_29%)]"></div>
        <div className="mx-auto max-w-[1360px]">
          <div className="mx-auto max-w-4xl text-center">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.28em] text-primary">Learning journeys</p>
            <h2 className="text-3xl font-black leading-tight text-secondary md:text-5xl md:leading-tight xl:text-[3.35rem]">What Families Say About <span className="text-primary">sciencedojo</span></h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-secondary/65">
              Real messages from students and parents supported through structured tutoring.
            </p>
          </div>
          <FeaturedTestimonialCard />

          <div className="mt-14">
            <div className="mb-7 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">Student and parent messages</p>
                <h3 className="mt-2 text-2xl font-black text-secondary">Real learning stories</h3>
              </div>
            </div>

            {/* sm+: unified 3-col grid — all 6 cards as peers, clean 2×3 layout */}
            <div className="hidden sm:grid sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:items-start">
              <AchievementStoryCard />
              {REAL_TESTIMONIALS.map((story, index) => (
                <TestimonialCard key={index} story={story} />
              ))}
            </div>

            {/* Mobile: full-width achievement card + horizontal scroll for testimonials */}
            <div className="flex flex-col gap-5 sm:hidden">
              <AchievementStoryCard />
              <div className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {REAL_TESTIMONIALS.map((story, index) => (
                  <div key={index} className="w-[82vw] shrink-0 snap-start">
                    <TestimonialCard story={story} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Frequently asked questions" className="w-full bg-gradient-to-b from-surface to-white px-4 py-24 md:px-10 md:py-28">
        <div className="mx-auto max-w-[1040px]">
          <div className="text-center">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.28em] text-primary">FAQ</p>
            <h2 className="text-3xl font-black text-secondary md:text-5xl">Online tutoring questions</h2>
          </div>
          <div className="mt-12 grid gap-5 text-left">
            {homeFaqs.map((faq, index) => (
              <details key={faq.question} className={`group rounded-3xl border p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg open:shadow-xl md:p-7 ${index === 0 ? "border-primary/20 bg-white shadow-primary/10" : "border-secondary/10 bg-surface"}`} open={index === 0}>
                <summary className="flex cursor-pointer list-none gap-4">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${index === 0 ? "bg-primary text-white" : "bg-primary/10 text-primary"}`}>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9.228a4 4 0 117.544 1.878c-.88.418-1.522.95-1.852 1.664M12 17h.01" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-secondary">{faq.question}</h3>
                  </div>
                  <span className="text-primary transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                </summary>
                <p className="mt-4 leading-7 text-secondary/65 sm:ml-[60px]">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section aria-label="Get started with ScienceDojo" className="sd-ambient-gradient w-full overflow-hidden bg-[linear-gradient(135deg,#071a35_0%,#0a4d95_48%,#0066ff_78%,#073f7b_100%)] px-4 py-24 md:px-10 md:py-28">
        <div className="relative mx-auto max-w-[1120px] text-center">
          <div className="pointer-events-none absolute inset-0 rounded-[3rem] bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.14),transparent_42%)]"></div>
          <div className="relative">
          <div className="mb-7 flex flex-wrap justify-center gap-3">
            {["For Parents", "For Students"].map((label) => (
              <div key={label} className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white/75 backdrop-blur">
                {label}
              </div>
            ))}
          </div>
          <h2 className="text-4xl font-black tracking-tight text-white md:text-6xl">Expert Online Tutoring That Feels Personal</h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/70">
            From Practice Dojo knowledge checks to expert online tutoring, ScienceDojo supports modern learners through structured, curriculum-aligned learning.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
            <BookAssessmentLink
              source="homepage_final_cta"
              className="rounded-2xl bg-white px-8 py-4 text-sm font-black uppercase tracking-[0.14em] text-primary shadow-xl shadow-white/10 transition-all hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-2xl"
            >
              Request Free Assessment
            </BookAssessmentLink>
            <AiPracticeStudioCtaLink
              href="/ai-practice-studio"
              cta="final_cta_try_tool"
              source="homepage_final_cta"
              className="rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-sm font-black uppercase tracking-[0.14em] text-white backdrop-blur transition-all hover:bg-white/10"
            >
              Explore Practice Dojo
            </AiPracticeStudioCtaLink>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-5">
            {["Free assessment", "Online tutoring", "Curriculum-aware support", "Parent updates", "Practice Dojo"].map((item) => (
              <div key={item} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-white/65">
                {item}
              </div>
            ))}
          </div>
          </div>
        </div>
      </section>

    </div>
  );
}

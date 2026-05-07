import { getTutors } from "@/lib/supabase-queries";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import type { ReactNode } from "react";
import SearchFilterBar from "@/components/SearchFilterBar";
import TutorCard from "@/components/TutorCard";
import Link from "next/link";
import HomeHowItWorksIllustration from "@/components/HomeHowItWorksIllustration";
import JsonLd from "@/components/JsonLd";
import AiPracticeStudioCtaLink from "@/components/analytics/AiPracticeStudioCtaLink";
import BookAssessmentLink from "@/components/analytics/BookAssessmentLink";
import HomepageSectionTracker from "@/components/analytics/HomepageSectionTracker";
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

function PlatformFeatureIcon({ type }: { type: string }) {
  const paths: Record<string, ReactNode> = {
    video: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 6h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />,
    dashboard: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5h7v7H4V5zm9 0h7v4h-7V5zm0 6h7v8h-7v-8zM4 14h7v5H4v-5z" />,
    tasks: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11l2 2l4-4M5 7h.01M5 13h.01M5 19h.01M8 7h11M8 13h11M8 19h11" />,
    spark: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 3l1.8 5.2L20 10l-5.2 1.8L13 17l-1.8-5.2L6 10l5.2-1.8L13 3zM5 15l.9 2.6L8.5 18.5l-2.6.9L5 22l-.9-2.6l-2.6-.9l2.6-.9L5 15z" />,
    chart: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19V9m5 10V5m5 14v-7m5 7H3" />,
    calendar: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M5 11h14M6 5h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2z" />,
    message: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h8M8 14h5m8-2a8 8 0 11-3.2-6.4L21 5l-1.4 3.2A7.96 7.96 0 0121 12z" />,
    parent: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11a4 4 0 10-8 0m8 0a4 4 0 018 0M8 11a4 4 0 00-8 0m4 5c0-2.2 3.6-4 8-4s8 1.8 8 4v2H4v-2z" />,
  };

  return (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      {paths[type] || paths.dashboard}
    </svg>
  );
}

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
      <section className="relative flex min-h-[84vh] w-full items-center overflow-hidden bg-[linear-gradient(135deg,#06172f_0%,#073f7b_52%,#0b64bd_100%)] px-4 py-28 text-center md:px-10 lg:py-36">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_22%,rgba(0,245,212,0.14),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent_42%)]"></div>

        <div className="relative z-10 mx-auto grid w-full max-w-[1360px] items-center gap-16 lg:grid-cols-[0.88fr_1.12fr]">
          <div className="sd-fade-up flex flex-col items-center text-center lg:items-start lg:text-left">
          <div className="flex items-center gap-2 mb-8 bg-white/5 backdrop-blur-sm border border-white/10 px-4 py-1.5 rounded-full shadow-inner animate-in fade-in slide-in-from-top-4 duration-1000">
             <span className="flex h-1.5 w-1.5 rounded-full bg-green-400"></span>
             <span className="text-[10px] uppercase font-black tracking-[0.3em] text-white/50">Supporting students across British and international curricula</span>
          </div>

          <h1 className="mb-10 text-6xl font-bold leading-[1.02] tracking-tight text-white md:text-[5.25rem]">
            Expert tutoring supported by <span className="text-cyan-200/90 italic">smarter</span> learning tools
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mb-5 font-medium leading-relaxed">
            The <span className="font-bold text-white lowercase">sciencedojo</span> tutoring experience combines carefully reviewed tutors with modern tools that make online learning clearer and more connected.
          </p>
          <p className="mb-12 text-base font-semibold leading-7 text-white/80">
            Distance is just a number. Learning is limitless when students have the right support.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
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

          <div className="sd-fade-up relative w-full max-w-2xl justify-self-center lg:max-w-none lg:-mr-10">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2.25rem] border border-white/15 bg-white/10 shadow-2xl shadow-black/25">
              <Image
                src={homeImages.heroStem.src}
                alt={homeImages.heroStem.alt}
                fill
                priority
                sizes="(max-width: 1024px) 92vw, 48vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-secondary/65 via-primary/10 to-cyan-300/15"></div>
            </div>
            <div className="absolute -bottom-5 left-4 right-4 grid gap-3 sm:grid-cols-2 lg:left-8 lg:right-auto lg:w-[82%]">
              {["Practice Dojo", "IB Physics", "Weekly Progress", "Parent Updates", "Live Online Lessons"].map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/92 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-secondary shadow-lg backdrop-blur">
                  <svg className="h-3.5 w-3.5 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="relative z-10 mx-auto mt-14 grid w-full max-w-[860px] grid-cols-2 gap-3 px-4 text-center sm:grid-cols-5 lg:absolute lg:bottom-8 lg:left-1/2 lg:-translate-x-1/2">
          {["Cambridge", "Edexcel", "IB", "GCSE", "Trusted by families"].map((item) => (
            <div key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/60 backdrop-blur">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="w-full border-b border-secondary/10 bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)] px-4 py-32 md:px-10">
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
                className="inline-flex justify-center rounded-2xl border border-secondary/10 bg-white px-7 py-4 text-sm font-black uppercase tracking-[0.14em] text-secondary transition-colors hover:border-primary/30 hover:text-primary"
              >
                Request Free Assessment
              </AiPracticeStudioCtaLink>
            </div>
          </div>
          <div className="relative z-10 overflow-hidden rounded-[2.25rem] border border-secondary/10 bg-[#f8fbff] p-5 shadow-2xl shadow-secondary/10 transition-all group-hover:border-primary/20 lg:p-6">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(236,247,255,0.74))]"></div>
            <div className="sd-float-soft absolute right-8 top-28 z-10 hidden rounded-2xl border border-primary/10 bg-white/90 px-4 py-3 shadow-xl shadow-primary/10 backdrop-blur md:block">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-secondary/40">Smart Recommendation</p>
              <p className="mt-1 text-sm font-black text-secondary">Practise vectors next</p>
            </div>
            <div className="sd-float-soft-delayed absolute bottom-8 left-8 z-10 hidden rounded-2xl border border-primary/10 bg-secondary px-4 py-3 text-white shadow-xl shadow-secondary/20 backdrop-blur md:block">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/45">Completion</p>
              <p className="mt-1 text-2xl font-black">78%</p>
            </div>
            <div className="relative rounded-[1.75rem] border border-secondary/10 bg-white p-5 shadow-xl shadow-secondary/5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Practice Dojo</p>
                  <h3 className="mt-2 text-2xl font-black text-secondary">Knowledge check</h3>
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
                        <p className="mt-2 text-4xl font-black">7 days</p>
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
                      {[35, 48, 44, 62, 70, 76, 88].map((height, index) => (
                        <div key={index} className="flex-1 rounded-t-lg bg-primary/15" style={{ height: `${height}%` }}>
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
                  { label: "Weak Topics", value: "Trigonometry", progress: 42 },
                  { label: "Strength Areas", value: "Number", progress: 86 },
                  { label: "Tutor Feedback", value: "Clear next step", progress: 72 },
                  { label: "Learning Goals", value: "Exam confidence", progress: 64 },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-secondary/10 bg-white p-4 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-secondary/40">{item.label}</p>
                    <p className="mt-2 text-sm font-black text-secondary">{item.value}</p>
                    <div className="mt-3 h-2 rounded-full bg-surface">
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${item.progress}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full border-b border-secondary/10 bg-white px-4 py-32 md:px-10">
        <div className="mx-auto max-w-[1360px]">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-primary">Learning support system</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-secondary md:text-5xl">The ScienceDojo Learning System</h2>
            <p className="mt-5 text-lg leading-8 text-secondary/65">
              Everything students and parents need around booked tutoring lessons: classroom, dashboard, tasks, progress, and parent visibility.
            </p>
          </div>

          <div className="mt-16 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {platformFeatures.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-[2rem] border border-secondary/10 bg-white p-7 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl hover:shadow-primary/10"
              >
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-white">
                  <PlatformFeatureIcon type={feature.icon} />
                </div>
                <h3 className="text-lg font-black text-secondary">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-secondary/65">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative w-full overflow-hidden bg-gradient-to-b from-white via-[#f7fbff] to-surface px-4 py-28 md:px-10">
        <HomepageSectionTracker eventName="homepage_why_sciencedojo_visible" />
        <div className="mx-auto max-w-[1360px]">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-primary">Learning method</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-secondary md:text-5xl">The ScienceDojo Learning Method</h2>
            <p className="mt-5 text-lg leading-8 text-secondary/65">
              Students grow when practice is targeted, support adapts, and every lesson has a clear next step.
            </p>
          </div>

          <div className="relative mt-16 grid gap-8 md:grid-cols-2 xl:grid-cols-4">
            <div className="absolute left-[8%] right-[8%] top-16 hidden h-px bg-gradient-to-r from-primary/0 via-primary/25 to-primary/0 xl:block"></div>
            {[
              {
                title: "Targeted Practice",
                text: "Focus revision on the topics that need attention now.",
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                ),
              },
              {
                title: "Adaptive Support",
                text: "Adjust the pace and explanation style around each learner.",
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422A12.083 12.083 0 0118 16.5c0 1.657-2.686 3-6 3s-6-1.343-6-3c0-1.994.32-3.938.917-5.722L12 14z" />
                ),
              },
              {
                title: "Tutor Guidance",
                text: "Use expert feedback to turn confusion into clear next steps.",
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6m4 6V7m4 10v-4M5 19h14" />
                ),
              },
              {
                title: "Confidence Through Structure",
                text: "Build confidence through routine, feedback, and steady progress.",
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c2.5-2.4 4-5.4 4-9s-1.5-6.6-4-9m0 18c-2.5-2.4-4-5.4-4-9s1.5-6.6 4-9" />
                ),
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group relative rounded-[2rem] border border-secondary/10 bg-white p-10 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/25 hover:shadow-2xl hover:shadow-primary/10"
              >
                <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary/20">
                  <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {feature.icon}
                  </svg>
                </div>
                <h3 className="text-xl font-black text-secondary">{feature.title}</h3>
                <p className="mt-4 leading-7 text-secondary/65">{feature.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-[2rem] border border-secondary/10 bg-white/80 p-5 shadow-sm backdrop-blur">
            <div className="grid gap-3 sm:grid-cols-5">
              {["Cambridge", "Edexcel", "IB", "AQA", "SQA"].map((curriculum) => (
                <div key={curriculum} className="rounded-2xl border border-secondary/10 bg-surface px-4 py-4 text-center text-sm font-black uppercase tracking-[0.2em] text-secondary/45 transition-colors hover:text-primary">
                  {curriculum}
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-3 text-sm font-bold text-secondary/65 md:grid-cols-4">
              {["Structured learning plans", "Personalized tutoring", "International curriculum support", "Smart practice support"].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary"></span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative w-full overflow-hidden bg-[#fffdf8] px-4 py-32 md:px-10">
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
              ScienceDojo helps families understand where students need support and connects them with structured online learning.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {["Weekly Updates", "Progress Tracking", "Structured Learning", "International Curricula"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-secondary/10 bg-surface px-6 py-5 text-sm font-black text-secondary shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:bg-white hover:shadow-lg">
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

      <section className="w-full bg-gradient-to-b from-surface to-white px-4 py-20 md:px-10">
        <div className="mx-auto max-w-[1360px]">
          <div className="mb-10 max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-primary">Curriculum support</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-secondary md:text-4xl">Support Across Learning Stages</h2>
            <p className="mt-4 leading-7 text-secondary/65">
              ScienceDojo supports learners from early foundations through GCSE, IGCSE, IB, and A-Level pathways.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {[
              {
                title: "Primary and lower secondary",
                text: "Build strong foundations early.",
                image: homeImages.primaryLearner,
              },
              {
                title: "GCSE, IGCSE, IB and A-Level",
                text: "Structured support for GCSE, IGCSE, IB, and A-Level learners.",
                image: homeImages.teenStudy,
              },
            ].map((item) => (
              <div key={item.title} className="group grid overflow-hidden rounded-3xl border border-secondary/10 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg sm:grid-cols-[0.62fr_1.38fr]">
                <div className="relative aspect-[16/10] sm:aspect-auto">
                  <Image
                    src={item.image.src}
                    alt={item.image.alt}
                    fill
                    sizes="(max-width: 768px) 92vw, 28vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-secondary/30 to-transparent"></div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-black text-secondary">{item.title}</h3>
                  <p className="mt-3 text-sm font-bold leading-6 text-secondary/65">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Directory Section */}
      <section id="directory" className="w-full max-w-[1360px] mx-auto border-t border-secondary/10 px-4 md:px-10 py-32 relative z-20 bg-white">
        <HomepageSectionTracker eventName="homepage_tutor_marketplace_visible" />
        <div className="mb-8 grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-primary">Tutor marketplace</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-secondary md:text-5xl">Find the Right Tutor</h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-secondary/65">
              Connect with tutors who match your child&apos;s learning goals, curriculum, and learning style.
            </p>
          </div>
          <div className="relative min-h-[180px] overflow-hidden rounded-[2rem] border border-primary/10 bg-gradient-to-br from-surface via-white to-[#eef7ff] p-6 shadow-lg shadow-primary/5">
            <div className="relative flex flex-wrap gap-3">
              {["GCSE Maths", "IB Physics", "Cambridge Science", "Primary Support", "Practice Dojo", "Online Tutoring", "Computer Science", "A-Level Chemistry"].map((chip, index) => (
                <div
                  key={chip}
                  className={`${index % 2 === 0 ? "sd-float-soft" : "sd-float-soft-delayed"} rounded-full border border-primary/10 bg-white/90 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-secondary shadow-sm backdrop-blur`}
                >
                  {chip}
                </div>
              ))}
            </div>
            <div className="relative mt-7 flex items-center gap-3">
              {["SD", "IB", "GC"].map((avatar) => (
                <div key={avatar} className="-ml-1 flex h-11 w-11 first:ml-0 items-center justify-center rounded-full border-2 border-white bg-primary/10 text-xs font-black text-primary shadow-sm">
                  {avatar}
                </div>
              ))}
              <p className="text-sm font-bold leading-6 text-secondary/60">Search by subject, curriculum, and learning goal.</p>
            </div>
          </div>
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
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
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
      <section id="how-it-works" className="relative w-full overflow-hidden border-y border-secondary/10 bg-gradient-to-b from-surface to-white py-32">
        <div className="max-w-[1360px] mx-auto px-4 md:px-10">
          <div className="text-center mb-16">
            <span className="text-primary font-bold tracking-wider text-sm uppercase mb-2 block">The Process</span>
            <h2 className="text-3xl md:text-5xl font-bold text-secondary mb-6">How <span className="text-primary tracking-tight">sciencedojo</span> Works</h2>
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
      <section className="w-full border-y border-secondary/10 bg-white py-24">
        <div className="mx-auto max-w-[1360px] px-4 md:px-10">
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
      <section id="pricing" className="w-full bg-secondary px-4 py-28 text-center md:px-10">
        <div className="mx-auto max-w-[1360px]">
        <span className="text-cyan-200 font-bold tracking-wider text-sm uppercase mb-2 block">Transparent Costs</span>
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Flexible Learning Support</h2>
        <p className="text-lg text-white/65 max-w-2xl mx-auto mb-16">Personalized support matched to your child&apos;s goals and curriculum, without monthly subscriptions or hidden platform percentage cuts.</p>

        <div className="bg-white/5 text-left text-white rounded-3xl max-w-5xl mx-auto overflow-hidden shadow-2xl shadow-black/20 flex flex-col border border-white/10 md:flex-row">
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

      <section className="relative w-full overflow-hidden bg-white px-4 py-32 md:px-10">
        <div className="mx-auto max-w-[1360px]">
          <div className="mx-auto max-w-3xl text-center">
            <span className="mb-2 block text-sm font-bold uppercase tracking-wider text-primary">Learning journeys</span>
            <h2 className="text-3xl font-bold text-secondary md:text-5xl">Success Stories</h2>
            <p className="mt-5 text-lg leading-8 text-secondary/65">
              ScienceDojo is designed for the moments families care about most: confidence, consistency, and clearer learning support.
            </p>
          </div>
          <div className="mt-12 grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="relative min-h-[360px] overflow-hidden rounded-[2rem] border border-secondary/10 bg-surface shadow-xl">
              <Image
                src={homeImages.happyMoment.src}
                alt={homeImages.happyMoment.alt}
                fill
                sizes="(max-width: 1024px) 92vw, 52vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-secondary/65 via-secondary/20 to-transparent"></div>
              <div className="absolute bottom-8 left-8 max-w-sm text-white">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-100">Warm support, clearer progress</p>
                <h3 className="mt-4 text-3xl font-black">Learning feels better when support is structured.</h3>
              </div>
            </div>
            <div className="relative z-10 grid gap-5 self-center lg:-ml-16">
                {[
                  {
                    quote: "The structure helped our child know what to practise each week.",
                    subject: "GCSE Maths",
                    improvement: "Improved confidence with exam-style questions",
                    year: "Year 10",
                  },
                  {
                    quote: "The lessons connected difficult topics to clearer steps.",
                    subject: "IB Physics",
                    improvement: "More consistent independent revision",
                    year: "Year 12",
                  },
                  {
                    quote: "We finally had a clearer picture of what support was needed.",
                    subject: "Parent support",
                    improvement: "Better routine and learning visibility",
                    year: "Family update",
                  },
                ].map((story) => (
                  <div key={story.subject} className="rounded-3xl border border-secondary/10 bg-white/95 p-7 shadow-xl shadow-secondary/10 backdrop-blur transition-all hover:-translate-y-1 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/10">
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <div className="flex gap-1 text-amber-400" aria-label="5 star rating">
                        {[0, 1, 2, 3, 4].map((star) => (
                          <svg key={star} className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-primary">Verified Parent</span>
                    </div>
                    <p className="text-lg font-black leading-7 text-secondary">&ldquo;{story.quote}&rdquo;</p>
                    <div className="mt-5 grid gap-2 text-sm font-bold text-secondary/60 sm:grid-cols-3">
                      <span>{story.subject}</span>
                      <span>{story.improvement}</span>
                      <span>{story.year}</span>
                    </div>
                    {/* TODO: Replace placeholder-safe story cards with real parent/student testimonials once approved. */}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-gradient-to-b from-surface to-white px-4 py-32 md:px-10">
        <div className="mx-auto max-w-[1040px]">
          <div className="text-center">
            <span className="mb-2 block text-sm font-bold uppercase tracking-wider text-primary">FAQ</span>
            <h2 className="text-3xl font-bold text-secondary md:text-5xl">Online tutoring questions</h2>
          </div>
          <div className="mt-12 grid gap-5 text-left">
            {homeFaqs.map((faq, index) => (
              <details key={faq.question} className={`group rounded-3xl border p-7 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg open:shadow-xl ${index === 0 ? "border-primary/20 bg-white shadow-primary/10" : "border-secondary/10 bg-surface"}`} open={index === 0}>
                <summary className="flex cursor-pointer list-none gap-4">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${index === 0 ? "bg-primary text-white" : "bg-primary/10 text-primary"}`}>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9.228a4 4 0 117.544 1.878c-.88.418-1.522.95-1.852 1.664M12 17h.01" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-secondary">{faq.question}</h3>
                  </div>
                  <span className="text-primary transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="ml-[60px] mt-4 leading-7 text-secondary/65">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full bg-[linear-gradient(135deg,#071a35_0%,#0a4d95_58%,#0066ff_100%)] px-4 py-32 md:px-10">
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
          <h2 className="text-4xl font-black tracking-tight text-white md:text-6xl">Learn With Confidence</h2>
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
              Try Practice Dojo
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

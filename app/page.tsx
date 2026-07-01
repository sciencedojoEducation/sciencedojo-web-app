import { getTutors } from "@/lib/supabase-queries";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import SearchFilterBar from "@/components/SearchFilterBar";
import TutorCard from "@/components/TutorCard";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import AiPracticeStudioCtaLink from "@/components/analytics/AiPracticeStudioCtaLink";
import BookAssessmentLink from "@/components/analytics/BookAssessmentLink";
import HomepageSectionTracker from "@/components/analytics/HomepageSectionTracker";
import HeroIntroMedia from "@/components/HeroIntroMedia";
import { AchievementStoryCard, FeaturedTestimonialCard, REAL_TESTIMONIALS, TestimonialCard } from "@/components/Testimonials";
import { homeImages } from "@/lib/homeImages";
import { localBusinessJsonLd, organizationJsonLd } from "@/lib/seo";
import { getFeatureFlagMap } from "@/lib/feature-flags";

const heroPills = ["GCSE", "IGCSE", "IB", "A-Level", "STEM confidence"] as const;

const problemPoints = [
  {
    title: "Working harder is not always the answer",
    text: "Many students revise for longer without knowing which gaps are actually holding them back.",
  },
  {
    title: "Confidence drops quietly",
    text: "A capable student can start avoiding questions when lessons move faster than their understanding.",
  },
  {
    title: "Passive revision hides weak areas",
    text: "Reading notes can feel productive, but exams expose whether the idea can be applied under pressure.",
  },
  {
    title: "Panic appears at the worst moment",
    text: "When learning is unstructured, small gaps become stress before tests, mocks, and final exams.",
  },
];

const methodStages = [
  {
    number: "01",
    icon: "diagnose",
    title: "Diagnose",
    meaning: "Find the gap",
    text: "Identify the concepts, exam skills, and confidence gaps behind the grade.",
  },
  {
    number: "02",
    icon: "understand",
    title: "Understand",
    meaning: "Make it make sense",
    text: "Use clear tutoring to rebuild the idea until it feels logical, not memorised.",
  },
  {
    number: "03",
    icon: "practice",
    title: "Practice",
    meaning: "Build the skill",
    text: "Strengthen weak topics with targeted questions and structured repetition.",
  },
  {
    number: "04",
    icon: "apply",
    title: "Apply",
    meaning: "Use it independently",
    text: "Move from topic knowledge into exam-style reasoning, working, and explanations.",
  },
  {
    number: "05",
    icon: "confidence",
    title: "Build Confidence",
    meaning: "Create momentum",
    text: "Create steady learning momentum through tutor feedback, Missions, and visible next steps.",
  },
];

const learningJourneyStages = [
  {
    number: "01",
    icon: "lesson",
    title: "Tutor Lesson",
    text: "Learn with an expert tutor.",
  },
  {
    number: "02",
    icon: "record",
    title: "Learning Record",
    text: "Capture what was covered and what matters next.",
  },
  {
    number: "03",
    icon: "practice",
    title: "Practice",
    text: "Strengthen understanding through structured practice.",
  },
  {
    number: "04",
    icon: "mission",
    title: "Mission",
    text: "Follow personalised next steps.",
  },
  {
    number: "05",
    icon: "visibility",
    title: "Parent Visibility",
    text: "Understand progress without chasing updates.",
  },
  {
    number: "06",
    icon: "growth",
    title: "Build Confidence",
    text: "Confidence grows through visible progress.",
  },
];

const missionFeatures = [
  "Built from lesson notes and class records",
  "Personalized around each student's learning goals",
  "Daily, weekly, and monthly progress pathways",
  "Tutor-supported practice between lessons",
];

const parentVisibilityItems = [
  "Lesson summaries after tutoring sessions",
  "Homework and practice visibility",
  "Tutor recommendations and next steps",
  "Progress signals families can understand",
];

function MethodStageIllustration({ icon }: { icon: string }) {
  const stroke = "#063d8f";
  const blue = "#0066ff";
  const paleBlue = "#dbeafe";

  return (
    <svg viewBox="0 0 180 150" className="h-36 w-full max-w-[13.5rem]" fill="none" aria-hidden="true">
      <circle cx="90" cy="78" r="54" fill="#eaf3ff" />
      <circle cx="47" cy="61" r="2" fill="#9bc7ff" />
      <circle cx="132" cy="45" r="2" fill="#9bc7ff" />
      <path d="M40 97h9M132 102h9M145 76l8-3M31 77l-8-3" stroke="#b8d8ff" strokeWidth="3" strokeLinecap="round" />
      {icon === "diagnose" && (
        <>
          <rect x="46" y="43" width="59" height="78" rx="5" fill="white" stroke={stroke} strokeWidth="4" />
          <rect x="62" y="34" width="35" height="18" rx="5" fill={blue} stroke={stroke} strokeWidth="4" />
          <path d="M67 42h25" stroke="white" strokeWidth="4" strokeLinecap="round" />
          <path d="M61 66l6 6 12-14M61 86l6 6 12-14M61 106l6 6 12-14" stroke={blue} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M88 67h24M88 87h21M88 107h24" stroke="#9bc7ff" strokeWidth="4" strokeLinecap="round" />
          <circle cx="109" cy="91" r="26" fill="#d9ecff" fillOpacity=".82" stroke={stroke} strokeWidth="4" />
          <circle cx="109" cy="91" r="18" stroke="white" strokeWidth="5" />
          <path d="M127 110l25 25" stroke={stroke} strokeWidth="8" strokeLinecap="round" />
          <path d="M132 115l20 20" stroke={blue} strokeWidth="5" strokeLinecap="round" />
          <path d="M117 42c9 4 14 11 14 20 0 10-5 17-14 22M124 38c12 6 19 14 19 25 0 12-7 22-19 28" stroke="#9bc7ff" strokeWidth="3" strokeLinecap="round" />
        </>
      )}
      {icon === "understand" && (
        <>
          <circle cx="90" cy="76" r="30" fill="white" stroke={blue} strokeWidth="4" />
          <path d="M90 51v-10M114 61l8-7M123 81h11M66 61l-8-7M57 81H46" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
          <path d="M79 79c0-7 5-13 12-13s12 6 12 13c0 5-3 9-7 11v9H85v-9c-4-2-6-6-6-11Z" fill={paleBlue} stroke={blue} strokeWidth="4" />
          <path d="M85 110h12M84 99h14" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
          <circle cx="45" cy="112" r="12" fill="white" stroke={stroke} strokeWidth="4" />
          <circle cx="135" cy="111" r="12" fill="white" stroke={stroke} strokeWidth="4" />
          <circle cx="90" cy="124" r="12" fill="white" stroke={stroke} strokeWidth="4" />
          <path d="M57 107l21-16M123 106l-20-15M91 112v-9" stroke={blue} strokeWidth="4" strokeLinecap="round" />
          <path d="M41 112h8M131 111h8M86 124h8" stroke="#9bc7ff" strokeWidth="3" strokeLinecap="round" />
        </>
      )}
      {icon === "practice" && (
        <>
          <path d="M54 42l74-10a6 6 0 0 1 7 5l11 76a6 6 0 0 1-5 7l-74 10a6 6 0 0 1-7-5L49 49a6 6 0 0 1 5-7Z" fill="white" stroke={stroke} strokeWidth="4" />
          <path d="M48 61l13-2M51 78l13-2M53 95l13-2M56 112l13-2" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
          <path d="M78 59l38-5M81 77l43-6M84 95l26-4M82 111l44-6" stroke="#b4d4ff" strokeWidth="4" strokeLinecap="round" />
          <path d="M82 88l8-1M99 85l8-1" stroke={blue} strokeWidth="4" strokeLinecap="round" />
          <path d="M91 79l8 14M104 77l6 14M114 86l9-1" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
          <path d="M131 79l16 9-26 47-18 7 2-19 26-44Z" fill={blue} stroke={stroke} strokeWidth="4" strokeLinejoin="round" />
          <path d="M105 123l18 10M137 90l-17-10" stroke="white" strokeWidth="4" strokeLinecap="round" />
        </>
      )}
      {icon === "apply" && (
        <>
          <circle cx="77" cy="74" r="45" fill="#dcecff" stroke={stroke} strokeWidth="4" />
          <circle cx="77" cy="74" r="31" fill="white" stroke={blue} strokeWidth="10" />
          <circle cx="77" cy="74" r="12" fill={blue} />
          <path d="M84 69l56-42v22l-39 31" fill={blue} />
          <path d="M84 69l56-42v22l-39 31" stroke={stroke} strokeWidth="4" strokeLinejoin="round" />
          <path d="M102 80l26-19" stroke="white" strokeWidth="4" strokeLinecap="round" />
          <path d="M120 89l38 9-10 49-40-8 10-50Z" fill="white" stroke={stroke} strokeWidth="4" />
          <path d="M126 107l6 6 12-14M124 126l6 6 12-14" stroke={blue} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M147 109h13M145 128h10" stroke="#9bc7ff" strokeWidth="4" strokeLinecap="round" />
        </>
      )}
      {icon === "confidence" && (
        <>
          <path d="M35 113c33-8 58-26 77-54" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
          <path d="M104 62l11-14 3 18" stroke={stroke} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="38" y="112" width="18" height="18" fill={blue} stroke={stroke} strokeWidth="4" />
          <rect x="66" y="101" width="18" height="29" fill={blue} stroke={stroke} strokeWidth="4" />
          <rect x="94" y="88" width="18" height="42" fill={blue} stroke={stroke} strokeWidth="4" />
          <rect x="122" y="61" width="18" height="69" fill={blue} stroke={stroke} strokeWidth="4" />
          <path d="M140 31v101M140 33l28 9-28 11" stroke={stroke} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="149" cy="119" r="27" fill="white" stroke={stroke} strokeWidth="4" />
          <path d="M134 120l10 10 22-24" stroke={blue} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M130 137c8 5 18 7 29 4" stroke="#9bc7ff" strokeWidth="4" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

function LearningJourneyIllustration({ icon }: { icon: string }) {
  const stroke = "#063d8f";
  const blue = "#0066ff";
  const paleBlue = "#eaf3ff";

  return (
    <svg viewBox="0 0 180 140" className="h-24 w-full max-w-[10rem]" fill="none" aria-hidden="true">
      <circle cx="90" cy="72" r="46" fill={paleBlue} />
      <path d="M38 96h8M134 42h8M139 91h9M43 47l-6-5M131 109l6 5" stroke="#b8d8ff" strokeWidth="3" strokeLinecap="round" />
      {icon === "lesson" && (
        <>
          <rect x="71" y="34" width="62" height="46" rx="7" fill="white" stroke={stroke} strokeWidth="4" />
          <path d="M84 49h32M84 62h23" stroke="#9bc7ff" strokeWidth="4" strokeLinecap="round" />
          <circle cx="56" cy="76" r="14" fill="white" stroke={stroke} strokeWidth="4" />
          <path d="M36 112c4-16 15-24 20-24s16 8 20 24" fill="white" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
          <circle cx="113" cy="88" r="12" fill="white" stroke={stroke} strokeWidth="4" />
          <path d="M94 118c4-13 14-20 19-20s15 7 19 20" fill="white" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
          <path d="M76 84l24-16" stroke={blue} strokeWidth="5" strokeLinecap="round" />
        </>
      )}
      {icon === "record" && (
        <>
          <rect x="53" y="30" width="75" height="89" rx="8" fill="white" stroke={stroke} strokeWidth="4" />
          <rect x="73" y="23" width="35" height="17" rx="5" fill={blue} stroke={stroke} strokeWidth="4" />
          <path d="M68 58h44M68 74h32M68 90h41" stroke="#9bc7ff" strokeWidth="4" strokeLinecap="round" />
          <path d="M67 108l7 7 15-18" stroke={blue} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M99 108h17" stroke="#9bc7ff" strokeWidth="4" strokeLinecap="round" />
        </>
      )}
      {icon === "practice" && (
        <>
          <path d="M55 34l68-8a6 6 0 0 1 7 5l9 71a6 6 0 0 1-5 7l-68 8a6 6 0 0 1-7-5l-9-71a6 6 0 0 1 5-7Z" fill="white" stroke={stroke} strokeWidth="4" />
          <path d="M69 55l41-5M72 73l45-5M74 91l26-3" stroke="#9bc7ff" strokeWidth="4" strokeLinecap="round" />
          <path d="M70 93l8-1M88 90l8-1M80 85l7 12M98 83l7 12" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
          <path d="M125 77l15 8-23 42-16 6 2-17 22-39Z" fill={blue} stroke={stroke} strokeWidth="4" strokeLinejoin="round" />
          <path d="M104 116l14 8M130 88l-15-8" stroke="white" strokeWidth="4" strokeLinecap="round" />
        </>
      )}
      {icon === "mission" && (
        <>
          <path d="M42 102c12-28 31-41 53-34 19 6 28-11 43-33" stroke={blue} strokeWidth="6" strokeLinecap="round" />
          <circle cx="43" cy="102" r="10" fill="white" stroke={stroke} strokeWidth="4" />
          <circle cx="88" cy="67" r="10" fill="white" stroke={stroke} strokeWidth="4" />
          <circle cx="138" cy="35" r="10" fill="white" stroke={stroke} strokeWidth="4" />
          <path d="M138 20v36M138 22l25 8-25 8" stroke={stroke} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M39 103h8M84 67h8M134 35h8" stroke="#9bc7ff" strokeWidth="3" strokeLinecap="round" />
        </>
      )}
      {icon === "visibility" && (
        <>
          <rect x="51" y="37" width="79" height="58" rx="8" fill="white" stroke={stroke} strokeWidth="4" />
          <path d="M64 57h25M64 73h18" stroke="#9bc7ff" strokeWidth="4" strokeLinecap="round" />
          <path d="M101 79l7 7 16-19" stroke={blue} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="67" cy="111" r="12" fill="white" stroke={stroke} strokeWidth="4" />
          <path d="M48 132c4-12 14-18 19-18s15 6 19 18" fill="white" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
          <circle cx="121" cy="112" r="11" fill="white" stroke={stroke} strokeWidth="4" />
          <path d="M104 132c4-11 13-17 17-17s13 6 17 17" fill="white" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
        </>
      )}
      {icon === "growth" && (
        <>
          <path d="M42 105c26-6 48-22 66-49" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
          <path d="M100 58l10-13 3 16" stroke={stroke} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="44" y="101" width="17" height="18" fill={blue} stroke={stroke} strokeWidth="4" />
          <rect x="72" y="88" width="17" height="31" fill={blue} stroke={stroke} strokeWidth="4" />
          <rect x="100" y="70" width="17" height="49" fill={blue} stroke={stroke} strokeWidth="4" />
          <path d="M128 42v78M128 44l26 9-26 10" stroke={stroke} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="130" cy="112" r="19" fill="white" stroke={stroke} strokeWidth="4" />
          <path d="M120 112l7 7 15-17" stroke={blue} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
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
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    let role = profile?.role || user.user_metadata.role;

    if (!role || role === "parent") {
      const { data: application } = await supabase
        .from("applications")
        .select("status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (application) {
        role = "tutor";
      }
    }

    const finalRole = role || "parent";
    redirect(`/dashboard/${finalRole}`);
  }

  const flags = await getFeatureFlagMap();
  const tutors = flags.tutor_marketplace_enabled ? await getTutors(searchTerm, selectedSubject) : [];

  return (
    <div className="flex flex-col flex-1 items-center bg-background">
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={localBusinessJsonLd()} />

      <section id="hero" aria-label="Premium STEM tutoring" className="sd-ambient-gradient relative flex w-full items-start overflow-hidden bg-[linear-gradient(135deg,#06172f_0%,#073f7b_42%,#0b64bd_72%,#06376f_100%)] px-4 pb-14 pt-8 text-center md:min-h-[86vh] md:items-center md:px-10 md:py-28 lg:py-36">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_26%,rgba(0,245,212,0.14),transparent_33%),radial-gradient(circle_at_18%_78%,rgba(255,255,255,0.1),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent_42%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-b from-transparent to-white/10" />

        <div className="relative z-10 mx-auto grid w-full max-w-[1360px] items-center gap-8 md:gap-12 lg:grid-cols-[0.94fr_1.06fr] lg:gap-16">
          <div className="sd-fade-up flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="mb-5 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 shadow-inner backdrop-blur-sm md:mb-8 md:px-4">
              <span className="flex h-1.5 w-1.5 rounded-full bg-cyan-300" />
              <span className="text-[9px] font-black uppercase tracking-[0.18em] text-white/55 md:text-[10px] md:tracking-[0.28em]">Premium STEM tutoring for international learners</span>
            </div>

            <h1 className="mb-5 max-w-4xl text-3xl font-black leading-[1.06] tracking-tight text-white sm:text-4xl md:mb-8 md:text-6xl lg:text-[5rem]">
              Your child understands more than their grades show.
            </h1>
            <p className="max-w-[38rem] text-base font-medium leading-7 text-white/75 md:text-xl md:leading-9">
              ScienceDojo helps GCSE, IGCSE, IB, and A-Level students build science confidence through expert tutoring, structured practice, and personalized learning Missions.
            </p>

            {(flags.free_assessment_enabled ||
              flags.practice_dojo_enabled ||
              flags.focus_dojo_enabled) && (
              <div className="mt-8 hidden items-center gap-4 lg:flex">
                {flags.free_assessment_enabled && (
                  <BookAssessmentLink
                    source="homepage_hero"
                    className="rounded-2xl bg-white px-10 py-4 font-black text-primary shadow-xl shadow-white/10 transition-all hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-2xl"
                  >
                    Book Free Learning Assessment
                  </BookAssessmentLink>
                )}
                {flags.practice_dojo_enabled && (
                  <Link
                    href="/ai-practice-studio"
                    className="rounded-2xl border border-white/15 bg-white/5 px-10 py-4 font-black text-white backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white/10"
                  >
                    Try Practice Dojo
                  </Link>
                )}
                {flags.focus_dojo_enabled && (
                  <Link
                    href="/focus-dojo"
                    className="rounded-2xl border border-white/15 bg-white/5 px-10 py-4 font-black text-white backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white/10"
                  >
                    Try FocusDojo
                  </Link>
                )}
              </div>
            )}

            <div className="mt-8 hidden flex-wrap gap-2 lg:flex">
              {heroPills.map((pill) => (
                <span key={pill} className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/60">
                  {pill}
                </span>
              ))}
            </div>
          </div>

          <div className="sd-fade-up relative mb-12 w-full max-w-[calc(100vw-1rem)] justify-self-center sm:max-w-[43rem] md:mb-20 lg:-mr-16 lg:mb-0 lg:max-w-none">
            <div className="sd-glow-pulse pointer-events-none absolute -inset-10 rounded-[3.5rem] bg-[radial-gradient(circle_at_50%_45%,rgba(0,245,212,0.16),rgba(0,102,255,0.1)_38%,transparent_68%)] blur-2xl" />
            <div className="sd-shimmer relative aspect-[4/3] overflow-hidden rounded-[2.75rem] border border-white/15 bg-white/10 shadow-[0_42px_110px_rgba(0,0,0,0.36)] lg:scale-[1.03] lg:origin-center">
              <HeroIntroMedia imageSrc={homeImages.heroStem.src} imageAlt={homeImages.heroStem.alt} videoSrc="/videos/hero-video.mp4" />
              <div className="absolute inset-0 bg-gradient-to-tr from-secondary/62 via-primary/10 to-cyan-300/12" />
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-secondary/55 to-transparent" />
            </div>

            <div className="absolute left-5 top-[34%] w-[11rem] rounded-3xl border border-white/20 bg-white/90 px-4 py-3 text-left shadow-xl shadow-black/10 backdrop-blur md:left-8 md:w-48 lg:left-auto lg:right-0 lg:top-8 lg:w-56 lg:translate-x-1/2 lg:px-5 lg:py-4">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">Tutor guidance</p>
              <p className="mt-1 text-sm font-black text-secondary">Calm next steps</p>
            </div>
            <div className="absolute -bottom-12 left-7 grid w-[72%] max-w-[22rem] gap-2 lg:-bottom-7 lg:left-10 lg:w-[74%] lg:max-w-none lg:grid-cols-2 lg:gap-3">
              {[
                { label: "Personalized Missions", detail: "Practice between lessons" },
                { label: "Parent Updates", detail: "Visible support" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2.5 rounded-[1.15rem] border border-white/20 bg-white/90 px-4 py-3 text-left text-secondary shadow-xl shadow-black/10 backdrop-blur transition-transform hover:-translate-y-0.5 lg:gap-3 lg:rounded-2xl lg:px-5 lg:py-4">
                  <svg className="h-3.5 w-3.5 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>
                    <span className="block text-[10px] font-black uppercase tracking-[0.12em]">{item.label}</span>
                    <span className="mt-1 block text-xs font-bold text-secondary/50">{item.detail}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 grid w-full gap-5 lg:hidden">
            {(flags.free_assessment_enabled ||
              flags.practice_dojo_enabled ||
              flags.focus_dojo_enabled) && (
              <div className="flex flex-col gap-3">
                {flags.free_assessment_enabled && (
                  <BookAssessmentLink
                    source="homepage_hero_mobile"
                    className="w-full rounded-2xl border border-white/80 bg-white px-6 py-3.5 text-center text-sm font-black text-primary shadow-xl shadow-white/20 transition-all active:scale-95"
                  >
                    Book Free Learning Assessment
                  </BookAssessmentLink>
                )}
                {flags.practice_dojo_enabled && (
                  <Link
                    href="/ai-practice-studio"
                    className="w-full rounded-2xl border border-white/20 bg-secondary/35 px-6 py-3.5 text-center text-sm font-black text-white shadow-lg shadow-secondary/15 backdrop-blur-md transition-all hover:bg-secondary/45"
                  >
                    Try Practice Dojo
                  </Link>
                )}
                {flags.focus_dojo_enabled && (
                  <Link
                    href="/focus-dojo"
                    className="w-full rounded-2xl border border-white/20 bg-secondary/35 px-6 py-3.5 text-center text-sm font-black text-white shadow-lg shadow-secondary/15 backdrop-blur-md transition-all hover:bg-secondary/45"
                  >
                    Try FocusDojo
                  </Link>
                )}
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-2 text-center">
              {heroPills.map((pill) => (
                <span key={pill} className="rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] text-white/60 backdrop-blur">
                  {pill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section aria-label="The real learning problem" className="w-full bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)] px-4 py-16 md:px-10 md:py-36">
        <div className="mx-auto max-w-[1360px]">
          <div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary md:text-xs md:tracking-[0.28em]">The real problem</p>
              <h2 className="mt-4 max-w-2xl text-3xl font-black leading-[1.1] tracking-tight text-secondary md:mt-5 md:text-5xl">Most students do not need more pressure. They need clearer support.</h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-secondary/65 md:mt-7 md:text-lg md:leading-8">
                Grades can make a capable child look lost. ScienceDojo starts by finding what is missing, rebuilding understanding, and giving each student a calmer path forward.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {problemPoints.map((point) => (
                <div key={point.title} className="rounded-[1.5rem] border border-secondary/8 bg-white p-5 shadow-[0_16px_48px_rgba(0,26,68,0.05)] transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-primary/10 md:rounded-[1.75rem] md:p-7">
                  <h3 className="text-lg font-black text-secondary">{point.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-secondary/58 md:mt-3 md:leading-7">{point.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section aria-label="The ScienceDojo Method" className="relative w-full overflow-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#eef6ff_54%,#f8fbff_100%)] px-4 py-16 md:px-8 md:py-28 xl:px-12">
        <HomepageSectionTracker eventName="homepage_method_visible" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(0,102,255,0.08),transparent_30%),radial-gradient(circle_at_86%_36%,rgba(0,210,255,0.09),transparent_31%)]" />
        <div className="relative mx-auto max-w-[1560px]">
          <div className="mx-auto max-w-[76rem] text-center">
            <p className="text-[11px] font-black uppercase text-primary md:text-sm">The method</p>
            <h2 className="mt-5 text-4xl font-black leading-[1.05] text-secondary md:text-6xl xl:whitespace-nowrap xl:text-[4.75rem]">
              The <span className="text-primary">sciencedojo</span> Method
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-secondary/62 md:text-2xl md:leading-10">
              A structured tutoring rhythm designed to turn hidden gaps into visible progress.
            </p>
          </div>

          <div className="relative mt-12 md:mt-20">
            <div className="absolute left-[7%] right-[7%] top-[3.65rem] hidden h-1 overflow-hidden rounded-full bg-primary/10 xl:block">
              <div className="h-full w-full rounded-full bg-[linear-gradient(90deg,rgba(0,102,255,0.18)_0%,rgba(0,102,255,0.28)_24%,rgba(0,102,255,0.42)_50%,rgba(0,210,255,0.56)_76%,rgba(0,102,255,0.72)_100%)] [mask-image:linear-gradient(90deg,transparent,black_7%,black_93%,transparent)]" />
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5 xl:gap-7">
              {methodStages.map((stage, index) => {
                const isFinalStage = index === methodStages.length - 1;

                return (
                <div
                  key={stage.title}
                  className={`relative flex min-h-[28rem] flex-col items-center overflow-hidden rounded-[1.75rem] bg-white px-6 pb-7 pt-5 text-center transition-all hover:-translate-y-1 md:min-h-[29.5rem] md:px-7 xl:min-h-[31rem] ${
                    isFinalStage
                      ? "border border-primary/22 shadow-[0_28px_82px_rgba(0,102,255,0.16)] hover:shadow-[0_32px_92px_rgba(0,102,255,0.2)]"
                      : "border border-secondary/5 shadow-[0_22px_65px_rgba(0,26,68,0.11)] hover:shadow-[0_28px_80px_rgba(0,102,255,0.16)]"
                  }`}
                >
                  <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-black text-white shadow-[0_9px_20px_rgba(0,102,255,0.2)] ring-[7px] ring-primary/7">
                    {stage.number}
                  </div>
                  <div className="mt-8 flex h-40 w-full items-center justify-center">
                    <MethodStageIllustration icon={stage.icon} />
                  </div>
                  <h3 className="mt-4 text-2xl font-black leading-tight text-secondary md:text-[1.65rem]">{stage.title}</h3>
                  <p className="mt-2 text-sm font-bold uppercase tracking-[0.08em] text-primary/82">{stage.meaning}</p>
                  <div className="mt-5 h-px w-full bg-secondary/8">
                    <div className="mx-auto h-px w-16 bg-primary" />
                  </div>
                  <p className="mt-5 max-w-[14rem] text-base font-medium leading-7 text-secondary/66">{stage.text}</p>
                </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section aria-label="The ScienceDojo Learning Journey" className="relative w-full overflow-hidden bg-white px-4 py-16 md:px-8 md:py-28 xl:px-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(0,102,255,0.06),transparent_30%),radial-gradient(circle_at_82%_78%,rgba(0,210,255,0.07),transparent_32%),linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)]" />
        <div className="relative mx-auto max-w-[1560px]">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary md:text-sm">The learning journey</p>
            <h2 className="mt-4 text-3xl font-black leading-[1.08] tracking-tight text-secondary md:text-5xl xl:text-[3.85rem]">
              A Learning System, Not Just A Lesson
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-secondary/62 md:text-xl md:leading-9">
              Every lesson creates clear next steps so learning continues between sessions and progress becomes visible over time.
            </p>
          </div>

          <div className="relative mt-12 md:mt-16">
            <div className="absolute left-[6%] right-[6%] top-[4.45rem] hidden h-1 overflow-hidden rounded-full bg-primary/8 xl:block">
              <div className="h-full w-full rounded-full bg-[linear-gradient(90deg,rgba(0,102,255,0.14)_0%,rgba(0,102,255,0.24)_20%,rgba(0,102,255,0.36)_40%,rgba(0,210,255,0.48)_60%,rgba(0,102,255,0.6)_80%,rgba(0,102,255,0.72)_100%)] [mask-image:linear-gradient(90deg,transparent,black_6%,black_94%,transparent)]" />
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 xl:gap-4">
              {learningJourneyStages.map((stage) => (
                <div
                  key={stage.title}
                  className="relative flex min-h-[18rem] flex-col items-center rounded-[1.5rem] border border-secondary/7 bg-white px-4 pb-5 pt-4 text-center shadow-[0_18px_48px_rgba(0,26,68,0.08)] transition-all hover:-translate-y-0.5 hover:border-primary/18 hover:shadow-[0_22px_56px_rgba(0,102,255,0.12)] md:min-h-[18.75rem] md:px-5 xl:min-h-[20rem]"
                >
                  <div className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-black text-white shadow-[0_8px_18px_rgba(0,102,255,0.18)] ring-[6px] ring-primary/7">
                    {stage.number}
                  </div>
                  <div className="mt-5 flex h-28 w-full items-center justify-center">
                    <LearningJourneyIllustration icon={stage.icon} />
                  </div>
                  <h3 className="mt-4 text-lg font-black leading-tight text-secondary md:text-xl xl:text-lg">{stage.title}</h3>
                  <div className="mt-4 h-px w-full bg-secondary/8">
                    <div className="mx-auto h-px w-12 bg-primary/80" />
                  </div>
                  <p className="mt-4 max-w-[12rem] text-sm font-medium leading-6 text-secondary/62">{stage.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {flags.practice_dojo_enabled && (
      <section id="classroom" aria-label="Practice Dojo" className="w-full border-b border-secondary/10 bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)] px-4 py-16 md:px-10 md:py-36">
        <HomepageSectionTracker eventName="homepage_practice_dojo_visible" />
        <div className="group relative mx-auto grid max-w-[1360px] gap-8 overflow-hidden rounded-[2rem] border border-primary/10 bg-white p-5 shadow-xl shadow-secondary/5 transition-all hover:-translate-y-0.5 hover:shadow-primary/10 md:gap-14 md:rounded-[2.5rem] md:p-8 md:shadow-2xl lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:p-14">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_20%,rgba(0,102,255,0.08),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.9),rgba(242,248,255,0.72))]" />
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary md:text-xs md:tracking-[0.28em]">Free structured practice</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-secondary md:mt-4 md:text-5xl">Practice Dojo</h2>
            <p className="mt-3 text-lg font-black text-secondary md:mt-4 md:text-xl">Test understanding before the stress builds.</p>
            <p className="mt-4 max-w-xl text-sm leading-7 text-secondary/65 md:mt-5 md:text-base">
              Practice Dojo is open to anyone. Students can create curriculum-aligned practice, check what they know, and spot the topics that may need tutor support.
            </p>
            <div className="mt-5 grid gap-3 text-sm font-bold text-secondary/65 sm:grid-cols-2 md:mt-7">
              {["Open access knowledge checks", "Curriculum-aligned practice", "Topic gap discovery", "Free assessment next step"].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row md:mt-7">
              <AiPracticeStudioCtaLink
                href="/ai-practice-studio"
                cta="try_practice_dojo"
                source="homepage_practice_dojo"
                className="inline-flex justify-center rounded-2xl bg-primary px-7 py-4 text-sm font-black uppercase tracking-[0.14em] text-white transition-colors hover:bg-primary-hover"
              >
                Try Practice Dojo
              </AiPracticeStudioCtaLink>
              {flags.free_assessment_enabled && (
                <BookAssessmentLink
                  source="homepage_practice_dojo"
                  className="inline-flex justify-center whitespace-nowrap rounded-2xl border border-secondary/10 bg-white px-7 py-4 text-sm font-black uppercase tracking-[0.14em] text-secondary transition-colors hover:border-primary/30 hover:text-primary"
                >
                  Book Free Assessment
                </BookAssessmentLink>
              )}
            </div>
          </div>
          <div className="relative z-10 overflow-hidden rounded-[1.75rem] border border-secondary/10 bg-[#f8fbff] p-3 shadow-xl shadow-secondary/10 transition-all group-hover:border-primary/20 md:rounded-[2.25rem] md:p-5 lg:p-6">
            <span className="absolute right-5 top-5 z-20 rounded-full bg-secondary/5 px-2.5 py-1 text-[10px] font-bold text-secondary/40 ring-1 ring-secondary/10">Sample view</span>
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(236,247,255,0.74))]" />
            <div className="relative rounded-[1.75rem] border border-secondary/10 bg-white p-5 shadow-xl shadow-secondary/5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Practice Dojo</p>
                  <p className="mt-2 text-2xl font-black text-secondary">Knowledge check</p>
                </div>
                <div className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-primary">Open Tool</div>
              </div>
              <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-2xl bg-surface p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm font-black text-secondary">Targeted practice</span>
                    <span className="rounded-full bg-cyan-100 px-2 py-1 text-[10px] font-black text-primary">6 questions</span>
                  </div>
                  <div className="grid gap-3">
                    {["Forces and motion", "Bonding practice", "Algebra equations"].map((item, index) => (
                      <div key={item} className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">{index + 1}</span>
                        <span className="text-sm font-bold text-secondary/70">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid gap-4">
                  <div className="rounded-2xl bg-secondary p-5 text-white">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Knowledge gap</p>
                    <p className="mt-2 text-lg font-black">Vectors need support</p>
                    <p className="mt-3 text-sm leading-6 text-white/60">A good moment to book a free assessment and plan the next step.</p>
                  </div>
                  <div className="rounded-2xl bg-surface p-5">
                    <p className="text-sm font-black text-secondary">Practice rhythm</p>
                    <div className="mt-4 flex h-24 items-end gap-2">
                      {[35, 48, 44, 62, 70, 76, 88].map((height, index) => (
                        <div key={index} className="flex-1 rounded-t-lg bg-primary/15" style={{ height: `${height}%` }}>
                          <div className="sd-bar-rise h-full rounded-t-lg bg-gradient-to-t from-primary to-cyan-300 opacity-80" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      )}

      <section aria-label="Personalized Missions" className="relative w-full overflow-hidden bg-[linear-gradient(135deg,#071a35_0%,#082d5a_48%,#064c91_100%)] px-4 py-16 text-white md:px-10 md:py-36">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_24%_22%,rgba(0,245,212,0.15),transparent_32%),radial-gradient(circle_at_78%_72%,rgba(255,255,255,0.1),transparent_28%)]" />
        <div className="relative mx-auto grid max-w-[1360px] gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200/70 md:text-xs md:tracking-[0.28em]">Personalized Missions</p>
            <h2 className="mt-4 max-w-2xl text-3xl font-black leading-[1.1] tracking-tight md:mt-5 md:text-5xl">Structured learning momentum between lessons.</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/68 md:mt-7 md:text-lg md:leading-8">
              Enrolled students receive personalized Missions built from lessons, class records, tutor observations, progress, and goals. Each Mission gives the next piece of practice a clear purpose.
            </p>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-4 shadow-xl shadow-black/20 backdrop-blur md:rounded-[2.5rem] md:p-6 md:shadow-2xl">
            <div className="rounded-[1.5rem] bg-white p-5 text-secondary shadow-xl md:rounded-[2rem] md:p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Example learning pathway</p>
              <div className="mt-6 grid gap-4">
                {["Daily recall", "Weekly guided practice", "Monthly progress review"].map((item, index) => (
                  <div key={item} className="flex gap-4 rounded-2xl border border-secondary/8 bg-surface p-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-black text-white">{index + 1}</span>
                    <div>
                      <h3 className="font-black text-secondary">{item}</h3>
                      <p className="mt-1 text-sm leading-6 text-secondary/55">Tutor-informed practice that keeps learning moving after the lesson ends.</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {missionFeatures.map((item) => (
                  <div key={item} className="rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm font-bold text-secondary/60">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="safeguarding" aria-label="Parent visibility" className="relative w-full overflow-hidden bg-[#fffdf8] px-4 py-16 md:px-10 md:py-36">
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
              <div className="absolute inset-0 bg-gradient-to-tr from-secondary/35 via-transparent to-cyan-300/15" />
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary md:text-xs md:tracking-[0.28em]">Parent visibility</p>
            <h2 className="mt-4 max-w-2xl text-3xl font-black leading-[1.1] tracking-tight text-secondary md:mt-5 md:text-5xl">Parents always know what happens next.</h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-secondary/65 md:mt-6 md:text-lg md:leading-8">
              ScienceDojo keeps families close to the learning journey with summaries, practice visibility, tutor recommendations, and progress signals that make support feel calmer.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 md:mt-9">
              {parentVisibilityItems.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-secondary/10 bg-white/70 px-5 py-4 text-sm font-black text-secondary shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:bg-white hover:shadow-lg">
                  <svg className="h-5 w-5 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {flags.tutor_marketplace_enabled && (
      <section id="directory" aria-label="Verified expert tutors" className="relative z-20 w-full bg-white px-4 py-16 md:px-10 md:py-36">
        <HomepageSectionTracker eventName="homepage_tutor_marketplace_visible" />
        <div className="mx-auto max-w-[1360px]">
          <div className="mb-11 grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary md:text-xs md:tracking-[0.28em]">Verified expert tutors</p>
              <h2 id="how-we-verify" className="mt-4 text-3xl font-black leading-[1.1] tracking-tight text-secondary md:mt-5 md:text-5xl">Meet tutors who teach like mentors.</h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-secondary/65 md:text-lg md:leading-8 lg:justify-self-end">
              Find educators who understand your child&apos;s curriculum, confidence level, and learning style. ScienceDojo profiles focus on educational fit before booking.
            </p>
          </div>

          <SearchFilterBar />

          <div className="mb-6 mt-8 flex items-end justify-between">
            <h3 className="text-2xl font-bold text-secondary">
              {selectedSubject === "All" ? "Mentor profiles" : `${selectedSubject} mentors`}
            </h3>
            <span className="text-sm font-medium text-secondary/60">
              Showing {tutors.length} {tutors.length === 1 ? "tutor" : "tutors"}
            </span>
          </div>

          {tutors.length > 0 ? (
            <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
              {tutors.map((tutor) => (
                <TutorCard key={tutor.id} tutor={tutor} currentUserRole={null} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-secondary/10 bg-white py-20 text-center shadow-sm">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/5 text-secondary/30">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-bold text-secondary">No tutors found</h3>
              <p className="max-w-sm text-secondary/60">We could not find any tutors matching your search criteria. Try adjusting your filters.</p>
              <Link
                href="/"
                className="mt-6 rounded-lg border border-primary/20 px-4 py-2 font-medium text-primary transition-colors hover:bg-primary/5"
              >
                Clear Filters
              </Link>
            </div>
          )}
        </div>
      </section>
      )}

      <section aria-label="Founder trust" className="w-full bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] px-4 py-16 md:px-10 md:py-36">
        <div className="mx-auto grid max-w-[1160px] gap-8 rounded-[2rem] border border-secondary/8 bg-white p-5 shadow-[0_24px_80px_rgba(0,26,68,0.06)] md:gap-12 md:rounded-[2.5rem] md:p-14 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
          <div className="rounded-[1.5rem] bg-secondary p-5 text-white md:rounded-[2rem] md:p-10">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200/70 md:text-xs md:tracking-[0.24em]">Founder-led philosophy</p>
            <h2 className="mt-4 text-2xl font-black leading-[1.14] tracking-tight md:mt-5 md:text-4xl">Built around the way students actually rebuild confidence.</h2>
          </div>
          <div>
            <p className="max-w-2xl text-base leading-7 text-secondary/65 md:text-lg md:leading-8">
              ScienceDojo is shaped by a simple belief: many students are more capable than their grades suggest. The right tutor, the right structure, and the right follow-through can turn confusion into calm progress.
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-secondary/56 md:mt-5 md:text-base md:leading-8">
              The aim is not to make online learning louder. It is to make support clearer, warmer, and more consistent between every lesson.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {["Human tutoring first", "Structured practice", "Parent-visible progress"].map((item) => (
                <div key={item} className="rounded-2xl border border-secondary/10 bg-surface px-4 py-4 text-sm font-black text-secondary/60">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Family testimonials" className="relative w-full overflow-hidden bg-[linear-gradient(180deg,#eef4ff_0%,#f5f9ff_14%,#f8fafe_46%,#fdfeff_100%)] px-4 py-16 md:px-10 md:py-40">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_18%,rgba(0,102,255,0.08),transparent_34%),radial-gradient(circle_at_80%_38%,rgba(0,102,255,0.04),transparent_28%)]" />
        <div className="relative mx-auto max-w-[1360px]">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-primary md:mb-5 md:text-xs md:tracking-[0.28em]">Learning journeys</p>
            <h2 className="text-3xl font-black leading-[1.1] tracking-tight text-secondary md:text-5xl xl:text-[3.75rem]">What Families Say About <span className="text-primary">sciencedojo</span></h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-secondary/55 md:mt-6 md:text-lg md:leading-[1.75]">
              Real messages about students moving from stress and uncertainty toward clearer, calmer progress.
            </p>
          </div>
          <FeaturedTestimonialCard />

          <div className="mt-14">
            <div className="mb-7 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">Student and parent messages</p>
                <h3 className="mt-2 text-2xl font-black text-secondary">Transformation stories</h3>
              </div>
            </div>

            <div className="hidden sm:grid sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:items-start">
              <AchievementStoryCard />
              {REAL_TESTIMONIALS.map((story, index) => (
                <TestimonialCard key={index} story={story} />
              ))}
            </div>

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

      <section aria-label="Get started with ScienceDojo" className="sd-ambient-gradient w-full overflow-hidden bg-[linear-gradient(135deg,#071a35_0%,#0a4d95_48%,#0066ff_78%,#073f7b_100%)] px-4 py-16 md:px-10 md:py-36">
        <div className="relative mx-auto max-w-[1120px] text-center">
          <div className="pointer-events-none absolute inset-0 rounded-[3rem] bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.14),transparent_42%)]" />
          <div className="relative">
            <p className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200/70 md:mb-5 md:text-xs md:tracking-[0.28em]">Free learning assessment</p>
            <h2 className="mx-auto max-w-4xl text-3xl font-black leading-[1.1] tracking-tight text-white md:text-6xl">Find out if ScienceDojo is right for your child.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/70 md:mt-6 md:text-lg md:leading-8">
              Start with a calm conversation about your child&apos;s subject, confidence, goals, and the kind of support that would help most.
            </p>
            {(flags.free_assessment_enabled || flags.practice_dojo_enabled) && (
              <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
                {flags.free_assessment_enabled && (
                  <BookAssessmentLink
                    source="homepage_final_cta"
                    className="rounded-2xl bg-white px-8 py-4 text-sm font-black uppercase tracking-[0.14em] text-primary shadow-xl shadow-white/10 transition-all hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-2xl"
                  >
                    Book Free Learning Assessment
                  </BookAssessmentLink>
                )}
                {flags.practice_dojo_enabled && (
                  <AiPracticeStudioCtaLink
                    href="/ai-practice-studio"
                    cta="final_cta_try_practice_dojo"
                    source="homepage_final_cta"
                    className="rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-sm font-black uppercase tracking-[0.14em] text-white backdrop-blur transition-all hover:bg-white/10"
                  >
                    Try Practice Dojo
                  </AiPracticeStudioCtaLink>
                )}
              </div>
            )}
            <div className="mt-10 grid gap-3 sm:grid-cols-4">
              {["Free assessment", "Expert tutoring", "Personalized Missions", "Parent updates"].map((item) => (
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

import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import AuthenticatedHomeRedirect from "@/components/AuthenticatedHomeRedirect";
import BookAssessmentLink from "@/components/analytics/BookAssessmentLink";
import HomepageSectionTracker from "@/components/analytics/HomepageSectionTracker";
import HomepageViewTracker from "@/components/analytics/HomepageViewTracker";
import HomepageSubjectChooser from "@/components/HomepageSubjectChooser";
import HomepageProductShowcase from "@/components/HomepageProductShowcase";
import JsonLd from "@/components/JsonLd";
import UserAvatar from "@/components/UserAvatar";
import { getPublicFeatureFlagMap } from "@/lib/feature-flags";
import { getPublicTutors } from "@/lib/public-tutors";
import { getVisibleShowcaseItems } from "@/lib/product-showcase";
import { localBusinessJsonLd, organizationJsonLd } from "@/lib/seo";

const assessmentSteps = [
  { title: "Tell us what feels difficult", text: "Share the subject, your child's year, and what you have noticed." },
  { title: "Talk it through for free", text: "We review your request before a conversation about confidence, goals, and next steps." },
  { title: "Get a direction for support", text: "We recommend a suitable tutor and a learning approach shaped around your child." },
];

async function FeaturedTutor() {
  const tutors = await getPublicTutors();
  const tutor = tutors
    .filter((candidate) => candidate.is_verified)
    .sort((a, b) => Number(b.is_featured) - Number(a.is_featured))[0];

  if (!tutor) return null;

  return (
    <article className="min-w-0 flex-[1_1_22rem] rounded-3xl border border-[#dce8f3] bg-white p-6 sm:p-8">
      <HomepageSectionTracker eventName="homepage_tutor_marketplace_visible" />
      <p className="text-sm font-bold text-primary">Meet a verified tutor</p>
      <div className="mt-5 flex items-center gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#e8f4ff]">
          <UserAvatar src={tutor.avatar_url} alt={tutor.full_name} width={64} height={64} className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0">
          <h3 className="text-xl font-black text-secondary">{tutor.full_name}</h3>
          <p className="mt-1 text-sm font-semibold text-primary">{tutor.subjects.slice(0, 3).join(" · ")}</p>
        </div>
      </div>
      <p className="mt-5 max-w-md text-sm leading-6 text-secondary/70">Explore this tutor&apos;s teaching approach and experience to see if they&apos;re a good fit for your child.</p>
      <Link href={`/tutor/${tutor.id}`} className="mt-4 inline-flex min-h-11 items-center gap-2 font-bold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
        View tutor profile <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </article>
  );
}

async function HomeContent() {
  const flags = await getPublicFeatureFlagMap();
  const showPractice = flags.practice_dojo_enabled;
  const showAssessment = flags.free_assessment_enabled;
  const showcaseItems = getVisibleShowcaseItems(flags);

  return (
    <main className="min-w-0 flex-1 bg-white">
      <HomepageViewTracker />
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={localBusinessJsonLd()} />

      <section id="hero" className="bg-[linear-gradient(115deg,#eaf5ff_0%,#dceeff_100%)] px-4 py-8 md:px-8" aria-labelledby="home-heading">
        <div className="mx-auto grid max-w-6xl items-center gap-7 lg:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)] lg:gap-10">
          <div className="max-w-[39rem]">
            <p className="text-sm font-bold text-primary">Online tutoring for international learners</p>
            <h1 id="home-heading" className="mt-2 text-4xl font-black leading-[1.06] tracking-tight text-secondary sm:text-5xl lg:text-[3rem] xl:text-[3.25rem]">Tutoring that makes the next step clear.</h1>
            <p className="mt-3 max-w-[35rem] text-base leading-7 text-secondary/75 md:text-lg md:leading-8">One-to-one lessons, practice between sessions, and progress parents can follow.</p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-5">
              {showAssessment ? (
                <BookAssessmentLink source="homepage_hero" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-5 py-3 text-center text-sm font-extrabold text-white shadow-sm transition hover:bg-[#064c95] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
                  Request a free learning assessment <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </BookAssessmentLink>
              ) : showPractice ? (
                <Link href="/ai-practice-studio#studio" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-5 py-3 text-center text-sm font-extrabold text-white shadow-sm transition hover:bg-[#064c95] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
                  Try free practice <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              ) : (
                <Link href="/how-it-works" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-5 py-3 text-center text-sm font-extrabold text-white shadow-sm transition hover:bg-[#064c95] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
                  See how it works <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              )}
              {showAssessment && showPractice && <Link href="/ai-practice-studio#studio" className="inline-flex min-h-11 items-center justify-center gap-2 text-sm font-bold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">Try free practice <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>}
            </div>
            {showAssessment && <p className="mt-2 text-sm leading-6 text-secondary/65">Tell us what your child needs. We&apos;ll review it and arrange a free conversation.</p>}
          </div>
          <div className="relative h-48 w-full overflow-hidden rounded-[1.5rem] border-4 border-white bg-[#dfeaf4] shadow-[0_18px_48px_rgba(18,62,106,0.13)] sm:h-64 lg:h-[350px]">
            <Image
              src="/images/home/hero-parent-support.webp"
              alt="A parent and child learning together at a computer"
              fill
              sizes="(max-width: 1023px) 100vw, 50vw"
              loading="eager"
              fetchPriority="high"
              className="object-cover object-[57%_center]"
            />
          </div>
        </div>
      </section>

      <HomepageProductShowcase items={showcaseItems} />

      {showAssessment && <section className="px-4 pb-16 md:px-8 md:pb-20" aria-labelledby="system-heading">
        <HomepageSectionTracker eventName="homepage_method_visible" />
        <div className="mx-auto max-w-6xl border-t border-[#dce8f3] pt-14 md:pt-16">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-bold text-primary">Your first step</p>
              <h2 id="system-heading" className="mt-2 text-3xl font-black tracking-tight text-secondary md:text-4xl">How a free assessment works.</h2>
            </div>
            <BookAssessmentLink source="homepage_method" className="inline-flex min-h-11 shrink-0 items-center gap-2 font-bold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">Tell us what your child needs <ArrowRight className="h-4 w-4" aria-hidden="true" /></BookAssessmentLink>
          </div>
          <ol className="mt-7 grid gap-5 sm:grid-cols-3">
            {assessmentSteps.map((step, index) => (
              <li key={step.title} className="border-t-2 border-[#cde3f5] pt-4">
                <span className="text-xs font-black tracking-wider text-primary">{String(index + 1).padStart(2, "0")}</span>
                <h3 className="mt-2 text-base font-black text-secondary">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-secondary/70">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>}

      <section className="bg-[#f4f9ff] px-4 py-16 md:px-8 md:py-20" aria-labelledby="stories-heading">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold text-primary">From ScienceDojo families</p>
          <h2 id="stories-heading" className="mt-2 text-3xl font-black tracking-tight text-secondary md:text-4xl">Support that makes a difference.</h2>
          <div className="mt-7 flex flex-wrap gap-4">
            <article className="min-w-0 flex-[1_1_30rem] rounded-3xl border border-[#dce8f3] bg-white p-6 sm:p-8">
              <p className="text-sm font-bold text-primary">Physics · long-term support</p>
              <blockquote className="mt-4 text-lg font-bold leading-8 text-secondary sm:text-xl">“We received Pawan&apos;s grade today and he received an A* for Physics. Thank you so much for your immense support and for guiding him over the past 1.5 years.”</blockquote>
              <p className="mt-4 text-sm font-semibold text-secondary/70">Pawan&apos;s parent · Individual outcomes vary</p>
              <Link href="/about#stories" className="mt-4 inline-flex min-h-11 items-center gap-2 font-bold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">Read the full story <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </article>
            {flags.tutor_marketplace_enabled && flags.tutor_profiles_enabled && <Suspense fallback={null}><FeaturedTutor /></Suspense>}
          </div>
        </div>
      </section>

      {showAssessment && <section className="px-4 py-16 md:px-8 md:py-20" aria-labelledby="questions-heading">
        <div className="mx-auto max-w-6xl">
          <h2 id="questions-heading" className="text-2xl font-black tracking-tight text-secondary md:text-3xl">Before you get started</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="border-t-2 border-[#cde3f5] pt-4"><h3 className="font-black text-secondary">Is the assessment free?</h3><p className="mt-2 text-sm leading-6 text-secondary/70">Yes. The conversation is free, with no pressure to continue.</p></div>
            <div className="border-t-2 border-[#cde3f5] pt-4"><h3 className="font-black text-secondary">What happens after I ask?</h3><p className="mt-2 text-sm leading-6 text-secondary/70">We review what you share, then contact you to arrange the assessment conversation.</p></div>
            <div className="border-t-2 border-[#cde3f5] pt-4"><h3 className="font-black text-secondary">Which curricula do you support?</h3><p className="mt-2 text-sm leading-6 text-secondary/70">GCSE, IGCSE, A-Level, IB, and other British and international school pathways.</p></div>
          </div>
          {showPractice && <div className="mt-10 border-t border-[#dce8f3] pt-7">
            <HomepageSectionTracker eventName="homepage_practice_dojo_visible" />
            <HomepageSubjectChooser assessmentEnabled />
          </div>}
        </div>
      </section>}

      {showPractice && !showAssessment && <section className="bg-white px-4 py-16 md:px-8 md:py-20" aria-label="Choose a subject to practise">
        <HomepageSectionTracker eventName="homepage_practice_dojo_visible" />
        <div className="mx-auto max-w-6xl"><HomepageSubjectChooser assessmentEnabled={false} /></div>
      </section>}

      {(showAssessment || showPractice) && (
        <section className="bg-[#071a35] px-4 py-16 text-white md:px-8 md:py-20" aria-labelledby="next-step-heading">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 id="next-step-heading" className="text-3xl font-black tracking-tight">A clearer next step starts here.</h2>
              <p className="mt-2 max-w-xl leading-7 text-white/85">{showAssessment ? "Tell us about your child’s goals and where they need support." : "Choose a subject and start with a few focused practice questions."}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {showAssessment && <BookAssessmentLink source="homepage_final" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-[#073a72] transition hover:bg-cyan-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Request a free learning assessment</BookAssessmentLink>}
              {showPractice && <Link href="/ai-practice-studio#studio" className={`inline-flex min-h-12 items-center justify-center rounded-xl px-5 py-3 text-sm font-extrabold transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white ${showAssessment ? "border border-white/60 hover:bg-white/10" : "bg-white text-[#073a72] hover:bg-cyan-50"}`}>Try free practice</Link>}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

export default function Home() {
  return <><AuthenticatedHomeRedirect /><Suspense fallback={<main className="min-h-[70vh] flex-1 bg-[#f3faff]" />}><HomeContent /></Suspense></>;
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import BookAssessmentLink from "@/components/analytics/BookAssessmentLink";
import { AchievementStoryCard, FeaturedTestimonialCard, REAL_TESTIMONIALS, TestimonialCard } from "@/components/Testimonials";
import { getPublicFeatureFlagMap } from "@/lib/feature-flags";
import { siteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "About ScienceDojo",
  description: "Learn why ScienceDojo brings human tutoring, purposeful practice and clearer progress together, and read real student and family stories.",
  alternates: { canonical: `${siteUrl}/about` },
};

const challenges = [
  ["Working harder is not always the answer", "Many students revise for longer without knowing which gaps are actually holding them back."],
  ["Confidence can drop quietly", "A capable student may stop asking questions when lessons move faster than their understanding."],
  ["Passive revision hides weak areas", "Reading notes feels productive, but exams test whether an idea can be applied."],
  ["Small gaps become exam stress", "Clear next steps help students prepare before pressure builds."],
];

export default async function AboutPage() {
  const flags = await getPublicFeatureFlagMap();
  return (
    <main className="flex-1 bg-white text-secondary">
      <section className="bg-[linear-gradient(130deg,#071a35,#0753a2)] px-4 py-16 text-white md:px-8 md:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold text-cyan-200">About ScienceDojo</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight tracking-tight md:text-6xl">Helping students feel capable again.</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/85">We believe many students understand more than their grades show. The right tutor, a clear learning plan, and follow-through between lessons can turn uncertainty into calmer progress.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {flags.free_assessment_enabled && <BookAssessmentLink source="about_hero" className="inline-flex min-h-12 items-center rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-[#073a72] hover:bg-cyan-50">Book a free assessment</BookAssessmentLink>}
            {flags.tutor_marketplace_enabled && <Link href="/find-tutors" className="inline-flex min-h-12 items-center rounded-xl border border-white/60 px-5 py-3 text-sm font-extrabold text-white hover:bg-white/10">Meet our tutors</Link>}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 md:px-8 md:py-20" aria-labelledby="why-heading">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold text-primary">Why we exist</p>
          <h2 id="why-heading" className="mt-2 max-w-3xl text-3xl font-black tracking-tight md:text-4xl">Students do not need more pressure. They need clearer support.</h2>
          <p className="mt-4 max-w-3xl leading-7 text-secondary/70">Grades can make a capable child look lost. We start by finding what is missing, rebuilding understanding, and giving each student a path forward.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {challenges.map(([title, text]) => <div key={title} className="rounded-2xl border border-secondary/10 bg-[#f7fbff] p-6"><h3 className="text-lg font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-secondary/70">{text}</p></div>)}
          </div>
        </div>
      </section>

      <section id="approach" className="scroll-mt-24 bg-[#f4f9ff] px-4 py-10 md:px-8" aria-label="Learn how ScienceDojo works">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <p className="max-w-2xl text-base font-semibold leading-7">Want to see what happens from first conversation to lessons and progress?</p>
          <Link href="/how-it-works" className="inline-flex min-h-11 items-center gap-2 font-bold text-primary underline-offset-4 hover:underline">See how it works <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </div>
      </section>

      <section className="bg-[#071a35] px-4 py-16 text-white md:px-8 md:py-20" aria-labelledby="philosophy-heading">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold text-cyan-200">Founder-led philosophy</p>
          <h2 id="philosophy-heading" className="mt-2 max-w-4xl text-3xl font-black tracking-tight md:text-4xl">Built around the way students rebuild confidence.</h2>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-white/80">The aim is not to make online learning louder. It is to make support clearer, warmer, and more consistent between every lesson: human tutoring first, structured practice, and progress parents can understand.</p>
          <div className="mt-7 flex flex-wrap gap-3 text-sm font-semibold text-white/85"><span className="rounded-full border border-white/25 px-4 py-2">Human tutoring first</span><span className="rounded-full border border-white/25 px-4 py-2">Structured practice</span><span className="rounded-full border border-white/25 px-4 py-2">Parent-visible progress</span></div>
        </div>
      </section>

      <section id="stories" className="scroll-mt-24 bg-[#f4f9ff] px-4 py-16 md:px-8 md:py-20" aria-labelledby="stories-heading">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold text-primary">Real messages</p>
          <h2 id="stories-heading" className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Student and family stories.</h2>
          <p className="mt-4 max-w-3xl leading-7 text-secondary/70">These are individual learning journeys, shared with permission where applicable. Outcomes vary.</p>
          <FeaturedTestimonialCard />
          <div className="mt-6 grid gap-5 lg:grid-cols-2"><AchievementStoryCard />{REAL_TESTIMONIALS.map((story) => <TestimonialCard key={story.firstName} story={story} />)}</div>
        </div>
      </section>

      {flags.free_assessment_enabled && <section className="px-4 py-14 md:px-8" aria-label="Next step"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5"><div><h2 className="text-2xl font-black">Ready to find a clearer path?</h2><p className="mt-2 text-secondary/70">Start with a conversation about the support your child needs.</p></div><BookAssessmentLink source="about_final" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-extrabold text-white hover:bg-primary-hover">Book a free assessment <ArrowRight className="h-4 w-4" aria-hidden="true" /></BookAssessmentLink></div></section>}
    </main>
  );
}

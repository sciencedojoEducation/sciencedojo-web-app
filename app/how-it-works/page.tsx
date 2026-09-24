import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, MessageSquareText, SearchCheck, UserRoundCheck } from "lucide-react";
import BookAssessmentLink from "@/components/analytics/BookAssessmentLink";
import HowItWorksRoleExplorer from "@/components/HowItWorksRoleExplorer";
import { getPublicFeatureFlagMap } from "@/lib/feature-flags";
import { homeImages } from "@/lib/homeImages";
import { siteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "How It Works",
  description: "Explore how ScienceDojo connects students, tutors and parents through lessons, class spaces, Missions, bookings and progress updates.",
  alternates: { canonical: `${siteUrl}/how-it-works` },
};

const steps = [
  { icon: SearchCheck, title: "Tell us what feels difficult", text: "Start with your child’s goals, curriculum and the topics they want help with." },
  { icon: UserRoundCheck, title: "Find the right tutor", text: "Explore a tutor who fits the subject and helps your child ask questions freely." },
  { icon: BookOpenCheck, title: "Learn, then practise", text: "Lessons build understanding; focused practice keeps it moving between sessions." },
  { icon: MessageSquareText, title: "See the next step", text: "Learning records help families follow what was covered and what comes next." },
];

export default async function HowItWorksPage() {
  const flags = await getPublicFeatureFlagMap();

  return (
    <main className="flex-1 bg-white text-secondary">
      <section className="bg-[linear-gradient(130deg,#071a35,#0753a2)] px-4 py-12 text-white md:px-8 md:py-20" aria-labelledby="how-heading">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1fr_.9fr]">
          <div>
            <p className="text-sm font-bold text-cyan-200">How ScienceDojo works</p>
            <h1 id="how-heading" className="mt-3 max-w-3xl text-4xl font-black leading-tight tracking-tight md:text-5xl">One connected home for tutoring, practice and progress.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/85">Students, tutors and parents each get a clear view of what matters to them—from booking a lesson to practising between classes.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              {flags.free_assessment_enabled && <BookAssessmentLink source="how_it_works_hero" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-[#073a72] hover:bg-cyan-50">Book a free assessment <ArrowRight className="h-4 w-4" aria-hidden="true" /></BookAssessmentLink>}
              <a href="#audiences" className="inline-flex min-h-12 items-center rounded-xl border border-white/60 px-5 py-3 text-sm font-extrabold text-white hover:bg-white/10">Explore each workspace</a>
              {flags.tutor_marketplace_enabled && <Link href="/find-tutors" className="inline-flex min-h-12 items-center rounded-xl border border-white/60 px-5 py-3 text-sm font-extrabold text-white hover:bg-white/10">Meet our tutors</Link>}
            </div>
          </div>
          <figure className="overflow-hidden rounded-3xl border border-white/20 bg-white/10 shadow-2xl">
            <Image src={homeImages.modernTutoring.src} alt={homeImages.modernTutoring.alt} width={960} height={640} sizes="(max-width: 1024px) 100vw, 45vw" priority className="aspect-[16/10] w-full object-cover" />
            <figcaption className="bg-[#092644] px-5 py-3 text-sm font-semibold text-white/85">A lesson should make room for questions, not more pressure.</figcaption>
          </figure>
        </div>
      </section>

      <section id="approach" className="scroll-mt-24 px-4 py-16 md:px-8 md:py-20" aria-labelledby="approach-heading">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold text-primary">Four connected steps</p>
          <h2 id="approach-heading" className="mt-2 text-3xl font-black tracking-tight md:text-4xl">What happens next?</h2>
          <p className="mt-3 max-w-2xl leading-7 text-secondary/70">A simple path, shaped around the student rather than a fixed script.</p>
          <ol className="mt-10 grid gap-6 md:grid-cols-4 md:gap-4">
            {steps.map((step, index) => <li key={step.title} className="relative border-l-2 border-cyan-200 pl-6 pb-2 md:border-l-0 md:border-t-2 md:pl-0 md:pt-7">
              <span className="absolute -left-5 top-0 flex h-10 w-10 items-center justify-center rounded-full bg-[#dff4ff] text-primary ring-4 ring-white md:-top-5 md:left-0"><step.icon className="h-5 w-5" aria-hidden="true" /></span>
              <p className="text-xs font-black uppercase tracking-widest text-primary">Step {index + 1}</p>
              <h3 className="mt-2 text-lg font-black">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-secondary/70">{step.text}</p>
            </li>)}
          </ol>
        </div>
      </section>

      <section id="audiences" className="scroll-mt-24 bg-[#f4f9ff] px-4 py-16 md:px-8 md:py-20" aria-labelledby="audiences-heading">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold text-primary">Three connected workspaces</p>
          <h2 id="audiences-heading" className="mt-2 max-w-3xl text-3xl font-black tracking-tight md:text-4xl">How does ScienceDojo work for you?</h2>
          <p className="mt-3 mb-8 max-w-2xl leading-7 text-secondary/70">Choose your role to see the tools and updates you can expect.</p>
          <HowItWorksRoleExplorer />
        </div>
      </section>

      <section className="px-4 py-12 md:px-8 md:py-14" aria-labelledby="connected-heading">
        <div className="mx-auto grid max-w-6xl gap-4 rounded-3xl border border-[#d6e5f4] bg-white p-6 sm:p-8 md:grid-cols-[.75fr_1.25fr] md:gap-10">
          <div><p className="text-sm font-bold text-primary">One learning journey</p><h2 id="connected-heading" className="mt-2 text-2xl font-black tracking-tight md:text-3xl">Connected where it counts.</h2></div>
          <div><p className="leading-7 text-secondary/75">Bookings, class activity, assignments, Missions, feedback and parent updates work together in ScienceDojo, so the next step is easier to find.</p><p className="mt-3 text-sm leading-6 text-secondary/60">Live video lessons open in Jitsi Meet from the class space; card payments continue through secure checkout.</p></div>
        </div>
      </section>

      <section className="px-4 py-14 md:px-8 md:py-16" aria-labelledby="story-heading">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 rounded-3xl bg-[#eaf4ff] p-7 sm:p-9 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl"><p className="text-sm font-bold text-primary">One family’s story</p><h2 id="story-heading" className="mt-2 text-2xl font-black tracking-tight md:text-3xl">Support that stayed with the student.</h2><blockquote className="mt-4 text-lg font-semibold leading-8">“We received Pawan&apos;s grade today and he received an A* for Physics. Thank you so much for your immense support and for guiding him over the past 1.5 years.”</blockquote><p className="mt-3 text-sm text-secondary/65">Pawan&apos;s parent · Individual outcomes vary</p></div>
          <Link href="/about#stories" className="inline-flex min-h-11 shrink-0 items-center gap-2 font-bold text-primary underline-offset-4 hover:underline">Read more stories <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </div>
      </section>

      {flags.free_assessment_enabled && <section className="bg-[linear-gradient(125deg,#073a72,#0066cc)] px-4 py-14 text-white md:px-8" aria-label="Start learning"><div className="mx-auto flex max-w-6xl flex-col gap-5 md:flex-row md:items-center md:justify-between"><div><h2 className="text-2xl font-black md:text-3xl">Start with what your child needs now.</h2><p className="mt-2 text-white/85">Tell us what they’re finding difficult, and take the first step together.</p></div><BookAssessmentLink source="how_it_works_final" className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-[#073a72] hover:bg-cyan-50">Book a free assessment</BookAssessmentLink></div></section>}
    </main>
  );
}

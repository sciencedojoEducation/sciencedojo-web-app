import type { Metadata } from "next";
import { ArrowRight, ChevronDown } from "lucide-react";
import JsonLd from "@/components/JsonLd";
import AiPracticeStudioCtaLink from "@/components/analytics/AiPracticeStudioCtaLink";
import { faqJsonLd, organizationJsonLd, siteUrl } from "@/lib/seo";
import AiPracticeStudioViewTracker from "./AiPracticeStudioViewTracker";
import QuestionGenerator from "./QuestionGenerator";
import FeatureUnavailable from "@/components/FeatureUnavailable";
import { getPublicFeatureFlagMap } from "@/lib/feature-flags";

const faqs = [
  {
    question: "What is PracticeDojo?",
    answer: "PracticeDojo creates free practice questions by stage, curriculum, subject, and topic. Students can reveal answers and worked guidance after trying each question.",
  },
  {
    question: "Which curricula does PracticeDojo support?",
    answer: "It supports major pathways including UK National Curriculum, Cambridge, Edexcel, AQA, SQA, IB, GCSE, IGCSE, A-Level, and primary or lower secondary routes.",
  },
  {
    question: "Can a tutor help with these practice questions?",
    answer: "Yes. A ScienceDojo tutor can review the questions, explain mistakes, and help turn practice into a structured learning plan.",
  },
];

function PracticeExample({ className = "" }: { className?: string }) {
  return (
    <aside className={`overflow-hidden rounded-[1.75rem] bg-[#081f3c] p-4 text-white shadow-[0_24px_55px_rgba(8,31,60,.18)] sm:p-5 ${className}`} aria-label="Example practice question">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-200">See how practice works</p>
        <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/75">GCSE Maths · Algebra</span>
      </div>
      <div className="rounded-2xl bg-white p-5 text-secondary sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-lg bg-[#e8f4ff] px-3 py-1.5 text-xs font-black text-primary">Question 01</span>
          <span className="text-xs font-semibold text-secondary/50">Try it first</span>
        </div>
        <p className="mt-5 text-2xl font-black tracking-tight sm:text-[1.7rem]">Solve 3x + 7 = 31.</p>
        <p className="mt-2 text-sm leading-6 text-secondary/60">Work it out, then check each step.</p>
        <details className="group mt-6 overflow-hidden rounded-xl border border-[#cfe3f4] bg-[#f6fbff]">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
            Reveal the worked answer
            <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="border-t border-[#dceaf5] bg-white px-4 py-4 text-sm leading-6 text-secondary/75">
            <p className="font-black text-secondary">x = 8</p>
            <p className="mt-2">Subtract 7 from both sides to get 3x = 24. Divide by 3 to get x = 8.</p>
          </div>
        </details>
      </div>
    </aside>
  );
}

export const metadata: Metadata = {
  title: "PracticeDojo | Free Practice Questions",
  description: "Choose a subject and topic to create free practice questions with revealable answers and worked guidance across supported curricula and stages.",
  alternates: {
    canonical: `${siteUrl}/ai-practice-studio`,
  },
  openGraph: {
    title: "PracticeDojo | ScienceDojo",
    description: "Create free practice questions with answers and worked guidance in PracticeDojo.",
    url: `${siteUrl}/ai-practice-studio`,
    siteName: "ScienceDojo",
    type: "website",
  },
};

export default async function AiPracticeStudioPage({ searchParams }: { searchParams: Promise<{ subject?: string }> }) {
  const { subject } = await searchParams;
  const flags = await getPublicFeatureFlagMap();
  if (!flags.practice_dojo_enabled) {
    return (
      <FeatureUnavailable
        eyebrow="PracticeDojo"
        title="PracticeDojo is almost ready."
        message="We are preparing this learning tool carefully before opening it to students and families."
      />
    );
  }

  return (
    <main className="min-w-0 overflow-x-hidden bg-[#f5f9fc] text-secondary">
      <AiPracticeStudioViewTracker />
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={faqJsonLd(faqs)} />

      <section className="relative overflow-hidden px-4 pb-8 pt-8 sm:pt-10 md:px-8 lg:pb-10 lg:pt-12" aria-labelledby="practice-heading">
        <div className="pointer-events-none absolute -left-28 -top-40 h-96 w-96 rounded-full bg-[#d8efff] blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-[#dff8f0] blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,.9fr)] lg:gap-12">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white px-3 py-1.5 text-xs font-black uppercase tracking-[0.13em] text-primary shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#00b8e6]" aria-hidden="true" /> Free practice · no sign-up
            </p>
            <h1 id="practice-heading" className="mt-5 max-w-xl text-[2.15rem] font-black leading-[1.08] tracking-tight text-secondary sm:text-5xl lg:text-[3.35rem]">Practice a topic. Understand each step.</h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-secondary/70 sm:text-lg sm:leading-8">Choose a subject and topic, try the questions, then reveal the worked guidance when you&apos;re ready.</p>
            <AiPracticeStudioCtaLink
              href="#studio"
              cta="try_free_tool"
              source="ai_practice_studio_hero"
              className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              Jump to the practice builder <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </AiPracticeStudioCtaLink>
          </div>

          <PracticeExample />
        </div>
      </section>

      <section id="studio" className="mx-auto w-full max-w-6xl min-w-0 scroll-mt-24 px-4 pb-12 pt-4 md:px-8 md:pb-16 md:pt-6" aria-label="Practice builder">
        <QuestionGenerator initialSubject={subject} />
      </section>

      {flags.free_assessment_enabled && <section className="border-t border-[#e0eaf2] bg-white px-4 py-12 md:px-8 md:py-14" aria-labelledby="practice-help-heading">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 rounded-[1.75rem] bg-[#08284d] p-6 text-white sm:p-8 md:flex-row md:items-center md:justify-between">
          <div><p className="text-sm font-bold text-cyan-200">For parents</p><h2 id="practice-help-heading" className="mt-2 text-2xl font-black">Found a topic that needs more support?</h2><p className="mt-2 max-w-xl leading-7 text-white/75">A tutor can talk it through with your child and help decide what to practise next.</p></div>
          <AiPracticeStudioCtaLink
            href="/free-assessment"
            cta="request_free_assessment"
            source="ai_practice_studio_parent_reassurance"
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-[#073a72] transition hover:bg-cyan-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            Request a free assessment <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </AiPracticeStudioCtaLink>
        </div>
      </section>}

      <section className={`bg-white px-4 pb-16 md:px-8 md:pb-20 ${flags.free_assessment_enabled ? "pt-2 md:pt-4" : "border-t border-[#e0eaf2] pt-12 md:pt-16"}`} aria-labelledby="practice-faq-heading">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-bold text-primary">Good to know</p>
          <h2 id="practice-faq-heading" className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">A few quick answers.</h2>
          <div className="mt-6 divide-y divide-secondary/10 rounded-2xl border border-secondary/10">
            {faqs.map((faq) => (
              <details key={faq.question} className="group px-5 py-1 sm:px-6">
                <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-3 text-left font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
                  <span>{faq.question}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-primary transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <p className="max-w-2xl pb-5 text-sm leading-7 text-secondary/70 sm:text-base">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

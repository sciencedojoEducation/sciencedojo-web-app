import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import JsonLd from "@/components/JsonLd";
import AiPracticeStudioCtaLink from "@/components/analytics/AiPracticeStudioCtaLink";
import { faqJsonLd, organizationJsonLd, siteUrl } from "@/lib/seo";
import AiPracticeStudioViewTracker from "./AiPracticeStudioViewTracker";
import QuestionGenerator from "./QuestionGenerator";

const faqs = [
  {
    question: "What is Practice Dojo?",
    answer: "Practice Dojo is a free ScienceDojo knowledge-check system for structured curriculum-aligned practice by educational stage, curriculum, level, subject, and topic.",
  },
  {
    question: "Which curricula does Practice Dojo support?",
    answer: "It supports major pathways including UK National Curriculum, Cambridge, Edexcel, AQA, SQA, IB, GCSE, IGCSE, A-Level, and primary or lower secondary routes.",
  },
  {
    question: "Can a tutor help with these practice questions?",
    answer: "Yes. A ScienceDojo tutor can review the questions, explain mistakes, and help turn practice into a structured learning plan.",
  },
];

export const metadata: Metadata = {
  title: "Practice Dojo | Free Curriculum-Aligned Practice Questions | ScienceDojo",
  description: "Free structured STEM practice and curriculum-aligned knowledge checks for KS1, KS2, KS3, GCSE, IGCSE, A-Level, IB, Cambridge, Edexcel, AQA, SQA, and more.",
  alternates: {
    canonical: `${siteUrl}/ai-practice-studio`,
  },
  openGraph: {
    title: "Practice Dojo | ScienceDojo",
    description: "Try free curriculum-aligned knowledge checks with Practice Dojo.",
    url: `${siteUrl}/ai-practice-studio`,
    siteName: "ScienceDojo",
    type: "website",
  },
};

export default function AiPracticeStudioPage() {
  return (
    <main className="overflow-x-hidden bg-background text-secondary">
      <AiPracticeStudioViewTracker />
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={faqJsonLd(faqs)} />

      <section className="relative overflow-hidden bg-gradient-to-br from-[#06172f] via-[#073f7b] to-[#0066cc] px-4 py-20 text-white md:px-8 md:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_22%,rgba(0,245,212,0.14),transparent_30%),radial-gradient(circle_at_18%_76%,rgba(255,255,255,0.1),transparent_28%)]" />
        <div className="relative mx-auto max-w-5xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-100/80">Free structured practice</p>
          <h1 className="mt-5 text-4xl font-black tracking-tight md:text-6xl">Test what you know. Discover what needs support.</h1>
          <p className="mx-auto mt-6 max-w-3xl text-xl font-black leading-8 text-white">
            Practice Dojo gives students structured STEM practice aligned with GCSE, IGCSE, IB, and A-Level learning.
          </p>
          <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-white/75">
            Use it to practise concepts, spot weak areas, and build confidence before small gaps become exam stress.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <AiPracticeStudioCtaLink
              href="#studio"
              cta="try_free_tool"
              source="ai_practice_studio_hero"
              className="rounded-2xl bg-primary px-7 py-4 text-sm font-black uppercase tracking-[0.14em] text-white shadow-xl shadow-primary/20 transition-all hover:bg-primary-hover"
            >
              Start Knowledge Check
            </AiPracticeStudioCtaLink>
            <AiPracticeStudioCtaLink
              href="/free-assessment"
              cta="request_free_assessment"
              source="ai_practice_studio_hero"
              className="rounded-2xl border border-white/20 bg-white/10 px-7 py-4 text-sm font-black uppercase tracking-[0.14em] text-white transition-all hover:bg-white/15"
            >
              Book Free Assessment
            </AiPracticeStudioCtaLink>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl min-w-0 px-4 pt-14 md:px-8 md:pt-16">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              step: "01",
              title: "Practise concepts",
              text: "Choose the curriculum, subject, and topic so practice feels focused rather than random.",
            },
            {
              step: "02",
              title: "Spot gaps",
              text: "Use the questions and worked guidance to notice which ideas need more support.",
            },
            {
              step: "03",
              title: "Build confidence",
              text: "Turn uncertainty into clearer next steps, with tutor support available if needed.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-3xl border border-secondary/10 bg-white p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">{item.step}</p>
              <h2 className="mt-3 text-xl font-black text-secondary">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-secondary/60">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="studio" className="mx-auto w-full max-w-5xl min-w-0 px-4 py-12 md:px-8">
        <QuestionGenerator />
      </section>

      <section className="mx-auto grid w-full max-w-5xl min-w-0 gap-6 px-4 pb-20 md:grid-cols-2 md:px-8">
        <div className="rounded-3xl border border-secondary/10 bg-white p-7 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Public learning gateway</p>
          <h2 className="mt-3 text-2xl font-black">Free curriculum-aligned knowledge checks</h2>
          <p className="mt-4 leading-7 text-secondary/65">
            Practice Dojo is open access. It helps students understand where they feel secure, where they feel uncertain, and what might need clearer explanation.
          </p>
        </div>
        <div className="rounded-3xl bg-secondary p-7 text-white shadow-xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200/70">Parent reassurance</p>
          <h2 className="mt-3 text-2xl font-black">What happens after an assessment?</h2>
          <div className="mt-5 grid gap-3">
            {[
              "Identify knowledge gaps",
              "Create a learning plan",
              "Match with the right tutor",
              "Track progress over time",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm font-bold leading-6 text-white/75">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-cyan-200" aria-hidden="true" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <AiPracticeStudioCtaLink
            href="/free-assessment"
            cta="request_free_assessment"
            source="ai_practice_studio_parent_reassurance"
            className="mt-6 inline-flex justify-center rounded-2xl bg-primary px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-white transition-all hover:bg-primary-hover"
          >
            Book Free Assessment
          </AiPracticeStudioCtaLink>
        </div>
      </section>
    </main>
  );
}

import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import AiPracticeStudioCtaLink from "@/components/analytics/AiPracticeStudioCtaLink";
import { faqJsonLd, organizationJsonLd, siteUrl } from "@/lib/seo";
import AiPracticeStudioViewTracker from "./AiPracticeStudioViewTracker";
import QuestionGenerator from "./QuestionGenerator";

const faqs = [
  {
    question: "What is AI Practice Studio?",
    answer: "AI Practice Studio is a free ScienceDojo study tool that generates targeted practice questions by educational stage, curriculum, level, subject, and topic.",
  },
  {
    question: "Which curricula does AI Practice Studio support?",
    answer: "It supports major pathways including UK National Curriculum, Cambridge, Edexcel, AQA, SQA, IB, GCSE, IGCSE, A-Level, and primary or lower secondary routes.",
  },
  {
    question: "Can a tutor help with the generated questions?",
    answer: "Yes. A ScienceDojo tutor can review the questions, explain mistakes, and help turn practice into a structured learning plan.",
  },
];

export const metadata: Metadata = {
  title: "AI Practice Studio | Free Curriculum-Aligned Practice Questions | ScienceDojo",
  description: "Generate curriculum-aligned practice questions for KS1, KS2, KS3, GCSE, IGCSE, A-Level, IB, Cambridge, Edexcel, AQA, SQA, and more.",
  alternates: {
    canonical: `${siteUrl}/ai-practice-studio`,
  },
  openGraph: {
    title: "AI Practice Studio | ScienceDojo",
    description: "Generate curriculum-aligned practice instantly with a free ScienceDojo study tool.",
    url: `${siteUrl}/ai-practice-studio`,
    siteName: "ScienceDojo",
    type: "website",
  },
};

export default function AiPracticeStudioPage() {
  return (
    <main className="bg-background text-secondary">
      <AiPracticeStudioViewTracker />
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={faqJsonLd(faqs)} />

      <section className="bg-gradient-to-br from-[#002244] via-[#004488] to-[#0066cc] px-4 py-20 text-white md:px-8 md:py-24">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-100/80">Free AI study tool</p>
          <h1 className="mt-5 text-4xl font-black tracking-tight md:text-6xl">AI Practice Studio</h1>
          <p className="mx-auto mt-6 max-w-2xl text-xl font-black leading-8 text-white">
            Generate curriculum-aligned practice instantly.
          </p>
          <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-white/75">
            Supports UK National Curriculum, Cambridge, Edexcel, AQA, SQA, IB, and more.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <AiPracticeStudioCtaLink
              href="#studio"
              cta="try_free_tool"
              source="ai_practice_studio_hero"
              className="rounded-2xl bg-primary px-7 py-4 text-sm font-black uppercase tracking-[0.14em] text-white shadow-xl shadow-primary/20 transition-all hover:bg-primary-hover"
            >
              Try Free Tool
            </AiPracticeStudioCtaLink>
            <AiPracticeStudioCtaLink
              href="/free-assessment"
              cta="request_free_assessment"
              source="ai_practice_studio_hero"
              className="rounded-2xl border border-white/20 bg-white/10 px-7 py-4 text-sm font-black uppercase tracking-[0.14em] text-white transition-all hover:bg-white/15"
            >
              Request Free Assessment
            </AiPracticeStudioCtaLink>
          </div>
        </div>
      </section>

      <section id="studio" className="mx-auto max-w-5xl px-4 py-12 md:px-8">
        <QuestionGenerator />
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-4 pb-20 md:grid-cols-2 md:px-8">
        <div className="rounded-3xl border border-secondary/10 bg-white p-7 shadow-sm">
          <h2 className="text-2xl font-black">Targeted practice questions</h2>
          <p className="mt-4 leading-7 text-secondary/65">
            Choose the stage, curriculum, level, subject, and topic so practice feels relevant instead of random.
          </p>
        </div>
        <div className="rounded-3xl bg-secondary p-7 text-white shadow-xl">
          <h2 className="text-2xl font-black">Need support after practice?</h2>
          <p className="mt-4 leading-7 text-white/70">ScienceDojo tutors can help students turn mistakes into a clear weekly learning plan.</p>
          <AiPracticeStudioCtaLink
            href="/free-assessment"
            cta="request_free_assessment"
            source="ai_practice_studio_static"
            className="mt-6 inline-flex rounded-2xl bg-primary px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-white"
          >
            Request Free Assessment
          </AiPracticeStudioCtaLink>
        </div>
      </section>
    </main>
  );
}

import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import JsonLd from "@/components/JsonLd";
import AiPracticeStudioCtaLink from "@/components/analytics/AiPracticeStudioCtaLink";
import { faqJsonLd, organizationJsonLd, siteUrl } from "@/lib/seo";
import AiPracticeStudioViewTracker from "./AiPracticeStudioViewTracker";
import QuestionGenerator from "./QuestionGenerator";
import FeatureUnavailable from "@/components/FeatureUnavailable";
import { isPublicFeatureEnabled } from "@/lib/feature-flags";

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
  const enabled = await isPublicFeatureEnabled("practice_dojo_enabled");
  if (!enabled) {
    return (
      <FeatureUnavailable
        eyebrow="PracticeDojo"
        title="PracticeDojo is almost ready."
        message="We are preparing this learning tool carefully before opening it to students and families."
      />
    );
  }

  return (
    <main className="overflow-x-hidden bg-background text-secondary">
      <AiPracticeStudioViewTracker />
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={faqJsonLd(faqs)} />

      <section className="relative overflow-hidden bg-gradient-to-br from-[#06172f] via-[#073f7b] to-[#0066cc] px-4 py-12 text-white md:px-8 md:py-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_22%,rgba(0,245,212,0.14),transparent_30%),radial-gradient(circle_at_18%_76%,rgba(255,255,255,0.1),transparent_28%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-[1fr_.8fr] lg:gap-12">
          <div>
            <p className="text-sm font-bold text-cyan-200">Free PracticeDojo questions</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight tracking-tight md:text-5xl">Choose a topic. Try a question. See how it works.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/80">Create free practice questions in Maths, Science, English and more. Try each one, then reveal the answer and worked guidance.</p>
            <AiPracticeStudioCtaLink
              href="#studio"
              cta="try_free_tool"
              source="ai_practice_studio_hero"
              className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-extrabold text-[#073a72] shadow-lg transition hover:bg-cyan-50"
            >
              Make a practice set <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </AiPracticeStudioCtaLink>
          </div>
          <div className="overflow-hidden rounded-3xl border border-white/20 bg-white text-secondary shadow-2xl">
            <div className="border-b border-secondary/10 bg-[#eaf4ff] px-5 py-4 sm:px-6"><p className="text-xs font-black uppercase tracking-widest text-primary">See an example</p><p className="mt-1 text-sm font-semibold text-secondary/65">GCSE Maths · Algebra</p></div>
            <div className="p-5 sm:p-6"><p className="text-sm font-bold text-secondary/45">Question 1</p><p className="mt-2 text-xl font-black">Solve 3x + 7 = 31.</p><p className="mt-3 text-sm text-secondary/60">Try it yourself before checking the steps.</p>
              <details className="group mt-5 rounded-xl border border-primary/20 bg-[#f5f9ff]"><summary className="cursor-pointer list-none px-4 py-3 text-sm font-bold text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">Reveal worked answer <span className="group-open:hidden">+</span><span className="hidden group-open:inline">−</span></summary><div className="border-t border-primary/10 px-4 py-4 text-sm leading-6 text-secondary/75"><p className="font-black text-secondary">x = 8</p><p className="mt-2">Subtract 7 from both sides: 3x = 24. Divide by 3: x = 8.</p></div></details>
            </div>
          </div>
        </div>
      </section>

      <section id="studio" className="mx-auto w-full max-w-5xl min-w-0 scroll-mt-24 px-4 py-10 md:px-8 md:py-14">
        <QuestionGenerator initialSubject={subject} />
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 pb-16 md:px-8 md:pb-20" aria-labelledby="practice-help-heading">
        <div className="flex flex-col gap-5 rounded-3xl bg-[#071a35] p-6 text-white sm:p-8 md:flex-row md:items-center md:justify-between">
          <div><p className="text-sm font-bold text-cyan-200">For parents</p><h2 id="practice-help-heading" className="mt-2 text-2xl font-black">Want help with a difficult topic?</h2><p className="mt-2 max-w-xl leading-7 text-white/75">A tutor can talk through a question with your child and help decide what to practise next.</p></div>
          <AiPracticeStudioCtaLink
            href="/free-assessment"
            cta="request_free_assessment"
            source="ai_practice_studio_parent_reassurance"
            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-[#073a72] transition hover:bg-cyan-50"
          >
            Request a free assessment
          </AiPracticeStudioCtaLink>
        </div>
      </section>
    </main>
  );
}

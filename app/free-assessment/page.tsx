import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { faqJsonLd, localBusinessJsonLd, organizationJsonLd, siteUrl } from "@/lib/seo";
import FreeAssessmentForm from "./FreeAssessmentForm";
import FreeAssessmentViewTracker from "./FreeAssessmentViewTracker";
import MentorAttributionTracker from "@/components/MentorAttributionTracker";

const faqs = [
  {
    question: "What happens after I request a free assessment?",
    answer: "ScienceDojo reviews your child's curriculum, confidence, learning habits, parent concerns, and goals before the assessment call, so the conversation starts from a thoughtful educational profile.",
  },
  {
    question: "Is the assessment really free?",
    answer: "Yes. The learning assessment is free and designed to help parents understand the best next step without pressure.",
  },
  {
    question: "Which curricula can ScienceDojo support?",
    answer: "ScienceDojo supports British and international curricula, including GCSE, A-Level, IB, and international school pathways.",
  },
];

export const metadata: Metadata = {
  title: "Free Learning Assessment | ScienceDojo",
  description: "Start a thoughtful ScienceDojo learning intake for GCSE, IGCSE, IB, and A-Level STEM tutoring support.",
  alternates: {
    canonical: `${siteUrl}/free-assessment`,
  },
  openGraph: {
    title: "Free Learning Assessment | ScienceDojo",
    description: "Start a thoughtful learning intake and get a clearer next step for your child.",
    url: `${siteUrl}/free-assessment`,
    siteName: "ScienceDojo",
    type: "website",
  },
};

export default async function FreeAssessmentPage({
  searchParams,
}: {
  searchParams?: Promise<{ tutor?: string; r?: string }>;
}) {
  const query = searchParams ? await searchParams : {};
  const trustItems = ["No pressure", "Confidence-led intake", "Verified STEM tutors", "Parent-visible support"];

  return (
    <main className="bg-background text-secondary">
      <FreeAssessmentViewTracker />
      {query.tutor && (
        <MentorAttributionTracker landingSlug={query.tutor} referrerSlug={query.r || query.tutor} />
      )}
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={localBusinessJsonLd()} />
      <JsonLd data={faqJsonLd(faqs)} />

      <section className="bg-gradient-to-br from-[#002244] via-[#004488] to-[#0066cc] px-4 py-20 text-white md:px-8 md:py-28">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-100/80">Premium learning intake</p>
          <h1 className="mt-5 text-4xl font-black leading-[1.08] tracking-tight md:text-6xl">Help us understand your child properly.</h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-white/75">
            This guided intake helps us understand confidence, curriculum, learning habits, and parent concerns before recommending the right tutoring support.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 md:px-8 md:py-16 lg:grid-cols-[0.72fr_1.28fr]">
        <aside className="h-fit rounded-[2rem] border border-secondary/10 bg-white p-7 shadow-sm lg:sticky lg:top-28">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">What this is</p>
          <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight">The beginning of a learning diagnosis, not a sales form.</h2>
          <p className="mt-5 leading-7 text-secondary/65">
            ScienceDojo does not sell hours. We use this intake to understand where support is needed, what confidence looks like right now, and which tutor style may fit.
          </p>
          <div className="mt-7 grid gap-3">
            {trustItems.map((item) => (
              <div key={item} className="rounded-2xl bg-surface p-4 text-sm font-black text-secondary/75">
                {item}
              </div>
            ))}
          </div>
          <div className="mt-7 rounded-3xl border border-primary/10 bg-primary/5 p-5">
            <p className="text-sm font-black text-secondary">Parents often tell us:</p>
            <p className="mt-2 text-sm font-bold leading-7 text-secondary/58">
              &ldquo;My child understands more than their grades show.&rdquo; This intake is designed to uncover that gap calmly.
            </p>
          </div>
        </aside>

        <FreeAssessmentForm />
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-20 md:px-8">
        <div className="divide-y divide-secondary/10 rounded-3xl border border-secondary/10 bg-white shadow-sm">
          {faqs.map((faq) => (
            <div key={faq.question} className="p-6">
              <h2 className="font-black">{faq.question}</h2>
              <p className="mt-3 leading-7 text-secondary/65">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

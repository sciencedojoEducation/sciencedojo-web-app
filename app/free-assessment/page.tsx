import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { faqJsonLd, localBusinessJsonLd, organizationJsonLd, siteUrl } from "@/lib/seo";
import FreeAssessmentForm from "./FreeAssessmentForm";
import FreeAssessmentViewTracker from "./FreeAssessmentViewTracker";

const faqs = [
  {
    question: "What happens after I request a free assessment?",
    answer: "ScienceDojo reviews your child's subject, curriculum, learning challenge, and preferred lesson time, then recommends a suitable online tutoring plan.",
  },
  {
    question: "Is the assessment really free?",
    answer: "Yes. The 30-minute learning assessment is free and designed to help parents understand the best next step without pressure.",
  },
  {
    question: "Which curricula can ScienceDojo support?",
    answer: "ScienceDojo supports British and international curricula, including GCSE, A-Level, IB, and international school pathways.",
  },
];

export const metadata: Metadata = {
  title: "Book a Free Learning Assessment | ScienceDojo",
  description: "Book a free 30-minute learning assessment with ScienceDojo and get a personalized online tutoring recommendation for your child.",
  alternates: {
    canonical: `${siteUrl}/free-assessment`,
  },
  openGraph: {
    title: "Book a Free Learning Assessment | ScienceDojo",
    description: "Get a personalized online tutoring recommendation for your child.",
    url: `${siteUrl}/free-assessment`,
    siteName: "ScienceDojo",
    type: "website",
  },
};

export default function FreeAssessmentPage() {
  const trustItems = ["No pressure", "Personalized recommendation", "Online tutoring", "British and international curricula"];

  return (
    <main className="bg-background text-secondary">
      <FreeAssessmentViewTracker />
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={localBusinessJsonLd()} />
      <JsonLd data={faqJsonLd(faqs)} />

      <section className="bg-gradient-to-br from-[#002244] via-[#004488] to-[#0066cc] px-4 py-20 text-white md:px-8 md:py-24">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-100/80">Free parent consultation</p>
          <h1 className="mt-5 text-4xl font-black tracking-tight md:text-6xl">Book a Free 30-Minute Learning Assessment</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/75">
            Tell us about your child, and we&apos;ll recommend a suitable tutoring plan.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:px-8 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="h-fit rounded-3xl border border-secondary/10 bg-white p-7 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">What you get</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight">A clear next step for your child.</h2>
          <p className="mt-5 leading-7 text-secondary/65">
            We use your answers to understand the student&apos;s confidence, curriculum, subject needs, and schedule before recommending a practical tutoring route.
          </p>
          <div className="mt-7 grid gap-3">
            {trustItems.map((item) => (
              <div key={item} className="rounded-2xl bg-surface p-4 font-black">
                {item}
              </div>
            ))}
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

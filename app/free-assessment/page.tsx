import type { Metadata } from "next";
import { ClipboardList, Compass, MessageCircle, Plus } from "lucide-react";
import JsonLd from "@/components/JsonLd";
import ProductScreenshotFrame from "@/components/ProductScreenshotFrame";
import { faqJsonLd, localBusinessJsonLd, organizationJsonLd, siteUrl } from "@/lib/seo";
import FreeAssessmentForm from "./FreeAssessmentForm";
import FreeAssessmentViewTracker from "./FreeAssessmentViewTracker";
import MentorAttributionTracker from "@/components/MentorAttributionTracker";
import FeatureUnavailable from "@/components/FeatureUnavailable";
import { getPublicFeatureFlagMap } from "@/lib/feature-flags";

const faqs = [
  {
    question: "What happens after I request a free assessment?",
    answer: "ScienceDojo reviews what you share and contacts you by email to arrange a free conversation. We can clarify curriculum details and goals together then.",
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

const assessmentJourney = [
  { icon: ClipboardList, title: "Share", description: "What feels difficult" },
  { icon: MessageCircle, title: "Talk", description: "A free conversation" },
  { icon: Compass, title: "Find a direction", description: "A suitable next step" },
];

function ParentWorkspacePreview({ className = "" }: { className?: string }) {
  return (
    <figure className={className}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Inside ScienceDojo</p>
        <span className="rounded-full bg-[#e6f2fb] px-3 py-1 text-[11px] font-bold text-[#295b7a]">For parents</span>
      </div>
      <ProductScreenshotFrame
        src="/images/product-tour/parent-home-mobile.webp"
        alt="Example parent dashboard showing a scheduled Maths lesson and learning activity, with sample data"
        width={560}
        height={800}
        sizes="(max-width: 1024px) 90vw, 410px"
        loading="lazy"
      />
      <figcaption className="mt-3 text-xs leading-5 text-secondary/55">Parent workspace shown with sample data</figcaption>
    </figure>
  );
}

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
  const flags = await getPublicFeatureFlagMap();
  if (!flags.free_assessment_enabled) {
    return (
      <FeatureUnavailable
        eyebrow="Assessment opening soon"
        title="Free assessments are being prepared."
        message="We are preparing this intake carefully before opening it to more families. Please contact ScienceDojo if you need help choosing the next step."
        ctaHref="/contact"
        ctaLabel="Contact ScienceDojo"
      />
    );
  }

  const query = searchParams ? await searchParams : {};
  const showParentPreview = flags.parent_dashboard_enabled && flags.booking_enabled;

  return (
    <main className="min-w-0 bg-[#f6f9fc] text-secondary">
      <FreeAssessmentViewTracker />
      {query.tutor && (
        <MentorAttributionTracker landingSlug={query.tutor} referrerSlug={query.r || query.tutor} />
      )}
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={localBusinessJsonLd()} />
      <JsonLd data={faqJsonLd(faqs)} />

      <section className="relative overflow-hidden px-4 pb-12 pt-8 sm:pt-12 md:px-8 lg:pb-16 lg:pt-16" aria-labelledby="assessment-heading">
        <div className="pointer-events-none absolute -left-28 -top-40 h-96 w-96 rounded-full bg-[#dfefff] blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl items-start gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-12">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white px-3 py-1.5 text-xs font-black uppercase tracking-[0.13em] text-primary shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#00b8e6]" aria-hidden="true" />
              Free learning assessment
            </p>
            <h1 id="assessment-heading" className="mt-5 max-w-xl text-[2.15rem] font-black leading-[1.08] tracking-tight text-secondary sm:text-5xl lg:text-[3.35rem]">A clearer next step starts here.</h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-secondary/70 sm:text-lg sm:leading-8">Tell us what feels difficult. We&apos;ll review it and email you to arrange a free conversation.</p>

            {showParentPreview && <ParentWorkspacePreview className="mt-9 hidden max-w-[27rem] lg:block" />}
            <ol className="mt-7 grid grid-cols-3 gap-2 sm:gap-3" aria-label="What happens next">
              {assessmentJourney.map((item, index) => {
                const Icon = item.icon;
                return (
                  <li key={item.title} className="min-w-0 rounded-2xl border border-[#dceaf5] bg-white p-3 shadow-[0_8px_24px_rgba(21,70,116,.04)] sm:p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e8f4ff] text-primary" aria-hidden="true"><Icon className="h-4 w-4" /></div>
                    <p className="mt-3 text-xs font-black text-secondary sm:text-sm"><span className="sr-only">Step {index + 1}: </span>{item.title}</p>
                    <p className="mt-1 hidden text-xs leading-5 text-secondary/60 sm:block">{item.description}</p>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="min-w-0"><FreeAssessmentForm /></div>

          {showParentPreview && <ParentWorkspacePreview className="mx-auto w-full max-w-[24rem] lg:hidden" />}
        </div>
      </section>

      <section className="border-t border-[#e0eaf2] bg-white px-4 py-12 md:px-8 md:py-16" aria-labelledby="assessment-faq-heading">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-bold text-primary">Good to know</p>
          <h2 id="assessment-faq-heading" className="mt-2 text-2xl font-black tracking-tight text-secondary sm:text-3xl">A few quick answers.</h2>
          <div className="mt-6 divide-y divide-secondary/10 rounded-2xl border border-secondary/10 bg-white">
            {faqs.map((faq) => (
              <details key={faq.question} className="group px-5 py-1 sm:px-6">
                <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-3 text-left font-bold text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
                  <span>{faq.question}</span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eaf4ff] text-primary" aria-hidden="true"><Plus className="h-4 w-4 transition-transform group-open:rotate-45" /></span>
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

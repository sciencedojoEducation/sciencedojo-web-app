import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import {
  AssessmentCTA,
  AiPracticeStudioSeoCta,
  InternalLinksSection,
  ScienceDojoMethodSection,
  SeoAnswerBlock,
  StudentStrugglesSection,
  TrustSection,
} from "@/components/seo/SeoPageSections";
import {
  courseJsonLd,
  createPageMetadata,
  faqJsonLd,
  localBusinessJsonLd,
  organizationJsonLd,
  type SeoPage,
  seoPageMap,
  seoPages,
} from "@/lib/seo";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return seoPages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = seoPageMap.get(slug);

  if (!page) {
    return {};
  }

  return createPageMetadata(page);
}

export default async function SeoPage({ params }: PageProps) {
  const { slug } = await params;
  const page = seoPageMap.get(slug);

  if (!page) {
    notFound();
  }

  const isTutoringPage = page.kind === "service" || page.kind === "curriculum" || page.kind === "location";
  const relatedPages = page.related
    .map((relatedSlug) => seoPageMap.get(relatedSlug))
    .filter((relatedPage): relatedPage is SeoPage => Boolean(relatedPage));

  return (
    <article className="bg-background text-secondary">
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={localBusinessJsonLd()} />
      <JsonLd data={faqJsonLd(page.faqs)} />
      {isTutoringPage && <JsonLd data={courseJsonLd(page)} />}

      <section className="relative overflow-hidden bg-gradient-to-br from-[#002244] via-[#004488] to-[#0066cc] px-4 py-20 text-white md:px-8 md:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(0,229,194,0.28)_0%,_transparent_58%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="mb-5 text-xs font-black uppercase tracking-[0.3em] text-cyan-100/80">{page.eyebrow}</p>
            <h1 className="max-w-3xl text-4xl font-black tracking-tight md:text-6xl">{page.h1}</h1>
            <p className="mt-7 max-w-2xl text-lg font-medium leading-8 text-white/75">{page.intro}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <AssessmentCTA />
              <Link
                href="/complete-guide-to-online-tutoring"
                className="rounded-2xl border border-white/20 bg-white/10 px-7 py-4 text-center text-sm font-black uppercase tracking-[0.14em] text-white transition-all hover:bg-white/15"
              >
                Read Parent Guide
              </Link>
            </div>
          </div>

          <SeoAnswerBlock page={page} />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-16 md:px-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">Why it helps</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Confidence grows from clear systems.</h2>
          <p className="mt-5 leading-7 text-secondary/65">
            ScienceDojo combines strong teaching, structured practice, and parent visibility so students understand what to do next after each lesson.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {page.benefits.map((benefit) => (
            <div key={benefit} className="rounded-2xl border border-secondary/10 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-sm font-black text-primary">✓</div>
              <h3 className="font-black">{benefit}</h3>
            </div>
          ))}
        </div>
      </section>

      {isTutoringPage && <StudentStrugglesSection page={page} />}
      {isTutoringPage && <ScienceDojoMethodSection />}
      {isTutoringPage && <AiPracticeStudioSeoCta page={page} />}
      <TrustSection />

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">Questions parents ask</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">FAQ</h2>
            <div className="mt-8 divide-y divide-secondary/10 rounded-3xl border border-secondary/10 bg-white shadow-sm">
              {page.faqs.map((faq) => (
                <div key={faq.question} className="p-6">
                  <h3 className="font-black">{faq.question}</h3>
                  <p className="mt-3 leading-7 text-secondary/65">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="h-fit rounded-3xl bg-secondary p-8 text-white shadow-2xl">
            <h2 className="text-2xl font-black">Ready to find the right support?</h2>
            <p className="mt-4 leading-7 text-white/70">
              Book a free assessment or browse verified tutors. We will help you choose a calm, clear next step.
            </p>
            <AssessmentCTA className="mt-7 flex w-full px-6" />
            <InternalLinksSection pages={relatedPages} />
          </aside>
        </div>
      </section>
    </article>
  );
}

import type { Metadata } from "next";
import { randomUUID } from "node:crypto";
import { connection } from "next/server";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Code2, Sparkles } from "lucide-react";
import BusinessOffer from "./BusinessOffer";
import BusinessEvidence from "./BusinessEvidence";
import BusinessEnquiryForm from "./BusinessEnquiryForm";
import { getPublicFeatureFlagMap } from "@/lib/feature-flags";
import { siteUrl } from "@/lib/seo";

const title = "Onboarding Task Pilot | ScienceDojo for Business";
const description = "Task-based onboarding for English-speaking IT service and software implementation teams. One approved task, interactive practice, and an assessment. From €1,490.";
const emailHref = `mailto:hello@sciencedojo.co.uk?subject=${encodeURIComponent("ScienceDojo Onboarding Task Pilot — Enquiry")}&body=${encodeURIComponent("Hello Piumal,\n\nI'd like to discuss an onboarding pilot.\n\nOrganisation: \nWhat should our people be able to do? \n\nThank you!")}`;
const focus = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#006B70]";
const button = `inline-flex min-h-12 items-center justify-center gap-3 rounded-md bg-[#006B70] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#00565B] ${focus}`;
const navItems = [["The offer", "offer"], ["Work", "work"], ["Studio", "about"]];
const services = [
  { icon: BookOpen, title: "Further tasks & learning journeys", text: "Build on an initial pilot with additional approved tasks, roles, or learning experiences.", deliverable: "A separately scoped learning plan, practice activities, and assessment aligned to your next brief.", example: "Example brief: extend a handover pilot to a second role or an agreed escalation process." },
  { icon: Code2, title: "Design support for learning agencies", text: "Bring Piumal into a defined part of a project you already manage, using your agreed requirements and production process.", deliverable: "A scenario, storyboard, or assessment, quoted separately for the contribution you need.", example: "Example brief: develop a reviewable scenario and scoring guide for your production team." },
  { icon: Sparkles, title: "Additional learning tools", text: "Explore a tailored practice or feedback tool when your brief needs more than the initial pilot.", deliverable: "An agreed prototype, feedback criteria, and a human review process, quoted separately.", example: "Custom AI, new platform features, and integrations are outside the Onboarding Task Pilot." },
];
const steps = [
  ["Define the task", "Review your materials with a subject expert. Agree the audience, scope, delivery format, and success criteria."],
  ["Review the storyboard", "Your nominated approver consolidates feedback on the objectives, scenario, and assessment before development."],
  ["Build & review", "Develop the experience using existing components, run agreed checks, and collect one consolidated review of the working version."],
  ["Check & hand over", "Correct work that does not meet the agreed specification, then hand over the approved design documents and pilot in the agreed format."],
];
const practicalDetails = [
  ["Where will the learning run?", "We confirm a tested delivery route before signing. The proposal states whether the pilot is for evaluation or continued use, where it runs, and any access period or continuing costs. LMS compatibility and integrations require separate confirmation."],
  ["What happens at handover?", "You receive the approved design documents and working pilot in the delivery format agreed in the proposal. Source files, setup guidance, and usage rights are specified there. Hosting, maintenance, and future changes are agreed and priced separately where needed."],
  ["How will we know it works?", "We agree the task and assessment criteria first. A pilot can combine learner work samples, usability feedback, and subject-expert review. Measures depend on the project."],
];

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: `${siteUrl}/business` },
  openGraph: { title, description, url: `${siteUrl}/business`, siteName: "ScienceDojo for Business", type: "website", images: [{ url: `${siteUrl}/business/opengraph-image`, width: 1200, height: 630, alt: "ScienceDojo Onboarding Task Pilot — From €1,490, subject to agreed scope" }] },
  twitter: { card: "summary_large_image", title, description, images: [{ url: `${siteUrl}/business/opengraph-image`, alt: "ScienceDojo Onboarding Task Pilot — From €1,490, subject to agreed scope" }] },
};

function BusinessBrand() {
  return <span className="inline-flex items-baseline text-2xl font-bold tracking-[-0.06em] text-[#12243A]">sciencedojo<span className="text-[#006B70]">.</span></span>;
}

export default async function BusinessPage() {
  await connection();
  const submissionToken = randomUUID();
  const flags = await getPublicFeatureFlagMap();
  return (
    <div className="min-w-0 bg-white text-[#12243A]">
      <a href="#business-content" className={`sr-only z-50 rounded-lg bg-white p-4 focus:not-sr-only focus:absolute focus:left-4 focus:top-4 ${focus}`}>Skip to content</a>
      <header className="border-b border-[#dce2e8] bg-white px-5 py-5 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5">
          <Link href="/business" aria-label="ScienceDojo for Business home" className={focus}>
            <BusinessBrand />
            <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.22em] text-[#526071]">For Business</span>
          </Link>
          <nav aria-label="Business navigation" className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm font-semibold">
            {navItems.map(([label, id]) => <a key={id} href={`#${id}`} className={`py-2 hover:text-[#006B70] ${focus}`}>{label}</a>)}
            <a href="#contact" className={`inline-flex min-h-11 items-center gap-2 py-2 text-[#006B70] hover:underline ${focus}`}>Discuss a pilot <ArrowRight className="h-4 w-4" aria-hidden="true" /></a>
          </nav>
        </div>
      </header>

      <div id="business-content" tabIndex={-1}>
        <section className="bg-white px-5 py-12 md:px-8 md:py-16" aria-labelledby="business-heading">
          <div className="mx-auto grid max-w-6xl items-center gap-x-10 gap-y-7 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-x-12">
            <div className="lg:col-start-1 lg:row-start-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#526071]">Practical onboarding for IT service teams</p>
              <h1 id="business-heading" className="mt-5 text-4xl font-bold leading-[1.04] tracking-[-0.045em] text-[#12243A] sm:text-5xl lg:text-[3.5rem]">Help new starters put your process into practice.</h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-[#526071] sm:text-lg sm:leading-8">For English-speaking IT service and software implementation teams whose new starters have instructions but need practice applying them.</p>
              <p className="mt-4 max-w-lg text-sm leading-7 text-[#526071]">Turn one approved workplace task into a short interactive experience, realistic practice, and an assessment your team can review.</p>
            </div>
            <figure className="min-w-0 lg:col-start-2 lg:row-span-3 lg:row-start-1">
              <div className="overflow-hidden rounded-lg bg-[#F3F5F7]">
                <Image src="/images/business/learning-design-hero-v1.webp" alt="Sculptural paper guides connected to learning panels and an interactive course interface" width={1536} height={1024} sizes="(max-width: 1023px) 90vw, 560px" preload className="h-auto w-full" />
              </div>
              <figcaption className="mt-5 flex flex-wrap items-center justify-between gap-x-5 gap-y-2 border-t border-[#dce2e8] pt-3">
                <span className="text-xs font-semibold text-[#526071]">From knowledge to practice.</span>
                <span className="text-xs text-[#006B70]">One task. A focused pilot.</span>
              </figcaption>
            </figure>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 lg:col-start-1 lg:row-start-2">
              <a href="#contact" className={button}>Discuss a pilot <ArrowRight className="h-4 w-4" aria-hidden="true" /></a>
              <a href="#learning-demo" className={`inline-flex min-h-12 items-center gap-2 text-sm font-semibold hover:text-[#006B70] hover:underline ${focus}`}>Try the demo <ArrowRight className="h-4 w-4" aria-hidden="true" /></a>
            </div>
            <div className="border-t border-[#dce2e8] pt-4 lg:col-start-1 lg:row-start-3"><p className="text-sm font-medium">For operations and service delivery leads with an agreed process.</p><p className="mt-2 text-sm text-[#526071]">Work directly with Piumal, from the brief to the build.</p></div>
          </div>
        </section>

        <BusinessOffer />
        <BusinessEvidence practiceEnabled={flags.practice_dojo_enabled} focusEnabled={flags.focus_dojo_enabled} />

        <section id="services" className="scroll-mt-6 bg-[#F3F5F7] px-5 py-16 md:px-8 md:py-20" aria-labelledby="services-heading">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#006B70]">Separately scoped services</p>
            <h2 id="services-heading" className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">Other ways to work together.</h2>
            <div className="mt-9 grid gap-8 md:grid-cols-3">
              {services.map(({ icon: Icon, title: heading, text, deliverable, example }) => <article key={heading} className="border-t border-[#dce2e8] py-6"><Icon className="h-7 w-7 text-[#006B70]" aria-hidden="true" /><h3 className="mt-5 text-xl font-bold">{heading}</h3><p className="mt-3 text-sm leading-7 text-[#526071]">{text}</p><p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-[#006B70]">What you receive</p><p className="mt-2 text-sm leading-6">{deliverable}</p><p className="mt-5 border-t border-[#dce2e8] pt-4 text-xs leading-6 text-[#526071]">{example}</p></article>)}
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#526071]">These services have their own scope and quote. For AI-assisted work, approved sources, data handling, feedback criteria, and human review are agreed before development.</p>
          </div>
        </section>

        <section id="process" className="scroll-mt-6 px-5 py-16 md:px-8 md:py-20" aria-labelledby="process-heading">
          <div className="mx-auto max-w-6xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#006B70]">How we work</p><h2 id="process-heading" className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Make the work reviewable at every stage.</h2><ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">{steps.map(([heading, text], index) => <li key={heading} className="border-t-2 border-[#dce2e8] pt-5"><span className="text-sm font-bold text-[#006B70]">0{index + 1}</span><h3 className="mt-3 text-lg font-bold">{heading}</h3><p className="mt-3 text-sm leading-7 text-[#526071]">{text}</p></li>)}</ol><div className="mt-10 border-t border-[#dce2e8] pt-7"><h3 className="text-lg font-semibold">A few practical details</h3><div className="mt-4 grid gap-6 md:grid-cols-3">{practicalDetails.map(([question, answer]) => <details key={question} className="border-t border-[#dce2e8] pt-3"><summary className={`min-h-11 cursor-pointer text-sm font-semibold ${focus}`}>{question}</summary><p className="mt-3 text-sm leading-7 text-[#526071]">{answer}</p></details>)}</div></div></div>
        </section>

        <section id="about" className="scroll-mt-6 bg-[#12243A] px-5 py-16 text-white md:px-8 md:py-20" aria-labelledby="about-heading">
          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[0.7fr_1fr]">
            <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a9cee7]">Meet the founder</p><h2 id="about-heading" className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Teaching, learning design, and development.</h2></div>
            <div>
              <p className="text-lg leading-8 text-[#d1dfec]">I&apos;m Piumal Mahawasala, the educational technologist behind ScienceDojo. My background brings together STEM teaching, learning design, and software development. My portfolio includes interactive e-learning projects and MSc thesis research at Saarland University into question design and the evaluation of AI-supported scientific reading.</p>
              <p className="mt-5 leading-7 text-[#d1dfec]">You work directly with me to define the workplace task, review the storyboard, test the working experience, and agree the handover. The pilot keeps that collaboration focused on one task, one learner group, and an agreed set of deliverables.</p>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
                <a href="https://piumal.com" className={`inline-flex min-h-11 items-center gap-2 font-semibold text-[#b9e0df] hover:underline ${focus}`}>Explore my professional portfolio <ArrowRight className="h-4 w-4" aria-hidden="true" /></a>
                <a href="https://piumal.com/projects/owlmentor?lang=en" className={`inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#b9e0df] hover:underline ${focus}`}>Read the thesis case study <ArrowRight className="h-4 w-4" aria-hidden="true" /></a>
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="scroll-mt-6 px-5 py-16 md:px-8 md:py-24" aria-labelledby="contact-heading">
          <div className="mx-auto grid max-w-6xl gap-10 rounded-lg bg-[#F3F5F7] px-6 py-10 sm:p-12 lg:grid-cols-[0.85fr_1.15fr]">
            <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#006B70]">Discuss a pilot</p><h2 id="contact-heading" className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">What should your people be able to do?</h2><p className="mt-5 leading-7 text-[#526071]">Tell Piumal about the task you want new starters to practise. We&apos;ll discuss whether it fits the pilot, then agree scope, delivery arrangements, and dates before work begins.</p><p className="mt-4 text-sm leading-6 text-[#526071]">No account required. Timing is optional.</p><p className="mt-6 text-sm leading-6 text-[#526071]">Prefer email? <a href={emailHref} className={`break-all font-semibold text-[#006B70] underline underline-offset-4 ${focus}`}>hello@sciencedojo.co.uk</a></p></div>
            <BusinessEnquiryForm initialSubmissionToken={submissionToken} />
          </div>
        </section>
      </div>

      <footer className="border-t border-[#dce2e8] px-5 py-8 md:px-8"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5"><div><BusinessBrand /><p className="mt-2 text-xs text-[#526071]">For Business · A learning design studio led by Piumal.</p></div><nav aria-label="Business footer" className="flex flex-wrap gap-5 text-sm text-[#526071]"><Link href="/" className={`hover:text-[#006B70] ${focus}`}>ScienceDojo tutoring</Link><Link href="/privacy" className={focus}>Privacy</Link><Link href="/terms" className={focus}>Terms</Link></nav><p className="text-xs text-[#526071]">© {new Date().getFullYear()} ScienceDojo</p></div></footer>
    </div>
  );
}

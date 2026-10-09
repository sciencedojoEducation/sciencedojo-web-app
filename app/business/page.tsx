import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Code2, Sparkles } from "lucide-react";
import WorkplaceDemo from "./WorkplaceDemo";
import BusinessOffer from "./BusinessOffer";
import BusinessEvidence from "./BusinessEvidence";
import { getPublicFeatureFlagMap } from "@/lib/feature-flags";
import { siteUrl } from "@/lib/seo";

const title = "ScienceDojo for Business | Onboarding & Learning Design";
const description = "Turn your team's guides, slides, and expertise into interactive onboarding and skills training. Instructional design and development in one founder-led studio.";
const emailHref = `mailto:hello@sciencedojo.co.uk?subject=${encodeURIComponent("ScienceDojo for Business — Project enquiry")}&body=${encodeURIComponent("Hello Piumal,\n\nI'd like to discuss a learning project.\n\nOrganization: \nWhat people need to do: \nAudience: \nExisting materials: \nDelivery platform, if any: \nTimeline: \n\nThank you!")}`;
const focus = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#006B70]";
const button = `inline-flex min-h-12 items-center justify-center gap-3 rounded-md bg-[#006B70] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#00565B] ${focus}`;
const navItems = [["The offer", "offer"], ["Work", "work"], ["Studio", "about"]];
const services = [
  { icon: BookOpen, title: "Interactive onboarding & skills training", text: "Help new starters navigate a process, practise a customer conversation, or make a sound handover decision.", deliverable: "Scenario-based modules, guided practice, explanations, and knowledge checks.", example: "Example brief: turn a new-starter handbook into a guided first-week learning journey." },
  { icon: Code2, title: "Instructional design & content structure", text: "Find the essential decisions in a complex topic and build a learning journey around what people need to do.", deliverable: "Learning objectives, content maps, storyboards, assessment rubrics, and review-ready prototypes.", example: "Example brief: restructure an existing slide deck into focused learning and practice." },
  { icon: Sparkles, title: "Learning tools & AI-assisted practice", text: "Build tailored practice and feedback tools where a standard course format does not meet the learning need.", deliverable: "A scoped working prototype, feedback criteria, and an agreed human review process.", example: "Example brief: practise a handover response using approved guidance and a feedback rubric." },
];
const steps = [
  ["Define the task", "Review your materials with a subject expert. Agree the audience, scope, delivery format, and success criteria."],
  ["Make the design visible", "Review the content map and storyboard before we build. Test a small prototype together."],
  ["Build & pilot", "Develop the experience, check it across agreed devices, and gather feedback from representative learners."],
  ["Refine & hand over", "Review the pilot against the agreed criteria, address issues, and hand over the agreed materials and guidance."],
];
const practicalDetails = [
  ["Where will the learning run?", "We agree the delivery format and hosting needs during scoping. If you use an LMS, share its requirements so we can confirm compatibility before committing to a format or integration."],
  ["What happens at handover?", "The proposal defines the source files, content, setup guidance, and walkthrough included. Hosting, maintenance, and future changes are scoped explicitly."],
  ["How will we know it works?", "We agree the task and assessment criteria first. A pilot can combine learner work samples, usability feedback, and subject-expert review. Measures depend on the project."],
];

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: `${siteUrl}/business` },
  openGraph: { title, description, url: `${siteUrl}/business`, siteName: "ScienceDojo for Business", type: "website", images: [{ url: `${siteUrl}/images/sciencedojo-logo-brand.jpg`, width: 512, height: 512, alt: "ScienceDojo for Business" }] },
  twitter: { card: "summary", title, description, images: [`${siteUrl}/images/sciencedojo-logo-brand.jpg`] },
};

function BusinessBrand() {
  return <span className="inline-flex items-baseline text-2xl font-bold tracking-[-0.06em] text-[#12243A]">sciencedojo<span className="text-[#006B70]">.</span></span>;
}

export default async function BusinessPage() {
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
            <a href="#contact" className={`inline-flex min-h-11 items-center gap-2 py-2 text-[#006B70] hover:underline ${focus}`}>Let&apos;s talk <ArrowRight className="h-4 w-4" aria-hidden="true" /></a>
          </nav>
        </div>
      </header>

      <div id="business-content" tabIndex={-1}>
        <section className="bg-white px-5 py-12 md:px-8 md:py-16" aria-labelledby="business-heading">
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-12">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#526071]">Learning design &amp; technology</p>
              <h1 id="business-heading" className="mt-5 text-4xl font-bold leading-[1.04] tracking-[-0.045em] text-[#12243A] sm:text-5xl lg:text-[3.5rem]">Learning designed for the way people work.</h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-[#526071] sm:text-lg sm:leading-8">Turn your guides, slides, and subject expertise into interactive onboarding and skills training. Instructional design and development, together.</p>
              <div className="mt-8 flex flex-wrap items-center gap-6">
                <a href={emailHref} className={button}>Discuss your project <ArrowRight className="h-4 w-4" aria-hidden="true" /></a>
                <a href="#work" className={`inline-flex min-h-12 items-center gap-2 text-sm font-semibold hover:text-[#006B70] hover:underline ${focus}`}>See the work &amp; thinking <ArrowRight className="h-4 w-4" aria-hidden="true" /></a>
              </div>
              <div className="mt-9 border-t border-[#dce2e8] pt-4"><p className="text-sm font-medium">For HR, L&amp;D, and teams sharing specialist knowledge.</p><p className="mt-2 text-sm text-[#526071]">Work directly with Piumal, from the brief to the build.</p></div>
            </div>
            <div id="learning-demo" className="min-w-0 scroll-mt-6"><WorkplaceDemo /><a href="#work" className={`mt-4 inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-[#006B70] hover:underline ${focus}`}>Read the brief and design rationale <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></a></div>
          </div>
        </section>

        <BusinessOffer emailHref={emailHref} />
        <BusinessEvidence practiceEnabled={flags.practice_dojo_enabled} focusEnabled={flags.focus_dojo_enabled} />

        <section id="services" className="scroll-mt-6 bg-[#F3F5F7] px-5 py-16 md:px-8 md:py-20" aria-labelledby="services-heading">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#006B70]">What we can build with you</p>
            <h2 id="services-heading" className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">From the learning problem to the working experience.</h2>
            <div className="mt-9 grid gap-8 md:grid-cols-3">
              {services.map(({ icon: Icon, title: heading, text, deliverable, example }) => <article key={heading} className="border-t border-[#dce2e8] py-6"><Icon className="h-7 w-7 text-[#006B70]" aria-hidden="true" /><h3 className="mt-5 text-xl font-bold">{heading}</h3><p className="mt-3 text-sm leading-7 text-[#526071]">{text}</p><p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-[#006B70]">What you receive</p><p className="mt-2 text-sm leading-6">{deliverable}</p><p className="mt-5 border-t border-[#dce2e8] pt-4 text-xs leading-6 text-[#526071]">{example}</p></article>)}
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#526071]">For AI-assisted work, we agree the approved source material, feedback criteria, data handling, and human review before a pilot. The exact capability is defined by your brief.</p>
          </div>
        </section>

        <section id="process" className="scroll-mt-6 px-5 py-16 md:px-8 md:py-20" aria-labelledby="process-heading">
          <div className="mx-auto max-w-6xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#006B70]">How we work</p><h2 id="process-heading" className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Make the work reviewable at every stage.</h2><ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">{steps.map(([heading, text], index) => <li key={heading} className="border-t-2 border-[#dce2e8] pt-5"><span className="text-sm font-bold text-[#006B70]">0{index + 1}</span><h3 className="mt-3 text-lg font-bold">{heading}</h3><p className="mt-3 text-sm leading-7 text-[#526071]">{text}</p></li>)}</ol><div className="mt-10 border-t border-[#dce2e8] pt-7"><h3 className="text-lg font-semibold">A few practical details</h3><div className="mt-4 grid gap-6 md:grid-cols-3">{practicalDetails.map(([question, answer]) => <details key={question} className="border-t border-[#dce2e8] pt-3"><summary className={`min-h-11 cursor-pointer text-sm font-semibold ${focus}`}>{question}</summary><p className="mt-3 text-sm leading-7 text-[#526071]">{answer}</p></details>)}</div></div></div>
        </section>

        <section id="about" className="scroll-mt-6 bg-[#12243A] px-5 py-16 text-white md:px-8 md:py-20" aria-labelledby="about-heading">
          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[0.7fr_1fr]"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a9cee7]">About the studio</p><h2 id="about-heading" className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Pedagogy meets development.</h2></div><div><p className="text-lg leading-8 text-[#d1dfec]">ScienceDojo for Business is a learning design studio led by Piumal. We bring instructional design and software development together to turn knowledge into experiences people can understand, practise, and apply.</p><p className="mt-4 leading-7 text-[#d1dfec]">You work directly with the studio lead, from the first conversation through design and development.</p><a href="https://piumal.com" className={`mt-6 inline-flex min-h-11 items-center gap-2 font-semibold text-[#b9e0df] hover:underline ${focus}`}>Explore Piumal&apos;s professional portfolio <ArrowRight className="h-4 w-4" aria-hidden="true" /></a></div></div>
        </section>

        <section id="contact" className="scroll-mt-6 px-5 py-16 md:px-8 md:py-24" aria-labelledby="contact-heading">
          <div className="mx-auto max-w-6xl rounded-lg bg-[#F3F5F7] px-6 py-10 sm:p-12"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#006B70]">Let&apos;s talk</p><h2 id="contact-heading" className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">What should your people be able to do?</h2><p className="mt-5 max-w-2xl leading-7 text-[#526071]">Tell us about the task, the audience, and the materials you already have. We&apos;ll discuss whether a focused pilot is a useful next step, then define the scope and deliverables together.</p><a href={emailHref} className={`mt-7 ${button}`}>Discuss your project <ArrowRight className="h-4 w-4" aria-hidden="true" /></a><p className="mt-4 text-sm text-[#526071]">Prefer to write directly? <a href="mailto:hello@sciencedojo.co.uk" className={`break-all font-semibold text-[#006B70] underline underline-offset-4 ${focus}`}>hello@sciencedojo.co.uk</a></p></div>
        </section>
      </div>

      <footer className="border-t border-[#dce2e8] px-5 py-8 md:px-8"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5"><div><BusinessBrand /><p className="mt-2 text-xs text-[#526071]">For Business · A learning design studio led by Piumal.</p></div><nav aria-label="Business footer" className="flex flex-wrap gap-5 text-sm text-[#526071]"><Link href="/" className={`hover:text-[#006B70] ${focus}`}>ScienceDojo tutoring</Link><Link href="/privacy" className={focus}>Privacy</Link><Link href="/terms" className={focus}>Terms</Link></nav><p className="text-xs text-[#526071]">© {new Date().getFullYear()} ScienceDojo</p></div></footer>
    </div>
  );
}

import Image from "next/image";
import { ArrowRight, BookOpen, Check, FileText, PackageCheck } from "lucide-react";

const moduleSummary = [
  "Up to three learning objectives and a storyboard to review.",
  "Approximately 5–10 minutes of learner practice, including up to three decisions, explanatory feedback, an application exercise, and review.",
  "One practical application exercise and a scoring guide.",
  "Two consolidated review rounds and agreed technical checks.",
  "A self-contained browser module you can keep for internal training, editable code, design documents, and setup instructions.",
];

const deliverables = [
  ["One defined task", "One workplace task, one learner group, and one language: English."],
  ["An agreed source pack", "Approximately 15 pages or 20 slides, subject to content-density review, with access to one subject expert."],
  ["A focused briefing", "One 45-minute briefing and limited written clarification."],
  ["Reviewable learning design", "Up to three observable learning objectives and one storyboard."],
  ["Task practice", "Approximately 5–10 minutes in total using existing components: up to three decisions with explanatory feedback, an application exercise, and review."],
  ["A practical assessment", "One realistic application exercise and a simple scoring guide your team can use."],
  ["Two review rounds", "One consolidated review of the storyboard and one of the working version, from your nominated approver."],
  ["Agreed checks", "Usability and technical checks for the module and your agreed browser delivery route."],
  ["A usable handover", "A self-contained HTML module with editable HTML, CSS, and JavaScript, approved design documents, a scoring guide, and setup instructions."],
];

const scopeGroups = [
  { title: "Your starting point", summary: "One task, one audience, and approved source material.", icon: FileText, items: [0, 1, 2] },
  { title: "The learning experience", summary: "A storyboard, realistic practice, and a practical assessment.", icon: BookOpen, items: [3, 4, 5] },
  { title: "Reviews & handover", summary: "Two review rounds, agreed checks, and files you can keep.", icon: PackageCheck, items: [6, 7, 8] },
];

function HandoverKitGraphic() {
  return (
    <figure className="mb-6 border-b border-[#dce2e8] pb-6">
      <div className="overflow-hidden rounded-lg bg-[#F3F5F7]">
        <Image src="/images/business/module-handover-kit-v1.webp" alt="Illustration of a browser learning module beside a storyboard, scoring guide, and setup checklist" width={1536} height={1024} sizes="(max-width: 1023px) 90vw, 500px" className="h-auto w-full" />
      </div>
      <figcaption className="mt-4">
        <p className="text-xs font-medium text-[#526071]">An illustrated view of your handover kit</p>
        <div className="mt-3 grid grid-cols-3 gap-3 text-sm font-semibold leading-5 text-[#12243A]">
          <span className="border-t-2 border-[#006B70] pt-2">Browser module</span>
          <span className="border-t-2 border-[#006B70] pt-2">Editable files</span>
          <span className="border-t-2 border-[#006B70] pt-2">Review guide</span>
        </div>
      </figcaption>
    </figure>
  );
}

export default function BusinessOffer() {
  return (
    <section id="offer" className="scroll-mt-6 bg-[#F3F5F7] px-5 py-14 md:px-8 md:py-16" aria-labelledby="offer-heading">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#526071]">A practical place to start</p>
            <h2 id="offer-heading" className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Custom Onboarding Module</h2>
            <p className="mt-5 max-w-lg leading-7 text-[#526071]">One complete module for one approved workplace task, one learner group, and one language: English. Start with a client handover, a support response, or an agreed escalation. A larger onboarding programme receives a separate quote.</p>
            <p className="mt-7 text-3xl font-bold tracking-tight">From €1,490{" "}<span className="inline-block text-base font-medium tracking-normal text-[#526071]">per project</span></p>
            <div className="mt-6" aria-labelledby="module-summary-heading">
              <h3 id="module-summary-heading" className="text-lg font-semibold">You receive</h3>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-[#526071]">
                {moduleSummary.map((summary) => (
                  <li key={summary} className="flex items-start gap-3">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-[#006B70]" aria-hidden="true" />
                    <span>{summary}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-5 max-w-lg border-l-2 border-[#006B70] pl-4 text-sm leading-6 text-[#526071]"><strong className="font-semibold text-[#12243A]">5–10 minutes is estimated learner practice time, including the application exercise and review.</strong> Your project fee covers briefing, learning design, development, assessment, client reviews, and handover.</p>
            <p className="mt-5 max-w-lg text-sm leading-6 text-[#526071]">For a project within the detailed scope below. Final scope, delivery arrangements, schedule, and applicable taxes are confirmed in the proposal before work begins.</p>
            <a href="#contact" className="mt-6 inline-flex min-h-12 items-center gap-3 rounded-md bg-[#006B70] px-5 py-3 text-sm font-semibold text-white hover:bg-[#00565B] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#006B70]">Discuss your project <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" /></a>
          </div>
          <div className="self-start rounded-lg border border-[#dce2e8] bg-white p-6 sm:p-7">
            <HandoverKitGraphic />
            <h3 className="text-lg font-semibold">You bring the knowledge. We shape the learning.</h3>
            <dl className="mt-5 space-y-5 text-sm">
              <div><dt className="font-semibold text-[#006B70]">A suitable starting point</dt><dd className="mt-2 leading-6 text-[#526071]">You already have an agreed process, approved material, a subject expert who can clarify it, and one person who can approve the work.</dd></div>
              <div className="border-t border-[#dce2e8] pt-5"><dt className="font-semibold text-[#006B70]">We design &amp; build</dt><dd className="mt-2 leading-6 text-[#526071]">A focused scenario, explanations, and an application exercise. Your team reviews the assessment using the scoring guide; no AI marking or learner dashboard is needed.</dd></div>
            </dl>
            <p className="mt-5 text-xs leading-6 text-[#526071]">Start with one task before deciding whether a larger programme is useful.</p>
          </div>
        </div>
        <div className="mt-10 border-t border-[#dce2e8] pt-8">
          <h3 className="text-lg font-semibold">What the defined project includes</h3>
          <div className="mt-6 grid items-start gap-5 md:grid-cols-3">
            {scopeGroups.map(({ title, summary, icon: Icon, items }) => <div key={title} className="rounded-xl border border-[#dce2e8] bg-white p-5 sm:p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#edf5f5]"><Icon className="h-6 w-6 text-[#006B70]" aria-hidden="true" /></div>
              <h4 className="mt-5 text-lg font-semibold">{title}</h4>
              <p className="mt-2 text-sm leading-6 text-[#526071]">{summary}</p>
              <details className="mt-4 border-t border-[#dce2e8] pt-3">
                <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold text-[#006B70] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#006B70]">See the included scope</summary>
                <dl className="mt-3 space-y-5">{items.map((item) => <div key={deliverables[item][0]}><dt className="text-sm font-semibold">{deliverables[item][0]}</dt><dd className="mt-2 text-sm leading-6 text-[#526071]">{deliverables[item][1]}</dd></div>)}</dl>
              </details>
            </div>)}
          </div>
        </div>
        <div className="mt-9 grid gap-7 border-t border-[#dce2e8] pt-7 md:grid-cols-2">
          <div><h3 className="text-sm font-semibold">Keep it and use it internally</h3><p className="mt-3 text-sm leading-6 text-[#526071]">Your organisation may keep and use the delivered module for its own internal training, with no ScienceDojo subscription or per-learner charge. Open the HTML file in an agreed browser or use your own suitable hosting. You receive readable, editable module code; reusable components and third-party assets retain their applicable licences.</p><p className="mt-3 text-sm leading-6 text-[#526071]">The browser module keeps practice responses in the current page only. Your team uses the scoring guide to review learner work.</p></div>
          <div><h3 className="text-sm font-semibold">Scope and delivery agreed before signing</h3><p className="mt-3 text-sm leading-6 text-[#526071]">We confirm your browser and delivery route, final price, applicable taxes, and schedule before work begins. Changes to the approved task, audience, or content after storyboard approval require revised scope. Work that does not match the agreed specification is corrected.</p><p className="mt-3 text-sm leading-6 text-[#526071]">Dates depend on the agreed scope, available capacity, and client reviews.</p></div>
        </div>
        <div className="mt-7 border-t border-[#dce2e8] pt-6"><h3 className="text-sm font-semibold">Separately scoped</h3><p className="mt-3 max-w-4xl text-sm leading-6 text-[#526071]">A full onboarding curriculum, policy development, extensive research, bespoke video or animation, additional languages, custom AI features, and rollout support. Managed hosting, maintenance, updates, and integrations are quoted separately. The standard browser module does not include learner accounts, central response storage, certificates, or LMS completion reporting. SCORM and compatibility with an existing LMS require separate confirmation and a quote.</p></div>
      </div>
    </section>
  );
}

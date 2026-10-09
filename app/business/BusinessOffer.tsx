import { ArrowRight, Check } from "lucide-react";

const pilotSummary = [
  "Up to three learning objectives and a storyboard to review.",
  "Approximately 5–10 minutes of interactive practice, with up to three decisions and explanatory feedback.",
  "One practical application exercise and a scoring guide.",
  "Two consolidated review rounds and agreed technical checks.",
  "Approved design documents and the working pilot in the agreed delivery format.",
];

const deliverables = [
  ["One defined task", "One workplace task, one learner group, and one language: English."],
  ["An agreed source pack", "Approximately 15 pages or 20 slides, subject to content-density review, with access to one subject expert."],
  ["A focused briefing", "One 45-minute briefing and limited written clarification."],
  ["Reviewable learning design", "Up to three observable learning objectives and one storyboard."],
  ["Interactive practice", "Approximately 5–10 minutes using existing components, with up to three decisions and explanatory feedback."],
  ["A practical assessment", "One realistic application exercise and a simple scoring guide your team can use."],
  ["Two review rounds", "One consolidated review of the storyboard and one of the working version, from your nominated approver."],
  ["Agreed checks", "Usability and technical checks defined for the pilot and its delivery route."],
  ["A clear handover", "Approved design documents and a working pilot in a delivery format confirmed before signing."],
];

function KnowledgeToPilotGraphic() {
  return (
    <figure className="mb-6 border-b border-[#dce2e8] pb-6">
      <svg viewBox="0 0 480 138" className="mx-auto w-full max-w-lg" fill="none" aria-hidden="true" focusable="false">
        <path d="M129 68H163M313 68H348" stroke="#a9b6c4" strokeWidth="1.5" />
        <path d="m158 63 5 5-5 5m185-10 5 5-5 5" stroke="#a9b6c4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

        <g transform="rotate(-9 77 68)">
          <rect x="44" y="23" width="66" height="91" rx="4" fill="#F3F5F7" stroke="#b7c2ce" />
        </g>
        <rect x="46" y="21" width="66" height="91" rx="4" fill="white" stroke="#12243A" strokeWidth="1.5" />
        <rect x="58" y="35" width="22" height="5" rx="2.5" fill="#006B70" />
        <path d="M58 52H98M58 60H98M58 68H86" stroke="#b7c2ce" strokeWidth="2" strokeLinecap="round" />
        <rect x="58" y="80" width="40" height="20" rx="2" fill="#F3F5F7" />
        <path d="M65 90H91" stroke="#a9b6c4" strokeWidth="2" strokeLinecap="round" />

        <path d="M213 43H222V55M247 80V90H209V100M247 90H284V100" stroke="#006B70" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="181" y="31" width="32" height="24" rx="5" fill="#F3F5F7" stroke="#12243A" strokeWidth="1.5" />
        <path d="m247 30 25 25-25 25-25-25 25-25Z" fill="#e6f1f1" stroke="#006B70" strokeWidth="1.5" />
        <circle cx="209" cy="110" r="10" fill="white" stroke="#b7c2ce" strokeWidth="1.5" />
        <circle cx="284" cy="110" r="10" fill="#006B70" />
        <path d="m280 110 3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="197" cy="43" r="3" fill="#006B70" />
        <path d="M242 55H252M247 50V60" stroke="#006B70" strokeWidth="1.5" strokeLinecap="round" />

        <rect x="365" y="28" width="91" height="81" rx="5" fill="white" stroke="#12243A" strokeWidth="1.5" />
        <path d="M365 44H456" stroke="#12243A" strokeWidth="1.5" />
        <circle cx="374" cy="36" r="1.5" fill="#006B70" />
        <circle cx="380" cy="36" r="1.5" fill="#a9b6c4" />
        <circle cx="386" cy="36" r="1.5" fill="#a9b6c4" />
        <rect x="375" y="54" width="19" height="43" rx="2" fill="#F3F5F7" />
        <path d="M380 61H389M380 67H389M380 73H386" stroke="#b7c2ce" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M403 57H444M403 64H437" stroke="#b7c2ce" strokeWidth="2" strokeLinecap="round" />
        <rect x="403" y="74" width="43" height="10" rx="2" fill="#e6f1f1" stroke="#006B70" />
        <circle cx="408" cy="79" r="1.5" fill="#006B70" />
        <rect x="429" y="91" width="17" height="7" rx="2" fill="#006B70" />
      </svg>
      <figcaption>
        <ol className="grid grid-cols-3 gap-2 text-center text-[11px] font-semibold leading-4 text-[#526071] sm:text-xs">
          <li>Existing knowledge</li>
          <li>Designed practice</li>
          <li>A working pilot</li>
        </ol>
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
            <h2 id="offer-heading" className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Onboarding Task Pilot</h2>
            <p className="mt-5 max-w-lg leading-7 text-[#526071]">We turn one approved workplace task into a tailored onboarding learning experience for one learner group, in English. Start with a client handover, a support response, or an agreed escalation.</p>
            <p className="mt-7 text-3xl font-bold tracking-tight">From €1,490{" "}<span className="inline-block text-base font-medium tracking-normal text-[#526071]">per pilot project</span></p>
            <div className="mt-6" aria-labelledby="pilot-summary-heading">
              <h3 id="pilot-summary-heading" className="text-lg font-semibold">You receive</h3>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-[#526071]">
                {pilotSummary.map((summary) => (
                  <li key={summary} className="flex items-start gap-3">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-[#006B70]" aria-hidden="true" />
                    <span>{summary}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-5 max-w-lg border-l-2 border-[#006B70] pl-4 text-sm leading-6 text-[#526071]"><strong className="font-semibold text-[#12243A]">5–10 minutes is learner practice time.</strong> Your project fee covers briefing, learning design, development, assessment, reviews, and handover.</p>
            <p className="mt-5 max-w-lg text-sm leading-6 text-[#526071]">For a project within the detailed scope below. Final scope, delivery arrangements, schedule, and applicable taxes are confirmed in the proposal before work begins.</p>
            <a href="#contact" className="mt-6 inline-flex min-h-12 items-center gap-3 rounded-md bg-[#006B70] px-5 py-3 text-sm font-semibold text-white hover:bg-[#00565B] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#006B70]">Discuss a pilot <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" /></a>
          </div>
          <div className="self-start rounded-lg border border-[#dce2e8] bg-white p-6 sm:p-7">
            <KnowledgeToPilotGraphic />
            <h3 className="text-lg font-semibold">You bring the knowledge. We shape the learning.</h3>
            <dl className="mt-5 space-y-5 text-sm">
              <div><dt className="font-semibold text-[#006B70]">A suitable starting point</dt><dd className="mt-2 leading-6 text-[#526071]">You already have an agreed process, approved material, a subject expert who can clarify it, and one person who can approve the work.</dd></div>
              <div className="border-t border-[#dce2e8] pt-5"><dt className="font-semibold text-[#006B70]">We design &amp; build</dt><dd className="mt-2 leading-6 text-[#526071]">A focused scenario, explanations, and an application exercise. Your team reviews the assessment using the scoring guide; no AI marking or learner dashboard is needed.</dd></div>
            </dl>
            <p className="mt-5 text-xs leading-6 text-[#526071]">Start with one task before deciding whether a larger programme is useful.</p>
          </div>
        </div>
        <div className="mt-10 border-t border-[#dce2e8] pt-8">
          <h3 className="text-lg font-semibold">What the defined pilot includes</h3>
          <div className="mt-6 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">{deliverables.map(([heading, text]) => <div key={heading} className="border-t border-[#dce2e8] pt-5"><Check className="h-5 w-5 text-[#006B70]" aria-hidden="true" /><h4 className="mt-3 font-semibold">{heading}</h4><p className="mt-2 text-sm leading-6 text-[#526071]">{text}</p></div>)}</div>
        </div>
        <div className="mt-9 grid gap-7 border-t border-[#dce2e8] pt-7 md:grid-cols-2">
          <div><h3 className="text-sm font-semibold">Outside the initial pilot</h3><p className="mt-3 text-sm leading-6 text-[#526071]">A complete onboarding curriculum, policy development, extensive research, bespoke video or animation, additional languages, custom AI features, new platform functionality, and organisation-wide deployment. Ongoing hosting, maintenance, and integrations are agreed and priced separately where required.</p></div>
          <div><h3 className="text-sm font-semibold">Scope and delivery agreed before signing</h3><p className="mt-3 text-sm leading-6 text-[#526071]">The proposal confirms a tested delivery route, files and usage rights, whether the pilot is for evaluation or continued use, and any access period or continuing costs. Changes to the approved task, audience, or content after storyboard approval require revised scope. Work that does not match the agreed specification is corrected.</p><p className="mt-3 text-sm leading-6 text-[#526071]">Dates depend on the agreed scope, available capacity, and client reviews. Larger assignments receive a separate quote.</p></div>
        </div>
      </div>
    </section>
  );
}

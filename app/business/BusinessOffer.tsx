import { ArrowRight, Check } from "lucide-react";

const deliverables = [
  ["A learning plan", "Audience, objectives, content map, and a storyboard your subject expert can review."],
  ["A working experience", "An interactive module or learning tool in the delivery format agreed for the pilot."],
  ["Purposeful assessment", "Practice tasks, feedback, and a rubric aligned to what people need to do."],
  ["A practical handover", "Agreed source materials, setup guidance, and a walkthrough for your team."],
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

export default function BusinessOffer({ emailHref }: { emailHref: string }) {
  return (
    <section id="offer" className="scroll-mt-6 bg-[#F3F5F7] px-5 py-14 md:px-8 md:py-16" aria-labelledby="offer-heading">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#526071]">A practical place to start</p>
            <h2 id="offer-heading" className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">One onboarding journey.<br />A working pilot.</h2>
            <p className="mt-5 max-w-lg leading-7 text-[#526071]">Choose one role, process, or recurring challenge. We turn the essential knowledge into a focused experience your team can try before you commit to a wider programme.</p>
            <p className="mt-4 text-sm leading-6 text-[#526071]">Scope, budget, timeline, and delivery format are agreed after reviewing your brief.</p>
          </div>
          <div className="rounded-lg border border-[#dce2e8] bg-white p-6 sm:p-7">
            <KnowledgeToPilotGraphic />
            <h3 className="text-lg font-semibold">You bring the knowledge. We shape the learning.</h3>
            <dl className="mt-5 space-y-5 text-sm">
              <div><dt className="font-semibold text-[#006B70]">You bring</dt><dd className="mt-2 leading-6 text-[#526071]">Existing guides or slides, access to a subject expert, and a clear picture of what your people need to do.</dd></div>
              <div className="border-t border-[#dce2e8] pt-5"><dt className="font-semibold text-[#006B70]">We design &amp; build</dt><dd className="mt-2 leading-6 text-[#526071]">The learning structure, realistic practice, useful feedback, and a working pilot ready for an agreed review with your team.</dd></div>
            </dl>
            <a href={emailHref} className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#006B70] hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#006B70]">Tell us what you&apos;re working with <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" /></a>
          </div>
        </div>
        <div className="mt-10 border-t border-[#dce2e8] pt-8">
          <h3 className="text-sm font-semibold">What your pilot can include</h3>
          <div className="mt-6 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">{deliverables.map(([heading, text]) => <div key={heading}><Check className="h-5 w-5 text-[#006B70]" aria-hidden="true" /><h4 className="mt-3 font-semibold">{heading}</h4><p className="mt-2 text-sm leading-6 text-[#526071]">{text}</p></div>)}</div>
        </div>
      </div>
    </section>
  );
}

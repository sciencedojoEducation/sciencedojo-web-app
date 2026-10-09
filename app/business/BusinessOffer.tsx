import { ArrowRight, Check } from "lucide-react";

const deliverables = [
  ["A learning plan", "Audience, objectives, content map, and a storyboard your subject expert can review."],
  ["A working experience", "An interactive module or learning tool in the delivery format agreed for the pilot."],
  ["Purposeful assessment", "Practice tasks, feedback, and a rubric aligned to what people need to do."],
  ["A practical handover", "Agreed source materials, setup guidance, and a walkthrough for your team."],
];

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

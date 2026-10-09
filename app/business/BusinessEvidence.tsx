import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const focus = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#006B70]";
const designChoices = [
  ["Decisions before explanations", "Learners choose what to do with a realistic request, then see the consequence and reasoning."],
  ["A connected scenario", "Earlier decisions change the context of the next step, so the task develops as a single experience."],
  ["A review tied to the task", "The final review records the choices made and identifies what to practise before a real handover."],
];
const rubric = [
  ["Scope", "Names the deliverable and acceptance criteria."],
  ["Owner", "Confirms who is responsible and who accepts the handover."],
  ["Deadline", "Checks an explicit date with the delivery owner before making a commitment."],
  ["Uncertainty", "Identifies an unresolved assumption and agrees how it will be clarified."],
];

export default function BusinessEvidence({ practiceEnabled, focusEnabled }: { practiceEnabled: boolean; focusEnabled: boolean }) {
  return (
    <section id="work" className="scroll-mt-6 px-5 py-16 md:px-8 md:py-20" aria-labelledby="work-heading">
      <div className="mx-auto max-w-6xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#526071]">The work &amp; the thinking</p>
        <h2 id="work-heading" className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">A realistic task. A visible design process.</h2>
        <p className="mt-4 max-w-2xl leading-7 text-[#526071]">Explore a corporate learning concept, then inspect the brief, design choices, and assessment behind it.</p>
        <article className="mt-8 overflow-hidden rounded-lg border border-[#dce2e8]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dce2e8] px-6 py-4 text-xs"><span className="font-semibold">Client-request handover · Onboarding</span><span className="rounded bg-[#edf5f5] px-3 py-1.5 font-medium text-[#006B70]">Studio concept · Fictional scenario</span></div>
          <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
            <div className="bg-[#12243A] p-6 text-white sm:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#b9e0df]">The brief</p>
              <h3 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Turn a vague request into a clear handover.</h3>
              <p className="mt-4 text-sm leading-7 text-[#d1dfec]">A new project coordinator receives an urgent client request. The delivery team needs a clear scope, an accountable owner, and a confirmed deadline before work begins.</p>
              <dl className="mt-6 space-y-4 text-sm"><div><dt className="font-semibold text-[#b9e0df]">Audience</dt><dd className="mt-1 text-[#d1dfec]">New coordinators in a fictional service business.</dd></div><div><dt className="font-semibold text-[#b9e0df]">Learning objective</dt><dd className="mt-1 leading-6 text-[#d1dfec]">Identify missing information, resolve uncertainty, and hand over an actionable request.</dd></div></dl>
              <a href="#learning-demo" className={`mt-7 inline-flex min-h-12 items-center gap-3 rounded bg-white px-5 py-3 text-sm font-semibold text-[#12243A] hover:bg-[#edf5f5] ${focus}`}>Try the branching demo <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" /></a>
            </div>
            <div className="p-6 sm:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#526071]">Why it is designed this way</p>
              <ol className="mt-5 space-y-5">{designChoices.map(([heading, text], index) => <li key={heading} className="flex gap-4"><span className="mt-0.5 text-xs font-semibold text-[#006B70]">0{index + 1}</span><div><h4 className="text-sm font-semibold">{heading}</h4><p className="mt-1 text-sm leading-6 text-[#526071]">{text}</p></div></li>)}</ol>
              <p className="mt-6 border-t border-[#dce2e8] pt-5 text-xs leading-6 text-[#526071]">This is a sample we designed and built to demonstrate our approach. It has not been evaluated with a client team.</p>
            </div>
          </div>
          <div className="border-t border-[#dce2e8] bg-[#F3F5F7] p-6 sm:p-8">
            <div className="grid gap-6 md:grid-cols-[0.7fr_1fr]">
              <div><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#526071]">How we would evaluate a pilot</p><h4 className="mt-3 text-xl font-semibold tracking-tight">Check the handover, not just completion.</h4><p className="mt-3 text-sm leading-6 text-[#526071]">A proposed evaluation plan for this concept. Results would come from a real pilot.</p></div>
              <div className="min-w-0">
                <ul className="space-y-3 text-sm leading-6 text-[#526071]"><li><strong className="text-[#12243A]">Before and after:</strong> ask learners to respond to different, comparable client requests.</li><li><strong className="text-[#12243A]">Use a common rubric:</strong> assess scope, ownership, deadline confirmation, and handling of uncertainty.</li><li><strong className="text-[#12243A]">Observe and refine:</strong> review misunderstandings with a subject expert and check how the approach transfers to work.</li></ul>
                <details className="mt-5 border-t border-[#dce2e8] pt-4"><summary className={`min-h-11 cursor-pointer text-sm font-semibold text-[#006B70] ${focus}`}>Inspect the sample assessment rubric</summary><div className="mt-3 grid gap-4 sm:grid-cols-2">{rubric.map(([heading, text]) => <div key={heading}><h5 className="text-sm font-semibold">{heading}</h5><p className="mt-1 text-sm leading-6 text-[#526071]">{text}</p></div>)}</div><p className="mt-4 text-xs leading-6 text-[#526071]">Rate each criterion as missing, partly demonstrated, or clearly demonstrated. Review the work sample alongside the rating.</p></details>
              </div>
            </div>
          </div>
        </article>

        <div className="mt-12 border-t border-[#dce2e8] pt-8">
          <h3 className="text-xl font-semibold tracking-tight">Technical capability, demonstrated in ScienceDojo.</h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#526071]">These education products show how we build practice, feedback, and connected learning experiences. They are examples of our own product work.</p>
          <div className="mt-7 grid gap-8 md:grid-cols-3">
            <article className="border-t border-[#dce2e8] pt-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#526071]">Practice &amp; feedback</p><h4 className="mt-2 text-lg font-semibold">PracticeDojo</h4><p className="mt-3 text-sm leading-6 text-[#526071]">Topic-based, AI-generated educational practice with revealable answers and worked guidance.</p><p className="mt-3 text-sm leading-6"><span className="font-semibold">Relevance to your team:</span> practice a task, inspect feedback, and revisit the reasoning.</p>
              {practiceEnabled ? <Link href="/ai-practice-studio" className={`mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#006B70] ${focus}`}>Explore PracticeDojo <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link> : <p className="mt-3 text-xs text-[#526071]">Live product currently unavailable</p>}
            </article>
            <article className="border-t border-[#dce2e8] pt-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#526071]">Learning routines</p><h4 className="mt-2 text-lg font-semibold">FocusDojo</h4><p className="mt-3 text-sm leading-6 text-[#526071]">Goal-based timed sessions, structured breaks, and session recovery.</p><p className="mt-3 text-sm leading-6"><span className="font-semibold">Relevance to your team:</span> build tools that support a learning routine beyond the course.</p>
              {focusEnabled ? <Link href="/focus-dojo" className={`mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#006B70] ${focus}`}>Explore FocusDojo <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link> : <p className="mt-3 text-xs text-[#526071]">Live product currently unavailable</p>}
            </article>
            <article className="border-t border-[#dce2e8] pt-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#526071]">Platform development</p><h4 className="mt-2 text-lg font-semibold">Connected learning</h4><p className="mt-3 text-sm leading-6 text-[#526071]">Lessons, assignments, guided practice, and a learner&apos;s next action in one dashboard.</p><p className="mt-3 text-sm leading-6"><span className="font-semibold">Relevance to your team:</span> connect content and learning tools into a coherent experience.</p>
              <details className="mt-3"><summary className={`min-h-11 cursor-pointer text-sm font-semibold text-[#006B70] ${focus}`}>View the product preview</summary><div className="relative mt-3 aspect-[16/10] overflow-hidden rounded border border-[#dce2e8] bg-[#F3F5F7]"><Image src="/images/product-tour/student-home.webp" alt="ScienceDojo student dashboard showing sample learning activity" fill sizes="(max-width: 768px) 90vw, 360px" className="object-contain" /></div><p className="mt-2 text-xs text-[#526071]">Product screenshot · Sample data</p></details>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}

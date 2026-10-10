import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import WorkplaceDemo from "./WorkplaceDemo";
import HandoverApplication from "./HandoverApplication";
import { handoverBrief, handoverDocuments, handoverEvaluationPlan, handoverRubric, handoverStoryboard } from "./handover-example";

const focus = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#006B70]";
const designChoices = [
  ["Decisions before explanations", "Learners choose what to do with a realistic request, then see the consequence and reasoning."],
  ["A connected scenario", "Earlier decisions change the context of the next step, so the task develops as a single experience."],
  ["Application beyond clicking", "A written handover asks learners to use the process. A subject expert can review that work against agreed criteria."],
];
function PracticePreview() {
  return (
    <figure>
      <div className="flex min-h-[238px] flex-col justify-center rounded-lg border border-[#dce2e8] bg-[#F3F5F7] p-5">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.13em] text-[#526071]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#006B70]" aria-hidden="true" />Try · Check · Understand
        </div>
        <p className="mt-5 text-xs text-[#526071]">An example practice question</p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-[#12243A]">3x + 7 = 31</p>
        <details className="group mt-5 rounded-md border border-[#c7dedf] bg-white">
          <summary className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 px-3 py-2 text-xs font-semibold text-[#006B70] ${focus}`}>
            Reveal the reasoning <span className="text-base group-open:rotate-90" aria-hidden="true">→</span>
          </summary>
          <div className="border-t border-[#dce2e8] px-3 py-3 text-xs leading-5 text-[#526071]">
            <p className="font-semibold text-[#12243A]">x = 8</p>
            <p className="mt-1">Subtract 7: 3x = 24. Then divide both sides by 3.</p>
          </div>
        </details>
      </div>
      <figcaption className="mt-2 text-[11px] leading-5 text-[#526071]">Illustrative practice flow · Try the answer reveal</figcaption>
    </figure>
  );
}

function FocusPreview() {
  return (
    <figure>
      <div className="flex min-h-[238px] flex-col items-center justify-center rounded-lg border border-[#dce2e8] bg-[#edf5f5] p-5">
        <div className="relative flex h-36 w-36 items-center justify-center">
          <svg viewBox="0 0 160 160" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
            <circle cx="80" cy="80" r="70" fill="none" stroke="#d3e6e7" strokeWidth="4" />
            <circle cx="80" cy="80" r="70" fill="none" stroke="#006B70" strokeWidth="4" strokeDasharray="330 440" strokeLinecap="round" />
          </svg>
          <div className="text-center"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#526071]">Focus session</p><p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-[#12243A]">25:00</p></div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-[10px] font-medium text-[#526071]"><span className="rounded bg-white px-2 py-1 text-[#006B70]">Focus</span><span aria-hidden="true">→</span><span>Break</span><span aria-hidden="true">→</span><span>Return</span></div>
      </div>
      <figcaption className="mt-2 text-[11px] leading-5 text-[#526071]">Illustrative timer preview · A structured learning rhythm</figcaption>
    </figure>
  );
}

export default function BusinessEvidence({ practiceEnabled, focusEnabled }: { practiceEnabled: boolean; focusEnabled: boolean }) {
  return (
    <section id="work" className="scroll-mt-6 px-5 py-16 md:px-8 md:py-20" aria-labelledby="work-heading">
      <div className="mx-auto max-w-6xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#526071]">The work &amp; the thinking</p>
        <h2 id="work-heading" className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">A realistic task. A visible design process.</h2>
        <p className="mt-4 max-w-3xl leading-7 text-[#526071]">See what a small custom module can contain: a clear brief, realistic decisions with feedback, a practical handover exercise, and a scoring guide. {handoverBrief.suggestedMinutes}</p>
        <article className="mt-8 overflow-hidden rounded-lg border border-[#dce2e8]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dce2e8] px-6 py-4 text-xs"><span className="font-semibold">Client-request handover · Onboarding</span><span className="rounded bg-[#edf5f5] px-3 py-1.5 font-medium text-[#006B70]">Studio concept · Fictional scenario</span></div>
          <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
            <div className="bg-[#12243A] text-white">
              <div className="relative aspect-[16/9] overflow-hidden bg-[#edf5f5]">
                <Image src="/images/business/handover-scenario-v1.webp" alt="Illustration of two colleagues reviewing a project brief beside a laptop" fill sizes="(max-width: 1023px) 90vw, 550px" className="object-cover" />
              </div>
              <div className="p-6 sm:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#b9e0df]">The brief</p>
              <h3 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Turn a vague request into a clear handover.</h3>
              <p className="mt-4 text-sm leading-7 text-[#d1dfec]">A new project coordinator receives an urgent client request. The delivery team needs a clear scope, an accountable owner, and a confirmed deadline before work begins.</p>
              <dl className="mt-6 space-y-4 text-sm"><div><dt className="font-semibold text-[#b9e0df]">Audience</dt><dd className="mt-1 text-[#d1dfec]">{handoverBrief.audience}</dd></div><div><dt className="font-semibold text-[#b9e0df]">Learning objective</dt><dd className="mt-1 leading-6 text-[#d1dfec]">{handoverBrief.objectives[0]}</dd></div></dl>
              <a href="#learning-demo" className={`mt-7 inline-flex min-h-12 items-center gap-3 rounded bg-white px-5 py-3 text-sm font-semibold text-[#12243A] hover:bg-[#edf5f5] ${focus}`}>Try the quick excerpt <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" /></a>
              </div>
            </div>
            <div id="learning-demo" className="min-w-0 scroll-mt-6 bg-[#F3F5F7] p-4 sm:p-6">
              <p className="mb-2 text-xs font-semibold text-[#006B70]">01 · Quick excerpt · 3 decisions · ~2 minutes</p>
              <p className="mb-4 text-sm leading-6 text-[#526071]">You are the coordinator. Read the fictional request, choose a response, and inspect the feedback. Continue below to apply it in a written handover.</p>
              <WorkplaceDemo />
              <a href="#handover-application" className={`mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#006B70] ${focus}`}>Continue to the application exercise <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" /></a>
            </div>
          </div>
          <HandoverApplication />
          <div className="border-t border-[#dce2e8] bg-[#F3F5F7] p-6 sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#006B70]">03 · Inspect the supporting documents</p>
            <h3 className="mt-3 text-xl font-semibold tracking-tight">The module comes with a design trail.</h3>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#526071]">Inspect the design documents and download the self-contained example module. It uses the same decisions and application exercise, with no ScienceDojo account or subscription needed to run the downloaded file.</p>
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
              <a href="/business/examples/client-handover-module.html" download className={`inline-flex min-h-12 items-center gap-2 rounded-md bg-[#006B70] px-5 py-3 text-sm font-semibold text-white hover:bg-[#00565B] ${focus}`}>Download the example module <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" /></a>
              <a href="/business/examples/learning-design.md" download className={`inline-flex min-h-11 items-center text-sm font-semibold text-[#006B70] underline underline-offset-4 ${focus}`}>Editable learning design</a>
              <a href="/business/examples/assessment-guide.md" download className={`inline-flex min-h-11 items-center text-sm font-semibold text-[#006B70] underline underline-offset-4 ${focus}`}>Editable scoring guide</a>
              <a href="/business/examples/client-review-checklist.md" download className={`inline-flex min-h-11 items-center text-sm font-semibold text-[#006B70] underline underline-offset-4 ${focus}`}>Review &amp; handover checklist</a>
              <a href="/business/examples/setup-and-use.md" download className={`inline-flex min-h-11 items-center text-sm font-semibold text-[#006B70] underline underline-offset-4 ${focus}`}>Setup &amp; use instructions</a>
            </div>
            <p className="mt-3 text-xs leading-6 text-[#526071]">Open the downloaded HTML file in your browser. It includes readable HTML, CSS, and JavaScript. Practice drafts stay in the current page only; there is no central learner record or LMS completion report.</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <details className="rounded-lg border border-[#dce2e8] bg-white p-5">
                <summary className={`min-h-11 cursor-pointer text-sm font-semibold text-[#006B70] ${focus}`}>Learning brief &amp; storyboard</summary>
                <dl className="mt-3 space-y-4 text-sm leading-6 text-[#526071]">
                  <div><dt className="font-semibold text-[#12243A]">Task and audience</dt><dd>{handoverBrief.task} {handoverBrief.audience}</dd></div>
                  <div><dt className="font-semibold text-[#12243A]">Observable objective</dt><dd>{handoverBrief.objectives[0]}</dd></div>
                  <div><dt className="font-semibold text-[#12243A]">Sequence</dt><dd><ol className="mt-2 list-decimal space-y-2 pl-5">{handoverStoryboard.map((step) => <li key={step}>{step}</li>)}</ol></dd></div>
                  <div><dt className="font-semibold text-[#12243A]">Feedback plan</dt><dd>Each decision reveals its consequence and reasoning. The written task receives criterion-based review by a subject expert.</dd></div>
                </dl>
              </details>
              <details className="rounded-lg border border-[#dce2e8] bg-white p-5">
                <summary className={`min-h-11 cursor-pointer text-sm font-semibold text-[#006B70] ${focus}`}>Application exercise &amp; scoring guide</summary>
                <p className="mt-3 text-sm leading-6 text-[#526071]">Use the source notes and written brief above as the work sample. Rate each criterion as missing, partly demonstrated, or clearly demonstrated, and cite the response that supports the rating.</p>
                <dl className="mt-4 space-y-4 text-sm leading-6">{handoverRubric.map(({ criterion, description, levels }) => <div key={criterion}><dt className="font-semibold">{criterion}</dt><dd className="text-[#526071]"><p>{description}</p><ul className="mt-2 space-y-2">{levels.map(({ rating, description: levelDescription }) => <li key={rating}><strong className="font-medium text-[#12243A]">{rating}:</strong> {levelDescription}</li>)}</ul></dd></div>)}</dl>
                <p className="mt-4 text-xs leading-6 text-[#526071]">The worked review above demonstrates how to use this guide. Completion of the choices alone does not demonstrate workplace readiness.</p>
              </details>
              <details className="rounded-lg border border-[#dce2e8] bg-white p-5">
                <summary className={`min-h-11 cursor-pointer text-sm font-semibold text-[#006B70] ${focus}`}>Client review &amp; handover checklist</summary>
                <ul className="mt-3 space-y-3 text-sm leading-6 text-[#526071]">
                  {handoverDocuments[2].items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </details>
              <details className="rounded-lg border border-[#dce2e8] bg-white p-5">
                <summary className={`min-h-11 cursor-pointer text-sm font-semibold text-[#006B70] ${focus}`}>Evaluation plan for a real team</summary>
                <ul className="mt-3 space-y-3 text-sm leading-6 text-[#526071]">
                  {handoverEvaluationPlan.map((item) => <li key={item}>{item}</li>)}
                </ul>
                <p className="mt-4 text-xs font-semibold leading-6 text-[#006B70]">Proposed plan only. No client outcome data exists for this fictional example.</p>
              </details>
            </div>
          </div>
          <div className="border-t border-[#dce2e8] p-6 sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#526071]">Why it is designed this way</p>
            <ol className="mt-5 grid gap-6 md:grid-cols-3">{designChoices.map(([heading, text], index) => <li key={heading}><span className="text-xs font-semibold text-[#006B70]">0{index + 1}</span><h4 className="mt-3 text-sm font-semibold">{heading}</h4><p className="mt-2 text-sm leading-6 text-[#526071]">{text}</p></li>)}</ol>
            <p className="mt-6 border-t border-[#dce2e8] pt-5 text-xs leading-6 text-[#526071]">This is a sample we designed and built to demonstrate our approach. It has not been evaluated with a client team.</p>
          </div>
        </article>

        <div className="mt-12 border-t border-[#dce2e8] pt-8">
          <h3 className="text-xl font-semibold tracking-tight">Technical capability, demonstrated in ScienceDojo.</h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#526071]">These education products show our development work in practice, feedback, and connected learning experiences. They demonstrate technical capability; they are not client results or features included in the €1,490 offer.</p>
          <div className="mt-7 grid gap-8 md:grid-cols-3">
            <article>
              <PracticePreview />
              <div className="mt-5 border-t border-[#dce2e8] pt-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#526071]">Practice &amp; feedback</p><h4 className="mt-2 text-lg font-semibold">PracticeDojo</h4><p className="mt-3 text-sm leading-6 text-[#526071]">Topic-based, AI-generated educational practice with revealable answers and worked guidance.</p><p className="mt-3 text-sm leading-6"><span className="font-semibold">Relevance to your team:</span> practice a task, inspect feedback, and revisit the reasoning.</p>
              {practiceEnabled ? <Link href="/ai-practice-studio" className={`mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#006B70] ${focus}`}>Explore PracticeDojo <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link> : <p className="mt-3 text-xs text-[#526071]">Live product currently unavailable</p>}
              </div>
            </article>
            <article>
              <FocusPreview />
              <div className="mt-5 border-t border-[#dce2e8] pt-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#526071]">Learning routines</p><h4 className="mt-2 text-lg font-semibold">FocusDojo</h4><p className="mt-3 text-sm leading-6 text-[#526071]">Goal-based timed sessions, structured breaks, and session recovery.</p><p className="mt-3 text-sm leading-6"><span className="font-semibold">Relevance to your team:</span> build tools that support a learning routine beyond the course.</p>
              {focusEnabled ? <Link href="/focus-dojo" className={`mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#006B70] ${focus}`}>Explore FocusDojo <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link> : <p className="mt-3 text-xs text-[#526071]">Live product currently unavailable</p>}
              </div>
            </article>
            <article>
              <figure>
                <div className="relative min-h-[238px] overflow-hidden rounded-lg border border-[#dce2e8] bg-[#F3F5F7]">
                  <Image src="/images/product-tour/student-home.webp" alt="ScienceDojo student dashboard showing sample lessons, assignments, and learning activity" fill sizes="(max-width: 767px) 90vw, 360px" className="object-contain" />
                </div>
                <figcaption className="mt-2 text-[11px] leading-5 text-[#526071]">Product screenshot · Sample data</figcaption>
              </figure>
              <div className="mt-5 border-t border-[#dce2e8] pt-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#526071]">Platform development</p><h4 className="mt-2 text-lg font-semibold">Connected learning</h4><p className="mt-3 text-sm leading-6 text-[#526071]">Lessons, assignments, guided practice, and a learner&apos;s next action in one dashboard.</p><p className="mt-3 text-sm leading-6"><span className="font-semibold">Relevance to your team:</span> connect content and learning tools into a coherent experience.</p>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}

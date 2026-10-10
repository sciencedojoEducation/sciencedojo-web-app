import type { ReactNode } from "react";

const focus = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#006B70]";

function IllustrationFrame({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 240 168" className="h-auto w-full" fill="none" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

function BriefIllustration() {
  return (
    <IllustrationFrame>
      <path d="M22 143H218" stroke="#CCD7DF" strokeWidth="2" />
      <rect x="42" y="29" width="111" height="104" rx="7" transform="rotate(-8 42 29)" fill="#DFE9EB" stroke="#B4C8CF" strokeWidth="1.5" />
      <rect x="66" y="29" width="111" height="108" rx="7" fill="white" stroke="#12243A" strokeWidth="2" />
      <rect x="81" y="46" width="37" height="7" rx="3.5" fill="#006B70" />
      <path d="M81 69H155M81 80H149M81 91H135" stroke="#A7B9C4" strokeWidth="3" strokeLinecap="round" />
      <rect x="80" y="105" width="76" height="17" rx="4" fill="#E1F0EF" />
      <path d="M89 113L93 117L100 110" stroke="#006B70" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M110 114H145" stroke="#006B70" strokeWidth="2" strokeLinecap="round" />
      <circle cx="179" cy="54" r="20" fill="#12243A" />
      <path d="M173 54H185M179 48V60" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </IllustrationFrame>
  );
}

function StoryboardIllustration() {
  return (
    <IllustrationFrame>
      <path d="M120 58V77M120 77H49V94M120 77H191V94" stroke="#006B70" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M45 88L49 94L53 88M187 88L191 94L195 88" stroke="#006B70" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="70" y="22" width="100" height="39" rx="7" fill="#12243A" />
      <circle cx="88" cy="41" r="5" fill="#83C9C5" />
      <path d="M102 36H151M102 46H140" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="15" y="97" width="91" height="50" rx="7" fill="white" stroke="#B4C8CF" strokeWidth="1.5" />
      <rect x="134" y="97" width="91" height="50" rx="7" fill="#E1F0EF" stroke="#006B70" strokeWidth="1.5" />
      <path d="M28 112H83M28 123H93M28 134H66" stroke="#A7B9C4" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M149 113L153 117L161 109" stroke="#006B70" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M170 113H209M149 128H208M149 137H190" stroke="#006B70" strokeWidth="2.5" strokeLinecap="round" />
    </IllustrationFrame>
  );
}

function ReviewIllustration() {
  return (
    <IllustrationFrame>
      <rect x="20" y="27" width="182" height="113" rx="8" fill="white" stroke="#12243A" strokeWidth="2" />
      <path d="M21 49H201" stroke="#12243A" strokeWidth="1.5" />
      <circle cx="34" cy="38" r="2.5" fill="#006B70" />
      <circle cx="44" cy="38" r="2.5" fill="#B4C8CF" />
      <circle cx="54" cy="38" r="2.5" fill="#B4C8CF" />
      <rect x="33" y="63" width="54" height="61" rx="4" fill="#E1F0EF" />
      <path d="M47 109V86L60 77L74 86V109M54 109V95H66V109" stroke="#006B70" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M102 68H178M102 78H159" stroke="#A7B9C4" strokeWidth="3" strokeLinecap="round" />
      <rect x="101" y="92" width="78" height="22" rx="4" fill="#12243A" />
      <path d="M114 103H165M160 99L165 103L160 107" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="153" y="115" width="67" height="30" rx="7" fill="#006B70" />
      <path d="M158 145V152L170 145" fill="#006B70" />
      <path d="M165 126H208M165 134H196" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </IllustrationFrame>
  );
}

function HandoverIllustration() {
  return (
    <IllustrationFrame>
      <rect x="31" y="34" width="142" height="95" rx="8" fill="white" stroke="#12243A" strokeWidth="2" />
      <path d="M32 55H172" stroke="#12243A" strokeWidth="1.5" />
      <circle cx="44" cy="45" r="2.5" fill="#006B70" />
      <circle cx="54" cy="45" r="2.5" fill="#B4C8CF" />
      <path d="M82 77L68 91L82 105M121 77L135 91L121 105M107 72L96 110" stroke="#006B70" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M53 140H152" stroke="#CCD7DF" strokeWidth="2" strokeLinecap="round" />
      <path d="M97 129V140M108 129V140" stroke="#12243A" strokeWidth="2" />
      <path d="M165 61H194L211 78V139H165V61Z" fill="#DFE9EB" stroke="#B4C8CF" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M153 74H184L200 90V147H153V74Z" fill="#E1F0EF" stroke="#006B70" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M184 74V90H200M165 108H188M165 118H188M165 128H178" stroke="#006B70" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </IllustrationFrame>
  );
}

const stages = [
  {
    heading: "Define the task",
    text: "Bring your approved process. Together, we agree what your people should be able to do.",
    caption: "Audience, scope & criteria agreed",
    Illustration: BriefIllustration,
  },
  {
    heading: "Review the storyboard",
    text: "See the decisions, feedback, and assessment before development begins.",
    caption: "Review 1 · Consolidated feedback",
    Illustration: StoryboardIllustration,
  },
  {
    heading: "Build & review",
    text: "Try the working experience. Your approver reviews it against the agreed brief.",
    caption: "Review 2 · Working module",
    Illustration: ReviewIllustration,
  },
  {
    heading: "Check & hand over",
    text: "Receive your browser module, editable code, design documents, and scoring guide.",
    caption: "Files your organisation can keep",
    Illustration: HandoverIllustration,
  },
];

const detailedStages = [
  ["Define the task", "Review your materials with a subject expert. Agree the audience, scope, delivery format, and success criteria."],
  ["Review the storyboard", "Your nominated approver consolidates feedback on the objectives, scenario, and assessment before development."],
  ["Build & review", "Develop the experience using existing components, run agreed checks, and collect one consolidated review of the working version."],
  ["Check & hand over", "Correct work that does not meet the agreed specification, then hand over the browser module, editable code, approved design documents, scoring guide, and setup instructions."],
];

const practicalDetails = [
  ["Where will the learning run?", "The standard handover is a self-contained HTML browser module. Open the file in your agreed browser or serve it from suitable hosting you already provide. We confirm your delivery route before signing. It needs no ScienceDojo account or subscription. SCORM, LMS completion reporting, and integrations are separately scoped."],
  ["What happens at handover?", "You receive the browser module with readable, editable HTML, CSS, and JavaScript, approved learning objectives and storyboard, the exercise and scoring guide, and setup instructions. Your organisation may keep and use the delivered module for its internal training without a per-learner charge. Reusable components and third-party assets retain their applicable licences. Managed hosting and future updates are separate."],
  ["How will we know it works?", "We agree the task and assessment criteria first. Your subject expert can review learner work against the scoring guide, check usability with a small group, and compare responses to equivalent tasks before and after practice. Evaluation arrangements are agreed for the project; improved workplace performance is not a guaranteed result."],
];

export default function BusinessProcess() {
  return (
    <section id="process" className="scroll-mt-6 px-5 py-16 md:px-8 md:py-20" aria-labelledby="process-heading">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#006B70]">How we work</p>
          <h2 id="process-heading" className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Make the work reviewable at every stage.</h2>
          <p className="mt-4 text-base leading-7 text-[#526071]">A clear path from your approved process to practical learning your team can use.</p>
        </div>

        <ol className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stages.map(({ heading, text, caption, Illustration }, index) => (
            <li key={heading} className="flex min-w-0 flex-col rounded-xl border border-[#DCE2E8] bg-[#F3F5F7] p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#12243A] text-xs font-bold text-white">0{index + 1}</span>
                <span className="h-px flex-1 bg-[#CCD7DF]" aria-hidden="true" />
              </div>
              <div className="mx-auto my-3 w-full max-w-[240px]">
                <Illustration />
              </div>
              <h3 className="text-lg font-bold leading-6">{heading}</h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-[#526071]">{text}</p>
              <p className="mt-5 border-t border-[#CCD7DF] pt-3 text-sm font-semibold leading-5 text-[#006B70]">{caption}</p>
            </li>
          ))}
        </ol>

        <div className="mt-8 rounded-xl border border-[#DCE2E8] bg-white px-5 sm:px-6">
          <details className="py-4">
            <summary className={`min-h-11 cursor-pointer py-2 text-base font-semibold ${focus}`}>Review stages and agreed checks</summary>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#526071]">The module includes two consolidated review rounds: one for the storyboard and one for the working version. Your nominated approver brings together feedback from your team.</p>
            <ol className="mt-5 grid gap-5 pb-2 md:grid-cols-2">
              {detailedStages.map(([heading, text], index) => (
                <li key={heading} className="border-l-2 border-[#B4C8CF] pl-4">
                  <h3 className="text-sm font-bold">{index + 1}. {heading}</h3>
                  <p className="mt-2 text-sm leading-7 text-[#526071]">{text}</p>
                </li>
              ))}
            </ol>
          </details>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-semibold">A few practical details</h3>
          <div className="mt-4 grid gap-5 md:grid-cols-3">
            {practicalDetails.map(([question, answer]) => (
              <details key={question} className="self-start rounded-xl border border-[#DCE2E8] bg-[#F3F5F7] px-5 py-3">
                <summary className={`min-h-11 cursor-pointer py-2 text-sm font-semibold leading-6 ${focus}`}>{question}</summary>
                <p className="mt-3 pb-2 text-sm leading-7 text-[#526071]">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

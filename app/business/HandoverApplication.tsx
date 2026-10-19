"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { handoverExercise, handoverRevision, handoverRubric, handoverSampleResponse } from "./handover-example";

const focus = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0066FF]";

export default function HandoverApplication() {
  const [response, setResponse] = useState("");
  const [notice, setNotice] = useState("");

  return (
    <div id="handover-application" className="scroll-mt-6 border-t border-[#DCE7F5] p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0066FF]">02 · Apply it · Allow 3–5 minutes</p>
        <span className="rounded bg-[#F4F8FF] px-3 py-1.5 text-xs font-medium text-[#52647C]">Fictional exercise · No automated assessment</span>
      </div>
      <h3 className="mt-4 text-2xl font-semibold tracking-tight">Write the handover the team could act on.</h3>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-[#52647C]">{handoverExercise.prompt}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-[#DCE7F5] bg-[#F4F8FF] p-5">
          <h4 className="text-sm font-semibold">Your source notes</h4>
          <ul className="mt-3 space-y-3 text-sm leading-6 text-[#52647C]">
            {handoverExercise.notes.map(({ source, fact }) => <li key={source}><strong className="text-[#001A44]">{source}:</strong> {fact}</li>)}
          </ul>
        </div>
        <div className="min-w-0">
          <label htmlFor="handover-response" className="block text-sm font-semibold">Your practice handover</label>
          <p id="handover-response-hint" className="mt-2 text-xs leading-6 text-[#52647C]">Optional: draft here or work it through on paper. Use only these fictional facts. This draft stays in this page’s memory and clears when you reload; it is not submitted or assessed.</p>
          <textarea
            id="handover-response"
            aria-describedby="handover-response-hint"
            value={response}
            onChange={(event) => { setResponse(event.target.value); setNotice(""); }}
            maxLength={1800}
            rows={10}
            className={`mt-3 w-full resize-y rounded-lg border border-[#9aabb6] bg-white p-4 text-base leading-7 text-[#001A44] sm:text-sm ${focus}`}
            placeholder={handoverExercise.responseHint}
            autoComplete="off"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <button type="button" disabled={!response} onClick={() => { setResponse(""); setNotice("Practice draft cleared."); }} className={`inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-[#0066FF] disabled:cursor-not-allowed disabled:opacity-50 ${focus}`}><RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />Clear practice draft</button>
            <p className="text-xs tabular-nums text-[#52647C]">{response.length} / 1,800 characters</p>
          </div>
          <p role="status" aria-live="polite" className="text-xs leading-6 text-[#52647C]">{notice}</p>
        </div>
      </div>

      <details className="group mt-6 rounded-lg border border-[#DCE7F5] bg-white">
        <summary className={`flex min-h-12 cursor-pointer items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-[#0066FF] ${focus}`}>
          Compare with a sample response and reviewer feedback <span className="text-lg group-open:rotate-90" aria-hidden="true">→</span>
        </summary>
        <div className="border-t border-[#DCE7F5] p-5 sm:p-6">
          <p className="text-xs leading-6 text-[#52647C]">This response and review are written examples. They do not come from a learner, a client project, or an evaluation of your draft.</p>
          <h4 className="mt-5 text-sm font-semibold">Illustrative learner response</h4>
          <blockquote className="mt-3 space-y-3 rounded border-l-2 border-[#0066FF] bg-[#F4F8FF] p-5 text-sm leading-7 text-[#001A44]">
            {handoverSampleResponse.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </blockquote>

          <h4 className="mt-6 text-sm font-semibold">A human reviewer would check the evidence</h4>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {handoverRubric.map(({ criterion, sampleRating, sampleEvidence }) => (
              <div key={criterion} className="rounded border border-[#DCE7F5] p-4">
                <h5 className="text-sm font-semibold">{criterion}</h5>
                <p className="mt-2 text-xs font-semibold text-[#0066FF]">{sampleRating}</p>
                <p className="mt-2 text-sm leading-6 text-[#52647C]">{sampleEvidence}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded bg-[#F4F8FF] p-5">
            <h5 className="text-sm font-semibold">Feedback to make it actionable</h5>
            <p className="mt-2 text-sm leading-7 text-[#52647C]">Replace “the policy links still need checking” with an explicit check and a response to delay:</p>
            <p className="mt-3 text-sm leading-7 text-[#001A44]">“{handoverRevision}”</p>
          </div>
          <p className="mt-4 text-xs leading-6 text-[#52647C]">Compare your own brief against the same four criteria. A real project’s subject expert would agree the acceptance rules and review the response in context.</p>
        </div>
      </details>
    </div>
  );
}

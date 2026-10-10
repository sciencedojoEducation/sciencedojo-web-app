"use client";

import { useEffect, useReducer, useRef } from "react";
import { ArrowRight, MessageSquare, RotateCcw } from "lucide-react";
import { createDemoState, demoReducer, demoSteps, getDemoReview, getDemoScenario } from "./onboarding-demo";

const focus = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#006B70]";

export default function WorkplaceDemo() {
  const [state, dispatch] = useReducer(demoReducer, undefined, createDemoState);
  const heading = useRef<HTMLHeadingElement>(null);
  const previousStage = useRef({ step: state.step, complete: state.complete });
  const scenario = getDemoScenario(state);
  const decision = state.decisions[state.step];
  const review = getDemoReview(state.decisions);

  useEffect(() => {
    if (previousStage.current.step === state.step && previousStage.current.complete === state.complete) return;
    previousStage.current = { step: state.step, complete: state.complete };
    heading.current?.focus({ preventScroll: true });
  }, [state.step, state.complete]);

  function restart() {
    dispatch({ type: "reset" });
    heading.current?.focus({ preventScroll: true });
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[#dce2e8] bg-white shadow-[0_16px_44px_rgba(18,36,58,0.07)]">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#12243A] px-5 py-4 text-white">
        <p className="text-sm font-semibold">Client request → clear handover</p>
        <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#d9e2e9]">Quick excerpt</span>
      </div>
      <div className="grid sm:grid-cols-[7rem_minmax(0,1fr)]">
        <div className="hidden border-r border-[#e1e6eb] bg-[#F3F5F7] px-2 py-6 sm:block" aria-label="Demo overview">
          {demoSteps.map((label, step) => (
            <p key={label} className={`mb-3 rounded px-2 py-3 text-[11px] leading-5 ${state.step === step && !state.complete ? "bg-[#e5eff0] font-semibold text-[#006B70]" : "text-[#526071]"}`}>
              <span className="mr-1.5 tabular-nums">0{step + 1}</span>{label}
            </p>
          ))}
          <p className="mt-10 border-t border-[#dce2e8] px-2 pt-4 text-[11px] leading-5 text-[#526071]">Your choices shape what happens next.</p>
        </div>
        <div className="min-w-0 p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-3" aria-label={state.complete ? "Three decisions completed" : `Decision ${state.step + 1} of 3`}>
            <div className="flex flex-1 gap-1.5" aria-hidden="true">{demoSteps.map((_, step) => <span key={step} className={`h-1 flex-1 rounded-full ${step <= state.step ? "bg-[#006B70]" : "bg-[#dce2e8]"}`} />)}</div>
            <span className="text-[11px] tabular-nums text-[#526071]">0{state.step + 1} / 03</span>
          </div>
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.08em] text-[#526071]">Fictional scenario · 3 decisions · ~2 minutes</p>
          <h2 ref={heading} tabIndex={-1} className="text-xl font-bold leading-tight tracking-tight text-[#12243A] outline-none sm:text-2xl">{state.complete ? "Your handover review." : scenario.title}</h2>

          {state.complete ? (
            <div className="mt-3">
              <p className="text-sm leading-6 text-[#526071]">{review.outcome}</p>
              <ol className="mt-4 space-y-3" aria-label="Your decisions">
                {state.decisions.map((item, index) => (
                  <li key={item.choice} className="border-b border-[#e1e6eb] pb-3 last:border-b-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#006B70]">0{index + 1} · {demoSteps[index]}</p>
                    <p className="mt-1 text-xs leading-5 text-[#12243A]">{item.label}</p>
                  </li>
                ))}
              </ol>
              <div className="mt-4 rounded bg-[#F3F5F7] p-4">
                <p className="text-xs font-semibold text-[#12243A]">What to practise next</p>
                <ul className="mt-2 space-y-2 text-xs leading-5 text-[#526071]">
                  {review.practice.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
              <p className="mt-3 text-[11px] leading-5 text-[#526071]">This is a browser-only design sample. The review reflects these choices, not a measure of workplace performance.</p>
            </div>
          ) : (
            <form onSubmit={(event) => { event.preventDefault(); dispatch({ type: state.checked ? "continue" : "check" }); }}>
              <div className="mt-3 flex gap-2.5 rounded bg-[#F3F5F7] p-3">
                <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-[#006B70]" aria-hidden="true" />
                <p className="text-xs leading-5 text-[#526071]">{scenario.context}</p>
              </div>
              <fieldset key={state.step} disabled={state.checked} className="mt-4">
                <legend className="mb-3 text-xs font-semibold leading-5 text-[#12243A]">{scenario.question}</legend>
                <div className="space-y-2">
                  {scenario.options.map((option) => (
                    <label key={option.choice} className={`flex min-h-11 items-start gap-2.5 rounded border p-3 text-xs leading-5 text-[#12243A] transition-colors ${state.checked ? "cursor-default" : "cursor-pointer hover:border-[#829aa4]"} ${state.selected === option.choice ? "border-[#006B70] bg-[#edf5f5]" : "border-[#dce2e8] bg-white"} ${state.checked && state.selected !== option.choice ? "opacity-65" : ""}`}>
                      <input type="radio" name="workplace-demo-answer" value={option.choice} checked={state.selected === option.choice} onChange={() => dispatch({ type: "select", choice: option.choice })} className={`mt-0.5 h-4 w-4 shrink-0 accent-[#006B70] ${focus}`} />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div role="status" aria-live="polite" aria-atomic="true">
                {state.checked && decision && (
                  <div className="mt-4 rounded border-l-2 border-[#006B70] bg-[#F3F5F7] p-3">
                    <p className="flex items-center gap-2 text-xs font-semibold text-[#12243A]"><ArrowRight className="h-3.5 w-3.5 text-[#006B70]" aria-hidden="true" />What happens next</p>
                    <p className="mt-1 text-xs leading-5 text-[#526071]">{decision.feedback}</p>
                  </div>
                )}
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <button type="button" onClick={restart} className={`inline-flex min-h-11 items-center gap-2 text-xs font-medium text-[#526071] hover:text-[#006B70] ${focus}`}><RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />Start again</button>
                <button type="submit" disabled={state.selected === null} className={`inline-flex min-h-11 items-center gap-2 rounded bg-[#12243A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#213f5a] disabled:cursor-not-allowed disabled:opacity-50 ${focus}`}>{state.checked ? state.step === 2 ? "Review decisions" : "Continue" : "Check decision"}<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></button>
              </div>
            </form>
          )}
          {state.complete && <button type="button" onClick={restart} className={`mt-4 inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-[#006B70] hover:text-[#00565B] ${focus}`}><RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />Try another path</button>}
        </div>
      </div>
    </div>
  );
}

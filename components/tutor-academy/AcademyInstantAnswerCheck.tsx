"use client";

import AcademyGermanText from "./AcademyGermanText";
import { playAnswerSound } from "@/lib/academy-answer-sounds";
import { CheckCircle2, CircleHelp } from "lucide-react";
import type { AnswerCheckResult, AnswerCheckSpec } from "@/lib/academy-answer-checker";

export function AcademyBilingualRule({ explanation, explanationSinhala }: { explanation: string; explanationSinhala: string }) {
  return <div className="space-y-2 text-base leading-7">
    <p><AcademyGermanText text={explanation}/></p>
    <p lang="si"><AcademyGermanText text={explanationSinhala}/></p>
  </div>;
}

export default function AcademyInstantAnswerCheck({ spec, result, onCheck, incomplete }: {
  spec: AnswerCheckSpec; result: AnswerCheckResult | null; onCheck: () => AnswerCheckResult; incomplete: boolean;
}) {
  return <div className="mt-5 space-y-4">
    <button type="button" data-academy-action="primary" onClick={() => { const checked = onCheck(); if (checked.status !== "incomplete") playAnswerSound(checked.status === "correct" ? "correct" : "retry"); }} disabled={incomplete}
      className="min-h-11 rounded-lg bg-[#245444] px-5 py-3 text-sm font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:opacity-40">
      Check answer · Antwort prüfen
    </button>
    {result ? <div role="status" aria-live="polite" data-academy-feedback={result.status === "correct" ? "correct" : "retry"} className={`rounded-xl border-l-4 p-4 ${result.status === "correct" ? "border-emerald-600 bg-emerald-50 text-emerald-950" : "border-amber-600 bg-amber-50 text-amber-950"}`}>
      <p className="mb-3 flex items-center gap-2 text-lg font-bold">
        {result.status === "correct" ? <CheckCircle2 size={20} aria-hidden="true" /> : <CircleHelp size={20} aria-hidden="true" />}
        {result.status === "correct" ? "Correct · Richtig · නිවැරදියි" : result.status === "incomplete" ? "Finish your answer · Antwort vervollständigen" : "Not a match yet · Noch nicht passend"}
      </p>
      {result.status === "not-matched" ? <><p className="mb-2 text-sm">This does not match the approved answers for this exercise. Compare the rule and try again; another wording may still be valid German.</p><p lang="si" className="mb-3 text-sm">මෙය මෙම අභ්‍යාසයට අනුමත පිළිතුරකට නොගැළපේ. රීතිය බලමින් නැවත උත්සාහ කරන්න. වෙනත් ආකාරයකින් ලියූ වාක්‍යයක් ද නිවැරදි ජර්මන් විය හැකිය.</p></> : null}
      <AcademyBilingualRule explanation={spec.explanation} explanationSinhala={spec.explanationSinhala} />
      {result.capitalizationNote ? <div className="mt-3 border-t border-emerald-200 pt-3 text-sm">
        <p>Your answer is accepted. Check capital letters against the model, especially German nouns.</p>
        <p lang="si">ඔබේ පිළිතුර පිළිගන්නා ලදී. විශේෂයෙන් ජර්මන් නාම පදවල ලොකු අකුරු ආදර්ශ පිළිතුර සමඟ සසඳන්න.</p>
      </div> : null}
      <details className="mt-4 rounded-lg border border-current/15 bg-white/70 p-3">
        <summary className="cursor-pointer font-semibold">Show model answers · Lösungen ansehen · ආදර්ශ පිළිතුරු</summary>
        <ul lang="de" className="mt-2 space-y-1 text-lg">{spec.acceptedAnswers.map(answer => <li key={answer}><AcademyGermanText text={answer}/></li>)}</ul>
      </details>
      <p className="mt-3 text-xs">Practice feedback only. Use “Antwort speichern” to save your work and progress.</p>
    </div> : null}
  </div>;
}

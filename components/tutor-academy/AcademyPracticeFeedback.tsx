"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, LoaderCircle } from "lucide-react";
import type { AcademyLanguageFeedback } from "@/lib/academy-language-feedback";

export default function AcademyPracticeFeedback({ courseKey, lessonId, blockId, text, audio, savedAudio, disabled = false }: {
  courseKey: string; lessonId: string; blockId: string;
  text?: string; audio?: Blob | null; savedAudio?: boolean; disabled?: boolean;
}) {
  const [feedback, setFeedback] = useState<AcademyLanguageFeedback | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => { controller.current?.abort(); }, []);
  const requestFeedback = async () => {
    controller.current?.abort();
    const next = new AbortController();
    controller.current = next;
    setPending(true); setError(""); setFeedback(null);
    try {
      const form = new FormData();
      form.set("courseKey", courseKey); form.set("lessonId", lessonId); form.set("blockId", blockId);
      if (text !== undefined) form.set("text", text);
      if (audio) form.set("audio", audio, "practice-audio");
      else if (savedAudio) form.set("useSavedAudio", "true");
      const response = await fetch("/api/academy/language-feedback", { method: "POST", body: form, signal: next.signal });
      const result = await response.json();
      if (!response.ok || !result.feedback) throw new Error(result.message || "Feedback is unavailable. Please try again.");
      if (!next.signal.aborted) setFeedback(result.feedback);
    } catch (cause) {
      if (!next.signal.aborted) setError(cause instanceof Error ? cause.message : "Please try again.");
    } finally {
      if (!next.signal.aborted) setPending(false);
    }
  };
  return <div className="mt-5 rounded-xl border border-blue-200 bg-white p-4 sm:p-5">
    <button type="button" onClick={requestFeedback} disabled={disabled || pending || (!text?.trim() && !audio && !savedAudio)}
      className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#1D4ED8] px-5 text-sm font-bold text-white disabled:opacity-40">
      {pending ? <LoaderCircle size={17} className="animate-spin" /> : <MessageCircle size={17} />}
      {pending ? "Checking your answer …" : feedback ? "Check again" : "Get feedback · Feedback erhalten"}
    </button>
    <p className="mt-2 text-xs leading-5 text-slate-600">AI feedback sends your answer or recording to Google Gemini for review. It does not change your course grade. Use fictional personal details.</p>
    {error ? <p role="alert" className="mt-3 text-sm font-semibold text-red-800">{error}</p> : null}
    {feedback ? <AcademyPracticeFeedbackResult feedback={feedback} showSinhala={courseKey === "deutsch-nicos-weg-a1"} /> : null}
  </div>;
}

export function AcademyPracticeFeedbackResult({ feedback, showSinhala = false }: { feedback: AcademyLanguageFeedback; showSinhala?: boolean }) {
  const [sinhala, setSinhala] = useState(showSinhala);
  return <div role="status" aria-live="polite" className="mt-5 space-y-4 text-sm leading-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={`font-bold ${feedback.status === "good" ? "text-green-800" : feedback.status === "unclear" ? "text-slate-700" : "text-red-800"}`}>{feedback.status === "good" ? "Good work · Gut gemacht" : feedback.status === "unclear" ? "Try a clearer answer" : "Keep practising · Weiter üben"}</p>
        <label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={sinhala} onChange={event => setSinhala(event.target.checked)} /> සිංහල explanations</label>
      </div>
      <p>{feedback.summary}</p>
      {sinhala && feedback.summarySinhala ? <p lang="si" className="text-slate-600">{feedback.summarySinhala}</p> : null}
      {feedback.transcript ? <div className="rounded-lg bg-slate-50 p-3"><h3 className="font-bold text-slate-700">What we heard · Erkannt</h3><p lang="de" className="whitespace-pre-wrap">{feedback.transcript}</p><p className="mt-1 text-xs text-slate-500">If this differs from what you said, record again. Speech recognition can make mistakes.</p></div> : null}
      {feedback.strengths.length ? <ul className="list-disc pl-5 text-green-800">{feedback.strengths.map((strength, index) => <li key={index}>{strength}</li>)}</ul> : null}
      {feedback.corrections.map((correction, index) => <div key={index} className="rounded-lg border border-slate-200 p-3">
        <p lang="de"><span className="font-semibold text-red-800">{correction.original}</span><span aria-label=" becomes "> → </span><strong className="text-green-800">{correction.corrected}</strong></p>
        <p className="mt-1">{correction.explanation}</p>
        {sinhala && correction.explanationSinhala ? <p lang="si" className="mt-1 text-slate-600">{correction.explanationSinhala}</p> : null}
      </div>)}
      {feedback.improvedAnswer ? <div className="rounded-lg bg-green-50 p-3"><h3 className="font-bold text-green-900">Suggested answer · Vorschlag</h3><p lang="de" className="whitespace-pre-wrap text-green-800">{feedback.improvedAnswer}</p></div> : null}
      <div className="rounded-lg bg-blue-50 p-3"><h3 className="font-bold text-blue-900">Try next · Nächster Schritt</h3><p>{feedback.nextStep}</p>{sinhala && feedback.nextStepSinhala ? <p lang="si" className="mt-1 text-slate-600">{feedback.nextStepSinhala}</p> : null}</div>
      <p className="text-xs text-slate-500">AI guidance can make mistakes. Compare it with your lesson and model answer.</p>
    </div>;
}

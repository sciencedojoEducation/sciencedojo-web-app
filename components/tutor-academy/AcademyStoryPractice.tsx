"use client";

import { useEffect, useState } from "react";
import type { LessonBlock } from "@/lib/tutor-academy";

type Practice = Extract<LessonBlock, { type: "writing-practice" | "speaking-practice" }>;

export default function AcademyStoryPractice({ blocks }: { blocks: Practice[] }) {
  return <div className="space-y-8">{blocks.map(block => <PracticeCard key={block.id} block={block} />)}</div>;
}

function PracticeCard({ block }: { block: Practice }) {
  const [text, setText] = useState("");
  const [ready, setReady] = useState(false);
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const writing = block.type === "writing-practice";
  const storageKey = `sciencedojo:b2-story:${block.id}`;
  useEffect(() => {
    const load = window.setTimeout(() => {
      try { setText(localStorage.getItem(storageKey) || ""); }
      catch { setStorageUnavailable(true); }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(load);
  }, [storageKey]);
  useEffect(() => {
    if (!running || seconds === 0) return;
    const timer = window.setInterval(() => setSeconds(value => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [running, seconds]);
  const words = text.trim() ? text.trim().split(/\s+/u).length : 0;
  function update(value: string) {
    setText(value);
    try { if (value) localStorage.setItem(storageKey, value); else localStorage.removeItem(storageKey); }
    catch { setStorageUnavailable(true); }
  }
  return (
    <section className="rounded-2xl border border-[#c9d8d2] bg-[#f2f8f5] p-6 sm:p-8" aria-labelledby={`${block.id}-heading`}>
      <p className="text-xs font-bold uppercase tracking-widest text-[#31594e]">{writing ? "Schreiben" : "Sprechen"} · Selbst üben</p>
      <h2 id={`${block.id}-heading`} className="mt-3 text-2xl font-bold text-slate-900">{block.heading}</h2>
      <p className="mt-4 leading-8 text-slate-700">{block.prompt}</p>
      <ul className="mt-5 list-disc space-y-2 pl-5 text-sm text-slate-700">{block.checklist.map(item => <li key={item}>{item}</li>)}</ul>
      {!writing ? <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => { setSeconds(block.preparationSeconds); setRunning(true); }} className="min-h-11 rounded-full border border-[#31594e] px-4 text-sm font-semibold text-[#31594e]">Vorbereitung · {block.preparationSeconds} s</button>
        <button type="button" onClick={() => { setSeconds(block.targetSeconds); setRunning(true); }} className="min-h-11 rounded-full bg-[#31594e] px-4 text-sm font-semibold text-white">Sprechen · {block.targetSeconds} s</button>
        <span role="timer" aria-label="Verbleibende Sekunden" className="font-mono text-lg tabular-nums">{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</span>
        {running && seconds > 0 ? <button type="button" className="min-h-11 px-3 text-sm underline" onClick={() => setRunning(false)}>Pause</button> : seconds > 0 ? <button type="button" className="min-h-11 px-3 text-sm underline" onClick={() => setRunning(true)}>Weiter</button> : null}
      </div> : null}
      <label htmlFor={`${block.id}-answer`} className="mt-6 block text-sm font-semibold text-slate-800">{writing ? "Ihre Nachricht" : "Stichpunkte für Ihren Beitrag"}</label>
      <textarea id={`${block.id}-answer`} value={text} disabled={!ready} onChange={event => update(event.target.value)} rows={writing ? 8 : 3} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-4 leading-7 text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-[#31594e]" />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <span>{words} Wörter{writing ? ` · Ziel: ${block.minWords}–${block.maxWords}` : ""}</span>
        <button type="button" className="min-h-11 px-2 underline" onClick={() => update("")}>Text löschen</button>
      </div>
      <p className="text-xs leading-5 text-slate-600">{storageUnavailable ? "Browserspeicher nicht verfügbar. Kopieren Sie Ihren Text vor dem Verlassen der Seite." : "Text wird nur in diesem Browser gespeichert; auf gemeinsam genutzten Geräten bitte anschließend löschen."} {writing ? "Die Auswertung erfolgt mit Checkliste und Beispiel, ohne automatische Benotung." : "Sprechen Sie laut oder nehmen Sie sich mit Ihrem eigenen Gerät auf. Dieser Pilot zeichnet keine Stimme auf."}</p>
      <details className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer py-1 font-semibold text-[#31594e]">Beispiel zum Vergleichen</summary>
        <p className="mt-4 whitespace-pre-line leading-7 text-slate-700">{block.modelAnswer}</p>
        <p className="mt-4 text-sm text-slate-600">Mehrere Antworten sind möglich. Prüfen Sie Inhalt, Register und Satzverbindungen anhand der Checkliste.</p>
      </details>
    </section>
  );
}

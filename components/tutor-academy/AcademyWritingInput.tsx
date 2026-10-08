"use client";

import AcademyGermanText from "./AcademyGermanText";
import { useRef, type DragEvent } from "react";
import { assembleBlankAnswer, assembleWordAnswer, readBlankAnswer, readWordAnswer, type WritingInput } from "@/lib/academy-writing-input";

export default function AcademyWritingInput({ input, text, onChange, maxWords, genderCues = false, mismatchPositions = [] }: {
  genderCues?: boolean;
  input: WritingInput; text: string; onChange: (text: string) => void; maxWords: number; mismatchPositions?: number[];
}) {
  const dragged = useRef<number | null>(null);
  const blankValues = input.kind === "blanks" ? readBlankAnswer(input.parts, text) : null;
  const selected = input.kind === "order" ? readWordAnswer(input.tokens, text) : null;
  const fieldClass = "rounded-lg border border-[#AFC8E7] bg-white text-lg outline-none focus:border-[var(--academy-accent)] focus:ring-2 focus:ring-[var(--academy-accent-soft)]";

  if (input.kind === "blanks" && blankValues) return <div className="mt-6 flex flex-wrap items-center gap-x-1 gap-y-2 text-lg leading-8 text-[#202733]">
    {input.parts.map((part, index) => <span key={index} className="contents">
      <span className="whitespace-pre-wrap"><AcademyGermanText text={part} enabled={genderCues}/></span>
      {index < blankValues.length ? <input aria-label={`Lücke ${index + 1} · Blank ${index + 1}`} autoComplete="off" value={blankValues[index]} maxLength={120}
        style={{ width: `${Math.max(4, Math.min(20, blankValues[index].length + 2))}ch`, maxWidth: "100%" }}
        className={`${fieldClass} min-h-11 px-2 py-1 text-center`}
        onChange={event => { const values = [...blankValues]; values[index] = event.target.value; onChange(assembleBlankAnswer(input.parts, values)); }} /> : null}
    </span>)}
    {input.hint ? <span className="text-sm text-slate-600">({input.hint})</span> : null}
  </div>;

  if (input.kind === "order" && selected) {
    const update = (next: number[]) => onChange(assembleWordAnswer(input.tokens, next, input.punctuation));
    const insert = (index: number, position: number) => {
      const previousPosition = selected.indexOf(index);
      const next = selected.filter(value => value !== index);
      next.splice(previousPosition >= 0 && previousPosition < position ? position - 1 : position, 0, index);
      update(next);
    };
    const drop = (event: DragEvent, position: number) => {
      event.preventDefault(); event.stopPropagation();
      if (dragged.current !== null) insert(dragged.current, position);
      dragged.current = null;
    };
    const tileClass = "min-h-11 cursor-grab rounded-lg border border-[#AFC8E7] bg-white px-4 py-2 text-lg font-semibold text-[#245444] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700";
    return <div className="mt-6 space-y-3">
      <p className="text-sm text-slate-600">Drag words into the sentence, or tap them in order. Tap a selected word to return it. Use ← / → to move a focused word.</p>
      <div aria-label="Your sentence · Ihr Satz" className="flex min-h-20 flex-wrap items-center gap-2 rounded-xl border-2 border-dashed border-[#AFC8E7] bg-white/60 p-3"
        onDragOver={event => event.preventDefault()} onDrop={event => drop(event, selected.length)}>
        {selected.length ? selected.map((index, position) => <button key={index} type="button" draggable className={`${tileClass} ${mismatchPositions.includes(position) ? "ring-2 ring-amber-600" : ""}`}
          aria-label={`${input.tokens[index]}, position ${position + 1}.${mismatchPositions.includes(position) ? " Check this position." : ""} Tap to remove; arrow keys to move.`}
          onDragStart={event => { dragged.current = index; event.dataTransfer.setData("text/plain", String(index)); event.dataTransfer.effectAllowed = "move"; }} onDragEnd={() => { dragged.current = null; }}
          onDragOver={event => event.preventDefault()} onDrop={event => drop(event, position)}
          onClick={() => update(selected.filter(value => value !== index))}
          onKeyDown={event => {
            const offset = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
            if (!offset || position + offset < 0 || position + offset >= selected.length) return;
            event.preventDefault(); const next = [...selected]; [next[position], next[position + offset]] = [next[position + offset], next[position]]; update(next);
          }}>{input.tokens[index]}</button>) : <span className="text-sm text-slate-500">Drop or tap words here · Wörter hier einsetzen</span>}
        {selected.length ? <span aria-hidden="true">{input.punctuation}</span> : null}
      </div>
      <div aria-label="Available words · Verfügbare Wörter" className="flex flex-wrap gap-2">
        {input.tokens.map((token, index) => selected.includes(index) ? null : <button key={index} type="button" draggable className={tileClass}
          onDragStart={event => { dragged.current = index; event.dataTransfer.setData("text/plain", String(index)); event.dataTransfer.effectAllowed = "move"; }} onDragEnd={() => { dragged.current = null; }}
          onClick={() => insert(index, selected.length)}>{token}</button>)}
      </div>
      <p aria-live="polite" className="text-sm text-slate-600">{selected.length} / {input.tokens.length} Wörter eingesetzt{selected.length ? ` · ${text}` : ""}</p>
      <button type="button" onClick={() => update([])} disabled={!selected.length} className="min-h-11 text-sm font-semibold text-[#245444] underline disabled:opacity-40">Reset · Zurücksetzen</button>
    </div>;
  }

  return <textarea aria-label="Ihre Antwort · Your answer" value={text} onChange={event => onChange(event.target.value.slice(0, 5000))}
    rows={maxWords <= 40 ? 2 : maxWords <= 120 ? 3 : 5}
    className={`${fieldClass} mt-6 block w-full max-w-3xl resize-y p-3 leading-7`}
    placeholder="Schreiben Sie hier …" />;
}

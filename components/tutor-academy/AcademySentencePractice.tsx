"use client";

import AcademyGermanText from "./AcademyGermanText";
import { useId, useState } from "react";
import { playAnswerSound } from "@/lib/academy-answer-sounds";
import { practiceSentence, type NicosSentencePractice } from "@/lib/nicos-weg-a1-sentence-practice";

const kinds = ["Statement", "Question", "Instruction"] as const;
const choiceClass = (selected: boolean) => `min-h-11 rounded-xl border px-4 py-2 text-base font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${selected ? "border-teal-700 bg-teal-700 text-white" : "border-slate-300 bg-white text-slate-800 hover:border-teal-700"}`;

export default function AcademySentencePractice({ practice }: { practice: NicosSentencePractice }) {
  const baseId = useId();
  const [verb, setVerb] = useState<number>();
  const [kind, setKind] = useState<string>();
  const [subject, setSubject] = useState<number>();
  const [detail, setDetail] = useState<number>();
  const [checked, setChecked] = useState(false);
  const [replacement, setReplacement] = useState("");
  const [spoken, setSpoken] = useState(false);
  const correct = verb === practice.verb && kind === practice.kind && subject === practice.subject && detail === practice.detail;
  const complete = verb !== undefined && kind !== undefined && subject !== undefined && detail !== undefined;
  const tokens = practice.tokens.map((token, index) => index === practice.detail && replacement ? replacement : token);
  function reset() {
    playAnswerSound("select");
    setVerb(undefined); setKind(undefined); setSubject(undefined); setDetail(undefined);
    setChecked(false); setReplacement(""); setSpoken(false);
  }
  function choose(setter: (value: number) => void, index: number) {
    playAnswerSound("select");
    setter(index); setChecked(false); setReplacement(""); setSpoken(false);
  }
  const tokenChoices = (selected: number | undefined, setter: (value: number) => void) => (
    <div className="mt-3 flex flex-wrap gap-2">
      {practice.tokens.map((token, index) => /^[.?!]$/.test(token) ? null : (
        <button key={index} type="button" aria-pressed={selected === index} className={choiceClass(selected === index)} onClick={() => choose(setter, index)}><AcademyGermanText text={token} /></button>
      ))}
    </div>
  );
  return (
    <div className="mt-6 space-y-6 rounded-2xl border border-teal-200 bg-teal-50/50 p-5 sm:p-7">
      <div>
        <h3 className="text-xl font-bold text-slate-900">Jetzt du! · Try it yourself</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">Choose answers, check them, then make a new sentence. You can retry as often as you like. Original practice example.</p>
        <p lang="si" className="mt-1 text-sm leading-6 text-slate-600">පිළිතුරු තෝරා පරීක්ෂා කරන්න. ඉන්පසු එක් කොටසක් වෙනස් කර හඬ නඟා කියන්න.</p>
        <p lang="de" className="mt-4 rounded-xl bg-white p-4 text-xl font-semibold text-slate-900"><AcademyGermanText text={practiceSentence(practice.tokens)} /></p>
      </div>
      <fieldset>
        <legend className="font-bold text-slate-900">1. Select the conjugated verb</legend>
        <p className="mt-1 text-sm text-slate-600">Choose the verb that agrees with the subject. An infinitive or a separate prefix is not the conjugated verb.</p>
        {tokenChoices(verb, setVerb)}
        <p id={`${baseId}-type`} className="mt-4 text-sm font-semibold">What type of sentence is it?</p>
        <div role="group" aria-labelledby={`${baseId}-type`} className="mt-2 flex flex-wrap gap-2">
          {kinds.map(value => <button key={value} type="button" aria-pressed={kind === value} className={choiceClass(kind === value)} onClick={() => { playAnswerSound("select"); setKind(value); setChecked(false); setReplacement(""); setSpoken(false); }}>{value}</button>)}
        </div>
      </fieldset>
      <fieldset>
        <legend className="font-bold text-slate-900">2. Select the subject</legend>
        <p className="mt-1 text-sm text-slate-600">Who or what is the sentence about? A subject can contain more than one word.</p>
        {tokenChoices(subject, setSubject)}
      </fieldset>
      <fieldset>
        <legend className="font-bold text-slate-900">Find one more sentence part</legend>
        <p className="mt-1 text-sm text-slate-600">Select: {practice.detailRole}</p>
        {tokenChoices(detail, setDetail)}
      </fieldset>
      <div className="flex flex-wrap gap-3">
        <button type="button" data-academy-action="primary" disabled={!complete} onClick={() => { playAnswerSound(correct ? "correct" : "retry"); setChecked(true); }} className="min-h-11 rounded-xl bg-teal-700 px-5 py-2 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">Check answers</button>
        <button type="button" onClick={reset} className="min-h-11 rounded-xl border border-slate-300 bg-white px-5 py-2 font-semibold text-slate-700">Start again</button>
      </div>
      <div aria-live="polite" aria-atomic="true">
        {checked && (correct ? (
          <div className="rounded-xl border border-teal-200 bg-white p-4">
            <p className="font-bold text-teal-800">All correct! Now make it your own.</p>
            <p className="mt-2 text-sm leading-6 text-slate-700"><AcademyGermanText text={practice.explanation} /></p>
          </div>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-slate-800">
            <p className="font-bold">Try again — keep your correct answers.</p>
            <ul className="mt-2 list-inside list-disc text-sm leading-6">
              <li>Verb: {verb === practice.verb ? "correct" : "look for the form that matches the subject"}.</li>
              <li>Sentence type: {kind === practice.kind ? "correct" : "does it tell you something, ask something, or ask you to act?"}.</li>
              <li>Subject: {subject === practice.subject ? "correct" : "look for who or what the verb agrees with"}.</li>
              <li>Other part: {detail === practice.detail ? "correct" : `use the clue: ${practice.detailRole}`}.</li>
            </ul>
          </div>
        ))}
      </div>
      {checked && correct && (
        <fieldset className="space-y-3 border-t border-teal-200 pt-5">
          <legend className="font-bold text-slate-900">3. Change one part and say it aloud</legend>
          <label htmlFor={`${baseId}-replacement`} className="block text-sm text-slate-700">Replace “{practice.tokens[practice.detail]}” with:</label>
          <select id={`${baseId}-replacement`} value={replacement} onChange={event => { playAnswerSound("select"); setReplacement(event.target.value); setSpoken(false); }} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900">
            <option value="">Choose a new detail</option>
            {practice.replacements.map(value => <option key={value} value={value}>{value}</option>)}
          </select>
          {replacement && <>
            <p lang="de" className="rounded-xl bg-white p-4 text-xl font-semibold text-slate-900"><AcademyGermanText text={practiceSentence(tokens)} /></p>
            <p className="text-sm leading-6 text-slate-600">This version keeps the grammatical pattern. Say the whole sentence aloud twice, then try once without looking.</p>
            <label className="flex min-h-11 items-center gap-3 text-sm font-semibold text-slate-800"><input type="checkbox" checked={spoken} onChange={event => { if (event.target.checked) playAnswerSound("complete"); setSpoken(event.target.checked); }} className="h-5 w-5 accent-teal-700" />I said my new sentence aloud.</label>
            <p role="status" className="text-sm font-bold text-teal-800">{spoken ? "Practice complete! Try another detail or start again." : "Speaking is self-checked; this activity does not assess pronunciation."}</p>
          </>}
        </fieldset>
      )}
    </div>
  );
}

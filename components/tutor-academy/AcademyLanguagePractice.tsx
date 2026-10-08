"use client";

import { loadAcademyPortfolioSubmission } from "@/lib/academy-portfolio-client";
import { isNicosWegCourse } from "@/lib/nicos-weg-course";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getAcademyRecordingFormat } from "@/lib/academy-recording";
import { academyFeedbackCapabilities } from "@/lib/academy-feedback-capabilities";
import { getNicosWritingCheck } from "@/lib/nicos-weg-a1-answer-bank";
import { checkPracticeAnswer, type AnswerCheckResult } from "@/lib/academy-answer-checker";
import AcademyPracticeFeedback from "./AcademyPracticeFeedback";
import AcademyWritingInput from "./AcademyWritingInput";
import AcademyGermanText from "./AcademyGermanText";
import AcademyInstantAnswerCheck from "./AcademyInstantAnswerCheck";
import AcademyGuidedSelfReview from "./AcademyGuidedSelfReview";
import { getWritingInput, readBlankAnswer, readWordAnswer } from "@/lib/academy-writing-input";
import { CheckCircle2, Mic, Save, Square, Trash2 } from "lucide-react";
import { isAcademyBlockRequiredForCompletion, type LessonBlock } from "@/lib/tutor-academy";
import {
  deleteAcademySpeakingSubmission,
  saveAcademySpeakingSubmission,
  saveAcademyWritingSubmission,
} from "@/app/dashboard/academy/portfolio-actions";

type PracticeBlock = Extract<
  LessonBlock,
  { type: "writing-practice" | "speaking-practice" }
>;

export default function AcademyLanguagePractice({
  block,
  courseKey,
  lessonId,
  genderCues = isNicosWegCourse(courseKey),
}: {
  block: PracticeBlock;
  courseKey?: string;
  lessonId?: string;
  genderCues?: boolean;
}) {
  if (!courseKey || !lessonId || !block.id)
    return <PracticePreview block={block} genderCues={genderCues} />;
  return block.type === "writing-practice" ? (
    <WritingPractice block={block} courseKey={courseKey} lessonId={lessonId} />
  ) : (
    <SpeakingPractice block={block} courseKey={courseKey} lessonId={lessonId} />
  );
}

function Frame({
  block,
  children,
  recording = false,
  hidePrompt = false,
  genderCues = false,
}: {
  block: PracticeBlock;
  children: React.ReactNode;
  recording?: boolean;
  hidePrompt?: boolean;
  genderCues?: boolean;
}) {
  return (
    <section data-academy-recording={recording} className="rounded-2xl border border-[#BFDCD0] bg-linear-to-br from-[#EAF6EF] to-white p-6 sm:p-8">
      <p className="flex items-center gap-2 text-sm font-bold text-[#245444]">
        {block.type === "speaking-practice" ? <Mic size={19} aria-hidden="true" /> : <Save size={19} aria-hidden="true" />}
        {block.type === "speaking-practice" ? "Sprechen" : "Schreiben"} · Privates Lernportfolio
      </p>
      <h2 className="mt-2 text-[28px] font-bold text-[#101010] sm:text-[32px]">
        {block.heading || (block.type === "writing-practice" ? "Schreiben" : "Sprechen")}
      </h2>
      {!hidePrompt ? <p className="academy-reading-copy mt-4 font-[family-name:var(--font-academy-body)] text-[17px] leading-8 text-[#202733]">
        <AcademyGermanText text={block.prompt} enabled={genderCues}/>
      </p> : null}
      {children}
    </section>
  );
}

function Checklist({ items }: { items: string[] }) {
  return (
    <ul className="mt-5 grid gap-2 font-[family-name:var(--font-academy-body)] text-sm text-[#4A4B4E] sm:grid-cols-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-700" />
          {item}
        </li>
      ))}
    </ul>
  );
}

function ModelAnswer({ answer }: { answer: string }) {
  return (
    <details className="mt-6 rounded-xl border border-[#C9D5E2] bg-white p-4">
      <summary className="cursor-pointer font-bold text-[var(--academy-accent)]">
        Mögliche Antwort ansehen
      </summary>
      <p className="academy-reading-copy mt-3 whitespace-pre-wrap text-sm leading-7 text-[#4A4B4E]">{answer}</p>
    </details>
  );
}

function WritingPractice({
  block,
  courseKey,
  lessonId,
}: {
  block: Extract<PracticeBlock, { type: "writing-practice" }>;
  courseKey: string;
  lessonId: string;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const edited = useRef(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const [checked, setChecked] = useState<{ text: string; result: AnswerCheckResult } | null>(null);
  useEffect(() => {
    let active = true;
    loadAcademyPortfolioSubmission(courseKey, lessonId, block.id!).then((value) => {
      if (!active || edited.current || value?.type !== "writing") return;
      setText(value.text || "");
      setSaved(true);
    }).catch(() => setMessage("Eine gespeicherte Antwort konnte nicht geladen werden."));
    return () => { active = false; };
  }, [block.id, courseKey, lessonId]);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const input = getWritingInput(block.prompt);
  const blankValues = input.kind === "blanks" ? readBlankAnswer(input.parts, text) : null;
  const selected = input.kind === "order" ? readWordAnswer(input.tokens, text) : null;
  const incomplete = blankValues ? blankValues.some(value => !value.trim()) : selected && input.kind === "order" ? selected.length !== input.tokens.length : !text.trim();
  const capabilities = academyFeedbackCapabilities(courseKey);
  const spec = getNicosWritingCheck(courseKey, block);
  const checkResult = spec && checked?.text === text ? checked.result : null;
  return (
    <Frame block={block} hidePrompt={Boolean(blankValues)} genderCues={isNicosWegCourse(courseKey)}>
      <p className="mt-3 text-xs font-semibold text-[#65717D]">
        {input.kind === "text" ? `Ziel: ${block.minWords}–${block.maxWords} Wörter · ` : ""}Ihre Antwort ist nur für Sie sichtbar.
      </p>
      <Checklist items={block.checklist} />
      <AcademyWritingInput genderCues={isNicosWegCourse(courseKey)} input={input} text={text} maxWords={block.maxWords}
        mismatchPositions={checkResult?.mismatchPositions}
        onChange={value => { edited.current = true; setText(value); setSaved(false); setChecked(null); }} />
      {spec ? <AcademyInstantAnswerCheck spec={spec} result={checkResult} incomplete={Boolean(incomplete)}
        onCheck={() => { const result = checkPracticeAnswer(spec, text); setChecked({ text, result }); return result; }} /> : null}
      {!spec && capabilities.guidedSelfReview ? <AcademyGuidedSelfReview key={text} modelAnswer={block.modelAnswer} /> : null}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-[#65717D]">
        <span>{blankValues ? `${blankValues.filter(value => value.trim()).length} / ${blankValues.length} Lücken ausgefüllt` : input.kind === "order" && selected ? "" : `${words} Wörter`}</span>
        <button
          type="button"
          data-academy-action="primary"
          disabled={pending || Boolean(incomplete)}
          onClick={() => startTransition(async () => {
            try {
              const result = await saveAcademyWritingSubmission(courseKey, lessonId, block.id!, text);
              setMessage(result.message);
              setSaved(result.ok);
              if (result.ok) router.refresh();
            } catch {
              setMessage("Die Antwort konnte nicht gespeichert werden. Ihre Antwort und das Übungsfeedback bleiben erhalten. Bitte versuchen Sie es erneut.");
              setSaved(false);
            }
          })}
          className="inline-flex min-h-11 items-center gap-2 bg-[var(--academy-accent)] px-5 font-bold text-white disabled:opacity-40"
        >
          <Save size={16} /> {pending ? "Speichert …" : "Antwort speichern"}
        </button>
      </div>
      {message ? <p role="status" className="mt-3 text-sm font-semibold text-[#244743]">{message}</p> : null}
      {capabilities.aiFeedback ? <AcademyPracticeFeedback key={text} courseKey={courseKey} lessonId={lessonId} blockId={block.id!} text={text} disabled={Boolean(incomplete)} /> : null}
      {saved ? <><p role="status" className="mt-4 rounded-xl bg-[#D6EEDF] p-3 text-sm text-[#245444]">Antwort gespeichert · Nutzen Sie das Feedback und vergleichen Sie mit dem Beispiel. Diese Aufgabe wird nicht automatisch benotet.</p>{!capabilities.guidedSelfReview ? <ModelAnswer answer={block.modelAnswer} /> : null}</> : null}
    </Frame>
  );
}

function SpeakingPractice({
  block,
  courseKey,
  lessonId,
}: {
  block: Extract<PracticeBlock, { type: "speaking-practice" }>;
  courseKey: string;
  lessonId: string;
}) {
  const router = useRouter();
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const startedAt = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const [savedUrl, setSavedUrl] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    loadAcademyPortfolioSubmission(courseKey, lessonId, block.id!).then((value) => {
      if (!active || recorder.current || value?.type !== "speaking") return;
      setSavedUrl(value.audioUrl);
      setElapsed(value.durationSeconds || 0);
      setSaved(true);
    }).catch(() => setMessage("Eine gespeicherte Aufnahme konnte nicht geladen werden."));
    return () => {
      active = false;
      stream.current?.getTracks().forEach((track) => track.stop());
      if (timer.current) clearInterval(timer.current);
    };
  }, [block.id, courseKey, lessonId]);

  const start = async () => {
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferred = ["audio/webm", "audio/mp4", "audio/ogg"].find((type) => MediaRecorder.isTypeSupported(type));
      const next = new MediaRecorder(media, preferred ? { mimeType: preferred } : undefined);
      const chunks: BlobPart[] = [];
      next.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      next.onstop = () => {
        const nextBlob = new Blob(chunks, { type: next.mimeType || preferred || "audio/webm" });
        setBlob(nextBlob);
        setLocalUrl((current) => {
          if (current) URL.revokeObjectURL(current);
          return URL.createObjectURL(nextBlob);
        });
        setSaved(false);
        setRecording(false);
        if (timer.current) clearInterval(timer.current);
        timer.current = null;
        media.getTracks().forEach((track) => track.stop());
      };
      recorder.current = next;
      stream.current = media;
      startedAt.current = Date.now();
      setElapsed(0);
      setMessage("");
      setRecording(true);
      next.start();
      timer.current = setInterval(() => {
        const seconds = Math.floor((Date.now() - startedAt.current) / 1000);
        setElapsed(seconds);
        if (seconds >= 180) next.stop();
      }, 500);
    } catch {
      setMessage("Das Mikrofon ist nicht verfügbar. Prüfen Sie die Browser-Berechtigung.");
    }
  };
  const stop = () => {
    if (recorder.current?.state === "recording") recorder.current.stop();
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setRecording(false);
  };
  return (
    <Frame block={block} recording={recording} genderCues={isNicosWegCourse(courseKey)}>
      <p className="mt-3 text-xs font-semibold text-[#65717D]">
        Vorbereitung: {block.preparationSeconds} Sek. · Sprechzeit: ca. {block.targetSeconds} Sek. · Maximal 3 Minuten
      </p>
      <Checklist items={block.checklist} />
      <p className="mt-5 border-l-4 border-amber-400 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        Die Aufnahme ist privat. Das Mikrofon startet erst nach Ihrer Bestätigung.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        {!recording ? (
          <button type="button" onClick={start} className="inline-flex min-h-11 items-center gap-2 bg-[var(--academy-accent)] px-5 text-sm font-bold text-white">
            <Mic size={17} /> {blob || savedUrl ? "Neu aufnehmen" : "Aufnahme starten"}
          </button>
        ) : (
          <button type="button" onClick={stop} className="inline-flex min-h-11 items-center gap-2 bg-red-700 px-5 text-sm font-bold text-white">
            <Square size={16} /> Stoppen ({elapsed}s)
          </button>
        )}
        {blob ? (
          <button
            type="button"
            disabled={pending || elapsed < 1 || elapsed > 180}
            onClick={() => startTransition(async () => {
              const data = new FormData();
              data.set("courseKey", courseKey);
              data.set("lessonId", lessonId);
              data.set("blockId", block.id!);
              data.set("durationSeconds", String(elapsed));
              const format = getAcademyRecordingFormat(blob.type);
              if (!format) {
                setMessage("Dieses Aufnahmeformat wird nicht unterstützt. Bitte versuchen Sie es in einem anderen Browser.");
                return;
              }
              data.set("audio", new File([blob], `aufnahme.${format.extension}`, { type: format.contentType }));
              const result = await saveAcademySpeakingSubmission(data);
              setMessage(result.message);
              if (result.ok) {
                setSaved(true);
                setSavedUrl(result.audioUrl || localUrl);
                router.refresh();
              }
            })}
            className="inline-flex min-h-11 items-center gap-2 border border-[var(--academy-accent)] bg-white px-5 text-sm font-bold text-[var(--academy-accent)] disabled:opacity-40"
          >
            <Save size={16} /> {pending ? "Speichert …" : "Aufnahme speichern"}
          </button>
        ) : null}
      </div>
      {localUrl || savedUrl ? (
        <audio controls preload="metadata" src={localUrl || savedUrl || undefined} className="mt-5 w-full" />
      ) : null}
      {academyFeedbackCapabilities(courseKey).aiFeedback && !recording && (blob || savedUrl) ? <AcademyPracticeFeedback key={localUrl || savedUrl} courseKey={courseKey} lessonId={lessonId} blockId={block.id!} audio={blob} savedAudio={!!savedUrl && !blob} /> : null}
      {academyFeedbackCapabilities(courseKey).guidedSelfReview ? <AcademyGuidedSelfReview key={localUrl || savedUrl || "speaking-review"} speaking modelAnswer={block.modelAnswer} /> : null}
      {saved ? (
        <><button
          type="button"
          disabled={pending}
          onClick={() => startTransition(async () => {
            if (isAcademyBlockRequiredForCompletion(block) &&
              !window.confirm("Wenn Sie diese Aufnahme löschen, müssen Sie die Sprechaufgabe erneut speichern und das Kapitel erneut abschließen. Aufnahme wirklich löschen?")) return;
            const result = await deleteAcademySpeakingSubmission(courseKey, lessonId, block.id!);
            setMessage(result.message);
            if (result.ok) {
              setSaved(false);
              setSavedUrl(null);
              setBlob(null);
              setLocalUrl((current) => {
                if (current) URL.revokeObjectURL(current);
                return null;
              });
              router.refresh();
            }
          })}
          className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-red-700"
        >
          <Trash2 size={16} /> Gespeicherte Aufnahme löschen
        </button>
        {isAcademyBlockRequiredForCompletion(block) ? (
          <p className="mt-2 text-xs text-[#6B4D14]">Durch das Löschen wird diese Pflichtaufgabe und gegebenenfalls das Kapitel wieder geöffnet.</p>
        ) : null}</>
      ) : null}
      {message ? <p role="status" className="mt-3 text-sm font-semibold text-[#244743]">{message}</p> : null}
      {!saved ? (
        <p className="mt-3 text-sm font-semibold text-[#6B4D14]">
          Zum Abschließen des Kapitels: Aufnahme stoppen und „Aufnahme speichern“ wählen. Erst danach ist „Weiter“ möglich.
        </p>
      ) : null}
      {saved ? <><p role="status" className="mt-4 rounded-xl bg-[#D6EEDF] p-3 text-sm text-[#245444]">Aufnahme gespeichert · Hören Sie die Aufnahme an und prüfen Sie Ihre Checkliste. Diese Aufgabe wird nicht automatisch benotet.</p>{!academyFeedbackCapabilities(courseKey).guidedSelfReview ? <ModelAnswer answer={block.modelAnswer} /> : null}</> : null}
    </Frame>
  );
}

function PracticePreview({ block, genderCues = false }: { block: PracticeBlock; genderCues?: boolean }) {
  return (
    <Frame block={block} genderCues={genderCues}>
      <Checklist items={block.checklist} />
      <div className="mt-6 border border-dashed border-[#AFC8E7] bg-white p-5 text-sm text-[#65717D]">
        {block.type === "writing-practice" ? "Gespeicherte Schreibfläche" : "Private Audioaufnahme"} ist in der Lernansicht verfügbar.
      </div>
    </Frame>
  );
}

"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getAcademyRecordingFormat } from "@/lib/academy-recording";
import { CheckCircle2, Mic, Save, Square, Trash2 } from "lucide-react";
import { isAcademyBlockRequiredForCompletion, type LessonBlock } from "@/lib/tutor-academy";
import {
  deleteAcademySpeakingSubmission,
  getAcademyPortfolioSubmission,
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
}: {
  block: PracticeBlock;
  courseKey?: string;
  lessonId?: string;
}) {
  if (!courseKey || !lessonId || !block.id)
    return <PracticePreview block={block} />;
  return block.type === "writing-practice" ? (
    <WritingPractice block={block} courseKey={courseKey} lessonId={lessonId} />
  ) : (
    <SpeakingPractice block={block} courseKey={courseKey} lessonId={lessonId} />
  );
}

function Frame({
  block,
  children,
}: {
  block: PracticeBlock;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-[#C9D5E2] bg-[#F7FAFD] p-6 sm:p-8">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--academy-accent)]">
        Privates Lernportfolio
      </p>
      <h2 className="mt-2 text-[28px] font-bold text-[#101010] sm:text-[32px]">
        {block.heading || (block.type === "writing-practice" ? "Schreiben" : "Sprechen")}
      </h2>
      <p className="mt-4 font-[family-name:var(--font-academy-body)] text-[17px] leading-8 text-[#202733]">
        {block.prompt}
      </p>
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
    <details className="mt-6 border-t border-[#C9D5E2] pt-4">
      <summary className="cursor-pointer font-bold text-[var(--academy-accent)]">
        Mögliche Antwort ansehen
      </summary>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#4A4B4E]">{answer}</p>
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
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  useEffect(() => {
    let active = true;
    getAcademyPortfolioSubmission(courseKey, lessonId, block.id!).then((value) => {
      if (!active || value?.type !== "writing") return;
      setText(value.text || "");
      setSaved(true);
    }).catch(() => setMessage("Eine gespeicherte Antwort konnte nicht geladen werden."));
    return () => { active = false; };
  }, [block.id, courseKey, lessonId]);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return (
    <Frame block={block}>
      <p className="mt-3 text-xs font-semibold text-[#65717D]">
        Ziel: {block.minWords}–{block.maxWords} Wörter · Ihre Antwort ist nur für Sie sichtbar.
      </p>
      <Checklist items={block.checklist} />
      <textarea
        value={text}
        onChange={(event) => { setText(event.target.value.slice(0, 5000)); setSaved(false); }}
        rows={8}
        className="mt-6 w-full border border-[#AFC8E7] bg-white p-4 text-sm leading-7 outline-none focus:border-[var(--academy-accent)] focus:ring-2 focus:ring-[var(--academy-accent-soft)]"
        placeholder="Schreiben Sie hier …"
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-[#65717D]">
        <span>{words} Wörter</span>
        <button
          type="button"
          disabled={pending || !text.trim()}
          onClick={() => startTransition(async () => {
            const result = await saveAcademyWritingSubmission(courseKey, lessonId, block.id!, text);
            setMessage(result.message);
            setSaved(result.ok);
            if (result.ok) router.refresh();
          })}
          className="inline-flex min-h-11 items-center gap-2 bg-[var(--academy-accent)] px-5 font-bold text-white disabled:opacity-40"
        >
          <Save size={16} /> {pending ? "Speichert …" : "Antwort speichern"}
        </button>
      </div>
      {message ? <p role="status" className="mt-3 text-sm font-semibold text-[#244743]">{message}</p> : null}
      {saved ? <ModelAnswer answer={block.modelAnswer} /> : null}
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
    getAcademyPortfolioSubmission(courseKey, lessonId, block.id!).then((value) => {
      if (!active || value?.type !== "speaking") return;
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
    <Frame block={block}>
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
      {saved ? <ModelAnswer answer={block.modelAnswer} /> : null}
    </Frame>
  );
}

function PracticePreview({ block }: { block: PracticeBlock }) {
  return (
    <Frame block={block}>
      <Checklist items={block.checklist} />
      <div className="mt-6 border border-dashed border-[#AFC8E7] bg-white p-5 text-sm text-[#65717D]">
        {block.type === "writing-practice" ? "Gespeicherte Schreibfläche" : "Private Audioaufnahme"} ist in der Lernansicht verfügbar.
      </div>
    </Frame>
  );
}

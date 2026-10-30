"use client";
/* eslint-disable @next/next/no-img-element -- Protected source artwork retains its original layout. */
import { useRef, useState, type ReactNode } from "react";
import { CircleCheck, ChevronDown, GripVertical, Sparkles, LoaderCircle, X, ZoomIn } from "lucide-react";
import { workbookFieldKey, workbookAnswerParts, setWorkbookAnswerPart, type StudyExercise, type WorkbookAnswers, type FieldResult, type StudyField, type WorkbookBlock } from "@/lib/aspekte-workbook";
import type { AcademyLanguageFeedback } from "@/lib/academy-language-feedback";
import WorkbookRecorder from "./WorkbookRecorder";
import WorkbookMarkers from "./WorkbookMarkers";
import { prepareWorkbookRecordingUpload } from "@/lib/workbook-recording-client";
import { createClient as createStorageClient } from "@/utils/supabase/client";
const DEFAULT_API = "/api/workbook/aspekte-neu-b2";

export default function NativeWorkbookExercise({ api = DEFAULT_API, appendWordTokens = false, showFeedback = true, selfReviewLabel = "Self-reviewed · schedule next practice", exercise, page, answers, results, onAnswer, bank, setBank, feedbackAvailable, activeTrack, playing, onTrack, onReference, onExam, onQueue, recordingScope, cloudRecordings, onFocusExercise, queued, savedFeedback, onFeedbackSaved, onRetryExercise }: {
  api?: string; appendWordTokens?: boolean; showFeedback?: boolean; selfReviewLabel?: string; exercise: StudyExercise; page: number; answers: WorkbookAnswers; results: Record<string, FieldResult>;
  onAnswer: (key: string, value: string) => void; bank: { key: string; token: string } | null;
  setBank: (value: { key: string; token: string } | null) => void; feedbackAvailable: boolean;
  activeTrack: number; playing: boolean; onTrack: (track: number) => void; onReference: (page: number) => void; onExam: (label: string) => void;
  onRetryExercise: (page: number, exercise: string) => void;
  onQueue: (page: number, exercise: string, reason: "uncertain" | "skipped" | "self-review") => void; recordingScope: string; cloudRecordings: boolean; queued: boolean; savedFeedback?: import("@/lib/workbook-study").WorkbookFeedback; onFeedbackSaved: () => void; onFocusExercise: (key: string) => void;
}) {
  const API = api;
  const [feedback, setFeedback] = useState<AcademyLanguageFeedback | null>(savedFeedback?.feedback || null);
  const [feedbackInput, setFeedbackInput] = useState(savedFeedback?.inputText || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [audio, setAudio] = useState<Blob | null>(null);
  const [wordBankCollapsed, setWordBankCollapsed] = useState(false);
  const key = `${page}:${exercise.id}`;
  const open = exercise.fields.some(f => f.evaluation === "review");
  const personal = exercise.fields.every(f => f.evaluation === "self");
  const hasMismatch = exercise.fields.some(f => results[workbookFieldKey(page, exercise.id, f.id)]?.status === "incorrect");
  const text = exercise.fields.map(f => `${f.label}: ${(answers[workbookFieldKey(page, exercise.id, f.id)] || "").replace(/\u001f/g, " ")}`).join("\n");
  const hasAnswer = exercise.fields.some(f => answers[workbookFieldKey(page, exercise.id, f.id)]?.trim());
  const stale = feedback && feedbackInput !== text;

  function drop(fieldId: string, token: string, segment?: number) {
    const field = exercise.fields.find(f => f.id === fieldId);
    if (!field || (field.options.length && !field.options.includes(token))) return;
    const id = workbookFieldKey(page, exercise.id, fieldId);
    const setValues = (answers[id] || "").split(/[,;\n]+/).map(value => value.trim()).filter(Boolean);
    const tokenSeparator = appendWordTokens && !field.options.length ? ", " : field.multiple ? "\n" : ", ";
    onAnswer(id, segment ? setWorkbookAnswerPart(answers[id] || "", field.segments || 2, segment, token) : (field.evaluation === "set" || appendWordTokens && field.multiple && !field.options.length) ? [...new Set([...setValues, token])].join(tokenSeparator) : exercise.mode === "order" ? [answers[id], token].filter(Boolean).join(" ") : token);
    setBank(null);
  }

  async function requestFeedback() {
    setBusy(true); setError("");
    const uploadEndpoint = `${API}/recordings/upload?exercise=${encodeURIComponent(key)}&account=${encodeURIComponent(recordingScope.split(":")[0])}`;
    let temporaryTicket: string | undefined;
    try {
      const form = new FormData(); form.set("page", String(page)); form.set("exercise", exercise.id); form.set("accountId", recordingScope.split(":")[0]);
      if (audio && cloudRecordings) {
        const grant = await prepareWorkbookRecordingUpload(uploadEndpoint, audio, "feedback", async (grant, file) => {
          const result = await createStorageClient().storage.from("workbook-recordings").uploadToSignedUrl(grant.path, grant.token, file, { contentType: grant.mime, cacheControl: "0" });
          if (result.error) throw new Error("Audio upload could not finish. Your local recording is safe; retry feedback when connected.");
        });
        temporaryTicket = grant.ticket; form.set("audioTicket", grant.ticket);
      } else if (audio) form.set("audio", audio, "answer"); else form.set("text", text);
      const response = await fetch(`${API}/feedback`, { method: "POST", body: form });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message);
      setFeedback(body.feedback); setFeedbackInput(text);
      if (body.saved) onFeedbackSaved(); else setError("Feedback is shown, but could not be saved to your history. Keep a copy before leaving.");
    } catch (error) { setError(error instanceof Error ? error.message : "Feedback is unavailable."); }
    finally {
      if (temporaryTicket) await fetch(uploadEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "cancel", ticket: temporaryTicket }) }).catch(() => {});
      setBusy(false);
    }
  }

  const placed = new Set((exercise.content || []).flatMap(block => [block.text || "", ...(block.rows || []).flat()].flatMap(text => [...text.matchAll(/\{\{([^}]+)\}\}/g)].map(match => match[1].split("#")[0]))));
  function renderField(field: StudyField | undefined, inline: boolean, segment?: number): ReactNode {
    if (!field) return <span className="wb-source-notes">[field unavailable]</span>;
    const id = workbookFieldKey(page, exercise.id, field.id);
    const result = results[id];
    const controlId = segment ? `${id}-part-${segment}` : id;
    const currentValue = segment ? workbookAnswerParts(answers[id] || "", field.segments || 2)[segment - 1] : answers[id] || "";
    const controlLabel = segment ? `${field.label}, Teil ${segment}` : field.label;
    const change = (value: string) => onAnswer(id, segment ? setWorkbookAnswerPart(answers[id] || "", field.segments || 2, segment, value) : value);
    const long = field.multiline || !inline && (["writing", "speaking", "order"].includes(exercise.mode) || field.evaluation === "review" && !field.options.length);
    const expected = result?.expected.join(field.evaluation === "set" ? ", " : " / ") || "";
    const message = !result ? "" : result.status === "correct" ? "Richtig!" : result.status === "incorrect" ? `Answer key: ${expected}` : result.status === "unanswered" ? `Not answered · ${expected}` : result.status === "self" ? "Self-assessment saved." : result.expected.length ? `Book example: ${expected}` : "Open response: use guided or Gemini review.";
    const control = field.options.length && inline ? <select id={controlId} aria-label={controlLabel} value={currentValue} onChange={event => change(event.target.value)}><option value="">…</option>{field.options.map(option => <option key={option} value={option}>{field.optionLabels?.[option] || option}</option>)}</select>
      : field.options.length ? <div className="wb-option-row" role="group" aria-label={controlLabel}>{field.options.map(option => { const selected = field.multiple ? (answers[id] || "").split("\n").includes(option) : answers[id] === option; return <button type="button" key={option} aria-pressed={selected} className={selected ? "wb-option wb-option-selected" : "wb-option"} onClick={() => { if (field.multiple) { const values = (answers[id] || "").split("\n").filter(Boolean); onAnswer(id, (selected ? values.filter(value => value !== option) : [...values, option]).join("\n")); } else onAnswer(id, selected ? "" : option); }}>{field.optionLabels?.[option] || option}</button>; })}</div>
      : long ? <textarea id={controlId} aria-label={controlLabel} rows={exercise.mode === "writing" ? 6 : 2} maxLength={5000} placeholder={exercise.mode === "speaking" ? "Optional: draft your answer here…" : "Deine Antwort…"} value={currentValue} onChange={event => change(event.target.value)} onClick={() => { if (bank?.key === key) drop(field.id, bank.token, segment); }} spellCheck lang="de" />
      : <input id={controlId} type="text" aria-label={controlLabel} maxLength={5000} autoComplete="off" placeholder={inline ? "…" : "Deine Antwort…"} style={inline ? { width: `${Math.max(10, Math.min(26, (answers[id]?.length || 8) + 2))}ch` } : undefined} value={currentValue} onChange={event => change(event.target.value)} onClick={() => { if (bank?.key === key) drop(field.id, bank.token, segment); }} spellCheck lang="de" />;
    const props = { className: `wb-field ${inline ? "wb-inline-field" : ""} ${result ? `wb-field-${result.status}` : ""}`, title: inline ? message || field.label : undefined,
      onDragOver: (event: React.DragEvent) => { if (event.dataTransfer.types.includes("application/x-workbook-token") || event.dataTransfer.types.includes("text/plain")) { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; } },
      onDrop: (event: React.DragEvent) => { event.preventDefault(); try { const raw = event.dataTransfer.getData("application/x-workbook-token"); const value = raw ? JSON.parse(raw) : { key: bank?.key, token: event.dataTransfer.getData("text/plain") }; if (value.key === key && exercise.wordBank.includes(value.token)) drop(field.id, value.token, segment); } catch { /* Ignore unrelated dragged data. */ } },
    };
    return inline ? <span key={id} {...props}>{field.label.startsWith("Lücke") && <span className="wb-inline-number">({field.id})</span>}{control}{result && <span className="wb-inline-check" aria-label={message}>{result.status === "correct" ? "✓" : result.status === "incorrect" || result.status === "unanswered" ? "!" : "·"}</span>}{result && result.status !== "correct" && <span className="wb-inline-correction">{message}</span>}</span>
      : <div key={id} {...props}><label htmlFor={controlId} onClick={() => { if (bank?.key === key) drop(field.id, bank.token, segment); }}>{field.label}</label>{control}{result && <div className="wb-field-result" role="status">{result.status === "correct" ? <CircleCheck size={14} /> : null}{message}</div>}</div>;
  }

  const markerGroup = (markers: NonNullable<StudyExercise["markers"]>) => <WorkbookMarkers markers={markers} activeTrack={activeTrack} playing={playing} onTrack={onTrack} onReference={onReference} onExam={onExam} />;
  return <article className="wb-exercise" id={`exercise-${page}-${exercise.id}`} onFocusCapture={() => onFocusExercise(`${page}:${exercise.id}`)}>{markerGroup((exercise.markers || []).filter(m => m.position === "heading"))}<div className="wb-exercise-heading"><span className="wb-exercise-number">{exercise.id}</span><span className="wb-task-type">{exercise.mode === "self" ? "SELF-ASSESSMENT" : personal ? "PERSONAL RESPONSE" : open ? "OPEN PRACTICE" : "ANSWER KEY"}</span></div><h3>{exercise.instruction}</h3>
    {!!exercise.wordBank.length && <div className={`wb-bank${wordBankCollapsed ? " wb-bank-collapsed" : ""}`} role="group" aria-label={`Word bank for exercise ${exercise.id}`}>
      <button type="button" className="wb-bank-toggle" aria-label={`${wordBankCollapsed ? "Show" : "Hide"} words for exercise ${exercise.id}`} aria-expanded={!wordBankCollapsed} aria-controls={`word-bank-${key}`} onClick={() => setWordBankCollapsed(collapsed => !collapsed)}>
        <strong>Words · {exercise.id}</strong><span>{wordBankCollapsed ? "Show" : "Hide"}<ChevronDown size={16} aria-hidden className={wordBankCollapsed ? "" : "wb-bank-chevron-open"} /></span>
      </button>
      <p><GripVertical size={13} /> Drag a word into an answer, or select one and tap a field.</p>
      <div className="wb-bank-words" id={`word-bank-${key}`}>{exercise.wordBank.map((token, i) => <button type="button" key={`${token}:${i}`} draggable className={bank?.key === key && bank.token === token ? "wb-token wb-token-selected" : "wb-token"} aria-pressed={bank?.key === key && bank.token === token} onClick={() => setBank(bank?.key === key && bank.token === token ? null : { key, token })} onDragStart={event => { event.dataTransfer.effectAllowed = "copy"; event.dataTransfer.setData("text/plain", token); event.dataTransfer.setData("application/x-workbook-token", JSON.stringify({ key, token })); setBank({ key, token }); }}><GripVertical size={12} />{exercise.wordBankLabels?.[token] || token}</button>)}</div>
    </div>}

    {exercise.requiresSource && <p className="wb-source-dependency">This exercise needs the separate Lehrbuch. It is excluded from fixed-answer scores.</p>}<div className="wb-exercise-content">{exercise.content?.map((block, index) => <div key={index}>{markerGroup((exercise.markers || []).filter(m => m.position === "content" && m.beforeBlock === index))}<NativeWorkbookBlock api={API} block={block} field={reference => { const [id, segment] = reference.split("#"); return renderField(exercise.fields.find(f => f.id === id), true, segment ? Number(segment) : undefined); }} /></div>)}</div>
    <div className="wb-fields">{exercise.fields.filter(field => !placed.has(field.id)).map(field => renderField(field, false))}</div>
    {exercise.mode === "speaking" && <WorkbookRecorder id={`${recordingScope}:${key}`} exerciseKey={key} cloudEnabled={cloudRecordings} onAudio={blob => { setAudio(blob); if (audio || blob) setFeedback(null); }} />}
    {open && !!exercise.checklist.length && <details className="wb-checklist"><summary>Before you check</summary><ul>{exercise.checklist.map((item, i) => <li key={i}>{item}</li>)}</ul></details>}
    <div className="wb-revision-actions">{!personal && <button className="wb-text-button" onClick={() => onRetryExercise(page, exercise.id)}>Try exercise again · blank answers</button>}<button className="wb-text-button" onClick={() => onQueue(page, exercise.id, "uncertain")}>{queued ? "In revision · mark not confident" : "Not confident · revise later"}</button><button className="wb-text-button" onClick={() => onQueue(page, exercise.id, "skipped")}>Skip · add to revision</button>{(open || personal) && !exercise.requiresSource && !exercise.fields.some(f => f.evaluation === "exact" || f.evaluation === "set") && <button className="wb-text-button" onClick={() => onQueue(page, exercise.id, "self-review")}>{selfReviewLabel}</button>}</div>
    {exercise.notes && <details className="wb-source-notes"><summary>Exercise note</summary><p>{exercise.notes}</p></details>}
    {showFeedback && (open || hasMismatch) && <div className="wb-ai-area"><button className="wb-ai-button" disabled={busy || (!hasAnswer && !audio) || !feedbackAvailable} onClick={() => void requestFeedback()}>{busy ? <LoaderCircle size={16} className="wb-spin" /> : <Sparkles size={16} />}{busy ? "Reviewing your answer…" : hasMismatch && !open ? "Ask Gemini about an alternative" : "Get Gemini feedback"}</button><small>{feedbackAvailable ? "Sends this answer and exercise context to Google Gemini." : "Configure the existing Gemini key to enable feedback."}</small></div>}
    {error && <p className="wb-error" role="alert">{error}</p>}
    {feedback && <div className="wb-feedback"><div className="wb-feedback-heading"><Sparkles size={15} /> GEMINI FEEDBACK</div>{stale && <p className="wb-feedback-stale">Your answer changed, or this feedback was for a recording. Request feedback again for the current version.</p>}<p>{feedback.summary}</p><details><summary>සිංහලෙන් පැහැදිලි කිරීම</summary><p>{feedback.summarySinhala}</p></details>{feedback.corrections.map((correction, i) => <div className="wb-correction" key={i}><del>{correction.original}</del><strong>{correction.corrected}</strong><p>{correction.explanation}</p><details><summary>සිංහල</summary><p>{correction.explanationSinhala}</p></details></div>)}{feedback.improvedAnswer && <details><summary>A possible improved answer</summary><p lang="de">{feedback.improvedAnswer}</p></details>}{feedback.transcript && <details><summary>Your speech transcript</summary><p lang="de">{feedback.transcript}</p></details>}<p className="wb-feedback-next">{feedback.nextStep}</p><small>AI suggestions for practice; use your judgment.</small></div>}
  </article>;
}

export function NativeWorkbookBlock({ api = DEFAULT_API, block, field }: { api?: string; block: WorkbookBlock; field: (id: string) => ReactNode }) {
  const API = api;
  const figureDialog = useRef<HTMLDialogElement>(null);
  function text(value: string): ReactNode {
    return value.split(/(\{\{[^}]+\}\})/g).map((part, index) => part.startsWith("{{") && part.endsWith("}}") ? <span key={index}>{field(part.slice(2, -2))}</span> : <span key={index}>{part}</span>);
  }
  if (block.type === "figure") return <figure className={`wb-book-figure${block.readingImage ? " wb-reading-image" : ""}`}><button type="button" className="wb-figure-enlarge" aria-label={`Enlarge ${block.title || block.alt || "workbook illustration"}`} onClick={() => figureDialog.current?.showModal()}><img src={`${API}/assets/figure/${block.asset}`} alt={block.alt || "Illustration from the workbook"} /><span><ZoomIn size={14} /> Enlarge</span></button>{block.title && <figcaption>{block.title}</figcaption>}<dialog className="wb-figure-dialog" ref={figureDialog}><div className="wb-dialog-header"><strong>{block.title || block.alt || "Workbook illustration"}</strong><button type="button" className="wb-icon-button" aria-label="Close enlarged illustration" onClick={() => figureDialog.current?.close()}><X size={20} /></button></div><div className="wb-figure-zoom"><img src={`${API}/assets/figure/${block.asset}`} alt={block.alt || "Illustration from the workbook"} /></div></dialog></figure>;
  if (block.type === "table") return <div className="wb-native-table-wrap"><table className={block.rows?.every(row => row.every(cell => /^[A-ZÄÖÜ]$/.test(cell))) ? "wb-native-table wb-letter-grid" : "wb-native-table"}>{block.headers && <thead><tr>{block.headers.map((value, i) => <th key={i}>{value}</th>)}</tr></thead>}<tbody>{block.rows?.map((row, i) => <tr key={i}>{row.map((value, j) => <td key={j}>{text(value)}</td>)}</tr>)}</tbody></table></div>;
  return <div className={`wb-book-block wb-book-block-${block.type}${block.title?.startsWith("Dialog") ? " wb-dialogue-block" : ""}`}>{(block.title || block.asset) && <div className="wb-reading-byline">{block.asset && <img src={`${API}/assets/figure/${block.asset}`} alt="" />} {block.title && <strong>{block.title}</strong>}</div>}{block.text && <div className="wb-book-prose">{text(block.text)}</div>}</div>;
}

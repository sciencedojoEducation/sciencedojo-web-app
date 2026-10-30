"use client";
/* eslint-disable @next/next/no-img-element -- Source page rasters are already sized locally and must retain the original layout. */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BookOpen, Check, CheckCheck, ChevronLeft, ChevronRight, Download, Upload, Headphones, ArrowUpRight, X, Menu, ZoomIn, CircleCheck, CircleAlert, LoaderCircle, RotateCcw } from "lucide-react";
import { workbookFieldKey, workbookAnswerParts, workbookQuickSession, type WorkbookQuickFilter, type WorkbookManifest, type StudyPage, type WorkbookAnswers, type FieldResult, type CheckResult } from "@/lib/aspekte-workbook";
import WorkbookAudio, { type WorkbookAudioHandle } from "./WorkbookAudio";
import WorkbookMarkers from "./WorkbookMarkers";
import WorkbookRecordingHistory from "./WorkbookRecordingHistory";
import WorkbookConflictPanel from "./WorkbookConflictPanel";
import { useWorkbookStudy } from "./useWorkbookStudy";
import { chapterForPage, workbookChapterStats, type WorkbookDraft } from "@/lib/workbook-study";
import "./workbook.css";
import ExerciseCard, { NativeWorkbookBlock as BookBlock } from "./NativeWorkbookExercise";

const API = "/api/workbook/aspekte-neu-b2";
const STORAGE = "aspekte-neu-b2-study-v1";
type Backup = { version: 1; answers: WorkbookAnswers; page: number; visited: number[]; notes: Record<string, string> };
const minutes = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, "0")}`;

function parseBackup(value: unknown): Backup {
  const data = value as Backup;
  if (!data || data.version !== 1 || !data.answers || typeof data.answers !== "object" || Array.isArray(data.answers) || Object.keys(data.answers).length > 10000 || !Number.isInteger(data.page) || data.page < 6 || data.page > 145 || !Array.isArray(data.visited) || data.visited.some(n => !Number.isInteger(n) || n < 6 || n > 145)) throw new Error("Invalid backup");
  for (const [key, text] of Object.entries(data.answers)) if (!/^\d{1,3}:[^:]{1,40}:[^:]{1,40}$/.test(key) || typeof text !== "string" || text.length > 5000) throw new Error("Invalid answer");
  const notes: Record<string, string> = {};
  if (data.notes && typeof data.notes === "object") for (const [key, text] of Object.entries(data.notes)) {
    if (!/^\d{1,3}$/.test(key) || typeof text !== "string" || text.length > 10000) throw new Error("Invalid notes");
    notes[key] = text;
  }
  return { version: 1, answers: data.answers, page: data.page, visited: [...new Set(data.visited)], notes };
}

export default function AspekteWorkbook({ manifest }: { manifest: WorkbookManifest }) {
  const study = useWorkbookStudy();
  const { answers, notes, visited, position, assisted } = study.state.draft;
  const pageNumber = position.page;
  const initialised = !!study.account;
  const storageMessage = study.message;
  function updateDraft<K extends keyof WorkbookDraft>(key: K, value: WorkbookDraft[K] | ((current: WorkbookDraft[K]) => WorkbookDraft[K])) {
    study.edit(draft => ({ ...draft, [key]: typeof value === "function" ? (value as (current: WorkbookDraft[K]) => WorkbookDraft[K])(draft[key]) : value }));
  }
  const setAnswers = (value: WorkbookAnswers | ((current: WorkbookAnswers) => WorkbookAnswers)) => updateDraft("answers", value);
  const setNotes = (value: Record<string, string> | ((current: Record<string, string>) => Record<string, string>)) => updateDraft("notes", value);
  const setVisited = (value: number[] | ((current: number[]) => number[])) => updateDraft("visited", value);
  const setPageNumber = (page: number) => updateDraft("position", current => ({ ...current, page }));
  const [quickFilter, setQuickFilter] = useState<WorkbookQuickFilter>("chapter");
  const [conflictChoices, setConflictChoices] = useState<Record<string, "local" | "remote">>({});
  const [chapters, setChapters] = useState<Record<number, StudyPage[]>>({});
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [results, setResults] = useState<Record<string, FieldResult>>({});
  const [checking, setChecking] = useState(false);
  const [summary, setSummary] = useState<{ result: CheckResult; complete: boolean } | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [bank, setBank] = useState<{ key: string; token: string } | null>(null);
  const [reference, setReference] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [resource, setResource] = useState("");

  const [track, setTrack] = useState(0);
  const [backupText, setBackupText] = useState("");
  const [backupMessage, setBackupMessage] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const summaryDialog = useRef<HTMLDialogElement>(null);
  const backupDialog = useRef<HTMLDialogElement>(null);
  const audio = useRef<WorkbookAudioHandle>(null);
  const chapter = manifest.chapters[Math.floor((pageNumber - 6) / 14)];
  const pages = chapters[chapter.number];
  const page = pages?.find(p => p.bookPage === pageNumber);
  const fields = page?.exercises.flatMap(e => e.fields.map(f => workbookFieldKey(pageNumber, e.id, f.id))) || [];
  const filled = fields.filter(key => answers[key]?.trim()).length;
  const loaded = pages !== undefined;
  const resumed = useRef(false);
  useEffect(() => {
    if (!initialised || !loaded || resumed.current) return;
    resumed.current = true;
    if (position.view === "book" && position.exercise) document.getElementById(`exercise-${position.exercise.replace(":", "-")}`)?.scrollIntoView({ block: "start" });
  }, [initialised, loaded, position.exercise, position.view]);
  useEffect(() => {
    const restored: Record<string, FieldResult> = {};
    for (const attempt of study.state.attempts) {
      const run = study.state.draft.runs[String(attempt.chapter)] || "initial";
      if (attempt.run !== run) continue;
      for (const [key, result] of Object.entries(attempt.result.fields)) {
        const exerciseKey = key.slice(0, key.lastIndexOf(":"));
        const currentRun = study.state.draft.exerciseRuns?.[exerciseKey] || run;
        const attemptRun = attempt.exerciseRuns?.[exerciseKey] || attempt.run;
        if (currentRun === attemptRun && Object.hasOwn(study.state.draft.revealed, key) && (answers[key] || "") === (attempt.answers[key] || "")) restored[key] = result;
      }
    }
    setResults(restored);
    // Editing an answer clears its result; only new submissions or navigation restore checked results.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [study.state.attempts, study.state.draft.runs, study.state.draft.exerciseRuns, pageNumber]);

  useEffect(() => {
    if (loaded) return;
    const controller = new AbortController();
    setError("");
    fetch(`${API}?chapter=${chapter.number}`, { signal: controller.signal }).then(async response => {
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || "Unable to load this chapter.");
      setChapters(current => ({ ...current, [chapter.number]: body.pages }));
    }).catch(error => { if (error.name !== "AbortError") setError("Could not load this chapter. Your saved answers are unaffected."); });
    return () => controller.abort();
  }, [chapter.number, loaded, retry]);

  useEffect(() => { setBank(null); }, [pageNumber]);
  useEffect(() => { setConflictChoices({}); }, [study.conflict]);
  useEffect(() => {
    if (reference) dialog.current?.showModal(); else dialog.current?.close();
  }, [reference]);
  useEffect(() => { if (summary) summaryDialog.current?.showModal(); }, [summary]);

  function go(number: number) { updateDraft("position", current => ({ ...current, page: Math.min(145, Math.max(6, number)), view: "book", exercise: null })); setDrawer(false); setError(""); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function answer(key: string, value: string) {
    setAnswers(current => ({ ...current, [key]: value.slice(0, 5000) }));
    setResults(current => { const next = { ...current }; delete next[key]; return next; });
  }
  function markRead() { setVisited(current => current.includes(pageNumber) ? current : [...current, pageNumber]); }

  async function check(all: boolean | "book") {
    setChecking(true); setError("");
    try {
      const combined: CheckResult = { fields: {}, correct: 0, scored: 0, unanswered: 0, review: 0 };
      for (const ch of all === "book" ? manifest.chapters : [chapter]) {
        const data = await study.action({ action: "submit", id: crypto.randomUUID(), chapter: ch.number, kind: all ? "chapter" : "practice", ...(!all ? { exercises: position.view === "quick" ? [position.exercise] : page?.exercises.map(e => `${pageNumber}:${e.id}`), revisionSession: !!position.revisionSession } : {}) });
        const result = data.attempt.result as CheckResult;
        Object.assign(combined.fields, result.fields); combined.correct += result.correct; combined.scored += result.scored; combined.unanswered += result.unanswered; combined.review += result.review;
      }
      setResults(current => ({ ...current, ...combined.fields })); setSummary({ result: combined, complete: true });
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to check answers."); }
    setChecking(false);
  }
  async function retryChapter() {
    setChecking(true); setError("");
    try { await study.action({ action: "retry", chapter: chapter.number, id: crypto.randomUUID() }); setResults({}); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to start a fresh attempt."); }
    setChecking(false);
  }
  async function startQuickSession() {
    setChecking(true); setError("");
    try {
      let selectedChapter = chapter.number;
      if (quickFilter === "revision") {
        const due = study.state.reviews.filter(r => r.due && Date.parse(r.due) <= Date.now()).sort((a, b) => Date.parse(a.due!) - Date.parse(b.due!));
        if (!due.length) { setError("You’re caught up with scheduled revision. You can retry any chapter whenever you like."); return; }
        selectedChapter = chapterForPage(due[0].page);
      }
      let content = chapters[selectedChapter];
      if (!content) { const r = await fetch(`${API}?chapter=${selectedChapter}`); const data = await r.json(); if (!r.ok) throw new Error(data.message); content = data.pages; setChapters(current => ({ ...current, [selectedChapter]: content })); }
      const due = new Set(study.state.reviews.filter(r => r.due && Date.parse(r.due) <= Date.now()).map(r => r.key));
      const items = workbookQuickSession(content, quickFilter, pageNumber, due);
      if (!items.length) { setError("No matching exercises here. Choose an earlier page or another chapter."); return; }
      if (quickFilter === "revision") {
        // Archive existing work before creating blank review responses.
        await study.action({ action: "start-session", id: crypto.randomUUID(), chapter: selectedChapter, exercises: items });
        const prefixes = items.map(k => `${k}:`); setAnswers(current => Object.fromEntries(Object.entries(current).filter(([k]) => !prefixes.some(prefix => k.startsWith(prefix))))); setResults({});
      }
      updateDraft("position", current => ({ ...current, page: Number(items[0].split(":")[0]), exercise: items[0], view: "quick", session: items, revisionSession: quickFilter === "revision" }));
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to start a session."); }
    finally { setChecking(false); }
  }
  async function finishQuickSession() {
    setChecking(true); setError("");
    try {
      const data = await study.action({ action: "submit", id: crypto.randomUUID(), chapter: chapter.number, kind: "practice", exercises: position.session || [], revisionSession: !!position.revisionSession, finishSession: true });
      setResults(current => ({ ...current, ...data.attempt.result.fields })); setSummary({ result: data.attempt.result, complete: true });
      updateDraft("position", p => ({ ...p, view: "progress" }));
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to finish this session."); }
    setChecking(false);
  }
  async function retryExercise(page: number, exercise: string) {
    setChecking(true); setError("");
    try {
      await study.action({ action: "start-session", id: crypto.randomUUID(), chapter: chapterForPage(page), exercises: [`${page}:${exercise}`] });
      setResults(current => Object.fromEntries(Object.entries(current).filter(([key]) => !key.startsWith(`${page}:${exercise}:`))));
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to start a fresh exercise."); }
    setChecking(false);
  }
  function quickMove(direction: number) {
    const session = position.session || []; const i = session.indexOf(position.exercise || "") + direction;
    if (!session[i]) return;
    updateDraft("position", current => ({ ...current, page: Number(session[i].split(":")[0]), exercise: session[i] }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function queueExercise(page: number, exercise: string, reason: "uncertain" | "skipped" | "self-review") {
    try { await study.action({ action: reason === "self-review" ? "self-review" : "queue", chapter: chapterForPage(page), page, exercise, reason }); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to add revision."); }
  }

  function exportBackup() {
    setBackupText(JSON.stringify({ version: 1, answers, page: pageNumber, visited, notes }, null, 2));
    setBackupMessage(""); backupDialog.current?.showModal();
  }
  function downloadBackup() {
    const blob = new Blob([backupText], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = "aspekte-neu-b2-progress.json";
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function restoreBackup(value: unknown) {
    if (study.conflict) throw new Error("Resolve the device changes before restoring a backup.");
    const data = parseBackup(value);
    updateDraft("position", p => ({ ...p, view: "book", exercise: null }));
    setAnswers(current => ({ ...current, ...data.answers })); setNotes(current => ({ ...current, ...data.notes }));
    setVisited(current => [...new Set([...current, ...data.visited])]); setPageNumber(data.page); setResults({});
  }
  async function importBackup(file: File) {
    try {
      if (file.size > 3_000_000) throw new Error("too large");
      restoreBackup(JSON.parse(await file.text()));
    } catch { setError("That file is not a valid workbook progress backup."); }
  }

  async function openReference(pdfPage: number) {
    if (pdfPage >= 147 && pdfPage <= 173 && !assisted.includes(chapter.number)) {
      try { await study.action({ action: "assist", chapter: chapter.number }); } catch (e) { setError(e instanceof Error ? e.message : "Unable to record solution viewing."); return; }
    }
    setReference(pdfPage);
  }
  function playTrack(number: number) { audio.current?.toggle(number); }
  const totalReady = manifest.chapters.reduce((n, c) => n + c.readyPages, 0);
  const nativeReady = manifest.chapters.reduce((n, c) => n + c.nativePages, 0);

  if (study.loadError) return <main className="p-8"><h1>Workbook account</h1><p role="alert">{study.loadError}</p><p>Your unsent work remains saved under its original account on this device.</p><button className="wb-button" onClick={() => window.location.reload()}>Reload workbook</button></main>;

  return <div className="wb-app">
    {drawer && <button className="wb-drawer-backdrop" aria-label="Close chapter menu" onClick={() => setDrawer(false)} />}
    <aside className={`wb-sidebar ${drawer ? "wb-sidebar-open" : ""}`} aria-label="Workbook chapters">
      <Link className="wb-brand" href="/">sciencedojo<span>.</span></Link>
      <div className="wb-book-label"><span className="wb-book-icon"><BookOpen size={23} /></span><div><strong>Aspekte neu</strong><span>DEUTSCH · B2</span></div></div>
      <p className="wb-rail-eyebrow">DEIN ARBEITSBUCH</p>
      <nav className="wb-chapters">{manifest.chapters.map(item => {
        const visitedCount = visited.filter(p => p >= item.firstPage && p <= item.lastPage).length;
        return <button key={item.number} className={`wb-chapter ${chapter.number === item.number ? "wb-chapter-active" : ""}`} onClick={() => go(item.firstPage)} aria-current={chapter.number === item.number ? "page" : undefined}>
          <span className="wb-chapter-number">{String(item.number).padStart(2, "0")}</span><span className="wb-chapter-label">{item.title}<small>Seiten {item.firstPage}–{item.lastPage}</small></span>
          {visitedCount === 14 && <CircleCheck size={15} />}
        </button>;
      })}</nav>
      <div className="wb-sidebar-bottom"><span className="wb-local-dot" /> Personal study space<p>{study.account?.local ? "Local preview on this computer." : `Signed in · ${study.account?.email || "your account"}`}<br />AI feedback is sent only when requested.</p><div className="wb-backup"><button onClick={exportBackup}><Download size={14} /> Export answers</button><label><Upload size={14} /> Import<input className="wb-sr" type="file" disabled={!!study.conflict} accept="application/json,.json" onChange={event => { if (event.target.files?.[0]) void importBackup(event.target.files[0]); event.target.value = ""; }} /></label></div></div>
    </aside>

    <div className="wb-main">
      <header className="wb-topbar"><div><button className="wb-icon-button wb-mobile-menu" aria-label="Open chapter menu" onClick={() => setDrawer(true)}><Menu size={20} /></button><span className="wb-breadcrumb">Mein Lernraum <ChevronRight size={13} /> Arbeitsbuch B2</span></div><span className="wb-save-status" role="status"><span className="wb-local-dot" />{storageMessage}</span></header>
      <div className="wb-workspace">
        <nav className="wb-study-nav" aria-label="Study views"><button className="wb-button" aria-pressed={position.view === "book"} onClick={() => updateDraft("position", p => ({ ...p, view: "book" }))}>Book</button><label>Quick session <select aria-label="Quick session filter" value={quickFilter} onChange={e => setQuickFilter(e.target.value as WorkbookQuickFilter)}><option value="chapter">This chapter</option><option value="listening">Listening</option><option value="revision">Revision due</option></select></label><button className="wb-button" disabled={!initialised || checking} onClick={() => void startQuickSession()}>Start 5 exercises</button><button className="wb-button" aria-pressed={position.view === "progress"} onClick={() => updateDraft("position", p => ({ ...p, view: "progress" }))}>My progress</button></nav>
        {study.loadError && <p className="wb-error" role="alert">{study.loadError}</p>}
        {study.legacy && <section className="wb-import-notice"><p>Answers from the previous browser-only workbook are available. Import them into this study account? Your original backup will be kept.</p><button className="wb-button" disabled={!!study.conflict} onClick={() => { try { const saved = localStorage.getItem(STORAGE); if (saved) restoreBackup(JSON.parse(saved)); study.dismissLegacy(); } catch { setError("The old browser backup could not be read."); } }}>Import previous answers and notes</button><button className="wb-text-button" onClick={study.dismissLegacy}>Keep for later</button></section>}
        {study.conflict && <WorkbookConflictPanel conflict={study.conflict} choices={conflictChoices} onChoice={(key, choice) => setConflictChoices(current => ({ ...current, [key]: choice }))} onResolve={() => study.resolve(conflictChoices)} onExport={() => { const d = study.conflict!.local; setBackupText(JSON.stringify({ version: 1, answers: d.answers, page: d.position.page, visited: d.visited, notes: d.notes }, null, 2)); setBackupMessage("Unsent answers from this device before resolving the conflict."); backupDialog.current?.showModal(); }} />}
        {!!study.recoveries.length && <details className="wb-import-notice"><summary>Device recovery copies · {study.recoveries.length}</summary><p>These keep your earlier unsent answers when you resolve changes from another device. Viewing a copy does not replace your current answers.</p>{study.recoveries.map(record => <div className="wb-button-row" key={record.id}><span>{new Date(record.at).toLocaleString()}</span><button className="wb-button" onClick={() => { const d = record.draft; setBackupText(JSON.stringify({ version: 1, answers: d.answers, page: d.position.page, visited: d.visited, notes: d.notes }, null, 2)); setBackupMessage(record.reason); backupDialog.current?.showModal(); }}>View / export recovery</button><button className="wb-text-button" onClick={() => study.removeRecovery(record.id)}>Remove this recovery copy</button></div>)}</details>}
        {position.view === "progress" ? <section className="wb-dashboard"><h1>My learning progress</h1><p>{study.state.reviews.filter(r => r.due && Date.parse(r.due) <= Date.now()).length} exercises due for revision</p><div className="wb-chapter-stats">{manifest.chapters.map(ch => { const stats = workbookChapterStats(study.state, ch.number, ch.totalFields); return <article key={ch.number}><h2>{ch.number}. {ch.title}</h2><p>{stats.attempts ? stats.needsPractice ? "Needs practice" : "Chapter submitted" : "In progress"} · {stats.answered}/{stats.totalFields} fields answered</p><dl><dt>First</dt><dd>{stats.first === null ? "—" : `${stats.first}%`}</dd><dt>Latest</dt><dd>{stats.latest === null ? "—" : `${stats.latest}%`}</dd><dt>Best</dt><dd>{stats.best === null ? "—" : `${stats.best}%`}</dd><dt>Best unassisted</dt><dd>{stats.bestUnassisted === null ? "—" : `${stats.bestUnassisted}%`}</dd></dl><button className="wb-button" onClick={() => go(ch.firstPage)}>Open chapter</button></article>; })}</div>{study.account && !study.account.local && <WorkbookRecordingHistory account={study.account.id} />}<h2>Saved Gemini feedback</h2>{[...(study.state.feedback || [])].reverse().map(f => <details key={f.id}><summary>Page {f.page} · Exercise {f.exercise} · {new Date(f.at).toLocaleString()}</summary><p>{f.feedback.summary}</p>{f.feedback.improvedAnswer && <p lang="de">{f.feedback.improvedAnswer}</p>}{f.feedback.transcript && <p lang="de">{f.feedback.transcript}</p>}{f.feedback.corrections.map((c, i) => <p key={i}>{c.original} → {c.corrected}: {c.explanation}</p>)}</details>)}<h2>Attempt history</h2>{[...study.state.attempts].reverse().map(a => <details key={a.id}><summary>Chapter {a.chapter} · {a.kind === "chapter" ? "Chapter attempt" : a.kind === "archive" ? "Saved before fresh start" : "Practice"} · {a.result.correct}/{a.result.scored} · {a.assisted ? "Assisted" : "Unassisted"} · {new Date(a.at).toLocaleString()}</summary><p>{a.result.unanswered} unanswered · {a.result.review} open-review fields</p>{Object.entries(a.answers).map(([k, v]) => <p key={k}><strong>{k}</strong>: {v}</p>)}</details>)}</section> : <>

        <div className="wb-title-row"><div className="wb-title-text"><p className="wb-eyebrow">KAPITEL {String(chapter.number).padStart(2, "0")} <span>·</span> ASPEKTE NEU B2</p><h1>{chapter.title}</h1><p className="wb-subtitle">Lesen. Ausprobieren. Verstehen.</p></div><div className="wb-title-actions"><button className="wb-button" disabled={checking || !initialised} onClick={() => void retryChapter()}>Retry chapter freshly</button><button className="wb-button wb-chapter-check" onClick={() => void check(true)} disabled={checking || !loaded}><CheckCheck size={17} /> Finish & check chapter</button></div></div>
        <div className="wb-pagebar"><div className="wb-page-steps">{Array.from({ length: 14 }, (_, i) => chapter.firstPage + i).map(n => <button key={n} className={`${n === pageNumber ? "wb-page-current" : ""} ${visited.includes(n) ? "wb-page-visited" : ""}`} onClick={() => go(n)} aria-label={`Go to page ${n}`} aria-current={n === pageNumber ? "page" : undefined}>{n}</button>)}</div><button className="wb-text-button" onClick={() => openReference(147)}>Reference pages <ArrowUpRight size={14} /></button></div>
        {error && <div className="wb-error" role="alert"><CircleAlert size={17} /><span>{error}</span>{!loaded && <button onClick={() => setRetry(n => n + 1)}>Retry</button>}</div>}
        <div className="wb-digital-book">
          <div className="wb-book-toolbar"><span><BookOpen size={15} /> ASPEKTE NEU · ARBEITSBUCH</span><button className="wb-text-button" onClick={() => void openReference(pageNumber + 1)}><ZoomIn size={15} /> Original reference</button></div>
          <section className="wb-answer-pane wb-native-page" aria-label="Interactive workbook page" lang="de">
            <div className="wb-answer-heading"><div><p className="wb-eyebrow">SEITE {pageNumber}</p><h2>{page?.section || "Deine Übungen"}</h2></div><span className="wb-count">{filled}/{fields.length} answered</span></div>
            <div className="wb-answer-progress"><span style={{ width: `${fields.length ? filled / fields.length * 100 : visited.includes(pageNumber) ? 100 : 0}%` }} /></div>
            {!page && !error && <p className="wb-loading"><LoaderCircle className="wb-spin" size={18} /> Loading exercises…</p>}
            {page?.ready && !page.nativeReady && <p className="wb-conversion-note">Some passages and illustrations on this page are still being added. Use “Original reference” where needed.</p>}
            {page && !page.ready && <div className="wb-empty"><BookOpen size={30} /><h3>Interactive fields are being prepared</h3><p>You can read the original page and save notes now. Exercise checking becomes available after the source transcription is verified.</p><button className="wb-button" onClick={() => { setChapters(current => { const next = { ...current }; delete next[chapter.number]; return next; }); setRetry(n => n + 1); }}><RotateCcw size={15} /> Refresh exercises</button></div>}
            {page?.ready && page.exercises.length === 0 && !page.content?.length && <div className="wb-empty"><BookOpen size={30} /><h3>{page.kind === "vocabulary" ? "Wortschatz zum Mitnehmen" : "Lesen und weiterarbeiten"}</h3><p>{page.kind === "vocabulary" ? "Review the words on this page. Save any useful examples in your notes." : "This page contains reading material for the neighbouring exercises. Use the original page and your notes, then continue to the questions."}</p></div>}
            {page?.content?.map((block, index) => <div key={index}><WorkbookMarkers markers={(page.markers || []).filter(m => m.beforeBlock === index)} activeTrack={track} playing={playing} onTrack={playTrack} onReference={openReference} onExam={setResource} /><BookBlock block={block} field={() => null} /></div>)}
            {position.view === "quick" && page?.exercises.find(e => `${pageNumber}:${e.id}` === position.exercise)?.contextPages?.map(n => <section key={n} aria-label={`Source passage from page ${n}`}>{pages?.find(p => p.bookPage === n)?.content?.map((block, i) => <BookBlock key={i} block={block} field={() => null} />)}</section>)}
            {position.view === "quick" && page?.exercises.find(e => `${pageNumber}:${e.id}` === position.exercise)?.contextExercises?.map(key => {
              const [n, id] = key.split(":"); const source = pages?.find(p => p.bookPage === Number(n))?.exercises.find(e => e.id === id);
              const contextFields = source?.fields.filter(f => !source.content?.length || !source.wordBank.length && f.options.length > 0) || [];
              return source ? <details key={key} open className="wb-session-context"><summary>Source for this exercise · page {n}, exercise {id}</summary><WorkbookMarkers markers={source.markers || []} activeTrack={track} playing={playing} onTrack={playTrack} onReference={openReference} onExam={setResource} /><p>{source.instruction}</p>{source.requiresSource && <p className="wb-source-dependency">This source task refers to the separate Lehrbuch, which has not been supplied.</p>}{!!source.wordBank.length && <p>{source.wordBankLabels ? source.wordBank.map(w => source.wordBankLabels?.[w] || w).join(" · ") : source.wordBank.join(" · ")}</p>}{source.content?.map((block, i) => <BookBlock key={i} block={block} field={ref => { const [f, part] = ref.split("#"); const field = source.fields.find(x => x.id === f); const answer = answers[`${n}:${id}:${f}`] || ""; return <span className="wb-context-answer">{part ? workbookAnswerParts(answer, field?.segments || 2)[Number(part) - 1] || "…" : answer.replace(/\u001f/g, " ") || "…"}</span>; }} />)}{!!contextFields.length && <ul>{contextFields.map(f => <li key={f.id}>{f.label}{!!f.options.length && <span> — {f.options.map(option => f.optionLabels?.[option] || option).join(" · ")}</span>} {answers[`${n}:${id}:${f.id}`]?.replace(/\u001f/g, " ") || ""}</li>)}</ul>}</details> : null;
            })}
            {position.view === "quick" && <WorkbookMarkers markers={(page?.exercises.find(e => `${pageNumber}:${e.id}` === position.exercise)?.relatedTracks || []).map(track => ({ type: "audio", label: String(track), track, position: "heading" }))} activeTrack={track} playing={playing} onTrack={playTrack} onReference={openReference} onExam={setResource} />}
            <fieldset disabled={!initialised || checking || !!study.conflict} className="wb-exercises">{page?.exercises.filter(e => position.view !== "quick" || `${pageNumber}:${e.id}` === position.exercise).map(exercise => <ExerciseCard key={`${study.state.draft.exerciseRuns?.[`${pageNumber}:${exercise.id}`] || study.state.draft.runs[String(chapter.number)] || "initial"}:${pageNumber}:${exercise.id}`} exercise={exercise} page={pageNumber} answers={answers} results={results} onAnswer={answer} bank={bank} setBank={setBank} feedbackAvailable={manifest.feedbackAvailable} activeTrack={track} playing={playing} onTrack={playTrack} onReference={openReference} onExam={setResource} onQueue={queueExercise} onRetryExercise={retryExercise} savedFeedback={[...(study.state.feedback || [])].reverse().find(f => f.page === pageNumber && f.exercise === exercise.id && f.run === (study.state.draft.exerciseRuns?.[`${pageNumber}:${exercise.id}`] || study.state.draft.runs[String(chapter.number)] || "initial"))} onFeedbackSaved={() => { void study.refresh().catch(e => setError(e.message)); }} queued={study.state.reviews.some(r => r.key === `${pageNumber}:${exercise.id}` && r.due !== null)} onFocusExercise={(exercise) => { if (position.view === "book" && position.exercise !== exercise) updateDraft("position", p => ({ ...p, exercise })); }} recordingScope={`${study.account?.id || "loading"}:${study.state.draft.exerciseRuns?.[`${pageNumber}:${exercise.id}`] || study.state.draft.runs[String(chapter.number)] || "initial"}`} cloudRecordings={!!study.account && !study.account.local} />)}</fieldset>
            {!!page?.warnings.length && <details className="wb-source-notes"><summary>Source notes</summary><ul>{page.warnings.map((warning, i) => <li key={i}>{warning}</li>)}</ul></details>}
            {page?.ready && <div className="wb-check-area"><button className="wb-primary-button" disabled={checking || !initialised || !fields.length} onClick={() => void check(false)}>{checking ? <LoaderCircle size={17} className="wb-spin" /> : <Check size={18} />} {position.view === "quick" ? "Check this exercise" : "Check this page"}</button><button className="wb-button" onClick={markRead}>{visited.includes(pageNumber) ? <CircleCheck size={16} /> : <Check size={16} />}{visited.includes(pageNumber) ? "Page reviewed" : "Mark page reviewed"}</button><small>Fixed answers use the book’s key. Open responses use guided or Gemini review.</small></div>}
            <details className="wb-notes"><summary>My notes for this page</summary><textarea disabled={!!study.conflict || !initialised} aria-label={`Notes for page ${pageNumber}`} placeholder="New words, useful phrases, questions…" value={notes[String(pageNumber)] || ""} maxLength={10000} onChange={event => setNotes(current => ({ ...current, [String(pageNumber)]: event.target.value }))} /></details>
            <div className="wb-printed-folio">{pageNumber}</div>
          </section>
        </div>
        {position.view === "quick" && <nav className="wb-quick-nav"><button className="wb-button" disabled={(position.session || []).indexOf(position.exercise || "") <= 0} onClick={() => quickMove(-1)}>Previous exercise</button><span>{(position.session || []).indexOf(position.exercise || "") + 1}/{position.session?.length || 0}</span><button className="wb-button" disabled={(position.session || []).indexOf(position.exercise || "") >= (position.session?.length || 0) - 1} onClick={() => quickMove(1)}>Next exercise</button><button className="wb-button" disabled={checking} onClick={() => void finishQuickSession()}>Finish & check session</button></nav>}
        <footer className="wb-bottom-nav"><button className="wb-button" onClick={() => go(pageNumber - 1)} disabled={pageNumber === 6}><ChevronLeft size={17} /> Previous page</button><span>Seite <strong>{pageNumber}</strong> von 145</span><button className="wb-button" onClick={() => go(pageNumber + 1)} disabled={pageNumber === 145}>Next page <ChevronRight size={17} /></button></footer>
        <div className="wb-book-check"><button className="wb-button" disabled={checking || !initialised} onClick={() => void check("book")}><CheckCheck size={17} /> Check whole book</button></div>
        <details className="wb-library"><summary><Headphones size={15} /> Audio library · {manifest.tracks.filter(t => t.available).length}/51 tracks imported</summary><div className="wb-track-grid">{manifest.tracks.map(t => <button className="wb-button" key={t.number} disabled={!t.available} aria-pressed={track === t.number && playing} onClick={() => playTrack(t.number)}>Track {t.number} · {minutes(t.seconds)} {track === t.number && playing ? "Ⅱ" : "▶"}</button>)}</div></details>
        <details className="wb-symbol-help"><summary>Symbols and mobile access</summary><p>On your phone or tablet, use your browser’s Share or menu options and choose “Add to Home Screen” or “Install app”, when offered. Studying requires an internet connection.</p><p>Tap the numbered speaker to play or pause that CD track. Playback controls appear at the bottom while you listen. Close pauses the recording; tap its speaker to resume. The key opens the appendix solution. P identifies an additional exam worksheet; its letters identify the printed exam reference.</p><WorkbookMarkers markers={[{type:"audio",label:"2",position:"heading",track:2},{type:"solution",label:"",position:"heading",referencePage:147},{type:"exam",label:"GI",position:"heading"}]} activeTrack={track} playing={playing} onTrack={playTrack} onReference={openReference} onExam={setResource} />{assisted.includes(chapter.number) && <p>Solutions viewed for this chapter · assisted practice.</p>}</details>
        {resource && <section className="wb-resource-panel" role="region" aria-label="Additional exam worksheet"><strong>Exam worksheet · {resource}</strong><p>The book refers to additional publisher material for this exam. This supplementary worksheet has not been supplied with your PDF or CD.</p><button className="wb-button" onClick={() => setResource("")}>Close worksheet information</button></section>}
        </>}
        {(totalReady < 140 || nativeReady < 140) && <p className="wb-preparation">Book recreation: {nativeReady}/140 pages · Answer fields: {totalReady}/140 pages. The full book is still being converted.</p>}
      </div>
    </div>

    <WorkbookAudio ref={audio} tracks={manifest.tracks} initialTrack={position.track} initialSeconds={position.seconds} onPosition={(number, seconds) => { if (Math.abs(seconds - position.seconds) >= 5 || number !== position.track) updateDraft("position", p => ({ ...p, track: number, seconds })); }} onState={(number, active) => { setTrack(number); setPlaying(active); }} />

    <dialog className="wb-backup-dialog" ref={backupDialog}>
      <div className="wb-dialog-header"><strong>Your answer backup</strong><button type="button" className="wb-icon-button" aria-label="Close backup" onClick={() => backupDialog.current?.close()}><X size={20} /></button></div>
      <div className="wb-backup-content"><p>Download the JSON file, or copy the text below into a safe place. You can also paste a previous backup here and restore it.</p><p>Answers and notes are included. Recordings and attempt history are not included in this text backup.</p><textarea aria-label="Backup data" value={backupText} maxLength={3000000} onChange={event => setBackupText(event.target.value)} spellCheck={false} /><div className="wb-button-row"><button className="wb-primary-button" onClick={downloadBackup}><Download size={16} /> Download JSON</button><button className="wb-button" disabled={!!study.conflict} onClick={() => { try { restoreBackup(JSON.parse(backupText)); setBackupMessage("Backup restored. Your answers will sync when saving completes."); } catch { setBackupMessage("Invalid backup. Your current answers were preserved."); } }}><Upload size={16} /> Restore from text</button></div>{backupMessage && <p role="status">{backupMessage}</p>}</div>
    </dialog>

    <dialog className="wb-reference-dialog" ref={dialog} onCancel={() => setReference(0)} onClose={() => setReference(0)}><div className="wb-dialog-header"><label>Original book<select aria-label="Reference page" value={reference || 1} onChange={event => openReference(Number(event.target.value))}>{Array.from({ length: manifest.pdfPages }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n === 1 ? "Cover" : `Printed page ${n - 1}`}{n >= 147 && n <= 158 ? " · Answer key" : n >= 159 && n <= 173 ? " · Transcript" : ""}</option>)}</select></label><div className="wb-button-row"><button className="wb-icon-button" aria-label="Previous reference page" disabled={reference <= 1} onClick={() => void openReference(reference - 1)}><ChevronLeft size={18} /></button><button className="wb-icon-button" aria-label="Next reference page" disabled={reference >= 185} onClick={() => void openReference(reference + 1)}><ChevronRight size={18} /></button><button className="wb-icon-button" aria-label="Close original page" onClick={() => setReference(0)}><X size={20} /></button></div></div>{reference > 0 && <img src={`${API}/assets/page/${reference}`} alt={`Original PDF page ${reference}`} />}</dialog>
    <dialog className="wb-summary-dialog" ref={summaryDialog} onClose={() => setSummary(null)}><button className="wb-dialog-close wb-icon-button" aria-label="Close results" onClick={() => summaryDialog.current?.close()}><X size={20} /></button><span className="wb-summary-icon"><CheckCheck size={30} /></span><p className="wb-eyebrow">DEIN LERNSTAND</p><h2>Keep going. You’re learning.</h2>{summary && <><div className="wb-score"><strong>{summary.result.correct}</strong><span>/ {summary.result.scored}</span></div><p>fixed-answer items correct</p><div className="wb-summary-metrics"><span><strong>{summary.result.unanswered}</strong> unanswered</span><span><strong>{summary.result.review}</strong> for open review</span></div>{!summary.complete && <p className="wb-error">Some chapter pages are still being prepared. This result covers the available fields only.</p>}<p className="wb-summary-note">Corrections and answer-key examples are shown beside your answers. Open writing and speaking are reviewed separately.</p></>}<button className="wb-primary-button" onClick={() => summaryDialog.current?.close()}>Review my answers <ChevronRight size={17} /></button></dialog>
  </div>;
}

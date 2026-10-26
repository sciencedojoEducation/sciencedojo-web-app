"use client";
/* eslint-disable @next/next/no-img-element -- Private scanned source crops retain their original layout. */
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { BookOpen, ChevronLeft, ChevronRight, Check, Download, Upload, Menu, X, RotateCcw, ZoomIn, ArrowLeft, Layers, Bookmark, FileText } from "lucide-react";
import { parseTrainerState, trainerAnswerKey, trainerTaskKey, TRAINER_STORAGE, type TrainerManifest, type TrainerPage, type TrainerWord } from "@/lib/intensivtrainer";
import "./workbook.css";
import styles from "./IntensivtrainerBook.module.css";
import NativeWorkbookExercise from "./NativeWorkbookExercise";
import useTrainerAccount from "./useTrainerAccount";
const API = "/api/workbook/aspekte-neu-b2-intensivtrainer";
const imageUrl = (asset: string) => `${API}/assets/${asset}`;

export default function IntensivtrainerBook({ manifest }: { manifest: TrainerManifest }) {
  const study = useTrainerAccount();
  const { state, setState, loaded, canSave, message: saveStatus } = study;
  const remote = study.conflict?.remote.state || null;
  const [bank, setBank] = useState<{ key: string; token: string } | null>(null);
  const [pages, setPages] = useState<Record<number, TrainerPage>>({});
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [drawer, setDrawer] = useState(false);
  const [view, setView] = useState<"book" | "review" | "cards">("book");
  const [zoom, setZoom] = useState<{ asset: string; label: string } | null>(null);
  const [backup, setBackup] = useState(false);
  const [backupText, setBackupText] = useState("");
  const [backupMessage, setBackupMessage] = useState("");
  const [cardIndex, setCardIndex] = useState(0);
  const [target, setTarget] = useState<string | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [cardFilter, setCardFilter] = useState<"all" | "again">("all");
  const zoomDialog = useRef<HTMLDialogElement>(null);
  const backupDialog = useRef<HTMLDialogElement>(null);
  const drawerDialog = useRef<HTMLDialogElement>(null);
  const taskRefs = useRef<Record<string, HTMLElement | null>>({});
  const chapter = manifest.chapters.find(c => state.page >= c.firstPage && state.page <= c.lastPage)!;
  const page = pages[state.page];
  const pending = Object.entries(state.review).filter(([, value]) => value === "again").map(([key]) => key);
  const done = Object.entries(state.review).filter(([key, value]) => value === "done" && !key.includes(":word-")).length;
  const currentWords = Object.values(pages).filter(p => p.number >= chapter.firstPage && p.number <= chapter.lastPage).flatMap(p => p.words.map(word => ({ ...word, page: p.number })));
  const cards = cardFilter === "again" ? currentWords.filter(word => state.review[trainerTaskKey(word.page, `word-${word.id}`)] === "again") : currentWords;
  const card = cards[cardIndex % Math.max(1, cards.length)];

  useEffect(() => {
    if (!loaded || pages[state.page]) return;
    const abort = new AbortController(); setError("");
    fetch(`${API}?page=${state.page}`, { signal: abort.signal, cache: "no-store" }).then(async response => {
      if (!response.ok) throw new Error();
      const body = await response.json();
      setPages(previous => ({ ...previous, [body.page.number]: body.page }));
    }).catch(e => { if (e.name !== "AbortError") setError("Diese Seite konnte nicht geladen werden. Deine Antworten bleiben erhalten."); });
    return () => abort.abort();
  }, [state.page, loaded, pages, retry]);

  useEffect(() => {
    if (view !== "cards") return;
    const number = chapter.lastPage - 1;
    if (pages[number]) return;
    const controller = new AbortController();
    fetch(`${API}?page=${number}`, { signal: controller.signal, cache: "no-store" }).then(async response => {
      if (!response.ok) throw new Error();
      const body = await response.json(); setPages(previous => ({ ...previous, [number]: body.page }));
    }).catch(e => { if (e.name !== "AbortError") setError("Die Wortkarten konnten nicht geladen werden."); });
    return () => controller.abort();
  }, [view, chapter.lastPage, pages, retry]);

  useEffect(() => { if (zoom) zoomDialog.current?.showModal(); else zoomDialog.current?.close(); }, [zoom]);
  useEffect(() => { if (backup) backupDialog.current?.showModal(); else backupDialog.current?.close(); }, [backup]);
  useEffect(() => { if (drawer) drawerDialog.current?.showModal(); else drawerDialog.current?.close(); }, [drawer]);

  useEffect(() => {
    if (!target) return;
    if (view === "book" && page) {
      const node = taskRefs.current[target];
      if (node) { node.scrollIntoView({ block: "start" }); setTarget(null); }
    } else if (view === "cards" && cards.length) {
      const index = cards.findIndex(word => trainerTaskKey(word.page, `word-${word.id}`) === target);
      if (index >= 0) { setCardIndex(index); setFlipped(false); setTarget(null); }
    }
  }, [target, view, page, cards]);

  function go(number: number, nextView: typeof view = "book") {
    if (number < 4 || number > 83) return;
    setState(previous => ({ ...previous, page: number })); setView(nextView); setDrawer(false); setError(""); setCardIndex(0); setFlipped(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function answer(key: string, value: string) {
    const taskKey = key.slice(0, key.lastIndexOf(":"));
    setState(previous => { const review = { ...previous.review }; if (review[taskKey] === "done") delete review[taskKey]; return { ...previous, answers: { ...previous.answers, [key]: value.slice(0, 20000) }, review }; });
  }
  function mark(key: string, status: "again" | "done") {
    setState(previous => { const review = { ...previous.review }; if (review[key] === status) delete review[key]; else review[key] = status; return { ...previous, review }; });
  }
  function backupValue() { return JSON.stringify({ ...state, savedAt: new Date().toISOString() }, null, 2); }
  function openBackup() { setBackupText(backupValue()); setBackupMessage(""); setBackup(true); }
  function download(contents: string, name: string, type: string) {
    const url = URL.createObjectURL(new Blob([contents], { type }));
    const a = document.createElement("a"); a.href = url; a.download = name; a.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function restore(text: string) {
    try {
      if (text.length > 5_000_000) throw new Error("Die Sicherung ist zu groß.");
      const restored = parseTrainerState(JSON.parse(text));
      // A separate recovery slot preserves current work before replacement.
      try { localStorage.setItem(`${TRAINER_STORAGE}:${study.account?.id}:before-import`, backupValue()); } catch { throw new Error("Die aktuelle Arbeit konnte nicht gesichert werden. Bitte zuerst exportieren."); }
      setState(restored); setView("book"); setBackupMessage("Sicherung wiederhergestellt. Die vorherige Arbeit ist als Text unten verfügbar."); setBackupText(backupValue());
    } catch (e) { setBackupMessage(e instanceof Error ? e.message : "Ungültige Sicherung. Deine Arbeit wurde nicht verändert."); }
  }
  function exportText() {
    const lines = [manifest.title, "Persönliche Antworten · keine Musterlösungen", ""];
    for (const [key, value] of Object.entries(state.answers)) if (value.trim()) lines.push(`${key}\n${value}\n`);
    for (const [key, value] of Object.entries(state.notes)) if (value.trim()) lines.push(`Notizen · Seite ${key}\n${value}\n`);
    download(lines.join("\n"), "intensivtrainer-meine-antworten.txt", "text/plain;charset=utf-8");
  }
  const nav = <>
    <Link className="wb-brand" href="/workbooks/aspekte-neu-b2">sciencedojo<span>.</span></Link>
    <div className="wb-book-label"><span className="wb-book-icon"><BookOpen size={24} /></span><div><strong>Aspekte neu B2</strong><span>INTENSIVTRAINER</span></div></div>
    <div className={styles.railProgress}><span>{done} / {manifest.exerciseCount} selbst geprüft</span><progress value={done} max={manifest.exerciseCount} aria-label="Selbst geprüfte Übungen" /></div>
    <p className="wb-rail-eyebrow">DEINE KAPITEL</p>
    <nav className="wb-chapters" aria-label="Kapitel">{manifest.chapters.map(c => <button type="button" className={`wb-chapter ${c.number === chapter.number ? "wb-chapter-active" : ""}`} key={c.number} onClick={() => go(c.firstPage)} aria-current={c.number === chapter.number ? "true" : undefined}><span className="wb-chapter-number">{String(c.number).padStart(2, "0")}</span><span className="wb-chapter-label">{c.title}<small>Seiten {c.firstPage}–{c.lastPage}</small></span></button>)}</nav>
    <div className="wb-sidebar-bottom"><button className="wb-button" onClick={openBackup}><Download size={15} /> Sicherung & Export</button><p>Dein privates Übungsbuch.<br />Antworten speichern in deinem Konto.</p><Link href="/workbooks/aspekte-neu-b2" className={styles.oldBook}><ArrowLeft size={13} /> Zum Arbeitsbuch</Link></div>
  </>;
  const reviewButtons = (key: string) => <div className={styles.reviewActions}><button className="wb-button" aria-pressed={state.review[key] === "again"} onClick={() => mark(key, "again")}><Bookmark size={14} /> Noch üben</button><button className="wb-button" aria-pressed={state.review[key] === "done"} onClick={() => mark(key, "done")}><Check size={14} /> Selbst geprüft</button></div>;
  const sourceButton = (asset: string, label: string, children: ReactNode) => <button type="button" className={styles.sourceButton} onClick={() => setZoom({ asset, label })} aria-label={`${label} vergrößern`}>{children}<span><ZoomIn size={14} /> Vergrößern</span></button>;

  return <div className={`wb-app ${styles.app}`} lang="de">
    <a className={styles.skip} href="#trainer-content">Zum Buchinhalt</a>
    <aside className={`wb-sidebar ${styles.sidebar}`}>{nav}</aside>
    <dialog ref={drawerDialog} className={styles.drawer} onCancel={() => setDrawer(false)} onClose={() => setDrawer(false)}><button className={styles.drawerClose} onClick={() => setDrawer(false)} aria-label="Kapitelmenü schließen"><X size={22} /></button>{nav}</dialog>
    <main className="wb-main" id="trainer-content">
      <header className="wb-topbar"><div className="wb-breadcrumb"><button className={`wb-icon-button ${styles.mobileMenu}`} aria-label="Kapitelmenü öffnen" onClick={() => setDrawer(true)}><Menu size={22} /></button><span>Mein Lernraum</span><ChevronRight size={12} /><strong>Intensivtrainer B2</strong></div><span className="wb-save-status" role="status">{saveStatus}</span></header>
      <div className={`wb-workspace ${styles.workspace}`}>
        <div className="wb-title-row"><div className="wb-title-text"><p className="wb-eyebrow">ASPEKTE NEU <span>·</span> KAPITEL {chapter.number}</p><h1>{chapter.title}</h1><p className="wb-subtitle">Dein interaktives Übungsbuch. In deinem Tempo.</p></div><button className="wb-button" onClick={openBackup}><Download size={15} /> Sichern</button></div>
        <div className={styles.tabs} role="group" aria-label="Lernansicht"><button aria-pressed={view === "book"} onClick={() => setView("book")}><BookOpen size={16} /> Buch</button><button aria-pressed={view === "cards"} onClick={() => { setView("cards"); setCardIndex(0); setFlipped(false); }}><Layers size={16} /> Wortkarten</button><button aria-pressed={view === "review"} onClick={() => setView("review")}><RotateCcw size={16} /> Wiederholen <span>{pending.length}</span></button></div>
        {remote && <section className={styles.notice} aria-label="Speicherkonflikt"><p>Ein anderes Gerät hat dieselben Felder geändert. Exportiere deine aktuelle Arbeit, bevor du auswählst. Unabhängige Änderungen werden zusammengeführt.</p><button className="wb-button" onClick={openBackup}>Aktuelle Arbeit exportieren</button><button className="wb-button" onClick={() => study.resolve("remote")}>Andere Änderungen verwenden</button><button className="wb-button" onClick={() => study.resolve("local")}>Meine Änderungen verwenden</button></section>}
        <details className={styles.sourceNotice}><summary>Über diesen Scan und deine Fortschritte</summary><p>{manifest.sourceNotice}</p><p>„Selbst geprüft“ ist deine eigene Einschätzung und keine automatische Note. Originalaufgaben und Abbildungen stammen aus deinem PDF. Die digitalisierten Texte können Erkennungsfehler enthalten; vergleiche bei Unklarheiten die Originalseite. Kein Audio wurde mitgeliefert.</p><p>Deine Antworten speichern privat in deinem ScienceDojo-Konto. Bei Verbindungsproblemen bleibt eine Sicherung auf diesem Gerät.</p></details>
        {error && <div className={styles.notice} role="alert">{error} <button className="wb-button" onClick={() => setRetry(n => n + 1)}>Erneut laden</button></div>}
        {!loaded ? <p className={styles.loading}>Dein Buch wird geöffnet …</p> : view === "review" ? <section className={styles.review}><h2>Deine Wiederholungsliste</h2><p>Hier steht, was du mit „Noch üben“ markiert hast. Ohne automatische Benotung oder Fälligkeiten.</p>{!pending.length && <div className={styles.empty}><Bookmark size={30} /><h3>Platz für den nächsten Lernschritt</h3><p>Markiere eine Übung oder Wortkarte mit „Noch üben“.</p><button className="wb-primary-button" onClick={() => setView("book")}>Zurück zum Buch</button></div>}{pending.map(key => { const [number, id] = key.split(":"); const word = id.startsWith("word-"); return <article className={styles.reviewItem} key={key}><div><small>SEITE {number} · {word ? "WORTKARTE" : `ÜBUNG ${id}`}</small><p>{word ? pages[Number(number)]?.words.find(w => `word-${w.id}` === id)?.text || "Wortschatz wiederholen" : pages[Number(number)]?.exercises.find(e => e.id === id)?.title || "Zur Originalaufgabe und deinen Antworten"}</p></div><button className="wb-button" onClick={() => { setTarget(key); setCardFilter("all"); go(Number(number), word ? "cards" : "book"); }}>Öffnen <ChevronRight size={15} /></button>{reviewButtons(key)}</article>; })}</section> : view === "cards" ? <section className={styles.cards}><div className={styles.cardHeading}><div><p className="wb-eyebrow">WORTSCHATZ-HITPARADE · KAPITEL {chapter.number}</p><h2>Aus Wörtern wird Wissen.</h2><p>Trage zuerst deine Bedeutung im Buch ein. Drehe die Karte, um dich selbst zu prüfen.</p></div><label>Karten<select value={cardFilter} onChange={event => { setCardFilter(event.target.value as typeof cardFilter); setCardIndex(0); setFlipped(false); }}><option value="all">Alle Wörter</option><option value="again">Noch üben</option></select></label></div>{card ? <><p className={styles.cardCounter}>{cardIndex % cards.length + 1} / {cards.length} · {card.category}</p><button className={styles.flashcard} onClick={() => setFlipped(value => !value)} aria-label={flipped ? "Deutsches Wort anzeigen" : "Eigene Bedeutung anzeigen"}><span>{flipped ? "DEINE BEDEUTUNG" : "DEUTSCH"}</span><strong>{flipped ? state.answers[trainerAnswerKey(card.page, `word-${card.id}`, "meaning")] || "Noch keine Bedeutung eingetragen" : card.text}</strong><small>Tippen oder Enter zum Umdrehen</small></button><label className={styles.meaning}>Deine Bedeutung oder ein Beispielsatz<textarea maxLength={20000} value={state.answers[trainerAnswerKey(card.page, `word-${card.id}`, "meaning")] || ""} onChange={event => answer(trainerAnswerKey(card.page, `word-${card.id}`, "meaning"), event.target.value)} rows={2} /></label>{reviewButtons(trainerTaskKey(card.page, `word-${card.id}`))}<div className={styles.cardNav}><button className="wb-button" disabled={cardIndex === 0} onClick={() => { setCardIndex(i => i - 1); setFlipped(false); }}><ChevronLeft size={16} /> Zurück</button><button className="wb-primary-button" onClick={() => { setCardIndex(i => i + 1); setFlipped(false); }}>Nächste Karte <ChevronRight size={16} /></button></div><button className="wb-text-button" onClick={() => go(card.page)}>Wortliste im Buch ansehen</button></> : <p className={styles.empty}>{pages[chapter.lastPage - 1] ? "Keine passenden Wortkarten in diesem Kapitel." : "Wortkarten werden geladen …"}</p>}</section> : <>
          <div className={styles.pagebar}><div className="wb-page-steps" aria-label="Seiten in diesem Kapitel">{Array.from({ length: 8 }, (_, i) => chapter.firstPage + i).map(number => { const meta = manifest.pages.find(p => p.number === number)!; return <button key={number} className={number === state.page ? "wb-page-current" : ""} aria-current={number === state.page ? "page" : undefined} aria-label={`Seite ${number}${meta.status !== "ready" ? ", Scan unvollständig" : ""}`} onClick={() => go(number)}>{number}{meta.status !== "ready" && <span aria-hidden="true">*</span>}</button>; })}</div><label>Seite <select aria-label="Zur Seite springen" value={state.page} onChange={event => go(Number(event.target.value))}>{manifest.pages.map(p => <option key={p.number} value={p.number}>{p.number}{p.status !== "ready" ? " *" : ""}</option>)}</select></label></div>
          {!page ? !error && <p className={styles.loading}>Seite {state.page} wird geladen …</p> : <section className={styles.page} aria-label={`Seite ${page.number}`}>
            <div className={styles.paperHeader}><div><p className="wb-eyebrow">SEITE {page.number}</p><h2>{page.section}</h2></div>{page.pdfPage && <button className="wb-button" onClick={() => setZoom({ asset: `page-${String(page.pdfPage).padStart(2, "0")}`, label: `Originalseite ${page.number}` })}><FileText size={15} /> Originalseite</button>}</div>
            {page.warning && <div className={styles.notice}><strong>Unvollständige Quelle</strong><p>{page.warning} Dieser fehlende Inhalt zählt nicht zum Fortschritt.</p>{page.pdfPage && sourceButton(`page-${String(page.pdfPage).padStart(2, "0")}`, `Beschädigte Originalseite ${page.number}`, <img src={imageUrl(`page-${String(page.pdfPage).padStart(2, "0")}`)} alt={`Beschädigter Scan der Seite ${page.number}`} loading="lazy" />)}</div>}
            {page.words.length > 0 && <><div className={styles.vocabIntro}><p>Dein persönlicher Wortschatz: ergänze Bedeutungen in deiner Sprache oder eigene Beispiele. Die Einträge erscheinen auf deinen Wortkarten.</p><button className="wb-button" onClick={() => { setView("cards"); setCardIndex(0); setFlipped(false); }}><Layers size={15} /> Mit Wortkarten üben</button></div><div className={styles.wordList}>{page.words.map(word => <VocabularyEntry key={word.id} word={word} value={state.answers[trainerAnswerKey(page.number, `word-${word.id}`, "meaning")] || ""} onChange={value => answer(trainerAnswerKey(page.number, `word-${word.id}`, "meaning"), value)} />)}</div></>}
            <fieldset className={`wb-exercises wb-native-page ${styles.nativePage}`} disabled={!canSave || !!remote}>
              {(page.nativeExercises || []).map(exercise => {
                const taskKey = trainerTaskKey(page.number, exercise.id);
                return <div key={taskKey} ref={element => { taskRefs.current[taskKey] = element; }}>
                  <NativeWorkbookExercise api={API} appendWordTokens exercise={exercise} page={page.number} answers={state.answers} results={{}}
                    onAnswer={answer} bank={bank} setBank={setBank} feedbackAvailable={!!manifest.feedbackAvailable}
                    activeTrack={0} playing={false} onTrack={() => {}} onReference={() => page.pdfPage && setZoom({ asset: `page-${String(page.pdfPage).padStart(2, "0")}`, label: `Originalseite ${page.number}` })} onExam={() => {}}
                    recordingScope={`${study.account?.id || "loading"}:intensivtrainer`} cloudRecordings={false}
                    onFocusExercise={() => {}} queued={state.review[taskKey] === "again"}
                    onQueue={(number, id, reason) => setState(previous => ({ ...previous, review: { ...previous.review, [trainerTaskKey(number, id)]: reason === "self-review" ? "done" : "again" } }))}
                    savedFeedback={state.feedback?.[taskKey] ? { id: taskKey, page: page.number, exercise: exercise.id, run: "initial", at: state.feedback[taskKey].at, inputText: state.feedback[taskKey].inputText, inputDigest: "", feedback: state.feedback[taskKey].feedback } : undefined}
                    onFeedbackSaved={() => void study.refresh()}
                    onRetryExercise={(number, id) => {
                      if ((state.history?.length || 0) >= 300) { setError("Bitte exportiere zuerst deine bisherigen Versuche. Das Archiv ist voll."); return; }
                      setState(previous => {
                        const archived = Object.fromEntries(Object.entries(previous.answers).filter(([key,value]) => key.startsWith(`${number}:${id}:`) && value.trim()));
                        return { ...previous, history: Object.keys(archived).length ? [...previous.history || [], { id: crypto.randomUUID(), at: new Date().toISOString(), page: number, exercise: id, answers: archived }] : previous.history, answers: Object.fromEntries(Object.entries(previous.answers).filter(([key]) => !key.startsWith(`${number}:${id}:`))), review: Object.fromEntries(Object.entries(previous.review).filter(([key]) => key !== `${number}:${id}`)) };
                      });
                    }} />
                  {(state.history || []).some(item => item.page === page.number && item.exercise === exercise.id) && <details className={styles.attempts}><summary>Meine früheren Antworten</summary>{(state.history || []).filter(item => item.page === page.number && item.exercise === exercise.id).toReversed().map(item => <div key={item.id}><small>{new Date(item.at).toLocaleString("de-DE")}</small><pre>{Object.entries(item.answers).map(([key,value]) => `${key.split(":").at(-1)}: ${value}`).join("\n")}</pre></div>)}</details>}
                </div>;
              })}
            </fieldset>
            <label className={styles.pageNotes}>Meine Notizen · Seite {page.number}<textarea rows={3} maxLength={20000} placeholder="Eine Grammatikregel, eine Frage, ein neuer Ausdruck …" value={state.notes[String(page.number)] || ""} onChange={event => setState(previous => ({ ...previous, notes: { ...previous.notes, [String(page.number)]: event.target.value } }))} /></label>
          </section>}
          <div className={styles.pageNavigation}><button className="wb-button" disabled={state.page === 4} onClick={() => go(state.page - 1)}><ChevronLeft size={17} /> Vorherige Seite</button><span>{state.page} / 83</span><button className="wb-primary-button" disabled={state.page === 83} onClick={() => go(state.page + 1)}>Nächste Seite <ChevronRight size={17} /></button></div>
        </>}
        <footer className={styles.footer}>Aspekte neu B2 · Intensivtrainer · Persönliche Lernkopie aus deinem PDF</footer>
      </div>
    </main>
    <dialog className={styles.zoomDialog} ref={zoomDialog} onCancel={() => setZoom(null)} onClose={() => setZoom(null)}><div className={styles.dialogHeader}><strong>{zoom?.label}</strong><button className="wb-icon-button" onClick={() => setZoom(null)} aria-label="Original schließen"><X size={22} /></button></div>{zoom && <div className={styles.zoomScroll}><img src={imageUrl(zoom.asset)} alt={zoom.label} /></div>}</dialog>
    <dialog className={styles.backupDialog} ref={backupDialog} onCancel={() => setBackup(false)} onClose={() => setBackup(false)}><div className={styles.dialogHeader}><h2>Deine Arbeit mitnehmen</h2><button className="wb-icon-button" onClick={() => setBackup(false)} aria-label="Sicherung schließen"><X size={22} /></button></div><p>Antworten, eigene Bedeutungen, Notizen und Wiederholungsmarkierungen. Die Quelldatei und die Bilder sind nicht Teil der Sicherung.</p><div className={styles.backupActions}><button className="wb-primary-button" onClick={() => download(backupValue(), "intensivtrainer-sicherung.json", "application/json")}><Download size={16} /> JSON herunterladen</button><button className="wb-button" onClick={exportText}>Antworten als Text</button><label className="wb-button"><Upload size={16} /> JSON auswählen<input type="file" accept="application/json,.json" className={styles.fileInput} onChange={async event => { const file = event.target.files?.[0]; if (file) { if (file.size > 5_000_000) setBackupMessage("Die Datei ist zu groß."); else { setBackupText(await file.text()); setBackupMessage("Datei geladen. Prüfe den Text und wähle Wiederherstellen."); } } event.target.value = ""; }} /></label></div><label className={styles.meaning}>Sicherungstext · auch zum Kopieren oder Einfügen<textarea value={backupText} onChange={event => setBackupText(event.target.value)} rows={9} spellCheck={false} /></label><p>Beim Wiederherstellen wird die aktuelle Arbeit ersetzt. Sichere sie vorher; eine Gerätekopie bleibt zusätzlich unter „Vorherige Arbeit“ erhalten.</p><div className={styles.backupActions}><button className="wb-button" onClick={() => restore(backupText)}>Wiederherstellen</button><button className="wb-button" onClick={() => { setBackupText(backupValue()); setBackupMessage("Aktuelle Arbeit in den Text geladen."); }}>Aktuelle Arbeit anzeigen</button><button className="wb-button" onClick={() => { try { const previous = localStorage.getItem(`${TRAINER_STORAGE}:${study.account?.id}:before-import`); if (!previous) throw new Error(); setBackupText(previous); setBackupMessage("Vorherige Arbeit geladen. Wiederherstellen erst nach Prüfung."); } catch { setBackupMessage("Keine vorherige Importsicherung auf diesem Gerät vorhanden."); } }}>Vorherige Arbeit</button></div><p role="status">{backupMessage}</p></dialog>
  </div>;
}

function VocabularyEntry({ word, value, onChange }: { word: TrainerWord; value: string; onChange: (value: string) => void }) {
  return <label className={styles.wordEntry}><span><small>{word.category}</small><strong>{word.text}</strong></span><input maxLength={20000} value={value} onChange={event => onChange(event.target.value)} placeholder="Bedeutung / Beispielsatz" /></label>;
}

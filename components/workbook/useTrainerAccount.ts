"use client";
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { emptyTrainerState, parseTrainerState, mergeTrainerStates, TRAINER_KEY, type TrainerState } from "@/lib/intensivtrainer";
const API = `/api/workbook/${TRAINER_KEY}/study`;
type Account = { id: string; email: string; local: boolean };
type Saved = { state: TrainerState; revision: number };
type Conflict = { base: TrainerState; local: TrainerState; remote: Saved; keys: string[] };
export default function useTrainerAccount() {
  const [state, render] = useState(emptyTrainerState);
  const current = useRef(state), base = useRef<Saved>({ state, revision: 0 });
  const [account, setAccount] = useState<Account | null>(null), owner = useRef<Account | null>(null);
  const [loaded, setLoaded] = useState(false), [canSave, setCanSave] = useState(true);
  const [message, setMessage] = useState("Lade deine gespeicherte Arbeit …");
  const [conflict, setConflict] = useState<Conflict | null>(null), conflictRef = useRef<Conflict | null>(null);
  const dirty = useRef(false), running = useRef(false);
  const pendingKey = (id: string) => `${TRAINER_KEY}:pending:${id}`;
  function backup() {
    if (!owner.current) return;
    localStorage.setItem(pendingKey(owner.current.id), JSON.stringify({ base: conflictRef.current?.base || base.current.state, state: conflictRef.current?.local || current.current }));
  }
  function apply(next: TrainerState) { current.current = next; render(next); }
  function showConflict(value: Conflict) { conflictRef.current = value; setConflict(value); setMessage("Änderungen auf einem anderen Gerät benötigen deine Auswahl."); }
  const setState: Dispatch<SetStateAction<TrainerState>> = action => {
    if (!owner.current || !canSave || conflictRef.current) return;
    const next = typeof action === "function" ? action(current.current) : action;
    dirty.current = true; apply(next);
    try { backup(); } catch { setMessage("Gerätesicherung nicht verfügbar. Lass den Tab bis zum Speichern geöffnet."); }
  };
  useEffect(() => {
    const controller = new AbortController();
    fetch(API, { signal: controller.signal, cache: "no-store" }).then(async response => {
      const body = await response.json(); if (!response.ok) throw new Error(body.message || "Deine Arbeit konnte nicht geladen werden.");
      const remote = { state: parseTrainerState(body.state), revision: body.revision };
      owner.current = body.account; setAccount(body.account); base.current = remote;
      let next = remote.state;
      try {
        const stored = localStorage.getItem(pendingKey(body.account.id));
        if (stored) {
          const pending = JSON.parse(stored), local = parseTrainerState(pending.state), previous = parseTrainerState(pending.base);
          const merged = mergeTrainerStates(previous, local, remote.state);
          if (merged.conflicts.length) showConflict({ base: previous, local, remote, keys: merged.conflicts });
          else { next = merged.state; dirty.current = true; }
        }
      } catch { setMessage("Dein Konto wurde geladen. Eine alte Gerätesicherung konnte nicht gelesen werden."); }
      apply(next); setLoaded(true);
      if (!conflictRef.current) setMessage(body.account.local ? "Private lokale Vorschau" : "In deinem ScienceDojo-Konto gespeichert");
    }).catch(error => { if (error.name !== "AbortError") { setCanSave(false); setMessage(error.message); setLoaded(true); } });
    return () => controller.abort();
  }, []);
  async function flush() {
    if (!owner.current || !dirty.current || running.current || conflictRef.current) return;
    running.current = true;
    try {
      for (let i = 0; i < 4 && dirty.current; i++) {
        const snapshot = structuredClone(current.current), before = base.current;
        setMessage("Wird im Konto gespeichert …");
        const response = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accountId: owner.current.id, revision: before.revision, state: { ...snapshot, savedAt: new Date().toISOString() } }) });
        const body = await response.json();
        if (response.status === 401 || response.status === 403) { setCanSave(false); throw new Error(body.message || "Dein Konto oder Buchzugang hat sich geändert."); }
        if (response.status === 409) {
          const remote = { state: parseTrainerState(body.state), revision: body.revision };
          const merged = mergeTrainerStates(before.state, current.current, remote.state); base.current = remote;
          if (merged.conflicts.length) { showConflict({ base: before.state, local: current.current, remote, keys: merged.conflicts }); backup(); return; }
          apply(merged.state); continue;
        }
        if (!response.ok) throw new Error(body.message || "Speichern nicht möglich. Deine Gerätesicherung bleibt erhalten.");
        const unchanged = JSON.stringify(current.current) === JSON.stringify(snapshot);
        base.current = { state: body.state, revision: body.revision };
        if (unchanged) {
          dirty.current = false;
          try { localStorage.removeItem(pendingKey(owner.current.id)); } catch { /* Account save succeeded. */ }
        }
      }
      setMessage(dirty.current ? "Weitere Änderungen werden gespeichert …" : owner.current.local ? "In privater lokaler Vorschau gespeichert" : "In deinem ScienceDojo-Konto gespeichert");
    } catch (e) { setMessage(e instanceof Error ? e.message : "Speichern fehlgeschlagen. Deine Antworten bleiben auf diesem Gerät."); }
    finally { running.current = false; }
  }
  useEffect(() => {
    if (!loaded || !canSave || conflictRef.current || !dirty.current) return;
    const timer = setTimeout(() => void flush(), 600);
    return () => clearTimeout(timer);
    // Refs preserve concurrent edits while the previous save is running.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, loaded, canSave]);
  useEffect(() => {
    const close = (event: BeforeUnloadEvent) => { if (dirty.current) { try { backup(); } catch { /* Warn below. */ } event.preventDefault(); } };
    const reconnect = () => void flush();
    const focus = () => {
      if (!owner.current) return;
      fetch(`${API}?account=${encodeURIComponent(owner.current.id)}`, { cache: "no-store" }).then(async response => {
        if ([401, 403].includes(response.status)) { const data = await response.json(); setCanSave(false); setMessage(data.message || "Dein Konto hat sich geändert."); }
      }).catch(() => {});
    };
    window.addEventListener("beforeunload", close); window.addEventListener("online", reconnect); window.addEventListener("focus", focus);
    return () => { window.removeEventListener("beforeunload", close); window.removeEventListener("online", reconnect); window.removeEventListener("focus", focus); };
    // Event handlers read the current account and work through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  async function refresh() {
    if (!owner.current) return;
    const response = await fetch(`${API}?account=${encodeURIComponent(owner.current.id)}`, { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) { setMessage(body.message || "Die gespeicherte Arbeit konnte nicht aktualisiert werden."); return; }
    const remote = { state: parseTrainerState(body.state), revision: body.revision };
    const merged = mergeTrainerStates(base.current.state, current.current, remote.state);
    if (merged.conflicts.length) showConflict({ base: base.current.state, local: current.current, remote, keys: merged.conflicts });
    else { base.current = remote; dirty.current = JSON.stringify(merged.state) !== JSON.stringify(remote.state); apply(merged.state); }
  }
  function resolve(choice: "local" | "remote") {
    const c = conflictRef.current; if (!c || !owner.current) return;
    try { localStorage.setItem(`${TRAINER_KEY}:recovery:${owner.current.id}:${crypto.randomUUID()}`, JSON.stringify(c.local)); }
    catch { setMessage("Die Konfliktkopie konnte nicht gesichert werden. Bitte zuerst deine Antworten exportieren."); return; }
    const merged = mergeTrainerStates(c.base, c.local, c.remote.state, choice);
    base.current = c.remote; conflictRef.current = null; setConflict(null); dirty.current = true; apply(merged.state);
  }
  return { state, setState, loaded, canSave, message, account, conflict, resolve, flush, refresh };
}

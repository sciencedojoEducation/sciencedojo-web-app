"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { emptyWorkbookLearningState, mergeWorkbookDraft, resolveWorkbookDraftChoices, reconcileWorkbookAction, workbookPendingDraft, saveWorkbookRecovery, loadWorkbookRecoveries, type WorkbookRecovery, type WorkbookDraft, type WorkbookLearningState } from "@/lib/workbook-study";
const URL = "/api/workbook/aspekte-neu-b2/study";
type Account = { id: string; local: boolean; email: string };
type Conflict = { base: WorkbookDraft; remote: WorkbookLearningState; local: WorkbookDraft; merged: WorkbookDraft; keys: string[] };
export function useWorkbookStudy() {
  const [state, setState] = useState<WorkbookLearningState>(emptyWorkbookLearningState);
  const current = useRef(state); const base = useRef(state); const dirty = useRef(false);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const accountRef = useRef<Account | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [message, setMessage] = useState("Loading your saved study…");
  const [conflict, setConflict] = useState<Conflict | null>(null);
  const conflictRef = useRef<Conflict | null>(null);
  const [recoveries, setRecoveries] = useState<WorkbookRecovery[]>([]);
  const [legacy, setLegacy] = useState(false);
  const [loadError, setLoadError] = useState("");
  function apply(next: WorkbookLearningState) { current.current = next; setState(next); }
  function serial<T>(operation: () => Promise<T>) { const task = queue.current.catch(() => {}).then(operation); queue.current = task; return task; }
  const edit = useCallback((change: (draft: WorkbookDraft) => WorkbookDraft) => {
    const draft = change(current.current.draft);
    if (conflictRef.current && (JSON.stringify(draft.answers) !== JSON.stringify(current.current.draft.answers) || JSON.stringify(draft.notes) !== JSON.stringify(current.current.draft.notes))) {
      setMessage("Resolve the changes from your other device before editing answers or notes."); return;
    }
    dirty.current = true;
    const next = { ...current.current, draft };
    current.current = next; setState(next);
    if (accountRef.current) try { localStorage.setItem(`workbook-pending:${accountRef.current.id}`, JSON.stringify(workbookPendingDraft(base.current.draft, next.draft, conflictRef.current))); } catch { /* The autosave status reports local storage failures. */ }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void fetch(URL, { signal: controller.signal }).then(async r => {
      const data = await r.json(); if (!r.ok) throw new Error(data.message);
      setAccount(data.account); accountRef.current = data.account; base.current = data.state;
      let next = data.state as WorkbookLearningState;
      try {
        const local = localStorage.getItem(`workbook-pending:${data.account.id}`);
        const pending = local ? JSON.parse(local) : null;
        if (pending?.base && pending?.draft) {
          const result = mergeWorkbookDraft(pending.base, pending.draft, next.draft);
          if (result.conflicts.length) { const c = { base: pending.base, remote: next, local: pending.draft, merged: result.draft, keys: result.conflicts }; conflictRef.current = c; setConflict(c); }
          else { next = { ...next, draft: result.draft }; dirty.current = true; }
        }
        setRecoveries(loadWorkbookRecoveries(localStorage, data.account.id));
        setLegacy(!!localStorage.getItem("aspekte-neu-b2-study-v1"));
      } catch { setMessage("Browser backup unavailable. Your account progress has loaded."); }
      apply(next); setMessage(data.account.local ? "Saved in private local preview" : "Saved to your account");
    }).catch(e => { if (e.name !== "AbortError") { setLoadError(e.message); setMessage("Saved study could not load. Retry this page."); } });
    return () => controller.abort();
  }, []);

  async function flushNow() {
    if (conflictRef.current) throw new Error("Resolve the changes from your other device first.");
    if (!dirty.current) return;
    for (let i = 0; i < 4; i++) {
      const snapshot = structuredClone(current.current); const before = base.current;
      setMessage("Saving…");
      const response = await fetch(URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "save", accountId: accountRef.current?.id, revision: snapshot.revision, draft: snapshot.draft }) });
      const data = await response.json();
      if (response.status === 409 && data.state) {
        const result = mergeWorkbookDraft(before.draft, current.current.draft, data.state.draft);
        base.current = data.state;
        if (result.conflicts.length) {
          const c = { base: before.draft, remote: data.state, local: current.current.draft, merged: result.draft, keys: result.conflicts };
          conflictRef.current = c; setConflict(c); setMessage("Changes need your choice"); throw new Error("Another device changed the same answer.");
        }
        apply({ ...data.state, draft: result.draft }); continue;
      }
      if (response.status === 401 || response.status === 403) setLoadError(data.message || "Your account access changed. Reload before continuing.");
      if (!response.ok) throw new Error(data.message || "Unable to save study.");
      const unchanged = JSON.stringify(current.current.draft) === JSON.stringify(snapshot.draft);
      base.current = data.state;
      apply(unchanged ? data.state : { ...data.state, draft: { ...current.current.draft, runs: data.state.draft.runs, exerciseRuns: data.state.draft.exerciseRuns, assisted: data.state.draft.assisted, revealed: data.state.draft.revealed } });
      dirty.current = !unchanged;
      if (unchanged) { if (accountRef.current) try { localStorage.removeItem(`workbook-pending:${accountRef.current.id}`); } catch { /* Cloud save succeeded even without browser storage. */ } setMessage(accountRef.current?.local ? "Saved in private local preview" : "Saved to your account"); return; }
    }
  }
  useEffect(() => {
    if (!account || !dirty.current) return;
    try { localStorage.setItem(`workbook-pending:${account.id}`, JSON.stringify(workbookPendingDraft(base.current.draft, current.current.draft, conflictRef.current))); } catch { setMessage("Local backup unavailable. Keep this page open until saved."); }
    const timer = setTimeout(() => { void serial(flushNow).catch(e => setMessage(`${e.message} Your edits remain on this device.`)); }, 650);
    return () => clearTimeout(timer);
    // Persistence is driven by draft changes; functions read current values through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.draft, account]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty.current) event.preventDefault(); };
    window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn);
  }, []);

  async function action(input: Record<string, unknown>) {
    return serial(async () => {
      await flushNow(); if (dirty.current) throw new Error("Wait until your answers finish saving.");
      const snapshot = current.current;
      const response = await fetch(URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...input, accountId: accountRef.current?.id, revision: snapshot.revision }) });
      const data = await response.json();
      if (response.status === 409 && data.state) {
        const before = base.current;
        const result = mergeWorkbookDraft(before.draft, current.current.draft, data.state.draft);
        base.current = data.state;
        if (result.conflicts.length) { const c = { base: before.draft, remote: data.state, local: current.current.draft, merged: result.draft, keys: result.conflicts }; conflictRef.current = c; setConflict(c); }
        else apply({ ...data.state, draft: result.draft });
        throw new Error("Study changed on another device. Review it and retry.");
      }
      if (response.status === 401 || response.status === 403) setLoadError(data.message || "Your account access changed. Reload before continuing.");
      if (!response.ok) throw new Error(data.message || "Unable to save this action.");
      const reconciled = reconcileWorkbookAction(snapshot.draft, current.current.draft, data.state);
      base.current = data.state;
      if (reconciled.conflicts.length) {
        const c = { base: snapshot.draft, remote: data.state, local: current.current.draft, merged: reconciled.state.draft, keys: reconciled.conflicts };
        conflictRef.current = c; setConflict(c); dirty.current = true;
        throw new Error("Your answer changed while the attempt restarted. Choose which version to keep.");
      }
      apply(reconciled.state);
      dirty.current = JSON.stringify(reconciled.state.draft) !== JSON.stringify(data.state.draft);
      if (!dirty.current && accountRef.current) try { localStorage.removeItem(`workbook-pending:${accountRef.current.id}`); } catch { /* The server action is already saved. */ }
      setMessage(input.action === "queue" ? "Exercise added to revision" : accountRef.current?.local ? "Saved in private local preview" : "Saved to your account");
      return data;
    });
  }
  async function refresh() {
    return serial(async () => {
      await flushNow(); const r = await fetch(`${URL}?account=${encodeURIComponent(accountRef.current?.id || "")}`); const data = await r.json(); if (!r.ok) throw new Error(data.message);
      const before = base.current;
      const merged = mergeWorkbookDraft(before.draft, current.current.draft, data.state.draft);
      base.current = data.state;
      if (merged.conflicts.length) { const c = { base: before.draft, remote: data.state, local: current.current.draft, merged: merged.draft, keys: merged.conflicts }; conflictRef.current = c; setConflict(c); }
      else apply({ ...data.state, draft: merged.draft });
    });
  }
  useEffect(() => {
    const reconnect = () => { if (dirty.current) void serial(flushNow).catch(e => setMessage(e.message)); };
    const checkAccount = () => { if (!accountRef.current) return; void fetch(`${URL}?account=${encodeURIComponent(accountRef.current.id)}`).then(async r => { if (r.status === 401 || r.status === 403) { const data = await r.json(); setLoadError(data.message); } }).catch(() => {}); };
    window.addEventListener("online", reconnect); window.addEventListener("focus", checkAccount);
    return () => { window.removeEventListener("online", reconnect); window.removeEventListener("focus", checkAccount); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  function resolve(choices: Record<string, "local" | "remote">) {
    const c = conflictRef.current; if (!c) return;
    // Keep the losing local version separately from the pending autosave buffer.
    // A successful subsequent save is allowed to clear only the pending buffer.
    const accountId = accountRef.current?.id;
    if (!accountId) return;
    let recovery: WorkbookRecovery;
    try { recovery = saveWorkbookRecovery(localStorage, accountId, c.local, "Device changes before conflict resolution"); }
    catch { setMessage("Could not preserve conflicting edits. Export them or free browser storage before continuing."); return; }
    setRecoveries(current => [recovery, ...current]);
    const draft = resolveWorkbookDraftChoices(c.merged, c.local, c.remote.draft, c.keys, choices);
    draft.position = current.current.draft.position;
    draft.visited = [...new Set([...draft.visited, ...current.current.draft.visited])];
    base.current = c.remote; apply({ ...c.remote, draft }); dirty.current = true; conflictRef.current = null; setConflict(null);
  }
  function removeRecovery(id: string) {
    if (!accountRef.current || !id.startsWith(`workbook-recovery:${accountRef.current.id}:`)) return;
    try { localStorage.removeItem(id); setRecoveries(current => current.filter(r => r.id !== id)); }
    catch { setMessage("This recovery copy could not be removed from browser storage."); }
  }
  return { state, account, message, edit, action, conflict, resolve, recoveries, removeRecovery, legacy, dismissLegacy: () => setLegacy(false), loadError, refresh, flush: () => serial(flushNow) };
}

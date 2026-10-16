"use client";
import { useEffect, useState, useCallback } from "react";
type Recording = { id: string; exercise: string; run: string; at: string; url: string | null };
export default function WorkbookRecordingHistory({ account }: { account: string }) {
  const [recordings, setRecordings] = useState<Recording[]>([]); const [more, setMore] = useState(false); const [message, setMessage] = useState("");
  const endpoint = `/api/workbook/aspekte-neu-b2/recordings/history?account=${encodeURIComponent(account)}`;
  const load = useCallback(async (offset = 0) => {
    const r = await fetch(`${endpoint}&offset=${offset}`); const data = await r.json(); if (!r.ok) throw new Error(data.message);
    setRecordings(current => offset ? [...current, ...data.recordings] : data.recordings); setMore(data.hasMore);
  }, [endpoint]);
  useEffect(() => { void load().catch(e => setMessage(e.message)); }, [load]);
  async function remove(id: string) {
    try { const r = await fetch(`${endpoint}&id=${id}`, { method: "DELETE" }); const data = await r.json(); if (!r.ok) throw new Error(data.message); setRecordings(current => current.filter(r => r.id !== id)); setMessage("Recording deleted from your account."); }
    catch (e) { setMessage(e instanceof Error ? e.message : "Unable to delete recording."); }
  }
  return <section className="wb-recording-history"><h2>My saved recordings</h2><p>Private recordings from current and earlier attempts. Use Refresh if a playback link has expired.</p><button className="wb-button" onClick={() => void load().catch(e => setMessage(e.message))}>Refresh recordings</button>{recordings.map(r => <details key={r.id}><summary>Exercise {r.exercise} · {new Date(r.at).toLocaleString()}</summary>{r.url && <audio controls preload="none" src={r.url} aria-label={`Saved spoken answer for exercise ${r.exercise}`} />}<button className="wb-text-button" onClick={() => void remove(r.id)}>Delete this account recording</button></details>)}{more && <button className="wb-button" onClick={() => void load(recordings.length).catch(e => setMessage(e.message))}>Load more recordings</button>}<p role="status">{message}</p></section>;
}

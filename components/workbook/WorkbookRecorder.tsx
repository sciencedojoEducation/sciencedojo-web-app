"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, Upload, Trash2 } from "lucide-react";

async function audioStore(key: string, value?: Blob | null): Promise<Blob | null> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("aspekte-neu-b2-audio", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("recordings");
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction("recordings", value === undefined ? "readonly" : "readwrite");
      const store = transaction.objectStore("recordings");
      const operation = value === undefined ? store.get(key) : value === null ? store.delete(key) : store.put(value, key);
      operation.onerror = () => reject(operation.error);
      transaction.oncomplete = () => { resolve(value === undefined ? operation.result || null : value || null); db.close(); };
      transaction.onerror = () => { reject(transaction.error); db.close(); };
    };
  });
}

export default function WorkbookRecorder({ id, onAudio, exerciseKey, cloudEnabled = false }: { id: string; onAudio: (audio: Blob | null) => void; exerciseKey?: string; cloudEnabled?: boolean }) {
  const [recording, setRecording] = useState(false);
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");
  const [legacyBlob, setLegacyBlob] = useState<Blob | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [cloudUrl, setCloudUrl] = useState("");
  const [cloudBusy, setCloudBusy] = useState(false);
  const endpoint = `/api/workbook/aspekte-neu-b2/recordings?exercise=${encodeURIComponent(exerciseKey || "")}&account=${encodeURIComponent(id.split(":")[0])}`;
  async function loadCloud() {
    const r = await fetch(endpoint); const data = await r.json(); if (!r.ok) throw new Error(data.message);
    setCloudUrl(data.recording?.url || "");
  }
  useEffect(() => { setCloudUrl(""); if (cloudEnabled) void loadCloud().catch(e => setMessage(e.message)); /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [id, cloudEnabled]);
  async function cloudSave(remove = false) {
    setCloudBusy(true);
    try {
      const form = new FormData(); if (blob) form.set("audio", blob, "answer");
      const r = await fetch(endpoint, { method: remove ? "DELETE" : "POST", ...(remove ? {} : { body: form }) });
      const data = await r.json(); if (!r.ok) throw new Error(data.message);
      await loadCloud(); setMessage(data.warning || (remove ? "Recording removed from your account." : "Recording saved privately to your account."));
    } catch (e) { setMessage(e instanceof Error ? e.message : "Cloud recording unavailable."); }
    setCloudBusy(false);
  }
  const activeId = useRef(id);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callback = useRef(onAudio);
  useEffect(() => { callback.current = onAudio; }, [onAudio]);
  useEffect(() => {
    let active = true; activeId.current = id;
    setBlob(null); setLegacyBlob(null); setUrl(""); callback.current(null);
    let audioUrl = "";
    void audioStore(id).then(blob => {
      if (!active) return;
      if (!blob) { if (exerciseKey) void audioStore(exerciseKey).then(old => { if (active) setLegacyBlob(old); }).catch(() => {}); return; }
      audioUrl = URL.createObjectURL(blob); setBlob(blob); setUrl(audioUrl); callback.current(blob);
    }).catch(() => setMessage("Saved recordings cannot be read in this browser."));
    return () => {
      active = false; activeId.current = "";
      if (stopTimer.current) clearTimeout(stopTimer.current);
      if (recorder.current?.state === "recording") { recorder.current.stop(); }
      stream.current?.getTracks().forEach(track => track.stop());
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [id, exerciseKey]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (recording) event.preventDefault(); };
    window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn);
  }, [recording]);

  async function save(blob: Blob | null) {
    if (blob && blob.size > 10 * 1024 * 1024) { setMessage("Use a recording under 10 MB."); return; }
    setBlob(blob); setUrl(blob ? URL.createObjectURL(blob) : ""); callback.current(blob);
    try { await audioStore(id, blob); setMessage(blob ? "Recording saved on this device." : "Recording removed."); }
    catch { setMessage("Recording is available now, but could not be saved on this device."); }
  }

  async function start() {
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") throw new Error("unavailable");
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (activeId.current !== id) { stream.current.getTracks().forEach(track => track.stop()); return; }
      const mimeType = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus"].find(type => MediaRecorder.isTypeSupported(type));
      if (!mimeType) { stream.current.getTracks().forEach(track => track.stop()); throw new Error("format"); }
      const instance = new MediaRecorder(stream.current, { mimeType, audioBitsPerSecond: 64000 });
      recorder.current = instance;
      const chunks: Blob[] = [];
      instance.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      instance.onstop = () => {
        if (stopTimer.current) clearTimeout(stopTimer.current);
        stream.current?.getTracks().forEach(track => track.stop());
        const completed = new Blob(chunks, { type: mimeType });
        if (activeId.current !== id) { void audioStore(id, completed).catch(() => {}); return; }
        setRecording(false);
        void save(completed);
      };
      instance.start(); setRecording(true); setMessage("Recording… up to 3 minutes.");
      stopTimer.current = setTimeout(() => { if (instance.state === "recording") instance.stop(); }, 180_000);
    } catch { setMessage("Microphone unavailable. Allow microphone access, or upload a WebM, M4A or Ogg recording."); }
  }

  return <div className="wb-recording">
    <div className="wb-button-row">
      <button type="button" className={recording ? "wb-button wb-recording-active" : "wb-button"} onClick={() => recording ? recorder.current?.stop() : void start()}>
        {recording ? <Square size={15} /> : <Mic size={15} />}{recording ? "Stop recording" : "Record answer"}
      </button>
      <label className="wb-button"><Upload size={15} /> Upload<input className="wb-sr" type="file" accept="audio/webm,audio/mp4,audio/ogg,.m4a" disabled={recording} onChange={event => { const file = event.target.files?.[0]; if (file) void save(file); event.target.value = ""; }} /></label>
      {url && <button type="button" className="wb-icon-button" aria-label="Delete this recording" disabled={recording} onClick={() => void save(null)}><Trash2 size={16} /></button>}
    </div>
    {legacyBlob && !url && <button className="wb-button" onClick={() => { void save(legacyBlob); setLegacyBlob(null); }}>Import earlier device recording into this attempt</button>}
    {url && <audio controls src={url} preload="metadata" aria-label="Your spoken answer" />}
    {cloudEnabled && <div className="wb-cloud-recording"><button className="wb-button" disabled={!blob || recording || cloudBusy} onClick={() => void cloudSave()}>Save to my account</button>{cloudUrl && <><audio controls src={cloudUrl} preload="none" aria-label="Your privately saved recording" /><button className="wb-button" disabled={cloudBusy || recording} onClick={async () => { setCloudBusy(true); try { const r = await fetch(cloudUrl); if (!r.ok) throw new Error("Saved recording could not load. Refresh the page and retry."); const saved = await r.blob(); setBlob(saved); callback.current(saved); setMessage("Saved recording selected. Request Gemini feedback when ready."); } catch (e) { setMessage(e instanceof Error ? e.message : "Unable to load saved recording."); } finally { setCloudBusy(false); } }}>Use saved recording for feedback</button><button className="wb-text-button" disabled={cloudBusy} onClick={() => void cloudSave(true)}>Delete account recording</button></>}</div>}
    <small role="status">{message || "Your recording stays on this device until you request Gemini feedback."}</small>
  </div>;
}

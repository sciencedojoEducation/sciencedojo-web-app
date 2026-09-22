"use client";
/* eslint-disable @next/next/no-img-element -- media library URLs are configured at runtime */

import { useEffect, useRef, useState } from "react";
import { ImageIcon, Link2, Upload, X } from "lucide-react";

export type AcademyMediaChoice = {
  path?: string;
  name: string;
  url: string;
  altText?: string | null;
  mediaType?: "image" | "document";
};

export default function AcademyMediaChooser({
  open,
  title = "Choose media",
  library,
  onClose,
  onChoose,
  onUpload,
}: {
  open: boolean;
  title?: string;
  library: AcademyMediaChoice[];
  onClose: () => void;
  onChoose: (choice: AcademyMediaChoice) => void;
  onUpload: (file: File) => Promise<AcademyMediaChoice | null>;
}) {
  const [tab, setTab] = useState<"upload" | "library" | "url">("library");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("button, input")?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopImmediatePropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = ref.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      previous?.focus();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-secondary/45 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" tabIndex={-1} className="absolute inset-0" onClick={onClose} aria-label="Close media chooser" />
      <div ref={ref} className="relative flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <header className="flex items-center border-b p-5"><div><p className="text-[10px] font-black uppercase tracking-[0.15em] text-primary/60">Media</p><h2 className="text-xl font-black">{title}</h2></div><button type="button" onClick={onClose} className="ml-auto p-2" aria-label="Close"><X /></button></header>
        <div className="grid grid-cols-3 border-b">
          {([['upload', Upload, 'Upload'], ['library', ImageIcon, 'Library'], ['url', Link2, 'URL']] as const).map(([key, Icon, label]) => <button key={key} type="button" onClick={() => setTab(key)} className={`inline-flex min-h-12 items-center justify-center gap-2 border-b-2 text-xs font-black ${tab === key ? 'border-primary text-primary' : 'border-transparent text-secondary/45'}`}><Icon size={15} />{label}</button>)}
        </div>
        <div className="min-h-72 overflow-y-auto p-5">
          {tab === "upload" ? <label className="flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-secondary/15 bg-slate-50 text-center"><Upload className="text-primary" /><strong className="mt-3 text-sm">Upload an image</strong><span className="mt-1 text-xs text-secondary/45">JPEG, PNG, WebP or GIF within the existing file-size limit</span><input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={busy} onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; setBusy(true); const choice = await onUpload(file); setBusy(false); if (choice) { onChoose(choice); onClose(); } }} /></label> : null}
          {tab === "library" ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{library.filter((item) => item.mediaType !== "document").map((item) => <button key={item.path || item.url} type="button" onClick={() => { onChoose(item); onClose(); }} className="group overflow-hidden rounded-xl border text-left hover:border-primary"><span className="block aspect-video bg-slate-100"><img src={item.url} alt="" className="h-full w-full object-cover" /></span><span className="block truncate p-2 text-xs font-bold">{item.name}</span></button>)}</div> : null}
          {tab === "url" ? <div className="mx-auto max-w-xl py-8"><label className="text-xs font-black">Direct image URL<input type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://…" className="mt-2 min-h-11 w-full rounded-lg border px-3 font-normal" /></label><button type="button" disabled={!/^https?:\/\//i.test(url)} onClick={() => { onChoose({ name: "External image", url }); onClose(); }} className="mt-4 min-h-11 rounded-lg bg-primary px-5 text-xs font-black text-white disabled:opacity-40">Use this image</button></div> : null}
        </div>
      </div>
    </div>
  );
}

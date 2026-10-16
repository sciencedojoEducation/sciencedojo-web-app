"use client";
/* eslint-disable @next/next/no-img-element -- These tiny source symbols preserve the book's printed artwork. */
import type { WorkbookMarker } from "@/lib/aspekte-workbook";

export default function WorkbookMarkers({ markers, activeTrack, playing, onTrack, onReference, onExam }: {
  markers: WorkbookMarker[]; activeTrack: number; playing: boolean;
  onTrack: (track: number) => void; onReference: (page: number) => void; onExam: (label: string) => void;
}) {
  return <span className="wb-markers">{markers.map((marker, i) => {
    const active = marker.type === "audio" && marker.track === activeTrack && playing;
    const label = marker.type === "audio" ? `${active ? "Pause" : "Play"} track ${marker.track}${marker.label && marker.label !== String(marker.track) ? ` · ${marker.label}` : ""}` : marker.type === "solution" ? "View this exercise’s appendix solution" : `Exam worksheet ${marker.label}`;
    return <button type="button" key={`${marker.type}:${marker.track || i}:${i}`} className={`wb-source-symbol ${active ? "wb-source-symbol-playing" : ""}`} aria-label={label} title={label} aria-pressed={marker.type === "audio" ? active : undefined}
      onClick={() => { if (marker.type === "audio" && marker.track) onTrack(marker.track); else if (marker.type === "solution" && marker.referencePage) onReference(marker.referencePage); else if (marker.type === "exam") onExam(marker.label); }}>
      <img src={`/api/workbook/aspekte-neu-b2/assets/symbol/${marker.type}`} alt="" width={30} height={30} />
      {marker.type !== "solution" && <span className="wb-symbol-label">{marker.type === "audio" && marker.label && marker.label !== String(marker.track) ? `${marker.track} · ${marker.label}` : marker.label || marker.track}</span>}
    </button>;
  })}</span>;
}

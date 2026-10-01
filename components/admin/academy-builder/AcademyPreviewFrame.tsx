"use client";

import { useEffect, useRef, useState } from "react";
import type { AcademyPreviewDeviceId } from "@/lib/academy-preview-devices";
import { academyPreviewFrame } from "@/lib/academy-preview-frame";

export default function AcademyPreviewFrame({ deviceId, title, src, previewKey }: {
  deviceId: AcademyPreviewDeviceId;
  title: string;
  src: string;
  previewKey: string;
}) {
  const stage = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 1280, height: 800 });
  useEffect(() => {
    const node = stage.current;
    if (!node) return;
    const measure = () => setSize({ width: node.clientWidth, height: node.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const frame = academyPreviewFrame(deviceId, size.width, size.height);
  const desktop = deviceId === "desktop";
  // Keep one iframe at the same React position across every device: resizing must
  // not reload the lesson or discard an answer, recording preview, or active tab.
  return <div ref={stage} className={`relative flex min-h-0 flex-1 items-center justify-center overflow-hidden ${desktop ? "bg-white" : "bg-[#17191D] pb-8"}`}>
    <div className="relative shrink-0" style={{ width: desktop ? "100%" : frame.width * frame.scale, height: desktop ? "100%" : frame.height * frame.scale }}>
      <div className={`absolute left-0 top-0 origin-top-left ${desktop ? "bg-white" : "bg-[#EFEFEF] shadow-xl ring-1 ring-black/10"}`} style={{
        width: desktop ? "100%" : frame.width, height: desktop ? "100%" : frame.height,
        padding: desktop ? 0 : frame.inset, borderRadius: desktop ? 0 : frame.radius, transform: desktop ? "none" : `scale(${frame.scale})`,
      }}>
        <iframe key={previewKey} title={title} src={src} className={`block bg-white ${desktop ? "border-0" : "border border-[#D6D8DB]"}`} style={{ width: desktop ? "100%" : frame.device.width, height: desktop ? "100%" : frame.device.height,
          borderRadius: frame.device.icon === "phone" ? 24 : 0 }} />
      </div>
    </div>
    {!desktop ? <p className="pointer-events-none absolute bottom-2 text-xs text-white/65">{frame.device.label} · {frame.device.width} × {frame.device.height} · {Math.round(frame.scale * 100)}%</p> : null}
  </div>;
}

"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { showsPublicScrollProgress } from "@/lib/public-scroll-progress";
import s from "./PublicScrollProgress.module.css";

export default function PublicScrollProgress() {
  const pathname = usePathname();
  return showsPublicScrollProgress(pathname) ? <ReadingProgress key={pathname} /> : null;
}

function ReadingProgress() {
  const line = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = line.current;
    if (!node) return;
    let frame = 0;
    let header: Element | null = null;

    const update = () => {
      frame = 0;
      const root = document.scrollingElement || document.documentElement;
      const range = Math.max(0, root.scrollHeight - document.documentElement.clientHeight);
      const progress = range > 1 ? Math.max(0, Math.min(1, window.scrollY / range)) : 0;
      const headerBottom = header?.getBoundingClientRect().bottom || 0;
      node.style.setProperty("--public-reading-progress", String(progress));
      node.style.top = `${Math.max(0, headerBottom - 2)}px`;
      node.dataset.scrollable = String(range > 1);
    };
    const schedule = () => {
      if (!frame && !document.hidden) frame = requestAnimationFrame(update);
    };
    const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
    const refreshHeader = () => {
      const next = document.querySelector("[data-public-site-header]");
      if (next !== header) {
        if (header) resize?.unobserve(header);
        header = next;
        if (header) resize?.observe(header);
      }
      schedule();
    };
    // Streamed headers and expanded content can arrive without a scroll event.
    const changes = new MutationObserver(refreshHeader);
    changes.observe(document.body, { childList: true, subtree: true });
    resize?.observe(document.documentElement);
    resize?.observe(document.body);
    refreshHeader();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    document.addEventListener("visibilitychange", schedule);
    return () => {
      cancelAnimationFrame(frame);
      changes.disconnect();
      resize?.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("visibilitychange", schedule);
    };
  }, []);

  return <div ref={line} className={s.line} data-public-scroll-progress aria-hidden="true" />;
}

"use client";

import { useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Menu } from "lucide-react";
import styles from "./AcademyDesktopPreviewLayout.module.css";

const desktopQuery = "(min-width: 1200px)";
function subscribeViewport(notify: () => void) {
  const media = window.matchMedia(desktopQuery);
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
}
const desktopViewport = () => window.matchMedia(desktopQuery).matches;
const serverViewport = () => false;

/** One outline for every preview page. Desktop starts open, small screens closed. */
export default function AcademyDesktopPreviewLayout({ outline, children, banner = true }: { outline: ReactNode; children: ReactNode; banner?: boolean }) {
  const wide = useSyncExternalStore(subscribeViewport, desktopViewport, serverViewport);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const open = wide ? desktopOpen : mobileOpen;
  const setOpen = wide ? setDesktopOpen : setMobileOpen;
  const outlineId = useId();
  const contentId = useId();
  const outlineRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  return <div className={`${styles.layout} ${banner ? "" : styles.flush} ${open ? "" : styles.closed}`} onKeyDown={(event) => {
    if (event.key === "Escape" && open && (outlineRef.current?.contains(event.target as Node) || event.target === toggleRef.current)) {
      event.stopPropagation();
      toggleRef.current?.focus({ preventScroll: true });
      setOpen(false);
    }
  }}>
    <a href={`#${contentId}`} className={styles.skip}>Skip course outline</a>
    <button ref={toggleRef} type="button" className={styles.toggle} aria-controls={outlineId} aria-expanded={open}
      aria-label={open ? "Hide course outline" : "Show course outline"} title={open ? "Hide course outline" : "Show course outline"}
      onClick={() => setOpen((value) => !value)}><Menu size={18} aria-hidden="true" /></button>
    <aside ref={outlineRef} id={outlineId} className={styles.outline} inert={!open} aria-hidden={!open} aria-label="Course navigation and progress">{outline}</aside>
    <div id={contentId} tabIndex={-1} className={styles.content}>{children}</div>
  </div>;
}

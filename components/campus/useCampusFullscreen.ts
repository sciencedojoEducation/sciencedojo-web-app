"use client";
import { useCallback, useEffect, useRef, useState } from "react";

/** Fullscreen the shell, including its controls and retained course dialog. */
export function useCampusFullscreen(stopMovement: () => void) {
  const shell = useRef<HTMLElement>(null), button = useRef<HTMLButtonElement>(null);
  const [immersive, setImmersive] = useState(false);
  const wanted = useRef(false), owned = useRef(false);
  const scrollPosition = useRef({ x: 0, y: 0 });
  const exit = useCallback(() => {
    wanted.current = false; stopMovement(); document.exitPointerLock?.();
    const finish = () => { setImmersive(false); button.current?.focus({ preventScroll: true }); };
    if (document.fullscreenElement === shell.current) void document.exitFullscreen().then(finish, finish);
    else finish();
  }, [stopMovement]);
  const enter = () => {
    scrollPosition.current = { x: window.scrollX, y: window.scrollY };
    wanted.current = true; stopMovement(); document.exitPointerLock?.(); setImmersive(true);
    try {
      // Unsupported/denied fullscreen keeps the same viewport-filling controls.
      if (shell.current?.requestFullscreen) {
        // Reserve ownership before the event: a quick browser exit can happen
        // before the queued entry fullscreenchange is delivered.
        owned.current = true;
        void shell.current.requestFullscreen()?.catch(() => { owned.current = false; });
      }
    } catch { owned.current = false; /* Use the viewport fallback. */ }
  };
  useEffect(() => {
    const change = () => {
      const isOurs = document.fullscreenElement === shell.current;
      if (isOurs && !wanted.current) { void document.exitFullscreen().catch(() => {}); return; }
      if (isOurs) owned.current = true;
      else if (owned.current) { owned.current = false; exit(); }
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented && wanted.current && !document.fullscreenElement &&
        !document.pointerLockElement && !shell.current?.querySelector("dialog[open]")) exit();
    };
    document.addEventListener("fullscreenchange", change);
    document.addEventListener("keydown", escape);
    const root = shell.current;
    return () => {
      wanted.current = false;
      document.removeEventListener("fullscreenchange", change);
      document.removeEventListener("keydown", escape);
      if (document.fullscreenElement === root) void document.exitFullscreen().catch(() => {});
    };
  }, [exit]);
  useEffect(() => {
    if (!immersive) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const siblings: { element: HTMLElement; inert: boolean }[] = [];
    // Keep the viewport fallback's keyboard focus inside the school too.
    let node: HTMLElement | null = shell.current;
    while (node?.parentElement) {
      for (const sibling of node.parentElement.children) if (sibling !== node && sibling instanceof HTMLElement) {
        siblings.push({ element: sibling, inert: sibling.inert }); sibling.setAttribute("inert", "");
      }
      node = node.parentElement;
    }
    return () => {
      document.body.style.overflow = overflow;
      for (const sibling of siblings) {
        if (sibling.inert) sibling.element.setAttribute("inert", "");
        else sibling.element.removeAttribute("inert");
      }
      requestAnimationFrame(() => {
        if (!wanted.current) window.scrollTo(scrollPosition.current.x, scrollPosition.current.y);
      });
    };
  }, [immersive]);
  return { shell, button, immersive, enter, exit };
}

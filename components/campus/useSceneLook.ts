"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from "react";
import { boundedLook, type CameraLook, type SchoolView } from "@/lib/campus/cube-experience";

/** Mouse deltas update the camera directly, without rerendering the campus UI. */
export function useSceneLook({ look, view, active, canLock, onLookChange, onRelease }: {
  look: CameraLook; view: SchoolView; active: boolean; canLock: boolean;
  onLookChange?: (next: CameraLook) => void; onRelease?: () => void;
}) {
  const element = useRef<HTMLDivElement>(null);
  const angles = useRef(boundedLook(look, view));
  const invalidate = useRef<() => void>(() => {});
  const latest = useRef({ view, active, canLock, onLookChange, onRelease });
  const previous = useRef<{ x: number; y: number } | null>(null);
  const previousView = useRef(view);
  const dragging = useRef<number | null>(null);
  const paused = useRef(false), ownedLock = useRef(false);
  type Mode = "hover" | "locked" | "paused";
  const [status, setStatus] = useState<{ view: SchoolView; mode: Mode }>({ view, mode: "hover" });
  if (status.view !== view) setStatus({ view, mode: "hover" });
  const setMode = useCallback((mode: Mode) => setStatus({ view: latest.current.view, mode }), []);
  const release = useCallback(() => {
    paused.current = true; previous.current = null; dragging.current = null;
    setMode("paused"); latest.current.onRelease?.();
    if (document.pointerLockElement === element.current) document.exitPointerLock();
  }, [setMode]);
  useLayoutEffect(() => {
    angles.current = boundedLook(look, view);
    previous.current = null;
  }, [look, view]);
  useLayoutEffect(() => {
    latest.current = { view, active, canLock, onLookChange, onRelease };
    if (view === "first-person" && previousView.current !== view) paused.current = false;
    previousView.current = view;
    if ((!active || !canLock || view !== "first-person") && document.pointerLockElement === element.current)
      document.exitPointerLock();
  }, [view, active, canLock, onLookChange, onRelease]);
  const bindInvalidate = useCallback((next: () => void) => { invalidate.current = next; }, []);
  const move = useCallback((dx: number, dy: number) => {
    const state = latest.current;
    if (!state.active || !Number.isFinite(dx) || !Number.isFinite(dy)) return;
    angles.current = boundedLook({ ...angles.current, yaw: angles.current.yaw + dx * .003,
      pitch: angles.current.pitch - dy * .003 }, state.view);
    state.onLookChange?.(angles.current);
    invalidate.current();
  }, []);
  useEffect(() => {
    const lockedMove = (event: MouseEvent) => {
      if (document.pointerLockElement === element.current && latest.current.view === "first-person" && latest.current.canLock)
        move(event.movementX, event.movementY);
    };
    const change = () => {
      const locked = document.pointerLockElement === element.current;
      if (locked && (!latest.current.active || !latest.current.canLock || latest.current.view !== "first-person")) { release(); return; }
      if (locked) { ownedLock.current = true; previous.current = null; paused.current = false; setMode("locked"); }
      else if (ownedLock.current) { ownedLock.current = false; release(); }
    };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") release(); };
    const hidden = () => { if (document.hidden) release(); };
    // Rejection is a supported fallback: ordinary hover/touch and buttons stay usable.
    const failed = () => { if (!paused.current) setMode("hover"); };
    document.addEventListener("mousemove", lockedMove);
    document.addEventListener("pointerlockchange", change);
    document.addEventListener("pointerlockerror", failed);
    document.addEventListener("keydown", escape);
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("blur", release);
    const scene = element.current;
    return () => {
      document.removeEventListener("mousemove", lockedMove);
      document.removeEventListener("pointerlockchange", change);
      document.removeEventListener("pointerlockerror", failed);
      document.removeEventListener("keydown", escape);
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("blur", release);
      if (document.pointerLockElement === scene) document.exitPointerLock();
    };
  }, [move, release, setMode]);
  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const state = latest.current;
    if (!state.active || !["first-person", "orbit"].includes(state.view) || event.button !== 0) return;
    event.preventDefault(); element.current?.parentElement?.focus();
    previous.current = { x: event.clientX, y: event.clientY };
    if (state.view === "first-person" && event.pointerType === "mouse") {
      if (!state.canLock) return;
      paused.current = false; setMode("hover");
      if (document.pointerLockElement === element.current) return;
      try { void element.current?.requestPointerLock?.()?.catch(() => {}); } catch { /* Hover remains available. */ }
    } else {
      dragging.current = event.pointerId;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  };
  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = latest.current;
    if (!state.active || document.pointerLockElement === element.current) return;
    const hover = state.view === "first-person" && state.canLock && event.pointerType === "mouse" && !paused.current;
    if (!hover && dragging.current !== event.pointerId) return;
    const before = previous.current;
    previous.current = { x: event.clientX, y: event.clientY };
    if (before) move(event.clientX - before.x, event.clientY - before.y);
  };
  const pointerUp = (event: PointerEvent<HTMLDivElement>) => {
    dragging.current = null; previous.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  return { element, angles, bindInvalidate, mode: status.view === view ? status.mode : "hover", handlers: {
    onPointerDown: pointerDown, onPointerMove: pointerMove, onPointerUp: pointerUp,
    onPointerCancel: pointerUp, onLostPointerCapture: () => { dragging.current = null; previous.current = null; },
    onPointerEnter: () => { previous.current = null; },
    onPointerLeave: () => { if (dragging.current === null) previous.current = null; },
  } };
}

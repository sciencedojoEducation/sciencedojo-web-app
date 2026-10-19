"use client";

import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Pause, Play } from "lucide-react";
import s from "./engineering.module.css";
import shared from "../shared/business.module.css";

const MotionContext = createContext({ paused: false, reduced: false, enabled: false, toggle: () => {} });

function subscribeToMotionEnvironment(change: () => void) {
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  preference.addEventListener("change", change);
  document.addEventListener("visibilitychange", change);
  return () => { preference.removeEventListener("change", change); document.removeEventListener("visibilitychange", change); };
}

function motionEnvironment() {
  return matchMedia("(prefers-reduced-motion: reduce)").matches ? "reduced" : document.hidden ? "hidden" : "active";
}

const serverMotionEnvironment = () => "pending";

export function VisualMotionToggle() {
  const { reduced, enabled, toggle } = useContext(MotionContext);
  return <button type="button" className={s.motionToggle} data-visual-motion-toggle onClick={toggle} disabled={reduced} aria-label={reduced ? "Reduced motion enabled" : enabled ? "Pause visual motion" : "Play visual motion"}>
    {enabled ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}{reduced ? "Reduced motion" : enabled ? "Pause motion" : "Play motion"}
  </button>;
}

export default function EngineeringVisualMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const environment = useSyncExternalStore(subscribeToMotionEnvironment, motionEnvironment, serverMotionEnvironment);
  const reduced = environment === "reduced";
  const enabled = environment === "active" && !paused;

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const animations = new Set<Animation>();
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const target = entry.target as HTMLElement;
        target.dataset.inView = String(entry.isIntersecting);
        if (enabled && entry.isIntersecting && target.hasAttribute("data-reveal") && target.dataset.revealed !== "true") {
          target.dataset.revealed = "true";
          const animation = target.animate([{ opacity: .6, transform: "translateY(24px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 850, easing: "cubic-bezier(.2,.7,.2,1)" });
          animations.add(animation);
          animation.addEventListener("finish", () => animations.delete(animation), { once: true });
        }
      }
    }, { threshold: .12 });
    node.querySelectorAll("[data-animate], [data-reveal]").forEach(target => observer.observe(target));

    const disposers: (() => void)[] = [];
    if (enabled && matchMedia("(hover: hover) and (pointer: fine)").matches) {
      node.querySelectorAll<HTMLElement>("[data-tilt]").forEach(target => {
        let frame = 0;
        const reset = () => { cancelAnimationFrame(frame); frame = 0; target.style.removeProperty("--tilt-x"); target.style.removeProperty("--tilt-y"); };
        const move = (event: PointerEvent) => {
          if (event.pointerType !== "mouse") return;
          cancelAnimationFrame(frame);
          frame = requestAnimationFrame(() => {
            const box = target.getBoundingClientRect();
            const x = Math.max(-.5, Math.min(.5, (event.clientX - box.left) / box.width - .5));
            const y = Math.max(-.5, Math.min(.5, (event.clientY - box.top) / box.height - .5));
            target.style.setProperty("--tilt-y", x * 9 + "deg");
            target.style.setProperty("--tilt-x", -y * 9 + "deg");
            frame = 0;
          });
        };
        target.addEventListener("pointermove", move);
        target.addEventListener("pointerleave", reset);
        disposers.push(() => { reset(); target.removeEventListener("pointermove", move); target.removeEventListener("pointerleave", reset); });
      });
    }
    return () => { observer.disconnect(); animations.forEach(animation => animation.cancel()); disposers.forEach(dispose => dispose()); };
  }, [enabled]);

  return <MotionContext.Provider value={{ paused, reduced, enabled, toggle: () => setPaused(value => !value) }}><div ref={root} className={`${s.page} ${shared.page}`} data-engineering-motion data-motion={enabled ? "on" : "off"}>
    {children}
  </div></MotionContext.Provider>;
}

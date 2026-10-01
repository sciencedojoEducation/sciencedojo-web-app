"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { observeAcademyListMotion, observeAcademyScrollMotion } from "@/lib/academy-scroll-motion";

export default function AcademyScrollReveal({ children, gentle = false, disabled = false, media = false }: { children: ReactNode; gentle?: boolean; disabled?: boolean; media?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    // A list already has item-level entrances; avoid two transforms on the same copy.
    const stopBlock = disabled || ref.current.querySelector("[data-academy-motion-list]") ? () => {} : observeAcademyScrollMotion(ref.current, gentle, { media });
    const stopItems = observeAcademyListMotion(ref.current);
    return () => { stopBlock(); stopItems(); };
  }, [gentle, disabled, media]);
  return <div ref={ref} className="academy-scroll-reveal">{children}</div>;
}

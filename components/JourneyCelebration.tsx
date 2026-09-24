"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import styles from "./JourneyCelebration.module.css";

const pieces = [
  { x: -126, y: -52, r: -135, delay: 0, color: "#f8b84e" },
  { x: -108, y: -91, r: 80, delay: 40, color: "#27b9df" },
  { x: -78, y: 58, r: 150, delay: 80, color: "#fb8c78" },
  { x: -55, y: -74, r: -75, delay: 25, color: "#f8b84e" },
  { x: -34, y: 72, r: 105, delay: 95, color: "#5b8feb" },
  { x: -12, y: -97, r: -160, delay: 55, color: "#fb8c78" },
  { x: 16, y: 75, r: 135, delay: 75, color: "#27b9df" },
  { x: 36, y: -87, r: -110, delay: 20, color: "#5b8feb" },
  { x: 54, y: 44, r: 75, delay: 110, color: "#f8b84e" },
  { x: 68, y: -56, r: -95, delay: 65, color: "#fb8c78" },
  { x: 76, y: 17, r: 145, delay: 120, color: "#27b9df" },
];

export default function JourneyCelebration() {
  const headingRef = useRef<HTMLDivElement>(null);
  const [burst, setBurst] = useState(false);

  useEffect(() => {
    const heading = headingRef.current;
    if (!heading || !('IntersectionObserver' in window)) return;

    let timeoutId: number | undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      setBurst(true);
      timeoutId = window.setTimeout(() => setBurst(false), 1500);
    }, { threshold: 0.6 });

    observer.observe(heading);
    return () => {
      observer.disconnect();
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div ref={headingRef} className="relative mt-2 w-fit max-w-full">
      <h2 id="stories-heading" className="relative z-10 text-3xl font-black tracking-tight text-secondary md:text-4xl">The human side of progress.</h2>
      {burst && (
        <div className={styles.burst} aria-hidden="true">
          {pieces.map((piece, index) => (
            <span
              key={index}
              className={styles.piece}
              style={{
                "--burst-x": `${piece.x}px`,
                "--burst-y": `${piece.y}px`,
                "--burst-r": `${piece.r}deg`,
                animationDelay: `${piece.delay}ms`,
                backgroundColor: piece.color,
              } as CSSProperties}
            />
          ))}
        </div>
      )}
    </div>
  );
}

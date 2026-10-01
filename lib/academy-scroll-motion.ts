/** Progressive enhancement: copy remains visible if motion APIs are unavailable. */
export function observeAcademyScrollMotion(element: HTMLElement, gentle = false, options: { slide?: boolean; media?: boolean; delayMs?: number } = {}) {
  if (typeof IntersectionObserver === "undefined" || typeof element.animate !== "function") return () => {};
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  let played = false;
  let animation: Animation | undefined;
  const stop = () => { animation?.cancel(); animation = undefined; };
  const observer = new IntersectionObserver((entries) => {
    if (played || preference.matches) return;
    if (!entries.some((entry) => entry.isIntersecting) || !element.getClientRects().length) return;
    played = true;
    observer.disconnect();
    // Never fade an activity a learner is already using.
    if (element.contains(document.activeElement)) return;
    animation = element.animate([
      { opacity: gentle ? 0.45 : 0, transform: options.slide ? "translateX(-28px)" : options.media ? "translateY(12px) scale(0.985)" : `translateY(${gentle ? 6 : 18}px)` },
      { opacity: 1, transform: options.slide ? "translateX(0)" : options.media ? "translateY(0) scale(1)" : "translateY(0)" },
    ], { duration: gentle ? 300 : options.media ? 480 : 520, delay: Math.min(240, Math.max(0, options.delayMs || 0)), fill: "backwards", easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
    animation.onfinish = () => { animation = undefined; };
  }, { threshold: 0, rootMargin: "0px 0px -40px 0px" });
  const onPreferenceChange = () => {
    stop();
    if (preference.matches) observer.disconnect();
    else if (!played) observer.observe(element);
  };
  const onFocus = () => { played = true; observer.disconnect(); stop(); };
  if (!preference.matches) observer.observe(element);
  preference.addEventListener("change", onPreferenceChange);
  element.addEventListener("focusin", onFocus);
  // Stop before a pointer interaction, including native media controls, so
  // moving content cannot slide out from under the learner's finger/cursor.
  element.addEventListener("pointerdown", onFocus);
  return () => {
    observer.disconnect();
    stop();
    preference.removeEventListener("change", onPreferenceChange);
    element.removeEventListener("focusin", onFocus);
    element.removeEventListener("pointerdown", onFocus);
  };
}

/** Each item enters when visible; long lists never accumulate long delays. */
export function observeAcademyListMotion(element: HTMLElement) {
  const cleanups = Array.from(element.querySelectorAll<HTMLElement>("[data-academy-motion-list]")).flatMap((list) =>
    Array.from(list.children).filter((item): item is HTMLElement => item instanceof HTMLElement && item.tagName === "LI")
      .map((item, index) => observeAcademyScrollMotion(item, false, { slide: true, delayMs: Math.min(index, 4) * 60 })),
  );
  return () => cleanups.forEach((cleanup) => cleanup());
}

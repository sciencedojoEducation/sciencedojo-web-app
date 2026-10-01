export const academyMotion = {
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  panelMs: 240,
  disclosureMs: 260,
} as const;

/** Animate only the new content, never its focused navigation controls. */
export function animateAcademyPanel(element: HTMLElement, direction = 0) {
  if (typeof element.animate !== "function") return () => {};
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (preference.matches) return () => {};
  const animation = element.animate([
    { opacity: 0.4, transform: direction ? `translateX(${direction * 10}px)` : "translateY(6px)" },
    { opacity: 1, transform: "translate(0, 0)" },
  ], { duration: academyMotion.panelMs, easing: academyMotion.easing });
  const stop = () => animation.cancel();
  preference.addEventListener("change", stop);
  element.addEventListener("pointerdown", stop);
  element.addEventListener("focusin", stop);
  return () => {
    stop();
    preference.removeEventListener("change", stop);
    element.removeEventListener("pointerdown", stop);
    element.removeEventListener("focusin", stop);
  };
}

/** Native details remain functional without JS; rapid toggles reverse from the current height. */
export function observeAcademyDisclosure(element: HTMLDetailsElement) {
  const summary = element.querySelector("summary");
  if (!summary || typeof element.animate !== "function") return () => {};
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  let expanded = element.open;
  let animation: Animation | undefined;
  const settle = () => {
    if (!animation) return;
    animation?.cancel();
    animation = undefined;
    element.open = expanded;
  };
  const toggle = (event: Event) => {
    if (preference.matches) return; // Retain native keyboard and pointer activation.
    event.preventDefault();
    const start = element.getBoundingClientRect().height;
    expanded = animation ? !expanded : !element.open;
    animation?.cancel();
    animation = undefined;
    element.open = expanded;
    const end = element.getBoundingClientRect().height;
    element.open = true; // Keep the content rendered throughout a closing transition.
    animation = element.animate([{ height: `${start}px` }, { height: `${end}px` }], {
      duration: academyMotion.disclosureMs, easing: academyMotion.easing,
    });
    animation.onfinish = settle;
  };
  const preferenceChanged = () => { if (preference.matches) settle(); };
  summary.addEventListener("click", toggle);
  preference.addEventListener("change", preferenceChanged);
  return () => {
    settle();
    summary.removeEventListener("click", toggle);
    preference.removeEventListener("change", preferenceChanged);
  };
}

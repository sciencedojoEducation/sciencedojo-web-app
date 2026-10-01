/** Dashboard and preview pages scroll inside a panel rather than the window. */
export function academyScrollContainer(element: HTMLElement): HTMLElement | Window {
  let parent = element.parentElement;
  while (parent) {
    if (/(auto|scroll|overlay)/.test(window.getComputedStyle(parent).overflowY)) return parent;
    parent = parent.parentElement;
  }
  return window;
}

export function academyScrollOffset(container: HTMLElement | Window) {
  return container === window ? window.scrollY : (container as HTMLElement).scrollTop;
}

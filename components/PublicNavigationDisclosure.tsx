"use client";

import Link from "next/link";
import { useEffect, useId, useRef } from "react";
import { ChevronDown } from "lucide-react";

/** Native disclosure with pointer and keyboard access to related destinations. */
export default function PublicNavigationDisclosure({ label, items }: {
  label: string;
  items: readonly { label: string; href: string; description?: string }[];
}) {
  const details = useRef<HTMLDetailsElement>(null);
  const trigger = useRef<HTMLElement>(null);
  const panelId = useId();

  function close() {
    if (details.current) details.current.open = false;
  }

  useEffect(() => {
    function dismiss(event: PointerEvent) {
      if (!details.current?.contains(event.target as Node)) {
        if (details.current) details.current.open = false;
      }
    }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, []);

  return <details
    ref={details}
    className="group/business relative"
    onPointerEnter={event => {
      if (event.pointerType === "mouse" && details.current) details.current.open = true;
    }}
    onPointerLeave={() => {
      if (!details.current?.contains(document.activeElement)) close();
    }}
    onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget as Node)) close();
    }}
    onKeyDown={event => {
      if (event.key === "Escape" && details.current?.open) {
        event.preventDefault();
        close();
        trigger.current?.focus();
      }
    }}
  >
    <summary
      ref={trigger}
      aria-controls={panelId}
      onKeyDown={event => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          if (details.current) {
            details.current.open = true;
            const links = details.current.querySelectorAll<HTMLAnchorElement>("a[href]");
            links[event.key === "ArrowDown" ? 0 : links.length - 1]?.focus();
          }
        }
      }}
      className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1.5 whitespace-nowrap rounded-sm text-sm font-medium text-secondary/70 transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary [&::-webkit-details-marker]:hidden"
    >
      {label}
      <ChevronDown aria-hidden="true" className="h-3.5 w-3.5 transition-transform group-open/business:rotate-180 motion-reduce:transition-none" />
    </summary>
    <div id={panelId} className="absolute right-0 top-full z-50 w-80 pt-2">
      <div className="rounded-2xl border border-primary/10 bg-white p-2 shadow-[0_16px_48px_rgba(0,26,68,0.12)]">
        {items.map(item => <Link
          key={item.href}
          href={item.href}
          onClick={close}
          className="block rounded-xl px-4 py-3 text-secondary transition-colors hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
        >
          <span className="block text-sm font-semibold">{item.label}</span>
          {item.description && <span className="mt-1 block text-xs leading-5 text-secondary/65">{item.description}</span>}
        </Link>)}
      </div>
    </div>
  </details>;
}

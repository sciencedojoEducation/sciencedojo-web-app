"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import BusinessBrand, { type BusinessArm } from "./BusinessBrand";
import s from "./business.module.css";

const navigation = {
  engineering: { label: "Engineering navigation", mobile: "Mobile engineering navigation", links: [["Services","problems"],["Our work","work"],["Approach","approach"],["Team","team"]], other: "Instructional design", otherHref: "/business/instructional-design", cta: "Let’s talk" },
  "instructional-design": { label: "Business navigation", mobile: "Mobile business navigation", links: [["The offer","offer"],["Work","work"],["Process","process"],["Studio","about"]], other: "Engineering", otherHref: "/business/engineering", cta: "Discuss your project" },
};

/** One native, script-independent navigation and brand layout for both arms. */
export default function BusinessHeader({ arm }: { arm: BusinessArm }) {
  const config = navigation[arm];
  const menu = useRef<HTMLDetailsElement>(null);
  const trigger = useRef<HTMLElement>(null);
  const first = useRef<HTMLAnchorElement>(null);
  const [open, setOpen] = useState(false);
  function close() { if (menu.current) menu.current.open = false; }
  useEffect(() => {
    if (!open) return;
    first.current?.focus();
    const dismiss = (event: PointerEvent) => { if (!menu.current?.contains(event.target as Node)) close(); };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);
  const homeLabel = arm === "engineering" ? "ScienceDojo Engineering home" : "ScienceDojo for Business home";
  return <header data-public-site-header className={s.header}>
    <div className={`${s.container} ${s.headerInner}`}>
      <Link href={`/business/${arm}`} className={s.brand} aria-label={homeLabel}><BusinessBrand arm={arm} /></Link>
      <nav aria-label={config.label} className={s.desktopNav}>{config.links.map(([label,id]) => <a key={id} href={`#${id}`}>{label}</a>)}<Link href={config.otherHref} className={s.armLink}>{config.other} <ArrowUpRight size={13} aria-hidden="true" /></Link></nav>
      <a href="#contact" className={s.headerCta}><span className={s.longLabel}>{config.cta}</span><span className={s.shortLabel}>Let’s talk</span><ArrowUpRight size={15} aria-hidden="true" /></a>
      <details className={s.menu} ref={menu} onToggle={event => setOpen(event.currentTarget.open)} onKeyDown={event => { if (event.key === "Escape" && menu.current?.open) { event.preventDefault(); close(); trigger.current?.focus(); } }} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) close(); }}>
        <summary ref={trigger} role="button" aria-label={open ? "Close menu" : "Open menu"} aria-controls={`${arm}-menu`}><Menu className={s.openIcon} aria-hidden="true" /><X className={s.closeIcon} aria-hidden="true" /></summary>
        <nav id={`${arm}-menu`} aria-label={config.mobile} className={s.mobileNav}>{config.links.map(([label,id],index) => <a key={id} ref={index === 0 ? first : undefined} href={`#${id}`} onClick={close}>{label}</a>)}<Link href={config.otherHref} onClick={close}>{config.other}</Link><a href="#contact" onClick={close}>{config.cta}</a></nav>
      </details>
    </div>
  </header>;
}

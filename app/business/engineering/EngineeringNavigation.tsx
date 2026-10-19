"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import s from "./engineering.module.css";

const links = [["Services", "problems"], ["Our work", "work"], ["Approach", "approach"], ["Team", "team"]];

export default function EngineeringNavigation() {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);
  const first = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    if (!open) return;
    first.current?.focus();
    const dismiss = (event: PointerEvent) => {
      if (!header.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);
  return <header data-public-site-header className={s.header} ref={header} onKeyDown={(event) => {
    if (event.key === "Escape" && open) { setOpen(false); trigger.current?.focus(); }
  }} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false); }}>
    <div className={`${s.container} ${s.headerInner}`}>
      <Link href="/business/engineering" className={s.brand} aria-label="ScienceDojo Engineering home"><span>science<span className={s.brandDojo}>dojo</span><span className={s.dot}>.</span></span><small>ENGINEERING</small></Link>
      <nav aria-label="Engineering navigation" className={s.desktopNav}>{links.map(([label, id]) => <a key={id} href={`#${id}`}>{label}</a>)}<Link href="/business" className={s.armLink}>Instructional design <ArrowUpRight size={13} aria-hidden="true" /></Link></nav>
      <a href="#contact" className={s.headerCta}>Let’s talk <ArrowUpRight size={15} aria-hidden="true" /></a>
      <button ref={trigger} className={s.menuToggle} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="engineering-menu" onClick={() => setOpen(!open)}>{open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}</button>
      <nav id="engineering-menu" aria-label="Mobile engineering navigation" className={s.mobileNav} hidden={!open}>{links.map(([label, id], index) => <a key={id} ref={index === 0 ? first : undefined} href={`#${id}`} onClick={() => { setOpen(false); trigger.current?.focus(); }}>{label}</a>)}<Link href="/business" onClick={() => setOpen(false)}>Instructional design</Link></nav>
    </div>
  </header>;
}

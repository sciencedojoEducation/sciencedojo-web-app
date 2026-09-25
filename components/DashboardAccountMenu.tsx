"use client";

import Link from "next/link";
import { ChevronUp, ExternalLink, LogOut } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { signOut } from "@/app/login/actions";
import DashboardAvatar from "./DashboardAvatar";

interface DashboardAccountMenuProps {
  userName: string;
  displayRole: string;
  avatarUrl?: string;
  onNavigate?: () => void;
  appearance?: "dark" | "light";
}

export default function DashboardAccountMenu({
  userName,
  displayRole,
  avatarUrl,
  onNavigate,
  appearance = "dark",
}: DashboardAccountMenuProps) {
  const light = appearance === "light";
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstActionRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const trigger = triggerRef.current;
    firstActionRef.current?.focus();

    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current?.contains(event.target as Node)) return;
      setIsOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      setIsOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      trigger?.focus({ preventScroll: true });
    };
  }, [isOpen]);

  return (
    <div ref={rootRef} className="relative">
      {isOpen && (
        <div
          id={menuId}
          data-account-menu-open="true"
          role="group"
          aria-label="Account actions"
          className={`absolute bottom-full left-0 right-0 z-30 mb-2 rounded-xl border p-1.5 shadow-xl shadow-slate-950/10 ${light ? "border-[var(--student-line)] bg-[var(--student-surface)]" : "border-slate-200 bg-white"}`}
        >
          <Link
            ref={firstActionRef}
            href="/"
            onClick={() => {
              setIsOpen(false);
              onNavigate?.();
            }}
            className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 ${light ? "text-[var(--student-ink-soft)] hover:bg-[var(--student-accent-soft)] focus-visible:ring-[var(--student-accent)]" : "text-slate-700 hover:bg-slate-50 focus-visible:ring-[#1E5AA8]"}`}
          >
            <ExternalLink className="h-4 w-4 text-slate-500" aria-hidden="true" />
            View site
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium focus-visible:outline-none focus-visible:ring-2 ${light ? "text-[var(--student-ink-soft)] hover:bg-[var(--student-accent-soft)] focus-visible:ring-[var(--student-accent)]" : "text-slate-700 hover:bg-slate-50 focus-visible:ring-[#1E5AA8]"}`}
            >
              <LogOut className="h-4 w-4 text-slate-500" aria-hidden="true" />
              Log out
            </button>
          </form>
        </div>
      )}
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Account options for ${userName}`}
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        onClick={() => setIsOpen((open) => !open)}
        className={`flex min-h-12 w-full items-center gap-2.5 rounded-xl px-2 text-left focus-visible:outline-none focus-visible:ring-2 ${light ? "hover:bg-[var(--student-accent-soft)] focus-visible:ring-[var(--student-accent)]" : "hover:bg-white/10 focus-visible:ring-cyan-300"}`}
      >
        <span className={`h-9 w-9 shrink-0 overflow-hidden rounded-xl border ${light ? "border-[var(--student-line)] bg-[var(--student-accent-soft)] text-[var(--student-accent)]" : "border-white/15 bg-white/10 text-white"}`}>
          <DashboardAvatar src={avatarUrl} name={userName} fallbackLabel={displayRole} />
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block truncate text-sm font-semibold ${light ? "text-[var(--student-ink)]" : "text-white"}`}>{userName}</span>
          <span className={`block text-xs capitalize ${light ? "text-[var(--student-muted-soft)]" : "text-slate-300"}`}>{displayRole}</span>
        </span>
        <ChevronUp className={`h-4 w-4 shrink-0 transition-transform ${light ? "text-[var(--student-muted-soft)]" : "text-slate-300"} ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
    </div>
  );
}

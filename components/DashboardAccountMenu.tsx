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
}

export default function DashboardAccountMenu({
  userName,
  displayRole,
  avatarUrl,
  onNavigate,
}: DashboardAccountMenuProps) {
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
          className="absolute bottom-full left-0 right-0 z-30 mb-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-950/10"
        >
          <Link
            ref={firstActionRef}
            href="/"
            onClick={() => {
              setIsOpen(false);
              onNavigate?.();
            }}
            className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E5AA8]"
          >
            <ExternalLink className="h-4 w-4 text-slate-500" aria-hidden="true" />
            View site
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E5AA8]"
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
        className="flex min-h-12 w-full items-center gap-2.5 rounded-xl px-2 text-left hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E5AA8]"
      >
        <span className="h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-[#1E5AA8]/10 text-[#1E5AA8]">
          <DashboardAvatar src={avatarUrl} name={userName} fallbackLabel={displayRole} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-slate-800">{userName}</span>
          <span className="block text-xs capitalize text-slate-500">{displayRole}</span>
        </span>
        <ChevronUp className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { PointerEvent } from "react";
import DashboardTourReplayButton from "./DashboardTourReplayButton";
import { signOut } from "@/app/login/actions";

type DashboardMobileNavLink = {
  name: string;
  href: string;
  icon: string;
  badge?: number;
  badgeColor?: string;
  exact?: boolean;
  tourId?: string;
};

type DashboardMobileDrawerProps = {
  role: "user" | "admin" | "tutor" | "parent" | "student" | "internal";
  displayRole: string;
  userName: string;
  avatarUrl?: string;
  links: DashboardMobileNavLink[];
};

function getFocusableElements(root: HTMLElement | null) {
  if (!root) return [];

  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute("disabled") && element.offsetParent !== null);
}

export default function DashboardMobileDrawer({
  role,
  displayRole,
  userName,
  avatarUrl,
  links,
}: DashboardMobileDrawerProps) {
  const pathname = usePathname();
  const drawerId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const touchOpenLockRef = useRef(false);
  const dashboardHref = role === "admin" ? "/dashboard/admin" : role === "internal" ? "/dashboard/internal" : role === "tutor" ? "/dashboard/tutor" : role === "student" ? "/dashboard/student" : role === "user" ? "/dashboard/user" : "/dashboard/parent";

  const openDrawer = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleTriggerPointerDown = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== "touch" && event.pointerType !== "pen") {
      return;
    }

    event.preventDefault();
    touchOpenLockRef.current = true;
    openDrawer();

    window.setTimeout(() => {
      touchOpenLockRef.current = false;
    }, 450);
  }, [openDrawer]);

  const handleTriggerClick = useCallback(() => {
    if (touchOpenLockRef.current) {
      return;
    }

    openDrawer();
  }, [openDrawer]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    getFocusableElements(drawerRef.current)[0]?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        return;
      }

      if (event.key !== "Tab") return;

      const elements = getFocusableElements(drawerRef.current);
      if (elements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = elements[0];
      const lastElement = elements[elements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      triggerRef.current?.focus();
    };
  }, [isOpen]);

  function isActiveLink(link: DashboardMobileNavLink) {
    return link.exact ? pathname === link.href : pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(`${link.href}/`));
  }

  const utilityRowClass = "flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white/70 px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 transition-all hover:border-[#1E5AA8]/20 hover:bg-[#1E5AA8]/5 hover:text-[#1E5AA8] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E5AA8] focus-visible:ring-offset-2";

  return (
    <div className="lg:hidden">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/92 px-3 py-2.5 shadow-sm backdrop-blur-xl sm:px-4 sm:py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              ref={triggerRef}
              type="button"
              aria-label="Open dashboard menu"
              aria-controls={drawerId}
              aria-expanded={isOpen}
              onPointerDown={handleTriggerPointerDown}
              onClick={handleTriggerClick}
              style={{ WebkitTapHighlightColor: "transparent" }}
              className="pointer-events-auto relative z-[70] inline-flex h-11 w-11 shrink-0 cursor-pointer touch-manipulation items-center justify-center rounded-2xl border border-slate-200 bg-white text-[#001A3D] shadow-sm transition-colors hover:bg-[#1E5AA8]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E5AA8] focus-visible:ring-offset-2 sm:h-11 sm:w-11"
            >
              <span className="flex h-4 w-5 flex-col justify-between" aria-hidden="true">
                <span className="h-0.5 rounded-full bg-current" />
                <span className="h-0.5 rounded-full bg-current" />
                <span className="h-0.5 rounded-full bg-current" />
              </span>
            </button>

            <Link href={dashboardHref} className="min-w-0 text-xl font-black tracking-tight text-[#001A3D] sm:text-2xl">
              science<span className="text-[#0066FF]">dojo</span><span className="text-[#00CFE8]">.</span>
            </Link>
          </div>

          <span className="shrink-0 rounded-full border border-[#1E5AA8]/10 bg-[#1E5AA8]/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#1E5AA8] sm:px-3 sm:text-[10px] sm:tracking-[0.14em]">
            {displayRole}
          </span>
        </div>
      </header>

      {isOpen && (
        <div className="fixed inset-0 z-[90]">
          <button
            type="button"
            aria-label="Close dashboard menu"
            className="absolute inset-0 h-full w-full bg-slate-950/45 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          <div
            ref={drawerRef}
            id={drawerId}
            role="dialog"
            aria-modal="true"
            aria-label="Dashboard navigation"
            className="relative flex h-full w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-r-[2rem] border-r border-white/70 bg-slate-50 shadow-2xl shadow-slate-950/25"
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white/86 px-4 py-3.5 backdrop-blur-xl">
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#1E5AA8]/70">Dashboard</p>
                <h2 className="mt-0.5 truncate text-lg font-black text-[#001A3D]">{displayRole} space</h2>
              </div>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-xl leading-none text-slate-500 shadow-sm transition-colors hover:bg-slate-100 hover:text-[#001A3D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E5AA8] focus-visible:ring-offset-2"
              >
                ×
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3.5">
              <div className="mb-3 flex items-center gap-3 rounded-[1.35rem] border border-slate-200/80 bg-white/88 p-3 shadow-sm">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-2xl border border-white bg-[#1E5AA8]/10 text-[#1E5AA8] shadow-sm">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-black">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black leading-tight text-[#001A3D]">{userName}</p>
                  <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">Verified {displayRole}</p>
                </div>
              </div>

              <nav className="space-y-1" aria-label="Dashboard">
                {links.map((link) => {
                  const isActive = isActiveLink(link);

                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      data-tour={link.tourId}
                      onClick={() => setIsOpen(false)}
                      className={`group relative flex min-h-12 items-center gap-3 rounded-[1.15rem] border px-3.5 py-2.5 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E5AA8] focus-visible:ring-offset-2 ${
                        isActive
                          ? "border-slate-200 bg-[#1E5AA8]/7 text-[#1E5AA8] shadow-[inset_0_0_20px_rgba(30,90,168,0.035)]"
                          : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-[#001A3D]"
                      }`}
                    >
                      {isActive && <span className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-full bg-[#6FE3D6]" />}
                      <span className="text-base leading-none" aria-hidden="true">{link.icon}</span>
                      <span className="min-w-0 flex-1">{link.name}</span>
                      {link.badge !== undefined && link.badge > 0 && (
                        <span className={`min-w-[1.4rem] rounded-full px-2 py-0.5 text-center text-[10px] font-black ${link.badgeColor || "bg-[#1E5AA8] text-white"}`}>
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-2 space-y-2 border-t border-slate-200/70 pt-2">
                {role !== "admin" && (
                  <DashboardTourReplayButton
                    onReplay={() => setIsOpen(false)}
                    className={utilityRowClass}
                    iconClassName="text-base leading-none"
                  />
                )}
                <Link
                  href="/"
                  onClick={() => setIsOpen(false)}
                  className={utilityRowClass}
                >
                  <span className="text-base" aria-hidden="true">🚪</span>
                  Exit to Site
                </Link>

                <form action={signOut} className="border-t border-slate-200/70 pt-2">
                  <button
                    type="submit"
                    className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-slate-200/70 bg-white/55 px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 transition-all hover:border-slate-300 hover:bg-white hover:text-[#001A3D] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E5AA8] focus-visible:ring-offset-2"
                  >
                    <span className="text-base leading-none" aria-hidden="true">↳</span>
                    Log Out
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { DashboardMenuBadge } from "./DashboardBadgeProvider";
import DashboardTourReplayButton from "./DashboardTourReplayButton";
import DashboardAccountMenu from "./DashboardAccountMenu";
import DashboardNavIcon from "./DashboardNavIcon";
import type { DashboardRole } from "@/lib/dashboard-badges";
import { isDashboardNavItemActive, type DashboardNavSection } from "@/lib/dashboard-navigation";

interface DashboardMobileDrawerProps {
  role: DashboardRole;
  displayRole: string;
  userName: string;
  avatarUrl?: string;
  sections: DashboardNavSection[];
}

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
  sections,
}: DashboardMobileDrawerProps) {
  const pathname = usePathname();
  const drawerId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const touchOpenLockRef = useRef(false);
  const hasTour = role === "parent" || role === "student" || role === "tutor";
  const dashboardHref = role === "admin" ? "/dashboard/admin" : role === "internal" ? "/dashboard/internal" : role === "tutor" ? "/dashboard/tutor" : role === "student" ? "/dashboard/student" : role === "user" ? "/dashboard/user" : "/dashboard/parent";

  const openDrawer = useCallback(() => setIsOpen(true), []);

  const handleTriggerPointerDown = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== "touch" && event.pointerType !== "pen") return;
    event.preventDefault();
    touchOpenLockRef.current = true;
    openDrawer();
    window.setTimeout(() => { touchOpenLockRef.current = false; }, 450);
  }, [openDrawer]);

  const handleTriggerClick = useCallback(() => {
    if (!touchOpenLockRef.current) openDrawer();
  }, [openDrawer]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const trigger = triggerRef.current;
    document.body.style.overflow = "hidden";
    getFocusableElements(drawerRef.current)[0]?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (drawerRef.current?.querySelector('[data-account-menu-open="true"]')) return;
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
      trigger?.focus();
    };
  }, [isOpen]);

  return (
    <div className="lg:hidden">
      <header className="dashboard-mobile-header sticky top-0 z-50 border-b border-white/10 px-3 py-2.5 sm:px-4 sm:py-3">
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
              className="pointer-events-auto relative z-[70] inline-flex h-11 w-11 shrink-0 cursor-pointer touch-manipulation items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              <span className="flex h-4 w-5 flex-col justify-between" aria-hidden="true">
                <span className="h-0.5 rounded-full bg-current" />
                <span className="h-0.5 rounded-full bg-current" />
                <span className="h-0.5 rounded-full bg-current" />
              </span>
            </button>
            <Link href={dashboardHref} className="min-w-0 text-xl font-bold tracking-tight text-white sm:text-2xl">
              science<span className="text-cyan-200">dojo</span><span className="text-cyan-300">.</span>
            </Link>
          </div>
          <span className="shrink-0 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-semibold capitalize text-slate-100 sm:px-3">
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
            className="dashboard-sidebar relative flex h-full w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-r-2xl border-r border-white/10 shadow-2xl shadow-slate-950/25"
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3.5">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-300">Dashboard</p>
                <h2 className="mt-0.5 truncate text-lg font-bold capitalize text-white">{displayRole} space</h2>
              </div>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-xl leading-none text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                ×
              </button>
            </div>

            <nav aria-label={`${displayRole} navigation`} className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-3.5">
              {sections.map((section) => (
                <section key={section.title} aria-label={section.title}>
                  <h3 className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-300">{section.title}</h3>
                  <div className="space-y-0.5">
                    {section.items.map((link) => {
                      const isActive = isDashboardNavItemActive(pathname, link);
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          data-tour={link.tourId}
                          aria-current={isActive ? "page" : undefined}
                          onClick={() => setIsOpen(false)}
                          className={`group flex min-h-11 items-center gap-2.5 rounded-xl px-2.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                            isActive ? "bg-white/14 font-semibold text-white" : "font-medium text-slate-200 hover:bg-white/8 hover:text-white"
                          }`}
                        >
                          <span className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg ${
                            isActive ? "bg-cyan-300/20 text-cyan-200 ring-1 ring-cyan-200/40" : "bg-white/8 text-slate-200 group-hover:bg-white/12 group-hover:text-white"
                          }`} aria-hidden="true">
                            <DashboardNavIcon name={link.iconName} />
                          </span>
                          <span className="min-w-0 flex-1 truncate">{link.name}</span>
                          <DashboardMenuBadge badgeKey={link.badgeKey} label={link.name} />
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ))}
            </nav>

            <div className="shrink-0 space-y-2 border-t border-white/10 bg-white/[0.035] p-3">
              {hasTour && (
                <DashboardTourReplayButton
                  onReplay={() => setIsOpen(false)}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                />
              )}
              <DashboardAccountMenu
                userName={userName}
                displayRole={displayRole}
                avatarUrl={avatarUrl}
                onNavigate={() => setIsOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

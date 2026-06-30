"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import BookAssessmentLink from "@/components/analytics/BookAssessmentLink";
import { signOut } from "@/app/login/actions";

const navLinkClass =
  "rounded-2xl border border-transparent px-4 py-3 text-sm font-medium text-secondary/80 transition-colors hover:border-primary/10 hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

const utilityLinkClass =
  "rounded-2xl border border-transparent px-4 py-3 text-sm font-medium text-secondary/70 transition-colors hover:border-secondary/10 hover:bg-secondary/5 hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

type MobileNavbarMenuProps = {
  isLoggedIn?: boolean;
  dashboardHref?: string;
  showTutorMarketplace?: boolean;
  showLearningHub?: boolean;
  showPracticeDojo?: boolean;
  showFreeAssessment?: boolean;
};

export default function MobileNavbarMenu({
  isLoggedIn = false,
  dashboardHref = "/dashboard/parent",
  showTutorMarketplace = true,
  showLearningHub = true,
  showPracticeDojo = true,
  showFreeAssessment = true,
}: MobileNavbarMenuProps) {
  const pathname = usePathname();
  const menuId = useId();
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement>(null);
  const routeClosingRef = useRef(false);
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = useCallback(() => {
    if (detailsRef.current) {
      detailsRef.current.open = false;
    }
    setIsOpen(false);
  }, []);

  useEffect(() => {
    routeClosingRef.current = true;
    closeMenu();
    window.requestAnimationFrame(() => {
      routeClosingRef.current = false;
    });
  }, [pathname, closeMenu]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    getFocusableElements(drawerRef.current)[0]?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

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
      if (!routeClosingRef.current) {
        triggerRef.current?.focus();
      }
    };
  }, [isOpen]);

  return (
    <details
      ref={detailsRef}
      className="group pointer-events-auto md:hidden"
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
    >
      <summary
        ref={triggerRef}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-controls={menuId}
        aria-expanded={isOpen}
        style={{ WebkitTapHighlightColor: "transparent" }}
        className="pointer-events-auto relative z-[100] inline-flex h-12 w-12 shrink-0 cursor-pointer touch-manipulation list-none items-center justify-center rounded-2xl border border-secondary/10 bg-white text-secondary shadow-sm transition-colors hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 md:hidden [&::-webkit-details-marker]:hidden"
      >
        <span className="sr-only">{isOpen ? "Close menu" : "Open menu"}</span>
        <span className="relative flex h-3.5 w-5 flex-col justify-between" aria-hidden="true">
          <span className="h-0.5 rounded-full bg-current transition-transform group-open:translate-y-[7px] group-open:rotate-45"></span>
          <span className="h-0.5 rounded-full bg-current transition-opacity group-open:opacity-0"></span>
          <span className="h-0.5 rounded-full bg-current transition-transform group-open:-translate-y-[7px] group-open:-rotate-45"></span>
        </span>
      </summary>

      <div
        className="fixed bottom-0 left-0 right-0 top-20 z-[45] hidden h-[calc(100dvh-5rem)] bg-secondary/35 backdrop-blur-sm group-open:block"
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) {
            closeMenu();
          }
        }}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            closeMenu();
          }
        }}
      >
        <div
          id={menuId}
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
          className="mr-auto flex h-full min-h-full w-[min(82vw,24rem)] flex-col border-r border-secondary/10 bg-white px-4 pb-8 pt-6 shadow-2xl"
        >
          <nav className="grid gap-1.5" aria-label="Mobile primary navigation">
            {showTutorMarketplace && (
              <Link href="/#directory" onClick={closeMenu} className={navLinkClass}>
                Find Tutors
              </Link>
            )}
            {showLearningHub && (
              <Link href="/learning-hub" onClick={closeMenu} className={navLinkClass}>
                Learning Hub
              </Link>
            )}
            {showPracticeDojo && (
              <Link href="/ai-practice-studio" onClick={closeMenu} className={navLinkClass}>
                Practice Dojo
              </Link>
            )}
            {showFreeAssessment && (
              <BookAssessmentLink source="navbar_mobile" onClick={closeMenu} className={navLinkClass}>
                Request Free Assessment
              </BookAssessmentLink>
            )}
            {isLoggedIn && (
              <Link href={dashboardHref} onClick={closeMenu} className={navLinkClass}>
                Dashboard
              </Link>
            )}
          </nav>

          <div className="mt-auto grid gap-2.5 border-t border-secondary/10 pt-5">
            {isLoggedIn ? (
              <form action={signOut}>
                <button
                  type="submit"
                  className="w-full rounded-2xl border border-transparent px-4 py-3 text-left text-sm font-medium text-secondary/70 transition-colors hover:border-secondary/10 hover:bg-secondary/5 hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  Log out
                </button>
              </form>
            ) : (
              <>
                <Link href="/login" onClick={closeMenu} className={utilityLinkClass}>
                  Log in
                </Link>
                <Link
                  href="/signup"
                  onClick={closeMenu}
                  className="rounded-2xl bg-accent px-4 py-3 text-center text-sm font-bold text-white shadow-lg shadow-accent/15 transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </details>
  );
}

function getFocusableElements(container: HTMLElement | null) {
  if (!container) {
    return [];
  }

  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute("disabled") && element.offsetParent !== null);
}

"use client";

import Link from "next/link";
import type {
  FocusDojoAccessLevel,
  FocusDojoLockedReason,
} from "@/lib/focusdojo/access-levels";

type FocusDojoUpgradeModalProps = {
  reason: FocusDojoLockedReason;
  currentAccess: FocusDojoAccessLevel;
  itemName?: string;
  onClose: () => void;
};

export default function FocusDojoUpgradeModal({
  reason,
  currentAccess,
  itemName,
  onClose,
}: FocusDojoUpgradeModalProps) {
  const isBasicRequired = reason === "basic_required";
  const title = isBasicRequired
    ? "FocusDojo Basic is included with ScienceDojo learning"
    : "Unlock the full FocusDojo environment";
  const body = isBasicRequired
    ? "Active ScienceDojo students get 3 calming themes and all current background music to support study between lessons."
    : "FocusDojo Pro gives you every visual theme, all current background music, and future premium study environments.";
  const continueLabel =
    currentAccess === "basic" ? "Keep using Basic" : "Continue Free";

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-[var(--fd-bg-secondary)] p-5 text-center shadow-2xl ring-1 ring-[var(--fd-border-primary)]">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--fd-text-tertiary)]">
          {isBasicRequired ? "Included benefit" : "FocusDojo Pro"}
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--fd-text-primary)]">
          {title}
        </h2>
        {itemName && (
          <p className="mt-3 text-sm font-semibold text-[var(--fd-accent-primary)]">
            {itemName}
          </p>
        )}
        <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-[var(--fd-text-secondary)]">
          {body}
        </p>
        <div className="mt-6 grid gap-2">
          {isBasicRequired && (
            <Link
              href="/free-assessment"
              className="rounded-full bg-[var(--fd-bg-tertiary)] px-5 py-3 text-sm font-semibold text-[var(--fd-text-primary)] ring-1 ring-[var(--fd-border-primary)] transition hover:brightness-110"
            >
              Learn with ScienceDojo
            </Link>
          )}
          <Link
            href="/focus-dojo/pricing"
            className="rounded-full bg-[var(--fd-accent-primary)] px-5 py-3 text-sm font-semibold text-[var(--fd-bg-primary)] transition hover:brightness-110"
          >
            Upgrade to Pro
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="pt-2 text-sm font-medium text-[var(--fd-text-secondary)] transition hover:text-[var(--fd-text-primary)]"
          >
            {continueLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Joyride, STATUS } from "react-joyride";
import type { EventData, Step } from "react-joyride";
import { markDashboardTourCompleted } from "@/app/dashboard/tour-actions";
import { parentTour } from "@/src/tours/parentTour";
import { studentTour } from "@/src/tours/studentTour";
import { tutorTour } from "@/src/tours/tutorTour";
import type { DashboardTourRole } from "@/src/tours/types";

type DashboardGuidedTourProps = {
  role: DashboardTourRole | "user" | "admin" | "internal";
  completedTours?: Partial<Record<DashboardTourRole, boolean>>;
};

const tours: Record<DashboardTourRole, Step[]> = {
  student: studentTour,
  parent: parentTour,
  tutor: tutorTour,
};

function getAvailableSteps(steps: Step[]) {
  return steps.filter((step) => {
    if (typeof step.target !== "string") return true;
    return Boolean(document.querySelector(step.target));
  });
}

export default function DashboardGuidedTour({ role, completedTours }: DashboardGuidedTourProps) {
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [hasPromptedAutomatically, setHasPromptedAutomatically] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const tourRole = role === "student" || role === "parent" || role === "tutor" ? role : null;
  const baseSteps = useMemo(() => (tourRole ? tours[tourRole] : []), [tourRole]);
  const roleLabel = tourRole ? `${tourRole.charAt(0).toUpperCase()}${tourRole.slice(1)}` : "";

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const startTour = useCallback(() => {
    if (!tourRole) return;

    window.setTimeout(() => {
      const availableSteps = getAvailableSteps(baseSteps);
      if (availableSteps.length === 0) return;

      setSteps(availableSteps);
      setRun(true);
    }, 450);
  }, [baseSteps, tourRole]);

  useEffect(() => {
    if (!tourRole || hasPromptedAutomatically || completedTours?.[tourRole]) return;

    setHasPromptedAutomatically(true);
    setShowWelcomeModal(true);
  }, [completedTours, hasPromptedAutomatically, tourRole]);

  useEffect(() => {
    const handleReplay = () => {
      setRun(false);
      startTour();
    };

    window.addEventListener("sciencedojo:replay-dashboard-tour", handleReplay);
    return () => window.removeEventListener("sciencedojo:replay-dashboard-tour", handleReplay);
  }, [startTour]);

  const handleEvent = async (data: EventData) => {
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (!finishedStatuses.includes(data.status) || !tourRole) return;

    setRun(false);
    await markDashboardTourCompleted(tourRole);
  };

  const handleStartTour = () => {
    setShowWelcomeModal(false);
    startTour();
  };

  const handleSkipTour = async () => {
    setShowWelcomeModal(false);
    if (tourRole) {
      await markDashboardTourCompleted(tourRole);
    }
  };

  if (!tourRole) return null;

  const welcomeModal = showWelcomeModal ? (
    <div className="fixed inset-0 z-[2147483647] flex min-h-[100dvh] items-center justify-center bg-slate-950/60 backdrop-blur-sm px-5 py-8">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl shadow-slate-950/20 border border-white/70 text-center space-y-6">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-[#1E5AA8]/10 border border-[#6FE3D6]/30 flex items-center justify-center">
          <span className="w-3 h-3 rounded-full bg-[#6FE3D6]" />
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-black tracking-tight text-[#001A3D]">
            Welcome to your {roleLabel} Dashboard
          </h2>
          <p className="text-sm font-bold leading-relaxed text-slate-500">
            Let’s take a quick 30-second tour so you know where everything is.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleStartTour}
            className="w-full rounded-2xl bg-[#1E5AA8] px-5 py-4 text-sm font-black text-white shadow-xl shadow-[#1E5AA8]/20 transition-all hover:bg-[#154C9E] active:scale-[0.98]"
          >
            Start tour
          </button>
          <button
            type="button"
            onClick={handleSkipTour}
            className="w-full rounded-2xl bg-slate-100 px-5 py-4 text-sm font-black text-slate-500 transition-all hover:bg-slate-200 active:scale-[0.98]"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {isMounted && welcomeModal ? createPortal(welcomeModal, document.body) : null}

      <Joyride
        continuous
        onEvent={handleEvent}
        run={run}
        steps={steps}
        locale={{
          back: "Back",
          close: "Finish",
          last: "Finish",
          next: "Next",
          nextWithProgress: "Next",
          skip: "Skip",
        }}
        options={{
          buttons: ["skip", "back", "primary"],
          closeButtonAction: "skip",
          overlayClickAction: false,
          scrollOffset: 90,
          showProgress: true,
          skipBeacon: true,
          width: "min(360px, calc(100vw - 32px))",
        }}
        styles={{
          arrow: {
            color: "#ffffff",
          },
          overlay: {
            fill: "rgba(2, 6, 23, 0.55)",
          },
        tooltip: {
          backgroundColor: "#ffffff",
          borderRadius: 24,
          boxShadow: "0 24px 80px rgba(15, 23, 42, 0.18)",
          padding: 20,
          maxWidth: "calc(100vw - 32px)",
          zIndex: 10000,
        },
          tooltipTitle: {
            color: "#001A3D",
            fontSize: 18,
            fontWeight: 900,
          },
          tooltipContent: {
            color: "rgba(15, 23, 42, 0.72)",
            fontSize: 14,
            fontWeight: 600,
            lineHeight: 1.55,
            padding: "12px 0",
          },
          buttonBack: {
            color: "#64748b",
            fontWeight: 800,
            marginRight: 8,
          },
          buttonPrimary: {
            backgroundColor: "#1E5AA8",
            borderRadius: 999,
            fontWeight: 900,
            padding: "10px 18px",
          },
          buttonSkip: {
            color: "#64748b",
            fontWeight: 800,
          },
        }}
      />
    </>
  );
}

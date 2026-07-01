"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { formatTime } from "@/lib/formatTime";
import FocusRing from "./FocusRing";
import FocusControls from "./FocusControls";
import FocusModeSwitch, { type FocusMode } from "./FocusModeSwitch";
import FocusSoundtrack from "./FocusSoundtrack";
import ExamMode from "./ExamMode";

const FOCUS_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;
const TOTAL_ROUNDS = 4;

type Phase = "focus" | "break";

type TimerState = {
  phase: Phase;
  round: number;
  secondsLeft: number;
  isRunning: boolean;
  /** Epoch ms when the current phase ends; null while paused. */
  endAt: number | null;
};

type TimerAction =
  | { type: "START" }
  | { type: "PAUSE" }
  | { type: "RESET" }
  | { type: "TICK"; now: number };

function initialState(): TimerState {
  return {
    phase: "focus",
    round: 1,
    secondsLeft: FOCUS_SECONDS,
    isRunning: false,
    endAt: null,
  };
}

/** Focus Mode timer — the Pomodoro 25/5 cycle across four rounds.
 *  Exam Mode has its own, separate timer in ExamMode. */
function timerReducer(state: TimerState, action: TimerAction): TimerState {
  switch (action.type) {
    case "START": {
      if (state.isRunning || state.secondsLeft <= 0) return state;
      return {
        ...state,
        isRunning: true,
        endAt: Date.now() + state.secondsLeft * 1000,
      };
    }
    case "PAUSE": {
      if (!state.isRunning) return state;
      return { ...state, isRunning: false, endAt: null };
    }
    case "RESET":
      return initialState();
    case "TICK": {
      if (!state.isRunning || state.endAt == null) return state;
      const remaining = Math.round((state.endAt - action.now) / 1000);
      if (remaining > 0) return { ...state, secondsLeft: remaining };

      // The current phase has just ended.
      if (state.phase === "focus") {
        // Focus block done -> short break, same round.
        return {
          ...state,
          phase: "break",
          secondsLeft: BREAK_SECONDS,
          endAt: action.now + BREAK_SECONDS * 1000,
        };
      }
      // Break done.
      if (state.round < TOTAL_ROUNDS) {
        return {
          ...state,
          phase: "focus",
          round: state.round + 1,
          secondsLeft: FOCUS_SECONDS,
          endAt: action.now + FOCUS_SECONDS * 1000,
        };
      }
      // All four rounds complete — settle back to a fresh focus session.
      return initialState();
    }
    default:
      return state;
  }
}

/** Main client component: owns the active mode and shared fullscreen state,
 *  then hands off to Focus Mode or Exam Mode. */
export default function FocusTimer() {
  const [state, dispatch] = useReducer(timerReducer, undefined, initialState);
  const [mode, setMode] = useState<FocusMode>("focus");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Drive the Focus Mode countdown from a timestamp so it stays accurate
  // across background-tab throttling.
  useEffect(() => {
    if (mode !== "focus" || !state.isRunning) return;
    const id = window.setInterval(
      () => dispatch({ type: "TICK", now: Date.now() }),
      250,
    );
    return () => window.clearInterval(id);
  }, [mode, state.isRunning]);

  // Stay honest if the user leaves fullscreen via Esc or a gesture.
  useEffect(() => {
    const onChange = () =>
      setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () =>
      document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const changeMode = (next: FocusMode) => {
    if (next === mode) return;
    // Leaving Focus Mode resets the Pomodoro; unmounting FocusSoundtrack
    // stops any playing audio. Entering Exam Mode mounts a fresh ExamMode.
    dispatch({ type: "RESET" });
    setMode(next);
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (cardRef.current) {
        await cardRef.current.requestFullscreen();
      }
    } catch {
      // Fullscreen can be unavailable (e.g. iOS Safari) — fail quietly.
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {
      // No-op — already out of fullscreen, or it was blocked.
    }
  };

  const phaseTotal =
    state.phase === "focus" ? FOCUS_SECONDS : BREAK_SECONDS;
  const progress = 1 - state.secondsLeft / phaseTotal;

  const statusText = `${
    state.phase === "focus" ? "Focused Study" : "Short Break"
  } • Round ${state.round}/${TOTAL_ROUNDS}`;

  return (
    <div
      ref={cardRef}
      className={[
        "relative isolate overflow-hidden bg-[var(--fd-bg-primary)] text-[var(--fd-text-primary)]",
        isFullscreen
          ? "flex h-full w-full flex-col items-center justify-center gap-8 rounded-none p-6"
          : "rounded-[32px] p-6 shadow-[var(--fd-shadow-card)] ring-1 ring-[var(--fd-border-primary)] sm:p-8",
      ].join(" ")}
    >
      {/* Decorative glow — calm in Focus Mode, dimmer in the more serious
          Exam Mode. Sits behind content, never intercepts taps. */}
      {mode === "focus" ? (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-[var(--fd-accent-muted)] blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-28 right-0 -z-10 h-72 w-72 rounded-full bg-[var(--fd-bowl-glow)] blur-3xl"
          />
        </>
      ) : (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-[var(--fd-accent-muted)] blur-3xl"
        />
      )}

      {/* Mode switch + status. Hidden in fullscreen (pure focus). */}
      {!isFullscreen && (
        <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <FocusModeSwitch mode={mode} onChange={changeMode} />
          {mode === "focus" && (
            <p className="text-sm font-medium text-white/55">{statusText}</p>
          )}
        </div>
      )}

      {mode === "focus" ? (
        <>
          <div className={isFullscreen ? "" : "mt-8"}>
            <FocusRing progress={progress}>
              <span className="text-5xl font-light tabular-nums tracking-tight text-white sm:text-6xl">
                {formatTime(state.secondsLeft)}
              </span>
            </FocusRing>
          </div>

          <div className={isFullscreen ? "" : "mt-8"}>
            <FocusControls
              context="focus"
              isRunning={state.isRunning}
              isFullscreen={isFullscreen}
              onPlayPause={() =>
                dispatch({ type: state.isRunning ? "PAUSE" : "START" })
              }
              onReset={() => dispatch({ type: "RESET" })}
              onToggleFullscreen={toggleFullscreen}
            />
          </div>

          {/* Audio belongs to Focus Mode only. */}
          <FocusSoundtrack fullscreen={isFullscreen} />
        </>
      ) : (
        <div className={isFullscreen ? "w-full" : "mt-6"}>
          <ExamMode
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
            onExitFullscreen={exitFullscreen}
            onExitToFocus={() => changeMode("focus")}
          />
        </div>
      )}
    </div>
  );
}

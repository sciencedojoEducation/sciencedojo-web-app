"use client";

import { useEffect, useRef, useState } from "react";
import { formatTime } from "@/lib/formatTime";
import FocusControls from "./FocusControls";

const DURATION_PRESETS = [15, 30, 45, 60, 90, 120];
const DEFAULT_DURATION = 60;

type ExamPhase = "setup" | "running" | "complete";
type ExamSessionType =
  | "past-paper"
  | "topic-test"
  | "mock-exam"
  | "question-set";

const SESSION_TYPES: {
  id: ExamSessionType;
  label: string;
  runningLabel: string;
}[] = [
  { id: "past-paper", label: "Past paper", runningLabel: "Past paper practice" },
  { id: "topic-test", label: "Topic test", runningLabel: "Topic test" },
  { id: "mock-exam", label: "Mock exam", runningLabel: "Mock exam" },
  {
    id: "question-set",
    label: "Question set",
    runningLabel: "Timed question set",
  },
];

const FEELINGS = ["Calm", "Focused", "Rushed", "Distracted", "Tired"];
const HARDEST = [
  "Time management",
  "Understanding concepts",
  "Remembering formulas",
  "Writing answers",
  "Checking work",
];

type ExamModeProps = {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onExitFullscreen: () => void;
  onExitToFocus: () => void;
};

/** Exam Mode — serious, quiet, low-stimulation timed practice.
 *
 *  A three-phase flow: setup -> running -> complete. There is deliberately
 *  no audio, no soundtrack UI, no Pomodoro rounds and no break timer here.
 *  This component is only mounted while Focus Zone is in Exam Mode, so
 *  switching away unmounts it entirely. */
export default function ExamMode({
  isFullscreen,
  onToggleFullscreen,
  onExitFullscreen,
  onExitToFocus,
}: ExamModeProps) {
  const [phase, setPhase] = useState<ExamPhase>("setup");

  // Setup choices.
  const [durationMinutes, setDurationMinutes] = useState(DEFAULT_DURATION);
  const [isCustom, setIsCustom] = useState(false);
  const [customValue, setCustomValue] = useState(String(DEFAULT_DURATION));
  const [sessionType, setSessionType] =
    useState<ExamSessionType>("past-paper");

  // Countdown.
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_DURATION * 60);
  const [isRunning, setIsRunning] = useState(false);
  const endAtRef = useRef<number | null>(null);

  // Reflection — selections are held in state and structured for future
  // learning analytics. Nothing is persisted or sent anywhere yet.
  const [showReflection, setShowReflection] = useState(false);
  const [feeling, setFeeling] = useState<string | null>(null);
  const [hardest, setHardest] = useState<string | null>(null);

  const sessionMeta =
    SESSION_TYPES.find((s) => s.id === sessionType) ?? SESSION_TYPES[0];

  // Countdown driven from a timestamp so it stays accurate across throttling.
  useEffect(() => {
    if (!isRunning) return;
    const id = window.setInterval(() => {
      if (endAtRef.current == null) return;
      const remaining = Math.round((endAtRef.current - Date.now()) / 1000);
      if (remaining > 0) {
        setSecondsLeft(remaining);
      } else {
        setSecondsLeft(0);
        setIsRunning(false);
        endAtRef.current = null;
        setPhase("complete");
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [isRunning]);

  // The end-of-exam experience is a calm, full card — leave fullscreen for it.
  useEffect(() => {
    if (phase === "complete" && isFullscreen) onExitFullscreen();
  }, [phase, isFullscreen, onExitFullscreen]);

  const startExam = () => {
    const minutes = isCustom
      ? Math.min(
          300,
          Math.max(1, parseInt(customValue, 10) || durationMinutes),
        )
      : durationMinutes;
    const total = minutes * 60;
    setDurationMinutes(minutes);
    setSecondsLeft(total);
    endAtRef.current = Date.now() + total * 1000;
    setIsRunning(true);
    setPhase("running");
  };

  const togglePlayPause = () => {
    if (isRunning) {
      if (endAtRef.current != null) {
        setSecondsLeft(
          Math.max(0, Math.round((endAtRef.current - Date.now()) / 1000)),
        );
      }
      endAtRef.current = null;
      setIsRunning(false);
    } else {
      if (secondsLeft <= 0) return;
      endAtRef.current = Date.now() + secondsLeft * 1000;
      setIsRunning(true);
    }
  };

  const resetExam = () => {
    endAtRef.current = null;
    setIsRunning(false);
    setSecondsLeft(durationMinutes * 60);
  };

  const restartExam = () => {
    setShowReflection(false);
    setFeeling(null);
    setHardest(null);
    endAtRef.current = null;
    setIsRunning(false);
    setSecondsLeft(durationMinutes * 60);
    setPhase("running");
  };

  const backToSetup = () => {
    endAtRef.current = null;
    setIsRunning(false);
    setPhase("setup");
  };

  const chipBase = "rounded-full px-4 py-2 text-sm font-medium transition";
  const chipActive = "bg-white text-navy";
  const chipIdle =
    "bg-white/8 text-white/60 ring-1 ring-white/10 hover:text-white/90";

  // --- Setup -------------------------------------------------------------
  if (phase === "setup") {
    return (
      <div className="relative z-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
          Exam Mode
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">
          Practice under calm exam conditions
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-white/55">
          Timed practice for past papers, topic tests, and mock exams — quiet
          and distraction-free.
        </p>

        <fieldset className="mt-6">
          <legend className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
            How long is your practice session?
          </legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {DURATION_PRESETS.map((m) => {
              const active = !isCustom && durationMinutes === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setIsCustom(false);
                    setDurationMinutes(m);
                  }}
                  aria-label={`Choose ${m} minute exam duration`}
                  aria-pressed={active}
                  className={`${chipBase} ${active ? chipActive : chipIdle}`}
                >
                  {m} min
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setIsCustom(true)}
              aria-label="Choose a custom exam duration"
              aria-pressed={isCustom}
              className={`${chipBase} ${isCustom ? chipActive : chipIdle}`}
            >
              Custom
            </button>
          </div>
          {isCustom && (
            <div className="mt-3 flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={300}
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                aria-label="Custom exam duration in minutes"
                className="w-24 rounded-xl bg-white/10 px-3 py-2 text-base text-white outline-none ring-1 ring-white/15 focus:ring-white/40"
              />
              <span className="text-sm text-white/55">minutes</span>
            </div>
          )}
        </fieldset>

        <fieldset className="mt-6">
          <legend className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
            What are you practising?
          </legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {SESSION_TYPES.map((s) => {
              const active = sessionType === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSessionType(s.id)}
                  aria-pressed={active}
                  className={`${chipBase} ${active ? chipActive : chipIdle}`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <button
          type="button"
          onClick={startExam}
          aria-label="Start exam timer"
          className="mt-7 w-full rounded-full bg-blue px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.99]"
        >
          Start Exam Timer
        </button>
      </div>
    );
  }

  // --- Running -----------------------------------------------------------
  if (phase === "running") {
    const total = durationMinutes * 60;
    const progress = total > 0 ? 1 - secondsLeft / total : 0;

    return (
      <div className="relative z-10 flex flex-col items-center">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
          Exam Mode
        </p>
        {!isFullscreen && (
          <p className="mt-1 text-sm text-white/55">
            {sessionMeta.runningLabel}
          </p>
        )}

        <p
          className={`mt-5 font-light tabular-nums tracking-tight text-white ${
            isFullscreen ? "text-7xl sm:text-8xl" : "text-6xl sm:text-7xl"
          }`}
        >
          {formatTime(secondsLeft)}
        </p>

        {!isFullscreen && (
          <div className="mt-5 h-1 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-white/30 transition-[width] duration-500"
              style={{
                width: `${Math.min(100, Math.max(0, progress * 100))}%`,
              }}
            />
          </div>
        )}

        <div className="mt-7">
          <FocusControls
            context="exam"
            isRunning={isRunning}
            isFullscreen={isFullscreen}
            onPlayPause={togglePlayPause}
            onReset={resetExam}
            onToggleFullscreen={onToggleFullscreen}
          />
        </div>

        {!isFullscreen && !isRunning && (
          <button
            type="button"
            onClick={backToSetup}
            className="mt-5 text-xs font-medium text-white/45 transition hover:text-white/80"
          >
            Change duration
          </button>
        )}
      </div>
    );
  }

  // --- Complete ----------------------------------------------------------
  return (
    <div className="relative z-10">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
        Exam Mode
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
        Time is up.
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-white/60">
        Take a moment, then review your answers calmly.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setShowReflection((v) => !v)}
          aria-expanded={showReflection}
          className={`${chipBase} ${showReflection ? chipActive : chipIdle}`}
        >
          Review session
        </button>
        <button
          type="button"
          onClick={restartExam}
          aria-label="Restart exam timer"
          className={`${chipBase} ${chipIdle}`}
        >
          Restart timer
        </button>
        <button
          type="button"
          onClick={onExitToFocus}
          className={`${chipBase} ${chipIdle}`}
        >
          Return to Focus Zone
        </button>
      </div>

      {showReflection && (
        <div className="mt-6 rounded-2xl bg-white/[0.05] p-4 ring-1 ring-white/10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
            Optional reflection
          </p>

          <p className="mt-3 text-sm text-white/70">
            How did this session feel?
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {FEELINGS.map((f) => {
              const active = feeling === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFeeling(active ? null : f)}
                  aria-pressed={active}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    active ? chipActive : chipIdle
                  }`}
                >
                  {f}
                </button>
              );
            })}
          </div>

          <p className="mt-4 text-sm text-white/70">What was hardest?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {HARDEST.map((h) => {
              const active = hardest === h;
              return (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHardest(active ? null : h)}
                  aria-pressed={active}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    active ? chipActive : chipIdle
                  }`}
                >
                  {h}
                </button>
              );
            })}
          </div>

          {(feeling || hardest) && (
            <p className="mt-4 text-xs leading-relaxed text-white/45">
              Noted for this session. Reflections like these will shape your
              practice rhythm over time.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { formatDurationLabel, formatTime } from "@/lib/formatTime";
import { trackFocusDojoEvent } from "@/lib/focusAnalytics";
import {
  focusEnvironments,
  type FocusEnvironment,
} from "@/lib/focusEnvironments";
import {
  DEFAULT_THEME,
  EXAM_THEME,
  LEGACY_THEME_STORAGE_KEY,
  THEME_STORAGE_KEY,
  getSelectableTheme,
  type Theme,
  type SelectableThemeId,
} from "@/lib/themes";
import { useTheme } from "@/lib/themeProvider";
import {
  BREAK_MINUTES,
  EXAM_DEFAULT,
  FOCUS_DEFAULT,
  FOCUS_ROUNDS,
  LONG_BREAK_MINUTES,
  PRACTICE_TYPES,
  TRANSITION_MS,
  type PracticeType,
  type SessionConfig,
  type SessionMode,
  type SessionPhase,
  type SessionSummary,
} from "@/lib/session";
import FocusRing from "./FocusRing";
import FocusAtmospherePicker from "./FocusAtmospherePicker";
import FocusTransition from "./FocusTransition";

type TimerSegment = "focus" | "break" | "exam";

type BreakRitualMessages = {
  movement: string;
  hydration: string;
  intention: string;
};

type SavedActiveSession = {
  phase: Extract<SessionPhase, "immersive" | "break" | "long-break" | "ready-prompt">;
  config: SessionConfig;
  segment: TimerSegment;
  round: number;
  secondsLeft: number;
  isRunning: boolean;
  endAt: number | null;
  completedFocusSeconds: number;
  completedSeconds: number;
  pausesUsed: number;
  sessionGoal: string;
  nextSessionGoal: string;
  sessionTitle: string;
  themeId: SelectableThemeId;
  goals: string[];
  startedAt: string;
  savedAt: number;
};

const DISPLAY_NAME_STORAGE_KEY = "focusDojo.displayName";
const NAME_SKIPPED_STORAGE_KEY = "focusDojo.nameSkipped";
const LAST_MODE_STORAGE_KEY = "focusDojo.lastMode";
const EXAM_DURATION_STORAGE_KEY = "focusDojo.examDurationMinutes";
const SESSION_REFLECTIONS_STORAGE_KEY = "focusDojo.sessionReflections";
const ACTIVE_SESSION_STORAGE_KEY = "focusDojo.activeSession";
const COMPLETED_SESSIONS_STORAGE_KEY = "focusDojo.completedSessions";

const SILENCE_ID = "silent";
const EXAM_SILENCE_ID = EXAM_THEME;
const CHIME_SRC = "/audio/focus/sound%20effects/Break%20over.mp3";
const ACTIVE_SESSION_MAX_AGE_MS = 30 * 60 * 1000;

const BREAK_MESSAGE_POOLS: Record<keyof BreakRitualMessages, string[]> = {
  movement: [
    "Stand up, stretch, or take a short walk",
    "Walk around for a moment",
    "Relax your shoulders and move gently",
    "Rest your eyes and stretch your back",
  ],
  hydration: [
    "Drink some water",
    "Take a few slow sips of water",
    "Refill your water before the next round",
    "Hydrate gently before you return",
  ],
  intention: [
    "What will you focus on next?",
    "Name the next small study step",
    "Choose one thing for the next round",
    "Set a calm intention for what comes next",
  ],
};

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function readPositiveInt(value: string, fallback: number) {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function focusBreakMinutes(config: SessionConfig) {
  return config.breakMinutes ?? BREAK_MINUTES;
}

function focusRounds(config: SessionConfig) {
  return config.rounds ?? FOCUS_ROUNDS;
}

function plannedSecondsFor(config: SessionConfig) {
  if (config.mode === "exam") return config.durationMinutes * 60;
  const rounds = focusRounds(config);
  return (
    config.durationMinutes * 60 * rounds +
    focusBreakMinutes(config) * 60 * Math.max(0, rounds - 1)
  );
}

function plannedFocusSecondsFor(config: SessionConfig) {
  return config.mode === "exam"
    ? config.durationMinutes * 60
    : config.durationMinutes * 60 * focusRounds(config);
}

function formatPrepClock(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0",
  )}:${String(seconds).padStart(2, "0")}`;
}

function formatFocusedTime(totalSeconds: number) {
  if (totalSeconds > 0 && totalSeconds < 60) return "< 1 min";
  return formatDurationLabel(totalSeconds);
}

function minutesFromSeconds(seconds: number) {
  return Math.round(Math.max(0, seconds) / 60);
}

function completionPercent(completedSeconds: number, plannedSeconds: number) {
  if (plannedSeconds <= 0) return 0;
  return Math.round(
    Math.min(100, Math.max(0, (completedSeconds / plannedSeconds) * 100)),
  );
}

function modeLabel(mode: SessionMode) {
  return mode === "focus" ? "Focus" : "Exam";
}

function isSessionMode(value: string | null): value is SessionMode {
  return value === "focus" || value === "exam";
}

function environmentAnalyticsId(id: string | null) {
  return id ?? SILENCE_ID;
}

function validSoundEnvironmentId(
  id: string | null | undefined,
  environments: FocusEnvironment[] = focusEnvironments,
) {
  if (!id) return null;
  return environments.some((environment) => environment.id === id)
    ? id
    : null;
}

function sessionEnvironmentId(
  config: SessionConfig,
  environments: FocusEnvironment[] = focusEnvironments,
) {
  return config.mode === "exam"
    ? EXAM_SILENCE_ID
    : environmentAnalyticsId(
        validSoundEnvironmentId(config.soundEnvironmentId, environments),
      );
}

function isPersistableFocusPhase(
  phase: SessionPhase,
): phase is SavedActiveSession["phase"] {
  return (
    phase === "immersive" ||
    phase === "break" ||
    phase === "long-break" ||
    phase === "ready-prompt"
  );
}

function chooseFromPool(pool: string[], previous?: string) {
  const choices = pool.filter((item) => item !== previous);
  const usable = choices.length > 0 ? choices : pool;
  return usable[Math.floor(Math.random() * usable.length)] ?? pool[0] ?? "";
}

function chooseBreakRitualMessages(
  previous?: BreakRitualMessages,
): BreakRitualMessages {
  return {
    movement: chooseFromPool(BREAK_MESSAGE_POOLS.movement, previous?.movement),
    hydration: chooseFromPool(BREAK_MESSAGE_POOLS.hydration, previous?.hydration),
    intention: chooseFromPool(BREAK_MESSAGE_POOLS.intention, previous?.intention),
  };
}

function EnvironmentButtons({
  environments,
  selectedId,
  onSelect,
}: {
  environments: FocusEnvironment[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const options = [
    { id: null, title: "Silent Focus" },
    ...environments.map((environment) => ({
      id: environment.id,
      title: environment.title,
    })),
  ];

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {options.map((option) => {
        const active =
          option.id === validSoundEnvironmentId(selectedId, environments);
        return (
          <button
            key={option.id ?? SILENCE_ID}
            type="button"
            onClick={() => onSelect(option.id)}
            aria-pressed={active}
            className={`rounded-full px-3 py-2 text-xs font-medium transition ${
              active
                ? "bg-[var(--fd-accent)] text-[var(--fd-bg-to)] shadow-sm"
                : "bg-[var(--fd-bg-tertiary)] text-[var(--fd-text-secondary)] ring-1 ring-[var(--fd-border-primary)] hover:brightness-110 hover:text-[var(--fd-text-primary)]"
            }`}
          >
            {option.title}
          </button>
        );
      })}
    </div>
  );
}

function ModePill({
  mode,
  current,
  onSelect,
}: {
  mode: SessionMode;
  current: SessionMode;
  onSelect: (mode: SessionMode) => void;
}) {
  const active = current === mode;
  return (
    <button
      type="button"
      onClick={() => onSelect(mode)}
      aria-pressed={active}
      className={`min-w-20 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] transition ${
        active
          ? "bg-[var(--fd-accent)] text-[var(--fd-bg-to)]"
          : "text-white/38 hover:bg-white/8 hover:text-white/70"
      }`}
    >
      {modeLabel(mode)}
    </button>
  );
}

type FocusZoneProps = {
  standalone?: boolean;
  initialDisplayName?: string;
  accessLevel?: "member" | "guest";
  shellMode?: "default" | "framed";
};

function sanitizeDisplayName(name?: string | null) {
  return name?.trim().slice(0, 32) ?? "";
}

export default function FocusZone({
  standalone = false,
  initialDisplayName,
  accessLevel = "member",
  shellMode = "default",
}: FocusZoneProps) {
  const {
    setTheme,
    previewTheme,
    restoreTheme,
    enterExamMode,
    exitExamMode,
  } = useTheme();
  const allowedEnvironments = useMemo<FocusEnvironment[]>(() => {
    if (accessLevel === "member") return focusEnvironments;
    const deepFocus = focusEnvironments.find(
      (environment) => environment.id === "deep-focus",
    );
    if (!deepFocus) return [];
    return [
      {
        ...deepFocus,
        tracks: deepFocus.tracks.slice(0, 1),
      },
    ];
  }, [accessLevel]);
  const defaultSoundEnvironmentId = allowedEnvironments[0]?.id ?? null;
  const [phase, setPhase] = useState<SessionPhase>("name");
  const [hasLoaded, setHasLoaded] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [nameSkipped, setNameSkipped] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [config, setConfig] = useState<SessionConfig>({
    mode: "focus",
    durationMinutes: FOCUS_DEFAULT,
    breakMinutes: BREAK_MINUTES,
    rounds: FOCUS_ROUNDS,
    soundEnvironmentId: defaultSoundEnvironmentId,
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [segment, setSegment] = useState<TimerSegment>("focus");
  const [round, setRound] = useState(1);
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_DEFAULT * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [practiceType, setPracticeType] = useState<PracticeType | null>(null);
  const [examHours, setExamHours] = useState(String(Math.floor(EXAM_DEFAULT / 60)));
  const [examMinutes, setExamMinutes] = useState(String(EXAM_DEFAULT % 60));
  const [sessionTitle, setSessionTitle] = useState("");
  const [themeId, setThemeId] = useState<SelectableThemeId>(DEFAULT_THEME);
  const [sessionGoal, setSessionGoal] = useState("");
  const [nextSessionGoal, setNextSessionGoal] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [completedFocusSeconds, setCompletedFocusSeconds] = useState(0);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [pendingResume, setPendingResume] = useState<SavedActiveSession | null>(null);
  const [proGateTheme, setProGateTheme] = useState<Theme | null>(null);
  const [themePreviewing, setThemePreviewing] = useState(false);
  const [atmospheresOpen, setAtmospheresOpen] = useState(false);
  const [breakRitualMessages, setBreakRitualMessages] =
    useState<BreakRitualMessages>(() => chooseBreakRitualMessages());

  const cardRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const chimeRef = useRef<HTMLAudioElement>(null);
  const endAtRef = useRef<number | null>(null);
  const completedSecondsRef = useRef(0);
  const pausesUsedRef = useRef(0);
  const transitionTimeoutRef = useRef<number | null>(null);

  const selectedTrack = useMemo(() => {
    if (config.mode === "exam") return null;
    const environmentId = validSoundEnvironmentId(
      config.soundEnvironmentId,
      allowedEnvironments,
    );
    if (!environmentId) return null;
    return (
      allowedEnvironments.find(
        (environment) => environment.id === environmentId,
      )?.tracks[0] ?? null
    );
  }, [allowedEnvironments, config.mode, config.soundEnvironmentId]);

  const plannedSeconds = plannedSecondsFor(config);
  const activeSegmentSeconds =
    phase === "long-break"
      ? LONG_BREAK_MINUTES * 60
      : segment === "break"
        ? focusBreakMinutes(config) * 60
        : config.durationMinutes * 60;
  const progress =
    activeSegmentSeconds > 0 ? 1 - secondsLeft / activeSegmentSeconds : 0;
  const greeting = displayName ? `Hey ${displayName} 👋🙂` : "Hey there 👋🙂";
  const transitionLine =
    config.mode === "exam"
      ? "Take it one question at a time."
      : "Stay present and keep going.";
  const isSoundPlaying = Boolean(
    config.mode === "focus" && selectedTrack && phase === "immersive" && isRunning,
  );
  const shouldShowNameScreen =
    hasLoaded && (phase === "name" || isEditingName) && (!displayName || nameSkipped || isEditingName);
  const currentGoal = sessionGoal.trim();
  const currentTitle = sessionTitle.trim();
  const immersiveLabel =
    config.mode === "exam"
      ? currentTitle
        ? `${currentTitle} • EXAM PRACTICE`
        : "EXAM PRACTICE"
      : currentGoal || currentTitle
        ? `${currentGoal || currentTitle} • ROUND ${round}/${focusRounds(config)}`
        : `FOCUSED STUDY • ROUND ${round}/${focusRounds(config)}`;

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current != null) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
      audioRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    if (proGateTheme) return;
    const examPhases: SessionPhase[] = [
      "exam-setup",
      "transition",
      "immersive",
      "summary",
    ];
    const shouldUseExamTheme =
      config.mode === "exam" && examPhases.includes(phase);
    if (shouldUseExamTheme) {
      enterExamMode();
    } else {
      exitExamMode();
    }
  }, [config.mode, enterExamMode, exitExamMode, phase, proGateTheme]);

  useEffect(() => {
    if (!proGateTheme || !themePreviewing) return;
    const id = window.setTimeout(() => {
      setThemePreviewing(false);
      restoreTheme();
    }, 3000);
    return () => window.clearTimeout(id);
  }, [proGateTheme, restoreTheme, themePreviewing]);

  useEffect(() => {
    const providedName = sanitizeDisplayName(initialDisplayName);
    const storedName = window.localStorage
      .getItem(DISPLAY_NAME_STORAGE_KEY)
      ?.trim()
      .slice(0, 32);
    const skipped =
      window.localStorage.getItem(NAME_SKIPPED_STORAGE_KEY) === "true";
    const storedMode = window.localStorage.getItem(LAST_MODE_STORAGE_KEY);
    const storedTheme =
      window.localStorage.getItem(THEME_STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
    const rememberedExamDuration = clampNumber(
      readPositiveInt(
        window.localStorage.getItem(EXAM_DURATION_STORAGE_KEY) ?? "",
        EXAM_DEFAULT,
      ),
      1,
      300,
    );

    const rememberedName = accessLevel === "member" ? storedName : "";
    const shouldSkipNameScreen = accessLevel === "guest" || skipped;

    if (providedName || rememberedName) {
      const name = providedName || rememberedName || "";
      window.localStorage.setItem(DISPLAY_NAME_STORAGE_KEY, name);
      window.localStorage.removeItem(NAME_SKIPPED_STORAGE_KEY);
      setDisplayName(name);
      setNameInput(name);
      setNameSkipped(false);
    } else {
      setNameSkipped(shouldSkipNameScreen);
    }

    setExamHours(String(Math.floor(rememberedExamDuration / 60)));
    setExamMinutes(String(rememberedExamDuration % 60));
    const rememberedTheme = getSelectableTheme(storedTheme);
    if (rememberedTheme.tier === "free") {
      setThemeId(rememberedTheme.id);
    }

    if (isSessionMode(storedMode)) {
      setConfig((current) => ({
        ...current,
        mode: storedMode,
        durationMinutes:
          storedMode === "exam" ? rememberedExamDuration : FOCUS_DEFAULT,
        breakMinutes: BREAK_MINUTES,
        rounds: FOCUS_ROUNDS,
        soundEnvironmentId:
          storedMode === "focus" ? defaultSoundEnvironmentId : null,
      }));
    }

    try {
      const saved = JSON.parse(
        window.localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY) ?? "null",
      ) as SavedActiveSession | null;
      if (
        saved &&
        saved.config?.mode === "focus" &&
        isPersistableFocusPhase(saved.phase) &&
        Date.now() - saved.savedAt <= ACTIVE_SESSION_MAX_AGE_MS
      ) {
        setPendingResume(saved);
      } else if (saved) {
        window.localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
      }
    } catch {
      window.localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
    }

    setPhase(
      providedName || rememberedName || shouldSkipNameScreen
        ? "session-welcome"
        : "name",
    );
    setHasLoaded(true);
  }, [accessLevel, defaultSoundEnvironmentId, initialDisplayName]);

  useEffect(() => {
    const onChange = () =>
      setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    if (phase === "summary" && isFullscreen) {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => undefined);
      }
      setIsFullscreen(false);
    }
  }, [isFullscreen, phase]);

  useEffect(() => {
    if (isFullscreen) setSettingsOpen(false);
  }, [isFullscreen]);

  useEffect(() => {
    if (!isFullscreen) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyOverscroll = document.body.style.overscrollBehavior;
    const originalHtmlOverscroll =
      document.documentElement.style.overscrollBehavior;
    const originalBodyTouchAction = document.body.style.touchAction;
    const originalHtmlTouchAction = document.documentElement.style.touchAction;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    document.documentElement.style.overscrollBehavior = "none";
    document.body.style.touchAction = "none";
    document.documentElement.style.touchAction = "none";

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overscrollBehavior = originalBodyOverscroll;
      document.documentElement.style.overscrollBehavior = originalHtmlOverscroll;
      document.body.style.touchAction = originalBodyTouchAction;
      document.documentElement.style.touchAction = originalHtmlTouchAction;
    };
  }, [isFullscreen]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (phase !== "immersive" || config.mode !== "focus" || !selectedTrack) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      return;
    }

    audio.load();
    if (isRunning) {
      audio.volume = 1;
      void audio.play().catch(() =>
        trackFocusDojoEvent("app_error", {
          area: "audio",
          code: "play_failed",
        }),
      );
    }
  }, [config.mode, isRunning, phase, selectedTrack]);

  useEffect(() => {
    const saveActiveSession = () => {
      if (config.mode !== "focus" || !isPersistableFocusPhase(phase)) return;
      const session: SavedActiveSession = {
        phase,
        config,
        segment,
        round,
        secondsLeft,
        isRunning,
        endAt: endAtRef.current,
        completedFocusSeconds,
        completedSeconds: completedSecondsRef.current,
        pausesUsed: pausesUsedRef.current,
        sessionGoal,
        nextSessionGoal,
        sessionTitle,
        themeId,
        goals,
        startedAt: startedAt ?? new Date().toISOString(),
        savedAt: Date.now(),
      };
      window.localStorage.setItem(
        ACTIVE_SESSION_STORAGE_KEY,
        JSON.stringify(session),
      );
    };

    window.addEventListener("beforeunload", saveActiveSession);
    return () => window.removeEventListener("beforeunload", saveActiveSession);
  }, [
    completedFocusSeconds,
    config,
    goals,
    isRunning,
    nextSessionGoal,
    phase,
    round,
    secondsLeft,
    segment,
    sessionGoal,
    sessionTitle,
    startedAt,
    themeId,
  ]);

  const resetRuntime = () => {
    endAtRef.current = null;
    completedSecondsRef.current = 0;
    pausesUsedRef.current = 0;
    setRound(1);
    setIsRunning(false);
    setSummary(null);
    setPracticeType(null);
    setCompletedFocusSeconds(0);
    setNextSessionGoal("");
    audioRef.current?.pause();
  };

  const playChime = async (times = 1) => {
    const playOnce = async () => {
      const audio = chimeRef.current;
      if (!audio) return;
      try {
        audio.currentTime = 0;
        await audio.play();
      } catch {
        trackFocusDojoEvent("app_error", {
          area: "audio",
          code: "chime_failed",
        });
      }
    };

    await playOnce();
    if (times > 1) {
      window.setTimeout(() => {
        void playOnce();
      }, 3000);
    }
  };

  const fadeOutAmbient = async () => {
    const audio = audioRef.current;
    if (!audio || audio.paused) return;
    const startVolume = audio.volume || 1;
    for (let step = 1; step <= 8; step += 1) {
      window.setTimeout(() => {
        audio.volume = Math.max(0, startVolume * (1 - step / 8));
        if (step === 8) {
          audio.pause();
          audio.volume = 1;
        }
      }, step * 150);
    }
  };

  async function enterBreak(longBreak: boolean) {
    setIsRunning(false);
    endAtRef.current = null;
    await fadeOutAmbient();
    void playChime(1);
    setBreakRitualMessages((previous) => chooseBreakRitualMessages(previous));
    const duration = longBreak ? LONG_BREAK_MINUTES * 60 : focusBreakMinutes(config) * 60;
    setSegment("break");
    setSecondsLeft(duration);
    setPhase(longBreak ? "long-break" : "break");
    endAtRef.current = Date.now() + duration * 1000;
    setIsRunning(true);
  }

  async function completeBreak() {
    completedSecondsRef.current +=
      phase === "long-break" ? LONG_BREAK_MINUTES * 60 : focusBreakMinutes(config) * 60;
    setIsRunning(false);
    endAtRef.current = null;
    setSecondsLeft(0);
    void playChime(phase === "long-break" ? 2 : 1);
    if (phase === "long-break") {
      setPhase("cycle-complete");
      return;
    }
    setPhase("ready-prompt");
  }

  const startFocusRound = (goalOverride?: string) => {
    const cleanGoal = (goalOverride ?? sessionGoal).trim().slice(0, 100);
    if (cleanGoal) {
      setGoals((current) => [...current, cleanGoal]);
    }
    setSessionGoal(cleanGoal);
    setNextSessionGoal("");
    setSegment("focus");
    setSecondsLeft(config.durationMinutes * 60);
    endAtRef.current = Date.now() + config.durationMinutes * 60 * 1000;
    setIsRunning(true);
    setPhase("immersive");
    const audio = audioRef.current;
    if (audio && selectedTrack) {
      audio.volume = 1;
      void audio.play().catch(() =>
        trackFocusDojoEvent("app_error", {
          area: "audio",
          code: "play_failed",
        }),
      );
    }
  };

  const resumeSavedSession = () => {
    if (!pendingResume) return;
    const resumedConfig = {
      ...pendingResume.config,
      soundEnvironmentId:
        pendingResume.config.mode === "focus"
          ? validSoundEnvironmentId(
              pendingResume.config.soundEnvironmentId,
              allowedEnvironments,
            ) ?? defaultSoundEnvironmentId
          : null,
    };
    const adjustedSeconds =
      pendingResume.isRunning && pendingResume.endAt
        ? Math.max(0, Math.round((pendingResume.endAt - Date.now()) / 1000))
        : pendingResume.secondsLeft;
    setConfig(resumedConfig);
    setSegment(pendingResume.segment);
    setRound(pendingResume.round);
    setSecondsLeft(adjustedSeconds);
    setIsRunning(pendingResume.isRunning && adjustedSeconds > 0);
    setCompletedFocusSeconds(pendingResume.completedFocusSeconds);
    completedSecondsRef.current = pendingResume.completedSeconds;
    pausesUsedRef.current = pendingResume.pausesUsed;
    setSessionGoal(pendingResume.sessionGoal);
    setNextSessionGoal(pendingResume.nextSessionGoal);
    setSessionTitle(pendingResume.sessionTitle ?? pendingResume.sessionGoal ?? "");
    setThemeId(getSelectableTheme(pendingResume.themeId).id);
    setGoals(pendingResume.goals);
    setStartedAt(pendingResume.startedAt);
    endAtRef.current =
      pendingResume.isRunning && adjustedSeconds > 0
        ? Date.now() + adjustedSeconds * 1000
        : null;
    setPhase(
      adjustedSeconds > 0
        ? pendingResume.phase
        : pendingResume.phase === "long-break"
          ? "cycle-complete"
          : "ready-prompt",
    );
    setPendingResume(null);
  };

  const discardSavedSession = () => {
    window.localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
    setPendingResume(null);
  };

  const openMode = (mode: SessionMode) => {
    resetRuntime();
    setSettingsOpen(false);
    window.localStorage.setItem(LAST_MODE_STORAGE_KEY, mode);
    trackFocusDojoEvent("mode_selected", { mode });

    if (mode === "focus") {
      const currentSound =
        validSoundEnvironmentId(config.soundEnvironmentId, allowedEnvironments) ??
        defaultSoundEnvironmentId;
      setConfig((current) => ({
        ...current,
        mode,
        durationMinutes: current.mode === "focus" ? current.durationMinutes : FOCUS_DEFAULT,
        breakMinutes: current.breakMinutes ?? BREAK_MINUTES,
        rounds: current.rounds ?? FOCUS_ROUNDS,
        soundEnvironmentId: currentSound,
      }));
      setSegment("focus");
      setSecondsLeft(
        (config.mode === "focus" ? config.durationMinutes : FOCUS_DEFAULT) * 60,
      );
      setPhase("focus-setup");
      return;
    }

    const durationMinutes = clampNumber(
      readPositiveInt(
        window.localStorage.getItem(EXAM_DURATION_STORAGE_KEY) ?? "",
        EXAM_DEFAULT,
      ),
      1,
      300,
    );
    setConfig((current) => ({
      ...current,
      mode,
      durationMinutes,
      soundEnvironmentId: null,
    }));
    setExamHours(String(Math.floor(durationMinutes / 60)));
    setExamMinutes(String(durationMinutes % 60));
    setSegment("exam");
    setSecondsLeft(durationMinutes * 60);
    setPhase("exam-setup");
  };

  const saveDisplayName = () => {
    const trimmed = nameInput.trim().slice(0, 32);
    if (!trimmed) {
      skipDisplayName();
      return;
    }
    window.localStorage.setItem(DISPLAY_NAME_STORAGE_KEY, trimmed);
    window.localStorage.removeItem(NAME_SKIPPED_STORAGE_KEY);
    trackFocusDojoEvent("onboarding_completed");
    setDisplayName(trimmed);
    setNameSkipped(false);
    setIsEditingName(false);
    setPhase("session-welcome");
  };

  const skipDisplayName = () => {
    window.localStorage.removeItem(DISPLAY_NAME_STORAGE_KEY);
    window.localStorage.setItem(NAME_SKIPPED_STORAGE_KEY, "true");
    trackFocusDojoEvent("onboarding_completed");
    setDisplayName(null);
    setNameInput("");
    setNameSkipped(true);
    setIsEditingName(false);
    setPhase("session-welcome");
  };

  const continueFromSessionWelcome = () => {
    const cleanTitle = sessionTitle.trim().slice(0, 100);
    const theme = getSelectableTheme(themeId);
    setSessionTitle(cleanTitle);
    setSessionGoal(cleanTitle);
    setAtmospheresOpen(false);
    setTheme(theme.id);
    setConfig((current) => ({
      ...current,
      soundEnvironmentId:
        current.mode === "exam"
          ? null
          : validSoundEnvironmentId(
              current.soundEnvironmentId,
              allowedEnvironments,
            ),
    }));
    setPhase("mode-select");
  };

  const selectFreeTheme = (id: string) => {
    const theme = getSelectableTheme(id);
    setProGateTheme(null);
    setThemePreviewing(false);
    setThemeId(theme.id);
    setTheme(theme.id);
  };

  const showThemePaywall = (theme: Theme) => {
    setProGateTheme(theme);
    setThemePreviewing(true);
    previewTheme(theme.id);
  };

  const dismissThemePaywall = () => {
    setThemePreviewing(false);
    setProGateTheme(null);
    restoreTheme();
  };

  const updateEnvironment = (id: string | null) => {
    if (config.mode === "exam") return;
    setConfig((current) => ({
      ...current,
      soundEnvironmentId: validSoundEnvironmentId(id, allowedEnvironments),
    }));
    const environmentId = validSoundEnvironmentId(id, allowedEnvironments);
    trackFocusDojoEvent("environment_selected", {
      mode: config.mode,
      environment: environmentAnalyticsId(environmentId),
    });
  };

  const updateFocusDuration = (value: string) => {
    const durationMinutes = clampNumber(readPositiveInt(value, FOCUS_DEFAULT), 1, 120);
    setConfig((current) => ({ ...current, durationMinutes }));
    if (phase === "focus-setup") setSecondsLeft(durationMinutes * 60);
  };

  const updateBreakDuration = (value: string) => {
    setConfig((current) => ({
      ...current,
      breakMinutes: clampNumber(readPositiveInt(value, BREAK_MINUTES), 1, 30),
    }));
  };

  const updateRounds = (value: string) => {
    setConfig((current) => ({
      ...current,
      rounds: clampNumber(readPositiveInt(value, FOCUS_ROUNDS), 1, 8),
    }));
  };

  const setExamTime = () => {
    const hours = clampNumber(readPositiveInt(examHours, 0), 0, 5);
    const minutes = clampNumber(readPositiveInt(examMinutes, 0), 0, 59);
    const durationMinutes = Math.max(1, hours * 60 + minutes);
    setConfig((current) => ({ ...current, durationMinutes }));
    setSecondsLeft(durationMinutes * 60);
    setExamHours(String(Math.floor(durationMinutes / 60)));
    setExamMinutes(String(durationMinutes % 60));
    window.localStorage.setItem(EXAM_DURATION_STORAGE_KEY, String(durationMinutes));
  };

  const resetSetup = () => {
    resetRuntime();
    if (config.mode === "focus") {
      setSegment("focus");
      setSecondsLeft(config.durationMinutes * 60);
      return;
    }
    setSegment("exam");
    setSecondsLeft(config.durationMinutes * 60);
  };

  const startSession = () => {
    const activeConfig =
      config.mode === "exam"
        ? {
            ...config,
            soundEnvironmentId: null,
            durationMinutes: Math.max(
              1,
              clampNumber(readPositiveInt(examHours, 0), 0, 5) * 60 +
                clampNumber(readPositiveInt(examMinutes, 0), 0, 59),
            ),
          }
        : {
            ...config,
            soundEnvironmentId: validSoundEnvironmentId(
              config.soundEnvironmentId,
              allowedEnvironments,
            ),
          };
    const firstSegment = activeConfig.mode === "focus" ? "focus" : "exam";
    const firstSeconds = activeConfig.durationMinutes * 60;

    if (activeConfig.mode === "exam") {
      window.localStorage.setItem(
        EXAM_DURATION_STORAGE_KEY,
        String(activeConfig.durationMinutes),
      );
    }

    setConfig(activeConfig);
    resetRuntime();
    setGoals([]);
    setStartedAt(new Date().toISOString());
    setSegment(firstSegment);
    setSecondsLeft(firstSeconds);
    trackFocusDojoEvent("session_started", {
      mode: activeConfig.mode,
      environment: sessionEnvironmentId(activeConfig, allowedEnvironments),
      plannedMinutes: minutesFromSeconds(plannedSecondsFor(activeConfig)),
    });
    setPhase("transition");

    transitionTimeoutRef.current = window.setTimeout(() => {
      if (activeConfig.mode === "focus") {
        startFocusRound(sessionGoal);
        return;
      }
      endAtRef.current = Date.now() + firstSeconds * 1000;
      setIsRunning(true);
      setPhase("immersive");
    }, TRANSITION_MS);
  };

  const pauseOrResume = () => {
    if (isRunning) {
      pausesUsedRef.current += 1;
      if (endAtRef.current != null) {
        setSecondsLeft(
          Math.max(0, Math.round((endAtRef.current - Date.now()) / 1000)),
        );
      }
      setIsRunning(false);
      endAtRef.current = null;
      audioRef.current?.pause();
      return;
    }

    if (secondsLeft <= 0) return;
    setIsRunning(true);
    endAtRef.current = Date.now() + secondsLeft * 1000;
    void audioRef.current?.play().catch(() =>
      trackFocusDojoEvent("app_error", {
        area: "audio",
        code: "play_failed",
      }),
    );
  };

  function finishSession(finishedNaturally: boolean) {
    const segmentTotal =
      segment === "break" ? focusBreakMinutes(config) * 60 : config.durationMinutes * 60;
    const segmentCompleted = Math.max(0, segmentTotal - secondsLeft);
    const plannedForSummary = plannedFocusSecondsFor(config);
    const focusCompletedSeconds =
      config.mode === "focus"
        ? Math.min(
            plannedForSummary,
            completedFocusSeconds +
              (segment === "focus" && !finishedNaturally ? segmentCompleted : 0),
          )
        : Math.min(plannedForSummary, completedSecondsRef.current + segmentCompleted);
    const completedSeconds = finishedNaturally
      ? plannedForSummary
      : focusCompletedSeconds;
    const rounds = focusRounds(config);

    endAtRef.current = null;
    setIsRunning(false);
    setSecondsLeft(0);
    audioRef.current?.pause();
    setSummary({
      mode: config.mode,
      plannedSeconds,
      completedSeconds,
      finishedNaturally,
      pausesUsed: pausesUsedRef.current,
      roundsCompleted:
        config.mode === "focus"
          ? finishedNaturalRoundCount(finishedNaturally, rounds, round, segment)
          : completedSeconds > 0
            ? 1
            : 0,
      totalRounds: config.mode === "focus" ? rounds : 1,
    });
    trackFocusDojoEvent(
      finishedNaturally ? "session_completed" : "session_cancelled",
      {
        mode: config.mode,
        environment: sessionEnvironmentId(config, allowedEnvironments),
        plannedMinutes: minutesFromSeconds(plannedForSummary),
        completedMinutes: minutesFromSeconds(completedSeconds),
        pausesUsed: pausesUsedRef.current,
        completionPercent: completionPercent(completedSeconds, plannedForSummary),
      },
    );
    window.localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
    setPhase("summary");
  }

  useEffect(() => {
    if (!isRunning) return;

    const id = window.setInterval(() => {
      if (endAtRef.current == null) return;

      const remaining = Math.round((endAtRef.current - Date.now()) / 1000);
      if (remaining > 0) {
        setSecondsLeft(remaining);
        return;
      }

      if (config.mode === "focus" && segment === "focus" && round < focusRounds(config)) {
        completedSecondsRef.current += config.durationMinutes * 60;
        setCompletedFocusSeconds((value) => value + config.durationMinutes * 60);
        void enterBreak(false);
        return;
      }

      if (config.mode === "focus" && segment === "focus" && round >= focusRounds(config)) {
        completedSecondsRef.current += config.durationMinutes * 60;
        setCompletedFocusSeconds((value) => value + config.durationMinutes * 60);
        void enterBreak(true);
        return;
      }

      if (config.mode === "focus" && segment === "break") {
        void completeBreak();
        return;
      }

      finishSession(true);
    }, 250);

    return () => window.clearInterval(id);
  }, [config, isRunning, phase, round, segment]);

  const saveReflection = () => {
    if (!summary) return;
    const reflection = {
      session_id: `focus-${Date.now()}`,
      mode: summary.mode,
      focused_time: summary.completedSeconds,
      planned_time: summary.plannedSeconds,
      practice_type: practiceType,
      interruption_count: summary.pausesUsed,
      completion_percent: completionPercent(
        summary.completedSeconds,
        summary.plannedSeconds,
      ),
      finished_naturally: summary.finishedNaturally,
      created_at: new Date().toISOString(),
    };
    const completedSession = {
      id: reflection.session_id,
      date: reflection.created_at,
      startTime: startedAt ?? reflection.created_at,
      endTime: reflection.created_at,
      totalFocusSeconds: summary.completedSeconds,
      roundsCompleted: summary.roundsCompleted,
      roundsTotal: summary.totalRounds,
      environment: sessionEnvironmentId(config, allowedEnvironments),
      theme: summary.mode === "exam" ? EXAM_THEME : themeId,
      title: sessionTitle,
      goals,
      mode: summary.mode,
    };

    try {
      const existing = JSON.parse(
        window.localStorage.getItem(SESSION_REFLECTIONS_STORAGE_KEY) ?? "[]",
      );
      const reflections = Array.isArray(existing) ? existing : [];
      const existingCompleted = JSON.parse(
        window.localStorage.getItem(COMPLETED_SESSIONS_STORAGE_KEY) ?? "[]",
      );
      const completedSessions = Array.isArray(existingCompleted)
        ? existingCompleted
        : [];
      window.localStorage.setItem(
        SESSION_REFLECTIONS_STORAGE_KEY,
        JSON.stringify([reflection, ...reflections].slice(0, 50)),
      );
      window.localStorage.setItem(
        COMPLETED_SESSIONS_STORAGE_KEY,
        JSON.stringify([completedSession, ...completedSessions].slice(0, 50)),
      );
    } catch {
      trackFocusDojoEvent("app_error", {
        area: "storage",
        code: "reflection_save_failed",
      });
      window.localStorage.setItem(
        SESSION_REFLECTIONS_STORAGE_KEY,
        JSON.stringify([reflection]),
      );
      window.localStorage.setItem(
        COMPLETED_SESSIONS_STORAGE_KEY,
        JSON.stringify([completedSession]),
      );
    }
  };

  const finishReflection = () => {
    if (!summary) return;
    saveReflection();
    trackFocusDojoEvent("summary_finished", {
      mode: summary.mode,
      environment: sessionEnvironmentId(config, allowedEnvironments),
      plannedMinutes: minutesFromSeconds(summary.plannedSeconds),
      completedMinutes: minutesFromSeconds(summary.completedSeconds),
      pausesUsed: summary.pausesUsed,
      completionPercent: completionPercent(
        summary.completedSeconds,
        summary.plannedSeconds,
      ),
    });
    resetRuntime();
    setGoals([]);
    setSessionGoal("");
    setSessionTitle("");
    setStartedAt(null);
    setSettingsOpen(false);
    window.localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
    setPhase("session-welcome");
  };

  const toggleFullscreen = async () => {
    try {
      if (isFullscreen) {
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen();
        }
        setIsFullscreen(false);
        return;
      }

      setSettingsOpen(false);
      setIsFullscreen(true);
      if (cardRef.current?.requestFullscreen) {
        await cardRef.current.requestFullscreen();
      }
    } catch {
      trackFocusDojoEvent("app_error", {
        area: "fullscreen",
        code: "toggle_failed",
      });
    }
  };

  const topButton =
    "flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-white/38 ring-1 ring-white/8 transition hover:bg-white/12 hover:text-white focus-visible:outline-none focus-visible:ring-white/35";
  const quietButton =
    "rounded-full bg-white/7 px-3 py-1.5 text-xs font-medium text-white/45 ring-1 ring-white/10 transition hover:bg-white/11 hover:text-white/75";
  const playButton =
    "flex h-20 w-20 items-center justify-center rounded-[1.35rem] bg-[var(--fd-accent)] text-[var(--fd-bg-to)] shadow-[0_18px_42px_-18px_var(--fd-glow)] transition hover:brightness-110 active:scale-95 sm:h-24 sm:w-24";
  const iconButton =
    "flex h-14 w-14 items-center justify-center rounded-2xl bg-white/7 text-[var(--fd-muted)] ring-1 ring-[var(--fd-ring-track)] transition hover:bg-white/14 hover:text-white";
  const setupPanel =
    "mx-auto mt-5 w-full max-w-sm rounded-3xl bg-white/[0.045] p-5 ring-1 ring-[var(--fd-ring-track)]";
  const soundDot = (
    <span
      aria-hidden="true"
      className={`block h-2.5 w-2.5 rounded-full transition ${
        isSoundPlaying ? "dot-breathe bg-[var(--fd-status-dot)]" : "bg-[var(--fd-text-tertiary)]/40"
      }`}
    />
  );
  const isFramed = shellMode === "framed";
  const loadingShellClass = isFramed
    ? "relative min-h-[560px] w-full rounded-[1.5rem] px-4 sm:px-6 md:min-h-[620px] md:rounded-[2rem] md:px-8"
    : standalone
      ? "relative h-[100dvh] min-h-[100dvh] w-screen rounded-none px-5"
      : "relative min-h-[100dvh] rounded-[2rem] px-6 sm:rounded-[3rem] sm:px-8";
  const activeShellClass = isFramed
    ? "focus-zone-framed relative min-h-[560px] w-full overflow-y-auto rounded-[1.5rem] px-4 sm:px-6 md:min-h-[620px] md:rounded-[2rem] md:px-8"
    : standalone
      ? "relative h-[100dvh] min-h-[100dvh] w-screen overflow-y-auto rounded-none px-5"
      : "relative min-h-[100dvh] overflow-y-auto rounded-[2rem] px-6 sm:rounded-[3rem] sm:px-8";

  if (!hasLoaded) {
    return (
      <div
        className={[
          "focus-zone-shell isolate overflow-hidden bg-[var(--fd-bg-primary)] text-[var(--fd-text-primary)] shadow-[0_30px_70px_-30px_var(--fd-bowl-glow)] ring-1 ring-[var(--fd-border-subtle)]",
          loadingShellClass,
        ].join(" ")}
      />
    );
  }

  return (
    <div
      ref={cardRef}
      className={[
        "focus-zone-shell isolate bg-[var(--fd-bg-primary)] text-[var(--fd-text-primary)] shadow-[0_30px_70px_-30px_var(--fd-bowl-glow)] ring-1 ring-[var(--fd-border-subtle)]",
        isFullscreen
          ? "focus-dojo-fullscreen z-50 rounded-none"
          : activeShellClass,
      ].join(" ")}
    >
      <audio ref={audioRef} loop preload="metadata">
        {config.mode === "focus" && selectedTrack && phase === "immersive" && (
          <source src={selectedTrack.src} type="audio/mpeg" />
        )}
      </audio>
      <audio ref={chimeRef} preload="auto">
        <source src={CHIME_SRC} type="audio/mpeg" />
      </audio>

      {phase !== "name" && phase !== "mode-select" && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full blur-3xl"
            style={{ backgroundColor: "var(--fd-bowl-glow)" }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-28 right-0 -z-10 h-72 w-72 rounded-full blur-3xl"
            style={{ backgroundColor: "var(--fd-accent-muted)" }}
          />
        </>
      )}

      {pendingResume && !shouldShowNameScreen && (
        <section className="relative z-10 flex min-h-[calc(100dvh-5rem)] flex-col justify-center">
          <div className="mx-auto w-full max-w-sm text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">
              Focus Session
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">
              Resume your session?
            </h1>
            <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-white/55">
              You have an unfinished focus session from a little earlier.
            </p>
            <button
              type="button"
              onClick={resumeSavedSession}
              className="mt-7 w-full rounded-full bg-[var(--fd-accent)] px-4 py-3 text-sm font-semibold text-[var(--fd-bg-to)] transition hover:brightness-110 active:scale-[0.99]"
            >
              Resume
            </button>
            <button
              type="button"
              onClick={discardSavedSession}
              className="mt-4 text-sm font-medium text-white/45 transition hover:text-white/75"
            >
              Start fresh
            </button>
          </div>
        </section>
      )}

      {shouldShowNameScreen && !pendingResume && (
        <section className="relative z-10 flex min-h-[calc(100dvh-5rem)] flex-col justify-center">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              saveDisplayName();
            }}
            className="mx-auto w-full max-w-sm text-center"
          >
            <p className="text-3xl font-semibold tracking-tight text-white">
              Hey 👋🙂
            </p>
            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-white">
              What should we call you?
            </h1>
            <input
              type="text"
              value={nameInput}
              maxLength={32}
              placeholder="Piu"
              autoFocus
              onChange={(event) => setNameInput(event.target.value)}
              className="mt-7 w-full rounded-lg bg-white/10 px-4 py-3 text-center text-lg text-white outline-none ring-1 ring-white/15 placeholder:text-white/30 focus:ring-white/40"
            />
            <button
              type="submit"
              className="mt-5 w-full rounded-full bg-[var(--fd-accent)] px-4 py-3 text-sm font-semibold text-[var(--fd-bg-to)] transition hover:brightness-110 active:scale-[0.99]"
            >
              Continue
            </button>
            <button
              type="button"
              onClick={skipDisplayName}
              className="mt-4 text-sm font-medium text-white/45 transition hover:text-white/75"
            >
              Skip for now
            </button>
          </form>
        </section>
      )}

      {phase === "session-welcome" && !shouldShowNameScreen && !pendingResume && (
        <section className="relative z-10 flex min-h-[calc(100dvh-5rem)] flex-col justify-center py-8">
          <div className="mx-auto w-full max-w-lg text-center">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {greeting}
              </h1>
              <button
                type="button"
                onClick={() => {
                  setNameInput(displayName ?? "");
                  setIsEditingName(true);
                  setPhase("name");
                }}
                className={quietButton}
              >
                Edit
              </button>
            </div>

            <p className="mt-6 text-base font-medium text-white/58">
              Choose your study atmosphere.
            </p>

            <label className="mx-auto mt-8 block w-full max-w-sm">
              <span className="sr-only">What are you studying today?</span>
              <input
                type="text"
                value={sessionTitle}
                maxLength={100}
                placeholder="What are you studying today?"
                onChange={(event) => setSessionTitle(event.target.value)}
                className="w-full rounded-full bg-white/[0.06] px-5 py-3 text-center text-sm text-white outline-none ring-1 ring-white/10 placeholder:text-white/32 focus:ring-white/35"
              />
            </label>

            <FocusAtmospherePicker
              currentTheme={themeId}
              isProUser={false}
              expanded={atmospheresOpen}
              onSelect={selectFreeTheme}
              onProGate={showThemePaywall}
              onToggleExpanded={() => setAtmospheresOpen((open) => !open)}
            />

            {proGateTheme && themePreviewing && (
              <div className="mx-auto mt-5 max-w-sm rounded-full bg-[var(--fd-bg-secondary)] px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-[var(--fd-text-secondary)] ring-1 ring-[var(--fd-border-primary)]">
                Preview
              </div>
            )}

            {proGateTheme && !themePreviewing && (
              <div className="mx-auto mt-5 max-w-sm rounded-3xl bg-[var(--fd-bg-secondary)] p-5 text-center ring-1 ring-[var(--fd-border-primary)]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--fd-text-tertiary)]">
                  Focus Pro
                </p>
                <h2 className="mt-3 text-xl font-semibold tracking-tight text-[var(--fd-text-primary)]">
                  Unlock {proGateTheme.name} and 4 more study atmospheres with Focus Pro
                </h2>
                <div className="mt-5 grid gap-2">
                  <button
                    type="button"
                    className="rounded-full bg-[var(--fd-accent-primary)] px-5 py-3 text-sm font-semibold text-[var(--fd-bg-primary)] transition hover:brightness-110"
                  >
                    Start free trial
                  </button>
                  <button
                    type="button"
                    className="rounded-full bg-[var(--fd-bg-tertiary)] px-5 py-3 text-sm font-semibold text-[var(--fd-text-primary)]"
                  >
                    €10/year placeholder
                  </button>
                  <button
                    type="button"
                    onClick={dismissThemePaywall}
                    className="pt-2 text-sm font-medium text-[var(--fd-text-secondary)] transition hover:text-[var(--fd-text-primary)]"
                  >
                    Continue with free atmospheres
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={continueFromSessionWelcome}
              className="mx-auto mt-8 rounded-full bg-[var(--fd-accent-primary)] px-7 py-3 text-sm font-semibold text-[var(--fd-bg-primary)] shadow-[0_16px_38px_-22px_var(--fd-accent-primary)] transition hover:brightness-110 active:scale-[0.99]"
            >
              Continue
            </button>
          </div>
        </section>
      )}

      {phase === "mode-select" && !shouldShowNameScreen && !pendingResume && (
        <section className="relative z-10 flex min-h-[calc(100dvh-5rem)] flex-col justify-center">
          <div className="mx-auto w-full max-w-md text-center">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {greeting}
              </h1>
              <button
                type="button"
                onClick={() => {
                  setNameInput(displayName ?? "");
                  setIsEditingName(true);
                  setPhase("name");
                }}
                className={quietButton}
              >
                Edit
              </button>
            </div>
            <p className="mt-7 text-base font-medium text-white/58">
              Choose your study space.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => openMode("focus")}
                className="rounded-2xl bg-white/[0.06] px-6 py-7 text-left ring-1 ring-white/10 transition hover:bg-white/[0.1] hover:ring-white/20"
              >
                <span className="text-2xl font-semibold text-white">Focus</span>
                <span className="mt-3 block text-sm leading-relaxed text-white/50">
                  Pomodoro rhythm for calm study.
                </span>
              </button>
              <button
                type="button"
                onClick={() => openMode("exam")}
                className="rounded-2xl bg-white/[0.06] px-6 py-7 text-left ring-1 ring-white/10 transition hover:bg-white/[0.1] hover:ring-white/20"
              >
                <span className="text-2xl font-semibold text-white">Exam</span>
                <span className="mt-3 block text-sm leading-relaxed text-white/50">
                  Timed practice for papers and mocks.
                </span>
              </button>
            </div>
          </div>
        </section>
      )}

      {phase === "focus-setup" && !pendingResume && (
        <section className="focus-timer-screen relative z-10 flex min-h-[calc(100dvh-5rem)] w-full flex-col items-center">
          <SetupTopBar
            mode={config.mode}
            onSelectMode={openMode}
            onEditName={() => {
              setNameInput(displayName ?? "");
              setIsEditingName(true);
              setPhase("name");
            }}
            onFullscreen={toggleFullscreen}
            isFullscreen={isFullscreen}
            topButtonClass={topButton}
          />

          <div className="mb-7 mt-12 flex flex-col items-center text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">
              Focused Study • Round 1/{focusRounds(config)}
            </p>
          </div>

          <FocusRing progress={0}>
            <span className="timer-text-focus font-bold tabular-nums tracking-tight text-white/85">
              {formatTime(config.durationMinutes * 60)}
            </span>
          </FocusRing>

          {sessionTitle.trim() && (
            <p
              title={sessionTitle.trim()}
              className="mt-8 max-w-[min(82vw,26rem)] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-white/50"
            >
              {sessionTitle.trim()}
            </p>
          )}

          <div className="mt-11 flex items-center justify-center gap-6">
            <button
              type="button"
              onClick={resetSetup}
              aria-label="Reset focus timer"
              className={iconButton}
            >
              <ResetIcon />
            </button>
            <button
              type="button"
              onClick={startSession}
              aria-label="Start focus timer"
              className={playButton}
            >
              <PlayIcon size={28} />
            </button>
          </div>

          <DisclosureToggle
            open={settingsOpen}
            isSoundPlaying={isSoundPlaying}
            onToggle={() => setSettingsOpen((value) => !value)}
          />

          {settingsOpen && (
            <div className={setupPanel}>
              <div className="grid grid-cols-3 gap-3">
                <NumberField
                  label="Focus"
                  value={String(config.durationMinutes)}
                  maxLength={3}
                  onChange={updateFocusDuration}
                />
                <NumberField
                  label="Break"
                  value={String(focusBreakMinutes(config))}
                  maxLength={2}
                  onChange={updateBreakDuration}
                />
                <NumberField
                  label="Rounds"
                  value={String(focusRounds(config))}
                  maxLength={1}
                  onChange={updateRounds}
                />
              </div>
              <div className="mt-6">
                <p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-[var(--fd-text-tertiary)]">
                  Sound Environment
                </p>
                <EnvironmentButtons
                  environments={allowedEnvironments}
                  selectedId={validSoundEnvironmentId(
                    config.soundEnvironmentId,
                    allowedEnvironments,
                  )}
                  onSelect={updateEnvironment}
                />
              </div>
              <p className="mt-5 text-center text-xs leading-relaxed text-white/40">
                Study atmosphere and title are chosen before the session begins.
              </p>
            </div>
          )}
        </section>
      )}

      {phase === "exam-setup" && !pendingResume && (
        <section className="focus-timer-screen relative z-10 flex min-h-[calc(100dvh-5rem)] w-full flex-col items-center">
          <SetupTopBar
            mode={config.mode}
            onSelectMode={openMode}
            onEditName={() => {
              setNameInput(displayName ?? "");
              setIsEditingName(true);
              setPhase("name");
            }}
            onFullscreen={toggleFullscreen}
            isFullscreen={isFullscreen}
            topButtonClass={topButton}
          />

          <div className="mb-7 mt-12 flex flex-col items-center text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">
              Exam Practice
            </p>
          </div>

          <FocusRing progress={0}>
            <span className="timer-text-exam font-bold tabular-nums tracking-tight text-white/85">
              {formatPrepClock(config.durationMinutes * 60)}
            </span>
          </FocusRing>

          <div className="mt-11 flex items-center justify-center gap-6">
            <button
              type="button"
              onClick={resetSetup}
              aria-label="Reset exam timer"
              className={iconButton}
            >
              <ResetIcon />
            </button>
            <button
              type="button"
              onClick={startSession}
              aria-label="Start exam timer"
              className={playButton}
            >
              <PlayIcon size={28} />
            </button>
          </div>

          <DisclosureToggle
            open={settingsOpen}
            isSoundPlaying={isSoundPlaying}
            onToggle={() => setSettingsOpen((value) => !value)}
          />

          {settingsOpen && (
            <div className={setupPanel}>
              <div className="grid grid-cols-[1fr_1fr_auto] gap-3">
                <NumberField
                  label="Hours"
                  value={examHours}
                  maxLength={1}
                  onChange={setExamHours}
                />
                <NumberField
                  label="Minutes"
                  value={examMinutes}
                  maxLength={2}
                  onChange={setExamMinutes}
                />
                <button
                  type="button"
                  onClick={setExamTime}
                  className="self-end rounded-xl bg-white/14 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  Set
                </button>
              </div>
              <p className="mt-5 text-center text-xs leading-relaxed text-white/40">
                Exam mode stays silent to mirror real practice conditions.
              </p>
            </div>
          )}
        </section>
      )}

      {phase === "transition" && !pendingResume && (
        <section className="relative z-10 flex min-h-[calc(100dvh-5rem)] items-center justify-center">
          <FocusTransition />
          <div className="animate-immersive-in text-center">
            <p className="text-2xl font-semibold tracking-tight text-white">
              Good luck 💙
            </p>
            <p className="mt-3 text-sm font-medium leading-relaxed text-white/55">
              {transitionLine}
            </p>
          </div>
        </section>
      )}

      {phase === "immersive" && !pendingResume && (
        <section
          className={[
            "animate-immersive-in relative z-10 w-full",
            isFullscreen
              ? "fullscreen-inner fullscreen-timer-grid"
              : "flex min-h-[calc(100dvh-5rem)] flex-col items-center justify-center",
          ].join(" ")}
        >
          <div
            className={[
              "relative flex w-full items-start justify-center",
              isFullscreen ? "self-start" : "mb-6",
            ].join(" ")}
          >
            <p
              title={immersiveLabel}
              className="max-w-[min(82vw,28rem)] overflow-hidden text-ellipsis whitespace-nowrap text-xs font-semibold uppercase tracking-[0.22em] text-white/40"
            >
              {immersiveLabel}
            </p>
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              className={`${topButton} absolute right-0 top-0`}
            >
              <FullscreenIcon isFullscreen={isFullscreen} />
            </button>
          </div>

          <div className="flex min-h-0 flex-col items-center justify-center text-center">
            <FocusRing progress={progress}>
              <span
                className={`${
                  config.mode === "exam" ? "timer-text-exam" : "timer-text-focus"
                } font-light tabular-nums tracking-tight text-white`}
              >
                {config.mode === "exam"
                  ? formatPrepClock(secondsLeft)
                  : formatTime(secondsLeft)}
              </span>
            </FocusRing>
          </div>

          <div
            className={[
              "flex flex-col items-center justify-center gap-6",
              isFullscreen ? "" : "mt-[clamp(2rem,5dvh,3rem)]",
            ].join(" ")}
          >
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => finishSession(false)}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/8 text-[var(--fd-muted)] ring-1 ring-[var(--fd-ring-track)] transition hover:bg-white/15 hover:text-white"
                aria-label="End session"
              >
                <StopIcon />
              </button>
              <button
                type="button"
                onClick={pauseOrResume}
                aria-label={isRunning ? "Pause timer" : "Resume timer"}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--fd-accent)] text-[var(--fd-bg-to)] shadow-[0_10px_30px_-8px_var(--fd-glow)] transition hover:brightness-110 active:scale-95"
              >
                {isRunning ? <PauseIcon /> : <PlayIcon size={20} />}
              </button>
              <button
                type="button"
                onClick={resetSetup}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/8 text-[var(--fd-muted)] ring-1 ring-[var(--fd-ring-track)] transition hover:bg-white/15 hover:text-white"
                aria-label="Reset timer"
              >
                <ResetIcon />
              </button>
            </div>
            <div className="flex flex-col items-center gap-1 text-white/35">
              {soundDot}
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden="true">
                <path d="M1 1.5 6 6.5 11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </section>
      )}

      {(phase === "break" || phase === "long-break") && !pendingResume && (
        <BreakRitualScreen
          longBreak={phase === "long-break"}
          round={round}
          totalRounds={focusRounds(config)}
          secondsLeft={secondsLeft}
          totalSeconds={
            phase === "long-break"
              ? LONG_BREAK_MINUTES * 60
              : focusBreakMinutes(config) * 60
          }
          nextGoal={nextSessionGoal}
          messages={breakRitualMessages}
          onNextGoalChange={(value) => setNextSessionGoal(value.slice(0, 100))}
          onStartNextRound={() => {
            setIsRunning(false);
            endAtRef.current = null;
            setRound((value) => value + 1);
            startFocusRound(nextSessionGoal);
          }}
          onEndSession={() => finishSession(false)}
        />
      )}

      {phase === "ready-prompt" && !pendingResume && (
        <section className="animate-immersive-in relative z-10 flex min-h-[calc(100dvh-5rem)] flex-col items-center justify-center text-center">
          <div className="mb-7 flex flex-col items-center gap-3">
            <span className="dot-breathe h-3 w-3 rounded-full bg-[var(--fd-accent-soft)]" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">
              Round {Math.min(round + 1, focusRounds(config))}/{focusRounds(config)}
            </p>
          </div>
          <h2 className="text-3xl font-semibold tracking-tight text-white">
            Ready for the next round?
          </h2>
          {nextSessionGoal.trim() && (
            <p
              title={`Up next: ${nextSessionGoal.trim()}`}
              className="mx-auto mt-4 max-w-[min(82vw,24rem)] overflow-hidden text-ellipsis whitespace-nowrap text-sm leading-relaxed text-white/55"
            >
              Up next: {nextSessionGoal.trim()}
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              setRound((value) => value + 1);
              startFocusRound(nextSessionGoal);
            }}
            className="mt-9 rounded-full bg-[var(--fd-accent)] px-6 py-3 text-sm font-semibold text-[var(--fd-bg-to)] transition hover:brightness-110 active:scale-[0.99]"
          >
            Let&apos;s go
          </button>
        </section>
      )}

      {phase === "cycle-complete" && !pendingResume && (
        <section className="animate-immersive-in relative z-10 flex min-h-[calc(100dvh-5rem)] flex-col items-center justify-center text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">
            Focus Cycle
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
            You&apos;ve completed a full focus cycle
          </h2>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-white/55">
            Take the win gently. You can start another cycle, or finish for today.
          </p>
          <div className="mt-9 flex w-full max-w-sm flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                window.localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
                resetRuntime();
                setGoals([]);
                setRound(1);
                setSessionGoal("");
                setNextSessionGoal("");
                setStartedAt(null);
                setSecondsLeft(config.durationMinutes * 60);
                setPhase("focus-setup");
              }}
              className="rounded-full bg-[var(--fd-accent)] px-5 py-3 text-sm font-semibold text-[var(--fd-bg-to)] transition hover:brightness-110 active:scale-[0.99]"
            >
              Start another cycle
            </button>
            <button
              type="button"
              onClick={() => finishSession(true)}
              className="rounded-full bg-white/8 px-5 py-3 text-sm font-medium text-white/72 ring-1 ring-white/10 transition hover:bg-white/12 hover:text-white"
            >
              Finish for today
            </button>
          </div>
        </section>
      )}

      {phase === "summary" && summary && !pendingResume && (
        <section className="animate-immersive-in relative z-10 mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-lg flex-col justify-center py-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">
            Session Reflection
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {summary.finishedNaturally ? "Session Complete" : "Session Ended"}
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/55">
            Nice work showing up today.
          </p>

          <div className="mt-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--fd-accent)]">
              Focused Time
            </p>
            <p className="mt-3 text-5xl font-semibold tracking-tight text-white sm:text-6xl">
              {formatFocusedTime(summary.completedSeconds)}
            </p>
          </div>

          <div className="mx-auto mt-8 grid w-full max-w-sm grid-cols-2 gap-3 text-left">
            <Metric label="Planned" value={formatDurationLabel(summary.plannedSeconds)} />
            <Metric label="Completed" value={formatDurationLabel(summary.completedSeconds)} />
            <Metric label="Pauses" value={String(summary.pausesUsed)} />
            <Metric
              label="Completion"
              value={`${completionPercent(summary.completedSeconds, summary.plannedSeconds)}%`}
            />
          </div>

          <fieldset className="mt-9">
            <legend className="text-sm font-semibold text-white">
              What did you practise?
            </legend>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {PRACTICE_TYPES.map((type) => {
                const active = practiceType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setPracticeType(active ? null : type.id)}
                    aria-pressed={active}
                    className={`rounded-full px-3 py-2 text-xs font-medium transition ${
                      active
                        ? "bg-[var(--fd-accent)] text-[var(--fd-bg-to)] shadow-sm"
                        : "bg-white/7 text-white/58 ring-1 ring-white/10 hover:bg-white/11 hover:text-white"
                    }`}
                  >
                    {type.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <p className="mx-auto mt-8 max-w-xl text-xs leading-relaxed text-white/32">
            ScienceDojo does not track what you study, sell your data, or build
            personal profiles. Your name stays on your device. We only use
            anonymous product statistics to improve the study experience.
          </p>

          <button
            type="button"
            onClick={finishReflection}
            className="mx-auto mt-8 rounded-full bg-[var(--fd-accent)] px-6 py-3 text-sm font-semibold text-[var(--fd-bg-to)] transition hover:brightness-110 active:scale-[0.99]"
          >
            Finish Session
          </button>
        </section>
      )}
    </div>
  );
}

function BreakRitualScreen({
  longBreak,
  round,
  totalRounds,
  secondsLeft,
  totalSeconds,
  nextGoal,
  messages,
  onNextGoalChange,
  onStartNextRound,
  onEndSession,
}: {
  longBreak: boolean;
  round: number;
  totalRounds: number;
  secondsLeft: number;
  totalSeconds: number;
  nextGoal: string;
  messages: BreakRitualMessages;
  onNextGoalChange: (value: string) => void;
  onStartNextRound: () => void;
  onEndSession: () => void;
}) {
  const elapsedSeconds = Math.max(0, totalSeconds - secondsLeft);
  const showMovement = Boolean(messages.movement) && elapsedSeconds >= 5;
  const showHydration = Boolean(messages.hydration) && elapsedSeconds >= 10;
  const shouldPlanNextRound = !longBreak && round < totalRounds;
  const showNextRoundPlanning = shouldPlanNextRound && secondsLeft <= 10;
  const nextRound = Math.min(round + 1, totalRounds);

  return (
    <section className="animate-immersive-in relative z-10 flex min-h-[calc(100dvh-5rem)] flex-col items-center justify-center py-8 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">
        {longBreak
          ? "Long break — you've earned it"
          : `Short break · Round ${round}/${totalRounds}`}
      </p>
      <p className="mt-6 text-6xl font-semibold tracking-tight text-white sm:text-7xl">
        {formatTime(secondsLeft)}
      </p>
      <div className="mt-6 max-w-sm text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-white">
          Break time.
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-white/55">
          Drink some water and reset your mind.
        </p>
      </div>
      <div className="mt-9 flex w-full max-w-md flex-col gap-3">
        {showMovement && (
          <BreakCard>
            <span className="text-lg" aria-hidden="true">↗</span>
            <span>{messages.movement}</span>
          </BreakCard>
        )}
        {showHydration && (
          <BreakCard>
            <span className="text-lg" aria-hidden="true">◦</span>
            <span>{messages.hydration}</span>
          </BreakCard>
        )}
        {showNextRoundPlanning && (
          <div
            role="status"
            className="break-card-enter rounded-2xl bg-white/[0.055] p-4 text-left ring-1 ring-white/10"
          >
            <label>
              <span className="text-sm font-medium text-white/78">
                What will you focus on next?
              </span>
              {nextGoal.trim() && (
                <p
                  title={`Next: ${nextGoal.trim()}`}
                  className="mt-2 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-xs font-medium text-teal/80"
                >
                  Next: {nextGoal.trim()}
                </p>
              )}
              <input
                type="text"
                value={nextGoal}
                maxLength={100}
                onChange={(event) => onNextGoalChange(event.target.value)}
                className="mt-3 w-full rounded-full bg-white/[0.07] px-4 py-2.5 text-sm text-white outline-none ring-1 ring-white/10 placeholder:text-white/28 focus:ring-white/35"
                placeholder="Next round focus..."
              />
            </label>
          </div>
        )}
      </div>
      <div className="mt-8 flex flex-col items-center gap-3">
        {shouldPlanNextRound && (
          <button
            type="button"
            onClick={onStartNextRound}
            className="rounded-full bg-[var(--fd-accent)] px-6 py-3 text-sm font-semibold text-[var(--fd-bg-to)] transition hover:brightness-110 active:scale-[0.99]"
          >
            Start Round {nextRound}
          </button>
        )}
        <button
          type="button"
          onClick={onEndSession}
          className="rounded-full px-5 py-3 text-sm font-medium text-white/42 transition hover:text-white/72"
        >
          End session
        </button>
      </div>
    </section>
  );
}

function BreakCard({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      className="break-card-enter flex items-center gap-3 rounded-2xl bg-white/[0.055] px-4 py-4 text-left text-sm font-medium leading-relaxed text-white/76 ring-1 ring-white/10"
    >
      {children}
    </div>
  );
}

function finishedNaturalRoundCount(
  finishedNaturally: boolean,
  rounds: number,
  round: number,
  segment: TimerSegment,
) {
  if (finishedNaturally) return rounds;
  return Math.max(0, round - (segment === "focus" ? 1 : 0));
}

function SetupTopBar({
  mode,
  onSelectMode,
  onEditName,
  onFullscreen,
  isFullscreen,
  topButtonClass,
}: {
  mode: SessionMode;
  onSelectMode: (mode: SessionMode) => void;
  onEditName: () => void;
  onFullscreen: () => void;
  isFullscreen: boolean;
  topButtonClass: string;
}) {
  return (
    <div className="relative flex min-h-12 w-full items-start justify-center">
      <div className="inline-flex rounded-full bg-black/20 p-1 ring-1 ring-[var(--fd-ring-track)]">
        <ModePill mode="focus" current={mode} onSelect={onSelectMode} />
        <ModePill mode="exam" current={mode} onSelect={onSelectMode} />
      </div>
      <button
        type="button"
        onClick={onEditName}
        className="absolute left-0 top-1 rounded-full px-2 py-1 text-xs font-medium text-white/35 transition hover:text-white/65"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={onFullscreen}
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        className={`${topButtonClass} absolute right-0 top-0`}
      >
        <FullscreenIcon isFullscreen={isFullscreen} />
      </button>
    </div>
  );
}

function DisclosureToggle({
  open,
  isSoundPlaying,
  onToggle,
}: {
  open: boolean;
  isSoundPlaying: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-label="Session options"
      className="mx-auto mt-10 flex flex-col items-center gap-1 rounded-full px-3 py-1 text-white/45 transition hover:text-white/75"
    >
      <span
        aria-hidden="true"
        className={`block h-2 w-2 rounded-full transition ${
          isSoundPlaying ? "dot-breathe" : "bg-white/25"
        }`}
        style={isSoundPlaying ? { backgroundColor: "var(--fd-accent-soft)" } : undefined}
      />
      <svg
        width="12"
        height="8"
        viewBox="0 0 12 8"
        fill="none"
        aria-hidden="true"
        className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}
      >
        <path d="M1 1.5 6 6.5 11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function NumberField({
  label,
  value,
  maxLength,
  onChange,
}: {
  label: string;
  value: string;
  maxLength: number;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="text-xs font-bold uppercase tracking-[0.16em] text-white/42">
        {label}
      </span>
      <input
        type="text"
        maxLength={maxLength}
        inputMode="numeric"
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, ""))}
        className="mt-2 w-full rounded-xl bg-black/20 px-3 py-3 text-center text-lg font-semibold text-white outline-none ring-1 ring-[var(--fd-ring-track)] focus:ring-white/35"
      />
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.05] px-4 py-3 ring-1 ring-white/10">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/35">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-white/78">{value}</p>
    </div>
  );
}

function PlayIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M6 3.7c0-.9 1-1.5 1.8-1L16 7.9c.8.5.8 1.7 0 2.2L7.8 15.3c-.8.5-1.8-.1-1.8-1V3.7Z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <rect x="4.5" y="3" width="4" height="14" rx="1.2" />
      <rect x="11.5" y="3" width="4" height="14" rx="1.2" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3.6 9a5.5 5.5 0 1 1 1.5 3.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M2.8 6.2 3.5 10l3.8-.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
      <rect x="4" y="4" width="10" height="10" rx="2" />
    </svg>
  );
}

function FullscreenIcon({ isFullscreen }: { isFullscreen: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d={
          isFullscreen
            ? "M7 2v3a2 2 0 0 1-2 2H2M16 7h-3a2 2 0 0 1-2-2V2M2 11h3a2 2 0 0 1 2 2v3M11 16v-3a2 2 0 0 1 2-2h3"
            : "M2 6V4a2 2 0 0 1 2-2h2M12 2h2a2 2 0 0 1 2 2v2M16 12v2a2 2 0 0 1-2 2h-2M6 16H4a2 2 0 0 1-2-2v-2"
        }
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

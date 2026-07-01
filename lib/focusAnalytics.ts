import type { SessionMode } from "./session";

export type FocusDojoSource = "focus" | "focus-dojo";

export type FocusDojoEvent =
  | "onboarding_completed"
  | "session_started"
  | "session_completed"
  | "session_cancelled"
  | "environment_selected"
  | "mode_selected"
  | "summary_finished"
  | "app_error";

export type FocusDojoAppErrorArea =
  | "audio"
  | "timer"
  | "fullscreen"
  | "storage";

type EventPayload = {
  source?: FocusDojoSource;
  mode?: SessionMode;
  environment?: string;
  plannedMinutes?: number;
  completedMinutes?: number;
  pausesUsed?: number;
  completionPercent?: number;
};

type AppErrorPayload = {
  source?: FocusDojoSource;
  area?: FocusDojoAppErrorArea;
  code?: string;
};

type FocusDojoAnalyticsDetail = {
  event: FocusDojoEvent;
  payload: EventPayload | AppErrorPayload;
  timestamp: string;
  schemaVersion: 1;
};

const DUPLICATE_WINDOW_MS = 1500;
const dedupeEvents = new Map<string, number>();
const lifecycleEvents = new Set<FocusDojoEvent>([
  "session_started",
  "session_completed",
  "session_cancelled",
]);

function getSource(): FocusDojoSource | undefined {
  if (typeof window === "undefined") return undefined;
  return window.location.pathname.startsWith("/focus-dojo")
    ? "focus-dojo"
    : "focus";
}

function sanitizePayload(payload: EventPayload = {}): EventPayload {
  return {
    source: payload.source ?? getSource(),
    mode: payload.mode,
    environment: payload.environment,
    plannedMinutes: payload.plannedMinutes,
    completedMinutes: payload.completedMinutes,
    pausesUsed: payload.pausesUsed,
    completionPercent: payload.completionPercent,
  };
}

function sanitizeAppErrorPayload(payload: AppErrorPayload = {}): AppErrorPayload {
  return {
    source: payload.source ?? getSource(),
    area: payload.area,
    code: payload.code,
  };
}

function dedupeKey(event: FocusDojoEvent, payload: EventPayload | AppErrorPayload) {
  if (!lifecycleEvents.has(event)) return null;
  const safePayload = payload as EventPayload;
  return [
    event,
    safePayload.source,
    safePayload.mode,
    safePayload.environment,
    safePayload.plannedMinutes,
    safePayload.completedMinutes,
    safePayload.pausesUsed,
    safePayload.completionPercent,
  ].join(":");
}

function isDuplicate(key: string) {
  const now = Date.now();
  const previous = dedupeEvents.get(key);
  dedupeEvents.set(key, now);

  for (const [storedKey, storedAt] of dedupeEvents) {
    if (now - storedAt > DUPLICATE_WINDOW_MS) {
      dedupeEvents.delete(storedKey);
    }
  }

  return previous != null && now - previous < DUPLICATE_WINDOW_MS;
}

export function trackFocusDojoEvent(
  event: Exclude<FocusDojoEvent, "app_error">,
  payload?: EventPayload,
): void;
export function trackFocusDojoEvent(
  event: "app_error",
  payload?: AppErrorPayload,
): void;
export function trackFocusDojoEvent(
  event: FocusDojoEvent,
  payload: EventPayload | AppErrorPayload = {},
) {
  if (typeof window === "undefined") return;

  const safePayload =
    event === "app_error"
      ? sanitizeAppErrorPayload(payload as AppErrorPayload)
      : sanitizePayload(payload as EventPayload);
  const key = dedupeKey(event, safePayload);
  if (key && isDuplicate(key)) return;

  const detail: FocusDojoAnalyticsDetail = {
    event,
    payload: safePayload,
    timestamp: new Date().toISOString(),
    schemaVersion: 1,
  };

  window.dispatchEvent(
    new CustomEvent("focusdojo:analytics", {
      detail,
    }),
  );
}

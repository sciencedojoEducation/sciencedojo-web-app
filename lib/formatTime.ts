/** Format a second count as MM:SS. Negative values clamp to 00:00. */
export function formatTime(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const mm = String(Math.floor(safe / 60)).padStart(2, "0");
  const ss = String(safe % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

/** Format a second count as a friendly label, e.g. "45 min" or "1 hr 5 min". */
export function formatDurationLabel(totalSeconds: number): string {
  const minutes = Math.round(Math.max(0, totalSeconds) / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}

/** Display a course or lesson estimate stored in minutes as hours and minutes. */
export function formatCourseDuration(
  totalMinutes: number,
  language: "en" | "de" = "en",
): string {
  const minutes = Number.isFinite(totalMinutes)
    ? Math.max(0, Math.round(totalMinutes))
    : 0;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  const parts: string[] = [];
  if (hours)
    parts.push(
      `${hours} ${language === "de" ? (hours === 1 ? "Stunde" : "Stunden") : hours === 1 ? "hour" : "hours"}`,
    );
  if (remainingMinutes || !hours)
    parts.push(
      `${remainingMinutes} ${language === "de" ? (remainingMinutes === 1 ? "Minute" : "Minuten") : remainingMinutes === 1 ? "minute" : "minutes"}`,
    );
  return parts.join(" ");
}

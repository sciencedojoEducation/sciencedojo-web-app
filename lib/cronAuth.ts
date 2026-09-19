export type CronAuthorizationFailure = {
  ok: false;
  status: 401 | 500;
  error: "Cron is not configured" | "Unauthorized";
};

export function checkCronAuthorization(
  authorizationHeader: string | null,
  configuredSecret = process.env.CRON_SECRET,
): CronAuthorizationFailure | null {
  if (!configuredSecret?.trim()) {
    console.error("[cron] CRON_SECRET is not configured");
    return { ok: false, status: 500, error: "Cron is not configured" };
  }

  if (authorizationHeader !== `Bearer ${configuredSecret}`) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  return null;
}

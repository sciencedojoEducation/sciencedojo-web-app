// A short-lived, synthetic transport experiment. This never admits a learner.
export const HOSTING_CHECK_EXPIRES = Date.parse("2026-10-18T00:00:00Z");
export function hostingCheckEnabled(
  env: Record<string, string | undefined>,
  now = Date.now(),
) {
  return env.VERCEL_ENV === "preview" &&
    env.VERCEL_GIT_COMMIT_REF === "codex/virtual-sciencedojo-beta" &&
    now < HOSTING_CHECK_EXPIRES;
}

export function hostingCheckRequestAllowed(request: Request) {
  const url = new URL(request.url);
  return url.protocol === "https:" && url.hostname.endsWith(".vercel.app") &&
    request.headers.get("origin") === url.origin &&
    request.headers.get("upgrade")?.toLowerCase() === "websocket";
}

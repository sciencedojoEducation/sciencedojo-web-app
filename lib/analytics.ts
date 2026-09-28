type AnalyticsValue = string | number | boolean | null | undefined;

type AnalyticsParams = Record<string, AnalyticsValue>;

declare global {
  interface Window {
    gtag?: (command: "event", eventName: string, params?: AnalyticsParams) => void;
  }
}

export function trackEvent(eventName: string, params: AnalyticsParams = {}) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  window.gtag("event", eventName, sanitizeParams(params));
}

export function getDeviceCategory() {
  if (typeof window === "undefined") return "unknown";
  return window.matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop";
}

function sanitizeParams(params: AnalyticsParams) {
  return Object.fromEntries(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => [key, value]),
  );
}

export function getPublicSource(pathname: string) {
  if (pathname === "/") {
    return "homepage";
  }

  return pathname.replace(/^\//, "") || "unknown";
}

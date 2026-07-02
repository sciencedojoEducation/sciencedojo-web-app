const LOCAL_SITE_URL = "http://localhost:3000";
const PRODUCTION_SITE_URL = "https://www.sciencedojo.co.uk";

type SiteUrlOptions = {
  headers?: Headers | null;
};

function normalizeOrigin(value?: string | null) {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return "";
  }

  try {
    const url = new URL(trimmedValue.includes("://") ? trimmedValue : `https://${trimmedValue}`);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "";
    }

    return url.origin.replace(/\/+$/, "");
  } catch {
    return "";
  }
}

function isLocalHostname(hostname: string) {
  const normalizedHostname = hostname.toLowerCase();
  return (
    normalizedHostname === "localhost" ||
    normalizedHostname === "127.0.0.1" ||
    normalizedHostname === "[::1]" ||
    normalizedHostname === "::1"
  );
}

function isAllowedHostname(hostname: string) {
  const normalizedHostname = hostname.toLowerCase();

  if (isLocalHostname(normalizedHostname)) {
    return process.env.NODE_ENV !== "production";
  }

  return (
    normalizedHostname === "sciencedojo.co.uk" ||
    normalizedHostname === "www.sciencedojo.co.uk" ||
    normalizedHostname.endsWith(".vercel.app")
  );
}

function getSafeOrigin(value?: string | null) {
  const origin = normalizeOrigin(value);

  if (!origin) {
    return "";
  }

  const { hostname } = new URL(origin);
  return isAllowedHostname(hostname) ? origin : "";
}

function getRequestOrigin(headersList?: Headers | null) {
  if (!headersList) {
    return "";
  }

  const host = headersList.get("x-forwarded-host") || headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") || "https";

  if (!host) {
    return "";
  }

  try {
    const requestUrl = new URL(`${protocol}://${host}`);
    if (process.env.NODE_ENV !== "production" && isLocalHostname(requestUrl.hostname)) {
      requestUrl.protocol = "http:";
      return getSafeOrigin(requestUrl.origin);
    }
  } catch {
    return "";
  }

  return getSafeOrigin(`${protocol}://${host}`);
}

function isLocalOrigin(origin: string) {
  if (!origin) {
    return false;
  }

  const { hostname } = new URL(origin);
  return isLocalHostname(hostname);
}

function forceLocalHttp(origin: string) {
  const url = new URL(origin);
  if (process.env.NODE_ENV !== "production" && isLocalHostname(url.hostname)) {
    url.protocol = "http:";
  }

  return url.origin;
}

function getDeploymentOrigin() {
  return (
    getSafeOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
    getSafeOrigin(process.env.VERCEL_URL)
  );
}

export function getSiteUrl(options: SiteUrlOptions = {}) {
  const requestOrigin = getRequestOrigin(options.headers);

  if (process.env.NODE_ENV !== "production" && isLocalOrigin(requestOrigin)) {
    return forceLocalHttp(requestOrigin);
  }

  const configuredOrigin =
    getSafeOrigin(process.env.NEXT_PUBLIC_SITE_URL) ||
    getSafeOrigin(process.env.NEXT_PUBLIC_APP_URL) ||
    getSafeOrigin(process.env.SITE_URL) ||
    getSafeOrigin(process.env.APP_URL);

  if (configuredOrigin) {
    return isLocalOrigin(configuredOrigin) ? forceLocalHttp(configuredOrigin) : configuredOrigin;
  }

  if (requestOrigin) {
    return isLocalOrigin(requestOrigin) ? forceLocalHttp(requestOrigin) : requestOrigin;
  }

  const deploymentOrigin = getDeploymentOrigin();

  if (deploymentOrigin) {
    return deploymentOrigin;
  }

  return process.env.NODE_ENV === "production" ? PRODUCTION_SITE_URL : LOCAL_SITE_URL;
}

export function getSitePath(path = "/", options: SiteUrlOptions = {}) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl(options)}${normalizedPath}`;
}

const applicationPaths = [
  "/dashboard", "/admin", "/academy", "/workbooks", "/campus",
  "/login", "/signup", "/auth", "/forgot-password", "/reset-password",
  "/tutor/onboarding", "/tutor/contract", "/maintenance",
];

/** Public-page decoration only; never attach document observers in app screens. */
export function showsPublicScrollProgress(path: string | null) {
  const pathname = path?.split(/[?#]/, 1)[0];
  if (!pathname?.startsWith("/")) return false;
  return !applicationPaths.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`))
    && !/^\/tutor\/[^/]+\/book(?:\/|$)/.test(pathname);
}

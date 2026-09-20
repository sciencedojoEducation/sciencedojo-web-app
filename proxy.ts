import { NextResponse, type NextRequest } from "next/server";
import { isMaintenanceModeEnabled } from "@/lib/public-render";

const PUBLIC_FILE = /\.(.*)$/;

const maintenanceAllowedPrefixes = [
  "/api",
  "/auth",
  "/dashboard/admin",
  "/login",
  "/forgot-password",
  "/reset-password",
  "/maintenance",
  "/_next",
];

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-next-pathname", pathname);
  const continueResponse = () => NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (
    pathname === "/" &&
    (
      searchParams.has("code") ||
      searchParams.has("error") ||
      searchParams.has("error_description")
    )
  ) {
    const callbackUrl = request.nextUrl.clone();
    callbackUrl.pathname = "/auth/callback";
    return NextResponse.redirect(callbackUrl);
  }

  if (
    PUBLIC_FILE.test(pathname) ||
    maintenanceAllowedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  ) {
    return continueResponse();
  }

  if (!isMaintenanceModeEnabled()) {
    return continueResponse();
  }

  const maintenanceUrl = request.nextUrl.clone();
  maintenanceUrl.pathname = "/maintenance";
  maintenanceUrl.search = "";
  return NextResponse.rewrite(maintenanceUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|opengraph-image.png|robots.txt|sitemap.xml).*)"],
};

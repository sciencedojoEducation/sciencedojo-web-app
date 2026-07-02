import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

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

async function isMaintenanceEnabled() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return process.env.MAINTENANCE_MODE === "true";
  }

  try {
    const supabase = createClient(supabaseUrl, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    const { data, error } = await supabase
      .from("feature_flags")
      .select("enabled")
      .eq("key", "maintenance_mode_enabled")
      .maybeSingle();

    if (error) {
      return process.env.MAINTENANCE_MODE === "true";
    }

    return Boolean(data?.enabled);
  } catch {
    return process.env.MAINTENANCE_MODE === "true";
  }
}

export async function proxy(request: NextRequest) {
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

  if (!(await isMaintenanceEnabled())) {
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

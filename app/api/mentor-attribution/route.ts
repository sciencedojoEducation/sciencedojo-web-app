import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  MENTOR_ATTRIBUTION_COOKIE_MAX_AGE,
  mentorAttributionCookies,
} from "@/lib/mentor-attribution";

type AttributionPayload = {
  landingSlug?: string;
  referrerSlug?: string;
  landingPath?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  device_type?: string;
};

function normalizeSlug(value?: string) {
  return (value || "").trim().toLowerCase();
}

function getClientSessionId(request: Request) {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(new RegExp(`${mentorAttributionCookies.sessionId}=([^;]+)`));
  return match?.[1] ? decodeURIComponent(match[1]) : crypto.randomUUID();
}

async function findTutorIdBySlug(slug: string) {
  if (!slug) return null;

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("tutors")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("Mentor attribution tutor lookup failed:", error.message);
    return null;
  }

  return data?.id || null;
}

export async function POST(request: Request) {
  let payload: AttributionPayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const landingSlug = normalizeSlug(payload.landingSlug);
  const referrerSlug = normalizeSlug(payload.referrerSlug || payload.landingSlug);
  const sessionId = getClientSessionId(request);
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  try {
    const [landingTutorId, referrerTutorId] = await Promise.all([
      findTutorIdBySlug(landingSlug),
      findTutorIdBySlug(referrerSlug),
    ]);

    if (!landingTutorId) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }

    const metadata = {
      landing_path: payload.landingPath || `/t/${landingSlug}`,
      utm_source: payload.utm_source || null,
      utm_medium: payload.utm_medium || null,
      utm_campaign: payload.utm_campaign || null,
      device_type: payload.device_type || null,
    };

    const { data: existing } = await adminClient
      .from("lead_sources")
      .select("id")
      .eq("session_id", sessionId)
      .eq("landing_tutor_id", landingTutorId)
      .eq("source", "mentor_profile")
      .maybeSingle();

    const now = new Date().toISOString();
    let leadSourceId = existing?.id || null;

    if (leadSourceId) {
      const updatePayload: Record<string, unknown> = {
        last_seen_at: now,
        referrer_tutor_id: referrerTutorId,
        metadata,
      };

      if (user?.id) {
        updatePayload.user_id = user.id;
      }

      await adminClient
        .from("lead_sources")
        .update(updatePayload)
        .eq("id", leadSourceId);
    } else {
      const { data: inserted, error: insertError } = await adminClient
        .from("lead_sources")
        .insert({
          session_id: sessionId,
          user_id: user?.id || null,
          source: "mentor_profile",
          referrer_tutor_id: referrerTutorId,
          landing_tutor_id: landingTutorId,
          metadata,
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("Mentor attribution insert failed:", insertError.message);
        return NextResponse.json({ ok: false }, { status: 200 });
      }

      leadSourceId = inserted.id;
    }

    const response = NextResponse.json({ ok: true, leadSourceId });
    const cookieOptions = {
      maxAge: MENTOR_ATTRIBUTION_COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax" as const,
    };

    response.cookies.set(mentorAttributionCookies.sessionId, sessionId, cookieOptions);
    response.cookies.set(mentorAttributionCookies.leadSourceId, leadSourceId, cookieOptions);
    response.cookies.set(mentorAttributionCookies.landingTutorId, landingTutorId, cookieOptions);
    response.cookies.set(mentorAttributionCookies.referrerTutorId, referrerTutorId || landingTutorId, cookieOptions);
    response.cookies.set(mentorAttributionCookies.acquisitionSource, "mentor_profile", cookieOptions);

    return response;
  } catch (error) {
    console.error("Mentor attribution failed:", error);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

import "server-only";
import { createClient } from "@/utils/supabase/server";
import { campusConfiguration } from "./security";
export async function campusSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: flag, error } = await supabase
    .from("feature_flags")
    .select("enabled")
    .eq("key", "virtual_campus_enabled")
    .maybeSingle();
  if (error || !flag?.enabled || !campusConfiguration()) return null;
  const { data: identity, error: identityError } =
    await supabase.rpc("campus_self");
  if (identityError || !identity) return null;
  return { supabase, identity, userId: user.id };
}
export function campusJson(value: unknown, status = 200) {
  return Response.json(value, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

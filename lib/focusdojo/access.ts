import { createClient } from "@/utils/supabase/server";
import {
  FOCUSDOJO_PRO_PRODUCT_KEY,
  type FocusDojoAccessLevel,
} from "@/lib/focusdojo/access-levels";
export type {
  FocusDojoAccessLevel,
  FocusDojoLockedReason,
} from "@/lib/focusdojo/access-levels";
export {
  FOCUSDOJO_PRO_PRODUCT_KEY,
  canAccessFocusDojoItem,
  getLockedReason,
} from "@/lib/focusdojo/access-levels";

export async function isActiveFocusDojoProSubscriber(userId: string) {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .eq("product_key", FOCUSDOJO_PRO_PRODUCT_KEY)
    .in("status", ["active", "trialing"])
    .or(`current_period_end.is.null,current_period_end.gte.${now}`)
    .limit(1)
    .maybeSingle();

  return Boolean(data);
}

export async function isActiveScienceDojoStudent(userId: string) {
  const supabase = await createClient();

  const { data: activeClass } = await supabase
    .from("classes")
    .select("id")
    .eq("student_id", userId)
    .eq("is_archived", false)
    .limit(1)
    .maybeSingle();

  if (activeClass) return true;

  const { data: activeBooking } = await supabase
    .from("bookings")
    .select("id")
    .eq("student_id", userId)
    .in("status", ["confirmed", "completed"])
    .limit(1)
    .maybeSingle();

  if (activeBooking) return true;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  return profile?.role === "student";
}

export async function getFocusDojoAccessLevel(
  userId?: string | null,
): Promise<FocusDojoAccessLevel> {
  if (!userId) return "free";
  if (await isActiveFocusDojoProSubscriber(userId)) return "pro";
  if (await isActiveScienceDojoStudent(userId)) return "basic";
  return "free";
}

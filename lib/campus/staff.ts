import "server-only";
import { requirePilotAdmin } from "@/lib/course-pilot";

/** A profile role alone is insufficient: campus staff are explicitly provisioned. */
export async function campusStaffSession() {
  const session = await requirePilotAdmin();
  const { data, error } = await session.supabase.rpc("campus_is_staff");
  return !error && data === true ? session : null;
}

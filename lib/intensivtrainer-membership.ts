import type { SupabaseClient } from "@supabase/supabase-js";
import { TRAINER_KEY } from "./intensivtrainer.ts";

/** Keep authorization reads fresh across a membership insert in one server render. */
export function readTrainerMembership(client: SupabaseClient, userId: string, signal: AbortSignal) {
  // Next memoizes identical GETs during a render. A caller signal opts out,
  // preventing the second read from reusing the first, pre-insert empty result.
  return client.from("workbook_memberships").select("active")
    .eq("user_id", userId).eq("book_key", TRAINER_KEY).abortSignal(signal).maybeSingle();
}

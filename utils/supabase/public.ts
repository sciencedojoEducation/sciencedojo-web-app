import { createClient } from "@supabase/supabase-js";
import { createPublicDataFetch } from "@/lib/public-data-fetch";

export function createPublicClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("Missing public Supabase configuration.");
  }

  return createClient(supabaseUrl, anonKey, {
    global: { fetch: createPublicDataFetch() },
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

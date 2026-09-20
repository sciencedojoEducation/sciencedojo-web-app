"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { resolveDashboardRole } from "@/lib/public-render";

export default function AuthenticatedHomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    let active = true;

    async function redirectSignedInUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!active || !user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      const initialRole = profile?.role || user.user_metadata?.role;
      let hasTutorApplication = false;
      if (!initialRole || initialRole === "parent") {
        const { data: application } = await supabase
          .from("applications")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        hasTutorApplication = Boolean(application);
      }

      const role = resolveDashboardRole(profile?.role, user.user_metadata?.role, hasTutorApplication);
      if (active) router.replace(`/dashboard/${role}`);
    }

    void redirectSignedInUser();
    return () => {
      active = false;
    };
  }, [router]);

  return null;
}

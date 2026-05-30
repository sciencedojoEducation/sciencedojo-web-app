import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { redirect } from "next/navigation";
import AdminTutorsDirectory from "./AdminTutorsDirectory";

export default async function AdminTutorsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    redirect("/dashboard/parent");
  }

  // Use admin client for cross-user queries to bypass RLS
  const adminClient = createAdminClient();

  // --- ZERO-JOIN AUTO-REPAIR ARCHITECTURE ---
  // 1. Fetch all profiles with role = 'tutor'
  const { data: tutorProfiles } = await adminClient
    .from("profiles")
    .select("id, full_name, email, avatar_url, created_at")
    .eq("role", "tutor")
    .order("created_at", { ascending: false });

  // 2. Fetch all entries from the tutors table
  const { data: rawTutorData } = await adminClient
    .from("tutors")
    .select("*");

  // 3. Fetch ALL applications with full data (including JSONB `data` column)
  const { data: applications, error: appError } = await adminClient
    .from("applications")
    .select("*");

  if (appError) {
    console.error("❌ Failed to fetch applications:", appError.message);
  }

  console.log(`📊 Admin fetch: ${tutorProfiles?.length} tutor profiles, ${applications?.length} applications`);
  applications?.forEach(a => {
    console.log(`   App: user_id=${a.user_id} status=${a.status} has_data=${!!a.data} stage=${a.data?.current_stage}`);
  });

  const applicationMap = Object.fromEntries(applications?.map(a => [a.user_id, a]) || []);

  // 4. AUTO-REPAIR: If any profile is missing a detailed 'tutors' record, create it now.
  const tutorMap = Object.fromEntries(rawTutorData?.map(t => [t.id, t]) || []);
  const missingRecords = tutorProfiles?.filter(p => !tutorMap[p.id]) || [];

  if (missingRecords.length > 0) {
    console.log(`🔧 Auto-Repairing ${missingRecords.length} missing tutor records...`);
    await adminClient.from("tutors").upsert(
      missingRecords.map(p => ({
        id: p.id,
        subjects: ['General'],
        hourly_rate: 30,
        is_verified: false,
        rating: 0
      }))
    );
    
    const { data: finalData } = await adminClient.from("tutors").select("*");
    const finalMap = Object.fromEntries(finalData?.map(t => [t.id, t]) || []);
    var mergedTutors = tutorProfiles?.map(p => ({
      ...p,
      tutorDetail: finalMap[p.id] || null,
      application: applicationMap[p.id] || null,
    })) || [];
  } else {
    var mergedTutors = tutorProfiles?.map(p => ({
      ...p,
      tutorDetail: tutorMap[p.id] || null,
      application: applicationMap[p.id] || null,
    })) || [];
  }

  const pendingTutors = mergedTutors.filter(t => !t.tutorDetail?.is_verified);
  const verifiedTutors = mergedTutors.filter(t => t.tutorDetail?.is_verified);

  return <AdminTutorsDirectory pendingTutors={pendingTutors} verifiedTutors={verifiedTutors} />;
}

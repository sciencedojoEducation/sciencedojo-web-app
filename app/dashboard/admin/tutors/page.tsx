import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { redirect } from "next/navigation";
import Image from "next/image";
import VerifyButton from "./VerifyButton";
import PendingTutorsTable from "./PendingTutorsTable";

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

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen space-y-12">
      <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
         <div>
            <h1 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Tutor Command Center 🏴</h1>
            <p className="text-slate-500 font-medium tracking-tight">Review applications, verify experts, and manage the marketplace.</p>
         </div>
         
         <div className="bg-slate-50 border border-slate-200 px-6 py-3 rounded-2xl flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400 shadow-sm">
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
               Pending: {pendingTutors.length}
            </div>
            <div className="flex items-center gap-2 border-l border-slate-200 pl-6">
               <div className="w-2 h-2 rounded-full bg-green-500"></div>
               Verified: {verifiedTutors.length}
            </div>
         </div>
      </div>

      {/* PENDING APPROVAL SECTION */}
      {pendingTutors.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-black text-amber-600 tracking-tight uppercase text-xs bg-amber-50 px-4 py-2 rounded-full border border-amber-100">
              ⚡ Pending Review ({pendingTutors.length})
            </h2>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-amber-200 to-transparent"></div>
          </div>

          <PendingTutorsTable tutors={pendingTutors} />
        </section>
      )}

      {/* VERIFIED MARKETPLACE SECTION */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase text-xs bg-slate-100 px-4 py-2 rounded-full border border-slate-200">
            ✅ Live Marketplace ({verifiedTutors.length})
          </h2>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-slate-200 to-transparent"></div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] bg-slate-50/30">
                <th className="p-8">Expert Profile</th>
                <th className="p-8">Marketplace Stats</th>
                <th className="p-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="font-medium text-slate-600">
              {verifiedTutors.map((tutor: any, i) => (
                <tr key={tutor.id} className="group hover:bg-slate-50/50 transition-all border-b border-slate-100 last:border-0">
                  <td className="p-8">
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-full border-2 border-white shadow-md overflow-hidden bg-slate-100 ring-2 ring-slate-100">
                          <Image src={tutor.avatar_url || "/tutor_placeholder.webp"} alt={tutor.full_name} fill className="object-cover" />
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 bg-blue-500 text-white p-1 rounded-full border-2 border-white shadow-sm z-10 flex items-center justify-center">
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </div>
                      </div>
                      <div>
                        <div className="font-black text-slate-800 text-lg tracking-tight">{tutor.full_name}</div>
                        <div className="text-xs text-slate-400 font-bold">{tutor.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-8">
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Fee</p>
                        <p className="font-black text-slate-800">£{tutor.tutorDetail?.hourly_rate}/hr</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Rating</p>
                        <p className="font-black text-slate-800">⭐ {tutor.tutorDetail?.rating || "N/A"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-8 text-right space-x-2">
                    <a href={`/tutor/${tutor.id}`} target="_blank" className="inline-block px-4 py-3 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all">
                      View Profile
                    </a>
                    <VerifyButton tutorId={tutor.id} isVerified={true} />
                  </td>
                </tr>
              ))}
              {verifiedTutors.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-12 text-center text-slate-400 italic">No verified tutors yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

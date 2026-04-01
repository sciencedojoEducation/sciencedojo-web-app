import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import VerifyButton from "./VerifyButton";

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

  // --- ZERO-JOIN AUTO-REPAIR ARCHITECTURE ---
  // 1. Fetch all profiles with role = 'tutor'
  const { data: tutorProfiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url, created_at")
    .eq("role", "tutor")
    .order("created_at", { ascending: false });

  // 2. Fetch all entries from the tutors table
  const { data: rawTutorData } = await supabase
    .from("tutors")
    .select("*");

  // 3. AUTO-REPAIR: If any profile is missing a detailed 'tutors' record, create it now.
  const tutorMap = Object.fromEntries(rawTutorData?.map(t => [t.id, t]) || []);
  const missingRecords = tutorProfiles?.filter(p => !tutorMap[p.id]) || [];

  if (missingRecords.length > 0) {
    console.log(`🔧 Auto-Repairing ${missingRecords.length} missing tutor records...`);
    await supabase.from("tutors").upsert(
      missingRecords.map(p => ({
        id: p.id,
        subjects: ['General'],
        hourly_rate: 30,
        is_verified: false,
        rating: 0
      }))
    );
    
    // Final sync fetch to ensure the view is 100% complete
    const { data: finalData } = await supabase.from("tutors").select("*");
    const finalMap = Object.fromEntries(finalData?.map(t => [t.id, t]) || []);
    var mergedTutors = tutorProfiles?.map(p => ({
      ...p,
      tutorDetail: finalMap[p.id] || null
    })) || [];
  } else {
    var mergedTutors = tutorProfiles?.map(p => ({
      ...p,
      tutorDetail: tutorMap[p.id] || null
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

          <div className="bg-white rounded-[2.5rem] border-2 border-amber-100 shadow-xl shadow-amber-900/5 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-amber-100 text-amber-600/40 text-[10px] font-black uppercase tracking-[0.2em] bg-amber-50/30">
                  <th className="p-8">Application</th>
                  <th className="p-8">Draft Profile</th>
                  <th className="p-8 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="font-medium text-slate-600">
                {pendingTutors.map((tutor: any, i) => (
                  <tr key={tutor.id} className="group hover:bg-amber-50/30 transition-all border-b border-amber-50 last:border-0">
                    <td className="p-8">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl border-2 border-white shadow-md overflow-hidden bg-slate-100 ring-2 ring-amber-100 relative">
                          <Image src={tutor.avatar_url || "/tutor_placeholder.webp"} alt={tutor.full_name} fill className="object-cover" />
                        </div>
                        <div>
                          <div className="font-black text-slate-800 text-lg tracking-tight">{tutor.full_name}</div>
                          <div className="text-xs text-slate-400 font-bold">{tutor.email}</div>
                          <div className="text-[9px] uppercase font-black text-amber-400 mt-2 tracking-widest">Applied {new Date(tutor.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-8">
                      <div className="max-w-md">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                            {tutor.tutorDetail?.education_level ? `${tutor.tutorDetail.education_level} @ ${tutor.tutorDetail.university || 'N/A'}` : 'No Credentials'}
                          </span>
                          {tutor.tutorDetail?.has_teaching_license && (
                            <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded">Licensed</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 italic mb-3">"{tutor.tutorDetail?.experience_summary || tutor.tutorDetail?.bio || "No summary written yet."}"</p>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                             <span className="text-sm font-black text-slate-800">£{tutor.tutorDetail?.hourly_rate}/hr</span>
                             <div className="flex gap-1">
                               {tutor.tutorDetail?.subjects?.slice(0, 2).map((s: string) => (
                                 <span key={s} className="text-[8px] font-black bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-tighter">{s}</span>
                               ))}
                             </div>
                          </div>
                          {tutor.tutorDetail?.cv_url && (
                             <a href={tutor.tutorDetail.cv_url} target="_blank" rel="noreferrer" className="text-[10px] font-black text-indigo-500 hover:underline uppercase tracking-widest border-l border-slate-200 pl-4">
                               View CV/LinkedIn ↗
                             </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-8 text-right space-x-2">
                       <a href={`/tutor/${tutor.id}`} target="_blank" className="inline-block px-4 py-3 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all">
                         🔍 Preview
                       </a>
                       <VerifyButton tutorId={tutor.id} isVerified={false} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                      <div className="w-14 h-14 rounded-full border-2 border-white shadow-md overflow-hidden bg-slate-100 ring-2 ring-slate-100 relative">
                        <Image src={tutor.avatar_url || "/tutor_placeholder.webp"} alt={tutor.full_name} fill className="object-cover" />
                        <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1 rounded-full border-2 border-white">
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
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

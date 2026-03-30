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

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen">
      <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
         <div>
            <h1 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Tutors Directory</h1>
            <p className="text-slate-500 font-medium tracking-tight">Full platform roster management and verification.</p>
         </div>
         
         {/* DIAGNOSTICS BANNER (Temporary) */}
         <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-blue-500"></div>
               Profiles: {tutorProfiles?.length || 0}
            </div>
            <div className="flex items-center gap-2">
               <div className={`w-2 h-2 rounded-full ${rawTutorData?.length === tutorProfiles?.length ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`}></div>
               Tutor Entries: {rawTutorData?.length || 0}
            </div>
         </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden transition-all duration-300">
         <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 backdrop-blur-sm">
            <h2 className="font-black text-slate-800 tracking-tight uppercase text-xs">All Registered Tutors ({mergedTutors.length})</h2>
         </div>
         <table className="w-full text-left border-collapse">
            <thead>
               <tr className="border-b border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] bg-slate-50/30">
                  <th className="p-8">Tutor Profile</th>
                  <th className="p-8">Subjects & Rate</th>
                  <th className="p-8 text-center">Marketplace Status</th>
                  <th className="p-8 text-right">Actions</th>
               </tr>
            </thead>
            <tbody className="font-medium text-slate-600">
               {mergedTutors.map((tutor: any, i) => {
                  const detail = tutor.tutorDetail;
                  const isVerified = detail?.is_verified || false;

                  return (
                    <tr key={tutor.id} className={`group hover:bg-slate-50/50 transition-all ${i !== mergedTutors.length - 1 ? 'border-b border-slate-100' : ''}`}>
                       <td className="p-8">
                          <div className="flex items-center gap-6">
                             <div className="relative">
                               <div className="w-14 h-14 rounded-full border-2 border-white shadow-md overflow-hidden bg-slate-100 ring-2 ring-slate-100">
                                 <Image src={tutor.avatar_url || "/tutor_placeholder.webp"} alt={tutor.full_name} fill className="object-cover group-hover:scale-105 transition-transform" />
                               </div>
                               {isVerified && (
                                 <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1 rounded-full border-2 border-white">
                                   <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                                 </div>
                               )}
                             </div>
                             <div>
                               <div className="font-black text-slate-800 text-lg tracking-tight -mb-0.5">{tutor.full_name}</div>
                               <div className="text-xs text-slate-400 font-bold">{tutor.email}</div>
                               <div className="text-[9px] uppercase font-black text-slate-300 mt-2 tracking-widest">Joined {new Date(tutor.created_at).toLocaleDateString()}</div>
                             </div>
                          </div>
                       </td>
                       <td className="p-8">
                          {detail?.subjects && detail.subjects.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {detail.subjects.map((sub: string) => (
                                <span key={sub} className="text-[9px] uppercase font-black bg-indigo-50 border border-indigo-100 text-indigo-600 px-2.5 py-1 rounded-full tracking-widest leading-none">
                                  {sub}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic font-bold mb-3 block">No subjects listed</span>
                          )}
                          <div className="flex items-baseline gap-1">
                             <span className="text-lg font-black text-slate-800">£{detail?.hourly_rate || 0}</span>
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">/hr</span>
                          </div>
                       </td>
                       <td className="p-8 text-center text-[10px]">
                          <span className={`px-4 py-1.5 rounded-full font-black uppercase tracking-widest shadow-sm ${
                            isVerified 
                              ? "bg-green-100 text-green-700 border border-green-200" 
                              : "bg-red-50 text-red-600 border border-red-100 animate-pulse"
                          }`}>
                            {isVerified ? "Verified (Live)" : "Unverified (Hidden)"}
                          </span>
                       </td>
                       <td className="p-8 text-right">
                          <VerifyButton tutorId={tutor.id} isVerified={isVerified} />
                       </td>
                    </tr>
                  )
               })}
               
               {mergedTutors.length === 0 && (
                 <tr>
                   <td colSpan={4} className="p-24 text-center">
                      <div className="text-slate-300 mb-2">
                        <svg className="w-12 h-12 mx-auto opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                      </div>
                      <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">No tutors found.</p>
                   </td>
                 </tr>
               )}
            </tbody>
         </table>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { BookOpen, CalendarDays, ClipboardCheck, Compass, Loader2, Target, TrendingUp } from "lucide-react";
import { generateClassroomMission } from "../../classes/[id]/missions/actions";
import MissionViewer from "./MissionViewer";

const missionOptions = [
   {
      tier: "daily",
      label: "Daily Missions",
      detail: "Short reinforcement from recent lessons",
      icon: ClipboardCheck,
      tone: "text-emerald-300",
   },
   {
      tier: "weekly",
      label: "Weekly Focus",
      detail: "A focused pathway for this week's priority",
      icon: CalendarDays,
      tone: "text-cyan-200",
   },
   {
      tier: "monthly",
      label: "Monthly Growth",
      detail: "Broader review across recent class records",
      icon: TrendingUp,
      tone: "text-blue-200",
   },
   {
      tier: "annual",
      label: "Exam Preparation",
      detail: "Longer review for exam readiness",
      icon: BookOpen,
      tone: "text-indigo-200",
   },
   {
      tier: "improvement_drill",
      label: "Improvement Drills",
      detail: "Targeted support for a weak area",
      icon: Target,
      tone: "text-amber-200",
   },
] as const;

const tierLabels: Record<string, string> = {
   daily: "Daily Mission",
   weekly: "Weekly Focus",
   monthly: "Monthly Growth",
   quarterly: "Progress Review",
   semi_annual: "Exam Preparation",
   annual: "Exam Preparation",
   improvement_drill: "Improvement Drill",
};

const statusLabels: Record<string, string> = {
   pending_assessment: "Ready for practice",
   pending_tutor_approval: "Awaiting tutor review",
   completed: "Completed",
};

export default function GlobalMissionsPage() {
   const [classes, setClasses] = useState<any[]>([]);
   const [selectedClassId, setSelectedClassId] = useState<string>("");
   
   const [missions, setMissions] = useState<any[]>([]);
   const [activeMission, setActiveMission] = useState<any>(null);
   
   const [isGenerating, setIsGenerating] = useState(false);
   const [userId, setUserId] = useState<string>("");

   const supabase = createClient();

   useEffect(() => {
      const load = async () => {
         const { data: { user } } = await supabase.auth.getUser();
         if (!user) return;
         setUserId(user.id);

         // Fetch Classes
         const { data: classData } = await supabase
            .from("classes")
            .select("id, display_name, subject")
            .eq("student_id", user.id)
            .eq("is_archived", false);
         
         if (classData) {
            setClasses(classData);
            if (classData.length > 0) setSelectedClassId(classData[0].id);
         }

         // Fetch All Global Missions
         const { data: missionData } = await supabase
            .from("student_missions")
            .select("*, classes(display_name, subject)")
            .eq("student_id", user.id)
            .order("created_at", { ascending: false });
         
         if (missionData) setMissions(missionData);
      };
      load();
   }, []);

   const initiateMission = async (tier: any) => {
       if (!selectedClassId) return;
       setIsGenerating(true);
       try {
           const res = await generateClassroomMission(selectedClassId, tier);
           if (res.error) alert(res.error);
           else {
               // Refresh missions
               const { data: missionData } = await supabase
                  .from("student_missions")
                  .select("*, classes(display_name, subject)")
                  .eq("student_id", userId)
                  .order("created_at", { ascending: false });
               if (missionData) setMissions(missionData);
           }
       } catch (e) {
           console.error(e);
       }
       setIsGenerating(false);
   };

   // Active Taking State
   if (activeMission) {
       return (
           <div className="max-w-4xl mx-auto space-y-8 pb-12 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <button 
                 onClick={() => { setActiveMission(null); }}
                 className="mb-4 font-black text-slate-500 hover:text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2"
               >
                   ← Return to Learning Journeys
               </button>
               <MissionViewer 
                 mission={activeMission.mission_blueprint} 
                 missionId={activeMission.id} 
                 onComplete={async () => {
                     setActiveMission(null);
                     // Refetch missions to update status
                     const { data } = await supabase
                         .from("student_missions")
                         .select("*, classes(display_name, subject)")
                         .eq("student_id", userId)
                         .order("created_at", { ascending: false });
                     if (data) setMissions(data);
                 }} 
               />
           </div>
       );
   }

   return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12 pt-4 animate-in fade-in md:space-y-8">
        
       {/* Hero Control Panel */}
       <div className="relative flex flex-col gap-6 overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-[#1E5AA8] to-slate-900 p-5 text-white shadow-xl md:flex-row md:items-center md:justify-between md:gap-8 md:rounded-[3rem] md:p-12 md:shadow-2xl">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
          
          <div className="relative z-10 w-full md:w-1/2">
             <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-cyan-200 shadow-lg backdrop-blur-md md:mb-6 md:h-16 md:w-16">
                <Compass size={26} />
             </div>
             <h1 className="mb-3 text-3xl font-black tracking-tight md:mb-4 md:text-4xl">Personalized Learning Journeys</h1>
             <p className="mb-5 text-sm font-medium leading-relaxed text-indigo-100 md:mb-6 md:text-lg">
               Select an active class to prepare guided reinforcement based on your lessons, class records, tutor context, and learning goals.
             </p>
             
             <div className="rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur-md">
                <p className="text-[10px] font-black uppercase tracking-widest text-cyan-200 mb-2">Learning pathway</p>
                <select 
                  className="w-full bg-white/10 border-white/20 text-white font-bold rounded-xl p-3 outline-none"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                >
                   {classes.map(c => (
                      <option key={c.id} value={c.id} className="text-slate-900">{c.display_name} ({c.subject})</option>
                   ))}
                </select>
             </div>
          </div>

          <div className="relative z-10 flex w-full flex-col gap-2.5 md:w-1/2 md:gap-3">
              {missionOptions.map((option) => {
                 const Icon = option.icon;
                 return (
                    <button key={option.tier} onClick={() => initiateMission(option.tier)} disabled={isGenerating || !selectedClassId} className="flex w-full items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/10 p-3 text-left font-bold text-white shadow-sm transition-all hover:bg-white/15 disabled:opacity-50 md:p-4 md:shadow-xl">
                       <span className="flex min-w-0 items-center gap-3">
                          <Icon size={18} className={`${option.tone} shrink-0`} />
                          <span>
                             <span className="block">{option.label}</span>
                             <span className="block text-[11px] font-bold text-white/45 mt-0.5">{option.detail}</span>
                          </span>
                       </span>
                    </button>
                 );
              })}
              {isGenerating && <div className="text-center text-xs font-bold text-cyan-200 animate-pulse mt-2 flex items-center justify-center gap-2"><Loader2 className="animate-spin" size={14}/> Preparing your next learning pathway...</div>}
          </div>
       </div>

       {/* Unified Dashboard */}
       <div>
         <div className="mb-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Current and completed learning journeys</h3>
            <p className="mt-1 text-sm font-medium text-slate-500">Each pathway shows why it exists, where it came from, and what should happen next.</p>
         </div>
         <div className="space-y-4">
            {missions.map((m, index) => {
               // Calculate sequential ID (oldest is #001, newest is the highest number)
               const missionNumber = String(missions.length - index).padStart(3, '0');
               
               return (
               <div key={m.id} className="flex flex-col gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between md:p-6">
                   <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-sm ${
                             m.mission_tier === 'daily' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                             m.mission_tier === 'weekly' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                             m.mission_tier === 'monthly' ? 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200' :
                             m.mission_tier === 'annual' ? 'bg-red-50 text-red-700 border-red-200' :
                             'bg-slate-50 text-slate-700 border-slate-200'
                          }`}>{tierLabels[m.mission_tier] || m.mission_tier}</span>
                          <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-sm ${
                             m.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                             m.status === 'pending_assessment' ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                             {statusLabels[m.status] || m.status.replace(/_/g, " ")}
                          </span>
                          <span className="rounded-full border border-[#1E5AA8]/20 bg-[#1E5AA8]/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#1E5AA8] shadow-sm">
                             Pathway {missionNumber}
                          </span>
                      </div>
                      <h4 className="text-lg font-black text-slate-800">{m.mission_blueprint?.topic || "Guided practice pathway"}</h4>
                      <p className="mt-1 text-xs font-medium text-slate-500">
                         Linked class: <span className="font-bold text-slate-700">{m.classes?.display_name || "Your class"}</span> • Prepared {new Date(m.created_at).toLocaleDateString()} at {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <div className="mt-4 rounded-2xl border border-[#1E5AA8]/10 bg-[#1E5AA8]/5 p-3 md:p-4">
                         <p className="text-[10px] font-black uppercase tracking-widest text-[#1E5AA8]">Why this pathway exists</p>
                         <p className="mt-1 text-sm font-medium leading-relaxed text-slate-600">
                            This Mission is connected to your class records and recent lesson pathway, so practice supports the next area of progress.
                         </p>
                      </div>
                   </div>
                   <div className="flex flex-col gap-3 sm:flex-row sm:items-center md:shrink-0 md:gap-6">
                      {m.score_percentage !== null && (
                          <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-left sm:text-right">
                             <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70">Tutor-reviewed progress</p>
                             <p className="text-2xl font-black text-emerald-600 md:text-3xl">{m.score_percentage}%</p>
                          </div>
                      )}
                      
                      {m.status === 'pending_assessment' ? (
                          <button onClick={() => setActiveMission(m)} className="min-h-11 rounded-xl bg-slate-900 px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-md transition-colors hover:bg-slate-800 md:px-8 md:py-4 md:shadow-lg">
                             Start Guided Practice
                          </button>
                      ) : (
                          <div className="rounded-xl bg-slate-100 px-6 py-3 text-center text-xs font-black uppercase tracking-widest text-slate-400 md:px-8 md:py-4">
                             {m.status === "pending_tutor_approval" ? "Tutor review next" : "Pathway complete"}
                          </div>
                      )}
                   </div>
               </div>
            )})}
            {missions.length === 0 && (
               <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400">
                  <Target size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="font-bold">No learning journeys yet. Choose a class above to prepare structured practice.</p>
               </div>
            )}
         </div>
       </div>

    </div>
  );
}

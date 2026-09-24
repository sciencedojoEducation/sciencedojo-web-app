"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { BookOpen, CalendarDays, ClipboardCheck, Loader2, Target, TrendingUp } from "lucide-react";
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
   type StudentClass = { id: string; display_name: string; subject: string };
   type Mission = {
      id: string;
      status: string;
      mission_tier: string;
      score_percentage: number | null;
      created_at: string;
      mission_blueprint: React.ComponentProps<typeof MissionViewer>["mission"];
      classes: { display_name: string; subject: string } | { display_name: string; subject: string }[] | null;
   };
   const [classes, setClasses] = useState<StudentClass[]>([]);
   const [selectedClassId, setSelectedClassId] = useState<string>("");
   
   const [missions, setMissions] = useState<Mission[]>([]);
   const [activeMission, setActiveMission] = useState<Mission | null>(null);
   
   const [isGenerating, setIsGenerating] = useState(false);
   const [userId, setUserId] = useState<string>("");
   const readyMissions = missions.filter((mission) => mission.status === "pending_assessment");
   const otherMissions = missions.filter((mission) => mission.status !== "pending_assessment");

   const supabase = useMemo(() => createClient(), []);

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
         
         if (missionData) setMissions(missionData as Mission[]);
      };
      load();
   }, [supabase]);

   const initiateMission = async (tier: typeof missionOptions[number]["tier"]) => {
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
               if (missionData) setMissions(missionData as Mission[]);
           }
       } catch (e) {
           console.error(e);
       }
       setIsGenerating(false);
   };

   // Active Taking State
   if (activeMission) {
       return (
           <div className="mx-auto max-w-4xl space-y-5 px-3 pb-12 pt-4 sm:px-4">
               <button 
                 onClick={() => { setActiveMission(null); }}
                 className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-600 hover:bg-white hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f53a5]"
               >
                   ← Back to Missions
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
                     if (data) setMissions(data as Mission[]);
                 }} 
               />
           </div>
       );
   }

   return (
    <div data-role="student" className="dashboard-home mx-auto max-w-5xl space-y-5 px-3 pb-12 pt-5 sm:px-4 md:p-8">
       <header>
          <p className="dashboard-kicker">Practice &amp; focus</p>
          <h1 className="dashboard-title mt-1 text-2xl md:text-3xl">Missions</h1>
          <p className="dashboard-subtitle mt-2 max-w-2xl text-sm leading-6">Practise one step at a time, then use your tutor’s feedback to guide what comes next.</p>
       </header>

       {readyMissions.length > 0 && (
          <section aria-labelledby="ready-missions-title" className="dashboard-priority p-4 md:p-6">
             <h2 id="ready-missions-title" className="dashboard-title text-xl">Ready for practice</h2>
             <div className="mt-4 space-y-2">
                {readyMissions.map((mission) => (
                   <div key={mission.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                         <p className="text-sm font-semibold text-slate-900">{mission.mission_blueprint?.topic || "Guided practice pathway"}</p>
                         <p className="mt-1 text-xs text-slate-600">{(Array.isArray(mission.classes) ? mission.classes[0]?.display_name : mission.classes?.display_name) || "Your class"} · {tierLabels[mission.mission_tier] || "Mission"}</p>
                      </div>
                      <button type="button" onClick={() => setActiveMission(mission)} className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-secondary px-4 text-sm font-semibold text-white hover:bg-secondary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f53a5] focus-visible:ring-offset-2">Start practice</button>
                   </div>
                ))}
             </div>
          </section>
       )}
        
       {/* Hero Control Panel */}
       <section aria-labelledby="create-mission-title" className="dashboard-panel flex flex-col gap-5 p-4 md:flex-row md:items-start md:gap-8 md:p-6">
          
          <div className="w-full md:w-[42%]">
             <h2 id="create-mission-title" className="dashboard-title text-xl">Create another Mission</h2>
             <p className="dashboard-subtitle mt-2 text-sm leading-6">
               Choose a class and a practice length. Your Mission will draw on its lesson context.
             </p>
             
             <div className="mt-4">
                <label htmlFor="mission-class" className="mb-2 block text-sm font-semibold text-slate-700">Class</label>
                <select 
                  id="mission-class"
                  className="min-h-11 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm font-medium text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f53a5]"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                >
                   {classes.length === 0 && <option value="">No active classes yet</option>}
                   {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.display_name} ({c.subject})</option>
                   ))}
                </select>
             </div>
          </div>

          <div className="flex w-full flex-col gap-2 md:w-[58%]">
              {missionOptions.map((option) => {
                 const Icon = option.icon;
                 return (
                    <button key={option.tier} onClick={() => initiateMission(option.tier)} disabled={isGenerating || !selectedClassId} className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left text-slate-900 transition-colors hover:border-[#4f53a5]/40 hover:bg-[#eeefff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f53a5] disabled:cursor-not-allowed disabled:opacity-50">
                       <span className="flex min-w-0 items-center gap-3">
                          <Icon size={18} className="shrink-0 text-[#4f53a5]" aria-hidden="true" />
                          <span>
                             <span className="block text-sm font-semibold">{option.label}</span>
                             <span className="mt-0.5 block text-xs text-slate-600">{option.detail}</span>
                          </span>
                       </span>
                    </button>
                 );
              })}
              {isGenerating && <div role="status" className="mt-2 flex items-center gap-2 text-sm text-slate-700"><Loader2 className="animate-spin" size={16} aria-hidden="true"/> Preparing your next Mission...</div>}
          </div>
       </section>

       {/* Unified Dashboard */}
       <div>
         <div className="mb-4">
            <h2 className="dashboard-title text-xl">Awaiting review and completed</h2>
            <p className="dashboard-subtitle mt-1 text-sm">Your earlier work stays here so you can track progress.</p>
         </div>
         <div className="space-y-4">
            {otherMissions.map((m) => {
               // Calculate sequential ID (oldest is #001, newest is the highest number)
               const missionNumber = String(missions.length - missions.findIndex((candidate) => candidate.id === m.id)).padStart(3, '0');
               
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
                         Linked class: <span className="font-bold text-slate-700">{(Array.isArray(m.classes) ? m.classes[0]?.display_name : m.classes?.display_name) || "Your class"}</span> • Prepared {new Date(m.created_at).toLocaleDateString()} at {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
            {otherMissions.length === 0 && (
               <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400">
                  <Target size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="font-semibold">{readyMissions.length > 0 ? "Completed work and tutor reviews will appear here." : "No Missions yet. Choose a class above to create structured practice."}</p>
               </div>
            )}
         </div>
       </div>

    </div>
  );
}

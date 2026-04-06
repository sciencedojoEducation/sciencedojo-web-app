"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Sparkles, Loader2, BookOpen, Zap, LayoutDashboard, Target } from "lucide-react";
import { generateClassroomMission } from "../../classes/[id]/missions/actions";
import MissionViewer from "./MissionViewer";

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
                   ← Return to Mission Control
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
    <div className="max-w-5xl mx-auto space-y-8 pb-12 pt-4 animate-in fade-in">
        
       {/* Hero Control Panel */}
       <div className="bg-gradient-to-br from-indigo-900 via-[#1E5AA8] to-emerald-900 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row gap-8 items-center justify-between">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
          
          <div className="relative z-10 w-full md:w-1/2">
             <div className="w-16 h-16 bg-white/10 text-emerald-400 rounded-2xl flex items-center justify-center mb-6 shadow-xl backdrop-blur-md border border-white/20">
                <Sparkles size={32} />
             </div>
             <h1 className="text-4xl font-black tracking-tight mb-4">Mission Control</h1>
             <p className="text-indigo-100 font-medium text-lg leading-relaxed mb-6">
               Select an active class below to synthesize your next Exam based on your Sensei's internal lesson logs.
             </p>
             
             <div className="bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300 mb-2">Target Subject</p>
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

          <div className="relative z-10 w-full md:w-1/2 flex flex-col gap-3">
              <button onClick={() => initiateMission('daily')} disabled={isGenerating || !selectedClassId} className="w-full p-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl flex justify-between items-center font-bold transition-all disabled:opacity-50 text-white shadow-xl">
                 <span className="flex items-center gap-3"><Zap size={18} className="text-yellow-400"/> Daily Checkpoint</span>
                 <span className="text-[10px] uppercase font-black tracking-widest opacity-50">1 Lesson</span>
              </button>
              <button onClick={() => initiateMission('monthly')} disabled={isGenerating || !selectedClassId} className="w-full p-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl flex justify-between items-center font-bold transition-all disabled:opacity-50 text-white shadow-xl">
                 <span className="flex items-center gap-3"><Target size={18} className="text-fuchsia-400"/> Monthly Deep Dive</span>
                 <span className="text-[10px] uppercase font-black tracking-widest opacity-50">4 Weeks Context</span>
              </button>
              <button onClick={() => initiateMission('annual')} disabled={isGenerating || !selectedClassId} className="w-full p-4 bg-indigo-900/50 hover:bg-indigo-800/50 border border-indigo-400/30 rounded-2xl flex justify-between items-center font-bold transition-all disabled:opacity-50 text-indigo-200 shadow-xl">
                 <span className="flex items-center gap-3"><BookOpen size={18} className="text-red-400"/> Annual Exam (Extrême)</span>
                 <span className="text-[10px] uppercase font-black tracking-widest opacity-50">Full Year Context</span>
              </button>
              {isGenerating && <div className="text-center text-xs font-bold text-emerald-400 animate-pulse mt-2 flex items-center justify-center gap-2"><Loader2 className="animate-spin" size={14}/> SYNTHESIZING MISSION VIA AI CORE...</div>}
          </div>
       </div>

       {/* Unified Dashboard */}
       <div>
         <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-4">Pending & Completed Missions</h3>
         <div className="space-y-4">
            {missions.map((m, index) => {
               // Calculate sequential ID (oldest is #001, newest is the highest number)
               const missionNumber = String(missions.length - index).padStart(3, '0');
               
               return (
               <div key={m.id} className="bg-white p-6 rounded-[1.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                   <div>
                      <div className="flex items-center gap-3 mb-2">
                          <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md border shadow-sm ${
                             m.mission_tier === 'daily' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                             m.mission_tier === 'weekly' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                             m.mission_tier === 'monthly' ? 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200' :
                             m.mission_tier === 'annual' ? 'bg-red-50 text-red-700 border-red-200' :
                             'bg-slate-50 text-slate-700 border-slate-200'
                          }`}>{m.mission_tier}</span>
                          <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md shadow-sm border ${
                             m.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                             m.status === 'pending_assessment' ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                             {m.status.replace(/_/g, " ")}
                          </span>
                          <span className="px-3 py-1 bg-[#1E5AA8]/10 text-[#1E5AA8] text-[10px] font-black uppercase tracking-widest rounded-md border border-[#1E5AA8]/20 shadow-sm">
                             ID: {missionNumber}
                          </span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-lg">{m.mission_blueprint?.topic || "Active Assessment"}</h4>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                         Found in: <span className="font-bold text-slate-700">{m.classes?.display_name || "Unknown Class"}</span> • Generated {new Date(m.created_at).toLocaleDateString()} at {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                   </div>
                   <div className="flex items-center gap-6">
                      {m.score_percentage !== null && (
                          <div className="text-right">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Score</p>
                             <p className="font-black text-3xl text-emerald-500">{m.score_percentage}%</p>
                          </div>
                      )}
                      
                      {m.status === 'pending_assessment' ? (
                          <button onClick={() => setActiveMission(m)} className="px-8 py-4 bg-slate-900 text-white text-xs font-black tracking-widest uppercase rounded-xl hover:bg-slate-800 transition-colors shadow-lg">
                             Take Mission
                          </button>
                      ) : (
                          <div className="px-8 py-4 bg-slate-100 text-slate-400 text-xs font-black tracking-widest uppercase rounded-xl">
                             No Actions
                          </div>
                      )}
                   </div>
               </div>
            )})}
            {missions.length === 0 && (
               <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400">
                  <Target size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="font-bold">No active missions found across your classes.</p>
               </div>
            )}
         </div>
       </div>

    </div>
  );
}

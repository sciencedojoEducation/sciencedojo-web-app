"use client";

import { useState, useEffect } from "react";
import { generateClassroomMission } from "./actions";
import { createClient } from "@/utils/supabase/client";
import { Loader2, Zap, BrainCircuit, Target, LayoutDashboard, LineChart as LineChartIcon } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import MissionViewer from "../../../student/missions/MissionViewer";

export default function MissionsDashboard({ classId, studentId, tutorId }: { classId: string, studentId: string, tutorId: string }) {
   const [missions, setMissions] = useState<any[]>([]);
   const [isGenerating, setIsGenerating] = useState(false);
   const [activeMission, setActiveMission] = useState<any>(null);
   const supabase = createClient();

   useEffect(() => {
     fetchMissions();
   }, []);

   const fetchMissions = async () => {
     const { data } = await supabase
       .from("student_missions")
       .select("*")
       .eq("student_id", studentId)
       .eq("tutor_id", tutorId)
       .order("created_at", { ascending: false });
     if (data) setMissions(data);
   };

   const initiateMission = async (tier: any) => {
       setIsGenerating(true);
       try {
           const res = await generateClassroomMission(classId, tier);
           if (res.error) alert(res.error);
           else fetchMissions();
       } catch (e) {
           console.error(e);
       }
       setIsGenerating(false);
   };

   const chartData = missions
      .filter(m => m.status === 'completed' || m.score_percentage !== null)
      .map(m => ({
          date: new Date(m.created_at).toLocaleDateString(),
          score: m.score_percentage || 0,
          tier: m.mission_tier
      })).reverse();

   if (activeMission) {
       return (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <button 
                 onClick={() => { setActiveMission(null); fetchMissions(); }}
                 className="mb-8 font-black text-slate-500 hover:text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2"
               >
                   ← Return to Dashboard
               </button>
               <MissionViewer mission={activeMission.mission_blueprint} />
           </div>
       );
   }

   return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
          
          {/* Header */}
          <div className="flex justify-between items-center bg-gradient-to-r from-slate-900 to-[#1E5AA8] p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
             <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
             <div className="relative z-10 space-y-2">
                 <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
                    <BrainCircuit className="text-emerald-400" size={32} />
                    Missions & Analytics
                 </h2>
                 <p className="text-indigo-200 font-medium">Your AI-driven academic progress tracker.</p>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {/* Left Col: Triggers */}
             <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col gap-4">
                 <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-2">Initiate Test Protocol</h3>
                 
                 <button onClick={() => initiateMission('daily')} disabled={isGenerating} className="p-4 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-2xl flex justify-between items-center font-bold text-sm transition-colors border border-sky-100">
                    Daily Checkpoint <Zap size={16} />
                 </button>
                 <button onClick={() => initiateMission('weekly')} disabled={isGenerating} className="p-4 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-2xl flex justify-between items-center font-bold text-sm transition-colors border border-indigo-100">
                    Weekly Synthesis <LayoutDashboard size={16} />
                 </button>
                 <button onClick={() => initiateMission('monthly')} disabled={isGenerating} className="p-4 bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100 rounded-2xl flex justify-between items-center font-bold text-sm transition-colors border border-fuchsia-100">
                    Monthly Exam (Hard) <Target size={16} />
                 </button>
                 <button onClick={() => initiateMission('annual')} disabled={isGenerating} className="p-4 bg-red-50 text-red-700 hover:bg-red-100 rounded-2xl flex justify-between items-center font-bold text-sm transition-colors border border-red-100 mt-4">
                    Annual Review (Extrême)
                 </button>

                 {isGenerating && <div className="text-center text-xs font-bold text-indigo-500 animate-pulse mt-4 flex items-center justify-center gap-2"><Loader2 className="animate-spin" size={14}/> Generating via AI Core...</div>}
             </div>

             {/* Right Col: Analytics Graph */}
             <div className="md:col-span-2 bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col h-full">
                 <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-6">Historical Precision</h3>
                 {chartData.length > 0 ? (
                 <div className="flex-1 w-full h-full min-h-[250px]">
                     <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} domain={[0, 100]} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                            itemStyle={{ fontWeight: 800 }}
                          />
                          <Line type="monotone" dataKey="score" stroke="#10B981" strokeWidth={4} dot={{r: 6, fill: '#10B981', strokeWidth: 2, stroke: '#FFF'}} activeDot={{r: 8}} />
                        </LineChart>
                     </ResponsiveContainer>
                 </div>
                 ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <LineChartIcon size={48} className="opacity-20 mb-4" />
                        <p className="font-medium text-sm">No completed missions yet to graph.</p>
                    </div>
                 )}
             </div>
          </div>

          {/* Mission Log */}
          <div>
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-4">Mission Logs</h3>
            <div className="space-y-4">
               {missions.map(m => (
                  <div key={m.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                      <div>
                         <div className="flex items-center gap-3 mb-1">
                             <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-widest rounded-md">{m.mission_tier}</span>
                             <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded-md ${
                                m.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                             }`}>
                                {m.status.replace("_", " ")}
                             </span>
                         </div>
                         <h4 className="font-bold text-slate-800">{m.mission_blueprint?.topic || "Active Mission"}</h4>
                         <p className="text-xs text-slate-500 font-medium">{new Date(m.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-6">
                         {m.score_percentage !== null && (
                             <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Score</p>
                                <p className="font-black text-2xl text-emerald-500">{m.score_percentage}%</p>
                             </div>
                         )}
                         <button 
                            onClick={() => setActiveMission(m)}
                            className="px-6 py-3 bg-slate-900 text-white text-xs font-black tracking-widest uppercase rounded-xl hover:bg-slate-800 transition-colors"
                         >
                            {m.status === 'pending_assessment' ? 'Take Mission' : 'View Log'}
                         </button>
                      </div>
                  </div>
               ))}
               {missions.length === 0 && <p className="text-sm text-slate-500 font-medium">No missions active.</p>}
            </div>
          </div>

      </div>
   );
}

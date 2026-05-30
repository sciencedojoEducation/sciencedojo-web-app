"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { BrainCircuit, LineChart as LineChartIcon } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function MissionsDashboard({ classId, studentId, tutorId }: { classId: string, studentId: string, tutorId: string }) {
   const [missions, setMissions] = useState<any[]>([]);
   const supabase = createClient();

   useEffect(() => {
     fetchMissions();
   }, [classId]);

   const fetchMissions = async () => {
     const { data } = await supabase
       .from("student_missions")
       .select("*")
       .eq("student_id", studentId)
       .eq("tutor_id", tutorId)
       .order("created_at", { ascending: false });
     if (data) setMissions(data);
   };

   // Only plot finished missions
   const chartData = missions
      .filter(m => m.status === 'completed' && m.score_percentage !== null)
      .map(m => ({
          date: new Date(m.created_at).toLocaleDateString(),
          score: m.score_percentage || 0,
          tier: m.mission_tier
      })).reverse();

   return (
      <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 md:space-y-8">
          
          {/* Header */}
          <div className="relative flex items-center justify-between overflow-hidden rounded-[1.5rem] bg-gradient-to-r from-slate-900 to-[#1E5AA8] p-5 text-white shadow-lg md:rounded-[2rem] md:p-8 md:shadow-xl">
             <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
             <div className="relative z-10 space-y-2">
                 <h2 className="flex items-center gap-3 text-2xl font-black tracking-tight md:text-3xl">
                    <BrainCircuit className="text-emerald-400" size={32} />
                    Learning journeys
                 </h2>
                 <p className="text-sm font-medium leading-relaxed text-indigo-200 md:text-base">Structured Mission progress connected to this class and tutor guidance.</p>
             </div>
          </div>

          <div className="flex h-[300px] flex-col rounded-[1.5rem] border border-slate-100 bg-white p-4 shadow-sm md:h-[350px] md:rounded-[2rem] md:p-6">
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-6">Progress over time</h3>
              {chartData.length > 0 ? (
              <div className="flex-1 w-full h-full">
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
                    <p className="text-sm font-medium">Completed pathways will build this progress view.</p>
                </div>
              )}
          </div>

          {/* Mission Log - Read Only */}
          <div>
            <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-slate-800">Mission history</h3>
            <div className="space-y-4">
               {missions.map((m, index) => {
                  const missionNumber = String(missions.length - index).padStart(3, '0');
                  return (
                  <div key={m.id} className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between md:p-5">
                      <div className="min-w-0">
                         <div className="mb-2 flex flex-wrap items-center gap-2">
                             <span className={`rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-widest shadow-sm ${
                                m.mission_tier === 'daily' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                m.mission_tier === 'weekly' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                m.mission_tier === 'monthly' ? 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200' :
                                m.mission_tier === 'annual' ? 'bg-red-50 text-red-700 border-red-200' :
                                'bg-slate-50 text-slate-700 border-slate-200'
                             }`}>{m.mission_tier}</span>
                             <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-widest ${
                                m.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                             }`}>
                                {m.status.replace(/_/g, " ")}
                             </span>
                             <span className="rounded-full border border-[#1E5AA8]/10 bg-[#1E5AA8]/5 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-[#1E5AA8]">
                                Pathway {missionNumber}
                             </span>
                         </div>
                         <h4 className="font-bold text-slate-800">{m.mission_blueprint?.topic || "Guided practice pathway"}</h4>
                         <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Prepared {new Date(m.created_at).toLocaleDateString()} at {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <div className="flex items-center gap-6 md:shrink-0">
                         {m.score_percentage !== null ? (
                             <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-left md:text-right">
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70">Tutor-reviewed progress</p>
                                <p className="text-2xl font-black text-emerald-600">{m.score_percentage}%</p>
                             </div>
                         ) : (
                             <div className="text-sm font-medium italic text-slate-400 md:text-right">
                                 {m.status === 'pending_assessment' ? 'In progress' : 'Awaiting tutor review'}
                             </div>
                         )}
                      </div>
                  </div>
               )})}
               {missions.length === 0 && <p className="text-sm text-slate-500 font-medium">No Missions active yet.</p>}
            </div>
          </div>

      </div>
   );
}

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
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
          
          {/* Header */}
          <div className="flex justify-between items-center bg-gradient-to-r from-slate-900 to-[#1E5AA8] p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
             <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
             <div className="relative z-10 space-y-2">
                 <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
                    <BrainCircuit className="text-emerald-400" size={32} />
                    Learning Progress
                 </h2>
                 <p className="text-indigo-200 font-medium">Structured Mission progress connected to this class.</p>
             </div>
          </div>

          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col h-[350px]">
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
                    <p className="font-medium text-sm">No completed Missions yet to graph.</p>
                </div>
              )}
          </div>

          {/* Mission Log - Read Only */}
          <div>
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-4">Mission history</h3>
            <div className="space-y-4">
               {missions.map((m, index) => {
                  const missionNumber = String(missions.length - index).padStart(3, '0');
                  return (
                  <div key={m.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                      <div>
                         <div className="flex items-center gap-3 mb-1">
                             <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded-md border shadow-sm ${
                                m.mission_tier === 'daily' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                m.mission_tier === 'weekly' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                m.mission_tier === 'monthly' ? 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200' :
                                m.mission_tier === 'annual' ? 'bg-red-50 text-red-700 border-red-200' :
                                'bg-slate-50 text-slate-700 border-slate-200'
                             }`}>{m.mission_tier}</span>
                             <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded-md ${
                                m.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                             }`}>
                                {m.status.replace(/_/g, " ")}
                             </span>
                             <span className="px-2 py-1 bg-[#1E5AA8]/5 text-[#1E5AA8] text-[9px] font-black uppercase tracking-widest rounded-md border border-[#1E5AA8]/10">
                                ID: {missionNumber}
                             </span>
                         </div>
                         <h4 className="font-bold text-slate-800">{m.mission_blueprint?.topic || "Guided practice pathway"}</h4>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Prepared {new Date(m.created_at).toLocaleDateString()} at {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <div className="flex items-center gap-6">
                         {m.score_percentage !== null ? (
                             <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress score</p>
                                <p className="font-black text-2xl text-emerald-500">{m.score_percentage}%</p>
                             </div>
                         ) : (
                             <div className="text-right text-slate-400 font-medium text-sm italic">
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

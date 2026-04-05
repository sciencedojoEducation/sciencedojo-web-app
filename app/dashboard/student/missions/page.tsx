"use client";

import { useState } from "react";
import { generateWeeklyMission } from "./actions";
import MissionViewer from "./MissionViewer";
import { Sparkles, Loader2, BookOpen } from "lucide-react";

export default function MissionsPage() {
  const [missionData, setMissionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await generateWeeklyMission();
      if (res.error) {
        setError(res.error);
      } else if (res.mission) {
        setMissionData(res.mission);
      }
    } catch (err) {
      setError("An unexpected error occurred while communicating with the AI Core.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 pt-4">
       
      {!missionData && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
           <div className="w-24 h-24 bg-indigo-50 text-indigo-500 rounded-[2rem] flex items-center justify-center mb-8 shadow-xl shadow-indigo-100">
              <Sparkles size={48} strokeWidth={1.5} />
           </div>
           <h1 className="text-4xl font-black text-navy tracking-tight mb-4">Weekly AI Missions</h1>
           <p className="text-navy/50 font-medium max-w-lg mb-10 text-lg leading-relaxed">
             Our AI Mission Architect will analyze the private notes your Sensei left on your last class, and instantly construct a personalized 4-stage mastery challenge just for you.
           </p>
           
           {error && (
             <div className="bg-red-50 text-red-600 px-6 py-4 rounded-xl text-sm font-bold mb-8 flex items-center gap-3">
                <span>⚠️</span> {error}
             </div>
           )}

           <button
             onClick={handleGenerate}
             disabled={isLoading}
             className="relative group px-10 py-5 bg-[#1E5AA8] text-white font-black uppercase tracking-widest text-sm rounded-2xl overflow-hidden shadow-2xl shadow-[#1E5AA8]/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
           >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <div className="relative z-10 flex items-center gap-3">
                {isLoading ? (
                  <><Loader2 className="animate-spin" size={20} /> SYNTHESIZING MISSION...</>
                ) : (
                  <><BookOpen size={20} /> INITIATE WEEKLY MISSION</>
                )}
              </div>
           </button>
        </div>
      )}

      {missionData && <MissionViewer mission={missionData} />}

    </div>
  );
}

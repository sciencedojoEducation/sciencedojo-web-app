"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { CheckCircle2, Search, BrainCircuit } from "lucide-react";

export default function TutorMissionsHub() {
    const [missions, setMissions] = useState<any[]>([]);
    const [activeReview, setActiveReview] = useState<any>(null);
    const [isApproving, setIsApproving] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        loadMissions();
    }, []);

    const loadMissions = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from("student_missions")
            .select("*, profiles!student_missions_student_id_fkey(full_name)")
            .eq("tutor_id", user.id)
            .eq("status", "pending_tutor_approval")
            .order("completed_at", { ascending: false });
        
        if (data) setMissions(data);
    };

    const approveMission = async () => {
        setIsApproving(true);
        const { error } = await supabase.from('student_missions').update({
            status: 'completed'
        }).eq('id', activeReview.id);

        if (!error) {
            setActiveReview(null);
            loadMissions();
        }
        setIsApproving(false);
    };

    if (activeReview) {
        return (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in pt-8 pb-12">
                <button 
                  onClick={() => setActiveReview(null)}
                  className="font-black text-slate-500 hover:text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2 mb-4"
                >
                    ← Return to Inbox
                </button>

                <div className="bg-white rounded-[2rem] p-10 border border-slate-200 shadow-xl">
                    <h1 className="text-3xl font-black text-slate-800 mb-2">Learning Journey Review: {activeReview.mission_blueprint?.topic}</h1>
                    <p className="text-slate-500 font-medium mb-8">Completed by <span className="font-bold text-slate-800">{activeReview.profiles?.full_name || 'Student'}</span></p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div>
                            <h3 className="font-black uppercase tracking-widest text-xs text-emerald-500 mb-4">Suggested progress score</h3>
                            <div className="text-6xl font-black text-slate-900 mb-4">
                                {activeReview.score_percentage}%
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-bold text-slate-600 flex justify-between"><span>Logic:</span> <span>{activeReview.ai_evaluation?.logicScoreOutOf10}/10</span></p>
                                <p className="text-sm font-bold text-slate-600 flex justify-between"><span>Application:</span> <span>{activeReview.ai_evaluation?.applicationScoreOutOf10}/10</span></p>
                                <p className="text-sm font-bold text-slate-600 flex justify-between"><span>Correction:</span> <span>{activeReview.ai_evaluation?.correctionScoreOutOf10}/10</span></p>
                            </div>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                            <h3 className="font-black uppercase tracking-widest text-xs text-indigo-500 mb-4">Draft feedback notes</h3>
                            <p className="text-slate-700 italic">"{activeReview.ai_evaluation?.tutorFeedbackSummary}"</p>
                            
                            <h3 className="font-black uppercase tracking-widest text-xs text-red-500 mt-6 mb-2">Next recommended areas</h3>
                            <div className="flex flex-wrap gap-2">
                                {activeReview.ai_evaluation?.weakTopics?.map((t: string, i: number) => (
                                    <span key={i} className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-lg">{t}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                   <div className="space-y-6">
                       <h3 className="font-black uppercase tracking-widest text-xs text-slate-400 border-b border-slate-100 pb-2">Student responses</h3>
                       <div>
                           <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Stage 2: Reasoning</p>
                           <p className="bg-slate-50 p-4 rounded-xl text-slate-800 text-sm">{activeReview.student_answers?.s2 || "None"}</p>
                       </div>
                       <div>
                           <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Stage 3: Application</p>
                           <p className="bg-slate-50 p-4 rounded-xl text-slate-800 text-sm">{activeReview.student_answers?.s3 || "None"}</p>
                       </div>
                    </div>

                    <button 
                        onClick={approveMission}
                        disabled={isApproving}
                        className="w-full mt-10 p-5 bg-emerald-500 hover:bg-emerald-600 focus:ring-4 focus:ring-emerald-200 text-white rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-colors shadow-lg shadow-emerald-500/30"
                    >
                        <CheckCircle2 size={20} /> Approve Learning Update
                    </button>
                    <p className="text-center text-xs text-slate-400 mt-4 font-medium">Approving shares this progress update in the student's classroom analytics.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in pt-8 pb-12">
            <div className="flex items-center gap-4 mb-10">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
                    <CheckCircle2 size={32} />
                </div>
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight">Learning Journey Reviews</h1>
                    <p className="text-slate-500 font-medium text-lg">Review completed Missions before progress is shared with students and families.</p>
                </div>
            </div>

            <div className="space-y-4">
                {missions.map((m, index) => {
                    const missionNumber = String(missions.length - index).padStart(3, '0');
                    return (
                    <div key={m.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveReview(m)}>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md border shadow-sm ${
                                   m.mission_tier === 'daily' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                   m.mission_tier === 'weekly' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                   m.mission_tier === 'monthly' ? 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200' :
                                   m.mission_tier === 'annual' ? 'bg-red-50 text-red-700 border-red-200' :
                                   'bg-slate-50 text-slate-700 border-slate-200'
                                }`}>{m.mission_tier}</span>
                                <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest rounded-md border border-amber-200">
                                    PENDING APPROVAL
                                </span>
                                <span className="px-3 py-1 bg-[#1E5AA8]/10 text-[#1E5AA8] text-[10px] font-black uppercase tracking-widest rounded-md border border-[#1E5AA8]/20 shadow-sm">
                                    ID: {missionNumber}
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-1">{m.mission_blueprint?.topic}</h3>
                            <p className="text-sm text-slate-500 font-medium">Student: <span className="text-slate-700 font-bold">{m.profiles?.full_name || 'Loading...'}</span> • Generated {new Date(m.created_at).toLocaleDateString()} at {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <p className="text-[10px] uppercase font-black tracking-widest text-emerald-500">Progress score</p>
                                <p className="text-3xl font-black text-slate-800">{m.score_percentage}%</p>
                            </div>
                            <div className="w-12 h-12 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 group-hover:border-emerald-200 transition-colors">
                                <Search size={20} />
                            </div>
                        </div>
                    </div>
                )})}

                {missions.length === 0 && (
                    <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400">
                        <BrainCircuit size={48} className="mx-auto mb-4 opacity-30" />
                        <h3 className="text-xl font-black text-slate-600 mb-2">All caught up</h3>
                        <p className="font-medium text-slate-500">No Missions are waiting for tutor review.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

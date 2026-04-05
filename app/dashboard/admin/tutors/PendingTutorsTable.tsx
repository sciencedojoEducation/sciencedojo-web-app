"use client";

import { useState } from "react";
import Image from "next/image";
import ApplicationReviewModal from "./ApplicationReviewModal";
import VerifyButton from "./VerifyButton";
import { FileSearch, ChevronRight, Clock, AlertCircle } from "lucide-react";

interface TutorWithApplication {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string;
  created_at: string;
  tutorDetail: any;
  application: {
    user_id: string;
    status: string;
    full_name: string;
    university: string;
    user_type: string;
    data: any;
    created_at: string;
  } | null;
}

export default function PendingTutorsTable({ tutors }: { tutors: TutorWithApplication[] }) {
  const [selectedTutor, setSelectedTutor] = useState<TutorWithApplication | null>(null);

  return (
    <>
      <div className="bg-white rounded-[2.5rem] border-2 border-amber-100 shadow-xl shadow-amber-900/5 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-amber-100 text-amber-600/40 text-[10px] font-black uppercase tracking-[0.2em] bg-amber-50/30">
              <th className="p-8">Application</th>
              <th className="p-8">Onboarding Data</th>
              <th className="p-8 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="font-medium text-slate-600">
            {tutors.map((tutor) => {
              const appData = tutor.application?.data || {};
              const currentStage = appData.current_stage || 0;
              const stageProgress = Math.round((currentStage / 7) * 100);
              
              return (
                <tr key={tutor.id} className="group hover:bg-amber-50/30 transition-all border-b border-amber-50 last:border-0">
                  <td className="p-8">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl border-2 border-white shadow-md overflow-hidden bg-slate-100 ring-2 ring-amber-100 relative">
                        <Image src={tutor.avatar_url || "/tutor_placeholder.webp"} alt={tutor.full_name} fill className="object-cover" />
                      </div>
                      <div>
                        <div className="font-black text-slate-800 text-lg tracking-tight">{tutor.full_name}</div>
                        <div className="text-xs text-slate-400 font-bold">{tutor.email}</div>
                        <div className="text-[9px] uppercase font-black text-amber-400 mt-2 tracking-widest">
                          Applied {new Date(tutor.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-8">
                    <div className="max-w-md space-y-3">
                      {/* Onboarding Status Tags */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {appData.user_type && (
                          <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded">
                            {appData.user_type === "undergrad" ? "📚 Undergraduate" : "💼 Industry Pro"}
                          </span>
                        )}
                        {appData.university && (
                          <span className="text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                            {appData.university}
                          </span>
                        )}
                        {appData.onboarding_status && (
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                            appData.onboarding_status === "under_review" ? "bg-amber-50 text-amber-600" :
                            appData.onboarding_status === "demo_submitted" ? "bg-blue-50 text-blue-600" :
                            "bg-slate-50 text-slate-500"
                          }`}>
                            {appData.onboarding_status}
                          </span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                            Stage {currentStage}/7
                          </span>
                          {appData.score !== undefined && (
                            <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">
                              Score: {appData.score}/55
                            </span>
                          )}
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
                            style={{ width: `${stageProgress}%` }}
                          />
                        </div>
                      </div>

                      {/* Quick Info */}
                      <div className="flex items-center gap-4 text-[10px] text-slate-500 font-bold">
                        {appData.subjects && <span>📘 {appData.subjects}</span>}
                        {appData.hourly_rate && <span>💰 £{appData.hourly_rate}/hr</span>}
                        {appData.demo_video_url && <span>🎬 Demo ✓</span>}
                      </div>
                    </div>
                  </td>
                  <td className="p-8 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {tutor.application ? (
                        <button
                          onClick={() => setSelectedTutor(tutor)}
                          className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-100 transition-all shadow-sm"
                        >
                          <FileSearch size={14} /> Review Application
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-4 py-3 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-xl">
                          <AlertCircle size={12} /> No Application
                        </span>
                      )}
                      <VerifyButton tutorId={tutor.id} isVerified={false} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Application Review Modal */}
      {selectedTutor && selectedTutor.application && (
        <ApplicationReviewModal
          application={selectedTutor.application}
          tutorProfile={{
            full_name: selectedTutor.full_name,
            email: selectedTutor.email,
            avatar_url: selectedTutor.avatar_url,
          }}
          onClose={() => setSelectedTutor(null)}
        />
      )}
    </>
  );
}

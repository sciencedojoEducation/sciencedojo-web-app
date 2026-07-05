"use client";

import { useState, useTransition } from "react";
import { approveTutorForListing, getSignedDocumentUrl } from "./actions";
import YouTubeLite from "@/components/YouTubeLite";
import {
  X, User, Phone, MapPin, GraduationCap, Briefcase, Video,
  Brain, Target, Zap, Heart, BookOpen, Clock, DollarSign,
  ShieldCheck, Mic, Camera, Wifi, Laptop, Tag, CheckCircle2,
  ChevronRight, AlertTriangle, FileText, Globe, Award, Star
} from "lucide-react";

interface ApplicationData {
  // Screening
  full_name?: string;
  phone?: string;
  subjects?: string;
  levels?: string;
  prior_experience?: string;
  online_available?: string;
  timezone?: string;
  // WhiteBelt
  user_type?: string;
  university?: string;
  year_of_study?: string;
  top_grades?: string;
  motivation?: string;
  tutoring_experience?: string;
  education?: Array<{ institution: string; degree: string; transcript_url?: string }>;
  work_history?: Array<{ company: string; role: string; duration?: string; proof_url?: string }>;
  ol_certificate_url?: string;
  al_certificate_url?: string;
  specific_subject_grade?: string;
  // BlueBelt
  youtube_url?: string;
  teaching_styles?: string[];
  teaching_philosophy?: string;
  // TeachingFit
  teaching_style?: string;
  weak_student_approach?: string;
  disengagement_approach?: string;
  // DemoSkill
  demo_video_url?: string;
  // Logistics
  hourly_rate?: string;
  preferred_levels?: string[];
  availability_summary?: string;
  teaching_mode?: string;
  has_mic?: string;
  has_camera?: string;
  stable_internet?: string;
  device?: string;
  // Verification
  gdpr_accepted?: string;
  terms_accepted?: string;
  gdpr_accepted_at?: string;
  terms_accepted_at?: string;
  // Meta
  current_stage?: number;
  onboarding_status?: string;
  score?: number;
  [key: string]: any;
}

interface ApplicationModalProps {
  application: {
    user_id: string;
    status: string;
    full_name: string;
    university: string;
    user_type: string;
    data: ApplicationData;
    created_at: string;
  };
  tutorProfile: {
    full_name: string;
    email: string;
    avatar_url: string;
  };
  onClose: () => void;
}

const STYLE_MAP: Record<string, { label: string; icon: React.ReactNode }> = {
  concept: { label: "Concept-Based", icon: <Brain size={14} /> },
  exam: { label: "Exam-Focused", icon: <Target size={14} /> },
  hybrid: { label: "Hybrid / Adaptive", icon: <Zap size={14} /> },
};

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">{title}</h3>
        {subtitle && <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{subtitle}</p>}
      </div>
    </div>
  );
}

function DataField({ label, value, className }: { label: string; value?: string | null; className?: string }) {
  return (
    <div className={`space-y-1 ${className || ""}`}>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">{label}</p>
      <p className="text-sm font-bold text-slate-700 leading-relaxed">{value || "—"}</p>
    </div>
  );
}

function Badge({ children, color = "slate" }: { children: React.ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    slate: "bg-slate-100 text-slate-600",
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    indigo: "bg-indigo-50 text-indigo-600",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${colors[color] || colors.slate}`}>
      {children}
    </span>
  );
}

function SecureDocumentLink({ filePath, label }: { filePath: string; label: string }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await getSignedDocumentUrl(filePath);
      if (res?.url) {
        window.open(res.url, "_blank");
      } else {
        alert("Failed to load document. It may have been deleted or there is a permission issue.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleClick} 
      disabled={loading}
      className="flex items-center gap-3 bg-blue-50 p-4 rounded-2xl cursor-pointer hover:bg-blue-100 transition-colors w-full text-left active:scale-[0.98] disabled:opacity-50"
    >
      <FileText size={16} className="text-blue-500 shrink-0" />
      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest break-all">
        {loading ? "Decrypting Document..." : `View ${label}`}
      </span>
    </button>
  );
}

export default function ApplicationReviewModal({ application, tutorProfile, onClose }: ApplicationModalProps) {
  const [isPending, startTransition] = useTransition();
  const d = application.data || {};
  const stageNames = ["Screening", "White Belt", "Blue Belt", "Teaching Fit", "Demo Exhibition", "Logistics", "Identity & Compliance"];
  const currentStage = d.current_stage || 0;
  const completedStages = Math.min(currentStage, 7);

  const handleApprove = () => {
    startTransition(async () => {
      const result = await approveTutorForListing(application.user_id);
      if (result?.error) {
        alert(`Error: ${result.error}`);
      } else {
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-0 py-0 backdrop-blur-sm md:px-4 md:py-8" onClick={onClose}>
      <div
        className="relative min-h-dvh w-full max-w-4xl overflow-y-auto bg-white shadow-2xl md:max-h-[90vh] md:min-h-0 md:rounded-[2.5rem]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-100 bg-white/95 px-4 py-4 backdrop-blur-xl md:rounded-t-[2.5rem] md:px-10 md:py-8">
          <div className="flex min-w-0 items-center gap-3 md:gap-6">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border-2 border-white bg-slate-100 shadow-lg md:h-16 md:w-16">
              <img 
                src={tutorProfile.avatar_url || "/tutor_placeholder.webp"} 
                alt="" 
                className="w-full h-full object-cover" 
                onError={(e) => { e.currentTarget.src = "/tutor_placeholder.webp" }}
              />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-black tracking-tight text-slate-800 md:text-2xl">{d.full_name || tutorProfile.full_name}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-2 md:gap-3">
                <span className="truncate text-xs font-bold text-slate-400">{tutorProfile.email}</span>
                <Badge color={d.onboarding_status === "under_review" ? "amber" : d.onboarding_status === "demo_submitted" ? "blue" : "slate"}>
                  {d.onboarding_status || application.status || "unknown"}
                </Badge>
                {d.user_type && <Badge color="indigo">{d.user_type === "undergrad" ? "Undergraduate" : "Industry Pro"}</Badge>}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400 transition-all hover:bg-slate-200 hover:text-slate-600 md:h-12 md:w-12">
            <X size={20} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-4 md:px-10 md:py-6">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Onboarding Progress</p>
            <span className="text-[9px] font-black text-slate-300 ml-auto">{completedStages}/7 Stages</span>
          </div>
          <div className="flex gap-1">
            {stageNames.map((name, i) => (
              <div key={i} className="flex-1 group relative">
                <div className={`h-2 rounded-full transition-all ${i < completedStages ? "bg-blue-500" : "bg-slate-200"}`} />
                <p className="text-[7px] font-black text-slate-300 uppercase tracking-wider mt-1 text-center opacity-0 group-hover:opacity-100 transition-opacity absolute w-full">
                  {name}
                </p>
              </div>
            ))}
          </div>
          {d.score !== undefined && (
            <div className="flex items-center gap-2 mt-3">
              <Star size={14} className="text-amber-400 fill-amber-400" />
              <span className="text-xs font-black text-slate-600">Auto-Score: {d.score}/55</span>
            </div>
          )}
        </div>

        <div className="space-y-6 p-4 md:space-y-10 md:p-10">
          {/* 1. Screening */}
          <section className="space-y-6">
            <SectionHeader icon={<User size={18} />} title="Screening & Contact" subtitle="Initial Knockout Protocol" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <DataField label="Full Name" value={d.full_name} />
              <DataField label="Phone" value={d.phone} />
              <DataField label="Timezone" value={d.timezone} />
              <DataField label="Applied" value={application.created_at ? new Date(application.created_at).toLocaleDateString() : undefined} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Prior Experience</p>
                <Badge color={d.prior_experience === "true" ? "green" : "red"}>{d.prior_experience === "true" ? "Yes" : "No"}</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Online Available</p>
                <Badge color={d.online_available === "true" ? "green" : "red"}>{d.online_available === "true" ? "Yes" : "No"}</Badge>
              </div>
              <DataField label="Subjects" value={d.subjects} />
              <DataField label="Levels" value={d.levels} />
            </div>
          </section>

          {/* 2. White Belt: Academic / Professional */}
          {currentStage >= 2 && (
            <section className="space-y-6">
              <SectionHeader icon={<GraduationCap size={18} />} title="White Belt: Eligibility" subtitle={d.user_type === "undergrad" ? "Undergraduate Path" : "Industry Professional"} />
              
              {d.user_type === "undergrad" ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <DataField label="University" value={d.university} />
                    <DataField label="Year of Study" value={d.year_of_study} />
                    <DataField label="A-Level Grades" value={d.top_grades} />
                  </div>
                  <DataField label="Subject Grade" value={d.specific_subject_grade} />
                  <div className="grid grid-cols-2 gap-4">
                    {d.ol_certificate_url && (
                      <SecureDocumentLink filePath={d.ol_certificate_url} label="O/L Certificate" />
                    )}
                    {d.al_certificate_url && (
                      <SecureDocumentLink filePath={d.al_certificate_url} label="A/L Certificate" />
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Work History */}
                  {Array.isArray(d.work_history) && d.work_history.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Work Experience</p>
                      {d.work_history.map((w, i) => (
                        <div key={i} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl">
                          <Briefcase size={16} className="text-slate-400 shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-black text-slate-700">{w.role} @ {w.company}</p>
                            {w.duration && <p className="text-[10px] font-bold text-slate-400">{w.duration}</p>}
                          </div>
                          {w.proof_url && (
                            <div className="shrink-0 w-48">
                              <SecureDocumentLink filePath={w.proof_url} label="Proof" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Education */}
                  {Array.isArray(d.education) && d.education.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Education</p>
                      {d.education.map((e, i) => (
                        <div key={i} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl">
                          <Award size={16} className="text-slate-400 shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-black text-slate-700">{e.degree} — {e.institution}</p>
                          </div>
                          {e.transcript_url && (
                            <div className="shrink-0 w-48">
                              <SecureDocumentLink filePath={e.transcript_url} label="Transcript" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <DataField label="Motivation" value={d.motivation} className="bg-slate-50 p-5 rounded-2xl" />
              <DataField label="Tutoring Experience" value={d.tutoring_experience} className="bg-slate-50 p-5 rounded-2xl" />
            </section>
          )}

          {/* 3. Blue Belt: Profile Studio */}
          {currentStage >= 3 && (
            <section className="space-y-6">
              <SectionHeader icon={<Video size={18} />} title="Blue Belt: Profile Studio" subtitle="Introduction Video & Style" />
              {d.youtube_url && (
                <YouTubeLite url={d.youtube_url} label="Introduction Video" />
              )}
              {Array.isArray(d.teaching_styles) && d.teaching_styles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Teaching Styles</p>
                  <div className="flex flex-wrap gap-2">
                    {d.teaching_styles.map((s) => (
                      <Badge key={s} color="indigo"><Tag size={10} /> {s}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <DataField label="Teaching Philosophy" value={d.teaching_philosophy} className="bg-slate-50 p-5 rounded-2xl" />
            </section>
          )}

          {/* 4. Teaching Fit */}
          {currentStage >= 4 && (
            <section className="space-y-6">
              <SectionHeader icon={<Brain size={18} />} title="Teaching Philosophy" subtitle="Methodology & Approach" />
              {d.teaching_style && (
                <div className="flex items-center gap-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Primary Methodology:</p>
                  <Badge color="blue">
                    {STYLE_MAP[d.teaching_style]?.icon} {STYLE_MAP[d.teaching_style]?.label || d.teaching_style}
                  </Badge>
                </div>
              )}
              <DataField label="Scaffolding Strategy" value={d.weak_student_approach} className="bg-slate-50 p-5 rounded-2xl" />
              <DataField label="Engagement Protocol" value={d.disengagement_approach} className="bg-slate-50 p-5 rounded-2xl" />
            </section>
          )}

          {/* 5. Demo Exhibition */}
          {currentStage >= 5 && (
            <section className="space-y-6">
              <SectionHeader icon={<Video size={18} />} title="Skill Exhibition" subtitle="Teaching Demo Video" />
              {d.demo_video_url && (
                <YouTubeLite url={d.demo_video_url} label="Teaching Demo" />
              )}
            </section>
          )}

          {/* 6. Logistics */}
          {currentStage >= 6 && (
            <section className="space-y-6">
              <SectionHeader icon={<DollarSign size={18} />} title="Sensei Logistics" subtitle="Rates, Tech & Availability" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <DataField label="Hourly Rate" value={d.hourly_rate ? `£${d.hourly_rate}/hr` : undefined} />
                <DataField label="Teaching Mode" value={d.teaching_mode} />
                <DataField label="Availability" value={d.availability_summary} />
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Preferred Levels</p>
                  <div className="flex flex-wrap gap-1">
                    {(Array.isArray(d.preferred_levels) ? d.preferred_levels : []).map(l => <Badge key={l} color="slate">{l}</Badge>)}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { key: "device", label: "Laptop", icon: <Laptop size={14} /> },
                  { key: "has_camera", label: "Camera", icon: <Camera size={14} /> },
                  { key: "has_mic", label: "Mic", icon: <Mic size={14} /> },
                  { key: "stable_internet", label: "Internet", icon: <Wifi size={14} /> },
                ].map(t => (
                  <div key={t.key} className={`flex items-center gap-2 p-3 rounded-xl text-[9px] font-black uppercase tracking-widest ${d[t.key] === "true" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                    {t.icon} {t.label} {d[t.key] === "true" ? "✓" : "✗"}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 7. Identity & Compliance */}
          {currentStage >= 7 && (
            <section className="space-y-6">
              <SectionHeader icon={<ShieldCheck size={18} />} title="Identity & Compliance" subtitle="Legal Consent & Verification" />
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-5 rounded-2xl flex items-center gap-3 ${d.gdpr_accepted === "true" ? "bg-emerald-50" : "bg-red-50"}`}>
                  <CheckCircle2 size={18} className={d.gdpr_accepted === "true" ? "text-emerald-500" : "text-red-400"} />
                  <div>
                    <p className="text-xs font-black text-slate-700">GDPR Consent</p>
                    <p className="text-[9px] font-bold text-slate-400">{d.gdpr_accepted === "true" ? `Accepted ${d.gdpr_accepted_at || ""}` : "Not Accepted"}</p>
                  </div>
                </div>
                <div className={`p-5 rounded-2xl flex items-center gap-3 ${d.terms_accepted === "true" ? "bg-emerald-50" : "bg-red-50"}`}>
                  <CheckCircle2 size={18} className={d.terms_accepted === "true" ? "text-emerald-500" : "text-red-400"} />
                  <div>
                    <p className="text-xs font-black text-slate-700">Sensei Terms</p>
                    <p className="text-[9px] font-bold text-slate-400">{d.terms_accepted === "true" ? `Accepted ${d.terms_accepted_at || ""}` : "Not Accepted"}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                {d.government_id_url && (
                  <SecureDocumentLink filePath={d.government_id_url} label="Government ID" />
                )}
                {d.background_check_url && (
                  <SecureDocumentLink filePath={d.background_check_url} label="Background Check" />
                )}
              </div>
            </section>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 z-20 flex items-center justify-between gap-3 border-t border-slate-100 bg-white/95 px-4 py-4 backdrop-blur-xl md:rounded-b-[2.5rem] md:px-10 md:py-6">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-100 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all hover:bg-slate-200 md:px-8 md:py-4"
          >
            Close
          </button>
          <div className="flex min-w-0 items-center gap-4">
            {d.onboarding_status === "under_review" && (
              <button
                onClick={handleApprove}
                disabled={isPending}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-200 transition-all hover:bg-emerald-700 disabled:opacity-50 md:px-8 md:py-4"
              >
                <CheckCircle2 size={14} />
                {isPending ? "Processing..." : "Approve Tutor"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

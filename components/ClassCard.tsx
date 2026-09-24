"use client";

import Link from "next/link";
import { ClassRoom } from "@/lib/class-queries";
import { getClassSubjectTheme } from "@/lib/class-theme";

interface ClassCardProps {
  classRoom: ClassRoom;
  currentUserId: string;
  currentUserRole: string;
}

export default function ClassCard({ classRoom, currentUserId, currentUserRole }: ClassCardProps) {
  const isStudent = currentUserId === classRoom.student_id;
  const otherName = isStudent ? classRoom.tutor_name : classRoom.student_name;
  const otherAvatar = isStudent ? classRoom.tutor_avatar : classRoom.student_avatar;
  const otherRole = isStudent ? "Tutor" : "Student";
  const roleContext = currentUserRole === "tutor" ? "student support space" : currentUserRole === "parent" ? "learning support space" : "tutor-guided class";

  const initials = (otherName || "U")
    .split(" ")
    .map(w => w.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const theme = getClassSubjectTheme(classRoom.subject, currentUserRole === "student" ? undefined : classRoom.cover_color);
  const accentColor = theme.color;

  // Time ago
  const lastActivity = classRoom.last_activity
    ? formatTimeAgo(new Date(classRoom.last_activity))
    : "No activity yet";
  const activityLabel = classRoom.post_count && classRoom.post_count > 0
    ? `${classRoom.post_count} classroom update${classRoom.post_count === 1 ? "" : "s"}`
    : "Classroom ready";
  const nextStep = classRoom.is_archived
    ? "Review archived class"
    : currentUserRole === "tutor" && (!classRoom.post_count || classRoom.post_count === 0)
      ? "Add the first update"
      : "Open classroom";

  if (currentUserRole === "student") {
    return (
      <Link href={`/dashboard/classes/${classRoom.id}`} className="group relative block min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f53a5] focus-visible:ring-offset-2">
        <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5" style={{ backgroundColor: theme.color }} />
        <div className="flex items-start justify-between gap-3 rounded-lg p-3" style={{ backgroundColor: `${theme.color}12` }}>
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs font-semibold text-slate-700"><span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: theme.color }} />{theme.label}</p>
            <h2 className="mt-1 truncate text-lg font-semibold text-slate-900">{classRoom.display_name}</h2>
          </div>
          <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-medium ${classRoom.is_archived ? "bg-slate-100 text-slate-700" : "bg-emerald-50 text-emerald-800"}`}>{classRoom.is_archived ? "Archived" : "Active"}</span>
        </div>
        <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
            {otherAvatar ? <img src={otherAvatar} alt="" className="h-full w-full object-cover" /> : initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{otherName}</p>
            <p className="text-xs text-slate-600">Your tutor</p>
          </div>
        </div>
        <div className="mt-4 rounded-lg bg-slate-50 p-3">
          <p className="text-sm font-medium text-slate-800">{activityLabel}</p>
          <p className="mt-1 text-xs text-slate-600">Last activity: {lastActivity}</p>
        </div>
        <p className="mt-4 text-sm font-semibold text-[#1E5AA8] group-hover:underline">{nextStep} <span aria-hidden="true">→</span></p>
      </Link>
    );
  }

  return (
    <Link
      href={`/dashboard/classes/${classRoom.id}`}
      className="group block min-w-0 overflow-hidden rounded-[1.5rem] border border-secondary/5 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl md:rounded-[2rem] md:shadow-lg md:hover:shadow-2xl"
    >
      {/* Colored Header */}
      <div
        className="relative h-24 overflow-hidden md:h-28"
        style={{ background: theme.gradient }}
      >
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 w-20 h-20 border-4 border-white rounded-full"></div>
          <div className="absolute bottom-2 right-12 w-12 h-12 border-4 border-white rounded-full"></div>
          <div className="absolute top-8 left-6 w-8 h-8 border-4 border-white rounded-full"></div>
        </div>
        
        <div className="absolute bottom-4 left-4 right-4 md:left-6 md:right-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
               <h3 className="truncate text-lg font-black tracking-tight text-white drop-shadow-sm md:text-xl">
                 {classRoom.display_name}
               </h3>
               <p className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-[0.16em] text-white/80 md:text-[11px] md:tracking-widest">
                 {theme.label}
               </p>
            </div>
            {classRoom.is_archived && (
               <div className="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/30 bg-white/20 px-2.5 py-1.5 shadow-lg backdrop-blur-md md:px-3">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                  <span className="text-white text-[10px] font-black uppercase tracking-widest leading-none">Archived</span>
               </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 md:p-6">
        <div className="flex items-center gap-4">
          <div className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-xl border-2 border-white shadow-md md:h-12 md:w-12">
            {otherAvatar ? (
              <img src={otherAvatar} alt={otherName || ""} className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-white font-black text-sm"
                style={{ background: accentColor }}
              >
                {initials}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-black text-secondary">{otherName}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-secondary/40">{otherRole} · {roleContext}</p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-slate-50 p-3">
          <p className="text-[9px] font-black uppercase tracking-widest text-secondary/35">What is happening</p>
          <p className="mt-1 text-sm font-bold text-secondary">{activityLabel}</p>
          <p className="mt-0.5 text-xs font-medium text-secondary/45">Last activity: {lastActivity}</p>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-secondary/5 pt-4">
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-widest text-secondary/30">Next step</p>
            <p className="mt-0.5 truncate text-xs font-black text-secondary">{nextStep}</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-accent transition-colors group-hover:bg-accent group-hover:text-white">
            Open
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

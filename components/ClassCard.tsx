"use client";

import Link from "next/link";
import { ClassRoom } from "@/lib/class-queries";

interface ClassCardProps {
  classRoom: ClassRoom;
  currentUserId: string;
  currentUserRole: string;
}

const COLOR_PRESETS = [
  "#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6",
  "#8b5cf6", "#ef4444", "#14b8a6", "#f97316", "#06b6d4",
];

export default function ClassCard({ classRoom, currentUserId, currentUserRole }: ClassCardProps) {
  const isStudent = currentUserId === classRoom.student_id;
  const otherName = isStudent ? classRoom.tutor_name : classRoom.student_name;
  const otherAvatar = isStudent ? classRoom.tutor_avatar : classRoom.student_avatar;
  const otherRole = isStudent ? "Tutor" : "Student";

  const initials = (otherName || "U")
    .split(" ")
    .map(w => w.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // 🎨 Subject-Smart Coloring
  const getSubjectColor = (subject: string) => {
    const s = subject.toLowerCase();
    if (s.includes("math")) return COLOR_PRESETS[4]; // Blue
    if (s.includes("physic")) return COLOR_PRESETS[9]; // Cyan
    if (s.includes("chem")) return COLOR_PRESETS[1]; // Pink
    if (s.includes("biol")) return COLOR_PRESETS[3]; // Green
    if (s.includes("econom")) return COLOR_PRESETS[8]; // Orange/Gold
    
    // Hash fallback
    const hash = subject.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return COLOR_PRESETS[hash % COLOR_PRESETS.length];
  };

  const accentColor = classRoom.cover_color && classRoom.cover_color !== "#6366f1" 
    ? classRoom.cover_color 
    : getSubjectColor(classRoom.subject);

  // Time ago
  const lastActivity = classRoom.last_activity
    ? formatTimeAgo(new Date(classRoom.last_activity))
    : "No activity yet";

  return (
    <Link
      href={`/dashboard/classes/${classRoom.id}`}
      className="group block bg-white rounded-[2rem] border border-secondary/5 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden hover:-translate-y-1"
    >
      {/* Colored Header */}
      <div
        className="h-28 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` }}
      >
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 w-20 h-20 border-4 border-white rounded-full"></div>
          <div className="absolute bottom-2 right-12 w-12 h-12 border-4 border-white rounded-full"></div>
          <div className="absolute top-8 left-6 w-8 h-8 border-4 border-white rounded-full"></div>
        </div>
        
        <div className="absolute bottom-4 left-6 right-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
               <h3 className="text-white font-black text-xl tracking-tight truncate drop-shadow-sm">
                 {classRoom.display_name}
               </h3>
               <p className="text-white/80 text-[11px] font-bold uppercase tracking-widest mt-0.5">
                 {classRoom.subject}
               </p>
            </div>
            {classRoom.is_archived && (
               <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/30 flex items-center gap-1.5 shadow-lg">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                  <span className="text-white text-[10px] font-black uppercase tracking-widest leading-none">Archived</span>
               </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-md border-2 border-white">
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
            <p className="font-bold text-secondary text-sm truncate">{otherName}</p>
            <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest">{otherRole}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-5 pt-4 border-t border-secondary/5">
          <div className="flex items-center gap-3">
            {classRoom.post_count !== undefined && classRoom.post_count > 0 && (
              <span className="text-[10px] font-black text-secondary/40 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2" /></svg>
                {classRoom.post_count} posts
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold text-secondary/30">{lastActivity}</span>
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

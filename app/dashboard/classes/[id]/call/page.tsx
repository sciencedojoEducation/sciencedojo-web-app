"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { createMeetingUrl } from "@/lib/meetings";

const DailyClassroom = dynamic(() => import("@/components/DailyClassroom"), { ssr: false });
const DojoWhiteboard = dynamic(() => import("@/components/DojoWhiteboard"), { ssr: false });

export default function PremiumCallHub() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const classId = params.id as string;
  
  const [classRoom, setClassRoom] = useState<any>(null);
  const [meetingUrl, setMeetingUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  useEffect(() => {
    const initCall = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }

      // 1. Verify Class & Access
      const { data: room, error: roomError } = await supabase
        .from("classes")
        .select("*, student:student_id(full_name), tutor:tutor_id(full_name)")
        .eq("id", classId)
        .single();

      if (roomError || !room) {
        setError("Classroom not found or access denied.");
        setIsLoading(false);
        return;
      }

      const isMember = room.student_id === user.id || room.tutor_id === user.id;
      if (!isMember) {
        setError("Unauthorized access to this Dojo session.");
        setIsLoading(false);
        return;
      }

      setClassRoom(room);

      // 2. Resolve Meeting URL
      try {
        // We try to find a confirmed booking first, or fallback to instant
        const { data: bookings } = await supabase
          .from("bookings")
          .select("*")
          .eq("class_id", classId)
          .eq("status", "confirmed");

        const now = new Date();
        const currentBooking = bookings?.find(b => 
          Math.abs(new Date(b.requested_date).getTime() - now.getTime()) < 60 * 60 * 1000
        );

        const details = await createMeetingUrl(currentBooking ? currentBooking.id : `instant-${classId}`);
        setMeetingUrl(details.joinUrl);
      } catch (err: any) {
        console.error("Meeting setup failed:", err);
        setError("Failed to initialize the high-performance video engine.");
      } finally {
        setIsLoading(false);
      }
    };

    initCall();
  }, [classId, router]);

  const handleLeave = useCallback(() => {
    console.log("[Daily.co] Absolute migration pulse initiated... 🏎️🚀");
    // Using absolute location to force purge of call engine state 🧬
    window.location.href = `/dashboard/classes/${classId}`;
  }, [classId]);

  const handleManualExit = () => {
    setShowExitConfirm(true);
  };

  const confirmExit = () => {
    console.log("[Daily.co] Graceful Exit Handshake Authorized... 🏁🧤");
    setShowExitConfirm(false);
    setIsExiting(true);
    
    // Fail-safe: If the video engine fails to signal leave within 2s, force redirect 🏎️🚀
    setTimeout(() => {
      console.log("[Daily.co] Fail-safe Redirection Pulse Initiated... 🧬");
      handleLeave();
    }, 2000);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-6">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
             <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h1 className="text-white font-black text-2xl tracking-tight">Genesis Interrupted</h1>
          <p className="text-slate-400 text-sm leading-relaxed">{error}</p>
          <button 
            onClick={() => router.push(`/dashboard/classes/${classId}`)}
            className="inline-flex items-center gap-2 text-indigo-400 font-bold hover:text-white transition-colors"
          >
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
             Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !meetingUrl) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-8">
         <div className="relative">
            <div className="w-24 h-24 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <div className="absolute inset-0 w-24 h-24 border-4 border-purple-500/20 border-b-purple-500 rounded-full animate-[spin_3s_linear_infinite_reverse]" />
         </div>
         <div className="text-center space-y-2">
            <p className="text-white font-black text-sm tracking-[0.4em] uppercase animate-pulse">Initializing Premium Dojo</p>
            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Encrypting End-to-End Pulse</p>
         </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950 z-[9999] overflow-hidden flex flex-col">
       {/* Premium Top Bar */}
       <div className="h-16 px-6 flex items-center justify-between border-b border-white/5 bg-slate-900/50 backdrop-blur-xl relative z-50">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <span className="text-white font-black text-xl">🧬</span>
             </div>
             <div>
                <h2 className="text-white font-black text-sm tracking-tight">{classRoom?.display_name || "ScienceDojo"}</h2>
                <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Live Interactive Session</p>
             </div>
          </div>

          <div className="flex items-center gap-3">
             {isJoined && (
                <button 
                  onClick={() => setShowWhiteboard(!showWhiteboard)}
                  className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border flex items-center gap-2 ${
                    showWhiteboard 
                    ? "bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/20" 
                    : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
                  }`}
                >
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                   {showWhiteboard ? "Close Whiteboard" : "Open Whiteboard"}
                </button>
             )}

             <button 
               type="button"
               onClick={() => handleManualExit()}
               className="px-6 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border border-red-500/20 shadow-lg shadow-red-500/5 cursor-pointer"
             >
                Exit Dojo
             </button>
          </div>
       </div>

       {/* High-Performance Interactive Engine Hub 🏎️🚀 */}
       <div className={`flex-1 relative flex overflow-hidden transition-all duration-500 ease-in-out`}>
          {/* Video Engine Nexus */}
          <div className={`${showWhiteboard ? 'w-1/3 border-r border-white/5' : 'w-full'} h-full transition-all duration-500 relative`}>
            <DailyClassroom 
              url={meetingUrl}
              onLeave={handleLeave}
              onJoined={() => setIsJoined(true)}
              exitTrigger={isExiting}
            />
          </div>

          {/* Dojo Whiteboard Workshop 🎨✨ */}
          {showWhiteboard && (
            <div className="flex-1 h-full animate-in slide-in-from-right duration-500">
               <DojoWhiteboard classId={classId} />
            </div>
          )}
       </div>

       {/* Ambient Glows */}
       <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-indigo-500/10 blur-[120px] pointer-events-none rounded-full" />
       <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-purple-500/10 blur-[120px] pointer-events-none rounded-full" />

       {/* ScienceDojo Premium Exit Modal Induction 🧬✨ */}
       {showExitConfirm && (
         <div className="fixed inset-0 z-[10001] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
               <div className="p-8 text-center space-y-6">
                  <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                     <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  
                  <div className="space-y-2">
                     <h3 className="text-white font-black text-lg tracking-tight">End Session?</h3>
                     <p className="text-slate-400 text-sm leading-relaxed font-medium">Are you sure you want to end this Dojo session? Your progress will be saved.</p>
                  </div>

                  <div className="flex flex-col gap-3 pt-2">
                     <button 
                       onClick={confirmExit}
                       className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg shadow-red-500/20 active:scale-[0.98]"
                     >
                        End Session
                     </button>
                     <button 
                       onClick={() => setShowExitConfirm(false)}
                       className="w-full py-4 bg-white/5 hover:bg-white/10 text-slate-300 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all border border-white/5"
                     >
                        Continue Learning
                     </button>
                  </div>
               </div>
               
               {/* Modal Footer Decorative */}
               <div className="h-1 bg-gradient-to-r from-red-500/50 via-indigo-500/50 to-purple-500/50" />
            </div>
         </div>
       )}
    </div>
  );
}

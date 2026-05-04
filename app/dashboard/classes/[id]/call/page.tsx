"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { createClient } from "@/utils/supabase/client";
import { createMeetingUrl } from "@/lib/meetings";

const DojoWhiteboard = dynamic(() => import("@/components/DojoWhiteboard"), { ssr: false });

export default function PremiumCallHub() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;
  
  const [classRoom, setClassRoom] = useState<any>(null);
  const [meetingUrl, setMeetingUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isSessionCompleted, setIsSessionCompleted] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [displayName, setDisplayName] = useState("ScienceDojo User");

  useEffect(() => {
    const initCall = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }

      setDisplayName(user.user_metadata?.full_name || user.email || "ScienceDojo User");

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
          .select("id, requested_date, meeting_url")
          .eq("class_id", classId)
          .eq("status", "confirmed");

        const now = new Date();
        const currentBooking = bookings?.find(b => 
          Math.abs(new Date(b.requested_date).getTime() - now.getTime()) < 60 * 60 * 1000
        );

        const savedMeetingUrl = currentBooking?.meeting_url;
        if (typeof savedMeetingUrl === "string" && savedMeetingUrl.startsWith("https://meet.jit.si/")) {
          setMeetingUrl(savedMeetingUrl);
        } else if (savedMeetingUrl && typeof savedMeetingUrl === "object" && "joinUrl" in savedMeetingUrl) {
          setMeetingUrl(String(savedMeetingUrl.joinUrl));
        } else {
          const details = await createMeetingUrl(currentBooking ? currentBooking.id : `instant-${classId}`);
          setMeetingUrl(details.joinUrl);

          if (currentBooking) {
            await supabase
              .from("bookings")
              .update({ meeting_url: details.joinUrl })
              .eq("id", currentBooking.id);
          }
        }
      } catch (err: any) {
        console.error("Meeting setup failed:", err);
        setError("Failed to initialize the Jitsi classroom.");
      } finally {
        setIsLoading(false);
      }
    };

    initCall();
  }, [classId, router]);

  const handleLeave = useCallback(() => {
    setIsSessionCompleted(true);
  }, []);

  const externalMeetingUrl = useMemo(() => {
    if (!meetingUrl) return "";

    try {
      const url = new URL(meetingUrl);
      url.hash = [
        "config.startWithAudioMuted=true",
        "config.startWithVideoMuted=true",
        "config.prejoinPageEnabled=true",
        displayName ? `userInfo.displayName=${encodeURIComponent(displayName)}` : "",
      ].filter(Boolean).join("&");

      return url.toString();
    } catch {
      return meetingUrl;
    }
  }, [displayName, meetingUrl]);

  // 💎 Premium Finale Redirect Handshake 🏎️🚀
  useEffect(() => {
    if (isSessionCompleted) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            window.location.href = `/dashboard/classes/${classId}`;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isSessionCompleted, classId]);

  const handleManualExit = () => {
    setShowExitConfirm(true);
  };

  const confirmExit = () => {
    setShowExitConfirm(false);
    
    setTimeout(() => {
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
        <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-8 relative overflow-hidden">
           {/* Atmospheric Cosmic Pulse Induction 🛡️✨ */}
           <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-[#6FE3D6]/20 blur-[120px] pointer-events-none rounded-full animate-pulse" />
           <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-[#1E5AA8]/20 blur-[120px] pointer-events-none rounded-full animate-pulse" style={{ animationDelay: '1.5s' }} />

             <div className="relative z-10">
                <img 
                  src="/images/sciencedojo-logo-brand.jpg" 
                  alt="ScienceDojo" 
                  className="w-24 h-24 rounded-3xl shadow-2xl shadow-[#1E5AA8]/40 animate-pulse border border-white/10" 
                />
             </div>
             <div className="text-center space-y-4 relative z-10 animate-in slide-in-from-bottom-8 duration-700 delay-300">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#6FE3D6]/10 border border-[#6FE3D6]/20 rounded-full text-[#6FE3D6] text-[10px] font-black uppercase tracking-[0.3em] mb-2 mx-auto">
                   <div className="w-1.5 h-1.5 bg-[#6FE3D6] rounded-full animate-pulse" />
                   Genesis Sequence
                </div>
                <h1 className="text-white font-black text-4xl lg:text-5xl tracking-tighter leading-tight drop-shadow-2xl">
                   High-Performance Session Initializing
                </h1>
                <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-sm mx-auto">
                   Preparing your secure interactive Jitsi classroom.
                </p>
             </div>
        </div>
      );
    }

   return (
     <div className="fixed inset-0 bg-[#020617] z-[9999] overflow-hidden flex flex-col">
       {/* Premium Top Bar */}
       <div className="h-16 px-6 flex items-center justify-between border-b border-white/5 bg-slate-900/50 backdrop-blur-xl relative z-50">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg shadow-[#1E5AA8]/20 border border-white/10">
                <img src="/images/sciencedojo-logo-brand.jpg" alt="ScienceDojo Logo" className="w-full h-full object-cover" />
             </div>
             <div>
                <h2 className="text-white font-black text-sm tracking-tight">{classRoom?.display_name || "ScienceDojo"}</h2>
                <p className="text-[10px] text-[#6FE3D6] font-black uppercase tracking-widest">Live Interactive Session</p>
             </div>
          </div>

          <div className="flex items-center gap-3">
             {isJoined && (
                <button 
                  onClick={() => setShowWhiteboard(!showWhiteboard)}
                  className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border flex items-center gap-2 ${
                    showWhiteboard 
                    ? "bg-[#1E5AA8] text-white border-[#6FE3D6]/30 shadow-lg shadow-[#1E5AA8]/20" 
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
            <div className="relative w-full h-full min-h-[600px] flex items-center justify-center overflow-hidden px-6">
              <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-[#6FE3D6]/20 blur-[150px] pointer-events-none rounded-full animate-pulse" />
              <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] bg-[#1E5AA8]/20 blur-[150px] pointer-events-none rounded-full animate-pulse" style={{ animationDelay: "1s" }} />

              <div className="relative z-10 w-full max-w-xl text-center space-y-8">
                <img
                  src="/images/sciencedojo-logo-brand.jpg"
                  alt="ScienceDojo"
                  className="w-20 h-20 rounded-3xl shadow-xl shadow-[#1E5AA8]/30 border border-white/10 mx-auto"
                />

                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#6FE3D6]/10 border border-[#6FE3D6]/20 rounded-full text-[#6FE3D6] text-[8px] font-black uppercase tracking-[0.2em]">
                    <div className="w-1 h-1 bg-[#6FE3D6] rounded-full animate-pulse" />
                    Secure Jitsi Room
                  </div>
                  <h1 className="text-white font-black text-4xl lg:text-5xl tracking-tighter leading-tight">
                    Your Live Classroom Is Ready
                  </h1>
                  <p className="text-slate-400 text-sm lg:text-base leading-relaxed font-medium max-w-md mx-auto">
                    Open the session in Jitsi Meet. The classroom link is only shown after your class access is verified.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <a
                    href={externalMeetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setIsJoined(true)}
                    className="inline-flex items-center justify-center px-8 py-4 bg-white text-[#020617] rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-2xl shadow-white/10 hover:scale-[1.02] active:scale-95"
                  >
                    Open Jitsi Classroom
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard?.writeText(meetingUrl);
                    }}
                    className="inline-flex items-center justify-center px-8 py-4 bg-white/5 hover:bg-white/10 text-slate-300 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all border border-white/10"
                  >
                    Copy Link
                  </button>
                </div>

                <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest">
                  Opens in a new tab to avoid meet.jit.si embedded-call limits
                </p>
              </div>
            </div>
          </div>

          {/* Dojo Whiteboard Workshop 🎨✨ */}
          {showWhiteboard && (
            <div className="flex-1 h-full animate-in slide-in-from-right duration-500">
               <DojoWhiteboard classId={classId} />
            </div>
          )}
       </div>

       {/* Ambient Glows: Atmospheric Bokeh System 🌌🏁 */}
       <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-[#6FE3D6]/10 blur-[120px] pointer-events-none rounded-full animate-pulse" />
       <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-[#1E5AA8]/10 blur-[120px] pointer-events-none rounded-full animate-pulse" style={{ animationDelay: '2s' }} />

       {/* ScienceDojo Premium Finale Induction 🧬🏁 */}
       {isSessionCompleted && (
          <div className="fixed inset-0 z-[20000] bg-[#020617] flex items-center justify-center p-6 animate-in fade-in duration-500 overflow-hidden">
             {/* Atmospheric Cosmic Pulse */}
             <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-[#6FE3D6]/20 blur-[120px] pointer-events-none rounded-full animate-pulse" />
             <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-[#1E5AA8]/20 blur-[120px] pointer-events-none rounded-full animate-pulse" style={{ animationDelay: '1s' }} />

             <div className="w-full max-w-lg relative z-10 text-center space-y-12">
                <div className="relative inline-block">
                   <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-[#1E5AA8]/40 animate-in zoom-in spin-in-90 duration-700 border border-white/10">
                      <img src="/images/sciencedojo-logo-brand.jpg" alt="ScienceDojo Success" className="w-full h-full object-cover" />
                   </div>
                   <div className="absolute -inset-4 bg-[#6FE3D6]/20 blur-2xl rounded-full animate-pulse" />
                </div>

                <div className="space-y-4 animate-in slide-in-from-bottom-8 duration-700 delay-300">
                   <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#6FE3D6]/10 border border-[#6FE3D6]/20 rounded-full text-[#6FE3D6] text-[10px] font-black uppercase tracking-[0.3em] mb-2">
                      <div className="w-1.5 h-1.5 bg-[#6FE3D6] rounded-full animate-pulse" />
                      Session Success
                   </div>
                   <h2 className="text-white font-black text-4xl lg:text-5xl tracking-tighter leading-tight drop-shadow-2xl">
                      High-Performance Learning Concluded
                   </h2>
                   <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-sm mx-auto">
                      Your ScienceDojo session details have been securely synchronized.
                   </p>
                </div>

                <div className="pt-8 space-y-6 animate-in fade-in duration-1000 delay-700">
                   <button 
                     onClick={() => window.location.href = `/dashboard/classes/${classId}`}
                     className="px-12 py-5 bg-white text-[#020617] rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all shadow-2xl shadow-white/10 hover:scale-[1.02] active:scale-95"
                   >
                      Return to Dashboard
                   </button>
                   
                   <p className="text-slate-500 text-[10px] uppercase font-black tracking-[0.4em] flex items-center justify-center gap-3">
                      Auto-Redirecting Pulse in
                      <span className="text-[#6FE3D6] w-4">{countdown}s</span>
                   </p>
                </div>
             </div>
             
             {/* Decorative Grain Overlay */}
             <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] blend-overlay" />
          </div>
       )}

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
               <div className="h-1 bg-gradient-to-r from-red-500/50 via-[#1E5AA8]/50 to-[#6FE3D6]/50" />
            </div>
         </div>
       )}
    </div>
  );
}

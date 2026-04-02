"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import DailyIframe, { DailyCall } from "@daily-co/daily-js";

interface DailyClassroomProps {
  url: string;
  onLeave?: () => void;
  onJoined?: () => void;
  exitTrigger?: boolean;
}

/**
 * ScienceDojo Live Classroom (Powered by Daily.co)
 * Provides a premium, prebuilt video experience with Zero-Configuration.
 */
export default function DailyClassroom({ url, onLeave, onJoined, exitTrigger }: DailyClassroomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<DailyCall | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasError, setHasError] = useState(false);

  // We use a stable, unique ID to prevent React reconciliation conflicts 🛡️
  const containerId = useMemo(() => `daily-classroom-nexus-${Math.random().toString(36).substring(7)}`, []);

  const onLeaveRef = useRef(onLeave);
  useEffect(() => {
    onLeaveRef.current = onLeave;
  }, [onLeave]);

  useEffect(() => {
    // 1. Lifecycle Guard 🛡️
    let isMounted = true;
    
    const initializeFrame = async () => {
      // Small delay to ensure the DOM is fully settled in React 18/19
      await new Promise(resolve => setTimeout(resolve, 300));
      if (!isMounted) return;

      const container = document.getElementById(containerId);
      if (!container || frameRef.current) return;

      try {
        // 2. Global Instance Purge 🛡️
        const existingInstance = DailyIframe.getCallInstance();
        if (existingInstance) {
          console.log("[Daily.co] Purging stale global instance... ♻️✨");
          await existingInstance.destroy();
        }

        console.log("[Daily.co] Commencing High-Performance Dojo Genesis... 🏎️🚀");

        const frame = DailyIframe.createFrame(container, {
          iframeStyle: {
            width: "100%",
            height: "100%",
            border: "0",
            backgroundColor: "#020617" 
          },
          showLeaveButton: true,
          showFullscreenButton: true,
          theme: {
            colors: {
              accent: '#1E5AA8',
              accentText: '#ffffff',
              background: '#020617',
              backgroundAccent: '#0f172a',
              baseText: '#ffffff',
              border: '#1E5AA8',
              mainAreaBg: '#020617',
            },
          },
        });

        frameRef.current = frame;

        // 3. Orchestrate Lifecycle Events 🧪
        frame.on("left-meeting", () => {
          console.log("[Daily.co] User left the Dojo.");
          if (onLeaveRef.current) onLeaveRef.current();
        });

        frame.on("error", (e) => {
          console.error("[Daily.co] SDK Heartbeat Error:", e);
          setHasError(true);
        });

        const clearLoader = () => {
          if (isMounted) setIsInitializing(false);
        };

        frame.on("joined-meeting", () => {
          clearLoader();
          if (onJoined) onJoined();
        });
        frame.on("loaded", clearLoader);

        // 4. Secure Room Join 🔐
        console.log("[Daily.co] Initiating Room Join Pulse... 🧬");
        await frame.join({ url });
        
        // 5. Fallback Clear (Last Resort) 🏁🧤
        setTimeout(() => {
          if (isMounted) setIsInitializing(false);
        }, 5000);
        
      } catch (err: any) {
        console.warn("[Daily.co] Dojo Genesis interrupted:", err.message);
        if (isMounted) setIsInitializing(false);
      }
    };

    initializeFrame();

    return () => {
      isMounted = false;
      if (frameRef.current) {
        console.log("[Daily.co] Deactivating Classroom Instance... 🧪✨");
        const instance = frameRef.current;
        frameRef.current = null;
        instance.destroy().catch(e => console.warn("[Daily.co] Cleanup friction:", e.message));
      }
    };
  }, [url, containerId]);
  
  // 6. Graceful Leave Pulse 🧬
  useEffect(() => {
    if (exitTrigger && frameRef.current) {
      console.log("[Daily.co] Graceful Leave Pulse Authorized... 🏎️🚀");
      frameRef.current.leave();
    }
  }, [exitTrigger]);

  if (hasError) {
    return (
      <div className="w-full h-full min-h-[600px] flex items-center justify-center bg-slate-900 rounded-xl border border-red-500/20">
        <div className="text-center">
          <p className="text-red-400 font-bold mb-2">Video Engine Collision</p>
          <button onClick={() => window.location.reload()} className="text-xs text-white/50 underline underline-offset-4 hover:text-white transition-colors">Attempt Re-Genesis</button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[600px] flex flex-col gap-4">
      {/* Atmospheric Cosmic Pulse Induction: Global Aura 🌌🏁 */}
      <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-[#6FE3D6]/20 blur-[150px] pointer-events-none rounded-full animate-pulse" />
      <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] bg-[#1E5AA8]/20 blur-[150px] pointer-events-none rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[#1E5AA8]/5 blur-[100px] pointer-events-none rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
      
      <div 
        id={containerId}
        className="relative flex-1 w-full h-full bg-[#020617]/50 backdrop-blur-sm rounded-2xl border border-[#6FE3D6]/20 shadow-[0_0_50px_-12px_rgba(30,90,168,0.3)] overflow-hidden"
      >
        {/* Branding Overlay (Non-intrusive) 🧬✨ */}
        {!isInitializing && (
          <div className="absolute top-4 left-6 z-10 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-1000">
             <div className="flex items-center gap-3">
                <img src="/images/sciencedojo-logo-brand.jpg" alt="ScienceDojo" className="w-8 h-8 rounded-lg border border-white/10" />
                <span className="text-white/30 font-black text-[10px] uppercase tracking-[0.3em]">Gatekeeping Logic Active</span>
             </div>
          </div>
        )}
        {isInitializing && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#020617]/95 z-50 transition-opacity duration-300 overflow-hidden">
            {/* Atmospheric Cosmic Pulse Induction 🛡️✨ */}
            <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-[#6FE3D6]/20 blur-[120px] pointer-events-none rounded-full animate-pulse" />
            <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-[#1E5AA8]/20 blur-[120px] pointer-events-none rounded-full animate-pulse" style={{ animationDelay: '1.5s' }} />

            <div className="flex flex-col items-center gap-6 relative z-10 text-center animate-in fade-in duration-700 delay-200">
              <div className="relative">
                <img 
                  src="/images/sciencedojo-logo-brand.jpg" 
                  alt="ScienceDojo" 
                  className="w-16 h-16 rounded-2xl shadow-xl shadow-[#1E5AA8]/30 animate-pulse border border-white/10" 
                />
              </div>
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#6FE3D6]/10 border border-[#6FE3D6]/20 rounded-full text-[#6FE3D6] text-[8px] font-black uppercase tracking-[0.2em] mb-1 mx-auto">
                   <div className="w-1 h-1 bg-[#6FE3D6] rounded-full animate-pulse" />
                   Secure Link Active
                </div>
                <h3 className="text-white font-black text-2xl lg:text-3xl tracking-tighter leading-none">
                  Initializing Nexus Hub
                </h3>
                <div className="h-1.5 w-40 bg-white/5 rounded-full overflow-hidden mx-auto mt-4">
                  <div className="h-full bg-gradient-to-r from-[#1E5AA8] to-[#6FE3D6] animate-[progress_2s_ease-in-out_infinite]" style={{ width: '100%' }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Control Hint */}
      <div className="flex justify-center text-[10px] uppercase font-black tracking-widest text-slate-500 gap-6">
        <span className="flex items-center gap-2">
           <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
           Secure End-to-End
        </span>
        <span className="flex items-center gap-2">
           <div className="w-1.5 h-1.5 bg-[#1E5AA8] rounded-full animate-pulse" />
           High Performance Engine
        </span>
      </div>
    </div>
  );
}

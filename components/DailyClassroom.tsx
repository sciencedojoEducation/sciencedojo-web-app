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
            backgroundColor: "#0f172a" 
          },
          showLeaveButton: true,
          showFullscreenButton: true,
          theme: {
            colors: {
              accent: '#6366f1',
              accentText: '#ffffff',
              background: '#0f172a',
              backgroundAccent: '#1e293b',
              baseText: '#f8fafc',
              border: '#334155',
              mainAreaBg: '#0f172a',
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
      {/* Background Glow for Premium Feel */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl blur-xl opacity-50 pointer-events-none" />
      
      <div 
        id={containerId}
        className="relative flex-1 w-full h-full bg-slate-900/50 backdrop-blur-sm rounded-xl border border-white/10 shadow-2xl overflow-hidden"
      >
        {isInitializing && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/95 z-50 transition-opacity duration-300">
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                <div className="absolute inset-0 w-16 h-16 border-4 border-purple-500/20 border-b-purple-500 rounded-full animate-[spin_2s_linear_infinite_reverse]" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-white font-black text-xs tracking-[0.3em] uppercase animate-pulse">Initializing Secure Dojo</p>
                <div className="h-1 w-32 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 animate-[progress_2s_ease-in-out_infinite]" style={{ width: '100%' }} />
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
           <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
           High Performance Engine
        </span>
      </div>
    </div>
  );
}

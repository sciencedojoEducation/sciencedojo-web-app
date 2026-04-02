"use client";

import React, { useEffect, useRef, useState } from "react";
import { generateZoomSignature } from "@/app/classes/zoom-actions";

interface ZoomClassroomProps {
  meetingNumber: string;
  passWord: string;
  userName: string;
  userEmail: string;
  role: number; // 1 for host, 0 for attendee
  onClose: () => void;
}

export default function ZoomClassroom({
  meetingNumber,
  passWord,
  userName,
  userEmail,
  role,
  onClose
}: ZoomClassroomProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isIframeReady, setIsIframeReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function setupClassroom() {
      try {
        console.log("[Zoom Wrapper] Generating secure handshake...");
        const { signature, sdkKey } = await generateZoomSignature(meetingNumber, role);
        
        if (!isMounted) return;

        // Listen for messages from the iframe
        const handleMessage = (event: MessageEvent) => {
          const { type, payload } = event.data;
          
          if (type === 'IFRAME_READY') {
            console.log("[Zoom Wrapper] Sandbox vault is ready.");
            setIsIframeReady(true);
            
            // Send meeting details to iframe
            if (iframeRef.current?.contentWindow) {
              iframeRef.current.contentWindow.postMessage({
                type: 'START_MEETING',
                payload: {
                  meetingNumber,
                  passWord,
                  userName,
                  userEmail,
                  signature,
                  sdkKey
                }
              }, '*');
            }
          } else if (type === 'MEETING_JOINED') {
            console.log("[Zoom Wrapper] Classroom is now LIVE.");
            setIsLoading(false);
          } else if (type === 'MEETING_ERROR') {
            console.error("[Zoom Wrapper] Connection Error:", payload);
            if (isMounted) {
              setError(payload);
              setIsLoading(false);
            }
          }
        };

        window.addEventListener('message', handleMessage);
        return () => {
          isMounted = false;
          window.removeEventListener('message', handleMessage);
        };
      } catch (err: any) {
        console.error("[Zoom Wrapper] Handshake Failed:", err);
        if (isMounted) {
          setError(err.message || "Failed to establish secure connection");
          setIsLoading(false);
        }
      }
    }

    setupClassroom();
  }, [meetingNumber, passWord, userName, userEmail, role]);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col">
      {/* Premium Header */}
      <div className="h-16 bg-slate-900 border-b border-white/10 flex items-center justify-between px-8 flex-shrink-0">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
           </div>
           <div>
              <h2 className="text-white font-black text-sm uppercase tracking-widest">ScienceDojo Live Classroom</h2>
              <p className="text-white/40 text-[9px] font-bold uppercase tracking-tight">Isolated Sandbox Mode • 1080p Ready</p>
           </div>
        </div>
        <button 
          onClick={onClose}
          className="px-5 py-2.5 bg-white/5 hover:bg-red-500/20 text-white hover:text-red-400 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border border-white/10 hover:border-red-500/30"
        >
          Exit Classroom
        </button>
      </div>

      {/* Viewing Area */}
      <div className="flex-1 relative bg-slate-950 overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-slate-950 z-50">
             <div className="relative">
                <div className="w-20 h-20 border-4 border-blue-500/10 rounded-full"></div>
                <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                </div>
             </div>
             <div className="text-center">
                <p className="text-white font-black text-xs uppercase tracking-[0.3em] mb-1">Connecting to Dojo</p>
                <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest animate-pulse">Establishing Secure Isolated Session...</p>
             </div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center gap-6 bg-slate-950 z-[60] animate-in fade-in duration-500">
             <div className="p-8 bg-red-500/5 border border-red-500/20 rounded-[3rem] max-w-sm">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                   <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <p className="text-white font-black text-lg mb-2 tracking-tight">Vault Handshake Failed</p>
                <p className="text-white/40 text-xs font-medium leading-relaxed">{error}</p>
             </div>
             <button onClick={onClose} className="px-8 py-4 bg-white text-black hover:bg-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl">Return to Hub</button>
          </div>
        )}

        {/* The Sandbox Video Container */}
        <iframe
          ref={iframeRef}
          src="/zoom-classroom.html"
          className={`w-full h-full border-none transition-opacity duration-1000 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          allow="camera; microphone; display-capture; fullscreen; speaker-selection"
          title="Zoom Live Meeting"
        />
      </div>
    </div>
  );
}

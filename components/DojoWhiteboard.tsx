"use client";

import { 
  Tldraw, 
  Editor, 
  DefaultSizeStyle, 
  STROKE_SIZES, 
  FONT_SIZES 
} from "tldraw";
import "tldraw/tldraw.css";
import { useEffect, useState, useRef, useMemo } from "react";
import DailyIframe from "@daily-co/daily-js";

// 🧬 ScienceDojo Precision Induction: Sub-scaling strokes for expert tutoring 🏎️
// We mathematically refine the scale to deliver an "Ultra-XS" feel on the default 'S' pulse.
STROKE_SIZES.s = 0.5;   // Hair-thin surgical precision (was 1.0)
STROKE_SIZES.m = 1.5;   // Refined from 3.5
STROKE_SIZES.l = 4.0;   // Refined from 10.0
STROKE_SIZES.xl = 12.0; // Refined from 24.0

// Optional: Refine Font Sizes for cleaner workshop labels 📝
FONT_SIZES.s = 14;
FONT_SIZES.m = 18;
FONT_SIZES.l = 24;
FONT_SIZES.xl = 32;

interface DojoWhiteboardProps {
  classId: string;
}

/**
 * ScienceDojo Collaborative Whiteboard 🧬🎨
 * Uses tldraw for premium sketching and Daily.co AppMessages for P2P sync.
 * Hardened with absolute unpkg asset coordination to bypass CDN fetch errors.
 */
export default function DojoWhiteboard({ classId }: DojoWhiteboardProps) {
  const [editor, setEditor] = useState<Editor | null>(null);
  const isHandlingRemoteChange = useRef(false);
  
  // 1. Absolute Asset Handshake 🗺️✨
  // We authorize a global CDN-bypass using unpkg to resolve "Failed to Fetch" errors.
  const assetUrls = useMemo(() => {
    const ASSET_BASE = "https://unpkg.com/@tldraw/assets@4.5.6/";
    return {
      fonts: {
        draw: `${ASSET_BASE}fonts/Shantell_Sans-Informal_Regular.woff2`,
        serif: `${ASSET_BASE}fonts/IBMPlexSerif-Regular.woff2`,
        sansSerif: `${ASSET_BASE}fonts/IBMPlexSans-Medium.woff2`,
        monospace: `${ASSET_BASE}fonts/IBMPlexMono-Medium.woff2`,
      },
      translations: {
        en: `${ASSET_BASE}translations/en.json`,
        fr: `${ASSET_BASE}translations/fr.json`,
        de: `${ASSET_BASE}translations/de.json`,
        es: `${ASSET_BASE}translations/es.json`,
        it: `${ASSET_BASE}translations/it.json`,
      },
    };
  }, []);

  // 2. Peer-to-Peer Sync Pulse 🏎️🚀
  useEffect(() => {
    if (!editor) return;

    const call = DailyIframe.getCallInstance();
    if (!call) return;

    // 🛠️ ScienceDojo Record Filter: Block user-specific noise to neutralize glitches. 🧬
    const isDocumentRecord = (id: string) => {
      const isNoise = id.startsWith("instance") || 
                      id.startsWith("pointer") || 
                      id.startsWith("camera");
      return !isNoise;
    };

    // For absolute debugging 🕵️‍♂️
    (window as any).editor = editor;

    // Listen for remote strokes and handshakes 🧬
    const handleAppMessage = (event: any) => {
      const { data, fromId } = event;
      if (data.classId !== classId) return;

      console.log(`[Whiteboard] Pulse incoming: ${data.type} from ${fromId}`);

      // 🤝 Case A: Someone is requesting the current board state (Initial Handshake)
      if (data.type === "TLDRAW_REQUEST_STATE") {
        const fullSnapshot = editor.store.getStoreSnapshot();
        // 🧬 Filter: Only authorize document records in the snapshot.
        const documentStore = Object.fromEntries(
          Object.entries(fullSnapshot.store).filter(([id]) => isDocumentRecord(id))
        );
        
        console.log(`[Whiteboard] Sharing ${Object.keys(documentStore).length} foundation records.`);
        
        if (Object.keys(documentStore).length > 0) {
           try {
             call.sendAppMessage({ 
               type: "TLDRAW_FULL_STATE", 
               classId, 
               snapshot: { ...fullSnapshot, store: documentStore } 
             }, fromId);
           } catch (err) {
             console.warn("[Whiteboard] Full-state pulse friction:", err);
           }
        }
      }

      // 🧬 Case B: We received a full board snapshot (Catch-up)
      if (data.type === "TLDRAW_FULL_STATE") {
        console.log(`[Whiteboard] Induction trigger: ${Object.keys(data.snapshot.store).length} records shared.`);
        isHandlingRemoteChange.current = true;
        try {
          editor.store.loadStoreSnapshot(data.snapshot);
        } catch (err) {
          console.warn("[Whiteboard] Load pulse friction:", err);
        } finally {
          isHandlingRemoteChange.current = false;
        }
      }

      // 🏎️ Case C: Incremental Sync (Real-time Strokes)
      if (data.type === "TLDRAW_SYNC") {
        isHandlingRemoteChange.current = true;
        try {
          const changes = data.changes as any;
          editor.store.mergeRemoteChanges(() => {
            if (changes.added) {
              Object.values(changes.added).forEach((record: any) => {
                if (isDocumentRecord(record.id)) editor.store.put([record]);
              });
            }
            if (changes.updated) {
              Object.values(changes.updated).forEach((records: any) => {
                const [_, newRecord] = records as [any, any];
                if (isDocumentRecord(newRecord.id)) editor.store.put([newRecord]);
              });
            }
            if (changes.removed) {
              Object.keys(changes.removed).forEach((id: any) => {
                if (isDocumentRecord(id)) editor.store.remove([id as any]);
              });
            }
          });
        } catch (err) {
          console.warn("[Whiteboard] Sync pulse friction:", err);
        } finally {
          isHandlingRemoteChange.current = false;
        }
      }
    };

    // 🛰️ Listen for new participants to proactively share state
    const handleParticipantJoined = (event: any) => {
       console.log(`[Whiteboard] New participant joined: ${event.participant.session_id}. Triggering pulse...`);
       const fullSnapshot = editor.store.getStoreSnapshot();
       const documentStore = Object.fromEntries(
         Object.entries(fullSnapshot.store).filter(([id]) => isDocumentRecord(id))
       );
       
       if (Object.keys(documentStore).length > 0) {
          try {
            call.sendAppMessage({ 
              type: "TLDRAW_FULL_STATE", 
              classId, 
              snapshot: { ...fullSnapshot, store: documentStore } 
            }, event.participant.session_id);
          } catch (err) {}
       }
    };

    call.on("app-message", handleAppMessage);
    call.on("participant-joined", handleParticipantJoined);
    
    // 🏁 Initial Handshake Pulse: Request state from others on mount
    if (call.meetingState() === "joined-meeting") {
       console.log("[Whiteboard] Requesting state induction...");
       call.sendAppMessage({ type: "TLDRAW_REQUEST_STATE", classId }, "*");
    }
    
    // Broadcast local strokes 🛰️
    const cleanup = editor.store.listen((event) => {
      if (isHandlingRemoteChange.current || event.source !== "user") return;
      
      // 🛡️ Filter: Only broadcast changes to document records to avoid glitch-pollution.
      const added = Object.fromEntries(
        Object.entries(event.changes.added).filter(([id]) => isDocumentRecord(id))
      );
      const updated = Object.fromEntries(
        Object.entries(event.changes.updated).filter(([id]) => isDocumentRecord(id))
      );
      const removed = Object.fromEntries(
         Object.entries(event.changes.removed).filter(([id]) => isDocumentRecord(id))
      );

      if (Object.keys(added).length === 0 && 
          Object.keys(updated).length === 0 && 
          Object.keys(removed).length === 0) return;

      // We only authorize a broadcast if the ScienceDojo session is joined-meeting absolute. 🧬
      if (call.meetingState() === "joined-meeting") {
        try {
          console.log(`[Whiteboard] Broadcasting sync: ${Object.keys(added).length} added, ${Object.keys(updated).length} updated.`);
          call.sendAppMessage({ 
            type: "TLDRAW_SYNC", 
            classId, 
            changes: { added, updated, removed } 
          }, "*");
        } catch (err) {
          console.warn("[Whiteboard] Broadcast pulse friction:", err);
        }
      }
    });

    return () => {
      call.off("app-message", handleAppMessage);
      call.off("participant-joined", handleParticipantJoined);
      cleanup();
    };
  }, [editor, classId]);

  return (
    <div className="w-full h-full bg-slate-50 overflow-hidden relative border-l border-white/5 shadow-2xl">
      {/* Background Dojo Grid 🛡️ */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
         <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" width="100" height="100">
            <defs>
               <pattern id="dojogrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0f172a" strokeWidth="0.5"/>
               </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dojogrid)" />
         </svg>
      </div>

      <div className="absolute inset-0 z-10 tldraw-premium-theme">
        <Tldraw 
          onMount={(editor) => {
            setEditor(editor);
            (window as any).editor = editor;
            // We authorize an absolute precision-handshake. 🧬✨
            editor.setStyleForNextShapes(DefaultSizeStyle, 's');
          }} 
          inferDarkMode={false}
          assetUrls={assetUrls as any}
        />
      </div>

      <style jsx global>{`
        /* Premium Paper-Light Variable Induction 📝✨ */
        .tldraw-premium-theme {
          --tl-background: #f8fafc !important; /* Slate-50 absolute 🧬 */
          --tl-text: #0f172a !important;
          --tl-panel: #f1f5f9 !important;
          --tl-accent: #6366f1 !important;
          --tl-cursor: #0f172a !important;
          --tl-canvas: #f8fafc !important;
        }

        .tldraw-premium-theme .tl-container {
          background-color: #f8fafc !important; 
          color: #0f172a !important;
        }

        /* Force Canvas to Premium Slate-50 🦾 */
        .tl-canvas, .tl-background {
          background-color: #f8fafc !important;
          fill: #f8fafc !important;
        }
        
        /* Force SVG Icon Absolute Visibility ✒️ */
        .tldraw-premium-theme svg, .tl-toolbar-item svg {
          color: #0f172a !important;
          fill: currentColor !important;
          stroke: currentColor !important;
        }

        /* Premium Light-Mode Glassmorphic Toolbar 🎨 */
        .tl-toolbar, .tl-ui-layout {
          background: rgba(255, 255, 255, 0.9) !important;
          backdrop-filter: blur(24px) !important;
          border: 1px solid rgba(15, 23, 42, 0.1) !important;
          box-shadow: 0 12px 48px rgba(15, 23, 42, 0.15) !important;
          border-radius: 24px !important;
        }

        .tl-toolbar-item {
          color: #0f172a !important;
          background: transparent !important;
        }

        .tl-toolbar-item[data-selected="true"], .tl-toolbar-item:hover {
          background: rgba(99, 102, 241, 0.1) !important;
          color: #6366f1 !important;
        }

        /* Suppress Clutter for clean Dojo Workshop 🛡️ */
        .tl-ui-debug-panel, 
        .tl-ui-menu-zone > button:last-child,
        [data-testid="license-warning"],
        .tl-watermark {
          display: none !important;
        }
      `}</style>
    </div>
  );
}

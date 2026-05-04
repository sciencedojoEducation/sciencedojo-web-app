"use client";

import { 
  Tldraw, 
  DefaultSizeStyle, 
  STROKE_SIZES, 
  FONT_SIZES 
} from "tldraw";
import "tldraw/tldraw.css";
import { useMemo } from "react";

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
 * Uses tldraw for premium sketching beside the Jitsi classroom.
 * Hardened with absolute unpkg asset coordination to bypass CDN fetch errors.
 */
export default function DojoWhiteboard({ classId }: DojoWhiteboardProps) {
  void classId;
  
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

"use client";

import React, { useState } from "react";
import InquiryModal from "./InquiryModal";
import { trackEvent } from "@/lib/analytics";

interface MessageTutorButtonProps {
  tutorId: string;
  tutorName: string;
  viewerRole: string | null;
  isAuthenticated: boolean;
  returnPath?: string;
  label?: string;
  className?: string;
  autoOpen?: boolean;
}

export default function MessageTutorButton({ 
  tutorId, 
  tutorName, 
  viewerRole, 
  isAuthenticated,
  returnPath,
  label,
  className,
  autoOpen = false,
}: MessageTutorButtonProps) {
  const [showModal, setShowModal] = useState(autoOpen);

  return (
    <>
      <button 
        onClick={() => {
          try {
            trackEvent("ask_before_book_clicked", {
              tutor_id: tutorId,
              authenticated: isAuthenticated,
            });
          } catch {
            // Analytics should never block opening the inquiry modal.
          }
          setShowModal(true);
        }}
        className={className || "px-10 py-4 bg-white border-2 border-primary text-primary font-black rounded-2xl hover:bg-primary/5 transition-all uppercase tracking-widest text-xs shadow-lg hover:shadow-xl group"}
      >
        <span className="flex items-center gap-2">
           <svg className="w-4 h-4 group-hover:animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
           </svg>
           {label || `Message ${tutorName}`}
        </span>
      </button>

      {showModal && (
        <InquiryModal 
          tutorId={tutorId} 
          tutorName={tutorName} 
          viewerRole={viewerRole}
          isAuthenticated={isAuthenticated}
          returnPath={returnPath}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

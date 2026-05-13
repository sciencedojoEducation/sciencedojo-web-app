"use client";

import { useState } from "react";
import Image from "next/image";
import { Booking } from "@/lib/supabase-queries";
import ReviewModal from "./ReviewModal";
import DisputeModal from "./DisputeModal";

interface LessonHistoryTableProps {
  bookings: Booking[];
  currentUserRole?: string;
}

const AVATAR_GRADIENTS = [
  "from-violet-500 to-indigo-500",
  "from-pink-500 to-rose-500",
  "from-amber-500 to-orange-500",
  "from-emerald-500 to-teal-500",
  "from-sky-500 to-blue-500",
  "from-purple-500 to-fuchsia-500",
];

function getAvatarGradient(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

export default function LessonHistoryTable({ bookings, currentUserRole = "student" }: LessonHistoryTableProps) {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [disputeBooking, setDisputeBooking] = useState<Booking | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Implementing Grab-to-Scroll
  const handleMouseDown = (e: React.MouseEvent) => {
    const container = e.currentTarget as HTMLDivElement;
    setIsDragging(true);
    setStartX(e.pageX - container.offsetLeft);
    setScrollLeft(container.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const container = e.currentTarget as HTMLDivElement;
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed
    container.scrollLeft = scrollLeft - walk;
  };

  // Helper to safely get the first note or null
  const getNote = (booking: Booking) => {
    if (!booking.lesson_notes) return null;
    if (Array.isArray(booking.lesson_notes)) {
      return booking.lesson_notes[0] || null;
    }
    return booking.lesson_notes;
  };

  return (
    <div className="relative group/scroll bg-white rounded-[1.5rem] border border-secondary/10 shadow-sm shadow-black/[0.02] overflow-hidden p-3 md:rounded-[2.5rem] md:p-4 md:shadow-xl">
      <div className="space-y-3 md:hidden">
        {bookings.map((booking) => {
          const note = getNote(booking);
          const tutorInitial = (booking.tutor_name || "T").charAt(0).toUpperCase();
          const gradient = getAvatarGradient(booking.tutor_id || booking.tutor_name || "seed");

          return (
            <article key={booking.id} className="rounded-2xl border border-secondary/8 bg-slate-50/60 p-4">
              <div className="flex items-start gap-3">
                <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-xl border-2 border-white shadow-sm">
                  {booking.tutor_avatar ? (
                    <Image src={booking.tutor_avatar} alt="" fill className="object-cover" />
                  ) : (
                    <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradient} text-sm font-black text-white`}>
                      {tutorInitial}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-secondary">{booking.subject}</p>
                      <p className="mt-1 text-xs font-bold text-secondary/45">
                        {new Date(booking.requested_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} with {booking.tutor_name || "Tutor"}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-emerald-600">
                      Completed
                    </span>
                  </div>

                  <p className="mt-3 line-clamp-2 text-sm font-medium leading-6 text-secondary/58">
                    {note?.summary || "A parent-friendly lesson summary will appear here when tutor notes are added."}
                  </p>

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    {note ? (
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowModal(true);
                        }}
                        className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-primary px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-white shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      >
                        View summary
                      </button>
                    ) : (
                      <span className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-secondary/35">
                        Note pending
                      </span>
                    )}
                    {currentUserRole !== 'tutor' && !booking.has_review && (
                      <button
                        onClick={() => setReviewBooking(booking)}
                        className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-amber-700 transition-colors hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
                      >
                        Review
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* 💎 Grab-to-Scroll Table Container */}
      <div 
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        className={`hidden overflow-x-auto pb-6 grab-scroll md:block ${isDragging ? 'grabbing select-none cursor-grabbing' : 'cursor-grab'}`}
      >
        {/* Right-Fade Indicator to signal more content */}
        <div className="absolute right-4 top-4 bottom-10 w-20 bg-gradient-to-l from-white to-transparent pointer-events-none z-10 opacity-0 group-hover/scroll:opacity-100 transition-opacity"></div>
        
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50/50 border-b border-secondary/5 text-secondary/40 text-[10px] font-black uppercase tracking-[0.2em]">
              <th className="px-8 py-5">Date</th>
              <th className="px-8 py-5">Instructor</th>
              <th className="px-8 py-5">Subject</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="font-medium">
            {bookings.map((booking, i) => {
              const note = getNote(booking);
              const tutorInitial = (booking.tutor_name || "T").charAt(0).toUpperCase();
              const gradient = getAvatarGradient(booking.tutor_id || booking.tutor_name || "seed");

              return (
                <tr key={booking.id} className={`border-b border-secondary/5 hover:bg-slate-50/30 transition-colors ${i === bookings.length - 1 ? 'border-none' : ''}`}>
                  <td className="px-8 py-6 text-sm text-secondary font-black">
                     <div className="flex flex-col">
                        <span>{new Date(booking.requested_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span className="text-[10px] text-secondary/30 font-bold tracking-tight mt-0.5">#{booking.id.slice(0, 8)}</span>
                     </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 relative rounded-2xl overflow-hidden border-2 border-white shadow-lg flex-shrink-0">
                          {booking.tutor_avatar ? (
                             <Image src={booking.tutor_avatar} alt="" fill className="object-cover" />
                          ) : (
                             <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-black text-lg`}>
                                {tutorInitial}
                             </div>
                          )}
                       </div>
                       <div>
                          <p className="text-sm font-black text-secondary">{booking.tutor_name}</p>
                          <p className="text-[10px] font-bold text-secondary/40 uppercase tracking-[0.14em]">Verified tutor</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                     <span className="text-[10px] font-black text-primary bg-primary/5 px-3 py-1.5 rounded-full border border-primary/10 uppercase tracking-widest">{booking.subject}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                       <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                       Completed
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {note ? (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBooking(booking);
                            setShowModal(true);
                          }}
                          className="px-5 py-2.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 whitespace-nowrap"
                        >
                          View Summary
                        </button>
                      ) : (
                        <span className="text-[10px] font-black text-secondary/30 uppercase tracking-widest italic mr-2">Note Pending</span>
                      )}

                      {currentUserRole !== 'tutor' && !booking.has_review && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setReviewBooking(booking);
                          }}
                          className="px-5 py-2.5 bg-amber-400 text-amber-950 text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-amber-500 shadow-lg shadow-amber-200 transition-all active:scale-95 whitespace-nowrap"
                        >
                          Review
                        </button>
                      )}

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setDisputeBooking(booking);
                        }}
                        className="w-10 h-10 flex items-center justify-center bg-slate-50 text-secondary/40 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all border border-secondary/5 group shadow-sm flex-shrink-0"
                        title="Report an Issue"
                      >
                         <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 21h18M3 10h18M3 7l9 5 9-5M4 10v11h16V10" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {bookings.length === 0 && (
        <div className="p-8 text-center flex flex-col items-center gap-3 text-secondary/25 md:p-20 md:gap-4">
           <svg className="w-12 h-12 md:h-16 md:w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
           <p className="font-black uppercase tracking-[0.12em] text-xs md:tracking-widest">Past lesson summaries will appear after completed tutoring sessions.</p>
        </div>
      )}

      {/* View Note Modal */}
      {showModal && selectedBooking && (
         <div className="fixed inset-0 bg-secondary/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] p-5 max-w-2xl w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 relative overflow-hidden md:rounded-[3rem] md:p-12">
               <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-bl-full -z-10"></div>
               
               <div className="flex justify-between items-start mb-6 md:mb-10">
                  <div>
                    <h2 className="text-2xl font-black text-secondary tracking-tighter mb-2 md:text-4xl">Lesson Summary</h2>
                    <p className="text-sm text-secondary/40 font-bold flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-green-500"></span>
                       Session from {new Date(selectedBooking.requested_date).toLocaleDateString()}
                    </p>
                  </div>
                  <button onClick={() => setShowModal(false)} className="bg-slate-100 hover:bg-slate-200 w-10 h-10 rounded-xl flex items-center justify-center text-2xl text-secondary/40 transition-colors md:h-12 md:w-12 md:rounded-2xl">×</button>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-6 md:mb-10">
                  <div className="p-4 bg-slate-50 rounded-[1.5rem] border border-secondary/5 md:p-6 md:rounded-[2rem]">
                     <h3 className="text-[10px] font-black text-primary uppercase tracking-widest mb-4">What was covered</h3>
                     <p className="text-secondary/80 text-sm font-medium leading-relaxed italic">
                        "{getNote(selectedBooking)?.summary || "No summary provided."}"
                     </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-[1.5rem] border border-secondary/5 md:p-6 md:rounded-[2rem]">
                     <h3 className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-4">Homework / Next Steps</h3>
                     <p className="text-secondary/80 text-sm font-medium leading-relaxed italic">
                        "{getNote(selectedBooking)?.homework || "No practice task assigned."}"
                     </p>
                  </div>
               </div>

               <div className="flex items-center gap-4 p-4 border border-slate-100 rounded-[1.5rem] mb-6 md:gap-5 md:p-6 md:border-2 md:rounded-[2rem] md:mb-10">
                  <div className="w-12 h-12 relative rounded-xl overflow-hidden border-2 border-white shadow-md md:h-16 md:w-16 md:rounded-2xl md:border-4 md:shadow-xl">
                     <Image src={selectedBooking.tutor_avatar || "/tutor_placeholder.webp"} alt="" fill className="object-cover" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-secondary/30 uppercase tracking-[0.14em] mb-1">Tutor</p>
                    <h4 className="text-xl font-black text-secondary leading-none">{selectedBooking.tutor_name}</h4>
                  </div>
               </div>

               <button 
                  onClick={() => setShowModal(false)}
                  className="w-full min-h-11 py-3 bg-secondary text-white font-black rounded-2xl hover:bg-secondary/90 transition-all shadow-xl active:scale-[0.98] uppercase tracking-widest text-sm md:py-5 md:rounded-3xl"
               >
                  Close Feedback
               </button>
            </div>
         </div>
      )}

      {/* Leave Review Modal */}
      {reviewBooking && (
        <ReviewModal
          bookingId={reviewBooking.id}
          tutorId={reviewBooking.tutor_id}
          tutorName={reviewBooking.tutor_name || 'Tutor'}
          onClose={() => setReviewBooking(null)}
          onSuccess={() => {
            window.location.reload();
          }}
        />
      )}

      {/* Report Issue Modal */}
      {disputeBooking && (
        <DisputeModal
           bookingId={disputeBooking.id}
           onClose={() => setDisputeBooking(null)}
           onSuccess={() => {
              window.location.reload();
           }}
        />
      )}
    </div>
  );
}

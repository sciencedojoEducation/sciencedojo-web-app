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

export default function LessonHistoryTable({ bookings, currentUserRole = "student" }: LessonHistoryTableProps) {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [disputeBooking, setDisputeBooking] = useState<Booking | null>(null);

  // Helper to safely get the first note or null
  const getNote = (booking: Booking) => {
    if (!booking.lesson_notes) return null;
    // Handle both object and array return formats from Supabase join
    if (Array.isArray(booking.lesson_notes)) {
      return booking.lesson_notes[0] || null;
    }
    return booking.lesson_notes;
  };

  return (
    <div className="bg-white rounded-[2rem] border border-secondary/10 shadow-sm overflow-hidden overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[600px]">
        <thead>
          <tr className="bg-slate-50 border-b border-secondary/10 text-secondary/40 text-[10px] font-black uppercase tracking-[0.2em]">
            <th className="p-6">Date</th>
            <th className="p-6">Tutor</th>
            <th className="p-6">Subject</th>
            <th className="p-6">Status</th>
            <th className="p-6 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="font-medium">
          {bookings.map((booking, i) => {
            const note = getNote(booking);
            return (
              <tr key={booking.id} className={`border-b border-secondary/5 hover:bg-slate-50/50 transition-colors ${i === bookings.length - 1 ? 'border-none' : ''}`}>
                <td className="p-6 text-sm text-secondary font-black">
                  {new Date(booking.requested_date).toLocaleDateString(undefined, { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </td>
                <td className="p-6 text-sm text-secondary flex items-center gap-3 font-bold">
                  <div className="w-10 h-10 relative rounded-xl overflow-hidden border-2 border-white shadow-xl">
                    <Image src={booking.tutor_avatar || "/tutor_placeholder.webp"} alt="" fill className="object-cover" />
                  </div>
                  {booking.tutor_name}
                </td>
                <td className="p-6">
                   <span className="text-[10px] font-black text-secondary/40 bg-secondary/5 px-2 py-1 rounded-md uppercase tracking-wider">{booking.subject}</span>
                </td>
                <td className="p-6">
                  <span className="px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-500/20">Completed</span>
                </td>
                <td className="p-6 text-right flex justify-end gap-2">
                  {note ? (
                    <>
                      <button 
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowModal(true);
                        }}
                        className="px-6 py-2 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary-hover shadow-lg transition-all active:scale-95"
                      >
                        View Summary
                      </button>
                      
                      {currentUserRole !== 'tutor' && !booking.has_review && (
                        <button 
                          onClick={() => setReviewBooking(booking)}
                          className="px-6 py-2 bg-yellow-400 text-yellow-900 border border-yellow-500 shadow-sm text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-yellow-500 transition-all active:scale-95 flex flex-col justify-center items-center h-8"
                        >
                          Review
                        </button>
                      )}

                      <button 
                        onClick={() => setDisputeBooking(booking)}
                        className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all border border-red-100"
                        title="Report an Issue"
                      >
                         ⚖️
                      </button>
                    </>
                  ) : (
                    <span className="text-[10px] font-black text-secondary/20 uppercase tracking-widest italic flex h-8 items-center">Note Pending</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {bookings.length === 0 && (
        <div className="p-20 text-center flex flex-col items-center gap-4 text-secondary/20">
           <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
           <p className="font-black uppercase tracking-widest text-xs">No lesson history recorded yet.</p>
        </div>
      )}

      {/* View Note Modal */}
      {showModal && selectedBooking && (
         <div className="fixed inset-0 bg-secondary/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[3rem] p-12 max-w-2xl w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-bl-full -z-10"></div>
               
               <div className="flex justify-between items-start mb-10">
                  <div>
                    <h2 className="text-4xl font-black text-secondary tracking-tighter mb-2">Lesson Summary</h2>
                    <p className="text-sm text-secondary/40 font-bold flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-green-500"></span>
                       Session from {new Date(selectedBooking.requested_date).toLocaleDateString()}
                    </p>
                  </div>
                  <button onClick={() => setShowModal(false)} className="bg-slate-100 hover:bg-slate-200 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl text-secondary/40 transition-colors">×</button>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                  <div className="p-6 bg-slate-50 rounded-[2rem] border border-secondary/5">
                     <h3 className="text-[10px] font-black text-primary uppercase tracking-widest mb-4">What was covered</h3>
                     <p className="text-secondary/80 text-sm font-medium leading-relaxed italic">
                        "{getNote(selectedBooking)?.summary || "No summary provided."}"
                     </p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-[2rem] border border-secondary/5">
                     <h3 className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-4">Homework / Next Steps</h3>
                     <p className="text-secondary/80 text-sm font-medium leading-relaxed italic">
                        "{getNote(selectedBooking)?.homework || "No homework assigned."}"
                     </p>
                  </div>
               </div>

               <div className="flex items-center gap-5 p-6 border-2 border-slate-100 rounded-[2rem] mb-10">
                  <div className="w-16 h-16 relative rounded-2xl overflow-hidden border-4 border-white shadow-xl">
                     <Image src={selectedBooking.tutor_avatar || "/tutor_placeholder.webp"} alt="" fill className="object-cover" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-secondary/30 uppercase tracking-widest mb-1">Expert Instructor</p>
                    <h4 className="text-xl font-black text-secondary leading-none">{selectedBooking.tutor_name}</h4>
                  </div>
               </div>

               <button 
                  onClick={() => setShowModal(false)}
                  className="w-full py-5 bg-secondary text-white font-black rounded-3xl hover:bg-secondary/90 transition-all shadow-xl active:scale-[0.98] uppercase tracking-widest text-sm"
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
            // Optimistically update the local bookings array or trigger a refresh
            // Currently, re-rendering happens via Next.js router implicitly or the parent needs to handle it.
            // But just dismissing the modal is fine for now. The page revalidatePath will handle the fetch.
            // Actually, we can use window.location.reload() for a quick fix or just let the button hide by updating the array.
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

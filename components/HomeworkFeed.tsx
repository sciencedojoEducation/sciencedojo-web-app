import React from 'react';
import { Booking } from '@/lib/supabase-queries';

interface HomeworkFeedProps {
  bookings: Booking[];
}

export default function HomeworkFeed({ bookings }: HomeworkFeedProps) {
  // Find completed bookings that have homework assigned
  const assignments = bookings
    .filter(b => b.status === "completed" && b.lesson_notes?.homework && b.lesson_notes.homework.trim() !== "")
    .sort((a, b) => new Date(b.requested_date).getTime() - new Date(a.requested_date).getTime());

  if (assignments.length === 0) return null;

  return (
    <section className="bg-primary/5 rounded-[2.5rem] p-8 border-2 border-primary/20 shadow-xl shadow-primary/5 mb-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black text-secondary flex items-center gap-4">
          <span className="p-2 bg-primary text-white rounded-xl">
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
             </svg>
          </span>
          Recent Assignments
        </h2>
        <span className="text-xs font-black text-primary uppercase tracking-[0.2em]">Homework Feed</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {assignments.slice(0, 4).map(booking => (
            <div key={`hw-${booking.id}`} className="bg-white p-6 rounded-[2rem] border border-primary/10 shadow-lg flex gap-4 relative overflow-hidden group">
               <div className="w-1.5 bg-primary/20 absolute left-0 top-0 bottom-0 rounded-l-[2rem] group-hover:bg-primary transition-colors"></div>
               
               <div className="flex-1 pl-2">
                 <div className="flex justify-between items-start mb-2">
                    <span className="inline-block px-2.5 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded-lg uppercase tracking-wider">
                       {booking.subject}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-secondary/40">
                       {new Date(booking.requested_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                 </div>
                 
                 <p className="text-secondary font-medium text-sm my-3 italic border-l-2 border-secondary/10 pl-3 py-1">
                    "{booking.lesson_notes?.homework}"
                 </p>
                 
                 <div className="flex items-center gap-2 mt-4 pt-4 border-t border-secondary/5">
                    <img 
                      src={booking.tutor_avatar || "/tutor_placeholder.webp"} 
                      alt={booking.tutor_name || "Tutor"} 
                      className="w-6 h-6 rounded-full object-cover shadow-sm bg-secondary/10" 
                    />
                    <span className="text-xs font-bold text-secondary/60">
                       Assigned by <span className="text-secondary">{booking.tutor_name}</span>
                    </span>
                 </div>
               </div>
            </div>
         ))}
      </div>
    </section>
  );
}

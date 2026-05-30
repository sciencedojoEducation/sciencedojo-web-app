import React from 'react';
import { Booking } from '@/lib/supabase-queries';
import StudentProgressChart from './StudentProgressChart';

interface StudentProgressStatsProps {
  bookings: Booking[];
  mobileDensity?: "default" | "compact";
}

export default function StudentProgressStats({ bookings, mobileDensity = "default" }: StudentProgressStatsProps) {
  const completed = bookings.filter(b => b.status === 'completed');
  const isCompact = mobileDensity === "compact";
  
  const lessonsCompleted = completed.length;
  const totalHours = completed.reduce((sum, booking) => sum + (booking.duration_hours || 1), 0);
  const hoursStudied = Number.isInteger(totalHours) ? totalHours : Number(totalHours.toFixed(1));
  
  const subjects = new Set(completed.map(b => b.subject)).size;
  
  // Calculate a mock "streak" (e.g., active if latest lesson was within last 14 days)
  let isActive = false;
  if (completed.length > 0) {
    const latestDate = new Date(Math.max(...completed.map(b => new Date(b.requested_date).getTime())));
    const daysSince = (Date.now() - latestDate.getTime()) / (1000 * 60 * 60 * 24);
    isActive = daysSince <= 14;
  }

  return (
    <section>
      <div className={isCompact ? "mb-3 md:mb-6" : "mb-4 md:mb-6"}>
        <h2 className="text-lg font-black text-secondary md:text-xl">Learning progress</h2>
        <p className={`mt-1.5 max-w-2xl text-sm font-medium text-secondary/50 md:mt-2 md:leading-7 ${isCompact ? "leading-6" : "leading-7"}`}>
          A calm snapshot of tutoring activity and learning rhythm, not a scorecard.
        </p>
      </div>
      <div className={`mb-2 grid grid-cols-2 md:grid-cols-4 md:gap-4 ${isCompact ? "gap-2.5" : "gap-3"}`}>
        
        <div className={`flex flex-col items-center justify-center rounded-2xl border border-secondary/10 bg-white text-center shadow-sm md:rounded-3xl md:p-6 ${isCompact ? "p-3" : "p-4"}`}>
          <div className={`mb-2 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 md:mb-3 md:h-12 md:w-12 md:rounded-2xl ${isCompact ? "h-9 w-9" : "h-10 w-10"}`}>
             <svg className={`${isCompact ? "h-4 w-4" : "h-5 w-5"} md:h-6 md:w-6`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div className={`${isCompact ? "text-xl" : "text-2xl"} font-black text-secondary md:text-3xl`}>{lessonsCompleted}</div>
          <div className="text-[9px] font-black uppercase tracking-[0.12em] text-secondary/40 md:text-[10px] md:tracking-widest">Lessons</div>
        </div>

        <div className={`flex flex-col items-center justify-center rounded-2xl border border-secondary/10 bg-white text-center shadow-sm md:rounded-3xl md:p-6 ${isCompact ? "p-3" : "p-4"}`}>
          <div className={`mb-2 flex items-center justify-center rounded-xl bg-purple-50 text-purple-600 md:mb-3 md:h-12 md:w-12 md:rounded-2xl ${isCompact ? "h-9 w-9" : "h-10 w-10"}`}>
             <svg className={`${isCompact ? "h-4 w-4" : "h-5 w-5"} md:h-6 md:w-6`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div className={`${isCompact ? "text-xl" : "text-2xl"} font-black text-secondary md:text-3xl`}>{hoursStudied}</div>
          <div className="text-[9px] font-black uppercase tracking-[0.12em] text-secondary/40 md:text-[10px] md:tracking-widest">Tutoring hours</div>
        </div>

        <div className={`flex flex-col items-center justify-center rounded-2xl border border-secondary/10 bg-white text-center shadow-sm md:rounded-3xl md:p-6 ${isCompact ? "p-3" : "p-4"}`}>
          <div className={`mb-2 flex items-center justify-center rounded-xl bg-orange-50 text-orange-600 md:mb-3 md:h-12 md:w-12 md:rounded-2xl ${isCompact ? "h-9 w-9" : "h-10 w-10"}`}>
             <svg className={`${isCompact ? "h-4 w-4" : "h-5 w-5"} md:h-6 md:w-6`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          </div>
          <div className={`${isCompact ? "text-xl" : "text-2xl"} font-black text-secondary md:text-3xl`}>{subjects}</div>
          <div className="text-[9px] font-black uppercase tracking-[0.12em] text-secondary/40 md:text-[10px] md:tracking-widest">Subjects</div>
        </div>

        <div className={`${isCompact ? "p-3" : "p-4"} flex flex-col items-center justify-center rounded-2xl border text-center shadow-sm md:rounded-3xl md:p-6 ${isActive ? 'bg-gradient-to-br from-green-400 to-green-600 border-green-500 text-white' : 'bg-white border-secondary/10'}`}>
          <div className={`${isCompact ? "h-9 w-9" : "h-10 w-10"} mb-2 flex items-center justify-center rounded-xl md:mb-3 md:h-12 md:w-12 md:rounded-2xl ${isActive ? 'bg-white/20 text-white' : 'bg-gray-50 text-gray-400'}`}>
             <svg className={`${isCompact ? "h-4 w-4" : "h-5 w-5"} md:h-6 md:w-6`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <div className={`${isCompact ? "text-xl" : "text-2xl"} font-black md:text-3xl ${isActive ? 'text-white' : 'text-secondary'}`}>{isActive ? 'Active' : 'Soon'}</div>
          <div className={`text-[9px] font-black uppercase tracking-[0.12em] md:text-[10px] md:tracking-widest ${isActive ? 'text-white/80' : 'text-secondary/40'}`}>Recent activity</div>
        </div>

      </div>

      <StudentProgressChart bookings={bookings} />
    </section>
  );
}

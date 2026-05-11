import React from 'react';
import { Booking } from '@/lib/supabase-queries';
import StudentProgressChart from './StudentProgressChart';

interface StudentProgressStatsProps {
  bookings: Booking[];
}

export default function StudentProgressStats({ bookings }: StudentProgressStatsProps) {
  const completed = bookings.filter(b => b.status === 'completed');
  
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
      <div className="mb-6">
        <h2 className="text-xl font-black text-secondary">Learning progress</h2>
        <p className="mt-2 max-w-2xl text-sm font-medium leading-7 text-secondary/50">
          A calm snapshot of tutoring activity and learning rhythm, not a scorecard.
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
        
        <div className="bg-white p-6 rounded-3xl border border-secondary/10 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div className="text-3xl font-black text-secondary">{lessonsCompleted}</div>
          <div className="text-[10px] font-black uppercase tracking-widest text-secondary/40">Lessons</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-secondary/10 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div className="text-3xl font-black text-secondary">{hoursStudied}</div>
          <div className="text-[10px] font-black uppercase tracking-widest text-secondary/40">Tutoring hours</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-secondary/10 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-3">
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          </div>
          <div className="text-3xl font-black text-secondary">{subjects}</div>
          <div className="text-[10px] font-black uppercase tracking-widest text-secondary/40">Subjects</div>
        </div>

        <div className={`p-6 rounded-3xl border shadow-sm flex flex-col items-center justify-center text-center ${isActive ? 'bg-gradient-to-br from-green-400 to-green-600 border-green-500 text-white' : 'bg-white border-secondary/10'}`}>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${isActive ? 'bg-white/20 text-white' : 'bg-gray-50 text-gray-400'}`}>
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <div className={`text-3xl font-black ${isActive ? 'text-white' : 'text-secondary'}`}>{isActive ? 'Active' : 'Soon'}</div>
          <div className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-white/80' : 'text-secondary/40'}`}>Recent activity</div>
        </div>

      </div>

      <StudentProgressChart bookings={bookings} />
    </section>
  );
}

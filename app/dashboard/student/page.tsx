import { getBookingsByUserId, getTutors } from "@/lib/supabase-queries";
import { getActiveAnnouncementsForUser } from "@/lib/announcement-queries";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";
import TutorCard from "@/components/TutorCard";
import CheckoutButton from "@/components/CheckoutButton";
import LessonHistoryTable from "@/components/LessonHistoryTable";
import HomeworkFeed from "@/components/HomeworkFeed";
import StudentProgressStats from "@/components/StudentProgressStats";
import AnnouncementFeed from "@/components/AnnouncementFeed";
import { getHomeworkForStudent } from "@/lib/class-queries";

export default async function StudentDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="text-secondary/60">Please log in to view your dashboard.</p>
        <Link href="/login" className="text-primary font-bold hover:underline mt-4 inline-block">Log in</Link>
      </div>
    );
  }

  const meta = user?.user_metadata;
  
  const [
    { data: profile },
    bookings,
    availableTutors,
    announcements,
    assignments,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .single(),
    getBookingsByUserId(user.id),
    getTutors("", "All", 6),
    getActiveAnnouncementsForUser(),
    getHomeworkForStudent(user.id),
  ]);

  const userName = profile?.full_name || meta?.full_name || "User";
  const avatarUrl = profile?.avatar_url || meta?.avatar_url;

  const requested = bookings.filter(b => b.status === "requested");
  const groupedRequested = Object.values(requested.reduce((acc, booking) => {
    const groupId = booking.recurrence_group_id || booking.id;
    if (!acc[groupId]) {
      acc[groupId] = {
        id: groupId,
        isGroup: !!booking.recurrence_group_id,
        count: 0,
        mainBooking: booking,
      };
    }
    acc[groupId].count++;
    return acc;
  }, {} as Record<string, { id: string, isGroup: boolean, count: number, mainBooking: (typeof bookings)[0] }>));

  const toPay = bookings.filter(b => b.status === "accepted");
  const groupedToPay = Object.values(toPay.reduce((acc, booking) => {
    const groupId = booking.recurrence_group_id || booking.id;
    if (!acc[groupId]) {
      acc[groupId] = {
        id: groupId,
        isGroup: !!booking.recurrence_group_id,
        count: 0,
        mainBooking: booking,
      };
    }
    acc[groupId].count++;
    return acc;
  }, {} as Record<string, { id: string, isGroup: boolean, count: number, mainBooking: (typeof bookings)[0] }>));

  const upcoming = bookings.filter(b => b.status === "confirmed");
  const past = bookings.filter(b => b.status === "completed");

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-12">
      {/* Platform Announcements Hub */}
      {announcements.length > 0 && (
         <AnnouncementFeed announcements={announcements} />
      )}

      <div data-tour="student-welcome" className="flex justify-between items-end">
         <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-[1.5rem] bg-primary/10 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center transform -rotate-3 transition-transform hover:rotate-0">
               {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                  <span className="text-3xl font-black text-primary">{userName.charAt(0)}</span>
               )}
            </div>
            <div>
               <h1 className="text-4xl font-black mb-1 bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent tracking-tight">
                  Hello, {userName.trim().split(' ')[0]}!
               </h1>
               <p className="text-secondary/60 text-sm font-bold flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-green-500"></span>
                 Ready for your next learning session?
               </p>
            </div>
         </div>
         <Link href="/dashboard/student/tutors" className="px-8 py-3 bg-secondary text-white font-black rounded-2xl hover:bg-secondary/90 transition-all shadow-lg active:scale-95">
            Find New Expert
         </Link>
      </div>

      <div data-tour="student-progress">
        <StudentProgressStats bookings={bookings} />
      </div>

      <div data-tour="student-homework">
        <HomeworkFeed assignments={assignments} />
      </div>

      {/* SECURE PAYMENT REQUIRED (Accepted Handshake) */}
      {toPay.length > 0 && (
        <section className="bg-primary/5 rounded-[2.5rem] p-8 border-2 border-primary/20 shadow-xl shadow-primary/5">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-secondary flex items-center gap-4">
              <span className="p-2 bg-primary text-white rounded-xl">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                 </svg>
              </span>
              Secure Payment Required
            </h2>
            <span className="text-xs font-black text-primary uppercase tracking-[0.2em] animate-pulse">Accepted by Tutor</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {groupedToPay.map(group => {
                const booking = group.mainBooking;
                return (
                <div key={group.id} className="bg-white p-8 rounded-[2rem] border border-primary/10 shadow-lg flex flex-col relative overflow-hidden group">
                   <div className="flex items-center gap-5 mb-6">
                      <div className="w-16 h-16 relative rounded-2xl overflow-hidden border-2 border-slate-50 shadow-md">
                         <Image src={booking.tutor_avatar || "/tutor_placeholder.webp"} alt="" fill className="object-cover" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-lg uppercase tracking-widest">{booking.subject}</span>
                          {group.isGroup && (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-[9px] font-black uppercase tracking-widest rounded">{group.count}-Week Series</span>
                          )}
                        </div>
                        <h3 className="font-black text-secondary text-lg">{booking.tutor_name}</h3>
                      </div>
                   </div>
                   
                   <div className="mt-auto border-t border-secondary/5 pt-6 flex flex-col gap-3">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-secondary/30">
                         <span className="flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
                            {group.isGroup ? `Starts ${new Date(booking.requested_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : new Date(booking.requested_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                         </span>
                         <div className="text-right">
                           <div className="text-secondary font-black text-xs">£{booking.price_at_booking * group.count} Total</div>
                           {group.isGroup && <div className="text-[8px] opacity-50">£{booking.price_at_booking} × {group.count} sessions</div>}
                         </div>
                      </div>
                      
                      <CheckoutButton bookingId={booking.id} />
                   </div>
                </div>
             )})}
          </div>
        </section>
      )}

      {requested.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-secondary flex items-center gap-3">
              Booking Requests
            </h2>
            <span className="text-xs font-black text-secondary/40 uppercase tracking-widest">Awaiting Tutor Acceptance</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {groupedRequested.map(group => {
                const booking = group.mainBooking;
                return (
                <div key={group.id} className="bg-white p-6 rounded-3xl border border-secondary/10 shadow-sm flex flex-col relative overflow-hidden group">
                   <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 relative rounded-xl overflow-hidden border border-secondary/5 shadow-sm">
                           <Image src={booking.tutor_avatar || "/tutor_placeholder.webp"} alt="" fill className="object-cover" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="inline-block px-2 py-0.5 bg-secondary/5 text-secondary/40 text-[9px] font-black rounded-md uppercase tracking-wider">{booking.subject}</span>
                            {group.isGroup && (
                              <span className="px-1.5 py-0.5 bg-yellow-50 text-yellow-600 text-[8px] font-black uppercase tracking-widest rounded">{group.count} Weeks</span>
                            )}
                          </div>
                          <h3 className="font-bold text-secondary text-sm">{booking.tutor_name}</h3>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-orange-400 flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-full">
                        Pending
                      </span>
                   </div>
                   
                   <p className="text-secondary/40 text-[11px] italic line-clamp-2 mb-4">
                      "{booking.description}"
                   </p>

                   <div className="mt-auto border-t border-secondary/5 pt-4 flex flex-col gap-2">
                     <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-secondary/30">
                        <span className="flex items-center gap-1.5 font-black">
                           <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
                           {group.isGroup ? `Starts ${new Date(booking.requested_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : new Date(booking.requested_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </span>
                        <span>£{booking.price_at_booking}/hr</span>
                     </div>
                   </div>
                </div>
             )})}
          </div>
        </section>
      )}

      <section data-tour="student-sessions">
        <div className="flex items-center justify-between mb-6">
           <h2 className="text-xl font-black text-secondary">Confirmed Sessions</h2>
           <a href={`/api/calendar?id=${user.id}`} target="_blank" className="px-4 py-2 bg-slate-100 text-secondary/60 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
              Sync iCal
           </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {upcoming.map(booking => (
              <div key={booking.id} className="bg-white p-6 rounded-3xl border border-secondary/10 shadow-sm flex flex-col relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
                 
                 <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 relative rounded-xl overflow-hidden border-2 border-white shadow-xl">
                         <Image src={booking.tutor_avatar || "/tutor_placeholder.webp"} alt={booking.tutor_name || "Tutor"} fill className="object-cover" />
                      </div>
                      <div>
                        <span className="inline-block px-2.5 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded-lg mb-1 uppercase tracking-wider">{booking.subject}</span>
                        <h3 className="font-black text-secondary text-lg">{booking.tutor_name}</h3>
                      </div>
                    </div>
                 </div>
                 
                 <div className="flex items-center gap-2 font-black mb-6">
                    <div className="p-2 bg-slate-50 border border-secondary/5 rounded-xl flex items-center gap-3 text-secondary text-xs uppercase tracking-tight">
                       <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
                       {new Date(booking.requested_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </div>
                 </div>

                 <div className="mt-auto">
                    <a href={booking.meeting_url || "#"} target="_blank" rel="noreferrer" className="block text-center w-full py-4 bg-secondary text-white rounded-2xl font-black hover:bg-secondary/90 transition-all shadow-xl hover:-translate-y-1">
                       Join Zoom Classroom
                    </a>
                 </div>
              </div>
           ))}
           {upcoming.length === 0 && (
              <div className="md:col-span-2 p-12 text-center bg-slate-50 border border-dashed border-secondary/20 rounded-3xl">
                 <p className="text-secondary/40 font-bold">No upcoming sessions. Book an expert to get started!</p>
              </div>
           )}
        </div>
      </section>

      <section data-tour="student-history">
        <h2 className="text-xl font-black text-secondary mb-6">Lesson History</h2>
        <LessonHistoryTable bookings={past} />
      </section>

      {/* AVAILABLE EXPERTS (Directory integrated into dashboard) */}
      <section data-tour="student-tutors" className="pt-8 border-t border-secondary/10">
        <div className="flex items-center justify-between mb-8">
           <div>
              <h2 className="text-2xl font-black text-secondary">Discover New Experts</h2>
              <p className="text-sm text-secondary/60 font-bold mt-1">Connect with verified tutors and schedule your next session.</p>
           </div>
           <Link href="/dashboard/student/tutors" className="text-sm font-black text-primary hover:underline flex items-center gap-1">
              View All <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
           </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {availableTutors.slice(0, 6).map((tutor) => (
             <TutorCard key={tutor.id} tutor={tutor as any} currentUserRole="student" />
           ))}
        </div>
      </section>
    </div>
  );
}

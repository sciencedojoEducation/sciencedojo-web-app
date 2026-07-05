import { getBookingsByUserId, getTutors } from "@/lib/supabase-queries";
import { getActiveAnnouncementsForUser } from "@/lib/announcement-queries";
import { getActivePlatformAnnouncementsForUser } from "@/lib/platform-announcements";
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
import FeatureUnavailable from "@/components/FeatureUnavailable";
import { isFeatureEnabled } from "@/lib/feature-flags";

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

  const studentDashboardEnabled = await isFeatureEnabled("student_dashboard_enabled");
  if (!studentDashboardEnabled) {
    return (
      <FeatureUnavailable
        eyebrow="Dashboard preparing"
        title="Your dashboard is being prepared."
        message="Your student dashboard is being prepared. Please contact ScienceDojo support if you need help."
        ctaHref="/dashboard/support"
        ctaLabel="Contact support"
      />
    );
  }

  const meta = user?.user_metadata;
  
  const [
    { data: profile },
    bookings,
    availableTutors,
    announcements,
    platformAnnouncements,
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
    getActivePlatformAnnouncementsForUser(),
    getHomeworkForStudent(user.id),
  ]);
  const { data: missionMomentum } = await supabase
    .from("student_missions")
    .select("id, status, mission_tier, score_percentage, created_at, mission_blueprint, classes(display_name, subject)")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false })
    .limit(3);

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
    <div className="mx-auto max-w-5xl space-y-5 px-3.5 py-4 sm:px-4 sm:py-5 md:space-y-12 md:p-8">
      {/* Platform Announcements Hub */}
      {(announcements.length > 0 || platformAnnouncements.length > 0) && (
         <AnnouncementFeed announcements={announcements} platformAnnouncements={platformAnnouncements} />
      )}

      <div data-tour="student-welcome" className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-4">
         <div className="flex items-center gap-3 sm:gap-5 md:gap-6">
            <div className="flex h-12 w-12 -rotate-3 transform items-center justify-center overflow-hidden rounded-2xl border-2 border-white bg-primary/10 shadow-md transition-transform hover:rotate-0 sm:h-16 sm:w-16 sm:rounded-[1.35rem] md:h-20 md:w-20 md:rounded-[1.5rem] md:border-4 md:shadow-xl">
               {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                  <span className="text-xl font-black text-primary sm:text-2xl md:text-3xl">{userName.charAt(0)}</span>
               )}
            </div>
            <div>
               <h1 className="mb-0.5 bg-gradient-to-r from-secondary to-primary bg-clip-text text-2xl font-black tracking-tight text-transparent sm:text-3xl md:mb-1 md:text-4xl">
                  Hello, {userName.trim().split(' ')[0]}!
               </h1>
               <p className="flex items-center gap-2 text-sm font-bold text-secondary/60">
                 <span className="w-2 h-2 rounded-full bg-green-500"></span>
                 Ready for your next learning session?
               </p>
            </div>
         </div>
         <Link href="/dashboard/student/tutors" className="min-h-11 w-full rounded-2xl bg-secondary px-5 py-2.5 text-center text-sm font-black text-white shadow-md transition-all hover:bg-secondary/90 active:scale-95 md:w-auto md:px-8 md:py-3 md:text-base md:shadow-lg">
            Find tutor support
         </Link>
      </div>

      <div data-tour="student-progress">
        <StudentProgressStats bookings={bookings} mobileDensity="compact" />
      </div>

      <section className="rounded-[1.5rem] border border-primary/10 bg-white p-3.5 shadow-sm sm:p-4 md:rounded-[2.5rem] md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary/65">Personalized Missions</p>
            <h2 className="mt-2 text-xl font-black text-secondary md:text-2xl">Your next steps between lessons</h2>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-secondary/55 md:mt-3 md:leading-7">
              Missions turn lesson notes and class progress into guided reinforcement, so you always know what to practise next.
            </p>
          </div>
          <Link href="/dashboard/student/missions" className="min-h-11 rounded-2xl bg-secondary px-5 py-2.5 text-center text-xs font-black uppercase tracking-[0.14em] text-white transition-colors hover:bg-secondary/90 md:px-6 md:py-3">
            Open Missions
          </Link>
        </div>

        {missionMomentum && missionMomentum.length > 0 ? (
          <div className="mt-4 grid gap-2.5 md:mt-6 md:grid-cols-3 md:gap-4">
            {missionMomentum.map((mission: any) => (
              <div key={mission.id} className="rounded-2xl border border-secondary/10 bg-surface p-3.5 md:rounded-3xl md:p-5">
                <div className="mb-2.5 flex flex-wrap gap-2 md:mb-3">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-primary">
                  {String(mission.mission_tier || "mission").replace(/_/g, " ")}
                  </span>
                  <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-secondary/45">
                    {mission.status === "completed" ? "Completed" : mission.status === "pending_tutor_approval" ? "Tutor review" : "Ready"}
                  </span>
                </div>
                <h3 className="font-black text-secondary">{mission.mission_blueprint?.topic || "Guided practice pathway"}</h3>
                <p className="mt-1.5 text-sm font-medium leading-5 text-secondary/50 md:mt-2 md:leading-6">
                  {mission.classes?.display_name || "Class-linked support"} {mission.score_percentage !== null ? "- tutor review ready" : ""}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-secondary/15 bg-surface p-4 md:mt-6 md:rounded-3xl md:p-7">
            <p className="font-bold text-secondary/55">Your learning journey begins here.</p>
            <p className="mt-2 text-sm text-secondary/45">After your first sessions, personalized Missions will show what to practise next and why it matters.</p>
          </div>
        )}
      </section>

      <div data-tour="student-homework">
        <HomeworkFeed assignments={assignments} mobileDensity="compact" />
      </div>

      {/* SECURE PAYMENT REQUIRED (Accepted Handshake) */}
      {toPay.length > 0 && (
        <section className="rounded-[1.5rem] border border-primary/20 bg-primary/5 p-3.5 shadow-sm md:rounded-[2.5rem] md:border-2 md:p-8 md:shadow-xl md:shadow-primary/5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:mb-8">
            <h2 className="flex items-center gap-3 text-xl font-black text-secondary md:gap-4 md:text-2xl">
              <span className="rounded-xl bg-primary p-1.5 text-white md:p-2">
                 <svg className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                 </svg>
              </span>
              Secure payment required
            </h2>
            <span className="text-xs font-black text-primary uppercase tracking-[0.2em] animate-pulse">Accepted by Tutor</span>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-8">
             {groupedToPay.map(group => {
                const booking = group.mainBooking;
                return (
                <div key={group.id} className="group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-primary/10 bg-white p-3.5 shadow-sm md:rounded-[2rem] md:p-8 md:shadow-lg">
                   <div className="mb-4 flex items-center gap-3 md:mb-6 md:gap-5">
                      <div className="relative h-12 w-12 overflow-hidden rounded-2xl border-2 border-slate-50 shadow-md md:h-16 md:w-16">
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
                   
                   <div className="mt-auto flex flex-col gap-3 border-t border-secondary/5 pt-4 md:pt-6">
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
          <div className="mb-4 flex items-center justify-between md:mb-6">
            <h2 className="text-xl font-black text-secondary flex items-center gap-3">
              Lesson requests
            </h2>
            <span className="text-xs font-black text-secondary/40 uppercase tracking-widest">Awaiting tutor confirmation</span>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-6">
             {groupedRequested.map(group => {
                const booking = group.mainBooking;
                return (
                <div key={group.id} className="group relative flex flex-col overflow-hidden rounded-2xl border border-secondary/10 bg-white p-3.5 shadow-sm md:rounded-3xl md:p-6">
                   <div className="mb-3 flex items-start justify-between md:mb-4">
                      <div className="flex items-center gap-3 md:gap-4">
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
                   
                   <p className="mb-3 line-clamp-2 text-[11px] italic text-secondary/40 md:mb-4">
                      "{booking.description}"
                   </p>

                   <div className="mt-auto flex flex-col gap-2 border-t border-secondary/5 pt-3 md:pt-4">
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
        <div className="mb-4 flex items-center justify-between gap-3 md:mb-6">
           <h2 className="text-xl font-black text-secondary">Upcoming lessons</h2>
           <a href={`/api/calendar?id=${user.id}`} target="_blank" className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-secondary/60 transition-all hover:bg-slate-200 md:gap-2 md:px-4 md:text-xs md:tracking-widest">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
              Sync iCal
           </a>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-6">
           {upcoming.map(booking => (
              <div key={booking.id} className="group relative flex flex-col overflow-hidden rounded-2xl border border-secondary/10 bg-white p-3.5 shadow-sm md:rounded-3xl md:p-6">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
                 
                 <div className="mb-3 flex items-start justify-between md:mb-4">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="relative h-12 w-12 overflow-hidden rounded-xl border-2 border-white shadow-md md:h-14 md:w-14 md:shadow-xl">
                         <Image src={booking.tutor_avatar || "/tutor_placeholder.webp"} alt={booking.tutor_name || "Tutor"} fill className="object-cover" />
                      </div>
                      <div>
                        <span className="inline-block px-2.5 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded-lg mb-1 uppercase tracking-wider">{booking.subject}</span>
                        <h3 className="font-black text-secondary text-lg">{booking.tutor_name}</h3>
                      </div>
                    </div>
                 </div>
                 
                 <div className="mb-4 flex items-center gap-2 font-black md:mb-6">
                    <div className="flex items-center gap-2 rounded-xl border border-secondary/5 bg-slate-50 p-2 text-xs uppercase tracking-tight text-secondary md:gap-3">
                       <svg className="h-4 w-4 text-primary md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
                       {new Date(booking.requested_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </div>
                 </div>

                 <div className="mt-auto">
                    <a href={booking.meeting_url || "#"} target="_blank" rel="noreferrer" className="block min-h-11 w-full rounded-2xl bg-secondary px-4 py-3 text-center font-black text-white shadow-md transition-all hover:-translate-y-1 hover:bg-secondary/90 md:py-4 md:shadow-xl">
                       Join classroom
                    </a>
                 </div>
              </div>
           ))}
           {upcoming.length === 0 && (
              <div className="rounded-2xl border border-dashed border-secondary/20 bg-slate-50 p-4 text-center md:col-span-2 md:rounded-3xl md:p-12">
                 <p className="text-secondary/45 font-bold">Practice and lesson support will appear here once your next session is scheduled.</p>
              </div>
           )}
        </div>
      </section>

      <section data-tour="student-history">
        <h2 className="mb-4 text-xl font-black text-secondary md:mb-6">Lesson History</h2>
        <LessonHistoryTable bookings={past} />
      </section>

      {/* AVAILABLE EXPERTS (Directory integrated into dashboard) */}
      <section data-tour="student-tutors" className="border-t border-secondary/10 pt-5 md:pt-8">
        <div className="mb-4 flex flex-col gap-3 md:mb-8 md:flex-row md:items-center md:justify-between md:gap-4">
           <div>
              <h2 className="text-xl font-black text-secondary md:text-2xl">Find tutor support</h2>
              <p className="text-sm text-secondary/60 font-bold mt-1">Get help with difficult topics and your next learning step through guided STEM support.</p>
           </div>
           <Link href="/dashboard/student/tutors" className="text-sm font-black text-primary hover:underline flex items-center gap-1">
              View support options <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
           </Link>
        </div>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
           {availableTutors.slice(0, 6).map((tutor) => (
             <TutorCard key={tutor.id} tutor={tutor as any} currentUserRole="student" variant="dashboard" />
           ))}
        </div>
      </section>
    </div>
  );
}

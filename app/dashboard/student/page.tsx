import { getBookingsByUserId } from "@/lib/supabase-queries";
import { getActiveAnnouncementsForUser } from "@/lib/announcement-queries";
import { getActivePlatformAnnouncementsForUser } from "@/lib/platform-announcements";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";
import CheckoutButton from "@/components/CheckoutButton";
import LessonHistoryTable from "@/components/LessonHistoryTable";
import StudentProgressChart from "@/components/StudentProgressChart";
import StudentHomeOverview, { type StudentHomeAction, type StudentPlanItem } from "@/components/StudentHomeOverview";
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

  const [
    bookings,
    announcements,
    platformAnnouncements,
    assignments,
  ] = await Promise.all([
    getBookingsByUserId(user.id),
    getActiveAnnouncementsForUser(),
    getActivePlatformAnnouncementsForUser(),
    getHomeworkForStudent(user.id),
  ]);
  const { data: readyMissionRows, count: readyMissionCount } = await supabase
    .from("student_missions")
    .select("id, status, mission_tier, score_percentage, created_at, mission_blueprint, classes(display_name, subject)", { count: "exact" })
    .eq("student_id", user.id)
    .eq("status", "pending_assessment")
    .order("created_at", { ascending: false })
    .limit(1)
    .returns<Array<{
      id: string;
      mission_blueprint: { topic?: string } | null;
      classes: { display_name: string; subject: string } | { display_name: string; subject: string }[] | null;
    }>>();

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
  const nextLesson = [...upcoming].sort((a, b) => new Date(a.requested_date).getTime() - new Date(b.requested_date).getTime())[0];
  const readyMission = readyMissionRows?.[0];
  const readyMissionClass = Array.isArray(readyMission?.classes) ? readyMission.classes[0] : readyMission?.classes;
  const nextAssignment = assignments[0];
  const learningHours = past.reduce((sum, booking) => sum + (booking.duration_hours || 1), 0);
  const subjects = Object.entries(past.reduce((counts, booking) => {
    const subject = booking.subject || "General";
    counts[subject] = (counts[subject] || 0) + 1;
    return counts;
  }, {} as Record<string, number>))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, lessons]) => ({ name, lessons }));

  let action: StudentHomeAction;
  if (toPay.length > 0) {
    action = {
      sectionLabel: "Your next step",
      eyebrow: "Ready to confirm",
      title: "Confirm your next lesson",
      description: `${toPay.length} accepted lesson${toPay.length === 1 ? " is" : "s are"} waiting for payment confirmation.`,
      href: "#student-payment",
      label: "Review payment",
      detail: "Your tutor has accepted the request",
    };
  } else if (readyMission) {
    action = {
      eyebrow: readyMissionClass?.subject || "Guided practice",
      title: readyMission.mission_blueprint?.topic || "Your next Mission",
      description: "Pick up a tutor-guided Mission and practise at your own pace.",
      href: "/dashboard/student/missions",
      label: "Start practice",
      detail: readyMissionClass?.display_name || "Ready when you are",
    };
  } else if (nextAssignment) {
    action = {
      eyebrow: nextAssignment.class_display_name || "Tutor practice",
      title: "Practice from your tutor",
      description: nextAssignment.content,
      href: `/dashboard/classes/${nextAssignment.class_id}`,
      label: "Open class",
      detail: nextAssignment.due_date ? "Due date in class details" : "Set by your tutor",
    };
  } else if (nextLesson) {
    action = {
      eyebrow: nextLesson.subject,
      title: "Your next lesson is coming up",
      description: `Prepare for your session with ${nextLesson.tutor_name || "your tutor"}.`,
      href: "#student-sessions",
      label: "View lesson",
      detail: "Your session details are below",
    };
  } else {
    action = {
      eyebrow: "Your learning journey",
      title: "Choose your next step",
      description: "Explore guided practice or find a tutor when you want support with a topic.",
      href: "/dashboard/student/missions",
      label: "Explore Missions",
      detail: "Begin at your own pace",
    };
  }

  const plan: StudentPlanItem[] = [
    ...(toPay.length > 0 ? [{ title: "Confirm your lesson", detail: "Accepted by your tutor", href: "#student-payment" }] : []),
    ...(readyMission ? [{ title: readyMission.mission_blueprint?.topic || "Start a Mission", detail: "Guided practice is ready", href: "/dashboard/student/missions" }] : []),
    ...(nextAssignment ? [{ title: "Review tutor practice", detail: nextAssignment.class_display_name || "From your class", href: `/dashboard/classes/${nextAssignment.class_id}` }] : []),
    ...(nextLesson ? [{ title: "Prepare for your next lesson", detail: nextLesson.subject, href: "#student-sessions" }] : []),
  ].slice(0, 3);
  if (plan.length === 0) {
    plan.push({ title: "Explore a Mission", detail: "Practise at your own pace", href: "/dashboard/student/missions" });
    plan.push({ title: "Find tutor support", detail: "Get help with a topic", href: "/dashboard/student/tutors" });
  }

  return (
    <div data-role="student" className="student-dashboard-home dashboard-home mx-auto max-w-6xl space-y-5 px-3.5 py-4 sm:px-6 sm:py-6 md:px-8 md:pb-12 md:pt-7">
      {(announcements.length > 0 || platformAnnouncements.length > 0) && (
        <AnnouncementFeed announcements={announcements} platformAnnouncements={platformAnnouncements} />
      )}

      <StudentHomeOverview
        action={action}
        plan={plan}
        completedLessons={past.length}
        learningHours={learningHours}
        readyMissions={readyMissionCount || 0}
        subjects={subjects}
      />

      {assignments.length > 0 && (
        <section data-tour="student-homework" aria-labelledby="student-practice-title" className="rounded-[1.4rem] border border-[var(--student-line)] bg-[var(--student-surface)] p-5 sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-[var(--student-accent)]">From your tutor</p>
              <h2 id="student-practice-title" className="mt-1 text-xl font-semibold tracking-tight text-[var(--student-ink)]">Practice between lessons</h2>
            </div>
            <Link href="/dashboard/classes" className="text-sm font-medium text-[var(--student-accent)] hover:text-[var(--student-accent-hover)]">Open classes →</Link>
          </div>
          <div className="mt-5 divide-y divide-[var(--student-line)]">
            {assignments.slice(0, 3).map((assignment) => (
              <Link key={assignment.id} href={`/dashboard/classes/${assignment.class_id}`} className="group flex min-h-16 items-center justify-between gap-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--student-accent)]">
                <span className="min-w-0">
                  <span className="block text-xs text-[#a25b38]">{assignment.class_display_name || "Your class"}</span>
                  <span className="mt-1 block truncate text-sm font-medium text-[var(--student-ink-soft)] group-hover:text-[var(--student-accent-hover)]">{assignment.content}</span>
                </span>
                <span className="shrink-0 text-xs text-[var(--student-muted)]">{assignment.due_date ? `Due ${new Date(assignment.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : "View task"}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* SECURE PAYMENT REQUIRED (Accepted Handshake) */}
      {toPay.length > 0 && (
        <section id="student-payment" className="scroll-mt-5 rounded-[1.4rem] border border-[var(--student-line)] bg-[var(--student-surface)] p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-[var(--student-ink)] sm:text-xl">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--student-accent-soft)] text-[var(--student-accent)]">
                <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </span>
              Secure payment required
            </h2>
            <span className="rounded-full bg-[var(--student-accent-soft)] px-3 py-1 text-xs font-medium text-[var(--student-accent)]">Accepted by tutor</span>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
             {groupedToPay.map(group => {
                const booking = group.mainBooking;
                return (
                <div key={group.id} className="flex flex-col rounded-xl border border-[var(--student-line)] bg-[var(--student-surface)] p-4 sm:p-5">
                   <div className="flex items-center gap-3">
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                         <Image src={booking.tutor_avatar || "/tutor_placeholder.webp"} alt="" fill className="object-cover" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-[var(--student-ink)] sm:text-base">{booking.tutor_name || "Your tutor"}</h3>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span className="rounded-md bg-[var(--student-accent-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--student-accent)]">{booking.subject}</span>
                          <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${booking.lesson_mode === "physical" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                            {booking.lesson_mode === "physical" ? "In-person" : "Online"}
                          </span>
                          {group.isGroup && (
                            <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">{group.count}-week series</span>
                          )}
                        </div>
                      </div>
                   </div>
                   
                   <div className="mt-4 flex flex-col gap-3 border-t border-[var(--student-line)] pt-3">
                      <div className="flex flex-wrap items-start justify-between gap-2 text-xs text-[var(--student-muted)]">
                         <span className="flex items-center gap-1.5">
                            <svg className="h-4 w-4 text-[var(--student-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
                            {group.isGroup ? `Starts ${new Date(booking.requested_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : new Date(booking.requested_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                         </span>
                         <div className="text-right">
                          <div className="text-sm font-semibold text-[var(--student-ink)]">£{booking.price_at_booking * group.count} total</div>
                          {group.isGroup && <div className="text-[11px] text-[var(--student-muted-soft)]">£{booking.price_at_booking} × {group.count} sessions</div>}
                         </div>
                      </div>
                      {booking.lesson_mode === "physical" && (
                        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-900">
                          {booking.location_details || "In-person location pending"}
                        </p>
                      )}
                      
                      <CheckoutButton
                        bookingId={booking.id}
                        paymentStatus={booking.payment_status}
                        variant="compact"
                      />
                   </div>
                </div>
             )})}
          </div>
        </section>
      )}

      {requested.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between md:mb-6">
            <h2 className="flex items-center gap-3 text-xl font-semibold text-[var(--student-ink)]">
              Lesson requests
            </h2>
            <span className="text-xs font-medium text-[var(--student-muted)]">Awaiting tutor confirmation</span>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-6">
             {groupedRequested.map(group => {
                const booking = group.mainBooking;
                return (
                <div key={group.id} className="relative flex flex-col overflow-hidden rounded-xl border border-[var(--student-line)] bg-[var(--student-surface)] p-4 md:p-6">
                   <div className="mb-3 flex items-start justify-between md:mb-4">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-10 h-10 relative rounded-xl overflow-hidden border border-secondary/5 shadow-sm">
                           <Image src={booking.tutor_avatar || "/tutor_placeholder.webp"} alt="" fill className="object-cover" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="inline-block rounded-md bg-[var(--student-accent-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--student-accent)]">{booking.subject}</span>
                            <span className={`px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest rounded ${booking.lesson_mode === "physical" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                              {booking.lesson_mode === "physical" ? "In-person" : "Online"}
                            </span>
                            {group.isGroup && (
                              <span className="px-1.5 py-0.5 bg-yellow-50 text-yellow-600 text-[8px] font-black uppercase tracking-widest rounded">{group.count} Weeks</span>
                            )}
                          </div>
                          <h3 className="text-sm font-semibold text-[var(--student-ink)]">{booking.tutor_name}</h3>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-orange-400 flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-full">
                        Pending
                      </span>
                   </div>
                   
                   <p className="mb-3 line-clamp-2 text-xs italic text-[var(--student-muted)] md:mb-4">
                      &ldquo;{booking.description}&rdquo;
                   </p>

                   <div className="mt-auto flex flex-col gap-2 border-t border-secondary/5 pt-3 md:pt-4">
                     <div className="flex items-center justify-between text-xs text-[var(--student-muted)]">
                        <span className="flex items-center gap-1.5">
                           <svg className="h-4 w-4 text-[var(--student-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
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

      <section id="student-sessions" data-tour="student-sessions" className="scroll-mt-5">
        <div className="mb-4 flex items-center justify-between gap-3 md:mb-6">
           <h2 className="text-xl font-semibold text-[var(--student-ink)]">Upcoming lessons</h2>
           <a href={`/api/calendar?id=${user.id}`} target="_blank" className="flex items-center gap-1.5 rounded-xl bg-[var(--student-surface-soft)] px-3 py-2 text-xs font-medium text-[var(--student-muted)] transition-colors hover:text-[var(--student-accent)] md:gap-2 md:px-4">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
              Sync iCal
           </a>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-6">
           {upcoming.map(booking => (
              <div key={booking.id} className="relative flex flex-col overflow-hidden rounded-xl border border-[var(--student-line)] bg-[var(--student-surface)] p-4 md:p-6">
                 
                 <div className="mb-3 flex items-start justify-between md:mb-4">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="relative h-12 w-12 overflow-hidden rounded-xl border-2 border-white shadow-md md:h-14 md:w-14 md:shadow-xl">
                         <Image src={booking.tutor_avatar || "/tutor_placeholder.webp"} alt={booking.tutor_name || "Tutor"} fill className="object-cover" />
                      </div>
                      <div>
                        <span className="mb-1 inline-block rounded-lg bg-[var(--student-accent-soft)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--student-accent)]">{booking.subject}</span>
                        <span className={`ml-2 inline-block rounded-lg px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${booking.lesson_mode === "physical" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                          {booking.lesson_mode === "physical" ? "In-person" : "Online"}
                        </span>
                        <h3 className="text-lg font-semibold text-[var(--student-ink)]">{booking.tutor_name}</h3>
                      </div>
                    </div>
                 </div>
                 
                 <div className="mb-4 flex items-center gap-2 md:mb-6">
                    <div className="flex items-center gap-2 rounded-xl border border-[var(--student-line)] bg-[var(--student-surface-soft)] p-2 text-xs text-[var(--student-ink-soft)] md:gap-3">
                       <svg className="h-4 w-4 text-[var(--student-accent)] md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
                       {new Date(booking.requested_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </div>
                 </div>

                 {booking.lesson_mode === "physical" && (
                   <div className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-xs font-bold leading-5 text-emerald-900">
                     <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">Location</p>
                     <p className="mt-1">{booking.location_details || "Physical class location pending"}</p>
                     {booking.arrival_notes && <p className="mt-1 text-emerald-800/75">{booking.arrival_notes}</p>}
                   </div>
                 )}

                 <div className="mt-auto">
                    {booking.lesson_mode === "physical" ? (
                      <div className="block min-h-11 w-full rounded-2xl bg-emerald-600 px-4 py-3 text-center font-black text-white shadow-md md:py-4">
                         Attend in person
                      </div>
                    ) : (
                      <a href={booking.meeting_url || "#"} target="_blank" rel="noreferrer" className="block min-h-11 w-full rounded-xl bg-[var(--student-accent)] px-4 py-3 text-center font-semibold text-[var(--student-accent-contrast)] transition-colors hover:bg-[var(--student-accent-hover)] md:py-4">
                         Join classroom
                      </a>
                    )}
                 </div>
              </div>
           ))}
           {upcoming.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[var(--student-line)] bg-[var(--student-surface)] p-4 text-center md:col-span-2 md:rounded-3xl md:p-12">
                 <p className="text-sm text-[var(--student-muted)]">Practice and lesson support will appear here once your next session is scheduled.</p>
              </div>
           )}
        </div>
      </section>

      {past.length > 0 && (
        <section aria-labelledby="student-trends-title" className="pt-2">
          <div className="px-1">
            <p className="text-xs font-medium text-[var(--student-accent)]">Learning over time</p>
            <h2 id="student-trends-title" className="mt-1 text-xl font-semibold tracking-tight text-[var(--student-ink)]">Your progress</h2>
          </div>
          <StudentProgressChart bookings={bookings} appearance="student" />
        </section>
      )}

      <section data-tour="student-history">
        <h2 className="mb-4 text-xl font-semibold tracking-tight text-[var(--student-ink)]">Lesson history</h2>
        <LessonHistoryTable bookings={past} appearance="student" />
      </section>

      <section data-tour="student-tutors" className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--student-line)] px-1 pt-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-[var(--student-ink)]">Need a little help?</h2>
          <p className="mt-1 text-sm text-[var(--student-muted)]">Find a tutor when you want support with a topic.</p>
        </div>
        <Link href="/dashboard/student/tutors" className="inline-flex min-h-10 items-center text-sm font-medium text-[var(--student-accent)] hover:text-[var(--student-accent-hover)]">Browse tutors →</Link>
      </section>
    </div>
  );
}

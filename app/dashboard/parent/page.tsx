import { getBookingsByUserId, type Booking } from "@/lib/supabase-queries";
import { getActiveAnnouncementsForUser } from "@/lib/announcement-queries";
import { getActivePlatformAnnouncementsForUser } from "@/lib/platform-announcements";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import CheckoutButton from "@/components/CheckoutButton";
import LessonHistoryTable from "@/components/LessonHistoryTable";
import StudentProgressChart from "@/components/StudentProgressChart";
import AnnouncementFeed from "@/components/AnnouncementFeed";
import { HomeListRow, HomeMetricStrip, HomePrimaryAction, HomeSectionHeading } from "@/components/DashboardHomeUI";
import { BookOpen, CalendarDays, GraduationCap } from "lucide-react";
import FeatureUnavailable from "@/components/FeatureUnavailable";
import { isFeatureEnabled } from "@/lib/feature-flags";

function sortByDateAsc(bookings: Booking[]) {
  return [...bookings].sort((a, b) => new Date(a.requested_date).getTime() - new Date(b.requested_date).getTime());
}

function sortByDateDesc(bookings: Booking[]) {
  return [...bookings].sort((a, b) => new Date(b.requested_date).getTime() - new Date(a.requested_date).getTime());
}

function shortText(value: string | undefined, fallback: string, limit = 150) {
  if (!value?.trim()) return fallback;
  return value.length > limit ? `${value.slice(0, limit).trim()}...` : value;
}

type SupportTeamMember = {
  id: string;
  name: string;
  subject?: string;
  avatar?: string;
};

type ParentLearnerContext = {
  parentId: string;
  learnerId: string;
  studentName: string;
  mode: "parent_owned_profile" | "self_managed_student";
};

function resolveParentLearnerContext({
  userId,
  userName,
  profileStudentName,
  meta,
}: {
  userId: string;
  userName: string;
  profileStudentName?: string | null;
  meta: { sub_role?: string; role?: string; student_name?: string };
}): ParentLearnerContext {
  const isParent = meta?.sub_role === "parent" || meta?.role === "parent";
  const childName = profileStudentName || meta?.student_name;

  return {
    parentId: userId,
    learnerId: userId,
    studentName: isParent ? childName || "your child" : userName,
    mode: isParent ? "parent_owned_profile" : "self_managed_student",
  };
}

function uniqueNonEmpty(values: Array<string | undefined | null>) {
  return Array.from(new Set(values.map((value) => value?.trim()).filter(Boolean) as string[]));
}

function formatLessonDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(value));
}

function formatNextLessonDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(new Date(value));
}

export default async function ParentDashboard() {
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

  // --- SENSEI REDIRECT GUARD ---
  // If a tutor accidentally lands on the parent dashboard, send them to the right place.
  const { data: application } = await supabase
    .from('applications')
    .select('status')
    .eq('user_id', user.id)
    .maybeSingle();

  if (application || user.user_metadata.role === 'tutor') {
    redirect("/dashboard/tutor");
  }

  const parentDashboardEnabled = await isFeatureEnabled("parent_dashboard_enabled");
  if (!parentDashboardEnabled) {
    return (
      <FeatureUnavailable
        eyebrow="Dashboard preparing"
        title="Your dashboard is being prepared."
        message="Your parent dashboard is being prepared. Please contact ScienceDojo support if you need help."
        ctaHref="/dashboard/support"
        ctaLabel="Contact support"
      />
    );
  }

  const meta = user?.user_metadata;
  
  // Fetch fresh profile data to avoid stale Auth metadata
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, student_name")
    .eq("id", user.id)
    .single();

  const userName = profile?.full_name || meta?.full_name || "User";
  const learnerContext = resolveParentLearnerContext({
    userId: user.id,
    userName,
    profileStudentName: profile?.student_name,
    meta,
  });
  const studentName = learnerContext.studentName;

  const bookings = await getBookingsByUserId(learnerContext.learnerId);
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
  const recentCompleted = sortByDateDesc(past);
  const recentLessonNotes = recentCompleted.filter(booking => booking.lesson_notes?.summary).slice(0, 3);
  const nextSession = sortByDateAsc(upcoming)[0];

  const [announcements, platformAnnouncements] = await Promise.all([
    getActiveAnnouncementsForUser(),
    getActivePlatformAnnouncementsForUser(),
  ]);

  const { getHomeworkForStudent } = await import("@/lib/class-queries");
  const assignments = await getHomeworkForStudent(learnerContext.learnerId);
  const { data: missionProgress } = await supabase
    .from("student_missions")
    .select("id, status, mission_tier, score_percentage, tutor_feedback, weak_topics, created_at, completed_at, mission_blueprint, classes(display_name, subject)")
    .eq("student_id", learnerContext.learnerId)
    .order("created_at", { ascending: false })
    .limit(4);
  const missions = missionProgress ?? [];
  const latestMission = missions[0];
  const latestWeakTopic = latestMission?.weak_topics?.[0];
  const latestLesson = recentLessonNotes[0];
  const latestAssignment = assignments[0];
  const subjectsSupported = uniqueNonEmpty(bookings.map((booking) => booking.subject));
  const currentFocus =
    latestWeakTopic ||
    latestMission?.mission_blueprint?.topic ||
    latestAssignment?.class_display_name ||
    nextSession?.subject ||
    latestLesson?.subject ||
    subjectsSupported[0] ||
    "First lesson will identify the focus";
  const currentStatus = toPay.length > 0
    ? "Tutor accepted. Payment is ready to confirm"
    : nextSession
      ? `${nextSession.subject} lesson scheduled`
      : requested.length > 0
        ? "Lesson request waiting for tutor confirmation"
        : latestLesson
          ? "Learning support is underway"
          : "Ready to schedule support";
  const nextLessonSubject = nextSession?.subject?.trim();
  const nextLessonTutor = nextSession?.tutor_name?.trim();
  const nextLessonDetail = nextSession
    ? nextLessonSubject && nextLessonTutor
      ? `${nextLessonSubject} with ${nextLessonTutor}`
      : nextLessonSubject
        ? `${nextLessonSubject} lesson scheduled`
        : nextLessonTutor
          ? `Upcoming lesson with ${nextLessonTutor}`
          : "Upcoming lesson"
    : "Book a lesson to continue the learning journey.";
  const statusMeaning = toPay.length > 0
    ? "The tutor has accepted the request. Confirming payment secures the learning support."
    : nextSession
      ? `${studentName} has a guided lesson coming up on ${formatNextLessonDate(nextSession.requested_date)}${nextSession.tutor_name ? ` with ${nextSession.tutor_name}` : ""}.`
      : requested.length > 0
        ? "A tutor request has been sent. Once the tutor accepts, you can confirm the booking and continue the journey."
        : latestLesson
          ? "There is completed learning activity to review and build from."
          : "No upcoming lesson is booked yet, so the next guided step is to schedule support.";
  const supportTeam: SupportTeamMember[] = Object.values(
    bookings.reduce((acc, booking) => {
      if (!booking.tutor_id || !booking.tutor_name) return acc;
      if (!acc[booking.tutor_id]) {
        acc[booking.tutor_id] = {
          id: booking.tutor_id,
          name: booking.tutor_name,
          subject: booking.subject || undefined,
          avatar: booking.tutor_avatar || undefined,
        };
      }
      return acc;
    }, {} as Record<string, SupportTeamMember>),
  ).slice(0, 4);

  const recommendedAction = toPay.length > 0
    ? { label: "Confirm booking", href: "#parent-confirm-booked-support" }
    : !nextSession
    ? { label: "Schedule a lesson", href: "/dashboard/parent/tutors" }
    : latestAssignment
      ? { label: "Review practice tasks", href: "#parent-practice-tasks" }
      : latestMission
        ? { label: "Review learning Missions", href: "#parent-missions" }
      : { label: "Message tutor", href: "/dashboard/messages" };

  const learningPlan = [
    { title: nextSession ? "Prepare for the next lesson" : "Arrange the next lesson", detail: nextSession ? nextLessonDetail : currentStatus, href: nextSession ? "#parent-confirmed-lessons" : "/dashboard/parent/tutors" },
    { title: latestAssignment ? "Review tutor practice" : "Build practice between lessons", detail: latestAssignment ? shortText(latestAssignment.content, "Practice is ready.", 58) : "Open your class space", href: latestAssignment ? "#parent-practice-tasks" : "/dashboard/classes" },
    { title: "See learning progress", detail: currentFocus, href: "#parent-progress" },
  ];

  return (
    <div data-role="parent" className="dashboard-home mx-auto max-w-5xl space-y-6 px-3 py-5 sm:px-6 md:px-8 md:pb-12 md:pt-7">
      {(announcements.length > 0 || platformAnnouncements.length > 0) && (
        <AnnouncementFeed announcements={announcements} platformAnnouncements={platformAnnouncements} />
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,1fr)]">
        <HomePrimaryAction eyebrow="Recommended next step" title={currentStatus} description={statusMeaning} href={recommendedAction.href} label={recommendedAction.label} detail={studentName === "your child" ? "Your child's learning" : `${studentName}'s learning`} icon={<BookOpen size={23} strokeWidth={1.7} />} />
        <section className="home-surface sm:p-6" aria-label="Learning plan">
          <HomeSectionHeading eyebrow="A simple path forward" title="Your plan" />
          {learningPlan.map((item) => <HomeListRow key={item.title} {...item} />)}
        </section>
      </div>

      <HomeMetricStrip label="Learning at a glance" items={[
        { label: "Lessons completed", value: past.length, icon: <GraduationCap size={20} />, tone: "mint" },
        { label: "Upcoming", value: upcoming.length, icon: <CalendarDays size={20} />, tone: "violet" },
        { label: "Practice tasks", value: assignments.length, icon: <BookOpen size={20} />, tone: "amber" },
      ]} />

      <section id="parent-confirmed-lessons" data-tour="parent-sessions" className="home-surface scroll-mt-5 sm:p-6">
        <HomeSectionHeading eyebrow="Scheduled support" title="Upcoming lessons" href="/dashboard/classes" linkLabel="Open classes" />
        {sortByDateAsc(upcoming).slice(0, 3).map((booking) => (
          <HomeListRow key={booking.id} href="/dashboard/classes" title={`${booking.subject} with ${booking.tutor_name || "your tutor"}`} detail={formatNextLessonDate(booking.requested_date)} />
        ))}
        {upcoming.length === 0 && <p className="mt-4 text-sm text-[var(--theme-muted)]">No lessons are scheduled yet. Your next booking will appear here.</p>}
      </section>

      <section className="home-surface sm:p-6">
        <HomeSectionHeading eyebrow="People" title="Your support team" href="/dashboard/messages" linkLabel="Open messages" />
        {supportTeam.length > 0 ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {supportTeam.map((tutor) => (
              <div key={tutor.id} className="flex items-center gap-3 rounded-xl bg-[var(--theme-surface-soft)] p-3">
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--theme-accent-soft)] text-sm font-medium text-[var(--theme-accent)]">
                  {tutor.avatar ? (
                    <Image src={tutor.avatar} alt="" fill className="object-cover" />
                  ) : (
                    tutor.name.charAt(0)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--theme-ink)]">{tutor.name}</p>
                  {tutor.subject && <p className="mt-1 text-xs text-[var(--theme-muted)]">{tutor.subject} support</p>}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                  <Link href={`/tutor/${tutor.id}`} className="text-xs font-medium text-[var(--theme-accent)] hover:underline">
                    Profile
                  </Link>
                  <Link href="/dashboard/messages" className="text-xs text-[var(--theme-muted)] hover:text-[var(--theme-accent)]">
                    Message
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 border-t border-[var(--theme-line)] pt-4">
            <p className="text-sm leading-6 text-[var(--theme-muted)]">
              Your support team will appear here once a tutor is connected to a lesson. Until then, you can browse verified tutor support for the right subject and learning fit.
            </p>
            <Link href="/dashboard/parent/tutors" className="home-text-link mt-2">
              Browse tutors →
            </Link>
          </div>
        )}
      </section>

      <section className="home-surface sm:p-6" aria-label="Recent learning">
        <HomeSectionHeading eyebrow="Recent learning" title="What has happened" description="A concise view of lessons, feedback, and practice." />
        <div className="grid gap-x-6 md:grid-cols-2">
          <HomeListRow href="#parent-history" title={latestLesson ? `${latestLesson.subject} lesson` : "Lessons will appear here"} detail={latestLesson ? `Completed ${formatLessonDate(latestLesson.requested_date)}${latestLesson.tutor_name ? ` with ${latestLesson.tutor_name}` : ""}` : "Schedule a lesson to begin"} />
          <HomeListRow href="#parent-history" title="Latest tutor feedback" detail={shortText(latestLesson?.lesson_notes?.summary, "Feedback will appear after a completed lesson.", 90)} />
          <HomeListRow href="#parent-practice-tasks" title={latestAssignment ? "Practice task ready" : "Practice between lessons"} detail={shortText(latestAssignment?.content, "Tutor-guided practice will appear here.", 90)} />
          <HomeListRow href="#parent-progress" title="Current focus" detail={currentFocus} />
        </div>
      </section>

      <section id="parent-progress" data-tour="parent-progress" className="parent-calm-progress scroll-mt-5">
        <HomeSectionHeading eyebrow="Learning over time" title="Your child's progress" description={`Current focus: ${currentFocus}`} />
        <StudentProgressChart bookings={bookings} appearance="student" />
        {past.length === 0 && <div className="home-surface text-sm text-[var(--theme-muted)]">Progress charts will appear after completed lessons.</div>}
      </section>

      <section id="parent-missions" className="home-surface scroll-mt-5 sm:p-6">
        <HomeSectionHeading eyebrow="Between lessons" title="Missions and practice" description="Tutor-guided work that keeps the next step clear." href="/dashboard/classes" linkLabel="Open classes" />
        {missions.length > 0 ? missions.map((mission) => (
          <div key={mission.id} className="border-t border-[var(--theme-line)] py-3">
            <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-medium text-[var(--theme-ink)]">{mission.mission_blueprint?.topic || "Guided practice pathway"}</h3><span className="text-xs text-[var(--theme-muted)]">{mission.status === "completed" ? "Completed" : mission.status === "pending_tutor_approval" ? "Tutor review" : "In progress"}</span></div>
            <p className="mt-1 text-xs text-[var(--theme-muted)]">{mission.classes?.[0]?.display_name || "Class pathway"} · {mission.weak_topics?.[0] || "Tutor will guide the next step"}</p>
            {mission.tutor_feedback && <p className="mt-2 text-sm leading-6 text-[var(--theme-ink-soft)]">Tutor comment: {mission.tutor_feedback}</p>}
          </div>
        )) : <p className="border-t border-[var(--theme-line)] py-4 text-sm text-[var(--theme-muted)]">Missions will appear after structured practice begins.</p>}
      </section>

      <section id="parent-practice-tasks" data-tour="parent-homework" className="home-surface scroll-mt-5 sm:p-6">
        <HomeSectionHeading eyebrow="Tutor-guided practice" title="Next practice tasks" href="/dashboard/classes" linkLabel="Open classes" />
        {assignments.length > 0 ? assignments.slice(0, 3).map((assignment) => <div key={assignment.id} className="border-t border-[var(--theme-line)] py-3"><p className="text-sm font-medium text-[var(--theme-ink)]">{assignment.class_display_name || "Class practice"}</p><p className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--theme-muted)]">{assignment.content}</p>{assignment.due_date && <p className="mt-1 text-xs text-[var(--theme-muted)]">Due {formatLessonDate(assignment.due_date)}</p>}</div>) : <p className="border-t border-[var(--theme-line)] py-4 text-sm text-[var(--theme-muted)]">Tutor practice will appear here once it is assigned.</p>}
      </section>

      {/* SECURE PAYMENT REQUIRED (Accepted Handshake) */}
      {toPay.length > 0 && (
        <section id="parent-confirm-booked-support" className="dashboard-priority p-4 md:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5 md:mb-8">
            <h2 className="text-2xl font-black text-secondary flex items-center gap-4">
              <span className="p-2 bg-primary text-white rounded-xl">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                 </svg>
              </span>
              Confirm booked support
            </h2>
            <span className="text-xs font-semibold text-primary">Tutor accepted</span>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-8">
             {groupedToPay.map(group => {
                const booking = group.mainBooking;
                return (
                <div key={group.id} className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-4 md:p-6">
                   <div className="flex items-center gap-5 mb-6">
                      <div className="w-16 h-16 relative rounded-2xl overflow-hidden border-2 border-slate-50 shadow-md">
                         <Image src={booking.tutor_avatar || "/tutor_placeholder.webp"} alt="" fill className="object-cover" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-lg uppercase tracking-widest">{booking.subject}</span>
                          <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded ${booking.lesson_mode === "physical" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                            {booking.lesson_mode === "physical" ? "In-person" : "Online"}
                          </span>
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
                            {group.isGroup ? `Starts ${formatLessonDate(booking.requested_date)}` : formatNextLessonDate(booking.requested_date)}
                         </span>
                         <div className="text-right">
                           <div className="text-secondary font-black text-xs">£{booking.price_at_booking * group.count} Total</div>
                           {group.isGroup && <div className="text-[8px] opacity-50">£{booking.price_at_booking} × {group.count} sessions</div>}
                         </div>
                      </div>
                      {booking.lesson_mode === "physical" && (
                        <p className="rounded-xl bg-emerald-50 p-3 text-xs font-bold leading-5 text-emerald-900">
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
        <section id="parent-lesson-requests">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-secondary flex items-center gap-3">
              Lesson requests
            </h2>
            <span className="text-xs font-black text-secondary/40 uppercase tracking-widest">Waiting for tutor confirmation</span>
          </div>          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
             {groupedRequested.map(group => {
                const booking = group.mainBooking;
                return (
                <div key={group.id} className="bg-white p-4 rounded-2xl border border-secondary/10 shadow-sm flex flex-col relative overflow-hidden group md:p-6 md:rounded-3xl">
                   <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 relative rounded-xl overflow-hidden border border-secondary/5 shadow-sm">
                           <Image src={booking.tutor_avatar || "/tutor_placeholder.webp"} alt="" fill className="object-cover" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="inline-block px-2 py-0.5 bg-secondary/5 text-secondary/40 text-[9px] font-black rounded-md uppercase tracking-wider">{booking.subject}</span>
                            <span className={`px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest rounded ${booking.lesson_mode === "physical" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                              {booking.lesson_mode === "physical" ? "In-person" : "Online"}
                            </span>
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
                      &ldquo;{booking.description}&rdquo;
                   </p>

                   <div className="mt-auto border-t border-secondary/5 pt-4 flex flex-col gap-2">
                     <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-secondary/30">
                        <span className="flex items-center gap-1.5 font-black">
                           <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
                           {group.isGroup ? `Starts ${formatLessonDate(booking.requested_date)}` : formatNextLessonDate(booking.requested_date)}
                        </span>
                        <span>£{booking.price_at_booking}/hr</span>
                     </div>
                   </div>
                </div>
             )})}
          </div>
        </section>
      )}

      <details id="parent-history" data-tour="parent-history" className="home-surface parent-history-disclosure scroll-mt-5 sm:p-6">
        <summary className="cursor-pointer list-none focus-visible:outline-2 focus-visible:outline-[var(--theme-accent)]">
          <span className="home-eyebrow block">Past support</span>
          <span className="home-section-title block">Past lesson summaries <span className="text-sm font-normal text-[var(--theme-muted)]">({past.length})</span></span>
          <span className="home-section-description block">Open the full record of completed lessons and tutor notes.</span>
        </summary>
        <div className="mt-5 border-t border-[var(--theme-line)] pt-5">
          <LessonHistoryTable bookings={past} currentUserRole="parent" appearance="student" />
        </div>
      </details>

      <section data-tour="parent-tutors" className="border-t border-[var(--theme-line)] px-1 pt-6">
        <HomeSectionHeading eyebrow="More support" title={bookings.length === 0 ? "Find tutor support" : "Need help in another subject?"} description="Browse verified tutors whenever your child needs additional guidance." href="/dashboard/parent/tutors" linkLabel="Browse tutors" />
      </section>
    </div>
  );
}

import { getBookingsByUserId, getTutors, type Booking } from "@/lib/supabase-queries";
import { getActiveAnnouncementsForUser } from "@/lib/announcement-queries";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import TutorCard from "@/components/TutorCard";
import CheckoutButton from "@/components/CheckoutButton";
import LessonHistoryTable from "@/components/LessonHistoryTable";
import HomeworkFeed from "@/components/HomeworkFeed";
import StudentProgressStats from "@/components/StudentProgressStats";
import AnnouncementFeed from "@/components/AnnouncementFeed";

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

type ParentJourneyItem = {
  id: string;
  label: string;
  title: string;
  meaning: string;
  nextStep: string;
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
  meta: any;
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

  const meta = user?.user_metadata;
  
  // Fetch fresh profile data to avoid stale Auth metadata
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, student_name")
    .eq("id", user.id)
    .single();

  const userName = profile?.full_name || meta?.full_name || "User";
  const avatarUrl = profile?.avatar_url || meta?.avatar_url;
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

  const announcements = await getActiveAnnouncementsForUser();

  const { getHomeworkForStudent } = await import("@/lib/class-queries");
  const assignments = await getHomeworkForStudent(learnerContext.learnerId);
  const { data: missionProgress } = await supabase
    .from("student_missions")
    .select("id, status, mission_tier, score_percentage, tutor_feedback, weak_topics, created_at, completed_at, mission_blueprint, classes(display_name, subject)")
    .eq("student_id", learnerContext.learnerId)
    .order("created_at", { ascending: false })
    .limit(4);
  const missions = (missionProgress ?? []) as any[];
  const latestMission = missions[0];
  const latestWeakTopic = latestMission?.weak_topics?.[0];
  const latestLesson = recentLessonNotes[0];
  const latestAssignment = assignments[0];
  const shouldShowTutorGrid = bookings.length === 0;
  const availableTutors = shouldShowTutorGrid ? await getTutors("", "All") : [];

  const recommendedAction = !nextSession
    ? { label: "Schedule a lesson", href: "/dashboard/parent/tutors" }
    : latestAssignment
      ? { label: "Review practice tasks", href: "#parent-practice-tasks" }
      : latestMission
        ? { label: "Review learning Missions", href: "#parent-missions" }
        : { label: "Message tutor", href: "/dashboard/messages" };

  const parentJourneyItems: ParentJourneyItem[] = [
    {
      id: "current-support",
      label: "Current support",
      title: nextSession ? `${nextSession.subject} lesson scheduled` : "Ready to schedule support",
      meaning: nextSession
        ? `${new Date(nextSession.requested_date).toLocaleDateString(undefined, { month: "long", day: "numeric", hour: "numeric", minute: "2-digit" })}${nextSession.tutor_name ? ` with ${nextSession.tutor_name}` : ""}.`
        : "No upcoming lesson is booked yet, so the learning pathway is ready for its next guided step.",
      nextStep: nextSession
        ? "Join the classroom when it begins, or message the tutor if anything needs clarifying."
        : "Schedule a lesson so the next learning step is guided.",
    },
    {
      id: "latest-learning",
      label: "Latest learning",
      title: latestLesson ? `${latestLesson.subject} lesson summary` : "Lesson understanding will appear here",
      meaning: shortText(
        latestLesson?.lesson_notes?.summary,
        "After the first completed lesson, this will show what was covered and why it matters.",
        125,
      ),
      nextStep: latestLesson?.lesson_notes?.homework
        ? shortText(latestLesson.lesson_notes.homework, "Follow the tutor's recommended practice.", 95)
        : "Complete the first lesson so tutor notes can shape the next step.",
    },
    {
      id: "support-focus",
      label: "Support focus",
      title: latestWeakTopic || latestAssignment?.class_display_name || "Next focus will become clear",
      meaning: latestWeakTopic
        ? `${latestWeakTopic} is the clearest area for guided reinforcement.`
        : shortText(
            latestAssignment?.content,
            "Tutor notes and practice tasks will reveal the topic that needs support next.",
            125,
      ),
      nextStep: latestAssignment ? "Review the tutor-guided practice task." : "Begin with a lesson to identify the right focus.",
    },
    {
      id: "between-lessons",
      label: "Between lessons",
      title: latestAssignment ? "Tutor-guided practice is ready" : latestMission ? "Learning Mission in progress" : "Practice support will build here",
      meaning: latestAssignment
        ? shortText(latestAssignment.content, "A practice task is ready.", 125)
        : latestMission
          ? `${latestMission.mission_blueprint?.topic || "A guided practice pathway"} is keeping learning connected between lessons.`
          : "Homework and Missions will appear when structured practice begins.",
      nextStep: latestAssignment
        ? "Make time for this before the next lesson."
        : latestMission
          ? "Review the learning Mission to understand the current pathway."
          : "Schedule a lesson to begin between-lesson support.",
    },
  ];

  return (
    <div className="px-3 py-5 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-5 md:space-y-10">
      {/* Platform Announcements Hub */}
      {announcements.length > 0 && (
         <AnnouncementFeed announcements={announcements} />
      )}

      <div data-tour="parent-welcome" className="flex flex-col gap-4 md:flex-row md:justify-between md:items-end">
         <div className="flex items-center gap-4 sm:gap-6">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border-2 border-white shadow-md overflow-hidden flex items-center justify-center transform -rotate-3 transition-transform hover:rotate-0 sm:h-20 sm:w-20 sm:rounded-[1.5rem] sm:border-4 sm:shadow-xl">
               {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                  <span className="text-2xl font-black text-primary sm:text-3xl">{userName.charAt(0)}</span>
               )}
            </div>
            <div>
               <h1 className="text-3xl font-black mb-1 bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent tracking-tight sm:text-4xl">
                  Hello, {userName.trim().split(' ')[0]}!
               </h1>
               <p className="text-secondary/55 text-sm font-bold flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-primary/70"></span>
                 {meta?.sub_role === "parent" 
                   ? `Here is where ${studentName || "your child"} is in the learning journey.`
                   : "Ready for your next learning session?"}
               </p>
            </div>
         </div>
      </div>

      <section className="rounded-[1.5rem] border border-primary/[0.07] bg-gradient-to-br from-white via-[#fbfdff] to-[#f4f9ff] p-4 sm:p-5 md:rounded-[2.25rem] md:p-6">
        <div className="mb-3 md:mb-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.08em] text-secondary/30">Guided learning journey</p>
            <h2 className="mt-2 text-xl font-black tracking-tight text-secondary md:text-2xl">Your child&apos;s learning journey</h2>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-secondary/56">
              What happened, what it means, and what should happen next.
            </p>
          </div>
        </div>

        <div className="relative mt-3 overflow-hidden rounded-[1.25rem] border border-secondary/[0.05] bg-white md:rounded-[1.75rem]">
          <div className="absolute bottom-5 left-5 top-5 w-px bg-primary/[0.07]" aria-hidden="true" />
          <div className="divide-y divide-secondary/[0.045]">
            {parentJourneyItems.map((item, index) => (
              <div key={item.id} className="relative grid gap-1 py-3 pl-11 pr-4 md:grid-cols-[8rem_1fr] md:items-start md:gap-5 md:px-5 md:py-3.5 md:pl-14">
                <span
                  className={`absolute left-[1rem] top-[1rem] h-2.5 w-2.5 rounded-full border-2 border-white ${
                    index === 0 ? "bg-primary/80" : index === parentJourneyItems.length - 1 ? "bg-secondary/70" : "bg-primary/20"
                  }`}
                  aria-hidden="true"
                />
                <p className="text-[9px] font-black uppercase tracking-[0.07em] text-secondary/28 md:pt-1">{item.label}</p>
                <div className="min-w-0">
                  <h3 className="text-sm font-black leading-5 text-secondary md:text-base">{item.title}</h3>
                  <p className="mt-0.5 text-sm font-medium leading-5 text-secondary/54">{item.meaning}</p>
                  <p className="mt-1 text-xs font-bold leading-5 text-secondary/48">
                    <span className="text-primary/60">Next step &rarr; </span>{item.nextStep}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-secondary/[0.05] bg-[#f8fbff] p-5 md:flex md:items-center md:justify-between md:gap-6 md:px-6 md:py-5">
            <div>
              <h3 className="text-sm font-black text-secondary md:text-base">
                Continue {studentName || "your child"}&apos;s guided learning journey.
              </h3>
              <p className="mt-1 text-sm font-medium leading-6 text-secondary/52">
                One clear action keeps the next step calm and easy to follow.
              </p>
            </div>
            <Link
              href={recommendedAction.href}
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-secondary px-5 py-3 text-xs font-black uppercase tracking-[0.1em] text-white transition-colors hover:bg-secondary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 md:mt-0 md:w-auto"
            >
              {recommendedAction.label}
            </Link>
          </div>
        </div>
      </section>

      <div data-tour="parent-progress">
        <StudentProgressStats bookings={bookings} />
      </div>

      <section id="parent-missions" className="rounded-[1.5rem] border border-primary/10 bg-white p-4 shadow-sm sm:p-5 md:rounded-[2.5rem] md:p-8">
        <div className="mb-7 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary/65">Learning Mission visibility</p>
            <h2 className="mt-2 text-2xl font-black text-secondary">Learning momentum between lessons</h2>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-secondary/55">
              Guided practice helps connect lesson notes, tutor review, and the next learning step.
            </p>
          </div>
          <Link href="/dashboard/classes" className="rounded-2xl border border-secondary/10 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-secondary/60 transition-colors hover:border-primary/20 hover:text-primary">
            View class spaces
          </Link>
        </div>

        {missionProgress && missionProgress.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {missionProgress.map((mission: any) => (
              <div key={mission.id} className="rounded-2xl border border-secondary/10 bg-surface p-4 md:rounded-3xl md:p-5">
                <div className="mb-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-primary">
                    {String(mission.mission_tier || "mission").replace(/_/g, " ")}
                  </span>
                  <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-secondary/45">
                    {mission.status === "completed" ? "Completed" : mission.status === "pending_tutor_approval" ? "Tutor review" : "In progress"}
                  </span>
                </div>
                <h3 className="font-black text-secondary">{mission.mission_blueprint?.topic || "Guided practice pathway"}</h3>
                <p className="mt-1 text-xs font-bold text-secondary/45">
                  {mission.classes?.display_name || "Class pathway"} {mission.classes?.subject ? `- ${mission.classes.subject}` : ""}
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="border-t border-secondary/8 pt-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-secondary/35">Practice signal</p>
                    <p className="mt-2 text-sm font-bold text-secondary/65">
                      {typeof mission.score_percentage === "number" ? "Completed work is ready to inform the next step" : "Practice pathway started"}
                    </p>
                  </div>
                  <div className="border-t border-secondary/8 pt-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-secondary/35">Next learning step</p>
                    <p className="mt-2 text-sm font-bold text-secondary/65">
                      {mission.weak_topics?.[0] || "Tutor will guide the next step"}
                    </p>
                  </div>
                </div>
                {mission.tutor_feedback && (
                  <p className="mt-4 border-t border-primary/10 pt-3 text-sm font-medium leading-6 text-secondary/60">
                    Tutor comment: {mission.tutor_feedback}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-secondary/15 bg-surface p-5 text-center md:rounded-3xl md:p-7">
            <p className="font-bold text-secondary/55">Learning Missions will appear here after structured practice begins.</p>
            <p className="mt-2 text-sm text-secondary/45">This area will show the practice pathway, why it matters, and what the tutor recommends next.</p>
          </div>
        )}
      </section>

      <div id="parent-practice-tasks" data-tour="parent-homework">
        <HomeworkFeed assignments={assignments} showEmptyState />
      </div>

      {/* SECURE PAYMENT REQUIRED (Accepted Handshake) */}
      {toPay.length > 0 && (
        <section className="bg-primary/5 rounded-[1.5rem] p-4 border border-primary/20 shadow-sm md:rounded-[2.5rem] md:p-8 md:border-2 md:shadow-xl md:shadow-primary/5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5 md:mb-8">
            <h2 className="text-2xl font-black text-secondary flex items-center gap-4">
              <span className="p-2 bg-primary text-white rounded-xl">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                 </svg>
              </span>
              Confirm booked support
            </h2>
            <span className="text-xs font-black text-primary uppercase tracking-[0.2em] animate-pulse">Tutor accepted</span>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-8">
             {groupedToPay.map(group => {
                const booking = group.mainBooking;
                return (
                <div key={group.id} className="bg-white p-4 rounded-[1.5rem] border border-primary/10 shadow-sm flex flex-col relative overflow-hidden group md:p-8 md:rounded-[2rem] md:shadow-lg">
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

      <section id="parent-history" data-tour="parent-history">
        <div className="mb-6">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary/65">Past support</p>
          <h2 className="mt-2 text-xl font-black text-secondary">Past lesson summaries</h2>
          <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-secondary/55">
            A full record of completed lessons, with parent-friendly summaries where tutor notes are available.
          </p>
        </div>
        {recentLessonNotes.length > 0 && (
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            {recentLessonNotes.map((lesson) => (
              <div key={`history-preview-${lesson.id}`} className="rounded-2xl border border-secondary/10 bg-white p-4 shadow-sm md:rounded-3xl md:p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">{lesson.subject}</p>
                <h3 className="mt-2 font-black text-secondary">What this lesson means</h3>
                <p className="mt-3 text-sm font-medium leading-6 text-secondary/58">{shortText(lesson.lesson_notes?.summary, "Tutor summary pending.", 120)}</p>
                <p className="mt-4 rounded-2xl bg-surface p-3 text-xs font-bold leading-5 text-secondary/50">
                  Next: {shortText(lesson.lesson_notes?.homework, "Tutor guidance will appear when added.", 90)}
                </p>
              </div>
            ))}
          </div>
        )}
        <LessonHistoryTable bookings={past} />
      </section>

      {/* AVAILABLE EXPERTS (Directory integrated into dashboard) */}
      <section data-tour="parent-tutors" className="pt-8 border-t border-secondary/10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-5 md:mb-8">
           <div>
              <h2 className="text-2xl font-black text-secondary">{shouldShowTutorGrid ? "Find tutor support" : "Need support in another subject?"}</h2>
              <p className="text-sm text-secondary/60 font-bold mt-1">
                {shouldShowTutorGrid
                  ? "Find verified tutor support when your child is ready for structured 1-1 guidance."
                  : "Keep the dashboard focused on current support, and browse tutors only when your child needs an extra area of guidance."}
              </p>
           </div>
           <Link href="/dashboard/parent/tutors" className="text-sm font-black text-primary hover:underline flex items-center gap-1">
              {shouldShowTutorGrid ? "View support options" : "Browse tutor support"} <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
           </Link>
        </div>
        
        {shouldShowTutorGrid ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
             {availableTutors.slice(0, 6).map((tutor) => (
               <TutorCard key={tutor.id} tutor={tutor as any} currentUserRole="parent" variant="dashboard" />
             ))}
          </div>
        ) : (
          <div className="rounded-[1.5rem] border border-primary/10 bg-white p-4 shadow-sm md:rounded-[2rem] md:p-6">
            <p className="text-sm font-bold leading-7 text-secondary/58">
              Your child already has learning activity in progress. If another subject starts feeling difficult, you can browse verified tutors without losing the current learning picture.
            </p>
            <Link href="/dashboard/parent/tutors" className="mt-5 inline-flex rounded-2xl bg-secondary px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-white transition-colors hover:bg-secondary/90">
              Find additional support
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

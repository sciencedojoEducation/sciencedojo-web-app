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

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

type ParentTimelineItem = {
  id: string;
  date: string;
  label: string;
  event: string;
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
  const completedMissionCount = missions.filter((mission) => mission.status === "completed").length;
  const thisMonth = new Date();
  const monthLessons = past.filter((booking) => {
    const date = new Date(booking.requested_date);
    return date.getMonth() === thisMonth.getMonth() && date.getFullYear() === thisMonth.getFullYear();
  });
  const monthAssignments = assignments.filter((assignment) => {
    const date = new Date(assignment.created_at);
    return date.getMonth() === thisMonth.getMonth() && date.getFullYear() === thisMonth.getFullYear();
  });
  const monthMissions = missions.filter((mission) => {
    const date = new Date(mission.created_at);
    return date.getMonth() === thisMonth.getMonth() && date.getFullYear() === thisMonth.getFullYear();
  });
  const shouldShowTutorGrid = bookings.length === 0;
  const availableTutors = shouldShowTutorGrid ? await getTutors("", "All") : [];

  const parentSummaryCards = [
    {
      label: "What your child learned",
      title: recentLessonNotes[0]?.subject || "Lesson understanding",
      text: shortText(
        recentLessonNotes[0]?.lesson_notes?.summary,
        "Once your child completes their first lesson, this area will show what was covered and what it means for the next step.",
      ),
      nextStep: recentLessonNotes[0]?.lesson_notes?.homework
        ? shortText(recentLessonNotes[0].lesson_notes.homework, "Keep following the tutor's recommended practice.", 95)
        : "Next step: after the first lesson, tutor notes will explain what should happen next.",
    },
    {
      label: "What needs support next",
      title: latestWeakTopic || assignments[0]?.class_display_name || "Next learning focus",
      text: latestWeakTopic
        ? `${latestWeakTopic} has been highlighted as a useful next area for guided practice.`
        : shortText(
            assignments[0]?.content,
            "After lessons begin, tutor notes and practice tasks will show which topic needs attention next.",
          ),
      nextStep: latestWeakTopic
        ? "Next step: use guided practice and tutor review to strengthen this area."
        : assignments[0]
          ? "Next step: review the tutor-guided practice task below."
          : "Next step: book or complete a lesson so ScienceDojo can identify the right support area.",
    },
    {
      label: "Learning momentum",
      title: completedMissionCount > 0 ? `${completedMissionCount} guided practice task${completedMissionCount === 1 ? "" : "s"} completed` : `${past.length} completed ${past.length === 1 ? "lesson" : "lessons"}`,
      text: past.length > 0
        ? `${studentName || "Your child"} is building a learning record across ${new Set(past.map((booking) => booking.subject)).size || 1} subject area${new Set(past.map((booking) => booking.subject)).size === 1 ? "" : "s"}.`
        : "Momentum will become visible here as lessons, practice tasks, and learning Missions are completed.",
      nextStep: nextSession
        ? `Next step: continue support in the upcoming ${nextSession.subject} lesson.`
        : "Next step: schedule the next lesson to keep the learning rhythm moving.",
    },
    {
      label: "Tutor recommendation",
      title: recentLessonNotes[0]?.tutor_name || "Tutor guidance",
      text: shortText(
        recentLessonNotes[0]?.lesson_notes?.homework,
        "Tutor recommendations will appear after lessons so you know what should happen next.",
      ),
      nextStep: recentLessonNotes[0]?.lesson_notes?.homework
        ? "Next step: help your child make time for this recommended practice."
        : "Next step: after tutor feedback is added, this card will show the recommended action.",
    },
  ];

  const timelineItems = [
    ...upcoming.slice(0, 1).map((booking): ParentTimelineItem => ({
      id: `upcoming-${booking.id}`,
      date: booking.requested_date,
      label: "Upcoming lesson",
      event: `${booking.subject} support is scheduled`,
      meaning: "Your child has structured support booked instead of having to work through the next step alone.",
      nextStep: `${booking.tutor_name || "The tutor"} will continue the learning pathway in the next lesson.`,
    })),
    ...recentCompleted.slice(0, 3).map((booking): ParentTimelineItem => ({
      id: `lesson-${booking.id}`,
      date: booking.requested_date,
      label: "Lesson completed",
      event: `${booking.subject} lesson completed`,
      meaning: shortText(
        booking.lesson_notes?.summary,
        "This lesson is now part of your child's learning record. Tutor notes will clarify the next focus when added.",
        135,
      ),
      nextStep: shortText(
        booking.lesson_notes?.homework,
        "Next step: wait for tutor guidance or book the next lesson to keep support moving.",
        115,
      ),
    })),
    ...assignments.slice(0, 3).map((assignment): ParentTimelineItem => ({
      id: `assignment-${assignment.id}`,
      date: assignment.created_at,
      label: "Practice task",
      event: assignment.class_display_name || "Tutor-guided practice added",
      meaning: shortText(
        assignment.content,
        "This gives your child a clear practice task to complete between lessons.",
        135,
      ),
      nextStep: "Next step: review the task and help your child make time to complete it.",
    })),
    ...missions.slice(0, 3).map((mission): ParentTimelineItem => ({
      id: `mission-${mission.id}`,
      date: mission.completed_at || mission.created_at,
      label: mission.status === "completed" ? "Learning Mission completed" : mission.status === "pending_tutor_approval" ? "Tutor review" : "Learning Mission started",
      event: mission.mission_blueprint?.topic || "Guided practice pathway",
      meaning: mission.status === "completed"
        ? "This shows structured practice has been completed and can inform the next tutoring step."
        : mission.status === "pending_tutor_approval"
          ? "The tutor can review this work and turn it into clearer next-step guidance."
          : "This gives your child a focused learning pathway between lessons.",
      nextStep: mission.status === "completed"
        ? "Next step: the tutor can use this work to guide the next area of support."
        : mission.status === "pending_tutor_approval"
          ? "Next step: wait for tutor review and feedback."
          : "Next step: support your child in completing the guided practice calmly.",
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  const parentActionCards = [
    !nextSession && {
      title: "Schedule a lesson",
      text: "Keep support moving with another guided tutoring session.",
      href: "/dashboard/parent/tutors",
    },
    bookings.length === 0 && {
      title: "Find tutor support",
      text: "Choose a verified tutor who fits your child's subject and confidence needs.",
      href: "/dashboard/parent/tutors",
    },
    assignments.length > 0 && {
      title: "Review practice tasks",
      text: "See the next practice your child's tutor has recommended.",
      href: "#parent-practice-tasks",
    },
    missions.length > 0 && {
      title: "Review learning Missions",
      text: "Understand how structured practice is supporting progress between lessons.",
      href: "#parent-missions",
    },
  ].filter(Boolean) as { title: string; text: string; href: string }[];

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-10 md:space-y-12">
      {/* Platform Announcements Hub */}
      {announcements.length > 0 && (
         <AnnouncementFeed announcements={announcements} />
      )}

      <div data-tour="parent-welcome" className="flex flex-col gap-5 md:flex-row md:justify-between md:items-end">
         <div className="flex items-center gap-4 sm:gap-6">
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
                 {meta?.sub_role === "parent" 
                   ? `Ready to continue tutoring for ${studentName || "your child"}?`
                   : "Ready for your next learning session?"}
               </p>
            </div>
         </div>
         <Link data-tour="parent-main-action" href="/dashboard/parent/tutors" className="w-full px-8 py-3 bg-secondary text-center text-white font-black rounded-2xl hover:bg-secondary/90 transition-all shadow-lg active:scale-95 md:w-auto">
            Find tutor support
         </Link>
      </div>

      <section className="rounded-[2rem] border border-primary/10 bg-gradient-to-br from-white via-[#f8fbff] to-primary/5 p-5 shadow-sm sm:p-6 md:rounded-[2.75rem] md:p-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">Parent reassurance</p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-secondary md:text-3xl">Your child&apos;s learning picture</h2>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-secondary/58">
              A simple view of what is happening, what it means, and what should happen next.
            </p>
          </div>
          <Link href="/dashboard/messages" className="rounded-2xl border border-primary/15 bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-primary shadow-sm transition-colors hover:bg-primary/5">
            Message tutor
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {parentSummaryCards.map((card) => (
            <div key={card.label} className="rounded-3xl border border-secondary/10 bg-white p-5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary/70">{card.label}</p>
              <h3 className="mt-3 text-lg font-black text-secondary">{card.title}</h3>
              <p className="mt-3 text-sm font-medium leading-6 text-secondary/58">{card.text}</p>
              <p className="mt-4 rounded-2xl bg-primary/5 p-3 text-xs font-bold leading-5 text-secondary/55">{card.nextStep}</p>
            </div>
          ))}
        </div>

        {parentActionCards.length > 0 && (
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {parentActionCards.map((action) => (
              <div
                key={action.title}
                className="rounded-3xl border border-primary/10 bg-white px-5 py-4 shadow-sm"
              >
                <p className="text-sm font-black text-secondary">{action.title}</p>
                <p className="mt-1 text-xs font-bold leading-5 text-secondary/50">{action.text}</p>
                <Link
                  href={action.href}
                  className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-secondary px-4 py-3 text-center text-xs font-black uppercase tracking-[0.12em] text-white transition-colors hover:bg-secondary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  {action.title}
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-secondary/10 bg-white p-5 shadow-sm sm:p-6 md:rounded-[2.5rem] md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">Monthly learning summary</p>
          <h2 className="mt-2 text-2xl font-black text-secondary">{new Date().toLocaleString(undefined, { month: "long" })} support overview</h2>
          <p className="mt-4 text-sm font-medium leading-7 text-secondary/60">
            This month, {studentName || "your child"} has {monthLessons.length > 0 ? `completed ${monthLessons.length} tutoring ${monthLessons.length === 1 ? "session" : "sessions"}` : "not completed a tutoring session yet"}. {monthAssignments.length > 0 ? `${monthAssignments.length} practice task${monthAssignments.length === 1 ? " has" : "s have"} been added. ` : ""}{monthMissions.length > 0 ? `${monthMissions.length} Learning Mission${monthMissions.length === 1 ? " has" : "s have"} supported structured practice between lessons.` : "Learning Missions will add more structured practice visibility as the learning pathway develops."}
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              ["Lessons", monthLessons.length],
              ["Practice tasks", monthAssignments.length],
              ["Learning Missions", monthMissions.length],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-surface p-4 text-center">
                <p className="text-2xl font-black text-secondary">{value}</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-secondary/35">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-secondary/10 bg-secondary p-5 text-white shadow-sm sm:p-6 md:rounded-[2.5rem] md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200/70">Upcoming support</p>
          {nextSession ? (
            <>
              <h2 className="mt-2 text-2xl font-black">{nextSession.subject} with {nextSession.tutor_name || "your tutor"}</h2>
              <p className="mt-4 text-sm font-medium leading-7 text-white/65">
                Next session: {new Date(nextSession.requested_date).toLocaleDateString(undefined, { month: "long", day: "numeric", hour: "numeric", minute: "2-digit" })}.
              </p>
              <a href={nextSession.meeting_url || "#"} target="_blank" rel="noreferrer" className="mt-6 inline-flex rounded-2xl bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-secondary transition-colors hover:bg-slate-50">
                Join classroom
              </a>
            </>
          ) : (
            <>
              <h2 className="mt-2 text-2xl font-black">No upcoming lesson booked</h2>
              <p className="mt-4 text-sm font-medium leading-7 text-white/65">
                Book tutor support when your child is ready for the next step.
              </p>
              <Link href="/dashboard/parent/tutors" className="mt-6 inline-flex rounded-2xl bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-secondary transition-colors hover:bg-slate-50">
                Schedule a lesson
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="rounded-[2rem] border border-secondary/10 bg-white p-5 shadow-sm sm:p-6 md:rounded-[2.5rem] md:p-8">
        <div className="mb-7 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">Learning journey</p>
            <h2 className="mt-2 text-2xl font-black text-secondary">What has happened recently</h2>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-secondary/55">
              A parent-friendly timeline of lessons, practice, Missions, and next steps.
            </p>
          </div>
          <Link href="/dashboard/classes" className="rounded-2xl border border-secondary/10 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-secondary/60 transition-colors hover:border-primary/20 hover:text-primary">
            View class spaces
          </Link>
        </div>

        {timelineItems.length > 0 ? (
          <div className="grid gap-4">
            {timelineItems.map((item) => (
              <div key={item.id} className="grid gap-4 rounded-3xl border border-secondary/10 bg-surface p-5 sm:grid-cols-[8rem_1fr]">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">{item.label}</p>
                  <p className="mt-2 text-xs font-bold text-secondary/40">{formatDate(item.date)}</p>
                </div>
                <div>
                  <h3 className="font-black text-secondary">{item.event}</h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-secondary/58">{item.meaning}</p>
                  <p className="mt-3 rounded-2xl bg-white p-3 text-xs font-bold leading-5 text-secondary/55">{item.nextStep}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-secondary/15 bg-surface p-7 text-center">
            <p className="font-bold text-secondary/55">Your child&apos;s learning journey will appear here after the first lesson.</p>
            <p className="mt-2 text-sm text-secondary/45">
              This timeline will show what happened, what it means, and what should happen next.
            </p>
          </div>
        )}
      </section>

      <div data-tour="parent-progress">
        <StudentProgressStats bookings={bookings} />
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-[2rem] border border-secondary/10 bg-white p-5 shadow-sm sm:p-6 md:rounded-[2.5rem] md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">Tutor communication</p>
          <h2 className="mt-2 text-2xl font-black text-secondary">Questions stay connected to tutoring.</h2>
          <p className="mt-4 text-sm font-medium leading-7 text-secondary/58">
            Use messages for tutor questions, lesson follow-up, or support needs, so your child&apos;s learning context stays in one place.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/dashboard/messages" className="rounded-2xl bg-secondary px-5 py-3 text-center text-xs font-black uppercase tracking-[0.14em] text-white transition-colors hover:bg-secondary/90">
              Open messages
            </Link>
            <Link href="/dashboard/support" className="rounded-2xl border border-secondary/10 px-5 py-3 text-center text-xs font-black uppercase tracking-[0.14em] text-secondary/60 transition-colors hover:border-primary/20 hover:text-primary">
              Contact support
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] border border-secondary/10 bg-white p-5 shadow-sm sm:p-6 md:rounded-[2.5rem] md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">Confidence signals</p>
          <h2 className="mt-2 text-2xl font-black text-secondary">Progress is more than scores.</h2>
          <div className="mt-5 grid gap-3">
            {[
              past.length > 0 ? "Consistency is building through completed tutoring sessions." : "Consistency will build as sessions begin.",
              assignments.length > 0 ? "Homework updates show what to practise between lessons." : "Homework updates will appear after tutor recommendations.",
              completedMissionCount > 0 ? "Completed Missions show structured practice momentum." : "Missions will show confidence-building practice over time.",
            ].map((signal) => (
              <div key={signal} className="flex gap-3 rounded-2xl bg-surface p-4 text-sm font-bold leading-6 text-secondary/58">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                {signal}
              </div>
            ))}
          </div>
        </div>
      </section>

      {recentLessonNotes.length > 0 && (
        <section className="rounded-[2rem] border border-secondary/10 bg-white p-5 shadow-sm sm:p-6 md:rounded-[2.5rem] md:p-8">
          <div className="mb-7">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">Lesson summaries</p>
            <h2 className="mt-2 text-2xl font-black text-secondary">What happened recently</h2>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-secondary/55">
              Recent tutor notes help you understand what was covered and what practice comes next.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {recentLessonNotes.map((lesson) => (
              <div key={lesson.id} className="rounded-3xl border border-secondary/10 bg-surface p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">{lesson.subject}</p>
                <h3 className="mt-2 font-black text-secondary">{lesson.tutor_name || "Tutor"} lesson</h3>
                <p className="mt-3 text-sm font-medium leading-6 text-secondary/58">{shortText(lesson.lesson_notes?.summary, "Lesson summary pending.")}</p>
                {lesson.lesson_notes?.homework && (
                  <p className="mt-4 rounded-2xl bg-white p-4 text-xs font-bold leading-6 text-secondary/55">
                    Next practice: {shortText(lesson.lesson_notes.homework, "Tutor will guide the next step.", 110)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section id="parent-missions" className="rounded-[2rem] border border-primary/10 bg-white p-5 shadow-sm sm:p-6 md:rounded-[2.5rem] md:p-8">
        <div className="mb-7 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">Learning Mission visibility</p>
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
              <div key={mission.id} className="rounded-3xl border border-secondary/10 bg-surface p-5">
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
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-secondary/35">Practice signal</p>
                    <p className="mt-2 text-sm font-bold text-secondary/65">
                      {typeof mission.score_percentage === "number" ? "Completed work is ready to inform the next step" : "Practice pathway started"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-secondary/35">Next learning step</p>
                    <p className="mt-2 text-sm font-bold text-secondary/65">
                      {mission.weak_topics?.[0] || "Tutor will guide the next step"}
                    </p>
                  </div>
                </div>
                {mission.tutor_feedback && (
                  <p className="mt-4 rounded-2xl border border-primary/10 bg-white p-4 text-sm font-medium leading-6 text-secondary/60">
                    Tutor comment: {mission.tutor_feedback}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-secondary/15 bg-surface p-7 text-center">
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
        <section className="bg-primary/5 rounded-[2.5rem] p-8 border-2 border-primary/20 shadow-xl shadow-primary/5">
          <div className="flex items-center justify-between mb-8">
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
              Lesson requests
            </h2>
            <span className="text-xs font-black text-secondary/40 uppercase tracking-widest">Waiting for tutor confirmation</span>
          </div>          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      <section data-tour="parent-history">
        <div className="mb-6">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">Past support</p>
          <h2 className="mt-2 text-xl font-black text-secondary">Past lesson summaries</h2>
          <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-secondary/55">
            A full record of completed lessons, with parent-friendly summaries where tutor notes are available.
          </p>
        </div>
        {recentLessonNotes.length > 0 && (
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            {recentLessonNotes.map((lesson) => (
              <div key={`history-preview-${lesson.id}`} className="rounded-3xl border border-secondary/10 bg-white p-5 shadow-sm">
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
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
             {availableTutors.slice(0, 6).map((tutor) => (
               <TutorCard key={tutor.id} tutor={tutor as any} currentUserRole="parent" variant="dashboard" />
             ))}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-primary/10 bg-white p-6 shadow-sm">
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

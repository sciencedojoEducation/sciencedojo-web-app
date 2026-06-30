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

type ParentActivityItem = {
  id: string;
  label: string;
  title: string;
  body: string;
  action?: string;
};

type ParentNextStepItem = {
  title: string;
  body: string;
  active: boolean;
};

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

function uniqueNonEmpty(values: Array<string | undefined | null>) {
  return Array.from(new Set(values.map((value) => value?.trim()).filter(Boolean) as string[]));
}

function formatLessonDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatNextLessonDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: "long", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function formatNextLessonShort(value: string) {
  return new Date(value).toLocaleString(undefined, { weekday: "long", hour: "numeric", minute: "2-digit" });
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
  const subjectsSupported = uniqueNonEmpty(bookings.map((booking) => booking.subject));
  const currentFocus =
    latestWeakTopic ||
    latestMission?.mission_blueprint?.topic ||
    latestAssignment?.class_display_name ||
    nextSession?.subject ||
    latestLesson?.subject ||
    subjectsSupported[0] ||
    "First lesson will identify the focus";
  const currentStatus = nextSession
    ? `${nextSession.subject} lesson scheduled`
    : requested.length > 0
      ? "Lesson request waiting for tutor confirmation"
      : toPay.length > 0
        ? "Tutor accepted. Payment is ready to confirm"
        : latestLesson
          ? "Learning support is underway"
          : "Ready to schedule support";
  const nextLessonTime = nextSession ? formatNextLessonShort(nextSession.requested_date) : "Not scheduled yet";
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
  const statusMeaning = nextSession
    ? `${studentName} has a guided lesson coming up on ${formatNextLessonDate(nextSession.requested_date)}${nextSession.tutor_name ? ` with ${nextSession.tutor_name}` : ""}.`
    : requested.length > 0
      ? "A tutor request has been sent. Once the tutor accepts, you can confirm the booking and continue the journey."
      : toPay.length > 0
        ? "The tutor has accepted the request. Confirming payment secures the learning support."
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

  const recentLearningActivity: ParentActivityItem[] = [
    {
      id: "latest-lesson",
      label: "Latest lesson",
      title: latestLesson ? `${latestLesson.subject} lesson` : "No lessons yet",
      body: latestLesson
        ? `Completed ${formatLessonDate(latestLesson.requested_date)}${latestLesson.tutor_name ? ` with ${latestLesson.tutor_name}` : ""}.`
        : "Learning activity will appear here after the first lesson.",
      action: latestLesson ? "Review the lesson summary below." : "Book a lesson to begin the learning journey.",
    },
    {
      id: "latest-note",
      label: "Latest tutor feedback",
      title: latestLesson ? "What the tutor noticed" : "Tutor feedback will appear here",
      body: shortText(
        latestLesson?.lesson_notes?.summary,
        "After a completed lesson, this will show what was covered and what matters next.",
        125,
      ),
      action: latestLesson?.lesson_notes?.homework
        ? shortText(latestLesson.lesson_notes.homework, "Follow the tutor's recommended practice.", 95)
        : "Tutor guidance will shape the next step after lessons begin.",
    },
    {
      id: "latest-practice",
      label: "Latest practice",
      title: latestAssignment ? "Practice task ready" : latestMission ? "Learning Mission active" : "Practice will build here",
      body: latestAssignment
        ? shortText(latestAssignment.content, "A tutor-guided practice task is ready.", 125)
        : latestMission
          ? `${latestMission.mission_blueprint?.topic || "A guided practice pathway"} is keeping learning connected between lessons.`
          : "Homework and Missions will appear when structured practice begins.",
      action: latestAssignment
        ? "Make time for this before the next lesson."
        : latestMission
          ? "Review the Mission to understand the current pathway."
          : "Schedule a lesson to begin between-lesson support.",
    },
    {
      id: "progress-signal",
      label: "Current learning focus",
      title: latestWeakTopic || latestMission?.mission_blueprint?.topic || "Current focus will become clearer",
      body: latestWeakTopic
        ? `${latestWeakTopic} is the clearest area for guided reinforcement.`
        : "ScienceDojo will connect lesson notes, practice, and tutor guidance into a clearer learning picture over time.",
      action: "Use the next lesson or practice task to keep momentum visible.",
    },
  ];
  const whatHappensNext: ParentNextStepItem[] = [
    {
      title: "Schedule lesson",
      body: "Book the next guided support session.",
      active: !nextSession,
    },
    {
      title: "Meet tutor",
      body: "Attend the lesson and focus on one clear goal.",
      active: !!nextSession,
    },
    {
      title: "Receive summary",
      body: "Review what was covered and why it matters.",
      active: !!latestLesson,
    },
    {
      title: "Practise between lessons",
      body: "Use homework or Missions to reinforce learning.",
      active: !!latestAssignment || !!latestMission,
    },
    {
      title: "Track progress over time",
      body: "Look for patterns in focus areas, notes, and confidence.",
      active: past.length > 0,
    },
  ];

  return (
    <div className="px-3 py-5 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-5 md:space-y-10">
      {/* Platform Announcements Hub */}
      {announcements.length > 0 && (
         <AnnouncementFeed announcements={announcements} />
      )}

      <section data-tour="parent-welcome" className="rounded-[1.5rem] border border-primary/[0.07] bg-gradient-to-br from-white via-[#fbfdff] to-[#f4f9ff] p-4 sm:p-5 md:rounded-[2.25rem] md:p-7">
        <div className="grid gap-5 lg:grid-cols-[1fr_0.78fr] lg:items-stretch">
          <div>
            <div className="inline-flex rounded-full border border-primary/10 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-primary shadow-sm">
              Learning Home
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-secondary sm:text-4xl">
              {studentName === "your child" ? "Your Child's Learning Journey" : `${studentName}'s Learning Journey`}
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-secondary/58">
              A calm place to understand what is happening, who is helping, and what should happen next.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/90 p-4 shadow-sm ring-1 ring-secondary/[0.05]">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-secondary/35">Current status</p>
                <p className="mt-2 text-lg font-black text-secondary">{currentStatus}</p>
              </div>
              <div className="rounded-2xl bg-white/90 p-4 shadow-sm ring-1 ring-secondary/[0.05]">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-secondary/35">Current focus</p>
                <p className="mt-2 text-lg font-black text-secondary">{currentFocus}</p>
              </div>
              <div className="rounded-2xl bg-white/90 p-4 shadow-sm ring-1 ring-secondary/[0.05]">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-secondary/35">Next lesson</p>
                <p className="mt-2 text-lg font-black text-secondary">{nextLessonTime}</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-secondary/48">{nextLessonDetail}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.4rem] border border-primary/10 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary/65">What it means</p>
            <p className="mt-3 text-sm font-semibold leading-7 text-secondary/60">{statusMeaning}</p>
            <div className="mt-5 rounded-2xl bg-primary/5 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-primary/65">Next recommended action</p>
              <p className="mt-2 text-base font-black text-secondary">{recommendedAction.label}</p>
              <Link
                href={recommendedAction.href}
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-secondary px-5 py-3 text-xs font-black uppercase tracking-[0.1em] text-white transition-colors hover:bg-secondary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {recommendedAction.label}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-secondary/10 bg-white p-4 shadow-sm sm:p-5 md:rounded-[2rem] md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary/65">Support team</p>
            <h2 className="mt-2 text-2xl font-black text-secondary">Your Child&apos;s Support Team</h2>
            {supportTeam.length > 0 && (
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-secondary/55">
                These are the tutors currently supporting your child&apos;s learning journey.
              </p>
            )}
          </div>
          <Link href="/dashboard/messages" className="text-sm font-black text-primary hover:underline">
            Open messages →
          </Link>
        </div>
        {supportTeam.length > 0 ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {supportTeam.map((tutor) => (
              <div key={tutor.id} className="flex items-center gap-4 rounded-2xl border border-secondary/8 bg-slate-50/70 p-4">
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-sm font-black text-primary">
                  {tutor.avatar ? (
                    <Image src={tutor.avatar} alt="" fill className="object-cover" />
                  ) : (
                    tutor.name.charAt(0)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-secondary">{tutor.name}</p>
                  {tutor.subject && <p className="mt-1 text-xs font-bold text-secondary/45">{tutor.subject} support</p>}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                  <Link href={`/tutor/${tutor.id}`} className="text-[10px] font-black uppercase tracking-[0.12em] text-primary hover:underline">
                    Profile
                  </Link>
                  <Link href="/dashboard/messages" className="text-[10px] font-black uppercase tracking-[0.12em] text-secondary/45 hover:text-primary">
                    Message
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-secondary/15 bg-surface p-5">
            <p className="text-sm font-bold leading-7 text-secondary/58">
              Your support team will appear here once a tutor is connected to a lesson. Until then, you can browse verified tutor support for the right subject and learning fit.
            </p>
            <Link href="/dashboard/parent/tutors" className="mt-4 inline-flex rounded-2xl bg-secondary px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-white transition-colors hover:bg-secondary/90">
              Browse Tutors
            </Link>
          </div>
        )}
      </section>

      <section className="rounded-[1.5rem] border border-secondary/10 bg-white p-4 shadow-sm sm:p-5 md:rounded-[2rem] md:p-6">
        <div className="mb-5">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary/65">What happens next</p>
          <h2 className="mt-2 text-2xl font-black text-secondary">A simple path through the learning journey</h2>
        </div>
        <div className="grid gap-2">
          {whatHappensNext.map((step, index) => (
            <div key={step.title} className={`flex gap-3 rounded-2xl px-3 py-3 ${
              step.active ? "bg-primary/5" : "bg-slate-50"
            }`}>
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                step.active ? "bg-primary text-white" : "bg-white text-primary ring-1 ring-primary/10"
              }`}>
                {index + 1}
              </span>
              <span>
                <span className="block text-sm font-black text-secondary">{step.title}</span>
                <span className="mt-0.5 block text-xs font-semibold leading-5 text-secondary/48">{step.body}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-primary/[0.07] bg-white p-4 shadow-sm sm:p-5 md:rounded-[2rem] md:p-6">
        <div className="mb-5">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary/65">Recent learning activity</p>
          <h2 className="mt-2 text-2xl font-black text-secondary">What happened recently?</h2>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-secondary/56">
            Lesson notes, practice, and Missions will build a clearer picture as support continues.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {recentLearningActivity.map((item) => (
            <article key={item.id} className="rounded-2xl bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-secondary/35">{item.label}</p>
              <h3 className="mt-2 text-base font-black text-secondary">{item.title}</h3>
              <p className="mt-2 text-sm font-medium leading-6 text-secondary/58">{item.body}</p>
              {item.action && (
                <p className="mt-3 text-xs font-bold leading-5 text-secondary/45">
                  <span className="text-primary/65">Next &rarr; </span>{item.action}
                </p>
              )}
            </article>
          ))}
        </div>
      </section>

      <div data-tour="parent-progress">
        <StudentProgressStats bookings={bookings} currentFocus={currentFocus} />
      </div>

      <section id="parent-missions" className="rounded-[1.5rem] border border-primary/10 bg-white p-4 shadow-sm sm:p-5 md:rounded-[2.5rem] md:p-8">
        <div className="mb-7 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary/65">Learning between lessons</p>
            <h2 className="mt-2 text-2xl font-black text-secondary">Practice support between sessions</h2>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-secondary/55">
              Progress grows between lessons, not only during lessons. Homework and Missions help connect tutor guidance to steady practice.
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
        <section id="parent-confirm-booked-support" className="bg-primary/5 rounded-[1.5rem] p-4 border border-primary/20 shadow-sm md:rounded-[2.5rem] md:p-8 md:border-2 md:shadow-xl md:shadow-primary/5">
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

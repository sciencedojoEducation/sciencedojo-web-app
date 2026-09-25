"use client";

import type { Announcement } from "@/lib/announcement-queries";
import type { PlatformAnnouncement } from "@/lib/platform-announcements";
import type { AvailabilitySlot, Booking, TutorProfile } from "@/lib/supabase-queries";
import type { TutorReadinessResult } from "@/lib/tutor-readiness";
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import AnnouncementFeed from "@/components/AnnouncementFeed";
import { HomeListRow, HomeMetricStrip, HomePrimaryAction, HomeSectionHeading } from "@/components/DashboardHomeUI";
import { CalendarDays, ClipboardList, GraduationCap, UserRoundCheck } from "lucide-react";
import { markTutorWelcomeSeen } from "./actions";
import {
  getAcademyProgressPercent,
  getAcademyResumeHref,
  tutorAcademyCourse,
  type AcademyProgress,
} from "@/lib/tutor-academy";

type LaunchChecklistItem = {
  id: string;
  label: string;
  helper: string;
  completed: boolean;
  href?: string;
  action?: "availability";
};

interface TutorHomeDashboardUIProps {
  userId: string;
  userName: string;
  avatarUrl?: string;
  bookings: Booking[];
  tutorData: TutorProfile | null;
  slots: AvailabilitySlot[];
  announcements: Announcement[];
  platformAnnouncements?: PlatformAnnouncement[];
  reviewVisibility: {
    approved: number;
    pending: number;
  };
  showAcceptedWelcome: boolean;
  profileReadiness: TutorReadinessResult;
  launchChecklist: LaunchChecklistItem[];
  mentorReach: {
    profileVisits: number;
    learningChecks: number;
    trialLessons: number;
  };
  academyProgress: AcademyProgress;
  tutorAcademyEnabled: boolean;
}

function isSameDay(value: string, date: Date) {
  const source = new Date(value);
  return (
    source.getFullYear() === date.getFullYear() &&
    source.getMonth() === date.getMonth() &&
    source.getDate() === date.getDate()
  );
}

function formatLessonDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

function getActionHref(readiness: TutorReadinessResult) {
  const cta = readiness.recommendedNextAction.cta;
  if (cta.action === "availability") return "/dashboard/tutor/schedule?tab=availability";
  return cta.href || "/dashboard/tutor";
}

export default function TutorHomeDashboardUI({
  bookings,
  tutorData,
  slots,
  announcements,
  platformAnnouncements = [],
  reviewVisibility,
  showAcceptedWelcome,
  profileReadiness,
  launchChecklist,
  mentorReach,
  academyProgress,
  tutorAcademyEnabled,
}: TutorHomeDashboardUIProps) {
  const [isWelcomeVisible, setIsWelcomeVisible] = useState(showAcceptedWelcome);
  const [isDismissingWelcome, startWelcomeDismiss] = useTransition();
  const [localToday, setLocalToday] = useState<Date | null>(null);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setLocalToday(new Date()));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const requested = bookings.filter((booking) => booking.status === "requested");
  const upcoming = bookings
    .filter((booking) => booking.status === "confirmed" || booking.status === "accepted")
    .sort((a, b) => new Date(a.requested_date).getTime() - new Date(b.requested_date).getTime());
  const todayLessons = localToday ? upcoming.filter((booking) => isSameDay(booking.requested_date, localToday)) : [];
  const completed = bookings.filter((booking) => booking.status === "completed");
  const totalEarnings = completed.reduce((sum, booking) => sum + Number(booking.price_at_booking), 0);
  const nextActionHref = getActionHref(profileReadiness);
  const remainingProfileActions = launchChecklist.filter((item) => !item.completed).length;
  const academyProgressPercent = getAcademyProgressPercent(academyProgress);
  const teachingAction = requested.length > 0
    ? {
        title: `${requested.length} lesson request${requested.length === 1 ? "" : "s"} to review`,
        description: "Respond to families, then prepare for your upcoming lessons.",
        href: "/dashboard/tutor/schedule?tab=requests",
        label: "Review requests",
        detail: "Teaching today",
      }
    : todayLessons.length > 0
      ? {
          title: `${todayLessons.length} lesson${todayLessons.length === 1 ? "" : "s"} today`,
          description: "Your schedule has the times and class details you need.",
          href: "/dashboard/tutor/schedule?tab=sessions",
          label: "Open schedule",
          detail: "Teaching today",
        }
      : {
          title: profileReadiness.recommendedNextAction.title,
          description: profileReadiness.recommendedNextAction.body,
          href: nextActionHref,
          label: profileReadiness.recommendedNextAction.cta.label,
          detail: "Your next step",
        };

  const recentActivity = [
    ...requested.slice(0, 2).map((booking) => ({
      id: `request-${booking.id}`,
      label: "Lesson request",
      title: `${booking.student_name || "A student"} requested ${booking.subject}`,
      meta: formatLessonDate(booking.requested_date),
      href: "/dashboard/tutor/schedule?tab=requests",
    })),
    ...upcoming.slice(0, 2).map((booking) => ({
      id: `upcoming-${booking.id}`,
      label: "Upcoming lesson",
      title: `${booking.subject} with ${booking.student_name || "student"}`,
      meta: formatLessonDate(booking.requested_date),
      href: "/dashboard/tutor/schedule?tab=sessions",
    })),
    ...(reviewVisibility.pending > 0
      ? [{
          id: "reviews-pending",
          label: "Reviews",
          title: `${reviewVisibility.pending} review${reviewVisibility.pending === 1 ? "" : "s"} pending admin approval`,
          meta: "ScienceDojo moderation",
          href: "/dashboard/tutor",
        }]
      : []),
    ...(slots.length > 0
      ? [{
          id: "availability-published",
          label: "Availability",
          title: "Your requestable lesson times are published",
          meta: `${slots.length} slot${slots.length === 1 ? "" : "s"} active`,
          href: "/dashboard/tutor/schedule?tab=availability",
        }]
      : []),
  ].slice(0, 4);

  const handleDismissWelcome = () => {
    startWelcomeDismiss(async () => {
      const result = await markTutorWelcomeSeen();
      if (!result?.error) {
        setIsWelcomeVisible(false);
      }
    });
  };

  return (
    <div data-role="tutor" className="dashboard-home mx-auto max-w-6xl space-y-6 px-3 py-5 sm:px-6 md:px-8 md:pb-12 md:pt-7">
      {!tutorData?.is_verified && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-medium text-amber-800">Verification in progress</p>
              <h2 className="mt-1 text-base font-semibold">Your tutor profile is under review.</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-amber-900">
                You can keep polishing your profile and availability while ScienceDojo reviews your application.
              </p>
            </div>
            <Link href="/support/tutors" className="inline-flex min-h-10 items-center justify-center rounded-full border border-amber-300 px-4 text-sm font-medium text-amber-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700">
              Review guide
            </Link>
          </div>
        </div>
      )}

      {(announcements.length > 0 || platformAnnouncements.length > 0) && (
        <AnnouncementFeed announcements={announcements} platformAnnouncements={platformAnnouncements} />
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,1fr)]">
        <HomePrimaryAction eyebrow="Teaching today" {...teachingAction} />
        <section className="home-surface sm:p-6" aria-label="Upcoming lessons">
          <HomeSectionHeading eyebrow="Your schedule" title="Coming up" href="/dashboard/tutor/schedule" linkLabel="View all" />
          <div>
            {upcoming.slice(0, 3).map((booking) => <HomeListRow key={booking.id} href="/dashboard/tutor/schedule?tab=sessions" title={booking.subject} detail={`${booking.student_name || "Student"} · ${formatLessonDate(booking.requested_date)}`} />)}
            {upcoming.length === 0 && <p className="py-4 text-sm leading-6 text-[var(--theme-muted)]">Confirmed lessons will appear here when students book your available times.</p>}
          </div>
        </section>
      </div>

      <HomeMetricStrip label="Teaching at a glance" items={[
        { label: "Today", value: todayLessons.length, icon: <CalendarDays size={20} />, tone: "sky" },
        { label: "Upcoming", value: upcoming.length, icon: <GraduationCap size={20} />, tone: "mint" },
        { label: "Requests", value: requested.length, icon: <ClipboardList size={20} />, tone: "amber" },
        { label: "Profile tasks", value: remainingProfileActions, icon: <UserRoundCheck size={20} />, tone: "violet" },
      ]} />

      {isWelcomeVisible && (
        <section className="home-surface sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="home-eyebrow">Verified tutor network</p>
              <h2 className="home-section-title">Your tutor profile is ready to build</h2>
              <p className="home-section-description">You&apos;re part of the verified network. Set up your profile so families can get to know you.</p>
            </div>
            <button
              type="button"
              onClick={handleDismissWelcome}
              disabled={isDismissingWelcome}
              className="home-text-link disabled:opacity-50"
            >
              {isDismissingWelcome ? "Saving..." : "Got it"}
            </button>
          </div>
        </section>
      )}

      <section aria-label="Tutor readiness and Academy" className={`grid gap-4 ${tutorAcademyEnabled ? "lg:grid-cols-2" : ""}`}>
        <div className="home-surface sm:p-6">
          <HomeSectionHeading eyebrow="Tutor readiness" title="Ready for students" href="/dashboard/tutor/settings" linkLabel="Open profile" />
          <div className="flex items-baseline gap-2"><strong className="text-2xl font-semibold text-[var(--theme-ink)]">{profileReadiness.percent}%</strong><span className="text-sm text-[var(--theme-muted)]">complete</span></div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--theme-surface-soft)]"><div className="h-full rounded-full bg-[var(--theme-accent)]" style={{ width: `${profileReadiness.percent}%` }} /></div>
          <div className="mt-5 grid gap-x-5 sm:grid-cols-2">
            {Object.entries({ Availability: profileReadiness.healthSummary.availabilityLabel, Payouts: profileReadiness.healthSummary.payoutsLabel, Reviews: profileReadiness.healthSummary.reviewsLabel, Status: profileReadiness.healthSummary.launchStatus }).map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3 border-t border-[var(--theme-line)] py-2.5 text-sm"><span className="text-[var(--theme-muted)]">{label}</span><span className="text-right font-medium text-[var(--theme-ink-soft)]">{value}</span></div>
            ))}
          </div>
          {requested.length > 0 || todayLessons.length > 0 ? <HomeListRow href={nextActionHref} title={profileReadiness.recommendedNextAction.title} detail={profileReadiness.recommendedNextAction.cta.label} /> : null}
        </div>
        {tutorAcademyEnabled && <div className="home-surface sm:p-6">
          <HomeSectionHeading eyebrow="Tutor Academy" title={academyProgress.completedAt ? "Foundations complete" : "Build your foundations"} description={academyProgress.completedAt ? "Revisit your lessons whenever you like." : `${tutorAcademyCourse.estimatedMinutes} minutes of safe-teaching and platform guidance.`} />
          <div className="mt-5 flex justify-between text-xs text-[var(--theme-muted)]"><span>{academyProgress.completedLessons.length} of {tutorAcademyCourse.lessons.length} lessons</span><span>{academyProgressPercent}%</span></div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--theme-surface-soft)]"><div className="h-full rounded-full bg-[var(--theme-accent)]" style={{ width: `${academyProgressPercent}%` }} /></div>
          <Link href={getAcademyResumeHref(academyProgress)} className="home-text-link mt-5">{academyProgress.completedAt ? "Review course" : academyProgress.completedLessons.length > 0 ? "Continue course" : "Start course"} →</Link>
        </div>}
      </section>

      <section aria-label="Business and reach" className="grid gap-4 lg:grid-cols-2">
        <div className="home-surface sm:p-6">
          <HomeSectionHeading eyebrow="Earnings" title={`£${totalEarnings.toFixed(2)}`} description={`From ${completed.length} completed lesson${completed.length === 1 ? "" : "s"}, before platform fee calculations.`} href="/dashboard/tutor/earnings" linkLabel="View earnings" />
          <div className="mt-5 flex gap-6 border-t border-[var(--theme-line)] pt-4 text-sm"><span className="text-[var(--theme-muted)]">Reviews public <strong className="ml-1 font-medium text-[var(--theme-ink)]">{reviewVisibility.approved}</strong></span><span className="text-[var(--theme-muted)]">Pending <strong className="ml-1 font-medium text-[var(--theme-ink)]">{reviewVisibility.pending}</strong></span></div>
        </div>
        <div className="home-surface sm:p-6">
          <HomeSectionHeading eyebrow="Mentor reach" title="Profile activity" description="Signals from your profile shares this month." href="/dashboard/tutor/settings" linkLabel="Share tools" />
          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-[var(--theme-line)] pt-4">
            {[["Visits", mentorReach.profileVisits], ["Checks", mentorReach.learningChecks], ["Trials", mentorReach.trialLessons]].map(([label, value]) => <div key={label}><p className="text-xl font-semibold text-[var(--theme-ink)]">{value}</p><p className="text-xs text-[var(--theme-muted)]">{label}</p></div>)}
          </div>
        </div>
      </section>

      <section className="home-surface sm:p-6">
        <HomeSectionHeading eyebrow="Recent activity" title="What changed recently" href="/dashboard/tutor/schedule?tab=requests" linkLabel="Review requests" />
        <div className="grid gap-x-6 md:grid-cols-2">
          {recentActivity.map((activity) => <HomeListRow key={activity.id} href={activity.href} title={activity.title} detail={`${activity.label} · ${activity.meta}`} />)}
          {recentActivity.length === 0 && <p className="py-4 text-sm leading-6 text-[var(--theme-muted)]">Activity will appear as students request lessons and your profile changes.</p>}
        </div>
      </section>
    </div>
  );
}

import { createClient } from "@/utils/supabase/server";
import { HomeListRow, HomeMetricStrip, HomePrimaryAction, HomeSectionHeading } from "@/components/DashboardHomeUI";
import { AlertTriangle, BookOpen, Clock3, GraduationCap, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type RecentBooking = {
  id: string;
  status: string;
  requested_date: string;
  price_at_booking: number;
  student?: { full_name?: string | null } | null;
  tutor?: { full_name?: string | null } | null;
};

export default async function AdminDashboard() {
  const supabase = await createClient();
  const [
    { count: activeTutors },
    { count: totalStudents },
    { count: flaggedCount },
    { count: activeTeamMembers },
    { data: settings },
    { data: completedBookings },
    { data: joinedBookings, error: bookingsError },
    { data: topTutors },
  ] = await Promise.all([
    supabase.from("tutors").select("*", { count: "exact", head: true }).eq("is_publicly_listed", true),
    supabase.from("profiles").select("*", { count: "exact", head: true }).in("role", ["parent", "student"]),
    supabase.from("messages").select("*", { count: "exact", head: true }).eq("is_flagged", true),
    supabase.from("internal_team_members").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("platform_settings").select("platform_fee_percent").limit(1).single(),
    supabase.from("bookings").select("price_at_booking, duration_hours").eq("status", "completed"),
    supabase.from("bookings").select("*, student:profiles!student_id(full_name), tutor:profiles!tutor_id(full_name)").order("created_at", { ascending: false }).limit(5),
    supabase.from("tutors").select("id, rating, subjects, profiles!id(full_name, avatar_url)").order("rating", { ascending: false }).limit(4),
  ]);

  let recentBookings = joinedBookings as RecentBooking[] | null;
  if (bookingsError || !recentBookings) {
    const { data: rawBookings } = await supabase.from("bookings").select("*").order("created_at", { ascending: false }).limit(5);
    if (rawBookings?.length) {
      const profileIds = [...new Set(rawBookings.flatMap((booking) => [booking.student_id, booking.tutor_id]).filter(Boolean))];
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", profileIds);
      const profileMap = Object.fromEntries(profiles?.map((profile) => [profile.id, profile.full_name]) || []);
      recentBookings = rawBookings.map((booking) => ({
        ...booking,
        student: { full_name: profileMap[booking.student_id] || "Unknown student" },
        tutor: { full_name: profileMap[booking.tutor_id] || "Unknown tutor" },
      }));
    }
  }

  const platformFeeRaw = settings?.platform_fee_percent ?? 25;
  const platformFee = platformFeeRaw / 100;
  const totalPlatformVolume = (completedBookings || []).reduce((sum, booking) => sum + Number(booking.price_at_booking || 0), 0);
  const totalPlatformProfit = totalPlatformVolume * platformFee;
  const hoursTaught = (completedBookings || []).reduce((sum, booking) => sum + Number(booking.duration_hours || 1), 0);
  const hasSafetyAlerts = (flaggedCount || 0) > 0;

  return (
    <div data-role="admin" className="dashboard-home mx-auto max-w-6xl space-y-6 px-3 py-5 sm:px-6 md:px-8 md:pb-12 md:pt-7">
      {hasSafetyAlerts && (
        <div role="status" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <span className="font-semibold">{flaggedCount} flagged message{flaggedCount === 1 ? "" : "s"} need review.</span>
          <Link href="/dashboard/admin/safeguards" className="ml-2 font-semibold underline underline-offset-2">Open safeguards</Link>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,1fr)]">
        <HomePrimaryAction
          eyebrow="Next operational check"
          title={hasSafetyAlerts ? "Review safeguarding alerts" : "Keep the platform running smoothly"}
          description={hasSafetyAlerts ? "Flagged messages need a prompt, careful review." : "Safeguards are clear. Review the latest activity and keep learner support moving."}
          href={hasSafetyAlerts ? "/dashboard/admin/safeguards" : "/dashboard/admin/bookings"}
          label={hasSafetyAlerts ? "Review alerts" : "Review bookings"}
          detail={hasSafetyAlerts ? "Safety takes priority" : "Today's operations"}
          icon={hasSafetyAlerts ? <AlertTriangle size={23} /> : <ShieldCheck size={23} />}
        />
        <section className="home-surface sm:p-6">
          <HomeSectionHeading eyebrow="Short queue" title="What to check" />
          <HomeListRow href="/dashboard/admin/safeguards" title={hasSafetyAlerts ? "Safeguarding alerts" : "Safeguards"} detail={hasSafetyAlerts ? "Review flagged messages" : "No active flags"} />
          <HomeListRow href="/dashboard/admin/leads" title="Assessment leads" detail="Review parent intake" />
          <HomeListRow href="/dashboard/admin/tutors" title="Tutor review" detail="Verify experts and applications" />
          <HomeListRow href="/dashboard/admin/payouts" title="Payouts" detail="Check tutor balances" />
          <HomeListRow href="/dashboard/admin/team" title="Internal team" detail={`${activeTeamMembers || 0} active collaborators`} />
        </section>
      </div>

      <HomeMetricStrip label="Platform at a glance" items={[
        { label: "Safety alerts", value: flaggedCount || 0, icon: <ShieldCheck size={20} />, tone: hasSafetyAlerts ? "amber" : "mint" },
        { label: "Verified tutors", value: activeTutors || 0, icon: <GraduationCap size={20} />, tone: "violet" },
        { label: "Learner accounts", value: totalStudents || 0, icon: <Users size={20} />, tone: "sky" },
        { label: "Tutoring hours", value: hoursTaught, icon: <Clock3 size={20} />, tone: "mint" },
      ]} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(17rem,1fr)]">
        <section className="home-surface sm:p-6">
          <HomeSectionHeading eyebrow="Learning movement" title="Recent bookings" href="/dashboard/admin/bookings" linkLabel="View all" />
          {recentBookings?.map((booking) => (
            <HomeListRow
              key={booking.id}
              href="/dashboard/admin/bookings"
              title={`${booking.student?.full_name || "Unknown student"} with ${booking.tutor?.full_name || "Unknown tutor"}`}
              detail={`${new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(booking.requested_date))} · ${booking.status} · £${booking.price_at_booking}`}
            />
          ))}
          {!recentBookings?.length && <p className="mt-4 text-sm text-[var(--theme-muted)]">No recent bookings yet.</p>}
        </section>
        <section className="home-surface sm:p-6">
          <HomeSectionHeading eyebrow="Educators" title="Tutor snapshot" href="/dashboard/admin/tutors" linkLabel="Manage tutors" />
          {topTutors?.map((tutor) => {
            const tutorProfile = Array.isArray(tutor.profiles) ? tutor.profiles[0] : tutor.profiles;
            return (
              <div key={tutor.id} className="flex items-center gap-3 border-t border-[var(--theme-line)] py-3">
                <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[var(--theme-accent-soft)]">
                  <Image src={tutorProfile?.avatar_url || "/tutor_placeholder.webp"} alt="" fill className="object-cover" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-[var(--theme-ink)]">{tutorProfile?.full_name || "Tutor"}</span>
                  <span className="block truncate text-xs text-[var(--theme-muted)]">{tutor.subjects?.[0] || "General support"}</span>
                </span>
                <span className="text-xs text-[var(--theme-muted)]">{tutor.rating > 0 ? `★ ${tutor.rating}` : "New"}</span>
              </div>
            );
          })}
          {!topTutors?.length && <p className="mt-4 text-sm text-[var(--theme-muted)]">Tutor profiles will appear here.</p>}
        </section>
      </div>

      <section className="border-t border-[var(--theme-line)] px-1 pt-5">
        <HomeSectionHeading
          eyebrow="Platform context"
          title="Financial overview"
          description={`Platform profit £${totalPlatformProfit.toFixed(2)} at the current ${platformFeeRaw}% fee · gross booking volume £${totalPlatformVolume.toFixed(2)}.`}
          href="/dashboard/admin/payouts"
          linkLabel="Manage payouts"
        />
        <Link href="/dashboard/admin/team" className="home-text-link">Internal team: {activeTeamMembers || 0} active <BookOpen size={15} /></Link>
      </section>
    </div>
  );
}

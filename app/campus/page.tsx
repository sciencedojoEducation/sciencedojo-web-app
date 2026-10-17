import Link from "next/link";
import { campusSession } from "@/lib/campus/server";
import { getEligibleAcademyCourses } from "@/lib/academy-courses";
import { getActiveInternalMemberByUserId } from "@/lib/internal-auth";
import CampusClient from "@/components/campus/CampusClient";
import { acceptCampusNotice } from "./actions";
export const metadata = {
  title: "Virtual ScienceDojo beta | ScienceDojo",
  robots: { index: false, follow: false },
};
export default async function CampusPage() {
  const session = await campusSession();
  if (!session)
    return (
      <main className="min-h-screen bg-[#f5f3ec] px-6 py-20 text-[#173b39]">
        <div className="mx-auto max-w-xl">
          <p className="text-2xl font-semibold">sciencedojo.</p>
          <h1 className="mt-14 text-4xl font-semibold">
            A quieter place to learn.
          </h1>
          <p className="mt-6 leading-7">
            Virtual ScienceDojo is an optional, invite-only adult beta. It is currently
            closed or your account has not been admitted. Your existing courses
            remain available through your usual dashboard.
          </p>
          <Link
            className="mt-8 inline-flex min-h-12 items-center rounded-full bg-[#173b39] px-6 text-white"
            href="/dashboard/academy"
          >
            Go to My Courses →
          </Link>
        </div>
      </main>
    );
  if (!session.identity.accepted)
    return (
      <main className="min-h-screen bg-[#f5f3ec] px-6 py-16 text-[#173b39]">
        <div className="mx-auto max-w-xl">
          <p className="text-2xl font-semibold">sciencedojo.</p>
          <h1 className="mt-12 text-3xl font-semibold">
            Before you enter the library
          </h1>
          <p className="mt-6 leading-7">
            This supervised pilot is for invited adults aged 18+ living in the
            EU/EEA. There is shared presence, with no campus chat or voice. Your
            generated pseudonym is used in the shared world.
          </p>
          <p className="mt-4 leading-7">
            Course discussions use your existing profile name and avatar; course
            reviews can show your name publicly. Private notes keep their
            existing privacy rules.
          </p>
          <p className="mt-4 leading-7">
            Use the participant controls to report or block someone, or leave at
            any time. Reports go to the session moderator. For urgent help,
            contact the supervisor named in your invitation. This is not a
            continuously staffed emergency service.
          </p>
          <form action={acceptCampusNotice} className="mt-7">
            <label className="flex gap-3 leading-6">
              <input
                className="mt-1"
                type="checkbox"
                name="accepted"
                required
              />
              I have read the campus notice, privacy notice and community rules,
              and want to join.
            </label>
            <div className="mt-3 flex gap-5 text-sm underline">
              <Link href="/privacy">Privacy notice</Link>
              <Link href="/community/guidelines">Community rules</Link>
            </div>
            <button className="mt-8 min-h-12 rounded-full bg-[#173b39] px-6 text-white">
              Accept and enter →
            </button>
          </form>
        </div>
      </main>
    );
  const [courses, { data: profile }, internalMember] = await Promise.all([
    getEligibleAcademyCourses(),
    session.supabase.from("profiles").select("role").eq("id", session.userId).maybeSingle(),
    getActiveInternalMemberByUserId(session.supabase, session.userId),
  ]);
  // This chooses a shortcut only. Existing dashboard routes still enforce their own access.
  // Do not use editable auth metadata to choose staff destinations.
  const role = internalMember ? "internal" : profile?.role;
  const dashboardHref = `/dashboard/${["student", "parent", "tutor", "admin", "internal"].includes(role) ? role : "user"}`;
  return (
    <CampusClient
      dashboardHref={dashboardHref}
      courses={courses.map((c) => ({ key: c.key, title: c.title }))}
      initialBlocked={session.identity.blocked || []}
    />
  );
}

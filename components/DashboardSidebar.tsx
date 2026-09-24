import Image from "next/image";
import { createClient } from "@/utils/supabase/server";
import SidebarLink from "./SidebarLink";
import DashboardTourReplayButton from "./DashboardTourReplayButton";
import DashboardMobileDrawer from "./DashboardMobileDrawer";
import DashboardBadgeProvider from "./DashboardBadgeProvider";
import DashboardAccountMenu from "./DashboardAccountMenu";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { getDashboardNavSections } from "@/lib/dashboard-navigation";
import {
  createEmptyDashboardBadgeCounts,
  getDashboardBadgeCounts,
  type DashboardRole,
} from "@/lib/dashboard-badges";

export default async function DashboardSidebar({ role }: { role: DashboardRole }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const metadata = user?.user_metadata;
  const subRole = metadata?.sub_role;
  const displayRole = role === "parent" || role === "student" ? subRole || role : role;

  let userName = metadata?.full_name || `${displayRole.charAt(0).toUpperCase() + displayRole.slice(1)} User`;
  let avatarUrl = metadata?.avatar_url;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .single();

    if (profile?.full_name) userName = profile.full_name;
    if (profile?.avatar_url) avatarUrl = profile.avatar_url;
  }

  const initialBadgeCounts = user
    ? await getDashboardBadgeCounts(role, user.id)
    : createEmptyDashboardBadgeCounts();

  const tutorMarketplaceEnabled = role === "parent" || role === "student"
    ? await isFeatureEnabled("tutor_marketplace_enabled")
    : false;
  const tutorAcademyEnabled = role === "tutor" || role === "parent" || role === "student"
    ? await isFeatureEnabled("tutor_academy_enabled")
    : false;
  const sections = getDashboardNavSections(role, { tutorMarketplaceEnabled, tutorAcademyEnabled });
  const hasTour = role === "parent" || role === "student" || role === "tutor";

  return (
    <DashboardBadgeProvider initialCounts={initialBadgeCounts}>
      <DashboardMobileDrawer
        role={role}
        displayRole={displayRole}
        userName={userName}
        avatarUrl={avatarUrl}
        sections={sections}
      />

      <aside data-tour={`${role}-sidebar`} className="dashboard-sidebar hidden h-full max-h-full w-64 shrink-0 flex-col border-r lg:flex">
        <div className="flex shrink-0 items-center gap-3 border-b border-white/10 px-5 py-5">
          <div className="h-8 w-8 overflow-hidden rounded-lg border border-white/20">
            <Image src="/images/sciencedojo-logo-brand.jpg" alt="ScienceDojo" width={32} height={32} className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">ScienceDojo</p>
            <p className="text-[11px] font-medium capitalize text-slate-300">{displayRole}</p>
          </div>
        </div>

        <nav aria-label={`${displayRole} navigation`} className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-3 py-4">
          {sections.map((section) => (
            <section key={section.title} aria-label={section.title}>
              <h2 className="mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-300">{section.title}</h2>
              <div className="space-y-0.5">
                {section.items.map((link) => (
                  <SidebarLink
                    key={link.href}
                    href={link.href}
                    name={link.name}
                    iconName={link.iconName}
                    badgeKey={link.badgeKey}
                    exact={link.exact}
                    tourId={link.tourId}
                  />
                ))}
              </div>
            </section>
          ))}
        </nav>

        <div className="shrink-0 space-y-2 border-t border-white/10 bg-white/[0.035] p-3">
          {hasTour && (
            <DashboardTourReplayButton className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300" />
          )}
          <DashboardAccountMenu userName={userName} displayRole={displayRole} avatarUrl={avatarUrl} />
        </div>
      </aside>
    </DashboardBadgeProvider>
  );
}

import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { getUnreadMessageCount } from "@/lib/messaging-queries";
import SidebarLink from "./SidebarLink";
import DashboardTourReplayButton from "./DashboardTourReplayButton";
import DashboardMobileDrawer from "./DashboardMobileDrawer";
import { signOut } from "@/app/login/actions";
import { 
  Calendar, 
  GraduationCap, 
  MessageSquare, 
  Search, 
  Settings, 
  LifeBuoy, 
  LayoutDashboard, 
  ShieldCheck, 
  Megaphone, 
  Users, 
  UserCircle, 
  Banknote,
  LogOut
} from "lucide-react";

interface NavLink {
  name: string;
  href: string;
  icon: string;
  badge?: number;
  badgeColor?: string;
  exact?: boolean;
  tourId?: string;
}

interface DashboardSidebarProps {
  role: "admin" | "tutor" | "parent" | "student";
}

export default async function DashboardSidebar({ role }: DashboardSidebarProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const metadata = user?.user_metadata;
  const subRole = metadata?.sub_role; // 'student' or 'parent'
  
  const displayRole = (role === 'admin' || role === 'tutor') ? role : (subRole || role);
  
  // ScienceDojo Aesthetic Pulse: Light-Modern Evolution 🌬️✨
  const variant = 'light'; 
  const isLight = variant === 'light';

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

  const unreadCount = await getUnreadMessageCount();
  let flaggedCount = 0;

  if (role === "admin") {
    const { data: flaggedConvs } = await supabase
      .from("messages")
      .select("conversation_id")
      .eq("is_flagged", true);
    flaggedCount = new Set(flaggedConvs?.map(m => m.conversation_id)).size;
  }

  const navLinks: Record<string, NavLink[]> = {
    parent: [
      { name: "Dashboard", href: "/dashboard/parent", icon: "🗓️", exact: true, tourId: "parent-bookings" },
      { name: "Learning Guide", href: "/support", icon: "📘" },
      { name: "My Classes", href: "/dashboard/classes", icon: "🎓", tourId: "parent-classes" },
      { name: "Messages", href: "/dashboard/messages", icon: "💬", badge: unreadCount, tourId: "parent-messages" },
      { name: "Browse Tutors", href: "/dashboard/parent/tutors", icon: "🔍", tourId: "parent-browse" },
      { name: "Settings", href: "/dashboard/parent/settings", icon: "⚙️" },
      { name: "Support", href: "/dashboard/support", icon: "🆘", tourId: "parent-support" },
    ],
    student: [
      { name: "My Bookings", href: "/dashboard/student", icon: "🗓️", exact: true, tourId: "student-bookings" },
      { name: "Learning Guide", href: "/support", icon: "📘" },
      { name: "My Classes", href: "/dashboard/classes", icon: "🎓", tourId: "student-classes" },
      { name: "Messages", href: "/dashboard/messages", icon: "💬", badge: unreadCount, tourId: "student-messages" },
      { name: "Missions", href: "/dashboard/student/missions", icon: "🧭", tourId: "student-tasks" },
      { name: "Browse Tutors", href: "/dashboard/student/tutors", icon: "🔍" },
      { name: "Focus Timers", href: "/dashboard/student/timers", icon: "⏱️" },
      { name: "Settings", href: "/dashboard/student/settings", icon: "⚙️" },
      { name: "Support", href: "/dashboard/support", icon: "🆘" },
    ],
    tutor: [
      { name: "Dashboard", href: "/dashboard/tutor", icon: "🏠", exact: true },
      { name: "Schedule", href: "/dashboard/tutor/schedule", icon: "🗓️", tourId: "tutor-sessions" },
      { name: "Students & Classes", href: "/dashboard/classes", icon: "🎓", tourId: "tutor-students" },
      { name: "Messages", href: "/dashboard/messages", icon: "💬", badge: unreadCount, tourId: "tutor-messages" },
      { name: "Mission Reviews", href: "/dashboard/tutor/missions", icon: "🧭" },
      { name: "Earnings", href: "/dashboard/tutor/earnings", icon: "💰" },
      { name: "Profile", href: "/dashboard/tutor/settings", icon: "👤", tourId: "tutor-availability" },
      { name: "Success Center", href: "/support/tutors", icon: "⭐" },
      { name: "Support", href: "/dashboard/support", icon: "🆘" },
    ],
    admin: [
      { name: "Overview", href: "/dashboard/admin", icon: "📊", exact: true },
      { name: "Funnel Overview", href: "/dashboard/admin/overview", icon: "📈" },
      { name: "Assessment Leads", href: "/dashboard/admin/leads", icon: "🧲" },
      { name: "Messages", href: "/dashboard/messages", icon: "💬", badge: unreadCount },
      { name: "Dojo Safeguards", href: "/dashboard/admin/safeguards", icon: "🛡️", badge: flaggedCount || 0, badgeColor: "bg-red-500 shadow-red-500/20" },
      { name: "Broadcast Center", href: "/dashboard/admin/broadcast", icon: "📣" },
      { name: "Manage Tutors", href: "/dashboard/admin/tutors", icon: "👥" },
      { name: "User Directory", href: "/dashboard/admin/users", icon: "👤" },
      { name: "Tutor Payouts", href: "/dashboard/admin/payouts", icon: "💰" },
      { name: "Platform Settings", href: "/dashboard/admin/settings", icon: "⚙️" },
    ],
  };

  const links = navLinks[role] || [];

  return (
    <>
    <DashboardMobileDrawer
      role={role}
      displayRole={displayRole}
      userName={userName}
      avatarUrl={avatarUrl}
      links={links}
    />

    <aside data-tour={`${role}-sidebar`} className={`hidden w-64 shrink-0 lg:flex flex-col h-full max-h-full top-0 sticky overflow-y-auto overflow-x-hidden transition-all duration-500 border-r ${
      isLight 
        ? "bg-slate-50/70 backdrop-blur-xl border-slate-200 shadow-[20px_0_40px_-20px_rgba(30,90,168,0.05)]"
        : "bg-[#020617] border-white/5"
    }`}>
      <div className={`absolute inset-0 pointer-events-none ${
        isLight ? "bg-gradient-to-b from-white to-transparent" : "bg-gradient-to-b from-[#1E5AA8]/5 to-transparent"
      }`} />
      
      <div className="p-6 relative z-10">
        <div className="flex items-center gap-3 mb-8 px-2">
           <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 shadow-lg shadow-[#1E5AA8]/20 group hover:scale-105 transition-transform duration-300">
              <img src="/images/sciencedojo-logo-brand.jpg" alt="ScienceDojo" className="w-full h-full object-cover" />
           </div>
           <h2 className={`text-[10px] font-black tracking-[0.3em] uppercase opacity-70 ${
             isLight ? "text-[#1E5AA8]" : "text-[#6FE3D6]"
           }`}>
              {displayRole} Nexus
           </h2>
        </div>

        <nav className="space-y-1">
          {links.map((link) => (
            <SidebarLink
              key={link.name}
              href={link.href}
              name={link.name}
              icon={<span className="text-xl">{link.icon}</span>}
              badge={link.badge}
              badgeColor={link.badgeColor}
              variant={variant}
              exact={link.exact}
              tourId={link.tourId}
            />
          ))}
        </nav>
      </div>
      
      <div className={`mt-auto p-6 relative z-10 border-t backdrop-blur-sm ${
        isLight ? "border-slate-100 bg-white/40 shadow-[0_-10px_30px_rgba(0,0,0,0.02)]" : "border-white/5 bg-white/2"
      }`}>
        <div className="flex items-center gap-3 mb-6 group cursor-pointer">
           <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1E5AA8] to-[#154C9E] p-[1.5px] shadow-lg shadow-[#1E5AA8]/10 group-hover:scale-105 transition-all duration-300">
              <div className={`w-full h-full rounded-[14px] flex items-center justify-center font-bold overflow-hidden border border-white/5 ${
                isLight ? "bg-white text-[#1E5AA8]" : "bg-slate-900 text-white"
              }`}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-black tracking-tighter">{userName.charAt(0).toUpperCase()}</span>
                )}
              </div>
           </div>
           <div className="overflow-hidden">
              <p className={`text-sm font-bold truncate max-w-[140px] group-hover:text-[#1E5AA8] transition-colors duration-300 ${
                isLight ? "text-slate-900" : "text-white"
              }`}>{userName}</p>
              <div className="flex items-center gap-1.5">
                 <div className="w-1.5 h-1.5 rounded-full bg-[#6FE3D6] animate-pulse" />
                 <p className={`text-[9px] uppercase font-black tracking-widest opacity-60 ${
                   isLight ? "text-slate-500" : "text-[#6FE3D6]"
                 }`}>Verified {displayRole}</p>
              </div>
           </div>
        </div>

        {role !== "admin" && (
          <div className="mb-3">
            <DashboardTourReplayButton />
          </div>
        )}

        <Link 
          href="/" 
          className={`flex items-center justify-center w-full gap-2 px-4 py-3 border rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 shadow-lg shadow-black/5 group ${
            isLight 
              ? "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-900 hover:text-white hover:border-slate-900"
              : "bg-white/5 border-white/10 text-slate-300 hover:bg-white hover:text-[#020617] hover:border-white shadow-black/20"
          }`}
        >
          <span className="text-base">🚪</span>
          <span>Exit to Site</span>
        </Link>

        <form action={signOut} className={`mt-5 border-t pt-5 ${
          isLight ? "border-slate-200" : "border-white/10"
        }`}>
          <button
            type="submit"
            className={`flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 shadow-lg shadow-black/5 ${
              isLight
                ? "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                : "border-white/10 bg-white/5 text-slate-300 hover:bg-white hover:text-[#020617]"
            }`}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span>Log Out</span>
          </button>
        </form>
      </div>

      {/* Subtle Background Atmospherics 🏔️✨ */}
      <div className={`absolute -bottom-24 -left-24 w-48 h-48 blur-[80px] pointer-events-none rounded-full ${
        isLight ? "bg-[#6FE3D6]/20" : "bg-[#6FE3D6]/10"
      }`} />
      <div className={`absolute top-1/4 -right-24 w-48 h-48 blur-[80px] pointer-events-none rounded-full ${
        isLight ? "bg-[#1E5AA8]/20" : "bg-[#1E5AA8]/10"
      }`} />
    </aside>
    </>
  );
}

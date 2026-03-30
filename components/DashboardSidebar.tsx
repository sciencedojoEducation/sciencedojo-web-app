import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { getUnreadMessageCount } from "@/lib/messaging-queries";
import Logo from "@/components/Logo";

interface DashboardSidebarProps {
  role: "admin" | "tutor" | "parent" | "student";
}

export default async function DashboardSidebar({ role }: DashboardSidebarProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const metadata = user?.user_metadata;
  const subRole = metadata?.sub_role; // 'student' or 'parent'
  
  // Security Fix: If the main role is admin, always display as Admin to avoid legacy metadata confusion
  const displayRole = (role === 'admin') ? 'admin' : (subRole || role);
  
  // Fetch fresh profile data to avoid stale Auth metadata (e.g. John Smith vs Piumal)
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
  
  // Fetch flagged message count for admin sidebar badge
  const { count: flaggedCount } = await supabase
    .from("messages")
    .select("*", { count: 'exact', head: true })
    .eq("is_flagged", true);

  const pathname = ""; // We will handle pathname if needed, but for now we focus on data

  const navLinks = {
    parent: [
      { name: "My Bookings", href: "/dashboard/parent", icon: "📅" },
      { name: "Messages", href: "/dashboard/messages", icon: "💬", badge: unreadCount },
      { name: "Browse Tutors", href: "/dashboard/parent/tutors", icon: "🔍" },
      { name: "Settings", href: "/dashboard/parent/settings", icon: "⚙️" },
      { name: "Support", href: "/dashboard/support", icon: "🆘" },
    ],
    student: [
      { name: "My Bookings", href: "/dashboard/student", icon: "📅" },
      { name: "Messages", href: "/dashboard/messages", icon: "💬", badge: unreadCount },
      { name: "Browse Tutors", href: "/dashboard/student/tutors", icon: "🔍" },
      { name: "Settings", href: "/dashboard/student/settings", icon: "⚙️" },
      { name: "Support", href: "/dashboard/support", icon: "🆘" },
    ],
    tutor: [
      { name: "My Schedule", href: "/dashboard/tutor", icon: "📆" },
      { name: "Messages", href: "/dashboard/messages", icon: "💬", badge: unreadCount },
      { name: "Earnings", href: "/dashboard/tutor/earnings", icon: "💰" },
      { name: "Profile Settings", href: "/dashboard/tutor/settings", icon: "👤" },
      { name: "Support", href: "/dashboard/support", icon: "🆘" },
    ],
    admin: [
      { name: "Overview", href: "/dashboard/admin", icon: "📊" },
      { name: "Messages", href: "/dashboard/messages", icon: "💬", badge: unreadCount },
      { name: "Dojo Safeguards", href: "/dashboard/admin/safeguards", icon: "🛡️", badge: flaggedCount || 0 },
      { name: "Broadcast Center", href: "/dashboard/admin/broadcast", icon: "📢" },
      { name: "Manage Tutors", href: "/dashboard/admin/tutors", icon: "👥" },
      { name: "Platform Settings", href: "/dashboard/admin/settings", icon: "⚙️" },
    ],
  };

  const links = navLinks[role];

  return (
    <aside className="w-64 bg-surface border-r border-secondary/10 flex flex-col h-[calc(100vh-80px)] top-[80px] sticky overflow-y-auto">
      <div className="p-8">
        <h2 className="text-[10px] font-black tracking-[0.2em] text-primary uppercase mb-6 opacity-30">
          {displayRole} Portal
        </h2>
        <nav className="space-y-2">
          {links.map((link) => {
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-secondary/70 hover:bg-secondary/5 hover:text-secondary`}
              >
                <span>{link.icon}</span>
                <span className="flex-1">{link.name}</span>
                {link.badge && link.badge > 0 && (
                  <span className={`${link.name === 'Dojo Safeguards' ? 'bg-red-600' : 'bg-primary'} text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[1.2rem] text-center shadow-sm`}>
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="mt-auto p-6 border-t border-secondary/10">
        <div className="flex items-center gap-3 mb-6">
           <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center font-bold text-secondary overflow-hidden">
             {avatarUrl ? (
               <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
             ) : (
               userName.charAt(0).toUpperCase()
             )}
           </div>
           <div>
              <p className="text-sm font-bold text-secondary truncate max-w-[120px]">{userName}</p>
              <p className="text-[10px] text-secondary/60 uppercase font-black tracking-tighter">Verified {displayRole}</p>
           </div>
        </div>
        <Link 
          href="/" 
          className="flex items-center justify-center w-full gap-2 px-4 py-2 border border-secondary/20 rounded-lg text-sm font-bold text-secondary hover:bg-secondary/5 transition-colors"
        >
          <span>Exit to Site</span>
        </Link>
      </div>
    </aside>
  );
}

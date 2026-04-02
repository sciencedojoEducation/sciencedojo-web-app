"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface SidebarLinkProps {
  href: string;
  name: string;
  icon: ReactNode;
  badge?: number;
  badgeColor?: string;
  variant?: 'light' | 'dark';
  exact?: boolean;
}

export default function SidebarLink({ href, name, icon, badge, badgeColor, variant = 'dark', exact = false }: SidebarLinkProps) {
  const pathname = usePathname();
  // Exact match or prefix match based on the exact prop pulse 🏎️🚀
  const isActive = exact ? pathname === href : (pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/")));

  const isLight = variant === 'light';

  return (
    <Link
      href={href}
      className={`group relative flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all duration-300 border border-transparent ${
        isActive
          ? isLight
            ? "bg-[#1E5AA8]/5 text-[#1E5AA8] border-slate-200 shadow-[inset_0_0_20px_rgba(30,90,168,0.03)]"
            : "bg-[#1E5AA8]/10 text-white border-white/5 shadow-[inset_0_0_20px_rgba(111,227,214,0.05)]"
          : isLight
            ? "text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 hover:translate-x-1"
            : "text-slate-400 hover:text-white hover:bg-white/5 hover:translate-x-1"
      }`}
    >
      {/* Active Accent Pulse Bar 🏎️🚀 */}
      {isActive && (
        <div className="absolute left-[-1px] top-3 bottom-3 w-1 bg-[#6FE3D6] rounded-full shadow-[0_0_10px_rgba(111,227,214,0.5)]" />
      )}

      <span className={`transition-transform duration-300 ${
        isActive 
          ? "text-[#6FE3D6]" 
          : isLight 
            ? "text-slate-400 group-hover:scale-110 group-hover:text-[#1E5AA8]"
            : "text-slate-500 group-hover:scale-110 group-hover:text-[#6FE3D6]"
      }`}>
        {icon}
      </span>
      
      <span className={`flex-1 transition-all duration-300 text-sm ${isActive ? "tracking-wide font-black" : "font-semibold"}`}>
        {name}
      </span>

      {badge !== undefined && badge > 0 && (
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full min-w-[1.4rem] text-center shadow-lg animate-in zoom-in duration-300 ${
          badgeColor || 'bg-[#1E5AA8] text-white shadow-[#1E5AA8]/20'
        }`}>
          {badge}
        </span>
      )}
    </Link>
  );
}

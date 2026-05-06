import Link from "next/link";
import type { ReactNode } from "react";

type SocialLink = {
  name: string;
  href?: string;
  icon: ReactNode;
};

const socialLinks: SocialLink[] = [
  {
    name: "Facebook",
    href: process.env.NEXT_PUBLIC_FACEBOOK_URL,
    icon: <span className="text-sm font-black">f</span>,
  },
  {
    name: "Instagram",
    href: process.env.NEXT_PUBLIC_INSTAGRAM_URL,
    icon: (
      <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
        <rect x="5" y="5" width="14" height="14" rx="4" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="2" />
        <circle cx="16.5" cy="7.5" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: "TikTok",
    href: process.env.NEXT_PUBLIC_TIKTOK_URL,
    icon: <span className="text-[10px] font-black">TT</span>,
  },
  {
    name: "YouTube",
    href: process.env.NEXT_PUBLIC_YOUTUBE_URL,
    icon: (
      <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="7" width="16" height="10" rx="3" stroke="currentColor" strokeWidth="2" />
        <path d="M11 10l4 2-4 2v-4z" fill="currentColor" />
      </svg>
    ),
  },
];

export default function SocialLinks() {
  const configuredLinks = socialLinks.filter((link) => link.href);

  if (configuredLinks.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {configuredLinks.map((link) => (
        <Link
          key={link.name}
          href={link.href!}
          aria-label={`ScienceDojo on ${link.name}`}
          target="_blank"
          rel="noreferrer"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-secondary/10 bg-white text-secondary/60 shadow-sm transition-colors hover:border-primary/30 hover:text-primary"
        >
          {link.icon}
        </Link>
      ))}
    </div>
  );
}

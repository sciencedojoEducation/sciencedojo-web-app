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
    icon: (
      <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14.5 8.5V6.75c0-.52.42-.94.94-.94h1.44V3.13A20.2 20.2 0 0 0 14.78 3c-2.09 0-3.53 1.27-3.53 3.6v1.9H8.88v3h2.37V21h3.25v-9.5h2.54l.4-3H14.5Z" />
      </svg>
    ),
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
    icon: (
      <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14.7 3h2.72c.18 1.3.89 2.42 1.91 3.17A5.41 5.41 0 0 0 22 7.21v2.86a8.16 8.16 0 0 1-4.84-1.55v6.54A5.95 5.95 0 1 1 11.2 9.1c.37 0 .73.03 1.08.1v3.03a2.92 2.92 0 1 0 2.42 2.88V3Z" />
      </svg>
    ),
  },
  {
    name: "LinkedIn",
    href: process.env.NEXT_PUBLIC_LINKEDIN_URL,
    icon: (
      <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6.94 8.92H3.75V20h3.19V8.92ZM7.2 5.5A1.84 1.84 0 1 0 3.52 5.5 1.84 1.84 0 0 0 7.2 5.5ZM20.5 13.8c0-3.03-1.62-5.13-4.25-5.13a3.66 3.66 0 0 0-3.31 1.82V8.92H9.9V20h3.18v-5.48c0-1.45.27-2.85 2.07-2.85 1.77 0 1.79 1.65 1.79 2.94V20h3.18v-6.2h.38Z" />
      </svg>
    ),
  },
  {
    name: "YouTube",
    href: process.env.NEXT_PUBLIC_YOUTUBE_URL,
    icon: (
      <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21.58 7.18a2.6 2.6 0 0 0-1.83-1.84C18.14 4.9 11.67 4.9 11.67 4.9s-6.47 0-8.08.44a2.6 2.6 0 0 0-1.84 1.84A27.12 27.12 0 0 0 1.32 12a27.12 27.12 0 0 0 .43 4.82 2.6 2.6 0 0 0 1.84 1.84c1.61.44 8.08.44 8.08.44s6.47 0 8.08-.44a2.6 2.6 0 0 0 1.83-1.84A27.12 27.12 0 0 0 22.02 12a27.12 27.12 0 0 0-.44-4.82ZM9.56 15.05v-6.1L14.94 12l-5.38 3.05Z" />
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

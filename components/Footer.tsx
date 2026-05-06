import Link from "next/link";
import Logo from "./Logo";
import SocialLinks from "./SocialLinks";

const footerGroups = [
  {
    title: "Learning",
    links: [
      ["Find Tutors", "/#directory"],
      ["AI Practice Studio", "/ai-practice-studio"],
      ["Free Assessment", "/free-assessment"],
    ],
  },
  {
    title: "Resources",
    links: [
      ["Learning Hub", "/learning-hub"],
      ["Online Math Tutor", "/online-math-tutor"],
      ["GCSE Math Tutor", "/gcse-math-tutor"],
    ],
  },
  {
    title: "Company",
    links: [
      ["Dashboard", "/login"],
      ["Code of Conduct", "/code-of-conduct"],
    ],
  },
  {
    title: "Legal",
    links: [
      ["Terms", "/terms"],
      ["Privacy", "/privacy"],
    ],
  },
];

export default function Footer() {
  return (
    <footer className="w-full border-t border-secondary/10 bg-surface py-16">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1.8fr]">
          <div className="flex flex-col items-center gap-5 text-center md:items-start md:text-left">
            <Logo className="text-lg" dotClassName="w-1.5 h-1.5" />
            <p className="max-w-sm text-sm font-semibold leading-7 text-secondary/60">
              AI-powered study tools and expert tutoring support for modern online learning.
            </p>
            <SocialLinks />
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-secondary/45">{group.title}</h3>
                <div className="mt-4 grid gap-3">
                  {group.links.map(([label, href]) => (
                    <Link key={href} href={href} className="text-sm font-semibold text-secondary/65 transition-colors hover:text-primary">
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 border-t border-secondary/10 pt-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-secondary/35 md:text-left">
          &copy; {new Date().getFullYear()} sciencedojo. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

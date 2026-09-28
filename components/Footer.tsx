import Link from "next/link";
import Logo from "./Logo";
import SocialLinks from "./SocialLinks";

const footerGroups = [
  {
    title: "Learning",
    links: [
      ["Find Tutors", "/find-tutors"],
      ["How It Works", "/how-it-works"],
      ["PracticeDojo", "/ai-practice-studio"],
      ["FocusDojo", "/focus-dojo"],
      ["Free Assessment", "/free-assessment"],
    ],
  },
  {
    title: "Resources",
    links: [
      ["Learning Hub", "/learning-hub"],
      ["Exam Community", "/community"],
      ["Official Exam Updates", "/community/news"],
      ["Online Math Tutor", "/online-math-tutor"],
      ["GCSE Math Tutor", "/gcse-math-tutor"],
    ],
  },
  {
    title: "Company",
    links: [
      ["About ScienceDojo", "/about"],
      ["Dashboard", "/login"],
      ["Code of Conduct", "/code-of-conduct"],
      ["Community Guidelines", "/community/guidelines"],
    ],
  },
  {
    title: "Legal",
    links: [
      ["Terms", "/terms"],
      ["Privacy", "/privacy"],
    ],
  },
  {
    title: "Support & Safety",
    links: [
      ["Safeguarding Policy", "/safeguarding"],
      ["How We Verify Tutors", "/how-we-verify"],
      ["Online Classroom Guide", "/classroom-guide"],
      ["Parent Support", "/support"],
      ["Contact Us", "/contact"],
    ],
  },
];

export default function Footer() {
  return (
    <footer className="w-full border-t border-[#21446b] bg-[#071a35] py-16 text-white">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1.8fr]">
          <div className="flex flex-col items-center gap-5 text-center md:items-start md:text-left">
            <Logo className="text-lg" dotClassName="w-1.5 h-1.5" inverted />
            <p className="max-w-sm text-sm font-semibold leading-7 text-white/70">
              Expert tutoring enhanced by smarter learning tools for modern online learning.
            </p>
            <SocialLinks inverted />
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#a9cee7]">{group.title}</h3>
                <div className="mt-4 grid gap-3">
                  {group.links.map(([label, href]) => (
                    <Link key={href} href={href} className="text-sm font-semibold text-white/80 transition-colors hover:text-cyan-200 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-200">
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 border-t border-white/15 pt-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white/60 md:text-left">
          &copy; {new Date().getFullYear()} sciencedojo. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

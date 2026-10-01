"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AcademyCourseUtilityLinks({ basePath }: { basePath: string }) {
  const pathname = usePathname();
  const lesson = pathname.startsWith(`${basePath}/lessons/`)
    ? pathname.slice(`${basePath}/lessons/`.length).split("/")[0] : undefined;
  return <div className="flex flex-wrap gap-5 border-b bg-slate-50 px-5 py-2 text-sm font-semibold text-blue-700">
    <Link href="/dashboard/academy" className="inline-flex min-h-11 items-center">My Courses</Link>
    <Link href={`${basePath}/community${lesson ? `?lesson=${encodeURIComponent(lesson)}` : ""}`} className="inline-flex min-h-11 items-center">Private notes &amp; discussions</Link>
  </div>;
}

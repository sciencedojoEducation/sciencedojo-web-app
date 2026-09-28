"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Search, X } from "lucide-react";

export default function SearchFilterBar({ variant = "default" }: { variant?: "default" | "compact" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const searchTerm = searchParams.get("query") || "";
  const selectedSubject = searchParams.get("subject") || "All";
  const [draftSearchTerm, setDraftSearchTerm] = useState(searchTerm);

  useEffect(() => {
    setDraftSearchTerm(searchTerm);
  }, [searchTerm]);

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "All") {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  useEffect(() => {
    if (draftSearchTerm === searchTerm) return;

    const timeoutId = window.setTimeout(() => {
      const queryString = createQueryString("query", draftSearchTerm.trim());
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [createQueryString, draftSearchTerm, pathname, router, searchTerm]);

  const handleSubject = (subject: string) => {
    const queryString = createQueryString("subject", subject);
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  };

  const subjects = ["All", "Science", "Math", "Physics", "Chemistry", "Biology", "Programming", "English"];

  const isCompact = variant === "compact";

  return (
    <div className={`flex w-full flex-col gap-3 md:flex-row md:gap-4 ${
      isCompact
        ? "rounded-[1.5rem] border border-secondary/10 bg-white p-3 shadow-sm md:p-4"
        : "rounded-3xl border border-[#dce8f2] bg-white p-4 shadow-[0_12px_32px_rgba(18,59,95,.06)] md:p-6"
    }`}>
      <div className="flex-1">
        <label htmlFor="search" className={`block text-xs font-black uppercase tracking-[0.12em] ${isCompact ? "mb-1 text-secondary/40" : "mb-2 text-secondary/60"}`}>
          {isCompact ? "Search support" : "Search tutors"}
        </label>
        <div className="relative">
          {!isCompact && <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary/45" aria-hidden="true" />}
          <input
            type="text"
            id="search"
            className={isCompact ? "block min-h-11 w-full rounded-xl border-secondary/20 bg-surface px-4 py-3 text-sm font-bold text-secondary shadow-inner outline-none transition-all placeholder:text-secondary/35 focus:border-primary focus:ring-primary" : "block min-h-12 w-full rounded-xl border border-[#dce8f2] bg-[#f7fbff] py-3 pl-11 pr-10 text-sm font-semibold text-secondary outline-none transition placeholder:text-secondary/45 focus:border-primary focus:ring-2 focus:ring-primary/20"}
            placeholder={isCompact ? "Search by name, subject, or learning need..." : "Name, subject, or learning need"}
            value={draftSearchTerm}
            onChange={(e) => setDraftSearchTerm(e.target.value)}
          />
          {!isCompact && draftSearchTerm && <button type="button" aria-label="Clear search" onClick={() => setDraftSearchTerm("")} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-secondary/55 hover:bg-secondary/5 hover:text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><X className="h-4 w-4" aria-hidden="true" /></button>}
        </div>
      </div>
      
      <div className="md:w-64">
        <label htmlFor="subject" className={`block text-xs font-black uppercase tracking-[0.12em] ${isCompact ? "mb-1 text-secondary/40" : "mb-2 text-secondary/60"}`}>
          Subject focus
        </label>
        <select
          id="subject"
          className={isCompact ? "block min-h-11 w-full rounded-xl border-secondary/20 bg-surface px-4 py-3 text-sm font-bold text-secondary shadow-inner outline-none transition-all focus:border-primary focus:ring-primary" : "block min-h-12 w-full rounded-xl border border-[#dce8f2] bg-[#f7fbff] px-4 py-3 text-sm font-bold text-secondary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"}
          value={selectedSubject}
          onChange={(e) => handleSubject(e.target.value)}
        >
          {subjects.map((subject) => (
            <option key={subject} value={subject}>
              {subject === "All" ? "All Subjects" : subject}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

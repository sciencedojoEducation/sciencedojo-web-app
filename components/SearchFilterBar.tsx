"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

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

  const subjects = ["All", "Science", "Math", "Physics", "Chemistry", "Biology", "Programming"];

  const isCompact = variant === "compact";

  return (
    <div className={`flex w-full flex-col gap-3 md:flex-row md:gap-4 ${
      isCompact
        ? "rounded-[1.5rem] border border-secondary/10 bg-white p-3 shadow-sm md:p-4"
        : "mb-6 rounded-2xl border border-secondary/10 bg-white p-4 shadow-sm md:mb-8 md:rounded-3xl md:p-6"
    }`}>
      <div className="flex-1">
        <label htmlFor="search" className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-secondary/40">
          Search support
        </label>
        <div className="relative">
          <input
            type="text"
            id="search"
            className="block min-h-11 w-full rounded-xl border-secondary/20 bg-surface px-4 py-3 text-sm font-bold text-secondary shadow-inner outline-none transition-all placeholder:text-secondary/35 focus:border-primary focus:ring-primary"
            placeholder="Search by name, subject, or learning need..."
            value={draftSearchTerm}
            onChange={(e) => setDraftSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="md:w-64">
        <label htmlFor="subject" className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-secondary/40">
          Subject focus
        </label>
        <select
          id="subject"
          className="block min-h-11 w-full rounded-xl border-secondary/20 bg-surface px-4 py-3 text-sm font-bold text-secondary shadow-inner outline-none transition-all focus:border-primary focus:ring-primary"
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

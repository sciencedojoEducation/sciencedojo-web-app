"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function SearchFilterBar() {
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

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-8 w-full p-6 bg-white rounded-3xl shadow-sm border border-secondary/10">
      <div className="flex-1">
        <label htmlFor="search" className="block text-sm font-medium text-secondary mb-1">
          Search Tutors
        </label>
        <div className="relative">
          <input
            type="text"
            id="search"
            className="block w-full rounded-xl border-secondary/20 bg-surface px-4 py-3 text-secondary focus:border-primary focus:ring-primary sm:text-sm shadow-inner transition-all outline-none"
            placeholder="Search by name, subject, or keywords..."
            value={draftSearchTerm}
            onChange={(e) => setDraftSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="md:w-64">
        <label htmlFor="subject" className="block text-sm font-medium text-secondary mb-1">
          Subject Filter
        </label>
        <select
          id="subject"
          className="block w-full rounded-xl border-secondary/20 bg-surface px-4 py-3 text-secondary focus:border-primary focus:ring-primary sm:text-sm shadow-inner outline-none transition-all"
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

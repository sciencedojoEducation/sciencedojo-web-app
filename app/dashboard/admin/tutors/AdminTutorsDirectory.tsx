"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import VerifyButton from "./VerifyButton";
import PendingTutorsTable from "./PendingTutorsTable";
import ReviewModerationPanel, { type AdminTutorReview } from "./ReviewModerationPanel";

type AdminTutor = {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string;
  created_at: string;
  tutorDetail: any;
  application: any;
};

function matchesTutorSearch(tutor: AdminTutor, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  const appData = tutor.application?.data || {};
  const searchable = [
    tutor.full_name,
    tutor.email,
    tutor.tutorDetail?.subjects?.join?.(" "),
    appData.subjects,
    appData.levels,
    appData.onboarding_status,
    tutor.tutorDetail?.is_verified ? "verified" : "pending",
    tutor.application?.status,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchable.includes(normalizedQuery);
}

export default function AdminTutorsDirectory({
  pendingTutors,
  verifiedTutors,
  pendingReviews,
  moderatedReviews,
}: {
  pendingTutors: AdminTutor[];
  verifiedTutors: AdminTutor[];
  pendingReviews: AdminTutorReview[];
  moderatedReviews: AdminTutorReview[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const filteredPendingTutors = useMemo(
    () => pendingTutors.filter((tutor) => matchesTutorSearch(tutor, searchQuery)),
    [pendingTutors, searchQuery],
  );
  const filteredVerifiedTutors = useMemo(
    () => verifiedTutors.filter((tutor) => matchesTutorSearch(tutor, searchQuery)),
    [verifiedTutors, searchQuery],
  );
  const hasResults = filteredPendingTutors.length > 0 || filteredVerifiedTutors.length > 0;

  return (
    <div className="mx-auto min-h-screen max-w-6xl space-y-6 px-3 py-5 sm:px-4 md:p-8 md:space-y-12">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between md:mb-10">
         <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary/70 md:text-xs">ScienceDojo admin</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-800 md:text-3xl">Tutor Command Center</h1>
            <p className="mt-2 max-w-xl text-sm font-medium leading-6 tracking-tight text-slate-500">Review, verify, and manage tutors quickly and confidently.</p>
         </div>

         <div className="flex w-fit items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 shadow-sm md:gap-6 md:px-6">
            <div className="flex items-center gap-2">
               <div className="h-2 w-2 rounded-full bg-amber-500"></div>
               Pending: {pendingTutors.length}
            </div>
            <div className="flex items-center gap-2 border-l border-slate-200 pl-4 md:pl-6">
               <div className="h-2 w-2 rounded-full bg-green-500"></div>
               Verified: {verifiedTutors.length}
            </div>
            <div className="flex items-center gap-2 border-l border-slate-200 pl-4 md:pl-6">
               <div className="h-2 w-2 rounded-full bg-cyan-500"></div>
               Reviews: {pendingReviews.length}
            </div>
         </div>
      </div>

      <div className="relative max-w-xl">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" /></svg>
        </span>
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search tutors"
          className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 text-sm font-bold text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10 md:placeholder:text-transparent"
          aria-label="Search tutors by name, email, subject, or status"
        />
        <span className="pointer-events-none absolute left-11 top-1/2 hidden -translate-y-1/2 text-sm font-bold text-slate-400 md:block">
          {searchQuery ? "" : "Search tutors by name or email"}
        </span>
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            Clear
          </button>
        )}
      </div>

      {!hasResults && (
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-lg font-black text-slate-800">No tutors found</h2>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-500">Try searching by another name, email, or subject.</p>
        </div>
      )}

      <ReviewModerationPanel pendingReviews={pendingReviews} moderatedReviews={moderatedReviews} />

      {filteredPendingTutors.length > 0 && (
        <section className="space-y-4 md:space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="rounded-full border border-amber-100 bg-amber-50 px-4 py-2 text-xs font-black uppercase tracking-tight text-amber-600">
              Pending Review ({filteredPendingTutors.length})
            </h2>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-amber-200 to-transparent"></div>
          </div>

          <PendingTutorsTable tutors={filteredPendingTutors} />
        </section>
      )}

      <section className="space-y-4 md:space-y-6">
        <div className="flex items-center gap-4">
          <h2 className="rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-black uppercase tracking-tight text-slate-800">
            Live Marketplace ({filteredVerifiedTutors.length})
          </h2>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-slate-200 to-transparent"></div>
        </div>

        <div className="grid gap-3 lg:hidden">
          {filteredVerifiedTutors.map((tutor: any) => (
            <article key={tutor.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border-2 border-white bg-slate-100 shadow-sm ring-2 ring-slate-100">
                  <Image src={tutor.avatar_url || "/tutor_placeholder.webp"} alt={tutor.full_name} fill className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-black text-slate-800">{tutor.full_name}</h3>
                  <p className="mt-1 truncate text-xs font-bold text-slate-400">{tutor.email}</p>
                </div>
                <span className="shrink-0 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-blue-600">
                  Verified
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-slate-50 px-3 py-2">
                  <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">Fee</p>
                  <p className="mt-1 text-sm font-black text-slate-800">£{tutor.tutorDetail?.hourly_rate}/hr</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-3 py-2">
                  <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">Rating</p>
                  <p className="mt-1 text-sm font-black text-slate-800">⭐ {tutor.tutorDetail?.rating || "N/A"}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-2">
                <a href={`/tutor/${tutor.id}`} target="_blank" className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-slate-100 px-4 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-slate-600 transition-colors hover:bg-slate-200">
                  View profile
                </a>
                <VerifyButton tutorId={tutor.id} isVerified={true} />
              </div>
            </article>
          ))}
          {filteredVerifiedTutors.length === 0 && hasResults && (
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-8 text-center text-sm font-bold text-slate-400 shadow-sm">
              No verified tutors match this search.
            </div>
          )}
        </div>

        <div className="hidden overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/50 lg:block">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/30 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <th className="p-8">Expert Profile</th>
                <th className="p-8">Marketplace Stats</th>
                <th className="p-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="font-medium text-slate-600">
              {filteredVerifiedTutors.map((tutor: any) => (
                <tr key={tutor.id} className="group border-b border-slate-100 transition-all last:border-0 hover:bg-slate-50/50">
                  <td className="p-8">
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <div className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-white bg-slate-100 shadow-md ring-2 ring-slate-100">
                          <Image src={tutor.avatar_url || "/tutor_placeholder.webp"} alt={tutor.full_name} fill className="object-cover" />
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 z-10 flex items-center justify-center rounded-full border-2 border-white bg-blue-500 p-1 text-white shadow-sm">
                          <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </div>
                      </div>
                      <div>
                        <div className="text-lg font-black tracking-tight text-slate-800">{tutor.full_name}</div>
                        <div className="text-xs font-bold text-slate-400">{tutor.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-8">
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-slate-300">Fee</p>
                        <p className="font-black text-slate-800">£{tutor.tutorDetail?.hourly_rate}/hr</p>
                      </div>
                      <div>
                        <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-slate-300">Rating</p>
                        <p className="font-black text-slate-800">⭐ {tutor.tutorDetail?.rating || "N/A"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="space-x-2 p-8 text-right">
                    <a href={`/tutor/${tutor.id}`} target="_blank" className="inline-block rounded-xl bg-slate-100 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all hover:bg-slate-200">
                      View profile
                    </a>
                    <VerifyButton tutorId={tutor.id} isVerified={true} />
                  </td>
                </tr>
              ))}
              {filteredVerifiedTutors.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-12 text-center text-slate-400 italic">No verified tutors match this search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

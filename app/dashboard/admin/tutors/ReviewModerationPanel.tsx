"use client";

import { useState } from "react";
import AdminReviewCard, { type AdminTutorReview } from "@/components/AdminReviewCard";

export type { AdminTutorReview };

export default function ReviewModerationPanel({
  pendingReviews,
  moderatedReviews,
}: {
  pendingReviews: AdminTutorReview[];
  moderatedReviews: AdminTutorReview[];
}) {
  const [showModerated, setShowModerated] = useState(false);

  return (
    <section className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <h2 className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-4 py-2 text-xs font-black uppercase tracking-tight text-cyan-700">
            Pending Reviews
            <span className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-cyan-600 px-1.5 text-[10px] text-white">
              {pendingReviews.length}
            </span>
          </h2>
          <div className="hidden h-[1px] flex-1 bg-gradient-to-r from-cyan-200 to-transparent md:block"></div>
        </div>
        <button
          type="button"
          onClick={() => setShowModerated((current) => !current)}
          className="w-fit rounded-full border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 transition-colors hover:bg-slate-50"
        >
          {showModerated ? "Hide reviewed" : `Reviewed reviews (${moderatedReviews.length})`}
        </button>
      </div>

      {pendingReviews.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {pendingReviews.map((review) => (
            <AdminReviewCard key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white p-5 text-sm font-bold text-slate-400 shadow-sm">
          No reviews are waiting for moderation.
        </div>
      )}

      {showModerated && (
        <div className="grid gap-3 md:grid-cols-2">
          {moderatedReviews.length > 0 ? (
            moderatedReviews.map((review) => (
              <AdminReviewCard key={review.id} review={review} compact />
            ))
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white p-5 text-sm font-bold text-slate-400 shadow-sm md:col-span-2">
              No approved or rejected reviews yet.
            </div>
          )}
        </div>
      )}
    </section>
  );
}

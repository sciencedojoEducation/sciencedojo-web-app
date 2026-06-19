"use client";

import { useState, useTransition } from "react";
import { deleteTutorReview, moderateTutorReview } from "@/app/dashboard/admin/tutors/actions";
import { ReviewStatusBadge, StarRating, type ReviewStatus } from "./ReviewTrustUI";

export type AdminTutorReview = {
  id: string;
  tutor_id: string;
  tutorName: string;
  studentName: string;
  rating: number;
  comment: string | null;
  status: ReviewStatus;
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
};

export default function AdminReviewCard({ review, compact = false }: { review: AdminTutorReview; compact?: boolean }) {
  const [adminNote, setAdminNote] = useState(review.admin_note || "");
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  const runModeration = (status: "approved" | "rejected") => {
    setError(null);
    startTransition(async () => {
      const result = await moderateTutorReview(review.id, status, adminNote);
      if (result?.error) setError(result.error);
      else setShowDeleteModal(false);
    });
  };

  const runDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteTutorReview(review.id);
      if (result?.error) setError(result.error);
      else setShowDeleteModal(false);
    });
  };

  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <ReviewStatusBadge status={review.status} />
            <StarRating rating={review.rating} />
          </div>
          <h3 className="mt-3 text-base font-black text-slate-800">
            {review.tutorName}
          </h3>
          <p className="mt-1 text-xs font-bold text-slate-400">
            From {review.studentName} · {new Date(review.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
      </div>

      {review.comment ? (
        <p className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium leading-6 text-slate-600">
          “{review.comment}”
        </p>
      ) : (
        <p className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-400">
          No written comment.
        </p>
      )}

      {!compact && (
        <label className="mt-4 block">
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Admin note</span>
          <textarea
            value={adminNote}
            onChange={(event) => setAdminNote(event.target.value)}
            disabled={isPending}
            className="mt-2 h-20 w-full resize-none rounded-2xl border border-slate-200 bg-white p-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10"
            placeholder="Optional internal context..."
          />
        </label>
      )}

      {review.reviewed_at && (
        <p className="mt-3 text-[10px] font-black uppercase tracking-[0.14em] text-slate-300">
          Reviewed {new Date(review.reviewed_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
        </p>
      )}

      {error && (
        <p className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-600">
          {error}
        </p>
      )}

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => runModeration("approved")}
          disabled={isPending || review.status === "approved"}
          className="min-h-11 rounded-2xl bg-primary px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-45"
        >
          Approve
        </button>
        <button
          type="button"
          onClick={() => runModeration("rejected")}
          disabled={isPending || review.status === "rejected"}
          className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Reject / Hide
        </button>
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          disabled={isPending}
          className="min-h-11 rounded-2xl border border-red-100 bg-red-50 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Delete
        </button>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-black text-slate-900">Delete review permanently?</h3>
            <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
              This permanently deletes the review. Hiding is recommended unless this is spam or test data.
            </p>
            <div className="mt-6 grid gap-2">
              <button
                type="button"
                onClick={() => runModeration("rejected")}
                disabled={isPending || review.status === "rejected"}
                className="min-h-11 rounded-2xl bg-secondary px-4 py-3 text-sm font-black text-white transition-colors hover:bg-secondary/90 disabled:opacity-45"
              >
                Hide instead
              </button>
              <button
                type="button"
                onClick={runDelete}
                disabled={isPending}
                className="min-h-11 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-black text-red-600 transition-colors hover:bg-red-100 disabled:opacity-45"
              >
                Delete permanently
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isPending}
                className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-45"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

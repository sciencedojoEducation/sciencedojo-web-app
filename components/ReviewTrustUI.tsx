export type ReviewStatus = "pending" | "approved" | "rejected";

export function getReviewStatusLabel(status: ReviewStatus) {
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Hidden";
  return "Pending";
}

export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  const tone =
    status === "approved"
      ? "border-green-100 bg-green-50 text-green-700"
      : status === "rejected"
        ? "border-slate-200 bg-slate-100 text-slate-500"
        : "border-amber-100 bg-amber-50 text-amber-700";

  return (
    <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${tone}`}>
      {getReviewStatusLabel(status)}
    </span>
  );
}

export function StarRating({
  rating,
  size = "sm",
  muted = false,
}: {
  rating: number;
  size?: "sm" | "md";
  muted?: boolean;
}) {
  const sizeClass = size === "md" ? "h-4 w-4 md:h-5 md:w-5" : "h-4 w-4";

  return (
    <div className="flex items-center gap-0.5 text-amber-400" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg key={star} className={`${sizeClass} ${!muted && star <= Math.round(rating) ? "fill-current" : "text-slate-200"}`} viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function RatingTrustTooltip() {
  return (
    <span className="group relative inline-flex">
      <span
        tabIndex={0}
        className="inline-flex h-5 w-5 cursor-help items-center justify-center rounded-full border border-primary/15 bg-primary/5 text-[11px] font-black text-primary/70 outline-none transition-colors hover:bg-primary/10 focus:bg-primary/10"
        aria-label="Ratings are reviewed by ScienceDojo before appearing publicly."
      >
        i
      </span>
      <span className="pointer-events-none absolute left-1/2 top-7 z-20 hidden w-64 -translate-x-1/2 rounded-2xl border border-secondary/10 bg-white p-3 text-xs font-bold leading-5 text-secondary/60 shadow-xl shadow-secondary/10 group-hover:block group-focus-within:block">
        Ratings are reviewed by ScienceDojo before appearing publicly.
      </span>
    </span>
  );
}

export function getRatingSummary(rating: number, reviewCount: number) {
  if (reviewCount <= 0) {
    return {
      title: "New tutor",
      detail: "No verified public reviews yet",
    };
  }

  return {
    title: `${Number(rating).toFixed(1)} Excellent`,
    detail: `Based on ${reviewCount} verified student review${reviewCount === 1 ? "" : "s"}`,
  };
}

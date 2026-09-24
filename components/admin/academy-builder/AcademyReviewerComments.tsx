"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { postAcademyReviewComment } from "@/app/academy/review/actions";
import type { AcademyReviewComment } from "@/lib/academy-review";

export default function AcademyReviewerComments({
  invitationId,
  lessonId,
  blocks,
  comments,
}: {
  invitationId: string;
  lessonId: string;
  blocks: { id: string; label: string }[];
  comments: AcademyReviewComment[];
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [blockId, setBlockId] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [showResolved, setShowResolved] = useState(false);
  const [pending, startTransition] = useTransition();
  const lessonComments = comments.filter(
    (comment) => comment.lesson_id === lessonId && (showResolved || !comment.resolved_at),
  );
  return (
    <aside className="border-t border-black/10 bg-[#F8F9FB] p-5 lg:min-h-screen lg:w-[340px] lg:shrink-0 lg:border-l lg:border-t-0" aria-label="Review comments">
      <h2 className="text-lg font-semibold">Review comments</h2>
      <p className="mt-1 text-xs text-secondary/60">Feedback is attached to this saved course snapshot.</p>
      <label className="mt-4 flex min-h-11 items-center gap-2 text-xs">
        <input type="checkbox" checked={showResolved} onChange={(event) => setShowResolved(event.target.checked)} />
        Show resolved
      </label>
      <div className="max-h-[45vh] space-y-3 overflow-y-auto py-3 lg:max-h-[55vh]">
        {lessonComments.map((comment) => (
          <article key={comment.id} className="rounded-lg border border-black/10 bg-white p-3 text-xs">
            <p className="font-semibold text-primary">{comment.block_id ? <Link href={`#academy-block-${comment.block_id}`} className="underline underline-offset-2">{blocks.find((block) => block.id === comment.block_id)?.label || "Block"}</Link> : "Lesson"}{comment.resolved_at ? " · Resolved" : ""}</p>
            <p className="mt-2 whitespace-pre-wrap break-words text-secondary">{comment.body}</p>
            <p className="mt-2 text-[10px] text-secondary/50">{new Date(comment.created_at).toLocaleString()}</p>
            <button type="button" onClick={() => setReplyTo(comment.id)} className="mt-2 min-h-11 text-xs font-semibold text-primary underline underline-offset-2">Reply</button>
          </article>
        ))}
        {!lessonComments.length ? <p className="py-8 text-center text-xs text-secondary/50">No comments on this lesson yet.</p> : null}
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            const result = await postAcademyReviewComment({ invitationId, lessonId, blockId: blockId || null, parentId: replyTo, body });
            setMessage(result.message);
            if (result.ok) { setBody(""); setReplyTo(null); router.refresh(); }
          });
        }}
        className="space-y-3 border-t border-black/10 pt-4"
      >
        {replyTo ? <button type="button" onClick={() => setReplyTo(null)} className="text-xs text-primary">Replying to a comment · Cancel</button> : null}
        <label className="block text-xs font-semibold">
          Comment on
          <select value={blockId} onChange={(event) => setBlockId(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border bg-white px-3 text-sm">
            <option value="">Entire lesson</option>
            {blocks.map((block) => <option key={block.id} value={block.id}>{block.label}</option>)}
          </select>
        </label>
        <label className="block text-xs font-semibold">
          Your feedback
          <textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={2000} rows={4} className="mt-2 w-full rounded-lg border bg-white p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary" />
        </label>
        <button type="submit" disabled={pending || !body.trim()} className="min-h-11 rounded-lg bg-primary px-4 text-xs font-semibold text-white disabled:opacity-40">{pending ? "Posting…" : "Post comment"}</button>
        {message ? <p role="status" className="text-xs text-secondary/65">{message}</p> : null}
      </form>
    </aside>
  );
}

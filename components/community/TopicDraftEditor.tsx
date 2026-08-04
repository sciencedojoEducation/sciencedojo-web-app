"use client";

import { useState } from "react";
import Markdown from "@/components/community/Markdown";
import { moderateCommunityContent, saveCommunityTopic } from "@/app/dashboard/admin/community/actions";

type EditorTopic = {
  id: string;
  title: string;
  body: string;
  seeded_author_name: string | null;
  category?: { name?: string } | { name?: string }[] | null;
};

export function TopicDraftEditor({ topic }: { topic: EditorTopic }) {
  const [title, setTitle] = useState(topic.title);
  const [body, setBody] = useState(topic.body);
  const categoryName = Array.isArray(topic.category) ? topic.category[0]?.name : topic.category?.name;

  return (
    <article className="rounded-3xl border border-secondary/10 bg-white p-5">
      <div className="flex flex-wrap items-center gap-2 text-xs font-black text-primary">
        <span>{topic.seeded_author_name || "Member"}</span>
        {topic.seeded_author_name && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-widest">Editorial draft</span>}
        {categoryName && <span className="text-secondary/40">{categoryName}</span>}
      </div>

      <form action={saveCommunityTopic} className="mt-4">
        <input type="hidden" name="id" value={topic.id} />
        <input name="title" value={title} onChange={(e) => setTitle(e.target.value)} minLength={10} maxLength={140} required className="w-full rounded-xl border border-secondary/10 p-3 font-black" />

        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <textarea name="body" value={body} onChange={(e) => setBody(e.target.value)} rows={14} minLength={20} maxLength={8000} required className="w-full rounded-xl border border-secondary/10 p-3 font-mono text-sm leading-6" placeholder="Write in Markdown: **bold**, - bullet, ## heading, blank line for spacing" />
          <div className="overflow-auto rounded-xl border border-secondary/10 bg-[#f7fbff] p-4 text-sm font-semibold leading-7 text-secondary/72">
            <Markdown>{body || "_Preview appears here…_"}</Markdown>
          </div>
        </div>

        <p className="mt-2 text-xs font-semibold text-secondary/40">Markdown: <b>**bold**</b>, <i>*italic*</i>, <b>-</b> bullets, <b>1.</b> numbered, <b>##</b> headings, blank line = new paragraph.</p>

        <div className="mt-3 flex flex-wrap gap-2">
          <button name="intent" value="save" className="rounded-full border border-secondary/20 px-4 py-2 text-xs font-black">Save draft</button>
          <button name="intent" value="publish" className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-black text-white">Save &amp; Publish</button>
        </div>
      </form>

      <form action={moderateCommunityContent} className="mt-2 flex flex-wrap gap-2">
        <input type="hidden" name="id" value={topic.id} />
        <input type="hidden" name="kind" value="topic" />
        <button name="status" value="rejected" className="rounded-full bg-red-600 px-4 py-2 text-xs font-black text-white">Reject</button>
        <button name="status" value="hidden" className="rounded-full bg-secondary px-4 py-2 text-xs font-black text-white">Hide</button>
      </form>
    </article>
  );
}

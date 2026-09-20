import Link from "next/link";
import { BadgeCheck, ChevronRight, Clock3, MessageCircle, Pin, ShieldCheck } from "lucide-react";
import type { CommunityCategory, CommunityTopic } from "@/lib/community";
import { displayAuthor } from "@/lib/community";

export function CategoryCard({ category, topicCount }: { category: CommunityCategory; topicCount?: number }) {
  return <Link href={`/community/${category.slug}`} className="group rounded-3xl border border-secondary/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg">
    <div className="flex items-start justify-between gap-4"><div><span className="rounded-full bg-primary/8 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">{category.stage}</span><h3 className="mt-4 text-xl font-black tracking-tight">{category.name}</h3></div><ChevronRight className="mt-1 text-secondary/25 transition group-hover:translate-x-1 group-hover:text-primary" /></div>
    <p className="mt-3 text-sm font-semibold leading-6 text-secondary/55">{category.description}</p>
    {typeof topicCount === "number" && <p className="mt-4 text-xs font-bold text-secondary/35">{topicCount} discussions</p>}
  </Link>;
}

export function TopicCard({ topic }: { topic: CommunityTopic }) {
  return <article>
    <Link
      href={`/community/topic/${topic.slug}`}
      aria-label={`Open discussion: ${topic.title}`}
      className="group block cursor-pointer rounded-3xl border border-secondary/10 bg-white p-5 shadow-sm outline-none transition duration-200 motion-safe:hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg focus-visible:border-primary/40 focus-visible:ring-4 focus-visible:ring-primary/20 md:p-6"
    >
      <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest">
        <span className="rounded-full bg-primary/8 px-3 py-1 text-primary">{topic.category.name}</span>
        {topic.is_pinned && <span className="flex items-center gap-1 text-amber-600"><Pin size={12}/> Pinned</span>}
        {topic.status === "locked" && <span className="text-secondary/45">Locked</span>}
      </div>
      <h2 className="mt-3 text-xl font-black tracking-tight transition-colors group-hover:text-primary group-focus-visible:text-primary md:text-2xl">{topic.title}</h2>
      <p className="mt-3 line-clamp-2 text-sm font-semibold leading-6 text-secondary/55">{topic.body}</p>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold text-secondary/38">
          <span className="flex items-center gap-1.5"><ShieldCheck size={14}/>{displayAuthor(topic.author, topic.seeded_author_name)}</span>
          {topic.author?.is_verified && <span className="flex items-center gap-1 text-primary"><BadgeCheck size={14}/>{topic.author.badge}</span>}
          <span className="flex items-center gap-1.5"><MessageCircle size={14}/>{topic.reply_count} replies</span>
          <time className="flex items-center gap-1.5"><Clock3 size={14}/>{new Date(topic.last_activity_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</time>
        </div>
        <span className="flex items-center gap-1 text-xs font-black text-primary">
          Open discussion
          <ChevronRight size={16} className="transition-transform group-hover:translate-x-1 group-focus-visible:translate-x-1" />
        </span>
      </div>
    </Link>
  </article>;
}

export function CommunityNotice() {
  return <div className="rounded-3xl border border-cyan-200 bg-cyan-50 p-5 text-sm font-semibold leading-6 text-secondary/65"><div className="flex items-center gap-2 font-black text-secondary"><ShieldCheck className="text-primary" size={20}/>A moderated, pseudonymous community for students aged 13+</div><p className="mt-2">Never share your real name, school, location, contact details, candidate information, or private messages. Posts may be reviewed before publication.</p><Link href="/community/guidelines" className="mt-3 inline-flex font-black text-primary hover:underline">Read the community guidelines</Link></div>;
}

import Link from "next/link";
import type { LearningArticle } from "@/lib/learning-hub";

export default function ArticleCard({ article, featured = false }: { article: LearningArticle; featured?: boolean }) {
  return (
    <Link
      href={`/learning-hub/${article.slug}`}
      className={`group block rounded-3xl border border-secondary/10 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md ${
        featured ? "p-7" : "p-6"
      }`}
    >
      <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-[0.18em] text-secondary/40">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">{article.category}</span>
        <span>{article.readingTime}</span>
      </div>
      <h2 className={`${featured ? "mt-5 text-3xl" : "mt-4 text-xl"} font-black tracking-tight text-secondary group-hover:text-primary`}>
        {article.title}
      </h2>
      <p className="mt-4 leading-7 text-secondary/60">{article.excerpt}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {article.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="rounded-full bg-surface px-3 py-1 text-xs font-bold text-secondary/45">
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
}

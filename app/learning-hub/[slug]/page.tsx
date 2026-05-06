import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import ArticleCard from "@/components/learning-hub/ArticleCard";
import LearningHubCtas from "@/components/learning-hub/LearningHubCtas";
import { faqJsonLd } from "@/lib/seo";
import {
  articleJsonLd,
  createArticleMetadata,
  getRelatedArticles,
  learningArticleMap,
  learningArticles,
  type LearningArticle,
} from "@/lib/learning-hub";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return learningArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = learningArticleMap.get(slug);

  if (!article) {
    return {};
  }

  return createArticleMetadata(article);
}

function ArticleMeta({ article }: { article: LearningArticle }) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-3 text-xs font-black uppercase tracking-[0.16em] text-white/55">
      <span className="rounded-full bg-white/10 px-3 py-1 text-cyan-100">{article.category}</span>
      <span>{article.author}</span>
      <span>{new Date(article.publishedDate).toLocaleDateString("en-GB", { dateStyle: "medium" })}</span>
      <span>{article.readingTime}</span>
    </div>
  );
}

export default async function LearningArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = learningArticleMap.get(slug);

  if (!article) {
    notFound();
  }

  const relatedArticles = getRelatedArticles(article);

  return (
    <article className="bg-background text-secondary">
      <JsonLd data={articleJsonLd(article)} />
      {article.faqs && <JsonLd data={faqJsonLd(article.faqs)} />}

      <section className="relative overflow-hidden bg-gradient-to-br from-[#002244] via-[#004488] to-[#0066cc] px-4 py-20 text-white md:px-8 md:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(0,229,194,0.24)_0%,_transparent_58%)]" />
        <div className="relative mx-auto max-w-4xl">
          <Link href="/learning-hub" className="text-sm font-black uppercase tracking-[0.16em] text-cyan-100/80 hover:text-white">
            Learning Hub
          </Link>
          <h1 className="mt-5 text-4xl font-black tracking-tight md:text-6xl">{article.title}</h1>
          <p className="mt-6 text-lg leading-8 text-white/75">{article.excerpt}</p>
          <ArticleMeta article={article} />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:px-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-8">
          {article.sections.map((section) => (
            <section key={section.heading} className="rounded-3xl border border-secondary/10 bg-white p-7 shadow-sm">
              <h2 className="text-2xl font-black tracking-tight">{section.heading}</h2>
              <p className="mt-4 text-lg leading-8 text-secondary/65">{section.body}</p>
              {section.bullets && (
                <ul className="mt-5 space-y-3">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3 leading-7 text-secondary/65">
                      <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <section className="rounded-3xl border border-secondary/10 bg-white p-7 shadow-sm">
            <h2 className="text-2xl font-black tracking-tight">Helpful next steps</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {article.internalLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-2xl border border-secondary/10 bg-surface p-4 font-black text-secondary transition-colors hover:border-primary/30 hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </section>

          {article.faqs && (
            <section className="rounded-3xl border border-secondary/10 bg-white p-7 shadow-sm">
              <h2 className="text-2xl font-black tracking-tight">FAQ</h2>
              <div className="mt-5 divide-y divide-secondary/10">
                {article.faqs.map((faq) => (
                  <div key={faq.question} className="py-5 first:pt-0 last:pb-0">
                    <h3 className="font-black">{faq.question}</h3>
                    <p className="mt-3 leading-7 text-secondary/65">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="h-fit space-y-5 lg:sticky lg:top-28">
          <div className="rounded-3xl bg-secondary p-6 text-white shadow-2xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-white/45">ScienceDojo</p>
            <h2 className="mt-3 text-2xl font-black">Need help applying this?</h2>
            <p className="mt-4 leading-7 text-white/70">A tutor can help turn this guide into a clear weekly practice plan.</p>
            <LearningHubCtas variants={article.ctas.slice(0, 1)} source={`learning_hub_${article.slug}`} />
          </div>
          <div className="rounded-3xl border border-secondary/10 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black">Explore topics</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-surface px-3 py-1 text-xs font-bold text-secondary/50">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="border-y border-secondary/10 bg-surface px-4 py-14 md:px-8">
        <div className="mx-auto max-w-7xl">
          <LearningHubCtas variants={article.ctas} source={`learning_hub_${article.slug}_bottom`} />
        </div>
      </section>

      {relatedArticles.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-14 md:px-8">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">Related Articles</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight">Keep learning</h2>
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {relatedArticles.map((related) => (
              <ArticleCard key={related.slug} article={related} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

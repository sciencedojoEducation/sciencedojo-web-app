import type { Metadata } from "next";
import Link from "next/link";
import ArticleCard from "@/components/learning-hub/ArticleCard";
import AiPracticeStudioCtaLink from "@/components/analytics/AiPracticeStudioCtaLink";
import LearningHubCtas from "@/components/learning-hub/LearningHubCtas";
import { learningArticles, learningHubCategories, learningHubUrl } from "@/lib/learning-hub";
import FeatureUnavailable from "@/components/FeatureUnavailable";
import { isFeatureEnabled } from "@/lib/feature-flags";

export const metadata: Metadata = {
  title: "Learning Hub | ScienceDojo",
  description: "Study guides, parent resources, AI learning ideas, GCSE revision help, and practical learning systems from ScienceDojo.",
  alternates: {
    canonical: learningHubUrl(),
  },
  openGraph: {
    title: "Learning Hub | ScienceDojo",
    description: "Study guides, parent resources, AI learning ideas, and revision materials for confident learners.",
    url: learningHubUrl(),
    type: "website",
  },
};

type PageProps = {
  searchParams: Promise<{ category?: string; q?: string }>;
};

export default async function LearningHubPage({ searchParams }: PageProps) {
  const enabled = await isFeatureEnabled("learning_hub_enabled");
  if (!enabled) {
    return (
      <FeatureUnavailable
        eyebrow="Learning Hub"
        title="The Learning Hub is almost ready."
        message="We are preparing these guides carefully before opening them to families."
      />
    );
  }

  const params = await searchParams;
  const selectedCategory = learningHubCategories.find((category) => category === params.category);
  const query = (params.q || "").trim().toLowerCase();
  const featuredArticles = learningArticles.filter((article) => article.featured).slice(0, 3);
  const filteredArticles = learningArticles.filter((article) => {
    const matchesCategory = !selectedCategory || article.category === selectedCategory;
    const searchableText = [article.title, article.excerpt, article.category, ...article.tags].join(" ").toLowerCase();
    const matchesQuery = !query || searchableText.includes(query);
    return matchesCategory && matchesQuery;
  });

  return (
    <main className="bg-background text-secondary">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#002244] via-[#004488] to-[#0066cc] px-4 py-20 text-white md:px-8 md:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(0,229,194,0.24)_0%,_transparent_58%)]" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-100/80">ScienceDojo Learning Hub</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">Study guides, parent resources, and smarter revision systems.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/75">
            Practical articles for students and parents covering GCSE, IB, A-Level, AI-aware study, revision technique, and online tutoring.
          </p>
          <div className="mt-9 max-w-3xl rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
            <form className="grid gap-3 md:grid-cols-[1fr_auto]">
              <input
                name="q"
                defaultValue={params.q || ""}
                placeholder="Search study guides..."
                className="rounded-2xl border border-white/10 bg-white px-5 py-4 font-bold text-secondary outline-none placeholder:text-secondary/30"
              />
              {selectedCategory && <input type="hidden" name="category" value={selectedCategory} />}
              <button className="rounded-2xl bg-primary px-7 py-4 text-sm font-black uppercase tracking-[0.14em] text-white">
                Search
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <div className="flex flex-wrap gap-3">
          <Link
            href="/learning-hub"
            className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.14em] ${
              !selectedCategory ? "bg-primary text-white" : "border border-secondary/10 bg-white text-secondary/60"
            }`}
          >
            All
          </Link>
          {learningHubCategories.map((category) => (
            <Link
              key={category}
              href={`/learning-hub?category=${encodeURIComponent(category)}`}
              className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.14em] ${
                selectedCategory === category ? "bg-primary text-white" : "border border-secondary/10 bg-white text-secondary/60"
              }`}
            >
              {category}
            </Link>
          ))}
        </div>
      </section>

      {!selectedCategory && !query && (
        <section className="mx-auto max-w-7xl px-4 pb-12 md:px-8">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">Featured</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">Start here</h2>
            </div>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {featuredArticles.map((article) => (
              <ArticleCard key={article.slug} article={article} featured />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 pb-12 md:px-8">
        <div className="rounded-3xl bg-secondary p-7 text-white shadow-xl md:flex md:items-center md:justify-between md:gap-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-100/70">Featured free tool</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">PracticeDojo</h2>
            <p className="mt-3 max-w-2xl leading-7 text-white/70">
              Generate targeted practice questions by curriculum, subject, and topic.
            </p>
          </div>
          <AiPracticeStudioCtaLink
            href="/ai-practice-studio"
            cta="try_free_tool"
            source="learning_hub_featured_tool"
            className="mt-6 inline-flex rounded-2xl bg-primary px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-white md:mt-0"
          >
            Try Free Tool
          </AiPracticeStudioCtaLink>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 md:px-8">
        <div className="mb-6">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">Latest Articles</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight">{selectedCategory || query ? "Filtered guides" : "All learning guides"}</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
        {filteredArticles.length === 0 && (
          <div className="rounded-3xl border border-secondary/10 bg-white p-10 text-center font-bold text-secondary/45">
            No articles matched that search yet.
          </div>
        )}
      </section>

      <section className="border-t border-secondary/10 bg-surface px-4 py-14 md:px-8">
        <div className="mx-auto max-w-7xl">
          <LearningHubCtas variants={["assessment", "tutor", "questions"]} source="learning_hub_index" />
        </div>
      </section>
    </main>
  );
}

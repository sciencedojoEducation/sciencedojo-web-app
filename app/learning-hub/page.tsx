import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenText, MessagesSquare, Newspaper, Search, ShieldCheck, Sparkles, TimerReset } from "lucide-react";
import ArticleCard from "@/components/learning-hub/ArticleCard";
import AiPracticeStudioCtaLink from "@/components/analytics/AiPracticeStudioCtaLink";
import { learningArticles, learningHubCategories, learningHubUrl } from "@/lib/learning-hub";
import FeatureUnavailable from "@/components/FeatureUnavailable";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { getCommunityTopics } from "@/lib/community";

export const metadata: Metadata = {
  title: "Learning Hub | ScienceDojo",
  description: "Study guides, parent resources, GCSE and A-Level Exam Community discussions, official exam updates, and practical learning tools from ScienceDojo.",
  alternates: {
    canonical: learningHubUrl(),
  },
  openGraph: {
    title: "Learning Hub | ScienceDojo",
    description: "Study guides, parent resources, Exam Community discussions, official updates, and revision materials for confident learners.",
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
  const filteredArticles = learningArticles.filter((article) => {
    const matchesCategory = !selectedCategory || article.category === selectedCategory;
    const searchableText = [article.title, article.excerpt, article.category, ...article.tags].join(" ").toLowerCase();
    const matchesQuery = !query || searchableText.includes(query);
    return matchesCategory && matchesQuery;
  });
  const [showCommunity, showFocusDojo, showPracticeDojo] = await Promise.all([
    isFeatureEnabled("community_enabled"),
    isFeatureEnabled("focus_dojo_enabled"),
    isFeatureEnabled("practice_dojo_enabled"),
  ]);
  const showTools = showFocusDojo || showPracticeDojo;
  const recentTopics = showCommunity ? await getCommunityTopics({ limit: 2 }) : [];
  const guideHref = (category?: string) => {
    const search = new URLSearchParams();
    if (category) search.set("category", category);
    if (params.q?.trim()) search.set("q", params.q.trim());
    return `/learning-hub${search.size ? `?${search.toString()}` : ""}#guides`;
  };

  return (
    <main className="bg-background text-secondary">
      <section className="relative overflow-hidden bg-[#e8f5ff] px-4 py-14 md:px-8 md:py-20" aria-labelledby="resources-heading">
        <div className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full border-[48px] border-white/60" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-sm font-bold text-primary">ScienceDojo Resources</p>
          <h1 id="resources-heading" className="mt-3 max-w-3xl text-4xl font-black leading-tight tracking-tight text-secondary md:text-5xl">Find the right help for your next study step.</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-secondary/70">Read a practical guide, learn from exam discussions, or use a free tool to get started.</p>
          <nav className={`mt-8 grid gap-3 ${showCommunity && showTools ? "sm:grid-cols-3" : "sm:grid-cols-2"}`} aria-label="Explore resources">
            <a href="#guides" className="group flex min-h-20 items-center gap-3 rounded-2xl border border-[#c5e1f5] bg-white px-4 py-3 shadow-sm hover:border-primary/40"><BookOpenText className="h-6 w-6 shrink-0 text-primary" aria-hidden="true" /><span className="flex-1 text-sm font-extrabold text-secondary">Study guides</span><ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" aria-hidden="true" /></a>
            {showCommunity && <a href="#community" className="group flex min-h-20 items-center gap-3 rounded-2xl border border-[#c5e1f5] bg-white px-4 py-3 shadow-sm hover:border-primary/40"><MessagesSquare className="h-6 w-6 shrink-0 text-primary" aria-hidden="true" /><span className="flex-1 text-sm font-extrabold text-secondary">Exam Community</span><ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" aria-hidden="true" /></a>}
            {showTools && <a href="#tools" className="group flex min-h-20 items-center gap-3 rounded-2xl border border-[#c5e1f5] bg-white px-4 py-3 shadow-sm hover:border-primary/40"><TimerReset className="h-6 w-6 shrink-0 text-primary" aria-hidden="true" /><span className="flex-1 text-sm font-extrabold text-secondary">Free study tools</span><ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" aria-hidden="true" /></a>}
          </nav>
        </div>
      </section>

      <section id="guides" className="scroll-mt-24 bg-white px-4 py-14 md:px-8 md:py-18" aria-labelledby="guides-heading">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-[1fr_.8fr] lg:items-end">
            <div><p className="text-sm font-bold text-primary">Learn something useful</p><h2 id="guides-heading" className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Study guides</h2><p className="mt-3 max-w-xl leading-7 text-secondary/65">Straightforward advice on revision, subjects and supporting learning at home.</p></div>
            <form action="/learning-hub#guides" className="flex flex-col gap-2 sm:flex-row" role="search" aria-label="Search study guides">
              <label htmlFor="guide-search" className="sr-only">Search study guides</label>
              <div className="flex min-h-12 flex-1 items-center gap-2 rounded-xl border border-secondary/20 bg-white px-4 focus-within:ring-2 focus-within:ring-primary"><Search className="h-5 w-5 shrink-0 text-secondary/45" aria-hidden="true" /><input id="guide-search" name="q" defaultValue={params.q || ""} placeholder="Search study guides" className="min-w-0 flex-1 bg-transparent py-3 text-sm font-medium outline-none placeholder:text-secondary/45" /></div>
              {selectedCategory && <input type="hidden" name="category" value={selectedCategory} />}
              <button className="min-h-12 rounded-xl bg-primary px-6 py-3 text-sm font-extrabold text-white hover:bg-primary-hover">Search</button>
            </form>
          </div>
          <div className="mt-7 flex flex-wrap gap-2" aria-label="Filter study guides by category">
            <Link href={guideHref()} aria-current={!selectedCategory ? "page" : undefined} className={`rounded-full px-4 py-2 text-sm font-bold ${!selectedCategory ? "bg-[#0753a2] text-white" : "border border-secondary/15 bg-[#f4f8fc] text-secondary/70 hover:border-primary/40"}`}>All guides</Link>
            {learningHubCategories.map((category) => <Link key={category} href={guideHref(category)} aria-current={selectedCategory === category ? "page" : undefined} className={`rounded-full px-4 py-2 text-sm font-bold ${selectedCategory === category ? "bg-[#0753a2] text-white" : "border border-secondary/15 bg-[#f4f8fc] text-secondary/70 hover:border-primary/40"}`}>{category}</Link>)}
          </div>
          <p className="mt-7 text-sm font-semibold text-secondary/55">{filteredArticles.length} {filteredArticles.length === 1 ? "guide" : "guides"}{query ? ` matching “${params.q?.trim()}”` : ""}</p>
          <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{filteredArticles.map((article, index) => <div key={article.slug} className={index === 0 && !selectedCategory && !query ? "lg:col-span-2" : ""}><ArticleCard article={article} featured={index === 0 && !selectedCategory && !query} /></div>)}</div>
          {filteredArticles.length === 0 && <div className="mt-4 rounded-2xl border border-dashed border-secondary/20 bg-[#f4f8fc] p-8 text-center"><p className="font-bold text-secondary/65">No guides matched. Try a different term or category.</p><Link href="/learning-hub#guides" className="mt-3 inline-block text-sm font-bold text-primary hover:underline">View all guides</Link></div>}
        </div>
      </section>

      {showCommunity && (
        <section id="community" className="scroll-mt-20 bg-[#0b2849] px-4 py-14 text-white md:px-8 md:py-18" aria-labelledby="community-heading">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="text-sm font-bold text-cyan-200">Learn from each other</p>
                <h2 id="community-heading" className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Exam Community</h2>
                <p className="mt-3 max-w-2xl leading-7 text-white/75">Read moderated GCSE and A-Level discussions, ask a revision question, and check sourced official exam updates.</p>
              </div>
              <Link href="/community" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#4bd5ef] px-5 py-3 text-sm font-extrabold text-[#0b2849] hover:bg-[#9cebf7]">Explore the community <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-[1.1fr_.9fr]">
              <div>
                <div className="flex items-center gap-2 text-sm font-extrabold text-cyan-100"><MessagesSquare className="h-5 w-5" aria-hidden="true" /> Recent discussions</div>
                {recentTopics.length > 0 ? <ul className="mt-4 grid gap-3">{recentTopics.map((topic) => <li key={topic.id}><Link href={`/community/topic/${topic.slug}`} className="group block rounded-2xl border border-white/15 bg-white/10 p-4 hover:border-cyan-200/70 hover:bg-white/15"><span className="text-xs font-bold text-cyan-200">{topic.category.name}</span><span className="mt-1 block font-extrabold leading-snug text-white group-hover:text-cyan-100">{topic.title}</span></Link></li>)}</ul> : <p className="mt-4 text-sm leading-6 text-white/70">Explore subject discussions and be among the first to ask a question.</p>}
                <Link href="/community" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-cyan-200 hover:underline">Browse all discussions <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
              </div>
              <div className="grid gap-3 self-start">
                <Link href="/community/news" className="flex gap-3 rounded-2xl border border-white/15 bg-white/10 p-5 hover:border-cyan-200/70 hover:bg-white/15"><Newspaper className="mt-0.5 h-5 w-5 shrink-0 text-cyan-200" aria-hidden="true" /><span><span className="block font-extrabold text-white">Official exam updates</span><span className="mt-1 block text-sm leading-6 text-white/65">Sourced news and changes in one place.</span></span></Link>
                <Link href="/community/guidelines" className="flex gap-3 rounded-2xl border border-white/15 bg-white/10 p-5 hover:border-cyan-200/70 hover:bg-white/15"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-200" aria-hidden="true" /><span><span className="block font-extrabold text-white">How the community stays safe</span><span className="mt-1 block text-sm leading-6 text-white/65">Moderation, privacy and exam-integrity guidelines.</span></span></Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {showTools && <section id="tools" className="scroll-mt-20 bg-[#fff8ee] px-4 py-14 md:px-8 md:py-18" aria-labelledby="tools-heading">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold text-[#9a561e]">Do something now</p>
          <h2 id="tools-heading" className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Free study tools</h2>
          <p className="mt-3 max-w-2xl leading-7 text-secondary/65">Turn a useful idea into a short practice session or a focused block of study.</p>
          <div className={`mt-7 grid gap-5 ${showFocusDojo && showPracticeDojo ? "lg:grid-cols-2" : ""}`}>
            {showPracticeDojo && <div className="flex h-full flex-col rounded-3xl border border-[#d9d0f2] bg-[#f1edff] p-7 text-secondary">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ded6fb] text-[#5d3fa7]"><Sparkles className="h-6 w-6" aria-hidden="true" /></span>
              <p className="mt-5 text-sm font-bold text-[#5d3fa7]">Practise a topic</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">PracticeDojo</h3>
              <p className="mt-3 max-w-2xl flex-1 leading-7 text-secondary/70">Generate targeted practice questions by curriculum, subject and topic.</p>
              <AiPracticeStudioCtaLink href="/ai-practice-studio" cta="try_free_tool" source="learning_hub_featured_tool" className="mt-6 inline-flex min-h-12 items-center justify-center self-start rounded-xl bg-[#5d3fa7] px-6 py-3 text-sm font-extrabold text-white hover:bg-[#4b3288]">Try PracticeDojo</AiPracticeStudioCtaLink>
            </div>}
            {showFocusDojo && <div className="flex h-full flex-col rounded-3xl border border-[#bfe5d5] bg-[#e4f7ee] p-7 text-secondary">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#c6efdb] text-[#0b765b]"><TimerReset className="h-6 w-6" aria-hidden="true" /></span>
              <p className="mt-5 text-sm font-bold text-[#0b765b]">Find a study rhythm</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">FocusDojo</h3>
              <p className="mt-3 max-w-2xl flex-1 leading-7 text-secondary/70">Use a free timer for focus rounds and breaks, or switch to quiet exam-style timing. Selected sounds help make a calm study space.</p>
              <Link href="/focus-dojo" className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-xl bg-[#0b765b] px-6 py-3 text-sm font-extrabold text-white hover:bg-[#085a46]">Open FocusDojo <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </div>}
          </div>
        </div>
      </section>}

    </main>
  );
}

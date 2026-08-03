import type { MetadataRoute } from "next";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { learningArticles, learningHubUrl } from "@/lib/learning-hub";
import { pageUrl, seoPages, siteUrl } from "@/lib/seo";
import { getCommunityCategories, getCommunityTopics, getPublishedExamUpdates } from "@/lib/community";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [communityCategories, communityTopics, examUpdates] = await Promise.all([
    getCommunityCategories(),
    getCommunityTopics({ limit: 1000 }),
    getPublishedExamUpdates(100),
  ]);

  return [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/free-assessment`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: `${siteUrl}/ai-practice-studio`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: learningHubUrl(),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${siteUrl}/community`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/community/news`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...communityCategories.map((category) => ({ url: `${siteUrl}/community/${category.slug}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.75 })),
    ...communityTopics.filter((topic) => !topic.is_sensitive).map((topic) => ({ url: `${siteUrl}/community/topic/${topic.slug}`, lastModified: new Date(topic.last_activity_at), changeFrequency: "weekly" as const, priority: 0.7 })),
    ...examUpdates.map((update: any) => ({ url: `${siteUrl}/community/news/${update.slug}`, lastModified: new Date(update.updated_at), changeFrequency: "monthly" as const, priority: 0.7 })),
    ...learningArticles.map((article) => ({
      url: learningHubUrl(article.slug),
      lastModified: new Date(article.publishedDate),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...["terms", "privacy", "code-of-conduct"].map((slug) => ({
      url: `${siteUrl}/${slug}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.35,
    })),
    ...seoPages.map((page) => ({
      url: pageUrl(page.slug),
      lastModified: now,
      changeFrequency: page.kind === "article" ? ("monthly" as const) : ("weekly" as const),
      priority: page.kind === "service" || page.kind === "curriculum" || page.kind === "location" ? 0.9 : 0.75,
    })),
  ];
}

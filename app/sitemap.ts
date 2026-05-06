import type { MetadataRoute } from "next";
import { learningArticles, learningHubUrl } from "@/lib/learning-hub";
import { pageUrl, seoPages, siteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

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

import type { Metadata } from "next";
import { Suspense } from "react";
import HomeTutorDirectory, { HomeTutorDirectorySkeleton } from "@/components/HomeTutorDirectory";
import FeatureUnavailable from "@/components/FeatureUnavailable";
import { isPublicFeatureEnabled } from "@/lib/feature-flags";
import { siteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Find a tutor",
  description: "Explore ScienceDojo tutors by subject and find the right learning support.",
  alternates: { canonical: `${siteUrl}/find-tutors` },
};

export default async function FindTutorsPage({ searchParams }: { searchParams: Promise<{ query?: string; subject?: string }> }) {
  const enabled = await isPublicFeatureEnabled("tutor_marketplace_enabled");
  if (!enabled) return <FeatureUnavailable eyebrow="Find a tutor" title="Tutor profiles are not available right now." message="You can still contact ScienceDojo to discuss the support you need." />;
  return <main className="flex-1"><Suspense fallback={<HomeTutorDirectorySkeleton />}><HomeTutorDirectory searchParams={searchParams} /></Suspense></main>;
}

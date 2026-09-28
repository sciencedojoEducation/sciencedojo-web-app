import type { Metadata } from "next";
import { Suspense } from "react";
import HomeTutorDirectory, { HomeTutorDirectorySkeleton } from "@/components/HomeTutorDirectory";
import FeatureUnavailable from "@/components/FeatureUnavailable";
import { getPublicFeatureFlagMap } from "@/lib/feature-flags";
import { siteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Find a Tutor",
  description: "Explore ScienceDojo tutor profiles by subject, teaching approach, and experience. Find support that fits your child's next step.",
  alternates: { canonical: `${siteUrl}/find-tutors` },
};

export default async function FindTutorsPage({ searchParams }: { searchParams: Promise<{ query?: string; subject?: string }> }) {
  const flags = await getPublicFeatureFlagMap();
  if (!flags.tutor_marketplace_enabled) return <FeatureUnavailable eyebrow="Find a tutor" title="Tutor profiles are not available right now." message="You can still contact ScienceDojo to discuss the support you need." />;
  return <main className="flex-1"><Suspense fallback={<HomeTutorDirectorySkeleton />}><HomeTutorDirectory searchParams={searchParams} profilesEnabled={flags.tutor_profiles_enabled} bookingEnabled={flags.booking_enabled} assessmentEnabled={flags.free_assessment_enabled} reviewsEnabled={flags.reviews_enabled} /></Suspense></main>;
}

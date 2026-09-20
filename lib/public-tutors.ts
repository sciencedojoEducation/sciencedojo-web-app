import { unstable_cache } from "next/cache";
import { cache } from "react";
import type { Subject, TutorProfile } from "@/lib/supabase-queries";
import { createPublicClient } from "@/utils/supabase/public";
import { traceServerOperation } from "@/lib/server-tracing";

export const PUBLIC_TUTORS_CACHE_TAG = "public-tutors";

type PublicTutorRow = {
  id: string;
  slug: string | null;
  bio: string;
  subjects: Subject[];
  hourly_rate: number;
  rating: number;
  review_count: number;
  is_verified: boolean;
  is_publicly_listed: boolean;
  is_featured: boolean;
  tutor_status: string;
  verified_at: string | null;
  is_available_now: boolean;
  youtube_intro_url: string | null;
  education_level: string | null;
  university: string | null;
  experience_summary: string | null;
  has_teaching_license: boolean | null;
  cv_url: string | null;
  profiles: { full_name: string; avatar_url: string } | null;
};

const getCachedPublicTutors = unstable_cache(
  async (): Promise<TutorProfile[]> => {
    return traceServerOperation("public.tutors.fetch", async () => {
      try {
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from("tutors")
        .select(`
          id,
          slug,
          bio,
          subjects,
          hourly_rate,
          rating,
          review_count,
          is_verified,
          is_publicly_listed,
          is_featured,
          tutor_status,
          verified_at,
          is_available_now,
          youtube_intro_url,
          education_level,
          university,
          experience_summary,
          has_teaching_license,
          cv_url,
          profiles!tutors_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq("is_publicly_listed", true)
        .not("tutor_status", "in", '("rejected","suspended")');

      if (error) {
        console.error("[public-tutors] Query failed:", error.message);
        return [];
      }

      return ((data as unknown as PublicTutorRow[] | null) || []).map((tutor) => ({
        id: tutor.id,
        slug: tutor.slug,
        full_name: tutor.profiles?.full_name || "Verified Tutor",
        avatar_url: tutor.profiles?.avatar_url || "",
        bio: tutor.bio,
        subjects: tutor.subjects,
        hourly_rate: tutor.hourly_rate,
        rating: tutor.rating,
        review_count: tutor.review_count,
        average_rating: tutor.review_count > 0 ? (tutor.rating ?? null) : null,
        is_verified: tutor.is_verified,
        is_publicly_listed: tutor.is_publicly_listed,
        is_featured: tutor.is_featured,
        tutor_status: tutor.tutor_status,
        verified_at: tutor.is_verified ? (tutor.verified_at || "verified") : null,
        is_available_now: tutor.is_available_now,
        youtube_intro_url: tutor.youtube_intro_url,
        education_level: tutor.education_level || undefined,
        university: tutor.university || undefined,
        experience_summary: tutor.experience_summary || undefined,
        has_teaching_license: tutor.has_teaching_license || undefined,
        cv_url: tutor.cv_url || undefined,
      }));
      } catch (error) {
        console.error("[public-tutors] Query failed:", error);
        return [];
      }
    });
  },
  ["public-tutors-v1"],
  {
    revalidate: 300,
    tags: [PUBLIC_TUTORS_CACHE_TAG],
  },
);

const getPublicTutorList = cache(async () => getCachedPublicTutors());

export async function getPublicTutors(
  searchTerm = "",
  subject = "All",
  limit?: number,
) {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const tutors = await getPublicTutorList();
  const filtered = tutors.filter((tutor) => {
    const matchesSubject = subject === "All" || tutor.subjects.includes(subject as Subject);
    const matchesSearch =
      !normalizedSearch ||
      tutor.full_name.toLowerCase().includes(normalizedSearch) ||
      tutor.bio.toLowerCase().includes(normalizedSearch) ||
      tutor.subjects.some((tutorSubject) => tutorSubject.toLowerCase().includes(normalizedSearch));

    return matchesSubject && matchesSearch;
  });

  return typeof limit === "number" ? filtered.slice(0, limit) : filtered;
}

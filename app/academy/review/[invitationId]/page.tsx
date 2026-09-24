import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AcademyReviewerComments from "@/components/admin/academy-builder/AcademyReviewerComments";
import AcademyLessonBlocks from "@/components/tutor-academy/AcademyLessonBlocks";
import AcademyLessonHeader from "@/components/tutor-academy/AcademyLessonHeader";
import AcademyThemeScope from "@/components/tutor-academy/AcademyThemeScope";
import { getAcademyReviewForInvite } from "@/lib/academy-review";
import { getAcademyBlockDefinition } from "@/lib/academy-schema";

export const metadata = { title: "Academy Course Review | ScienceDojo", robots: { index: false, follow: false } };

export default async function AcademyReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ invitationId: string }>;
  searchParams: Promise<{ lesson?: string }>;
}) {
  const [{ invitationId }, query] = await Promise.all([params, searchParams]);
  const review = await getAcademyReviewForInvite(invitationId);
  if (review?.signedOut)
    redirect(`/login?next=${encodeURIComponent(`/academy/review/${invitationId}${query.lesson ? `?lesson=${encodeURIComponent(query.lesson)}` : ""}`)}`);
  if (!review || review.signedOut) notFound();
  const { course, comments } = review;
  const lesson = course.lessons.find((item) => item.slug === query.lesson) || course.lessons[0];
  if (!lesson?.id) notFound();
  return (
    <AcademyThemeScope course={course} className="min-h-screen bg-white text-[#18212B]">
      <header className="border-b border-black/10 bg-[#F8F7F3] px-4 py-3">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-primary">ScienceDojo course review</span>
          <span className="text-xs text-secondary/60">Saved snapshot · changes you suggest will not edit the course directly</span>
        </div>
      </header>
      <div className="mx-auto flex max-w-[1400px] flex-col lg:flex-row">
        <main className="min-w-0 flex-1 pb-20">
          <nav aria-label="Review lessons" className="flex gap-2 overflow-x-auto border-b border-black/10 px-4 py-3">
            {course.lessons.map((item) => (
              <Link
                key={item.id || item.slug}
                href={`/academy/review/${invitationId}?lesson=${encodeURIComponent(item.slug)}`}
                aria-current={item.slug === lesson.slug ? "page" : undefined}
                className={`inline-flex min-h-11 shrink-0 items-center rounded-full px-4 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-primary ${item.slug === lesson.slug ? "bg-primary text-white" : "bg-[#F2F4F7] text-secondary"}`}
              >
                {item.title}
              </Link>
            ))}
          </nav>
          <AcademyLessonHeader course={course} lesson={lesson} index={course.lessons.indexOf(lesson)} />
          <div className="mx-auto max-w-[728px] px-6 py-12">
            <AcademyLessonBlocks blocks={lesson.blocks} />
          </div>
        </main>
        <AcademyReviewerComments
          invitationId={invitationId}
          lessonId={lesson.id}
          blocks={lesson.blocks.filter((block) => Boolean(block.id)).map((block) => ({ id: block.id!, label: getAcademyBlockDefinition(block.type).label }))}
          comments={comments}
        />
      </div>
    </AcademyThemeScope>
  );
}

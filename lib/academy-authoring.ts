import "server-only";
import { createHash } from "node:crypto";
import { createClient } from "@/utils/supabase/server";
import { academySlugify } from "@/lib/academy-course-validation";
import { migrateAcademyCourse } from "@/lib/academy-schema";
import type { AcademyCourse, QuizQuestion } from "@/lib/tutor-academy";

export async function requireAcademyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must sign in as an administrator.");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") throw new Error("Administrator access is required.");
  return { supabase, user };
}

export function sanitizeAcademyCourse(input: AcademyCourse): AcademyCourse {
  const course = migrateAcademyCourse(input);
  return JSON.parse(JSON.stringify({
    ...course,
    id: undefined,
    versionId: undefined,
    key: academySlugify(course.key),
    estimatedMinutes: Number(course.estimatedMinutes),
    passMark: Number(course.passMark || 80),
    quizRevision: Number(course.quizRevision || 1),
  })) as AcademyCourse;
}

function questionFingerprint(question: QuizQuestion) {
  return {
    id: question.id,
    type: question.type || "single-choice",
    prompt: question.prompt,
    options: question.options.map((option) => ({ id: option.id, label: option.label })),
    correctOptionId: question.correctOptionId,
    correctOptionIds: question.correctOptionIds || [],
    weight: question.weight || 1,
  };
}

export function getAssessmentFingerprint(course: AcademyCourse) {
  const inline = course.lessons.flatMap((lesson) => lesson.blocks
    .filter((block) => block.type === "knowledge-check")
    .map((block) => block.type === "knowledge-check" ? questionFingerprint(block.question) : null));
  const value = JSON.stringify({
    passMark: course.passMark || 80,
    required: course.rules?.requireFinalAssessment ?? true,
    quiz: course.quiz.map(questionFingerprint),
    inline,
  });
  return createHash("sha256").update(value).digest("hex");
}

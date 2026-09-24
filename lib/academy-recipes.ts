import { getAcademyBlockDefinition, createAcademyId } from "./academy-schema.ts";
import type { LessonBlock } from "./tutor-academy.ts";

export type AcademyRecipeKey = "explain-practise-check" | "guided-action-try-check";

export const academyRecipes: Array<{ key: AcademyRecipeKey; title: string; description: string }> = [
  { key: "explain-practise-check", title: "Explain → Practise → Check", description: "Introduce one idea, invite recall, then check understanding." },
  { key: "guided-action-try-check", title: "Guided action → Try → Check", description: "Walk through a task step by step, then ask learners to apply it." },
];

export function createAcademyRecipe(key: AcademyRecipeKey): LessonBlock[] {
  const text = getAcademyBlockDefinition("text").create();
  if (text.type !== "text") throw new Error("Text block definition is unavailable.");
  text.heading = key === "explain-practise-check" ? "Learn the idea" : "See the task";
  text.paragraphs = ["[[AUTHOR: Explain one focused idea or demonstrate the task using your own course content.]]"];

  const activity = getAcademyBlockDefinition(key === "explain-practise-check" ? "flashcards" : "process").create();
  if (activity.type === "flashcards") {
    activity.heading = "Try to recall";
    activity.items = [{ id: createAcademyId("item"), title: "[[AUTHOR: Write a short recall prompt.]]", body: "[[AUTHOR: Add the answer and feedback.]]" }];
  } else if (activity.type === "process") {
    activity.heading = "Try it step by step";
    activity.appearance = { ...activity.appearance!, variant: "build-up" };
    activity.items = [
      { id: createAcademyId("item"), title: "First step", body: "[[AUTHOR: Describe the first action.]]" },
      { id: createAcademyId("item"), title: "Next step", body: "[[AUTHOR: Describe what the learner does next.]]" },
    ];
  }
  activity.completion = "view";

  const check = getAcademyBlockDefinition("knowledge-check").create();
  if (check.type !== "knowledge-check") throw new Error("Knowledge check definition is unavailable.");
  check.heading = "Check your understanding";
  check.completion = "view";
  check.question.prompt = "[[AUTHOR: Ask one question about the idea or task.]]";
  check.question.options = check.question.options.map((option, index) => ({
    ...option,
    label: `[[AUTHOR: Write answer option ${index + 1}.]]`,
  }));
  check.question.explanation = "[[AUTHOR: Explain why the correct answer is correct.]]";
  return [text, activity, check];
}

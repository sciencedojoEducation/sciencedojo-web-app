import { isNicosWegCourse } from "./nicos-weg-course.ts";
import { isGermanAcademyCourse } from "./german-academy-course.ts";

export const NICOS_WEG_A1_KEY = "deutsch-nicos-weg-a1";
// Change this capability to restore the existing Gemini integration later.
export const NICOS_WEG_A1_AI_FEEDBACK_ENABLED = false;

export function academyFeedbackCapabilities(courseKey: string | undefined) {
  return {
    instantAnswers: isNicosWegCourse(courseKey),
    guidedSelfReview: isNicosWegCourse(courseKey),
    aiFeedback: isGermanAcademyCourse(courseKey) && (!isNicosWegCourse(courseKey) || NICOS_WEG_A1_AI_FEEDBACK_ENABLED),
  };
}

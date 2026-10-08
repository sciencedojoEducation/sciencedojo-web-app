import { buildNicosNextCourse } from "./nicos-weg-next-course.ts";
import { nicosWegA2Episodes } from "./nicos-weg-a2-episodes.ts";
import { nicosA2Grammar } from "./nicos-weg-next-grammar.ts";
export const NICOS_WEG_A2_COURSE_KEY = "deutsch-nicos-weg-a2";
export const nicosWegA2Course = buildNicosNextCourse("A2", nicosWegA2Episodes, nicosA2Grammar);

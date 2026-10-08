import { buildNicosNextCourse } from "./nicos-weg-next-course.ts";
import { nicosWegB1Episodes } from "./nicos-weg-b1-episodes.ts";
import { nicosB1Grammar } from "./nicos-weg-next-grammar.ts";
export const NICOS_WEG_B1_COURSE_KEY = "deutsch-nicos-weg-b1";
export const nicosWegB1Course = buildNicosNextCourse("B1", nicosWegB1Episodes, nicosB1Grammar);

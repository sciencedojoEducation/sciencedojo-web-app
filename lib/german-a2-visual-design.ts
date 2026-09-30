import type { AcademyCourse, AcademyLesson, LessonBlock } from "./tutor-academy.ts";
import { migrateAcademyCourse } from "./academy-schema.ts";

const base = "/images/academy/german-a2";
export const germanA2Hero = `${base}/hero.webp`;
const scenes = [
  ["Zwei Erwachsene stellen sich an einem Tisch mit Notizbüchern vor.", "Wer sind die Personen? Was möchten sie lernen?", "Ich heiße … und lerne Deutsch, weil …"],
  ["Vier Erwachsene feiern gemeinsam einen Geburtstag im Wohnzimmer.", "Wer ist zu Besuch? Was machen die Personen zusammen?", "Auf dem Bild sehe ich … Die Gäste …"],
  ["Eine Frau plant morgens mit Telefon, Kalender und Frühstück ihren Tag.", "Was macht sie gerade? Was muss sie heute erledigen?", "Zuerst …, danach … und am Abend …"],
  ["Zwei Freunde schauen am Fluss gemeinsam Fotos auf einem Telefon an.", "Wo waren die Freunde vielleicht? Was haben sie dort gemacht?", "Vielleicht haben sie … Danach sind sie …"],
  ["Eine Frau besichtigt mit einem Vermieter eine Wohnung mit Sofa, Tisch und Umzugskartons.", "Wo stehen die Möbel? Welche Frage möchten Sie bei einer Besichtigung stellen?", "Das Sofa steht … Ich möchte wissen, ob …"],
  ["Ein Gast bestellt bei einer Bedienung im Café Essen und ein Getränk.", "Was möchte der Gast bestellen? Wie fragt man höflich?", "Ich hätte gern … Könnten Sie bitte …?"],
  ["Eine Kundin zeigt im Kleidungsgeschäft einen Pullover und einen Beleg.", "Was ist vielleicht das Problem? Wie bittet sie um einen Umtausch?", "Der Pullover … Ich möchte ihn …"],
  ["Eine Besucherin mit Unterlagen fragt an der Information nach dem Weg.", "Welche Information braucht die Besucherin? Wohin soll sie gehen?", "Entschuldigung, wo finde ich …? Gehen Sie …"],
  ["Zwei Reisende mit Koffer fragen einen Bahnmitarbeiter auf dem Bahnsteig.", "Was möchten die Reisenden wissen? Welche Rückfrage wäre hilfreich?", "Von welchem Gleis …? Habe ich richtig verstanden, dass …?"],
  ["Zwei Kollegen besprechen am Empfang eines Hotels einen Arbeitsplan.", "Was müssen die Kollegen vereinbaren? Welche Hilfe kann jemand anbieten?", "Kannst du … übernehmen? Ich kann …, aber …"],
  ["Erwachsene lernen gemeinsam mit einer Lehrkraft in einem Sprachkurs.", "Wie lernen die Personen? Was hilft Ihnen beim Lernen?", "Ich lerne am besten, wenn … Deshalb …"],
  ["Eine Frau mit Taschentuch meldet sich am Empfang einer Arztpraxis.", "Wie geht es der Frau vielleicht? Wie bittet sie um einen Termin?", "Mir geht es … Ich brauche bitte …"],
  ["Vier Freunde besprechen in einem Gemeinschaftsraum eine Freizeitaktivität.", "Was könnten die Freunde zusammen machen? Machen Sie zwei Vorschläge.", "Wir könnten … Wie wäre es mit …?"],
  ["Eine Frau telefoniert neben einem geöffneten Paket und einer beschädigten Lampe.", "Was ist passiert? Was möchte die Kundin jetzt erreichen?", "Die Lampe ist … angekommen. Könnten Sie …?"],
  ["Nachbarn planen im Hof gemeinsam eine Gartenaktion.", "Was möchten die Nachbarn organisieren? Wer kann welche Aufgabe übernehmen?", "Ich kümmere mich um … Könntest du …?"],
  ["Vier Erwachsene planen mit einer Karte und Notizbüchern ein gemeinsames Fest.", "Was müssen die Personen entscheiden? Wie reagieren sie auf einen anderen Vorschlag?", "Ich schlage vor, dass … Das passt, aber …"],
];
const colours = {
  welcome: "#FFF4D8", listening: "#EAF4FF", reading: "#E8F6EF",
  language: "#F1EDFF", writing: "#FFF0E7", speaking: "#FCECF3",
  challenge: "#FFF6CD", review: "#E4F5EF",
};
function colourFor(block: LessonBlock): string | undefined {
  const heading = "heading" in block ? block.heading || "" : "";
  if (/mastery|recall|wiederholung|fehler|profil/i.test(heading)) return colours.review;
  if (/mission|prüfungsblick|originaltest|offizielle/i.test(heading)) return colours.challenge;
  if (block.type === "speaking-practice" || /sprechen/i.test(heading)) return colours.speaking;
  if (block.type === "writing-practice" || /schreiben/i.test(heading)) return colours.writing;
  if (block.type === "audio" || /hören|hör/i.test(heading)) return colours.listening;
  if (/lesen/i.test(heading)) return colours.reading;
  if (block.type === "flashcards" || block.type === "worked-example" || /grammatik|sprache entdecken/i.test(heading)) return colours.language;
  if (/einstieg|format und zeiten|vorbereitung/i.test(heading)) return colours.welcome;
}

/** Keep existing author content, exercise IDs and explicit backgrounds intact. */
export function styleGermanA2Lesson(lesson: AcademyLesson): AcademyLesson {
  const core = lesson.slug.match(/^de-a2-(\d{2})$/);
  const exam = lesson.slug.match(/^de-a2-(goethe|telc)-(\d{2})$/);
  if (!core && !exam) return lesson;
  const chapter = core ? Number(core[1]) : 0;
  const examIndex = exam ? Number(exam[2]) - 1 : 0;
  const examScenes = [0, 8, 9, 14, 13, 0, 0, 0, 0, 0];
  const sceneIndex = core ? chapter : examScenes[examIndex];
  const scene = sceneIndex ? scenes[sceneIndex - 1] : undefined;
  const imageId = `${lesson.id}-visual-scene`;
  const image: LessonBlock = {
    id: imageId, type: "image",
    src: `${base}/${sceneIndex ? `chapter-${String(sceneIndex).padStart(2, "0")}` : "exam-practice"}.webp`,
    alt: scene?.[0] || "Eine Erwachsene übt mit Kopfhörern und Notizbuch; zwei weitere Erwachsene führen ein Übungsgespräch.",
    aspect: "wide", width: "wide", focalPoint: "center",
    appearance: { variant: "framed", surface: "plain", spacing: "comfortable", width: "wide" },
    caption: core
      ? `Bildimpuls · ${scene![1]} Sprechen Sie zwei bis drei Sätze. Satzanfang: „${scene![2]}“ Das Bild ist eine freie Sprechübung; Informationen für die folgenden Aufgaben stehen im Text oder Audio.`
      : "Ihr Lernfokus · Beschreiben Sie eine passende Übungsstrategie. Was möchten Sie in dieser Lektion verbessern? Diese Illustration gehört zum Kurs und ist keine Prüfungsaufgabe.",
    completion: "view",
    curriculum: { domain: "personal", functions: ["describe and discuss a familiar situation"], grammar: [], ...lesson.blocks[0]?.curriculum, cefr: "A2", topic: lesson.title, skills: core ? ["speaking", "interaction"] : ["mediation"], ...(lesson.examTrack ? { examTrack: lesson.examTrack } : {}) },
  };
  // Respect a scene supplied by the author; our generated scene can be replaced in the builder.
  const blocks = lesson.blocks.some((block) => block.type === "image")
    ? lesson.blocks : [image, ...lesson.blocks];
  return { ...lesson, blocks: blocks.map((block) => {
    if (block.appearance?.background) return block;
    const colour = colourFor(block);
    if (!colour) return block;
    return { ...block, appearance: {
      variant: "default", surface: "plain", width: "reading",
      ...block.appearance, spacing: "spacious", background: { kind: "custom", color: colour },
    } };
  }) };
}
export function styleGermanA2Course(course: AcademyCourse): AcademyCourse {
  return migrateAcademyCourse({
    ...course, heroImage: course.heroImage || germanA2Hero,
    theme: { preset: "journey", accent: "coral-navy", typography: "friendly-sans", density: "comfortable", ...course.theme, coverStyle: "split-image", lessonHeaderStyle: "editorial" },
    lessons: course.lessons.map(styleGermanA2Lesson),
  });
}

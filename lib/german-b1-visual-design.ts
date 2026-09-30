import type { AcademyCourse, AcademyLesson, LessonBlock } from "./tutor-academy.ts";

export const B1_HERO_IMAGE = "/images/academy/german-b1/hero-v1.png";
export const b1ChapterScenes = [
  ["01-bridge", "Zwei Erwachsene vergleichen ihre Lernziele an einem Tisch in der Bibliothek.", "Was erfahren Sie über die Personen? Welche Lernziele könnten sie haben?"],
  ["02-relationships", "Zwei Erwachsene unterhalten sich beim gemeinsamen Kochen im Kochkurs.", "Wie könnten sich diese Menschen kennengelernt haben? Beschreiben Sie eine mögliche Begegnung."],
  ["03-time", "Eine Frau plant ihre Woche mit Kalender, Handy und Notizbuch.", "Welche Termine sind fest, welche Zeiten könnten frei bleiben? Begründen Sie Ihre Vermutung."],
  ["04-housing", "Eine Person zeigt bei einem Termin in ihrer Wohnung auf die Heizung.", "Welches Problem könnte besprochen werden? Formulieren Sie eine höfliche Bitte."],
  ["05-work", "Eine Bewerberin spricht mit der Leitung eines Cafés über ihre Bewerbung.", "Welche Fragen wären im Bewerbungsgespräch wichtig? Nennen Sie zwei."],
  ["06-learning", "Erwachsene vergleichen mit einer Beratungsperson einen Onlinekurs und einen Kurs vor Ort.", "Welche Lernmöglichkeit passt zu welchem Alltag? Erklären Sie einen Vorteil und einen Nachteil."],
  ["07-health", "Eine erwachsene Person bespricht einen Termin am Empfang einer Arztpraxis.", "Welche Informationen braucht die Praxis für eine Terminvereinbarung?"],
  ["08-travel", "Zwei Reisende fragen am Bahnhof nach einer Verbindung und betrachten eine Karte.", "Welche Informationen fehlen für die Weiterfahrt? Formulieren Sie eine Rückfrage."],
  ["09-shopping", "Ein Kunde zeigt am Serviceschalter einen Rucksack mit beschädigtem Reißverschluss.", "Wie kann man den Mangel sachlich erklären und um eine Lösung bitten?"],
  ["10-media", "Drei Erwachsene vergleichen Informationen auf Handy und Laptop in einer Bibliothek.", "Was sollte man vor dem Teilen einer Nachricht prüfen?"],
  ["11-environment", "Eine Nachbarschaftsgruppe repariert ein Fahrrad und Kleidung neben einem Tauschregal.", "Welche Gegenstände können wiederverwendet werden? Was muss die Gruppe organisieren?"],
  ["12-community", "Menschen unterschiedlichen Alters besprechen Aufgaben im Nachbarschaftszentrum.", "Welche unterschiedlichen Wünsche könnte die Gruppe haben? Schlagen Sie einen Kompromiss vor."],
  ["13-culture", "Zwei Erwachsene betrachten historische Stadtfotos in einer Ausstellung.", "Was könnte den Besuchenden gefallen, was könnte schwierig sein?"],
  ["14-solutions", "Zwei Mitbewohnende besprechen einen Aufgabenplan am Küchentisch.", "Welcher Kompromiss könnte für beide funktionieren? Begründen Sie Ihren Vorschlag."],
  ["15-presentation", "Eine Frau präsentiert ein Thema vor einer kleinen Gruppe erwachsener Lernender.", "Wie beginnt eine klare Präsentation? Welche Rückfrage würden Sie danach stellen?"],
  ["16-mastery", "Eine Gruppe organisiert einen Begegnungsnachmittag mit kalten Speisen und begrüßt neue Gäste.", "Wer übernimmt welche Aufgabe? Beschreiben Sie einen gemeinsamen Plan."],
] as const;

const palette = {
  welcome: "#FFF7E5", listening: "#EDF5FC", reading: "#EEF6F0",
  language: "#F3F0FA", speaking: "#EBF5F3", writing: "#FFF1E8", mission: "#FFF8DB",
};

function colour(block: LessonBlock) {
  const heading = "heading" in block ? block.heading || "" : "";
  if (block.type === "image") return undefined;
  if (block.type === "speaking-practice") return palette.speaking;
  if (block.type === "writing-practice") return palette.writing;
  if (block.type === "audio") return palette.listening;
  if (/Einstieg|Ihr A2|Prüfungsformat/.test(heading)) return palette.welcome;
  if (/Mission|Mastery|Mini-Mock|Prüfungsblick|Recall|Wiederholungsplan/.test(heading)) return palette.mission;
  if (/Hören|Hörstrategie/.test(heading)) return palette.listening;
  if (/Lesen|Lesetext|Lesestrategie/.test(heading)) return palette.reading;
  if (/Schreiben/.test(heading)) return palette.writing;
  if (/Sprechen/.test(heading)) return palette.speaking;
  if (["flashcards", "worked-example"].includes(block.type) || /Grammatik|Sprachbausteine/.test(heading)) return palette.language;
  return undefined;
}

function sceneIndex(lesson: AcademyLesson): number | undefined {
  const core = lesson.slug.match(/^de-b1-(\d{2})$/);
  if (core) return Number(core[1]) - 1;
  const exam = lesson.slug.match(/^de-b1-(goethe|telc)-(\d{2})$/);
  if (!exam) return undefined;
  const mapping = exam[1] === "goethe" ? [0, 9, 7, 4, 14, 2, 15, 5, 14] : [0, 9, 5, 7, 4, 14, 2, 15, 5, 14];
  return mapping[Number(exam[2]) - 1];
}

/** Add visual context without changing authored teaching content, submissions or assessments. */
export function styleGermanB1Lesson(lesson: AcademyLesson): AcademyLesson {
  const index = sceneIndex(lesson);
  const scene = index === undefined ? undefined : b1ChapterScenes[index];
  const id = `${lesson.slug}-scene`;
  const existingScene = lesson.blocks.some((block) => block.id === id || block.type === "image");
  const source = lesson.blocks.find((block) => block.curriculum)?.curriculum;
  const image: LessonBlock | undefined = scene && !existingScene ? {
    id, type: "image", src: `/images/academy/german-b1/${scene[0]}-v1.png`, alt: scene[1],
    caption: lesson.examTrack ? "Bildimpuls · Beschreiben Sie die Situation, geben Sie einen Grund und stellen Sie eine passende Frage. Die Illustration ist eine Lernhilfe und kein offizielles Prüfungsbild." : `Bildimpuls · ${scene[2]}`,
    aspect: "wide", width: "wide", focalPoint: "center", completion: "view",
    ...(source ? { curriculum: { ...source, skills: ["speaking", "interaction"] } } : {}),
  } : undefined;
  const blocks = image ? [image, ...lesson.blocks] : lesson.blocks;
  return { ...lesson, blocks: blocks.map((block) => {
    if (block.appearance?.background) return block;
    const background = colour(block);
    if (!background) return block;
    return { ...block, appearance: {
      variant: block.type === "flashcards" ? "flip-grid" : block.type === "process" ? "slides" : block.type === "numbered-list" ? "numbered" : block.type === "audio" ? "captioned" : "default",
      surface: "plain", spacing: "spacious", width: "reading", ...block.appearance,
      background: { kind: "custom", color: background },
    } } as LessonBlock;
  }) };
}

export function styleGermanB1Course(course: AcademyCourse): AcademyCourse {
  return { ...course, heroImage: course.heroImage || B1_HERO_IMAGE,
    theme: { preset: "journey", accent: "blue-citrus", typography: "friendly-sans", density: "comfortable", lessonHeaderStyle: "editorial", ...course.theme, coverStyle: course.theme?.coverStyle === "minimal" || !course.theme?.coverStyle ? "full-image" : course.theme.coverStyle },
    lessons: course.lessons.map(styleGermanB1Lesson),
  };
}

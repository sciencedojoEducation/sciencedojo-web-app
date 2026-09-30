import type { LessonBlock } from "./tutor-academy.ts";

const priorChapterChecks = [
  {
    prompt: "Wie buchstabieren Sie den Namen Lena?",
    options: ["L-E-N-A", "L-I-N-A", "L-E-M-A"],
    answer: 0,
    explanation: "Lena hat die Buchstaben L, E, N und A. Sprechen Sie die Buchstaben danach laut.",
  },
  {
    prompt: "Sie möchten eine neue Person nach ihrer Herkunft fragen. Was sagen Sie?",
    options: ["Woher kommen Sie?", "Wie viel kostet das?", "Wann fährt der Bus?"],
    answer: 0,
    explanation: "Mit „Woher kommen Sie?“ fragen Sie höflich nach der Herkunft.",
  },
  {
    prompt: "Mira spricht über ihre zwei Kinder. Welcher Satz passt?",
    options: ["Das sind meine Kinder.", "Das ist mein Kind.", "Das sind ihre Eltern."],
    answer: 0,
    explanation: "Für zwei Kinder benutzen Sie den Plural: „Das sind meine Kinder.“",
  },
  {
    prompt: "Der Kurs beginnt um 18 Uhr. Welche Angabe bedeutet dasselbe?",
    options: ["Um sechs Uhr abends", "Um sechs Uhr morgens", "Um acht Uhr abends"],
    answer: 0,
    explanation: "18 Uhr ist sechs Uhr abends.",
  },
  {
    prompt: "In einer Wohnungsanzeige steht „Miete: 650 Euro“. Was ist gemeint?",
    options: ["Der regelmäßige Preis für die Wohnung", "Die Hausnummer", "Die Größe des Zimmers"],
    answer: 0,
    explanation: "Die Miete ist der Preis, den man regelmäßig für eine Wohnung bezahlt.",
  },
  {
    prompt: "Sie bestellen im Café einen Kaffee. Welche Bitte passt?",
    options: ["Einen Kaffee, bitte.", "Ein Kaffee sind bitte.", "Kaffee am Bahnhof, bitte."],
    answer: 0,
    explanation: "„Einen Kaffee, bitte“ ist eine kurze, höfliche Bestellung.",
  },
  {
    prompt: "Sie suchen eine Jacke in Größe M. Was fragen Sie im Geschäft?",
    options: ["Haben Sie diese Jacke in Größe M?", "Wann fährt diese Jacke?", "Wo wohnt Größe M?"],
    answer: 0,
    explanation: "Mit „Haben Sie diese Jacke in Größe M?“ fragen Sie nach dem passenden Artikel.",
  },
  {
    prompt: "Sie müssen ein Paket abholen. Welcher Ort passt?",
    options: ["Die Post", "Die Apotheke", "Der Bahnhof"],
    answer: 0,
    explanation: "Ein Paket holen Sie normalerweise bei der Post ab.",
  },
  {
    prompt: "Die Ansage sagt: „Der Zug fährt von Gleis drei ab.“ Wo warten Sie?",
    options: ["An Gleis drei", "An Gleis zwei", "Am Ausgang drei"],
    answer: 0,
    explanation: "„Von Gleis drei“ nennt den Bahnsteig für die Abfahrt.",
  },
  {
    prompt: "Sie können am Montag nicht zum Deutschkurs kommen. Welche Nachricht passt?",
    options: ["Ich kann am Montag leider nicht zum Kurs kommen.", "Der Kurs kann mich am Montag nicht kommen.", "Ich bin Montag Kurs nicht."],
    answer: 0,
    explanation: "Der erste Satz ist eine klare, höfliche Mitteilung an die Sprachschule.",
  },
  {
    prompt: "Eine Person fragt: „Kommst du am Samstag mit ins Kino?“ Sie möchten zusagen. Was sagen Sie?",
    options: ["Ja, gern. Wann treffen wir uns?", "Nein, ich bin krank.", "Der Film wohnt am Samstag."],
    answer: 0,
    explanation: "„Ja, gern“ sagt zu; die Rückfrage klärt den Treffpunkt oder die Zeit.",
  },
  {
    prompt: "Sie haben Kopfschmerzen und brauchen Hilfe. Was sagen Sie in der Apotheke?",
    options: ["Ich habe Kopfschmerzen. Können Sie mir bitte helfen?", "Mein Kopf hat einen Fahrplan.", "Ich möchte eine Jacke anprobieren."],
    answer: 0,
    explanation: "Nennen Sie zuerst das einfache Symptom und bitten Sie dann um Hilfe.",
  },
  {
    prompt: "Morgen regnet es. Was ist für einen Spaziergang nützlich?",
    options: ["Ein Regenschirm", "Ein Zugticket", "Ein Kursbuch"],
    answer: 0,
    explanation: "Bei Regen ist ein Regenschirm nützlich. Sie können auch einen anderen Plan vorschlagen.",
  },
] as const;

/** One low-stakes recall question from the preceding chapter, before new material. */
export function previousChapterRecall(chapterNumber: number, prefix: string): LessonBlock[] {
  if (chapterNumber < 2 || chapterNumber > 14) return [];
  const check = priorChapterChecks[chapterNumber - 2];
  const rotation = (chapterNumber - 2) % check.options.length;
  const options = [...check.options.slice(rotation), ...check.options.slice(0, rotation)];
  const correctIndex = (check.answer - rotation + check.options.length) % check.options.length;
  return [{
    id: `${prefix}-rueckblick-check`,
    type: "knowledge-check",
    heading: "Rückblick ohne Nachsehen",
    completion: "interact",
    required: false,
    question: {
      id: `${prefix}-rueckblick-frage`,
      prompt: check.prompt,
      options: options.map((label, index) => ({ id: String(index), label })),
      correctOptionId: String(correctIndex),
      explanation: check.explanation,
    },
  }];
}

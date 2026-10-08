import { addNicosLearningEmojis } from "./nicos-weg-a1-emojis.ts";
import { appendNicosA1Libraries } from "./nicos-weg-a1-library.ts";
import { migrateAcademyCourse } from "./academy-schema.ts";
import { nicosWegA1Units } from "./nicos-weg-a1-source.ts";
import { styleNicosWegA1Course } from "./nicos-weg-a1-formatting.ts";
import { nicosWegA1BilingualVocabulary } from "./nicos-weg-a1-sinhala.ts";
import { nicosWegA1QuestionExplanation } from "./nicos-weg-a1-feedback.ts";
import type { AcademyCourse, AcademyLesson, LessonBlock } from "./tutor-academy.ts";

export const NICOS_WEG_A1_COURSE_KEY = "deutsch-nicos-weg-a1";
const sections = [{ id: "story", title: "Mit der Geschichte lernen" }, { id: "review", title: "Wiederholen und anwenden" }];

const lessons: AcademyLesson[] = nicosWegA1Units.map((unit) => {
  const number = String(unit.number).padStart(2, "0");
  const id = `nico-a1-${number}`;
  const blocks: LessonBlock[] = [
    { id: `${id}-goal`, type: "text", heading: unit.title, paragraphs: [unit.goal, "Watch once for the situation, then replay and listen for the quoted line. Study the vocabulary and grammar, try the exercises, and speak without reading the models."], completion: "view" },
    { id: `${id}-story`, type: "text", heading: "Die Geschichte · The story", paragraphs: [unit.story] },
    { id: `${id}-video`, type: "video", heading: unit.videoTitle, url: unit.video, caption: "Official Deutsche Welle episode. This is the individual scene clip, not a timestamp in the full film. Press play to watch; reset the scene to listen again. Film © Deutsche Welle.", transcript: `Short scene quotation from the coursebook (not a full transcript):\n${unit.quote}\n${unit.translation}\n\nThe complete official manuscript is available in the DW lesson linked under resources.`, completion: "view" },
    { id: `${id}-image`, type: "image", src: `/images/academy/nicos-weg-a1/unit-${number}.jpg`, alt: `Scene from ${unit.videoTitle}`, caption: `Coursebook frame at ${unit.number === 11 ? "00:55" : "00:30"} in this individual clip. Image © Deutsche Welle.`, aspect: "wide" },
    { id: `${id}-quote`, type: "quote", quote: `${unit.quote}\n${unit.translation}`, attribution: "From the scene · Deutsche Welle" },
    { id: `${id}-sinhala`, type: "image", src: `/images/academy/nicos-weg-a1/sinhala-${number}.png`, alt: `Original Sinhala teaching explanation for unit ${number}; equivalent grammar explanation follows in English.`, caption: "සිංහල පැහැදිලි කිරීම · Original Sinhala note from your coursebook", aspect: "natural" },
    { id: `${id}-words`, type: "flashcards", heading: "Wortschatz · Vocabulary · වචන මාලාව", items: nicosWegA1BilingualVocabulary(unit), completion: "interact" },
    { id: `${id}-grammar`, type: "text", heading: "Grammatik verstehen · Grammar in the scene", paragraphs: unit.grammar.split("\n") },
    { id: `${id}-breakdown`, type: "comparison-table", heading: "Satzbau · Sentence breakdown", columns: ["Part", "Job / case", "Meaning"], rows: unit.breakdown },
    { id: `${id}-models`, type: "text", heading: "Üben · Practice models", paragraphs: ["These models are newly written practice examples, not film dialogue.", unit.models] },
  ];
  unit.exercises.forEach((prompt, index) => {
    const answer = unit.answers[index];
    const choices = prompt.match(/\(([^()]+ \/ [^()]+)\)/)?.[1].split(" / ");
    if (choices) {
      const correct = choices.findIndex((choice) => choice.toLocaleLowerCase("de") === answer.toLocaleLowerCase("de"));
      if (correct < 0) throw new Error(`Missing coursebook answer for ${id}, exercise ${index + 1}`);
      blocks.push({ id: `${id}-exercise-${index + 1}`, type: "knowledge-check", heading: `Aufgabe ${index + 1}`, completion: "pass", required: true,
        question: { id: `${id}-question-${index + 1}`, type: "single-choice", prompt, options: choices.map((label, i) => ({ id: `option-${i}`, label })), correctOptionId: `option-${correct}`, explanation: nicosWegA1QuestionExplanation(`${id}-question-${index + 1}`, `Coursebook answer: ${answer}. Try the completed sentence aloud.`) } });
    } else blocks.push({ id: `${id}-exercise-${index + 1}`, type: "writing-practice", heading: `Aufgabe ${index + 1}`, prompt, minWords: 1, maxWords: 30, checklist: ["Try your own answer before opening the model.", "Compare spelling, case and word order."], modelAnswer: answer, completion: "interact" });
  });
  blocks.push(
    { id: `${id}-speak`, type: "speaking-practice", heading: "30 Sekunden sprechen", prompt: unit.speaking, preparationSeconds: 30, targetSeconds: 30, checklist: ["Use your own details; use fictional addresses and phone numbers.", "Speak without reading the models.", "Listen back and try again."], modelAnswer: unit.models, completion: "interact" },
    { id: `${id}-reflect`, type: "survey", heading: "Kann ich das schon?", prompt: unit.goal, lowLabel: "I need practice", highLabel: "I can do it without reading", scale: 3, completion: "interact" },
    { id: `${id}-sources`, type: "resources", heading: "Offizielle Lektion und Kursbuch", items: [{ title: "DW scene video and complete manuscript", url: unit.url, description: "Open the official individual lesson for the full script, subtitles and further exercises." }, { title: "Your visual coursebook · PDF", url: "https://www.sciencedojo.co.uk/documents/nicos-weg-a1-visual-coursebook.pdf", description: `Unit ${number}, pages ${unit.number * 2 + 2}–${unit.number * 2 + 3}.` }] },
  );
  return { id, slug: `unit-${number}`, sectionId: "story", section: sections[0].title, title: `${number} · ${unit.title}`, summary: unit.goal, durationMinutes: 25, blocks };
});

const reviewTasks = [
  ["Introduce yourself", "Write five sentences: name, origin, home, profession and a learning goal.", "Ich heiße Piumal. Ich komme aus Sri Lanka. Ich wohne in Deutschland. Ich bin Lehrer. Ich möchte gut Deutsch sprechen."],
  ["Solve an everyday problem", "You have lost your bag. Tell an officer what is missing, ask for help and give a fictional address. Use Sie.", "Meine Tasche ist weg. Können Sie mir helfen? Meine Adresse ist Gartenstraße 8."],
  ["Make a plan with a friend", "Say when you are free tomorrow. Suggest food, then explain how to get to the restaurant.", "Morgen habe ich um zwölf Uhr Zeit. Ich möchte eine Pizza essen. Gehen Sie geradeaus und dann links."],
  ["Explain a symptom", "Say you have an appointment. Name the body part that hurts.", "Ich habe einen Termin. Mein Fuß tut weh."],
  ["Your next step", "Finish: Ich möchte … / Morgen … / Ich übe …", "Ich möchte Deutsch lernen. Morgen übe ich. Ich übe jeden Tag."],
];
lessons.push({ id: "nico-a1-review", slug: "review", sectionId: "review", section: sections[1].title, title: "Wiederholen · Use your German", summary: "Bring together the language from all 12 scenes.", durationMinutes: 30, blocks: [
  { id: "nico-review-cases", type: "comparison-table", heading: "Articles and cases", columns: ["Case", "Masculine", "Neuter", "Feminine", "Plural"], rows: [["NOM", "der / ein", "das / ein", "die / eine", "die"], ["AKK", "den / einen", "das / ein", "die / eine", "die"], ["DAT", "dem / einem", "dem / einem", "der / einer", "den"]] },
  { id: "nico-review-pronouns", type: "comparison-table", heading: "Personal pronouns", columns: ["Meaning", "NOM", "AKK", "DAT"], rows: [["I / me", "ich", "mich", "mir"], ["you (informal singular)", "du", "dich", "dir"], ["he / him", "er", "ihn", "ihm"], ["she / her", "sie", "sie", "ihr"], ["we / us", "wir", "uns", "uns"], ["you (formal)", "Sie", "Sie", "Ihnen"]] },
  { id: "nico-review-grammar", type: "text", heading: "Word order and useful phrases", paragraphs: ["Heute | lerne | ich | Deutsch. Wo | wohnst | du? Lernst | du | Deutsch?", "A modal makes a bracket: Ich | möchte | heute Deutsch | lernen. A separable verb splits: Ich | rufe | dich | an.", "Dativ prepositions: aus, bei, mit, nach, von, zu. aus Sri Lanka; beim Arzt; mit dem Bus; nach Deutschland; von einem Laden; zum Bahnhof.", "Dativ plural often adds -n: mit den Freunden; mit den Autos. There is no plural indefinite article."] },
  ...reviewTasks.map(([heading, prompt, modelAnswer], i): LessonBlock => ({ id: `nico-review-task-${i}`, type: "writing-practice", heading, prompt, minWords: 3, maxWords: 100, checklist: ["Use verb position 2 and check your questions.", "Check einen, mir and dir where needed."], modelAnswer, completion: "interact" })),
  { id: "nico-review-speak", type: "speaking-practice", heading: "Your next step · Say it aloud", prompt: "Say one goal in German and one small action you can do tomorrow. Speak for 30 seconds.", preparationSeconds: 30, targetSeconds: 30, checklist: ["Use your own sentences.", "Try without looking at a model."], modelAnswer: "Ich möchte gut Deutsch sprechen. Morgen lerne ich zehn Wörter. Ich übe jeden Tag.", completion: "interact" },
] });

export const nicosWegA1Course: AcademyCourse = addNicosLearningEmojis(appendNicosA1Libraries(styleNicosWegA1Course(migrateAcademyCourse({
  key: NICOS_WEG_A1_COURSE_KEY, title: "Deutsch lernen mit Nicos Weg A1", shortTitle: "Nicos Weg A1",
  description: "Learn German through 12 selected scenes from Nicos Weg: official DW clips, German and English explanations, original Sinhala notes, vocabulary flashcards, 36 coursebook exercises and speaking practice. Includes a separate grammar library across all 76 A1 episodes and 76 English/Sinhala vocabulary decks. An independent visual study companion, not an A1 examination preparation course. Film and screenshots © Deutsche Welle.",
  estimatedMinutes: 330, audienceRoles: ["student"], passMark: 70, quizRevision: 1, sections,
  heroImage: "/images/academy/nicos-weg-a1/unit-01.jpg",
  theme: { preset: "journey", accent: "teal", typography: "friendly-sans", density: "comfortable", coverStyle: "split-image", lessonHeaderStyle: "media-led" },
  rules: { navigation: "free", lessonCompletion: "required-blocks", requireFinalAssessment: false, attemptLimit: null, feedbackTiming: "immediate" }, lessons, quiz: [],
}))));

import { nicosGrammarLanguageParagraph } from "./nicos-weg-a1-language-formatting.ts";
import { nicosWegA1Episodes } from "./nicos-weg-a1-episodes.ts";
import { nicosWegA1Grammar } from "./nicos-weg-a1-grammar.ts";
import { migrateAcademyCourse } from "./academy-schema.ts";
import { academyTextColors } from "./academy-text-colors.ts";
import type { AcademyCourse, AcademyLesson, AcademyRichTextDocument, LessonBlock } from "./tutor-academy.ts";

export const nicosA1LibrarySections = [
  { id: "grammar-library", title: "Grammatik · A1 grammar" },
  { id: "vocabulary-library", title: "Wortschatz · 76 Folgen" },
];
const grammarOverview = "https://static.dw.com/downloads/52718691/grammar-overview-nicos-weg-a1.pdf";
const number = (value: number) => String(value).padStart(2, "0");
const paragraph = (text: string) => ({ type: "paragraph", content: [{ type: "text", text }] });
function ruleDocument(unit: number, rule: number, title: string, english: string, sinhala: string, example: string, meaning: string): AcademyRichTextDocument {
  return { type: "doc", content: [{ type: "heading", attrs: {level: 2}, content: [{type: "text", text: title}] }, nicosGrammarLanguageParagraph(english, unit, rule), nicosGrammarLanguageParagraph(`සිංහල: ${sinhala}`, unit, rule), {
    type: "paragraph", content: [{ type: "text", text: example, marks: [{ type: "bold" }, { type: "textStyle", attrs: { color: academyTextColors.green } }] }],
  }, paragraph(meaning)] };
}
const grammarLessons: AcademyLesson[] = nicosWegA1Grammar.map((unit, index) => {
  const id = `nico-a1-grammar-${number(index)}`;
  const episodes = nicosWegA1Episodes.filter(episode => episode.unit === index);
  const blocks: LessonBlock[] = [
    { id: `${id}-start`, type: "text", heading: unit.title, paragraphs: [
      `A1 grammar unit ${index} · Episodes ${episodes[0].episode}–${episodes[3].episode}. Learn the rules, compare the film examples, then try the two checks. You can open this section in any order.`,
      "පළමුව නීති හා උදාහරණ කියවන්න. චිත්‍රපටයේ යෙදුම් බලන්න. ඉන්පසු අභ්‍යාස දෙක උත්සාහ කරන්න. ඕනෑම පාඩමක් අවශ්‍ය විට විවෘත කළ හැක.",
      "Green sentences are original practice examples. The film excerpts below are attributed separately to DW.",
    ], completion: "view" },
    ...unit.rules.map(([heading, english, sinhala, example, meaning], i): LessonBlock => ({
      id: `${id}-rule-${i + 1}`, type: "text", heading, paragraphs: [english, `සිංහල: ${sinhala}`, example, meaning], content: ruleDocument(index, i, heading, english, sinhala, example, meaning),
    })),
    { id: `${id}-patterns`, type: "comparison-table", heading: "Formen vergleichen · Compare the forms", columns: ["Person / situation", "German pattern", "Meaning / use"], rows: unit.table.map(row => [...row]) },
    { id: `${id}-film`, type: "comparison-table", heading: "Im Film · Examples from all four episodes", columns: ["Episode · DW unit/lesson", "Short film excerpt © DW", "English", "සිංහල"], rows: episodes.map(episode => [
      `${number(episode.episode)} · ${episode.title} (E${episode.unit}/L${episode.part})`, episode.quote, episode.quoteEnglish, episode.quoteSinhala,
    ]) },
    { id: `${id}-method`, type: "numbered-list", heading: "Satzbau untersuchen · Study each sentence", items: [
      { title: "Find the conjugated verb", body: "Underline the finite verb. Decide whether this is a statement, question or instruction. ක්‍රියාව සහ වාක්‍ය වර්ගය හඳුනාගන්න." },
      { title: "Find the subject and other sentence parts", body: "Name the subject. Check articles, object pronouns and any prepositions against the rules above. කර්තෘ, විභක්ති සහ Präposition පරීක්ෂා කරන්න." },
      { title: "Change one part and say it aloud", body: "Replace a name, object or time with your own fictional detail. Keep the grammatical pattern. එක් කොටසක් වෙනස් කර නිවැරදි රටාවෙන් හඬ නඟා කියන්න." },
    ] },
    ...unit.checks.map(([prompt, correct, distractor, english, sinhala], i): LessonBlock => ({
      id: `${id}-check-${i + 1}`, type: "knowledge-check", heading: `Übung ${i + 1} · Quick check`, completion: "pass", required: false,
      question: { id: `${id}-question-${i + 1}`, type: "single-choice", prompt, options: i % 2 ? [{ id: "other", label: distractor }, { id: "approved", label: correct }] : [{ id: "approved", label: correct }, { id: "other", label: distractor }], correctOptionId: "approved", explanation: `${english}\nසිංහල: ${sinhala}` },
    })),
    { id: `${id}-links`, type: "resources", heading: "Replay and read · Official sources", items: [
      ...episodes.map(episode => ({ title: `${number(episode.episode)} · ${episode.title}: full script and vocabulary`, url: episode.url, description: "Official DW PDF. Use the matching episode in DW's course to replay the dialogue. Short excerpts here do not replace the full script." })),
      { title: "DW A1 grammar overview", url: grammarOverview, description: "The official sequence used to organize these original English/Sinhala teaching notes." },
    ] },
  ];
  return { id, slug: `grammar-${number(index)}`, sectionId: nicosA1LibrarySections[0].id, section: nicosA1LibrarySections[0].title, title: `${number(index)} · ${unit.title}`, summary: unit.rules.map(rule => rule[0]).join(" · "), durationMinutes: 25, blocks };
});
const vocabularyLessons: AcademyLesson[] = nicosWegA1Episodes.map(episode => {
  const id = `nico-a1-vocabulary-e${number(episode.unit)}-l${episode.part}`;
  const grammar = nicosWegA1Grammar[episode.unit];
  return { id, slug: `vocabulary-${number(episode.episode)}`, sectionId: nicosA1LibrarySections[1].id, section: nicosA1LibrarySections[1].title,
    title: `${number(episode.episode)} · ${episode.title}`, summary: `Folge ${episode.episode} · DW E${episode.unit}/L${episode.part} · Eight selected words and expressions with English/Sinhala meanings.`, durationMinutes: 8,
    blocks: [
      { id: `${id}-start`, type: "text", heading: `Folge ${number(episode.episode)} · ${episode.title}`, paragraphs: [
        `DW unit ${episode.unit}, lesson ${episode.part}. These eight cards are a selected starter set from this episode's official vocabulary. The complete DW word list is linked below. Repeat useful words when they return in later episodes.`,
        "කාඩ්පත හැරවීමට පෙර අර්ථය මතකයෙන් කියන්න. නාමපද Artikel හා බහු වචනය සමඟ ඉගෙන ගන්න. මෙම තෝරාගත් වචන අටට අමතර සම්පූර්ණ DW ලැයිස්තුව පහත සබැඳියෙන් බලන්න.",
      ], completion: "view" },
      { id: `${id}-cards`, type: "flashcards", heading: "Wortschatz · English · සිංහල", completion: "interact", items: episode.vocabulary.map((word, i) => {
        const [singular, ...plural] = word.german.split(", ");
        return { id: `${id}-card-${i + 1}`, title: singular, eyebrow: `Folge ${number(episode.episode)} · ${episode.title}`, body: `English: ${word.english}\nසිංහල: ${word.sinhala}${plural.length ? `\nPlural / forms: ${plural.join(", ")}` : ""}` };
      }) },
      { id: `${id}-recall`, type: "accordion", heading: "Abrufen statt nur lesen · Recall practice", items: [
        { title: "Before you flip · හැරවීමට පෙර", body: "Say the English or Sinhala meaning. For a noun, say its article too. Reveal the card and compare. අර්ථය සහ Artikel මතකයෙන් කියා පසුව පිළිතුර බලන්න." },
        { title: "Use it in the scene · වාක්‍යයක් හදන්න", body: `Choose three cards and make one short sentence for each. Revisit grammar unit ${episode.unit}: ${grammar.title}. Use fictional personal details. වචන තුනක් තෝරා කෙටි වාක්‍ය තුනක් හදන්න.` },
        { title: "Try again tomorrow · හෙට නැවත", body: "Hide the meanings and test yourself again tomorrow. Move difficult words into your own notebook; seeing a word again is useful practice. අර්ථ වසා හෙට නැවත මතකයෙන් කියන්න." },
      ] },
      { id: `${id}-links`, type: "resources", heading: "Complete episode vocabulary and script", items: [{ title: `DW · ${episode.title} · Full script and word list`, url: episode.url, description: "Official manuscript and vocabulary PDF, © Deutsche Welle. This deck contains a selected set, not the entire official word list." }, { title: "Watch the official Nicos Weg A1 course", url: "https://learngerman.dw.com/en/nicos-weg/c-36519789", description: `Choose unit ${episode.unit}, lesson ${episode.part}: ${episode.title}.` }] },
    ],
  };
});
export const nicosA1LibraryLessons: AcademyLesson[] = [...grammarLessons, ...vocabularyLessons];

/** Append only: preserve published lesson IDs, media and teacher-authored content. */
export function appendNicosA1Libraries(input: AcademyCourse): AcademyCourse {
  if (input.key !== "deutsch-nicos-weg-a1") throw new Error("The Nicos libraries belong only to Nicos Weg A1.");
  const course = structuredClone(input);
  for (const section of nicosA1LibrarySections) {
    if (!course.sections?.some(existing => existing.id === section.id)) course.sections = [...(course.sections || []), section];
  }
  for (const lesson of nicosA1LibraryLessons) {
    // Existing library lessons may have teacher edits. Never replace them.
    if (course.lessons.some(existing => existing.id === lesson.id)) continue;
    if (course.lessons.some(existing => existing.slug === lesson.slug)) throw new Error(`Lesson slug collision: ${lesson.slug}`);
    course.lessons.push(structuredClone(lesson));
    course.estimatedMinutes += lesson.durationMinutes;
  }
  return migrateAcademyCourse(course);
}

import { migrateAcademyCourse } from "./academy-schema.ts";
import { academyTextColors } from "./academy-text-colors.ts";
import type { AcademyCourse, AcademyLesson, LessonBlock } from "./tutor-academy.ts";
import type { NicosGrammarPack } from "./nicos-weg-next-grammar.ts";

export type NicosEpisode = {
  episode: number; unit: number; part: number; title: string; goal: string;
  grammarTopic: string | null; url: string; video: string; videoTitle: string;
  poster: string; duration: number; story: string; quote: string;
  grammarLinks: readonly { title: string; url: string }[];
  vocabulary: readonly { german: string; meaning: string; forms: string; audio?: string | null }[];
};
const num = (value: number) => String(value).padStart(2, "0");
function grammarBlocks(id: string, grammar: NicosGrammarPack): LessonBlock[] {
  return [
    { id: `${id}-rule`, type: "text", heading: `🧩 ${grammar.title}`, paragraphs: [grammar.rule, `සිංහල: ${grammar.sinhala}`], completion: "view" },
    { id: `${id}-model`, type: "text", heading: "🗣️ Satzmuster · Original practice example", paragraphs: [grammar.example, grammar.meaning], content: { type: "doc", content: [
      { type: "paragraph", content: [{ type: "text", text: grammar.example, marks: [{ type: "bold" }, { type: "textStyle", attrs: { color: academyTextColors.green } }] }] },
      { type: "paragraph", content: [{ type: "text", text: grammar.meaning, marks: [{ type: "italic" }] }] },
    ] } },
    { id: `${id}-grammar-check`, type: "knowledge-check", heading: "✅ Grammatik prüfen", required: true, completion: "pass", question: {
      id: `${id}-grammar-question`, type: "single-choice", prompt: `Which sentence follows this rule? ${grammar.title}`,
      options: [{ id: "a", label: grammar.incorrect }, { id: "b", label: grammar.example }], correctOptionId: "b", explanation: `${grammar.rule}\nසිංහල: ${grammar.sinhala}`,
    } },
  ];
}

export function buildNicosNextCourse(level: "A2" | "B1", episodes: readonly NicosEpisode[], grammar: readonly NicosGrammarPack[]): AcademyCourse {
  if (episodes.length !== 76 || grammar.length !== 19) throw new Error(`Incomplete Nicos Weg ${level} source data`);
  const key = `deutsch-nicos-weg-${level.toLowerCase()}`;
  const prefix = `nico-${level.toLowerCase()}`;
  const sections = [
    ...grammar.map((unit, index) => ({ id: `story-${num(index)}`, title: `${num(index)} · ${unit.title.split(" · ")[0]}` })),
    { id: "grammar-library", title: `🧩 Grammatik · ${level} · English / සිංහල` },
    { id: "review", title: "🎯 Wiederholen und anwenden" },
  ];
  const lessons: AcademyLesson[] = episodes.map((episode) => {
    const id = `${prefix}-${num(episode.episode)}`;
    const unit = grammar[episode.unit];
    const words = episode.vocabulary.filter(word => word.meaning);
    if (words.length < 2) throw new Error(`Missing vocabulary: ${level} episode ${episode.episode}`);
    const chosen = words[episode.part % words.length];
    const other = words.find(word => word.meaning !== chosen.meaning)!;
    const blocks: LessonBlock[] = [
      { id: `${id}-goal`, type: "text", heading: `🎯 ${episode.goal}`, paragraphs: [
        `Folge ${episode.episode} · DW E${episode.unit}/L${episode.part}. Watch for the situation first, replay for details, then study the words and practise your own sentences.`,
        "පළමුව සිදුවීම තේරුම් ගන්න. නැවත අසා විස්තර හඳුනාගන්න. වචන ඉගෙන ඔබේම වාක්‍ය හදන්න.",
      ], completion: "view" },
      { id: `${id}-video`, type: "video", heading: `🎬 ${episode.videoTitle}`, url: episode.video, transcript: `Short excerpt © Deutsche Welle (not the full transcript):\n${episode.quote}\n\nRead the complete official manuscript at ${episode.url}/manuskript`,
        caption: "Official individual episode © Deutsche Welle. Replay the scene, then open the official manuscript under resources. The grammar examples below are original teaching examples, not film dialogue.", completion: "view" },
      { id: `${id}-scene`, type: "image", src: `/images/academy/nicos-weg-${level.toLowerCase()}/episode-${num(episode.episode)}.webp`, alt: `Official DW episode image: ${episode.title}`, caption: "Episode image © Deutsche Welle", aspect: "wide" },
      { id: `${id}-words`, type: "flashcards", heading: level === "A2" ? "📚 Wortschatz · German / English" : "📚 Wortschatz · Deutsch erklären", items: words.map((word, index) => ({ id: `${id}-word-${index}`, title: word.german, body: `${word.meaning}${word.forms ? `\nForms: ${word.forms}` : ""}`, eyebrow: `Folge ${episode.episode} · ${episode.title}` })), completion: "interact" },
      ...grammarBlocks(id, unit).filter(block => block.type !== "knowledge-check"),
      { id: `${id}-vocab-check`, type: "knowledge-check", heading: "✅ Wortschatz prüfen", required: true, completion: "pass", question: {
        id: `${id}-vocab-question`, type: "single-choice", prompt: `Choose the meaning of: ${chosen.german}`,
        options: episode.episode % 2 ? [{ id: "meaning", label: chosen.meaning }, { id: "other", label: other.meaning }] : [{ id: "other", label: other.meaning }, { id: "meaning", label: chosen.meaning }], correctOptionId: "meaning", explanation: `${chosen.german}: ${chosen.meaning}. Say the word, then recall its meaning without looking.`,
      } },
      { id: `${id}-listen`, type: "writing-practice", heading: "👂 Hören · Notice the details", prompt: `Watch “${episode.title}”. Write who is speaking, what they want, and one detail you heard. Replay and check against the official script.`, minWords: 5, maxWords: 100,
        checklist: ["Name the speakers using the official script.", "Include one specific detail supported by the video.", "Replay any unclear sentence; do not guess."],
        modelAnswer: "Self-review task: open the official manuscript below. Underline the speakers, one request or intention, and one supporting detail. Several summaries are possible; compare your evidence with the script.", completion: "interact" },
      { id: `${id}-write`, type: "writing-practice", heading: "✍️ Schreiben · Use the pattern", prompt: `Write a short text about “${episode.title}” (${episode.goal}). Use at least three words from the cards. Include one sentence using the pattern from “${unit.title}”. A fictional situation is welcome.`, minWords: level === "A2" ? 25 : 50, maxWords: level === "A2" ? 90 : 150,
        checklist: ["Address the lesson topic.", "Use three vocabulary cards in context.", "Check your conjugated verbs and case endings.", "Use the grammar pattern in one original sentence."],
        modelAnswer: `Grammar model, not a complete answer to the open task: ${unit.example}\n${unit.meaning}\n\nDevelop your own topic-specific text. Check three words against the cards and compare your sentence structure with the grammar library.`, completion: "interact" },
      { id: `${id}-speak`, type: "speaking-practice", heading: "🎙️ Sprechen · Make it your own", prompt: `Speak about ${episode.goal}. Explain a situation, add a reason, and ask a follow-up question. Use three words from this episode and one pattern from ${unit.title}.`, preparationSeconds: 60, targetSeconds: level === "A2" ? 60 : 120,
        checklist: ["Speak from brief notes.", "Use vocabulary from this episode.", "Add a reason or a concrete example.", "Listen back and improve one sentence."], modelAnswer: `Structure guide: introduce the situation → give a detail → explain a reason → ask a question.\nGrammar model: ${unit.example}\n${unit.meaning}`, completion: "interact" },
      { id: `${id}-reflect`, type: "survey", heading: "🌱 Kann ich das schon?", prompt: `${episode.goal}: can you understand the scene and use this language without reading?`, lowLabel: "I need practice", highLabel: "I can use it", scale: 3, completion: "interact" },
      { id: `${id}-sources`, type: "resources", heading: "🔗 Official lesson, vocabulary and grammar", items: [
        { title: `DW · ${episode.title} · video, script and exercises`, url: episode.url, description: `Official ${level} lesson E${episode.unit}/L${episode.part}. Film and source vocabulary © Deutsche Welle.` },
        { title: "Complete official vocabulary and pronunciation", url: `${episode.url}/lv`, description: "The cards above are a selected starter set. Open DW for the complete list and individual word audio." },
        ...episode.grammarLinks.map(link => ({ ...link, description: "The grammar topic assigned by DW to this particular episode." })),
      ] },
    ];
    return { id, slug: `episode-${num(episode.episode)}`, sectionId: sections[episode.unit].id, section: sections[episode.unit].title, title: `${num(episode.episode)} · ${episode.title}`, summary: episode.goal, durationMinutes: level === "A2" ? 25 : 30, blocks };
  });
  grammar.forEach((unit, index) => {
    const id = `${prefix}-grammar-${num(index)}`;
    lessons.push({ id, slug: `grammar-${num(index)}`, sectionId: "grammar-library", section: sections[19].title, title: `${num(index)} · ${unit.title}`, summary: `Rules, English/Sinhala notes, practice and sources for episodes ${index * 4 + 1}–${index * 4 + 4}.`, durationMinutes: 15, blocks: [
      ...grammarBlocks(id, unit),
      { id: `${id}-repair`, type: "writing-practice", heading: "✍️ Repair the sentence", prompt: `Correct this sentence: ${unit.incorrect}`, minWords: 1, maxWords: 50, checklist: ["Keep the original meaning.", "Use the rule above."], modelAnswer: unit.example, completion: "interact" },
      { id: `${id}-transfer`, type: "writing-practice", heading: "🔁 Change one detail", prompt: `Write two new sentences using this pattern: ${unit.example} Change a time, person or object while keeping the grammatical structure.`, minWords: 5, maxWords: 70, checklist: ["Keep the word order.", "Check agreement and case endings.", "Say both sentences aloud."], modelAnswer: `Pattern reference: ${unit.example}\n${unit.rule}\nYour two sentences will differ from the reference.`, completion: "interact" },
      { id: `${id}-sources`, type: "resources", heading: "🔗 Replay the four episodes", items: episodes.filter(episode => episode.unit === index).flatMap(episode => [{ title: episode.title, url: episode.url }, ...episode.grammarLinks]) },
    ] });
  });
  lessons.push({ id: `${prefix}-review`, slug: "review", sectionId: "review", section: sections[20].title, title: `🎯 ${level} · Use your German`, summary: "Apply the story language in your own life, then revisit the episodes you found difficult.", durationMinutes: 30, blocks: [
    { id: `${prefix}-review-plan`, type: "process", heading: "Your review routine", items: [
      { title: "Recall", body: "Choose five episodes. Recall three words from each before opening the cards." },
      { title: "Replay", body: "Watch one scene without the script. Summarize the situation, then verify two details against DW's manuscript." },
      { title: "Transfer", body: "Use three grammar patterns in an original text. Revisit the English/Sinhala explanation for any uncertain pattern." },
    ] },
    { id: `${prefix}-review-writing`, type: "writing-practice", heading: "A message about your next step", prompt: "Write to a friend about your German learning: describe a recent experience, explain one difficulty, suggest a plan and ask a question. Use at least three grammar patterns from the course.", minWords: level === "A2" ? 60 : 100, maxWords: level === "A2" ? 120 : 180, checklist: ["Include all four content points.", "Use three grammar patterns.", "Check sentence connections and endings."], modelAnswer: level === "A2" ? "Hallo Sara, ich lerne seit einem Jahr Deutsch. Gestern habe ich einen Film gesehen. Manche Wörter waren schwierig, weil die Personen schnell gesprochen haben. Ich möchte jeden Tag eine Szene sehen, um besser zu verstehen. Wenn du Zeit hast, können wir am Wochenende zusammen üben. Könntest du mir sagen, wann du Zeit hast? Ich freue mich auf deine Antwort. Viele Grüße!" : "Hallo Sara, seitdem ich regelmäßig deutsche Videos sehe, verstehe ich Gespräche besser. Gestern habe ich eine Szene über die Berufswahl gesehen, die mich an meine eigenen Pläne erinnert hat. Obwohl ich viele Wörter kenne, fällt mir das freie Sprechen noch schwer. Deshalb möchte ich mit dir einen festen Übungstermin vereinbaren. Wir könnten jede Woche eine Szene auswählen und anschließend darüber sprechen. Bevor wir anfangen, sollten wir ein paar Fragen vorbereiten. Wenn ich mehr Zeit hätte, würde ich jeden Tag üben. Im Moment wäre Samstag am besten. Könntest du mir sagen, ob du dann Zeit hast? Ich freue mich auf deine Antwort. Viele Grüße!", completion: "interact" },
    { id: `${prefix}-review-speak`, type: "speaking-practice", heading: "Your next chapter", prompt: "Describe a goal, explain your reasons, compare two options, and suggest a next step. Use your own details.", preparationSeconds: 60, targetSeconds: level === "A2" ? 60 : 120, checklist: ["State the goal.", "Give reasons and examples.", "Compare options.", "Suggest a next step."], modelAnswer: "Planning guide: Mein Ziel ist ... / Ich möchte ..., weil ... / Einerseits ..., andererseits ... / Deshalb werde ich ... . Expand these prompts with your own details.", completion: "interact" },
  ] });
  return migrateAcademyCourse({ key, title: `Deutsch lernen mit Nicos Weg ${level}`, shortTitle: `Nicos Weg ${level}`, description: `An independent study companion to all 76 Nicos Weg ${level} episodes: official DW videos, selected ${level === "A2" ? "German/English vocabulary" : "vocabulary with German definitions"}, 19 grammar units with original English/Sinhala notes, knowledge checks, writing and speaking practice. Includes direct links to each official lesson, full vocabulary, pronunciation and grammar. Film and episode images © Deutsche Welle.`, estimatedMinutes: lessons.reduce((sum, lesson) => sum + lesson.durationMinutes, 0), audienceRoles: ["student"], passMark: 70, quizRevision: 1,
    heroImage: `/images/academy/nicos-weg-${level.toLowerCase()}/episode-01.webp`, theme: { preset: "journey", accent: "teal", typography: "friendly-sans", density: "comfortable", coverStyle: "split-image", lessonHeaderStyle: "media-led" },
    rules: { navigation: "free", lessonCompletion: "required-blocks", requireFinalAssessment: false, attemptLimit: null, feedbackTiming: "immediate" }, sections, lessons, quiz: [],
  });
}

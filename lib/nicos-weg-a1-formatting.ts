import type { AcademyCourse, AcademyRichTextDocument } from "./tutor-academy.ts";
import { nicosWegA1Units } from "./nicos-weg-a1-source.ts";
import { colorNicosWegA1Document } from "./nicos-weg-a1-colors.ts";

type TextNode = { type: "text"; text: string; marks?: { type: string }[] };
const text = (value: string, ...marks: string[]): TextNode => ({ type: "text", text: value, ...(marks.length ? { marks: marks.map((type) => ({ type })) } : {}) });
const paragraph = (content: TextNode[]) => ({ type: "paragraph", content });
const heading = (value: string, level = 2) => ({ type: "heading", attrs: { level }, content: [text(value)] });

const grammarHeadings = [
  ["Verb in position 2", "Nominativ with sein", "Dativ in a fixed expression"],
  ["aus + Dativ", "in for a location", "W-question order"],
  ["mein / meine in Nominativ", "helfen + Dativ", "Modal question"],
  ["Akkusativ after möchten / nehmen", "Verb bracket", "Polite formula"],
  ["können + infinitive", "Location: in + Dativ", "brauchen + Akkusativ"],
  ["Clock time", "Time first, verb second", "Separable verb"],
  ["Jobs with sein", "als + profession", "gern with an activity"],
  ["Wo? versus Wohin?", "zu + Dativ", "Formal instructions"],
  ["Singular and plural verb", "Buying something: Akkusativ", "Numbers and units"],
  ["Adjective after sein", "kein in Akkusativ", "mein in Akkusativ"],
  ["Yes/no questions: verb first", "wehtun is separable", "Optional Dativ person"],
  ["A wish with möchten", "von + Dativ", "Recognise a useful chunk"],
];

// Exact German models from the supplied coursebook; the following text remains
// the original English translation. No film quotations or exercises are altered.
const germanModels = [
  ["Guten Tag, Frau Weber.", "Hallo! Wie geht es dir?", "Danke, mir geht es gut."],
  ["Ich komme aus Sri Lanka.", "Ich wohne in Saarbrücken.", "Woher kommst du?"],
  ["Mein Name ist Piumal.", "Meine Adresse ist Gartenstraße 8.", "Können Sie mir helfen?"],
  ["Ich möchte einen Tee, bitte.", "Was möchtest du essen?", "Ich nehme einen Salat."],
  ["Ich brauche ein Zimmer.", "Ich kann im Hotel bleiben.", "Das Zimmer ist teuer."],
  ["Der Kurs beginnt um neun Uhr.", "Ich arbeite von acht bis zwölf.", "Morgen rufe ich Anna an."],
  ["Ich bin Lehrer.", "Sie arbeitet als Elektrikerin.", "Ich arbeite gern im Restaurant."],
  ["Gehen Sie an der Ampel links.", "Ich gehe zum Bahnhof.", "Ich gehe in den Laden."],
  ["Was kostet das Brot?", "Ich nehme zwei Äpfel.", "Ein Kilo kostet drei Euro."],
  ["Der Pullover ist grün.", "Ich habe keinen Pullover.", "Meine Lieblingsfarbe ist blau."],
  ["Ja, ich habe einen Termin.", "Mein Fuß tut weh.", "Ich habe Schmerzen am Fuß."],
  ["Ich möchte gut Deutsch sprechen.", "Ich träume von einem Laden.", "Ich übe jeden Tag."],
];

const focusPhrases = [
  ["dir", "mir", "Ihnen"], ["aus Sri Lanka", "in Saarbrücken", "Woher"],
  ["Mein", "Meine", "mir helfen"], ["möchte", "einen Tee", "einen Salat"],
  ["ein Zimmer", "kann", "im Hotel"], ["um neun Uhr", "von acht bis zwölf", "rufe", "an"],
  ["bin Lehrer", "als Elektrikerin", "gern"], ["links", "zum Bahnhof", "in den Laden"],
  ["kostet", "zwei Äpfel", "drei Euro"], ["grün", "keinen Pullover", "Meine", "blau"],
  ["einen Termin", "tut", "weh", "am Fuß"], ["möchte", "sprechen", "von einem Laden", "jeden Tag"],
];

function markedText(value: string, phrases: string[], bold = false): TextNode[] {
  // Longest first so a short word never splits an explicitly selected phrase.
  const alternatives = [...phrases, "Nominativ", "Akkusativ", "Dativ"]
    .sort((a, b) => b.length - a.length).map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`(?<![\\p{L}])(?:${alternatives.join("|")})(?![\\p{L}])`, "gu");
  const nodes: TextNode[] = [];
  let offset = 0;
  for (const match of value.matchAll(pattern)) {
    const start = match.index!;
    if (start > offset) nodes.push(text(value.slice(offset, start), ...(bold ? ["bold"] : [])));
    const isCase = ["Nominativ", "Akkusativ", "Dativ"].includes(match[0]);
    // An underline identifies the article ending within the highlighted chunk.
    const ending = match[0].match(/^(ein|kein|mein)(en|em|e)(?=\s|$)/);
    if (ending) {
      nodes.push(text(ending[1], "bold", "highlight"));
      nodes.push(text(ending[2], "bold", "highlight", "underline"));
      if (match[0].length > ending[0].length) nodes.push(text(match[0].slice(ending[0].length), "bold", "highlight"));
    } else nodes.push(text(match[0], "bold", ...(isCase ? [] : ["highlight"])));
    offset = start + match[0].length;
  }
  if (offset < value.length) nodes.push(text(value.slice(offset), ...(bold ? ["bold"] : [])));
  return nodes;
}

function grammarDocument(index: number, title: string): AcademyRichTextDocument {
  const unit = nicosWegA1Units[index];
  const content: Record<string, unknown>[] = [heading(title)];
  const labels = grammarHeadings[index];
  for (let i = 0; i < labels.length; i++) {
    const start = unit.grammar.indexOf(`${labels[i]}\n`);
    const end = i + 1 < labels.length ? unit.grammar.indexOf(`\n${labels[i + 1]}\n`) : unit.grammar.length;
    if (start < 0 || end < start) throw new Error(`Missing grammar section: ${labels[i]}`);
    const body = unit.grammar.slice(start + labels[i].length + 1, end).replace(/\n/g, " ");
    content.push(heading(labels[i], 3), paragraph(markedText(body, focusPhrases[index])));
  }
  return { type: "doc", content };
}

function modelsDocument(index: number, title: string): AcademyRichTextDocument {
  const unit = nicosWegA1Units[index];
  const content: Record<string, unknown>[] = [heading(title), paragraph([text("These models are newly written practice examples, not film dialogue.", "italic")])];
  const german = germanModels[index];
  for (let i = 0; i < german.length; i++) {
    const start = unit.models.indexOf(german[i]);
    const end = i + 1 < german.length ? unit.models.indexOf(german[i + 1]) : unit.models.length;
    if (start < 0 || end < start) throw new Error(`Missing practice model: ${german[i]}`);
    const english = unit.models.slice(start + german[i].length, end).trim();
    content.push({ type: "paragraph", content: [...markedText(german[i], focusPhrases[index], true), { type: "hardBreak" }, text(english, "italic")] });
  }
  return { type: "doc", content };
}

export function styleNicosWegA1Course(input: AcademyCourse): AcademyCourse {
  const course = structuredClone(input);
  for (let index = 0; index < 12; index++) {
    const lesson = course.lessons[index];
    for (const block of lesson.blocks) {
      if (block.type !== "text") continue;
      if (block.id?.endsWith("-grammar")) block.content = colorNicosWegA1Document(grammarDocument(index, block.heading || "Grammar in the scene"), false);
      if (block.id?.endsWith("-models")) block.content = colorNicosWegA1Document(modelsDocument(index, block.heading || "Practice models"), true);
    }
  }
  return course;
}

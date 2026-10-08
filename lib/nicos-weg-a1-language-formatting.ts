import { academyTextColors } from "./academy-text-colors.ts";
import type { AcademyRichTextDocument } from "./tutor-academy.ts";

// Authored German terms for each lesson rule, not automatic language detection.
// Avoid English homographs such as "in", "an", "am" and "will" unless the
// surrounding wording explicitly identifies them as German (contexts below).
const phrases: readonly (readonly (readonly string[])[])[] = [
 [["du","Sie","Ihnen"],["Guten Morgen","Guten Tag","Guten Abend","Hallo","Tschüss","Auf Wiedersehen"],["Bitte","Wie bitte?","Buchstabieren","Sie"]],
 [["-en","ich","-e","du","-st","er/sie/es","-t","wir","ihr","sie/Sie","er"],["sein","haben","ich sein","du haben"],[]],
 [["wer","was","wo","woher","wie"],["einundzwanzig","zwölf","sechzehn","siebzehn","dreißig","null"],["aus Deutschland","aus der Schweiz","in Berlin","in der Schweiz","aus","Sie"]],
 [["der Tisch","die Tasche","das Getränk","der","die","das"],["essen","nehmen","du isst","er nimmt","lesen","du liest","wir","Sie","du","er/sie/es"],["möchten","Bitte"]],
 [["sein","ich/er/sie/es war","du warst","wir/sie/Sie waren","ihr wart"],["nach Berlin","nach Spanien","in die Schweiz","in der Schweiz","nach"],["man","Mann","man spricht"]],
 [["ein/eine","der/die/das","ein Buch","Bücher","ein"],["haben","suchen","kaufen","der/ein","den/einen"],["kein","Ich habe kein Auto","keinen","ein","sein","Das Auto ist rot","rotes"]],
 [["mein","dein","sein","ihr","unser","euer","Ihr","mein Zimmer","meine Wohnung","eure","euren"],["kein","nicht","nicht teuer","zu teuer","zu"],["das Schlafzimmer","das Zimmer","es gibt"]],
 [["um","von … bis …","halb neun","Viertel nach acht","Viertel vor neun"],["aufstehen","steht … auf","muss aufstehen"],["immer","oft","manchmal","nie","dann","danach","schlafen","fahren","du schläfst","er fährt","du/er"]],
 [["zwanzig Uhr dreißig","der erste","der zweite","der dritte","der zwanzigste","am ersten Mai","erste","dritte","-n"],["können","kann/kannst/können"],["diese Woche","nächste Woche","haben","hatte","hattest","hatten","hattet"]],
 [["sein","Ich bin Lehrer","als Lehrerin","als","-in","Kaufmann/Kauffrau"],["wollen","möchten","ich will","du willst","er will","wir wollen","ihr wollt"],["Ich gebe dem Mann das Buch","dem/einem","der/einer","den","-n","-s"]],
 [["Wo?","Wohin?","auf","hinter","neben","über","unter","vor","zwischen"],["aus","bei","mit","nach","von","zu","in dem","im","an dem","zu dem","zum","zu der","zur","bei dem","beim"],["Sie","Gehen Sie","bitte","Steigen Sie hier aus","links","geradeaus"]],
 [["mögen","gern","Ich mag Tee","Ich trinke gern Tee","lieber","möchten"],["-er","klein","kleiner","als","so/genauso … wie","gut","besser","viel","mehr","gern","lieber"],["gehen","schwimmen gehen","einmal","zweimal","dreimal","welch-","welcher Saft","welches Getränk","welche Suppe"]],
 [["wie viel","Wie viel Mehl?","wie viele","Wie viele Eier?","ein Kilo Äpfel","250 Gramm Mehl"],["Euro","Cent","drei Euro","zwanzig Cent","Ich hätte gern(e)"],["Zwiebeln schneiden","Schneiden Sie","Schneide"]],
 [["haben","sein","ge-","-t","machen","gemacht","-ieren","telefoniert","be-","ver-"],["haben","sein","gefahren","gekommen","aufgewacht","bleiben"],["-en","gesehen","gegessen","gefunden","ge","eingekauft","aufgestanden","es","Es regnet","Es ist kalt","im Sommer"]],
 [["Der Pullover ist neu","der neue Pullover","-e","-en","ein neuer Pullover","ein neues Hemd","ein"],["welcher","dieser","dieser Pullover","dieses Hemd","diese Jacke","diesen Pullover"],["Der Pullover gefällt mir","passt mir","steht mir","Das Hemd ist mir zu eng","mir","zu"]],
 [["mich","dich","ihn","sie","es","uns","euch","Sie"],["für","für meinen Bruder","mit meinem Bruder","ein"],["sollen","müssen","wollen","soll … gießen","ich soll","du sollst","er soll","wir sollen","ihr sollt"]],
 [["schneller","höher","besser","am … -sten/-esten","am schnellsten","am besten","-er"],["du","Komm!","ihr","Kommt!","Sie","Kommen Sie!","essen","Iss!","nehmen","Nimm!","lesen","Lies!"],["wann","wie oft","wie lange"]],
 [["müssen","sollen","dürfen","nicht müssen","nicht dürfen"],["wehtun","Mein Fuß tut weh","Meine Füße tun weh","Mein Fuß tut mir weh","haben","Ich habe einen Husten"],["vor","nach","vor dem Essen","nach der Behandlung","das Essen","beim Gehen","ist passiert","hat wehgetan"]],
 [["mir","dir","ihm","ihr","uns","euch","ihnen","Ihnen","helfen","gefallen","fehlen","Du fehlst mir","du"],["in einem großen Haus","-en","mit den guten Freunden"],["Ich hätte gern","Ich wäre gern","Ich würde gern","von","träumen von"]],
];
// Context selects the German use of otherwise ambiguous English words.
const contexts: Record<string, readonly (readonly [surrounding: string, german: string])[]> = {
 "2.2": [["use in:","in"]],
 "4.1": [["use in.","in"],["uses in + accusative","in"],["uses in + dative","in"]],
 "7.0": [["am for a weekday","am"]],
 "8.0": [["After am,","am"]],
 "9.2": [["Location with in uses","in"]],
 "10.0": [["prepositions an,","an"],["hinter, in,","in"]],
 "10.1": [["an dem → am,","am"]],
 "12.2": [["so in/auf take","in/auf"]],
};
type TextNode = { type: "text"; text: string; marks?: Array<{type: string; attrs?: Record<string, unknown>}> };
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function nicosGrammarLanguageParagraph(value: string, unit: number, rule: number) {
 const spans: Array<[number,number]> = [];
 const germanTerms = [...(phrases[unit]?.[rule] || []), "Nominativ", "Akkusativ", "Dativ", "Artikel", "Infinitiv", "Partizip", "Perfekt", "Präposition", ...(value.startsWith("සිංහල:") ? ["in", "an", "am", "was", "will"] : [])];
 for (const phrase of germanTerms) {
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escape(phrase)}(?![\\p{L}\\p{N}])`, "gu");
  for (const match of value.matchAll(pattern)) spans.push([match.index!,match.index! + match[0].length]);
 }
 for (const [context, german] of contexts[`${unit}.${rule}`] || []) {
  let start = value.indexOf(context);
  while (start !== -1) {
   const offset = start + context.indexOf(german);
   spans.push([offset,offset + german.length]);
   start = value.indexOf(context,start + context.length);
  }
 }
 // Merge overlapping phrases, so "Wie bitte?" is one coherent German span.
 const merged: Array<[number,number]> = [];
 for (const [start,end] of spans.sort((a,b) => a[0]-b[0] || b[1]-a[1])) {
  const previous = merged.at(-1);
  if (previous && start <= previous[1]) previous[1] = Math.max(previous[1],end);
  else merged.push([start,end]);
 }
 const content: TextNode[] = []; let offset = 0;
 for (const [start,end] of merged) {
  if (start > offset) content.push({type:"text",text:value.slice(offset,start)});
  content.push({type:"text",text:value.slice(start,end),marks:[{type:"bold"},{type:"textStyle",attrs:{color:academyTextColors.blue}}]});
  offset=end;
 }
 if (offset < value.length) content.push({type:"text",text:value.slice(offset)});
 return {type:"paragraph",content};
}

/** Restyle authored grammar notes only; teacher changes and all plain text survive. */
export function formatNicosGrammarLibrary(input: {key:string; lessons: Array<{id?:string; blocks: Array<{id?:string; type:string; paragraphs?:string[]; content?:AcademyRichTextDocument}>}>}, authored: typeof input) {
 const course = structuredClone(input);
 if (course.key !== "deutsch-nicos-weg-a1") return course;
 for (const lesson of course.lessons) {
  if (!lesson.id?.startsWith("nico-a1-grammar-")) continue;
  for (const block of lesson.blocks) {
   if (block.type !== "text" || !block.id?.includes("-rule-")) continue;
   const target = authored.lessons.find(l => l.id === lesson.id)?.blocks.find(b => b.id === block.id);
   if (!target?.content || JSON.stringify(block.paragraphs) !== JSON.stringify(target.paragraphs)) continue;
   // Ignore formatting when comparing the current rich text with the source.
   // A text edit in the rich-text editor must also be preserved.
   const textContent = (document: unknown): string => {
    if (!document || typeof document !== "object") return "";
    const node = document as {text?:string;content?:unknown[];type?:string};
    return node.text || (node.content || []).map(textContent).join(node.type === "doc" ? "\n" : "");
   };
   if (block.content && textContent(block.content) !== textContent(target.content)) continue;
   block.content = structuredClone(target.content);
  }
 }
 return course;
}

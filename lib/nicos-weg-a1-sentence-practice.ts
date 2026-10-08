export type NicosSentencePractice = {
  tokens: string[];
  verb: number;
  subject: number;
  kind: "Statement" | "Question" | "Instruction";
  explanation: string;
  detail: number;
  detailRole: string;
  replacements: string[];
};

// Original practice sentences. Each replaceable chunk keeps its grammatical role.
export const nicosSentencePractices: NicosSentencePractice[] = [
  { tokens: ["Buchstabieren", "Sie", "bitte", "Ihren Namen", "."], verb: 0, subject: 1, kind: "Instruction", explanation: "A formal instruction starts with the verb, followed by Sie. Ihren Namen is the accusative object.", detail: 3, detailRole: "Object · what should be spelled?", replacements: ["Ihren Nachnamen", "Ihre Adresse"] },
  { tokens: ["Ich", "komme", "aus Spanien", "."], verb: 1, subject: 0, kind: "Statement", explanation: "Ich is the subject; komme is its present-tense verb. aus Spanien tells us the origin.", detail: 2, detailRole: "Origin · where from?", replacements: ["aus Sri Lanka", "aus Deutschland"] },
  { tokens: ["Wo", "wohnen", "Sie", "?"], verb: 1, subject: 2, kind: "Question", explanation: "In a W-question, the verb follows the question word. Sie is the subject.", detail: 0, detailRole: "Question word · what information is requested?", replacements: ["Seit wann", "Mit wem"] },
  { tokens: ["Ich", "möchte", "einen Tee", "trinken", "."], verb: 1, subject: 0, kind: "Statement", explanation: "möchte is conjugated; trinken stays in the infinitive at the end. einen Tee is the accusative object.", detail: 2, detailRole: "Object · what would I like to drink?", replacements: ["einen Kaffee", "ein Wasser"] },
  { tokens: ["Gestern", "war", "ich", "in Berlin", "."], verb: 1, subject: 2, kind: "Statement", explanation: "war is the past form of sein. With Gestern first, the verb stays second and ich follows it.", detail: 3, detailRole: "Location · where was I?", replacements: ["in Hamburg", "in Colombo"] },
  { tokens: ["Nico", "kauft", "einen Tisch", "."], verb: 1, subject: 0, kind: "Statement", explanation: "Nico is the subject. kaufen takes an accusative object: der Tisch becomes einen Tisch.", detail: 2, detailRole: "Object · what does Nico buy?", replacements: ["einen Stuhl", "eine Lampe"] },
  { tokens: ["Es", "gibt", "einen Balkon", "."], verb: 1, subject: 0, kind: "Statement", explanation: "Es is the grammatical subject of es gibt. What exists is expressed as an accusative object.", detail: 2, detailRole: "Object · what is there?", replacements: ["ein Schlafzimmer", "eine Küche"] },
  { tokens: ["Emma", "steht", "um sieben Uhr", "auf", "."], verb: 1, subject: 0, kind: "Statement", explanation: "steht is conjugated; auf is the separable prefix at the end. um introduces a clock time.", detail: 2, detailRole: "Time · when does Emma get up?", replacements: ["um acht Uhr", "um neun Uhr"] },
  { tokens: ["Kannst", "du", "morgen", "kommen", "?"], verb: 0, subject: 1, kind: "Question", explanation: "The conjugated modal Kannst starts this yes/no question. kommen is the infinitive at the end.", detail: 2, detailRole: "Time · when can you come?", replacements: ["am Montag", "um zehn Uhr"] },
  { tokens: ["Ich", "gebe", "dem Mann", "das Buch", "."], verb: 1, subject: 0, kind: "Statement", explanation: "Ich is the subject. dem Mann is the dative recipient; das Buch is the accusative object.", detail: 2, detailRole: "Recipient · to whom do I give the book?", replacements: ["der Frau", "dem Kind"] },
  { tokens: ["Gehen", "Sie", "zum Bahnhof", "."], verb: 0, subject: 1, kind: "Instruction", explanation: "A formal instruction starts with Gehen Sie. zu takes dative; zum means zu dem.", detail: 2, detailRole: "Destination · where should you go?", replacements: ["zur Schule", "zum Supermarkt"] },
  { tokens: ["Ich", "esse", "gern", "Pizza", "."], verb: 1, subject: 0, kind: "Statement", explanation: "esse agrees with Ich. gern expresses enjoyment; Pizza is the object.", detail: 3, detailRole: "Object · what do I enjoy eating?", replacements: ["Salat", "Brot"] },
  { tokens: ["Sie", "kauft", "ein Kilo Äpfel", "."], verb: 1, subject: 0, kind: "Statement", explanation: "Here Sie means she: the singular verb kauft shows that. ein Kilo Äpfel is a quantity expression used as the object.", detail: 2, detailRole: "Quantity and object · what does she buy?", replacements: ["zwei Kilo Kartoffeln", "ein Kilo Tomaten"] },
  { tokens: ["Wir", "haben", "gestern", "Fußball", "gespielt", "."], verb: 1, subject: 0, kind: "Statement", explanation: "haben is the conjugated auxiliary; gespielt is the past participle at the end. Together they form the perfect tense.", detail: 2, detailRole: "Time · when did we play?", replacements: ["am Samstag", "am Sonntag"] },
  { tokens: ["Die Jacke", "gefällt", "mir", "."], verb: 1, subject: 0, kind: "Statement", explanation: "Die Jacke is the subject, even though mir is the person who likes it. gefallen uses a dative experiencer: mir.", detail: 0, detailRole: "Subject · what appeals to me?", replacements: ["Der Pullover", "Das Hemd"] },
  { tokens: ["Ich", "kaufe", "ein Geschenk", "für meinen Bruder", "."], verb: 1, subject: 0, kind: "Statement", explanation: "Ich is the subject; ein Geschenk is the object. für always takes accusative: meinen Bruder.", detail: 3, detailRole: "Prepositional phrase · for whom?", replacements: ["für meine Schwester", "für meinen Vater"] },
  { tokens: ["Du", "läufst", "am schnellsten", "."], verb: 1, subject: 0, kind: "Statement", explanation: "läufst is the du form of laufen. am schnellsten is a superlative describing how you run.", detail: 2, detailRole: "Superlative · how do you run?", replacements: ["am langsamsten", "am besten"] },
  { tokens: ["Ich", "muss", "heute", "zum Arzt", "gehen", "."], verb: 1, subject: 0, kind: "Statement", explanation: "muss expresses necessity and is conjugated. gehen stays in the infinitive at the end; zum means zu dem.", detail: 2, detailRole: "Time · when must I go?", replacements: ["morgen", "am Montag"] },
  { tokens: ["Ich", "wünsche", "dir", "viel Glück", "."], verb: 1, subject: 0, kind: "Statement", explanation: "Ich is the subject; dir is the dative recipient. viel Glück is what I wish for you.", detail: 2, detailRole: "Recipient · to whom do I wish good luck?", replacements: ["Ihnen", "euch"] },
];

export function sentencePracticeForBlock(courseKey: string | undefined, blockId: string | undefined) {
  if (courseKey !== "deutsch-nicos-weg-a1") return undefined;
  const match = /^nico-a1-grammar-(\d{2})-method$/.exec(blockId || "");
  return match ? nicosSentencePractices[Number(match[1])] : undefined;
}

export function practiceSentence(tokens: string[]) {
  return tokens.join(" ").replace(/ ([.?!])/g, "$1");
}

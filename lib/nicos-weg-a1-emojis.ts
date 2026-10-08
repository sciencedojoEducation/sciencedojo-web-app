import type { AcademyCourse, AcademyRichTextDocument, LessonBlock } from "./tutor-academy.ts";

// Explicit meaning-based cues. No guessed emoji for an unknown or abstract word.
const vocabulary: Record<string,string> = {};
const group = (emoji: string, words: string[]) => words.forEach(word => { vocabulary[word] = emoji; });
group("👋", ["hallo","tschüss","auf wiedersehen","bis bald","bis morgen","bis gleich","mach’s gut","jemanden begrüßen","begrüßen","begrüßung"]);
group("🌅", ["guten morgen","am morgen"]);
group("☀️", ["guten tag"]);
group("🌆", ["guten abend","abend","abends"]);
group("🌙", ["gute nacht"]);
group("🙏", ["danke","danke schön","vielen dank","gern geschehen"]);
group("🤝", ["helfen","hilfe","hilfsbereit","herzlich willkommen"]);
group("🧳", ["tasche","gepäck"]);
group("🛂", ["pass"]);
group("📍", ["adresse","wo","hier","dort","da","dorthin","liegen","in der nähe (von)"]);
group("🗺️", ["land","europa","hauptstadt"]);
group("🏙️", ["stadt","berlin","am stadtrand"]);
group("🇩🇪", ["deutschland"]);
group("🇫🇷", ["frankreich"]);
group("🇮🇹", ["italien"]);
group("🇯🇵", ["japan"]);
group("🇨🇳", ["china"]);
group("🧭", ["norden","osten"]);
group("🎂", ["geburtsdatum"]);
group("🔢", ["nummer"]);
group("📞", ["anrufen","handynummer","mit jemandem telefonieren","auf wiederhören","antworten"]);
group("📱", ["handy"]);
group("✉️", ["e-mail","brief"]);
group("🔤", ["buchstabe","buchstabieren","bitte buchstabiere das","bitte buchstabieren sie das"]);
group("👪", ["familie","eltern"]);
group("📷", ["foto","fotograf","fotografin","fotografieren"]);
group("✈️", ["flughafen","flugzeug","fliegen"]);
group("🚗", ["auto","fahrer","fahrerin"]);
group("🚌", ["bus","buslinie"]);
group("🚆", ["bahnhof","bahn"]);
group("🎫", ["fahrkarte"]);
group("🗓️", ["fahrplan","termin","datum","am sonntag","dienstag","donnerstag","freitag","am wochenende","jeden tag","ein paar tage","april","august","dezember","februar"]);
group("🚦", ["ampel"]);
group("⬅️", ["links","auf der linken seite"]);
group("➡️", ["rechts","auf der rechten seite"]);
group("⬆️", ["geradeaus"]);
group("🛣️", ["autobahn","gasse","allee"]);
group("🌉", ["brücke"]);
group("🚲", ["fahrrad","fahrradladen","fahrradgeschäft"]);
group("🏦", ["bank"]);
group("🏢", ["büro","amt","hochhaus","büroraum","besprechungsraum","arbeitstreffen"]);
group("💻", ["computer","bildschirm","büroarbeit"]);
group("🖨️", ["drucker"]);
group("📎", ["hefter"]);
group("✏️", ["bleistift","schreiben"]);
group("📝", ["notizblock","hausaufgabe","hausaufgaben"]);
group("📚", ["buch","bibliothek","lernen","deutschkurs","deutschunterricht","kurs"]);
group("🧑‍🏫", ["lehrer","lehrerin","deutschlehrer","deutschlehrerin"]);
group("⚡", ["elektriker","elektrikerin"]);
group("💼", ["arbeit","arbeiten","beruf","job","von beruf","arbeitszeit","berufstätig","bewerbungsgespräch","bankkauffrau","bankkaufmann"]);
group("⚖️", ["anwalt","anwältin"]);
group("📐", ["architekt","architektin"]);
group("🎨", ["designer","designerin"]);
group("🧑‍🍳", ["bäcker","bäckerin"]);
group("🥤", ["getränk","apfelsaftschorle"]);
group("🍵", ["tee"]);
group("🍕", ["pizza"]);
group("🥗", ["salat","beilage"]);
group("🍍", ["ananas"]);
group("🧀", ["käse"]);
group("🍔", ["hamburger"]);
group("🍞", ["brot","brötchen","bäckerei"]);
group("🍎", ["apfel"]);
group("🍌", ["banane"]);
group("🍐", ["birne"]);
group("🥦", ["brokkoli"]);
group("🥚", ["ei"]);
group("🍗", ["hähnchen"]);
group("🐟", ["fisch"]);
group("🍰", ["apfelkuchen"]);
group("🍪", ["keks"]);
group("🥔", ["chip"]);
group("🧄", ["knoblauch"]);
group("🌶️", ["gewürz"]);
group("🥫", ["dose"]);
group("🍾", ["flasche"]);
group("🍽️", ["essen","gericht","gulasch","restaurant","cafeteria","guten appetit","abendessen"]);
group("☕", ["café"]);
group("📋", ["speisekarte","bestellen","bestellung"]);
group("⚖️", ["kilo"]);
group("🏷️", ["preis","kosten","billig","günstig","im angebot sein","discounter"]);
group("💶", ["bar","bezahlen","das macht …","das macht zusammen …","das macht dann …","das stimmt so","du bist eingeladen"]);
group("👨‍🌾", ["bauer"]);
group("👩‍🌾", ["bäuerin"]);
group("👓", ["brille","brillenetui"]);
group("🏠", ["haus","wohnen","wohnung","zimmer","wg","heimat","heimweh"]);
group("🏨", ["hotel"]);
group("🛏️", ["bett"]);
group("🛋️", ["couch","sofa"]);
group("🪑", ["bürostuhl"]);
group("📚", ["bücherregal"]);
group("📺", ["fernseher"]);
group("🖼️", ["bild"]);
group("💡", ["lampe","idee","ich habe eine idee","gute idee"]);
group("🛁", ["bad","badezimmer"]);
group("🚿", ["duschen"]);
group("🪟", ["fenster"]);
group("🌿", ["garten","auf dem land"]);
group("🪴", ["balkon"]);
group("🌡️", ["heizung","fieber"]);
group("🚘", ["garage"]);
group("🛗", ["aufzug"]);
group("⏰", ["uhr","armbanduhr","dreiviertelstunde","aufstehen","aufwachen"]);
group("🕘", ["es ist neun uhr"]);
group("🧹", ["aufräumen","besen","ausräumen","einräumen"]);
group("🧽", ["abwaschen","abtrocknen"]);
group("🧺", ["aufhängen"]);
group("😴", ["einschlafen","ausschlafen","faulenzen","sich ausruhen"]);
group("🌳", ["draußen"]);
group("🚪", ["ausgang"]);
group("👶", ["baby","babysitter","babysitterin"]);
group("🎉", ["einladung"]);
group("⚽", ["fußball"]);
group("🏀", ["basketball"]);
group("🏐", ["ball"]);
group("🎣", ["angeln"]);
group("🏃", ["sich bewegen","bewegung","fit","aerobic machen"]);
group("🏆", ["gewinnen","auf platz eins","profi"]);
group("🤝", ["mannschaft","bei etwas mitmachen"]);
group("💭", ["denken","träumen","traum","an etwas/jemanden denken"]);
group("🧑‍⚕️", ["arzt","ärztin","arzthelfer","arzthelferin"]);
group("💊", ["apotheke","behandlung"]);
group("🩺", ["behandlungsraum","blutdruck","versicherungskarte"]);
group("🦶", ["fuß"]);
group("🦵", ["bein"]);
group("💪", ["arm"]);
group("👁️", ["auge"]);
group("🖐️", ["daumen"]);
group("🤕", ["schmerzen","wehtun","gips","gehirnerschütterung"]);
group("🤧", ["erkältet","erkältung","gesundheit"]);
group("🩸", ["blut","bluten"]);
group("🫁", ["ausatmen"]);
group("💐", ["gute besserung"]);
group("⛰️", ["berg"]);
group("🌱", ["frühling"]);
group("🍃", ["blatt"]);
group("🌸", ["blume"]);
group("🌼", ["blumen gießen","gießen"]);
group("🏖️", ["ferien","reise","gute reise","ausflug"]);
group("☁️", ["bewölkt"]);
group("🧥", ["pullover"]);
group("👕", ["hemd","bluse","anziehen","anhaben","anprobieren","ausziehen"]);
group("👖", ["hose"]);
group("🧢", ["mütze"]);
group("🎩", ["hut"]);
group("👔", ["anzug","fliege","formell"]);
group("👞", ["arbeitsschuh"]);
group("🌈", ["farbe","bunt"]);
group("🟢", ["grün"]);
group("🔵", ["blau"]);
group("🟡", ["gelb"]);
group("🟤", ["braun"]);
group("🩶", ["grau"]);
group("🌺", ["geblümt"]);
group("🔴", ["gepunktet"]);
group("🐈", ["katze"]);
group("🛠️", ["bremse"]);

const greetings = new Map([ ["Guten Morgen", "🌅"], ["Guten Tag", "☀️"], ["Guten Abend", "🌆"], ["Gute Nacht", "🌙"] ]);

export function nicosVocabularyEmoji(title: string, meaning = ""): string | undefined {
 const word = title.normalize("NFC").trim().split(",")[0].replace(/\s*\(plural\)/giu, "")
  .replace(/^(?:(?:\([^)]*\)|etwas\/jemanden|jemanden\/etwas|jemandem|jemanden|etwas)\s+)+/u, "")
  .replace(/^(?:der|die|das)\s+/u, "").replace(/[.!?]+$/u, "").toLocaleLowerCase("de");
 // The same written noun has two unrelated senses in the episode vocabulary.
 if (word === "bank" && /bench|බංකුව/iu.test(meaning)) return "🪑";
 if (word === "eis") return /ice cream/iu.test(meaning) ? "🍦" : /ice cube|අයිස්/iu.test(meaning) ? "🧊" : undefined;
 if (word === "fliege" && /insect|fly\b/iu.test(meaning)) return undefined;
 return vocabulary[word];
}

type RichNode = {type?:string; text?:string; marks?:unknown[]; content?:RichNode[]; [key:string]:unknown};
function decorateGreetings(document: AcademyRichTextDocument): AcademyRichTextDocument {
 const copy = structuredClone(document) as RichNode;
 function visit(node: RichNode) {
  if (node.type === "paragraph" && node.content) {
   const plain = node.content.map(child => child.text || "").join("");
   let offset = 0; const content: RichNode[] = [];
   for (const child of node.content) {
    if (child.type !== "text" || !child.text) { content.push(child); continue; }
    const value = child.text; let local = 0;
    for (const match of value.matchAll(/(?<![\p{L}])(Guten Morgen|Guten Tag|Guten Abend|Gute Nacht)(?![\p{L}])/gu)) {
     const emoji = greetings.get(match[0])!;
     const position = offset + match.index!;
     if (plain.slice(0,position).endsWith(`${emoji} `)) continue;
     if (match.index! > local) content.push({...child,text:value.slice(local,match.index!)});
     content.push({type:"text",text:`${emoji} `});
     local = match.index!;
    }
    if (local < value.length) content.push({...child,text:value.slice(local)});
    offset += value.length;
   }
   node.content=content;
  } else node.content?.forEach(visit);
 }
 visit(copy);
 return copy as AcademyRichTextDocument;
}
function headingEmoji(block: LessonBlock): string | undefined {
 switch (block.type) {
  case "flashcards": return "🃏";
  case "video": return "🎬";
  case "audio": return "🎧";
  case "writing-practice": return "✍️";
  case "speaking-practice": return "🗣️";
  case "knowledge-check": return "🧩";
  case "resources": return "🔗";
  case "survey": return "🔁";
  case "comparison-table": return block.id?.endsWith("-film") ? "🎬" : "📘";
  case "numbered-list": return "✍️";
  case "accordion": return block.id?.endsWith("-recall") ? "🔁" : undefined;
  case "text":
   if (block.id?.includes("-rule-")) return undefined;
   if (block.id?.endsWith("-goal")) return "🎯";
   if (block.id?.endsWith("-story")) return "🎬";
   if (block.id?.endsWith("-models")) return "✍️";
   if (block.id?.includes("-grammar") || block.id?.includes("nico-review-")) return "📘";
   return undefined;
  default: return undefined;
 }
}
const prefix = (title: string, emoji: string) => title.startsWith(`${emoji} `) || /^\p{Extended_Pictographic}/u.test(title) ? title : `${emoji} ${title}`;

/** Display cues only: exercise text, answer bank, film quotes and translations stay intact. */
export function addNicosLearningEmojis(input: AcademyCourse): AcademyCourse {
 const course = structuredClone(input);
 if (course.key !== "deutsch-nicos-weg-a1") return course;
 const sectionIcons: Record<string,string> = {story:"🎬", review:"🔁", "grammar-library":"📘", "vocabulary-library":"🃏"};
 for (const section of course.sections || []) {
  const emoji = sectionIcons[section.id]; if (emoji) section.title=prefix(section.title,emoji);
 }
 for (const lesson of course.lessons) {
  const section = course.sections?.find(s=>s.id===lesson.sectionId);
  if (section) lesson.section=section.title;
  for (const block of lesson.blocks) {
   const emoji = headingEmoji(block);
   if (emoji && "heading" in block && block.heading) {
    const old = block.heading; block.heading=prefix(old,emoji);
    if (block.type === "text" && block.content) {
     const node = block.content.content?.find(node=>node.type==="heading") as RichNode | undefined;
     if (node?.content?.length===1 && node.content[0].text===old) node.content[0].text=block.heading;
    }
   }
   if (block.type === "flashcards") {
    for (const card of block.items) {
     const cue = nicosVocabularyEmoji(card.title,card.body);
     if (cue && !card.emoji) card.emoji=cue;
    }
   }
   if (block.type === "text" && block.content) block.content=decorateGreetings(block.content);
  }
 }
 return course;
}

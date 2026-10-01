import { migrateAcademyCourse } from "./academy-schema.ts";
import type { AcademyCourse, AcademyLesson, LessonBlock, QuizQuestion } from "./tutor-academy.ts";

// Original ScienceDojo exercises informed by the supplied OLS handouts, recall notes
// and official Goethe materials. Uploaded pages and handwritten learner work are not republished.
type Skill = NonNullable<LessonBlock["curriculum"]>["skills"][number];
export const a2TopicCards = [
  { question: "Wie lernen Sie Deutsch?", points: ["Ziel", "Kurs", "Üben zu Hause", "Hilfe"], followup: "Was machen Sie, wenn Sie eine Frage nicht verstehen?", reply: "Ich bitte die Person, die Frage noch einmal zu sagen." },
  { question: "Wie verbringen Sie Zeit mit Ihrer Familie?", points: ["Personen", "gemeinsames Essen", "Besuche", "Wochenende"], followup: "Was machen Sie lieber mit Freunden?", reply: "Mit Freunden gehe ich lieber ins Kino. Mit meiner Familie koche ich gern." },
  { question: "Wie organisieren Sie Ihren Tag?", points: ["Morgen", "Termine", "Pausen", "Abend"], followup: "Was machen Sie, wenn ein Termin später beginnt?", reply: "Ich prüfe meinen Kalender und informiere die anderen Personen." },
  { question: "Was haben Sie am letzten Wochenende gemacht?", points: ["Ort", "Begleitung", "Aktivität", "Erlebnis"], followup: "Was hat Ihnen besonders gefallen?", reply: "Der Spaziergang am Fluss hat mir gefallen, weil das Wetter schön war." },
  { question: "Wie möchten Sie wohnen?", points: ["Stadt oder Land", "mit wem", "Möbel", "Kosten"], followup: "Was ist Ihnen in einer Wohnung besonders wichtig?", reply: "Eine helle Küche ist mir wichtig, weil ich gern koche." },
  { question: "Wie essen Sie im Alltag?", points: ["Frühstück", "Kochen", "Restaurant", "Lieblingsessen"], followup: "Kochen Sie lieber allein oder mit anderen?", reply: "Ich koche lieber mit anderen, weil wir dabei sprechen können." },
  { question: "Wie kaufen Sie Kleidung ein?", points: ["Geschäft oder online", "Preis", "Größe", "Umtausch"], followup: "Was machen Sie, wenn etwas nicht passt?", reply: "Ich frage im Geschäft, ob ich es umtauschen kann." },
  { question: "Wie erledigen Sie wichtige Termine?", points: ["Termin vereinbaren", "Unterlagen", "Weg", "Rückfragen"], followup: "Was machen Sie, wenn Sie den Raum nicht finden?", reply: "Ich frage an der Information nach dem richtigen Raum." },
  { question: "Wie reisen Sie gern?", points: ["Ziel", "Verkehrsmittel", "Übernachtung", "Begleitung"], followup: "Was machen Sie bei einer Verspätung?", reply: "Ich informiere das Hotel über meine neue Ankunftszeit." },
  { question: "Wie sieht ein Arbeitstag aus?", points: ["Beginn", "Aufgaben", "Kollegen", "Feierabend"], followup: "Was mussten Sie gestern erledigen?", reply: "Gestern musste ich eine Nachricht schreiben und einem Kollegen helfen." },
  { question: "Was hilft Ihnen beim Lernen?", points: ["Wiederholen", "Lesen oder Hören", "Partner", "Internet"], followup: "Wie oft wiederholen Sie neue Wörter?", reply: "Ich wiederhole jeden Abend fünf Wörter und benutze sie in eigenen Sätzen." },
  { question: "Was tun Sie für Ihre Gesundheit?", points: ["Essen", "Schlaf", "Bewegung", "Arzttermin"], followup: "Was machen Sie, wenn Sie krank sind?", reply: "Ich ruhe mich aus. Wenn es nötig ist, vereinbare ich einen Arzttermin." },
  { question: "Was machen Sie in Ihrer Freizeit?", points: ["Hobbys", "Freunde", "drinnen oder draußen", "Häufigkeit"], followup: "Was machen Sie bei schlechtem Wetter?", reply: "Dann bleibe ich zu Hause oder treffe Freunde im Café." },
  { question: "Wie nutzen Sie das Internet?", points: ["Einkaufen", "Nachrichten", "Lernen", "Probleme"], followup: "Was tun Sie, wenn eine Bestellung beschädigt ankommt?", reply: "Ich beschreibe das Problem und bitte um eine neue Lieferung." },
  { question: "Wie planen Sie etwas mit anderen?", points: ["Vorschlag", "Termin", "Aufgaben", "Alternative"], followup: "Was machen Sie, wenn Ihr Vorschlag nicht passt?", reply: "Ich frage nach einem anderen Vorschlag und suche mit der Gruppe eine Lösung." },
  { question: "Welche Pläne haben Sie nach dem A2-Kurs?", points: ["Alltag", "Beruf", "weiterlernen", "Prüfung"], followup: "Welche Fertigkeit möchten Sie noch üben?", reply: "Ich möchte das Sprechen üben, weil ich bei Terminen sicherer werden möchte." },
];
const topicModels = [
  "Mein Ziel ist ein Gespräch ohne Hilfe. Deshalb besuche ich zweimal pro Woche einen Deutschkurs. Zu Hause höre ich kurze Nachrichten und schreibe neue Wörter auf. Wenn ich etwas nicht verstehe, frage ich meine Lehrerin oder übe mit einer Freundin.",
  "Meine Schwester wohnt in der Nähe. Wir essen am Sonntag oft zusammen und kochen etwas Einfaches. Manchmal besuchen wir unsere Eltern. Am Wochenende gehen wir mit der Familie in den Park. Das gefällt mir, weil wir dort viel Zeit zum Sprechen haben.",
  "Am Morgen frühstücke ich und prüfe meinen Kalender. Wichtige Termine schreibe ich sofort auf. Nach dem Mittagessen mache ich eine kurze Pause. Am Abend lerne ich Deutsch. Wenn ein Termin länger dauert, informiere ich die nächste Person und frage nach einer neuen Zeit.",
  "Letztes Wochenende bin ich mit einer Freundin nach Köln gefahren. Wir haben ein Museum besucht und danach am Fluss gesessen. Das Wetter war schön. Besonders gut hat mir der Spaziergang gefallen. Am Abend sind wir mit dem Zug nach Hause gefahren.",
  "Ich möchte in einer kleinen Stadt wohnen, weil die Wege dort kurz sind. Ich wohne gern mit meiner Partnerin zusammen. Ein Tisch am Fenster und ein bequemes Sofa sind mir wichtig. Die Miete darf nicht zu hoch sein. Deshalb vergleichen wir mehrere Wohnungen.",
  "Zum Frühstück esse ich meistens Brot und Obst. Abends koche ich oft Gemüse mit Reis. Einmal im Monat gehe ich mit Freunden ins Restaurant. Mein Lieblingsessen ist Suppe, weil sie einfach und warm ist. Am Wochenende probiere ich manchmal ein neues Rezept aus.",
  "Ich kaufe Kleidung lieber im Geschäft, weil ich sie dort anprobieren kann. Ich vergleiche die Preise und kaufe nicht sofort. Meine Größe ist M. Wenn ein Pullover nicht passt, frage ich nach einem Umtausch. Deshalb bewahre ich den Beleg immer auf.",
  "Ich vereinbare wichtige Termine möglichst früh per Telefon. Vor dem Termin prüfe ich, welche Unterlagen ich brauche. Den Weg suche ich am Abend vorher. Wenn ich einen Raum nicht finde oder eine Information nicht verstehe, frage ich an der Information höflich nach.",
  "Ich reise gern in kleine Städte. Meist fahre ich mit dem Zug, weil ich dabei lesen kann. Ich übernachte lieber in einem einfachen Hotel. Oft reise ich mit einer Freundin. Wir planen die Fahrt zusammen und informieren das Hotel, wenn wir später ankommen.",
  "Mein Arbeitstag beginnt um acht Uhr. Ich begrüße Gäste und beantworte Fragen am Empfang. Mit meinen Kollegen bespreche ich wichtige Aufgaben. Gestern musste ich länger bleiben, weil eine Kollegin krank war. Nach Feierabend gehe ich nach Hause und koche etwas.",
  "Ich wiederhole jeden Tag einige Wörter. Beim Hören notiere ich zuerst das Thema und dann wichtige Zahlen. Eine Freundin übt Gespräche mit mir. Im Internet suche ich kurze deutsche Texte. Das hilft mir, weil ich bekannte Wörter in neuen Situationen sehe.",
  "Ich esse jeden Tag Obst und Gemüse. Nachts schlafe ich ungefähr acht Stunden. Mehrmals pro Woche gehe ich spazieren. Wenn ich krank bin, ruhe ich mich aus. Bei stärkeren Beschwerden vereinbare ich einen Arzttermin und beschreibe, seit wann ich die Beschwerden habe.",
  "In meiner Freizeit lese ich gern und treffe Freunde. Bei schönem Wetter fahren wir mit dem Fahrrad in den Park. Bei Regen spielen wir zu Hause ein Spiel. Das machen wir ungefähr zweimal im Monat. Ich mag beides, weil wir dabei miteinander sprechen können.",
  "Im Internet kaufe ich manchmal Bücher und lese Nachrichten. Außerdem höre ich kurze deutsche Beiträge für meinen Kurs. Ich prüfe Bestellungen genau. Wenn etwas beschädigt ankommt, schreibe ich dem Geschäft eine Nachricht und beschreibe das Problem. Ich bitte dann um eine Lösung.",
  "Wenn wir etwas gemeinsam planen, mache ich zuerst einen Vorschlag. Danach vergleichen wir unsere Termine. Wir verteilen die Aufgaben, damit niemand alles allein machen muss. Wenn eine Zeit nicht passt, suchen wir eine andere. Zum Schluss bestätigen wir Tag, Uhrzeit und Ort.",
  "Nach dem A2-Kurs möchte ich im Alltag sicherer sprechen. Im Beruf möchte ich einfache Nachrichten selbst schreiben. Danach will ich weiter Deutsch lernen. Zuerst wähle ich eine passende Prüfung und wiederhole meine schwachen Fertigkeiten. Am Wochenende übe ich Gespräche mit einer Freundin.",
];

type Window = [number, number];
export type A2CalendarTask = {
  id: string; lessonSlug: string; title: string; day: string; duration: number;
  a: Window[]; b: Window[]; start: number; place: string; purpose: string;
};
export const a2CalendarTasks: A2CalendarTask[] = [
  { id: "routine", lessonSlug: "de-a2-03", title: "Zusammen zum Markt", day: "Dienstag", duration: 45, a: [[600,660],[840,900],[1080,1140]], b: [[660,720],[840,900],[1140,1200]], start: 840, place: "am Marktbrunnen", purpose: "Lebensmittel kaufen" },
  { id: "neighbours", lessonSlug: "de-a2-15", title: "Die Gartenaktion vorbereiten", day: "Samstag", duration: 60, a: [[540,600],[960,1080]], b: [[600,660],[990,1110]], start: 990, place: "im Innenhof", purpose: "die Aufgaben für die Gartenaktion verteilen" },
  { id: "goethe-training", lessonSlug: "de-a2-goethe-05", title: "Material für den Sprachkurs kaufen", day: "Freitag", duration: 45, a: [[540,600],[870,960],[1080,1140]], b: [[600,660],[900,990],[1140,1200]], start: 900, place: "vor der Buchhandlung", purpose: "Hefte für den Kurs kaufen" },
  { id: "goethe-mock-1", lessonSlug: "de-a2-goethe-07", title: "Ein Willkommenspaket besorgen", day: "Mittwoch", duration: 45, a: [[600,660],[780,840],[1020,1110]], b: [[660,720],[840,900],[1050,1140]], start: 1050, place: "am Eingang des Einkaufszentrums", purpose: "ein Willkommenspaket besorgen" },
  { id: "goethe-mock-2", lessonSlug: "de-a2-goethe-09", title: "Einen Bibliotheksbesuch vereinbaren", day: "Montag", duration: 45, a: [[540,600],[900,960],[1110,1200]], b: [[600,660],[930,1020],[1140,1230]], start: 1140, place: "vor der Bibliothek", purpose: "Bücher für ein Lernprojekt auswählen" },
];
const time = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
function tag(lesson: AcademyLesson, block: LessonBlock, skills: Skill[]): LessonBlock {
  return { ...block, curriculum: {
    cefr: "A2", domain: "personal", functions: ["communicate in a familiar situation"], grammar: [],
    ...lesson.blocks[0]?.curriculum, topic: lesson.title, skills,
    ...(lesson.examTrack ? { examTrack: lesson.examTrack } : {}),
  } };
}
function choice(id: string, prompt: string, answer: string, wrong: string[], explanation: string): LessonBlock {
  const position = id.length % 3;
  const labels = [...wrong]; labels.splice(position, 0, answer);
  const question: QuizQuestion = {
    id: `${id}-question`, type: "single-choice", prompt,
    options: labels.map((label, i) => ({ id: String(i), label })),
    correctOptionId: String(position), explanation,
  };
  return { id, type: "knowledge-check", heading: "Vertiefung · prüfen und begründen", question, completion: "pass" };
}
function calendarBlocks(task: A2CalendarTask): LessonBlock[] {
  const id = `a2-resource-calendar-${task.id}`;
  const range = (windows: Window[]) => windows.map(([start,end]) => `${time(start)}–${time(end)}`).join(", ");
  const end = task.start + task.duration;
  return [
    { id: `${id}-guide`, type: "callout", heading: `Terminwerkstatt · ${task.title}`, body: `Originalübung: Sie möchten am ${task.day} zusammen ${task.purpose}. Sie brauchen ${task.duration} Minuten einschließlich des Weges. Nur die angegebenen Zeitfenster sind frei. Nutzen Sie beim Partnertraining nur Ihre eigene Karte und erfragen Sie die andere Verfügbarkeit. Die Tabs sind Übungshilfen, keine privat verborgenen Karten. Allein: Wechseln Sie zwischen den Rollen. Finden Sie Zeit und Ort, ohne das Modell vorher zu öffnen.`, tone: "blue" },
    { id: `${id}-cards`, type: "tabs", heading: "Partnerkarten · fragen statt beide Pläne vorlesen", items: [
      { title: "Karte A", body: `${task.day}: Sie haben frei: ${range(task.a)}. Außerhalb dieser Fenster haben Sie Termine. Beginnen Sie mit einem Vorschlag und fragen Sie nach einer Alternative, falls er nicht passt.` },
      { title: "Karte B", body: `${task.day}: Sie haben frei: ${range(task.b)}. Außerhalb dieser Fenster haben Sie Termine. Nennen Sie einen Grund, wenn ein Vorschlag nicht passt. Schlagen Sie selbst eine andere Zeit vor.` },
    ] },
    { id: `${id}-speak`, type: "speaking-practice", heading: "Sprechen · einen gemeinsamen Termin finden", preparationSeconds: task.lessonSlug.includes("goethe") ? 0 : 30, targetSeconds: 180,
      prompt: `Vereinbaren Sie am ${task.day} einen Termin für ${task.duration} Minuten. Stellen Sie eine Frage, reagieren Sie auf einen unpassenden Vorschlag und bestätigen Sie am Ende Tag, Beginn, Ende und Treffpunkt. Nutzen Sie Ihre Partnerkarte. Das Zeitbudget von drei Minuten ist eine Kursübung; es ist keine vorgeschriebene Einzelzeit der Prüfung.`,
      checklist: ["Beide Verfügbarkeiten erfragt", "Genügend gemeinsame Zeit", "Vorschlag und Gegenreaktion", "Tag, Zeit und Treffpunkt bestätigt"],
      modelAnswer: `A: Hast du um ${time(task.a[0][0])} Zeit? B: Leider nicht, da habe ich einen Termin. A: Wann kannst du? B: Wie wäre es um ${time(task.start)}? A: Ja, das passt. Dann haben wir bis ${time(end)} Zeit. B: Treffen wir uns ${task.place}? A: Gut. Also am ${task.day} von ${time(task.start)} bis ${time(end)}, ${task.place}. Bis dann! Eine mögliche Lösung; andere Zeitfenster sind erlaubt, wenn beide Personen lange genug frei haben.`, completion: "interact" },
    choice(`${id}-check`, `Prüfen Sie beide Karten: Welcher Vorschlag lässt ${task.duration} Minuten gemeinsame Zeit zu?`,
      `${task.day}, ${time(task.start)}–${time(end)}.`,
      [`${task.day}, ${time(task.a[0][0])}–${time(task.a[0][0]+task.duration)}.`, `${task.day}, ${time(task.b[0][0])}–${time(task.b[0][0]+task.duration)}.`],
      `A ist frei ${range(task.a)}; B ist frei ${range(task.b)}. ${time(task.start)}–${time(end)} liegt vollständig in beiden freien Fenstern. Bei einer Einigung müssen Anfang und benötigte Dauer passen.`),
  ];
}
const interactionPhrases: Array<[string,string]> = [
  ["Vorschlagen", "Können wir uns am Donnerstag um fünf treffen?"],
  ["Zustimmen", "Ja, das passt mir gut. Dann machen wir das so."],
  ["Höflich ablehnen", "Da kann ich leider nicht, weil ich arbeiten muss."],
  ["Alternative anbieten", "Ich kann erst ab sechs. Passt dir diese Zeit?"],
  ["Begründen", "Der Park ist besser, weil er in der Nähe ist."],
  ["Nachfragen", "Meinst du halb sechs, also siebzehn Uhr dreißig?"],
  ["Wiederholung erbitten", "Könntest du das bitte noch einmal sagen?"],
  ["Aufgaben verteilen", "Ich bringe die Getränke mit. Kannst du das Essen besorgen?"],
  ["Abschließen", "Dann treffen wir uns am Donnerstag um sechs vor dem Café."],
];
function phraseBlocks(lesson: AcademyLesson): LessonBlock[] {
  const id = `${lesson.slug}-resource-phrases`;
  return [
    { id: `${id}-bank`, type: "flashcards", heading: "Redemittel · auf die andere Person reagieren",
      items: interactionPhrases.map(([title,body]) => ({ title, body: `${body} Verändern Sie Tag, Zeit oder Ort. Reagieren Sie anschließend auf eine Rückfrage.` })), completion: "interact" },
    { id: `${id}-repair`, type: "comparison-table", heading: "Redemittel · natürlich und höflich", columns: ["Bedeutung", "Passende Form", "Beispiel"],
      rows: [["Meinung erfragen", "Wie findest du …? / Wie finden Sie …?", "Wie findest du den Vorschlag?"],
        ["Reaktion mit Dativ", "Die Idee gefällt mir.", "Die Idee gefällt mir, aber ich habe erst ab sechs Zeit."],
        ["Zeit bestätigen", "Das passt mir gut.", "Donnerstag um sechs passt mir gut."],
        ["Höflich widersprechen", "Leider passt das nicht. Können wir …?", "Leider passt das nicht. Können wir uns später treffen?"]] },
  ];
}
const grammarPractice: Record<number, Array<[string,string,string,string,string]>> = {
  1: [
    ["Sie helfen einer Freundin. Welcher Satz stimmt?", "Ich helfe ihr.", "Ich helfe sie.", "Ich helfe ihn.", "Helfen verlangt Dativ: ihr. Die weibliche Person ist im Kontext eindeutig."],
    ["Sie begrüßen Herrn Roth höflich. Welche Frage stimmt?", "Wie geht es Ihnen?", "Wie geht es ihnen? (höfliche Anrede)", "Wie geht es Sie?", "Höfliche Anrede: Sie/Ihnen groß; nach es geht steht Dativ."],
  ],
  5: [
    ["Der Tisch hat seinen festen Platz vor dem Fenster. Wo steht er?", "Vor dem Fenster.", "Vor das Fenster.", "Vor den Fenster.", "Wo? Ort mit Wechselpräposition: Dativ. Das Fenster → dem Fenster."],
    ["Sie stellen den Tisch an einen neuen Platz. Wohin stellen Sie ihn?", "Vor das Fenster.", "Vor dem Fenster.", "Vor der Fenster.", "Wohin? Ziel mit Wechselpräposition: Akkusativ. Entscheidend ist das Ziel, nicht Bewegung allein."],
  ],
  7: [
    ["Jacke A kostet 60 Euro; Jacke B kostet 40 Euro. Welche Aussage stimmt?", "Jacke B ist günstiger als Jacke A.", "Jacke B ist teurer als Jacke A.", "Beide Jacken sind gleich teuer.", "40 Euro sind weniger als 60 Euro. Komparativ + als: günstiger als."],
    ["Von drei Wegen dauert der Bus am wenigsten. Welcher Satz passt?", "Mit dem Bus komme ich am schnellsten an.", "Mit dem Bus komme ich am schnell an.", "Mit dem Bus komme ich am schneller an.", "Superlativ als Adverb: am schnellsten; Komparativ: schneller."],
  ],
  8: [
    ["Sie schreiben Ihrer Chefin. Wie bitten Sie höflich um Hilfe?", "Könnten Sie mir bitte helfen?", "Könntest du mir bitte helfen? (formelle Anrede)", "Könnten Sie mich bitte helfen?", "Sie bleibt konsequent; helfen + Dativ: mir."],
    ["Sie kaufen ein Geschenk für Ihren Bruder. Welche Form stimmt?", "Für meinen Bruder.", "Für meinem Bruder.", "Für meine Bruder.", "Für verlangt Akkusativ: meinen Bruder."],
  ],
  11: [
    ["Sie nennen den Grund mit weil. Welche Form stimmt?", "Ich lerne heute, weil ich morgen einen Test habe.", "Ich lerne heute, weil ich habe morgen einen Test.", "Ich lerne heute, weil habe ich morgen einen Test.", "Weil beginnt einen Nebensatz: Das finite Verb habe steht am Ende."],
    ["Sie kennen die Antwort noch nicht. Welche indirekte Ja/Nein-Frage stimmt?", "Ich weiß nicht, ob der Kurs heute stattfindet.", "Ich weiß nicht, wenn der Kurs heute stattfindet.", "Ich weiß nicht, ob findet der Kurs heute statt.", "Ob fragt nach einer unbekannten Ja/Nein-Antwort; das finite Verb steht am Ende."],
  ],
  15: [
    ["Sie beschreiben eine Folge mit deshalb. Welche Form stimmt?", "Es regnet. Deshalb bleiben wir drinnen.", "Es regnet. Deshalb wir bleiben drinnen.", "Es regnet. Deshalb drinnen wir bleiben.", "Deshalb besetzt Position eins; das finite Verb bleiben folgt auf Position zwei."],
    ["Sie planen eine Alternative für Regen. Welche Form stimmt?", "Wenn es regnet, feiern wir im Haus.", "Wenn regnet es, feiern wir im Haus.", "Wenn es regnet, wir feiern im Haus.", "Wenn-Nebensatz: Verb am Ende. Nach dem vorangestellten Nebensatz beginnt der Hauptsatz mit dem finiten Verb."],
  ],
};
function grammarBlocks(lesson: AcademyLesson, chapter: number): LessonBlock[] {
  const tasks = grammarPractice[chapter];
  if (!tasks) return [];
  const blocks: LessonBlock[] = tasks.map(([prompt,answer,a,b,explanation],i) =>
    choice(`${lesson.slug}-resource-grammar-${i}`,prompt,answer,[a,b],explanation));
  if (chapter === 5) blocks.unshift({
    id: `${lesson.slug}-resource-grammar-map`, type: "comparison-table", heading: "Grammatik · Ort und Ziel unterscheiden", columns: ["Frage", "Situation", "Beispiel"],
    rows: [["Wo? + Dativ", "Der Gegenstand ist an einem Ort.", "Der Stuhl steht neben dem Tisch."],
      ["Wohin? + Akkusativ", "Sie bringen den Gegenstand an einen Zielort.", "Ich stelle den Stuhl neben den Tisch."],
      ["Bewegung innerhalb eines Ortes", "Bewegung allein entscheidet nicht über den Fall.", "Ich laufe im Park. (Wo? im Park)"]],
  });
  if (chapter === 11) blocks.unshift({
    id: `${lesson.slug}-resource-connectors`, type: "comparison-table", heading: "Grammatik · Grund, Folge, Bedingung und Frage", columns: ["Funktion", "Form", "Beispiel"],
    rows: [["Grund", "weil + Verb am Ende", "Ich komme später, weil mein Zug Verspätung hat."],
      ["Grund", "denn + Hauptsatz", "Ich komme später, denn mein Zug hat Verspätung."],
      ["Folge", "deshalb + Verb auf Position zwei", "Mein Zug hat Verspätung. Deshalb komme ich später."],
      ["Bedingung", "wenn + Verb am Ende", "Wenn ich später komme, rufe ich an."],
      ["Unbekannte Ja/Nein-Antwort", "ob + Verb am Ende", "Ich frage, ob der Termin noch möglich ist."]],
  });
  return blocks;
}
const writingRepairs: LessonBlock[] = [
  { id: "a2-resource-writing-repair-guide", type: "worked-example", heading: "Schreiben · eine Nachricht gezielt verbessern",
    problem: "Entwurf: Hallo Ben, ich komme zu spät weil mein Bus hat Verspätung. Kannst du um 18 Uhr zum Café? Reparieren Sie Verbposition und die unvollständige Frage.",
    steps: [{ title: "Grund", body: "Nach weil steht das finite Verb am Ende: weil mein Bus Verspätung hat." },
      { title: "Handlung", body: "Kannst du braucht hier einen Infinitiv: Kannst du um 18 Uhr zum Café kommen?" },
      { title: "Inhalt", body: "Entschuldigung, Grund und neue Zeit bleiben klar. Kürzen Sie auf die verlangte Wortzahl." }],
    answer: "Hallo Ben, entschuldige bitte! Mein Bus hat Verspätung. Können wir uns erst um 18 Uhr vor dem Café treffen? Danke für dein Verständnis! Bis gleich!" },
  { id: "a2-resource-writing-sms", type: "writing-practice", heading: "Goethe Schreiben · SMS mit drei Inhaltspunkten",
    prompt: "Sie sind mit Ben um 17:30 Uhr vor dem Café verabredet. Ihr Bus hat Verspätung. Entschuldigen Sie sich, nennen Sie den Grund und schlagen Sie 18 Uhr vor. Schreiben Sie 20–30 Wörter.",
    minWords: 20, maxWords: 30, checklist: ["Entschuldigung", "Grund", "Neue Uhrzeit"], completion: "interact",
    modelAnswer: "Hallo Ben, entschuldige bitte! Mein Bus hat Verspätung. Können wir uns erst um 18 Uhr vor dem Café treffen? Danke für dein Verständnis! Bis gleich!" },
  { id: "a2-resource-writing-email", type: "writing-practice", heading: "Goethe Schreiben · höfliche E-Mail",
    prompt: "Ihre Chefin Frau Berger lädt Sie zu einem Teamabend ein. Bedanken Sie sich und sagen Sie zu. Fragen Sie, was Sie mitbringen sollen. Machen Sie einen Vorschlag für das Essen. Schreiben Sie 30–40 Wörter.",
    minWords: 30, maxWords: 40, checklist: ["Dank und Zusage", "Frage zum Mitbringen", "Essensvorschlag", "Sie/Ihnen und passender Schluss"], completion: "interact",
    modelAnswer: "Liebe Frau Berger, vielen Dank für die Einladung. Ich komme gern zum Teamabend. Was soll ich mitbringen? Wir könnten zusammen Gemüse und Reis kochen. Das lässt sich gut vorbereiten. Freundliche Grüße Mila" },
  choice("a2-resource-writing-register", "Sie schreiben Frau Berger höflich. Welche Bitte ist vollständig und passt zur Anrede?", "Könnten Sie mir bitte sagen, was ich mitbringen soll?", ["Kannst du mir sagen, was ich mitbringen soll?", "Könnten Sie bitte sagen ich mitbringen?"], "Sie bleibt höflich und großgeschrieben; die indirekte Frage enthält das finite Verb soll am Ende."),
];

/** Add only new stable blocks. Never replace author edits, existing media or assessments. */
export function enrichGermanA2Course(input: AcademyCourse): AcademyCourse {
  const course = structuredClone(input);
  const previousMinutes = new Map(course.lessons.map(lesson => [lesson.slug, lesson.durationMinutes]));
  for (const lesson of course.lessons) {
    const ids = new Set(lesson.blocks.map(block => block.id));
    const append = (blocks: LessonBlock[], skills: Skill[], afterId?: string) => {
      const additions = blocks.filter(block => !ids.has(block.id)).map(block => tag(lesson,block,skills));
      if (!additions.length) return;
      additions.forEach(block => ids.add(block.id));
      const index = afterId ? lesson.blocks.findIndex(block => block.id === afterId) : -1;
      if (index < 0) lesson.blocks.push(...additions); else lesson.blocks.splice(index+1,0,...additions);
      lesson.durationMinutes += additions.some(block => block.type === "speaking-practice" || block.type === "writing-practice") ? 10 : 5;
    };
    const core = lesson.slug.match(/^de-a2-(\d{2})$/);
    if (core) {
      const n = Number(core[1]); const card = a2TopicCards[n-1];
      if (card) {
        append([
          { id: `${lesson.slug}-resource-topic`, type: "numbered-list", heading: "Sprechen · von Stichwörtern zu verbundenen Sätzen",
            items: card.points.map(title => ({ title, body: "Nennen Sie eine eigene Information und ergänzen Sie ein Beispiel oder einen Grund. Erfundenes ist erlaubt, wenn Sie nichts Persönliches erzählen möchten." })) },
          { id: `${lesson.slug}-resource-monologue`, type: "speaking-practice", heading: "Sprechen · Themenkarte und spontane Rückfrage",
            prompt: `${card.question} Stichwörter: ${card.points.join(" · ")}. Sprechen Sie zu jedem Punkt und verbinden Sie Ihre Gedanken. Lassen Sie eine Partnerperson danach fragen: „${card.followup}“ Antworten Sie spontan mit einer Zusatzinformation. Allein: Nehmen Sie erst Ihren Beitrag auf, lesen Sie dann die Rückfrage und antworten Sie erneut. 30 Sekunden Vorbereitung sind eine Lernhilfe im Kernkurs, keine Prüfungsregel.`,
            preparationSeconds: 30, targetSeconds: 90, completion: "interact",
            checklist: ["Vier Stichwörter angesprochen", "Eigene Beispiele und passender Grund", "Nicht nur einzelne Wörter", "Auf die Rückfrage reagiert"],
            modelAnswer: `Möglicher Beitrag: ${topicModels[n-1]}\n\nMögliche Rückfrage: ${card.followup}\nAntwort: ${card.reply}\n\nNutzen Sie das Modell zur Kontrolle und erzählen Sie mit eigenen Angaben. Lernen Sie es nicht auswendig.` },
        ], ["speaking","interaction"], `${lesson.slug}-speak-3`);
        append([{ id: `${lesson.slug}-resource-recall`, type: "process", heading: "Recall · frei abrufen und verändern", items: [
          { title: "Heute", body: `Sprechen Sie noch einmal zu „${card.question}“, ohne Modell. Notieren Sie eine Formulierung, die Sie gesucht haben.` },
          { title: "In drei Tagen", body: "Sprechen Sie erneut. Ändern Sie eine Zeit oder Person und beantworten Sie eine neue Rückfrage." },
          { title: "In einer Woche", body: "Verbinden Sie dieses Thema mit einem früheren Kapitel. Prüfen Sie Ihre Aufnahme und verbessern Sie genau eine Stelle. Die Termine planen Sie selbst; der Kurs verschickt hierfür keine automatischen Erinnerungen." },
        ] }], ["speaking","vocabulary"], `${lesson.slug}-recall`);
      }
      append(grammarBlocks(lesson,n), ["grammar"]);
      if (n === 13 || n === 15) append(phraseBlocks(lesson), ["speaking","interaction","vocabulary"]);
      if (n === 15) append([
        { id: "a2-resource-party-roles", type: "tabs", heading: "Alltagstransfer · gemeinsam einen Kursabend planen", items: [
          { title: "Rolle A", body: "Sie möchten einen Kursabend im Gemeinschaftsraum organisieren. Sie können am Freitag erst ab 18 Uhr. Der Raum ist bis 21 Uhr verfügbar. Sie haben 25 Euro für Essen. Besprechen Sie Tag, Ort, Essen und eine Aktivität." },
          { title: "Rolle B", body: "Sie können am Freitag nur bis 20 Uhr. Sie bringen Getränke mit. Eine Person isst kein Fleisch. Sie möchten kein lautes Musikprogramm, weil im Haus Kinder schlafen. Stellen Sie Rückfragen und finden Sie eine passende Alternative." },
        ] },
        { id: "a2-resource-party-speak", type: "speaking-practice", heading: "Alltagstransfer · zustimmen, ablehnen, Aufgaben verteilen", prompt: "Nutzen Sie die beiden Rollenkarten. Vereinbaren Sie Beginn, Ende, Essen, eine ruhige Aktivität und zwei Aufgaben. Reagieren Sie auf mindestens einen Einwand. Diese breite Planungsaufgabe trainiert Alltagstransfer; sie ist keine Behauptung über den genauen Goethe-Teil-3-Auftrag.",
          preparationSeconds: 30, targetSeconds: 180, completion: "interact",
          checklist: ["Beide Rollen und Grenzen berücksichtigt", "Vegetarische Option und ruhige Aktivität", "Konkrete Zuständigkeiten", "Vereinbarung zusammengefasst"],
          modelAnswer: "A: Können wir um 18 Uhr beginnen? B: Ja, aber ich muss um 20 Uhr gehen. A: Dann feiern wir von 18 bis 20 Uhr. Ich mache einen Nudelsalat ohne Fleisch. Die Zutaten kosten ungefähr 20 Euro. B: Gut, ich bringe Wasser und Saft mit. Wollen wir Musik hören? A: Lieber leise. B: Wir können auch ein Ratespiel machen. A: Einverstanden. Dann reserviere ich den Raum und bereite das Essen vor." },
      ], ["speaking","interaction"]);
    }
    for (const task of a2CalendarTasks.filter(task => task.lessonSlug === lesson.slug))
      append(calendarBlocks(task), ["speaking","interaction","reading"]);
    if (lesson.slug === "de-a2-goethe-05") append([
      { id: "a2-resource-goethe-guide", type: "text", heading: "Goethe Sprechen · Aufgabenkarte und echte Reaktion", paragraphs: [
        "Teil 1: Mit vier Stichwortkarten vier Fragen zur Person stellen und die Fragen der anderen Person beantworten. Teil 2: Zu einer Themenkarte über das eigene Leben erzählen; anschließend auf ein bis zwei Zusatzfragen reagieren. Teil 3: Mit unterschiedlichen Informationen eine gemeinsame Lösung finden.",
        "Die mündliche Paarprüfung dauert insgesamt etwa 15 Minuten und hat keine separate Vorbereitungszeit. Im beigefügten offiziellen Modellsatz ist jeweils etwa 20 Sekunden zum Ansehen der Karten vorgesehen. Das ist kurze Orientierung an der Aufgabe, keine zusätzliche Vorbereitungsphase. Die Zeitziele unserer einzelnen Aufnahmen sind Übungsbudgets.",
      ] },
      { id: "a2-resource-goethe-question-cards", type: "speaking-practice", heading: "Goethe Teil 1 · vier Fragen und vier Antworten", prompt: "Ihre Stichwortkarten: Arbeitsweg · Sprachen · Freizeit · Lieblingsessen. Stellen Sie vier passende Fragen. Ihre Partnerperson antwortet und fragt dann nach Wohnort, Lernen, Wochenende und Beruf. Reagieren Sie mit eigenen Antworten. Allein: beide Rollen sprechen. Ohne vorbereiteten Text.", preparationSeconds: 0, targetSeconds: 180, completion: "interact",
        checklist: ["Vier verständliche Fragen", "Vier passende Antworten", "Du oder Sie konsequent", "Auf die andere Person reagieren"],
        modelAnswer: "A: Wie kommen Sie zur Arbeit? B: Ich fahre meistens mit dem Bus. A: Welche Sprachen sprechen Sie? B: Ich spreche Polnisch und etwas Deutsch. A: Was machen Sie gern in Ihrer Freizeit? B: Ich lese gern. A: Was essen Sie am liebsten? B: Ich esse gern Gemüse mit Reis. Danach wechseln die Rollen: Wo wohnen Sie? Wie lernen Sie Deutsch? Was machen Sie am Wochenende? Was sind Sie von Beruf?" },
      { id: "a2-resource-goethe-topic-bank", type: "accordion", heading: "Goethe Teil 2 · neue Themen für weitere Versuche", items: [
        { title: "Ihr Geld", body: "Stichwörter: feste Kosten · Einkäufe · Freizeit · Sparen. Erzählen Sie zu allen Punkten. Rückfrage: Für welches Ziel möchten Sie sparen? Beispiel: Ich bezahle jeden Monat meine Miete. Für die Freizeit plane ich wenig Geld ein. Ich spare für einen Sprachkurs." },
        { title: "Digitale Medien", body: "Stichwörter: Kontakt · Informationen · Lernen · Dauer. Rückfrage: Was machen Sie lieber ohne Internet? Beispiel: Ich schreibe meiner Familie Nachrichten. Ich höre kurze deutsche Beiträge. Am Abend lege ich das Telefon weg und lese ein Buch." },
        { title: "Ihre Zukunft", body: "Stichwörter: Beruf · Familie · Lernen · Freizeit. Rückfrage: Was möchten Sie zuerst verändern? Beispiel: Zuerst möchte ich regelmäßig Deutsch üben. Später möchte ich eine neue Arbeit finden. Am Wochenende möchte ich mehr Zeit für Freunde haben." },
      ] },
    ], ["speaking","interaction"]);
    if (lesson.slug === "de-a2-goethe-06") {
      append(phraseBlocks(lesson), ["speaking","interaction","vocabulary"]);
      append(writingRepairs, ["writing","grammar"]);
    }
    if (["de-a2-goethe-08","de-a2-telc-08"].includes(lesson.slug)) append([
      { id: `${lesson.slug}-resource-feedback`, type: "comparison-table", heading: "Sprechen · Feedback mit einem konkreten Beleg", columns: ["Beobachtung", "Beleg aus Ihrer Aufnahme", "Nächster Versuch"],
        rows: [["Aufgabe erfüllt", "Welcher Punkt blieb offen?", "Den fehlenden Punkt zuerst ergänzen."],
          ["Interaktion und Register", "Wo haben Sie gefragt oder auf einen Einwand reagiert?", "Eine Rückfrage und eine passende Reaktion einbauen."],
          ["Wortschatz und Strukturen", "Welche Formulierung war verständlich, welche unklar?", "Eine Formulierung mit eigenen Angaben verbessern."],
          ["Aussprache und Verständlichkeit", "Welche Zeit oder welches Wort musste wiederholt werden?", "Diese Stelle langsam und deutlich neu aufnehmen."]] },
      { id: `${lesson.slug}-resource-feedback-note`, type: "callout", heading: "Ihr Feedback ist keine offizielle Prüfungsnote", body: "Nutzen Sie die Tabelle für Selbstkontrolle oder Rückmeldung einer Lehrkraft. Die offiziellen Kriterien und Punkte stehen beim jeweiligen Anbieter. Ein korrekt angeklickter Check bewertet keine freie mündliche oder schriftliche Leistung.", tone: "teal" },
    ], ["speaking","interaction","mediation"]);
    if (lesson.slug === "de-a2-telc-06") append([
      { id: "a2-resource-telc-transfer", type: "text", heading: "telc · Redemittel übertragen, eigenes Format behalten", paragraphs: [
        "Die beigefügten Aufgaben zu Stichwortkarten und Kalendern stammen überwiegend aus Goethe-orientiertem Training. Nutzen Sie ihre Redemittel auch für telc, aber übernehmen Sie nicht automatisch die Teilnummern oder Schreibwortzahlen. Der telc-Weg bleibt auf Start Deutsch 2 / telc Deutsch A2 ausgerichtet.",
        "Üben Sie das Alltagsgespräch und das Aushandeln einer Lösung ohne vorbereiteten Text. Stellen Sie Rückfragen, erklären Sie eine Grenze und bestätigen Sie das Ergebnis. Für die gesamte Simulation verwenden Sie den offiziellen telc-Übungstest mit dessen eigenen Aufgaben und Bewertungsregeln.",
      ] },
      ...phraseBlocks(lesson),
    ], ["speaking","interaction","vocabulary"]);
    if (lesson.slug === "de-a2-goethe-10") append([
      { id: "a2-resource-official-sequence", type: "process", heading: "Offizielle Praxis · Modellsatz und Übungssatz getrennt nutzen", items: [
        { title: "Modellsatz kennenlernen", body: "Nutzen Sie den offiziellen Modellsatz für Aufgabenformat, Antwortbogen, Hörablauf und die Sprechbeispiele. Lösungen und Prüferhinweise erst nach dem eigenen Versuch lesen." },
        { title: "Mit Kriterien besprechen", body: "Besprechen Sie Schreiben und Sprechen mit einer Lehrkraft. Notieren Sie einen fehlenden Inhaltspunkt und eine unklare Formulierung. Prüfen Sie die Kriterien im offiziellen Material." },
        { title: "Mit frischem Übungssatz prüfen", body: "Verwenden Sie den Übungssatz Erwachsene als neuen Versuch unter offiziellen Bedingungen, mit dem dazugehörigen Audio. Der Modellsatz und der Übungssatz haben verschiedene Aufnahmen und Lösungsschlüssel." },
      ] },
    ], ["reading","listening","writing","speaking"]);
  }
  const addedMinutes = course.lessons.filter(lesson => !lesson.examTrack || lesson.examTrack === "goethe")
    .reduce((sum,lesson) => sum + lesson.durationMinutes - (previousMinutes.get(lesson.slug) || 0),0);
  course.estimatedMinutes += addedMinutes;
  return migrateAcademyCourse(course);
}

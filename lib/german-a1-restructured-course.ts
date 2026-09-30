import { migrateAcademyCourse } from "./academy-schema.ts";
import { germanA1Course } from "./german-a1-course.ts";
import { publicLifePracticeBlocks } from "./german-a1-public-life-practice.ts";
import { lifePracticeBlocks } from "./german-a1-life-practice.ts";
import { germanA1FinalListening } from "./german-a1-final-listening.ts";
import { previousChapterRecall } from "./german-a1-retrieval.ts";
import { styleGermanA1Lesson } from "./german-a1-visual-design.ts";
import {
  germanA1Curriculum,
  germanA1CurriculumSources,
  germanA1ExamTracks,
} from "./german-a1-curriculum.ts";
import type { AcademyCourse, AcademyLesson, LessonBlock } from "./tutor-academy.ts";

const chapterSections = [
  { id: "a1-foundations", title: "Ankommen und Menschen" },
  { id: "a1-everyday", title: "Alltag und Zuhause" },
  { id: "a1-public-life", title: "Einkaufen, Stadt und Reisen" },
  { id: "a1-work-life", title: "Arbeit, Freizeit und Gesundheit" },
  { id: "a1-mastery", title: "A1 im Alltag anwenden" },
];

const grammarLabelsNotForPicturePractice = new Set([
  "der Verbstamm", "die Endung", "das Präsens", "am Satzende", "der Infinitiv",
  "die Negation", "der Gegensatz", "der Nominativ", "der Akkusativ",
  "das Subjekt", "das Objekt", "der Imperativ", "die Aufforderung", "Position zwei",
  "der Artikel", "bestimmt", "unbestimmt", "das Nomen", "der Plural",
  "der Singular", "der Satz", "die Aussage", "das Verb", "die Reihenfolge",
  "das Präfix", "trennbar", "zusammenbleiben", "der Zeitraum",
  "die Möglichkeit", "die Pflicht", "der Wunsch", "die Erlaubnis",
  "der Empfänger", "die Präposition", "verneinen", "positiv", "negativ",
]);

function sectionForChapter(number: number) {
  if (number <= 3) return chapterSections[0];
  if (number <= 6) return chapterSections[1];
  if (number <= 9) return chapterSections[2];
  if (number <= 13) return chapterSections[3];
  return chapterSections[4];
}

function sourceLesson(id: string) {
  const lesson = germanA1Course.lessons.find((item) => item.id === id);
  if (!lesson) throw new Error(`German A1 source lesson ${id} is missing.`);
  return lesson;
}

type IntegratedPractice = {
  reading: string;
  question: string;
  correct: string;
  distractors: [string, string];
  writing: string;
  writingModel: string;
  speaking: string;
  speakingModel: string;
};

const integratedPractice: Record<number, IntegratedPractice> = {
  4: {
    reading: "Deutschkurs A1: Montag und Mittwoch, 18:00–19:30 Uhr. Am Mittwoch beginnt der Kurs ausnahmsweise um 18:30 Uhr. Bitte bringen Sie Ihr Kursbuch mit.",
    question: "Wann beginnt der Kurs am Mittwoch?", correct: "Um 18:30 Uhr.", distractors: ["Um 18:00 Uhr.", "Um 19:30 Uhr."],
    writing: "Sie kommen am Mittwoch 15 Minuten später zum Kurs. Schreiben Sie Ihrer Lehrerin eine Nachricht: Grund, Ankunftszeit und eine Frage zum Kursbuch.",
    writingModel: "Guten Tag Frau Weber, mein Bus hat Verspätung. Ich komme am Mittwoch um 18:45 Uhr. Brauche ich heute das Kursbuch? Entschuldigung und viele Grüße, Sam",
    speaking: "Erzählen Sie: Wann stehen Sie auf, wann beginnt Ihr Kurs und was machen Sie am Abend? Stellen Sie anschließend eine Frage nach einer Uhrzeit.",
    speakingModel: "Ich stehe um sieben Uhr auf. Mein Deutschkurs beginnt um sechs Uhr abends. Danach koche ich. Wann beginnt Ihr Kurs?",
  },
  5: {
    reading: "Zimmer frei ab 1. Oktober: helles Zimmer mit Bett, Tisch und Schrank. Die Küche ist gemeinsam. 480 Euro im Monat. Besichtigung am Samstag um 11 Uhr.",
    question: "Wann kann man das Zimmer ansehen?", correct: "Am Samstag um 11 Uhr.", distractors: ["Am Montag um 11 Uhr.", "Am 1. Oktober um 18 Uhr."],
    writing: "Schreiben Sie der Vermieterin eine kurze Anfrage: Sie interessieren sich für das Zimmer, fragen nach der Adresse und bestätigen den Besichtigungstermin.",
    writingModel: "Guten Tag, ich interessiere mich für das Zimmer. Ich kann am Samstag um 11 Uhr zur Besichtigung kommen. Wie ist die Adresse? Vielen Dank und freundliche Grüße, Sam Weber",
    speaking: "Beschreiben Sie ein Zimmer mit drei Möbeln. Sagen Sie, wo ein Gegenstand steht oder liegt. Fragen Sie nach der Miete.",
    speakingModel: "Mein Zimmer ist hell. Es gibt ein Bett, einen Tisch und einen Schrank. Die Lampe steht auf dem Tisch. Wie viel kostet das Zimmer im Monat?",
  },
  6: {
    reading: "Café Linden: Gemüsesuppe 5,50 €, Käsebrot 4,20 €, Apfelsaft 2,80 €, Wasser 2,00 €. Mittagsmenü: Suppe und Brot zusammen 8,50 €. Kartenzahlung möglich.",
    question: "Was kostet das Mittagsmenü?", correct: "8,50 €.", distractors: ["5,50 €.", "9,70 €."],
    writing: "Schreiben Sie einem Freund: Laden Sie ihn am Samstag zum Mittagessen ein. Nennen Sie Café, Uhrzeit und was Sie dort gern essen möchten.",
    writingModel: "Hallo Amir, hast du am Samstag um 13 Uhr Zeit? Wir können im Café Linden essen. Ich möchte gern die Gemüsesuppe und ein Käsebrot. Schreib mir bitte. Viele Grüße, Sam",
    speaking: "Bestellen Sie ein Essen und ein Getränk. Fragen Sie nach dem Preis und ob Sie mit Karte bezahlen können.",
    speakingModel: "Ich hätte gern eine Gemüsesuppe und ein Wasser. Wie viel kostet das zusammen? Kann ich mit Karte bezahlen?",
  },
  7: {
    reading: "Modehaus Nord: Jacken heute 39 €, T-Shirts 12 €. Die rote Jacke gibt es nur in Größe S. Die blaue Jacke gibt es in M und L. Umtausch mit Kassenbon innerhalb von 14 Tagen.",
    question: "Welche Jacke gibt es in Größe M?", correct: "Die blaue Jacke.", distractors: ["Die rote Jacke.", "Keine Jacke."],
    writing: "Schreiben Sie an das Geschäft: Fragen Sie, ob die blaue Jacke in Größe M noch da ist, was sie kostet und wann das Geschäft geöffnet ist.",
    writingModel: "Guten Tag, haben Sie die blaue Jacke noch in Größe M? Kostet sie heute 39 Euro? Wann ist Ihr Geschäft geöffnet? Vielen Dank und freundliche Grüße, Sam Weber",
    speaking: "Fragen Sie im Geschäft nach einer Jacke: Farbe, Größe, Preis und ob Sie sie anprobieren können.",
    speakingModel: "Guten Tag. Haben Sie diese Jacke in Blau und Größe M? Wie viel kostet sie? Kann ich sie bitte anprobieren?",
  },
  8: {
    reading: "Stadtbibliothek: Montag geschlossen. Dienstag bis Freitag 10–18 Uhr, Samstag 10–14 Uhr. Anmeldung mit Ausweis am Schalter im Erdgeschoss.",
    question: "Was braucht man für die Anmeldung?", correct: "Einen Ausweis.", distractors: ["Eine Fahrkarte.", "Ein Foto."],
    writing: "Sie möchten sich in der Bibliothek anmelden. Schreiben Sie eine kurze Anfrage: Fragen Sie nach der Adresse, den Öffnungszeiten am Samstag und den nötigen Dokumenten.",
    writingModel: "Guten Tag, ich möchte mich in Ihrer Bibliothek anmelden. Wie ist die Adresse? Sind Sie am Samstag bis 14 Uhr geöffnet? Brauche ich meinen Ausweis? Vielen Dank und freundliche Grüße, Sam Weber",
    speaking: "Fragen Sie nach dem Weg zur Bibliothek. Bitten Sie die Person, langsam zu sprechen, und wiederholen Sie die Wegbeschreibung in einem Satz.",
    speakingModel: "Entschuldigung, wo ist die Bibliothek? Sprechen Sie bitte langsam. Also: geradeaus und dann links, richtig? Vielen Dank!",
  },
  9: {
    reading: "Regionalzug RE 5 nach Köln: Abfahrt 14:20 Uhr, Gleis 4. Heute etwa 15 Minuten Verspätung. Fahrkartenautomat in der Bahnhofshalle; im Zug ist kein Fahrkartenverkauf.",
    question: "Wo kann man die Fahrkarte kaufen?", correct: "Am Automaten in der Bahnhofshalle.", distractors: ["Im Zug.", "Am Gleis 4."],
    writing: "Sie kommen wegen einer Zugverspätung später zu einem Treffen. Schreiben Sie eine Nachricht mit Zug, neuer Ankunftszeit und einem Vorschlag für den Treffpunkt.",
    writingModel: "Hallo Mira, mein Zug RE 5 hat 15 Minuten Verspätung. Ich bin ungefähr um 15 Uhr da. Treffen wir uns vor dem Bahnhof? Entschuldigung und bis gleich, Sam",
    speaking: "Kaufen Sie gedanklich eine Fahrkarte. Fragen Sie nach Abfahrtszeit, Gleis und Preis. Sagen Sie, dass Sie umsteigen müssen.",
    speakingModel: "Guten Tag, ich brauche eine Fahrkarte nach Köln. Wann fährt der Zug ab und von welchem Gleis? Was kostet die Fahrkarte? Muss ich umsteigen?",
  },
  10: {
    reading: "Deutsch für den Beruf: Kurs am Dienstag und Donnerstag von 17:30 bis 19 Uhr. Anmeldung bis 10. September. Voraussetzung: Deutsch A1. Der Kurs kostet 60 Euro.",
    question: "Bis wann muss man sich anmelden?", correct: "Bis 10. September.", distractors: ["Bis Dienstag.", "Bis Donnerstag um 19 Uhr."],
    writing: "Schreiben Sie eine Kursanfrage: Nennen Sie Ihr Lernziel, fragen Sie nach einem freien Platz und nach dem Anmeldeformular.",
    writingModel: "Guten Tag, ich möchte im Beruf besser Deutsch sprechen. Gibt es noch einen Platz im Kurs am Dienstag und Donnerstag? Wo finde ich das Anmeldeformular? Vielen Dank und freundliche Grüße, Sam Weber",
    speaking: "Erklären Sie in drei bis fünf Sätzen, was Sie arbeiten oder lernen, wann Sie Zeit haben und warum Sie Deutsch lernen.",
    speakingModel: "Ich arbeite in einem Café. Am Abend habe ich Zeit. Ich lerne Deutsch. Ich möchte mit Gästen sprechen. Der Kurs am Dienstag passt gut.",
  },
  11: {
    reading: "Hallo Sam, am Samstag spielen wir ab 15 Uhr im Park Volleyball. Bring bitte Wasser mit. Bei Regen treffen wir uns um 16 Uhr im Café am Markt. Kommst du? Liebe Grüße, Leo",
    question: "Wo trifft sich die Gruppe bei Regen?", correct: "Im Café am Markt.", distractors: ["Im Park.", "Im Sportgeschäft."],
    writing: "Antworten Sie Leo: Sagen Sie, ob Sie kommen, was Sie mitbringen und stellen Sie eine Rückfrage zum Treffen.",
    writingModel: "Hallo Leo, danke für die Einladung! Ich komme gern und bringe Wasser mit. Wie viele Leute spielen mit? Hoffentlich ist das Wetter gut. Bis Samstag, Sam",
    speaking: "Erzählen Sie von einem Hobby. Laden Sie eine Person dazu ein und vereinbaren Sie Zeit und Ort.",
    speakingModel: "Ich spiele gern Volleyball. Hast du am Samstag Zeit? Wir können uns um 15 Uhr im Park treffen. Bring bitte Wasser mit.",
  },
  12: {
    reading: "Praxis Dr. Meier: Akutsprechstunde Montag bis Freitag 8–10 Uhr. Bitte rufen Sie vorher an. Bringen Sie Ihre Versicherungskarte mit. Bei starken Beschwerden wählen Sie den Notruf.",
    question: "Was soll man vor der Akutsprechstunde tun?", correct: "In der Praxis anrufen.", distractors: ["Eine E-Mail an die Apotheke schreiben.", "Direkt um 12 Uhr kommen."],
    writing: "Sie sind krank und können heute nicht zum Deutschkurs kommen. Schreiben Sie eine kurze Absage mit Grund, voraussichtlicher Rückkehr und Frage nach den Hausaufgaben.",
    writingModel: "Guten Tag Frau Weber, ich bin krank und kann heute nicht zum Deutschkurs kommen. Am Donnerstag bin ich wahrscheinlich wieder da. Welche Hausaufgaben soll ich machen? Viele Grüße, Sam",
    speaking: "Rufen Sie in einer Praxis an. Beschreiben Sie eine einfache Beschwerde und fragen Sie nach einem Termin. Sagen Sie Ihren Namen deutlich.",
    speakingModel: "Guten Tag, mein Name ist Sam Weber. Ich habe Kopfschmerzen und Fieber. Haben Sie heute einen Termin für mich? Vielen Dank.",
  },
  13: {
    reading: "Wetter am Wochenende: Samstag sonnig, 22 Grad. Sonntag ab 14 Uhr Regen und Wind, 16 Grad. Für Spaziergänge empfehlen wir den Samstagvormittag.",
    question: "Wann ist ein Spaziergang am besten?", correct: "Am Samstagvormittag.", distractors: ["Am Sonntagabend.", "Am Sonntagnachmittag."],
    writing: "Schreiben Sie einer Freundin einen Wochenendplan: Nennen Sie Wetter, eine Aktivität, Uhrzeit und einen Ersatzplan bei Regen.",
    writingModel: "Hallo Mira, am Samstag ist es sonnig. Wollen wir um 10 Uhr im Park spazieren gehen? Bei Regen können wir uns im Café treffen. Schreib mir bitte. Liebe Grüße, Sam",
    speaking: "Beschreiben Sie das Wetter heute und morgen. Schlagen Sie eine Aktivität vor und nennen Sie eine Alternative bei Regen.",
    speakingModel: "Heute ist es warm und sonnig. Morgen regnet es. Wir können heute im Park spazieren gehen. Morgen können wir ins Café gehen.",
  },
  14: {
    reading: "Nachricht von der Sprachschule: Ihr Beratungstermin am Dienstag um 9 Uhr findet jetzt am Mittwoch um 11 Uhr statt. Bitte antworten Sie bis Montag und bringen Sie Ihren Ausweis mit.",
    question: "Wann ist der neue Termin?", correct: "Am Mittwoch um 11 Uhr.", distractors: ["Am Dienstag um 9 Uhr.", "Am Montag um 11 Uhr."],
    writing: "Antworten Sie der Sprachschule: Bestätigen oder verschieben Sie den neuen Termin, nennen Sie Ihren Namen und fragen Sie, ob Sie noch etwas mitbringen sollen.",
    writingModel: "Guten Tag, vielen Dank für Ihre Nachricht. Ich, Sam Weber, kann am Mittwoch um 11 Uhr kommen. Ich bringe meinen Ausweis mit. Brauche ich noch ein Dokument? Freundliche Grüße, Sam Weber",
    speaking: "Rufen Sie in der Sprachschule an. Nennen Sie Ihren Namen und Termin, bitten Sie um eine neue Uhrzeit und bestätigen Sie das Ergebnis.",
    speakingModel: "Guten Tag, ich heiße Sam Weber. Mein Termin ist am Mittwoch um 11 Uhr. Kann ich stattdessen um 12 Uhr kommen? Ja, 12 Uhr passt. Vielen Dank.",
  },
};

function integratedBlocks(number: number, prefix: string): LessonBlock[] {
  const practice = integratedPractice[number];
  if (!practice) return [];
  return [
    { id: `${prefix}-lesen`, type: "text", heading: "Lesen · Alltagstext", paragraphs: [practice.reading, "Lesen Sie zuerst die Frage, dann suchen Sie die entscheidende Information im Text."] },
    { id: `${prefix}-lesecheck`, type: "knowledge-check", heading: "Lesen prüfen", completion: "pass", required: true, question: { id: `${prefix}-frage-lesen`, prompt: practice.question, options: [{ id: "a", label: practice.correct }, { id: "b", label: practice.distractors[0] }, { id: "c", label: practice.distractors[1] }], correctOptionId: "a", explanation: `Im Text steht: ${practice.correct}` } },
    { id: `${prefix}-schreiben`, type: "writing-practice", heading: "Schreiben · Alltagssituation", prompt: practice.writing, minWords: 25, maxWords: 65, checklist: ["Ich beantworte alle Inhaltspunkte.", "Anrede und Gruß passen zur Person.", "Zahlen, Zeiten und Verbposition sind klar."], modelAnswer: practice.writingModel, completion: "interact" },
    { id: `${prefix}-sprechen`, type: "speaking-practice", heading: "Sprechen · Alltagssituation", prompt: practice.speaking, preparationSeconds: 30, targetSeconds: 45, checklist: ["Ich spreche in kurzen verständlichen Sätzen.", "Ich nenne konkrete Informationen.", "Ich stelle oder beantworte eine passende Frage."], modelAnswer: practice.speakingModel, completion: "interact" },
  ];
}

function chapterFourAppliedBlocks(prefix: string): LessonBlock[] {
  return [
    { id: `${prefix}-uhrzeit-lernen`, type: "comparison-table", heading: "Die neue Kurszeit verstehen", columns: ["Was Sie hören oder lesen", "Das bedeutet"], rows: [
      ["um sechs Uhr", "18:00 Uhr · die normale Kurszeit"],
      ["um halb sieben", "18:30 Uhr · diese Woche"],
      ["bis acht Uhr", "bis 20:00 Uhr · Ende des Kurses"],
    ] },
    { id: `${prefix}-uhrzeit-check`, type: "knowledge-check", heading: "Mini-Check · halb sieben", completion: "pass", required: true, question: {
      id: `${prefix}-frage-halb-sieben`, prompt: "Sam hört: „Der Kurs beginnt um halb sieben.“ Welche Uhrzeit ist das?",
      options: [{ id: "a", label: "18:30 Uhr" }, { id: "b", label: "19:30 Uhr" }, { id: "c", label: "18:07 Uhr" }],
      correctOptionId: "a", explanation: "Halb sieben ist eine halbe Stunde vor sieben: 18:30 Uhr.",
    } },
    { id: `${prefix}-datum-lernen`, type: "comparison-table", heading: "Tag, Datum und Zeitraum sagen", columns: ["Frage", "Passender Satz"], rows: [
      ["An welchem Tag?", "Am Mittwoch habe ich Deutschkurs."],
      ["In welchem Monat?", "Im September beginnt der neue Kurs."],
      ["An welchem Datum?", "Am 25. September habe ich einen Termin."],
      ["Von wann bis wann?", "Ich arbeite von neun bis siebzehn Uhr."],
    ] },
    { id: `${prefix}-zeitwort-check`, type: "knowledge-check", heading: "Mini-Check · am, im oder um?", completion: "pass", required: false, question: {
      id: `${prefix}-frage-zeitwort`, prompt: "Welcher Satz passt zu einem Termin am Mittwoch um 18:30 Uhr?",
      options: [{ id: "a", label: "Am Mittwoch beginnt der Kurs um halb sieben." }, { id: "b", label: "Im Mittwoch beginnt der Kurs am halb sieben." }, { id: "c", label: "Um Mittwoch beginnt der Kurs im halb sieben." }],
      correctOptionId: "a", explanation: "Für Wochentage steht am, für Uhrzeiten um. Halb sieben bedeutet 18:30 Uhr.",
    } },
    { id: `${prefix}-praesens-lernen`, type: "worked-example", heading: "Über Sams Tag sprechen", problem: "Wie sagt Sam, was er regelmäßig macht?", steps: [
      { id: `${prefix}-praesens-schritt-1`, title: "Ich", body: "Ich arbeite von neun bis fünf." },
      { id: `${prefix}-praesens-schritt-2`, title: "Du", body: "Du arbeitest am Mittwoch." },
      { id: `${prefix}-praesens-schritt-3`, title: "Er", body: "Sam arbeitet am Mittwoch und lernt am Abend Deutsch." },
    ], answer: "Bei ich, du und er ändert sich die Verbform. Lernen Sie die Form zusammen mit einem Satz aus Ihrem Alltag." },
    { id: `${prefix}-praesens-check`, type: "knowledge-check", heading: "Mini-Check · du arbeitest", completion: "pass", required: false, question: {
      id: `${prefix}-frage-praesens`, prompt: "Sie fragen Sam nach seinem Mittwoch. Welcher Satz ist richtig?",
      options: [{ id: "a", label: "Arbeitest du am Mittwoch?" }, { id: "b", label: "Arbeiten du am Mittwoch?" }, { id: "c", label: "Du arbeiten am Mittwoch?" }],
      correctOptionId: "a", explanation: "Bei du heißt das Verb arbeitest; in der Ja/Nein-Frage steht es zuerst.",
    } },
    { id: `${prefix}-trennbar-lernen`, type: "worked-example", heading: "Was macht Sam nach dem Kurs?", problem: "Bei anrufen und einkaufen steht der zweite Verbteil im einfachen Aussagesatz am Ende.", steps: [
      { id: `${prefix}-trennbar-schritt-1`, title: "anrufen", body: "Am Mittwoch rufe ich nach dem Kurs meine Mutter an." },
      { id: `${prefix}-trennbar-schritt-2`, title: "einkaufen", body: "Am Dienstag kaufe ich ein." },
      { id: `${prefix}-trennbar-schritt-3`, title: "Mit können", body: "Am Dienstag kann ich einkaufen. Nach dem Kurs kann ich meine Mutter anrufen." },
    ], answer: "Ich rufe … an. Ich kaufe … ein. Mit kann bleibt der Infinitiv zusammen: kann … anrufen." },
    { id: `${prefix}-trennbar-check`, type: "knowledge-check", heading: "Mini-Check · meine Mutter anrufen", completion: "pass", required: true, question: {
      id: `${prefix}-frage-trennbar`, prompt: "Welcher Satz beschreibt Sams Plan nach dem Kurs richtig?",
      options: [{ id: "a", label: "Ich rufe nach dem Kurs meine Mutter an." }, { id: "b", label: "Ich anrufe nach dem Kurs meine Mutter." }, { id: "c", label: "Ich rufe an nach dem Kurs meine Mutter." }],
      correctOptionId: "a", explanation: "Bei anrufen steht an im einfachen Aussagesatz am Ende.",
    } },
  ];
}

function chapterFiveAppliedBlocks(prefix: string): LessonBlock[] {
  return [
    { id: `${prefix}-zimmer-lernen`, type: "comparison-table", heading: "Ein Zimmer bei der Besichtigung beschreiben", columns: ["Was Sie sehen", "Was Sie sagen können"], rows: [
      ["Bett, Tisch und Schrank", "Es gibt ein Bett, einen Tisch und einen Schrank."],
      ["Die Küche nutzen alle zusammen.", "Die Küche ist gemeinsam."],
      ["Das Zimmer kostet 480 Euro im Monat.", "Wie viel kostet das Zimmer im Monat?"],
    ] },
    { id: `${prefix}-es-gibt-check`, type: "knowledge-check", heading: "Mini-Check · Was gibt es im Zimmer?", completion: "pass", required: true, question: {
      id: `${prefix}-frage-es-gibt`, prompt: "Sie beschreiben das Zimmer aus der Anzeige. Welcher Satz passt?",
      options: [{ id: "a", label: "Es gibt ein Bett, einen Tisch und einen Schrank." }, { id: "b", label: "Es gibt keinen Tisch und keinen Schrank." }, { id: "c", label: "Es gibt zwei Küchen im Zimmer." }],
      correctOptionId: "a", explanation: "In der Anzeige stehen Bett, Tisch und Schrank. Mit es gibt nennen Sie, was vorhanden ist.",
    } },
    { id: `${prefix}-artikel-lernen`, type: "comparison-table", heading: "Möbel mit Artikel lernen", columns: ["Wort", "Satz im Zimmer"], rows: [
      ["das Bett", "Im Zimmer steht ein Bett."],
      ["der Tisch", "Im Zimmer steht ein Tisch. Ich sehe einen Tisch."],
      ["die Lampe", "Auf dem Tisch steht eine Lampe."],
      ["der Schrank", "Neben dem Bett steht ein Schrank."],
    ] },
    { id: `${prefix}-artikel-check`, type: "knowledge-check", heading: "Mini-Check · einen Tisch", completion: "pass", required: false, question: {
      id: `${prefix}-frage-artikel`, prompt: "Sie sehen im Zimmer einen Tisch. Welcher Satz ist richtig?",
      options: [{ id: "a", label: "Ich sehe einen Tisch." }, { id: "b", label: "Ich sehe ein Tisch." }, { id: "c", label: "Ich sehe eine Tisch." }],
      correctOptionId: "a", explanation: "Der Tisch ist maskulin. Nach ich sehe sagen Sie einen Tisch.",
    } },
    { id: `${prefix}-ort-lernen`, type: "worked-example", heading: "Wo stehen die Möbel?", problem: "Bei der Besichtigung fragt Eddy, wo Möbel und Schlüssel sind.", steps: [
      { id: `${prefix}-ort-schritt-1`, title: "Im Zimmer", body: "Das Bett steht im Zimmer." },
      { id: `${prefix}-ort-schritt-2`, title: "Auf dem Tisch", body: "Die Schlüssel liegen auf dem Tisch." },
      { id: `${prefix}-ort-schritt-3`, title: "Neben dem Bett", body: "Der Schrank steht neben dem Bett." },
    ], answer: "Lernen Sie die Ortsangaben zunächst als ganze Wendungen: im Zimmer, auf dem Tisch, neben dem Bett." },
    { id: `${prefix}-ort-check`, type: "knowledge-check", heading: "Mini-Check · die Schlüssel finden", completion: "pass", required: false, question: {
      id: `${prefix}-frage-ort`, prompt: "Die Schlüssel liegen auf dem Tisch. Wo sind sie?",
      options: [{ id: "a", label: "Auf dem Tisch" }, { id: "b", label: "Unter dem Bett" }, { id: "c", label: "Vor dem Haus" }],
      correctOptionId: "a", explanation: "Auf dem Tisch nennt den Ort der Schlüssel.",
    } },
    { id: `${prefix}-negation-lernen`, type: "comparison-table", heading: "Was gibt es nicht?", columns: ["Sie meinen …", "Einfacher Satz"], rows: [
      ["Ein Möbelstück fehlt.", "Im Zimmer gibt es keinen Fernseher."],
      ["Die Miete ist nicht günstig.", "Die Miete ist nicht billig."],
      ["Sie können am Samstag nicht kommen.", "Ich kann am Samstag nicht kommen."],
    ] },
    { id: `${prefix}-negation-check`, type: "knowledge-check", heading: "Mini-Check · kein oder nicht?", completion: "pass", required: true, question: {
      id: `${prefix}-frage-negation`, prompt: "Im Zimmer ist kein Fernseher. Welcher Satz ist richtig?",
      options: [{ id: "a", label: "Es gibt keinen Fernseher." }, { id: "b", label: "Es gibt nicht Fernseher." }, { id: "c", label: "Es gibt kein Fernseher." }],
      correctOptionId: "a", explanation: "Bei einem fehlenden maskulinen Gegenstand sagen Sie: Es gibt keinen Fernseher.",
    } },
  ];
}

function chapterSixAppliedBlocks(prefix: string): LessonBlock[] {
  return [
    { id: `${prefix}-mahlzeiten-lernen`, type: "comparison-table", heading: "Essen und Trinken im Tageslauf", columns: ["Wann?", "Ein einfacher Satz"], rows: [
      ["Am Morgen · Frühstück", "Ich esse ein Brötchen und trinke Tee."],
      ["Am Mittag · Mittagessen", "Ich esse gern Suppe oder ein Käsebrot."],
      ["Am Abend · Abendessen", "Am Abend trinke ich Wasser und esse Brot."],
    ] },
    { id: `${prefix}-gern-check`, type: "knowledge-check", heading: "Mini-Check · Was mögen Sie?", completion: "pass", required: false, question: {
      id: `${prefix}-frage-gern`, prompt: "Sie mögen Suppe. Welcher Satz passt?",
      options: [{ id: "a", label: "Ich esse gern Suppe." }, { id: "b", label: "Ich esse keine Suppe." }, { id: "c", label: "Ich trinke gern Suppe nicht." }],
      correctOptionId: "a", explanation: "Mit gern sagen Sie, dass Sie etwas mögen oder eine Tätigkeit mögen.",
    } },
    { id: `${prefix}-bestellen-lernen`, type: "worked-example", heading: "Im Café höflich bestellen", problem: "Eddy wählt Essen und Trinken und fragt nach der Rechnung.", steps: [
      { id: `${prefix}-bestellen-schritt-1`, title: "Einen Wunsch sagen", body: "Ich möchte eine Gemüsesuppe. / Ich hätte gern ein Käsebrot." },
      { id: `${prefix}-bestellen-schritt-2`, title: "Ein Getränk ergänzen", body: "Ein Wasser, bitte. Was kostet das zusammen?" },
      { id: `${prefix}-bestellen-schritt-3`, title: "Bezahlen", body: "Die Rechnung, bitte. Kann ich mit Karte bezahlen?" },
    ], answer: "Ich möchte … und Ich hätte gern … sind höfliche Bausteine. Üben Sie Ihre eigene Bestellung als ganzen kurzen Dialog." },
    { id: `${prefix}-bestellen-check`, type: "knowledge-check", heading: "Mini-Check · höflich bestellen", completion: "pass", required: true, question: {
      id: `${prefix}-frage-bestellen`, prompt: "Sie möchten eine Suppe und ein Wasser. Was sagen Sie im Café?",
      options: [{ id: "a", label: "Ich hätte gern eine Suppe und ein Wasser, bitte." }, { id: "b", label: "Ich bin eine Suppe und ein Wasser." }, { id: "c", label: "Suppe Wasser du geben." }],
      correctOptionId: "a", explanation: "Ich hätte gern …, bitte ist eine höfliche Bestellung.",
    } },
    { id: `${prefix}-artikel-lernen`, type: "comparison-table", heading: "Ein Getränk bestellen: ein oder einen?", columns: ["Wort", "Bei der Bestellung"], rows: [
      ["der Tee", "Ich möchte einen Tee."],
      ["das Wasser", "Ich möchte ein Wasser."],
      ["die Suppe", "Ich möchte eine Suppe."],
    ] },
    { id: `${prefix}-akkusativ-check`, type: "knowledge-check", heading: "Mini-Check · einen Tee", completion: "pass", required: true, question: {
      id: `${prefix}-frage-akkusativ`, prompt: "Sie bestellen Tee. Welcher Satz ist richtig?",
      options: [{ id: "a", label: "Ich möchte einen Tee." }, { id: "b", label: "Ich möchte ein Tee." }, { id: "c", label: "Ich möchte eine Tee." }],
      correctOptionId: "a", explanation: "Der Tee ist maskulin. Nach möchte wird ein zu einen.",
    } },
    { id: `${prefix}-menge-preis`, type: "comparison-table", heading: "Mengen und Preise verstehen", columns: ["Situation", "So fragen oder antworten Sie"], rows: [
      ["Eine Menge nennen", "Ein Kilo Äpfel, bitte."],
      ["Nach dem Preis fragen", "Wie viel kostet das Mittagsmenü?"],
      ["Zusammenrechnen", "8,50 Euro für das Menü und 2 Euro für Wasser: 10,50 Euro."],
    ] },
    { id: `${prefix}-preis-check`, type: "knowledge-check", heading: "Mini-Check · das Menü mit Wasser", completion: "pass", required: false, question: {
      id: `${prefix}-frage-preis`, prompt: "Das Menü kostet 8,50 Euro, das Wasser 2 Euro. Was kostet beides zusammen?",
      options: [{ id: "a", label: "10,50 Euro" }, { id: "b", label: "8,50 Euro" }, { id: "c", label: "12,50 Euro" }],
      correctOptionId: "a", explanation: "8,50 Euro plus 2 Euro sind 10,50 Euro.",
    } },
  ];
}

function situatedLanguageBlocks(number: number, prefix: string): LessonBlock[] {
  if (number === 4) return chapterFourAppliedBlocks(prefix);
  if (number === 5) return chapterFiveAppliedBlocks(prefix);
  if (number === 6) return chapterSixAppliedBlocks(prefix);
  return [...publicLifePracticeBlocks(number, prefix), ...lifePracticeBlocks(number, prefix)];
}

function topicBridgeBlocks(number: number, prefix: string): LessonBlock[] {
  if (number === 3) return [
    { id: `${prefix}-berufe-sprache`, type: "comparison-table", heading: "Menschen und ihre Berufe", columns: ["Person", "Nützlicher Satz"], rows: [
      ["die Lehrerin / der Lehrer", "Meine Mutter ist Lehrerin. Sie arbeitet in einer Schule."],
      ["die Ärztin / der Arzt", "Sein Vater ist Arzt. Er arbeitet in einer Praxis."],
      ["die Köchin / der Koch", "Ihr Bruder ist Koch. Er arbeitet in einem Restaurant."],
    ] },
    { id: `${prefix}-berufe-lesen`, type: "text", heading: "Lesen · Eine Personenkarte", paragraphs: [
      "PERSONENKARTE · Mira ist 29 Jahre alt und wohnt in Bonn. Sie ist Ärztin und arbeitet in einer Praxis. Ihr Bruder Leo ist Koch und arbeitet in einem Restaurant.",
    ] },
    { id: `${prefix}-berufe-check`, type: "knowledge-check", heading: "Mini-Check · Beruf", completion: "pass", required: true, question: {
      id: `${prefix}-berufe-frage`, prompt: "Welchen Beruf hat Miras Bruder?",
      options: [{ id: "a", label: "Koch" }, { id: "b", label: "Arzt" }, { id: "c", label: "Lehrer" }],
      correctOptionId: "a", explanation: "Auf der Personenkarte steht: Ihr Bruder Leo ist Koch.",
    } },
  ];
  if (number === 9) return [
    { id: `${prefix}-unterkunft-sprache`, type: "comparison-table", heading: "Unterwegs: Unterkunft und Gepäck", columns: ["Wort", "Nützlicher Satz"], rows: [
      ["die Unterkunft / das Zimmer", "Ich habe ein Zimmer für eine Nacht reserviert."],
      ["das Gepäck / der Koffer", "Kann ich meinen Koffer hier lassen?"],
      ["die Rezeption", "Bitte fragen Sie an der Rezeption."],
      ["einchecken", "Ab wann kann ich einchecken?"],
    ] },
    { id: `${prefix}-unterkunft-lesen`, type: "text", heading: "Lesen · Ankunft im Hotel", paragraphs: ["HOTEL AM BAHNHOF · Ihr Zimmer ist ab 15 Uhr frei. Sie können Ihr Gepäck vorher an der Rezeption abgeben. Frühstück gibt es von 7 bis 10 Uhr."] },
    { id: `${prefix}-unterkunft-check`, type: "knowledge-check", heading: "Mini-Check · Gepäck", completion: "pass", required: true, question: { id: `${prefix}-unterkunft-frage`, prompt: "Was kann man vor 15 Uhr an der Rezeption abgeben?", options: [{ id: "a", label: "Das Gepäck" }, { id: "b", label: "Das Frühstück" }, { id: "c", label: "Die Fahrkarte" }], correctOptionId: "a", explanation: "Im Hotelhinweis steht: Sie können Ihr Gepäck vorher an der Rezeption abgeben." } },
  ];
  if (number === 11) return [
    { id: `${prefix}-medien-sprache`, type: "comparison-table", heading: "Freizeit: Internet und Fernsehen", columns: ["Ausdruck", "Beispiel im Alltag"], rows: [
      ["im Internet", "Ich suche den Film im Internet."],
      ["der Fernseher / fernsehen", "Am Abend sehe ich manchmal fern."],
      ["eine Nachricht schicken", "Ich schicke dir eine Nachricht."],
      ["der Film", "Welchen Film möchtest du sehen?"],
    ] },
    { id: `${prefix}-medien-lesen`, type: "text", heading: "Lesen · Ein Filmabend", paragraphs: ["NACHRICHT VON LEO · Hast du am Freitag um 19 Uhr Zeit? Wir sehen bei mir zu Hause einen Film im Internet. Mein Fernseher funktioniert. Bring bitte etwas zu trinken mit. Bei Regen treffen wir uns trotzdem bei mir."] },
    { id: `${prefix}-medien-check`, type: "knowledge-check", heading: "Mini-Check · Filmabend", completion: "pass", required: true, question: { id: `${prefix}-medien-frage`, prompt: "Wo sehen Leo und seine Gäste den Film?", options: [{ id: "a", label: "Im Kino" }, { id: "b", label: "Bei Leo zu Hause" }, { id: "c", label: "Im Café" }], correctOptionId: "b", explanation: "Leo schreibt: Wir sehen bei mir zu Hause einen Film im Internet." } },
  ];
  if (number === 12) return [
    { id: `${prefix}-apotheke-sprache`, type: "comparison-table", heading: "In der Apotheke nach Hilfe fragen", columns: ["Situation", "So sagen Sie es"], rows: [
      ["Eine Beschwerde nennen", "Ich habe Kopfschmerzen."],
      ["Höflich fragen", "Können Sie mir bitte helfen?"],
      ["Eine ärztliche Bitte wiedergeben", "Die Ärztin sagt, ich soll morgen in der Praxis anrufen."],
    ] },
    { id: `${prefix}-apotheke-lesen`, type: "text", heading: "Lesen · Öffnungszeiten der Apotheke", paragraphs: [
      "APOTHEKE AM PARK · Montag bis Freitag 9–18 Uhr, Samstag 9–13 Uhr. Sonntag geschlossen. Bei Fragen rufen Sie bitte während der Öffnungszeiten an: 030 123456.",
    ] },
    { id: `${prefix}-apotheke-check`, type: "knowledge-check", heading: "Mini-Check · Apotheke", completion: "pass", required: true, question: {
      id: `${prefix}-apotheke-frage`, prompt: "Wann kann man am Samstag in die Apotheke gehen?",
      options: [{ id: "a", label: "Um 11 Uhr" }, { id: "b", label: "Um 15 Uhr" }, { id: "c", label: "Gar nicht" }],
      correctOptionId: "a", explanation: "Am Samstag ist die Apotheke von 9 bis 13 Uhr geöffnet.",
    } },
  ];
  if (number === 13) return [
    { id: `${prefix}-jahreszeiten`, type: "comparison-table", heading: "Jahreszeiten und Natur", columns: ["Jahreszeit", "Wetter und Aktivität"], rows: [
      ["der Frühling", "Die Blumen sind da. Wir gehen in den Park."],
      ["der Sommer", "Es ist warm. Wir gehen an den See."],
      ["der Herbst", "Es ist oft windig. Die Blätter liegen im Wald."],
      ["der Winter", "Es ist kalt. Manchmal liegt Schnee."],
    ] },
    { id: `${prefix}-natur-lesen`, type: "text", heading: "Lesen · Ein Plan im Herbst", paragraphs: ["NATURGRUPPE · Am Samstag machen wir einen Spaziergang im Wald. Treffpunkt: 10 Uhr am Bahnhof. Bei starkem Regen gehen wir nicht in den Wald; wir treffen uns um 11 Uhr im Café."] },
    { id: `${prefix}-natur-check`, type: "knowledge-check", heading: "Mini-Check · Plan bei Regen", completion: "pass", required: true, question: { id: `${prefix}-natur-frage`, prompt: "Wo trifft sich die Gruppe bei starkem Regen?", options: [{ id: "a", label: "Im Wald" }, { id: "b", label: "Am See" }, { id: "c", label: "Im Café" }], correctOptionId: "c", explanation: "Bei starkem Regen nennt der Hinweis das Café als Treffpunkt." } },
  ];
  if (number === 14) return [
    { id: `${prefix}-formular-lesen`, type: "text", heading: "Lesen · Ein Anmeldeformular", paragraphs: [
      "SPRACHSCHULE MITTE · Anmeldung zum Abendkurs A1. Kurstage: Dienstag und Donnerstag, 18–20 Uhr. Kursbeginn: 15. September. Bitte tragen Sie Vorname, Nachname, Geburtsdatum, Adresse und Telefonnummer ein. Senden Sie das Formular bis zum 10. September an die Sprachschule.",
      "Lesen Sie zuerst die Feldnamen und die Frist. In einem Formular reichen kurze Angaben; schreiben Sie keine ganzen Sätze in die Felder.",
    ] },
    { id: `${prefix}-formular-check`, type: "knowledge-check", heading: "Mini-Check · Anmeldefrist", completion: "pass", required: true, question: {
      id: `${prefix}-formular-frage`, prompt: "Bis wann muss das Anmeldeformular bei der Sprachschule sein?",
      options: [{ id: "a", label: "Bis 10. September" }, { id: "b", label: "Bis 15. September" }, { id: "c", label: "Bis Donnerstag um 20 Uhr" }],
      correctOptionId: "a", explanation: "Im Formular steht: Senden Sie das Formular bis zum 10. September.",
    } },
    { id: `${prefix}-formular-schreiben`, type: "writing-practice", heading: "Schreiben · Formular ausfüllen",
      prompt: "Füllen Sie das Anmeldeformular als beschriftete Zeilen aus: Vorname, Nachname, Geburtsdatum, Adresse, Telefonnummer und Kurs. Verwenden Sie ausschließlich erfundene persönliche Daten und wählen Sie den Abendkurs A1.",
      minWords: 10, maxWords: 45,
      checklist: ["Alle sechs Felder sind vorhanden.", "Datum, Adresse und Telefonnummer sind gut lesbar.", "Ich verwende keine echten persönlichen Daten."],
      modelAnswer: "Vorname: Lina\nNachname: Berger\nGeburtsdatum: 12.04.1995\nAdresse: Lindenstraße 8, 10115 Berlin\nTelefonnummer: 0176 1234567\nKurs: Abendkurs A1, Dienstag und Donnerstag", completion: "interact" },
  ];
  return [];
}

function chapterLesson(chapter: (typeof germanA1Curriculum)[number]): AcademyLesson {
  const sourceIds = [
    ...chapter.legacyChapters.map((number) =>
      `lesson-de-a1-${String(number).padStart(2, "0")}`),
    ...(chapter.legacyReviews || []).map((slug) => `lesson-de-a1-${slug}`),
  ];
  const sources = sourceIds.map(sourceLesson);
  const section = sectionForChapter(chapter.number);
  const prefix = `a1-route-${String(chapter.number).padStart(2, "0")}`;
  const blocks: LessonBlock[] = [
    {
      id: `${prefix}-ziel`,
      type: "callout",
      heading: "Das können Sie am Ende",
      body: chapter.outcome,
      tone: "blue",
    },
    {
      id: `${prefix}-start`,
      type: "text",
      heading: "Ihre Aufgabe im Alltag",
      paragraphs: [
        chapter.realLifeChallenge,
        `Achten Sie beim Hören auf: ${chapter.listeningSituation}. Beim Lesen arbeiten Sie mit: ${chapter.readingText}.`,
        `Sie schreiben: ${chapter.writingTask}. Sie sprechen: ${chapter.speakingTask}.`,
      ],
    },
    {
      id: `${prefix}-sprache`,
      type: "process",
      heading: "Sprache für diese Situation",
      items: [
        { id: `${prefix}-wortschatz`, title: "Wortschatz", body: chapter.vocabulary.join(" · ") },
        { id: `${prefix}-grammatik`, title: "Grammatik im Gebrauch", body: chapter.grammarInContext.join(" · ") },
      ],
    },
    ...previousChapterRecall(chapter.number, prefix),
  ];

  // The old stand-alone grammar lessons remain in the source course, but their
  // full paradigms are not useful as compulsory material in these situations.
  const focusedSituation = chapter.number >= 4 && chapter.number <= 14;
  const supplemental = sources.slice(1).filter((source) =>
    !["lesson-de-a1-30", "lesson-de-a1-31"].includes(source.id ?? "")).flatMap((source) => source.blocks
    .filter((block) => block.type === "flashcards" ||
      (chapter.number > 3 && !focusedSituation && block.type === "worked-example"))
    .map((block) => block.type === "flashcards"
      ? { ...structuredClone(block), optional: true,
          heading: `Zusatzwortschatz · ${source.title.replace(/^\d+\.\s*/, "")}` }
      : structuredClone(block)));
  const topicBridge = topicBridgeBlocks(chapter.number, prefix);
  if (chapter.number === 8) topicBridge.push({
    id: `${prefix}-weg-wendungen`, type: "comparison-table",
    heading: "Nützliche Wendungen in der Stadt",
    columns: ["Situation", "So sagen Sie es"], rows: [
      ["Nach dem Weg fragen", "Entschuldigung, wie komme ich zur Bibliothek?"],
      ["Mit einem Verkehrsmittel fahren", "Ich fahre mit dem Bus."],
      ["Um Hilfe bitten", "Können Sie mir bitte helfen?"],
    ],
  }, {
    id: `${prefix}-dienste-sprache`, type: "comparison-table",
    heading: "Welcher Ort hilft Ihnen?", columns: ["Ort", "Alltagssituation"], rows: [
      ["die Post", "Ich möchte ein Paket abholen. Wo ist die Post?"],
      ["die Bank", "Ich brauche Geld. Wo ist die Bank oder ein Geldautomat?"],
      ["die Polizei", "Ich brauche Hilfe. Wo ist die Polizei?"],
    ],
  }, {
    id: `${prefix}-post-lesen`, type: "text", heading: "Lesen · Ein Paket abholen",
    paragraphs: ["POSTFILIALE AM MARKT · Ihr Paket liegt ab Dienstag zur Abholung bereit. Öffnungszeiten: Montag bis Freitag 9–18 Uhr, Samstag 9–12 Uhr. Bitte bringen Sie Ihren Ausweis und die Abholkarte mit."],
  }, {
    id: `${prefix}-post-check`, type: "knowledge-check", heading: "Mini-Check · Auf der Post",
    completion: "pass", required: true, question: {
      id: `${prefix}-post-frage`, prompt: "Was braucht man, um das Paket abzuholen?",
      options: [{ id: "a", label: "Ausweis und Abholkarte" }, { id: "b", label: "Fahrkarte und Geld" }, { id: "c", label: "Kursbuch und Stift" }],
      correctOptionId: "a", explanation: "Der Hinweis sagt: Bitte bringen Sie Ihren Ausweis und die Abholkarte mit.",
    },
  });
  if (chapter.number === 11) topicBridge.push({
    id: `${prefix}-einladung-verknuepfen`, type: "comparison-table",
    heading: "Einfache Sätze für Einladungen",
    columns: ["Wort", "Beispiel"], rows: [
      ["und", "Ich komme gern und bringe Wasser mit."],
      ["aber", "Ich komme gern, aber erst um 16 Uhr."],
      ["oder", "Treffen wir uns im Park oder im Café?"],
    ],
  });

  if (chapter.number <= 3) {
    const primary = structuredClone(sources[0].blocks);
    if (topicBridge.length) {
      const listeningIndex = primary.findIndex((block) => block.type === "audio");
      if (listeningIndex < 0) throw new Error(`Missing listening sequence in A1 chapter ${chapter.number}`);
      primary.splice(listeningIndex, 0, ...topicBridge);
    }
    const recapIndex = primary.findIndex((block) => block.type === "callout" &&
      block.heading === "Kapitel geschafft 🎉");
    const recap = recapIndex >= 0 ? primary.splice(recapIndex, 1)[0] : null;
    if (supplemental.length && recapIndex >= 0) {
      primary.splice(recapIndex, 0, {
        id: `${prefix}-vertiefung`, type: "callout", tone: "blue",
        heading: "Freiwillige Vertiefung",
        body: "Diese zusätzlichen Wortbilder wiederholen nützliche Formen aus anderen Kapiteln. Sie sind nicht Teil des Kapiteltests.",
      }, ...supplemental);
    }
    const examPractice = [
      {
        heading: "Formular",
        tip: "Bei einer A1-Formularaufgabe lesen Sie zuerst die Feldnamen. Tragen Sie Namen und Zahlen deutlich ein. Diese Übung ist eigenständig erstellt, keine offizielle Prüfungsfrage.",
        text: "SPRACHSCHULE AM PARK · Anmeldung zum Deutschkurs. Bitte schreiben Sie Ihren Vornamen, Nachnamen und Ihre Telefonnummer in das Formular. Sprechen Sie den Nachnamen am Schalter langsam und deutlich.",
        prompt: "Welche drei Angaben verlangt das Formular?",
        options: ["Vorname, Nachname und Telefonnummer", "Alter, Beruf und Geburtsort", "Wohnort, Sprache und Hobby"],
        correct: "a",
        explanation: "Im Hinweis stehen Vorname, Nachname und Telefonnummer.",
      },
      {
        heading: "Vorstellung",
        tip: "Im ersten Sprechteil geben Sie kurze persönliche Angaben und reagieren auf einfache Rückfragen. Üben Sie Ihre Vorstellung ohne abzulesen. Diese Übung ist eigenständig erstellt, keine offizielle Prüfungsfrage.",
        text: "Hallo! Ich heiße Leo. Ich komme aus Spanien und wohne jetzt in Bonn. Ich spreche Spanisch, Englisch und ein bisschen Deutsch. Mein Deutschkurs ist am Dienstag.",
        prompt: "Wo wohnt Leo jetzt?",
        options: ["In Spanien", "In Bonn", "Am Dienstag"],
        correct: "b",
        explanation: "Leo sagt: „Ich wohne jetzt in Bonn.“",
      },
      {
        heading: "Personenprofil",
        tip: "Bei einem kurzen Personenprofil lesen Sie zuerst die Frage und suchen dann Name, Beziehung oder Beruf im Text. Diese Übung ist eigenständig erstellt, keine offizielle Prüfungsfrage.",
        text: "Das ist Daria. Sie wohnt mit ihrem Bruder Amir in Köln. Amir arbeitet im Krankenhaus. Ihre Mutter wohnt in Hamburg. Daria und Amir besuchen sie oft.",
        prompt: "Wer arbeitet im Krankenhaus?",
        options: ["Daria", "Die Mutter", "Amir"],
        correct: "c",
        explanation: "Im Text steht: „Amir arbeitet im Krankenhaus.“",
      },
    ][chapter.number - 1];
    blocks.push(
      ...primary,
      { id: `${prefix}-pruefungsblick`, type: "callout", tone: "teal",
        heading: `Prüfungsblick · ${examPractice.heading}`,
        body: examPractice.tip },
      { id: `${prefix}-pruefungstext`, type: "text", heading: "Prüfungsübung · neuer Alltagstext",
        paragraphs: [examPractice.text] },
      { id: `${prefix}-pruefungsfrage`, type: "knowledge-check",
        heading: "Prüfungsübung · Information finden", completion: "interact", required: false,
        question: { id: `${prefix}-pruefungsfrage-inhalt`, prompt: examPractice.prompt,
          options: examPractice.options.map((label, index) => ({ id: ["a", "b", "c"][index], label })),
          correctOptionId: examPractice.correct, explanation: examPractice.explanation } },
      ...(recap ? [recap] : []),
    );
  } else {
    const primary = structuredClone(sources[0].blocks);
    const image = primary.find((block) => block.type === "image");
    const audio = primary.find((block) => block.type === "audio");
    const listeningChecks = primary.filter((block) => block.type === "knowledge-check" && block.id?.includes("hoercheck"));
    const reading = primary.find((block) => block.type === "text" && block.heading === "Lesen");
    const readingChecks = primary.filter((block) => block.type === "knowledge-check" && block.id?.includes("lesecheck"));
    const vocabulary = primary.find((block) => block.type === "flashcards");
    const grammar = primary.find((block) => block.type === "worked-example");
    const recap = primary.find((block) => block.type === "callout" && block.heading === "Kapitel geschafft");
    if (!image || !audio || !reading || !vocabulary || !grammar || !recap ||
      listeningChecks.length === 0 || readingChecks.length === 0)
      throw new Error(`Incomplete source sequence for A1 chapter ${chapter.number}`);
    if (chapter.number === 9 && grammar.type === "worked-example") {
      grammar.problem = "Mit dem Zug, Bus oder zu Fuß unterwegs sein und Reiseinformationen verstehen.";
      grammar.steps[2].body = "Wir gehen zu Fuß. Das Wetter ist schön.";
      grammar.answer = "Lernen Sie mit dem Zug, mit dem Bus und zu Fuß als ganze Wendungen. Für eine Begründung reichen hier zwei kurze Hauptsätze.";
    }
    if (chapter.number === 13 && grammar.type === "worked-example") {
      grammar.steps[2].body = "Morgen ist es warm. Wir gehen am Vormittag spazieren.";
      grammar.answer = "Mit es ist, es regnet und die Sonne scheint sprechen Sie einfach über das Wetter. Ein Zeitwort wie morgen zeigt den Plan.";
    }
    const practice = integratedBlocks(chapter.number, prefix);
    blocks.push(
      image,
      { id: `${prefix}-kontext`, type: "callout", tone: "teal", heading: "Zuerst die Situation verstehen", body: `Hören Sie die Alltagssituation: ${chapter.listeningSituation}. Achten Sie auf den Zweck des Gesprächs, bevor Sie einzelne Wörter suchen.` },
      audio, ...listeningChecks,
      reading, ...readingChecks,
      { id: `${prefix}-sprache-entdecken`, type: "callout", tone: "blue", heading: "Nützliche Sprache entdecken", body: `Welche Sätze helfen hier? ${chapter.grammarInContext.join(" · ")}. Nutzen Sie die Wörter anschließend in einer eigenen Antwort.` },
      vocabulary, grammar,
      ...situatedLanguageBlocks(chapter.number, prefix),
      ...(!focusedSituation && supplemental.length ? [{ id: `${prefix}-vertiefung`, type: "callout", tone: "blue", heading: "Wortschatz und Grammatik vertiefen", body: "Diese ergänzenden Wortbilder und Beispiele stammen aus den bisherigen A1-Lektionen. Üben Sie nur die Formen, die Sie für die aktuelle Alltagssituation brauchen." } satisfies LessonBlock] : []),
      ...(focusedSituation ? [] : supplemental),
      ...topicBridge,
      { id: `${prefix}-pruefungsblick`, type: "callout", tone: "teal", heading: "Prüfungsblick · Lesen", body: "Lesen Sie zuerst die Frage und suchen Sie dann die entscheidende Angabe im kurzen Alltagstext. Diese Originalübung trainiert eine A1-Aufgabenfamilie; sie ist keine offizielle Goethe- oder telc-Frage." },
      ...practice,
      { id: `${prefix}-alltagsaufgabe`, type: "text", heading: "Alltags-Challenge", paragraphs: [chapter.realLifeChallenge, "Nutzen Sie Ihre gespeicherte Nachricht und Sprechaufnahme als Probe. Prüfen Sie: Ist die Information richtig, höflich und für die andere Person verständlich?"] },
      ...(focusedSituation && supplemental.length ? [{ id: `${prefix}-vertiefung`, type: "callout", tone: "blue", heading: "Freiwillige Wortschatz-Vertiefung", body: chapter.number === 4
        ? "Die folgenden Bildkarten sind Zusatzmaterial. Sie müssen nicht alle Karten lernen, bevor Sie dieses Kapitel abschließen. Wiederholen Sie zuerst Wörter für Ihren eigenen Tagesablauf; weitere Karten können Sie später nutzen."
        : "Die folgenden Bildkarten sind Zusatzmaterial. Sie müssen nicht alle Karten lernen, bevor Sie dieses Kapitel abschließen. Wiederholen Sie zuerst Wörter für Ihre eigene Alltagssituation; weitere Karten können Sie später nutzen." } satisfies LessonBlock, ...supplemental] : []),
      { id: `${prefix}-abruf`, type: "callout", tone: "blue", heading: "Morgen wiederholen", body: `Sagen Sie ohne Nachsehen drei Sätze zur Situation „${chapter.title}“. Prüfen Sie danach die Bildkarten und wiederholen Sie die Wörter, die noch nicht sicher sind.` },
      recap,
    );
  }

  if (chapter.number === 15) {
    const pastWords = new Set([
      "gemacht", "gelernt", "gekauft", "gearbeitet", "gegessen", "gesehen",
      "genommen", "geschlafen", "gegangen", "gefahren", "gekommen",
      "letzte Woche", "schon",
    ]);
    const pastCards = sourceLesson("lesson-de-a1-29").blocks.find((block) =>
      block.type === "flashcards");
    if (pastCards?.type === "flashcards") blocks.push({
      ...structuredClone(pastCards),
      id: `${prefix}-gestern-wortschatz`,
      heading: "Wortschatz · Über gestern sprechen",
      items: structuredClone(pastCards.items.filter((item) => pastWords.has(item.title))),
    });
    blocks.push({
      id: `${prefix}-reflexion`,
      type: "text",
      heading: "Bereit für Ihren Prüfungsweg?",
      paragraphs: [
        "Prüfen Sie Ihr Portfolio: Können Sie eine kurze Nachricht schreiben, ein Alltagsgespräch führen und wichtige Angaben aus Ansagen und Schildern verstehen?",
        "Nach dem Abschlusstest wählen Sie einen Weg: Goethe oder telc. Die beiden Wege sind Übungsmaterial, keine offizielle Prüfung und kein Zertifikat.",
      ],
    });
  }

  const seenPictureTerms = new Set<string>();
  for (const block of blocks) {
    if (block.type === "flashcards")
      block.items = block.items.filter((item) => {
        if (grammarLabelsNotForPicturePractice.has(item.title) || seenPictureTerms.has(item.title))
          return false;
        seenPictureTerms.add(item.title);
        return true;
      });
  }

  return {
    id: chapter.number <= 3 ? sources[0].id : `lesson-de-a1-route-${String(chapter.number).padStart(2, "0")}`,
    sectionId: section.id,
    section: section.title,
    slug: chapter.number <= 3 ? sources[0].slug : `a1-kapitel-${String(chapter.number).padStart(2, "0")}`,
    title: `${chapter.number}. ${chapter.title}`,
    summary: chapter.outcome,
    durationMinutes: sources[0].durationMinutes +
      (sources.length - 1) * (chapter.number === 3 ? 20 : 30) +
      (integratedPractice[chapter.number] ? 60 : 0) +
      (topicBridge.length ? 15 : 0),
    blocks,
  };
}

function masteryLesson(chapter: (typeof germanA1Curriculum)[number]): AcademyLesson {
  const prefix = "a1-route-15";
  const transcript = `Telefonnotiz: Guten Morgen, Herr Weber. Ihr Beratungstermin in der Sprachschule ist heute nicht um neun, sondern um zehn Uhr. Bitte bringen Sie Ihren Ausweis mit.\nSam: Danke. Ich komme mit dem Zug aus Bonn.\nAnsage eins: Der Regionalzug R E fünf nach Köln fährt heute von Gleis vier ab. Er hat ungefähr fünfzehn Minuten Verspätung. Die neue Abfahrt ist um neun Uhr zwanzig.\nAnna: Sam, ich warte vor der Sprachschule. Kommst du pünktlich?\nSam: Mein Zug hat Verspätung. Ich komme wahrscheinlich um zehn Uhr zehn.\nAnna: Ich sage der Lehrerin Bescheid. Hast du deinen Ausweis dabei?\nSam: Ja. Nach dem Termin möchte ich im Café etwas trinken.\nAnna: Gut, wir treffen uns danach vor dem Café.`;
  const secondTranscript = `Anna: Hallo Eddy, ich ziehe am Samstag in mein neues Zimmer in der Lindenstraße acht.\nEddy: Wann treffen wir uns?\nAnna: Um elf Uhr vor dem Haus. Ich habe schon ein Bett, aber keinen Tisch.\nEddy: Das Möbelhaus am Markt ist bis vierzehn Uhr geöffnet. Ein kleiner Tisch kostet dort neunundsechzig Euro.\nAnna: Gut. Am Nachmittag regnet es vielleicht. Kommst du mit dem Bus?\nEddy: Ja, mit der Linie drei. Ich bringe auch Wasser mit.\nAnna: Prima. Wir sehen uns um elf Uhr vor dem Haus. Danach kaufen wir den Tisch.`;
  const recallTerms = [
    "Guten Tag", "die Adresse", "der Termin", "der Ausweis", "die Fahrkarte",
    "die Verspätung", "der Bahnhof", "das Gleis", "die Uhr", "die Sprache",
    "das Wasser", "Die Rechnung, bitte.", "die Jacke", "der Arzt", "die Apotheke",
  ];
  const optionalPastTerms = [
    "gemacht", "gelernt", "gekauft", "gearbeitet", "gegessen", "gesehen",
    "genommen", "geschlafen", "gegangen", "gefahren", "gekommen",
    "letzte Woche", "schon",
  ];
  const sourceCards = germanA1Course.lessons.flatMap((lesson) => lesson.blocks
    .filter((block) => block.type === "flashcards")
    .flatMap((block) => block.items));
  const cardsForTerms = (terms: string[], suffix: string) => terms.map((term, index) => {
    const source = sourceCards.find((card) => card.title === term);
    if (!source) throw new Error(`A1 mastery recall card missing: ${term}`);
    return { ...structuredClone(source), id: `${prefix}-${suffix}-${index + 1}` };
  });
  const recallCards = cardsForTerms(recallTerms, "wort");
  const optionalPastCards = cardsForTerms(optionalPastTerms, "gestern");
  return {
    id: `lesson-de-${prefix}`,
    sectionId: "a1-mastery",
    section: "A1 im Alltag anwenden",
    slug: "a1-kapitel-15",
    title: `${chapter.number}. ${chapter.title}`,
    summary: chapter.outcome,
    durationMinutes: 240,
    blocks: [
      { id: `${prefix}-ziel`, type: "callout", heading: "Das können Sie am Ende", body: chapter.outcome, tone: "blue" },
      { id: `${prefix}-start`, type: "text", heading: "Ein Alltagstag mit Änderungen", paragraphs: [
        "Sam hat einen Termin in der Sprachschule. Dann verspätet sich sein Zug. Er muss die neue Uhrzeit verstehen, eine Nachricht schreiben und am Telefon erklären, wann er kommt.",
        "Bearbeiten Sie Hören und Lesen zuerst ohne Lösungen. Schreiben und sprechen Sie danach Ihre eigenen Antworten. Sie können überall erfundene Angaben verwenden.",
      ] },
      { id: `${prefix}-ablauf`, type: "process", heading: "Ihr Abschlussweg", items: [
        { id: `${prefix}-schritt-1`, title: "1 · Verstehen", body: "Hören Sie drei kurze Alltagssituationen und lesen Sie die passenden Hinweise." },
        { id: `${prefix}-schritt-2`, title: "2 · Handeln", body: "Informieren Sie die Sprachschule schriftlich und mündlich über die Verspätung." },
        { id: `${prefix}-schritt-3`, title: "3 · Wiederholen", body: "Prüfen Sie häufige Wörter und notieren Sie konkrete Lücken vor dem Abschlusstest." },
      ] },
      { id: `${prefix}-hoeren`, type: "audio", heading: "Hören · Termin, Zug und Treffpunkt", url: "/audio/german-a1/a1-kapitel-15-alltagstraining.m4a", caption: "Hören Sie einmal für die Situation und ein zweites Mal für Uhrzeit, Gleis und nächste Handlung. Öffnen Sie das Transcript erst nach Ihren Antworten. Die Stimmen sind synthetisch erzeugt.", transcript, completion: "view" },
      { id: `${prefix}-hoercheck-termin`, type: "knowledge-check", heading: "Hören prüfen · Termin", completion: "pass", required: true, question: { id: `${prefix}-q-termin`, prompt: "Wann ist Sams neuer Beratungstermin?", options: [{ id: "a", label: "Um neun Uhr" }, { id: "b", label: "Um zehn Uhr" }, { id: "c", label: "Um zehn Uhr zehn" }], correctOptionId: "b", explanation: "Die Sprachschule verschiebt den Termin von neun auf zehn Uhr." } },
      { id: `${prefix}-hoercheck-gleis`, type: "knowledge-check", heading: "Hören prüfen · Zug", completion: "pass", required: true, question: { id: `${prefix}-q-gleis`, prompt: "Von welchem Gleis fährt Sams Zug ab?", options: [{ id: "a", label: "Gleis vier" }, { id: "b", label: "Gleis fünf" }, { id: "c", label: "Gleis neun" }], correctOptionId: "a", explanation: "Die Durchsage nennt Gleis vier." } },
      { id: `${prefix}-hoercheck-ankunft`, type: "knowledge-check", heading: "Hören prüfen · Ankunft", completion: "pass", required: true, question: { id: `${prefix}-q-ankunft`, prompt: "Wann kommt Sam wahrscheinlich zur Sprachschule?", options: [{ id: "a", label: "Um 9:20 Uhr" }, { id: "b", label: "Um 10 Uhr" }, { id: "c", label: "Um 10:10 Uhr" }], correctOptionId: "c", explanation: "Sam sagt, dass er wahrscheinlich um zehn Uhr zehn kommt." } },
      { id: `${prefix}-lesen`, type: "text", heading: "Lesen", paragraphs: [
        "SPRACHSCHULE · Beratung für Sam Weber: heute 10:00 Uhr, Raum 3. Bitte Ausweis mitbringen. Wenn Sie später kommen, rufen Sie kurz an.",
        "BAHNHOF · RE 5 nach Köln: neue Abfahrt 9:20 Uhr, Gleis 4. Fahrkarten nur am Automaten in der Bahnhofshalle.",
        "CAFÉ AM MARKT · Heute ab 11 Uhr geöffnet. Gemüsesuppe 5,50 €, Wasser 2,00 €. Kartenzahlung möglich.",
        "Lesestrategie: Lesen Sie die Frage zuerst. Suchen Sie danach im passenden Text nur die entscheidende Angabe.",
      ] },
      { id: `${prefix}-lesecheck-schule`, type: "knowledge-check", heading: "Lesen prüfen · Sprachschule", completion: "pass", required: true, question: { id: `${prefix}-q-schule`, prompt: "Was soll Sam tun, wenn er später kommt?", options: [{ id: "a", label: "Kurz anrufen" }, { id: "b", label: "Zum Café gehen" }, { id: "c", label: "Ein neues Kursbuch kaufen" }], correctOptionId: "a", explanation: "Im Hinweis steht: Wenn Sie später kommen, rufen Sie kurz an." } },
      { id: `${prefix}-lesecheck-ticket`, type: "knowledge-check", heading: "Lesen prüfen · Fahrkarte", completion: "pass", required: true, question: { id: `${prefix}-q-ticket`, prompt: "Wo kann Sam eine Fahrkarte kaufen?", options: [{ id: "a", label: "Im Zug" }, { id: "b", label: "Am Automaten in der Halle" }, { id: "c", label: "Im Café" }], correctOptionId: "b", explanation: "Der Bahnhofshinweis nennt den Automaten in der Bahnhofshalle." } },
      { id: `${prefix}-sprache`, type: "comparison-table", heading: "Nützliche Sprache aus der Situation", columns: ["Situation", "Passender Satz"], rows: [
        ["Termin bestätigen", "Mein Termin ist heute um zehn Uhr."],
        ["Verspätung erklären", "Mein Zug hat Verspätung. Ich komme um zehn Uhr zehn."],
        ["Höflich fragen", "Kann ich trotzdem kommen? Können Sie das bitte wiederholen?"],
        ["Zeit nennen", "am Mittwoch · um zehn Uhr · von neun bis zehn Uhr"],
      ] },
      { id: `${prefix}-schreiben`, type: "writing-practice", heading: "Schreiben · Die Sprachschule informieren", prompt: "Schreiben Sie eine kurze formelle Nachricht an die Sprachschule: Nennen Sie Ihren Namen und Termin, erklären Sie die Zugverspätung, nennen Sie Ihre voraussichtliche Ankunft um 10:10 Uhr und fragen Sie, ob Sie trotzdem kommen können.", minWords: 35, maxWords: 70, checklist: ["Name und Termin sind klar.", "Ich erkläre die Verspätung und nenne 10:10 Uhr.", "Ich stelle eine passende Frage.", "Anrede und Gruß sind höflich."], modelAnswer: "Guten Tag, ich heiße Sam Weber und habe heute um 10 Uhr einen Beratungstermin. Mein Zug hat leider Verspätung. Ich komme wahrscheinlich um 10:10 Uhr. Kann ich trotzdem noch kommen? Entschuldigung und freundliche Grüße, Sam Weber", completion: "interact" },
      { id: `${prefix}-sprechen`, type: "speaking-practice", heading: "Sprechen · In der Sprachschule anrufen", prompt: "Rufen Sie in der Sprachschule an. Nennen Sie Ihren Namen und Termin, erklären Sie die Zugverspätung, nennen Sie Ihre neue Ankunftszeit und bitten Sie um eine Bestätigung.", preparationSeconds: 30, targetSeconds: 60, checklist: ["Ich nenne Name und Termin deutlich.", "Ich erkläre den Grund in einfachen Sätzen.", "Ich nenne die neue Uhrzeit.", "Ich frage höflich nach einer Bestätigung."], modelAnswer: "Guten Tag, ich heiße Sam Weber. Ich habe heute um zehn Uhr einen Termin. Mein Zug hat Verspätung. Ich komme ungefähr um zehn Uhr zehn. Ist das noch in Ordnung? Vielen Dank.", completion: "interact" },
      { id: `${prefix}-alltag`, type: "text", heading: "Alltags-Challenge · Nach dem Termin", paragraphs: [
        "Anna schreibt: „Ich warte vor dem Café am Markt. Es öffnet um elf Uhr. Kommst du danach?“ Antworten Sie mit einem Satz zur Uhrzeit und einer Frage zum Getränk. Sprechen Sie Ihre Antwort anschließend ohne Ablesen laut.",
        "Eine mögliche Antwort: „Ja, ich komme um elf Uhr zum Café. Möchtest du einen Kaffee oder ein Wasser?“",
      ] },
      { id: `${prefix}-transfer-start`, type: "text", heading: "Neue Situation · Einzug und Einkauf", paragraphs: [
        "Jetzt wechseln Ort und Aufgabe: Anna zieht am Samstag in ein Zimmer. Eddy hilft ihr, einen Tisch zu kaufen. Hören Sie zuerst ohne Transcript. Lesen Sie danach die beiden Hinweise und planen Sie Ihre eigene Antwort.",
        "Achten Sie auf Uhrzeit, fehlendes Möbelstück und Verkehrsmittel. Die Informationen im Aushang ergänzen das Gespräch; sie stehen nicht alle im Audio.",
      ] },
      { id: `${prefix}-transfer-hoeren`, type: "audio", heading: "Hören · Einzug, Tisch und Bus", url: "/audio/german-a1/a1-kapitel-15-wohnen-und-plaene.m4a", caption: "Hören Sie für die Hauptidee und dann für die Details. Öffnen Sie das Transcript erst nach Ihren Antworten. Die Stimmen sind synthetisch erzeugt.", transcript: secondTranscript, completion: "view" },
      { id: `${prefix}-transfer-hoercheck-treffen`, type: "knowledge-check", heading: "Hören prüfen · Treffpunkt", completion: "pass", required: true, question: { id: `${prefix}-q-transfer-treffen`, prompt: "Wann treffen sich Anna und Eddy?", options: [{ id: "a", label: "Am Samstag um elf Uhr" }, { id: "b", label: "Am Samstag um vierzehn Uhr" }, { id: "c", label: "Am Sonntag um elf Uhr" }], correctOptionId: "a", explanation: "Anna und Eddy verabreden sich für Samstag um elf Uhr vor dem Haus." } },
      { id: `${prefix}-transfer-hoercheck-moebel`, type: "knowledge-check", heading: "Hören prüfen · Möbel", completion: "pass", required: true, question: { id: `${prefix}-q-transfer-moebel`, prompt: "Was braucht Anna noch für ihr Zimmer?", options: [{ id: "a", label: "Ein Bett" }, { id: "b", label: "Einen Tisch" }, { id: "c", label: "Einen Schrank" }], correctOptionId: "b", explanation: "Anna hat schon ein Bett, aber noch keinen Tisch." } },
      { id: `${prefix}-transfer-hoercheck-bus`, type: "knowledge-check", heading: "Hören prüfen · Verkehr", completion: "pass", required: true, question: { id: `${prefix}-q-transfer-bus`, prompt: "Mit welcher Buslinie kommt Eddy?", options: [{ id: "a", label: "Linie zwei" }, { id: "b", label: "Linie drei" }, { id: "c", label: "Linie vier" }], correctOptionId: "b", explanation: "Eddy sagt: Ich komme mit der Linie drei." } },
      { id: `${prefix}-transfer-lesen`, type: "text", heading: "Lesen · Aushang und Anzeige", paragraphs: [
        "HAUS LINDENSTRASSE 8 · Einzug am Samstag ab 10 Uhr. Der Aufzug ist außer Betrieb. Bitte benutzen Sie die Treppe. Fahrräder bitte im Hof abstellen.",
        "MÖBELHAUS AM MARKT · Samstag 10–14 Uhr geöffnet. Kleiner Tisch 69 €, Lampe 19 €. Kartenzahlung möglich.",
        "Lesen Sie erst die Frage. Finden Sie dann den richtigen kurzen Text und markieren Sie nur die entscheidenden Wörter.",
      ] },
      { id: `${prefix}-transfer-lesecheck-aufzug`, type: "knowledge-check", heading: "Lesen prüfen · Einzug", completion: "pass", required: true, question: { id: `${prefix}-q-transfer-aufzug`, prompt: "Wie kommen Anna und Eddy mit dem Tisch nach oben?", options: [{ id: "a", label: "Mit dem Aufzug" }, { id: "b", label: "Über die Treppe" }, { id: "c", label: "Durch den Hof" }], correctOptionId: "b", explanation: "Der Aufzug ist außer Betrieb. Sie müssen die Treppe benutzen." } },
      { id: `${prefix}-transfer-lesecheck-karte`, type: "knowledge-check", heading: "Lesen prüfen · Möbelhaus", completion: "pass", required: true, question: { id: `${prefix}-q-transfer-karte`, prompt: "Kann Anna den Tisch mit Karte bezahlen?", options: [{ id: "a", label: "Ja" }, { id: "b", label: "Nein" }, { id: "c", label: "Nur am Sonntag" }], correctOptionId: "a", explanation: "In der Anzeige steht: Kartenzahlung möglich." } },
      { id: `${prefix}-transfer-sprache`, type: "comparison-table", heading: "Nützliche Sprache · Eine andere Situation", columns: ["Was möchten Sie sagen?", "Ein A1-Satz"], rows: [
        ["Ein Zimmer beschreiben", "Es gibt ein Bett, aber keinen Tisch."],
        ["Treffpunkt nennen", "Wir treffen uns am Samstag um elf Uhr vor dem Haus."],
        ["Nach einem Preis fragen", "Wie viel kostet der kleine Tisch?"],
        ["Verkehrsmittel nennen", "Ich komme mit dem Bus, Linie drei."],
      ] },
      { id: `${prefix}-transfer-schreiben`, type: "writing-practice", heading: "Schreiben · Hilfe beim Einzug", prompt: "Schreiben Sie einer anderen Freundin eine kurze Nachricht. Bitten Sie um Hilfe beim Einzug am Samstag, nennen Sie die Adresse und den Treffpunkt um 11 Uhr, erklären Sie, dass der Aufzug nicht funktioniert, und fragen Sie, ob sie kommen kann.", minWords: 30, maxWords: 65, checklist: ["Ich nenne Samstag, 11 Uhr und Lindenstraße 8.", "Ich erkläre das Problem mit dem Aufzug.", "Ich bitte um Hilfe und stelle eine Frage.", "Die Nachricht hat einen Gruß."], modelAnswer: "Hallo Mira, ich ziehe am Samstag in die Lindenstraße 8. Wir treffen uns um 11 Uhr vor dem Haus. Der Aufzug funktioniert leider nicht. Kannst du mir mit dem Tisch auf der Treppe helfen? Ich freue mich auf deine Antwort. Viele Grüße, Anna", completion: "interact" },
      { id: `${prefix}-transfer-sprechen`, type: "speaking-practice", heading: "Sprechen · Im Möbelhaus fragen", prompt: "Sie sind im Möbelhaus. Fragen Sie nach einem kleinen Tisch, seinem Preis, der Öffnungszeit am Samstag und der Kartenzahlung. Sagen Sie auch, dass Sie heute in ein neues Zimmer ziehen.", preparationSeconds: 30, targetSeconds: 45, checklist: ["Ich sage, was ich suche.", "Ich frage nach Preis und Öffnungszeit.", "Ich frage nach Kartenzahlung.", "Ich spreche in kurzen, verständlichen Sätzen."], modelAnswer: "Guten Tag. Ich ziehe heute in ein neues Zimmer und brauche einen kleinen Tisch. Haben Sie einen Tisch? Wie viel kostet er? Bis wann haben Sie heute geöffnet? Kann ich mit Karte bezahlen? Vielen Dank.", completion: "interact" },
      { id: `${prefix}-transfer-anwenden`, type: "text", heading: "Alltags-Challenge · Plan B", paragraphs: [
        "Es regnet am Nachmittag. Eddy kommt mit dem Bus, und der Aufzug funktioniert nicht. Sagen Sie laut in zwei einfachen Sätzen, was Sie zuerst tun und wie Sie den Tisch in das Zimmer bringen.",
        "Eine mögliche Antwort: „Wir kaufen den Tisch vor 14 Uhr. Dann bringen wir ihn über die Treppe in das Zimmer.“",
      ] },
      { id: `${prefix}-wortschatz`, type: "flashcards", heading: "Wiederholen · 15 Wörter für den Alltag", appearance: { variant: "picture-grid", surface: "plain", spacing: "comfortable", width: "reading" }, items: recallCards },
      { id: `${prefix}-gestern-hinweis`, type: "callout", heading: "Freiwillige Erweiterung · über gestern sprechen", body: "Für die Kernroute müssen Sie das Perfekt hier nicht bilden. Wenn Sie schon über Vergangenes sprechen möchten, erkennen und üben Sie diese häufigen Wörter freiwillig. Sie sind keine Voraussetzung für den Abschlusstest.", tone: "teal" },
      { id: `${prefix}-gestern-wortschatz`, type: "flashcards", heading: "Zusatzwortschatz · gestern und letzte Woche", optional: true, appearance: { variant: "picture-grid", surface: "plain", spacing: "comfortable", width: "reading" }, items: optionalPastCards },
      { id: `${prefix}-reflexion`, type: "text", heading: "Bereit für Ihren Prüfungsweg?", paragraphs: [
        "Prüfen Sie Ihr Portfolio: Können Sie eine kurze Nachricht schreiben, ein Alltagsgespräch führen und wichtige Angaben aus Ansagen und Schildern verstehen? Wiederholen Sie unsichere Wörter morgen erneut.",
        "Nach dem objektiven Abschlusstest wählen Sie einen Weg: Goethe oder telc. Die beiden Wege sind unabhängig erstelltes Übungsmaterial, keine offizielle Prüfung und kein Zertifikat.",
      ] },
    ],
  };
}

const coreLessons = germanA1Curriculum.map((chapter) =>
  chapter.number === 15 ? masteryLesson(chapter) : chapterLesson(chapter));

const examMiniMockListening = {
  goethe: {
    url: "/audio/german-a1/a1-goethe-mini-mock.m4a",
    transcript: "Ansage eins: Der Regionalzug nach Bonn fährt heute um sechzehn Uhr vierzig von Gleis drei.\nTelefonnotiz: Guten Tag, hier ist die Stadtbibliothek. Ihr Ausweis ist ab Donnerstag bereit. Am Mittwoch ist die Bibliothek geschlossen.\nGespräch: Guten Morgen. Ich hätte gern zwei Brötchen und einen Tee. Das kostet zusammen fünf Euro zwanzig.",
    questions: [
      { prompt: "Wann fährt der Regionalzug nach Bonn?", options: ["Um 16:40 Uhr", "Um 14:40 Uhr", "Um 17:40 Uhr"], correctOptionId: "a", explanation: "Die Ansage nennt sechzehn Uhr vierzig." },
      { prompt: "Am Mittwoch kann man den Ausweis in der Bibliothek abholen. Richtig oder falsch?", options: ["Richtig", "Falsch"], correctOptionId: "b", explanation: "Die Bibliothek ist am Mittwoch geschlossen; der Ausweis ist erst ab Donnerstag bereit." },
      { prompt: "Was bestellt die Person außer zwei Brötchen?", options: ["Einen Kaffee", "Einen Tee", "Ein Wasser"], correctOptionId: "b", explanation: "Die Person bestellt zwei Brötchen und einen Tee." },
    ],
  },
  telc: {
    url: "/audio/german-a1/a1-telc-mini-mock.m4a",
    transcript: "Ansage eins: Der Bus nach Hamburg fährt heute um neun Uhr fünfzehn von Steig zwei.\nTelefonnotiz: Guten Tag, hier ist die Sprachschule Mitte. Ihr Deutschkurs beginnt am Montag um achtzehn Uhr, nicht um siebzehn Uhr.\nGespräch: Guten Tag. Ich suche das blaue Hemd in Größe M. Ja, wir haben es noch. Ich möchte es gern anprobieren.",
    questions: [
      { prompt: "Wann fährt der Bus nach Hamburg?", options: ["Um 9:15 Uhr", "Um 9:50 Uhr", "Um 10:15 Uhr"], correctOptionId: "a", explanation: "Die Ansage nennt neun Uhr fünfzehn." },
      { prompt: "Der Deutschkurs beginnt am Montag um 18 Uhr. Richtig oder falsch?", options: ["Richtig", "Falsch"], correctOptionId: "a", explanation: "Die Sprachschule sagt: Montag um achtzehn Uhr, nicht um siebzehn Uhr." },
      { prompt: "Welche Größe sucht die Person?", options: ["S", "M", "L"], correctOptionId: "b", explanation: "Die Person sucht das blaue Hemd in Größe M." },
    ],
  },
} as const;

function examLesson(trackId: "goethe" | "telc", stage: number): AcademyLesson {
  const track = germanA1ExamTracks[trackId];
  const miniListening = examMiniMockListening[trackId];
  const prefix = `a1-${trackId}-${String(stage).padStart(2, "0")}`;
  const sectionId = `a1-exam-${trackId}`;
  const section = trackId === "goethe" ? "Goethe-Prüfungsweg" : "telc-Prüfungsweg";
  const sourceMock = sourceLesson(`lesson-de-a1-modelltest-${trackId === "goethe" ? 1 : 2}`);
  const audio = sourceMock.blocks.find((block) => block.type === "audio");
  const speakingPartnerCards = trackId === "goethe"
    ? [
        { id: `${prefix}-karte-a`, title: "Runde A · Freizeit", body: "Person A zieht das Thema Freizeit. Fragen Sie: Was machen Sie am Wochenende? Person B antwortet mit einer Aktivität und stellt eine neue Frage nach dem Ort. Tauschen Sie danach die Rollen." },
        { id: `${prefix}-karte-b`, title: "Runde B · Einkaufen", body: "Person B zieht das Thema Einkaufen. Fragen Sie nach einem Preis. Person A antwortet mit einer konkreten Zahl und fragt nach der Größe. Tauschen Sie danach die Rollen." },
        { id: `${prefix}-karte-c`, title: "Runde C · Bitte", body: "Person A braucht einen Stift. Bitten Sie Person B höflich darum. Person B reagiert und bittet anschließend darum, eine Information zu wiederholen. Tauschen Sie danach die Rollen." },
      ]
    : [
        { id: `${prefix}-karte-a`, title: "Runde A · Unterwegs", body: "Person A zieht das Thema Reisen. Fragen Sie nach der Abfahrtszeit eines Zuges. Person B antwortet mit einer Uhrzeit und fragt nach dem Gleis. Tauschen Sie danach die Rollen." },
        { id: `${prefix}-karte-b`, title: "Runde B · Deutschkurs", body: "Person B zieht das Thema Lernen. Fragen Sie nach den Kurstagen. Person A antwortet mit zwei Tagen und fragt nach dem Kursort. Tauschen Sie danach die Rollen." },
        { id: `${prefix}-karte-c`, title: "Runde C · Bitte", body: "Person A möchte das Fenster schließen. Bitten Sie Person B höflich darum. Person B reagiert und bittet anschließend um einen Ausweis. Tauschen Sie danach die Rollen." },
      ];
  const miniMockBlocks: LessonBlock[] = [
    { id: `${prefix}-mini-timer`, type: "callout", heading: "Kurze Prüfungssimulation · Zeit selbst messen", body: "Stellen Sie einen Timer: 5 Minuten für Hören, 10 Minuten für Lesen, 15 Minuten für Schreiben und 5 Minuten für Sprechen. Antworten Sie zunächst ohne Transkript, Modelle oder Wörterbuch. Das kurze Audio enthält alle drei Hörsituationen in einem Clip: Hören Sie zuerst einmal für alle Aufgaben und ein zweites Mal für Teil 1 und Teil 3. Der offizielle Teil 2 wird nur einmal gehört. Diese Originalübung ersetzt keinen vollständigen offiziellen Übungssatz.", tone: "amber" },
    { id: `${prefix}-mini-audio`, type: "audio", heading: "Hören · drei neue Alltagssituationen", url: miniListening.url, caption: "Neue Durchsage, Telefonnotiz und Alltagssituation mit KI-generierten Stimmen. Hören Sie gemäß den drei Aufgabenformaten.", transcript: miniListening.transcript },
    ...miniListening.questions.map((item, index) => ({
      id: `${prefix}-mini-h${index + 1}`, type: "knowledge-check" as const,
      heading: `Hören · Teil ${index + 1}: ${index === 1 ? "richtig oder falsch" : "drei Antworten"}`,
      completion: "pass" as const, required: true,
      question: { id: `${prefix}-mini-q-h${index + 1}`, prompt: item.prompt,
        options: item.options.map((label, optionIndex) => ({ id: ["a", "b", "c"][optionIndex], label })),
        correctOptionId: item.correctOptionId, explanation: item.explanation },
    } satisfies LessonBlock)),
    { id: `${prefix}-mini-texte`, type: "tabs", heading: "Lesen · Nachricht, Anzeigen und Schild", items: [
      { id: `${prefix}-mini-text-1`, title: "Teil 1 · Nachricht", body: "Hallo Nour, wir treffen uns morgen um 16 Uhr vor der Post. Die Bibliothek ist heute geschlossen. Bis morgen! Leon" },
      { id: `${prefix}-mini-text-2`, title: "Teil 2 · Zwei Kursanzeigen", body: "Anzeige A · Deutsch am Morgen: Montag und Mittwoch, 9–11 Uhr.\nAnzeige B · Deutsch am Abend: Dienstag und Donnerstag, 18–20 Uhr." },
      { id: `${prefix}-mini-text-3`, title: "Teil 3 · Schild", body: "APOTHEKE AM PARK · Heute Mittagspause von 12 bis 14 Uhr. Danach bis 18 Uhr geöffnet." },
    ] },
    { id: `${prefix}-mini-l1`, type: "knowledge-check", heading: "Lesen · Teil 1: richtig oder falsch", completion: "pass", required: true, question: { id: `${prefix}-mini-q-l1`, prompt: "Nour und Leon treffen sich vor der Bibliothek. Richtig oder falsch?", options: [{ id: "a", label: "Richtig" }, { id: "b", label: "Falsch" }], correctOptionId: "b", explanation: "Leon schreibt: Sie treffen sich vor der Post." } },
    { id: `${prefix}-mini-l2`, type: "knowledge-check", heading: "Lesen · Teil 2: passende Anzeige", completion: "pass", required: true, question: { id: `${prefix}-mini-q-l2`, prompt: "Sie arbeiten jeden Vormittag. Welcher Deutschkurs passt?", options: [{ id: "a", label: "Anzeige A · Deutsch am Morgen" }, { id: "b", label: "Anzeige B · Deutsch am Abend" }], correctOptionId: "b", explanation: "Anzeige B bietet Unterricht am Abend von 18 bis 20 Uhr." } },
    { id: `${prefix}-mini-l3`, type: "knowledge-check", heading: "Lesen · Teil 3: richtig oder falsch", completion: "pass", required: true, question: { id: `${prefix}-mini-q-l3`, prompt: "Um 13 Uhr ist die Apotheke geöffnet. Richtig oder falsch?", options: [{ id: "a", label: "Richtig" }, { id: "b", label: "Falsch" }], correctOptionId: "b", explanation: "Die Apotheke macht von 12 bis 14 Uhr Mittagspause." } },
    { id: `${prefix}-mini-w1`, type: "writing-practice", heading: "Schreiben · Teil 1: Formular", prompt: "Sie melden eine erfundene Person zum Abendkurs an. Tragen Sie als beschriftete Zeilen Name, Geburtsdatum, Adresse, Telefonnummer und gewünschte Kurszeit ein.", minWords: 10, maxWords: 45, checklist: ["Fünf Felder sind ausgefüllt.", "Zahlen und Namen sind deutlich.", "Ich verwende erfundene Daten."], modelAnswer: "Name: Nour Haddad\nGeburtsdatum: 14.05.1994\nAdresse: Lindenstraße 5, 10115 Berlin\nTelefon: 0176 2345678\nKurszeit: Dienstag und Donnerstag, 18 Uhr", completion: "interact" },
    { id: `${prefix}-mini-w2`, type: "writing-practice", heading: "Schreiben · Teil 2: kurze Nachricht", prompt: "Sie kommen wegen eines verspäteten Busses nicht pünktlich zum Treffen mit Leon. Schreiben Sie: Grund, neue Uhrzeit und neuer Treffpunkt. Benutzen Sie Anrede und Gruß.", minWords: 25, maxWords: 55, checklist: ["Grund, Uhrzeit und Treffpunkt sind enthalten.", "Ich beginne und beende die Nachricht passend.", "Die Nachricht ist einfach und verständlich."], modelAnswer: "Hallo Leon, mein Bus hat leider Verspätung. Ich komme erst um 16:20 Uhr. Können wir uns vor der Post treffen? Entschuldigung und bis gleich, Nour", completion: "interact" },
    { id: `${prefix}-mini-s1`, type: "speaking-practice", heading: "Sprechen · Teil 1: vorstellen", prompt: "Stellen Sie eine echte oder erfundene Person kurz vor: Name, Wohnort, Sprache, Arbeit und Hobby.", preparationSeconds: 0, targetSeconds: 40, checklist: ["Fünf Angaben sind verständlich.", "Ich spreche in einfachen vollständigen Sätzen."], modelAnswer: "Guten Tag. Ich heiße Nour Haddad. Ich wohne in Berlin und spreche Arabisch, Englisch und etwas Deutsch. Ich arbeite im Geschäft. Ich lese gern.", completion: "interact" },
    { id: `${prefix}-mini-s2`, type: "speaking-practice", heading: "Sprechen · Teil 2: fragen und antworten", prompt: "Thema Deutschkurs: Stellen Sie zwei Fragen zu Zeit und Ort. Beantworten Sie anschließend zwei solche Fragen selbst.", preparationSeconds: 0, targetSeconds: 45, checklist: ["Ich stelle zwei klare Fragen.", "Ich beantworte beide Fragen mit konkreten Angaben."], modelAnswer: "Wann beginnt Ihr Deutschkurs? Wo ist der Kurs? Mein Kurs beginnt um sechs Uhr. Er ist in der Lindenstraße.", completion: "interact" },
    { id: `${prefix}-mini-s3`, type: "speaking-practice", heading: "Sprechen · Teil 3: bitten und reagieren", prompt: "Bitten Sie höflich um einen Stift und um eine Wiederholung. Reagieren Sie dann auf die Bitte: Können Sie mir bitte helfen?", preparationSeconds: 0, targetSeconds: 40, checklist: ["Ich sage bitte und formuliere konkrete Bitten.", "Ich reagiere höflich."], modelAnswer: "Können Sie mir bitte einen Stift geben? Können Sie das bitte wiederholen? Ja, gern. Ich helfe Ihnen.", completion: "interact" },
  ];
  const stageBlocks: LessonBlock[][] = [
    [
      { id: `${prefix}-hinweis`, type: "callout", tone: "amber", heading: "Unabhängiges Prüfungstraining", body: "Diese Übungen sind eigenständig erstellt. Die offiziellen Aufgaben, Zeiten und Bewertungshinweise finden Sie beim Prüfungsanbieter. Dieses Training ist weder eine offizielle Prüfung noch ein Zertifikat." },
      { id: `${prefix}-gemeinsam`, type: "callout", tone: "blue", heading: "Warum sich beide A1-Prüfungswege ähneln", body: "Goethe-Zertifikat A1: Start Deutsch 1 und telc Deutsch A1: Start Deutsch 1 gehen auf ein gemeinsam entwickeltes Prüfungsformat zurück. Beide Wege trainieren deshalb ähnliche Aufgabenfamilien. Nutzen Sie für Ihre konkrete Anmeldung, Antwortbögen, aktuelle Hinweise und den vollständigen Übungstest immer die Materialien des gewählten Anbieters." },
      { id: `${prefix}-zeiten`, type: "comparison-table", heading: "Offizieller Zeitrahmen", columns: ["Teil", "Zeit / Ablauf"], rows: [["Hören", track.timing.listening], ["Lesen und Schreiben", track.timing.readingWriting], ["Sprechen", `${track.timing.speaking}; ${track.timing.preparation}`]] },
      { id: `${prefix}-ablauf`, type: "process", heading: "Ihr Weg", items: track.stages.map((title, index) => ({ id: `${prefix}-schritt-${index + 1}`, title: `${index + 1}. ${title}`, body: index === 0 ? "Orientieren und Material prüfen." : index === 5 ? "Alle Fertigkeiten unter Zeitdruck verbinden." : "Aufgaben bearbeiten, Antwort prüfen und Fehler notieren." })) },
      { id: `${prefix}-link`, type: "resources", heading: "Offizielle Vorbereitung", items: [{ id: `${prefix}-official`, title: `${track.title}: offizielle Informationen und Übungsmaterial`, description: "Aktuelle Prüfungsdetails direkt beim Anbieter prüfen.", url: track.officialPracticeUrl }, { id: `${prefix}-format`, title: "Offizieller Prüfungsablauf", description: "Zeitvorgaben und Bedingungen beim Anbieter nachlesen.", url: track.officialFormatUrl }] },
    ],
    [
      { id: `${prefix}-strategie`, type: "text", heading: "Hören: Situation vor Details", paragraphs: ["Lesen Sie zuerst die Frage. Hören Sie dann auf Personen, Orte, Zahlen und Zeiten. Entscheiden Sie erst nach dem Hören; ein einzelnes bekanntes Wort genügt nicht.", "In den offiziellen Start-Deutsch-1-Modellen hören Sie Teil 1 und Teil 3 zweimal, Teil 2 einmal. Unsere drei kurzen Situationen liegen in einem einzigen Clip: Hören Sie ihn zuerst einmal ganz, beantworten Sie Teil 2 und hören Sie ihn dann ein zweites Mal für Teil 1 und Teil 3. Diese Übung ist kein vollständiger offizieller Hörteil."] },
      ...(audio ? [{ ...structuredClone(audio), id: `${prefix}-audio`, heading: "Hören – drei Situationen", caption: "Durchsage, Telefonnotiz und Gespräch. Üben Sie das passende Aufgabenformat; die Stimmen sind KI-generiert." } satisfies LessonBlock] : []),
      { id: `${prefix}-h1`, type: "knowledge-check", heading: "Hören · Teil 1: drei Antworten", completion: "pass", required: true, question: { id: `${prefix}-q-h1`, prompt: "Von welchem Gleis fährt der Zug?", options: [{ id: "a", label: "Gleis sieben" }, { id: "b", label: "Gleis zwei" }, { id: "c", label: "Gleis zehn" }], correctOptionId: "a", explanation: "In der Ansage hören Sie: von Gleis sieben." } },
      { id: `${prefix}-h2`, type: "knowledge-check", heading: "Hören · Teil 2: richtig oder falsch", completion: "pass", required: true, question: { id: `${prefix}-q-h2`, prompt: "Der Arzttermin bleibt am Dienstag. Ist diese Aussage richtig oder falsch?", options: [{ id: "a", label: "Richtig" }, { id: "b", label: "Falsch" }], correctOptionId: "b", explanation: "Falsch: Die Praxis verschiebt den Termin von Dienstag auf Mittwoch um zehn Uhr." } },
      { id: `${prefix}-h3`, type: "knowledge-check", heading: "Hören · Teil 3: drei Antworten", completion: "pass", required: true, question: { id: `${prefix}-q-h3`, prompt: "Wie bezahlt die Person?", options: [{ id: "a", label: "Mit Karte" }, { id: "b", label: "Bar" }, { id: "c", label: "Mit einem Gutschein" }], correctOptionId: "a", explanation: "Die Person sagt: Die Rechnung zahle ich mit Karte." } },
    ],
    [
      { id: `${prefix}-lesezeit`, type: "callout", heading: "Zeit im Prüfungsformat", body: trackId === "goethe" ? "Für Lesen sind im Goethe Start Deutsch 1 25 Minuten vorgesehen. Üben Sie, erst die Frage und dann den passenden Textteil zu lesen." : "Bei telc teilen sich Lesen und Schreiben insgesamt 45 Minuten. Reservieren Sie bewusst Zeit für beide Fertigkeiten und bleiben Sie bei kurzen Texten nicht zu lange hängen.", tone: "blue" },
      { id: `${prefix}-texte`, type: "tabs", heading: "Lesen – drei Aufgabenfamilien", items: [
        { id: `${prefix}-l1`, title: "Teil 1 · Nachricht", body: "Hallo Alex, der Deutschkurs beginnt morgen um 10 Uhr statt um 9 Uhr. Bring bitte das Kursbuch mit. Viele Grüße, Mira" },
        { id: `${prefix}-l2`, title: "Teil 2 · Zwei Anzeigen", body: "Anzeige A · Fahrradwerkstatt West: Dienstag bis Freitag 9–18 Uhr, Samstag 10–14 Uhr. Montag geschlossen.\nAnzeige B · Fahrradwerkstatt Mitte: Montag bis Freitag 9–18 Uhr. Samstag und Sonntag geschlossen." },
        { id: `${prefix}-l3`, title: "Teil 3 · Schild", body: "Stadtbibliothek: Heute ab 15 Uhr geschlossen. Bücher können Sie am Automaten zurückgeben." },
      ] },
      { id: `${prefix}-lcheck1`, type: "knowledge-check", heading: "Lesen · Teil 1: richtig oder falsch", completion: "pass", required: true, question: { id: `${prefix}-q-l1`, prompt: "Der Deutschkurs beginnt morgen um neun Uhr. Ist diese Aussage richtig oder falsch?", options: [{ id: "a", label: "Richtig" }, { id: "b", label: "Falsch" }], correctOptionId: "b", explanation: "Falsch: Mira schreibt, dass der Kurs morgen um zehn Uhr statt um neun Uhr beginnt." } },
      { id: `${prefix}-lcheck2`, type: "knowledge-check", heading: "Lesen · Teil 2: passende Anzeige", completion: "pass", required: true, question: { id: `${prefix}-q-l2`, prompt: "Sie möchten Ihr Fahrrad am Samstag reparieren lassen. Welche Anzeige passt?", options: [{ id: "a", label: "Anzeige A · Werkstatt West" }, { id: "b", label: "Anzeige B · Werkstatt Mitte" }], correctOptionId: "a", explanation: "Nur Werkstatt West ist am Samstag von zehn bis vierzehn Uhr geöffnet." } },
      { id: `${prefix}-lcheck3`, type: "knowledge-check", heading: "Lesen · Teil 3: richtig oder falsch", completion: "pass", required: true, question: { id: `${prefix}-q-l3`, prompt: "Nach 15 Uhr kann man Bücher am Automaten zurückgeben. Ist diese Aussage richtig oder falsch?", options: [{ id: "a", label: "Richtig" }, { id: "b", label: "Falsch" }], correctOptionId: "a", explanation: "Richtig: Das Schild erlaubt die Rückgabe am Automaten auch nach der Schließung." } },
    ],
    [
      { id: `${prefix}-schreibzeit`, type: "callout", heading: "Zeit und Selbstkontrolle", body: trackId === "goethe" ? "Im Goethe Start Deutsch 1 sind für Schreiben 20 Minuten vorgesehen. Planen Sie kurz und prüfen Sie danach alle Inhaltspunkte." : "Bei telc gehören Lesen und Schreiben zu einem 45-Minuten-Block. Lassen Sie genug Zeit für beide Schreibteile und lesen Sie Ihre Antwort vor der Abgabe noch einmal.", tone: "teal" },
      { id: `${prefix}-formular`, type: "writing-practice", heading: "Schreiben · Teil 1: Formular", prompt: "Sie melden sich zu einem Deutschkurs an. Schreiben Sie Name, Geburtsdatum, Adresse, Telefonnummer und gewünschte Kurszeit als klar beschriftete Formularzeilen. Verwenden Sie erfundene Daten.", minWords: 10, maxWords: 45, checklist: ["Alle fünf Angaben sind vorhanden.", "Zahlen und Schreibweise sind eindeutig.", "Ich benutze keine echten sensiblen Daten."], modelAnswer: "Name: Sam Weber\nGeburtsdatum: 12.04.1992\nAdresse: Marktstraße 8, 10115 Berlin\nTelefon: 0176 1234567\nKurszeit: Montag und Mittwoch, 18 Uhr", completion: "interact" },
      { id: `${prefix}-nachricht`, type: "writing-practice", heading: "Schreiben · Teil 2: Nachricht", prompt: "Sie können morgen nicht zum Kurs kommen. Schreiben Sie Ihrer Kursleiterin: warum Sie fehlen, wann Sie wiederkommen und eine Frage zu den Hausaufgaben.", minWords: 30, maxWords: 60, checklist: ["Grund, Rückkehr und Frage sind enthalten.", "Anrede und Gruß passen.", "Die Nachricht ist klar und höflich."], modelAnswer: "Liebe Frau Berger, ich kann morgen leider nicht zum Kurs kommen, denn ich bin krank. Am Donnerstag bin ich wieder da. Welche Hausaufgaben soll ich machen? Vielen Dank und viele Grüße, Sam Weber", completion: "interact" },
    ],
    [
      { id: `${prefix}-sprechen-hinweis`, type: "callout", heading: "Ohne Vorbereitungszeit und mit Partner üben", body: `Im offiziellen ${track.title} gibt es für den mündlichen Teil keine Vorbereitungszeit. Starten Sie jede Aufnahme direkt nach dem Lesen der Aufgabe. Die private Aufnahme trainiert Ihre eigene Antwort, ersetzt aber kein Gespräch mit anderen Prüfungsteilnehmenden. Üben Sie die Karten zusätzlich mit einer anderen Person; allein sprechen Sie beide Rollen mit einer kurzen Pause dazwischen.`, tone: "blue" },
      { id: `${prefix}-partnerkarten`, type: "tabs", heading: "Originale Partnerkarten · fragen, antworten, reagieren", items: speakingPartnerCards },
      { id: `${prefix}-s1`, type: "speaking-practice", heading: "Sprechen · Teil 1: Vorstellen", prompt: "Stellen Sie sich vor: Name, Herkunft, Wohnort, Sprachen, Arbeit und Hobby. Nutzen Sie erfundene Angaben, wenn Sie möchten.", preparationSeconds: 0, targetSeconds: 45, checklist: ["Ich nenne mindestens fünf Angaben.", "Ich spreche langsam und deutlich.", "Ich sage vollständige kurze Sätze."], modelAnswer: "Guten Tag. Ich heiße Sam Weber. Ich komme aus Österreich und wohne in Berlin. Ich spreche Deutsch und Englisch. Ich arbeite im Büro. In meiner Freizeit koche ich gern.", completion: "interact" },
      { id: `${prefix}-s2`, type: "speaking-practice", heading: "Sprechen · Teil 2: Fragen", prompt: "Stellen Sie zwei Fragen zum Thema Freizeit und beantworten Sie zwei ähnliche Fragen selbst.", preparationSeconds: 0, targetSeconds: 45, checklist: ["Meine Fragen sind verständlich.", "Ich benutze passende Fragewörter.", "Ich beantworte beide Fragen."], modelAnswer: "Was machen Sie am Wochenende? Spielen Sie gern Sport? Ich gehe am Samstag gern spazieren. Ja, ich spiele manchmal Tennis.", completion: "interact" },
      { id: `${prefix}-s3`, type: "speaking-practice", heading: "Sprechen · Teil 3: Bitten", prompt: "Bitten Sie höflich um einen Stift und um eine Wiederholung. Reagieren Sie anschließend auf eine Bitte um Hilfe.", preparationSeconds: 0, targetSeconds: 45, checklist: ["Ich benutze bitte.", "Meine Bitte ist konkret.", "Ich reagiere freundlich."], modelAnswer: "Können Sie mir bitte einen Stift geben? Können Sie das bitte wiederholen? Ja, gern. Ich helfe Ihnen.", completion: "interact" },
    ],
    [
      { id: `${prefix}-mock-hinweis`, type: "text", heading: "Zwei Stufen der Prüfungssimulation", paragraphs: [`Stufe 1: Bearbeiten Sie die kurze, eigenständig erstellte Übung unten. Sie ist keine vollständige oder offizielle ${trackId === "goethe" ? "Goethe" : "telc"}-Prüfung.`, `Stufe 2: Öffnen Sie danach den offiziellen Übungssatz des gewählten Anbieters. Planen Sie ${track.timing.listening} für Hören, ${track.timing.readingWriting} für Lesen/Schreiben und ${track.timing.speaking} für die mündliche Simulation ein. Benutzen Sie zunächst weder Transkript noch Lösungen.`] },
      ...miniMockBlocks,
      { id: `${prefix}-antwortbogen-routine`, type: "process", heading: "Den offiziellen Übungssatz wirklich simulieren", items: [
        { id: `${prefix}-antwortbogen-1`, title: "1 · Material und Timer", body: "Öffnen Sie PDF, Audio und Antwortbogen beim gewählten Anbieter. Prüfen Sie die aktuellen Anweisungen und stellen Sie die offiziellen Zeiten ein." },
        { id: `${prefix}-antwortbogen-2`, title: "2 · Antworten übertragen", body: "Bearbeiten Sie Hören und Lesen ohne Lösungen. Übertragen Sie Ihre Antworten innerhalb der vorgesehenen Zeit auf den offiziellen Antwortbogen; prüfen Sie Nummer und Markierung." },
        { id: `${prefix}-antwortbogen-3`, title: "3 · Ehrlich auswerten", body: "Vergleichen Sie die objektiven Antworten mit dem offiziellen Lösungsschlüssel. Prüfen Sie Schreiben mit den Bewertungshinweisen und Sprechen mit einer Lehrperson oder einem Übungspartner; eine private Aufnahme ist keine offizielle Bewertung." },
      ] },
      { id: `${prefix}-volltest`, type: "resources", heading: "Vollständigen offiziellen Übungstest öffnen", items: [{ id: `${prefix}-official-mock`, title: `${track.title}: offizielles Prüfungsmodell`, description: "PDF, Audio und Lösungen beim Prüfungsanbieter herunterladen; nichts davon wird hier kopiert.", url: track.officialPracticeUrl }] },
    ],
    [
      { id: `${prefix}-auswertung`, type: "text", heading: "Fehler auswerten", paragraphs: ["Vergleichen Sie Ihre Antworten mit den Erklärungen. Markieren Sie drei konkrete Fehler: Zahl/Zeit, Wortschatz, Frage, Satzbau oder Aufgabenpunkt.", "Wiederholen Sie die betreffenden Kapitel. Für Schreiben und Sprechen nutzen Sie Checklisten und Modellantworten als Selbstkontrolle; diese Leistungen werden nicht automatisch als bestanden bewertet."] },
      { id: `${prefix}-fertigkeiten-rueckblick`, type: "comparison-table", heading: "Vier Fertigkeiten ehrlich prüfen", columns: ["Fertigkeit", "Das kann ich kontrollieren", "Bei Schwierigkeiten"], rows: [
        ["Hören", "Ich finde in drei neuen Hörsituationen die richtige Uhrzeit, Information und Handlung.", "Zahlen und Uhrzeiten in Kapitel 1 und 4 noch einmal hören; dann eine neue Ansage probieren."],
        ["Lesen", "Ich finde die entscheidende Angabe in einer Nachricht, einer Anzeige und einem Schild.", "Kurze Alltagstexte aus Kapitel 8, 9 und 14 erneut lesen; zuerst die Frage markieren."],
        ["Schreiben", "Mein Formular enthält alle verlangten Felder; meine Nachricht beantwortet jeden Inhaltspunkt mit Anrede und Gruß.", "Die eigenen Antworten mit der Checkliste vergleichen und ohne Modell neu schreiben. Keine automatische Note."],
        ["Sprechen", "Ich stelle mich verständlich vor, stelle und beantworte Fragen und reagiere auf eine Bitte mit einer anderen Person.", "Partnerkarten erneut üben und eine neue Aufnahme machen. Keine automatische Note."],
      ] },
      { id: `${prefix}-bereitschaft`, type: "callout", heading: "Bereit für den offiziellen Übungssatz?", body: `Die kurze ScienceDojo-Simulation ist eine Lernübung und keine verlässliche Prognose für das Bestehen von ${track.title}. Bearbeiten Sie jetzt den vollständigen offiziellen Übungssatz mit den aktuellen Zeitvorgaben und Lösungen des Prüfungsanbieters. Prüfen Sie Schreiben und Sprechen zusätzlich mit einer Lehrperson oder einem Übungspartner.`, tone: "amber" },
      { id: `${prefix}-plan`, type: "writing-practice", heading: "Mein nächster Lernschritt", prompt: "Notieren Sie drei konkrete Lernschritte für die nächste Woche. Nennen Sie ein Hör-/Lesethema und je ein Schreib- und Sprechziel.", minWords: 25, maxWords: 70, checklist: ["Drei Schritte sind konkret.", "Ich nenne einen Termin für die Wiederholung.", "Ich nutze die Fehler aus dem Modelltraining."], modelAnswer: "Am Montag höre ich die Bahnhofsdurchsage noch einmal und notiere alle Uhrzeiten. Am Mittwoch schreibe ich zwei kurze E-Mails mit Anrede und Gruß. Am Freitag nehme ich eine Vorstellung von 45 Sekunden auf.", completion: "interact" },
      { id: `${prefix}-offiziell`, type: "resources", heading: "Mit offiziellem Material weiterüben", items: [{ id: `${prefix}-official`, title: `${track.title}: offizielle Übungen`, description: "Format, Audio, Zeitvorgaben und Bewertung direkt beim Anbieter prüfen.", url: track.officialPracticeUrl }] },
    ],
  ];
  return {
    id: `lesson-de-${prefix}`,
    sectionId,
    section,
    examTrack: trackId,
    slug: prefix,
    title: `${trackId === "goethe" ? "Goethe" : "telc"} ${stage}. ${track.stages[stage - 1]}`,
    summary: `Unabhängiges ${track.title}-Training: ${track.stages[stage - 1].toLowerCase()}.`,
    durationMinutes: stage === 6 ? 180 : stage === 1 ? 45 : 90,
    blocks: stageBlocks[stage - 1],
  };
}

const examLessons = (["goethe", "telc"] as const).flatMap((track) =>
  Array.from({ length: 7 }, (_, index) => examLesson(track, index + 1)));

const vocabularyContexts: Array<{
  prompt: string;
  answers: [string, string, string];
  explanation: string;
}> = [
  { prompt: "Sie verstehen einen Namen nicht. Was sagen Sie höflich?", answers: ["Können Sie das bitte wiederholen?", "Die Rechnung, bitte.", "Ich habe Kopfschmerzen."], explanation: "Mit dieser Bitte fragen Sie nach einer Wiederholung." },
  { prompt: "Sie möchten sich im Kurs vorstellen. Welcher Satz passt?", answers: ["Ich heiße Sam und wohne in Berlin.", "Die Jacke kostet 30 Euro.", "Der Zug fährt von Gleis vier."], explanation: "Name und Wohnort gehören zu einer kurzen Vorstellung." },
  { prompt: "Sie möchten im Café ein Getränk bestellen. Was sagen Sie?", answers: ["Ich hätte gern einen Tee, bitte.", "Wo ist die Apotheke?", "Der Termin ist am Montag."], explanation: "Ich hätte gern … ist eine höfliche Bestellung." },
  { prompt: "Sie suchen ein Zimmer. Welche Frage ist wichtig?", answers: ["Wie viel kostet das Zimmer im Monat?", "Wann fährt der nächste Zug?", "Wie ist das Wetter morgen?"], explanation: "Bei einer Zimmeranfrage ist die monatliche Miete wichtig." },
  { prompt: "Sie brauchen eine Fahrkarte. Wohin gehen Sie?", answers: ["Zum Fahrkartenautomaten.", "Zur Speisekarte.", "Zum Kleiderschrank."], explanation: "Eine Fahrkarte kann man am Fahrkartenautomaten kaufen." },
  { prompt: "Sie wollen wissen, wann die Bibliothek geöffnet ist. Wonach fragen Sie?", answers: ["Nach den Öffnungszeiten.", "Nach der Schuhgröße.", "Nach dem Mittagessen."], explanation: "Öffnungszeiten sagen, wann ein Ort geöffnet ist." },
  { prompt: "Sie sind krank. Welche Aussage passt beim Arzt?", answers: ["Mein Bauch tut weh.", "Die Wohnung ist hell.", "Ich fahre mit dem Bus."], explanation: "Mein Bauch tut weh beschreibt eine Beschwerde." },
  { prompt: "Eine Freundin lädt Sie ein. Sie möchten kommen. Was antworten Sie?", answers: ["Danke, ich komme gern.", "Ich habe keinen Ausweis.", "Das macht 12 Euro."], explanation: "So nehmen Sie eine Einladung freundlich an." },
  { prompt: "Es regnet. Was nehmen Sie mit?", answers: ["Einen Regenschirm.", "Eine Fahrkarte nach Köln.", "Eine Telefonnummer."], explanation: "Ein Regenschirm schützt vor Regen." },
  { prompt: "Auf einem Formular steht „Nachname“. Was tragen Sie ein?", answers: ["Ihren Familiennamen.", "Ihren Lieblingsfilm.", "Ihre Schuhgröße."], explanation: "Nachname bedeutet Familienname." },
];

const revisedQuiz = structuredClone(germanA1Course.quiz).map((question) => {
  if (/^final-h\d{1,2}$/.test(question.id)) {
    const context = germanA1FinalListening[Number(question.id.slice("final-h".length)) - 1];
    if (!context) throw new Error(`Missing listening question for ${question.id}`);
    return {
      ...question,
      prompt: context.prompt,
      audioUrl: context.audioUrl,
      audioTranscript: context.transcript,
      options: context.answers.map((label, index) => ({ id: ["a", "b", "c"][index], label })),
      correctOptionId: ["a", "b", "c"][context.correctIndex],
      explanation: context.explanation,
    };
  }
  if (/^final-k\d{2}$/.test(question.id)) {
    const context = vocabularyContexts[Number(question.id.slice(-2)) - 1];
    if (!context) throw new Error(`Missing vocabulary question for ${question.id}`);
    return {
      ...question,
      prompt: context.prompt,
      options: context.answers.map((label, index) => ({ id: ["a", "b", "c"][index], label })),
      correctOptionId: "a",
      explanation: context.explanation,
    };
  }
  if (question.id === "final-l8") return {
    ...question,
    prompt: "Lesen Sie: „Samstag sonnig. Am Sonntag regnet es ab 14 Uhr.“ Wann beginnt der Regen?",
    options: [
      { id: "a", label: "Am Sonntag ab 14 Uhr" },
      { id: "b", label: "Am Samstag um 14 Uhr" },
      { id: "c", label: "Am Sonntagmorgen" },
    ],
    correctOptionId: "a",
    explanation: "Der Wetterhinweis sagt: Am Sonntag regnet es ab 14 Uhr.",
  };
  if (question.id === "final-g2") return {
    ...question,
    prompt: "Sie kaufen Obst im Supermarkt. Welcher Satz ist richtig?",
    explanation: "Bei einem Apfel sagen Sie: Ich kaufe einen Apfel.",
  };
  if (question.id === "final-g4") return {
    ...question,
    prompt: "Welche Frage nach der Uhrzeit ist richtig?",
    options: [
      { id: "a", label: "Wann beginnt der Kurs?" },
      { id: "b", label: "Wann der Kurs beginnt?" },
      { id: "c", label: "Beginnt wann der Kurs?" },
    ],
    correctOptionId: "a",
    explanation: "In der W-Frage steht das Verb direkt nach dem Fragewort: Wann beginnt …?",
  };
  if (question.id === "final-g8") return {
    ...question,
    prompt: "Welcher Satz verbindet zwei einfache Aussagen richtig?",
    options: [
      { id: "a", label: "Ich bin krank und ich bleibe zu Hause." },
      { id: "b", label: "Ich bin krank und bleibe ich zu Hause." },
      { id: "c", label: "Ich bin krank und zu Hause ich bleibe." },
    ],
    correctOptionId: "a",
    explanation: "Nach und kann ein zweiter einfacher Hauptsatz mit Subjekt und Verb folgen.",
  };
  if (question.id === "final-g9") return {
    ...question,
    prompt: "Sie beschreiben Ihren Arbeitsweg. Welcher Satz ist richtig?",
    explanation: "Für den Weg mit diesem Verkehrsmittel sagen Sie: Ich fahre mit dem Bus.",
  };
  return question;
}).map((question, index) => {
  const offset = index % question.options.length;
  return {
    ...question,
    options: [...question.options.slice(offset), ...question.options.slice(0, offset)],
  };
});

export const germanA1RestructuredCourse: AcademyCourse = migrateAcademyCourse({
  ...structuredClone(germanA1Course),
  description: "Ein alltagsnaher Deutsch-A1-Kurs für Erwachsene. Nach 15 Kapiteln und dem Abschlusstest wählen Sie unabhängig zwischen Goethe- und telc-Prüfungstraining.",
  sections: [
    ...chapterSections,
    { id: "a1-exam-goethe", title: "Goethe-Prüfungsweg" },
    { id: "a1-exam-telc", title: "telc-Prüfungsweg" },
  ],
  examTracks: Object.entries(germanA1ExamTracks).map(([id, track]) => ({
    id,
    title: track.title,
    description: `Eigenständig erstelltes Training mit Link zu offiziellen Übungen: ${track.officialPracticeUrl}`,
  })),
  lessons: [...coreLessons, ...examLessons].map(styleGermanA1Lesson),
  quizRevision: (germanA1Course.quizRevision || 1) + 1,
  quiz: revisedQuiz,
  estimatedMinutes: coreLessons.reduce((total, lesson) => total + lesson.durationMinutes, 0) +
    examLessons.filter((lesson) => lesson.examTrack === "goethe")
      .reduce((total, lesson) => total + lesson.durationMinutes, 0),
});

export const germanA1RestructuredSourceLinks = germanA1CurriculumSources;

import type { B1Question } from "./german-b1-curriculum.ts";

export const b1ExamReading = {
  blog: "Letzte Woche habe ich zum ersten Mal bei einem Repair-Café geholfen. Eigentlich wollte ich mein Fahrrad reparieren lassen. Als ich sah, wie viele Menschen warteten, bot ich an, die Namen aufzuschreiben. Eine Fachperson reparierte später meine Bremse. Dafür musste ich nichts bezahlen; ich gab freiwillig eine Spende. Am Ende half ich beim Aufräumen. Beim nächsten Treffen möchte ich wieder mitmachen, aber nur bei der Organisation. Für technische Reparaturen fehlt mir noch die Erfahrung.",
  article: "Die Stadtbibliothek testet drei Monate lang eine zusätzliche Sonntagsöffnung. Einmal im Monat können Besucher von zehn bis vierzehn Uhr lesen und lernen. Die Ausleihe ist geöffnet, eine persönliche Beratung wird sonntags jedoch nicht angeboten. Die Stadt zählt die Besucher und befragt das Personal. Erst nach der Testphase wird entschieden, ob das Angebot fortgesetzt werden kann. Eine dauerhafte tägliche Verlängerung der Öffnungszeiten ist bisher nicht geplant.",
  adverts: "A: Lerncafé — kostenloser Gesprächstreff montags 18–19 Uhr; keine Einzelberatung. B: Schreibwerkstatt — persönliche Rückmeldung zu Bewerbungen, dienstags 10–12 Uhr, Anmeldung erforderlich. C: Digitaler Kurs — Grammatikübungen jederzeit online; kein direkter Kontakt zu einer Lehrkraft.",
  opinions: "Mira: Ich finde Sonntagsöffnungen sinnvoll, weil ich werktags arbeite. Ein kleiner Versuch wäre gut. Ben: Ich lehne zusätzliche Sonntagsöffnungen ab. Das Team braucht einen freien Tag, auch wenn Besucher das Angebot gern hätten. Aylin: Für mich hängt es von den Kosten ab. Ohne diese Information möchte ich noch keine Entscheidung treffen.",
  rules: "Gemeinschaftsraum: Reservierungen mindestens zwei Tage vorher per E-Mail. Die Nutzung endet um 21 Uhr. Danach bleiben 30 Minuten zum Aufräumen. Speisen dürfen mitgebracht werden; eine Küche steht nicht zur Verfügung. Fenster vor dem Verlassen schließen. Fahrräder müssen außerhalb des Gebäudes bleiben. Bei Fragen wenden Sie sich an die Verwaltung, nicht an den Reinigungsdienst.",
};

export const b1ExamReadingQuestions: B1Question[] = [
  { prompt: "Blog: Warum half die Person zuerst bei der Organisation?", answer: "Weil viele Menschen auf Hilfe warteten.", distractors: ["Weil sie bereits technische Fachkenntnisse hatte.", "Weil alle Reparaturen bezahlt werden mussten."], explanation: "Die lange Warteschlange veranlasste sie, die Namen aufzuschreiben." },
  { prompt: "Blog: Die Person wird beim nächsten Mal selbst technische Reparaturen durchführen. Richtig oder falsch?", answer: "Falsch", distractors: ["Richtig", "Der Text nennt überhaupt keinen nächsten Besuch."], explanation: "Sie möchte nur bei der Organisation helfen; technische Erfahrung fehlt." },
  { prompt: "Artikel: Was wird während der Testphase angeboten?", answer: "Eine Sonntagsöffnung im Monat ohne persönliche Beratung.", distractors: ["Tägliche Beratung bis Mitternacht.", "Kostenlose persönliche Beratung an jedem Sonntag."], explanation: "Die Ausleihe ist geöffnet; persönliche Beratung gibt es sonntags nicht." },
  { prompt: "Anzeigen: Kim arbeitet tagsüber und möchte abends kostenlos Deutsch sprechen. Welche Anzeige passt?", answer: "A · Lerncafé", distractors: ["B · Schreibwerkstatt", "C · Digitaler Kurs"], explanation: "Nur A bietet einen kostenlosen Gesprächstreff am Abend." },
  { prompt: "Anzeigen: Jo braucht persönliche Hilfe beim Schreiben einer Bewerbung. Welche Anzeige passt?", answer: "B · Schreibwerkstatt", distractors: ["A · Lerncafé", "C · Digitaler Kurs"], explanation: "B bietet persönliche Rückmeldung zu Bewerbungen; eine Anmeldung ist nötig." },
  { prompt: "Anzeigen: Eine Person sucht einen betreuten Grammatik-Einzelkurs am Sonntag. Was passt?", answer: "Keine Anzeige passt.", distractors: ["A · Lerncafé", "C · Digitaler Kurs"], explanation: "C ist zeitlich flexibel, bietet aber keine direkte Betreuung. Prüfen Sie alle Anforderungen." },
  { prompt: "Meinungen: Wer lehnt die zusätzliche Sonntagsöffnung ausdrücklich ab?", answer: "Ben", distractors: ["Mira", "Aylin"], explanation: "Ben ist dagegen; Aylin ist noch unentschieden und Mira befürwortet einen Versuch." },
  { prompt: "Regeln: Wann muss die Nutzung enden?", answer: "Um 21 Uhr; danach bleibt Zeit zum Aufräumen.", distractors: ["Um 21:30 Uhr beginnt erst die Veranstaltung.", "Um 20 Uhr müssen auch alle Aufräumarbeiten beendet sein."], explanation: "Nutzung bis 21 Uhr und anschließende 30 Minuten Aufräumen sind getrennt." },
];

export const b1ExamListening = [
  {
    id: "b1-exam-short", title: "Nachricht · geänderter Termin", repeats: 2,
    segments: [{ speaker: "Anna", text: "Hallo Mira, hier ist Lea. Unser Treffen morgen findet nicht im Café statt, weil es renoviert wird. Wir treffen uns stattdessen um siebzehn Uhr vor der Bibliothek. Die Uhrzeit bleibt also gleich, nur der Ort ändert sich. Bitte bring den Ausdruck für unseren Ausflug mit. Ich habe die Fahrkarten schon gekauft. Falls du später kommst, schreib mir eine Nachricht. Ich bleibe bis halb sechs vor dem Eingang und gehe erst danach hinein. Übrigens kann Ben diesmal nicht kommen. Wir besprechen die wichtigsten Punkte zu zweit und schicken ihm anschließend eine kurze Zusammenfassung. Bis morgen!" }],
    questions: [
      { prompt: "Was hat sich geändert?", answer: "Der Treffpunkt, nicht die Uhrzeit.", distractors: ["Nur die Uhrzeit.", "Treffpunkt und Uhrzeit."], explanation: "Siebzehn Uhr bleibt; Bibliothek ersetzt Café." },
      { prompt: "Lea hat die Fahrkarten bereits gekauft. Richtig oder falsch?", answer: "Richtig", distractors: ["Falsch", "Die Nachricht betrifft keine Fahrkarten."], explanation: "Lea sagt ausdrücklich, dass die Fahrkarten schon gekauft sind." },
    ] satisfies B1Question[],
  },
  {
    id: "b1-exam-talk", title: "Information · Führung im Stadtmuseum", repeats: 1,
    segments: [{ speaker: "Eddy (German (Germany))", text: "Herzlich willkommen im Stadtmuseum. Unsere Führung beginnt heute um elf Uhr im Erdgeschoss und dauert ungefähr eine Stunde. Zuerst sehen Sie Fotos aus der Geschichte des Marktplatzes. Danach gehen wir in den ersten Stock zu den Interviews mit Bewohnern. Der Aufzug ist heute außer Betrieb. Wer die Treppe nicht nutzen kann, erhält im Erdgeschoss eine digitale Auswahl der Interviews. Bitte sagen Sie uns vor Beginn Bescheid, damit wir Ihnen helfen können. Fotografieren ohne Blitz ist erlaubt. Getränke bleiben jedoch im Foyer. Ihr Ticket gilt den ganzen Tag, Sie können also nach der Führung noch selbstständig weitergehen. Für das Gespräch mit einer Zeitzeugin am Nachmittag müssen Sie sich zusätzlich am Empfang anmelden; die Führung reserviert dafür keinen Platz." }],
    questions: [
      { prompt: "Welche Hilfe gibt es für Personen, die keine Treppe nutzen können?", answer: "Eine digitale Auswahl der Interviews im Erdgeschoss.", distractors: ["Einen funktionierenden Aufzug.", "Eine kostenlose Fahrt zu einem anderen Museum."], explanation: "Der Aufzug ist außer Betrieb; es gibt eine zugängliche digitale Alternative." },
      { prompt: "Was ist für das Gespräch am Nachmittag nötig?", answer: "Eine zusätzliche Anmeldung am Empfang.", distractors: ["Nur die Teilnahme an der Führung.", "Ein Foto mit Blitz als Nachweis."], explanation: "Ein Führungsticket reserviert ausdrücklich keinen Platz für das Gespräch." },
    ] satisfies B1Question[],
  },
  {
    id: "b1-exam-dialogue", title: "Gespräch · gemeinsam einen Kurs wählen", repeats: 1,
    segments: [
      { speaker: "Anna", text: "Ich würde gern den Abendkurs besuchen. Dort können wir direkt mit anderen sprechen. Der Onlinekurs wäre zwar günstiger, aber ich brauche feste Termine." },
      { speaker: "Eddy (German (Germany))", text: "Ich arbeite donnerstags bis spät. Deshalb könnte ich nur am Montag kommen. Der Abendkurs findet aber zweimal pro Woche statt. Für mich wäre der Onlinekurs flexibler." },
      { speaker: "Anna", text: "Dann könnten wir online lernen und montags zusammen üben. So hätte ich wenigstens einen festen Termin. Wir müssten aber selbst Aufgaben auswählen." },
      { speaker: "Eddy (German (Germany))", text: "Das finde ich gut. Wir könnten jede Woche abwechselnd ein Thema vorbereiten. Nach einem Monat prüfen wir, ob es funktioniert. Falls wir zu wenig sprechen, suchen wir zusätzlich einen Gesprächstreff." },
    ],
    questions: [
      { prompt: "Warum passt der Abendkurs nicht zum zweiten Sprecher?", answer: "Er kann donnerstags wegen seiner Arbeit nicht teilnehmen.", distractors: ["Er möchte grundsätzlich keine festen Termine.", "Der Kurs findet nur vormittags statt."], explanation: "Seine Arbeit am Donnerstag verhindert die Teilnahme an beiden Kursabenden." },
      { prompt: "Auf welchen Plan einigen sich die beiden?", answer: "Online lernen und montags gemeinsam üben.", distractors: ["Jeden Donnerstag im Abendkurs lernen.", "Einen Monat lang überhaupt nicht sprechen."], explanation: "Sie verbinden flexible Aufgaben mit einem festen gemeinsamen Montagstermin." },
    ] satisfies B1Question[],
  },
  {
    id: "b1-exam-discussion", title: "Diskussion · eine Sonntagsöffnung", repeats: 2,
    segments: [
      { speaker: "Eddy (German (Germany))", text: "Wir sprechen heute über die Bibliothek am Sonntag. Frau Kern, wie finden Sie die Idee einer zusätzlichen Öffnung?" },
      { speaker: "Anna", text: "Ich wäre dafür, sie einmal im Monat zu testen. Unter der Woche arbeite ich lange. Sonntags könnte ich in Ruhe lernen. Mir reicht ein ruhiger Arbeitsplatz, ich brauche dann nicht unbedingt Beratung." },
      { speaker: "Eddy (German (Germany))", text: "Ich bin da vorsichtiger. Auch ohne Beratung braucht man Personal. Wir sollten zuerst die Kosten und die Arbeitszeiten prüfen. Einen Versuch kann ich mir vorstellen, aber keine sofortige dauerhafte Öffnung." },
      { speaker: "Anna", text: "Da stimme ich zu. Man könnte drei Monate testen und danach die Besucherzahlen vergleichen. Wenn nur wenige kommen, müsste man die Zeiten ändern oder den Versuch beenden." },
    ],
    questions: [
      { prompt: "Wer braucht sonntags vor allem einen ruhigen Arbeitsplatz?", answer: "Frau Kern, die Sprecherin.", distractors: ["Der Moderator, der zuerst fragt.", "Beide lehnen einen Arbeitsplatz ab."], explanation: "Frau Kern arbeitet lange und braucht sonntags einen Arbeitsplatz, nicht unbedingt Beratung." },
      { prompt: "Was soll vor einer dauerhaften Öffnung geprüft werden?", answer: "Kosten, Personal und Ergebnisse einer Testphase.", distractors: ["Nur die Lieblingsbücher der Moderatorin.", "Ob eine Bibliothek überhaupt Bücher besitzt."], explanation: "Die Beteiligten fordern Prüfung und einen befristeten Versuch." },
    ] satisfies B1Question[],
  },
];

export const b1LanguageElements: B1Question[] = [
  { prompt: "Liebe Lea, ich kann morgen nicht kommen, ___ ich arbeiten muss.", answer: "weil", distractors: ["deshalb", "trotzdem"], explanation: "Ein Grund und Verb am Ende: weil." },
  { prompt: "Ich freue mich ___ unser Treffen nächste Woche.", answer: "auf", distractors: ["für", "mit"], explanation: "Sich freuen auf + Akkusativ beschreibt Vorfreude auf Zukünftiges." },
  { prompt: "Könntest du ___ bitte die Adresse schicken?", answer: "mir", distractors: ["mich", "mein"], explanation: "Schicken: jemandem (Dativ) etwas (Akkusativ) schicken." },
  { prompt: "Ich möchte einen Kurs besuchen, um besser Deutsch ___ sprechen.", answer: "zu", distractors: ["für", "bei"], explanation: "Zweck mit gleichem Subjekt: um … zu + Infinitiv." },
  { prompt: "Vielen Dank für Ihre schnelle ___.", answer: "Rückmeldung", distractors: ["Verpackung", "Verspätung"], explanation: "In einer Antwort auf eine Nachricht passt Dank für die Rückmeldung." },
  { prompt: "Wir sollten gemeinsam eine Entscheidung ___.", answer: "treffen", distractors: ["nehmen", "machen"], explanation: "Die feste Verbindung lautet eine Entscheidung treffen." },
];

export const b1ExamWriting = {
  personal: {
    prompt: "Sie haben am Samstag einen Ausflug mit Ihrem Kurs gemacht. Schreiben Sie einer Freundin, die nicht dabei war: Beschreiben Sie den Ausflug, erklären Sie, was Ihnen besonders gefallen hat, und schlagen Sie ein gemeinsames Treffen vor. Goethe-Aufgabe 1: etwa 80 Wörter; Übungszeit 20 Minuten.",
    model: "Hallo Mia, am Samstag haben wir mit unserem Kurs einen Ausflug nach Bremen gemacht. Zuerst besuchten wir die Altstadt und danach gingen wir zusammen ins Museum. Besonders gefallen hat mir die Führung, weil ich viel über das Leben früher erfahren habe. Obwohl es am Nachmittag regnete, hatten wir gute Laune und tranken noch etwas im Café. Schade, dass du nicht dabei warst! Wie wäre es, wenn wir nächsten Samstag gemeinsam die neue Ausstellung besuchen? Schreib mir bitte, ob du Zeit hast. Liebe Grüße, Ana",
  },
  opinion: {
    prompt: "Im Forum wird gefragt: Sollte man im Unterricht Smartphones benutzen dürfen? Schreiben Sie Ihre Meinung mit einem Grund, einem konkreten Beispiel und einer Einschränkung. Goethe-Aufgabe 2: etwa 80 Wörter; Übungszeit 25 Minuten.",
    model: "Meiner Meinung nach können Smartphones im Unterricht hilfreich sein, wenn wir klare Regeln vereinbaren. In meinem Deutschkurs haben wir zum Beispiel Fahrpläne gesucht und neue Wörter überprüft. Das war praktisch, weil die Aufgaben zu unserem Alltag passten. Allerdings lenken private Nachrichten schnell ab. Außerdem sind nicht alle Informationen im Internet richtig. Deshalb sollten wir die Mitteilungen ausschalten und Quellen vergleichen. Ich finde also, dass ein vollständiges Verbot nicht nötig ist. Die Lehrkraft sollte entscheiden, wann das Handy zur Aufgabe passt und wann wir es weglegen.",
  },
  formal: {
    prompt: "Sie können zum vereinbarten Beratungstermin am Freitag nicht kommen. Schreiben Sie Frau Keller: Entschuldigen Sie sich, nennen Sie einen Grund und bitten Sie um einen neuen Termin. Goethe-Aufgabe 3: etwa 40 Wörter; Übungszeit 15 Minuten.",
    model: "Sehr geehrte Frau Keller, leider kann ich am Freitag nicht zum Beratungstermin kommen, weil ich kurzfristig arbeiten muss. Dafür möchte ich mich entschuldigen. Könnten wir bitte einen neuen Termin nächste Woche vereinbaren? Vielen Dank für Ihre Hilfe. Mit freundlichen Grüßen, Ana López",
  },
  telc: {
    prompt: "Ihre Freundin Lea schreibt: Ich plane einen kleinen Lernnachmittag am Samstag. Wann kannst du kommen? Was möchtest du üben? Was kannst du mitbringen? Hast du eine Idee für eine Pause? Antworten Sie auf alle vier Punkte. Wählen Sie eine passende Reihenfolge, Anrede und Schluss. Übungsziel 100–130 Wörter; 30 Minuten. Diese Wortspanne ist ein Kursziel, keine zusätzliche offizielle telc-Regel.",
    model: "Liebe Lea, vielen Dank für deine Einladung. Ich komme am Samstag gern zu deinem Lernnachmittag. Vormittags muss ich arbeiten, deshalb könnte ich gegen vierzehn Uhr bei dir sein. Besonders möchte ich das gemeinsame Planen üben, weil ich beim spontanen Antworten noch unsicher bin. Wir könnten uns gegenseitig Vorschläge machen und dann zusammen eine Lösung finden. Ich bringe meine Notizen und ein paar kleine Aufgaben mit. Außerdem kann ich Obst und Wasser besorgen. Für die Pause würde ich einen kurzen Spaziergang im Park vorschlagen, wenn das Wetter gut ist. Bei Regen könnten wir zusammen etwas trinken und über unsere Woche sprechen. Passt dir dieser Plan? Ich freue mich auf unser Treffen. Liebe Grüße, Ana",
  },
};

import type { LessonBlock } from "./tutor-academy.ts";

type Task = { text: string; prompt: string; options: string[]; correct: number; explanation: string };
export const germanA1FullMockListening: Task[] = [
  { text: "Anna: Wann beginnt der Film? Um sieben?\nEddy: Nein, heute um halb acht. Wir treffen uns um sieben vor dem Kino.", prompt: "Wann beginnt der Film?", options: ["19:00 Uhr", "19:30 Uhr", "20:30 Uhr"], correct: 1, explanation: "Halb acht bedeutet 19:30 Uhr. Sie treffen sich früher." },
  { text: "Eddy: Haben Sie noch Brot?\nAnna: Ja. Das Brot kostet zwei Euro. Drei Brötchen kosten einen Euro fünfzig.", prompt: "Wie viel kostet das Brot?", options: ["2 Euro", "1,50 Euro", "3 Euro"], correct: 0, explanation: "Das Brot kostet zwei Euro; die andere Angabe gilt für Brötchen." },
  { text: "Anna: Kommst du mit dem Auto zum Kurs?\nEddy: Nein. Mein Auto ist kaputt. Heute nehme ich den Bus, nicht das Fahrrad.", prompt: "Wie kommt Eddy heute zum Kurs?", options: ["Mit dem Auto", "Mit dem Fahrrad", "Mit dem Bus"], correct: 2, explanation: "Er sagt: Heute nehme ich den Bus." },
  { text: "Eddy: Wo ist mein Ausweis? In der Tasche?\nAnna: Nein, er liegt auf dem Tisch neben deinem Telefon.", prompt: "Wo liegt der Ausweis?", options: ["Auf dem Tisch", "In der Tasche", "Unter dem Stuhl"], correct: 0, explanation: "Anna nennt den Tisch als Ort." },
  { text: "Anna: Hast du am Samstag Zeit?\nEddy: Am Samstag arbeite ich. Aber am Sonntag kann ich. Treffen wir uns um zehn?\nAnna: Ja, am Sonntag um zehn.", prompt: "An welchem Tag treffen sie sich?", options: ["Freitag", "Samstag", "Sonntag"], correct: 2, explanation: "Beide bestätigen Sonntag um zehn Uhr." },
  { text: "Eddy: Möchten Sie die rote Jacke in Größe M?\nAnna: Lieber die blaue. Haben Sie die in L?\nEddy: Ja, hier bitte.", prompt: "Welche Jacke möchte Anna?", options: ["Rot in M", "Blau in L", "Blau in M"], correct: 1, explanation: "Anna bittet um die blaue Jacke in L." },
  { text: "Ansage eins: Liebe Fahrgäste, der Zug nach Bonn fährt heute von Gleis sechs ab. Gleis drei ist geschlossen. Bitte gehen Sie zu Gleis sechs.", prompt: "Der Zug nach Bonn fährt heute von Gleis drei ab.", options: ["Richtig", "Falsch"], correct: 1, explanation: "Heute fährt der Zug von Gleis sechs, nicht drei." },
  { text: "Telefonnotiz: Guten Tag. Unsere Bibliothek ist heute bis achtzehn Uhr geöffnet. Die Anmeldung ist nur bis siebzehn Uhr möglich. Vielen Dank.", prompt: "Um 17:30 Uhr kann man sich noch anmelden.", options: ["Richtig", "Falsch"], correct: 1, explanation: "Die Anmeldung endet um siebzehn Uhr, früher als die Öffnungszeit." },
  { text: "Ansage eins: Liebe Gäste, das Frühstück gibt es heute im kleinen Saal neben dem Eingang. Bitte gehen Sie nicht in das Restaurant im ersten Stock.", prompt: "Das Frühstück ist heute neben dem Eingang.", options: ["Richtig", "Falsch"], correct: 0, explanation: "Die Ansage nennt den kleinen Saal neben dem Eingang." },
  { text: "Telefonnotiz: Liebe Kursteilnehmer, Frau Weber ist heute krank. Ihr Kurs beginnt trotzdem um neun Uhr. Herr Brandt unterrichtet heute in Raum zwölf.", prompt: "Der Kurs beginnt heute um neun Uhr.", options: ["Richtig", "Falsch"], correct: 0, explanation: "Der Kurs beginnt trotz des Lehrerwechsels um neun." },
  { text: "Telefonnotiz: Hallo Nora, hier ist Anna. Ich bin im Supermarkt. Wir haben noch Brot und Milch, aber keinen Kaffee. Kannst du bitte Kaffee kaufen? Bis später.", prompt: "Was soll Nora kaufen?", options: ["Milch", "Kaffee", "Brot"], correct: 1, explanation: "Anna bittet um Kaffee; Brot und Milch sind schon da." },
  { text: "Gespräch: Guten Tag Frau Weber. Ihr Termin morgen ist nicht um zehn, sondern um elf Uhr. Bitte bringen Sie Ihren Ausweis mit. Rufen Sie mich bei Fragen an.", prompt: "Wann ist der Termin morgen?", options: ["10:00 Uhr", "12:00 Uhr", "11:00 Uhr"], correct: 2, explanation: "Die Nachricht ändert den Termin auf elf Uhr." },
  { text: "Telefonnotiz: Hallo Luis, ich warte vor der Post. Am Bahnhof sind sehr viele Menschen. Komm bitte direkt zur Post. Ich habe eine blaue Jacke an.", prompt: "Wo wartet die Person?", options: ["Vor der Post", "Im Bahnhof", "Im Café"], correct: 0, explanation: "Die Person wartet vor der Post." },
  { text: "Gespräch: Hallo Nora, hier ist Eddy. Ich kann heute nicht zum Fußball kommen. Mein Kind ist krank. Ich bin nächste Woche wieder dabei. Viel Spaß heute!", prompt: "Warum kommt Eddy heute nicht?", options: ["Er arbeitet", "Er ist selbst krank", "Sein Kind ist krank"], correct: 2, explanation: "Eddy nennt die Krankheit seines Kindes als Grund." },
  { text: "Telefonnotiz: Guten Tag. Ihr bestellter Tisch ist da. Sie können ihn am Freitag zwischen vierzehn und achtzehn Uhr abholen. Am Samstag ist unser Geschäft geschlossen.", prompt: "Wann kann man den Tisch abholen?", options: ["Samstagvormittag", "Freitagnachmittag", "Freitagmorgen"], correct: 1, explanation: "Freitag von 14 bis 18 Uhr ist am Nachmittag." },
];
const message = "Hallo Luis, ich komme am Freitag um 17 Uhr nach Bonn. Treffen wir uns vor der Post? Am Samstag besuche ich meine Schwester. Am Sonntag fahre ich um 10 Uhr nach Hause. Liebe Grüße, Nora";
const email = "Guten Tag Frau Weber, unser Abendkurs beginnt am Dienstag um 18 Uhr in Raum 8. Bitte bringen Sie ein Heft und einen Stift mit. Das Kursbuch bekommen Sie bei uns. Freundliche Grüße, Ihre Sprachschule";
export const germanA1FullMockReading: Task[] = [
  { text: message, prompt: "Nora kommt am Freitag nach Bonn.", options: ["Richtig", "Falsch"], correct: 0, explanation: "Sie nennt Freitag als Anreisetag." },
  { text: message, prompt: "Luis soll Nora vor dem Bahnhof treffen.", options: ["Richtig", "Falsch"], correct: 1, explanation: "Der Treffpunkt ist vor der Post." },
  { text: message, prompt: "Nora fährt am Sonntagmorgen nach Hause.", options: ["Richtig", "Falsch"], correct: 0, explanation: "Zehn Uhr am Sonntag ist am Morgen." },
  { text: email, prompt: "Der Kurs ist am Dienstagabend.", options: ["Richtig", "Falsch"], correct: 0, explanation: "Dienstag um 18 Uhr ist am Abend." },
  { text: email, prompt: "Frau Weber muss das Kursbuch mitbringen.", options: ["Richtig", "Falsch"], correct: 1, explanation: "Das Kursbuch bekommt sie in der Sprachschule." },
  { text: "Anzeige A: Fahrradservice Nord. Reparaturen Montag bis Freitag, 9–18 Uhr.\nAnzeige B: Rad am Park. Neue Fahrräder und Helme. Keine Reparaturen.", prompt: "Ihr Fahrrad ist kaputt. Welche Anzeige passt?", options: ["Anzeige A", "Anzeige B"], correct: 0, explanation: "A bietet Reparaturen an." },
  { text: "Anzeige A: Deutsch am Vormittag. Dienstag und Donnerstag, 9–11 Uhr.\nAnzeige B: Deutsch am Abend. Montag und Mittwoch, 18–20 Uhr.", prompt: "Sie arbeiten jeden Vormittag. Welcher Kurs passt?", options: ["Anzeige A", "Anzeige B"], correct: 1, explanation: "B findet am Abend statt." },
  { text: "Anzeige A: Zimmer für eine Person, 450 Euro, Küche gemeinsam, ab sofort.\nAnzeige B: Große Wohnung für eine Familie, vier Zimmer, 1.200 Euro.", prompt: "Sie suchen allein ein Zimmer für höchstens 500 Euro. Was passt?", options: ["Anzeige A", "Anzeige B"], correct: 0, explanation: "A ist für eine Person und kostet unter 500 Euro." },
  { text: "Anzeige A: Café Morgen. Frühstück täglich von 7 bis 11 Uhr.\nAnzeige B: Restaurant Abendrot. Warme Küche täglich von 17 bis 22 Uhr.", prompt: "Sie möchten um 8 Uhr frühstücken. Wohin gehen Sie?", options: ["Anzeige A", "Anzeige B"], correct: 0, explanation: "Café Morgen bietet um acht Frühstück an." },
  { text: "Anzeige A: Sportgruppe für Erwachsene. Training Mittwoch, 19 Uhr.\nAnzeige B: Schwimmen für Kinder von 6 bis 10 Jahren. Samstag, 10 Uhr.", prompt: "Ihr achtjähriges Kind möchte schwimmen lernen. Was passt?", options: ["Anzeige A", "Anzeige B"], correct: 1, explanation: "B bietet Schwimmen für das passende Alter an." },
  { text: "BIBLIOTHEK · Rückgabe von Büchern am Automaten auch außerhalb der Öffnungszeiten möglich.", prompt: "Die Bibliothek ist geschlossen. Sie können trotzdem Bücher zurückgeben.", options: ["Richtig", "Falsch"], correct: 0, explanation: "Der Automat funktioniert auch außerhalb der Öffnungszeiten." },
  { text: "CAFÉ · Zahlung heute nur bar. Unser Kartenlesegerät funktioniert nicht.", prompt: "Sie können heute im Café mit Karte bezahlen.", options: ["Richtig", "Falsch"], correct: 1, explanation: "Nur Barzahlung ist heute möglich." },
  { text: "PRAXIS · Bitte rufen Sie vor Ihrem Besuch an. Termine nur nach telefonischer Anmeldung.", prompt: "Sie sollen vor dem Besuch in der Praxis anrufen.", options: ["Richtig", "Falsch"], correct: 0, explanation: "Das Schild verlangt telefonische Anmeldung." },
  { text: "SCHUHGESCHÄFT · Umtausch innerhalb von 14 Tagen nur mit Kassenbon.", prompt: "Sie haben keinen Kassenbon. Ein Umtausch ist laut Schild möglich.", options: ["Richtig", "Falsch"], correct: 1, explanation: "Ein Kassenbon ist für den Umtausch nötig." },
  { text: "PARK · Fahrräder bitte am Eingang abstellen. Radfahren im Park verboten.", prompt: "Sie dürfen mit dem Fahrrad durch den Park fahren.", options: ["Richtig", "Falsch"], correct: 1, explanation: "Radfahren im Park ist verboten." },
];

export const germanA1FullMockAudioManifest = germanA1FullMockListening.map((task, index) => ({
  lessonId: "a1-goethe-full-mock", slug: `a1-goethe-full-h${index + 1}`,
  outputPath: `/audio/german-a1/a1-goethe-full-h${String(index + 1).padStart(2, "0")}.m4a`, transcript: task.text,
}));

export function germanA1FullMockBlocks(): LessonBlock[] {
  const blocks: LessonBlock[] = [{ id: "a1-goethe-full-intro", type: "callout", heading: "Vollständige Originalsimulation · kein offizieller Prüfungssatz", tone: "amber",
    body: "Diese unabhängig erstellte Simulation enthält 15 Hör- und 15 Leseaufgaben sowie Schreiben und Sprechen. Messen Sie selbst: Hören etwa 20 Minuten, Lesen 25 Minuten, Schreiben 20 Minuten; Sprechen etwa 15 Minuten mit einer Gruppe. Keine Wörterbücher. Erst am Ende Antworten prüfen. Spieler und Modelle bleiben zugänglich: Dies ist Übung, keine beaufsichtigte Prüfung und keine Zertifizierung." }];
  const check = (task: Task, id: string, heading: string): LessonBlock => ({ id, type: "knowledge-check", heading, required: false, completion: "pass",
    question: { id: `${id}-question`, prompt: task.prompt, options: task.options.map((label, index) => ({ id: String(index), label })), correctOptionId: String(task.correct), explanation: task.explanation } });
  for (const [index, task] of germanA1FullMockListening.entries()) {
    const part = index < 6 ? 1 : index < 10 ? 2 : 3;
    if ([0, 6, 10].includes(index)) blocks.push({ id: `a1-goethe-full-hoeren-teil-${part}`, type: "divider", label: `Hören · Teil ${part} · ${part === 2 ? "einmal hören" : "zweimal hören"}` });
    blocks.push({ id: `a1-goethe-full-audio-${index + 1}`, type: "audio", heading: `Hören · Aufgabe ${index + 1}`,
      url: germanA1FullMockAudioManifest[index].outputPath, transcript: task.text,
      caption: `${part === 2 ? "Hören Sie einmal." : "Hören Sie zweimal."} Die Wiederholungen steuern Sie selbst. Transcript erst zur Auswertung öffnen. Originalaufnahme mit KI-generierten Stimmen.` },
      check(task, `a1-goethe-full-h${index + 1}`, `Antwort · Hören ${index + 1}`));
  }
  for (const [index, task] of germanA1FullMockReading.entries()) {
    const part = Math.floor(index / 5) + 1;
    if (index % 5 === 0) blocks.push({ id: `a1-goethe-full-lesen-teil-${part}`, type: "divider", label: `Lesen · Teil ${part}` });
    blocks.push({ id: `a1-goethe-full-text-${index + 1}`, type: "text", heading: `Lesen · Aufgabe ${index + 1}`, paragraphs: [task.text] },
      check(task, `a1-goethe-full-l${index + 1}`, `Antwort · Lesen ${index + 1}`));
  }
  blocks.push(
    { id: "a1-goethe-full-writing-1", type: "writing-practice", heading: "Schreiben · Teil 1: Angaben übertragen", completion: "view", minWords: 10, maxWords: 55,
      prompt: "Luis Pereira möchte sich anmelden. Er ist am 12. März 1992 geboren, wohnt in der Gartenstraße 7 in 53111 Bonn und spricht Portugiesisch. Er wählt den Abendkurs. Übertragen Sie die Informationen als fünf beschriftete Formularzeilen: Geburtsdatum; Straße und Hausnummer; Postleitzahl und Ort; Muttersprache; Kurszeit. Dies ist eine textbasierte Formularübung, kein Formular mit einzelnen Eingabefeldern.",
      modelAnswer: "Geburtsdatum: 12.03.1992\nStraße und Hausnummer: Gartenstraße 7\nPostleitzahl und Ort: 53111 Bonn\nMuttersprache: Portugiesisch\nKurszeit: Abendkurs",
      checklist: ["Alle fünf Felder enthalten die Angaben von Luis, nicht meine eigenen.", "Namen und Zahlen wurden richtig übertragen.", "Jedes richtig übertragene Feld zählt in meiner Selbstkontrolle einmal."] },
    { id: "a1-goethe-full-writing-2", type: "writing-practice", heading: "Schreiben · Teil 2: eine kurze Nachricht", completion: "view", minWords: 25, maxWords: 45,
      prompt: "Schreiben Sie Nora eine Nachricht von ungefähr 30 Wörtern: Sie können am Samstag nicht kommen; nennen Sie einen Grund; schlagen Sie Sonntag um 15 Uhr im Park vor. Schreiben Sie eine passende Anrede und einen Gruß. Versuchen Sie zuerst ohne Modell zu schreiben.",
      modelAnswer: "Hallo Nora, ich kann am Samstag leider nicht kommen. Ich muss arbeiten. Hast du am Sonntag um 15 Uhr Zeit? Treffen wir uns im Park? Liebe Grüße, Luis",
      checklist: ["Ich sage klar, dass ich Samstag nicht komme.", "Ich nenne einen Grund.", "Ich schlage Sonntag, 15 Uhr und den Park vor.", "Anrede und Gruß passen; verständliche Kommunikation zählt mehr als perfekte Grammatik."] },
    { id: "a1-goethe-full-speaking-1", type: "speaking-practice", heading: "Sprechen · Teil 1: vorstellen und reagieren", completion: "view", preparationSeconds: 0, targetSeconds: 60,
      prompt: "Stellen Sie sich mit Name, Alter, Herkunft, Wohnort, Sprachen, Beruf und Hobby vor. Eine Partnerperson fragt anschließend nach der Schreibweise Ihres Namens und einer erfundenen Telefonnummer. Antworten Sie. Eine Soloaufnahme übt Ihre Sprache, ersetzt aber keine Gruppenprüfung.",
      modelAnswer: "Guten Tag, ich heiße Luis Pereira. Ich bin 34 Jahre alt. Ich komme aus Portugal und wohne in Bonn. Ich spreche Portugiesisch und Deutsch. Ich arbeite in einem Café und spiele gern Fußball. Luis schreibt man L-U-I-S. Meine Telefonnummer ist null eins sieben sechs, zwei drei vier, fünf sechs sieben acht.",
      checklist: ["Die persönlichen Angaben sind verständlich.", "Ich reagiere auf zwei Rückfragen.", "Ich buchstabiere und spreche die Ziffern deutlich."] },
    { id: "a1-goethe-full-speaking-2", type: "speaking-practice", heading: "Sprechen · Teil 2: Fragen stellen und beantworten", completion: "view", preparationSeconds: 0, targetSeconds: 90,
      prompt: "Üben Sie zu zweit, mit Rollenwechsel. Runde 1, Thema Essen: Wortkarten Frühstück und Getränk. Runde 2, Thema Freizeit: Wortkarten Wochenende und Sport. Jede Person stellt pro Runde eine passende Frage zu einer Karte und antwortet auf die Frage der anderen Person. Erfinden Sie eigene Antworten.",
      modelAnswer: "Was essen Sie zum Frühstück? Ich esse Brot. Was trinken Sie gern? Ich trinke gern Tee. Was machen Sie am Wochenende? Ich gehe spazieren. Machen Sie gern Sport? Ja, ich spiele Fußball.",
      checklist: ["Ich stelle in beiden Runden eine passende Frage.", "Ich beantworte die Fragen der anderen Person.", "Ich lese nicht nur einen vorbereiteten Monolog vor."] },
    { id: "a1-goethe-full-picture-cards", type: "gallery", heading: "Eigene Bildkarten · Bitten formulieren", columns: 3, items: [
      { id: "a1-goethe-full-picture-water", src: "/images/academy/german-a1/word-cards/chapter-14-12.jpg", alt: "Wasser: Formulieren Sie eine Bitte um ein Getränk.", caption: "Wasser" },
      { id: "a1-goethe-full-picture-window", src: "/images/academy/german-a1/word-cards/chapter-06-09.jpg", alt: "Fenster: Bitten Sie eine Person, es zu öffnen oder zu schließen.", caption: "Fenster" },
      { id: "a1-goethe-full-picture-bag", src: "/images/academy/german-a1/word-cards/chapter-06-14.jpg", alt: "Tasche: Bitten Sie um Hilfe beim Tragen.", caption: "Tasche" },
    ] },
    { id: "a1-goethe-full-speaking-3", type: "speaking-practice", heading: "Sprechen · Teil 3: bitten und reagieren", completion: "view", preparationSeconds: 0, targetSeconds: 90,
      prompt: "Nutzen Sie die drei eigenen Bildkarten oben: Wasser, Fenster und Tasche. Jede Person wählt zwei Karten, formuliert dazu zwei Bitten und reagiert auf zwei Bitten der anderen Person. Karten dürfen mehrfach verwendet werden. Diese Lernkarten sind keine offiziellen Prüfungskarten.",
      modelAnswer: "Kann ich bitte ein Glas Wasser haben? Natürlich, hier bitte. Können Sie bitte das Fenster schließen? Ja, einen Moment. Können Sie mir bitte mit der Tasche helfen? Ja, gern.",
      checklist: ["Ich formuliere zwei konkrete Bitten.", "Ich reagiere verständlich auf zwei Bitten.", "Meine Sprache ist höflich."] },
    { id: "a1-goethe-full-writing-feedback", type: "accordion", heading: "Schreiben auswerten · Inhalt vor Perfektion", items: [
      { title: "Noch nicht vollständig", body: "„Hallo Nora, ich kann Samstag nicht kommen. Grüße, Luis.“ Die Absage ist klar. Es fehlen aber der Grund und der neue Vorschlag. Ergänzen Sie diese Angaben, statt nur die Grammatik zu korrigieren." },
      { title: "Verständlich, noch verbessern", body: "„Hallo Nora, Samstag ich kann nicht kommen. Ich muss arbeiten. Sonntag um 15 Uhr im Park? Grüße, Luis.“ Die drei Punkte sind verständlich. Verbessern Sie den Satzbau: Am Samstag kann ich nicht kommen. Ein kleiner Fehler bedeutet nicht automatisch, dass die Kommunikation scheitert." },
      { title: "Gut für diese Lernaufgabe", body: "Die Modellantwort nennt die Absage, den Grund und den vollständigen neuen Vorschlag mit Anrede und Gruß. Ihre eigene Antwort darf anders formuliert sein. Dies sind Lernbeispiele, keine offiziellen Bewertungsstufen oder vergebenen Prüfungspunkte." },
    ] },
    { id: "a1-goethe-full-review", type: "text", heading: "Auswerten · Lernstand, keine Zertifizierung", paragraphs: ["Prüfen Sie erst nach Ihrem Durchgang alle 30 Hör- und Leseantworten. Notieren Sie richtig beantwortete Aufgaben getrennt: Hören /15 und Lesen /15. Das ist ein Übungsergebnis, keine offizielle Goethe-Punktzahl oder Bestehensprognose.", "Schreiben und Sprechen prüfen Sie anhand der Checklisten, möglichst mit einer Lehrperson. Sie werden nicht automatisch benotet. Eine fehlende Information ist wichtiger als ein kleiner Fehler, der die Aussage nicht verändert. Wählen Sie anschließend drei konkrete Lernziele."] },
  );
  return blocks;
}

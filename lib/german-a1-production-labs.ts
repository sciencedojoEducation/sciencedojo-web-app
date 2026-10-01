import type { AcademyLesson, LessonBlock } from "./tutor-academy.ts";

type Lab = { focus: string; example: string; task: string; answer: string; check: string; question: string; response: string; transfer: string };

/** Independently authored A1 drills; no textbook exercises or illustrations are reproduced. */
export const germanA1ProductionLabs: Record<number, Lab> = {
  1: { focus: "Kontaktdaten bestätigen", example: "Name: Mila → M-I-L-A. Ist das richtig? – Ja, richtig.",
    task: "Schreiben Sie für die Anmeldung: Name Nora als einzelne Buchstaben, Telefonnummer 0176 234 56 89 und eine Frage zur Bestätigung. Ergänzen Sie eine höfliche Bitte: bitte / langsam / sprechen / Sie. Verwenden Sie später nur erfundene Kontaktdaten.",
    answer: "N-O-R-A. Meine Telefonnummer ist 0176 234 56 89. Ist das richtig? Sprechen Sie bitte langsam.", check: "Buchstaben und Ziffern bleiben in der richtigen Reihenfolge.",
    question: "Wie schreiben Sie Ihren Namen?", response: "N-O-R-A. Können Sie den Namen bitte wiederholen?", transfer: "Buchstabieren Sie einen anderen erfundenen Namen und bestätigen Sie eine Zahl." },
  2: { focus: "Fragen und Antworten verbinden", example: "Woher kommen Sie? – Ich komme aus Portugal. Und Sie?",
    task: "Ohne Nachsehen: Schreiben Sie drei Fragen zu Name, Herkunft und Wohnort. Antworten Sie als Luis aus Portugal, wohnhaft in Bremen. Benutzen Sie durchgehend Sie.",
    answer: "Wie heißen Sie? Ich heiße Luis. Woher kommen Sie? Ich komme aus Portugal. Wo wohnen Sie? Ich wohne in Bremen.", check: "Jede Frage hat eine passende Antwort; Sie und das Verb passen zusammen.",
    question: "Welche Sprachen sprechen Sie?", response: "Ich spreche Portugiesisch und ein bisschen Deutsch. Und Sie?", transfer: "Antworten Sie mit eigenen oder erfundenen Angaben und stellen Sie eine Rückfrage." },
  3: { focus: "Eine Person oder mehrere Personen", example: "Das ist mein Bruder. Er wohnt in Bonn. Das sind meine Eltern. Sie wohnen in Köln.",
    task: "Ergänzen Sie ist oder sind und schreiben Sie ganze Sätze: Das ___ meine Schwester. Das ___ meine Eltern. Meine Schwester ___ 22 Jahre alt. Ordnen Sie anschließend: in Bonn / sie / wohnt. Schreiben Sie zuletzt zwei Sätze über eine erfundene Person.",
    answer: "Das ist meine Schwester. Das sind meine Eltern. Meine Schwester ist 22 Jahre alt. Sie wohnt in Bonn. Das ist mein Bruder. Er wohnt in Köln.", check: "ist passt zu einer Person, sind zu mehreren; nach sie steht wohnt für die Schwester.",
    question: "Haben Sie Geschwister?", response: "Ja, ich habe eine Schwester. Sie heißt Nora. Haben Sie auch Geschwister?", transfer: "Stellen Sie eine Person vor und fragen Sie nach einer anderen Person." },
  4: { focus: "Zeit und Satzklammer", example: "Ich stehe um sieben Uhr auf. Am Montag beginnt mein Kurs um neun Uhr.",
    task: "Ordnen Sie: 1. auf / ich / um sechs Uhr / stehe. 2. beginnt / am Dienstag / der Kurs / um neun Uhr. Ergänzen Sie am, um oder im: ___ Freitag; ___ 18 Uhr; ___ Mai. Schreiben Sie dann einen Satz zu Ihrem Morgen.",
    answer: "Ich stehe um sechs Uhr auf. Am Dienstag beginnt der Kurs um neun Uhr. Am Freitag. Um 18 Uhr. Im Mai. Ich frühstücke um sieben Uhr.", check: "Bei aufstehen steht auf am Satzende; am nennt den Tag, um die Uhrzeit und im den Monat.",
    question: "Wann beginnt Ihr Kurs?", response: "Am Dienstag um neun Uhr. Wann haben Sie Zeit?", transfer: "Verabreden Sie einen Tag und eine Uhrzeit; bestätigen Sie beides." },
  5: { focus: "Wohnung beschreiben und nachfragen", example: "Das Zimmer hat einen Tisch. Es gibt kein Sofa. Die Lampe steht auf dem Tisch.",
    task: "Ordnen Sie: 1. ein Bett / es / gibt. 2. auf dem Tisch / steht / die Lampe. Verbessern Sie: Das Zimmer sind hell. Schreiben Sie eine Frage zur Miete und einen eigenen Satz über ein Zimmer.",
    answer: "Es gibt ein Bett. Die Lampe steht auf dem Tisch. Das Zimmer ist hell. Wie viel kostet das Zimmer im Monat? Mein Zimmer hat einen Schrank.", check: "Es gibt und steht beschreiben verschiedene Dinge; das Zimmer ist eine Einzahl.",
    question: "Was gibt es in Ihrem Zimmer?", response: "Es gibt ein Bett und einen Tisch. Wie groß ist das Zimmer?", transfer: "Beschreiben Sie zwei Möbel und fragen Sie nach der Miete." },
  6: { focus: "Eine Bestellung aufbauen", example: "Ich möchte einen Tee und ein Brot. Was kostet das zusammen?",
    task: "Ergänzen Sie einen, eine oder ein: Ich möchte ___ Kaffee, ___ Suppe und ___ Wasser. Schreiben Sie daraus eine Bestellung mit bitte. Fragen Sie anschließend nach dem Gesamtpreis und der Kartenzahlung.",
    answer: "Ich möchte einen Kaffee, eine Suppe und ein Wasser, bitte. Was kostet das zusammen? Kann ich mit Karte bezahlen?", check: "der Kaffee → einen Kaffee; die Suppe → eine Suppe; das Wasser → ein Wasser.",
    question: "Was möchten Sie trinken?", response: "Ein Wasser, bitte. Haben Sie auch Apfelsaft?", transfer: "Bestellen Sie ein anderes Getränk und etwas zu essen; fragen Sie nach dem Preis." },
  7: { focus: "Im Geschäft eine Entscheidung treffen", example: "Haben Sie diese Jacke in Größe M? Kann ich sie anprobieren?",
    task: "Ordnen Sie: 1. kostet / wie viel / die Jacke? 2. in Größe L / diese Jacke / haben Sie? Verbessern Sie: Die Jacke kosten 39 Euro. Ergänzen Sie eine höfliche Bitte zum Anprobieren und nennen Sie eine Farbe.",
    answer: "Wie viel kostet die Jacke? Haben Sie diese Jacke in Größe L? Die Jacke kostet 39 Euro. Kann ich sie bitte anprobieren? Ich möchte die blaue Jacke.", check: "Die Jacke kostet; Größe und Farbe helfen der Verkäuferin oder dem Verkäufer.",
    question: "Welche Größe brauchen Sie?", response: "Größe L, bitte. Gibt es die Jacke auch in Blau?", transfer: "Fragen Sie nach Größe und Farbe; entscheiden Sie: Ich nehme sie oder Danke, sie passt nicht." },
  8: { focus: "Eine Wegbeschreibung klären", example: "Gehen Sie geradeaus und dann links. – Also zuerst geradeaus, dann links, richtig?",
    task: "Ordnen Sie: 1. die Post / wo / ist? 2. bitte / langsam / sprechen / Sie. Schreiben Sie als ganze Sätze: geradeaus gehen; dann rechts gehen. Bestätigen Sie anschließend den Weg in einer Rückfrage.",
    answer: "Wo ist die Post? Sprechen Sie bitte langsam. Gehen Sie geradeaus. Gehen Sie dann rechts. Also geradeaus und dann rechts, richtig?", check: "Die Reihenfolge bleibt erhalten; die Bitte verwendet die höfliche Form Sie.",
    question: "Suchen Sie die Bibliothek?", response: "Ja. Ist sie hier in der Nähe? Können Sie den Weg bitte wiederholen?", transfer: "Fragen Sie nach einem anderen Ort und wiederholen Sie die Antwort mit eigenen Worten." },
  9: { focus: "Reiseinformationen in eine Nachricht übertragen", example: "Abfahrt: 14:20; Verspätung: 15 Minuten → Der Zug fährt heute um 14:35 Uhr ab.",
    task: "Ihr Zug fährt normalerweise um 10:10 Uhr ab und hat 20 Minuten Verspätung. Schreiben Sie die neue Abfahrtszeit. Ordnen Sie: von Gleis vier / fährt / der Zug / ab. Schreiben Sie dann eine kurze Nachricht: Zug verspätet, neue Abfahrt, Treffpunkt Bahnhof.",
    answer: "Die neue Abfahrt ist um 10:30 Uhr. Der Zug fährt von Gleis vier ab. Hallo Nora, mein Zug hat Verspätung. Er fährt um 10:30 Uhr ab. Treffen wir uns vor dem Bahnhof?", check: "Ich rechne die Verspätung zur Abfahrt, nicht zu einer unbekannten Ankunftszeit.",
    question: "Wann fährt Ihr Zug ab?", response: "Heute um 10:30 Uhr von Gleis vier. Muss ich umsteigen?", transfer: "Fragen Sie nach Gleis und Abfahrt; informieren Sie eine Person über eine Änderung." },
  10: { focus: "Möglichkeiten mit können ausdrücken", example: "Ich kann am Dienstag kommen. Am Donnerstag kann ich nicht kommen.",
    task: "Ordnen Sie: 1. am Dienstag / ich / kommen / kann. 2. ich / kann / nicht / am Freitag / arbeiten. Ergänzen Sie: Ich arbeite ___ einem Café. Schreiben Sie dann eine Kursanfrage mit Lernziel und einer Frage nach einem freien Platz.",
    answer: "Ich kann am Dienstag kommen. Ich kann am Freitag nicht arbeiten. Ich arbeite in einem Café. Guten Tag, ich möchte besser Deutsch sprechen. Gibt es noch einen Platz im Kurs?", check: "kann steht bei ich; kommen und arbeiten stehen am Satzende.",
    question: "Wann können Sie zum Kurs kommen?", response: "Am Dienstagabend. Gibt es noch einen freien Platz?", transfer: "Nennen Sie zwei mögliche Termine und eine Zeit, die nicht passt." },
  11: { focus: "Einladen, zusagen und absagen", example: "Hast du am Samstag Zeit? – Ja, gern. Wann treffen wir uns?",
    task: "Verbinden Sie zu einem Gespräch: A lädt für Samstag um 15 Uhr in den Park ein. B sagt zu und fragt nach dem Treffpunkt. A nennt den Eingang. Schreiben Sie danach eine höfliche Absage: keine Zeit, Sonntag als anderer Vorschlag.",
    answer: "Hast du am Samstag um 15 Uhr Zeit? Ja, gern. Wo treffen wir uns? Am Eingang zum Park. Am Samstag habe ich leider keine Zeit. Hast du am Sonntag Zeit?", check: "Eine Zusage oder Absage ist klar; Zeit und Ort werden geklärt.",
    question: "Kommst du am Samstag mit in den Park?", response: "Ja, gern. Um wie viel Uhr treffen wir uns?", transfer: "Laden Sie zu einem Hobby ein, antworten Sie und vereinbaren Sie Zeit und Ort." },
  12: { focus: "Beschwerden nennen und einen Termin erfragen", example: "Ich habe Kopfschmerzen. Haben Sie heute einen Termin für mich?",
    task: "Verbessern Sie: Ich hat Fieber. Ordnen Sie: heute / einen Termin / haben Sie / für mich? Schreiben Sie eine Kursabsage mit drei Punkten: krank, heute nicht kommen, Frage nach den Hausaufgaben. Verwenden Sie erfundene Angaben.",
    answer: "Ich habe Fieber. Haben Sie heute einen Termin für mich? Guten Tag Frau Weber, ich bin krank und kann heute nicht zum Kurs kommen. Welche Hausaufgaben soll ich machen? Viele Grüße, Nora", check: "Ich habe nennt eine Beschwerde; die Kursnachricht nennt Grund und Tag und stellt eine Frage.",
    question: "Was fehlt Ihnen?", response: "Ich habe Kopfschmerzen. Kann ich heute einen Termin bekommen?", transfer: "Üben Sie ein einfaches Termingespräch. Diese Sprachübung ist keine medizinische Beratung." },
  13: { focus: "Wetter und Plan verbinden", example: "Am Samstag ist es sonnig. Wir können im Park spazieren gehen.",
    task: "Ordnen Sie: 1. regnet / am Sonntag / es. 2. ins Café / wir / gehen / können. Schreiben Sie einen Plan für einen sonnigen Samstag und eine Alternative bei Regen. Nennen Sie eine Uhrzeit und stellen Sie eine Frage.",
    answer: "Am Sonntag regnet es. Wir können ins Café gehen. Am Samstag ist es sonnig. Treffen wir uns um zehn Uhr im Park? Bei Regen können wir ins Café gehen. Hast du Zeit?", check: "Es regnet ist ein ganzer Satz; nach können steht der Infinitiv am Ende.",
    question: "Was machen wir bei Regen?", response: "Wir können ins Café gehen. Passt dir zehn Uhr?", transfer: "Schlagen Sie eine Aktivität für gutes Wetter und einen Ersatzplan vor." },
  14: { focus: "Eine Terminänderung beantworten", example: "Neuer Termin: Mittwoch, 11 Uhr → Vielen Dank. Mittwoch um elf Uhr passt gut.",
    task: "Lesen Sie: Ihr Termin ist jetzt am Donnerstag um 14 Uhr. Bitte bringen Sie Ihren Ausweis mit. Schreiben Sie eine Antwort mit Begrüßung, Name, Bestätigung von Tag und Uhrzeit sowie einer Frage nach der Adresse. Ordnen Sie vorher: am Donnerstag / ich / kommen / kann.",
    answer: "Ich kann am Donnerstag kommen. Guten Tag, mein Name ist Nora Weber. Vielen Dank. Donnerstag um 14 Uhr passt gut. Ich bringe meinen Ausweis mit. Wie ist die Adresse? Freundliche Grüße, Nora Weber", check: "Meine Antwort bestätigt den neuen Termin, nicht den alten; die Frage ist eindeutig.",
    question: "Passt Ihnen Donnerstag um 14 Uhr?", response: "Ja, vielen Dank. Wie ist die Adresse?", transfer: "Bestätigen Sie einen Termin oder bitten Sie um eine andere Uhrzeit." },
  15: { focus: "Informationen aus mehreren Situationen verbinden", example: "Zug verspätet → Termin prüfen → Nachricht senden → neue Zeit bestätigen.",
    task: "Sie haben einen Termin um 11 Uhr. Ihr Zug kommt erst um 11:15 Uhr an; danach brauchen Sie zehn Minuten zur Sprachschule. Schreiben Sie eine Nachricht: Grund, früheste Ankunft und Bitte um einen späteren Termin. Fragen Sie außerdem, ob Sie den Ausweis mitbringen sollen.",
    answer: "Guten Tag, mein Zug hat Verspätung. Ich kann erst um 11:25 Uhr in der Sprachschule sein. Kann ich bitte einen späteren Termin bekommen? Soll ich meinen Ausweis mitbringen? Vielen Dank und freundliche Grüße, Nora", check: "Ich berücksichtige Zugankunft und Wegzeit; ich verspreche keine unmögliche Ankunft.",
    question: "Können Sie um 11:30 Uhr kommen?", response: "Ja, 11:30 Uhr passt. Vielen Dank. Brauche ich meinen Ausweis?", transfer: "Erklären Sie eine Änderung und bestätigen Sie eine neue Vereinbarung." },
};

export function enrichA1Production(lesson: AcademyLesson, chapterNumber: number): AcademyLesson {
  const lab = germanA1ProductionLabs[chapterNumber];
  const prefix = `a1-route-${String(chapterNumber).padStart(2, "0")}-production`;
  const guided: LessonBlock[] = [
    { id: `${prefix}-example`, type: "worked-example", heading: `Sprache anwenden · ${lab.focus}`,
      problem: lab.example, steps: [
        { title: "Verstehen", body: "Lesen Sie die Situation. Was braucht die andere Person?" },
        { title: "Bauen", body: lab.check },
        { title: "Selbst versuchen", body: "Schließen Sie das Beispiel. Schreiben Sie zuerst selbst; speichern Sie danach und vergleichen Sie mit der Modellantwort. Andere passende Antworten sind möglich." },
      ], answer: lab.example },
    { id: `${prefix}-write`, type: "writing-practice", heading: "Selbst üben · bauen, verbessern, verändern",
      prompt: lab.task, minWords: 5, maxWords: 120, modelAnswer: lab.answer,
      checklist: [lab.check, "Ich vergleiche meine Antwort erst nach meinem eigenen Versuch.", "Dies ist selbst überprüfte Übung, keine automatisch bewertete Grammatikaufgabe."], completion: "view" },
  ];
  const exchange: LessonBlock = { id: `${prefix}-exchange`, type: "speaking-practice",
    heading: "Sprechen · antworten und zurückfragen", preparationSeconds: 30, targetSeconds: 45,
    prompt: `Eine Person fragt: „${lab.question}“ Antworten Sie zuerst ohne Modell und stellen Sie eine passende Rückfrage. ${lab.transfer} Üben Sie beide Rollen mit einer Lernpartnerin oder einem Lernpartner. Allein können Sie die Frage laut lesen, kurz pausieren und dann antworten. Hier gibt es noch keine aufgenommene Partnerstimme.`,
    modelAnswer: lab.response, checklist: ["Meine Antwort passt zur Frage.", "Ich stelle eine passende Rückfrage.", "Ich höre meine Aufnahme an und prüfe die Verständlichkeit, nicht einen perfekten Akzent."], completion: "view" };
  const blocks: LessonBlock[] = [];
  let wrote = false;
  let spoke = false;
  for (const block of lesson.blocks) {
    if (!wrote && block.type === "writing-practice") { blocks.push(...guided); wrote = true; }
    if (!spoke && block.type === "speaking-practice") { blocks.push(exchange); spoke = true; }
    blocks.push(block);
  }
  // Spaced, productive retrieval revisits chapters beyond the immediately preceding one.
  const reviewNumbers = [chapterNumber - 2, chapterNumber - 4, chapterNumber - 7].filter(n => n > 0);
  if (reviewNumbers.length) {
    const review: LessonBlock = { id: `${prefix}-spaced-review`, type: "writing-practice", heading: "Wiederholen · früher Gelerntes ohne Nachsehen",
      prompt: reviewNumbers.map((n, index) => `${index + 1}. Aus Kapitel ${n}: ${germanA1ProductionLabs[n].question} Schreiben Sie eine passende Antwort und Rückfrage.`).join("\n") + "\nArbeiten Sie zuerst ohne frühere Notizen. Vergleichen Sie danach. Wiederholen Sie unsichere Antworten morgen noch einmal laut.",
      minWords: 5, maxWords: 150,
      modelAnswer: reviewNumbers.map(n => germanA1ProductionLabs[n].response).join("\n"),
      checklist: ["Ich versuche alle Situationen ohne Nachsehen.", "Jede Antwort passt zur Frage.", "Ich notiere eine unsichere Form zur späteren Wiederholung."], completion: "view" };
    const recapIndex = blocks.findIndex(block => block.type === "callout" && /Kapitel geschafft/.test(block.heading));
    blocks.splice(recapIndex < 0 ? blocks.length : recapIndex, 0, review);
  }
  return { ...lesson, blocks, durationMinutes: lesson.durationMinutes + 15 + (reviewNumbers.length ? 5 : 0) };
}

import type { LessonBlock } from "./tutor-academy.ts";

function shopping(prefix: string): LessonBlock[] {
  return [
    { id: `${prefix}-auswahl`, type: "comparison-table", heading: "Eine Jacke auswählen", columns: ["Frage im Geschäft", "Passende Antwort"], rows: [
      ["Welche Farbe möchten Sie?", "Die blaue Jacke, bitte."],
      ["Welche Größe brauchen Sie?", "Ich brauche Größe M."],
      ["Möchten Sie sie anprobieren?", "Ja, wo ist die Umkleidekabine?"],
      ["Wie viel kostet sie heute?", "Sie kostet heute 39 Euro."],
    ] },
    { id: `${prefix}-groesse-check`, type: "knowledge-check", heading: "Mini-Check · Farbe und Größe", completion: "pass", required: true, question: {
      id: `${prefix}-frage-groesse`, prompt: "Anna braucht eine Jacke in Größe M. Welche Jacke kann sie anprobieren?",
      options: [{ id: "a", label: "Die blaue Jacke" }, { id: "b", label: "Die rote Jacke" }, { id: "c", label: "Beide Jacken" }],
      correctOptionId: "a", explanation: "Die blaue Jacke gibt es in M und L; die rote nur in S.",
    } },
    { id: `${prefix}-fragen`, type: "worked-example", heading: "Im Geschäft nachfragen", problem: "Sie sehen eine Jacke, kennen aber Größe und Preis noch nicht.", steps: [
      { id: `${prefix}-fragen-schritt-1`, title: "Nach der Größe", body: "Haben Sie diese Jacke auch in Größe M?" },
      { id: `${prefix}-fragen-schritt-2`, title: "Nach dem Preis", body: "Wie viel kostet die blaue Jacke?" },
      { id: `${prefix}-fragen-schritt-3`, title: "Eine Bitte", body: "Kann ich sie bitte anprobieren?" },
    ], answer: "Fragen Sie zuerst nach einer passenden Größe. Danach fragen Sie nach Preis und Anprobe." },
    { id: `${prefix}-frage-check`, type: "knowledge-check", heading: "Mini-Check · höflich nach der Größe fragen", completion: "pass", required: false, question: {
      id: `${prefix}-frage-nach-groesse`, prompt: "Sie suchen die blaue Jacke in M. Welche Frage stellen Sie?",
      options: [{ id: "a", label: "Haben Sie die blaue Jacke in Größe M?" }, { id: "b", label: "Wo fährt die blaue Jacke?" }, { id: "c", label: "Ich Größe M blau?" }],
      correctOptionId: "a", explanation: "Haben Sie … in Größe M? ist eine passende höfliche Frage im Geschäft.",
    } },
    { id: `${prefix}-kasse`, type: "comparison-table", heading: "An der Kasse und beim Umtausch", columns: ["Situation", "Nützlicher Satz"], rows: [
      ["Mit Karte bezahlen", "Kann ich mit Karte bezahlen?"],
      ["Den Beleg behalten", "Bitte behalten Sie den Kassenbon."],
      ["Die Jacke passt zu Hause nicht.", "Kann ich die Jacke umtauschen? Ich habe den Kassenbon."],
    ] },
    { id: `${prefix}-umtausch-check`, type: "knowledge-check", heading: "Mini-Check · Umtausch", completion: "pass", required: true, question: {
      id: `${prefix}-frage-umtausch`, prompt: "Sie möchten die Jacke nach einer Woche umtauschen. Was brauchen Sie laut Anzeige?",
      options: [{ id: "a", label: "Den Kassenbon" }, { id: "b", label: "Eine Fahrkarte" }, { id: "c", label: "Ein Kursbuch" }],
      correctOptionId: "a", explanation: "Im Modehaus ist der Umtausch innerhalb von 14 Tagen mit Kassenbon möglich.",
    } },
  ];
}

function town(prefix: string): LessonBlock[] {
  return [
    { id: `${prefix}-weg-schritte`, type: "comparison-table", heading: "Den Weg in drei Schritten verstehen", columns: ["Schritt", "Weg zur Bibliothek"], rows: [
      ["1", "Gehen Sie geradeaus bis zur Ampel."],
      ["2", "Dann gehen Sie links."],
      ["3", "Die Bibliothek ist neben der Post."],
    ] },
    { id: `${prefix}-weg-check`, type: "knowledge-check", heading: "Mini-Check · zuerst geradeaus", completion: "pass", required: true, question: {
      id: `${prefix}-frage-weg`, prompt: "Was macht Anna zuerst auf dem Weg zur Bibliothek?",
      options: [{ id: "a", label: "Sie geht geradeaus bis zur Ampel." }, { id: "b", label: "Sie geht sofort nach rechts." }, { id: "c", label: "Sie fährt zum Bahnhof." }],
      correctOptionId: "a", explanation: "Eddy sagt zuerst: Gehen Sie geradeaus bis zur Ampel.",
    } },
    { id: `${prefix}-rueckfrage`, type: "worked-example", heading: "Wenn der Weg zu schnell erklärt wird", problem: "Anna versteht die Beschreibung nicht sofort.", steps: [
      { id: `${prefix}-rueckfrage-schritt-1`, title: "Höflich unterbrechen", body: "Entschuldigung, können Sie das bitte wiederholen?" },
      { id: `${prefix}-rueckfrage-schritt-2`, title: "Langsamer bitten", body: "Sprechen Sie bitte langsam." },
      { id: `${prefix}-rueckfrage-schritt-3`, title: "Den Weg bestätigen", body: "Also geradeaus bis zur Ampel, dann links, richtig?" },
    ], answer: "Eine kurze Rückfrage ist besser als ein falscher Weg. Wiederholen Sie die zwei wichtigsten Schritte laut." },
    { id: `${prefix}-rueckfrage-check`, type: "knowledge-check", heading: "Mini-Check · um Wiederholung bitten", completion: "pass", required: false, question: {
      id: `${prefix}-frage-rueckfrage`, prompt: "Die Person spricht zu schnell. Was sagen Sie höflich?",
      options: [{ id: "a", label: "Können Sie das bitte langsam wiederholen?" }, { id: "b", label: "Ich bezahle die Rechnung." }, { id: "c", label: "Die Bibliothek kostet zehn Euro." }],
      correctOptionId: "a", explanation: "Mit Können Sie … bitte …? bitten Sie höflich um Hilfe.",
    } },
    { id: `${prefix}-schalter-check`, type: "knowledge-check", heading: "Mini-Check · Anmeldung in der Bibliothek", completion: "pass", required: true, question: {
      id: `${prefix}-frage-schalter`, prompt: "Anna möchte sich in der Bibliothek anmelden. Wohin geht sie dort?",
      options: [{ id: "a", label: "Zum Schalter im Erdgeschoss" }, { id: "b", label: "Zum Fahrkartenautomaten" }, { id: "c", label: "Zur Kasse im Café" }],
      correctOptionId: "a", explanation: "Eddy nennt den Schalter im Erdgeschoss.",
    } },
  ];
}

function travel(prefix: string): LessonBlock[] {
  return [
    { id: `${prefix}-abfahrt`, type: "comparison-table", heading: "Eine Änderung am Bahnhof verstehen", columns: ["Information", "RE 5 nach Köln"], rows: [
      ["Geplante Abfahrt", "14:20 Uhr"],
      ["Verspätung", "ungefähr 15 Minuten"],
      ["Neue Abfahrt", "14:35 Uhr"],
      ["Gleis", "Gleis 4"],
    ] },
    { id: `${prefix}-abfahrt-check`, type: "knowledge-check", heading: "Mini-Check · neue Abfahrt", completion: "pass", required: true, question: {
      id: `${prefix}-frage-abfahrt`, prompt: "Der RE 5 sollte um 14:20 Uhr fahren und hat 15 Minuten Verspätung. Wann fährt er jetzt?",
      options: [{ id: "a", label: "Um 14:35 Uhr" }, { id: "b", label: "Um 14:05 Uhr" }, { id: "c", label: "Um 15:20 Uhr" }],
      correctOptionId: "a", explanation: "15 Minuten nach 14:20 Uhr ist 14:35 Uhr; die Durchsage nennt diese neue Zeit.",
    } },
    { id: `${prefix}-auskunft`, type: "worked-example", heading: "Am Bahnhof nach Informationen fragen", problem: "Anna braucht eine Fahrkarte und möchte wissen, ob sie umsteigen muss.", steps: [
      { id: `${prefix}-auskunft-schritt-1`, title: "Fahrkarte", body: "Wo kann ich eine Fahrkarte nach Köln kaufen?" },
      { id: `${prefix}-auskunft-schritt-2`, title: "Umsteigen", body: "Muss ich in Bonn umsteigen?" },
      { id: `${prefix}-auskunft-schritt-3`, title: "Antwort", body: "Nein, der Zug fährt direkt. Sie müssen nicht umsteigen." },
    ], answer: "Können und müssen helfen bei Reisefragen. Fragen Sie nach Fahrkarte, Abfahrt, Gleis und Umsteigen." },
    { id: `${prefix}-umsteigen-check`, type: "knowledge-check", heading: "Mini-Check · direkt fahren", completion: "pass", required: true, question: {
      id: `${prefix}-frage-umsteigen`, prompt: "Eddy sagt: „Der Zug fährt direkt nach Köln.“ Was bedeutet das für Anna?",
      options: [{ id: "a", label: "Sie muss nicht umsteigen." }, { id: "b", label: "Sie muss in Bonn umsteigen." }, { id: "c", label: "Sie muss im Zug eine Fahrkarte kaufen." }],
      correctOptionId: "a", explanation: "Direkt heißt hier: kein Umsteigen auf dem Weg nach Köln.",
    } },
    { id: `${prefix}-verkehrsmittel`, type: "comparison-table", heading: "Wie kommen Sie hin?", columns: ["Verkehrsmittel", "Ein Satz"], rows: [
      ["der Zug", "Ich fahre mit dem Zug nach Köln."],
      ["der Bus", "Ich fahre mit dem Bus zum Bahnhof."],
      ["zu Fuß", "Ich gehe zu Fuß zur Sprachschule."],
      ["die Fahrkarte", "Ich möchte eine Fahrkarte kaufen."],
    ] },
    { id: `${prefix}-fahrkarte-check`, type: "knowledge-check", heading: "Mini-Check · am Schalter fragen", completion: "pass", required: false, question: {
      id: `${prefix}-frage-fahrkarte`, prompt: "Anna braucht eine Fahrkarte nach Köln. Welche Frage ist passend?",
      options: [{ id: "a", label: "Wo kann ich eine Fahrkarte nach Köln kaufen?" }, { id: "b", label: "Wie viel Uhr kostet Köln?" }, { id: "c", label: "Ich bin eine Fahrkarte?" }],
      correctOptionId: "a", explanation: "So fragt Anna höflich nach dem Kauf einer Fahrkarte.",
    } },
  ];
}

export function publicLifePracticeBlocks(number: number, prefix: string): LessonBlock[] {
  if (number === 7) return shopping(prefix);
  if (number === 8) return town(prefix);
  if (number === 9) return travel(prefix);
  return [];
}

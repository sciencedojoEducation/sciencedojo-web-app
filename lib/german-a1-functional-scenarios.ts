type ScenarioQuestion = {
  prompt: string;
  options: [string, string, string];
  correctIndex: 0 | 1 | 2;
  explanation: string;
};

export type GermanA1FunctionalScenario = {
  sourceSlug: string;
  routeChapter: number;
  listeningHeading: string;
  listeningInstruction: string;
  transcript: string;
  listeningQuestions: [ScenarioQuestion, ScenarioQuestion];
  reading: string;
  readingQuestion: ScenarioQuestion;
};

/** Original everyday material for the shared A1 route. The number is the
 * reusable syllabus source lesson, not the learner-facing chapter number. */
export const germanA1FunctionalScenarios: Record<number, GermanA1FunctionalScenario> = {
  16: {
    sourceSlug: "16-wohnen-und-mobel",
    routeChapter: 5,
    listeningHeading: "Hören · Ein Zimmer ansehen",
    listeningInstruction: "Hören Sie zuerst: Was sucht Eddy? Notieren Sie dann Miete und Besichtigungstermin.",
    transcript: `Anna: Guten Tag. Sie interessieren sich für das Zimmer?\nEddy: Ja. Ist es noch frei?\nAnna: Ja, ab dem ersten Oktober. Das Zimmer ist hell. Es gibt ein Bett, einen Tisch und einen Schrank.\nEddy: Was kostet es im Monat?\nAnna: Vierhundertachtzig Euro. Die Küche nutzen alle zusammen.\nEddy: Kann ich das Zimmer am Samstag ansehen?\nAnna: Ja, um elf Uhr. Bringen Sie bitte Ihren Ausweis mit.\nEddy: Danke, bis Samstag!`,
    listeningQuestions: [
      { prompt: "Wie viel kostet das Zimmer im Monat?", options: ["380 Euro", "480 Euro", "580 Euro"], correctIndex: 1, explanation: "Anna sagt: vierhundertachtzig Euro im Monat." },
      { prompt: "Wann kann Eddy das Zimmer ansehen?", options: ["Am Samstag um elf Uhr", "Am Sonntag um elf Uhr", "Am Samstag um zehn Uhr"], correctIndex: 0, explanation: "Die Besichtigung ist am Samstag um elf Uhr." },
    ],
    reading: "ZIMMER FREI · Ab 1. Oktober: helles Zimmer mit Bett, Tisch und Schrank. Küche gemeinsam. 480 Euro pro Monat. Besichtigung am Samstag um 11 Uhr. Bitte Ausweis mitbringen.",
    readingQuestion: { prompt: "Was muss man zur Besichtigung mitbringen?", options: ["Ein Kursbuch", "Einen Ausweis", "Eine Fahrkarte"], correctIndex: 1, explanation: "In der Anzeige steht: Bitte Ausweis mitbringen." },
  },
  14: {
    sourceSlug: "14-essen-und-trinken",
    routeChapter: 6,
    listeningHeading: "Hören · Im Café bestellen",
    listeningInstruction: "Hören Sie zuerst: Was bestellt der Gast? Achten Sie dann auf den Gesamtpreis und die Bezahlung.",
    transcript: `Anna: Guten Tag. Was möchten Sie bestellen?\nEddy: Ich hätte gern die Gemüsesuppe und ein Käsebrot.\nAnna: Gern. Möchten Sie auch etwas trinken?\nEddy: Ein Wasser, bitte. Was kostet das Mittagsmenü?\nAnna: Suppe und Brot zusammen kosten acht Euro fünfzig. Das Wasser kostet zwei Euro.\nEddy: Gut. Kann ich mit Karte bezahlen?\nAnna: Ja, natürlich. Das macht zehn Euro fünfzig.\nEddy: Danke schön.`,
    listeningQuestions: [
      { prompt: "Was bestellt Eddy zum Essen?", options: ["Suppe und Käsebrot", "Salat und Kuchen", "Fisch und Reis"], correctIndex: 0, explanation: "Eddy bestellt Gemüsesuppe und ein Käsebrot." },
      { prompt: "Wie viel bezahlt Eddy mit dem Wasser zusammen?", options: ["8,50 Euro", "10,50 Euro", "12,50 Euro"], correctIndex: 1, explanation: "Das Menü kostet 8,50 Euro und das Wasser 2 Euro: zusammen 10,50 Euro." },
    ],
    reading: "CAFÉ LINDEN · Gemüsesuppe 5,50 € · Käsebrot 4,20 € · Wasser 2,00 € · Mittagsmenü: Suppe und Brot 8,50 €. Kartenzahlung möglich.",
    readingQuestion: { prompt: "Was gehört zum Mittagsmenü?", options: ["Suppe und Brot", "Brot und Wasser", "Suppe und Kaffee"], correctIndex: 0, explanation: "Das Mittagsmenü besteht aus Suppe und Brot." },
  },
  15: {
    sourceSlug: "15-einkaufen",
    routeChapter: 7,
    listeningHeading: "Hören · Eine Jacke kaufen",
    listeningInstruction: "Hören Sie zuerst: Welche Jacke sucht Anna? Notieren Sie dann Größe und Preis.",
    transcript: `Anna: Guten Tag. Haben Sie diese Jacke auch in Blau?\nEddy: Ja, die blaue Jacke gibt es in Größe M und L. Welche Größe brauchen Sie?\nAnna: Größe M, bitte. Kann ich die Jacke anprobieren?\nEddy: Natürlich. Die Umkleidekabine ist dort links.\nAnna: Sie passt gut. Wie viel kostet sie?\nEddy: Heute kostet sie neununddreißig Euro.\nAnna: Gut, ich nehme sie. Kann ich mit Karte bezahlen?\nEddy: Ja, an der Kasse. Bitte behalten Sie den Kassenbon.`,
    listeningQuestions: [
      { prompt: "Welche Jacke probiert Anna an?", options: ["Die rote in Größe S", "Die blaue in Größe M", "Die blaue in Größe L"], correctIndex: 1, explanation: "Anna fragt nach der blauen Jacke in Größe M." },
      { prompt: "Was kostet die Jacke heute?", options: ["29 Euro", "39 Euro", "49 Euro"], correctIndex: 1, explanation: "Eddy sagt: neununddreißig Euro." },
    ],
    reading: "MODEHAUS NORD · Jacken heute 39 €. Die rote Jacke gibt es nur in Größe S. Die blaue Jacke gibt es in M und L. Umtausch mit Kassenbon innerhalb von 14 Tagen.",
    readingQuestion: { prompt: "Welche Jacke gibt es in Größe M?", options: ["Die rote Jacke", "Die blaue Jacke", "Keine Jacke"], correctIndex: 1, explanation: "Die Anzeige nennt die blaue Jacke in M und L." },
  },
  18: {
    sourceSlug: "18-stadt-und-wegbeschreibung",
    routeChapter: 8,
    listeningHeading: "Hören · Zur Bibliothek finden",
    listeningInstruction: "Hören Sie den Weg zur Bibliothek. Achten Sie danach auf die Anmeldung am Schalter.",
    transcript: `Anna: Entschuldigung, wo ist die Stadtbibliothek?\nEddy: Gehen Sie geradeaus bis zur Ampel. Dann gehen Sie links. Die Bibliothek ist neben der Post.\nAnna: Danke. Ich möchte mich dort anmelden. Was brauche ich?\nEddy: Ihren Ausweis. Die Anmeldung ist am Schalter im Erdgeschoss.\nAnna: Ist die Bibliothek am Samstag geöffnet?\nEddy: Ja, von zehn bis vierzehn Uhr. Am Montag ist sie geschlossen.\nAnna: Können Sie den Weg bitte noch einmal langsam sagen?\nEddy: Gern: geradeaus bis zur Ampel, dann links, neben der Post.`,
    listeningQuestions: [
      { prompt: "Wo ist die Bibliothek?", options: ["Neben der Post", "Hinter dem Bahnhof", "Gegenüber der Schule"], correctIndex: 0, explanation: "Eddy sagt: Die Bibliothek ist neben der Post." },
      { prompt: "Was braucht Anna für die Anmeldung?", options: ["Eine Fahrkarte", "Ihren Ausweis", "Ein Foto"], correctIndex: 1, explanation: "Für die Anmeldung braucht Anna ihren Ausweis." },
    ],
    reading: "STADTBIBLIOTHEK · Montag geschlossen. Dienstag bis Freitag 10–18 Uhr, Samstag 10–14 Uhr. Anmeldung mit Ausweis am Schalter im Erdgeschoss.",
    readingQuestion: { prompt: "Wann ist die Bibliothek am Samstag geöffnet?", options: ["10–14 Uhr", "10–18 Uhr", "Gar nicht"], correctIndex: 0, explanation: "Am Samstag ist sie von 10 bis 14 Uhr geöffnet." },
  },
  19: {
    sourceSlug: "19-verkehrsmittel",
    routeChapter: 9,
    listeningHeading: "Hören · Eine Bahnhofsdurchsage",
    listeningInstruction: "Hören Sie die Durchsage zuerst ohne Transcript. Notieren Sie Zug, Gleis und Verspätung.",
    transcript: `Ansage eins: Achtung am Bahnhof. Der Regionalzug R E fünf nach Köln fährt heute von Gleis vier ab.\nAnsage eins: Der Zug hat ungefähr fünfzehn Minuten Verspätung. Die neue Abfahrt ist um vierzehn Uhr fünfunddreißig.\nAnna: Entschuldigung, kann ich die Fahrkarte im Zug kaufen?\nEddy: Nein, im Zug gibt es keinen Fahrkartenverkauf. Der Automat steht in der Bahnhofshalle.\nAnna: Danke. Muss ich in Bonn umsteigen?\nEddy: Nein, der Zug fährt direkt nach Köln. Aber gehen Sie bitte zuerst zum Automaten.`,
    listeningQuestions: [
      { prompt: "Von welchem Gleis fährt der Regionalzug nach Köln ab?", options: ["Gleis zwei", "Gleis vier", "Gleis fünf"], correctIndex: 1, explanation: "Die Durchsage nennt Gleis vier." },
      { prompt: "Wann fährt der verspätete Zug jetzt ab?", options: ["14:20 Uhr", "14:35 Uhr", "15:35 Uhr"], correctIndex: 1, explanation: "Der Zug fährt wegen 15 Minuten Verspätung um 14:35 Uhr ab." },
    ],
    reading: "BAHNHOF · RE 5 nach Köln · geplant 14:20 Uhr · heute etwa 15 Minuten später · Gleis 4. Fahrkartenautomat in der Bahnhofshalle. Kein Verkauf im Zug.",
    readingQuestion: { prompt: "Wo kann Anna die Fahrkarte kaufen?", options: ["Im Zug", "Am Automaten in der Halle", "Am Gleis vier"], correctIndex: 1, explanation: "Die Fahrkarte gibt es am Automaten in der Bahnhofshalle." },
  },
  20: {
    sourceSlug: "20-arbeit-und-berufe",
    routeChapter: 10,
    listeningHeading: "Hören · Nach einem Berufskurs fragen",
    listeningInstruction: "Hören Sie: Warum interessiert sich Eddy für den Kurs? Notieren Sie Kurstage und Preis.",
    transcript: `Anna: Guten Tag, Sprachschule Mitte. Wie kann ich Ihnen helfen?\nEddy: Guten Tag. Ich arbeite in einem Café und möchte besser Deutsch mit den Gästen sprechen. Gibt es einen Kurs am Abend?\nAnna: Ja, Deutsch für den Beruf ist am Dienstag und Donnerstag von siebzehn Uhr dreißig bis neunzehn Uhr.\nEddy: Das passt. Was kostet der Kurs?\nAnna: Sechzig Euro. Sie brauchen Deutsch auf A eins Niveau.\nEddy: Wann muss ich mich anmelden?\nAnna: Bis zum zehnten September. Das Formular finden Sie auf unserer Webseite.\nEddy: Vielen Dank für die Information.`,
    listeningQuestions: [
      { prompt: "An welchen Tagen findet der Berufskurs statt?", options: ["Montag und Mittwoch", "Dienstag und Donnerstag", "Samstag und Sonntag"], correctIndex: 1, explanation: "Anna nennt Dienstag und Donnerstag." },
      { prompt: "Was kostet der Kurs?", options: ["40 Euro", "60 Euro", "80 Euro"], correctIndex: 1, explanation: "Anna sagt: sechzig Euro." },
    ],
    reading: "DEUTSCH FÜR DEN BERUF · Dienstag und Donnerstag 17:30–19 Uhr. Anmeldung bis 10. September. Voraussetzung: Deutsch A1. Kosten: 60 Euro. Anmeldeformular online.",
    readingQuestion: { prompt: "Bis wann ist die Anmeldung möglich?", options: ["Bis 10. September", "Bis 19 Uhr", "Bis Donnerstag"], correctIndex: 0, explanation: "In der Kursinformation steht: Anmeldung bis 10. September." },
  },
  21: {
    sourceSlug: "21-freizeit-und-hobbys",
    routeChapter: 11,
    listeningHeading: "Hören · Ein Treffen verabreden",
    listeningInstruction: "Hören Sie zuerst: Was planen Anna und Eddy? Achten Sie dann auf den Plan bei Regen.",
    transcript: `Anna: Hallo Eddy! Spielst du am Samstag mit uns Volleyball?\nEddy: Gern. Wann und wo treffen wir uns?\nAnna: Um fünfzehn Uhr im Park. Bring bitte Wasser mit.\nEddy: Gut. Und was machen wir, wenn es regnet?\nAnna: Dann treffen wir uns um sechzehn Uhr im Café am Markt.\nEddy: Das ist eine gute Idee. Soll ich noch jemanden fragen?\nAnna: Ja, frag bitte Laura. Sie spielt auch gern Volleyball.\nEddy: Mache ich. Bis Samstag!`,
    listeningQuestions: [
      { prompt: "Was soll Eddy zum Spielen mitbringen?", options: ["Wasser", "Eine Fahrkarte", "Ein Kursbuch"], correctIndex: 0, explanation: "Anna sagt: Bring bitte Wasser mit." },
      { prompt: "Wo treffen sich alle bei Regen?", options: ["Im Park", "Im Café am Markt", "In der Bibliothek"], correctIndex: 1, explanation: "Bei Regen treffen sie sich im Café am Markt." },
    ],
    reading: "NACHRICHT VON ANNA · Am Samstag spielen wir ab 15 Uhr im Park Volleyball. Bring bitte Wasser mit. Bei Regen treffen wir uns um 16 Uhr im Café am Markt. Kommst du?",
    readingQuestion: { prompt: "Wann beginnt Volleyball bei gutem Wetter?", options: ["Um 15 Uhr", "Um 16 Uhr", "Um 18 Uhr"], correctIndex: 0, explanation: "Die Nachricht nennt 15 Uhr im Park." },
  },
  23: {
    sourceSlug: "23-gesundheit",
    routeChapter: 12,
    listeningHeading: "Hören · In der Arztpraxis anrufen",
    listeningInstruction: "Hören Sie: Welche Beschwerden hat Eddy? Notieren Sie Sprechzeit und benötigte Karte.",
    transcript: `Telefonnotiz: Praxis Doktor Meier, guten Morgen.\nEddy: Guten Morgen. Ich heiße Eddy Weber. Ich habe Fieber und mein Kopf tut weh. Haben Sie heute einen Termin?\nTelefonnotiz: Die Akutsprechstunde ist von acht bis zehn Uhr. Können Sie um neun Uhr kommen?\nEddy: Ja, neun Uhr passt. Muss ich vorher noch etwas machen?\nTelefonnotiz: Sie haben schon angerufen. Bringen Sie bitte Ihre Versicherungskarte mit.\nEddy: Danke. Ich komme um neun Uhr. Auf Wiederhören.\nTelefonnotiz: Auf Wiederhören und gute Besserung!`,
    listeningQuestions: [
      { prompt: "Wann kommt Eddy in die Praxis?", options: ["Um acht Uhr", "Um neun Uhr", "Um zehn Uhr"], correctIndex: 1, explanation: "Eddy bestätigt den Termin um neun Uhr." },
      { prompt: "Was soll Eddy mitbringen?", options: ["Seine Versicherungskarte", "Sein Kursbuch", "Eine Fahrkarte"], correctIndex: 0, explanation: "Die Praxis bittet um die Versicherungskarte." },
    ],
    reading: "PRAXIS DR. MEIER · Akutsprechstunde Montag bis Freitag 8–10 Uhr. Bitte vorher anrufen. Versicherungskarte mitbringen. Bei starken Beschwerden den Notruf wählen.",
    readingQuestion: { prompt: "Was soll man vor der Akutsprechstunde tun?", options: ["In der Praxis anrufen", "Eine E-Mail an die Apotheke schreiben", "Direkt um 12 Uhr kommen"], correctIndex: 0, explanation: "Der Praxishinweis sagt: Bitte vorher anrufen." },
  },
  22: {
    sourceSlug: "22-wetter",
    routeChapter: 13,
    listeningHeading: "Hören · Das Wochenende planen",
    listeningInstruction: "Hören Sie den Wetterbericht im Gespräch. Wann wollen die beiden spazieren gehen?",
    transcript: `Anna: Wie wird das Wetter am Wochenende?\nEddy: Am Samstag ist es sonnig und warm, ungefähr zweiundzwanzig Grad.\nAnna: Schön. Wollen wir am Samstagvormittag im Park spazieren gehen?\nEddy: Ja, um zehn Uhr. Am Sonntag regnet es ab vierzehn Uhr und es wird windig.\nAnna: Dann machen wir den Spaziergang lieber am Samstag.\nEddy: Genau. Und wenn es doch regnet, treffen wir uns im Café am Markt.\nAnna: Gut, ich schreibe dir am Freitag noch eine Nachricht.`,
    listeningQuestions: [
      { prompt: "Wann planen Anna und Eddy den Spaziergang?", options: ["Am Samstag um zehn Uhr", "Am Sonntag um zehn Uhr", "Am Sonntag um vierzehn Uhr"], correctIndex: 0, explanation: "Sie verabreden sich für Samstag um zehn Uhr." },
      { prompt: "Wann soll es am Sonntag regnen?", options: ["Schon am Morgen", "Ab vierzehn Uhr", "Erst am Abend"], correctIndex: 1, explanation: "Eddy sagt: Am Sonntag regnet es ab vierzehn Uhr." },
    ],
    reading: "WETTER AM WOCHENENDE · Samstag sonnig, 22 Grad. Sonntag ab 14 Uhr Regen und Wind, 16 Grad. Für Spaziergänge empfehlen wir den Samstagvormittag.",
    readingQuestion: { prompt: "Wann ist ein Spaziergang laut Wetterbericht am besten?", options: ["Am Samstagvormittag", "Am Sonntagnachmittag", "Am Sonntagabend"], correctIndex: 0, explanation: "Der Wetterbericht empfiehlt den Samstagvormittag." },
  },
  24: {
    sourceSlug: "24-termine",
    routeChapter: 14,
    listeningHeading: "Hören · Ein Termin ändert sich",
    listeningInstruction: "Hören Sie zuerst: Was wird geändert? Notieren Sie danach neuen Tag, Uhrzeit und Dokument.",
    transcript: `Telefonnotiz: Guten Tag, hier ist die Sprachschule Mitte. Spreche ich mit Herrn Weber?\nSam: Ja, Sam Weber am Apparat.\nTelefonnotiz: Ihr Beratungstermin am Dienstag um neun Uhr muss leider verschoben werden. Haben Sie am Mittwoch um elf Uhr Zeit?\nSam: Ja, Mittwoch um elf Uhr passt. Muss ich etwas mitbringen?\nTelefonnotiz: Bitte bringen Sie Ihren Ausweis mit. Antworten Sie uns auch bis Montag kurz per E-Mail.\nSam: Das mache ich. Der neue Termin ist Mittwoch um elf Uhr.\nTelefonnotiz: Genau. Vielen Dank und auf Wiederhören.\nSam: Auf Wiederhören.`,
    listeningQuestions: [
      { prompt: "Wann ist Sams neuer Beratungstermin?", options: ["Dienstag um neun Uhr", "Mittwoch um elf Uhr", "Montag um elf Uhr"], correctIndex: 1, explanation: "Sam bestätigt Mittwoch um elf Uhr." },
      { prompt: "Was soll Sam zum Termin mitbringen?", options: ["Seinen Ausweis", "Ein Kursbuch", "Eine Versicherungskarte"], correctIndex: 0, explanation: "Die Sprachschule bittet Sam, seinen Ausweis mitzubringen." },
    ],
    reading: "NACHRICHT DER SPRACHSCHULE · Ihr Beratungstermin am Dienstag um 9 Uhr findet jetzt am Mittwoch um 11 Uhr statt. Bitte antworten Sie bis Montag und bringen Sie Ihren Ausweis mit.",
    readingQuestion: { prompt: "Bis wann soll Sam auf die Nachricht antworten?", options: ["Bis Montag", "Bis Dienstag", "Bis Mittwoch"], correctIndex: 0, explanation: "Die Sprachschule bittet um eine Antwort bis Montag." },
  },
};

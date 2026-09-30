/** Longer, multi-speaker original listening tasks for the later B2 chapters. */
export type AdvancedListening = {
  chapterIndex: number;
  title: string;
  genre: string;
  segments: Array<{ speaker: "Anna" | "Eddy" | "Reed"; text: string }>;
  mainQuestion: string;
  mainAnswer: string;
  mainDistractors: [string, string];
  detailQuestion: string;
  detailAnswer: string;
  detailDistractors: [string, string];
};

export const germanB2AdvancedListening: AdvancedListening[] = [
  {
    chapterIndex: 9, title: "Podcast · KI an Schulen", genre: "Interview",
    segments: [
      { speaker: "Anna", text: "Willkommen zum Bildungspodcast. Heute fragen wir, ob künstliche Intelligenz an Schulen erlaubt sein sollte. Bei mir ist der Lehrer Jonas Weber. Herr Weber, Ihre Schule testet solche Werkzeuge. Was hat Sie bisher überrascht?" },
      { speaker: "Eddy", text: "Vor allem die Unterschiede zwischen den Lernenden. Manche lassen sich einen schwierigen Begriff erklären und prüfen anschließend selbst, ob die Erklärung stimmt. Andere übernehmen eine fertige Antwort, ohne sie verstanden zu haben. Das Werkzeug allein entscheidet also nicht über den Lernerfolg. Wir brauchen Aufgaben, in denen die Schülerinnen ihren eigenen Denkweg sichtbar machen." },
      { speaker: "Anna", text: "Eine Elternvertretung hat auf Datenschutz und ungleichen Zugang hingewiesen. Kann eine Schule das überhaupt kontrollieren?" },
      { speaker: "Eddy", text: "Nicht vollständig, aber wir können Bedingungen festlegen. Zunächst dürfen nur freiwillige Gruppen teilnehmen. Die Schule stellt Leihgeräte bereit und dokumentiert, welche Daten der Anbieter verarbeitet. Außerdem erklären Lernende, wann sie eine digitale Hilfe genutzt haben. Nach einem Semester vergleichen wir nicht nur Noten, sondern auch Selbstständigkeit und Arbeitsaufwand. Falls wichtige Fragen offenbleiben, verlängern wir den Versuch nicht automatisch." },
      { speaker: "Anna", text: "Sie sprechen also weder für ein pauschales Verbot noch für einen unbegrenzten Einsatz. Ihr Vorschlag ist ein überprüfbarer Versuch mit klaren Regeln. Vielen Dank für das Gespräch." },
    ],
    mainQuestion: "Welche Grundhaltung vertritt Herr Weber?", mainAnswer: "Er befürwortet einen begrenzten Versuch mit klaren Regeln und Auswertung.", mainDistractors: ["Er möchte alle KI-Werkzeuge sofort und unbegrenzt einsetzen.", "Er lehnt jede digitale Lernhilfe grundsätzlich ab."],
    detailQuestion: "Welche Bedingung soll ungleichen Zugang verringern?", detailAnswer: "Die Schule stellt Leihgeräte bereit.", detailDistractors: ["Lernende müssen eigene teure Geräte kaufen.", "Nur Familien mit Vorkenntnissen dürfen teilnehmen."],
  },
  {
    chapterIndex: 10, title: "Radio · Eine Nachricht prüfen", genre: "Radiobeitrag mit Interview",
    segments: [
      { speaker: "Anna", text: "In den sozialen Medien verbreitet sich derzeit die Nachricht, eine Stadtbibliothek werde endgültig geschlossen. Ein Foto des Gebäudes scheint den Beitrag zu bestätigen. Unsere Redaktion hat nachgefragt. Zunächst sprechen wir mit der Bibliotheksleiterin. Frau Neumann, was ist tatsächlich geplant?" },
      { speaker: "Eddy", text: "Wir schließen für zwei Wochen, weil die Beleuchtung erneuert und ein barrierefreier Eingang eingebaut wird. Danach öffnen wir wieder. Während der Arbeiten können ausgeliehene Bücher in einem Raum neben dem Rathaus zurückgegeben werden. Neue Bestellungen sind dort nur eingeschränkt möglich, weil wir nicht den gesamten Bestand verlagern können." },
      { speaker: "Anna", text: "Wie konnte aus dieser Renovierung eine Meldung über eine dauerhafte Schließung werden?" },
      { speaker: "Eddy", text: "Das Foto ist echt, und das Wort Schließung steht tatsächlich in unserer Mitteilung. Der Onlinebeitrag ließ jedoch die zeitliche Begrenzung und den Ausweichraum weg. Gerade diese beiden Informationen verändern die Bedeutung erheblich. Wir haben inzwischen eine leicht verständliche Erklärung veröffentlicht." },
      { speaker: "Anna", text: "Unsere Redaktion verglich außerdem die städtische Mitteilung mit dem Renovierungsplan. Beide nennen dieselben Termine. Das Beispiel zeigt: Selbst ein echtes Bild und ein richtiges Einzelwort belegen noch nicht die Schlussfolgerung eines Beitrags. Prüfen Sie Datum, ursprüngliche Quelle und fehlende Zusammenhänge, bevor Sie eine Nachricht weitergeben." },
    ],
    mainQuestion: "Warum ist der Onlinebeitrag irreführend?", mainAnswer: "Er lässt die kurze Dauer und den Ausweichraum weg.", mainDistractors: ["Er zeigt ein völlig erfundenes Gebäude.", "Er nennt einen falschen Namen der Bibliotheksleiterin."],
    detailQuestion: "Was kann man während der Renovierung im Ausweichraum tun?", detailAnswer: "Ausgeliehene Bücher zurückgeben.", detailDistractors: ["Den gesamten Buchbestand ausleihen.", "Die Renovierung selbst besichtigen."],
  },
  {
    chapterIndex: 11, title: "Umweltmagazin · Energie im Wohnhaus", genre: "Fachgespräch",
    segments: [
      { speaker: "Anna", text: "Unser Umweltmagazin besucht heute eine Wohnanlage, die weniger Energie verbrauchen möchte. Drei Maßnahmen stehen zur Wahl: neue Fenster, eine Solaranlage und sparsamere Beleuchtung. Energieberater Martin Falk erklärt, warum die Entscheidung nicht allein vom Anschaffungspreis abhängt." },
      { speaker: "Eddy", text: "Die Lampen lassen sich rasch austauschen und kosten vergleichsweise wenig. Ihr Beitrag zum gesamten Energieverbrauch bleibt aber begrenzt. Neue Fenster könnten mehr einsparen, verlangen jedoch eine hohe Anfangsinvestition. Bei der Solaranlage müssen wir zuerst prüfen, ob das Dach geeignet ist und wie die Kosten unter den Haushalten verteilt werden." },
      { speaker: "Anna", text: "Einige Bewohner befürchten, dass höhere Beiträge Menschen mit wenig Einkommen besonders belasten. Wie kann die Gemeinschaft damit umgehen?" },
      { speaker: "Eddy", text: "Zunächst sollten alle Zahlen offenliegen: erwartete Einsparung, Unsicherheit und mögliche Förderung. Dann kann man Maßnahmen in Stufen planen. Die Hausgemeinschaft hat beschlossen, sofort die Beleuchtung zu verbessern und parallel einen Finanzierungsplan für die Fenster zu erstellen. Nach einem Jahr vergleicht sie den Verbrauch, berücksichtigt dabei aber auch Wetter und Belegung. Sonst würden wir eine Veränderung womöglich fälschlich einer einzelnen Maßnahme zuschreiben." },
      { speaker: "Anna", text: "Der Plan verbindet also einen schnellen Schritt mit einer sorgfältig vorbereiteten Investition. Entscheidend ist, Wirkung und soziale Kosten gemeinsam zu bewerten." },
    ],
    mainQuestion: "Was ist die zentrale Empfehlung des Beraters?", mainAnswer: "Maßnahmen nach Wirkung, Kosten und sozialer Belastung gemeinsam bewerten.", mainDistractors: ["Immer ausschließlich die billigste Maßnahme wählen.", "Alle Investitionen ohne Prüfung sofort umsetzen."],
    detailQuestion: "Warum muss der Verbrauch nach einem Jahr vorsichtig verglichen werden?", detailAnswer: "Wetter und Belegung können die Zahlen ebenfalls verändern.", detailDistractors: ["Die Lampen erzeugen selbst Solarstrom.", "Fenster haben grundsätzlich keinen Einfluss auf Energie."],
  },
  {
    chapterIndex: 13, title: "Bürgerforum · Der neue Marktplatz", genre: "Öffentliche Diskussion",
    segments: [
      { speaker: "Anna", text: "Wir setzen die Diskussion über den Marktplatz fort. Die Stadt möchte mehr Schatten, Sitzplätze und eine kleine Veranstaltungsfläche schaffen. Frau Kaya vertritt die Anwohnenden. Welche Frage ist für Sie am wichtigsten?" },
      { speaker: "Eddy", text: "Viele Menschen begrüßen die Bäume. Wir möchten aber wissen, wer den Platz abends nutzen kann und ob Veranstaltungen zu laut werden. Einige ältere Nachbarn wünschen ruhige Wege, während Jugendliche einen Ort zum Treffen brauchen. Wenn die Stadt feste Zeiten plant und später Rückmeldungen sammelt, könnten beide Gruppen profitieren." },
      { speaker: "Anna", text: "Herr Berger spricht für die Geschäfte. Ihre Sorge betrifft vor allem die Bauphase, richtig?" },
      { speaker: "Reed", text: "Ja. Wir unterstützen eine bessere Gestaltung, doch die Läden müssen erreichbar bleiben. Unser Vorschlag ist, den Umbau in zwei Abschnitten durchzuführen. So kann immer ein Zugang offen sein. Außerdem sollten Lieferzeiten und Änderungen früh angekündigt werden. Ein schöner Platz hilft uns wenig, wenn Kundinnen während der Arbeiten nicht zu uns finden." },
      { speaker: "Anna", text: "Die Stadtverwaltung will die Kosten und den Zeitplan nächste Woche veröffentlichen. Heute gibt es noch keine endgültige Entscheidung. Die eingereichten Hinweise werden zunächst nach Zugänglichkeit, Lärm, Bauablauf und Kosten geordnet. In der nächsten Sitzung sollen konkrete Varianten verglichen werden, damit die Beteiligten nicht nur Wünsche äußern, sondern über überprüfbare Lösungen sprechen." },
    ],
    mainQuestion: "Was haben die beiden Interessenvertretungen gemeinsam?", mainAnswer: "Beide unterstützen Verbesserungen, verlangen aber Bedingungen für die Umsetzung.", mainDistractors: ["Beide lehnen jeden Umbau ab.", "Beide verlangen eine sofortige Entscheidung ohne weitere Planung."],
    detailQuestion: "Welche Lösung schlägt Herr Berger für die Bauphase vor?", detailAnswer: "Den Umbau in zwei Abschnitte aufteilen.", detailDistractors: ["Alle Geschäfte dauerhaft schließen.", "Nur nachts ohne Ankündigung bauen."],
  },
  {
    chapterIndex: 16, title: "Planungsgespräch · Ein Lernabend", genre: "Kooperatives Gespräch",
    segments: [
      { speaker: "Anna", text: "Wir sollen für den Stadtteil einen offenen Lernabend planen. Ich würde ihn jede Woche anbieten, denn regelmäßige Termine helfen den Teilnehmenden. Was meinen Sie?" },
      { speaker: "Eddy", text: "Grundsätzlich stimme ich zu. Allerdings haben wir nur drei Freiwillige. Wenn jede Woche zwei Personen gebraucht werden, könnte das auf Dauer zu viel sein. Vielleicht beginnen wir mit einem Termin alle zwei Wochen und prüfen nach zwei Monaten die Nachfrage." },
      { speaker: "Anna", text: "Das klingt vernünftig. Mir ist außerdem wichtig, dass Berufstätige teilnehmen können. Ein Beginn um 18 Uhr wäre wahrscheinlich passend. Wir sollten aber an Menschen mit Betreuungspflichten denken. Könnten wir einen ruhigen Raum für Kinder anbieten?" },
      { speaker: "Eddy", text: "Dafür brauchen wir zusätzliche Aufsicht, die wir derzeit nicht zugesagt bekommen haben. Wir könnten zunächst eine Kooperation mit dem Familienzentrum anfragen. Falls das nicht klappt, sollten wir es ehrlich in der Einladung sagen und andere Termine prüfen. Die Werbung übernehme ich gern; Sie könnten mit der Bibliothek über den Raum sprechen." },
      { speaker: "Anna", text: "Einverstanden. Wir halten fest: zweiwöchentlicher Test, Beginn um 18 Uhr, Anfrage beim Familienzentrum und klare Aufgabenverteilung. Bei der nächsten Sitzung entscheiden wir anhand der Rückmeldungen, ob wir das Angebot erweitern." },
    ],
    mainQuestion: "Auf welchen vorläufigen Plan einigen sich die beiden?", mainAnswer: "Ein zweiwöchentlicher Test mit Beginn um 18 Uhr und geklärten Zuständigkeiten.", mainDistractors: ["Ein tägliches Angebot ohne Freiwillige.", "Die sofortige Absage des Lernabends."],
    detailQuestion: "Warum ist die Kinderbetreuung noch nicht zugesagt?", detailAnswer: "Zusätzliche Aufsicht ist noch nicht gesichert.", detailDistractors: ["Die Bibliothek verbietet Kinder grundsätzlich.", "Es gibt bereits ausreichend Personal."],
  },
  {
    chapterIndex: 17, title: "Podium · Das Begegnungszentrum", genre: "Mehrperspektivische Diskussion",
    segments: [
      { speaker: "Anna", text: "Willkommen zur öffentlichen Anhörung. Das ehemalige Kaufhaus könnte für sechs Monate als Begegnungszentrum getestet werden. Bevor wir abstimmen, möchte ich unterschiedliche Sichtweisen hören. Herr Roth vertritt mehrere Vereine. Warum brauchen Sie diesen Ort?" },
      { speaker: "Eddy", text: "Unsere Sprachkurse und Beratungstreffen finden bisher in wechselnden Räumen statt. Ein verlässlicher Ort würde Planung erleichtern. Wir könnten bereits im Erdgeschoss beginnen, ohne den vollständigen Umbau vorwegzunehmen. Wichtig wären Öffnungszeiten am Abend, damit Berufstätige teilnehmen können." },
      { speaker: "Anna", text: "Anwohnende haben zugleich Sorge vor zusätzlichem Verkehr. Wie reagieren Sie darauf?" },
      { speaker: "Eddy", text: "Diese Sorge ist berechtigt. Wir würden größere Veranstaltungen früh ankündigen, ihre Zahl zunächst begrenzen und auf Bus- und Radverbindungen hinweisen. Außerdem unterstützen wir eine Kontaktstelle, an die Nachbarn Beschwerden richten können. Wenn Probleme auftreten, müssen wir den Plan anpassen können." },
      { speaker: "Anna", text: "Die Verwaltung ergänzt, dass die laufenden Kosten bisher nur geschätzt sind. Sie schlägt vor, während der Testphase Besucherzahlen, tatsächliche Ausgaben, Nutzungsarten und Beschwerden zu dokumentieren. Nach drei Monaten gibt es einen Zwischenbericht, nach sechs Monaten eine öffentliche Auswertung. Eine endgültige Entscheidung über den vollständigen Umbau soll erst danach fallen. Damit ist die Testphase keine verdeckte Zusage für das Gesamtprojekt, sondern eine Möglichkeit, seine Wirkung anhand überprüfbarer Informationen zu beurteilen." },
    ],
    mainQuestion: "Welchen Zweck hat die Testphase vor allem?", mainAnswer: "Nutzung, Kosten und Auswirkungen vor einer endgültigen Entscheidung prüfen.", mainDistractors: ["Den vollständigen Umbau ohne weitere Diskussion garantieren.", "Alle Vereinsangebote dauerhaft aus dem Viertel verlegen."],
    detailQuestion: "Welche Maßnahme soll die Sorgen der Anwohnenden aufgreifen?", detailAnswer: "Größere Veranstaltungen ankündigen und Beschwerden über eine Kontaktstelle sammeln.", detailDistractors: ["Alle Veranstaltungen geheim halten.", "Rückmeldungen erst nach dem endgültigen Umbau zulassen."],
  },
];

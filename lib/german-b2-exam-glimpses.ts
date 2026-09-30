export type B2ExamGlimpse = {
  track: "goethe" | "telc";
  format: string;
  prompt: string;
  answer: string;
  distractors: [string, string];
  explanation: string;
};

// Short, original practice tasks in the core course. Full format training follows in each exam track.
export const germanB2ExamGlimpses: B2ExamGlimpse[] = [
  {
    track: "goethe", format: "Lesen · Kernaussage", prompt: "Ein Kursbericht sagt: ›Viele Teilnehmende verstehen Regeln, finden aber im Gespräch nicht schnell genug passende Wörter.‹ Was ist die Kernaussage?",
    answer: "Regelwissen allein reicht für flüssige Gespräche nicht aus.", distractors: ["Die Teilnehmenden kennen keine Grammatikregeln.", "Spontanes Sprechen ist für B2 unwichtig."],
    explanation: "Der Bericht unterscheidet zwischen vorhandenem Regelwissen und schnellem Wortabruf im Gespräch.",
  },
  {
    track: "telc", format: "Sprachbausteine · Relativsatz", prompt: "Ergänzen Sie: ›Die Kollegin, ___ ich gestern gesprochen habe, arbeitet jetzt in Berlin.‹",
    answer: "mit der", distractors: ["mit die", "deren"], explanation: "Nach ›mit‹ steht der Dativ; der Relativsatz bezieht sich auf ›die Kollegin‹.",
  },
  {
    track: "goethe", format: "Lesen · Haltung", prompt: "Ein Kommentar lautet: ›Flexible Arbeitszeiten schaffen Freiheit, solange gemeinsame Absprachen zuverlässig bleiben.‹ Welche Haltung vertritt die Person?",
    answer: "Sie befürwortet Flexibilität unter einer Bedingung.", distractors: ["Sie lehnt flexible Arbeitszeiten grundsätzlich ab.", "Sie hält Absprachen für überflüssig."],
    explanation: "›Solange‹ schränkt die positive Bewertung durch eine klare Bedingung ein.",
  },
  {
    track: "telc", format: "Sprachbausteine · Passiv", prompt: "Ergänzen Sie die Mitteilung: ›Das ehemalige Bürogebäude ___ derzeit zu Wohnungen umgebaut.‹",
    answer: "wird", distractors: ["ist", "hat"], explanation: "›Wird umgebaut‹ beschreibt eine laufende Handlung im Vorgangspassiv.",
  },
  {
    track: "goethe", format: "Hören · Sprecherhaltung", prompt: "In einem Gesundheitsbeitrag sagt eine Sprecherin: ›Kurze Pausen helfen mir. Bei dauerhafter Überlastung muss aber auch das Team die Arbeit anders verteilen.‹ Was meint sie?",
    answer: "Pausen helfen, lösen strukturelle Überlastung aber nicht allein.", distractors: ["Pausen sind bei der Arbeit immer schädlich.", "Nur einzelne Beschäftigte sind für Überlastung verantwortlich."],
    explanation: "Die Sprecherin verbindet einen persönlichen Nutzen mit einer Einschränkung auf Teamebene.",
  },
  {
    track: "telc", format: "Sprachbausteine · Infinitivgruppe", prompt: "Ergänzen Sie: ›Sie besucht einen Abendkurs, ___ ihre beruflichen Möglichkeiten zu verbessern.‹",
    answer: "um", distractors: ["ohne", "anstatt"], explanation: "›Um … zu‹ bezeichnet hier den Zweck des Kursbesuchs.",
  },
  {
    track: "goethe", format: "Schreiben · formelle Nachricht", prompt: "Sie können einen Bewerbungstermin nicht wahrnehmen. Welche Formulierung passt in eine formelle Nachricht?",
    answer: "Könnten wir den Termin auf Donnerstag verschieben? Über eine Rückmeldung würde ich mich freuen.",
    distractors: ["Ich komme nicht. Such dir einfach einen anderen Tag aus.", "Vielleicht bin ich da, vielleicht auch nicht; mal sehen."],
    explanation: "Die passende Antwort nennt eine konkrete Alternative und formuliert eine höfliche Bitte in der Sie-Form.",
  },
  {
    track: "telc", format: "Sprachbausteine · Wortverbindung", prompt: "Ergänzen Sie den Satz: ›Vor dem Kauf sollte man eine fundierte Entscheidung ___.‹",
    answer: "treffen", distractors: ["machen", "nehmen"], explanation: "Die feste Wortverbindung lautet ›eine Entscheidung treffen‹.",
  },
  {
    track: "goethe", format: "Lesen · Schlussfolgerung", prompt: "Eine Stadt testet ein Kombiticket. Erst nach sechs Monaten sollen Kosten und Fahrgastzahlen ausgewertet werden. Was lässt sich schließen?",
    answer: "Über eine dauerhafte Einführung ist noch nicht entschieden.", distractors: ["Das Ticket ist bereits dauerhaft eingeführt.", "Die Stadt verzichtet auf jede Auswertung."],
    explanation: "Die Entscheidung folgt erst auf die sechsmonatige Testphase und ihre Auswertung.",
  },
  {
    track: "telc", format: "Leseverstehen · Einschränkung", prompt: "Eine Schule erlaubt KI-Hilfen bei der Recherche, verlangt aber Quellenangaben und eigene Schlussfolgerungen. Welche Aussage stimmt?",
    answer: "Der Einsatz ist erlaubt, wenn die Lernenden ihre Arbeit nachvollziehbar machen.", distractors: ["KI-Hilfen sind in jeder Aufgabe verboten.", "Quellenangaben sind nicht mehr nötig."],
    explanation: "Die Erlaubnis ist an Bedingungen geknüpft: Quellenangaben und eigene Ergebnisse.",
  },
  {
    track: "goethe", format: "Lesen · berichtete Aussage", prompt: "Im Bericht steht: ›Die Stadtverwaltung erklärt, die Bibliothek sei nur wegen einer Renovierung geschlossen.‹ Was wird ausdrücklich als Aussage der Verwaltung wiedergegeben?",
    answer: "Die Schließung hängt mit einer Renovierung zusammen.", distractors: ["Die Bibliothek bleibt für immer geschlossen.", "Die Zeitung hat die Renovierung selbst beschlossen."],
    explanation: "Die Form ›sei‹ kennzeichnet die indirekte Wiedergabe der Erklärung.",
  },
  {
    track: "telc", format: "Sprachbausteine · Passivalternative", prompt: "Ergänzen Sie: ›Der Energieverbrauch ___ durch bessere Dämmung senken.‹",
    answer: "lässt sich", distractors: ["lässt ihn", "wird sich"], explanation: "›Lässt sich senken‹ ist eine passende Passivalternative mit der Bedeutung ›kann gesenkt werden‹.",
  },
  {
    track: "goethe", format: "Schreiben · Rezension", prompt: "Sie empfehlen eine Ausstellung trotz einer Schwäche. Welche Formulierung verbindet Bewertung und Einschränkung angemessen?",
    answer: "Obwohl einige Erklärungen knapp ausfallen, lohnt sich der Besuch wegen der vielfältigen Perspektiven.",
    distractors: ["Die Erklärungen sind knapp, also ist alles schlecht.", "Die Ausstellung ist gut, weil ich sie gut finde."],
    explanation: "Die Antwort nennt eine konkrete Schwäche und einen begründeten positiven Gesamteindruck.",
  },
  {
    track: "telc", format: "Leseverstehen · Vergleich", prompt: "Ein Kommentar fordert mehr öffentliche Treffpunkte, ein anderer verweist auf die Kosten. Welcher Punkt ist zwischen beiden Positionen strittig?",
    answer: "Ob der erwartete Nutzen die zusätzlichen Ausgaben rechtfertigt.", distractors: ["Ob Menschen sich überhaupt treffen dürfen.", "Ob Kosten bei öffentlichen Vorhaben immer null sind."],
    explanation: "Die Beiträge unterscheiden sich in der Bewertung von Nutzen und Aufwand.",
  },
  {
    track: "goethe", format: "Sprechen · Diskussion", prompt: "Ihr Gegenüber nennt ein berechtigtes Kostenargument. Welche Antwort führt die Diskussion konstruktiv weiter?",
    answer: "Den Einwand verstehe ich. Könnten wir zunächst eine begrenzte Testphase mit klaren Kostenregeln vereinbaren?",
    distractors: ["Das ist Unsinn; darüber rede ich nicht.", "Vielleicht. Mehr kann ich dazu nicht sagen."],
    explanation: "Die Antwort greift den Einwand auf und entwickelt einen überprüfbaren Vorschlag.",
  },
  {
    track: "telc", format: "Schreiben · angemessene Bitte", prompt: "Ein Workshop wurde kurzfristig verlegt. Welche Bitte passt in eine halbformelle Nachricht an den Veranstalter?",
    answer: "Könnten Sie mir einen Ersatztermin anbieten oder die Teilnahmegebühr erstatten?",
    distractors: ["Ihr müsst sofort alles zurückzahlen, sonst gibt es Ärger!", "Neuer Ort? Egal, ich komme vielleicht."],
    explanation: "Die Antwort formuliert zwei konkrete Lösungsmöglichkeiten in angemessenem Register.",
  },
  {
    track: "goethe", format: "Sprechen · Kurzvortrag", prompt: "Sie stellen zwei Angebote für den Stadtteil vor. Welche Reihenfolge macht Ihren Kurzvortrag am klarsten?",
    answer: "Thema nennen, beide Möglichkeiten erläutern, bewerten und einen Vorschlag begründen.",
    distractors: ["Nur den Vorschlag nennen und sofort schließen.", "Viele Einzelheiten aufzählen, ohne die Angebote zu vergleichen."],
    explanation: "Ein klarer Vortrag führt vom Thema über den Vergleich zur begründeten Empfehlung.",
  },
  {
    track: "telc", format: "Sprechen · gemeinsam planen", prompt: "Sie planen mit einer Partnerperson ein Stadtteilprojekt. Welche Äußerung unterstützt eine gemeinsame Entscheidung?",
    answer: "Wenn Sie die Werbung übernehmen, kann ich den Raum organisieren. Passt diese Aufteilung für Sie?",
    distractors: ["Ich entscheide allein; Sie müssen nur zustimmen.", "Wir sollten vielleicht irgendwann irgendetwas machen."],
    explanation: "Die Antwort verteilt konkrete Aufgaben und lädt die Partnerperson zur Abstimmung ein.",
  },
];

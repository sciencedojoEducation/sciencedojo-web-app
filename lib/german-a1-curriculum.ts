/** The target learning route for the adult German A1 course. The legacy numbers
 * identify reusable source material; they are not the learner-facing sequence. */
export type GermanA1Skill = "hoeren" | "lesen" | "schreiben" | "sprechen";
export type GermanA1Exam = "goethe" | "telc";

export type GermanA1CurriculumChapter = {
  number: number;
  title: string;
  legacyChapters: number[];
  legacyReviews?: string[];
  outcome: string;
  vocabulary: string[];
  grammarInContext: string[];
  readingText: string;
  listeningSituation: string;
  writingTask: string;
  speakingTask: string;
  realLifeChallenge: string;
};

export const germanA1Curriculum: GermanA1CurriculumChapter[] = [
  {
    number: 1, title: "Laute, Alphabet und Buchstabieren", legacyChapters: [1],
    outcome: "Namen, Zahlen und Kontaktdaten hören, buchstabieren und bestätigen.",
    vocabulary: ["Buchstaben", "Zahlen", "Kontaktdaten", "Kursraum-Sprache"],
    grammarInContext: ["du/Sie in Rückfragen"],
    readingText: "Kursanmeldung", listeningSituation: "Anmeldung mit buchstabiertem Namen und Telefonnummer",
    writingTask: "Kontaktdaten in ein Formular eintragen", speakingTask: "Namen und Telefonnummer deutlich nennen",
    realLifeChallenge: "Eine Anmeldung abschließen und bei Unklarheit um Wiederholung bitten",
  },
  {
    number: 2, title: "Hallo! Sich vorstellen", legacyChapters: [2],
    outcome: "Ein kurzes Kennenlerngespräch über Name, Herkunft, Wohnort, Alter und Sprachen führen.",
    vocabulary: ["Begrüßungen", "Länder", "Sprachen", "persönliche Angaben"],
    grammarInContext: ["ich/du/Sie", "sein", "heißen/kommen/wohnen/sprechen", "W-Fragen"],
    readingText: "Vorstellungskarte", listeningSituation: "Zwei Erwachsene treffen sich im Sprachkurs",
    writingTask: "Eine kurze Selbstvorstellung verfassen", speakingTask: "Sich vorstellen und eine Frage stellen",
    realLifeChallenge: "Eine neue Person im Kurs kennenlernen",
  },
  {
    number: 3, title: "Menschen und Familie", legacyChapters: [3, 8, 9, 26],
    outcome: "Menschen und Beziehungen mit Namen, Alter und einfachen Eigenschaften beschreiben.",
    vocabulary: ["Familie", "Beziehungen", "Personenbeschreibung", "häufige Pluralformen"],
    grammarInContext: ["mein/dein/sein/ihr", "er/sie", "haben", "Artikel und Plural im Satz"],
    readingText: "Familienprofil", listeningSituation: "Gespräch über Geschwister und Kinder",
    writingTask: "Ein echtes oder erfundenes Familienprofil schreiben", speakingTask: "Zwei Personen vorstellen",
    realLifeChallenge: "Ein Foto oder Profil verständlich erklären",
  },
  {
    number: 4, title: "Mein Tag, Uhrzeit und Datum", legacyChapters: [12, 10, 11, 4, 28, 32],
    outcome: "Einen Tagesablauf schildern und Zeiten, Daten und Regelmäßigkeit verstehen.",
    vocabulary: ["Tagesablauf", "Uhrzeit", "Wochentage", "Monate", "Datum"],
    grammarInContext: ["Präsens", "trennbare Verben", "am/um/im/von … bis"],
    readingText: "Kursplan und Kalender", listeningSituation: "Absprachen über Kursbeginn und Tagesablauf",
    writingTask: "Eine kurze Nachricht mit Zeit und Treffpunkt schreiben", speakingTask: "Den eigenen oder einen erfundenen Tagesablauf erzählen",
    realLifeChallenge: "Einen passenden Kurstermin finden",
  },
  {
    number: 5, title: "Wohnen und Zuhause", legacyChapters: [16, 17, 6, 25],
    outcome: "Eine Wohnung und die Lage einfacher Gegenstände beschreiben.",
    vocabulary: ["Zimmer", "Möbel", "Wohnen", "Miete", "Lage"],
    grammarInContext: ["der/die/das und ein/eine", "es gibt", "kein/nicht", "häufige Ortsangaben"],
    readingText: "Wohnungsanzeige", listeningSituation: "Kurze Wohnungsbesichtigung",
    writingTask: "Eine einfache Wohnungsanfrage schreiben", speakingTask: "Ein Zimmer und seine Möbel beschreiben",
    realLifeChallenge: "Eine passende Wohnung oder ein Zimmer auswählen und nachfragen",
  },
  {
    number: 6, title: "Essen und Trinken", legacyChapters: [14, 7],
    outcome: "Essen bestellen, Mengen nennen, Preise verstehen und Wünsche höflich ausdrücken.",
    vocabulary: ["Lebensmittel", "Mahlzeiten", "Getränke", "Mengen", "Restaurant"],
    grammarInContext: ["möchten", "gern", "einen/eine/ein in Bestellungen"],
    readingText: "Speisekarte", listeningSituation: "Bestellung und Rechnung im Café",
    writingTask: "Eine kurze Essensbestellung oder Einladung beantworten", speakingTask: "Ein Essen bestellen und nach dem Preis fragen",
    realLifeChallenge: "Im Café bestellen, eine Rückfrage klären und bezahlen",
  },
  {
    number: 7, title: "Einkaufen und Kleidung", legacyChapters: [15],
    outcome: "Nach Kleidung, Größe, Farbe und Preis fragen und einen Kauf entscheiden.",
    vocabulary: ["Kleidung", "Farben", "Größen", "Geschäfte", "Geld"],
    grammarInContext: ["kosten", "brauchen", "diese/dieser/dieses als feste Fragen"],
    readingText: "Geschäftsanzeige", listeningSituation: "Gespräch über Größe und Preis",
    writingTask: "Eine kurze Anfrage zu einem Artikel schreiben", speakingTask: "Im Geschäft nach Farbe und Größe fragen",
    realLifeChallenge: "Einen passenden Artikel finden und bezahlen",
  },
  {
    number: 8, title: "Stadt und Dienstleistungen", legacyChapters: [18, 27, 31],
    outcome: "In der Stadt Orte finden, nach dem Weg fragen und einfache Bitten verstehen.",
    vocabulary: ["Stadtorte", "Wegbeschreibung", "Post", "Bank", "Polizei"],
    grammarInContext: ["Wo ist …?", "häufige Präpositionen als Wendungen", "höflicher Imperativ"],
    readingText: "Öffnungszeiten und Schilder", listeningSituation: "Wegbeschreibung und Auskunft am Schalter",
    writingTask: "Eine kurze Weg- oder Serviceanfrage schreiben", speakingTask: "Nach dem Weg fragen und eine einfache Bitte formulieren",
    realLifeChallenge: "Einen Terminort erreichen und am Schalter um Hilfe bitten",
  },
  {
    number: 9, title: "Reisen und Verkehr", legacyChapters: [19, 13],
    outcome: "Fahrpläne verstehen, ein Ticket kaufen und nach Reiseinformationen fragen.",
    vocabulary: ["Verkehrsmittel", "Fahrkarten", "Bahnhof", "Unterkunft", "Gepäck"],
    grammarInContext: ["können/müssen/wollen", "mit dem Bus/Zug", "abfahren/ankommen"],
    readingText: "Fahrplan und Unterkunftsanzeige", listeningSituation: "Bahnhofsansage und Ticketgespräch",
    writingTask: "Eine kurze Nachricht über eine Verspätung schreiben", speakingTask: "Fahrkarte und Abfahrtszeit erfragen",
    realLifeChallenge: "Eine Reise planen und auf eine Verspätung reagieren",
  },
  {
    number: 10, title: "Arbeit, Schule und Lernen", legacyChapters: [20],
    outcome: "Über Arbeit, Ausbildung, Kurszeiten und einfache Fähigkeiten sprechen.",
    vocabulary: ["Berufe", "Arbeitsplatz", "Schule", "Kurs", "Sprachenlernen"],
    grammarInContext: ["Präsens im Beruf", "können/müssen", "formelle Fragen"],
    readingText: "Kursinformation oder Arbeitsplan", listeningSituation: "Anmeldung zu einem Kurs oder Gespräch über Arbeit",
    writingTask: "Eine Kursanfrage schreiben", speakingTask: "Beruf und Lernziel kurz erklären",
    realLifeChallenge: "Einen geeigneten Kurs oder Arbeitstermin auswählen",
  },
  {
    number: 11, title: "Freizeit und soziale Kontakte", legacyChapters: [21, 30],
    outcome: "Vorlieben äußern, eine Einladung verstehen und ein Treffen vereinbaren.",
    vocabulary: ["Hobbys", "Sport", "Internet", "Medien", "Einladungen"],
    grammarInContext: ["gern/lieber", "und/aber/oder", "möchten"],
    readingText: "Einladung und Veranstaltungshinweis", listeningSituation: "Zwei Personen verabreden sich",
    writingTask: "Eine Einladung annehmen oder höflich absagen", speakingTask: "Ein Hobby nennen und ein Treffen vereinbaren",
    realLifeChallenge: "Ein gemeinsames Freizeitprogramm planen",
  },
  {
    number: 12, title: "Gesundheit und Alltagsprobleme", legacyChapters: [23],
    outcome: "Einfache Beschwerden nennen, Hilfe erbitten und Anweisungen verstehen.",
    vocabulary: ["Körper", "Beschwerden", "Arzt", "Apotheke", "Hilfe"],
    grammarInContext: ["haben und wehtun", "müssen/sollen als feste Ratschläge", "höfliche Bitten"],
    readingText: "Praxisschild oder Apothekenhinweis", listeningSituation: "Termin und Beschwerden in der Praxis",
    writingTask: "Eine kurze Terminabsage wegen Krankheit schreiben", speakingTask: "Eine Beschwerde beschreiben und um Hilfe bitten",
    realLifeChallenge: "Einen Arzttermin organisieren",
  },
  {
    number: 13, title: "Wetter, Umwelt und Pläne", legacyChapters: [22],
    outcome: "Wetter verstehen und einfache Pläne für die nächsten Tage besprechen.",
    vocabulary: ["Wetter", "Jahreszeiten", "Natur", "Aktivitäten"],
    grammarInContext: ["es regnet/ist sonnig", "Präsens für Zukunft mit morgen/am Wochenende"],
    readingText: "Wetterbericht", listeningSituation: "Wettervorhersage und Wochenendplan",
    writingTask: "Einen Plan passend zum Wetter schreiben", speakingTask: "Wetter und nächsten Plan beschreiben",
    realLifeChallenge: "Eine Aktivität bei wechselndem Wetter vereinbaren",
  },
  {
    number: 14, title: "Nachrichten, Formulare und Termine", legacyChapters: [24, 5],
    outcome: "Alltagsformulare ausfüllen und auf kurze Nachrichten, Einladungen und Termine reagieren.",
    vocabulary: ["Formularfelder", "Schilder", "E-Mail", "Termin", "Antworten"],
    grammarInContext: ["W-Fragen und Verbposition", "formelle und informelle Anrede", "am/um/von … bis"],
    readingText: "Formular, Kurznachricht und Schild", listeningSituation: "Telefonnotiz mit Terminänderung",
    writingTask: "Ein Formular ausfüllen und eine Nachricht mit drei Inhaltspunkten schreiben", speakingTask: "Einen Termin vereinbaren oder verschieben",
    realLifeChallenge: "Auf eine Terminänderung schriftlich und mündlich reagieren",
  },
  {
    number: 15, title: "A1 Alltagstraining und Abschluss", legacyChapters: [],
    legacyReviews: ["review-grundlagen", "review-alltag", "review-stadt", "review-leben", "review-grammatik"],
    outcome: "Die vier Fertigkeiten in mehreren Alltagssituationen verbinden und Lücken gezielt schließen.",
    vocabulary: ["häufige A1-Wörter", "Prüfungsanweisungen", "Rückfragen"],
    grammarInContext: ["Präsens", "Artikel", "Akkusativ in Wendungen", "Modalverben", "Negation", "Zeit und Ort"],
    readingText: "Gemischte Anzeigen, E-Mails und Formulare", listeningSituation: "Gemischte Dialoge, Ansagen und Nachrichten",
    writingTask: "Ein Formular und eine kurze Mitteilung bearbeiten", speakingTask: "Sich vorstellen, Fragen stellen und auf Bitten reagieren",
    realLifeChallenge: "Einen vollständigen A1 Alltagstag bewältigen",
  },
];

export const germanA1DeferredGrammar = [
  { legacyChapter: 29, topic: "Perfekt", reason: "Für die A1 Kernroute sind einfache Zeitangaben im Präsens wichtiger; Perfekt bleibt als freiwillige Erweiterung." },
];

export const germanA1ExamTracks: Record<GermanA1Exam, {
  title: string;
  officialPracticeUrl: string;
  officialFormatUrl: string;
  timing: { listening: string; readingWriting: string; speaking: string; preparation: string };
  parts: Record<GermanA1Skill, string[]>;
  stages: string[];
}> = {
  goethe: {
    title: "Goethe-Zertifikat A1: Start Deutsch 1",
    officialPracticeUrl: "https://www.goethe.de/ins/de/en/prf/prf/gzsd1/ueb.html",
    officialFormatUrl: "https://www.goethe.de/pro/relaunch/prf/materialien/A1_sd1/sd_1_modellsatz.pdf",
    timing: { listening: "ca. 20 Minuten", readingWriting: "Lesen 25 Minuten, Schreiben 20 Minuten", speaking: "ca. 15 Minuten als Gruppenprüfung", preparation: "keine Vorbereitungszeit" },
    parts: {
      hoeren: ["Teil 1", "Teil 2", "Teil 3"],
      lesen: ["Teil 1", "Teil 2", "Teil 3"],
      schreiben: ["Teil 1", "Teil 2"],
      sprechen: ["Teil 1", "Teil 2", "Teil 3"],
    },
    stages: ["Orientierung", "Hören", "Lesen", "Schreiben", "Sprechen", "Modelltraining", "Auswertung und offizielle Übung"],
  },
  telc: {
    title: "Start Deutsch 1 / telc Deutsch A1",
    officialPracticeUrl: "https://www.telc.net/en/language-examinations/certificate-exams/german/start-german1-telc-german-a1/",
    officialFormatUrl: "https://www.telc.net/en/language-examinations/certificate-exams/german/start-german1-telc-german-a1/",
    timing: { listening: "ca. 20 Minuten", readingWriting: "Lesen und Schreiben zusammen 45 Minuten", speaking: "ca. 15 Minuten, normalerweise vier Teilnehmende", preparation: "keine Vorbereitungszeit" },
    parts: {
      hoeren: ["Teil 1", "Teil 2", "Teil 3"],
      lesen: ["Teil 1", "Teil 2", "Teil 3"],
      schreiben: ["Teil 1", "Teil 2"],
      sprechen: ["Teil 1", "Teil 2", "Teil 3"],
    },
    stages: ["Orientierung", "Hören", "Lesen", "Schreiben", "Sprechen", "Modelltraining", "Auswertung und offizieller Übungstest"],
  },
};

export const germanA1CurriculumSources = {
  cefr: "https://www.coe.int/en/web/portfolio/the-common-european-framework-of-reference-for-languages-learning-teaching-assessment-cefr-",
  goetheVocabulary: "https://www.goethe.de/pro/relaunch/prf/de/A1_SD1_Wortliste_02.pdf",
  goethePractice: germanA1ExamTracks.goethe.officialPracticeUrl,
  telcPractice: germanA1ExamTracks.telc.officialPracticeUrl,
};

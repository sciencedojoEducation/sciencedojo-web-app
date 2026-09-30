export type B2GrammarPractice = {
  prompt: string;
  answer: string;
  distractors: [string, string];
  explanation: string;
};

export const germanB2GrammarPractice: B2GrammarPractice[] = [
  {
    prompt: "Welche Wortstellung ist korrekt, wenn der Nebensatz am Anfang steht?",
    answer: "Obwohl ich wenig Zeit habe, lese ich jeden Tag einen Artikel.",
    distractors: ["Obwohl ich habe wenig Zeit, lese ich jeden Tag einen Artikel.", "Obwohl ich wenig Zeit habe, ich lese jeden Tag einen Artikel."],
    explanation: "Im obwohl-Satz steht das finite Verb am Ende; nach dem vorangestellten Nebensatz folgt im Hauptsatz direkt das Verb.",
  },
  {
    prompt: "Welche Form passt? ›Ich spreche mit einem ___ Kollegen, der seit Jahren in Berlin arbeitet.‹",
    answer: "erfahrenen", distractors: ["erfahrener", "erfahrenem"],
    explanation: "Nach ›mit einem‹ steht Dativ Singular maskulin; das Adjektiv erhält die Endung -en.",
  },
  {
    prompt: "Welche Fortsetzung bildet einen korrekten Vergleich? ›Je flexibler die Arbeitszeit ist, …‹",
    answer: "desto leichter lassen sich private Termine planen.", distractors: ["desto leichter private Termine lassen sich planen.", "weil leichter lassen sich private Termine planen."],
    explanation: "Auf ›je‹ folgt ›desto‹ mit Komparativ und einem Hauptsatz mit korrekter Verbposition.",
  },
  {
    prompt: "Welche Form beschreibt den laufenden Umbau eines Gebäudes?",
    answer: "Das Gebäude wird zu Wohnungen umgebaut.", distractors: ["Das Gebäude ist zu Wohnungen umgebaut.", "Das Gebäude hat zu Wohnungen umgebaut."],
    explanation: "›Wird umgebaut‹ ist Vorgangspassiv; ›ist umgebaut‹ würde den erreichten Zustand bezeichnen.",
  },
  {
    prompt: "Welche Aussage formuliert eine vorsichtige Vermutung statt einer Verpflichtung?",
    answer: "Die kürzeren Pausen dürften den Stress etwas verringern.", distractors: ["Die kürzeren Pausen müssen den Stress verringern.", "Die kürzeren Pausen sollen den Stress verringert."],
    explanation: "›Dürften‹ kann eine vorsichtige Vermutung ausdrücken; ›müssen‹ bezeichnet hier starke Notwendigkeit.",
  },
  {
    prompt: "Welche Infinitivgruppe nennt das Ziel des Kurses?",
    answer: "Sie besucht den Kurs, um ihre Kenntnisse zu vertiefen.", distractors: ["Sie besucht den Kurs, ohne ihre Kenntnisse zu vertiefen.", "Sie besucht den Kurs, anstatt ihre Kenntnisse zu vertiefen."],
    explanation: "›Um … zu‹ nennt den Zweck; ›ohne … zu‹ und ›anstatt … zu‹ haben andere Bedeutungen.",
  },
  {
    prompt: "Welche Bitte ist in einer formellen Nachricht an die Vorgesetzte angemessen?",
    answer: "Könnten Sie mir die Änderung des Dienstplans bitte bestätigen?",
    distractors: ["Du bestätigst mir die Änderung sofort.", "Bestätige mir schnell die Änderung!"],
    explanation: "Konjunktiv II, Sie-Form und eine konkrete Bitte passen zum formellen Register.",
  },
  {
    prompt: "Welche feste Verbindung passt in den Satz? ›Vor dem Kauf sollte man eine fundierte Entscheidung ___.‹",
    answer: "treffen", distractors: ["machen", "setzen"],
    explanation: "Die idiomatische Verbindung lautet ›eine Entscheidung treffen‹.",
  },
  {
    prompt: "Wodurch ersetzt man ›von der Finanzierung‹ im Satz ›Das Projekt hängt von der Finanzierung ab‹?",
    answer: "davon", distractors: ["darauf", "damit"],
    explanation: "Für eine Sache ersetzt ›davon‹ die Ergänzung mit ›von‹: ›Das Projekt hängt davon ab.‹",
  },
  {
    prompt: "Welche Verbindung räumt einen Gegensatz ein und hat die richtige Wortstellung?",
    answer: "Obwohl digitale Hilfen nützlich sind, sollten ihre Ergebnisse geprüft werden.",
    distractors: ["Obwohl digitale Hilfen sind nützlich, sollten ihre Ergebnisse geprüft werden.", "Digitale Hilfen sind nützlich, obwohl sollten ihre Ergebnisse geprüft werden."],
    explanation: "›Obwohl‹ leitet einen Nebensatz mit Endstellung des finiten Verbs ein.",
  },
  {
    prompt: "Welche Form markiert eine berichtete Aussage im Konjunktiv I?",
    answer: "Die Redaktion berichtet, die Bibliothek sei vorübergehend geschlossen.",
    distractors: ["Die Redaktion berichtet, die Bibliothek wäre vorübergehend geschlossen gewesen sei.", "Die Redaktion berichtet, sei die Bibliothek vorübergehend geschlossen ist."],
    explanation: "›Sei‹ zeigt, dass die Redaktion eine fremde Aussage indirekt wiedergibt.",
  },
  {
    prompt: "Welche Form ist eine passende Passivalternative zu ›Die Kosten können gesenkt werden‹?",
    answer: "Die Kosten lassen sich senken.", distractors: ["Die Kosten lassen senken sich.", "Die Kosten sind sich senken."],
    explanation: "›Sich lassen + Infinitiv‹ kann eine Möglichkeit ausdrücken, ähnlich wie ›können + Passiv‹.",
  },
  {
    prompt: "Welche Form bezeichnet Bilder, die bereits sorgfältig gestaltet wurden?",
    answer: "die sorgfältig gestalteten Bilder", distractors: ["die sorgfältig gestaltenden Bilder", "die sorgfältig gestaltete Bilder"],
    explanation: "Partizip II bezeichnet hier das Ergebnis; nach bestimmtem Artikel im Plural steht die Adjektivendung -en.",
  },
  {
    prompt: "Welche Formulierung räumt einen Einwand ein, ohne die Hauptaussage aufzugeben?",
    answer: "Obwohl die Testphase Geld kostet, kann sie wichtige Erfahrungen liefern.",
    distractors: ["Weil die Testphase Geld kostet, aber kann sie Erfahrungen liefern.", "Die Testphase Geld kostet, trotzdem sie Erfahrungen liefern kann."],
    explanation: "›Obwohl‹ markiert die Einräumung; der folgende Hauptsatz behält die normale Verbzweitstellung.",
  },
  {
    prompt: "Welche Aussage signalisiert eine vorsichtige, begründete Position?",
    answer: "Meines Erachtens wäre eine begrenzte Testphase sinnvoll.", distractors: ["Es ist ohne Zweifel die einzig mögliche Lösung!", "Die Testphase sinnvoll meines Erachtens wäre."],
    explanation: "›Meines Erachtens‹ und Konjunktiv II schwächen die Behauptung angemessen ab; das finite Verb steht an zweiter Stelle.",
  },
  {
    prompt: "Welche Umformung nutzt Nominalstil, ohne den Grund zu verändern? ›Weil die Lieferung verspätet war, bitte ich um Ersatz.‹",
    answer: "Aufgrund der verspäteten Lieferung bitte ich um Ersatz.",
    distractors: ["Trotz der verspäteten Lieferung bitte ich um Ersatz.", "Wegen die Lieferung verspätet bitte ich um Ersatz."],
    explanation: "›Aufgrund der verspäteten Lieferung‹ erhält die kausale Beziehung und bildet eine korrekte Nominalgruppe.",
  },
  {
    prompt: "Welche Nachfrage hilft, eine unklare Aussage in einer Diskussion zu klären?",
    answer: "Darf ich kurz nachfragen, was Sie mit ›praktisch‹ meinen?",
    distractors: ["Praktisch heißt bestimmt genau das, was ich sage.", "Sie dürfen Ihren Punkt nicht weiter erklären."],
    explanation: "Eine höfliche Nachfrage prüft das Verständnis und hält das Gespräch offen.",
  },
  {
    prompt: "Welche Verbindung stellt Bericht und Interview klar gegenüber?",
    answer: "Während der Bericht die Kosten betont, hebt das Interview den sozialen Nutzen hervor.",
    distractors: ["Während der Bericht betont die Kosten, hebt das Interview den sozialen Nutzen hervor.", "Während der Bericht die Kosten betont, das Interview hebt den sozialen Nutzen hervor."],
    explanation: "Im während-Nebensatz steht das Verb am Ende; nach dem Nebensatz folgt im Hauptsatz das finite Verb.",
  },
];

import { migrateAcademyCourse } from "./academy-schema.ts";
import { germanB2Chapters, type B2Chapter } from "./german-b2-curriculum.ts";
import { germanB2Lexicon } from "./german-b2-lexicon.ts";
import { germanB2AdvancedListening } from "./german-b2-advanced-listening.ts";
import type { AcademyCourse, AcademyLesson, LessonBlock, QuizQuestion } from "./tutor-academy.ts";

export const GERMAN_B2_COURSE_KEY = "german-b2-complete";
const goetheUrl = "https://www.goethe.de/en/spr/prf/ueb/pb2.html";
const telcUrl = "https://www.telc.net/en/language-examinations/certificate-exams/german/telc-german-b2/";
const n = (index: number) => String(index + 1).padStart(2, "0");
const block = (prefix: string, suffix: string) => `${prefix}-${suffix}`;

function choice(id: string, prompt: string, answer: string, wrong: [string, string], explanation: string): QuizQuestion {
  return {
    id, type: "single-choice", prompt,
    options: [
      { id: "a", label: wrong[0] },
      { id: "b", label: answer },
      { id: "c", label: wrong[1] },
    ],
    correctOptionId: "b", explanation,
  };
}

const sections = [
  { id: "b2-bridge", title: "Von B1 zu B2" },
  { id: "b2-life", title: "Leben und Gesellschaft" },
  { id: "b2-work", title: "Bildung und Beruf" },
  { id: "b2-ideas", title: "Ideen, Medien und Argumente" },
  { id: "b2-communication", title: "Fortgeschrittene Kommunikation" },
  { id: "b2-mastery", title: "B2 in der Praxis" },
  { id: "b2-goethe", title: "Goethe-Zertifikat B2" },
  { id: "b2-telc", title: "telc Deutsch B2" },
];

const grammarSpine = [
  "B1-Brücke: Wiederholen Sie Fälle, Präsens, Perfekt, Präteritum und Plusquamperfekt. Stellen Sie in einem Nebensatz das finite Verb ans Ende; prüfen Sie danach die Verbposition im folgenden Hauptsatz.",
  "N-Deklination: der Kollege → mit dem Kollegen; der Student → die Meinung des Studenten. Verbinden Sie eine Personenbeschreibung mit einem Relativsatz samt Präposition.",
  "Vergleich: je … desto, sowohl … als auch und weder … noch. Formen Sie eine verbale Aussage zusätzlich in eine Nominalgruppe um.",
  "Vorgangspassiv: Die Stadt baut das Haus um. → Das Haus wird umgebaut. Zustandspassiv: Nach dem Umbau ist das Haus geöffnet. Prüfen Sie, ob Handlung oder Zustand gemeint ist.",
  "Konjunktiv II: Wenn die Schichten kürzer wären, hätten mehr Menschen Zeit für Pausen. Mit dürfte lässt sich eine vorsichtige Vermutung formulieren.",
  "Infinitivgruppen: um … zu nennt ein Ziel; ohne … zu nennt das Ausbleiben einer Handlung; anstatt … zu nennt eine Alternative. Achten Sie auf das gemeinsame Subjekt.",
  "Formelles Register: würden/könnten statt direkter Forderungen. Wiederholen Sie Vorgangspassiv und den Unterschied zwischen persönlicher und unpersönlicher Formulierung.",
  "Kausal und konzessiv: weil/da nennt einen Grund; obwohl räumt einen Gegensatz ein. Funktionsverbgefüge wie eine Entscheidung treffen tragen oft formellen Stil.",
  "Präpositionalverben: abhängen von, sich einstellen auf. Ersetzen Sie eine Sache mit davon/darauf; bei Personen bleibt die Präposition mit Pronomen erhalten.",
  "Korrelative Strukturen: einerseits … andererseits und zwar … aber. Setzen Sie dennoch in einen Hauptsatz und obwohl in einen Nebensatz.",
  "Indirekte Rede: Er sagt, die Bibliothek sei geöffnet. Konjunktiv I kennzeichnet die Wiedergabe; ist die Form identisch, kann eine Ersatzform nötig sein.",
  "Passivalternativen: Die Kosten können gesenkt werden. → Die Kosten lassen sich senken. Mit sodass beschreiben Sie eine Folge.",
  "Partizipien als Adjektive: die beeindruckende Ausstellung; die sorgfältig gestalteten Bilder. Unterscheiden Sie laufende Handlung und abgeschlossenes Ergebnis.",
  "Wortbildung: Teilhabe, teilnehmen, Teilnehmerin. Nutzen Sie trotz und obwohl passend; vergleichen Sie außerdem nicht nur … sondern auch.",
  "Diskursmarker und Abschwächung: meines Erachtens, vermutlich, allerdings. Formulieren Sie einen Einwand fair, bevor Sie ihm widersprechen.",
  "Nominalstil und Kohäsion: weil die Lieferung spät kam → aufgrund der verspäteten Lieferung. Beziehen Sie sich mit diese Entscheidung eindeutig auf den vorigen Satz.",
  "Zeitliche Verknüpfung und Gesprächsführung: nachdem, bevor, während. Verwenden Sie Verweiswörter wie dazu oder darauf nur mit klarem Bezug.",
  "Konsolidierung: Vergleichen Sie Bericht und Interview mit während, sodass und dennoch. Wählen Sie Register, Tempus und Wortverbindung nach Kommunikationsziel.",
];

const speakingModels = [
  "Mein wichtigstes Ziel ist, in längeren Gesprächen klarer zu argumentieren. Dafür lese ich jede Woche einen Kommentar und fasse seine Position mündlich zusammen. Danach nehme ich eine eigene Antwort auf und verbessere unklare Stellen.",
  "Eine frühere Kollegin hat mich geprägt, weil sie auch in schwierigen Situationen aufmerksam zuhörte. Von ihr habe ich gelernt, Kritik sachlich zu formulieren und zuerst nachzufragen, bevor ich eine Entscheidung bewerte.",
  "Früher plante ich jede Stunde fest. Heute halte ich einige Zeiten frei, damit Unerwartetes Platz hat. Ein klarer Plan hilft mir zwar, aber zu viel Planung kann ebenfalls Druck erzeugen.",
  "In meiner Stadt könnten leer stehende Bürohäuser zu Wohnungen werden. Das schafft Wohnraum, kann aber Mieten im Viertel beeinflussen. Deshalb sollten bezahlbare Wohnungen und öffentliche Räume verbindlich vorgesehen werden.",
  "Eine kurze Pause nach langen Besprechungen hilft mir, konzentriert zu bleiben. Das ist jedoch nur möglich, wenn die Arbeitsabläufe solche Pausen zulassen. Bei dauerhafter Überlastung muss auch das Team die Aufgabenverteilung prüfen.",
  "Ich möchte meine digitalen Fähigkeiten vertiefen, damit ich Informationen zuverlässiger prüfen kann. Ein Kurs mit gemeinsamen Treffen wäre für mich geeignet, weil ich dort Fragen stellen und anschließend selbstständig weiterüben könnte.",
  "In meinem Wunschberuf sind Fachkenntnisse wichtig, aber auch klare Kommunikation. Wer Verantwortung übernimmt, sollte Termine zuverlässig einhalten und Probleme frühzeitig ansprechen, statt auf eine perfekte Lösung zu warten.",
  "Vor einem größeren Kauf vergleiche ich nicht nur den Preis. Ich prüfe auch Reparaturmöglichkeiten und laufende Kosten. Ein günstiges Gerät kann langfristig teuer werden, wenn Ersatzteile schwer zu bekommen sind.",
  "Für eine kurze Reise ist der Zug oft praktisch, weil ich unterwegs arbeiten kann. Bei mehreren Umstiegen steigt allerdings das Risiko einer Verspätung. Deshalb vergleiche ich vor der Buchung Zeit, Preis und Alternativen.",
  "Ich würde Smartphones im Unterricht nicht vollständig verbieten. Sie können beim Recherchieren helfen, sofern klare Regeln gelten. Gleichzeitig müssen Lernende Quellen überprüfen und wissen, welche persönlichen Daten gespeichert werden.",
  "Eine zuverlässige Nachricht nennt eine überprüfbare Quelle und trennt Fakten von Meinung. Wenn ein Beitrag überraschend klingt, schaue ich auf Datum und Ursprung, bevor ich ihn weitergebe.",
  "Individuelle Entscheidungen können Ressourcen sparen, aber ihre Wirkung hängt vom Umfeld ab. Ein guter öffentlicher Verkehr erleichtert etwa den Verzicht auf das Auto. Deshalb sollten persönliche und politische Maßnahmen zusammen gedacht werden.",
  "Die Ausstellung hat mich vor allem durch die Stimmen älterer Bewohner beeindruckt. Einige technische Erklärungen waren allerdings zu knapp. Trotzdem würde ich sie empfehlen, weil sie Stadtgeschichte aus einer ungewohnten Perspektive zeigt.",
  "In vielen Städten wird öffentlicher Raum neu verteilt. Das bietet Chancen für Begegnungen, führt aber auch zu Konflikten. Entscheidend ist, dass verschiedene Gruppen gehört und Kosten nachvollziehbar erklärt werden.",
  "Ich befürworte eine begrenzte Sonntagsöffnung der Bibliothek. Berufstätige hätten mehr Lernzeit. Ihr Einwand zu den Beschäftigten ist berechtigt; deshalb schlage ich eine freiwillige Testphase mit anschließender Auswertung vor.",
  "Bei einer formellen Nachricht nenne ich zuerst den Anlass und dann die konkreten Folgen. Anschließend formuliere ich eine höfliche Bitte. Umgangssprachliche Vorwürfe vermeide ich, damit mein Anliegen sachlich und lösbar bleibt.",
  "Zunächst möchte ich zwei Möglichkeiten vorstellen: einen offenen Lernabend und eine digitale Gruppe. Der Lernabend fördert den persönlichen Austausch, die digitale Gruppe ist flexibler. Für unseren Stadtteil würde ich eine Kombination testen.",
  "Ich empfehle eine sechsmonatige Testphase für das Begegnungszentrum. Vereine brauchen Räume, während Anwohner Verkehr befürchten. Deshalb sollten Kosten, Besucherzahlen und Beschwerden regelmäßig veröffentlicht werden.",
];

const communicationFunctions = [
  "set goals and explain strategies", "describe and compare people", "compare lifestyles", "evaluate a proposal",
  "give cautious advice", "recommend a learning route", "make a formal request", "evaluate consumer choices",
  "explain consequences", "weigh advantages and disadvantages", "report and verify claims", "recommend measures",
  "review and evaluate", "mediate perspectives", "argue and counterargue", "complain and request a solution",
  "present and negotiate", "synthesize and recommend",
];
const chapterDomains: Array<NonNullable<LessonBlock["curriculum"]>["domain"]> = [
  "educational", "personal", "personal", "public", "personal", "educational", "occupational", "public", "public",
  "public", "public", "public", "public", "public", "public", "occupational", "public", "public",
];

function blockSkills(item: LessonBlock): NonNullable<LessonBlock["curriculum"]>["skills"] {
  const heading = "heading" in item ? item.heading : undefined;
  if (item.type === "audio") return ["listening"];
  if (item.type === "writing-practice") return ["writing"];
  if (item.type === "speaking-practice") return ["speaking"];
  if (item.type === "flashcards") return ["vocabulary"];
  if (heading?.includes("Wortfamilie") || heading?.includes("Register") || heading?.includes("Redemittel")) return ["vocabulary"];
  if (item.type === "worked-example") return ["grammar"];
  if (item.type === "process") return ["interaction", "mediation"];
  if (item.type === "knowledge-check") {
    if (heading?.includes("Hör")) return ["listening"];
    if (heading?.includes("Wortschatz")) return ["vocabulary"];
    if (heading?.includes("Sprachbausteine · Grammatik") || heading?.includes("Sprachbausteine · Satzverbindung")) return ["grammar"];
    if (heading?.includes("Sprachbausteine · Kollokation") || heading?.includes("Sprachbausteine · Bedeutung")) return ["vocabulary"];
    return ["reading"];
  }
  if (heading?.includes("Sprachstruktur")) return ["grammar"];
  if (heading?.includes("Lesen") || heading?.includes("Trainingsmaterial")) return ["reading"];
  return ["interaction"];
}

function coreSection(index: number) {
  if (index === 0) return sections[0];
  if (index < 5) return sections[1];
  if (index < 9) return sections[2];
  if (index < 14) return sections[3];
  if (index < 17) return sections[4];
  return sections[5];
}

function coreLesson(chapter: B2Chapter, index: number): AcademyLesson {
  const prefix = `de-b2-${n(index)}`;
  const section = coreSection(index);
  const previous = index ? germanB2Chapters[index - 1] : null;
  const lexicon = germanB2Lexicon[index];
  const advancedListening = germanB2AdvancedListening.find((item) => item.chapterIndex === index);
  const readingCheck = choice(block(prefix, "reading-q"), chapter.readingQuestion,
    chapter.readingAnswer, chapter.readingDistractors,
    `Im Text steht beziehungsweise folgt: ${chapter.readingAnswer}`);
  const listeningCheck = choice(block(prefix, "listening-q"), chapter.listeningQuestion,
    chapter.listeningAnswer, chapter.listeningDistractors,
    `Im Hörtext wird deutlich: ${chapter.listeningAnswer}`);
  const blocks: LessonBlock[] = [
    { id: block(prefix, "entry"), type: "survey", heading: "Einstieg · Ihre Position", prompt: `Wie wichtig ist das Thema „${chapter.title}“ in Ihrem Alltag? Begründen Sie Ihre Wahl mündlich mit einem Beispiel.`, lowLabel: "kaum relevant", highLabel: "sehr relevant", scale: 5, completion: "interact" },
    ...(index === 9 ? [{ id: block(prefix, "people"), type: "carousel" as const, heading: "Einstieg · Leben wir zu digital?", items: [
      { title: "Lena", body: "Lena prüft ihre sozialen Medien sehr oft. Sie fühlt sich informiert, aber manchmal auch unter Druck gesetzt." },
      { title: "Thomas", body: "Thomas nutzt keine sozialen Medien. Er bevorzugt persönliche Gespräche, verpasst jedoch gelegentlich Einladungen." },
      { title: "Amir", body: "Amir nutzt KI beim Lernen. Er schätzt schnelle Erklärungen, kontrolliert aber nicht immer die Quellen." },
      { title: "Sarah", body: "Sarah macht sich Sorgen um die Daten ihrer Kinder und fordert klare Regeln für digitale Angebote." },
    ], completion: "interact" as const } satisfies LessonBlock] : []),
    { id: block(prefix, "goal"), type: "callout", heading: "Ihr Ziel", body: chapter.outcome, tone: "blue" },
    { id: block(prefix, "vocabulary"), type: "flashcards", heading: "Wortschatz in Verbindungen", items: chapter.collocations.map((item, i) => {
      const [title, body] = item.split(" — ");
      return { id: block(prefix, `word-${i}`), title, body: `${body}. Bilden Sie einen eigenen Satz mit dieser Verbindung.` };
    }), completion: "interact" },
    { id: block(prefix, "topic-words"), type: "flashcards", heading: "Themenwortschatz im Zusammenhang", items: lexicon.terms.map(([title, body], i) => ({
      id: block(prefix, `topic-word-${i}`), title, body: `${body}. Verwenden Sie das Wort in einem eigenen Satz zum Kapitelthema.`,
    })), completion: "interact" },
    { id: block(prefix, "lexical-depth"), type: "comparison-table", heading: "Wortfamilie und Register", columns: ["Wortfamilie: Verb", "Nomen", "Adjektiv"], rows: [lexicon.wordFamily] },
    { id: block(prefix, "register"), type: "comparison-table", heading: "Register: dieselbe Absicht anders ausdrücken", columns: ["Umgangssprachlich", "Neutral", "Formell"], rows: [lexicon.register] },
    { id: block(prefix, "phrases"), type: "callout", heading: "Redemittel für B2", body: `Funktion: ${lexicon.functionPhrase} Diskussion: ${lexicon.discussionPhrase}`, tone: "teal" },
    { id: block(prefix, "register-check"), type: "knowledge-check", heading: "Wortschatz · passendes Register", question: choice(block(prefix, "register-q"),
      "Welche der folgenden Formulierungen passt am besten in einen formellen Text?", lexicon.register[2],
      [lexicon.register[0], lexicon.register[1]], `Für formelle Kommunikation eignet sich hier: ${lexicon.register[2]}`), completion: "pass" },
    ...(index === 9 ? [{ id: block(prefix, "digital-vocabulary"), type: "flashcards" as const, heading: "Digitaler Wortschatz und Wortfamilien", items: [
      ["der Datenschutz", "Schutz persönlicher Informationen"], ["die künstliche Intelligenz", "Technik, die aus Daten Muster erkennt"],
      ["die Bildschirmzeit", "Zeit vor digitalen Bildschirmen"], ["der Algorithmus", "Regeln zur Verarbeitung von Daten"],
      ["die Datensicherheit", "Schutz vor Verlust und unbefugtem Zugriff"], ["die Abhängigkeit", "Schwierigkeit, auf etwas zu verzichten"],
      ["Informationen verbreiten", "Nachrichten an viele Menschen weitergeben"], ["Daten speichern", "Informationen dauerhaft aufbewahren"],
      ["entscheiden → Entscheidung", "eine Entscheidung treffen"], ["beeinflussen → Einfluss", "Einfluss auf etwas haben"],
    ].map(([title, body], i) => ({ id: block(prefix, `digital-word-${i}`), title, body })), completion: "interact" as const } satisfies LessonBlock] : []),
    { id: block(prefix, "reading"), type: "text", heading: "Lesen · Verstehen und einordnen", paragraphs: ["Lesen Sie zuerst für die Hauptaussage. Lesen Sie dann erneut und markieren Sie Belege für die folgende Frage.", ...chapter.reading.split("\n\n")] },
    { id: block(prefix, "reading-check"), type: "knowledge-check", heading: "Lesen · Beleg finden", question: readingCheck, completion: "pass" },
    ...(index === 9 ? [
      { id: block(prefix, "global-check"), type: "knowledge-check" as const, heading: "Lesen · Hauptgedanke", question: choice(block(prefix, "global-q"), "Worum geht es im Schulbericht hauptsächlich?", "Um einen begrenzten Versuch mit digitalen Lernhilfen und offene Bedingungen.", ["Um ein endgültiges Verbot aller Technik.", "Um den Kauf neuer Smartphones für alle."], "Die Schule testet Werkzeuge und prüft Lernfortschritt, Zugang und Datenschutz."), completion: "pass" as const },
      { id: block(prefix, "stance-check"), type: "knowledge-check" as const, heading: "Lesen · Haltung und Schlussfolgerung", question: choice(block(prefix, "stance-q"), "Welche Schlussfolgerung stützt der Text?", "Ein dauerhafter Einsatz braucht Regeln, Zugang und eine Auswertung.", ["Einzelne gute Antworten beweisen den Nutzen für alle.", "Datenschutz ist bereits vollständig geklärt."], "Der Text nennt mehrere Bedingungen für eine Entscheidung nach der Testphase."), completion: "pass" as const },
    ] satisfies LessonBlock[] : []),
    { id: block(prefix, "listening-guide"), type: "text", heading: "Hören · Erst Überblick, dann Detail", paragraphs: ["Hören Sie zuerst ohne Transcript und notieren Sie Thema und Haltung. Hören Sie erneut für die konkrete Information. Öffnen Sie das Transcript erst nach Ihrer Antwort."] },
    { id: block(prefix, "audio"), type: "audio", heading: "Hören · Originaler Übungstext", url: `/audio/german-b2/${prefix}.m4a`, caption: "Synthetisch gesprochener, eigens verfasster Übungstext. Hören Sie ohne Transcript und überprüfen Sie erst danach.", transcript: chapter.listening },
    { id: block(prefix, "listening-check"), type: "knowledge-check", heading: "Hören · Aussage prüfen", question: listeningCheck, completion: "pass" },
    ...(advancedListening ? [
      { id: block(prefix, "advanced-listening-guide"), type: "text" as const, heading: `Hören · ${advancedListening.genre}`, paragraphs: ["Hören Sie zunächst für Thema und Haltungen. Hören Sie dann erneut und unterscheiden Sie zentrale Aussage, Details und mögliche Einschränkungen."] },
      { id: block(prefix, "advanced-audio"), type: "audio" as const, heading: advancedListening.title,
        url: `/audio/german-b2/${prefix}-advanced.m4a`,
        caption: "Längerer, eigens verfasster Hörbeitrag mit mehreren synthetischen Stimmen. Das Transcript dient der nachträglichen Kontrolle.",
        transcript: advancedListening.segments.map((segment) => `${segment.speaker}: ${segment.text}`).join("\n\n") },
      { id: block(prefix, "advanced-main"), type: "knowledge-check" as const, heading: "Hören · Hauptaussage und Haltung",
        question: choice(block(prefix, "advanced-main-q"), advancedListening.mainQuestion, advancedListening.mainAnswer, advancedListening.mainDistractors, advancedListening.mainAnswer), completion: "pass" as const },
      { id: block(prefix, "advanced-detail"), type: "knowledge-check" as const, heading: "Hören · Detail und Schlussfolgerung",
        question: choice(block(prefix, "advanced-detail-q"), advancedListening.detailQuestion, advancedListening.detailAnswer, advancedListening.detailDistractors, advancedListening.detailAnswer), completion: "pass" as const },
    ] satisfies LessonBlock[] : []),
    { id: block(prefix, "language"), type: "worked-example", heading: "Sprachlabor", problem: chapter.language, steps: [
      { title: "Im Kontext entdecken", body: chapter.languageExample },
      { title: "Wirkung benennen", body: "Welche Beziehung oder Nuance drückt die Struktur aus? Erklären Sie sie mit eigenen Worten." },
      { title: "Übertragen", body: `Formulieren Sie eine eigene Aussage zum Thema „${chapter.title}“ mit derselben Struktur.` },
    ], answer: chapter.languageExample },
    { id: block(prefix, "grammar-map"), type: "text", heading: "Sprachstruktur vertiefen", paragraphs: [grammarSpine[index], `Schreiben Sie zwei eigene Sätze zu „${chapter.title}“ und prüfen Sie Form und Bedeutung.`] },
    ...(index === 9 ? [{ id: block(prefix, "writing-steps"), type: "process" as const, heading: "Vom Satz zum B2-Text", items: [
      { title: "Position", body: "Formulieren Sie Ihre Haltung in einem präzisen Satz." },
      { title: "Grund und Beispiel", body: "Begründen Sie sie und nennen Sie eine konkrete Situation." },
      { title: "Gegenargument", body: "Nehmen Sie einen berechtigten Einwand auf und ordnen Sie ihn ein." },
      { title: "Schluss", body: "Ziehen Sie eine Folgerung oder machen Sie einen umsetzbaren Vorschlag." },
    ] } satisfies LessonBlock] : []),
    { id: block(prefix, "writing"), type: "writing-practice", heading: "Schreiben · Vom Argument zum Text", prompt: chapter.writing,
      minWords: index < 4 ? 100 : index < 10 ? 130 : 160,
      maxWords: index < 4 ? 180 : index < 10 ? 210 : 240,
      checklist: ["Klare Position oder Absicht", "Begründung und konkretes Beispiel", "Gegenperspektive oder Einschränkung", "Passendes Register und überprüfte Verknüpfungen"],
      modelAnswer: `Kurzbeispiel für Aufbau und Formulierungen; Ihre eigene Antwort soll die angegebene Wortspanne erreichen.\n\n${chapter.writingModel}`, completion: "interact" },
    { id: block(prefix, "speaking"), type: "speaking-practice", heading: "Sprechen · Eigene Position", prompt: chapter.speaking,
      preparationSeconds: 60, targetSeconds: 120,
      checklist: ["Einleitung und roter Faden", "Mindestens zwei konkrete Punkte", "Ein Beispiel oder Einwand", "Verständlicher Abschluss"], modelAnswer: speakingModels[index], completion: "interact" },
    { id: block(prefix, "interaction"), type: "process", heading: "Interaktion und Vermittlung", items: [
      { title: "Situation", body: chapter.interaction },
      { title: "Zuhören", body: "Fassen Sie die andere Position fair zusammen, bevor Sie antworten." },
      { title: "Aushandeln", body: "Nennen Sie Ihren Vorschlag, fragen Sie nach Bedenken und halten Sie das gemeinsame Ergebnis fest." },
    ] },
    { id: block(prefix, "mission"), type: "callout", heading: "Mission in der echten Welt", body: chapter.mission, tone: "teal" },
    { id: block(prefix, "exam"), type: "text", heading: "Prüfungsblick", paragraphs: [
      `Prüfen Sie beim Lesen und Hören die Textbelege. Geben Sie beim Schreiben und Sprechen Ihre Position mit Grund, Beispiel und Einordnung an. Diese Strategien brauchen Sie später in beiden B2-Prüfungswegen.`,
    ] },
    { id: block(prefix, "retrieval"), type: "knowledge-check", heading: "Wiederholen und vernetzen", question: choice(block(prefix, "retrieval-q"),
      previous ? `Welche Verbindung stammt aus dem vorigen Kapitel „${previous.title}“?` : "Welche Verbindung bedeutet „to pursue a goal“?",
      previous ? previous.collocations[0].split(" — ")[0] : chapter.collocations[0].split(" — ")[0],
      [chapter.collocations[1].split(" — ")[0], chapter.collocations[2].split(" — ")[0]],
      previous ? `Wiederholen Sie: ${previous.collocations[0]}.` : `Wiederholen Sie: ${chapter.collocations[0]}.`), completion: "pass" },
    { id: block(prefix, "challenge"), type: "numbered-list", heading: "Kapitel-Challenge · Selbstcheck", items: [
      { title: "Verstehen", body: "Können Sie die Hauptaussagen aus Text und Hörbeitrag ohne Transcript wiedergeben?" },
      { title: "Ausdrücken", body: "Können Sie zwei der neuen Verbindungen und die Sprachstruktur passend verwenden?" },
      { title: "Verbessern", body: "Lesen beziehungsweise hören Sie Ihre Produktion erneut und notieren Sie eine konkrete Verbesserung." },
    ] },
  ];
  return { id: `${prefix}-lesson`, sectionId: section.id, section: section.title,
    slug: `${prefix}-${chapter.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/-$/, "")}`,
    title: `${index + 1}. ${chapter.title}`, summary: chapter.outcome,
    durationMinutes: 115, blocks: blocks.map((item) => ({ ...item, curriculum: {
      cefr: "B2", domain: chapterDomains[index], topic: chapter.title,
      skills: blockSkills(item), functions: [communicationFunctions[index]], grammar: [chapter.language],
    } })) };
}

type ExamUnit = { title: string; focus: string; chapter: number; task: string; model: string; strategy: string };

const goetheUnits: ExamUnit[] = [
  { title: "G1 · Die Prüfung verstehen", focus: "Vier Module: Lesen 65, Hören etwa 40, Schreiben 75 und Sprechen etwa 15 Minuten; mündlich mit 15 Minuten Vorbereitung.", chapter: 17, task: "Erstellen Sie einen persönlichen Prüfungsplan: Welche Fertigkeit ist aktuell am stärksten, welche braucht wöchentliches Training?", model: "Ich plane zunächst zwei Leseeinheiten und eine Schreibaufgabe pro Woche. Nach vier Wochen prüfe ich, ob meine Antworten genauer und meine Texte klarer geworden sind.", strategy: "Öffnen Sie den offiziellen Modelltest und vergleichen Sie Aufgaben und Zeitvorgaben mit Ihrem Plan." },
  { title: "G2 · Lesen: global und selektiv", focus: "Forumsbeiträge und kurze Texte: Überschriften, Haltungen und gesuchte Angaben unterscheiden.", chapter: 13, task: "Lesen Sie den Text über die Sonntagsöffnung. Formulieren Sie in je einem Satz die Positionen beider Seiten und einen gemeinsamen Punkt.", model: "Die erste Stimme befürwortet eine Testphase, die zweite bevorzugt längere Werktage. Beide sehen die Bibliothek als wichtigen öffentlichen Ort.", strategy: "Lesen Sie zuerst die Aufgabenstellung und markieren Sie im Text nur die Belege für Ihre Entscheidung." },
  { title: "G3 · Lesen: Detail und Meinung", focus: "Artikel und Kommentare: Fakten, Sichtweisen und Schlussfolgerungen trennen.", chapter: 10, task: "Unterscheiden Sie im Bibliotheksartikel die ursprüngliche Behauptung, den überprüften Sachverhalt und die Schlussfolgerung.", model: "Behauptet wurde eine dauerhafte Schließung. Belegt ist nur eine zweiwöchige Renovierung mit Ausweichstandort. Ein echtes Foto kann trotzdem eine falsche Deutung stützen.", strategy: "Suchen Sie im Ausgangstext eine konkrete Stelle für jede gewählte Antwort." },
  { title: "G4 · Hören: Hauptaussage und Sprecherhaltung", focus: "Interviews, Gespräche und Radiobeiträge: zuerst Thema, dann Details.", chapter: 9, task: "Hören Sie den Podcast über Bildschirmzeit ohne Transcript. Notieren Sie Thema, Sprecherhaltung und zwei Belege. Prüfen Sie danach Ihre Notizen.", model: "Die Sprecherin bewertet Bildschirmzeit differenziert. Sie unterscheidet zwischen zielgerichteter Nutzung und gedankenlosem Scrollen und nennt bewusste Pausen.", strategy: "Lesen Sie vor dem Hören die Frage; erwarten Sie Paraphrasen statt wortgleicher Sätze." },
  { title: "G5 · Schreiben: Forumbeitrag", focus: "Eine aktuelle gesellschaftliche Frage mit Position, Gründen, Beispiel und Gegenargument bearbeiten.", chapter: 9, task: "Schreiben Sie einen Forumbeitrag: Sollten Schulen KI-Werkzeuge zulassen? Nennen Sie Vorteile, Bedenken, eigene Position und einen Vorschlag.", model: "KI-Werkzeuge können schwierige Inhalte verständlich erklären. Allerdings besteht die Gefahr, Antworten ungeprüft zu übernehmen. Deshalb befürworte ich ihren Einsatz nur mit klaren Regeln: Lernende sollten Quellen prüfen und offenlegen, wobei sie Hilfe genutzt haben. So bleibt die eigene Leistung erkennbar.", strategy: "Planen Sie Absätze und kontrollieren Sie am Ende, ob jeder Inhaltspunkt sichtbar beantwortet ist." },
  { title: "G6 · Schreiben: formelle Nachricht", focus: "Berufliche Nachricht mit Anlass, Bitte, Begründung und angemessenem Schluss.", chapter: 6, task: "Sie können einen vereinbarten beruflichen Termin nicht wahrnehmen. Schreiben Sie eine formelle Nachricht mit Grund, Alternativtermin und höflicher Bitte.", model: "Sehr geehrte Frau Berger, leider kann ich den vereinbarten Termin am Dienstag wegen einer unaufschiebbaren Verpflichtung nicht wahrnehmen. Wäre ein Gespräch am Donnerstagvormittag möglich? Über eine kurze Rückmeldung würde ich mich freuen. Mit freundlichen Grüßen", strategy: "Prüfen Sie Anrede, Betreff, Sie-Form, konkrete Bitte und Schlussformel." },
  { title: "G7 · Sprechen: Kurzvortrag", focus: "Vortrag strukturieren, Beispiele nennen und eine Rückfrage beantworten.", chapter: 16, task: "Bereiten Sie einen Kurzvortrag über ein neues Angebot in Ihrem Stadtteil vor. Erläutern Sie zwei Möglichkeiten, bewerten Sie diese und beantworten Sie eine Nachfrage.", model: "Ich möchte zwei Angebote vergleichen. Ein offener Lernabend fördert Austausch, während eine digitale Gruppe flexibler ist. Für unseren Stadtteil wäre zunächst ein zweiwöchentlicher Lernabend sinnvoll, weil viele Menschen einen ruhigen Treffpunkt suchen.", strategy: "Nutzen Sie Stichpunkte für Einleitung, zwei Hauptpunkte und Schluss; lesen Sie keinen ausformulierten Text ab." },
  { title: "G8 · Sprechen: Diskussion", focus: "Standpunkte austauschen, auf Einwände reagieren und höflich nachfragen.", chapter: 13, task: "Diskutieren Sie mit einer Partnerin die Sonntagsöffnung der Bibliothek. Vertreten Sie eine Position und reagieren Sie auf ihre stärkste Sorge.", model: "Ihr Einwand zu den Arbeitszeiten ist berechtigt. Deshalb schlage ich zunächst zwei freiwillig besetzte Testtermine pro Monat vor. Wäre das für Sie ein gangbarer Weg?", strategy: "Greifen Sie den Gedanken der anderen Person auf und verbinden Sie Ihre Antwort mit einem konkreten Vorschlag." },
  { title: "G9 · Zeittraining und offizieller Modelltest", focus: "Vier Module unter offiziellen Zeitvorgaben erproben.", chapter: 17, task: "Bearbeiten Sie den offiziellen Goethe-Modelltest mit Uhr und Originalaudio. Notieren Sie pro Modul Zeit, sichere Antworten und Unsicherheiten.", model: "Lesen: 65 Minuten, 4 unsichere Antworten. Hören: etwa 40 Minuten, Details in Teilaufgabe 2 verpasst. Nächster Schritt: zweimal pro Woche gezielt Detailfragen üben.", strategy: "Nutzen Sie für eine vollständige Simulation das offizielle Material; die Übungen dieses Kurses sind kürzere, selbst erstellte Trainingsaufgaben." },
  { title: "G10 · Fehleranalyse und Prüfungstag", focus: "Auswertung des Modelltests und gezielter letzter Trainingsplan.", chapter: 17, task: "Ordnen Sie jeden Fehler einer Ursache zu: Textbeleg, Wortschatz, Zeit, Aufgabenverständnis oder Produktion. Schreiben Sie einen Plan für die letzten sieben Tage.", model: "Meine falschen Leseantworten kamen meist von zu schnellem Schlussfolgern. Ich übe drei kurze Texte und markiere zu jeder Antwort die Belegstelle. Beim Schreiben prüfe ich nach 60 Minuten Inhalt und Register.", strategy: "Wiederholen Sie nur Aufgaben mit einer klaren Fehlerursache und planen Sie Erholung vor dem Prüfungstag ein." },
];

const telcUnits: ExamUnit[] = [
  { title: "T1 · Die Prüfung verstehen", focus: "Lesen und Sprachbausteine zusammen 90 Minuten, Hören etwa 20, Schreiben 30, Sprechen etwa 15 Minuten mit 20 Minuten Vorbereitung.", chapter: 17, task: "Skizzieren Sie den telc-Ablauf und markieren Sie, welche Teile Sie zuerst gezielt trainieren müssen.", model: "Ich trainiere zunächst Sprachbausteine, weil ich bei Wortverbindungen unsicher bin. Danach simuliere ich Lesen und Sprachbausteine gemeinsam mit 90 Minuten Zeit.", strategy: "Vergleichen Sie Ihre Planung mit dem offiziellen telc-Übungstest." },
  { title: "T2 · Leseverstehen: global", focus: "Kurze Texte und Überschriften nach Hauptaussagen zuordnen.", chapter: 11, task: "Lesen Sie den Umwelttext und formulieren Sie eine treffende Überschrift. Begründen Sie, warum eine zu allgemeine Überschrift weniger passt.", model: "Eine passende Überschrift lautet: ›Wohnanlage kombiniert schnelle und langfristige Energiesparmaßnahmen‹. Sie nennt die eigentliche Entscheidung des Texts.", strategy: "Suchen Sie die gemeinsame Kernaussage statt eines auffälligen Einzelworts." },
  { title: "T3 · Leseverstehen: Detail und selektiv", focus: "Einzelinformationen und passende Angebote anhand genauer Kriterien finden.", chapter: 8, task: "Lesen Sie den Mobilitätstext. Notieren Sie Ziel der Stadt, Einwand der Kritiker und noch offene Finanzierungsfrage.", model: "Die Stadt will längere Aufenthalte fördern. Kritiker zweifeln an weniger Autoverkehr. Die Finanzierung des Kombitickets ist noch offen.", strategy: "Unterstreichen Sie Schlüsselbedingungen und prüfen Sie, ob ein Text sie tatsächlich erfüllt." },
  { title: "T4 · Sprachbausteine: Grammatik", focus: "Satzbeziehungen, Verbformen, Artikel und Präpositionen im Kontext wählen.", chapter: 5, task: "Ergänzen Sie: Viele besuchen einen Kurs, ___ sich beruflich weiterzuentwickeln. Erklären Sie die Konstruktion.", model: "um — ›um … zu‹ drückt hier einen Zweck aus: Man besucht den Kurs mit dem Ziel beruflicher Weiterentwicklung.", strategy: "Lesen Sie den ganzen Satz und bestimmen Sie zuerst die Bedeutung, dann die Form." },
  { title: "T5 · Sprachbausteine: Lexik", focus: "Kollokationen, Register und passende Wörter im Textzusammenhang.", chapter: 7, task: "Ergänzen Sie: ›eine Entscheidung ___‹ und ›Kosten in Kauf ___‹. Schreiben Sie mit beiden Wendungen einen Satz.", model: "Eine Entscheidung treffen; Kosten in Kauf nehmen. Bevor ich eine Entscheidung treffe, prüfe ich, welche Folgekosten ich in Kauf nehmen muss.", strategy: "Lernen Sie Wortverbindungen als Einheit und vergleichen Sie ähnliche Ausdrücke im Kontext." },
  { title: "T6 · Hörverstehen", focus: "Globales, detailliertes und selektives Verstehen in drei Aufgabentypen.", chapter: 8, task: "Hören Sie die Ansage zur Zugstörung. Notieren Sie Hauptproblem, neuen Verkehrsträger und Handlungsanweisung für einen bestimmten Anschluss.", model: "Der Zug endet wegen einer Störung früher. Ein Ersatzbus fährt weiter. Fahrgäste nach Bremerhaven sollen das Servicepersonal ansprechen.", strategy: "Achten Sie auf Korrekturen und Einschränkungen; entscheiden Sie erst nach dem ganzen Hörabschnitt." },
  { title: "T7 · Schriftlicher Ausdruck", focus: "Halbformelle E-Mail mit allen Inhaltspunkten in 30 Minuten.", chapter: 15, task: "Sie haben einen Workshop gebucht, der Ort wurde kurzfristig geändert. Schreiben Sie an den Veranstalter: Situation, Folge, Bitte um Lösung und Rückfrage.", model: "Guten Tag, für Samstag habe ich Ihren Workshop gebucht. Leider wurde der Ort erst gestern geändert; der neue Standort ist für mich kaum erreichbar. Könnte ich an einem späteren Termin am ursprünglichen Ort teilnehmen? Falls das nicht möglich ist, bitte ich um Erstattung. Wann kann ich mit einer Antwort rechnen? Freundliche Grüße", strategy: "Reservieren Sie Zeit für Planung und Endkontrolle; prüfen Sie jeden geforderten Inhaltspunkt." },
  { title: "T8 · Sprechen: über Erfahrungen", focus: "Eine persönliche Erfahrung erzählen und Nachfragen beantworten.", chapter: 2, task: "Berichten Sie über eine Veränderung Ihrer Arbeits- oder Alltagsroutine. Was war der Anlass, was lief gut, was würden Sie anders machen?", model: "Ich habe vor einigen Monaten meine Woche anders organisiert. Anfangs wollte ich zu viel auf einmal ändern. Erst nachdem ich Prioritäten gesetzt hatte, wurde der Plan alltagstauglich. Heute würde ich früher mit kleinen Schritten beginnen.", strategy: "Erzählen Sie eine konkrete Situation statt allgemeiner Behauptungen und halten Sie Anschlussfragen offen." },
  { title: "T9 · Sprechen: Diskussion", focus: "Eine Aussage bewerten, Gründe austauschen und höflich widersprechen.", chapter: 13, task: "Diskutieren Sie: ›Bibliotheken sollten auch sonntags öffnen.‹ Begründen Sie Ihre Haltung und reagieren Sie auf Kosten und Arbeitsbedingungen.", model: "Ich sehe den Bedarf, besonders für Berufstätige. Ihr Kostenargument ist jedoch berechtigt. Vielleicht können wir zunächst einen begrenzten Test durchführen und die Nutzung messen.", strategy: "Zeigen Sie, dass Sie zugehört haben, und entwickeln Sie das Gespräch mit einer Rückfrage weiter." },
  { title: "T10 · Sprechen: gemeinsam planen", focus: "Ein Vorhaben mit einer Partnerperson realistisch organisieren.", chapter: 16, task: "Planen Sie einen Kulturabend: Zielgruppe, Ort, Budget, Werbung und Aufgabenverteilung. Finden Sie eine gemeinsame Lösung.", model: "Wie wäre ein Abend in der Bibliothek? Der Raum ist günstig. Sie könnten die Werbung übernehmen, während ich das Programm organisiere. Für Getränke sollten wir ein kleines Budget reservieren. Sind Sie damit einverstanden?", strategy: "Machen Sie Vorschläge, fragen Sie nach Alternativen und halten Sie am Ende eine gemeinsame Entscheidung fest." },
  { title: "T11 · Zeittraining und offizieller Übungstest", focus: "Alle telc-Teile unter echten Zeitvorgaben erproben.", chapter: 17, task: "Bearbeiten Sie den offiziellen telc-Übungstest mit Originalaudio und Zeitmessung. Dokumentieren Sie Treffer und offene Fragen für jeden Teil.", model: "Lesen und Sprachbausteine: 90 Minuten; besonders schwierig war Lexik. Beim Hören habe ich zwei Einschränkungen übersehen. Ich übe deshalb Wortverbindungen und Signalwörter.", strategy: "Verwenden Sie den offiziellen Übungstest für eine vollständige Simulation; die Aufgaben hier dienen als kürzere Vorbereitung." },
  { title: "T12 · Auswertung und letzte Vorbereitung", focus: "Fehlerursachen erkennen und einen gezielten Wiederholungsplan erstellen.", chapter: 17, task: "Sortieren Sie Fehler nach Lesen, Grammatik, Lexik, Hören, Schreiben und Sprechen. Planen Sie drei konkrete Wiederholungsaktionen.", model: "Bei Sprachbausteinen verwechsle ich feste Verbindungen. Ich wiederhole täglich zehn Kollokationen im Satz. Beim Schreiben plane ich zuerst die Inhaltspunkte. Für Sprechen übe ich zwei Partnergespräche mit Zeitlimit.", strategy: "Bearbeiten Sie die schwierigen Teile erneut und vergleichen Sie Ihre Antworten mit den offiziellen Lösungen." },
];

function examLesson(unit: ExamUnit, index: number, track: "goethe" | "telc"): AcademyLesson {
  const prefix = `de-b2-${track}-${n(index)}`;
  const chapter = germanB2Chapters[unit.chapter];
  const section = track === "goethe" ? sections[6] : sections[7];
  const officialUrl = track === "goethe" ? goetheUrl : telcUrl;
  const blocks: LessonBlock[] = [
    { id: block(prefix, "focus"), type: "callout", heading: "Format und Ziel", body: unit.focus, tone: track === "goethe" ? "blue" : "navy" },
    { id: block(prefix, "strategy"), type: "text", heading: "Prüfungsstrategie", paragraphs: [unit.strategy, "Die folgenden Aufgaben sind eigens für ScienceDojo verfasst. Vergleichen Sie sie anschließend mit offiziellen Modellaufgaben."] },
    { id: block(prefix, "source"), type: "text", heading: "Trainingsmaterial", paragraphs: chapter.reading.split("\n\n") },
    { id: block(prefix, "reading-check"), type: "knowledge-check", heading: "Verstehen", question: choice(block(prefix, "reading-q"), chapter.readingQuestion, chapter.readingAnswer, chapter.readingDistractors, chapter.readingAnswer), completion: "pass" },
    { id: block(prefix, "audio"), type: "audio", heading: "Hörtraining", url: `/audio/german-b2/de-b2-${n(unit.chapter)}.m4a`, caption: "Eigens verfasster, synthetisch gesprochener Übungstext.", transcript: chapter.listening },
    { id: block(prefix, "listening-check"), type: "knowledge-check", heading: "Höraufgabe", question: choice(block(prefix, "listening-q"), chapter.listeningQuestion, chapter.listeningAnswer, chapter.listeningDistractors, chapter.listeningAnswer), completion: "pass" },
    ...(track === "telc" && index === 3 ? [
      { id: block(prefix, "grammar-cloze-1"), type: "knowledge-check" as const, heading: "Sprachbausteine · Grammatik", question: choice(block(prefix, "grammar-cloze-q1"), "Ergänzen Sie: Viele besuchen einen Kurs, ___ sich beruflich weiterzuentwickeln.", "um", ["ohne", "anstatt"], "Die Infinitivgruppe ›um … zu‹ drückt hier einen Zweck aus."), completion: "pass" as const },
      { id: block(prefix, "grammar-cloze-2"), type: "knowledge-check" as const, heading: "Sprachbausteine · Satzverbindung", question: choice(block(prefix, "grammar-cloze-q2"), "Ergänzen Sie: ___ die Teilnehmerin wenig Zeit hatte, besuchte sie den Abendkurs.", "Obwohl", ["Sodass", "Denn"], "›Obwohl‹ leitet einen konzessiven Nebensatz ein."), completion: "pass" as const },
    ] satisfies LessonBlock[] : []),
    ...(track === "telc" && index === 4 ? [
      { id: block(prefix, "lexical-cloze-1"), type: "knowledge-check" as const, heading: "Sprachbausteine · Kollokation", question: choice(block(prefix, "lexical-cloze-q1"), "Ergänzen Sie: Vor dem Kauf sollte man eine fundierte Entscheidung ___.", "treffen", ["machen", "nehmen"], "Die feste Wortverbindung lautet ›eine Entscheidung treffen‹."), completion: "pass" as const },
      { id: block(prefix, "lexical-cloze-2"), type: "knowledge-check" as const, heading: "Sprachbausteine · Bedeutung", question: choice(block(prefix, "lexical-cloze-q2"), "Ergänzen Sie: Der günstige Preis kann erhebliche Folgekosten ___.", "verbergen", ["begegnen", "verfügen"], "Ein Preis kann Kosten verbergen; die anderen Verben passen weder grammatisch noch semantisch."), completion: "pass" as const },
    ] satisfies LessonBlock[] : []),
    { id: block(prefix, "task"), type: "writing-practice", heading: "Ihre Prüfungsaufgabe", prompt: unit.task, minWords: 70, maxWords: 240,
      checklist: ["Alle geforderten Punkte bearbeiten", "Aussagen begründen oder belegen", "Passendes Register wählen", "Zeit und Verständlichkeit prüfen"],
      modelAnswer: `Kurzbeispiel für Aufbau und Formulierungen; bearbeiten Sie in Ihrer eigenen Antwort alle geforderten Punkte.\n\n${unit.model}`, completion: "interact" },
    { id: block(prefix, "speak"), type: "speaking-practice", heading: "Mündlicher Transfer", prompt: `Erläutern Sie Ihre Antwort auf die Aufgabe „${unit.title}“ mündlich und reagieren Sie auf eine mögliche Rückfrage.`, preparationSeconds: 60, targetSeconds: 120,
      checklist: ["Aussage verständlich strukturieren", "Beispiel nennen", "Auf eine Rückfrage eingehen"], modelAnswer: unit.model, completion: "interact" },
    { id: block(prefix, "official"), type: "resources", heading: "Offizielles Prüfungsmaterial", items: [{ title: track === "goethe" ? "Goethe B2 · offizielle Übungen" : "telc Deutsch B2 · Übungstest und Format", description: "Format, Modellaufgaben und Lösungen direkt beim Prüfungsanbieter prüfen.", url: officialUrl }] },
  ];
  return { id: `${prefix}-lesson`, slug: prefix, sectionId: section.id, section: section.title, examTrack: track,
    title: unit.title, summary: unit.focus, durationMinutes: index === (track === "goethe" ? 8 : 10) ? 190 : 65,
    blocks: blocks.map((item) => ({ ...item, curriculum: {
      cefr: "B2", domain: chapterDomains[unit.chapter], topic: chapter.title,
      skills: blockSkills(item), functions: [communicationFunctions[unit.chapter]],
      grammar: [chapter.language], examTrack: track,
    } })) };
}

const core = germanB2Chapters.map(coreLesson);
const goethe = goetheUnits.map((unit, index) => examLesson(unit, index, "goethe"));
const telc = telcUnits.map((unit, index) => examLesson(unit, index, "telc"));

const readingAssessment: QuizQuestion[] = germanB2Chapters.slice(0, 6).map((chapter, index) =>
  choice(`de-b2-final-read-${n(index)}`, `Lesen Sie den folgenden Text und beantworten Sie die Frage.\n\n${chapter.reading}\n\n${chapter.readingQuestion}`,
    chapter.readingAnswer, chapter.readingDistractors, chapter.readingAnswer));
const listeningAssessment: QuizQuestion[] = germanB2Chapters.slice(6, 12).map((chapter, offset) => ({
  ...choice(`de-b2-final-listen-${n(offset)}`, chapter.listeningQuestion,
    chapter.listeningAnswer, chapter.listeningDistractors, chapter.listeningAnswer),
  audioUrl: `/audio/german-b2/de-b2-${n(offset + 6)}.m4a`, audioTranscript: chapter.listening,
}));
const grammarAssessment: QuizQuestion[] = [
  choice("de-b2-final-grammar-01", "Welche Formulierung gibt einen Gegensatz korrekt wieder?", "Zwar ist der Umbau teuer, aber er schafft Raum für alle.", ["Zwar der Umbau ist teuer, aber schafft er Raum.", "Obwohl der Umbau teuer, aber er schafft Raum."], "Zwar … aber verbindet zwei gegensätzliche Aussagen."),
  choice("de-b2-final-grammar-02", "Welche Form der indirekten Rede markiert eine berichtete Aussage?", "Die Sprecherin erklärt, die Bibliothek sei geöffnet.", ["Die Sprecherin erklärt, die Bibliothek ist geöffnet gewesen sei.", "Die Sprecherin erklärt, geöffnet sei die Bibliothek ist."], "Konjunktiv I: ›die Bibliothek sei‹."),
  choice("de-b2-final-grammar-03", "Welche Verbindung ist idiomatisch?", "eine Entscheidung treffen", ["eine Entscheidung machen", "eine Entscheidung nehmen"], "Die feste Wortverbindung lautet ›eine Entscheidung treffen‹."),
  choice("de-b2-final-grammar-04", "Welche Formulierung passt zu einer höflichen beruflichen Bitte?", "Könnten Sie mir den Termin bitte bestätigen?", ["Bestätige mir den Termin sofort!", "Du musst mir den Termin bestätigen."], "Konjunktiv II und Sie-Form passen zum formellen Register."),
  choice("de-b2-final-grammar-05", "Welche Konstruktion bezeichnet einen Zweck?", "Ich lese den Bericht, um die Folgen besser zu verstehen.", ["Ich lese den Bericht, ohne die Folgen besser verstehen.", "Ich lese den Bericht, trotzdem die Folgen besser zu verstehen."], "›um … zu‹ nennt das Ziel einer Handlung."),
  choice("de-b2-final-grammar-06", "Welche Verknüpfung beschreibt eine Folge?", "Die Räume sind knapp, sodass nicht alle Gruppen teilnehmen können.", ["Die Räume sind knapp, obwohl nicht alle Gruppen teilnehmen können.", "Die Räume sind knapp, während nicht alle Gruppen teilnehmen können."], "›sodass‹ leitet hier die Folge der knappen Räume ein."),
];
const finalQuiz: QuizQuestion[] = [...readingAssessment, ...listeningAssessment, ...grammarAssessment];

export const germanB2Course: AcademyCourse = migrateAcademyCourse({
  key: GERMAN_B2_COURSE_KEY,
  title: "Deutsch B2 komplett: selbstständig kommunizieren und Prüfungen meistern",
  shortTitle: "Deutsch B2 komplett",
  description: "18 thematische B2-Kapitel mit Lesen, Hören, Sprachlabor, Schreiben, Sprechen und Interaktion. Nach dem gemeinsamen Abschlusstest wählen Lernende eigenständig den Goethe-Zertifikat-B2- oder telc-Deutsch-B2-Prüfungsweg.",
  estimatedMinutes: core.reduce((sum, lesson) => sum + lesson.durationMinutes, 0) + goethe.reduce((sum, lesson) => sum + lesson.durationMinutes, 0),
  audienceRoles: ["student"], passMark: 70, quizRevision: 1, sections,
  examTracks: [
    { id: "goethe", title: "Goethe-Zertifikat B2", description: `Vier Module und offizielle Modellübungen: ${goetheUrl}` },
    { id: "telc", title: "telc Deutsch B2", description: `Leseverstehen, Sprachbausteine, Hören, Schreiben und Sprechen: ${telcUrl}` },
  ],
  theme: { preset: "journey", accent: "violet-mint", typography: "friendly-sans", density: "comfortable", coverStyle: "minimal", lessonHeaderStyle: "editorial" },
  rules: { navigation: "linear", lessonCompletion: "required-blocks", requireFinalAssessment: true, attemptLimit: null, feedbackTiming: "after-submit" },
  lessons: [...core, ...goethe, ...telc], quiz: finalQuiz,
});

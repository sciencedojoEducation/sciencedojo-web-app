import type { LessonBlock } from "./tutor-academy.ts";

function workAndLearning(prefix: string): LessonBlock[] {
  return [
    { id: `${prefix}-kursplan`, type: "comparison-table", heading: "Passt der Berufskurs zu Eddy?", columns: ["Information", "Im Kursangebot"], rows: [
      ["Eddys Ziel", "Mit Gästen im Café besser Deutsch sprechen"],
      ["Kurszeit", "Dienstag und Donnerstag, 17:30–19 Uhr"],
      ["Voraussetzung", "Deutsch A1"],
      ["Anmeldung", "Online-Formular bis 10. September"],
    ] },
    { id: `${prefix}-kursplan-check`, type: "knowledge-check", heading: "Mini-Check · Kurszeit", completion: "pass", required: true, question: {
      id: `${prefix}-kursplan-frage`, prompt: "Eddy sucht einen Abendkurs. Welche Kurszeit passt?",
      options: [{ id: "a", label: "Dienstag und Donnerstag, 17:30–19 Uhr" }, { id: "b", label: "Montag und Mittwoch, 8–10 Uhr" }, { id: "c", label: "Nur Samstag, 10–12 Uhr" }],
      correctOptionId: "a", explanation: "Der Kurs Deutsch für den Beruf findet dienstags und donnerstags am Abend statt.",
    } },
    { id: `${prefix}-modalverben`, type: "worked-example", heading: "Was kann und muss Eddy tun?", problem: "Eddy möchte den Kurs besuchen und fragt nach den Bedingungen.", steps: [
      { id: `${prefix}-modal-1`, title: "können · eine Möglichkeit", body: "Ich kann am Dienstagabend zum Kurs kommen." },
      { id: `${prefix}-modal-2`, title: "müssen · eine notwendige Handlung", body: "Ich muss mich bis zum 10. September anmelden." },
      { id: `${prefix}-modal-3`, title: "Frage an die Sprachschule", body: "Kann ich mich online anmelden? Muss ich schon Deutsch A1 können?" },
    ], answer: "Bei können und müssen steht die zweite Tätigkeit am Satzende: Ich muss mich anmelden." },
    { id: `${prefix}-anmeldung-check`, type: "knowledge-check", heading: "Mini-Check · Anmeldung", completion: "pass", required: true, question: {
      id: `${prefix}-anmeldung-frage`, prompt: "Eddy möchte einen Platz im Berufskurs. Was muss er bis zum 10. September tun?",
      options: [{ id: "a", label: "Das Online-Formular ausfüllen" }, { id: "b", label: "Im Café bezahlen" }, { id: "c", label: "Erst am ersten Kurstag nachfragen" }],
      correctOptionId: "a", explanation: "Die Anmeldefrist ist der 10. September; das Formular steht online.",
    } },
    { id: `${prefix}-formelle-anfrage`, type: "comparison-table", heading: "Eine höfliche Kursanfrage schreiben", columns: ["Teil", "Passender Satz"], rows: [
      ["Anrede", "Guten Tag,"], ["Ziel", "Ich möchte im Beruf besser Deutsch sprechen."],
      ["Frage", "Gibt es noch einen Platz im Abendkurs?"], ["Schluss", "Vielen Dank und freundliche Grüße"],
    ] },
  ];
}

function freeTime(prefix: string): LessonBlock[] {
  return [
    { id: `${prefix}-einladung`, type: "comparison-table", heading: "Auf eine Einladung reagieren", columns: ["Situation", "Kurze Antwort"], rows: [
      ["Annehmen", "Ja, ich spiele gern mit. Wir treffen uns um 15 Uhr im Park."],
      ["Später kommen", "Ich komme gern, aber erst um 16 Uhr."],
      ["Absagen und Alternative nennen", "Am Samstag kann ich nicht. Hast du am Sonntag Zeit?"],
      ["Nachfragen", "Soll ich Wasser mitbringen?"],
    ] },
    { id: `${prefix}-treffpunkt-check`, type: "knowledge-check", heading: "Mini-Check · Treffpunkt bei Regen", completion: "pass", required: true, question: {
      id: `${prefix}-treffpunkt-frage`, prompt: "Es regnet am Samstag. Wo und wann treffen sich Anna und Eddy?",
      options: [{ id: "a", label: "Um 16 Uhr im Café am Markt" }, { id: "b", label: "Um 15 Uhr im Park" }, { id: "c", label: "Um 16 Uhr im Kino" }],
      correctOptionId: "a", explanation: "Anna nennt das Café am Markt um 16 Uhr als Plan bei Regen.",
    } },
    { id: `${prefix}-vorlieben`, type: "worked-example", heading: "Was machen Sie gern?", problem: "Sie erzählen einem neuen Freund von Ihrer Freizeit und wählen eine Aktivität.", steps: [
      { id: `${prefix}-vorliebe-1`, title: "gern", body: "Ich spiele gern Volleyball." },
      { id: `${prefix}-vorliebe-2`, title: "lieber · eine Wahl", body: "Bei Regen gehe ich lieber ins Café." },
      { id: `${prefix}-vorliebe-3`, title: "am liebsten · besonders gern", body: "Am liebsten treffe ich am Wochenende Freunde." },
    ], answer: "Verb + gern, lieber oder am liebsten: Ich spiele gern. Ich gehe lieber ins Café." },
    { id: `${prefix}-antwort-check`, type: "knowledge-check", heading: "Mini-Check · höflich absagen", completion: "pass", required: true, question: {
      id: `${prefix}-antwort-frage`, prompt: "Sie können am Samstag nicht spielen. Welche Antwort nennt auch eine neue Möglichkeit?",
      options: [{ id: "a", label: "Danke, am Samstag kann ich nicht. Hast du am Sonntag Zeit?" }, { id: "b", label: "Ja, um 15 Uhr im Park." }, { id: "c", label: "Ich spiele gern Volleyball." }],
      correctOptionId: "a", explanation: "Die Antwort sagt höflich ab und schlägt Sonntag vor.",
    } },
  ];
}

function health(prefix: string): LessonBlock[] {
  return [
    { id: `${prefix}-beschwerden`, type: "comparison-table", heading: "In der Praxis sagen, was los ist", columns: ["Frage", "Einfache Antwort"], rows: [
      ["Was fehlt Ihnen?", "Ich habe Fieber."], ["Wo tut es weh?", "Mein Kopf tut weh."],
      ["Brauchen Sie einen Termin?", "Ja. Haben Sie heute einen Termin?"],
      ["Können Sie um neun Uhr kommen?", "Ja, neun Uhr passt."],
    ] },
    { id: `${prefix}-termin-check`, type: "knowledge-check", heading: "Mini-Check · Termin in der Praxis", completion: "pass", required: true, question: {
      id: `${prefix}-termin-frage`, prompt: "Wann soll Eddy laut Telefongespräch in die Praxis kommen?",
      options: [{ id: "a", label: "Heute um 9 Uhr" }, { id: "b", label: "Morgen um 10 Uhr" }, { id: "c", label: "Am Samstag um 9 Uhr" }],
      correctOptionId: "a", explanation: "Die Mitarbeiterin fragt, ob Eddy um neun Uhr kommen kann; er bestätigt.",
    } },
    { id: `${prefix}-anweisung`, type: "worked-example", heading: "Eine einfache Anweisung verstehen", problem: "Die Mitarbeiterin gibt Eddy eine Information für seinen Praxisbesuch.", steps: [
      { id: `${prefix}-anweisung-1`, title: "Die Bitte", body: "Bringen Sie bitte Ihre Versicherungskarte mit." },
      { id: `${prefix}-anweisung-2`, title: "Was muss Eddy tun?", body: "Eddy muss seine Versicherungskarte mitbringen." },
      { id: `${prefix}-anweisung-3`, title: "Noch einmal fragen", body: "Entschuldigung, was muss ich mitbringen?" },
    ], answer: "Merken Sie sich bei einer Anweisung die Handlung: die Versicherungskarte mitbringen." },
    { id: `${prefix}-karte-check`, type: "knowledge-check", heading: "Mini-Check · was mitbringen?", completion: "pass", required: true, question: {
      id: `${prefix}-karte-frage`, prompt: "Was soll Eddy zum Termin mitbringen?",
      options: [{ id: "a", label: "Seine Versicherungskarte" }, { id: "b", label: "Eine Fahrkarte" }, { id: "c", label: "Sein Kursbuch" }],
      correctOptionId: "a", explanation: "Die Praxis bittet Eddy, seine Versicherungskarte mitzubringen.",
    } },
  ];
}

function weatherAndPlans(prefix: string): LessonBlock[] {
  return [
    { id: `${prefix}-wochenendplan`, type: "comparison-table", heading: "Wetter lesen und einen Plan machen", columns: ["Tag", "Wetter", "Passender Plan"], rows: [
      ["Samstagvormittag", "sonnig, etwa 22 Grad", "Um 10 Uhr im Park spazieren gehen"],
      ["Sonntag ab 14 Uhr", "Regen und Wind", "Den Spaziergang nicht für den Nachmittag planen"],
      ["Samstag bei Regen", "Regen", "Im Café am Markt treffen"],
    ] },
    { id: `${prefix}-tag-check`, type: "knowledge-check", heading: "Mini-Check · der bessere Tag", completion: "pass", required: true, question: {
      id: `${prefix}-tag-frage`, prompt: "Anna und Eddy möchten bei Sonne spazieren gehen. Welcher Termin passt zur Vorhersage?",
      options: [{ id: "a", label: "Samstag um 10 Uhr" }, { id: "b", label: "Sonntag um 16 Uhr" }, { id: "c", label: "Sonntag um 14 Uhr" }],
      correctOptionId: "a", explanation: "Für Samstag sind Sonne und Wärme angekündigt; am Sonntag regnet es ab 14 Uhr.",
    } },
    { id: `${prefix}-morgen`, type: "worked-example", heading: "Über morgen sprechen · Präsens", problem: "Sie verabreden etwas für das Wochenende.", steps: [
      { id: `${prefix}-morgen-1`, title: "Zeitwort zuerst erkennen", body: "Morgen, am Samstag und am Wochenende zeigen: Es geht um die Zukunft." },
      { id: `${prefix}-morgen-2`, title: "Präsens genügt", body: "Am Samstag gehen wir um zehn Uhr spazieren." },
      { id: `${prefix}-morgen-3`, title: "Plan ändern", body: "Bei Regen treffen wir uns im Café." },
    ], answer: "Für einen einfachen Plan brauchen Sie keine neue Zukunftsform: Morgen gehen wir in den Park." },
    { id: `${prefix}-plan-check`, type: "knowledge-check", heading: "Mini-Check · Plan bei Regen", completion: "pass", required: true, question: {
      id: `${prefix}-plan-frage`, prompt: "Es regnet am Samstag. Welche Nachricht passt zum Plan von Anna und Eddy?",
      options: [{ id: "a", label: "Wir treffen uns heute im Café am Markt." }, { id: "b", label: "Wir gehen jetzt im Park spazieren." }, { id: "c", label: "Am Sonntag um 14 Uhr ist es sonnig." }],
      correctOptionId: "a", explanation: "Bei Regen wollen sie sich im Café am Markt treffen.",
    } },
  ];
}

function messagesAndForms(prefix: string): LessonBlock[] {
  return [
    { id: `${prefix}-terminwechsel`, type: "comparison-table", heading: "Einen geänderten Termin prüfen", columns: ["Information", "Sprachschule Mitte"], rows: [
      ["Alter Termin", "Dienstag, 9 Uhr"], ["Neuer Termin", "Mittwoch, 11 Uhr"],
      ["Antwort bis", "Montag"], ["Mitbringen", "Ausweis"],
    ] },
    { id: `${prefix}-neu-check`, type: "knowledge-check", heading: "Mini-Check · neuer Termin", completion: "pass", required: true, question: {
      id: `${prefix}-neu-frage`, prompt: "Welche Angabe muss Sam in seiner Antwort bestätigen?",
      options: [{ id: "a", label: "Mittwoch um 11 Uhr" }, { id: "b", label: "Dienstag um 9 Uhr" }, { id: "c", label: "Donnerstag um 18 Uhr" }],
      correctOptionId: "a", explanation: "Der Beratungstermin wurde auf Mittwoch um 11 Uhr verschoben.",
    } },
    { id: `${prefix}-formular-nachricht`, type: "worked-example", heading: "Formular oder Nachricht?", problem: "Die Sprachschule braucht persönliche Angaben im Formular und eine kurze Antwort zum neuen Termin.", steps: [
      { id: `${prefix}-form-1`, title: "Im Formular · kurze Angaben", body: "Vorname: Sam · Nachname: Weber · Telefonnummer: 0176 1234567" },
      { id: `${prefix}-form-2`, title: "In der E-Mail · ganze Sätze", body: "Guten Tag, der Termin am Mittwoch um 11 Uhr passt. Ich bringe meinen Ausweis mit." },
      { id: `${prefix}-form-3`, title: "Passender Schluss", body: "Vielen Dank und freundliche Grüße, Sam Weber" },
    ], answer: "Schreiben Sie in Formularfelder nur die gefragten Daten. In einer E-Mail beantworten Sie die wichtige Frage in kurzen Sätzen." },
    { id: `${prefix}-frist-check`, type: "knowledge-check", heading: "Mini-Check · rechtzeitig antworten", completion: "pass", required: true, question: {
      id: `${prefix}-frist-frage`, prompt: "Bis wann soll Sam per E-Mail antworten?",
      options: [{ id: "a", label: "Bis Montag" }, { id: "b", label: "Bis Mittwoch um 11 Uhr" }, { id: "c", label: "Bis 15. September" }],
      correctOptionId: "a", explanation: "Die Sprachschule bittet um eine kurze Antwort bis Montag.",
    } },
  ];
}

export function lifePracticeBlocks(number: number, prefix: string): LessonBlock[] {
  if (number === 10) return workAndLearning(prefix);
  if (number === 11) return freeTime(prefix);
  if (number === 12) return health(prefix);
  if (number === 13) return weatherAndPlans(prefix);
  if (number === 14) return messagesAndForms(prefix);
  return [];
}

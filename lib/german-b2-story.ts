import { migrateAcademyCourse } from "./academy-schema.ts";
import type { AcademyCourse, LessonBlock, QuizQuestion } from "./tutor-academy.ts";

export const GERMAN_B2_STORY_KEY = "deutsch-b2-ankommen";
export type StorySpeaker = "Mira" | "Jonas" | "Leyla";
export type StoryTurn = { speaker: StorySpeaker; text: string };
type Episode = {
  slug: string; title: string; summary: string; setting: string; recap: string;
  dialogue: StoryTurn[];
  words: [string, string, string][];
  questions: { prompt: string; options: [string, string, string]; answer: number; explanation: string }[];
  grammar: { title: string; rule: string; examples: string[]; prompt: string; options: [string, string, string]; answer: number; explanation: string };
  writing: { prompt: string; checklist: string[]; model: string };
  speaking: { prompt: string; checklist: string[]; model: string };
  cliffhanger: string;
};

// Original fiction. The same turns power the transcript and generated audio.
export const germanB2StoryEpisodes: Episode[] = [
  {
    slug: "der-aushang", title: "01 · Der Aushang",
    summary: "Zwischen den Zeilen hören und einen höflichen Vorschlag machen.",
    setting: "Montagabend im Treppenhaus eines Berliner Mietshauses. Mira, eine neue Nachbarin, bleibt vor einem Aushang stehen. Jonas wohnt seit acht Jahren im Haus; Leyla organisiert den Reparaturtreff.",
    recap: "Mira ist vor zwei Wochen eingezogen. Sie kennt bisher nur Jonas, der ihr beim Tragen geholfen hat. Heute möchte sie zum ersten Mal zum Reparaturtreff gehen.",
    dialogue: [
      { speaker: "Mira", text: "Entschuldigung, ist das der Raum für den Reparaturtreff? Auf dem Aushang steht, dass er ab nächsten Monat nicht mehr zur Verfügung steht. Findet der Treff dann woanders statt?" },
      { speaker: "Jonas", text: "Wenn wir einen anderen Ort hätten, wären wir schon weiter. Die Hausverwaltung möchte den Raum als Lager vermieten. Angeblich wird er kaum genutzt. Dabei sind wir jeden zweiten Samstag hier." },
      { speaker: "Leyla", text: "Jeden zweiten Samstag ist der Plan, Jonas. Letzten Monat mussten wir zweimal absagen, weil niemand den Schlüssel hatte. Das sollten wir nicht verschweigen, wenn wir mit der Verwaltung sprechen." },
      { speaker: "Mira", text: "Dann geht es vielleicht weniger darum, ob der Treff sinnvoll ist, sondern darum, ob die Nutzung zuverlässig organisiert wird. Könnten wir nicht zuerst herausfinden, welche Bedenken die Verwaltung genau hat?" },
      { speaker: "Jonas", text: "Ich habe bereits eine ziemlich deutliche E-Mail geschrieben. Wenn sie Geld verdienen wollen, wird ein freundliches Gespräch wohl kaum reichen." },
      { speaker: "Leyla", text: "Mit dem Vorwurf kommen wir nicht weiter. Die E-Mail ist noch nicht abgeschickt, oder? Ich würde lieber um einen Termin bitten und konkrete Vorschläge mitbringen: einen Schlüsselplan, feste Zeiten und eine verantwortliche Person." },
      { speaker: "Mira", text: "Ich könnte den Entwurf lesen, wenn du möchtest. In meinem alten Haus haben wir einen ähnlichen Konflikt gelöst. Nicht alle waren sofort begeistert, aber eine befristete Vereinbarung hat geholfen." },
      { speaker: "Jonas", text: "Gut, noch habe ich nichts verschickt. Allerdings möchte ich nicht, dass wir am Ende für alles verantwortlich sind und trotzdem keinen Raum bekommen." },
      { speaker: "Leyla", text: "Das ist ein berechtigter Einwand. Wir könnten eine Probephase vorschlagen, sofern die Bedingungen für beide Seiten klar sind. Morgen treffen wir uns um halb sieben und schreiben gemeinsam." },
      { speaker: "Mira", text: "Einverstanden. Dann frage ich inzwischen die anderen, wofür sie den Raum nutzen würden. Vielleicht gibt es mehr Interesse, als die Verwaltung vermutet." },
    ],
    words: [
      ["der Aushang, die Aushänge", "a notice posted in a shared place", "Am Aushang steht eine wichtige Änderung."],
      ["zur Verfügung stehen", "to be available for use", "Der Raum steht uns samstags zur Verfügung."],
      ["die Bedenken (Plural)", "concerns or reservations", "Welche Bedenken hat die Verwaltung?"],
      ["verschweigen · verschwieg · hat verschwiegen", "to withhold a relevant fact", "Wir sollten die abgesagten Termine nicht verschweigen."],
      ["der Vorwurf, die Vorwürfe", "an accusation", "Ein Vorwurf ersetzt keinen Vorschlag."],
      ["befristet", "limited to a defined period", "Wir wünschen uns eine befristete Vereinbarung."],
      ["der Einwand, die Einwände", "an objection to an argument or proposal", "Jonas bringt einen berechtigten Einwand vor."],
      ["sofern", "provided that; introduces a condition", "Wir stimmen zu, sofern die Bedingungen klar sind."],
    ],
    questions: [
      { prompt: "Was lässt sich aus Jonas' erster Antwort schließen?", options: ["Der neue Treffpunkt ist bereits gebucht.", "Die Gruppe hat bisher keinen Ersatzraum.", "Jonas möchte den Treff endgültig beenden."], answer: 1, explanation: "‚Wenn wir einen anderen Ort hätten …‘ beschreibt eine nicht erfüllte Bedingung. Ein Ersatzraum fehlt bisher." },
      { prompt: "Warum korrigiert Leyla Jonas bei den regelmäßigen Treffen?", options: ["Sie möchte gegenüber der Verwaltung glaubwürdig bleiben.", "Sie findet den Reparaturtreff grundsätzlich unnötig.", "Sie hat beschlossen, den Schlüssel abzugeben."], answer: 0, explanation: "Leyla nennt die ausgefallenen Termine und sagt ausdrücklich, dass die Gruppe sie nicht verschweigen sollte." },
      { prompt: "Was vereinbaren die drei tatsächlich?", options: ["Sie schicken Jonas' E-Mail sofort ab.", "Sie akzeptieren die Schließung ohne Gespräch.", "Sie formulieren morgen gemeinsam eine Nachricht."], answer: 2, explanation: "Leyla schlägt ein Treffen morgen um halb sieben zum gemeinsamen Schreiben vor; Mira stimmt zu." },
    ],
    grammar: {
      title: "Konjunktiv II · Vorschläge statt Vorwürfe",
      rule: "Mit könnte, würde und wäre formulieren Sie Vorschläge oder hypothetische Bedingungen. Im wenn-Satz steht das finite Verb am Ende; im folgenden Hauptsatz steht es vor dem Subjekt. English: these forms soften proposals or describe an unreal condition; they do not automatically describe the past.",
      examples: ["Könnten wir zunächst um einen Termin bitten?", "Ich würde eine Probephase vorschlagen.", "Wenn wir einen Ersatzraum hätten, wären wir weniger unter Druck."],
      prompt: "Welche Formulierung schlägt höflich ein Gespräch vor, ohne es als vereinbart darzustellen?",
      options: ["Sie müssen morgen mit uns sprechen.", "Könnten wir einen Gesprächstermin vereinbaren?", "Wir haben gestern einen Termin vereinbart."], answer: 1,
      explanation: "‚Könnten wir …?‘ ist eine höfliche Anfrage. ‚Müssen‘ fordert; ‚haben vereinbart‘ behauptet eine bereits erfolgte Vereinbarung.",
    },
    writing: {
      prompt: "Schreiben Sie als Mira eine E-Mail an die Hausverwaltung (120–160 Wörter). Beziehen Sie sich auf den Aushang, erklären Sie den Nutzen des Raums, nennen Sie das bisherige Schlüsselproblem und schlagen Sie ein Gespräch sowie eine befristete Probephase vor. Erfinden Sie keine bereits erteilte Zusage.",
      checklist: ["Anrede, Betreff und passender Abschluss", "Nutzen und bisheriges Problem sachlich darstellen", "Zwei höfliche Vorschläge mit Konjunktiv II", "Eine klare Bitte um Rückmeldung"],
      model: "Betreff: Gespräch zur weiteren Nutzung des Gemeinschaftsraums\n\nSehr geehrte Damen und Herren,\nauf Ihrem Aushang haben wir gelesen, dass der Gemeinschaftsraum ab nächsten Monat als Lager vermietet werden soll. Wir würden gern mit Ihnen über eine weitere Nutzung durch die Hausgemeinschaft sprechen.\nDer Reparaturtreff ermöglicht es Nachbarinnen und Nachbarn, Gegenstände gemeinsam zu reparieren und Erfahrungen auszutauschen. Allerdings sind zuletzt zwei Termine ausgefallen, weil der Zugang zum Schlüssel nicht zuverlässig geregelt war. Dieses Problem möchten wir offen ansprechen und künftig durch einen verbindlichen Schlüsselplan lösen.\nKönnten wir einen Gesprächstermin vereinbaren und dabei eine dreimonatige Probephase besprechen? Wir würden feste Nutzungszeiten und eine verantwortliche Ansprechperson vorschlagen. Die genauen Bedingungen sollten wir gemeinsam festlegen. Über eine Rückmeldung mit einem möglichen Termin in der kommenden Woche würden wir uns freuen.\n\nMit freundlichen Grüßen\nMira" },
    speaking: {
      prompt: "Sie sind Jonas. Antworten Sie Mira in einer zweiminütigen Sprachnachricht: Nennen Sie Ihre Sorge, erkennen Sie einen Vorteil ihres Vorschlags an und formulieren Sie eine Bedingung für Ihre Zustimmung.",
      checklist: ["Eine Sorge konkret begründen", "Auf Miras Vorschlag eingehen", "Eine höfliche Alternative oder Bedingung nennen", "Ohne vollständiges Skript sprechen"],
      model: "Ich finde gut, dass du zuerst nach den Bedenken fragen möchtest. Allerdings befürchte ich, dass wir viel Arbeit übernehmen, ohne Planungssicherheit zu bekommen. Einer Probephase könnte ich zustimmen, sofern die Verwaltung den Raum während dieser Zeit verbindlich reserviert. Könnten wir das im Gespräch klären?" },
    cliffhanger: "Mira sammelt Rückmeldungen. Am nächsten Morgen findet sie eine Nachricht von Leyla: ‚Es gibt Interesse. Aber nicht alle wollen einen Reparaturtreff.‘",
  },
  {
    slug: "nicht-nur-eine-frage-des-geldes", title: "02 · Nicht nur eine Frage des Geldes",
    summary: "Argumente abwägen, Zugeständnisse machen und einen Kompromiss begründen.",
    setting: "Dienstagabend am Küchentisch von Leyla. Mira hat Rückmeldungen gesammelt. Jonas bringt eine Kostenübersicht mit.",
    recap: "Die drei haben die kritische E-Mail noch nicht abgeschickt. Sie wollen der Verwaltung eine Probephase vorschlagen, müssen sich aber zuerst über die Nutzung einigen.",
    dialogue: [
      { speaker: "Mira", text: "Ich habe mit zwölf Leuten gesprochen. Acht würden den Raum gern nutzen. Vier davon wünschen sich einen ruhigen Lernabend, die anderen vier möchten reparieren. Zwei weitere haben vor allem Angst vor Lärm. Die übrigen zwei hatten keine klare Meinung." },
      { speaker: "Jonas", text: "Wenn wir alles anbieten, verlieren wir unser eigentliches Ziel. Außerdem kostet die Nutzung Geld: Strom, Reinigung und vielleicht eine Versicherung. Mit Begeisterung allein lässt sich das nicht bezahlen." },
      { speaker: "Leyla", text: "Da hast du recht. Trotzdem wäre es unfair, nur unseren Treff zu berücksichtigen. Einerseits brauchen wir ein überschaubares Konzept, andererseits soll der Raum möglichst vielen offenstehen." },
      { speaker: "Mira", text: "Wie wäre es mit getrennten Zeiten? Ein Lernabend am Mittwoch und der Reparaturtreff am Samstag. So entstehen keine Konflikte zwischen ruhigem Lernen und lauten Werkzeugen." },
      { speaker: "Jonas", text: "Das klingt vernünftig, allerdings müssten für beide Angebote Menschen Verantwortung übernehmen. Ich kann den Reparaturtreff betreuen, aber nicht zusätzlich jeden Mittwoch hier sitzen." },
      { speaker: "Leyla", text: "Ich übernehme zunächst die Lernabende. Obwohl ich das gern mache, möchte ich keine Dauerlösung versprechen. Nach drei Monaten sollten wir prüfen, ob sich weitere Personen beteiligen." },
      { speaker: "Mira", text: "Und die Kosten? Ich könnte eine einfache Liste führen. Wir sollten zuerst nach den tatsächlichen Ausgaben fragen, statt einen Beitrag festzulegen, den wir später nicht erklären können." },
      { speaker: "Jonas", text: "Einverstanden. Für die Reparaturen könnten wir freiwillige Beiträge sammeln. Allerdings darf die Teilnahme nicht davon abhängen, ob jemand Geld geben kann." },
      { speaker: "Leyla", text: "Dann halten wir fest: zwei Angebote, feste Zeiten und transparente Kosten. Während der Probephase endet die Nutzung spätestens um zwanzig Uhr. Damit nehmen wir die Sorge wegen des Lärms ernst." },
      { speaker: "Mira", text: "Das sollten wir den beiden besorgten Nachbarn erklären, bevor wir den Plan einreichen. Ein Kompromiss funktioniert schließlich nur, wenn auch die Betroffenen verstehen, wie er zustande gekommen ist." },
      { speaker: "Jonas", text: "Gut. Ich hätte nicht gedacht, dass aus unserem Reparaturtreff ein gemeinsamer Plan wird. Jetzt fehlt nur noch die Zustimmung der Verwaltung." },
    ],
    words: [
      ["abwägen · wog ab · hat abgewogen", "to weigh competing considerations", "Wir müssen Nutzen und Aufwand abwägen."],
      ["berücksichtigen", "to take something into account", "Wir berücksichtigen die Sorge wegen des Lärms."],
      ["überschaubar", "manageable; limited enough to understand", "Ein überschaubares Konzept erleichtert die Planung."],
      ["Verantwortung übernehmen", "to take responsibility", "Leyla übernimmt Verantwortung für die Lernabende."],
      ["sich beteiligen an (+ Dativ)", "to participate in or contribute to", "Weitere Personen beteiligen sich an der Organisation."],
      ["der Beitrag, die Beiträge", "a contribution, including a payment", "Der finanzielle Beitrag bleibt freiwillig."],
      ["transparent", "clear and open to scrutiny", "Die Kosten müssen transparent sein."],
      ["zustande kommen · kam zustande · ist zustande gekommen", "to come about", "Wie ist der Kompromiss zustande gekommen?"],
    ],
    questions: [
      { prompt: "Welche Aussage ist durch Miras Rückmeldungen gedeckt?", options: ["Alle zwölf möchten regelmäßig reparieren.", "Acht unterstützen eine Nutzung, aber mit unterschiedlichen Wünschen.", "Die Mehrheit lehnt jede Nutzung ab."], answer: 1, explanation: "Acht möchten den Raum nutzen: vier zum Lernen und vier zum Reparieren. Zwei äußern Lärmsorgen, zwei keine klare Meinung." },
      { prompt: "Was begrenzt Leylas Zusage?", options: ["Sie bietet nur eine vorläufige Betreuung an.", "Sie betreut die Lernabende nur gegen Bezahlung.", "Sie will ausschließlich samstags helfen."], answer: 0, explanation: "‚Zunächst‘ und ‚keine Dauerlösung versprechen‘ schränken die Zusage ein. Nach drei Monaten soll die Beteiligung überprüft werden." },
      { prompt: "Welche Kostenregelung ist am Ende vereinbart?", options: ["Alle müssen denselben festen Beitrag zahlen.", "Die Verwaltung übernimmt bereits sämtliche Kosten.", "Ausgaben werden geklärt; Reparaturbeiträge sollen freiwillig bleiben."], answer: 2, explanation: "Mira will zunächst die tatsächlichen Ausgaben erfragen. Jonas schlägt freiwillige Beiträge vor; die Teilnahme soll nicht vom Geld abhängen." },
    ],
    grammar: {
      title: "Obwohl und trotzdem · Einen Einwand anerkennen",
      rule: "Obwohl leitet einen Nebensatz mit Verb am Ende ein. Trotzdem steht in einem Hauptsatz: Am Satzanfang folgt das finite Verb direkt danach. Mit einerseits … andererseits stellen Sie zwei Gesichtspunkte gegenüber. English: acknowledge a real objection before explaining why your proposal still makes sense.",
      examples: ["Obwohl die Organisation Zeit kostet, lohnt sich die gemeinsame Nutzung.", "Die Organisation kostet Zeit. Trotzdem lohnt sich die gemeinsame Nutzung.", "Einerseits brauchen wir Ruhe, andererseits möchten wir gemeinsam reparieren."],
      prompt: "Welche Verbindung hat die richtige Wortstellung?",
      options: ["Obwohl die Organisation kostet Zeit, lohnt sich der Treff.", "Die Organisation kostet Zeit. Trotzdem der Treff lohnt sich.", "Obwohl die Organisation Zeit kostet, lohnt sich der Treff."], answer: 2,
      explanation: "Im obwohl-Nebensatz steht ‚kostet‘ am Ende. Nach dem vorangestellten Nebensatz beginnt der Hauptsatz mit dem finiten Verb ‚lohnt‘.",
    },
    writing: {
      prompt: "Schreiben Sie einen Beitrag für die Hausgruppe (120–160 Wörter). Stellen Sie beide Nutzungswünsche dar, greifen Sie die Lärmsorge auf und begründen Sie den Kompromiss mit getrennten Zeiten, Ende um 20 Uhr und einer Probephase. Verwenden Sie obwohl oder trotzdem sowie einerseits … andererseits.",
      checklist: ["Beide Wünsche fair darstellen", "Lärmsorge und konkrete Lösung verbinden", "Mindestens zwei passende Satzverbindungen", "Zu einer Rückmeldung einladen"],
      model: "Liebe Nachbarinnen und Nachbarn,\nbei unseren Gesprächen haben sich zwei Wünsche gezeigt: Einige möchten gemeinsam reparieren, andere suchen einen ruhigen Ort zum Lernen. Einerseits brauchen wir ein einfaches Konzept, andererseits sollte der Raum verschiedenen Interessen offenstehen. Deshalb schlagen wir einen Lernabend am Mittwoch und einen Reparaturtreff am Samstag vor.\nObwohl beide Angebote einen Nutzen haben, verstehen wir die Sorge wegen möglicher Geräusche. Die Nutzung soll daher spätestens um 20 Uhr enden. Außerdem werden die Zeiten getrennt, damit Werkzeuge niemanden beim Lernen stören. Für jedes Angebot wird eine Ansprechperson benannt.\nWir möchten das Konzept zunächst drei Monate erproben und anschließend gemeinsam auswerten. Die tatsächlichen Kosten müssen wir noch mit der Verwaltung klären. Freiwillige Beiträge für Reparaturen sollen niemanden von der Teilnahme ausschließen. Bitte teilt uns mit, welche weiteren Bedenken oder Verbesserungsvorschläge ihr habt.\nViele Grüße\nMira" },
    speaking: {
      prompt: "Eine Nachbarin sagt: ‚Ein gemeinsamer Raum bedeutet doch nur mehr Lärm.‘ Antworten Sie zwei Minuten lang: Erkennen Sie die Sorge an, erläutern Sie den Kompromiss und fragen Sie nach einer konkreten Bedingung für ihre Zustimmung.",
      checklist: ["Den Einwand zuerst sachlich wiedergeben", "Zwei konkrete Maßnahmen erklären", "Eine Einschränkung offen benennen", "Eine echte Rückfrage stellen"],
      model: "Ich verstehe, dass Sie abends Ruhe brauchen. Obwohl wir den Raum gemeinsam nutzen möchten, soll das nicht auf Kosten Ihrer Erholung gehen. Wir trennen deshalb Lernabende und Reparaturtreffen; beide enden spätestens um zwanzig Uhr. Ob die Regeln ausreichen, müssten wir in der Probephase prüfen. Welche zusätzliche Vereinbarung wäre Ihnen besonders wichtig?" },
    cliffhanger: "Die Nachricht ist abgeschickt. Am Freitag kommt die Antwort: Die Verwaltung bietet einen Termin an – und verlangt eine einzige verantwortliche Kontaktperson.",
  },
  {
    slug: "eine-zusage-mit-bedingungen", title: "03 · Eine Zusage mit Bedingungen",
    summary: "Aussagen korrekt wiedergeben und Zusagen von offenen Punkten unterscheiden.",
    setting: "Freitag nach dem Gespräch mit der Hausverwaltung. Leyla hat am Termin teilgenommen. Mira und Jonas warten im Gemeinschaftsraum.",
    recap: "Der gemeinsame Plan sieht Lernabende und Reparaturtreffen zu getrennten Zeiten vor. Die Verwaltung hat ein Gespräch angeboten und eine Kontaktperson verlangt. Noch gibt es keine Genehmigung.",
    dialogue: [
      { speaker: "Jonas", text: "Und? Können wir den Raum behalten? Ich habe schon angefangen, einen neuen Termin für den Reparaturtreff vorzubereiten." },
      { speaker: "Leyla", text: "Noch nicht verbindlich. Die Verwalterin sagte, sie sei grundsätzlich mit einer dreimonatigen Probephase einverstanden. Voraussetzung sei aber eine schriftliche Nutzungsvereinbarung. Die bekommen wir erst nächste Woche." },
      { speaker: "Mira", text: "Dann sollten wir heute keine endgültige Zusage in die Hausgruppe schreiben. Was steht denn schon fest, und welche Punkte sind noch offen?" },
      { speaker: "Leyla", text: "Sie hat bestätigt, dass mittwochs und samstags grundsätzlich möglich seien. Außerdem verlange die Verwaltung eine Kontaktperson und ein Protokoll über die Nutzung. Über die Reinigungskosten müsse noch gesprochen werden." },
      { speaker: "Jonas", text: "Ein Protokoll nach jedem Treffen? Das klingt nach ziemlich viel Bürokratie. Und Kontaktperson heißt hoffentlich nicht, dass eine Person jede Rechnung privat bezahlen muss." },
      { speaker: "Leyla", text: "Genau das habe ich gefragt. Sie sagte, die Kontaktperson solle nur Informationen weitergeben. Ob im Entwurf zusätzliche Verpflichtungen stehen, müssen wir allerdings noch prüfen. Ich habe nichts unterschrieben." },
      { speaker: "Mira", text: "Ich würde die Kommunikation übernehmen, sofern wir wichtige Entscheidungen weiterhin gemeinsam treffen. Das Nutzungsprotokoll könnte sehr kurz sein: Datum, Angebot, Anzahl der Teilnehmenden und besondere Vorkommnisse." },
      { speaker: "Jonas", text: "Damit könnte ich leben. Bevor wir anfangen, sollten wir aber schriftlich klären, wer für Schäden verantwortlich ist und wie hoch die Kosten werden. Sonst streiten wir später über etwas, das niemand so gemeint hat." },
      { speaker: "Leyla", text: "Einverstanden. Ich schreibe der Verwalterin eine Zusammenfassung und bitte um Bestätigung der offenen Punkte. Der erste Treff findet erst statt, wenn die Vereinbarung geprüft und unterschrieben ist." },
      { speaker: "Mira", text: "Dann informiere ich die Hausgruppe: Es gibt eine grundsätzliche Bereitschaft, aber noch keine endgültige Genehmigung. Wir sammeln jetzt Fragen zum Entwurf, statt schon Einladungen zu verschicken." },
      { speaker: "Jonas", text: "Schade, ich hätte gern sofort losgelegt. Aber lieber ein klarer Anfang als ein Missverständnis. Den Werkzeugkasten räume ich trotzdem schon einmal auf." },
    ],
    words: [
      ["verbindlich", "binding or firmly agreed", "Die Zusage ist noch nicht verbindlich."],
      ["grundsätzlich", "in principle, without settling every detail", "Die Verwaltung ist grundsätzlich einverstanden."],
      ["die Voraussetzung, die Voraussetzungen", "a prerequisite", "Eine schriftliche Vereinbarung ist Voraussetzung."],
      ["die Verpflichtung, die Verpflichtungen", "an obligation", "Wir prüfen den Entwurf auf zusätzliche Verpflichtungen."],
      ["das Vorkommnis, die Vorkommnisse", "an incident or notable occurrence", "Besondere Vorkommnisse gehören ins Protokoll."],
      ["haften für (+ Akkusativ)", "to be liable for", "Im Gespräch wird gefragt, wer für Schäden haftet."],
      ["die Genehmigung, die Genehmigungen", "an approval or authorization", "Eine endgültige Genehmigung liegt noch nicht vor."],
      ["die Bereitschaft", "willingness", "Die Verwaltung zeigt Bereitschaft zum Gespräch."],
    ],
    questions: [
      { prompt: "Wie ist das Ergebnis des Gesprächs am treffendsten zusammengefasst?", options: ["Eine endgültige Genehmigung liegt vor.", "Eine Probephase ist grundsätzlich möglich, aber noch an Bedingungen geknüpft.", "Die Verwaltung hat jede gemeinsame Nutzung ausgeschlossen."], answer: 1, explanation: "Leyla betont ‚noch nicht verbindlich‘. Eine schriftliche Vereinbarung fehlt; Kosten und Verantwortung müssen geklärt werden." },
      { prompt: "Welche Information bleibt ausdrücklich ungeklärt?", options: ["Ob Mira im Haus wohnt.", "Ob Jonas Werkzeug besitzt.", "Wie hoch die Reinigungskosten werden."], answer: 2, explanation: "Leyla berichtet, über Reinigungskosten müsse noch gesprochen werden. Es wird kein Betrag genannt." },
      { prompt: "Was muss vor dem ersten Treff geschehen?", options: ["Die Vereinbarung muss geprüft und unterschrieben sein.", "Mira muss alle Rechnungen privat übernehmen.", "Jonas muss sofort Einladungen verschicken."], answer: 0, explanation: "Leyla legt ausdrücklich fest: Der erste Treff findet erst nach Prüfung und Unterschrift statt. Private Zahlungspflichten sind keine vereinbarte Zusage." },
    ],
    grammar: {
      title: "Konjunktiv I · Berichten, ohne mehr zu versprechen",
      rule: "In formellen Berichten markiert der Konjunktiv I die Wiedergabe einer fremden Aussage: sie sei, sie habe, sie könne, sie müsse. Er kennzeichnet die Quelle; er bedeutet nicht automatisch, dass die Aussage falsch ist. Ist die Form mit dem Indikativ identisch, wird häufig eine Ersatzform gewählt. English: keep reported statements distinct from confirmed facts and your own conclusions.",
      examples: ["Die Verwalterin sagte, sie sei grundsätzlich einverstanden.", "Leyla berichtet, die Verwaltung verlange ein Protokoll.", "Über die Kosten müsse noch gesprochen werden."],
      prompt: "Welche Wiedergabe bewahrt die Einschränkung aus ‚Ich bin grundsätzlich einverstanden‘?",
      options: ["Sie sagte, sie sei grundsätzlich einverstanden.", "Sie sagte, die Genehmigung sei endgültig erteilt.", "Sie sagte, sie wäre gestern grundsätzlich einverstanden gewesen."], answer: 0,
      explanation: "‚Sei grundsätzlich einverstanden‘ gibt die ursprüngliche Aussage wieder. Eine endgültige Genehmigung oder eine vergangene hypothetische Zustimmung wurde nicht behauptet.",
    },
    writing: {
      prompt: "Informieren Sie die Hausgruppe über das Gespräch (120–160 Wörter). Geben Sie zwei Aussagen der Verwaltung im Konjunktiv I wieder. Unterscheiden Sie die grundsätzliche Zustimmung von offenen Kosten- und Haftungsfragen. Erklären Sie, was vor dem ersten Treff passieren muss.",
      checklist: ["Zwei korrekt wiedergegebene Aussagen", "Keine endgültige Genehmigung behaupten", "Offene Fragen und nächsten Schritt nennen", "Sachlich und verständlich formulieren"],
      model: "Liebe Nachbarinnen und Nachbarn,\nLeyla hat heute mit der Hausverwaltung über unseren Vorschlag gesprochen. Die Verwalterin sagte, sie sei grundsätzlich mit einer dreimonatigen Probephase einverstanden. Eine schriftliche Nutzungsvereinbarung sei jedoch Voraussetzung. Wir erwarten den Entwurf nächste Woche; eine endgültige Genehmigung liegt deshalb noch nicht vor.\nMittwoch und Samstag wurden als grundsätzlich mögliche Zeiten genannt. Die Verwaltung wünsche außerdem eine Kontaktperson und ein kurzes Nutzungsprotokoll. Mira hat angeboten, die Kommunikation zu übernehmen, sofern wichtige Entscheidungen gemeinsam getroffen werden. Daraus folgt bisher keine vereinbarte private Zahlungspflicht.\nOffen sind insbesondere die Reinigungskosten und die Verantwortung für mögliche Schäden. Leyla wird diese Fragen schriftlich zusammenfassen und um Klärung bitten. Der erste Treff kann erst stattfinden, wenn wir die Vereinbarung geprüft und unterschrieben haben. Bitte schickt uns eure Fragen zum geplanten Ablauf, damit wir sie beim Prüfen des Entwurfs berücksichtigen können.\nViele Grüße\nMira" },
    speaking: {
      prompt: "Fassen Sie die drei Episoden für eine neue Nachbarin in zwei Minuten zusammen. Erklären Sie den ursprünglichen Konflikt, den Kompromiss und den aktuellen Stand. Vermitteln Sie dabei zwischen Jonas' Ungeduld und Leylas Vorsicht.",
      checklist: ["Konflikt und Lösung knapp erklären", "Mindestens eine Aussage mit Quellenangabe wiedergeben", "Zusage und offene Punkte unterscheiden", "Beide Perspektiven fair darstellen"],
      model: "Die Verwaltung wollte den Gemeinschaftsraum als Lager vermieten. Daraufhin haben einige Nachbarn einen Plan mit Lernabenden und Reparaturtreffen entwickelt. Jonas möchte schnell anfangen, weil ihm der Treff wichtig ist. Leyla weist darauf hin, dass noch keine verbindliche Genehmigung vorliegt. Laut Leyla sei die Verwaltung grundsätzlich mit einer Probephase einverstanden. Zunächst müssen aber Kosten und Verantwortung geklärt werden. Ich finde, wir können die Angebote vorbereiten und gleichzeitig mit Einladungen warten, bis die Vereinbarung unterschrieben ist." },
    cliffhanger: "Ende des Piloten. Eine Woche später liegt der Entwurf im Briefkasten. Auf Seite zwei steht eine Bedingung, mit der niemand gerechnet hat … Wie könnte die Geschichte weitergehen?",
  },
];

function question(id: string, source: Episode["questions"][number]): QuizQuestion {
  return { id, type: "single-choice", prompt: source.prompt,
    options: source.options.map((label, index) => ({ id: `option-${index}`, label })),
    correctOptionId: `option-${source.answer}`, explanation: source.explanation };
}

export const germanB2StoryCourse: AcademyCourse = migrateAcademyCourse({
  key: GERMAN_B2_STORY_KEY, title: "Ankommen · Ein Haus, viele Stimmen",
  shortTitle: "Ankommen · B2 Story",
  description: "Ein originaler Geschichtenkurs für Lernende mit sicherem B1: Drei Nachbarn, ein Gemeinschaftsraum und eine Entscheidung. Drei B2-Pilotfolgen mit Hörszenen, Wortschatz, Grammatik und eigener Kommunikation. Kein vollständiger B2-Kurs und keine Prüfungssimulation.",
  audienceRoles: ["student"], estimatedMinutes: 105, passMark: 70, quizRevision: 1,
  sections: [{ id: "story", title: "Staffel 1 · Der Gemeinschaftsraum" }],
  theme: { preset: "journey", accent: "violet-mint", typography: "friendly-sans", density: "comfortable", coverStyle: "minimal", lessonHeaderStyle: "compact" },
  rules: { navigation: "free", lessonCompletion: "required-blocks", requireFinalAssessment: false, attemptLimit: null, feedbackTiming: "immediate" },
  lessons: germanB2StoryEpisodes.map((episode, index) => {
    const id = `b2-story-${index + 1}`;
    const blocks: LessonBlock[] = [
      { id: `${id}-intro`, type: "text", heading: "Die Szene", paragraphs: [episode.setting, `Bisher: ${episode.recap}`, "Hören Sie zuerst ohne Manuskript: Was möchten die Personen, und worüber sind sie sich noch nicht einig? English support is available on the vocabulary cards and in the grammar note."], completion: "view" },
      { id: `${id}-audio`, type: "audio", heading: "Erst hören · dann genauer hinsehen", url: `/audio/german-b2-story/gemini-v1/episode-${index + 1}.m4a`, caption: "Originaldialog · Gemini-Stimmen für Mira, Jonas und Leyla. Hören Sie zweimal: zuerst für die Situation, dann für Gründe und Einschränkungen.", transcript: episode.dialogue.map(turn => `${turn.speaker}: ${turn.text}`).join("\n\n"), completion: "view" },
      ...episode.questions.map((item, q) => ({ id: `${id}-listen-${q}`, type: "knowledge-check" as const, heading: ["Die Situation verstehen", "Zwischen den Zeilen", "Genau zuhören"][q], required: true, completion: "pass" as const, question: question(`${id}-question-${q}`, item) })),
      { id: `${id}-words`, type: "flashcards", heading: "Wörter, die Sie weiterbringen", items: episode.words.map(([title, meaning, example], w) => ({ id: `${id}-word-${w}`, title, body: `${meaning}\n\n${example}` })), completion: "interact" },
      { id: `${id}-grammar`, type: "text", heading: episode.grammar.title, paragraphs: [episode.grammar.rule, ...episode.grammar.examples], completion: "view" },
      { id: `${id}-grammar-check`, type: "knowledge-check", heading: "Das Sprachmuster anwenden", required: true, completion: "pass", question: question(`${id}-grammar-question`, episode.grammar) },
      { id: `${id}-write`, type: "writing-practice", heading: "Ihre Nachricht verändert die Geschichte", prompt: episode.writing.prompt, minWords: 120, maxWords: 160, checklist: episode.writing.checklist, modelAnswer: episode.writing.model, completion: "interact" },
      { id: `${id}-speak`, type: "speaking-practice", heading: "Jetzt sind Sie dran", prompt: episode.speaking.prompt, preparationSeconds: 60, targetSeconds: 120, checklist: episode.speaking.checklist, modelAnswer: episode.speaking.model, completion: "interact" },
      { id: `${id}-recall`, type: "callout", heading: index ? "Wiederholen und verbinden" : "Für morgen merken", body: index ? "Erinnern Sie sich ohne Nachschlagen an drei Wörter aus der vorherigen Folge. Verwenden Sie zwei davon und das heutige Sprachmuster in einer eigenen Zusammenfassung." : "Schließen Sie die Wortkarten. Erklären Sie Bedenken, Einwand und befristet mit eigenen Worten. Formulieren Sie anschließend einen höflichen Vorschlag.", tone: "teal" },
      { id: `${id}-next`, type: "callout", heading: index === 2 ? "Fortsetzung folgt?" : "Und dann …", body: episode.cliffhanger, tone: "navy" },
    ];
    for (const item of blocks) item.curriculum = { cefr: "B2", domain: "public", topic: "Zusammenleben und gemeinsame Entscheidungen", skills: item.type === "audio" ? ["listening"] : item.type === "writing-practice" ? ["writing"] : item.type === "speaking-practice" ? ["speaking", "mediation"] : item.type === "flashcards" ? ["vocabulary"] : ["reading", "grammar"], functions: [episode.summary], grammar: [episode.grammar.title] };
    return { id, slug: episode.slug, sectionId: "story", section: "Staffel 1 · Der Gemeinschaftsraum", title: episode.title, summary: episode.summary, durationMinutes: 35, blocks };
  }),
  quiz: [],
});

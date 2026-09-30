import type { A2Question } from "./german-a2-curriculum.ts";

export const a2MasteryMissions: {
  id: string; title: string; reading: string; listening: string; question: A2Question;
  writing: string; model: string; interaction: string; interactionModel: string;
}[] = [
  {
    id: "a2-mastery-home", title: "Eine neue Wohnung",
    reading: "Wohnung in der Marktstraße: zwei Zimmer, 52 Quadratmeter, 780 Euro inklusive Nebenkosten. Frei ab Juli. Besichtigung am Mittwoch um 18 Uhr. Anmeldung per E-Mail nötig. Haustiere nur nach Absprache. Bitte nennen Sie bei der Anfrage Ihren gewünschten Einzugstermin.",
    listening: "Guten Tag, hier ist Frau Koch wegen der Wohnung. Die Besichtigung ist jetzt am Donnerstag um achtzehn Uhr dreißig. Die Wohnung bleibt ab Juli frei. Bitte bestätigen Sie die neue Zeit. Wegen Ihrer Katze müssen wir noch mit dem Eigentümer sprechen. Bringen Sie bitte Ihren Ausweis mit.",
    question: { prompt: "Welche Information ist noch nicht bestätigt?", answer: "Ob die Katze erlaubt ist.", distractors: ["Ob die Wohnung ab Juli frei ist.", "Ob die neue Besichtigung Donnerstag ist."], explanation: "Die Katze muss noch mit dem Eigentümer besprochen werden; Datum und Verfügbarkeit sind genannt." },
    writing: "Schreiben Sie Frau Koch: neuen Termin bestätigen, Juli als Einzug nennen, nach der Entscheidung zur Katze fragen.",
    model: "Sehr geehrte Frau Koch, vielen Dank für Ihre Nachricht. Ich bestätige die Besichtigung am Donnerstag um 18:30 Uhr. Ich möchte im Juli einziehen. Haben Sie schon mit dem Eigentümer gesprochen? Bitte informieren Sie mich, ob ich meine Katze mitbringen darf. Vielen Dank für Ihre Hilfe. Mit freundlichen Grüßen Mila Nowak",
    interaction: "Rufen Sie die Vermieterin an: drei Fragen zu Kosten, Einzug und Haustier. Antworten Sie auf die Gegenfrage: Können Sie am Donnerstag kommen?",
    interactionModel: "A: Sind die Nebenkosten enthalten? B: Ja. A: Ist Einzug im Juli möglich? B: Ja. Können Sie Donnerstag kommen? A: Um halb sieben passt es. Darf ich meine Katze mitbringen? B: Das klären wir noch.",
  },
  {
    id: "a2-mastery-trip", title: "Ein Wochenendausflug",
    reading: "Zug nach Kassel: Samstag 09:15 Uhr, Gleis 3, Ankunft 11:10 Uhr. Unterkunft Waldhaus: Zimmer 64 Euro ohne Frühstück, Anreise ab 15 Uhr. Bei Ankunft nach 21 Uhr bitte anrufen. Stadtmuseum: Samstag bis 17 Uhr geöffnet. Wanderung ist für Sonntag geplant, bei Regen Besuch im Museum.",
    listening: "Achtung: Der Zug nach Kassel um neun Uhr fünfzehn fährt heute von Gleis sechs statt Gleis drei. Die Abfahrt ist unverändert. In Kassel ist für Sonntag starker Regen angekündigt. Das Stadtmuseum ist am Sonntag geschlossen. Bitte prüfen Sie Ihre Pläne. Weitere Informationen erhalten Sie in der Bahnhofshalle.",
    question: { prompt: "Welche Alternative muss neu geplant werden?", answer: "Die Regenalternative am Sonntag, weil das Museum geschlossen ist.", distractors: ["Die Abfahrtszeit, weil sie jetzt 15 Uhr ist.", "Die Unterkunft, weil sie kein Zimmer hat."], explanation: "Die Abfahrtszeit bleibt gleich. Die bisherige Regenalternative ist wegen Sonntagsschließung nicht möglich." },
    writing: "Schreiben Sie Ihrem Freund: neues Gleis, unveränderte Zeit und Vorschlag für Sonntag bei Regen.", model: "Hallo Ben, der Zug fährt heute von Gleis sechs, aber die Abfahrt bleibt um 9:15 Uhr. Am Sonntag soll es stark regnen. Leider ist das Museum dann geschlossen. Wollen wir am Samstag ins Museum gehen und am Sonntag in einem Café lesen? Bitte sag mir, ob du das gut findest. Viele Grüße, Mila",
    interaction: "Planen Sie neu: Was machen Sie Samstag und Sonntag? Klären Sie Anreisezeit der Unterkunft und einigen Sie sich auf eine Regenalternative.", interactionModel: "A: Das Museum ist Sonntag geschlossen. B: Dann gehen wir Samstag vor fünf hin. A: Gut, danach fahren wir zur Unterkunft. B: Sonntag können wir ins Café gehen. A: Einverstanden, ich prüfe die Öffnungszeiten.",
  },
  {
    id: "a2-mastery-health", title: "Krank und einen Termin organisieren",
    reading: "Praxis Weber: Termine nur nach telefonischer Vereinbarung. Bitte Versicherungskarte mitbringen. Ihre Arbeitsstelle erwartet bei Abwesenheit eine Nachricht vor 8 Uhr. Nennen Sie, ob Sie heute fehlen und wann Sie weitere Informationen geben können. Diese Angaben gehören zum erfundenen Rollenspiel.",
    listening: "Guten Morgen, hier ist die Praxis Weber. Wir können Ihnen heute um zehn Uhr einen Termin anbieten. Bitte kommen Sie fünfzehn Minuten früher zur Anmeldung. Bringen Sie Ihre Versicherungskarte mit. Wenn Sie die Zeit nicht wahrnehmen können, rufen Sie bitte zurück. Wir geben hier am Telefon keine persönlichen Behandlungshinweise.",
    question: { prompt: "Wann soll Mila in der Praxis ankommen?", answer: "Um 9:45 Uhr.", distractors: ["Um 10:15 Uhr.", "Erst um 10 Uhr ohne Anmeldung."], explanation: "Fünfzehn Minuten vor dem Termin um zehn bedeutet 9:45 Uhr." },
    writing: "Informieren Sie die Arbeitsstelle vor 8 Uhr: heute krank, Arzttermin um 10 Uhr, Rückmeldung nach dem Termin.", model: "Sehr geehrte Frau Berger, leider bin ich heute krank und kann nicht arbeiten. Seit gestern habe ich Beschwerden. Ich habe um zehn Uhr einen Arzttermin und soll um 9:45 Uhr in der Praxis sein. Nach dem Termin melde ich mich wieder und gebe Ihnen weitere Informationen. Vielen Dank. Mit freundlichen Grüßen Mila Nowak",
    interaction: "Vereinbaren Sie telefonisch einen Termin und beschreiben Sie zwei Beschwerden mit Zeitraum. Wiederholen Sie Termin, Ankunft und benötigte Karte.", interactionModel: "A: Seit gestern habe ich Husten und Kopfschmerzen. Kann ich heute kommen? B: Um zehn, bitte fünfzehn Minuten früher. A: Also um 9:45 Uhr mit Versicherungskarte. B: Genau.",
  },
  {
    id: "a2-mastery-order", title: "Ein Problem mit einer Bestellung",
    reading: "Bestellung 627: ein roter Rucksack und ein Heft. Lieferung am Montag. Bei falschen Artikeln schreiben Sie an den Service und nennen Bestellnummer, bestellten Artikel und gelieferten Artikel. Rücksendung bitte erst nach Rückmeldung. Das Heft ist korrekt; im Paket liegt ein blauer Rucksack.",
    listening: "Guten Tag, Frau Nowak. Zur Bestellung sechshundertsiebenundzwanzig: Wir haben Ihnen leider die falsche Farbe geschickt. Der rote Rucksack ist wieder lieferbar. Wir senden ihn am Donnerstag. Das Rücksendeetikett für den blauen Rucksack erhalten Sie heute per E-Mail. Das Heft behalten Sie. Entschuldigen Sie bitte den Fehler.",
    question: { prompt: "Welcher Artikel wird zurückgeschickt?", answer: "Der blaue Rucksack.", distractors: ["Das korrekt gelieferte Heft.", "Der rote Rucksack, bevor er geliefert wird."], explanation: "Die falsche Farbe ist blau; das Heft bleibt, der rote Rucksack kommt als Ersatz." },
    writing: "Schreiben Sie dem Service: Nummer, bestellte und gelieferte Farbe, Bitte um roten Ersatz und Rücksendeinformationen.", model: "Sehr geehrte Damen und Herren, meine Bestellung 627 ist angekommen. Ich habe einen roten Rucksack bestellt, aber Sie haben einen blauen geschickt. Das Heft ist richtig. Könnten Sie mir bitte den roten Rucksack schicken? Wie soll ich den blauen zurücksenden? Bitte informieren Sie mich über den nächsten Schritt. Mit freundlichen Grüßen Mila Nowak",
    interaction: "Rufen Sie beim Service an und bestätigen Sie Ersatzfarbe, Versandtag und Rücksendung. Stellen Sie eine Rückfrage zu den Versandkosten.", interactionModel: "A: Sie schicken den roten Rucksack Donnerstag? B: Ja. A: Und heute bekomme ich das Etikett für den blauen? B: Genau. A: Muss ich die Rücksendung bezahlen? B: Bitte prüfen Sie die Informationen in unserer E-Mail.",
  },
];

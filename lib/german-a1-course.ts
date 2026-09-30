import { migrateAcademyCourse } from "./academy-schema.ts";
import { germanA1FunctionalScenarios } from "./german-a1-functional-scenarios.ts";
import type { AcademyCourse, AcademyLesson, LessonBlock, QuizQuestion } from "./tutor-academy.ts";

export const GERMAN_A1_COURSE_KEY = "deutsch-a1-komplett";
const AI_VOICE_DISCLOSURE = "Die Stimmen in dieser Aufnahme sind KI-generiert.";

type ChapterSpec = {
  number: number;
  title: string;
  sectionId: string;
  grammar: string;
  examples: [string, string, string];
  vocabulary: string[];
  writing?: string;
  speaking?: string;
};

const vocabulary = (value: string) => value.split(";").map((item) => item.trim()).filter(Boolean);

export const germanA1ChapterSpecs: ChapterSpec[] = [
  { number: 1, title: "Alphabet, Aussprache und Buchstabieren", sectionId: "grundlagen", grammar: "Laute, Wortakzent, lange und kurze Vokale sowie ä, ö, ü und ß.", examples: ["Wie schreibt man Ihren Namen?", "Mein Nachname ist Mahawasala: M-A-H-A-W-A-S-A-L-A.", "Meine Telefonnummer ist null eins sieben sechs, vier zwei acht, neun drei null."], vocabulary: vocabulary("das Alphabet;der Buchstabe, die Buchstaben;buchstabieren;der Vorname;der Nachname;heißen;schreiben;sprechen;hören;wiederholen;langsam;noch einmal;bitte;der Umlaut;das Eszett;der Vokal;der Konsonant;der Wortakzent;lang;kurz;die Telefonnummer;die E-Mail-Adresse;Wie schreibt man das?;Buchstabieren Sie bitte.;Ich verstehe nicht.") },
  { number: 2, title: "Begrüßung und Vorstellung", sectionId: "grundlagen", grammar: "sein, heißen und einfache Angaben zur Person.", examples: ["Guten Tag, ich heiße Piu.", "Ich komme aus Sri Lanka und wohne jetzt in Deutschland.", "Ich bin dreiunddreißig Jahre alt und spreche Englisch und etwas Deutsch."], vocabulary: vocabulary("Guten Morgen;Guten Tag;Guten Abend;Hallo;Tschüss;Auf Wiedersehen;Wie heißen Sie?;Ich heiße …;Wer sind Sie?;Ich bin …;Woher kommen Sie?;Ich komme aus …;Wo wohnen Sie?;Ich wohne in …;das Land;die Nationalität;die Sprache;das Alter;die Adresse;ledig;verheiratet;kennenlernen;sich vorstellen;Freut mich.;Wie geht es Ihnen?") },
  { number: 3, title: "Familie, Possessivartikel und Personen", sectionId: "grundlagen", grammar: "mein, meine, dein, deine sowie er, sie und die Grundformen von sein und haben.", examples: ["Das ist meine Schwester. Sie heißt Maria.", "Mein Bruder ist siebenundzwanzig Jahre alt und sehr freundlich.", "Ich habe zwei Geschwister, aber keine Kinder."], vocabulary: vocabulary("die Familie;meine Mutter;mein Vater;meine Eltern;mein Bruder;meine Schwester;meine Geschwister;mein Sohn;meine Tochter;mein Kind;meine Kinder;meine Großmutter;mein Großvater;meine Großeltern;mein Onkel;meine Tante;mein Cousin;meine Cousine;mein Mann;meine Frau;jung;freundlich;sportlich;verheiratet;ledig") },
  { number: 4, title: "Präsens", sectionId: "grundlagen", grammar: "Regelmäßige Verben und wichtige Stammvokalwechsel im Präsens.", examples: ["Mara arbeitet in Köln und lernt am Abend Deutsch.", "Ben fährt jeden Montag nach Bonn.", "Leyla liest ein Buch und ihr Sohn schläft schon."], vocabulary: vocabulary("machen;lernen;wohnen;arbeiten;spielen;kaufen;fragen;sein;haben;fahren;lesen;sehen;sprechen;essen;nehmen;schlafen;geben;helfen;treffen;laufen;regelmäßig;unregelmäßig;der Verbstamm;die Endung;das Präsens") },
  { number: 5, title: "Satzbau", sectionId: "grundlagen", grammar: "Verb auf Position zwei, Ja/Nein-Fragen und W-Fragen.", examples: ["Heute lerne ich zu Hause Deutsch.", "Lernst du am Abend?", "Wann beginnt dein Kurs und wie lange dauert er?"], vocabulary: vocabulary("der Satz;die Aussage;die Frage;Position zwei;das Verb;das Subjekt;wer;was;wann;wo;wohin;woher;warum;wie;wie viel;wie lange;welcher;heute;morgen;zu Hause;im Kurs;beginnen;dauern;antworten;die Reihenfolge") },
  { number: 6, title: "Artikel", sectionId: "grundlagen", grammar: "Bestimmte und unbestimmte Artikel sowie kein und keine.", examples: ["Der Stuhl steht neben dem Tisch.", "Das ist eine Lampe und dort ist ein Sofa.", "Ich habe kein Auto und keine Garage."], vocabulary: vocabulary("der Artikel;bestimmt;unbestimmt;der Mann;die Frau;das Kind;ein Tisch;eine Lampe;ein Fenster;der Stuhl;die Tür;das Buch;der Schlüssel;die Tasche;das Handy;der Computer;das Bild;ein;eine;der;die;das;kein;keine;das Nomen") },
  { number: 7, title: "Nominativ und Akkusativ", sectionId: "grundlagen", grammar: "Subjekt im Nominativ und direktes Objekt im Akkusativ.", examples: ["Der Mann kauft einen Kaffee.", "Ich sehe den Bus vor dem Bahnhof.", "Sie hat eine Katze und ein Fahrrad."], vocabulary: vocabulary("der Nominativ;der Akkusativ;das Subjekt;das Objekt;der Mann;den Mann;ein Mann;einen Mann;die Frau;eine Frau;das Kind;ein Kind;kaufen;sehen;haben;brauchen;suchen;finden;nehmen;bestellen;bezahlen;der Apfel;der Kaffee;die Katze;das Fahrrad") },
  { number: 8, title: "Possessivartikel", sectionId: "grundlagen", grammar: "mein, dein, sein, ihr, unser, euer und Ihr.", examples: ["Das ist mein Bruder und das ist seine Frau.", "Wie heißt deine Mutter?", "Ist das Ihr Pass, Frau Weber?"], vocabulary: vocabulary("mein;meine;dein;deine;sein;seine;ihr;ihre;unser;unsere;euer;eure;Ihr;Ihre;der Besitz;gehören;die Familie;der Pass;der Ausweis;die Wohnung;das Zimmer;der Freund;die Freundin;Das ist …;Ist das Ihr …?") },
  { number: 9, title: "Familie", sectionId: "alltag-zeit", grammar: "Familienmitglieder beschreiben und Alter, Namen und Beziehungen nennen.", examples: ["Ich habe zwei Geschwister: einen Bruder und eine Schwester.", "Meine Großeltern wohnen in Hamburg.", "Unsere Tochter ist acht Jahre alt."], vocabulary: vocabulary("die Mutter;der Vater;die Eltern;der Bruder;die Schwester;der Sohn;die Tochter;der Mann;die Ehefrau;das Kind;die Kinder;die Großmutter;der Großvater;die Großeltern;der Onkel;die Tante;der Cousin;die Cousine;die Geschwister;die Familie;zusammen;getrennt;älter;jünger;verwandt") },
  { number: 10, title: "Zahlen, Datum und Uhrzeit", sectionId: "alltag-zeit", grammar: "Zahlen bis 1000+, Preise, Datum, Ordinalzahlen und Uhrzeiten.", examples: ["Der Termin ist am fünfundzwanzigsten September.", "Es ist halb acht; der Kurs beginnt um acht Uhr.", "Das kostet zwölf Euro neunzig."], vocabulary: vocabulary("null;zehn;hundert;tausend;die Zahl;der Preis;der Euro;der Cent;das Datum;das Jahr;der Geburtstag;der Erste;der Zweite;der Dritte;Wie spät ist es?;die Uhr;halb;Viertel vor;Viertel nach;heute;morgen;gestern;übermorgen;früh;spät") },
  { number: 11, title: "Wochentage, Monate und Jahreszeiten", sectionId: "alltag-zeit", grammar: "am bei Tagen, im bei Monaten und Jahreszeiten.", examples: ["Am Montag habe ich einen Deutschkurs.", "Im Juli fahren wir ans Meer.", "Im Winter ist es früh dunkel."], vocabulary: vocabulary("Montag;Dienstag;Mittwoch;Donnerstag;Freitag;Samstag;Sonntag;Januar;Februar;März;April;Mai;Juni;Juli;August;September;Oktober;November;Dezember;der Frühling;der Sommer;der Herbst;der Winter;die Woche;das Wochenende") },
  { number: 12, title: "Tagesablauf", sectionId: "alltag-zeit", grammar: "Trennbare Verben im Präsens und Zeitangaben im Tagesablauf.", examples: ["Ich stehe um sieben Uhr auf und frühstücke.", "Nach der Arbeit kaufe ich ein.", "Am Abend rufe ich meine Mutter an und sehe fern."], vocabulary: vocabulary("aufstehen;frühstücken;arbeiten;lernen;zu Mittag essen;einkaufen;schlafen;anrufen;fernsehen;mitkommen;anfangen;aufhören;duschen;sich anziehen;zur Arbeit fahren;Pause machen;nach Hause kommen;kochen;aufräumen;Zähne putzen;morgens;vormittags;mittags;abends;nachts") },
  { number: 13, title: "Modalverben", sectionId: "alltag-zeit", grammar: "können, müssen, wollen, möchten und dürfen mit Infinitiv am Satzende.", examples: ["Ich kann ein bisschen Deutsch sprechen.", "Wir müssen heute länger arbeiten.", "Möchten Sie einen Kaffee, oder wollen Sie Tee?"], vocabulary: vocabulary("können;müssen;wollen;möchten;dürfen;sollen;der Infinitiv;am Satzende;die Möglichkeit;die Pflicht;der Wunsch;die Erlaubnis;Kann ich …?;Muss ich …?;Ich möchte …;Darf ich …?;helfen;warten;kommen;gehen;bleiben;bestellen;bezahlen;probieren;benutzen") },
  { number: 14, title: "Essen und Trinken", sectionId: "essen-ort", grammar: "Bestellen, Mengen nennen und höfliche Wünsche ausdrücken.", examples: ["Ich hätte gern ein Brötchen und einen Tee.", "Bitte geben Sie mir ein Kilo Äpfel.", "Die Rechnung, bitte. Kann ich mit Karte bezahlen?"], vocabulary: vocabulary("das Frühstück;das Mittagessen;das Abendessen;das Brot;das Brötchen;der Käse;das Ei;das Obst;das Gemüse;das Fleisch;der Fisch;das Wasser;der Saft;der Kaffee;der Tee;das Restaurant;der Supermarkt;ein Kilo;ein Liter;eine Flasche;ein Stück;eine Packung;Ich hätte gern …;Die Rechnung, bitte.;Guten Appetit!") },
  { number: 15, title: "Einkaufen", sectionId: "essen-ort", grammar: "Nach Preis, Größe, Farbe und Verfügbarkeit fragen.", examples: ["Wie viel kostet diese Jacke?", "Haben Sie das auch in Größe M?", "Die Hose passt gut, aber sie ist zu teuer."], vocabulary: vocabulary("einkaufen;das Geschäft;der Laden;die Kasse;der Preis;kosten;billig;teuer;die Größe;die Farbe;rot;blau;grün;schwarz;weiß;die Jacke;die Hose;das Hemd;das Kleid;die Schuhe;anprobieren;passen;bezahlen;der Kassenbon;umtauschen") },
  { number: 16, title: "Wohnen und Möbel", sectionId: "essen-ort", grammar: "Eine Wohnung beschreiben und Räume sowie Möbel benennen.", examples: ["Meine Wohnung hat drei Zimmer und einen Balkon.", "In der Küche stehen ein Tisch und vier Stühle.", "Das Schlafzimmer ist klein, aber sehr ruhig."], vocabulary: vocabulary("die Wohnung;das Haus;das Zimmer;die Küche;das Schlafzimmer;das Wohnzimmer;das Bad;der Flur;der Balkon;der Garten;der Tisch;der Stuhl;das Bett;der Schrank;das Sofa;das Regal;die Lampe;der Kühlschrank;der Herd;die Waschmaschine;hell;dunkel;groß;klein;ruhig") },
  { number: 17, title: "Ort und Lage", sectionId: "essen-ort", grammar: "Wo-Fragen und lokale Präpositionen: in, auf, an, neben, unter, über, vor, hinter, zwischen.", examples: ["Die Schlüssel liegen auf dem Tisch.", "Die Bank ist zwischen der Post und dem Café.", "Vor dem Haus steht ein Fahrrad."], vocabulary: vocabulary("in;auf;an;neben;unter;über;vor;hinter;zwischen;links von;rechts von;gegenüber;hier;dort;oben;unten;drinnen;draußen;liegen;stehen;hängen;sitzen;Wo ist …?;die Lage;der Ort") },
  { number: 18, title: "Stadt und Wegbeschreibung", sectionId: "essen-ort", grammar: "Nach dem Weg fragen und einfache formelle Anweisungen verstehen.", examples: ["Entschuldigung, wo ist die Apotheke?", "Gehen Sie geradeaus und dann die zweite Straße links.", "Der Bahnhof ist gegenüber dem Krankenhaus."], vocabulary: vocabulary("der Bahnhof;die Apotheke;die Bank;die Schule;das Krankenhaus;die Post;der Supermarkt;das Rathaus;die Polizei;die Bibliothek;die Straße;die Kreuzung;die Ampel;geradeaus;links;rechts;abbiegen;überqueren;weitergehen;zurückgehen;Entschuldigung;Wo ist …?;Wie komme ich zu …?;in der Nähe;weit weg") },
  { number: 19, title: "Verkehrsmittel", sectionId: "essen-ort", grammar: "mit + Dativ, Abfahrtszeiten und einfache Reiseinformationen.", examples: ["Ich fahre mit dem Bus zur Arbeit.", "Der Zug fährt um achtzehn Uhr zehn von Gleis vier ab.", "Wir gehen zu Fuß, weil das Wetter schön ist."], vocabulary: vocabulary("der Bus;die Bahn;der Zug;das Auto;das Fahrrad;das Flugzeug;die Straßenbahn;die U-Bahn;das Taxi;zu Fuß;fahren;gehen;fliegen;abfahren;ankommen;umsteigen;die Haltestelle;der Fahrplan;das Gleis;die Fahrkarte;die Verspätung;pünktlich;einsteigen;aussteigen;Hin und zurück") },
  { number: 20, title: "Arbeit und Berufe", sectionId: "leben-arbeit", grammar: "Beruf, Arbeitsplatz, Arbeitszeit und einfache Tätigkeiten beschreiben.", examples: ["Ich bin Informatiker und arbeite in einer kleinen Firma.", "Meine Schwester ist Ärztin im Krankenhaus.", "Wann beginnt Ihre Arbeit, und was machen Sie dort?"], vocabulary: vocabulary("der Beruf;die Arbeit;arbeiten;der Lehrer;die Lehrerin;der Arzt;die Ärztin;der Ingenieur;die Ingenieurin;der Verkäufer;die Verkäuferin;der Informatiker;die Informatikerin;der Koch;die Köchin;die Firma;das Büro;die Universität;das Krankenhaus;die Arbeitszeit;Vollzeit;Teilzeit;die Pause;der Kollege;die Kollegin") },
  { number: 21, title: "Freizeit und Hobbys", sectionId: "leben-arbeit", grammar: "gern, lieber und am liebsten; Vorlieben und Häufigkeit.", examples: ["In meiner Freizeit lese ich gern Krimis.", "Ich schwimme lieber, aber am liebsten fahre ich Fahrrad.", "Am Wochenende treffe ich oft Freunde."], vocabulary: vocabulary("die Freizeit;das Hobby;der Sport;die Musik;der Film;lesen;reisen;schwimmen;kochen;Freunde treffen;Fußball spielen;Musik hören;fotografieren;wandern;tanzen;zeichnen;gern;lieber;am liebsten;oft;manchmal;selten;nie;am Wochenende;Spaß machen") },
  { number: 22, title: "Wetter", sectionId: "leben-arbeit", grammar: "Unpersönliches es und einfache Wettervorhersagen.", examples: ["Heute ist es kalt und windig.", "Am Nachmittag regnet es, aber morgen scheint die Sonne.", "Im Süden werden es zwanzig Grad."], vocabulary: vocabulary("das Wetter;warm;kalt;heiß;kühl;sonnig;bewölkt;windig;regnerisch;trocken;der Regen;der Schnee;die Sonne;der Wind;die Wolke;regnen;schneien;scheinen;das Grad;die Temperatur;der Wetterbericht;heute Nachmittag;morgen früh;im Norden;im Süden") },
  { number: 23, title: "Gesundheit", sectionId: "leben-arbeit", grammar: "Beschwerden mit haben und wehtun beschreiben; einfache Ratschläge.", examples: ["Ich habe starke Kopfschmerzen.", "Mein Bauch tut weh, und ich bin müde.", "Sie sollten viel Wasser trinken und zum Arzt gehen."], vocabulary: vocabulary("der Kopf;der Bauch;der Rücken;der Arm;das Bein;der Hals;das Auge;das Ohr;der Zahn;der Arzt;die Ärztin;die Apotheke;krank;gesund;die Schmerzen;Kopfschmerzen haben;wehtun;Fieber haben;Husten haben;Schnupfen haben;die Medizin;die Tablette; sich ausruhen;Wasser trinken;Gute Besserung!") },
  { number: 24, title: "Termine", sectionId: "leben-arbeit", grammar: "Termine vereinbaren, bestätigen, absagen und verschieben.", examples: ["Ich möchte gern einen Termin vereinbaren.", "Haben Sie am Montag um zehn Uhr Zeit?", "Leider kann ich nicht. Können wir den Termin verschieben?"], vocabulary: vocabulary("der Termin;einen Termin machen;vereinbaren;bestätigen;absagen;verschieben;frei sein;Zeit haben;passen;leider;möglich;am Montag;um zehn Uhr;von … bis …;der Kalender;die Praxis;die Sprechstunde;die Einladung;die Besprechung;pünktlich;zu spät;früher;später;Können wir …?;Das passt gut.") },
  { number: 25, title: "Negation mit nicht und kein", sectionId: "grammatik-kommunikation", grammar: "kein bei Nomen und nicht bei Verben, Adjektiven und anderen Satzteilen.", examples: ["Ich habe kein Auto.", "Heute komme ich nicht zum Kurs.", "Die Jacke ist nicht teuer, aber sie passt nicht."], vocabulary: vocabulary("nicht;kein;keine;keinen;verneinen;die Negation;kein Auto;keine Zeit;keinen Kaffee;nicht kommen;nicht arbeiten;nicht teuer;nicht heute;nicht hier;noch nicht;gar nicht;leider nicht;stimmen;falsch;richtig;positiv;negativ;der Gegensatz;ablehnen;korrigieren") },
  { number: 26, title: "Pluralformen", sectionId: "grammatik-kommunikation", grammar: "Häufige Pluralmuster und Nomen immer mit Artikel und Plural lernen.", examples: ["Ein Tisch, zwei Tische.", "Die Frau hat drei Kinder.", "Im Kurs sind viele Männer und Frauen."], vocabulary: vocabulary("der Plural;der Singular;der Tisch, die Tische;die Frau, die Frauen;das Kind, die Kinder;das Auto, die Autos;der Mann, die Männer;das Buch, die Bücher;die Stadt, die Städte;der Apfel, die Äpfel;die Lehrerin, die Lehrerinnen;das Zimmer, die Zimmer;der Schlüssel, die Schlüssel;das Handy, die Handys;die Hand, die Hände;der Tag, die Tage;die Woche, die Wochen;das Jahr, die Jahre;der Name, die Namen;das Museum, die Museen;viele;einige;beide;alle;zwei Stück") },
  { number: 27, title: "Imperativ", sectionId: "grammatik-kommunikation", grammar: "Aufforderungen mit du, ihr und Sie; bitte für höfliche Anweisungen.", examples: ["Komm bitte pünktlich!", "Kommt herein und setzt euch!", "Warten Sie bitte hier und lesen Sie das Formular."], vocabulary: vocabulary("der Imperativ;kommen: Komm!;kommen: Kommt!;Kommen Sie!;warten;lesen;öffnen;schließen;gehen;fahren;nehmen;geben;helfen;hören;sprechen;wiederholen;unterschreiben;ausfüllen;anrufen;mitbringen;bitte;sofort;langsam;vorsichtig;die Aufforderung") },
  { number: 28, title: "Trennbare Verben", sectionId: "grammatik-kommunikation", grammar: "Präfix am Satzende; beim Infinitiv und mit Modalverb bleibt das Verb zusammen.", examples: ["Ich rufe meine Mutter heute Abend an.", "Der Kurs fängt um neun Uhr an.", "Möchtest du morgen mitkommen?"], vocabulary: vocabulary("aufstehen;einkaufen;anrufen;mitkommen;anfangen;aufhören;abfahren;ankommen;einsteigen;aussteigen;umsteigen;fernsehen;aufräumen;aufmachen;zumachen;mitbringen;abholen;zurückkommen;vorstellen;einladen;das Präfix;trennbar;zusammenbleiben;am Satzende;der Infinitiv") },
  { number: 29, title: "Perfekt", sectionId: "grammatik-kommunikation", grammar: "haben oder sein plus Partizip II für einfache Aussagen über die Vergangenheit.", examples: ["Gestern habe ich lange gearbeitet.", "Wir haben im Restaurant gegessen.", "Am Wochenende bin ich nach Berlin gefahren."], vocabulary: vocabulary("das Perfekt;die Vergangenheit;das Partizip II;haben;sein;gemacht;gelernt;gekauft;gearbeitet;gegessen;gesehen;genommen;geschlafen;gegangen;gefahren;gekommen;geflogen;geblieben;gestern;vorgestern;letzte Woche;am Wochenende;schon;noch nie;Was hast du gemacht?") },
  { number: 30, title: "Konjunktionen", sectionId: "grammatik-kommunikation", grammar: "und, aber, oder, denn sowie ein erster Blick auf weil mit Verb am Ende.", examples: ["Ich arbeite und ich studiere.", "Ich möchte kommen, aber ich muss arbeiten.", "Ich bleibe zu Hause, weil ich krank bin."], vocabulary: vocabulary("und;aber;oder;denn;weil;die Konjunktion;verbinden;der Hauptsatz;der Nebensatz;am Ende;Kaffee oder Tee?;müde sein;krank sein;keine Zeit haben;deshalb;der Grund;die Wahl;der Gegensatz;außerdem;trotzdem;zuerst;dann;danach;zum Schluss;Warum?") },
  { number: 31, title: "Dativ – Grundlagen", sectionId: "grammatik-kommunikation", grammar: "Dativformen und häufige Präpositionen mit, bei, von, zu und aus.", examples: ["Ich fahre mit dem Bus.", "Sie kommt aus der Schweiz.", "Nach der Arbeit gehe ich zum Arzt."], vocabulary: vocabulary("der Dativ;dem;der;den;mit;bei;von;zu;aus;mit dem Bus;mit der Bahn;bei meiner Freundin;von meinem Bruder;zum Arzt;zur Arbeit;aus dem Haus;aus der Schweiz;helfen;danken;gefallen;gehören;der Person;die Präposition;der Empfänger;Wem?") },
  { number: 32, title: "Zeitpräpositionen", sectionId: "grammatik-kommunikation", grammar: "um für Uhrzeiten, am für Tage, im für Monate/Jahreszeiten und von … bis.", examples: ["Der Kurs beginnt um acht Uhr.", "Am Freitag habe ich frei.", "Im September arbeite ich von neun bis siebzehn Uhr."], vocabulary: vocabulary("um acht Uhr;am Montag;am Wochenende;am Morgen;am Abend;im Januar;im Sommer;im Jahr 2026;von acht bis zehn;seit Montag;ab morgen;bis Freitag;vor dem Kurs;nach der Arbeit;während der Pause;die Uhrzeit;der Wochentag;der Monat;die Jahreszeit;der Zeitraum;beginnen;enden;dauern;Wie lange?;Wann?") },
];

const sections = [
  { id: "grundlagen", title: "Grundlagen" },
  { id: "alltag-zeit", title: "Alltag und Zeit" },
  { id: "essen-ort", title: "Essen, Einkaufen und Orientierung" },
  { id: "leben-arbeit", title: "Leben, Arbeit und Gesundheit" },
  { id: "grammatik-kommunikation", title: "Grammatik für Kommunikation" },
  { id: "pruefung", title: "Prüfungstraining" },
];

const sectionVisuals: Record<string, { src: string; alt: string }> = {
  grundlagen: {
    src: "/images/academy/german-a1/grundlagen.jpg",
    alt: "Erwachsene Deutschlernende begrüßen sich, buchstabieren Namen und üben mit Alltagsgegenständen.",
  },
  "alltag-zeit": {
    src: "/images/academy/german-a1/alltag-zeit.jpg",
    alt: "Eine erwachsene Person erlebt ihren Tagesablauf vom Aufstehen bis zum Abend mit Uhr, Kalender und Jahreszeiten.",
  },
  "essen-ort": {
    src: "/images/academy/german-a1/essen-orientierung.jpg",
    alt: "Eine Stadt mit Café, Lebensmittelgeschäft, Kleidung, Wohnung, Wegbeschreibung und öffentlichen Verkehrsmitteln.",
  },
  "leben-arbeit": {
    src: "/images/academy/german-a1/leben-arbeit-gesundheit.jpg",
    alt: "Menschen bei der Arbeit, in der Freizeit, beim Arzt, in der Apotheke und beim Planen eines Termins.",
  },
  "grammatik-kommunikation": {
    src: "/images/academy/german-a1/grammatik-kommunikation.jpg",
    alt: "Bildsituationen zu Negation, Plural, Aufforderungen, Tagesablauf, Vergangenheit, Verkehr und Zeit.",
  },
  pruefung: {
    src: "/images/academy/german-a1/pruefungstraining.jpg",
    alt: "Erwachsene üben Hören, Lesen, Schreiben und Sprechen an vier Lernstationen.",
  },
};

const slugify = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const blockId = (lesson: string, suffix: string) => `de-a1-${lesson}-${suffix}`;

function visualBlock(
  slug: string,
  sectionId: string,
  topic: string,
): LessonBlock {
  const visual = sectionVisuals[sectionId];
  return {
    id: blockId(slug, "bildimpuls"),
    type: "image",
    src: visual.src,
    alt: visual.alt,
    caption: `Bildimpuls: Finden Sie drei Dinge oder Situationen zu „${topic}“. Benennen Sie sie auf Deutsch und bilden Sie einen einfachen Satz.`,
    aspect: "wide",
    width: "wide",
    completion: "view",
  };
}

function chapterCheck(
  slug: string,
  suffix: string,
  heading: string,
  prompt: string,
  options: [string, string, string],
  correctIndex: 0 | 1 | 2,
  explanation: string,
  required = false,
  weight = 2,
): LessonBlock {
  const optionIds = ["a", "b", "c"];
  return {
    id: blockId(slug, suffix),
    type: "knowledge-check",
    heading,
    completion: required ? "pass" : "interact",
    required,
    question: {
      id: `q-${slug}-${suffix}`,
      type: "single-choice",
      prompt,
      options: options.map((label, index) => ({ id: optionIds[index], label })),
      correctOptionId: optionIds[correctIndex],
      explanation,
      weight,
    },
  };
}

function chapterOneLesson(spec: ChapterSpec): AcademyLesson {
  const slug = `01-${slugify(spec.title)}`;
  const transcript = `Eddy: Guten Tag, willkommen im Deutschkurs. Wie heißen Sie?\nAnna: Ich heiße Anna Weber.\nEddy: Können Sie Ihren Nachnamen bitte buchstabieren?\nAnna: Ja: W, E, B, E, R. Weber.\nEddy: Vielen Dank. Wie ist Ihre Telefonnummer?\nAnna: Null eins sieben sechs, zwei vier fünf, acht eins neun.\nEddy: Ich wiederhole: null eins sieben sechs, zwei vier fünf, acht eins neun. Ist das richtig?\nAnna: Ja, genau. Danke.`;
  const vocabularyCards = spec.vocabulary.map((term, index) => ({
    id: blockId(slug, `wort-${index + 1}`),
    title: term,
    src: `/images/academy/german-a1/word-cards/chapter-01-${String(index + 1).padStart(2, "0")}.jpg`,
    alt: `Illustration zum Wort oder Ausdruck „${term}“.`,
    body: `Lesen Sie „${term}“ laut vor. Bilden Sie danach einen eigenen einfachen Satz mit diesem Wort oder Ausdruck.`,
  }));
  return {
    id: "lesson-de-a1-01",
    sectionId: spec.sectionId,
    section: "Grundlagen",
    slug,
    title: `1. ${spec.title}`,
    summary: "Buchstaben und zentrale Laute erkennen, Namen buchstabieren, Zahlen verstehen und Kontaktdaten sicher austauschen.",
    durationMinutes: 300,
    blocks: [
      {
        id: blockId(slug, "ziele"),
        type: "text",
        heading: "Willkommen und Lernziele",
        paragraphs: [
          "In diesem Kapitel lernen Sie nicht nur das Alphabet. Sie trainieren, Buchstaben und Zahlen zu hören, Namen zu buchstabieren, wichtige deutsche Laute zu unterscheiden und Kontaktdaten in einer echten Anmeldesituation auszutauschen.",
          "Am Ende können Sie Ihren Vor- und Nachnamen, Wohnort und Ihre E-Mail-Adresse buchstabieren, eine Telefonnummer verstehen und nennen sowie höflich um Wiederholung bitten.",
          "English help: Focus first on being understood. Perfect pronunciation is not expected at A1.",
        ],
        completion: "view",
      },
      {
        id: blockId(slug, "lernweg"),
        type: "process",
        heading: "Ihr Lernweg: zehn kurze Etappen",
        items: [
          ["1 · Alphabet", "26 Buchstaben sehen, hören und benennen"],
          ["2 · Ä, Ö, Ü und ß", "Sonderzeichen erkennen und mit Mundpositionen üben"],
          ["3 · Buchstabieren", "Namen, Orte und E-Mail-Adressen buchstabieren"],
          ["4 · Zentrale Laute", "sch, ch, sp, st, z, w und v unterscheiden"],
          ["5 · Vokallänge", "lange und kurze Vokale bewusst hören"],
          ["6 · Wortakzent", "betonte Silben markieren und Wörter gliedern"],
          ["7 · Zahlen", "0 bis 1000+ systematisch bilden"],
          ["8 · Telefonnummer", "Ziffernfolgen verstehen und deutlich sprechen"],
          ["9 · Anmeldung", "alles in einer realistischen Situation anwenden"],
          ["10 · Abschluss", "wiederholen, selbst prüfen und Kontaktdaten präsentieren"],
        ].map(([title, body], index) => ({ id: blockId(slug, `lernweg-${index + 1}`), title, body })),
      },
      visualBlock(slug, spec.sectionId, spec.title),

      { id: blockId(slug, "teil-1"), type: "divider", label: "1.1 Das deutsche Alphabet" },
      {
        id: blockId(slug, "alphabet-einfuehrung"),
        type: "callout",
        heading: "Sehen → sagen · Hören → erkennen",
        body: "Das erste Ziel ist nicht perfekte Aussprache. Zeigen Sie auf einen Buchstaben und sagen Sie seinen deutschen Namen. Bitten Sie danach eine Lernpartnerin oder einen Lernpartner, Buchstaben in zufälliger Reihenfolge zu nennen, und zeigen Sie auf den gehörten Buchstaben.",
        tone: "blue",
      },
      {
        id: blockId(slug, "alphabet-tabelle"),
        type: "comparison-table",
        heading: "Die 26 Buchstaben",
        columns: ["Buchstabe", "Deutscher Name", "Buchstabe", "Deutscher Name"],
        rows: [
          ["A", "a", "N", "en"], ["B", "be", "O", "o"], ["C", "ce", "P", "pe"],
          ["D", "de", "Q", "ku"], ["E", "e", "R", "er"], ["F", "ef", "S", "es"],
          ["G", "ge", "T", "te"], ["H", "ha", "U", "u"], ["I", "i", "V", "vau"],
          ["J", "jot", "W", "we"], ["K", "ka", "X", "ix"], ["L", "el", "Y", "ypsilon"],
          ["M", "em", "Z", "zett"],
        ],
      },
      {
        id: blockId(slug, "alphabet-gruppen"),
        type: "tabs",
        heading: "In vier Gruppen trainieren",
        items: [
          { id: blockId(slug, "alphabet-a-g"), title: "A–G", body: "A · B · C · D · E · F · G\nZweimal langsam lesen, dann ohne Hinsehen aufsagen." },
          { id: blockId(slug, "alphabet-h-n"), title: "H–N", body: "H · I · J · K · L · M · N\nAchten Sie besonders auf I und J." },
          { id: blockId(slug, "alphabet-o-u"), title: "O–U", body: "O · P · Q · R · S · T · U\nWechseln Sie vorwärts und rückwärts." },
          { id: blockId(slug, "alphabet-v-z"), title: "V–Z", body: "V · W · X · Y · Z\nVergleichen Sie V (vau) und W (we)." },
        ],
      },
      chapterCheck(slug, "alphabet-check", "Mini-Check: Buchstaben", "Welcher deutsche Buchstabenname gehört zu W?", ["vau", "we", "ypsilon"], 1, "W heißt auf Deutsch „we“. V heißt „vau“."),
      chapterCheck(slug, "alphabet-kontrast", "Verwechslungsgefahr", "Welches Paar sollten Anfänger besonders deutlich unterscheiden?", ["V und W", "A und H", "L und R"], 0, "V heißt „vau“, W heißt „we“. Auch B/P, D/T, G/K und E/I brauchen gezieltes Hörtraining."),

      { id: blockId(slug, "teil-2"), type: "divider", label: "1.2 Ä, Ö, Ü und ß" },
      {
        id: blockId(slug, "sonderzeichen"),
        type: "tabs",
        heading: "Vier wichtige Zeichen",
        items: [
          { id: blockId(slug, "zeichen-ae"), title: "Ä ä", body: "Ä ist ein eigener Vokallaut. Beispiele: Äpfel, Mädchen, spät. Nicht einfach wie ein englisches a sprechen." },
          { id: blockId(slug, "zeichen-oe"), title: "Ö ö", body: "Sagen Sie e, behalten Sie die Zungenposition und runden Sie die Lippen. Beispiele: schön, hören, zwölf." },
          { id: blockId(slug, "zeichen-ue"), title: "Ü ü", body: "Sagen Sie i, behalten Sie die Zungenposition und runden Sie die Lippen. Beispiele: fünf, Tür, müde." },
          { id: blockId(slug, "zeichen-ss"), title: "ß", body: "Das Zeichen heißt Eszett und steht für einen s-Laut. Beispiele: Straße, heißen, groß. ß ist nicht der Buchstabe B." },
        ],
      },
      {
        id: blockId(slug, "mundtraining"),
        type: "process",
        heading: "Mundtraining für ö und ü",
        items: [
          { id: blockId(slug, "mund-1"), title: "1. Ausgangslaut", body: "Für ö zuerst e, für ü zuerst i sagen." },
          { id: blockId(slug, "mund-2"), title: "2. Zunge bleibt", body: "Die Zunge ungefähr in derselben Position lassen." },
          { id: blockId(slug, "mund-3"), title: "3. Lippen runden", body: "Nur die Lippen nach vorn runden: e → ö, i → ü." },
          { id: blockId(slug, "mund-4"), title: "4. In Wörtern", body: "schön · hören · fünf · Tür langsam und dann natürlich sprechen." },
        ],
      },
      chapterCheck(slug, "umlaut-check", "Mini-Check: Sonderzeichen", "Welches Zeichen fehlt in „M__dchen“?", ["ä", "ö", "ß"], 0, "Das Wort heißt „Mädchen“ und wird mit ä geschrieben."),
      chapterCheck(slug, "eszett-check", "Mini-Check: Eszett", "Welches Wort ist richtig geschrieben?", ["Strabe", "Straße", "Straöe"], 1, "„Straße“ enthält ein Eszett. Es sieht ähnlich aus, ist aber kein B."),

      { id: blockId(slug, "teil-3"), type: "divider", label: "1.3 Buchstabieren als Kommunikationsstrategie" },
      {
        id: blockId(slug, "sprachwerkzeuge"),
        type: "accordion",
        heading: "Diese Sätze als ganze Bausteine lernen",
        items: [
          { id: blockId(slug, "satz-schreiben"), title: "Wie schreibt man das?", body: "How do you write/spell that? Nutzen Sie den Satz, wenn Sie ein Wort hören, aber die Schreibweise nicht kennen." },
          { id: blockId(slug, "satz-formell"), title: "Können Sie das bitte buchstabieren?", body: "Formelle und höfliche Bitte, zum Beispiel an einer Rezeption oder am Telefon." },
          { id: blockId(slug, "satz-informell"), title: "Kannst du das bitte buchstabieren?", body: "Informelle Bitte an Freunde, Mitschülerinnen oder Mitschüler." },
          { id: blockId(slug, "satz-wiederholen"), title: "Wie bitte? / Noch einmal, bitte.", body: "Kurze Reaktionen, wenn Sie etwas nicht verstanden haben." },
          { id: blockId(slug, "satz-langsam"), title: "Langsamer, bitte.", body: "Bitten Sie die andere Person, deutlicher und langsamer zu sprechen." },
        ],
      },
      {
        id: blockId(slug, "buchstabieren-dialog"),
        type: "quote",
        quote: "A: Wie heißen Sie? – B: Mahawasala. – A: Wie bitte? Können Sie das bitte buchstabieren? – B: M-A-H-A-W-A-S-A-L-A.",
        attribution: "Dialog an einer Rezeption",
      },
      {
        id: blockId(slug, "buchstabieren-aufgabe"),
        type: "numbered-list",
        heading: "Buchstabieren Sie Ihre Identität",
        items: [
          ["Vorname", "Sagen Sie zuerst den Namen, dann jeden Buchstaben einzeln."],
          ["Nachname", "Sprechen Sie langsam und machen Sie nach drei oder vier Buchstaben eine kleine Pause."],
          ["Wohnort", "Beispiel: Berlin → B-E-R-L-I-N."],
          ["Land", "Achten Sie auf Buchstaben, deren deutscher Name ungewohnt ist."],
          ["E-Mail-Name", "Buchstabieren Sie zunächst nur den Teil vor dem @-Zeichen."],
        ].map(([title, body], index) => ({ id: blockId(slug, `identitaet-${index + 1}`), title, body })),
      },
      chapterCheck(slug, "buchstabieren-check", "Mini-Check: Einen Namen erkennen", "Welche Schreibweise entsteht aus L-E-N-A?", ["Lina", "Lena", "Luna"], 1, "L-E-N-A ergibt den Namen Lena."),

      { id: blockId(slug, "teil-4"), type: "divider", label: "1.4 Zentrale deutsche Laute" },
      {
        id: blockId(slug, "lautregeln"),
        type: "tabs",
        heading: "Sieben Muster mit großer Wirkung",
        items: [
          { id: blockId(slug, "laut-sch"), title: "sch", body: "Meist wie englisches sh: Schule, schön, schreiben, Fisch." },
          { id: blockId(slug, "laut-ch"), title: "ch", body: "Weicher nach i, e, ä, ö, ü: ich, nicht, Bücher. Kräftiger nach a, o, u: Bach, doch, Buch. Erkennen ist zunächst wichtiger als perfekte Produktion." },
          { id: blockId(slug, "laut-sp-st"), title: "sp / st", body: "Am Wortanfang oft ungefähr shp/sht: Sport, spielen, sprechen; Straße, Stadt, stehen." },
          { id: blockId(slug, "laut-z"), title: "z", body: "Meist ts: zehn, Zeit, Zug, zwanzig." },
          { id: blockId(slug, "laut-w"), title: "w", body: "Ungefähr wie englisches v: Wasser, wohnen, wie, Wochenende." },
          { id: blockId(slug, "laut-v"), title: "v", body: "In vielen deutschen Wörtern wie f: Vater, vier, fünf, Vogel. In Fremdwörtern manchmal wie v: Video." },
          { id: blockId(slug, "laut-r"), title: "r", body: "Das deutsche r variiert regional. Ein verständliches r reicht; erzwingen Sie keinen bestimmten Akzent." },
        ],
      },
      {
        id: blockId(slug, "laut-sortieren"),
        type: "comparison-table",
        heading: "Wörter nach Lautmuster sortieren",
        columns: ["Muster", "Beispiele", "Sprechhilfe"],
        rows: [
          ["sch", "Schule · schreiben", "sh"], ["weiches ch", "ich · Bücher", "Luft eng am Gaumen"],
          ["kräftiges ch", "Bach · Buch", "weiter hinten im Mund"], ["sp / st", "Sport · Stadt", "shp / sht am Anfang"],
          ["z", "Zeit · Zug", "ts"], ["w", "Wasser · wohnen", "wie englisches v"], ["v", "Vater · Video", "Wortweise lernen"],
        ],
      },
      chapterCheck(slug, "laute-check", "Mini-Check: Lautmuster", "Welches Wort beginnt im Standarddeutschen ungefähr mit „sht“?", ["Sonne", "Stadt", "Zeit"], 1, "st wird am Anfang vieler Wörter wie in „Stadt“ ungefähr „sht“ gesprochen."),
      chapterCheck(slug, "z-check", "Mini-Check: Z", "Wie beginnt das Wort „Zeit“ ungefähr?", ["s", "ts", "sch"], 1, "Deutsches z wird in „Zeit“ als ts gesprochen."),

      { id: blockId(slug, "teil-5"), type: "divider", label: "1.5 Lange und kurze Vokale" },
      {
        id: blockId(slug, "vokallaenge"),
        type: "comparison-table",
        heading: "Nützliche Hinweise auf die Vokallänge",
        columns: ["Hinweis", "Beispiele", "Was Sie bemerken"],
        rows: [
          ["Doppelkonsonant", "kommen · Mutter · Bett · Klasse", "Der Vokal davor ist oft kurz."],
          ["h nach Vokal", "wohnen · fahren · sehen", "Der Vokal ist oft lang."],
          ["Doppelvokal", "See · Kaffee · Haar", "Der Vokal ist normalerweise lang."],
          ["ie", "Liebe · sieben · spielen", "Meist ein langes i."],
        ],
      },
      {
        id: blockId(slug, "staat-stadt"),
        type: "worked-example",
        heading: "Hören und fühlen: Staat oder Stadt?",
        problem: "Die Vokallänge kann Bedeutung und Verständlichkeit verändern.",
        steps: [
          { id: blockId(slug, "staat-1"), title: "Staat", body: "Das a ist lang. Ziehen Sie den Vokal leicht: Staat." },
          { id: blockId(slug, "staat-2"), title: "Stadt", body: "Das a ist kurz. Danach hört man schnell dt: Stadt." },
          { id: blockId(slug, "staat-3"), title: "Kontrast", body: "Sprechen Sie abwechselnd: Staat – Stadt – Staat – Stadt." },
        ],
        answer: "Merksatz: Regeln sind Tendenzen. Lernen Sie neue Wörter immer zusammen mit ihrem Klang.",
      },
      chapterCheck(slug, "vokal-check", "Mini-Check: Vokallänge", "Welches Wort hat normalerweise ein langes i?", ["Bett", "spielen", "Mutter"], 1, "Die Buchstabenkombination ie steht in „spielen“ normalerweise für ein langes i."),

      { id: blockId(slug, "teil-6"), type: "divider", label: "1.6 Wortakzent und lange Wörter" },
      {
        id: blockId(slug, "wortakzent"),
        type: "process",
        heading: "Betonte Silben hörbar machen",
        items: [
          { id: blockId(slug, "akzent-1"), title: "Hören", body: "Welcher Teil klingt stärker? AR-bei-ten · LER-nen · WOH-nen · MUT-ter." },
          { id: blockId(slug, "akzent-2"), title: "Markieren", body: "Schreiben Sie die betonte Silbe groß: ARbeiten, LERnen, WOHnen, MUTter." },
          { id: blockId(slug, "akzent-3"), title: "Klopfen", body: "Klopfen Sie bei der betonten Silbe einmal auf den Tisch." },
          { id: blockId(slug, "akzent-4"), title: "Wiederholen", body: "Erst langsam in Silben, danach als natürliches Wort sprechen." },
        ],
      },
      {
        id: blockId(slug, "komposita"),
        type: "callout",
        heading: "Keine Angst vor langen Wörtern",
        body: "Telefonnummer = Telefon + Nummer. Deutsche Nomen können sich verbinden. Suchen Sie zuerst die bekannten Teile; dann wird das lange Wort leichter.",
        tone: "teal",
      },

      { id: blockId(slug, "teil-7"), type: "divider", label: "1.7 Zahlen von 0 bis 1000+" },
      {
        id: blockId(slug, "zahlen-0-12"),
        type: "comparison-table",
        heading: "0 bis 12: direkt lernen",
        columns: ["Zahl", "Deutsch", "Zahl", "Deutsch"],
        rows: [
          ["0", "null", "7", "sieben"], ["1", "eins", "8", "acht"], ["2", "zwei", "9", "neun"],
          ["3", "drei", "10", "zehn"], ["4", "vier", "11", "elf"], ["5", "fünf", "12", "zwölf"], ["6", "sechs", "", ""],
        ],
      },
      {
        id: blockId(slug, "zahlen-system"),
        type: "accordion",
        heading: "Das Zahlensystem Schritt für Schritt",
        items: [
          { id: blockId(slug, "zahlen-13-19"), title: "13–19", body: "Zahl + zehn: dreizehn, vierzehn, fünfzehn, sechzehn, siebzehn, achtzehn, neunzehn. Beachten Sie sechzehn und siebzehn." },
          { id: blockId(slug, "zahlen-zehner"), title: "Die Zehner", body: "20 zwanzig · 30 dreißig · 40 vierzig · 50 fünfzig · 60 sechzig · 70 siebzig · 80 achtzig · 90 neunzig · 100 hundert." },
          { id: blockId(slug, "zahlen-21-99"), title: "21–99", body: "Einer + und + Zehner: 21 einundzwanzig, 42 zweiundvierzig, 57 siebenundfünfzig, 98 achtundneunzig." },
          { id: blockId(slug, "zahlen-hundert"), title: "Hunderter", body: "100 (ein)hundert, 200 zweihundert, 325 dreihundertfünfundzwanzig." },
          { id: blockId(slug, "zahlen-tausend"), title: "Tausender", body: "1000 (ein)tausend, 2000 zweitausend, 3500 dreitausendfünfhundert." },
        ],
      },
      {
        id: blockId(slug, "zahl-bauen"),
        type: "worked-example",
        heading: "Eine Zahl bauen: 47",
        problem: "Wie heißt 47 auf Deutsch?",
        steps: [
          { id: blockId(slug, "zahl-47-1"), title: "Einer zuerst", body: "7 = sieben" },
          { id: blockId(slug, "zahl-47-2"), title: "Verbinden", body: "und" },
          { id: blockId(slug, "zahl-47-3"), title: "Zehner zuletzt", body: "40 = vierzig" },
        ],
        answer: "47 = sieben + und + vierzig = siebenundvierzig.",
      },
      chapterCheck(slug, "zahlen-check", "Mini-Check: Zahlen", "Welche Zahl ist siebenundvierzig?", ["37", "47", "74"], 1, "Bei siebenundvierzig kommt sieben vor vierzig: 7 + und + 40 = 47."),
      chapterCheck(slug, "zahlen-58", "Mini-Check: Zahlen verstehen", "Welche Zahl ist achtundfünfzig?", ["48", "58", "85"], 1, "acht + und + fünfzig ergibt 58."),
      chapterCheck(slug, "zahlen-325", "Mini-Check: Hunderter", "Welche Form passt zu 325?", ["dreihundertfünfundzwanzig", "dreihundertfünfzig", "zweihundertfünfunddreißig"], 0, "325 besteht aus dreihundert + fünfundzwanzig."),

      { id: blockId(slug, "teil-8"), type: "divider", label: "1.8 Telefonnummern und Kontaktdaten" },
      {
        id: blockId(slug, "telefonnummer"),
        type: "text",
        heading: "Eine Telefonnummer verstehen und nennen",
        paragraphs: [
          "Frage: Wie ist Ihre Telefonnummer? Informell: Wie ist deine Telefonnummer?",
          "Antwort: Meine Telefonnummer ist …",
          "Telefonnummern werden oft in Gruppen gesprochen. Für den Anfang trainieren Sie jede Ziffer sicher: 0-1-7-6 · 2-4-5 · 8-1-9.",
          "Kontrollstrategie: Wiederholen Sie die Nummer und fragen Sie: Ist das richtig?",
        ],
      },
      {
        id: blockId(slug, "telefon-schritte"),
        type: "numbered-list",
        heading: "Zifferndiktat ohne Stress",
        items: [
          { id: blockId(slug, "telefon-1"), title: "Erst hören", body: "Nicht sofort schreiben. Erkennen Sie zuerst den Rhythmus und die Gruppen." },
          { id: blockId(slug, "telefon-2"), title: "In Gruppen notieren", body: "Beispiel: 0176 · 245 · 819." },
          { id: blockId(slug, "telefon-3"), title: "Zurücklesen", body: "Lesen Sie jede Ziffer deutlich vor." },
          { id: blockId(slug, "telefon-4"), title: "Bestätigen", body: "Fragen Sie: Ist das richtig?" },
        ],
      },
      chapterCheck(slug, "telefon-check", "Mini-Check: Telefonnummer", "Welche Antwort passt zu „Wie ist Ihre Telefonnummer?“?", ["Ich heiße Lena.", "Meine Telefonnummer ist null eins sieben sechs …", "Buchstabieren Sie bitte."], 1, "Mit „Meine Telefonnummer ist …“ geben Sie Ihre Nummer an."),

      { id: blockId(slug, "teil-9"), type: "divider", label: "1.9 Hören und anwenden: Anmeldung" },
      {
        id: blockId(slug, "anmeldung-dialog"),
        type: "quote",
        quote: "Rezeption: Guten Tag. Wie heißen Sie? – Lernende Person: Ich heiße Anna Weber. – Rezeption: Können Sie Ihren Nachnamen bitte buchstabieren? – Lernende Person: W-E-B-E-R. – Rezeption: Wie ist Ihre Telefonnummer?",
        attribution: "Anmeldung zu einem Sprachkurs",
      },
      {
        id: blockId(slug, "hoeren-anmeldung"),
        type: "audio",
        heading: "Hören: Anmeldung mit Name und Telefonnummer",
        url: "/audio/german-a1/a1-kapitel-01-anmeldung-natural-v2.m4a",
        caption: `Hören Sie zuerst ohne Transcript. Beim zweiten Hören notieren Sie Namen, Buchstaben und Zahlen. ${AI_VOICE_DISCLOSURE}`,
        transcript,
        completion: "view",
      },
      chapterCheck(slug, "hoercheck-nachname", "Hörverstehen: Nachname", "Welchen Nachnamen buchstabiert Anna?", ["Weber", "Wagner", "Winter"], 0, "Anna buchstabiert W, E, B, E, R: Weber.", true),
      chapterCheck(slug, "hoercheck-telefon", "Hörverstehen: Telefonnummer", "Welche drei Ziffern hören Sie am Ende der Telefonnummer?", ["acht eins neun", "acht neun eins", "eins acht neun"], 0, "Anna sagt am Ende: acht eins neun.", true),
      {
        id: blockId(slug, "grammatik"),
        type: "worked-example",
        heading: "Mini-Grammatik: du und Sie",
        problem: "Deutsch unterscheidet eine informelle und eine formelle Anrede.",
        steps: [
          { id: blockId(slug, "anrede-sie"), title: "Formell: Sie", body: "Wie heißen Sie? Können Sie das bitte buchstabieren?" },
          { id: blockId(slug, "anrede-du"), title: "Informell: du", body: "Wie heißt du? Kannst du das bitte buchstabieren?" },
          { id: blockId(slug, "anrede-ich"), title: "Antwort: ich", body: "Ich heiße … / Meine Telefonnummer ist …" },
        ],
        answer: "Lernen Sie diese Sätze zunächst als feste Kommunikationsbausteine. Die vollständige Verbkonjugation folgt später.",
      },
      {
        id: blockId(slug, "wortschatz"),
        type: "flashcards",
        heading: "Kernwortschatz",
        appearance: { variant: "picture-grid", surface: "plain", spacing: "comfortable", width: "reading" },
        items: vocabularyCards,
      },

      { id: blockId(slug, "teil-10"), type: "divider", label: "1.10 Wiederholen, produzieren und prüfen" },
      {
        id: blockId(slug, "kann-liste"),
        type: "accordion",
        heading: "Kapitel-Checkliste: Das kann ich jetzt",
        items: [
          "deutsche Buchstaben erkennen und benennen",
          "ä, ö, ü und ß erkennen",
          "meinen Namen und Wohnort buchstabieren",
          "höflich um Wiederholung bitten",
          "sch, ch, sp, st, z, w und v unterscheiden",
          "lange und kurze Vokale bewusster sprechen",
          "Zahlen von 0 bis 1000+ bilden",
          "eine Telefonnummer verstehen und nennen",
          "Kontaktdaten in einer Anmeldung austauschen",
        ].map((body, index) => ({ id: blockId(slug, `kann-${index + 1}`), title: `☐ ${body}`, body: "Sagen Sie ein eigenes Beispiel laut. Wenn es noch schwer ist, gehen Sie zur passenden Etappe zurück." })),
      },
      {
        id: blockId(slug, "lesen"),
        type: "text",
        heading: "Lesen",
        paragraphs: [
          "Deutschkurs A1 · Vorname: Lena · Nachname: Schneider · Wohnort: Berlin · Telefon: 0176 245 819 · E-Mail: lena.schneider@example.de",
          "Lesen Sie die Angaben laut. Buchstabieren Sie danach den Nachnamen und den E-Mail-Namen vor dem @-Zeichen.",
        ],
      },
      chapterCheck(slug, "lesecheck", "Lesen prüfen", "Wie lautet der Nachname im Formular?", ["Lena", "Schneider", "Berlin"], 1, "Im Formular steht bei Nachname: Schneider.", true),
      {
        id: blockId(slug, "schreiben"),
        type: "writing-practice",
        heading: "Abschlussprojekt: Meine Kontaktdaten",
        prompt: "Füllen Sie eine kurze, gern erfundene Kursanmeldung aus: Vorname, Nachname, Wohnort, Telefonnummer und E-Mail-Adresse. Schreiben Sie darunter zwei passende Sätze: „Ich heiße …“ und „Meine Telefonnummer ist …“.",
        minWords: 15,
        maxWords: 60,
        checklist: ["Alle fünf Angaben sind vorhanden.", "Vor- und Nachname beginnen mit Großbuchstaben.", "Telefonnummer und E-Mail-Adresse sind gut lesbar.", "Ich habe zwei vollständige Sätze geschrieben."],
        modelAnswer: "Vorname: Lena\nNachname: Schneider\nWohnort: Berlin\nTelefonnummer: 0176 245 819\nE-Mail-Adresse: lena.schneider@example.de\nIch heiße Lena Schneider. Meine Telefonnummer ist null eins sieben sechs, zwei vier fünf, acht eins neun.",
        completion: "interact",
      },
      {
        id: blockId(slug, "sprechen"),
        type: "speaking-practice",
        heading: "Abschlussprojekt: Anmeldung sprechen",
        prompt: "Spielen Sie die lernende Person bei einer Kursanmeldung. Sagen Sie Ihren Namen, buchstabieren Sie Ihren Nachnamen, nennen Sie Ihre Telefonnummer und E-Mail-Adresse und benutzen Sie bei Bedarf „Noch einmal, bitte“ oder „Langsamer, bitte“.",
        preparationSeconds: 60,
        targetSeconds: 75,
        checklist: ["Ich nenne meinen Namen.", "Ich buchstabiere langsam und deutlich.", "Ich spreche die Telefonnummer in Gruppen.", "Ich benutze mindestens einen Reparatursatz.", "Ich höre meine Aufnahme an und prüfe die Verständlichkeit."],
        modelAnswer: "Guten Tag. Ich heiße Lena Schneider. Mein Nachname ist Schneider: S-C-H-N-E-I-D-E-R. Meine Telefonnummer ist null eins sieben sechs, zwei vier fünf, acht eins neun. Meine E-Mail-Adresse ist lena.schneider@example.de. Entschuldigung, noch einmal, bitte.",
        completion: "interact",
      },
      chapterCheck(slug, "abschluss-check", "Kapiteltest: Kommunikation", "Welche Reaktion passt, wenn eine Person zu schnell spricht?", ["Langsamer, bitte.", "Ich heiße …", "Wie ist Ihre Telefonnummer?"], 0, "Mit „Langsamer, bitte“ bitten Sie die andere Person, das Tempo zu reduzieren.", true),
      {
        id: blockId(slug, "abschluss"),
        type: "callout",
        heading: "Kapitel geschafft 🎉",
        body: "Sie können jetzt Buchstaben, zentrale Laute und Zahlen in einer praktischen Anmeldesituation verwenden. Wiederholen Sie morgen fünf zufällige Buchstaben, drei Zahlen und Ihren buchstabierten Nachnamen – so bleibt das Gelernte aktiv.",
        tone: "teal",
      },
    ],
  };
}

function chapterTwoLesson(spec: ChapterSpec): AcademyLesson {
  const slug = `02-${slugify(spec.title)}`;
  const transcript = `Anna: Hallo! Ich heiße Anna. Wie heißt du?
Sam: Ich heiße Sam.
Anna: Woher kommst du?
Sam: Ich komme aus Kanada. Und du?
Anna: Ich komme aus Polen, aber ich wohne in Berlin.
Sam: Ich wohne auch in Berlin. Welche Sprachen sprichst du?
Anna: Ich spreche Polnisch, Englisch und ein bisschen Deutsch.
Sam: Super! Bis später im Kurs.
Anna: Bis später, Sam!`;
  const vocabularyCards = spec.vocabulary.map((term, index) => ({
    id: blockId(slug, `wort-${index + 1}`),
    title: term,
    src: `/images/academy/german-a1/word-cards/chapter-02-${String(index + 1).padStart(2, "0")}.jpg`,
    alt: `Illustration zum Wort oder Ausdruck „${term}“.`,
    body: `Lesen Sie „${term}“ laut vor. Bilden Sie danach einen eigenen einfachen Satz mit diesem Wort oder Ausdruck.`,
  }));

  return {
    id: "lesson-de-a1-02",
    sectionId: spec.sectionId,
    section: "Grundlagen",
    slug,
    title: `2. ${spec.title}`,
    summary: "Menschen passend begrüßen, persönliche Informationen erfragen und sich in einem kurzen Gespräch selbstständig vorstellen.",
    durationMinutes: 300,
    blocks: [
      {
        id: blockId(slug, "ziele"),
        type: "text",
        heading: "Hallo! Das bin ich",
        paragraphs: [
          "In diesem Kapitel führen Sie Ihr erstes vollständiges Gespräch auf Deutsch. Sie begrüßen eine Person, nennen Name, Herkunft, Wohnort, Alter und Sprachen und verabschieden sich passend.",
          "Am Ende können Sie zwischen du und Sie wählen, einfache persönliche Fragen verstehen und beantworten und sich in vier bis sechs zusammenhängenden Sätzen vorstellen.",
          "English help: Learn the questions and answers as complete chunks first. The grammar patterns will become clearer through use.",
        ],
        completion: "view",
      },
      {
        id: blockId(slug, "lernweg"),
        type: "process",
        heading: "Ihr Lernweg: zehn kurze Etappen",
        items: [
          ["1 · Begrüßen", "Tageszeit und Situation passend berücksichtigen"],
          ["2 · Namen", "sich vorstellen und nach dem Namen fragen"],
          ["3 · Fragen", "wie, wo, woher und welche verwenden"],
          ["4 · Herkunft", "Länder nennen und kommen aus benutzen"],
          ["5 · Wohnort", "wo und woher sicher unterscheiden"],
          ["6 · Sprachen", "Sprachen und Sprachkenntnisse beschreiben"],
          ["7 · Alter", "sein verwenden und das Alter korrekt nennen"],
          ["8 · du oder Sie", "informell und formell passend sprechen"],
          ["9 · Kursgespräch", "alles in einem echten Dialog verbinden"],
          ["10 · Das bin ich", "eine persönliche Vorstellung schreiben und aufnehmen"],
        ].map(([title, body], index) => ({ id: blockId(slug, `lernweg-${index + 1}`), title, body })),
      },
      visualBlock(slug, spec.sectionId, spec.title),

      { id: blockId(slug, "teil-1"), type: "divider", label: "2.1 Begrüßungen und Abschiede" },
      {
        id: blockId(slug, "gruesse-tabelle"),
        type: "comparison-table",
        heading: "Was passt wann?",
        columns: ["Ausdruck", "Situation", "Englische Hilfe"],
        rows: [
          ["Guten Morgen!", "morgens", "Good morning"],
          ["Guten Tag!", "tagsüber, neutral oder formell", "Hello / Good day"],
          ["Guten Abend!", "am Abend zur Begrüßung", "Good evening"],
          ["Hallo! / Hi!", "informell oder neutral", "Hello / Hi"],
          ["Tschüss!", "informeller Abschied", "Bye"],
          ["Auf Wiedersehen!", "formeller Abschied", "Goodbye"],
          ["Bis bald! / Bis später!", "man sieht sich wieder", "See you soon / later"],
          ["Gute Nacht!", "beim Gehen oder Schlafengehen", "Good night"],
        ],
      },
      {
        id: blockId(slug, "abend-nacht"),
        type: "callout",
        heading: "Nicht verwechseln: Abend und Nacht",
        body: "Guten Abend ist eine Begrüßung. Gute Nacht sagt man beim Abschied am späten Abend oder vor dem Schlafengehen.",
        tone: "amber",
      },
      {
        id: blockId(slug, "gruss-dialog"),
        type: "quote",
        quote: "A: Guten Morgen! – B: Guten Morgen! – A: Wie geht’s? – B: Gut, danke. – A: Tschüss! – B: Bis später!",
        attribution: "Kurzes Gespräch vor dem Kurs",
      },
      chapterCheck(slug, "morgen-check", "Mini-Check: Tageszeit", "Sie treffen eine Person um 08:00 Uhr. Was passt?", ["Gute Nacht!", "Guten Morgen!", "Guten Abend!"], 1, "Um 08:00 Uhr begrüßt man eine Person mit „Guten Morgen!“"),
      chapterCheck(slug, "abschied-check", "Mini-Check: Abschied", "Welcher Ausdruck ist normalerweise formell?", ["Auf Wiedersehen!", "Hi!", "Tschüss!"], 0, "„Auf Wiedersehen!“ ist ein formeller oder neutral-höflicher Abschied."),

      { id: blockId(slug, "teil-2"), type: "divider", label: "2.2 Sich vorstellen und Namen erfragen" },
      {
        id: blockId(slug, "name-bausteine"),
        type: "tabs",
        heading: "Drei zentrale Sprachbausteine",
        items: [
          { id: blockId(slug, "name-ich-heisse"), title: "Ich heiße …", body: "Der wichtigste Satz für eine Vorstellung: Ich heiße Anna. English: My name is Anna." },
          { id: blockId(slug, "name-ich-bin"), title: "Ich bin …", body: "Auch möglich: Ich bin Daniel. Beginnen Sie beim Lernen zuerst mit „Ich heiße …“" },
          { id: blockId(slug, "name-mein-name"), title: "Mein Name ist …", body: "Eine etwas formellere Alternative: Mein Name ist Maria." },
        ],
      },
      {
        id: blockId(slug, "heissen-formen"),
        type: "comparison-table",
        heading: "heißen: die Formen für dieses Kapitel",
        columns: ["Person", "Form", "Beispiel"],
        rows: [
          ["ich", "heiße", "Ich heiße Maria."],
          ["du", "heißt", "Wie heißt du?"],
          ["Sie", "heißen", "Wie heißen Sie?"],
        ],
      },
      {
        id: blockId(slug, "name-dialoge"),
        type: "comparison-table",
        heading: "Informell oder formell?",
        columns: ["Informell", "Formell"],
        rows: [
          ["Hallo! Wie heißt du?", "Guten Tag. Wie heißen Sie?"],
          ["Ich heiße Lara. Und du?", "Ich heiße Frau König. Und Sie?"],
          ["Freut mich!", "Freut mich, Sie kennenzulernen."],
        ],
      },
      chapterCheck(slug, "heissen-check", "Mini-Check: heißen", "Ergänzen Sie: Ich ___ Lara.", ["heißen", "heißt", "heiße"], 2, "Nach ich steht die Form „heiße“: Ich heiße Lara."),
      chapterCheck(slug, "name-formell-check", "Mini-Check: Formelle Frage", "Sie treffen eine neue Kundin. Welche Frage passt?", ["Wie heißt du?", "Wie heißen Sie?", "Wer du?"], 1, "In einer formellen Situation fragen Sie: „Wie heißen Sie?“"),

      { id: blockId(slug, "teil-3"), type: "divider", label: "2.3 Persönliche Fragen und Satzbau" },
      {
        id: blockId(slug, "fragewoerter"),
        type: "comparison-table",
        heading: "Die Fragewörter als Werkzeug",
        columns: ["Fragewort", "Bedeutung", "Beispielfrage"],
        rows: [
          ["wie", "how", "Wie heißt du?"],
          ["wo", "where", "Wo wohnst du?"],
          ["woher", "where from", "Woher kommst du?"],
          ["was", "what", "Was sprichst du?"],
          ["welche", "which", "Welche Sprachen sprichst du?"],
        ],
      },
      {
        id: blockId(slug, "fragen-werkzeugkasten"),
        type: "accordion",
        heading: "Ihr Gesprächswerkzeugkasten",
        items: [
          ["Name", "Wie heißt du? / Wie heißen Sie?"],
          ["Herkunft", "Woher kommst du? / Woher kommen Sie?"],
          ["Wohnort", "Wo wohnst du? / Wo wohnen Sie?"],
          ["Alter", "Wie alt bist du? / Wie alt sind Sie?"],
          ["Sprachen", "Welche Sprachen sprichst du? / Welche Sprachen sprechen Sie?"],
        ].map(([title, body], index) => ({ id: blockId(slug, `frage-${index + 1}`), title, body })),
      },
      {
        id: blockId(slug, "wortstellung"),
        type: "worked-example",
        heading: "W-Frage und Aussage bauen",
        problem: "Im Deutschen steht das Verb in der W-Frage direkt nach dem Fragewort. In der Aussage steht es an Position zwei.",
        steps: [
          { id: blockId(slug, "wortstellung-1"), title: "Fragewort", body: "Wo" },
          { id: blockId(slug, "wortstellung-2"), title: "Verb", body: "wohnst" },
          { id: blockId(slug, "wortstellung-3"), title: "Person", body: "du?" },
        ],
        answer: "Frage: Wo wohnst du? · Aussage: Ich wohne in Berlin.",
      },
      chapterCheck(slug, "frage-check", "Mini-Check: Frage bauen", "Welche Frage ist richtig?", ["Wo du wohnst?", "Wo wohnst du?", "Du wo wohnst?"], 1, "Die Reihenfolge lautet: Fragewort + Verb + Person: Wo wohnst du?"),

      { id: blockId(slug, "teil-4"), type: "divider", label: "2.4 Länder und Herkunft" },
      {
        id: blockId(slug, "laender"),
        type: "text",
        heading: "Ich komme aus …",
        paragraphs: [
          "Frage informell: Woher kommst du? · Frage formell: Woher kommen Sie?",
          "Antwort: Ich komme aus Deutschland, Österreich, Frankreich, Italien, Spanien, England, Indien, Sri Lanka, China oder Japan.",
          "Lernen Sie Herkunft als vollständigen Satz: Ich komme aus …",
        ],
      },
      {
        id: blockId(slug, "laender-artikel"),
        type: "callout",
        heading: "Einige Ländernamen haben einen Artikel",
        body: "Lernen Sie diese Formen zunächst als feste Ausdrücke: aus der Schweiz · aus der Türkei · aus den USA. Die vollständige Kasusregel kommt später.",
        tone: "blue",
      },
      {
        id: blockId(slug, "kommen-formen"),
        type: "comparison-table",
        heading: "kommen: die Formen für dieses Kapitel",
        columns: ["Person", "Form", "Beispiel"],
        rows: [
          ["ich", "komme", "Ich komme aus Sri Lanka."],
          ["du", "kommst", "Woher kommst du?"],
          ["Sie", "kommen", "Woher kommen Sie?"],
        ],
      },
      chapterCheck(slug, "herkunft-check", "Mini-Check: Herkunft", "Ergänzen Sie: Ich ___ aus Deutschland.", ["komme", "wohne", "spreche"], 0, "Für die Herkunft verwenden Sie „kommen aus“: Ich komme aus Deutschland."),
      chapterCheck(slug, "schweiz-check", "Mini-Check: Länder mit Artikel", "Welche Form ist richtig?", ["Ich komme aus Schweiz.", "Ich komme aus die Schweiz.", "Ich komme aus der Schweiz."], 2, "Die feste A1-Form lautet „aus der Schweiz“."),

      { id: blockId(slug, "teil-5"), type: "divider", label: "2.5 Wo wohnen Sie?" },
      {
        id: blockId(slug, "wohnen-formen"),
        type: "comparison-table",
        heading: "wohnen: fragen und antworten",
        columns: ["Person", "Form", "Beispiel"],
        rows: [
          ["ich", "wohne", "Ich wohne in Hamburg."],
          ["du", "wohnst", "Wo wohnst du?"],
          ["Sie", "wohnen", "Wo wohnen Sie?"],
        ],
      },
      {
        id: blockId(slug, "wo-woher"),
        type: "comparison-table",
        heading: "Woher oder wo?",
        columns: ["Frage", "Bedeutung", "Antwort"],
        rows: [
          ["Woher kommst du?", "Herkunft", "Ich komme aus Sri Lanka."],
          ["Wo wohnst du?", "heutiger Wohnort", "Ich wohne in Deutschland."],
        ],
      },
      {
        id: blockId(slug, "wo-woher-merksatz"),
        type: "callout",
        heading: "Zwei Informationen, zwei Fragen",
        body: "Eine Person kann aus einem Land kommen und heute an einem anderen Ort wohnen. Beispiel: Ich komme aus Sri Lanka. Ich wohne in Berlin.",
        tone: "teal",
      },
      chapterCheck(slug, "wohnen-check", "Mini-Check: wohnen", "Ergänzen Sie: Ich ___ in München.", ["wohnst", "wohne", "wohnen"], 1, "Nach ich steht „wohne“: Ich wohne in München."),
      chapterCheck(slug, "woher-wo-check", "Mini-Check: wo oder woher", "Welche Frage passt zur Antwort „Ich wohne in Köln“?", ["Wo wohnst du?", "Woher kommst du?", "Wie heißt du?"], 0, "„Wo wohnst du?“ fragt nach dem aktuellen Wohnort."),

      { id: blockId(slug, "teil-6"), type: "divider", label: "2.6 Sprachen und Sprachkenntnisse" },
      {
        id: blockId(slug, "sprachen"),
        type: "tabs",
        heading: "Sprachen nennen",
        items: [
          { id: blockId(slug, "sprache-einfach"), title: "Ich spreche …", body: "Ich spreche Deutsch, Englisch, Französisch, Spanisch, Italienisch, Chinesisch, Japanisch, Arabisch oder Türkisch." },
          { id: blockId(slug, "sprache-gut"), title: "gut", body: "Ich spreche gut Englisch." },
          { id: blockId(slug, "sprache-bisschen"), title: "ein bisschen", body: "Ich spreche ein bisschen Deutsch. Lernen Sie diesen sehr nützlichen Satz als Ganzes." },
          { id: blockId(slug, "sprache-noch-nicht"), title: "noch nicht gut", body: "Ich spreche noch nicht gut Deutsch." },
        ],
      },
      {
        id: blockId(slug, "sprechen-formen"),
        type: "comparison-table",
        heading: "sprechen: fragen und antworten",
        columns: ["Person", "Form", "Beispiel"],
        rows: [
          ["ich", "spreche", "Ich spreche Englisch."],
          ["du", "sprichst", "Welche Sprachen sprichst du?"],
          ["Sie", "sprechen", "Welche Sprachen sprechen Sie?"],
        ],
      },
      chapterCheck(slug, "sprachen-check", "Mini-Check: Sprachen", "Welche Antwort passt zu „Welche Sprachen sprichst du?“", ["Ich wohne in Berlin.", "Ich spreche Englisch und ein bisschen Deutsch.", "Ich komme aus Italien."], 1, "Die Frage sucht Sprachen. Deshalb passt „Ich spreche …“"),

      { id: blockId(slug, "teil-7"), type: "divider", label: "2.7 Alter und sein" },
      {
        id: blockId(slug, "sein-tabelle"),
        type: "comparison-table",
        heading: "sein: wichtige Formen",
        columns: ["Person", "Form", "Beispiel"],
        rows: [
          ["ich", "bin", "Ich bin 25 Jahre alt."],
          ["du", "bist", "Wie alt bist du?"],
          ["er / sie", "ist", "Sie ist 30 Jahre alt."],
          ["wir", "sind", "Wir sind im Deutschkurs."],
          ["ihr", "seid", "Seid ihr neu?"],
          ["Sie / sie", "sind", "Wie alt sind Sie?"],
        ],
      },
      {
        id: blockId(slug, "alter-fehler"),
        type: "callout",
        heading: "Häufiger Fehler",
        body: "Nicht: „Ich habe 25 Jahre.“ Richtig ist: „Ich bin 25 Jahre alt.“ Deutsch verwendet sein, nicht haben.",
        tone: "amber",
      },
      chapterCheck(slug, "alter-check", "Mini-Check: Alter", "Welche Antwort ist richtig?", ["Ich habe 25 Jahre.", "Ich bin 25 Jahre alt.", "Ich ist 25 Jahre alt."], 1, "Das Alter steht mit sein: Ich bin 25 Jahre alt."),

      { id: blockId(slug, "teil-8"), type: "divider", label: "2.8 du und Sie" },
      {
        id: blockId(slug, "du-sie"),
        type: "comparison-table",
        heading: "Informell und formell sprechen",
        columns: ["du", "Sie"],
        rows: [
          ["Freunde, Familie, Kinder", "Fremde und formelle Situationen"],
          ["viele Mitschülerinnen und Mitschüler", "Kundenkontakt und beruflicher Kontext"],
          ["Wie heißt du?", "Wie heißen Sie?"],
          ["Wo wohnst du?", "Wo wohnen Sie?"],
          ["Woher kommst du?", "Woher kommen Sie?"],
        ],
      },
      {
        id: blockId(slug, "sie-schreibung"),
        type: "callout",
        heading: "Formelles Sie immer groß",
        body: "Sie mit großem S bedeutet formelles you. sie mit kleinem s bedeutet she oder they. Achten Sie besonders beim Schreiben darauf.",
        tone: "blue",
      },
      chapterCheck(slug, "du-sie-check", "Mini-Check: Situation", "Sie treffen Ihre neue Managerin zum ersten Mal. Was passt?", ["Wie heißt du?", "Wie heißen Sie?", "Wie heißen sie?"], 1, "Bei einer neuen Managerin wählen Sie zunächst die formelle Frage mit großem Sie."),

      { id: blockId(slug, "teil-9"), type: "divider", label: "2.9 Hören: Erster Tag im Deutschkurs" },
      {
        id: blockId(slug, "dialog-vorbereitung"),
        type: "numbered-list",
        heading: "So hören Sie strategisch",
        items: [
          { id: blockId(slug, "hoerstrategie-1"), title: "Erstes Hören", body: "Wer spricht? Wo sind die Personen vermutlich? Verstehen Sie nur die Situation." },
          { id: blockId(slug, "hoerstrategie-2"), title: "Zweites Hören", body: "Notieren Sie Name, Herkunft, Wohnort und Sprachen." },
          { id: blockId(slug, "hoerstrategie-3"), title: "Drittes Hören", body: "Lesen Sie das Transcript mit und sprechen Sie danach eine Rolle nach." },
        ],
      },
      {
        id: blockId(slug, "hoeren"),
        type: "audio",
        heading: "Hören: Anna lernt Sam kennen",
        url: `/audio/german-a1/${slug}.m4a`,
        caption: `Hören Sie zuerst ohne Transcript. Notieren Sie danach Informationen über Anna und Sam. ${AI_VOICE_DISCLOSURE}`,
        transcript,
        completion: "view",
      },
      chapterCheck(slug, "hoercheck-name", "Hörverstehen: Name", "Wie heißt die neue Person?", ["Sam", "Daniel", "Mark"], 0, "Die Person sagt: „Ich heiße Sam.“", true),
      chapterCheck(slug, "hoercheck-herkunft", "Hörverstehen: Herkunft", "Woher kommt Sam?", ["aus Polen", "aus Kanada", "aus Deutschland"], 1, "Sam sagt: „Ich komme aus Kanada.“", true),
      chapterCheck(slug, "hoercheck-anna", "Hörverstehen: Anna", "Welche Aussage über Anna ist richtig?", ["Sie wohnt in Kanada.", "Sie spricht nur Deutsch.", "Sie kommt aus Polen und wohnt in Berlin."], 2, "Anna kommt aus Polen, wohnt in Berlin und spricht drei Sprachen.", true),
      {
        id: blockId(slug, "dialog-formell"),
        type: "quote",
        quote: "A: Guten Tag. Wie heißen Sie? – B: Ich heiße Herr Müller. – A: Woher kommen Sie? – B: Ich komme aus Österreich. – A: Wo wohnen Sie? – B: Ich wohne in München.",
        attribution: "Formelle Vorstellung",
      },
      {
        id: blockId(slug, "wortschatz"),
        type: "flashcards",
        heading: "Kernwortschatz",
        appearance: { variant: "picture-grid", surface: "plain", spacing: "comfortable", width: "reading" },
        items: vocabularyCards,
      },

      { id: blockId(slug, "teil-10"), type: "divider", label: "2.10 Wiederholen, anwenden und prüfen" },
      {
        id: blockId(slug, "kommunikationsbaukasten"),
        type: "accordion",
        heading: "Kommunikationsbaukasten",
        items: [
          "Hallo! / Guten Tag!",
          "Wie heißt du? / Wie heißen Sie?",
          "Ich heiße …",
          "Woher kommst du? / Woher kommen Sie?",
          "Ich komme aus …",
          "Wo wohnst du? / Wo wohnen Sie?",
          "Ich wohne in …",
          "Wie alt bist du? / Wie alt sind Sie?",
          "Ich bin … Jahre alt.",
          "Welche Sprachen sprichst du? / Welche Sprachen sprechen Sie?",
          "Ich spreche … und ein bisschen Deutsch.",
          "Tschüss! / Auf Wiedersehen!",
        ].map((body, index) => ({ id: blockId(slug, `baustein-${index + 1}`), title: `Baustein ${index + 1}`, body })),
      },
      {
        id: blockId(slug, "lesen"),
        type: "text",
        heading: "Lesen",
        paragraphs: [
          "NEU IM DEUTSCHKURS · Name: Sofia García · Alter: 28 · Herkunft: Spanien · Wohnort: Hamburg · Sprachen: Spanisch, Englisch und ein bisschen Deutsch",
          "Hallo! Ich heiße Sofia. Ich komme aus Spanien, aber ich wohne jetzt in Hamburg. Ich bin 28 Jahre alt. Ich spreche Spanisch, Englisch und ein bisschen Deutsch. Bis bald im Kurs!",
          "Lesestrategie: Markieren Sie die fünf persönlichen Angaben und verbinden Sie jedes Feld mit dem passenden Satz.",
        ],
      },
      chapterCheck(slug, "lesecheck", "Leseverstehen prüfen", "Wo wohnt Sofia jetzt?", ["in Spanien", "in Hamburg", "in Berlin"], 1, "Im Text steht: „Ich wohne jetzt in Hamburg.“", true),
      chapterCheck(slug, "reihenfolge-check", "Dialog ordnen", "Welche Reihenfolge ist logisch?", ["Ich heiße Maria. → Hallo! → Wie heißt du?", "Hallo! → Wie heißt du? → Ich heiße Maria.", "Wie heißt du? → Tschüss! → Hallo!"], 1, "Ein Gespräch beginnt mit der Begrüßung, dann kommt die Frage und danach die Antwort."),
      {
        id: blockId(slug, "schreiben"),
        type: "writing-practice",
        heading: "Mini-Projekt: Das bin ich",
        prompt: "Erstellen Sie Ihre Vorstellungskarte mit Name, Alter, Land, Wohnort und Sprachen. Schreiben Sie danach eine Vorstellung in vier bis sechs Sätzen. Sie dürfen erfundene Angaben verwenden.",
        minWords: 25,
        maxWords: 80,
        checklist: ["Ich nenne meinen Namen.", "Ich nenne Alter und Herkunft.", "Ich nenne meinen Wohnort.", "Ich nenne mindestens eine Sprache.", "Ich beginne mit einer Begrüßung und ende passend."],
        modelAnswer: "Hallo! Ich heiße Sofia García. Ich bin 28 Jahre alt. Ich komme aus Spanien und wohne jetzt in Hamburg. Ich spreche Spanisch, Englisch und ein bisschen Deutsch. Bis bald!",
        completion: "interact",
      },
      {
        id: blockId(slug, "sprechen"),
        type: "speaking-practice",
        heading: "Mini-Projekt: Stellen Sie sich vor",
        prompt: "Sprechen Sie vier bis sechs Sätze über sich: Begrüßung, Name, Alter, Herkunft, Wohnort und Sprachen. Stellen Sie am Ende einer anderen Person eine passende Frage.",
        preparationSeconds: 60,
        targetSeconds: 60,
        checklist: ["Ich spreche langsam und deutlich.", "Ich gebe mindestens fünf persönliche Informationen.", "Ich benutze kommen, wohnen, sprechen und sein passend.", "Ich stelle eine persönliche Frage.", "Ich höre meine Aufnahme an."],
        modelAnswer: "Guten Tag! Ich heiße Sam. Ich bin 31 Jahre alt. Ich komme aus Kanada und wohne in Berlin. Ich spreche Englisch und ein bisschen Deutsch. Woher kommen Sie?",
        completion: "interact",
      },
      {
        id: blockId(slug, "kann-liste"),
        type: "accordion",
        heading: "Kapitel-Checkliste: Das kann ich jetzt",
        items: [
          "jemanden begrüßen und verabschieden",
          "meinen Namen sagen und nach einem Namen fragen",
          "Herkunft und Wohnort nennen und erfragen",
          "mein Alter korrekt sagen",
          "meine Sprachen und mein Niveau einfach beschreiben",
          "du und Sie passend verwenden",
          "mich in vier bis sechs Sätzen vorstellen",
        ].map((body, index) => ({ id: blockId(slug, `kann-${index + 1}`), title: `☐ ${body}`, body: "Sagen Sie ein eigenes Beispiel laut. Wiederholen Sie die passende Etappe, wenn der Satz noch nicht automatisch kommt." })),
      },
      chapterCheck(slug, "abschluss-grammatik", "Kapiteltest: Grammatik", "Welche vollständige Vorstellung ist richtig?", ["Ich heiße Lea. Ich komme aus Italien und wohne in Bonn.", "Ich heißen Lea. Ich kommen Italien.", "Ich bin Lea und ich habe 24 Jahre."], 0, "Die Verbformen und Präpositionen in Antwort A sind korrekt.", true),
      chapterCheck(slug, "abschluss-frage", "Kapiteltest: Frage und Antwort", "Welche Antwort passt zu „Woher kommen Sie?“", ["Ich wohne in Köln.", "Ich komme aus Frankreich.", "Ich spreche Französisch."], 1, "Woher fragt nach der Herkunft: Ich komme aus Frankreich.", true),
      {
        id: blockId(slug, "abschluss"),
        type: "callout",
        heading: "Kapitel geschafft 🎉",
        body: "Sie können jetzt ein erstes Kennenlerngespräch führen. Wiederholen Sie morgen Ihre sechs Vorstellungssätze ohne Text und wechseln Sie danach von du zu Sie.",
        tone: "teal",
      },
    ],
  };
}

function chapterThreeLesson(spec: ChapterSpec): AcademyLesson {
  const slug = `03-${slugify(spec.title)}`;
  const transcript = `Anna: Hast du Geschwister?
Eddy: Ja, ich habe einen Bruder und eine Schwester.
Anna: Wie heißt dein Bruder?
Eddy: Er heißt Daniel.
Anna: Wie alt ist er?
Eddy: Er ist siebenundzwanzig Jahre alt. Er ist freundlich und sportlich.
Anna: Und deine Schwester?
Eddy: Sie heißt Laura. Sie ist zweiundzwanzig und sehr lustig.
Anna: Das ist eine große Familie!
Eddy: Ja, und wir wohnen alle in Berlin.`;
  const pictureSources = [20, 1, 2, 3, 4, 5, 19, 6, 7, 10, 11, 12, 13, 14, 15, 16, 17, 18, 8, 9, 24, 18, 3, 21, 20];
  const vocabularyCards = spec.vocabulary.map((term, index) => ({
    id: blockId(slug, `wort-${index + 1}`),
    title: term,
    src: `/images/academy/german-a1/word-cards/chapter-${index === 22 ? "21" : index >= 23 ? "02" : "09"}-${String(pictureSources[index]).padStart(2, "0")}.jpg`,
    alt: `Illustration zum Wort oder Ausdruck „${term}“.`,
    body: `Lesen Sie „${term}“ laut vor. Bilden Sie danach einen eigenen einfachen Satz mit diesem Wort oder Ausdruck.`,
  }));

  return {
    id: "lesson-de-a1-03",
    sectionId: spec.sectionId,
    section: "Grundlagen",
    slug,
    title: `3. ${spec.title}`,
    summary: "Familienmitglieder vorstellen, Besitz ausdrücken und Personen mit Alter, Beziehungen und einfachen Eigenschaften beschreiben.",
    durationMinutes: 300,
    blocks: [
      {
        id: blockId(slug, "ziele"),
        type: "text",
        heading: "Meine Familie und die Menschen um mich",
        paragraphs: [
          "In diesem Kapitel gehen Sie von „Das bin ich“ zu „Das ist meine Familie“. Sie benennen Beziehungen, stellen Personen vor und beschreiben sie mit Namen, Alter und einfachen Eigenschaften.",
          "Am Ende können Sie mein, meine, dein und deine verwenden, Nomen durch er oder sie ersetzen und mit sein und haben über eine echte oder erfundene Familie sprechen.",
          "English help: You never have to share private family information. Every activity can use fictional people.",
        ],
        completion: "view",
      },
      {
        id: blockId(slug, "lernweg"),
        type: "process",
        heading: "Ihr Lernweg: zehn Etappen",
        items: [
          ["1 · Familie", "zentrale Familienwörter erkennen und verwenden"],
          ["2 · Wer ist das?", "Personen mit Das ist … vorstellen"],
          ["3 · mein / meine", "über die eigene Familie sprechen"],
          ["4 · dein / deine", "nach der Familie einer anderen Person fragen"],
          ["5 · er / sie", "Namen und Nomen sinnvoll ersetzen"],
          ["6 · Alter und haben", "Familieninformationen mit sein und haben geben"],
          ["7 · Beschreiben", "Menschen mit einfachen Adjektiven charakterisieren"],
          ["8 · Beziehungen", "Familienstand respektvoll und optional ausdrücken"],
          ["9 · Geschwister", "über Geschwister und Kinder sprechen"],
          ["10 · Meine Familie", "ein Familienprofil lesen, schreiben und sprechen"],
        ].map(([title, body], index) => ({ id: blockId(slug, `lernweg-${index + 1}`), title, body })),
      },
      visualBlock(slug, spec.sectionId, spec.title),

      { id: blockId(slug, "teil-1"), type: "divider", label: "3.1 Familie: Wer gehört dazu?" },
      {
        id: blockId(slug, "familienwoerter"),
        type: "comparison-table",
        heading: "Die wichtigsten Familienmitglieder",
        columns: ["Person", "Mehrzahl oder Gruppe", "Englische Hilfe"],
        rows: [
          ["die Mutter", "die Eltern", "mother / parents"],
          ["der Vater", "die Eltern", "father / parents"],
          ["der Bruder", "die Geschwister", "brother / siblings"],
          ["die Schwester", "die Geschwister", "sister / siblings"],
          ["der Sohn", "die Kinder", "son / children"],
          ["die Tochter", "die Kinder", "daughter / children"],
          ["die Großmutter", "die Großeltern", "grandmother / grandparents"],
          ["der Großvater", "die Großeltern", "grandfather / grandparents"],
        ],
      },
      {
        id: blockId(slug, "familie-erweitert"),
        type: "tabs",
        heading: "Die erweiterte Familie",
        items: [
          { id: blockId(slug, "familie-onkel"), title: "Onkel und Tante", body: "der Onkel · die Tante" },
          { id: blockId(slug, "familie-cousin"), title: "Cousin und Cousine", body: "der Cousin · die Cousine" },
          { id: blockId(slug, "familie-partner"), title: "Partner und Partnerin", body: "der Partner · die Partnerin · der Mann · die Frau" },
        ],
      },
      {
        id: blockId(slug, "familienbaum"),
        type: "process",
        heading: "Einen Familienbaum lesen",
        items: [
          { id: blockId(slug, "baum-1"), title: "Eva und Peter", body: "Eva ist die Mutter. Peter ist der Vater. Zusammen sind sie die Eltern." },
          { id: blockId(slug, "baum-2"), title: "Mia und Ben", body: "Mia ist die Tochter. Ben ist der Sohn. Zusammen sind sie die Kinder." },
          { id: blockId(slug, "baum-3"), title: "Mia und Ben", body: "Für Mia ist Ben der Bruder. Für Ben ist Mia die Schwester. Sie sind Geschwister." },
        ],
      },
      {
        id: blockId(slug, "familienbaum-bild"),
        type: "image",
        src: "/images/academy/german-a1/family-tree-chapter-03.svg",
        alt: "Familienbaum: Eva ist die Mutter und Peter der Vater. Ihre Kinder sind Mia, die Tochter, und Ben, der Sohn.",
        caption: "Sehen Sie auf die Linien: Wer ist Ben für Mia? Wer sind die Eltern von Mia und Ben? Antworten Sie laut mit einem ganzen Satz.",
        aspect: "wide",
        width: "reading",
        completion: "view",
      },
      chapterCheck(slug, "familienbaum-check", "Mini-Check: Familienbaum", "Wer ist Ben für Mia?", ["ihr Vater", "ihr Bruder", "ihr Sohn"], 1, "Ben und Mia sind Geschwister. Ben ist Mias Bruder."),
      chapterCheck(slug, "familie-check", "Mini-Check: Familie", "Die andere Tochter meiner Eltern ist meine …", ["Schwester", "Mutter", "Großmutter"], 0, "Die andere Tochter Ihrer Eltern ist Ihre Schwester."),
      chapterCheck(slug, "eltern-check", "Mini-Check: Gruppenwort", "Welches Wort bezeichnet Mutter und Vater zusammen?", ["Kinder", "Geschwister", "Eltern"], 2, "Mutter und Vater sind die Eltern."),

      { id: blockId(slug, "teil-2"), type: "divider", label: "3.2 Wer ist das? Personen vorstellen" },
      {
        id: blockId(slug, "das-ist"),
        type: "worked-example",
        heading: "Das ist + Person",
        problem: "Mit „Das ist …“ zeigen oder verweisen Sie auf eine Person und stellen sie vor.",
        steps: [
          { id: blockId(slug, "das-ist-1"), title: "Fragen", body: "Wer ist das?" },
          { id: blockId(slug, "das-ist-2"), title: "Beziehung nennen", body: "Das ist meine Schwester." },
          { id: blockId(slug, "das-ist-3"), title: "Namen ergänzen", body: "Sie heißt Maria." },
        ],
        answer: "Wer ist das? – Das ist meine Schwester. Sie heißt Maria.",
      },
      {
        id: blockId(slug, "vorstellen-dialog"),
        type: "quote",
        quote: "A: Wer ist das? – B: Das ist meine Schwester. – A: Wie heißt sie? – B: Sie heißt Maria.",
        attribution: "Ein Foto zeigen",
      },
      chapterCheck(slug, "wer-check", "Mini-Check: Wer ist das?", "Welche Antwort passt zu „Wer ist das?“", ["Das ist mein Vater.", "Er ist 52 Jahre alt.", "Ich wohne in Köln."], 0, "Mit „Das ist …“ identifizieren Sie die Person."),

      { id: blockId(slug, "teil-3"), type: "divider", label: "3.3 mein und meine" },
      {
        id: blockId(slug, "mein-meine"),
        type: "comparison-table",
        heading: "Die einfache A1-Regel",
        columns: ["Form", "Verwendung", "Beispiele"],
        rows: [
          ["mein", "maskulin oder neutral, Singular", "mein Vater · mein Bruder · mein Kind"],
          ["meine", "feminin oder Plural", "meine Mutter · meine Schwester · meine Eltern"],
        ],
      },
      {
        id: blockId(slug, "mein-sortieren"),
        type: "tabs",
        heading: "Nach Artikel sortieren",
        items: [
          { id: blockId(slug, "mein-der"), title: "der → mein", body: "der Vater → mein Vater · der Sohn → mein Sohn · der Bruder → mein Bruder" },
          { id: blockId(slug, "mein-das"), title: "das → mein", body: "das Kind → mein Kind" },
          { id: blockId(slug, "mein-die"), title: "die → meine", body: "die Mutter → meine Mutter · die Tochter → meine Tochter" },
          { id: blockId(slug, "mein-plural"), title: "Plural → meine", body: "die Eltern → meine Eltern · die Kinder → meine Kinder" },
        ],
      },
      chapterCheck(slug, "meine-mutter-check", "Mini-Check: Possessivartikel", "Das ist ___ Mutter.", ["mein", "meine", "meinen"], 1, "Mutter ist feminin: meine Mutter."),
      chapterCheck(slug, "mein-bruder-check", "Mini-Check: Possessivartikel", "Das ist ___ Bruder.", ["mein", "meine", "meiner"], 0, "Bruder ist maskulin: mein Bruder."),
      chapterCheck(slug, "meine-eltern-check", "Mini-Check: Plural", "Das sind ___ Eltern.", ["mein", "meine", "meiner"], 1, "Im Plural verwenden Sie meine: meine Eltern."),

      { id: blockId(slug, "teil-4"), type: "divider", label: "3.4 dein und deine" },
      {
        id: blockId(slug, "dein-deine"),
        type: "comparison-table",
        heading: "Nach der Familie fragen",
        columns: ["Form", "Verwendung", "Beispiele"],
        rows: [
          ["dein", "maskulin oder neutral, Singular", "dein Vater · dein Bruder · dein Kind"],
          ["deine", "feminin oder Plural", "deine Mutter · deine Schwester · deine Kinder"],
        ],
      },
      {
        id: blockId(slug, "dein-fragen"),
        type: "accordion",
        heading: "Nützliche Fragen",
        items: [
          { id: blockId(slug, "dein-frage-1"), title: "Wie heißt dein Bruder?", body: "Antwort: Mein Bruder heißt Daniel." },
          { id: blockId(slug, "dein-frage-2"), title: "Wie alt ist deine Schwester?", body: "Antwort: Meine Schwester ist 22 Jahre alt." },
          { id: blockId(slug, "dein-frage-3"), title: "Wo wohnen deine Eltern?", body: "Antwort: Meine Eltern wohnen in Hamburg." },
        ],
      },
      chapterCheck(slug, "deine-schwester-check", "Mini-Check: dein oder deine", "Wie heißt ___ Schwester?", ["dein", "deine", "meine"], 1, "Schwester ist feminin. Bei du heißt die Form deine."),
      {
        id: blockId(slug, "sein-ihr"),
        type: "comparison-table",
        heading: "Auch über andere Familien sprechen: sein und ihr",
        columns: ["Person", "Maskulin oder neutral", "Feminin oder Plural"],
        rows: [
          ["Daniel (er)", "sein Bruder · sein Kind", "seine Schwester · seine Eltern"],
          ["Laura (sie)", "ihr Bruder · ihr Kind", "ihre Schwester · ihre Eltern"],
        ],
      },
      {
        id: blockId(slug, "sein-ihr-beispiel"),
        type: "callout",
        heading: "Wessen Familie ist gemeint?",
        body: "Anna spricht über Daniel: Das ist seine Mutter. Anna spricht über Laura: Das ist ihre Mutter. Wer über die eigene Mutter spricht, sagt: meine Mutter. Die erste Form richtet sich nach der Person, über die Sie sprechen; die Endung nach dem Familienwort.",
        tone: "blue",
      },
      chapterCheck(slug, "seine-mutter-check", "Mini-Check: sein oder ihr", "Anna spricht über Daniel: Das ist ___ Mutter.", ["seine", "ihre", "sein"], 0, "Wenn Anna über Daniels Mutter spricht, sagt sie: seine Mutter."),
      chapterCheck(slug, "ihr-bruder-check", "Mini-Check: sein oder ihr", "Anna spricht über Laura: Das ist ___ Bruder.", ["sein", "ihr", "ihre"], 1, "Wenn Anna über Lauras Bruder spricht, sagt sie: ihr Bruder."),

      { id: blockId(slug, "teil-5"), type: "divider", label: "3.5 er und sie" },
      {
        id: blockId(slug, "er-sie"),
        type: "comparison-table",
        heading: "Nomen nicht unnötig wiederholen",
        columns: ["Person", "Pronomen", "Beispiel"],
        rows: [
          ["mein Vater / mein Bruder / mein Sohn", "er", "Mein Vater heißt Thomas. Er ist 52."],
          ["meine Mutter / meine Schwester / meine Tochter", "sie", "Meine Mutter heißt Anna. Sie ist 49."],
        ],
      },
      {
        id: blockId(slug, "pronomen-umformen"),
        type: "worked-example",
        heading: "Zwei Sätze verbinden",
        problem: "Das ist mein Bruder. Mein Bruder ist 20 Jahre alt.",
        steps: [
          { id: blockId(slug, "pronomen-1"), title: "Person finden", body: "mein Bruder" },
          { id: blockId(slug, "pronomen-2"), title: "Pronomen wählen", body: "Bruder ist maskulin → er" },
          { id: blockId(slug, "pronomen-3"), title: "Wiederholung ersetzen", body: "Das ist mein Bruder. Er ist 20 Jahre alt." },
        ],
        answer: "Das ist mein Bruder. Er ist 20 Jahre alt.",
      },
      chapterCheck(slug, "er-check", "Mini-Check: Pronomen", "Mein Bruder heißt Paul. ___ ist 18 Jahre alt.", ["Er", "Sie", "Ich"], 0, "Für mein Bruder verwenden Sie er."),
      chapterCheck(slug, "sie-check", "Mini-Check: Pronomen", "Meine Tochter heißt Mia. ___ ist acht Jahre alt.", ["Er", "Sie", "Du"], 1, "Für meine Tochter verwenden Sie sie."),

      { id: blockId(slug, "teil-6"), type: "divider", label: "3.6 Alter und Familieninformationen" },
      {
        id: blockId(slug, "alter-familie"),
        type: "comparison-table",
        heading: "Nach dem Alter fragen",
        columns: ["Frage", "Antwort", "Verb"],
        rows: [
          ["Wie alt ist er?", "Er ist 40 Jahre alt.", "er ist"],
          ["Wie alt ist sie?", "Sie ist 35 Jahre alt.", "sie ist"],
          ["Wie alt sind deine Eltern?", "Sie sind 60 und 63.", "sie sind"],
        ],
      },
      {
        id: blockId(slug, "haben-formen"),
        type: "comparison-table",
        heading: "haben: drei wichtige Formen",
        columns: ["Person", "Form", "Beispiel"],
        rows: [
          ["ich", "habe", "Ich habe einen Bruder."],
          ["du", "hast", "Hast du Geschwister?"],
          ["er / sie", "hat", "Sie hat zwei Kinder."],
        ],
      },
      {
        id: blockId(slug, "haben-hinweis"),
        type: "callout",
        heading: "Chunks zuerst, Kasus später",
        body: "Lernen Sie „einen Bruder“, „eine Schwester“, „zwei Geschwister“ und „keine Kinder“ zunächst als vollständige Bausteine. Den Akkusativ untersuchen Sie später genauer.",
        tone: "blue",
      },
      chapterCheck(slug, "hat-check", "Mini-Check: haben", "Meine Schwester ___ zwei Kinder.", ["habe", "hast", "hat"], 2, "Nach meine Schwester / sie steht hat."),
      chapterCheck(slug, "alter-familie-check", "Mini-Check: Alter", "Welche Frage passt zu „Er ist 27 Jahre alt“?", ["Wie heißt er?", "Wie alt ist er?", "Wo wohnt er?"], 1, "Mit „Wie alt ist er?“ fragen Sie nach seinem Alter."),

      { id: blockId(slug, "teil-7"), type: "divider", label: "3.7 Menschen beschreiben" },
      {
        id: blockId(slug, "adjektive"),
        type: "comparison-table",
        heading: "Einfache Eigenschaften",
        columns: ["Aussehen oder Alter", "Charakter", "Lebensstil"],
        rows: [
          ["jung", "nett", "sportlich"],
          ["alt", "freundlich", "ruhig"],
          ["groß", "lustig", "aktiv"],
          ["klein", "sympathisch", "kreativ"],
          ["", "intelligent", ""],
        ],
      },
      {
        id: blockId(slug, "adjektiv-regel"),
        type: "callout",
        heading: "Nach sein bleibt das Adjektiv einfach",
        body: "Er ist freundlich. Sie ist sportlich. Meine Eltern sind ruhig. Das Adjektiv bekommt nach sein keine Endung – ideal für erste Beschreibungen.",
        tone: "teal",
      },
      {
        id: blockId(slug, "personenkarte"),
        type: "worked-example",
        heading: "Eine Personenkarte in Sätze verwandeln",
        problem: "Max · 24 · sportlich · freundlich",
        steps: [
          { id: blockId(slug, "person-1"), title: "Name", body: "Das ist Max." },
          { id: blockId(slug, "person-2"), title: "Alter", body: "Er ist 24 Jahre alt." },
          { id: blockId(slug, "person-3"), title: "Eigenschaften", body: "Er ist sportlich und freundlich." },
        ],
        answer: "Das ist Max. Er ist 24 Jahre alt. Er ist sportlich und freundlich.",
      },
      chapterCheck(slug, "sportlich-check", "Mini-Check: Beschreiben", "Thomas macht viel Sport. Welches Adjektiv passt?", ["sportlich", "ledig", "klein"], 0, "Eine Person, die viel Sport macht, ist sportlich."),
      chapterCheck(slug, "adjektiv-check", "Mini-Check: Satzbau", "Welcher Satz ist richtig?", ["Sie freundlich ist.", "Sie ist freundlich.", "Sie ist freundliche."], 1, "Mit sein steht das Adjektiv ohne Endung: Sie ist freundlich."),

      { id: blockId(slug, "teil-8"), type: "divider", label: "3.8 Familienstand und Beziehungen" },
      {
        id: blockId(slug, "familienstand"),
        type: "tabs",
        heading: "Beziehungen einfach ausdrücken",
        items: [
          { id: blockId(slug, "status-verheiratet"), title: "verheiratet", body: "Anna ist verheiratet. · Sind Sie verheiratet?" },
          { id: blockId(slug, "status-ledig"), title: "ledig", body: "Tom ist ledig. · Nein, ich bin ledig." },
          { id: blockId(slug, "status-geschieden"), title: "geschieden", body: "Die fiktive Figur Lea ist geschieden." },
          { id: blockId(slug, "status-zusammen"), title: "zusammen", body: "Mia und Alex sind zusammen." },
        ],
      },
      {
        id: blockId(slug, "privatsphaere"),
        type: "callout",
        heading: "Persönliche Angaben bleiben freiwillig",
        body: "Fragen zu Familie und Beziehungen können privat sein. Verwenden Sie in allen Aufgaben gern erfundene Figuren oder sagen Sie: „Darüber möchte ich nicht sprechen.“",
        tone: "amber",
      },
      {
        id: blockId(slug, "formell-kinder"),
        type: "quote",
        quote: "A: Haben Sie Kinder? – B: Ja, ich habe zwei Kinder. – A: Wie alt sind sie? – B: Mein Sohn ist zwölf und meine Tochter ist acht.",
        attribution: "Ein formelles Gespräch über erfundene Personen",
      },
      chapterCheck(slug, "familienstand-check", "Mini-Check: Familienstand", "Welche Antwort passt zu „Sind Sie verheiratet?“", ["Ja, ich bin verheiratet.", "Ich habe 30 Jahre.", "Meine Mutter heißt Anna."], 0, "Die Frage wird mit sein beantwortet: Ich bin verheiratet / ledig."),

      { id: blockId(slug, "teil-9"), type: "divider", label: "3.9 Geschwister, Kinder und Hören" },
      {
        id: blockId(slug, "geschwister-bausteine"),
        type: "accordion",
        heading: "Über die Familie sprechen",
        items: [
          { id: blockId(slug, "geschwister-1"), title: "Hast du Geschwister?", body: "Ja, ich habe einen Bruder und eine Schwester." },
          { id: blockId(slug, "geschwister-2"), title: "Keine Geschwister", body: "Nein, ich habe keine Geschwister." },
          { id: blockId(slug, "geschwister-3"), title: "Kinder", body: "Sie hat zwei Kinder. Er hat einen Sohn." },
          { id: blockId(slug, "geschwister-4"), title: "Zahlen wiederholen", body: "Ich habe zwei Schwestern. Sie hat drei Kinder." },
        ],
      },
      {
        id: blockId(slug, "hoerstrategie"),
        type: "numbered-list",
        heading: "Hören: Namen, Beziehungen und Alter",
        items: [
          { id: blockId(slug, "hoeren-1"), title: "Erstes Hören", body: "Wie viele Personen werden genannt? Welche Beziehung haben sie?" },
          { id: blockId(slug, "hoeren-2"), title: "Zweites Hören", body: "Notieren Sie Daniel und Laura: Alter und eine Eigenschaft." },
          { id: blockId(slug, "hoeren-3"), title: "Nachsprechen", body: "Wählen Sie Anna oder Eddy und sprechen Sie die Rolle mit dem Transcript." },
        ],
      },
      {
        id: blockId(slug, "hoeren"),
        type: "audio",
        heading: "Hören: Eddy erzählt von seiner Familie",
        url: `/audio/german-a1/${slug}.m4a`,
        caption: `Hören Sie zuerst ohne Transcript. Notieren Sie Namen, Alter und Eigenschaften. ${AI_VOICE_DISCLOSURE}`,
        transcript,
        completion: "view",
      },
      chapterCheck(slug, "hoercheck-geschwister", "Hörverstehen: Geschwister", "Wie viele Geschwister hat Eddy?", ["keine", "eins", "zwei"], 2, "Eddy hat einen Bruder und eine Schwester, also zwei Geschwister.", true),
      chapterCheck(slug, "hoercheck-daniel", "Hörverstehen: Daniel", "Welche Aussage über Daniel ist richtig?", ["Er ist 22 und ruhig.", "Er ist 27 und freundlich.", "Er ist 30 und verheiratet."], 1, "Daniel ist 27 Jahre alt, freundlich und sportlich.", true),
      chapterCheck(slug, "hoercheck-laura", "Hörverstehen: Laura", "Wie heißt Eddys Schwester?", ["Anna", "Laura", "Maria"], 1, "Eddys Schwester heißt Laura.", true),
      {
        id: blockId(slug, "wortschatz"),
        type: "flashcards",
        heading: "Kernwortschatz",
        appearance: { variant: "picture-grid", surface: "plain", spacing: "comfortable", width: "reading" },
        items: vocabularyCards,
      },

      { id: blockId(slug, "teil-10"), type: "divider", label: "3.10 Meine Familie: anwenden und prüfen" },
      {
        id: blockId(slug, "lesen"),
        type: "text",
        heading: "Lesen",
        paragraphs: [
          "FAMILIENPROFIL · Das ist Familie Neumann. Julia und Amir sind verheiratet. Julia ist 38 Jahre alt und freundlich. Amir ist 40 und sehr ruhig. Sie haben zwei Kinder: Leni ist zehn und sportlich. Ben ist sieben und lustig.",
          "Julia: Mutter · 38 · freundlich | Amir: Vater · 40 · ruhig | Leni: Tochter · 10 · sportlich | Ben: Sohn · 7 · lustig",
          "Lesestrategie: Markieren Sie zuerst Namen. Ordnen Sie danach jeder Person Beziehung, Alter und Eigenschaft zu.",
        ],
      },
      chapterCheck(slug, "lesecheck", "Leseverstehen prüfen", "Wer ist zehn Jahre alt und sportlich?", ["Julia", "Leni", "Ben"], 1, "Im Familienprofil ist Leni zehn Jahre alt und sportlich.", true),
      chapterCheck(slug, "lesecheck-kinder", "Leseverstehen prüfen", "Wie viele Kinder haben Julia und Amir?", ["ein Kind", "zwei Kinder", "drei Kinder"], 1, "Im Text steht: Sie haben zwei Kinder."),
      {
        id: blockId(slug, "schreiben"),
        type: "writing-practice",
        heading: "Mini-Projekt: Meine Familie",
        prompt: "Beschreiben Sie zwei bis vier Personen aus einer echten oder erfundenen Familie. Nennen Sie für jede Person Beziehung, Name, Alter und mindestens eine Eigenschaft.",
        minWords: 35,
        maxWords: 100,
        checklist: ["Ich beschreibe mindestens zwei Personen.", "Ich verwende mein/meine oder eine erfundene Familie.", "Ich ersetze Wiederholungen mit er oder sie.", "Ich nenne Alter und Eigenschaften.", "Ich prüfe die Formen ist und hat."],
        modelAnswer: "Das ist meine Mutter. Sie heißt Anna und ist 50 Jahre alt. Sie ist freundlich und ruhig. Das ist mein Bruder Daniel. Er ist 25 Jahre alt und sehr sportlich. Er hat ein Kind. Meine Familie wohnt in Köln.",
        completion: "interact",
      },
      {
        id: blockId(slug, "sprechen"),
        type: "speaking-practice",
        heading: "Sprech-Challenge: Eine Familie vorstellen",
        prompt: "Stellen Sie zwei Personen aus einer echten oder erfundenen Familie vor. Sagen Sie Beziehung, Name, Alter und Eigenschaften. Beantworten Sie danach: Hast du Geschwister?",
        preparationSeconds: 60,
        targetSeconds: 75,
        checklist: ["Ich stelle mindestens zwei Personen vor.", "Ich benutze er und sie passend.", "Ich verwende zwei Adjektive.", "Ich sage, ob die Figur Geschwister oder Kinder hat.", "Ich höre meine Aufnahme an."],
        modelAnswer: "Das ist meine Schwester. Sie heißt Laura und ist 22 Jahre alt. Sie ist freundlich und lustig. Das ist mein Bruder Daniel. Er ist 27 und sportlich. Ja, ich habe zwei Geschwister.",
        completion: "interact",
      },
      {
        id: blockId(slug, "kann-liste"),
        type: "accordion",
        heading: "Kapitel-Checkliste: Das kann ich jetzt",
        items: [
          "wichtige Familienmitglieder benennen",
          "eine Person mit Das ist … vorstellen",
          "mein / meine und dein / deine unterscheiden",
          "er und sie passend verwenden",
          "das Alter einer Person nennen und erfragen",
          "Menschen mit einfachen Adjektiven beschreiben",
          "freiwillig über Beziehungen sprechen",
          "nach Geschwistern fragen und antworten",
          "ein kurzes Familienprofil erstellen",
        ].map((body, index) => ({ id: blockId(slug, `kann-${index + 1}`), title: `☐ ${body}`, body: "Sagen Sie ein eigenes Beispiel. Wenn es noch nicht automatisch kommt, wiederholen Sie die passende Etappe." })),
      },
      {
        id: blockId(slug, "abschluss-hinweis"),
        type: "callout",
        heading: "Kapiteltest: 20-Punkte-Check",
        body: "Fünf Wissensfragen prüfen Wortschatz, Possessivartikel, Pronomen und Hören (je 4 Punkte, zusammen 20 Punkte). Das Familienprofil und die Sprechaufnahme gehören zusätzlich zum selbst eingeschätzten Portfolio; sie zählen nicht zur automatischen Punktzahl. Sehen Sie nach jeder Antwort das Feedback an und wiederholen Sie bei Bedarf die passende Etappe.",
        tone: "blue",
      },
      chapterCheck(slug, "abschluss-wortschatz", "Kapiteltest: Familienwortschatz · 4 Punkte", "Wie heißen Mutter und Vater zusammen?", ["die Kinder", "die Eltern", "die Geschwister"], 1, "Mutter und Vater sind die Eltern.", true, 4),
      chapterCheck(slug, "abschluss-possessiv", "Kapiteltest: Possessivartikel · 4 Punkte", "Welche Form ist vollständig richtig?", ["Das ist mein Mutter und meine Bruder.", "Das ist meine Mutter und mein Bruder.", "Das sind meine Mutter und meine Bruder."], 1, "Mutter ist feminin: meine Mutter. Bruder ist maskulin: mein Bruder.", true, 4),
      chapterCheck(slug, "abschluss-pronomen", "Kapiteltest: Pronomen · 4 Punkte", "Meine Schwester heißt Sara. ___ ist nett und ___ zwei Kinder.", ["Er / hat", "Sie / hat", "Sie / habe"], 1, "Für Schwester verwenden Sie sie; die Verbform lautet sie hat.", true, 4),
      chapterCheck(slug, "abschluss-hoeren", "Kapiteltest: Hören · 4 Punkte", "Hören Sie Eddys Familiengespräch noch einmal. Wie alt ist Laura?", ["22 Jahre", "27 Jahre", "12 Jahre"], 0, "Eddy sagt: Sie ist zweiundzwanzig.", true, 4),
      chapterCheck(slug, "abschluss-hoeren-daniel", "Kapiteltest: Hören und Eigenschaften · 4 Punkte", "Hören Sie noch einmal. Wie beschreibt Eddy Daniel?", ["ruhig und klein", "freundlich und sportlich", "ledig und lustig"], 1, "Eddy sagt: Er ist freundlich und sportlich.", true, 4),
      {
        id: blockId(slug, "abschluss"),
        type: "callout",
        heading: "Kapitel geschafft 🎉",
        body: "Sie können jetzt Menschen in einer Familie benennen, vorstellen und beschreiben. Wiederholen Sie morgen drei Personen mit dem Muster: Das ist … Er/Sie heißt … Er/Sie ist …",
        tone: "teal",
      },
    ],
  };
}

function chapterLesson(spec: ChapterSpec): AcademyLesson {
  if (spec.number === 1) return chapterOneLesson(spec);
  if (spec.number === 2) return chapterTwoLesson(spec);
  if (spec.number === 3) return chapterThreeLesson(spec);
  const slug = `${String(spec.number).padStart(2, "0")}-${slugify(spec.title)}`;
  const functional = germanA1FunctionalScenarios[spec.number];
  const dailyRoutine = spec.number === 12;
  const transcript = functional?.transcript || (dailyRoutine
    ? `Anna: Guten Morgen, Sam. Wann beginnt dein Deutschkurs am Mittwoch?\nSam: Normalerweise um sechs Uhr. Aber diese Woche beginnt er erst um halb sieben.\nAnna: Wann arbeitest du?\nSam: Ich arbeite von neun bis fünf. Danach fahre ich zum Kurs.\nAnna: Kaufst du am Mittwoch noch ein?\nSam: Nein, ich kaufe am Dienstag ein. Am Mittwoch rufe ich nach dem Kurs meine Mutter an.\nAnna: Und wann bist du wieder zu Hause?\nSam: Um halb neun.`
    : `Anna: Guten Tag! Heute üben wir ${spec.title.toLowerCase()}.\nEddy: Gut. ${spec.examples[0]}\nAnna: ${spec.examples[1]}\nEddy: Verstanden. ${spec.examples[2]}\nAnna: Sehr gut. Bitte hören Sie noch einmal und achten Sie auf die wichtigen Wörter.`);
  const functionalAudioUrl = functional
    ? `/audio/german-a1/a1-kapitel-${String(functional.routeChapter).padStart(2, "0")}-${functional.sourceSlug.replace(/^\d+-/, "")}.m4a`
    : "";
  const nextSpec = germanA1ChapterSpecs[spec.number % germanA1ChapterSpecs.length];
  return {
    id: `lesson-de-a1-${String(spec.number).padStart(2, "0")}`,
    sectionId: spec.sectionId,
    section: sections.find((item) => item.id === spec.sectionId)!.title,
    slug,
    title: `${spec.number}. ${spec.title}`,
    summary: `Sie verstehen und verwenden zentrale Wörter und Sätze zu ${spec.title.toLowerCase()}.`,
    durationMinutes: 90,
    blocks: [
      { id: blockId(slug, "ziele"), type: "text", heading: "Lernziele", paragraphs: [`Nach diesem Kapitel können Sie ${spec.title.toLowerCase()} in einfachen Alltagssituationen verstehen und anwenden.`, `Sprachbausteine: ${spec.examples.join(" · ")}${spec.number <= 8 ? " · Help: Lesen Sie zuerst die Beispiele und sprechen Sie sie laut nach." : ""}`] },
      visualBlock(slug, spec.sectionId, spec.title),
      { id: blockId(slug, "wortschatz"), type: "flashcards", heading: "Wortschatz", appearance: { variant: "picture-grid", surface: "plain", spacing: "comfortable", width: "reading" }, items: spec.vocabulary.map((term, index) => ({ id: blockId(slug, `wort-${index + 1}`), title: term, src: `/images/academy/german-a1/word-cards/chapter-${String(spec.number).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}.jpg`, alt: `Illustration zum Wort oder Ausdruck „${term}“.`, body: `Lesen Sie „${term}“ laut vor. Bilden Sie danach einen eigenen einfachen Satz mit diesem Wort oder Ausdruck.` })) },
      { id: blockId(slug, "grammatik"), type: "worked-example", heading: "Grammatik im Gebrauch", problem: spec.grammar, steps: spec.examples.map((example, index) => ({ id: blockId(slug, `schritt-${index + 1}`), title: `Beispiel ${index + 1}`, body: example })), answer: `Merksatz: ${spec.grammar}` },
      { id: blockId(slug, functional || dailyRoutine ? "hoeren-alltag" : "hoeren"), type: "audio", heading: functional?.listeningHeading || (dailyRoutine ? "Hören · Sam plant seinen Mittwoch" : "Hören"), url: functionalAudioUrl || (dailyRoutine ? "/audio/german-a1/a1-kapitel-04-tagesablauf.m4a" : `/audio/german-a1/${slug}.m4a`), caption: functional ? `${functional.listeningInstruction} ${AI_VOICE_DISCLOSURE}` : dailyRoutine ? `Hören Sie zuerst ohne Transcript: Wann beginnt der Kurs diesmal? Hören Sie dann noch einmal und notieren Sie Sams Arbeitszeit und seinen Einkaufstag. ${AI_VOICE_DISCLOSURE}` : `Hören Sie zweimal. Beim ersten Mal: Was ist die Situation? Beim zweiten Mal: Notieren Sie drei Details. ${AI_VOICE_DISCLOSURE}`, transcript, completion: "view" },
      ...(functional ? functional.listeningQuestions.map((question, index) => chapterCheck(slug, `hoercheck-alltag-${index + 1}`, `Hörverstehen · Detail ${index + 1}`, question.prompt, question.options, question.correctIndex, question.explanation, true)) : [
        { id: blockId(slug, dailyRoutine ? "hoercheck-kurszeit" : "hoercheck"), type: "knowledge-check", heading: "Hörverstehen prüfen", completion: "pass", required: true, question: dailyRoutine ? { id: `q-${slug}-kurszeit`, prompt: "Wann beginnt Sams Deutschkurs diese Woche am Mittwoch?", options: [{ id: "a", label: "Um 18 Uhr." }, { id: "b", label: "Um 18:30 Uhr." }, { id: "c", label: "Um 20:30 Uhr." }], correctOptionId: "b", explanation: "Sam sagt: Diese Woche beginnt der Kurs erst um halb sieben, also um 18:30 Uhr." } : { id: `q-${slug}-hoeren`, prompt: `Welche Aussage hören Sie im Dialog über „${spec.title}“?`, options: [{ id: "a", label: spec.examples[1] }, { id: "b", label: nextSpec.examples[1] }, { id: "c", label: "Dazu gibt es keine Information." }], correctOptionId: "a", explanation: `Richtig: Im Dialog hören Sie „${spec.examples[1]}“.` } } satisfies LessonBlock,
      ]),
      ...(dailyRoutine ? [chapterCheck(slug, "hoercheck-einkaufstag", "Hörverstehen · Sams Plan", "Wann kauft Sam ein?", ["Am Mittwoch.", "Am Dienstag.", "Am Freitag."], 1, "Sam sagt: Ich kaufe am Dienstag ein.", true)] : []),
      { id: blockId(slug, "lesen"), type: "text", heading: "Lesen", paragraphs: functional ? [functional.reading, "Lesestrategie: Lesen Sie zuerst die Frage. Markieren Sie danach die entscheidende Angabe im Text."] : dailyRoutine ? ["NACHRICHT · Hallo Sam, der Deutschkurs beginnt am Mittwoch um 18:30 Uhr statt um 18 Uhr. Er endet um 20 Uhr. Bitte bringen Sie Ihr Kursbuch mit. Viele Grüße, Frau Weber", "Lesestrategie: Unterstreichen Sie zuerst den Tag und beide Uhrzeiten. Was ist neu, und was soll Sam mitbringen?"] : [`Nachricht von Anna: „Hallo! ${spec.examples[0]} ${spec.examples[1]} ${spec.examples[2]} Bitte antworte mir heute. Viele Grüße, Anna“`, "Lesestrategie: Markieren Sie Namen, Zahlen, Zeiten und Schlüsselwörter. Lesen Sie danach die ganze Nachricht noch einmal."] },
      { id: blockId(slug, "lesecheck"), type: "knowledge-check", heading: "Leseverstehen prüfen", completion: "pass", required: true, question: functional ? { id: `q-${slug}-lesen`, prompt: functional.readingQuestion.prompt, options: functional.readingQuestion.options.map((label, index) => ({ id: ["a", "b", "c"][index], label })), correctOptionId: ["a", "b", "c"][functional.readingQuestion.correctIndex], explanation: functional.readingQuestion.explanation } : dailyRoutine ? { id: `q-${slug}-lesen`, prompt: "Was soll Sam zum Kurs mitbringen?", options: [{ id: "a", label: "Sein Kursbuch." }, { id: "b", label: "Eine Fahrkarte." }, { id: "c", label: "Ein Foto." }], correctOptionId: "a", explanation: "In der Nachricht steht: Bitte bringen Sie Ihr Kursbuch mit." } : { id: `q-${slug}-lesen`, prompt: "Was soll die Person nach der Nachricht tun?", options: [{ id: "a", label: "Heute antworten." }, { id: "b", label: "Nichts tun." }, { id: "c", label: "Nächste Woche anrufen." }], correctOptionId: "a", explanation: "Am Ende steht: „Bitte antworte mir heute.“" } },
      { id: blockId(slug, "schreiben"), type: "writing-practice", heading: "Schreiben", prompt: spec.writing || `Schreiben Sie eine kurze Nachricht zu „${spec.title}“. Verwenden Sie mindestens zwei Sprachbausteine aus diesem Kapitel.`, minWords: spec.number < 14 ? 20 : 30, maxWords: spec.number < 14 ? 40 : 60, checklist: ["Ich beantworte alle Punkte.", "Ich benutze eine passende Anrede und einen Schluss.", "Ich prüfe Verbposition, Artikel und Großschreibung."], modelAnswer: `Hallo! ${spec.examples[0]} ${spec.examples[1]} ${spec.examples[2]} Schreib mir bitte bald. Viele Grüße, Anna`, completion: "interact" },
      { id: blockId(slug, "sprechen"), type: "speaking-practice", heading: "Sprechen", prompt: spec.speaking || `Sprechen Sie über „${spec.title}“. Stellen oder beantworten Sie danach eine einfache Frage.`, preparationSeconds: 30, targetSeconds: spec.number < 14 ? 30 : 45, checklist: ["Ich spreche langsam und deutlich.", "Ich benutze mindestens drei Sätze.", "Ich stelle oder beantworte eine Frage."], modelAnswer: `${spec.examples[0]} ${spec.examples[1]} ${spec.examples[2]}`, completion: "interact" },
      { id: blockId(slug, "abschluss"), type: "callout", heading: "Kapitel geschafft", body: `Ich kann einfache Informationen zu ${spec.title.toLowerCase()} verstehen, lesen, schreiben und sagen. Wiederholen Sie unsichere Karten morgen noch einmal.`, tone: "teal" },
    ],
  };
}

const reviewDefinitions = [
  { after: 8, id: "review-grundlagen", title: "Training 1: Sich vorstellen und Informationen austauschen", sectionId: "grundlagen" },
  { after: 13, id: "review-alltag", title: "Training 2: Einen Alltag planen", sectionId: "alltag-zeit" },
  { after: 19, id: "review-stadt", title: "Training 3: Einkaufen und durch die Stadt fahren", sectionId: "essen-ort" },
  { after: 24, id: "review-leben", title: "Training 4: Arbeit, Freizeit, Gesundheit und Termine", sectionId: "leben-arbeit" },
  { after: 32, id: "review-grammatik", title: "Training 5: Über heute und gestern sprechen", sectionId: "grammatik-kommunikation" },
];

function reviewLesson(definition: (typeof reviewDefinitions)[number], index: number): AcademyLesson {
  const related = germanA1ChapterSpecs.filter((item) => item.sectionId === definition.sectionId);
  const slug = definition.id;
  const transcript = `Anna: Wir planen heute eine vollständige Alltagssituation. ${related[0].examples[0]}\nEddy: ${related[Math.min(1, related.length - 1)].examples[1]}\nAnna: Gut. Jetzt frage ich nach einem Detail. ${related[related.length - 1].examples[2]}\nEddy: Ich antworte in einem vollständigen Satz und frage dann zurück.`;
  return {
    id: `lesson-de-a1-${slug}`,
    sectionId: definition.sectionId,
    section: sections.find((item) => item.id === definition.sectionId)!.title,
    slug,
    title: definition.title,
    summary: "Vier Fertigkeiten in einer zusammenhängenden Alltagssituation anwenden.",
    durationMinutes: 120,
    blocks: [
      { id: blockId(slug, "plan"), type: "process", heading: "Ihr Vier-Fertigkeiten-Training", items: ["Hören: Situation und Details erkennen", "Lesen: Nachricht und praktische Information verbinden", "Schreiben: passend reagieren", "Sprechen: erzählen, fragen und bitten"].map((body, itemIndex) => ({ id: blockId(slug, `phase-${itemIndex + 1}`), title: `Phase ${itemIndex + 1}`, body })) },
      visualBlock(slug, definition.sectionId, definition.title),
      { id: blockId(slug, "hoeren"), type: "audio", heading: "Hören – integrierte Situation", url: `/audio/german-a1/${slug}.m4a`, caption: `Hören Sie zuerst ohne Transcript. Notieren Sie Personen, Ort, Zeit und Ziel. ${AI_VOICE_DISCLOSURE}`, transcript },
      { id: blockId(slug, "lesen"), type: "text", heading: "Lesen", paragraphs: [`Information: ${related.map((item) => item.examples[0]).slice(0, 4).join(" ")}`, "Ordnen Sie die Informationen: Wer? Wo? Wann? Was ist als Nächstes zu tun?"] },
      { id: blockId(slug, "check"), type: "knowledge-check", heading: "Verstehen", completion: "pass", required: true, question: { id: `q-${slug}`, prompt: "Welche Strategie hilft bei Hören und Lesen am meisten?", options: [{ id: "a", label: "Zuerst Situation und Schlüsselwörter erkennen." }, { id: "b", label: "Jedes Wort sofort übersetzen." }, { id: "c", label: "Nur auf lange Wörter achten." }], correctOptionId: "a", explanation: "Auf A1 helfen Situation, Namen, Zahlen, Zeiten und Schlüsselwörter." } },
      { id: blockId(slug, "schreiben"), type: "writing-practice", heading: "Schreiben", prompt: "Antworten Sie auf die Information. Nennen Sie Grund, Zeit und nächsten Schritt.", minWords: 35, maxWords: 65, checklist: ["Ich nenne alle drei Inhaltspunkte.", "Meine Nachricht hat Anrede und Gruß.", "Die Verben stehen an der richtigen Stelle."], modelAnswer: `Hallo Anna, danke für deine Nachricht. ${related[0].examples[0]} ${related[related.length - 1].examples[2]} Bis bald und viele Grüße`, completion: "interact" },
      { id: blockId(slug, "sprechen"), type: "speaking-practice", heading: "Sprechen", prompt: "Erzählen Sie 60 Sekunden über die Situation. Stellen Sie anschließend zwei passende Fragen.", preparationSeconds: 45, targetSeconds: 60, checklist: ["Ich strukturiere meine Antwort.", "Ich nenne konkrete Details.", "Ich stelle zwei verständliche Fragen."], modelAnswer: related.map((item) => item.examples[index % 3]).slice(0, 5).join(" "), completion: "interact" },
    ],
  };
}

function mockLesson(number: 1 | 2): AcademyLesson {
  const slug = `modelltest-${number}`;
  const transcript = `Ansage eins: Der Zug nach Köln fährt heute um achtzehn Uhr zwanzig von Gleis sieben.\nTelefonnotiz: Guten Tag, hier ist die Praxis Berger. Ihr Termin am Dienstag muss leider auf Mittwoch um zehn Uhr verschoben werden.\nGespräch: Guten Abend. Ich hätte gern eine Gemüsesuppe und ein Mineralwasser. Die Rechnung zahle ich mit Karte.`;
  return {
    id: `lesson-de-a1-${slug}`,
    sectionId: "pruefung",
    section: "Prüfungstraining",
    slug,
    title: `Goethe-Stil Modelltraining ${number}`,
    summary: "Alle vier A1-Prüfungsfertigkeiten unter realistischen Bedingungen trainieren.",
    durationMinutes: 180,
    blocks: [
      { id: blockId(slug, "hinweis"), type: "callout", heading: "Unabhängiges Modelltraining", body: "Dieses Training ist kein offizielles Goethe-Prüfungsmaterial. Die Aufgaben sind eigenständig erstellt und orientieren sich nur an den öffentlich beschriebenen A1-Aufgabentypen.", tone: "amber" },
      visualBlock(slug, "pruefung", `Modelltraining ${number}`),
      { id: blockId(slug, "hoeren"), type: "audio", heading: "Hören – Teile 1 bis 3", url: `/audio/german-a1/${slug}.m4a`, caption: `Teil 1: kurze Gespräche. Teil 2: Durchsagen. Teil 3: Nachrichten. Hören Sie nach Prüfungsanweisung ein- oder zweimal. ${AI_VOICE_DISCLOSURE}`, transcript },
      { id: blockId(slug, "hoercheck"), type: "knowledge-check", heading: "Hören auswerten", completion: "pass", required: true, question: { id: `q-${slug}-h`, prompt: "Wann ist der neue Arzttermin?", options: [{ id: "a", label: "Dienstag" }, { id: "b", label: "Mittwoch um zehn Uhr" }, { id: "c", label: "Freitag um acht Uhr" }], correctOptionId: "b", explanation: "Die Praxis verschiebt den Termin auf Mittwoch um zehn Uhr." } },
      { id: blockId(slug, "lesen"), type: "tabs", heading: "Lesen – Teile 1 bis 3", items: [{ id: `${slug}-l1`, title: "Teil 1 · E-Mail", body: "Hallo Sam, der Kurs beginnt morgen erst um zehn. Bitte bring dein Buch mit. Grüße, Mia" }, { id: `${slug}-l2`, title: "Teil 2 · Anzeige", body: "Fahrradwerkstatt König: Montag geschlossen. Dienstag bis Freitag 9–18 Uhr." }, { id: `${slug}-l3`, title: "Teil 3 · Schild", body: "Bitte Tür geschlossen halten. Kein Eingang nach 20 Uhr." }] },
      { id: blockId(slug, "lesecheck"), type: "knowledge-check", heading: "Lesen auswerten", completion: "pass", required: true, question: { id: `q-${slug}-l`, prompt: "Wann ist die Fahrradwerkstatt geschlossen?", options: [{ id: "a", label: "Montag" }, { id: "b", label: "Dienstag" }, { id: "c", label: "Freitag" }], correctOptionId: "a", explanation: "In der Anzeige steht: Montag geschlossen." } },
      { id: blockId(slug, "schreiben"), type: "writing-practice", heading: "Schreiben – Teile 1 und 2", prompt: "Teil 1: Ergänzen Sie gedanklich ein Formular mit Name, Adresse und Geburtsdatum. Teil 2: Schreiben Sie eine Nachricht: Sie kommen später, nennen Sie den Grund und schlagen Sie eine neue Zeit vor.", minWords: 30, maxWords: 60, checklist: ["Alle drei Inhaltspunkte sind enthalten.", "Anrede und Gruß passen.", "Die Nachricht ist klar und höflich."], modelAnswer: "Hallo Mia, ich komme heute leider später, denn mein Zug hat Verspätung. Können wir uns um 18 Uhr treffen? Entschuldigung und viele Grüße, Sam", completion: "interact" },
      { id: blockId(slug, "sprechen"), type: "speaking-practice", heading: "Sprechen – Teile 1 bis 3", prompt: "Teil 1: Stellen Sie sich vor. Teil 2: Stellen und beantworten Sie zwei Fragen zu Alltagsthemen. Teil 3: Formulieren Sie eine Bitte und reagieren Sie darauf.", preparationSeconds: 60, targetSeconds: 90, checklist: ["Ich nenne mindestens fünf persönliche Angaben.", "Ich stelle verständliche W-Fragen.", "Meine Bitte ist höflich und konkret."], modelAnswer: "Guten Tag. Ich heiße Sam und komme aus Sri Lanka. Ich wohne in Berlin und arbeite im Büro. In meiner Freizeit koche ich gern. Was machen Sie am Wochenende? Können Sie mir bitte einen Stift geben?", completion: "interact" },
      { id: blockId(slug, "ressourcen"), type: "resources", heading: "Offizielle Vorbereitung", items: [{ id: `${slug}-goethe-uebung`, title: "Goethe-Institut: A1 Übungsmaterialien", description: "Offizielle Modell- und Übungssätze für Erwachsene.", url: "https://www.goethe.de/ins/pt/en/spr/prf/gzsd1/ueb.html" }, { id: `${slug}-cefr`, title: "Europarat: CEFR Deskriptoren", description: "Offizielle Kann-Beschreibungen für Sprachniveaus.", url: "https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors" }] },
    ],
  };
}

const lessonSequence: AcademyLesson[] = [];
for (const chapter of germanA1ChapterSpecs) {
  lessonSequence.push(chapterLesson(chapter));
  const review = reviewDefinitions.find((item) => item.after === chapter.number);
  if (review) lessonSequence.push(reviewLesson(review, reviewDefinitions.indexOf(review)));
}
lessonSequence.push(mockLesson(1), mockLesson(2));

const grammarQuiz: Array<[string, string, string, string]> = [
  ["Welcher Satz ist richtig?", "Heute lerne ich Deutsch.", "Heute ich Deutsch lerne.", "Heute Deutsch ich lerne."],
  ["Wählen Sie den Akkusativ.", "Ich kaufe einen Apfel.", "Ich kaufe ein Apfel.", "Ich kaufe einer Apfel."],
  ["Welche Negation passt?", "Ich habe kein Auto.", "Ich habe nicht Auto.", "Ich kein habe Auto."],
  ["Welcher Perfekt-Satz ist richtig?", "Ich bin nach Berlin gefahren.", "Ich habe nach Berlin gefahren.", "Ich bin nach Berlin fahren."],
  ["Welche Zeitangabe passt?", "am Montag", "um Montag", "im Montag"],
  ["Welcher Satz enthält ein Modalverb korrekt?", "Ich möchte Kaffee trinken.", "Ich möchte trinke Kaffee.", "Ich Kaffee trinken möchte."],
  ["Welche Form ist höflich?", "Kommen Sie bitte!", "Kommst bitte!", "Kommt Sie bitte!"],
  ["Welche Verbindung ist richtig?", "Ich bleibe zu Hause, weil ich krank bin.", "Ich bleibe zu Hause, weil ich bin krank.", "Weil ich krank bin ich bleibe."],
  ["Welche Dativform ist richtig?", "Ich fahre mit dem Bus.", "Ich fahre mit den Bus.", "Ich fahre mit der Bus."],
  ["Welcher Plural ist richtig?", "das Buch – die Bücher", "das Buch – die Buche", "das Buch – die Buchs"],
];

const readingQuiz: Array<[string, string, string, string]> = [
  ["Lesen Sie: „Praxis Berger: Heute nur bis 14 Uhr geöffnet.“ Was stimmt?", "Die Praxis schließt heute um 14 Uhr.", "Die Praxis öffnet heute um 14 Uhr.", "Die Praxis ist den ganzen Tag geschlossen."],
  ["Lesen Sie: „Bus 12 fährt wegen Bauarbeiten ab Marktstraße.“ Wo fährt der Bus ab?", "An der Marktstraße.", "Am Bahnhof.", "An der Schule."],
  ["Lesen Sie: „Bitte bringen Sie zum Termin Ihren Pass mit.“ Was brauchen Sie?", "Den Pass.", "Eine Fahrkarte.", "Ein Fotoalbum."],
  ["Lesen Sie: „Kursraum 3 ist heute im zweiten Stock.“ Wohin gehen Sie?", "In den zweiten Stock.", "In den dritten Stock.", "Ins Erdgeschoss."],
  ["Lesen Sie: „Anna kommt 20 Minuten später. Der Zug hat Verspätung.“ Warum kommt Anna später?", "Der Zug ist verspätet.", "Sie muss länger arbeiten.", "Der Bus fährt nicht."],
  ["Lesen Sie: „Supermarkt: Samstag 8–16 Uhr, Sonntag geschlossen.“ Wann können Sie einkaufen?", "Samstag um 10 Uhr.", "Sonntag um 10 Uhr.", "Samstag um 18 Uhr."],
  ["Lesen Sie: „Zimmer frei ab 1. Oktober, 450 Euro warm.“ Ab wann ist das Zimmer frei?", "Ab 1. Oktober.", "Bis 1. Oktober.", "Ab 450 Uhr."],
  ["Lesen Sie: „Treffen wir uns vor dem Kino, nicht im Café.“ Wo ist das Treffen?", "Vor dem Kino.", "Im Café.", "Hinter dem Bahnhof."],
  ["Lesen Sie: „Die rote Jacke kostet heute nur 39 Euro.“ Was kostet 39 Euro?", "Die rote Jacke.", "Die schwarze Hose.", "Das blaue Hemd."],
  ["Lesen Sie: „Deutschprüfung: Bitte seien Sie um 8:30 Uhr da.“ Wann sollen Sie da sein?", "Um halb neun.", "Um halb acht.", "Um neun Uhr dreißig."],
];

function finalQuiz(): QuizQuestion[] {
  const vocabularyQuestions = germanA1ChapterSpecs.slice(0, 10).map((spec, index) => {
    const distractor = germanA1ChapterSpecs[(index + 9) % germanA1ChapterSpecs.length];
    return {
      id: `final-k${String(spec.number).padStart(2, "0")}`,
      prompt: `Welche Wendung gehört zu Kapitel ${spec.number}: ${spec.title}?`,
      options: [{ id: "a", label: spec.vocabulary[0] }, { id: "b", label: distractor.vocabulary[0] }, { id: "c", label: distractor.vocabulary[1] }],
      correctOptionId: "a",
      explanation: `„${spec.vocabulary[0]}“ gehört zum Thema ${spec.title}.`,
    } satisfies QuizQuestion;
  });
  const listeningQuestions = germanA1ChapterSpecs.slice(0, 10).map((spec, index) => {
    const distractor = germanA1ChapterSpecs[(index + 12) % germanA1ChapterSpecs.length];
    const authoredListening = [
      { prompt: "Was buchstabiert Eddy?", correct: "Seinen Nachnamen Mahawasala.", wrong1: "Seinen Wohnort Berlin.", wrong2: "Seine E-Mail-Adresse." },
      { prompt: "Wo wohnt Anna?", correct: "In Berlin.", wrong1: "In Kanada.", wrong2: "In München." },
      { prompt: "Wie alt ist Daniel?", correct: "Siebenundzwanzig Jahre.", wrong1: "Zweiundzwanzig Jahre.", wrong2: "Zwanzig Jahre." },
    ][index];
    return {
      id: `final-h${index + 1}`,
      prompt: authoredListening?.prompt || "Welche Aussage hören Sie?",
      audioUrl: `/audio/german-a1/${String(spec.number).padStart(2, "0")}-${slugify(spec.title)}.m4a`,
      options: authoredListening
        ? [{ id: "a", label: authoredListening.correct }, { id: "b", label: authoredListening.wrong1 }, { id: "c", label: authoredListening.wrong2 }]
        : [{ id: "a", label: spec.examples[1] }, { id: "b", label: distractor.examples[1] }, { id: "c", label: distractor.examples[2] }],
      correctOptionId: "a",
      explanation: authoredListening
        ? `Im Hörtext ist die richtige Antwort: ${authoredListening.correct}`
        : `Im Hörtext hören Sie: „${spec.examples[1]}“`,
    } satisfies QuizQuestion;
  });
  const readingQuestions = readingQuiz.map(([prompt, correct, wrong1, wrong2], index) => ({
    id: `final-l${index + 1}`,
    prompt,
    options: [{ id: "a", label: correct }, { id: "b", label: wrong1 }, { id: "c", label: wrong2 }],
    correctOptionId: "a",
    explanation: `Richtig ist: ${correct}`,
  } satisfies QuizQuestion));
  const grammarQuestions = grammarQuiz.map(([prompt, correct, wrong1, wrong2], index) => ({
    id: `final-g${index + 1}`,
    prompt,
    options: [{ id: "a", label: correct }, { id: "b", label: wrong1 }, { id: "c", label: wrong2 }],
    correctOptionId: "a",
    explanation: `Richtig ist: ${correct}`,
  } satisfies QuizQuestion));
  return [...listeningQuestions, ...readingQuestions, ...vocabularyQuestions, ...grammarQuestions];
}

export const germanA1Course: AcademyCourse = migrateAcademyCourse({
  key: GERMAN_A1_COURSE_KEY,
  title: "Deutsch A1 komplett: Alltag, Kommunikation und Prüfung",
  shortTitle: "Deutsch A1 komplett",
  description: "Ein vollständiger, deutschsprachiger A1-Kurs für Erwachsene mit Hören, Lesen, Schreiben, Sprechen, privatem Portfolio und unabhängiger Goethe-Stil-Prüfungsvorbereitung.",
  estimatedMinutes: 4470,
  heroImage: "/images/academy/german-a1/grundlagen.jpg",
  audienceRoles: ["student"],
  passMark: 70,
  quizRevision: 1,
  sections,
  theme: { preset: "journey", accent: "blue-citrus", typography: "friendly-sans", density: "comfortable", coverStyle: "split-image", lessonHeaderStyle: "media-led" },
  rules: { navigation: "linear", lessonCompletion: "required-blocks", requireFinalAssessment: true, attemptLimit: null, feedbackTiming: "after-submit" },
  lessons: lessonSequence,
  quiz: finalQuiz(),
});

export const germanA1AudioManifest = germanA1Course.lessons.map((lesson) => {
  const audio = lesson.blocks.find((block) => block.type === "audio");
  return {
    lessonId: lesson.id!,
    slug: lesson.slug,
    outputPath: audio?.type === "audio" ? audio.url : "",
    transcript: audio?.type === "audio" ? audio.transcript || "" : "",
  };
});

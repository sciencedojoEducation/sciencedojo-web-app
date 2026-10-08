import type { AcademyRichTextDocument, LessonBlock } from './tutor-academy.ts';
import { academyTextColors } from './academy-text-colors.ts';

type Bilingual = { en: string; si: string };
type Example = Bilingual & { de: string };
type NounEndingGroup = {
  article: 'der' | 'die' | 'das';
  rule: Bilingual;
  examples: readonly Example[];
  limits: Bilingual;
};
type MemoryAid = {
  cue: string;
  method: Bilingual;
  limits: Bilingual;
  examples: readonly [Example, Example];
  recall: Bilingual & { answer: string; explanation: Bilingual };
  nounEndings?: readonly NounEndingGroup[];
  video?: { url: string; title: string; creator: string; startSeconds?: number; endSeconds?: number; listen: Bilingual; followUp: Bilingual };
};
type GrammarId = `nico-a1-grammar-${string}`;
const b = (en: string, si: string): Bilingual => ({ en, si });
const e = (de: string, en: string, si: string): Example => ({ de, en, si });

// Original course-created cues and examples, not transcriptions of third-party songs.
export const nicosA1MemoryAids: Record<GrammarId, MemoryAid> = {
  'nico-a1-grammar-00': {
    cue: '🌅 Guten Morgen → ☀️ Guten Tag → 🌆 Guten Abend · Sie / Ihnen',
    method: b('Picture a day from sunrise to evening and greet someone at each point. Imagine formal Sie and Ihnen wearing a capital-letter hat.', 'හිරු උදාවේ සිට සවස දක්වා දවසක් මවාගෙන ඒ ඒ වේලාවේ ආචාරය කියන්න. ගෞරවනීය Sie සහ Ihnen ලොකු අකුරක් පැළඳ සිටිනවා යැයි සිතන්න.'),
    limits: b('These are greeting chunks. Gute Nacht is usually a farewell before sleep. Formal Sie/Ihnen stay capitalized; ordinary sie/ihnen have different uses.', 'මේවා සම්පූර්ණ ආචාර යෙදුම්ය. Gute Nacht සාමාන්‍යයෙන් නින්දට පෙර සමුගැනීමකි. ගෞරවනීය Sie/Ihnen ලොකු අකුරින් ලියයි; sie/ihnen වෙනත් අර්ථවල යෙදේ.'),
    examples: [e('Guten Morgen, Frau Perera.', 'Good morning, Ms Perera.', 'සුබ උදෑසනක්, පෙරේරා මහත්මියනි.'), e('Wie geht es Ihnen?', 'How are you? (formal)', 'ඔබට කොහොමද? (ගෞරවනීය)')],
    recall: { ...b('Close the examples. Greet a teacher in the morning and ask how they are formally.', 'උදාහරණ වසා උදේ ගුරුවරයෙකුට ආචාර කර ගෞරවනීයව සුවදුක් අසන්න.'), answer: 'Guten Morgen! Wie geht es Ihnen?', explanation: b('Morning greeting + capitalized formal Ihnen.', 'උදේ ආචාරය සහ ලොකු අකුරින් ලියන ගෞරවනීය Ihnen යොදන්න.') },
  },
  'nico-a1-grammar-01': {
    cue: '👏 ich -e · du -st · er/sie/es -t · wir -en · ihr -t · sie/Sie -en',
    method: b('Clap once for each person and say the ending. Then attach the endings to lern-. This rhythm was created for this course. Practise sein and haben in separate pairs.', 'එක් පුද්ගල රූපයකට වරක් අත්පුඩි ගසා අවසානය කියන්න. පසුව lern- සමඟ එක් කරන්න. මේ රිද්මය පාඨමාලාව සඳහා සකසා ඇත. sein සහ haben වෙනම යුගල ලෙස පුහුණු වන්න.'),
    limits: b('The rhythm is for regular present-tense endings. Sein and haben are irregular; some stems change or need an extra e.', 'මේ රිද්මය සාමාන්‍ය වර්තමාන ක්‍රියා අවසාන සඳහාය. sein/haben අක්‍රමවත්ය. සමහර ක්‍රියා මූල වෙනස් වේ හෝ අමතර e අවශ්‍ය වේ.'),
    examples: [e('Du lernst Deutsch.', 'You learn German.', 'ඔයා ජර්මන් ඉගෙන ගන්නවා.'), e('Ich bin hier und du hast Zeit.', 'I am here and you have time.', 'මම මෙහි ඉන්නවා; ඔයාට වෙලාව තියෙනවා.')],
    recall: { ...b('Say the six regular endings, then complete: Du ___ Deutsch. (lernen)', 'සාමාන්‍ය අවසාන හය කියා පුරවන්න: Du ___ Deutsch. (lernen)'), answer: '-e, -st, -t, -en, -t, -en. Du lernst Deutsch.', explanation: b('Du takes -st on the regular stem lern-.', 'du සමඟ සාමාන්‍ය lern- මූලයට -st එක් වේ.') },
  },
  'nico-a1-grammar-02': {
    cue: '👤 Wer? · 📦 Was? · 📍 Wo? · 🧳 Woher? · 31 = ein + und + dreißig',
    method: b('Attach each question word to a picture. Build numbers with three tiles: unit, und, tens. Put the conjugated verb immediately after a W-question word.', 'ප්‍රශ්න පදය රූපයක් සමඟ සම්බන්ධ කරන්න. අංකයක් කොටස් තුනකින් හදන්න: ඒකකය, und, දහය. W-ප්‍රශ්න පදයට පසුව වෙනස් කළ ක්‍රියාව තබන්න.'),
    limits: b('The unit-first pattern is for 21–99, excluding whole tens. Learn eleven, twelve and irregular spellings separately. Wo asks location; woher asks origin.', 'ඒකකය මුලින් කියන රටාව පූර්ණ දහයන් හැර 21–99 සඳහාය. 11, 12 සහ විශේෂ අක්ෂර වින්‍යාස වෙනම ඉගෙන ගන්න. wo ස්ථානයද woher පැමිණි තැනද අසයි.'),
    examples: [e('Woher kommen Sie?', 'Where are you from? (formal)', 'ඔබ කොහෙන්ද පැමිණෙන්නේ?'), e('Meine Hausnummer ist einunddreißig.', 'My house number is thirty-one.', 'මගේ නිවාස අංකය තිස් එකයි.')],
    recall: { ...b('Ask where someone lives, then say 42 in German.', 'කෙනෙකු පදිංචි තැන අසා ඉන්පසු 42 ජර්මන් භාෂාවෙන් කියන්න.'), answer: 'Wo wohnst du? / Wo wohnen Sie? · zweiundvierzig', explanation: b('Wo + verb + subject; two + and + forty.', 'wo + ක්‍රියාව + කර්තෘ; දෙක + und + හතළිහ.') },
  },
  'nico-a1-grammar-03': {
    cue: '🔵 der Tisch → die Tische · 🔴 die Tasche → die Taschen · 🟢 das Getränk → die Getränke',
    method: b('Make each noun a three-part memory card: article, noun, plural. Picture it in the course gender colour and say all three parts together.', 'නාමපදයක් Artikel, නාමපදය සහ බහු වචනය යන කොටස් තුනෙන් මතක තබාගන්න. පාඨමාලාවේ ලිංග වර්ණයෙන් එය මවාගෙන කොටස් තුනම එකවර කියන්න.'),
    limits: b('Colour represents grammatical gender, not biological sex. Plurals use die in nominative/accusative; the singular gender remains useful. Stem-changing verbs need their own examples.', 'වර්ණය ව්‍යාකරණ ලිංගය පෙන්වයි. Nominativ/Akkusativ බහු වචනයේ die යෙදේ; ඒක වචන ලිංගයත් මතක තබාගන්න. මූලය වෙනස් වන ක්‍රියා වෙනම උදාහරණ සමඟ ඉගෙන ගන්න.'),
    examples: [e('Der Tisch ist groß.', 'The table is big.', 'මේසය විශාලයි.'), e('Die Getränke sind kalt.', 'The drinks are cold.', 'බීම සීතලයි.')],
    recall: { ...b('Recall the article and plural of Tasche and Getränk. Then choose der/die/das for Zeitung, Mädchen and Frühling. Is Fenster masculine just because it ends in -er?', 'Tasche සහ Getränk හි Artikel සහ බහු වචනය මතකයෙන් කියන්න. ඉන්පසු Zeitung, Mädchen සහ Frühling සඳහා der/die/das තෝරන්න. Fenster හි අවසානය -er නිසාම එය පුරුෂ ලිංගද?'), answer: 'die Tasche → die Taschen · das Getränk → die Getränke\ndie Zeitung · das Mädchen · der Frühling · das Fenster', explanation: b('The suffixes -ung, diminutive -chen and -ling are strong clues. Fenster is neuter: -er is only a tendency. Learn each plural with its noun; do not guess it from colour.', '-ung, කුඩා බව දක්වන -chen සහ -ling ප්‍රබල ඉඟි වේ. Fenster නපුංසක ලිංගයි: -er සාමාන්‍ය ප්‍රවණතාවක් පමණි. බහු වචනය නාමපදය සමඟ ඉගෙන ගන්න; වර්ණයෙන් අනුමාන නොකරන්න.') },
    nounEndings: [
      {
        article: 'die',
        rule: b('Strong suffix clues: -heit, -keit, -ung, -schaft, -ei, -tion/-sion and -tät. Usually feminine: -ie, -ik, -ur and many nouns ending in -e.', 'ප්‍රබල ප්‍රත්‍යය ඉඟි: -heit, -keit, -ung, -schaft, -ei, -tion/-sion සහ -tät. -ie, -ik, -ur සහ -e වලින් අවසන් වන බොහෝ නාමපද සාමාන්‍යයෙන් ස්ත්‍රී ලිංග වේ.'),
        examples: [e('die Zeitung', 'newspaper', 'පුවත්පත'), e('die Freiheit', 'freedom', 'නිදහස'), e('die Freundlichkeit', 'friendliness', 'මිත්‍රශීලී බව')],
        limits: b('Match a real suffix, not just final letters: der Sprung is not an -ung formation. The weaker patterns have exceptions: der Name, das Ende, der Atlantik (-ik), das Genie (-ie), das Abitur (-ur).', 'අවසාන අකුරු පමණක් නොව සැබෑ ප්‍රත්‍යය හඳුනාගන්න: der Sprung යනු -ung ප්‍රත්‍යයෙන් සෑදුණු වචනයක් නොවේ. සාමාන්‍ය රටාවල ව්‍යතිරේක ඇත: der Name, das Ende, der Atlantik (-ik), das Genie (-ie), das Abitur (-ur).'),
      },
      {
        article: 'das',
        rule: b('Strong rule: diminutives formed with -chen or -lein are neuter. Often neuter: -tum, -ma, -ment, -um and -nis. These other endings are clues, not guarantees.', 'ස්ථිර නීතිය: -chen හෝ -lein යොදා කුඩා බව දක්වන ලෙස සෑදුණු නාමපද නපුංසක ලිංග වේ. -tum, -ma, -ment, -um සහ -nis බොහෝ විට නපුංසක ලිංගයි. අනෙක් අවසාන ඉඟි පමණි; සහතික නීති නොවේ.'),
        examples: [e('das Mädchen', 'girl', 'ගැහැනු ළමයා'), e('das Häuschen', 'little house', 'කුඩා නිවස'), e('das Ergebnis', 'result', 'ප්‍රතිඵලය')],
        limits: b('Compare exceptions: der Reichtum, der Irrtum, die Erlaubnis and der Zement. A matching letter sequence alone is not enough: der Kuchen is not a diminutive. Grammatical gender need not match a person’s sex.', 'ව්‍යතිරේක සසඳන්න: der Reichtum, der Irrtum, die Erlaubnis සහ der Zement. අකුරු ගැළපීම පමණක් ප්‍රමාණවත් නැත: der Kuchen කුඩා බව දක්වන වචනයක් නොවේ. ව්‍යාකරණ ලිංගය පුද්ගලයාගේ ලිංගයට සමාන විය යුතු නැත.'),
      },
      {
        article: 'der',
        rule: b('Strong suffix clues: -ling and -ismus. Often masculine: -ig, -or and -er, especially male-person or agent nouns such as Lehrer. Do not classify every word ending in -er as masculine.', 'ප්‍රබල ප්‍රත්‍යය ඉඟි: -ling සහ -ismus. -ig, -or සහ -er බොහෝ විට පුරුෂ ලිංගයි; විශේෂයෙන් Lehrer වැනි පිරිමි පුද්ගලයෙකු හෝ ක්‍රියාව කරන්නෙකු දක්වන වචන. -er වලින් අවසන් වන සෑම වචනයක්ම පුරුෂ ලිංග ලෙස නොසලකන්න.'),
        examples: [e('der Frühling', 'spring (season)', 'වසන්ත ඍතුව'), e('der Tourismus', 'tourism', 'සංචාරක කර්මාන්තය'), e('der Lehrer', 'male teacher', 'ගුරුවරයා')],
        limits: b('Remember das Fenster, die Mutter and der Käfig. Suffix clues predict the noun’s singular gender; case can still change its article: der Lehrer → mit dem Lehrer. Plural formation must be learned separately.', 'das Fenster, die Mutter සහ der Käfig මතක තබාගන්න. ප්‍රත්‍යය ඉඟි ඒක වචන ව්‍යාකරණ ලිංගය සඳහාය; විභක්තිය අනුව Artikel වෙනස් වේ: der Lehrer → mit dem Lehrer. බහු වචනය වෙනම ඉගෙන ගත යුතුය.'),
      },
    ],
  },
  'nico-a1-grammar-04': {
    cue: '🕰️ heute: bin / sind → gestern: war / waren · 🧳 nach Berlin / in die Schweiz',
    method: b('Draw a today/yesterday timeline. For travel, picture a bare place name beside nach and an article-bearing country beside in + its accusative article.', 'අද/ඊයේ කාල රේඛාවක් අඳින්න. ගමනකදී Artikel නැති නගර/රටේ නම nach සමඟද Artikel ඇති රට in + Akkusativ Artikel සමඟද මතක තබාගන්න.'),
    limits: b('This travel cue concerns destinations such as cities and countries. Do not apply nach to every destination. Location differs: in der Schweiz, not in die Schweiz.', 'මේ ඉඟිය නගර සහ රටවල් වැනි ගමනාන්ත සඳහාය. සෑම ගමනාන්තයකටම nach නොයොදන්න. සිටින තැන කියන්නේ in der Schweiz ලෙසය.'),
    examples: [e('Gestern war ich in Berlin.', 'Yesterday I was in Berlin.', 'ඊයේ මම බර්ලින්හි සිටියා.'), e('Morgen fahre ich in die Schweiz.', 'Tomorrow I am travelling to Switzerland.', 'හෙට මම ස්විට්සර්ලන්තයට යනවා.')],
    recall: { ...b('Complete: Gestern ___ wir in Berlin. Morgen fahren wir ___ Deutschland.', 'පුරවන්න: Gestern ___ wir in Berlin. Morgen fahren wir ___ Deutschland.'), answer: 'Gestern waren wir in Berlin. Morgen fahren wir nach Deutschland.', explanation: b('Wir uses waren; Deutschland has no article in this destination phrase.', 'wir සමඟ waren යෙදේ. මෙහි ගමනාන්තය වන Deutschland සඳහා Artikel නැත.') },
  },
  'nico-a1-grammar-05': {
    cue: '🪜 Nominativ → Akkusativ: der → den · die → die · das → das',
    method: b('Picture the masculine article stepping down one rung when it becomes a direct object. In the singular definite-article row, only der changes to den.', 'සෘජු කර්මය වන විට පුරුෂ ලිංග Artikel එක පඩියක් පහළට යනවා යැයි සිතන්න. ඒක වචන නිශ්චිත Artikel පේළියේ der පමණක් den බවට වෙනස් වේ.'),
    limits: b('Identify subject and object first. This cue is for definite articles, not every determiner or adjective. A description after sein has no adjective ending.', 'පළමුව කර්තෘ සහ කර්මය හඳුනාගන්න. මේ ඉඟිය නිශ්චිත Artikel සඳහාය; සෑම විශේෂණයකටම අදාළ නොවේ. sein ට පසුව විස්තරයට විශේෂණ අවසානයක් නැත.'),
    examples: [e('Der Mann kauft den Tisch.', 'The man buys the table.', 'මිනිසා මේසය මිලදී ගන්නවා.'), e('Ich sehe die Tasche und das Auto.', 'I see the bag and the car.', 'මම බෑගය සහ මෝටර් රථය දකිනවා.')],
    recall: { ...b('Complete: Ich kaufe ___ Tisch, ___ Tasche und ___ Auto. Use definite articles.', 'නිශ්චිත Artikel යොදා පුරවන්න: Ich kaufe ___ Tisch, ___ Tasche und ___ Auto.'), answer: 'Ich kaufe den Tisch, die Tasche und das Auto.', explanation: b('All three are accusative objects; only masculine der changes.', 'තුනම Akkusativ කර්මයයි; පුරුෂ ලිංග der පමණක් වෙනස් වේ.') },
  },
  'nico-a1-grammar-06': {
    cue: '🧩 wohnen + das Zimmer → das Wohnzimmer · schlafen + das Zimmer → das Schlafzimmer',
    method: b('Build a compound like a puzzle. The final noun is the head: it supplies the gender and tells you what kind of thing the whole word names.', 'සංයුක්ත නාමපදයක් ප්‍රහේලිකාවක් වගේ හදන්න. අවසාන නාමපදය එහි ලිංගයද මුළු වචනයෙන් කියන දේ වර්ගයද තීරණය කරයි.'),
    limits: b('Some compounds have linking letters; do not simply glue any two words together. Learn the actual word and plural. Es gibt takes an accusative object.', 'සමහර සංයුක්ත වචනවල සම්බන්ධක අකුරු ඇත. ඕනෑම වචන දෙකක් එකතු නොකර සැබෑ වචනය සහ බහු වචනය ඉගෙන ගන්න. es gibt සමඟ Akkusativ කර්මය යෙදේ.'),
    examples: [e('Das Wohnzimmer ist klein.', 'The living room is small.', 'සාලය කුඩායි.'), e('Es gibt einen Küchentisch.', 'There is a kitchen table.', 'කුස්සි මේසයක් තියෙනවා.')],
    recall: { ...b('Küche + Tisch forms Küchentisch. Which article does the compound have?', 'Küche + Tisch එකතු වී Küchentisch සෑදේ. එහි Artikel කුමක්ද?'), answer: 'der Küchentisch · die Küche + der Tisch', explanation: b('The final noun Tisch supplies der; the initial noun does not.', 'අවසාන Tisch හි der ලිංගය ලැබේ; මුල් නාමපදයේ ලිංගය නොවේ.') },
  },
  'nico-a1-grammar-07': {
    cue: '👐 Ich | stehe | um sieben Uhr | auf. · am Montag · um sieben Uhr',
    method: b('Hold your hands apart like a sentence bracket: the conjugated verb opens it and the separable prefix closes it. Put the time between them. Link calendar days to am and clock times to um.', 'අත් දෙක වාක්‍ය වරහනක් ලෙස තබන්න. වෙනස් කළ ක්‍රියාව එය අරඹයි; වෙන්වන පෙර කොටස අවසානයේ එය වසයි. වේලාව මැද තබන්න. දින am සමඟද ඔරලෝසු වේලා um සමඟද සම්බන්ධ කරන්න.'),
    limits: b('This is a main-clause pattern. With a modal, the full infinitive goes at the end. Time phrases can be first; the finite verb still occupies the second sentence element.', 'මේ ප්‍රධාන වාක්‍ය රටාවකි. Modal ක්‍රියාවක් ඇති විට සම්පූර්ණ Infinitiv අවසානයේ යෙදේ. වේලාව මුලට ආවත් වෙනස් කළ ක්‍රියාව දෙවන වාක්‍ය කොටසේ පවතී.'),
    examples: [e('Ich stehe um sieben Uhr auf.', 'I get up at seven.', 'මම හතට නැගිටිනවා.'), e('Am Montag kaufe ich ein.', 'On Monday I go shopping.', 'සඳුදා මම බඩු ගන්නවා.')],
    recall: { ...b('Put in order: um acht Uhr / ich / auf / stehe.', 'පිළිවෙළට තබන්න: um acht Uhr / ich / auf / stehe.'), answer: 'Ich stehe um acht Uhr auf. / Um acht Uhr stehe ich auf.', explanation: b('Both arrangements keep the finite verb second and auf last.', 'රටා දෙකේම වෙනස් කළ ක්‍රියාව දෙවන කොටසේද auf අවසානයේද ඇත.') },
  },
  'nico-a1-grammar-08': {
    cue: '📅 am Dienstag · 🕒 um 15 Uhr · 👐 kann … kommen',
    method: b('Draw a calendar and a clock: am labels the day/date, um labels the clock time. Add a verb bracket when talking about availability with können.', 'දින දර්ශනයක් සහ ඔරලෝසුවක් අඳින්න. දවස/දිනයට am ද ඔරලෝසු වේලාවට um ද යොදන්න. können සමඟ පැමිණිය හැකි බව කියන විට ක්‍රියා වරහනක් හදන්න.'),
    limits: b('Not all time phrases take am: heute and nächste Woche stand without it. Dates use ordinal numbers. Können conjugates irregularly.', 'සෑම කාල යෙදුමකටම am නැත: heute සහ nächste Woche එය නැතිව යෙදේ. දිනයට අනුක්‍රමික සංඛ්‍යා යොදයි. können අක්‍රමවත් ලෙස වෙනස් වේ.'),
    examples: [e('Ich kann am Dienstag um 15 Uhr kommen.', 'I can come on Tuesday at 3 p.m.', 'මට අඟහරුවාදා පස්වරු තුනට එන්න පුළුවන්.'), e('Letzte Woche hatte ich keine Zeit.', 'Last week I had no time.', 'පසුගිය සතියේ මට වෙලාව තිබුණේ නැහැ.')],
    recall: { ...b('Complete: Ich kann ___ Freitag ___ 18 Uhr kommen.', 'පුරවන්න: Ich kann ___ Freitag ___ 18 Uhr kommen.'), answer: 'Ich kann am Freitag um 18 Uhr kommen.', explanation: b('Am goes with the weekday; um goes with the clock time. Kommen closes the bracket.', 'සතියේ දිනට am, ඔරලෝසු වේලාවට um යෙදේ. kommen වරහන වසයි.') },
  },
  'nico-a1-grammar-09': {
    cue: '🧰 Ich | will | als Lehrer | arbeiten. · helfen + mir / dir',
    method: b('Imagine the modal opening a toolbox and the infinitive closing it. Say your work wish with the profession inside. Learn dative verbs together with a person, such as helfen + mir.', 'Modal ක්‍රියාව මෙවලම් පෙට්ටිය අරඹා Infinitiv එය වසනවා යැයි සිතන්න. වෘත්තිය මැද තබා රැකියා කැමැත්ත කියන්න. helfen + mir වැනි Dativ ක්‍රියා පුද්ගලයා සමඟම ඉගෙන ගන්න.'),
    limits: b('Wollen expresses wanting, not the English future will. Do not assume every person mentioned in a sentence is dative; the verb or preposition determines the case.', 'wollen කැමැත්ත දක්වයි; ඉංග්‍රීසි අනාගත will නොවේ. වාක්‍යයක සඳහන් සෑම පුද්ගලයෙකුම Dativ නොවේ. ක්‍රියාව හෝ Präposition විභක්තිය තීරණය කරයි.'),
    examples: [e('Ich will als Lehrer arbeiten.', 'I want to work as a teacher.', 'මට ගුරුවරයෙකු ලෙස වැඩ කරන්න ඕනෑ.'), e('Kannst du mir helfen?', 'Can you help me?', 'ඔයාට මට උදව් කරන්න පුළුවන්ද?')],
    recall: { ...b('Complete: Ich will Deutsch ___. (lernen) Kannst du ___ helfen? (me)', 'පුරවන්න: Ich will Deutsch ___. (lernen) Kannst du ___ helfen? (මට)'), answer: 'Ich will Deutsch lernen. Kannst du mir helfen?', explanation: b('Use a final infinitive with will, and mir with helfen.', 'will සමඟ අවසාන Infinitiv ද helfen සමඟ mir ද යොදන්න.') },
  },
  'nico-a1-grammar-10': {
    cue: '🎵 aus · bei · mit · nach · seit · von · zu → Dativ · 📍 Wo? / ➡️ Wohin?',
    method: b('Use the optional song to recall common fixed dative prepositions. Separately, picture a book resting on a table versus being put onto it: location and destination differ.', 'පොදු ස්ථිර Dativ Präposition මතක තබාගැනීමට කැමති නම් ගීතය යොදාගන්න. වෙනම, මේසය මත තිබෙන පොතක් සහ මේසය මතට තබන පොතක් මවාගන්න: ස්ථානය සහ ගමනාන්තය වෙනස්ය.'),
    limits: b('The seven-word list is a starter set, not every dative preposition; außer and gegenüber also take dative. Wo/Dativ and Wohin/Akkusativ refer to spatial two-way prepositions. Movement alone does not determine case: Ich laufe im Park.', 'මේ වචන හත මූලික කට්ටලයක් පමණි; außer සහ gegenüber ද Dativ ගනී. Wo/Dativ සහ Wohin/Akkusativ ඉඟිය ස්ථානීය Wechselpräpositionen සඳහාය. චලනය පමණින් විභක්තිය තීරණය නොවේ: Ich laufe im Park.'),
    examples: [e('Das Buch liegt auf dem Tisch.', 'The book is lying on the table.', 'පොත මේසය මත තිබෙනවා.'), e('Ich lege das Buch auf den Tisch.', 'I put the book onto the table.', 'මම පොත මේසය මතට තබනවා.')],
    recall: { ...b('Recall three fixed dative prepositions. Then complete: Ich fahre mit ___ Bus. Das Buch liegt auf ___ Tisch.', 'ස්ථිර Dativ Präposition තුනක් මතකයෙන් කියන්න. පුරවන්න: Ich fahre mit ___ Bus. Das Buch liegt auf ___ Tisch.'), answer: 'For example: aus, mit, von. Ich fahre mit dem Bus. Das Buch liegt auf dem Tisch.', explanation: b('Mit always takes dative; auf takes dative here because it describes the book’s location.', 'mit සැමවිටම Dativ ගනී. මෙහි auf පොත තිබෙන තැන කියන නිසා Dativ ගනී.') },
  },
  'nico-a1-grammar-11': {
    cue: '💚 gern → 💚💚 lieber → 💚💚💚 am liebsten · besser als / so gut wie',
    method: b('Make a preference ladder with three activities: one you enjoy, one you prefer, and your favourite. Keep gern beside an activity; use mögen with a noun.', 'ක්‍රියා තුනකින් කැමැත්තේ පඩි පෙළක් හදන්න: කැමති දෙයක්, වඩා කැමති දෙයක් සහ වඩාත්ම කැමති දෙයක්. gern ක්‍රියාවක් සමඟද mögen නාමපදයක් සමඟද පුහුණු වන්න.'),
    limits: b('Gern/lieber/am liebsten compare how much you like doing something. Other comparisons may be irregular: gut/besser/am besten. Use als for inequality and wie for equality.', 'gern/lieber/am liebsten යමක් කිරීමට ඇති කැමැත්ත සසඳයි. වෙනත් සැසඳීම් අක්‍රමවත් විය හැක: gut/besser/am besten. වෙනස් මට්ටම් සඳහා als ද සමාන මට්ටම් සඳහා wie ද යොදන්න.'),
    examples: [e('Ich schwimme gern, aber ich tanze lieber.', 'I enjoy swimming, but I prefer dancing.', 'මම පිහිනන්න කැමතියි; ඒත් නටන්න වඩා කැමතියි.'), e('Am liebsten spiele ich Fußball.', 'Playing football is my favourite.', 'මම වඩාත්ම කැමති පාපන්දු ක්‍රීඩා කරන්නයි.')],
    recall: { ...b('Complete the preference ladder, then say your favourite activity: gern → ___ → ___.', 'කැමැත්තේ පඩි පෙළ පුරවා වඩාත්ම කැමති ක්‍රියාව කියන්න: gern → ___ → ___.'), answer: 'gern → lieber → am liebsten. Am liebsten lese ich.', explanation: b('The personal activity can vary; preserve the pattern.', 'පුද්ගලික ක්‍රියාව වෙනස් විය හැක; රටාව නිවැරදිව තබන්න.') },
  },
  'nico-a1-grammar-12': {
    cue: '🧺 Wie viel Mehl? · 🥚🥚 Wie viele Eier? · Ich hätte gern …',
    method: b('Picture one basket of a measured substance and another with countable items. Ask wie viel for the amount and wie viele for the count. Practise a polite shopping chunk.', 'එක් කූඩයක මනින ද්‍රව්‍යයක්ද අනෙකේ ගණන් කළ හැකි දේවල්ද මවාගන්න. ප්‍රමාණයට wie viel ද ගණනට wie viele ද අසන්න. ආචාරශීලී මිලදී ගැනීමේ යෙදුමක් පුහුණු වන්න.'),
    limits: b('Context can make a substance countable in portions: zwei Kaffee can mean two coffees. Quantities such as a kilo also have their own noun. Learn both Euro and Cent in prices.', 'ප්‍රමාණ ලෙස ගණන් කරන විට ද්‍රව්‍යයක් ගණන් කළ හැක: zwei Kaffee බීම දෙකක් විය හැක. Kilo වැනි ඒකකවලටත් නාමපද ඇත. මිලවල Euro සහ Cent දෙකම ඉගෙන ගන්න.'),
    examples: [e('Wie viel Mehl brauchen wir?', 'How much flour do we need?', 'අපට පිටි කොපමණ අවශ්‍යද?'), e('Ich hätte gern drei Eier.', 'I would like three eggs.', 'මට බිත්තර තුනක් දෙන්න පුළුවන්ද?')],
    recall: { ...b('Complete: Wie ___ Eier? Wie ___ Wasser?', 'පුරවන්න: Wie ___ Eier? Wie ___ Wasser?'), answer: 'Wie viele Eier? Wie viel Wasser?', explanation: b('Eier is a plural count; Wasser is an amount here.', 'Eier බහු වචන ගණනකි; මෙහි Wasser ප්‍රමාණයකි.') },
  },
  'nico-a1-grammar-13': {
    cue: '🧳 Perfekt: habe … gemacht · bin … gefahren · bin … geblieben',
    method: b('Pack a past event into a bracket: conjugated haben/sein near the front, participle at the end. Store each new past form with its auxiliary, not just the participle.', 'අතීත සිදුවීමක් වරහනක දමන්න: වෙනස් කළ haben/sein ඉදිරිපසද Partizip අවසානයේද. නව අතීත රූපය Partizip පමණක් නොව උපකාරක ක්‍රියාව සමඟම මතක තබාගන්න.'),
    limits: b('Destination movement and changes of state often use sein, but this is not “all movement”. Bleiben also uses sein. Irregular participles and verbs without ge- need separate learning.', 'ගමනාන්තයට යාම සහ තත්ත්ව වෙනස්වීම බොහෝවිට sein ගනී; එය සියලු චලන සඳහා නීතියක් නොවේ. bleiben ද sein ගනී. අක්‍රමවත් Partizip සහ ge- නැති ක්‍රියා වෙනම ඉගෙන ගන්න.'),
    examples: [e('Ich habe gestern gekocht.', 'I cooked yesterday.', 'මම ඊයේ උයලා තියෙනවා.'), e('Wir sind nach Berlin gefahren.', 'We travelled to Berlin.', 'අපි බර්ලින් වෙත ගිහින් තියෙනවා.')],
    recall: { ...b('Complete with the auxiliary: Ich ___ gekocht. Ich ___ nach Berlin gefahren. Ich ___ zu Hause geblieben.', 'උපකාරක ක්‍රියාව යොදා පුරවන්න: Ich ___ gekocht. Ich ___ nach Berlin gefahren. Ich ___ zu Hause geblieben.'), answer: 'Ich habe gekocht. Ich bin nach Berlin gefahren. Ich bin zu Hause geblieben.', explanation: b('Memorize habe gekocht, bin gefahren and bin geblieben as pairs.', 'habe gekocht, bin gefahren සහ bin geblieben යුගල ලෙස මතක තබාගන්න.') },
  },
  'nico-a1-grammar-14': {
    cue: '👕 Das Hemd ist rot. ↔ ein rotes Hemd · 👚 die rote Jacke',
    method: b('Place two clothing pictures side by side. After sein the adjective stands bare; before the noun it wears an ending. Say both versions while pointing.', 'ඇඳුම් රූප දෙකක් ළඟ තබන්න. sein ට පසුව විශේෂණය අවසානයක් නැතිව පවතී; නාමපදයට පෙර එයට අවසානයක් ලැබේ. ඇඟිල්ලෙන් පෙන්වමින් රටා දෙකම කියන්න.'),
    limits: b('The ending depends on gender, case, number and the determiner. Do not attach -es to every adjective. Learn gefallen/passen/stehen with a dative person.', 'අවසානය ලිංගය, විභක්තිය, වචන ගණන සහ Artikel අනුව වෙනස් වේ. සෑම විශේෂණයකටම -es නොයොදන්න. gefallen/passen/stehen Dativ පුද්ගලයා සමඟ ඉගෙන ගන්න.'),
    examples: [e('Das Hemd ist rot.', 'The shirt is red.', 'කමිසය රතුයි.'), e('Ich kaufe ein rotes Hemd.', 'I am buying a red shirt.', 'මම රතු කමිසයක් මිලදී ගන්නවා.')],
    recall: { ...b('Complete: Die Jacke ist ___. Ich kaufe eine ___ Jacke. (rot)', 'පුරවන්න: Die Jacke ist ___. Ich kaufe eine ___ Jacke. (rot)'), answer: 'Die Jacke ist rot. Ich kaufe eine rote Jacke.', explanation: b('No ending after ist; -e before the feminine accusative noun after eine.', 'ist ට පසුව අවසානයක් නැත. eine ට පසුව ස්ත්‍රී ලිංග Akkusativ නාමපදයට පෙර -e යෙදේ.') },
  },
  'nico-a1-grammar-15': {
    cue: '👥 ich → mich · du → dich · er → ihn · 🎵 durch · für · gegen · ohne · um',
    method: b('Pair the subject and object pronouns like matching cards. Tap out the five common accusative prepositions as a course-created rhythm, then practise für with a family member.', 'කර්තෘ සහ කර්ම සර්වනාම ගැළපෙන කාඩ්පත් ලෙස යුගල කරන්න. පොදු Akkusativ Präposition පහ පාඨමාලාව සඳහා සකස් කළ රිද්මයකින් තට්ටු කර කියා, für සමඟ පවුලේ සාමාජිකයෙකු යොදන්න.'),
    limits: b('The five words are a starter set, not an exhaustive list. These fixed prepositions differ from two-way ones. Für takes accusative even when the meaning involves a beneficiary; it does not become dative.', 'වචන පහ මූලික කට්ටලයකි; සම්පූර්ණ ලැයිස්තුවක් නොවේ. මේවා Wechselpräpositionen වලින් වෙනස්ය. කෙනෙකු වෙනුවෙන් කියන විටත් für Akkusativ ගනී; Dativ නොවේ.'),
    examples: [e('Das Geschenk ist für meinen Bruder.', 'The gift is for my brother.', 'තෑග්ග මගේ සහෝදරයා වෙනුවෙන්.'), e('Meine Schwester besucht mich.', 'My sister visits me.', 'මගේ සහෝදරිය මාව බලන්න එනවා.')],
    recall: { ...b('Complete: für ___ Bruder (mein); Meine Schwester besucht ___. (me)', 'පුරවන්න: für ___ Bruder (mein); Meine Schwester besucht ___. (මාව)'), answer: 'für meinen Bruder · Meine Schwester besucht mich.', explanation: b('Für takes masculine accusative meinen; me is mich as the direct object here.', 'für සමඟ පුරුෂ ලිංග Akkusativ meinen යෙදේ. මෙහි සෘජු කර්මය වන මාව යන්න mich වේ.') },
  },
  'nico-a1-grammar-16': {
    cue: '🥉 schnell → 🥈 schneller → 🥇 am schnellsten · Komm! / Kommt! / Kommen Sie!',
    method: b('Picture a three-place podium for the comparison forms. Then address one friend, several friends and a formal adult with three instruction cards.', 'සැසඳීමේ රූප තුන සඳහා ජය වේදිකාවක් මවාගන්න. පසුව එක් මිතුරෙකුට, මිතුරන් කිහිපදෙනෙකුට සහ ගෞරවනීය පුද්ගලයෙකුට උපදෙස් කාඩ්පත් තුනක් යොදන්න.'),
    limits: b('Some comparisons change the stem: gut/besser/am besten. Du imperatives can also be irregular: Iss! Nimm! Lies! Do not derive all commands by deleting -st.', 'සමහර සැසඳීම්වල මූලය වෙනස් වේ: gut/besser/am besten. du උපදෙස් ද අක්‍රමවත් විය හැක: Iss! Nimm! Lies! සෑම විධානයක්ම -st ඉවත් කර නොහදන්න.'),
    examples: [e('Anna läuft am schnellsten.', 'Anna runs the fastest.', 'ඇනා වේගයෙන්ම දුවනවා.'), e('Kommt bitte um neun Uhr!', 'Please come at nine! (several friends)', 'කරුණාකර නවයට එන්න! (මිතුරන් කිහිපදෙනෙකුට)')],
    recall: { ...b('Say the three forms of gut, then tell one friend to come.', 'gut හි සැසඳීම් රූප තුන කියා එක් මිතුරෙකුට එන්න කියන්න.'), answer: 'gut → besser → am besten · Komm!', explanation: b('Gut is irregular; Komm addresses one person informally.', 'gut අක්‍රමවත්ය. Komm එක් පුද්ගලයෙකුට හිතවත් ලෙස කියයි.') },
  },
  'nico-a1-grammar-17': {
    cue: '🟢 nicht müssen = nicht nötig · 🔴 nicht dürfen = verboten · 💊 sollen = Rat / Auftrag',
    method: b('Picture two signs: an open green door means there is no obligation; a red stop sign means there is no permission. Read the meaning before choosing the modal.', 'සලකුණු දෙකක් මවාගන්න: විවෘත හරිත දොර අනිවාර්ය නැති බවද රතු නවතින්න සලකුණ අවසර නැති බවද පෙන්වයි. Modal ක්‍රියාව තෝරන්න පෙර අර්ථය බලන්න.'),
    limits: b('Nicht müssen means “do not have to”, never “must not”. Sollen often reports someone else’s instruction. A body part can be the subject of wehtun; the person is dative.', 'nicht müssen යනු අනිවාර්ය නැහැ යන්නයි; තහනම් යන්න නොවේ. sollen බොහෝවිට වෙනත් කෙනෙකුගේ උපදෙස් කියයි. wehtun හි ශරීර කොටස කර්තෘද පුද්ගලයා Dativ ද විය හැක.'),
    examples: [e('Du musst nicht warten.', 'You do not have to wait.', 'ඔයාට බලා සිටීම අනිවාර්ය නැහැ.'), e('Du darfst hier nicht rauchen.', 'You must not smoke here.', 'ඔයාට මෙහි දුම් පානය කිරීම තහනම්.')],
    recall: { ...b('Which means “You must not run”: Du musst nicht laufen or Du darfst nicht laufen?', 'දුවන්න තහනම් යන්න කියන්නේ කුමක්ද: Du musst nicht laufen ද Du darfst nicht laufen ද?'), answer: 'Du darfst nicht laufen.', explanation: b('Nicht dürfen expresses a prohibition; nicht müssen removes an obligation.', 'nicht dürfen තහනම දක්වයි; nicht müssen අනිවාර්යතාවය ඉවත් කරයි.') },
  },
  'nico-a1-grammar-18': {
    cue: '👏 mir · dir · ihm/ihr/ihm · uns · euch · ihnen/Ihnen · hätte + Nomen / wäre + Zustand / würde + Infinitiv',
    method: b('Tap out the dative pronouns in person groups using this course-created rhythm. For wishes, imagine three doors: a thing to have, a state to be in, and an action to do.', 'පාඨමාලාව සඳහා සකස් කළ රිද්මයෙන් පුද්ගල කාණ්ඩ අනුව Dativ සර්වනාම තට්ටු කර කියන්න. කැමැත්ත සඳහා දොරවල් තුනක් මවාගන්න: තිබීමට දෙයක්, සිටීමට තත්ත්වයක් සහ කිරීමට ක්‍රියාවක්.'),
    limits: b('Learn verbs such as helfen with dative; not every English “me” becomes mir. These wish chunks are an A1 starting point, not every use of hätte/wäre/würde. Formal Ihnen needs a capital.', 'helfen වැනි ක්‍රියා Dativ සමඟ ඉගෙන ගන්න. සෑම ඉංග්‍රීසි me යන්නම mir නොවේ. මේ කැමැත්තේ යෙදුම් A1 ආරම්භයක් පමණි; hätte/wäre/würde හි සියලු යෙදුම් නොවේ. ගෞරවනීය Ihnen ලොකු අකුරින් ලියයි.'),
    examples: [e('Kannst du mir helfen?', 'Can you help me?', 'ඔයාට මට උදව් කරන්න පුළුවන්ද?'), e('Ich hätte gern ein Haus. Ich wäre gern Lehrer. Ich würde gern reisen.', 'I would like a house. I would like to be a teacher. I would like to travel.', 'මට නිවසක් තිබුණා නම් කැමතියි. මම ගුරුවරයෙකු වුණා නම් කැමතියි. මට සංචාරය කරන්න කැමතියි.')],
    recall: { ...b('Complete: Ich ___ gern Tee. Ich ___ gern in Berlin. Ich ___ gern Deutsch lernen.', 'පුරවන්න: Ich ___ gern Tee. Ich ___ gern in Berlin. Ich ___ gern Deutsch lernen.'), answer: 'Ich hätte gern Tee. Ich wäre gern in Berlin. Ich würde gern Deutsch lernen.', explanation: b('Having: hätte; being: wäre; doing: würde + final infinitive.', 'තිබීම: hätte; සිටීම: wäre; කිරීම: würde + අවසාන Infinitiv.') },
  },
};

// Reviewed 2026-10-07 against creator descriptions, recording visuals and playback.
// Transcript reviewed 2026-10-07; local suffix guidance adds limits and exceptions.
nicosA1MemoryAids['nico-a1-grammar-03'].video = {
  url: 'https://www.youtube.com/watch?v=cYcFR-vBykc', title: 'Noun endings: remembering der, die and das', creator: "Maggie's German Learning Songs / Maggie J",
  listen: b('The explanation comes first; the song starts around 5:40. Listen for the three noun-ending groups. Some are strong suffix rules, while others are tendencies: use the local examples and exceptions rather than treating every ending as a guarantee. Automatic captions may misspell the endings.', 'පළමුව පැහැදිලි කිරීම ඇත; ගීතය 5:40 පමණ ආරම්භ වේ. නාමපද අවසාන කාණ්ඩ තුනට සවන් දෙන්න. සමහර ප්‍රත්‍යය ප්‍රබල නීති වන අතර අනෙක්වා සාමාන්‍ය ප්‍රවණතා පමණි. සෑම අවසානයක්ම සහතික නීතියක් ලෙස නොගෙන මෙහි උදාහරණ සහ ව්‍යතිරේක යොදාගන්න. ස්වයංක්‍රීය උපසිරැසිවල අවසාන වැරදි ලෙස ලියවිය හැක.'),
  followUp: b('Close the player. Give one noun for each gender and explain its suffix clue. Then recall an exception to -er or -nis. Keep learning article + noun + plural together.', 'වීඩියෝව වසන්න. එක් එක් ලිංගයට නාමපදයක් කියා එහි ප්‍රත්‍යය ඉඟිය පැහැදිලි කරන්න. පසුව -er හෝ -nis සඳහා ව්‍යතිරේකයක් මතකයෙන් කියන්න. Artikel + නාමපදය + බහු වචනය එකට ඉගෙන ගන්න.'),
};
// Maggie's 49-second recording reviewed 2026-10-07: seven starter prepositions
// and an abbreviated article reminder. Automatic captions are unreliable.
nicosA1MemoryAids['nico-a1-grammar-10'].video = {
  url: 'https://www.youtube.com/watch?v=XnRy9j6vm9c', title: 'Dativ Präpositionen Song', creator: "Maggie's German Learning Songs / Maggie J",
  listen: b('Listen for the seven starter prepositions in the cue above. The article reminder is abbreviated: masculine/neuter → dem, feminine → der, plural → den (usually add -n to the noun unless it already ends in -n/-s). Automatic subtitles can be inaccurate; use the local written explanation.', 'ඉහත ඉඟියේ මූලික Präposition හතට සවන් දෙන්න. Artikel මතක් කිරීම කෙටි කර ඇත: පුරුෂ/නපුංසක → dem, ස්ත්‍රී → der, බහුවචන → den (නාමපදය දැනටමත් -n/-s වලින් අවසන් නොවේ නම් සාමාන්‍යයෙන් -n එක් කරන්න). ස්වයංක්‍රීය උපසිරැසි වැරදි විය හැකි නිසා මෙහි ලිඛිත පැහැදිලි කිරීම යොදාගන්න.'),
  followUp: b('Pause, recall three prepositions, and make one new phrase such as mit dem Bus. The song helps recall the list; the lesson explains its use.', 'නවතා Präposition තුනක් මතකයෙන් කියා mit dem Bus වැනි නව යෙදුමක් හදන්න. ගීතය ලැයිස්තුව මතක තබාගැනීමටයි; භාවිතය පාඩමෙන් ඉගෙන ගන්න.'),
};
// Antrim: accusative introduction/song 0:55–1:28; first dative melody 1:28–2:16.
nicosA1MemoryAids['nico-a1-grammar-15'].video = {
  url: 'https://www.youtube.com/watch?v=23VZ4EpyENo', title: 'Accusative prepositions through music', creator: 'Learn German with Herr Antrim', startSeconds: 55, endSeconds: 88,
  listen: b('This short segment groups accusative prepositions. Focus on the five starter words above. Other words in the song are extra; their usage needs separate explanation.', 'මේ කෙටි කොටස Akkusativ Präposition කාණ්ඩ කරයි. ඉහත මූලික වචන පහට අවධානය දෙන්න. ගීතයේ අමතර වචනවල භාවිතය වෙනම ඉගෙන ගත යුතුය.'),
  followUp: b('After listening, close the player and make a new phrase with für and a family member. Explain why the article is accusative.', 'ඇසීමෙන් පසුව වීඩියෝව වසා für සහ පවුලේ සාමාජිකයෙකු යොදා නව යෙදුමක් හදන්න. Artikel Akkusativ වන්නේ ඇයිද කියන්න.'),
};

export const nicosDativeAlternativeVideo: NonNullable<MemoryAid['video']> = {
  url: 'https://www.youtube.com/watch?v=23VZ4EpyENo', title: 'Dative prepositions: another melody', creator: 'Learn German with Herr Antrim', startSeconds: 88, endSeconds: 136,
  listen: b('Try the alternative dative melody. It includes außer and gegenüber beyond the seven-word starter list.', 'වෙනත් තාලයක Dativ ගීතය උත්සාහ කරන්න. මූලික වචන හතට අමතරව außer සහ gegenüber ද ඇතුළත් වේ.'),
  followUp: b('Choose whichever melody is easier for you, then recall the list without playing it.', 'ඔබට පහසු තාලය තෝරා එය නැතිව ලැයිස්තුව මතකයෙන් කියන්න.'),
};

const text = (value: string, german = false) => ({ type: 'paragraph', content: [{ type: 'text', text: value,
  ...(german ? { marks: [{ type: 'bold' }, { type: 'textStyle', attrs: { color: academyTextColors.blue } }] } : {}) }] });
const bilingualParagraphs = (value: Bilingual) => [text(`English: ${value.en}`), text(`සිංහල: ${value.si}`)];
const heading = (value: string, level: number) => ({ type: 'heading', attrs: { level }, content: [{ type: 'text', text: value }] });

export function nicosMemoryBlocks(lessonId: string): LessonBlock[] {
  if (!/^nico-a1-grammar-(?:0\d|1[0-8])$/.test(lessonId)) return [];
  const aid: MemoryAid | undefined = (nicosA1MemoryAids as Record<string, MemoryAid>)[lessonId];
  if (!aid) return [];
  const id = `${lessonId}-memory`;
  const content: AcademyRichTextDocument = { type: 'doc', content: [
    heading('🧠 Merktipp · Remember it · මතක තබාගන්න', 2),
    text('Optional memory practice · කැමති නම් කළ හැකි මතක අභ්‍යාසය'),
    text(aid.cue, true), ...bilingualParagraphs(aid.method),
    ...aid.examples.flatMap(example => [text(example.de, true), ...bilingualParagraphs(example)]),
    ...(aid.nounEndings ? [
      heading('🧩 Wortendungen · Noun endings · නාමපද අවසාන', 3),
      ...bilingualParagraphs(b('Original course practice: use suffixes as memory clues, then check the article. Strong rules and tendencies are labelled separately below.', 'පාඨමාලාව සඳහා සකස් කළ අභ්‍යාසය: ප්‍රත්‍යය මතක ඉඟි ලෙස යොදා පසුව Artikel පරීක්ෂා කරන්න. ප්‍රබල නීති සහ සාමාන්‍ය ප්‍රවණතා පහත වෙන වෙනම දක්වා ඇත.')),
      ...aid.nounEndings.flatMap(group => {
        const color = academyTextColors[group.article === 'der' ? 'blue' : group.article === 'die' ? 'red' : 'green'];
        const colored = (value: string) => ({ type: 'paragraph', content: [{ type: 'text', text: value, marks: [{ type: 'bold' }, { type: 'textStyle', attrs: { color } }] }] });
        return [colored(`${group.article === 'der' ? '🔵' : group.article === 'die' ? '🔴' : '🟢'} ${group.article}`), ...bilingualParagraphs(group.rule),
          ...group.examples.flatMap(example => [colored(example.de), ...bilingualParagraphs(example)]),
          ...bilingualParagraphs(group.limits)];
      }),
    ] : []),
    heading('⚠️ Where this shortcut stops · මේ ඉඟියේ සීමාව', 3), ...bilingualParagraphs(aid.limits),
    heading('🙈 Try from memory · මතකයෙන් උත්සාහ කරන්න', 3), ...bilingualParagraphs(aid.recall),
    text('Say your answer before opening the reveal. Your wording can differ. This is ungraded self-review. · පිළිතුර විවෘත කිරීමට පෙර ඔබේ පිළිතුර කියන්න. මෙයට ලකුණු නොදේ.'),
  ] };
  return [
    { id, type: 'text', heading: '🧠 Merktipp · Remember it · මතක තබාගන්න', paragraphs: [aid.cue, aid.method.en, aid.method.si], content },
    { id: `${id}-reveal`, type: 'accordion', initiallyOpen: false, items: [{
      id: `${id}-answer`, title: '👀 Reveal · Antwort zeigen · පිළිතුර බලන්න',
      body: `Deutsch: ${aid.recall.answer}\n\nEnglish: ${aid.recall.explanation.en}\n\nසිංහල: ${aid.recall.explanation.si}`,
    }] },
    ...[...(aid.video ? [aid.video] : []), ...(lessonId === 'nico-a1-grammar-10' ? [nicosDativeAlternativeVideo] : [])].map((video, index): LessonBlock => ({
      id: `${id}-video-${index + 1}`, type: 'video', heading: `🎵 ${video.title}`, url: video.url,
      clickToLoad: true, startSeconds: video.startSeconds, endSeconds: video.endSeconds,
      caption: `${video.creator} · Optional video\nEnglish: ${video.listen.en}\nසිංහල: ${video.listen.si}\nEnglish: ${video.followUp.en}\nසිංහල: ${video.followUp.si}`,
    })),
  ];
}

/** Render-only enrichment: never changes persisted teacher content or completion rules. */
export function withNicosMemoryAids(courseKey: string | undefined, lessonId: string | undefined, blocks: LessonBlock[]): LessonBlock[] {
  // Admin previews deliberately omit save identities; infer only from a canonical forms-table ID.
  lessonId ??= blocks.find(block => /^nico-a1-grammar-(?:0\d|1[0-8])-patterns$/.test(block.id || ''))?.id?.replace(/-patterns$/, '');
  if (courseKey !== 'deutsch-nicos-weg-a1' || !lessonId || blocks.some(block => block.id === `${lessonId}-memory`)) return blocks;
  const extra = nicosMemoryBlocks(lessonId);
  const patterns = blocks.findIndex(block => block.id === `${lessonId}-patterns` && block.type === 'comparison-table');
  const film = blocks.findIndex(block => block.id === `${lessonId}-film`);
  if (!extra.length || patterns < 0 || film <= patterns) return blocks;
  return [...blocks.slice(0, patterns + 1), ...extra, ...blocks.slice(patterns + 1)];
}

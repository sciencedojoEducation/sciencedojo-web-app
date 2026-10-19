/** Original starter material. Difficulty labels are editorial practice levels. */
export const GERMAN_LEVELS = ['A1','A2','B1','B2','C1','C2'] as const;
export type GermanLevel = typeof GERMAN_LEVELS[number];
export type VocabularyCard = {id:string;level:GermanLevel;term:string;forms:string;part:string;explanation:string;example:string;translation:string;distractors:string[]};
const source:Record<GermanLevel,string>={
A1:`der Apfel|noun; die Äpfel|an apple: a round fruit that grows on a tree|Ich esse einen roten Apfel.|I am eating a red apple.
der Tisch|noun; die Tische|a table: furniture with a flat surface for eating or working|Das Buch liegt auf dem Tisch.|The book is on the table.
die Schule|noun; die Schulen|a school: a place where people have lessons|Unsere Schule hat einen Garten.|Our school has a garden.
das Wasser|noun; usually no plural|water: the clear liquid people drink|Ich trinke ein Glas Wasser.|I am drinking a glass of water.
das Fenster|noun; die Fenster|a window: an opening with glass that lets light into a room|Das Fenster ist offen.|The window is open.
der Freund|noun; die Freunde; feminine: die Freundin|a friend: someone you know well and like|Mein Freund wohnt hier.|My friend lives here.
die Familie|noun; die Familien|a family: people related to each other, such as parents and children|Meine Familie isst zusammen.|My family eats together.
das Brot|noun; die Brote|bread: food made from flour and baked|Wir kaufen heute frisches Brot.|We are buying fresh bread today.
der Bahnhof|noun; die Bahnhöfe|a railway station: a place where trains stop for passengers|Der Zug wartet am Bahnhof.|The train is waiting at the station.
die Uhr|noun; die Uhren|a clock or watch: an object that shows the time|Die Uhr hängt an der Wand.|The clock hangs on the wall.
das Zimmer|noun; die Zimmer|a room: a separate space inside a building|Mein Zimmer ist klein.|My room is small.
der Stuhl|noun; die Stühle|a chair: a seat for one person with a back|Bitte nimm einen Stuhl.|Please take a chair.
die Tasche|noun; die Taschen|a bag: something used to carry belongings|Meine Tasche ist blau.|My bag is blue.
die Straße|noun; die Straßen|a street: a road in a town or city|Die Straße ist heute ruhig.|The street is quiet today.
der Schlüssel|noun; die Schlüssel|a key: a small object used to open a lock|Der Schlüssel liegt neben der Tür.|The key is beside the door.
lernen|verb; lernt, hat gelernt|to learn: to gain knowledge or a skill|Wir lernen jeden Tag Deutsch.|We learn German every day.
trinken|verb; trinkt, hat getrunken|to drink: to take liquid into your mouth and swallow it|Sie trinkt einen Tee.|She is drinking a tea.
wohnen|verb; wohnt, hat gewohnt|to live: to have your home in a place|Ich wohne in Berlin.|I live in Berlin.
kaufen|verb; kauft, hat gekauft|to buy: to get something by paying money|Er kauft ein Buch.|He is buying a book.
lesen|verb; liest, hat gelesen|to read: to understand written words|Wir lesen eine kurze Geschichte.|We are reading a short story.
schreiben|verb; schreibt, hat geschrieben|to write: to put words on paper or a screen|Ich schreibe meinen Namen.|I am writing my name.
kommen|verb; kommt, ist gekommen|to come: to move towards a person or place|Komm bitte zur Tür.|Please come to the door.
fragen|verb; fragt, hat gefragt|to ask: to say something because you want an answer|Ich frage die Lehrerin.|I am asking the teacher.
spielen|verb; spielt, hat gespielt|to play: to take part in a game or enjoyable activity|Die Kinder spielen im Garten.|The children are playing in the garden.
kochen|verb; kocht, hat gekocht|to cook: to prepare food using heat|Heute kochen wir eine Suppe.|Today we are cooking a soup.
klein|adjective; kleiner, am kleinsten|small: having little size|Das Haus ist klein.|The house is small.
kalt|adjective; kälter, am kältesten|cold: having a low temperature|Das Wasser ist kalt.|The water is cold.
müde|adjective; müder, am müdesten|tired: needing sleep or rest|Nach der Reise bin ich müde.|After the journey I am tired.
neu|adjective; neuer, am neuesten|new: recently made, bought or first used|Mein Fahrrad ist neu.|My bicycle is new.
teuer|adjective; teurer, am teuersten|expensive: costing a lot of money|Das Hotel ist teuer.|The hotel is expensive.`,
A2:`der Termin|noun; die Termine|an appointment: an agreed time to meet or do something|Ich habe morgen einen Termin beim Arzt.|I have a doctor's appointment tomorrow.
die Rechnung|noun; die Rechnungen|a bill: a statement of money that must be paid|Können wir bitte die Rechnung bekommen?|Could we have the bill, please?
die Nachbarin|noun; die Nachbarinnen|a female neighbour: a woman who lives nearby|Unsere Nachbarin hilft uns oft.|Our neighbour often helps us.
das Geschenk|noun; die Geschenke|a gift: something given to another person|Das Geschenk ist für meinen Bruder.|The gift is for my brother.
die Haltestelle|noun; die Haltestellen|a stop: a place where a bus or tram picks up passengers|Wir warten an der Haltestelle.|We are waiting at the bus stop.
der Urlaub|noun; die Urlaube|a holiday: time away from your usual work or studies|Im Urlaub fahren wir ans Meer.|On holiday we are going to the sea.
die Kleidung|noun; no plural in this sense|clothing: things people wear on their bodies|Für die Reise brauche ich warme Kleidung.|I need warm clothing for the trip.
der Eingang|noun; die Eingänge|an entrance: a place where you go into a building|Der Eingang ist auf der linken Seite.|The entrance is on the left.
die Erfahrung|noun; die Erfahrungen|an experience: something you have done or lived through|Die Reise war eine schöne Erfahrung.|The trip was a lovely experience.
die Gesundheit|noun; no plural|health: the condition of your body and mind|Bewegung ist gut für die Gesundheit.|Exercise is good for your health.
das Werkzeug|noun; die Werkzeuge|a tool: an object used to make or repair something|Für diese Reparatur brauche ich ein Werkzeug.|I need a tool for this repair.
die Nachricht|noun; die Nachrichten|a message: information sent to someone|Ich schicke dir eine Nachricht.|I will send you a message.
der Umzug|noun; die Umzüge|a move: the process of going to live in a different home|Unser Umzug findet am Samstag statt.|We are moving house on Saturday.
die Umgebung|noun; die Umgebungen|the surroundings: the area around a place|Wir erkunden die Umgebung des Hotels.|We are exploring the area around the hotel.
die Einladung|noun; die Einladungen|an invitation: a request to come to an event or place|Danke für die Einladung zum Essen.|Thank you for the invitation to dinner.
abholen|verb; separable; holt ab, hat abgeholt|to collect: to go somewhere to pick up a person or thing|Ich hole dich am Bahnhof ab.|I will pick you up at the station.
vereinbaren|verb; vereinbart, hat vereinbart|to arrange: to agree on a plan or appointment|Wir vereinbaren einen neuen Termin.|We are arranging a new appointment.
erklären|verb; erklärt, hat erklärt|to explain: to make something clear or understandable|Sie erklärt mir den Weg.|She explains the route to me.
vergessen|verb; vergisst, hat vergessen|to forget: to fail to remember something|Ich habe meinen Regenschirm vergessen.|I have forgotten my umbrella.
umziehen|verb; separable; zieht um, ist umgezogen|to move house: to begin living in a different home|Nächsten Monat ziehen wir um.|We are moving house next month.
reparieren|verb; repariert, hat repariert|to repair: to make something work again|Er repariert das kaputte Fahrrad.|He is repairing the broken bicycle.
vergleichen|verb; vergleicht, hat verglichen|to compare: to examine how things are similar or different|Wir vergleichen die Preise.|We are comparing the prices.
sich erinnern|verb; erinnert sich, hat sich erinnert|to remember: to bring something back into your mind|Ich erinnere mich an unseren Ausflug.|I remember our outing.
bestellen|verb; bestellt, hat bestellt|to order: to ask for goods or food to be supplied|Wir bestellen zwei Suppen.|We are ordering two soups.
vorbereiten|verb; separable; bereitet vor, hat vorbereitet|to prepare: to get something ready beforehand|Ich bereite das Abendessen vor.|I am preparing dinner.
pünktlich|adjective; pünktlicher, am pünktlichsten|punctual: arriving or happening at the agreed time|Der Bus ist heute pünktlich.|The bus is on time today.
bequem|adjective; bequemer, am bequemsten|comfortable: pleasant to sit in, wear or use|Dieser Sessel ist sehr bequem.|This armchair is very comfortable.
geduldig|adjective; geduldiger, am geduldigsten|patient: able to wait calmly|Die Verkäuferin ist sehr geduldig.|The sales assistant is very patient.
gefährlich|adjective; gefährlicher, am gefährlichsten|dangerous: likely to cause harm|Schwimmen ist hier gefährlich.|Swimming is dangerous here.
zufrieden|adjective; zufriedener, am zufriedensten|satisfied: pleased because something meets your needs|Ich bin mit dem Ergebnis zufrieden.|I am satisfied with the result.`,
B1:`die Entscheidung|noun; die Entscheidungen|a decision: a choice made after considering possibilities|Wir treffen morgen eine Entscheidung.|We will make a decision tomorrow.
die Voraussetzung|noun; die Voraussetzungen|a prerequisite: something needed before another thing is possible|Erfahrung ist eine Voraussetzung für diese Stelle.|Experience is a prerequisite for this job.
die Verantwortung|noun; die Verantwortungen|responsibility: a duty to take care of something or answer for it|Sie übernimmt die Verantwortung für das Projekt.|She takes responsibility for the project.
der Vorschlag|noun; die Vorschläge|a suggestion: an idea offered for others to consider|Dein Vorschlag spart viel Zeit.|Your suggestion saves a lot of time.
die Bewerbung|noun; die Bewerbungen|an application: a formal request for a job or place|Ich schicke heute meine Bewerbung ab.|I am sending my application today.
die Ausbildung|noun; die Ausbildungen|vocational training: organised learning for a particular occupation|Er macht eine Ausbildung zum Koch.|He is training to be a cook.
der Vorteil|noun; die Vorteile|an advantage: something that makes a situation better or easier|Kurze Wege sind ein Vorteil dieser Wohnung.|Short distances are an advantage of this flat.
der Nachteil|noun; die Nachteile|a disadvantage: something that makes a situation less favourable|Der Lärm ist ein Nachteil dieser Lage.|The noise is a disadvantage of this location.
die Gewohnheit|noun; die Gewohnheiten|a habit: something you do regularly, often without thinking|Lesen vor dem Schlafen ist meine Gewohnheit.|Reading before sleep is my habit.
der Zusammenhang|noun; die Zusammenhänge|a connection: a relationship linking facts or events|Ich sehe einen Zusammenhang zwischen Schlaf und Konzentration.|I see a connection between sleep and concentration.
die Unterstützung|noun; die Unterstützungen|support: help given to someone who needs it|Vielen Dank für deine Unterstützung beim Lernen.|Thank you for your support with studying.
die Gelegenheit|noun; die Gelegenheiten|an opportunity: a suitable chance to do something|Die Reise bietet eine Gelegenheit, Deutsch zu sprechen.|The trip offers an opportunity to speak German.
der Eindruck|noun; die Eindrücke|an impression: an idea or feeling formed about someone or something|Das Gespräch hat einen guten Eindruck hinterlassen.|The conversation left a good impression.
die Lösung|noun; die Lösungen|a solution: a way to solve a problem|Gemeinsam finden wir eine Lösung.|Together we will find a solution.
die Umwelt|noun; no plural in this sense|the environment: the natural world around us|Wir wollen die Umwelt besser schützen.|We want to protect the environment better.
begründen|verb; begründet, hat begründet|to justify: to give reasons supporting a view or decision|Bitte begründe deine Meinung.|Please give reasons for your opinion.
vermeiden|verb; vermeidet, hat vermieden|to avoid: to prevent something or keep away from it|Wir vermeiden unnötigen Müll.|We avoid unnecessary rubbish.
beantragen|verb; beantragt, hat beantragt|to apply for: to formally request permission, money or a document|Sie beantragt einen neuen Pass.|She is applying for a new passport.
teilnehmen|verb; separable; nimmt teil, hat teilgenommen|to participate: to take part in an activity or event|Ich nehme am Sprachkurs teil.|I am taking part in the language course.
verschieben|verb; verschiebt, hat verschoben|to postpone: to move an event to a later time|Wir verschieben das Treffen auf Freitag.|We are postponing the meeting until Friday.
sich bewerben|verb; bewirbt sich, hat sich beworben|to apply for a position: to put yourself forward for a job or place|Er bewirbt sich um eine Stelle im Museum.|He is applying for a job at the museum.
überzeugen|verb; überzeugt, hat überzeugt|to convince: to make someone accept an idea|Ihre Argumente überzeugen mich.|Her arguments convince me.
entwickeln|verb; entwickelt, hat entwickelt|to develop: to create or improve something over time|Wir entwickeln eine neue Lernmethode.|We are developing a new learning method.
sich beschweren|verb; beschwert sich, hat sich beschwert|to complain: to express that something is wrong or unsatisfactory|Sie beschwert sich über den Lärm.|She is complaining about the noise.
sich entscheiden|verb; entscheidet sich, hat sich entschieden|to make up your mind: to choose between possibilities|Ich entscheide mich für den Abendkurs.|I choose the evening course.
zuverlässig|adjective; zuverlässiger, am zuverlässigsten|reliable: able to be trusted to do what is expected|Unser Team arbeitet sehr zuverlässig.|Our team works very reliably.
notwendig|adjective; notwendiger, am notwendigsten|necessary: needed for a purpose|Für die Fahrt ist eine Reservierung notwendig.|A reservation is necessary for the journey.
selbstständig|adjective; selbstständiger, am selbstständigsten|independent: able to act without help or supervision|Sie erledigt die Aufgabe selbstständig.|She completes the task independently.
freiwillig|adjective; freiwilliger, am freiwilligsten|voluntary: done by choice rather than because it is required|Die Teilnahme ist freiwillig.|Participation is voluntary.
wahrscheinlich|adjective/adverb; wahrscheinlicher, am wahrscheinlichsten|probable: likely to happen or be true|Eine Verspätung ist bei diesem Wetter wahrscheinlich.|A delay is likely in this weather.`,
B2:`die Nachhaltigkeit|noun; no plural|sustainability: using resources in ways that can continue long term|Bei der Planung achten wir auf Nachhaltigkeit.|We pay attention to sustainability when planning.
der Widerspruch|noun; die Widersprüche|a contradiction: a conflict between statements or ideas|Zwischen den beiden Aussagen besteht ein Widerspruch.|There is a contradiction between the two statements.
die Auswirkung|noun; die Auswirkungen|an effect: a consequence that something has on another thing|Die Studie untersucht die Auswirkungen von Stress.|The study examines the effects of stress.
die Maßnahme|noun; die Maßnahmen|a measure: an action taken to achieve a particular purpose|Diese Maßnahme soll Energie sparen.|This measure is intended to save energy.
die Erkenntnis|noun; die Erkenntnisse|an insight: understanding gained by thinking or investigating|Die Untersuchung liefert eine wichtige Erkenntnis.|The investigation provides an important insight.
der Anspruch|noun; die Ansprüche|an entitlement: a right to receive or demand something|Beschäftigte haben einen Anspruch auf Urlaub.|Employees are entitled to holiday leave.
die Auseinandersetzung|noun; die Auseinandersetzungen|an engagement with a topic: serious examination and discussion of it|Die Auseinandersetzung mit dem Thema braucht Zeit.|Examining and discussing the topic takes time.
die Einschätzung|noun; die Einschätzungen|an assessment: a judgement about the nature or value of something|Nach meiner Einschätzung ist der Plan realistisch.|In my assessment, the plan is realistic.
der Aufwand|noun; die Aufwände|effort or expenditure: the work, time or resources needed|Der technische Aufwand bleibt gering.|The technical effort remains small.
der Schwerpunkt|noun; die Schwerpunkte|a main focus: the area given the greatest attention|Der Schwerpunkt des Kurses liegt auf Gesprächen.|The course's main focus is conversation.
die Einschränkung|noun; die Einschränkungen|a restriction: a limit on what is possible or permitted|Die Baustelle führt zu Einschränkungen im Verkehr.|The construction site causes traffic restrictions.
die Herausforderung|noun; die Herausforderungen|a challenge: a difficult task requiring effort and ability|Die Umstellung ist eine große Herausforderung.|The changeover is a major challenge.
die Förderung|noun; die Förderungen|promotion or support: help that enables development|Die Förderung junger Forschender ist wichtig.|Supporting young researchers is important.
die Vereinbarung|noun; die Vereinbarungen|an agreement: an arrangement accepted by the parties involved|Beide Seiten halten sich an die Vereinbarung.|Both sides keep to the agreement.
die Vielfalt|noun; no plural|diversity: the presence of many different kinds or forms|Der Garten zeigt die Vielfalt heimischer Pflanzen.|The garden displays the diversity of native plants.
berücksichtigen|verb; berücksichtigt, hat berücksichtigt|to take into account: to consider something when making a decision|Wir berücksichtigen unterschiedliche Bedürfnisse.|We take different needs into account.
gewährleisten|verb; gewährleistet, hat gewährleistet|to ensure: to make certain that something is provided or happens|Die Regeln gewährleisten einen sicheren Ablauf.|The rules ensure a safe procedure.
beeinträchtigen|verb; beeinträchtigt, hat beeinträchtigt|to impair: to negatively affect how well something works|Lärm beeinträchtigt meine Konzentration.|Noise impairs my concentration.
sich auseinandersetzen|verb; separable; setzt sich auseinander, hat sich auseinandergesetzt|to engage critically: to examine a topic seriously and in detail|Wir setzen uns mit verschiedenen Positionen auseinander.|We examine different positions in depth.
nachweisen|verb; separable; weist nach, hat nachgewiesen|to demonstrate with evidence: to show that something is true|Das Experiment weist den Effekt nach.|The experiment demonstrates the effect.
bewältigen|verb; bewältigt, hat bewältigt|to cope with: to successfully manage a difficult task or situation|Gemeinsam bewältigen wir die Schwierigkeiten.|Together we overcome the difficulties.
hinterfragen|verb; hinterfragt, hat hinterfragt|to question critically: to examine whether an assumption is justified|Wir hinterfragen die bisherigen Annahmen.|We critically question the previous assumptions.
veranschaulichen|verb; veranschaulicht, hat veranschaulicht|to illustrate: to make an idea easier to understand through an example|Das Modell veranschaulicht den Aufbau der Zelle.|The model illustrates the structure of the cell.
ermöglichen|verb; ermöglicht, hat ermöglicht|to enable: to make something possible|Das Stipendium ermöglicht ihr das Studium.|The scholarship enables her to study.
überprüfen|verb; überprüft, hat überprüft|to check: to examine whether something is correct or works|Wir überprüfen alle Angaben sorgfältig.|We check all the information carefully.
wesentlich|adjective; wesentlicher, am wesentlichsten|essential: of central importance to a matter|Das ist ein wesentlicher Unterschied.|That is an essential difference.
umstritten|adjective; umstrittener, am umstrittensten|controversial: the subject of strong disagreement|Der Vorschlag bleibt umstritten.|The proposal remains controversial.
nachvollziehbar|adjective; nachvollziehbarer, am nachvollziehbarsten|understandable: possible to follow through its reasoning|Ihre Erklärung ist nachvollziehbar.|Her explanation is understandable.
vorläufig|adjective; usually not compared|provisional: valid for now but possibly subject to change|Wir veröffentlichen ein vorläufiges Ergebnis.|We are publishing a provisional result.
ausschlaggebend|adjective; usually not compared|decisive: having the main influence on an outcome|Die Erfahrung war für die Auswahl ausschlaggebend.|Experience was decisive in the selection.`,
C1:`die Tragweite|noun; no plural in this sense|far-reaching significance: the full extent of an action's consequences|Die Tragweite dieser Entscheidung wurde erst später deutlich.|The full implications of this decision became clear only later.
die Wechselwirkung|noun; die Wechselwirkungen|an interaction: a process in which factors influence each other|Wir untersuchen die Wechselwirkung zwischen Licht und Materie.|We investigate the interaction between light and matter.
der Ermessensspielraum|noun; die Ermessensspielräume|discretion: the room available for making a judgement or choice|Bei der Bewertung besteht ein gewisser Ermessensspielraum.|There is some discretion in the assessment.
die Verhältnismäßigkeit|noun; no plural|proportionality: a reasonable balance between an action and its purpose|Das Gremium prüft die Verhältnismäßigkeit der Maßnahme.|The panel examines whether the measure is proportionate.
die Schlussfolgerung|noun; die Schlussfolgerungen|an inference or conclusion: a judgement drawn from evidence or reasoning|Diese Schlussfolgerung wird durch die Daten gestützt.|This conclusion is supported by the data.
die Diskrepanz|noun; die Diskrepanzen|a discrepancy: a noticeable difference between things expected to agree|Zwischen Anspruch und Wirklichkeit besteht eine Diskrepanz.|There is a discrepancy between the ambition and reality.
die Ausgestaltung|noun; die Ausgestaltungen|the detailed design: the concrete form given to a general idea|Die genaue Ausgestaltung des Programms ist noch offen.|The programme's detailed design is still undecided.
die Belastbarkeit|noun; no plural|robustness: the ability to withstand strain or scrutiny|Weitere Versuche prüfen die Belastbarkeit des Materials.|Further trials test the material's robustness.
die Handlungsfähigkeit|noun; no plural|capacity to act: the ability to make decisions and carry them out|Die Einigung stellt die Handlungsfähigkeit des Teams wieder her.|The agreement restores the team's ability to act.
die Befangenheit|noun; no plural|bias or partiality: a lack of impartiality due to personal involvement|Ein Mitglied zieht sich wegen Befangenheit zurück.|A member withdraws because of a conflict affecting impartiality.
der Erkenntnisgewinn|noun; die Erkenntnisgewinne|a gain in understanding: new knowledge obtained through inquiry|Der Versuch bringt trotz des Fehlers einen Erkenntnisgewinn.|Despite the error, the experiment produces new understanding.
die Ambivalenz|noun; die Ambivalenzen|ambivalence: the coexistence of opposing feelings or evaluations|Ihre Antwort zeigt eine deutliche Ambivalenz.|Her answer shows clear ambivalence.
die Eigenverantwortung|noun; no plural|personal responsibility: taking responsibility for your own decisions|Das Projekt stärkt die Eigenverantwortung der Beteiligten.|The project strengthens participants' personal responsibility.
die Zielsetzung|noun; die Zielsetzungen|an objective: a purpose deliberately set for an activity|Die Zielsetzung der Untersuchung wird präzise formuliert.|The investigation's objective is precisely formulated.
die Abwägung|noun; die Abwägungen|a weighing-up: careful comparison of competing considerations|Die Entscheidung erfordert eine sorgfältige Abwägung.|The decision requires careful weighing of the considerations.
erörtern|verb; erörtert, hat erörtert|to discuss analytically: to examine a topic from different perspectives|Der Bericht erörtert mehrere Lösungsansätze.|The report discusses several approaches to a solution.
relativieren|verb; relativiert, hat relativiert|to put into perspective: to qualify an apparently absolute judgement|Die neuen Zahlen relativieren den ersten Eindruck.|The new figures put the first impression into perspective.
implizieren|verb; impliziert, hat impliziert|to imply: to involve or suggest something without stating it directly|Diese Annahme impliziert eine weitere Bedingung.|This assumption implies a further condition.
antizipieren|verb; antizipiert, hat antizipiert|to anticipate: to consider or prepare for something before it happens|Das Team antizipiert mögliche Schwierigkeiten.|The team anticipates possible difficulties.
präzisieren|verb; präzisiert, hat präzisiert|to specify more precisely: to make a statement more exact|Könnten Sie den letzten Punkt präzisieren?|Could you make the last point more precise?
verwerfen|verb; verwirft, hat verworfen|to reject after consideration: to decide not to pursue an idea|Wir verwerfen den Ansatz nach mehreren Tests.|We reject the approach after several tests.
untermauern|verb; untermauert, hat untermauert|to substantiate: to strengthen a claim with supporting evidence|Die Messungen untermauern ihre These.|The measurements substantiate her thesis.
sich abzeichnen|verb; separable; zeichnet sich ab, hat sich abgezeichnet|to emerge as a tendency: to become gradually apparent|Eine langfristige Veränderung zeichnet sich ab.|A long-term change is becoming apparent.
vermitteln|verb; vermittelt, hat vermittelt|to mediate: to help opposing parties reach an understanding|Eine unabhängige Person vermittelt zwischen den Gruppen.|An independent person mediates between the groups.
herleiten|verb; separable; leitet her, hat hergeleitet|to derive: to establish a result from existing principles|Wir leiten die Formel aus zwei Grundannahmen her.|We derive the formula from two basic assumptions.
schlüssig|adjective; schlüssiger, am schlüssigsten|cogent: logically consistent and convincing|Die Argumentation ist schlüssig aufgebaut.|The argument is constructed coherently.
differenziert|adjective; differenzierter, am differenziertesten|nuanced: making careful distinctions rather than oversimplifying|Sie entwickelt eine differenzierte Betrachtung des Problems.|She develops a nuanced view of the problem.
plausibel|adjective; plausibler, am plausibelsten|plausible: appearing reasonable or believable|Diese Erklärung klingt zunächst plausibel.|This explanation initially sounds plausible.
inhärent|adjective; usually not compared|inherent: belonging to something as an essential characteristic|Das Verfahren enthält ein inhärentes Risiko.|The procedure contains an inherent risk.
maßgeblich|adjective; maßgeblicher, am maßgeblichsten|instrumental: having a significant determining influence|Ihre Forschung war für den Fortschritt maßgeblich.|Her research was instrumental in the progress.`,
C2:`das Understatement|noun; die Understatements|understatement: deliberately presenting something as less impressive or serious than it is|Sein trockener Kommentar war ein typisches Understatement.|His dry remark was a typical understatement.
die Spitzfindigkeit|noun; die Spitzfindigkeiten|a quibble: an excessively subtle distinction used in an argument|Mit solchen Spitzfindigkeiten kommen wir der Lösung nicht näher.|Such quibbles do not bring us closer to a solution.
die Unwägbarkeit|noun; die Unwägbarkeiten|an imponderable: a factor whose effects are difficult to predict|Die Planung muss zahlreiche Unwägbarkeiten berücksichtigen.|The planning must account for many unpredictable factors.
der Anachronismus|noun; die Anachronismen|an anachronism: something belonging to a different historical period from its setting|Das Telefon im mittelalterlichen Film ist ein Anachronismus.|The telephone in the medieval film is an anachronism.
die Gratwanderung|noun; die Gratwanderungen|a balancing act: navigating carefully between competing risks or demands|Zwischen Offenheit und Diskretion bleibt es eine Gratwanderung.|Balancing openness and discretion remains a delicate act.
die Deutungshoheit|noun; no plural|interpretive authority: the power to determine the dominant interpretation|Mehrere Gruppen beanspruchen die Deutungshoheit über das Ereignis.|Several groups claim authority over how the event is interpreted.
die Befindlichkeit|noun; die Befindlichkeiten|a subjective state: a person's current emotional or physical condition|Der Text erkundet die Befindlichkeit seiner Figuren.|The text explores the characters' subjective states.
der Zirkelschluss|noun; die Zirkelschlüsse|circular reasoning: an argument that assumes the very conclusion it seeks to prove|Die Begründung beruht auf einem Zirkelschluss.|The justification relies on circular reasoning.
das Lippenbekenntnis|noun; die Lippenbekenntnisse|lip service: verbal support without corresponding action|Ohne konkrete Schritte bleibt das Versprechen ein Lippenbekenntnis.|Without concrete steps, the promise remains mere lip service.
die Selbstgefälligkeit|noun; no plural|complacency: excessive satisfaction with oneself that discourages critical reflection|Sein Erfolg verleitet ihn zur Selbstgefälligkeit.|His success tempts him into complacency.
die Doppelbödigkeit|noun; no plural|double-layered meaning: the presence of a second, often hidden level of significance|Die Doppelbödigkeit des Dialogs erschließt sich erst beim zweiten Lesen.|The dialogue's hidden second layer becomes clear only on a second reading.
die Verklärung|noun; die Verklärungen|idealisation: portraying something as better or purer than it really was|Der Roman vermeidet eine Verklärung der Vergangenheit.|The novel avoids idealising the past.
die Verflechtung|noun; die Verflechtungen|interdependence: a complex intertwining of relationships or processes|Die Studie beschreibt die Verflechtung von Politik und Wirtschaft.|The study describes the interweaving of politics and business.
der Fehlschluss|noun; die Fehlschlüsse|a fallacy: a conclusion based on faulty reasoning|Aus diesen Zahlen folgt dieser Fehlschluss keineswegs zwingend.|These figures by no means make that faulty conclusion inevitable.
die Unverblümtheit|noun; no plural|bluntness: direct expression without softening or concealment|Ihre Unverblümtheit überraschte die versammelte Runde.|Her bluntness surprised the assembled group.
unterminieren|verb; unterminiert, hat unterminiert|to undermine: to gradually weaken a foundation, authority or confidence|Ständige Ausnahmen unterminieren die Glaubwürdigkeit der Regel.|Constant exceptions undermine the rule's credibility.
konterkarieren|verb; konterkariert, hat konterkariert|to counteract: to work against and frustrate an intended effect|Die widersprüchlichen Vorgaben konterkarieren das gemeinsame Ziel.|The conflicting requirements frustrate the shared objective.
verabsolutieren|verb; verabsolutiert, hat verabsolutiert|to treat as absolute: to give an idea unconditional validity beyond its proper limits|Man sollte persönliche Erfahrungen nicht verabsolutieren.|One should not treat personal experiences as universally valid.
sich vergegenwärtigen|verb; vergegenwärtigt sich, hat sich vergegenwärtigt|to bring vividly to mind: to make oneself fully aware of something|Wir müssen uns die historischen Bedingungen vergegenwärtigen.|We must bring the historical conditions clearly to mind.
vorwegnehmen|verb; separable; nimmt vorweg, hat vorweggenommen|to pre-empt: to state or deal with something before its expected point|Ich möchte das Ergebnis der Diskussion nicht vorwegnehmen.|I do not wish to pre-empt the discussion's outcome.
in Abrede stellen|expression; stellt in Abrede, hat in Abrede gestellt|to deny: to dispute that a fact or claim is true|Niemand stellt die Bedeutung der Forschung in Abrede.|Nobody denies the importance of research.
auf der Hand liegen|expression; liegt auf der Hand, hat auf der Hand gelegen|to be obvious: to be readily apparent without further proof|Die Vorteile dieser Lösung liegen auf der Hand.|The advantages of this solution are obvious.
ins Leere laufen|expression; läuft ins Leere, ist ins Leere gelaufen|to come to nothing: to fail to produce the intended response or result|Sein Vermittlungsversuch läuft ins Leere.|His attempt at mediation comes to nothing.
den Nagel auf den Kopf treffen|expression; trifft, hat getroffen|to hit the nail on the head: to identify the central issue exactly|Mit dieser Beobachtung triffst du den Nagel auf den Kopf.|With that observation you hit the nail on the head.
zwischen den Zeilen lesen|expression; liest, hat gelesen|to read between the lines: to understand what is implied rather than stated|Bei diesem Brief muss man zwischen den Zeilen lesen.|With this letter one must read between the lines.
hintersinnig|adjective; hintersinniger, am hintersinnigsten|subtly witty: containing a clever, indirect meaning beneath the surface|Ihr hintersinniger Humor prägt den ganzen Roman.|Her subtly witty humour shapes the whole novel.
lapidar|adjective; lapidarer, am lapidarsten|terse: expressed in a strikingly brief and matter-of-fact way|Seine lapidare Antwort lässt viele Fragen offen.|His terse answer leaves many questions unanswered.
vertrackt|adjective; vertrackter, am vertracktesten|tricky or intricate: difficult because of complicated, entangled details|Das Problem erweist sich als vertrackter als erwartet.|The problem proves trickier than expected.
aberwitzig|adjective; aberwitziger, am aberwitzigsten|absurdly extreme: so unreasonable or excessive as to seem ridiculous|Der Plan verlangt einen aberwitzigen Aufwand.|The plan requires an absurd amount of effort.
unverhohlen|adjective; usually not compared|undisguised: openly expressed without an attempt at concealment|Er zeigt unverhohlene Begeisterung für die Idee.|He shows undisguised enthusiasm for the idea.`
};
export const VOCABULARY:VocabularyCard[]=GERMAN_LEVELS.flatMap(level=>{
 const rows=source[level].split('\n').map((line,i)=>{
  const [term,forms,explanation,example,translation]=line.split('|');
  return {id:`de-${level.toLowerCase()}-${String(i+1).padStart(2,'0')}`,level,term,forms,part:forms.split(';')[0].split('/')[0],explanation,example,translation};
 });
 return rows.map((card,i)=>({...card,distractors:[...rows.slice(i+1),...rows.slice(0,i)].filter(other=>other.part===card.part).slice(0,3).map(other=>other.explanation)}));
});
export type QuizQuestion={id:string;term:string;forms:string;example:string;translation:string;options:string[];correct:number};
export function shuffled<T>(values:readonly T[],random:()=>number=Math.random):T[]{
 const a=[...values];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;
}
export function vocabularyQuiz(level:GermanLevel,random:()=>number=Math.random):QuizQuestion[]{
 if(!GERMAN_LEVELS.includes(level))throw new Error('Choose a practice level.');
 return shuffled(VOCABULARY.filter(c=>c.level===level),random).slice(0,10).map(card=>{
  const options=shuffled([card.explanation,...card.distractors],random);
  return {id:card.id,term:card.term,forms:card.forms,example:card.example,translation:card.translation,options,correct:options.indexOf(card.explanation)};
 });
}
export type VocabularyView={level:GermanLevel;phase:'playing'|'finished'|'abandoned';stage:'answering'|'reveal';index:number;total:number;question:Omit<QuizQuestion,'correct'|'translation'>;answered:boolean;submitted:number;continued:boolean;scores:number[];winners:number[];solution?:{correct:number;translation:string};review:{term:string;example:string;translation:string;explanation:string;chosen:string|null;correct:boolean}[]};

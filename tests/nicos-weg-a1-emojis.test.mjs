import assert from 'node:assert/strict';
import {test} from 'node:test';
import {nicosWegA1Course as course} from '../lib/nicos-weg-a1-course.ts';
import {addNicosLearningEmojis,nicosVocabularyEmoji} from '../lib/nicos-weg-a1-emojis.ts';
import {validateAcademyCourse} from '../lib/academy-course-validation.ts';
const cards=c=>c.lessons.flatMap(l=>l.blocks.filter(b=>b.type==='flashcards').flatMap(b=>b.items));
test('visual cues cover the full course and keep valid, stable, immutable content',()=>{
 const before=structuredClone(course);
 const result=addNicosLearningEmojis(course);
 assert.deepEqual(result,course);
 assert.deepEqual(course,before);
 assert.equal(result.lessons.length,108);
 assert.equal(cards(result).length,680);
 assert.ok(cards(result).filter(c=>c.emoji).length>300);
 assert.ok(validateAcademyCourse(result).valid);
 const other={...course,key:'other'};
 assert.deepEqual(addNicosLearningEmojis(other),other);
});
test('meaning-aware vocabulary cues handle articles, plurals and ambiguous nouns',()=>{
 for(const [title,emoji] of [['Guten Morgen','🌅'],['Guten Tag','☀️'],['Guten Abend','🌆'],['Gute Nacht','🌙'],['die Tasche, -n','🧳'],['der Bahnhof, Bahnhöfe','🚆'],['jemanden anrufen','📞']])assert.equal(nicosVocabularyEmoji(title),emoji);
 assert.equal(nicosVocabularyEmoji('die Bank, -en','bank'),'🏦');
 assert.equal(nicosVocabularyEmoji('die Bank, Bänke','bench'),'🪑');
 assert.equal(nicosVocabularyEmoji('das Eis','ice cream'),'🍦');
 assert.equal(nicosVocabularyEmoji('das Eis','ice cube'),'🧊');
 assert.equal(nicosVocabularyEmoji('ich'),undefined);
 assert.equal(nicosVocabularyEmoji('die Fliege','fly (insect)'),undefined);
});
test('adding cues preserves assessment data, translations and German formatting',()=>{
 const undecorated=structuredClone(course);
 for(const c of cards(undecorated))delete c.emoji;
 const result=addNicosLearningEmojis(undecorated);
 assert.deepEqual(result.quiz,undecorated.quiz);
 assert.deepEqual(result.rules,undecorated.rules);
 for(let i=0;i<course.lessons.length;i++)for(let j=0;j<course.lessons[i].blocks.length;j++){
  const a=undecorated.lessons[i].blocks[j], b=result.lessons[i].blocks[j];
  for(const key of ['prompt','modelAnswer','questions','options','correctAnswer','rows','paragraphs'])assert.deepEqual(b[key],a[key]);
 }
 assert.deepEqual(cards(result).map(c=>{const copy={...c};delete copy.emoji;return copy;}),cards(undecorated));
 const nodes=course.lessons.flatMap(l=>l.blocks.filter(b=>b.type==='text'&&b.content).flatMap(b=>b.content.content.filter(n=>n.type==='paragraph').flatMap(n=>n.content||[])));
 assert.ok(nodes.some(n=>n.text==='🌅 '&&!n.marks));
 assert.ok(nodes.some(n=>n.text?.includes('Guten Morgen')&&n.marks?.some(m=>m.type==='bold')));
 assert.deepEqual(addNicosLearningEmojis(result),result);
});

import assert from 'node:assert/strict';
import {test} from 'node:test';
import {nicosGenderCues,withNicosGenderCues,caseHighlights} from '../lib/nicos-gender-cues.ts';
import {nicosWegA1Course} from '../lib/nicos-weg-a1-course.ts';
const text=n=>n.text||(n.content||[]).map(text).join('');
test('original genders survive changed articles and all six requested case highlights',()=>{
 for(const [value,gender,grammaticalCase] of [['für die Schweiz','die','Akkusativ'],['aus der Schweiz','die','Dativ'],['den Tisch','der','Akkusativ'],['mit dem Tisch','der','Dativ'],['für das Buch','das','Akkusativ'],['mit dem Buch','das','Dativ']]){
  const cues=nicosGenderCues(value);assert.equal(cues.length,2,value);assert.equal(cues[0].gender,gender,value);assert.equal(cues[1].gender,gender,value);assert.equal(cues[0].grammaticalCase,grammaticalCase,value);
 }
 assert.equal(new Set(Object.values(caseHighlights).flatMap(Object.values)).size,6);
});
test('ambiguous cases, unknown nouns and non-noun articles are not guessed',()=>{
 assert.equal(nicosGenderCues('Die Schweiz ist schön.')[0].grammaticalCase,undefined);
 assert.equal(nicosGenderCues('das Buch')[0].grammaticalCase,undefined);
 assert.equal(nicosGenderCues('wegen der Schweiz')[0].grammaticalCase,undefined);
 assert.equal(nicosGenderCues('der Frau')[0].grammaticalCase,undefined);
 assert.deepEqual(nicosGenderCues('die unknownword'),[]);
 assert.deepEqual(nicosGenderCues('die Eltern und die Ferien'),[]);
 assert.deepEqual(nicosGenderCues('They die young. Der is an article.'),[]);
 assert.equal(nicosGenderCues('in die Schweiz')[0].grammaticalCase,'Akkusativ');
 assert.equal(nicosGenderCues('in der Schweiz')[0].grammaticalCase,'Dativ');
 assert.equal(nicosGenderCues('das Buch','Akkusativ')[0].grammaticalCase,'Akkusativ');
});
test('display decoration spans existing language marks without changing stored words or assessment',()=>{
 const input={type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'aus ',marks:[{type:'bold'}]},{type:'text',text:'der Schweiz',marks:[{type:'bold'},{type:'textStyle',attrs:{color:'#1D4ED8'}}]}]}]};
 const before=structuredClone(input),result=withNicosGenderCues(input);
 assert.deepEqual(input,before);assert.equal(text(result),text(input));
 const noun=result.content[0].content.find(n=>n.text==='Schweiz');assert.equal(noun.marks.find(m=>m.type==='nicosGender').attrs.gender,'die');assert.ok(!noun.marks.some(m=>m.type==='textStyle'));assert.ok(noun.marks.some(m=>m.type==='bold'));
 assert.deepEqual(withNicosGenderCues(result),result);
 for(const lesson of nicosWegA1Course.lessons)for(const block of lesson.blocks)if(block.content)assert.equal(text(withNicosGenderCues(block.content)),text(block.content));
});

test('all singular noun entries across 680 course flashcards have gender cues, including both profession forms',()=>{
 let cards=0;
 const pluralOnly=new Set(['Eltern','Ferien','Schmerzen']);
 for(const lesson of nicosWegA1Course.lessons)for(const block of lesson.blocks)if(block.type==='flashcards')for(const item of block.items){
  cards++;
  for(const match of item.title.matchAll(/\b(der|die|das) ([\p{Lu}][\p{L}-]+)/gu)){
   if(pluralOnly.has(match[2]))continue;
   const nounStart=match.index+match[1].length+1;
   const cue=nicosGenderCues(item.title).find(c=>c.kind==='noun'&&c.start===nounStart);
   assert.ok(cue,`${lesson.slug}: ${item.title}`);
  }
 }
 assert.equal(cards,680);
 assert.deepEqual(nicosGenderCues('der Elektriker / die Elektrikerin').filter(c=>c.kind==='noun').map(c=>c.gender),['der','die']);
 assert.equal(nicosGenderCues('in der Nähe')[0].gender,'die');
 assert.equal(nicosGenderCues('in der Nähe')[0].grammaticalCase,'Dativ');
});

test('bare declined table articles follow explicit gender and case, not their surface spelling',()=>{
 for(const [value,gender,grammaticalCase] of [['der / ein','der',undefined],['die / eine','die',undefined],['das / ein','das',undefined],['der / einer','die','Dativ'],['dem / einem','das','Dativ'],['den / einen','der','Akkusativ']]){
  const cues=nicosGenderCues(value,grammaticalCase,gender);
  assert.equal(cues.length,2);
  assert.ok(cues.every(c=>c.gender===gender&&c.grammaticalCase===grammaticalCase));
 }
 assert.deepEqual(nicosGenderCues('die'),[],'isolated words need explicit context');
});

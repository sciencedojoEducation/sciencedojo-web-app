import assert from 'node:assert/strict';
import {test} from 'node:test';
import {nicosWegA1Course} from '../lib/nicos-weg-a1-course.ts';
import {nicosGrammarLanguageParagraph,formatNicosGrammarLibrary} from '../lib/nicos-weg-a1-language-formatting.ts';
const contentText=node=>node.text||(node.content||[]).map(contentText).join(node.type==='doc'?'\n':'');
test('German phrases are blue and bold while surrounding English and Sinhala remain plain',()=>{
 const block=nicosWegA1Course.lessons.find(l=>l.slug==='grammar-00').blocks.find(b=>b.id.endsWith('-rule-3'));
 const english=block.content.content[1].content;
 for(const phrase of ['Bitte','Wie bitte?','Buchstabieren','Sie']){
  const node=english.find(n=>n.text===phrase);
  assert.ok(node,phrase);
  assert.ok(node.marks.some(m=>m.type==='bold'));
  assert.equal(node.marks.find(m=>m.type==='textStyle').attrs.color,'#1D4ED8');
 }
 assert.ok(english.some(n=>n.text.includes('makes a request polite')&&!n.marks));
 const si=block.content.content[2].content;
 assert.ok(si.some(n=>n.text==='Buchstabieren'&&n.marks));
 assert.ok(si.some(n=>/[\u0D80-\u0DFF]/u.test(n.text)&&!n.marks));
 assert.equal(contentText(block.content.content[1]),block.paragraphs[0]);
 assert.equal(contentText(block.content.content[2]),block.paragraphs[1]);
 assert.equal(block.content.content[3].content[0].marks.find(m=>m.type==='textStyle').attrs.color,'#166534');
});
test('English homographs and German terms inside other words are not incorrectly colored',()=>{
 const value='For being there use in. The word inside is English.';
 const nodes=nicosGrammarLanguageParagraph(value,4,1).content;
 assert.equal(nodes.filter(n=>n.marks).map(n=>n.text).join(''),'in');
 assert.equal(contentText({content:nodes}),value);
});
test('existing draft notes can be restyled without changing text, grades or teacher edits',()=>{
 const draft=structuredClone(nicosWegA1Course);
 const rules=draft.lessons.filter(l=>l.sectionId==='grammar-library').flatMap(l=>l.blocks.filter(b=>b.id.includes('-rule-')));
 for(const block of rules){
  const strip=node=>{delete node.marks;node.content?.forEach(strip)};
  strip(block.content);
 }
 const before=structuredClone(draft);
 const result=formatNicosGrammarLibrary(draft,nicosWegA1Course);
 assert.deepEqual(draft,before);
 assert.deepEqual(result.lessons.slice(0,13),draft.lessons.slice(0,13));
 assert.deepEqual(result.quiz,draft.quiz);
 assert.deepEqual(result.rules,draft.rules);
 assert.deepEqual(result,nicosWegA1Course);
 const edited=structuredClone(draft);
 const block=edited.lessons[13].blocks.find(b=>b.id.endsWith('-rule-1'));
 block.content.content[1].content[0].text='Teacher replacement';
 assert.deepEqual(formatNicosGrammarLibrary(edited,nicosWegA1Course).lessons[13].blocks.find(b=>b.id===block.id),block);
 assert.deepEqual(formatNicosGrammarLibrary(result,nicosWegA1Course),result);
});

import { readFileSync } from 'node:fs';
import { generateAcademyLanguageFeedback } from '../../lib/academy-language-feedback.ts';
for (const line of readFileSync('.env.local','utf8').split(/\r?\n/)) {
 const match=line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
 if(match && !process.env[match[1]]) process.env[match[1]]=match[2].replace(/^[ '\"]+|[ '\"]+$/g,'');
}
const base={apiKey:process.env.GEMINI_API_KEY,courseTitle:'Deutsch lernen mit Nicos Weg A1',prompt:'Order a tea politely in German.',checklist:['Check the masculine accusative article.'],modelAnswer:'Ich möchte einen Tee, bitte.'};
for (const text of ['Ich möchte ein Tee, bitte.', 'Einen Tee, bitte.']) {
 const result=await generateAcademyLanguageFeedback({...base,text});
 console.log(JSON.stringify({text,result}));
}
if (process.argv.includes('--audio')) {
 const result=await generateAcademyLanguageFeedback({...base,prompt:'Say a German practice sentence.',audio:{mimeType:'audio/mp4',data:readFileSync('public/audio/german-a1/a1-sounds-01.m4a').toString('base64')}});
 console.log(JSON.stringify({audioTest:result}));
}

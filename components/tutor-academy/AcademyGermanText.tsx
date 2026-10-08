import {caseHighlights,genderColors,nicosGenderCues,type NounCase,type NounGender} from '@/lib/nicos-gender-cues';
export function AcademyGenderSpan({gender,grammaticalCase,showLabel=true,children}:{gender:NounGender;grammaticalCase?:NounCase;showLabel?:boolean;children:React.ReactNode}){
 return <span className="font-semibold" style={{color:`var(--academy-gender-${gender}, ${genderColors[gender]})`}}><span className={grammaticalCase?'rounded px-0.5 [box-decoration-break:clone]':undefined} style={grammaticalCase?{backgroundColor:caseHighlights[gender][grammaticalCase],color:genderColors[gender]}:undefined}>{children}</span>{grammaticalCase&&showLabel?<sup className="ml-0.5 text-[0.6em] font-semibold" title={`${grammaticalCase} · ${gender}`} aria-label={` ${grammaticalCase}`}>{grammaticalCase==='Dativ'?'Dat.':'Akk.'}</sup>:null}</span>;
}
export default function AcademyGermanText({text,enabled=true,caseHint,genderHint}:{text:string;enabled?:boolean;caseHint?:NounCase;genderHint?:NounGender}){
 if(!enabled)return text;
 const cues=nicosGenderCues(text,caseHint,genderHint);let offset=0;
 const content:React.ReactNode[]=[];
 for(const cue of cues){if(cue.start>offset)content.push(text.slice(offset,cue.start));content.push(<AcademyGenderSpan key={cue.start} gender={cue.gender} grammaticalCase={cue.grammaticalCase}>{text.slice(cue.start,cue.end)}</AcademyGenderSpan>);offset=cue.end;}
 content.push(text.slice(offset));return <>{content}</>;
}
export function AcademyGenderLegend(){
 return <details className="mb-6 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-800"><summary className="cursor-pointer font-semibold">🎨 Gender &amp; case colours · Artikel und Fälle · වර්ණ මඟපෙන්වීම</summary><p className="my-3">The noun keeps its gender colour. The article’s highlight and label show the case.</p><p lang="si" className="mb-3">නාම පදයේ මුල් ලිංගයේ පාට නොවෙනස්ව තබයි. Article එකේ highlight පාට සහ label එකෙන් case එක පෙන්වයි.</p><div className="overflow-x-auto"><table className="w-full text-left"><thead><tr><th className="p-2">Gender</th><th className="p-2">Akkusativ</th><th className="p-2">Dativ</th></tr></thead><tbody>{([['der','der Tisch','den Tisch','dem Tisch'],['die','die Schweiz','die Schweiz','der Schweiz'],['das','das Buch','das Buch','dem Buch']] as const).map(([gender,base,acc,dat])=><tr key={gender}><td className="p-2"><AcademyGermanText text={base}/></td><td className="p-2"><AcademyGermanText text={acc} caseHint="Akkusativ"/></td><td className="p-2"><AcademyGermanText text={dat} caseHint="Dativ"/></td></tr>)}</tbody></table></div><p className="mt-3">Example: <AcademyGermanText text="aus der Schweiz"/>. Colours identify the original gender, even when the article changes. Ambiguous cases receive no automatic case label.</p></details>;
}

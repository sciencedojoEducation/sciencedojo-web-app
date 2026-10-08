import {nicosNounGenders} from './nicos-noun-genders.ts';
export type NounGender = 'der' | 'die' | 'das';
export type NounCase = 'Akkusativ' | 'Dativ';
export const genderColors = {der:'#1D4ED8',die:'#B91C1C',das:'#166534'} as const;
export const caseHighlights = {der:{Akkusativ:'#DBEAFE',Dativ:'#E9D5FF'},die:{Akkusativ:'#FCE7F3',Dativ:'#FFEDD5'},das:{Akkusativ:'#DCFCE7',Dativ:'#FEF3C7'}} as const;
export type GenderCue = {start:number;end:number;gender:NounGender;kind:'article'|'noun';grammaticalCase?:NounCase};
const escape=(s:string)=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const nouns=Object.keys(nicosNounGenders).sort((a,b)=>b.length-a.length).map(escape).join('|');
const articles='der|die|das|den|dem|des|ein|eine|einen|einem|einer|eines|mein|meine|meinen|meinem|meiner|dein|deine|deinen|deinem|deiner|sein|seine|seinen|seinem|seiner|ihr|ihre|ihren|ihrem|ihrer|kein|keine|keinen|keinem|keiner|dieser|diese|dieses|diesen|diesem';
/** Conservative singular cues: never infer gender from the declined article itself. */
export function nicosGenderCues(text:string, caseHint?:NounCase, genderHint?:NounGender):GenderCue[]{
 const cues:GenderCue[]=[];
 // Bare grammar labels need explicit context; do not colour English “die”.
 if(genderHint && new RegExp(`^(?:${articles})(?:\\s*[/→,]\\s*(?:${articles}))*$`, 'iu').test(text.trim())) {
  return [...text.matchAll(new RegExp(`\\b(${articles})\\b`, 'giu'))].map(match=>({start:match.index!,end:match.index!+match[0].length,gender:genderHint,kind:'article' as const,grammaticalCase:caseHint}));
 }

 const pattern=new RegExp(`(?<![\\p{L}])(${articles})\\s+(?:[a-zäöüß]+\\s+){0,2}(${nouns})(?![\\p{L}])`,'gu');
 // Capitalized articles at the beginning of a sentence are supported separately.
 const matches=[...text.matchAll(pattern),...text.matchAll(new RegExp(`(?<![\\p{L}])(${articles.split('|').map(a=>a[0].toUpperCase()+a.slice(1)).join('|')})\\s+(?:[a-zäöüß]+\\s+){0,2}(${nouns})(?![\\p{L}])`,'gu'))].sort((a,b)=>a.index!-b.index!);
 let previousEnd=-1;
 for(const match of matches){
  const start=match.index!;if(start<previousEnd)continue;
  const article=match[1].toLowerCase(),noun=match[2],gender=nicosNounGenders[noun];
  const before=text.slice(0,start);
  const dativePreposition=/(?:aus|bei|mit|nach|von|zu|vor|in|an|auf|hinter|neben|über|unter|zwischen)\s+$/u.test(before);
  const accusativePreposition=/(?:für|ohne|gegen|durch|um|in|an|auf|hinter|neben|über|unter|vor|zwischen)\s+$/u.test(before);
  const approvedObject=/\bIch (?:habe|suche|möchte|kaufe|nehme|sehe|brauche)\s+$/u.test(before);
  let grammaticalCase:NounCase|undefined=caseHint;
  if((gender==='der'&&/^(?:den|einen|meinen|deinen|seinen|ihren|keinen|diesen)$/.test(article)))grammaticalCase='Akkusativ';
  else if(gender!=='die'&&/^(?:dem|einem|meinem|deinem|seinem|ihrem|keinem|diesem)$/.test(article))grammaticalCase='Dativ';
  else if(gender==='die'&&/^(?:der|einer|meiner|deiner|seiner|ihrer|keiner|dieser)$/.test(article)&&(!/^(?:wegen|trotz|während|statt)\s*$/u.test(before.trim().split(/[.!?]/u).at(-1)||'') )&&(dativePreposition||/\bIch (?:helfe|danke|gebe)\s+$/u.test(before)))grammaticalCase='Dativ';
  else if((gender==='die'&&/^(?:die|eine|meine|deine|seine|ihre|keine|diese)$/.test(article)||gender==='das'&&/^(?:das|ein|mein|dein|sein|ihr|kein|dieses)$/.test(article))&&(accusativePreposition||approvedObject))grammaticalCase='Akkusativ';
  const nounStart=start+match[0].lastIndexOf(noun);
  cues.push({start,end:start+match[1].length,gender,kind:'article',grammaticalCase},{start:nounStart,end:nounStart+noun.length,gender,kind:'noun'});
  previousEnd=start+match[0].length;
 }
 return cues.sort((a,b)=>a.start-b.start);
}

type Node={type?:string;text?:string;marks?:Array<{type:string;attrs?:Record<string,unknown>}>;content?:Node[];[key:string]:unknown};
/** Decorate a display copy across rich-text mark boundaries; stored text is untouched. */
export function withNicosGenderCues<T>(document:T):T{
 const copy=structuredClone(document) as Node;
 function visit(node:Node){
  if(['paragraph','heading'].includes(node.type||'')&&node.content?.every(n=>n.type==='text')){
   const text=node.content.map(n=>n.text||'').join('');const cues=nicosGenderCues(text);let offset=0;
   node.content=node.content.flatMap(child=>{
    const value=child.text||'',start=offset,end=start+value.length;offset=end;
    const cuts=[start,end,...cues.flatMap(c=>[c.start,c.end]).filter(i=>i>start&&i<end)].sort((a,b)=>a-b);
    return cuts.slice(0,-1).map((left,i)=>{const right=cuts[i+1];const cue=cues.find(c=>left>=c.start&&right<=c.end);return {...child,text:value.slice(left-start,right-start),marks:cue?[...(child.marks||[]).filter(m=>m.type!=='nicosGender'&&m.type!=='textStyle'),{type:'nicosGender',attrs:{gender:cue.gender,grammaticalCase:cue.grammaticalCase,kind:cue.kind,label:right===cue.end}}]:child.marks};});
   });
  }else node.content?.forEach(visit);
 }
 visit(copy);return copy as T;
}

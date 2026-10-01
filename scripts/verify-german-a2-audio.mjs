// Independently transcribe generated recordings before replacing listening-exercise assets.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { a2AudioRecordings, a2AudioUrl } from "../lib/german-a2-audio.ts";
const root = resolve(import.meta.dirname,"..");
for (const line of readFileSync(join(root,".env.local"),"utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^[ '"]+|[ '"]+$/g,"");
}
const directory = resolve(root,"docs/german-a2-audio-verification");
mkdirSync(directory,{recursive:true});
const normalize = text => text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu," ").trim().split(/\s+/);
function wordError(expected, actual) {
  const a=normalize(expected),b=normalize(actual);
  let row=Array.from({length:b.length+1},(_,i)=>i);
  for(let i=1;i<=a.length;i++) {
    const next=[i];
    for(let j=1;j<=b.length;j++) next[j]=Math.min(row[j]+1,next[j-1]+1,row[j-1]+(a[i-1]===b[j-1]?0:1));
    row=next;
  }
  return row[b.length]/a.length;
}
const start=Number(process.argv.find(arg=>arg.startsWith("--start="))?.split("=")[1] || 0);
const count=Number(process.argv.find(arg=>arg.startsWith("--count="))?.split("=")[1] || a2AudioRecordings.length-start);
const localOnly = process.argv.includes("--local-only");
const ffmpeg = process.argv.find(arg=>arg.startsWith("--ffmpeg="))?.slice("--ffmpeg=".length);
const localChecks = [];
for (const recording of a2AudioRecordings.slice(start,start+count)) {
  const path=resolve(root,"public",a2AudioUrl(recording.id).slice(1));
  if(localOnly && process.argv.includes("--existing-only") && !existsSync(path)) continue;
  const bytes=readFileSync(path),sha256=createHash("sha256").update(bytes).digest("hex");
  if (localOnly) {
    if (!ffmpeg) throw new Error("Local verification requires --ffmpeg.");
    const metadata=JSON.parse(readFileSync(path+".json","utf8"));
    if(metadata.sha256!==sha256) throw new Error("Recording hash mismatch.");
    const decoded=spawnSync(ffmpeg,["-v","error","-i",path,"-f","s16le","-ac","1","-ar","24000","pipe:1"],{maxBuffer:20*1024*1024});
    if(decoded.status!==0) throw new Error(`Cannot decode ${recording.id}.`);
    const pcm=decoded.stdout;
    let peak=0,squares=0,clipped=0;
    for(let i=0;i<pcm.length;i+=2) {
      const sample=pcm.readInt16LE(i); peak=Math.max(peak,Math.abs(sample)); squares+=sample*sample;
      if(Math.abs(sample)>=32760) clipped++;
    }
    const seconds=pcm.length/48000,rms=Math.sqrt(squares/(pcm.length/2));
    if(peak<1000||rms<100||clipped/(pcm.length/2)>0.01||Math.abs(seconds-metadata.seconds)>0.2)
      throw new Error(`Audio quality or duration failure for ${recording.id}.`);
    localChecks.push({id:recording.id,sha256,seconds,wordsPerMinute:metadata.wordsPerMinute,peak,rms,clippedSamples:clipped});
    continue;
  }
  const output=join(directory,recording.id+".json");
  if(existsSync(output)&&JSON.parse(readFileSync(output,"utf8")).sha256===sha256) continue;
  const response=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",{
    method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":process.env.GEMINI_API_KEY},
    body:JSON.stringify({contents:[{role:"user",parts:[{inlineData:{mimeType:"audio/mp4",data:bytes.toString("base64")}},
      {text:"Transcribe the spoken German exactly as heard, word for word. No summary, translation, speaker labels, time codes or comments. Write all numbers as German words rather than digits. Include the complete recording through the last word."}]}],
      generationConfig:{temperature:0}}),signal:AbortSignal.timeout(120000),
  });
  const payload=await response.json();
  if(!response.ok) throw new Error(`Verification failed (${response.status}): ${payload.error?.message}`);
  const transcript=payload.candidates?.[0]?.content?.parts?.map(part=>part.text||"").join("").trim();
  if(!transcript) throw new Error("No verification transcript returned.");
  const expected=recording.segments.map(segment=>segment.text).join(" ");
  const errorRate=wordError(expected,transcript);
  writeFileSync(output,JSON.stringify({id:recording.id,sha256,expected,transcript,wordErrorRate:errorRate,checkedAt:new Date().toISOString()},null,2)+"\n");
  console.log(`${recording.id}: ${(errorRate*100).toFixed(1)}% transcription difference${errorRate>0.12?" · review required":""}`);
}

if(localOnly) { writeFileSync(join(directory,"local-checks.json"),JSON.stringify(localChecks,null,2)+"\n"); console.log(`Decoded and checked ${localChecks.length} AAC recordings.`); }

// Transcribe generated recordings independently; inspect differences before replacing course audio.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { b1AudioRecordings, b1AudioUrl } from "../lib/german-b1-audio.ts";
const root = resolve(import.meta.dirname, "..");
for (const line of readFileSync(resolve(root,".env.local"),"utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^[ '\"]+|[ '\"]+$/g, "");
}
const keyName = process.argv.find(arg => arg.startsWith("--key-env="))?.split("=")[1] || "GEMINI_API_KEY";
if (!/^GEMINI_API_KEY[0-9]*$/.test(keyName)) throw new Error("Invalid Gemini key environment variable.");
const apiKey = process.env[keyName];
if (!apiKey) throw new Error(`${keyName} is required.`);
const model = process.argv.find(arg => arg.startsWith("--model="))?.split("=")[1] || "gemini-3.8-flash";
if (!/^gemini-[a-zA-Z0-9.-]+$/.test(model)) throw new Error("Invalid model name.");
const start = Number(process.argv.find(arg => arg.startsWith("--start="))?.split("=")[1] || 0);
const count = Number(process.argv.find(arg => arg.startsWith("--count="))?.split("=")[1] || b1AudioRecordings.length - start);
if (!Number.isInteger(start) || start < 0 || !Number.isInteger(count) || count < 1 || start + count > b1AudioRecordings.length) throw new Error("Invalid recording range.");
for (const recording of b1AudioRecordings.slice(start,start+count)) {
  const path = resolve(root,"public",b1AudioUrl(recording.id).slice(1));
  const sha256 = createHash("sha256").update(readFileSync(path)).digest("hex");
  const reportPath = resolve(root,"docs",`${recording.id}-audio-audit.json`);
  if (existsSync(reportPath) && JSON.parse(readFileSync(reportPath,"utf8")).sha256 === sha256) { console.log(`Existing audit ${recording.id}`); continue; }
  let result;
  for (let attempt = 0; attempt < 4; attempt++) {
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":apiKey},
    body:JSON.stringify({model,store:false,input:[{type:"text",text:"Transcribe this German recording verbatim. Return only the words heard, no speaker labels or explanations."},{type:"audio",mime_type:"audio/mp4",data:readFileSync(path).toString("base64")}]}),signal:AbortSignal.timeout(120000),
  });
  result = await response.json();
  if (response.ok) break;
  if (![429,503].includes(response.status) || attempt === 3 || /perday|per_day|daily/i.test(JSON.stringify(result))) throw new Error(`Gemini transcription failed: ${result.error?.message || response.status}`);
  console.log(`Transcription busy; retrying ${recording.id} in 30s.`);
  await new Promise(done => setTimeout(done,30000));
  }
  const actual = result.output_text || result.outputs?.flatMap(output => output.content || []).map(part => part.text || "").join("");
  if (!actual) throw new Error("No transcription returned.");
  const expected = recording.segments.map(segment => segment.text).join("\n\n");
  writeFileSync(reportPath,JSON.stringify({id:recording.id,sha256,model,expected,actual},null,2)+"\n");
  console.log(`Transcribed ${recording.id}`);
}

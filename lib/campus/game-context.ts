import {campusConfiguration} from "./security.ts";
/** Only the application server calls the private room endpoint. Never accept a browser proof. */
export async function gameContext() {
  const config=campusConfiguration();
  if(!config) throw new Error("Campus unavailable");
  if(config.transport==="vercel") return {transport:"vercel",proof:{}};
  const url=new URL(config.publicUrl);url.protocol=url.protocol==="wss:"?"https:":"http:";url.pathname="/games-context";
  const response=await fetch(url,{cache:"no-store",headers:{authorization:`Bearer ${process.env.CAMPUS_SERVICE_KEY}`},signal:AbortSignal.timeout(1500)});
  if(!response.ok)throw new Error("Live room unavailable");
  const text=await response.text();
  if(text.length>8192)throw new Error("Invalid room context");
  return {transport:"colyseus",proof:JSON.parse(text)};
}

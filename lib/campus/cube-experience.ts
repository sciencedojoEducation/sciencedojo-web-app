/** Local presentation preferences only. Never part of campus wire messages. */
export type SchoolView = "exterior" | "overview" | "follow" | "place" | "orbit" | "first-person";
export type CameraLook = { yaw: number; pitch: number; distance: number };
export const DEFAULT_LOOK: CameraLook = { yaw: 0, pitch: .55, distance: 36 };
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
export function normalizeHour(hour: number) { return Number.isFinite(hour) ? ((hour % 24) + 24) % 24 : 12; }
export function clockLabel(hour: number) {
  const minutes = Math.round(normalizeHour(hour) * 60) % 1440;
  return `${String(Math.floor(minutes / 60)).padStart(2,"0")}:${String(minutes % 60).padStart(2,"0")}`;
}
function mix(a: string, b: string, amount: number) {
  const n = clamp(amount,0,1);
  return "#" + [1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-n)+parseInt(b.slice(i,i+2),16)*n).toString(16).padStart(2,"0")).join("");
}
export function schoolSky(hour: number) {
  const angle=(normalizeHour(hour)-6)/24*Math.PI*2, altitude=Math.sin(angle);
  const daylight=clamp((altitude+.12)/.5,0,1), twilight=clamp(1-Math.abs(altitude)/.3,0,1);
  const sun={x:Math.cos(angle)*.6,y:altitude,z:Math.cos(angle)*.8};
  return { daylight, stars:Math.pow(1-daylight,2), sun, moon:{x:-sun.x,y:-sun.y,z:-sun.z},
    zenith:mix(mix("#020611","#4a95ce",daylight),"#6a6a9b",twilight*.45),
    horizon:mix(mix("#101c32","#e2f2f4",daylight),"#f2aa77",twilight*.85),
    sunColour:mix("#ffad74","#fff1bc",daylight), phase:daylight>.8?"Daylight":daylight<.1?"Night sky":"Twilight" };
}
export function boundedLook(look: CameraLook, view: SchoolView): CameraLook {
  return { yaw:Number.isFinite(look.yaw)?Math.atan2(Math.sin(look.yaw),Math.cos(look.yaw)):0,
    pitch:clamp(Number.isFinite(look.pitch)?look.pitch:.35,view==="first-person"?-1.35:.16,1.35),
    distance:clamp(Number.isFinite(look.distance)?look.distance:36,10,260) };
}
/** Convert local movement axes only; the server still authorizes movement. */
export function cameraDirection(x: number, z: number, yaw: number) {
  if(!x&&!z)return {x:0,z:0};
  return {x:x*Math.cos(yaw)-z*Math.sin(yaw),z:x*Math.sin(yaw)+z*Math.cos(yaw)};
}

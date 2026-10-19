import {GAME_TABLES, type GameKind} from "./board-games.ts";
export const GAME_REACH = 2.4;
export const INVITE_REACH = 5;
type Pose = {x:number;z:number;floor?:number;seat?:string|null;travel?:unknown;status?:string};
export function atGameTable(p:Pose|undefined, table:GameKind) {
  const t=GAME_TABLES.find(t=>t.id===table)!;
  return !!p && !p.seat && !p.travel && p.status!=="studying" && (p.floor??0)===2 &&
    p.x>16 && p.x<36 && p.z>17 && p.z<35 && Math.hypot(p.x-t.x,p.z-t.z)<GAME_REACH;
}
export function canInvite(a:Pose|undefined,b:Pose|undefined) {
  return !!a && !!b && !a.seat && !b.seat && !a.travel && !b.travel &&
    a.status!=="studying" && b.status!=="studying" && (a.floor??0)===(b.floor??0) && Math.hypot(a.x-b.x,a.z-b.z)<=INVITE_REACH;
}
export type PlayInvitation = {id:string;table:GameKind;state:"pending"|"accepted";incoming:boolean;peer:string;pseudonym:string;expires:string};
export type PlayState = {invitation:PlayInvitation|null;nearby:{id:string;pseudonym:string}[]};

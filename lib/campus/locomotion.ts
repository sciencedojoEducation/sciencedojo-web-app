import {SCHOOL_CONNECTORS,SCHOOL_PLACES,floorHeight,glassSwitch,type Stance} from "./school-plan.ts";
import {schoolPlaceAt} from "./school-layout.ts";
type Body={x:number;z:number;floor?:number;elevation?:number;stance?:Stance;travel?:string|null;seat?:string|null;status:string};
export type EnvironmentCommand={action:"glass";room:string}|{action:"travel";via:string;to:number};
export function isEnvironmentCommand(value:unknown):value is EnvironmentCommand{
 if(!value||typeof value!=="object"||Array.isArray(value))return false;
 const c=value as EnvironmentCommand,keys=Object.keys(c).sort().join(",");
 return c.action==="glass"?keys==="action,room"&&SCHOOL_PLACES.some(p=>p.id===c.room&&!p.outdoor):
  c.action==="travel"&&keys==="action,to,via"&&Number.isInteger(c.to)&&c.to>=0&&c.to<=2&&SCHOOL_CONNECTORS.some(p=>p.id===c.via);
}
export function availableJourneys(p:Body){
 if(p.seat||p.travel||p.status!=="walking"||Math.abs((p.elevation??floorHeight(p.floor))-floorHeight(p.floor))>.05)return [];
 const floor=p.floor??0;
 return SCHOOL_CONNECTORS.flatMap(c=>{
  const distance=Math.hypot(p.x-c.x,p.z-c.z),exitDistance=Math.hypot(p.x-c.exitX,p.z-c.exitZ);
  if(c.id==="lift")return distance<=2.2?[0,1,2].filter(f=>f!==floor).map(to=>({connector:c,to,reverse:false})):[];
  if(c.id==="slide")return floor>0&&distance<=2.2?[{connector:c,to:0,reverse:false}]:[];
  return [...(floor<2&&distance<=2.2?[{connector:c,to:floor+1,reverse:false}]:[]),...(floor>0&&exitDistance<=2.2?[{connector:c,to:floor-1,reverse:true}]:[])];
 });
}
export function canSwitchGlass(p:Body,room:string){return !p.travel&&schoolPlaceAt(p)?.id===room;}
export function nearbyGlassSwitch(p:Body){const room=schoolPlaceAt(p);if(!room||room.outdoor||p.seat||p.travel)return;const s=glassSwitch(room);return Math.hypot(s.x-p.x,s.z-p.z)<=2.1?room:undefined;}
export type Journey={via:string;from:number;to:number;x:number;z:number;endX:number;endZ:number;at:number;duration:number};
export function startJourney(p:Body,c:EnvironmentCommand,now:number):Journey|null{
 if(c.action!=="travel")return null;const offer=availableJourneys(p).find(j=>j.connector.id===c.via&&j.to===c.to);if(!offer)return null;
 const {connector,reverse}=offer;
 return {via:connector.id,from:p.floor??0,to:c.to,x:reverse?connector.exitX:connector.x,z:reverse?connector.exitZ:connector.z,endX:reverse?connector.x:connector.exitX,endZ:reverse?connector.z:connector.exitZ,at:now,duration:connector.duration};
}
export function advanceJourney(p:Body,j:Journey,now:number){
 const t=Math.max(0,Math.min(1,(now-j.at)/j.duration)),smooth=t*t*(3-2*t);
 p.x=j.x+(j.endX-j.x)*smooth;p.z=j.z+(j.endZ-j.z)*smooth;
 p.elevation=floorHeight(j.from)+(floorHeight(j.to)-floorHeight(j.from))*smooth;
 if(j.via==="slide"&&t<1)p.elevation+=Math.sin(Math.PI*t)*.8;
 p.travel=t<1?j.via:null;p.stance=j.via==="slide"&&t<1?"crouch":"stand";
 if(t===1)p.floor=j.to;
 return t<1;
}
export function jumpElevation(start:number|undefined,now:number,floor=0){const t=start===undefined?1:(now-start)/850;return floorHeight(floor)+(t>=0&&t<1?Math.sin(t*Math.PI)*1.2:0);}

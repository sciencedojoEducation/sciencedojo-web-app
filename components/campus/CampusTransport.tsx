"use client";
import {useLayoutEffect,useMemo,useRef} from "react";
import {useFrame} from "@react-three/fiber";
import {BoxGeometry,Color,MeshLambertMaterial,Object3D,type InstancedMesh} from "three";
import {SCHOOL_CONNECTORS} from "@/lib/campus/school-plan";
type Part={x:number;y:number;z:number;w:number;h:number;d:number;colour:string;rx?:number};
const parts:Part[]=[];
const add=(x:number,y:number,z:number,w:number,h:number,d:number,colour:string,rx=0)=>parts.push({x,y,z,w,h,d,colour,rx});
const lift=SCHOOL_CONNECTORS[0],escalator=SCHOOL_CONNECTORS[1],slide=SCHOOL_CONNECTORS[2];
for(const side of [-1,1])for(const dz of [-1.6,1.6])add(lift.x+side*1.6,12,lift.z+dz,.16,25,.16,"#759b98");
for(const y of [0,12,24]){
 add(lift.x,y+.03,lift.z,3.2,.12,3.2,"#668f82");
 add(lift.x,y+2.7,lift.z,3.5,.18,3.5,"#acccc0");
 add(lift.x,y+1.2,lift.z+1.5,.65,.5,.15,"#7cbaac");
}
const slope=Math.atan2(12,26),length=Math.hypot(12,26);
for(const y of [0,12]){
 for(const side of [-1,1])add(escalator.x+side*1.45,y+6.85,0,.16,.35,length,"#608c7e",slope);
 add(escalator.x,y+5.85,0,2.6,.3,length,"#a8b9aa",slope);
}
for(const top of [12,24]){
 const angle=-Math.atan2(top,26),len=Math.hypot(top,26);
 add(slide.x,top/2+.25,26,2,.15,len,"#d2b275",angle);
 for(const side of [-1,1])add(slide.x+side*1.08,top/2+.6,26,.12,.8,len,"#91bba0",angle);
}
export default function CampusTransport({floor,animate=false,reducedMotion=false,activityRef}:{floor:number;animate?:boolean;reducedMotion?:boolean;activityRef:{current:boolean};hour?:number}){
 const fixed=useRef<InstancedMesh>(null),steps=useRef<InstancedMesh>(null);
 const geometry=useMemo(()=>new BoxGeometry(1,1,1),[]),material=useMemo(()=>new MeshLambertMaterial(),[]),transform=useMemo(()=>new Object3D(),[]);
 useLayoutEffect(()=>{const c=new Color();parts.forEach((p,i)=>{transform.position.set(p.x,p.y,p.z);transform.rotation.set(p.rx??0,0,0);transform.scale.set(p.w,p.h,p.d);transform.updateMatrix();fixed.current!.setMatrixAt(i,transform.matrix);fixed.current!.setColorAt(i,c.set(p.colour));});fixed.current!.instanceMatrix.needsUpdate=true;fixed.current!.instanceColor!.needsUpdate=true;fixed.current!.computeBoundingSphere();},[transform]);
 useFrame(({clock,invalidate})=>{
  const phase=animate&&!reducedMotion?(clock.elapsedTime*.4)%1:0;
  for(let level=0;level<2;level++)for(let i=0;i<32;i++){
   const t=(i+phase)/32;transform.position.set(escalator.x,level*12+t*12,escalator.z-t*26);transform.rotation.set(0,0,0);transform.scale.set(level>floor?0:2.5,.18,.84);transform.updateMatrix();steps.current!.setMatrixAt(level*32+i,transform.matrix);
  }
  steps.current!.instanceMatrix.needsUpdate=true;steps.current!.computeBoundingSphere();
  if(animate&&!reducedMotion){activityRef.current=true;invalidate();}
 });
 return <group name="campus-floor-transport"><instancedMesh name="campus-lift-escalator-slide" ref={fixed} args={[geometry,material,parts.length]}/><instancedMesh name="campus-moving-steps" ref={steps} args={[geometry,undefined,64]}><meshLambertMaterial color="#94b4a1"/></instancedMesh></group>;
}

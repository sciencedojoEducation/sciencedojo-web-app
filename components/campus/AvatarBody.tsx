"use client";
import {useCallback,useLayoutEffect,useMemo,useRef} from "react";
import {useFrame,useThree} from "@react-three/fiber";
import {Color,DynamicDrawUsage,Object3D,Sphere,Vector3,type InstancedMesh,type Mesh} from "three";

type PoseRef={current:{x:number;z:number}};
type ActivityRef={current:boolean};
const SKIN="#e9c5a0",HAIR="#3e3029",TROUSERS="#355450",SHOES="#203932";

/** A built-in toy-like humanoid. All 23 body pieces use three draw calls. */
export default function AvatarBody({colour,motion,seated,hidden,reducedMotion,activityRef,ballHeld=false}:{
 colour:string;motion:PoseRef;seated:boolean;hidden:boolean;reducedMotion:boolean;activityRef:ActivityRef;ballHeld?:boolean;
}){
 const boxes=useRef<InstancedMesh>(null),round=useRef<InstancedMesh>(null),hair=useRef<Mesh>(null);
 const transform=useMemo(()=>new Object3D(),[]),invalidate=useThree(s=>s.invalidate);
 const gait=useRef({x:motion.current.x,z:motion.current.z,phase:0,amount:0});
 const pose=useCallback((phase:number,amount:number)=>{
  const box=boxes.current,spheres=round.current;if(!box||!spheres||!hair.current)return;
  const bob=seated?0:Math.abs(Math.sin(phase))*.015*amount;
  const hip=seated?.59:.76,offset=hip-.76+bob,head=1.48+offset;
  const part=(mesh:InstancedMesh,index:number,x:number,y:number,z:number,w:number,h:number,d:number,angle=0)=>{
   transform.position.set(x,y,z);transform.rotation.set(angle,0,0);transform.scale.set(w,h,d);transform.updateMatrix();mesh.setMatrixAt(index,transform.matrix);
  };
  part(box,0,0,1.02+offset,0,.43,.42,.25);
  part(box,1,0,hip+bob,0,.35,.14,.23);
  part(box,2,0,1.26+offset,0,.12,.13,.12);
  part(spheres,0,0,head,0,.205,.22,.205);
  for(const side of [-1,1]){
   const swing=Math.sin(phase+(side===1?Math.PI:0))*.48*amount;
   const arm=seated?-1.75:ballHeld&&side===1?-.6:-swing,forearm=seated?-1.9:ballHeld&&side===1?-1.1:arm-.12;
   const shoulder=1.17+offset,x=side*.31,index=side===-1?3:5;
   const elbowY=shoulder-Math.cos(arm)*.22,elbowZ=-Math.sin(arm)*.22;
   const wristY=elbowY-Math.cos(forearm)*.23,wristZ=elbowZ-Math.sin(forearm)*.23;
   part(box,index,x,shoulder-Math.cos(arm)*.11,-Math.sin(arm)*.11,.15,.22,.17,arm);
   part(box,index+1,x,elbowY-Math.cos(forearm)*.115,elbowZ-Math.sin(forearm)*.115,.11,.23,.12,forearm);
   part(spheres,side===-1?1:2,x,wristY,wristZ,.075,.08,.07);
   const thigh=seated?-1.08:swing,shin=seated?0:thigh-Math.max(0,Math.sin(phase+(side===1?Math.PI:0)))*.42*amount;
   const kneeY=hip+bob-Math.cos(thigh)*.32,kneeZ=-Math.sin(thigh)*.32;
   const ankleY=kneeY-Math.cos(shin)*.32,ankleZ=kneeZ-Math.sin(shin)*.32,leg=side===-1?7:10;
   part(box,leg,side*.115,hip+bob-Math.cos(thigh)*.16,-Math.sin(thigh)*.16,.145,.32,.18,thigh);
   part(box,leg+1,side*.115,kneeY-Math.cos(shin)*.16,kneeZ-Math.sin(shin)*.16,.13,.32,.15,shin);
   part(box,leg+2,side*.115,ankleY-.06,ankleZ+.065,.165,.12,.29);
  }
  // A short cap, fringe and side/back hair leave the face readable.
  part(box,13,0,head+.10,.15,.34,.09,.15);
  part(box,14,0,head+.025,-.155,.35,.24,.12);
  for(const side of [-1,1])part(box,side===-1?15:16,side*.185,head+.015,-.015,.065,.16,.17);
  for(const side of [-1,1])part(box,side===-1?17:18,side*.075,head+.025,.197,.035,.045,.025);
  hair.current.position.y=head;
  box.instanceMatrix.needsUpdate=true;spheres.instanceMatrix.needsUpdate=true;
 },[seated,ballHeld,transform]);
 useLayoutEffect(()=>{
  const box=boxes.current!,spheres=round.current!,tint=new Color();
  const colours=[colour,TROUSERS,SKIN,colour,SKIN,colour,SKIN,TROUSERS,TROUSERS,SHOES,TROUSERS,TROUSERS,SHOES,HAIR,HAIR,HAIR,HAIR,"#253734","#253734"];
  colours.forEach((value,index)=>box.setColorAt(index,tint.set(value)));box.instanceColor!.needsUpdate=true;
  for(const mesh of [box,spheres]){
   mesh.instanceMatrix.setUsage(DynamicDrawUsage);
   // Fixed rig bounds cover all poses, without recalculating per frame.
   mesh.boundingSphere=new Sphere(new Vector3(0,.85,0),1.1);
  }
  gait.current={x:motion.current.x,z:motion.current.z,phase:0,amount:0};pose(0,0);invalidate();
 },[colour,hidden,reducedMotion,seated,motion,pose,invalidate]);
 useFrame((_,delta)=>{
  const state=gait.current,travel=Math.hypot(motion.current.x-state.x,motion.current.z-state.z);
  state.x=motion.current.x;state.z=motion.current.z;
  if(hidden)return;
  const previous=state.amount;
  const walking=!seated&&!reducedMotion&&travel>.00001&&travel<.5;
  if(walking)state.phase=(state.phase+travel*8)%(Math.PI*2);
  if(seated||reducedMotion||travel>=.5)state.amount=0;
  else{
   const target=walking?1:0;state.amount+=(target-state.amount)*(1-Math.exp(-Math.min(delta,.1)*18));
   if(Math.abs(target-state.amount)<.01)state.amount=target;
  }
  if(travel>.00001||previous!==state.amount)pose(state.phase,state.amount);
  if(!walking&&state.amount>0){activityRef.current=true;invalidate();}
 },-.5);
 return <group name="avatar-body">
  <instancedMesh name="avatar-parts" ref={boxes} args={[undefined,undefined,19]}>
   <boxGeometry args={[1,1,1]}/><meshLambertMaterial/>
  </instancedMesh>
  <instancedMesh name="avatar-head-hands" ref={round} args={[undefined,undefined,3]}>
   <sphereGeometry args={[1,12,8]}/><meshLambertMaterial color={SKIN}/>
  </instancedMesh>
  <mesh name="avatar-hair" ref={hair} scale={[.225,.235,.225]}>
   <sphereGeometry args={[1,12,6,0,Math.PI*2,0,Math.PI*.39]}/><meshLambertMaterial color={HAIR}/>
  </mesh>
 </group>;
}

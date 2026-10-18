"use client";
import {useLayoutEffect,useMemo,useRef} from "react";
import {useFrame,useThree} from "@react-three/fiber";
import {BufferGeometry,Object3D,Vector3,type Group,type InstancedMesh,type Mesh} from "three";
import {COURT,HOOPS,basketballAim,currentShotPower,shotGuide,type BasketballSnapshot,type ShotControl} from "@/lib/campus/basketball";
import type {Player} from "@/lib/campus/protocol";
import type {CameraLook,SchoolView} from "@/lib/campus/cube-experience";
import {PRESENTATION_DELAY_MS} from "@/lib/campus/presentation";
type Sample={x:number;y:number;z:number;at:number};
type Ref<T>={current:T};
export default function BasketballCourt({ball,players,self,view,angles,focus,charge,charging,power,reducedMotion,activityRef}:{
 ball:BasketballSnapshot;players:Player[];self:string;view:SchoolView;angles:Ref<CameraLook>;
 focus:Ref<{x:number;z:number;eye:number}>;charge:Ref<ShotControl>;charging:boolean;power:number;reducedMotion:boolean;activityRef:Ref<boolean>;
}){
 const body=useRef<Group>(null),shadow=useRef<Mesh>(null),rims=useRef<InstancedMesh>(null),nets=useRef<InstancedMesh>(null),guide=useRef<InstancedMesh>(null);
 const invalidate=useThree(s=>s.invalidate),camera=useThree(s=>s.camera),transform=useMemo(()=>new Object3D(),[]);
 const stream=useRef<{holder:string|null;event:number;samples:Sample[]}>({holder:ball.holder,event:ball.event,samples:[]});
 const previous=useRef({x:ball.x,y:ball.y,z:ball.z});
 const seams=useMemo(()=>{
  const points:Vector3[]=[];
  for(let plane=0;plane<3;plane++)for(let n=0;n<48;n++)for(const angle of [n/48*Math.PI*2,(n+1)/48*Math.PI*2]){
   const a=Math.sin(angle)*(COURT.radius+.001),b=Math.cos(angle)*(COURT.radius+.001);
   points.push(new Vector3(plane===0?0:a,plane===1?0:plane===0?a:b,plane===2?0:b));
  }
  return new BufferGeometry().setFromPoints(points);
 },[]);
 const paint=useMemo(()=>{
  const points:Vector3[]=[];
  for(const hoop of HOOPS)for(let i=0;i<48;i++)for(const a of [i/48*Math.PI-Math.PI/2,(i+1)/48*Math.PI-Math.PI/2])
   points.push(new Vector3(hoop.x+Math.sin(a)*COURT.threePoint,COURT.floor+.02,hoop.z+(hoop.id==='north'?1:-1)*Math.cos(a)*COURT.threePoint));
  for(let i=0;i<48;i++)for(const a of [i/48*Math.PI*2,(i+1)/48*Math.PI*2])points.push(new Vector3(52+Math.sin(a)*1.4,COURT.floor+.02,Math.cos(a)*1.4));
  return new BufferGeometry().setFromPoints(points);
 },[]);
 useLayoutEffect(()=>invalidate(),[charging,power,invalidate]);
 useLayoutEffect(()=>{
  HOOPS.forEach((hoop,index)=>{
   transform.position.set(hoop.x,COURT.rimY,hoop.z);transform.rotation.set(Math.PI/2,0,0);transform.updateMatrix();rims.current!.setMatrixAt(index,transform.matrix);
   transform.position.y-=.3;transform.rotation.set(0,0,0);transform.updateMatrix();nets.current!.setMatrixAt(index,transform.matrix);
  });
  for(const mesh of [rims.current!,nets.current!]){mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();}
 },[transform]);
 useLayoutEffect(()=>{
  const now=performance.now(),state=stream.current,sample={x:ball.x,y:ball.y,z:ball.z,at:now};
  const last=state.samples.at(-1);
  if(!last||now-last.at>1000||state.holder!==ball.holder||(ball.kind==='out'&&state.event!==ball.event)||Math.hypot(ball.x-last.x,ball.z-last.z)>8)
   state.samples=[{...sample,at:now-PRESENTATION_DELAY_MS},sample];
  else state.samples.push(sample);
  // The course can pause this canvas for hours while snapshots still arrive.
  // Keep only the bounded interpolation window even when no frame is running.
  while(state.samples.length>1&&state.samples[1].at<=now-PRESENTATION_DELAY_MS)state.samples.shift();
  state.holder=ball.holder;state.event=ball.event;invalidate();
 },[ball,invalidate]);
 useFrame(()=>{
  const now=performance.now(),samples=stream.current.samples,at=now-PRESENTATION_DELAY_MS;
  while(samples.length>1&&samples[1].at<=at)samples.shift();
  const from=samples[0]??{...ball,at:now},to=samples[1]??from;
  const fraction=to.at>from.at?Math.max(0,Math.min(1,(at-from.at)/(to.at-from.at))):1;
  let x=from.x+(to.x-from.x)*fraction,y=from.y+(to.y-from.y)*fraction,z=from.z+(to.z-from.z)*fraction;
  const owner=players.find(p=>p.id===ball.holder),mine=ball.holder===self;
  if(ball.mode==='held'&&owner){
   const position=mine?focus.current:{x,z}, yaw=mine&&view==='first-person'?angles.current.yaw:Math.atan2(Math.sin(owner.rotation),-Math.cos(owner.rotation));
   x=position.x+Math.sin(yaw)*.55+Math.cos(yaw)*.3;z=position.z-Math.cos(yaw)*.55+Math.sin(yaw)*.3;
   y=reducedMotion?.95:COURT.floor+COURT.radius+.04+Math.abs(Math.sin(now*.009))* .75;
   if(mine&&view==='first-person'){
    // A local held-ball view model stays visible while looking at the rim.
    // Other players retain the ground-level dribble; authority is unchanged.
    const pitch=angles.current.pitch,down=.35+(reducedMotion?0:Math.abs(Math.sin(now*.009))*.08);
    x=position.x+Math.sin(yaw)*Math.cos(pitch)*.85+Math.cos(yaw)*.32+Math.sin(yaw)*Math.sin(pitch)*down;
    z=position.z-Math.cos(yaw)*Math.cos(pitch)*.85+Math.sin(yaw)*.32-Math.cos(yaw)*Math.sin(pitch)*down;
    y=focus.current.eye+Math.sin(pitch)*.85-Math.cos(pitch)*down;
   }
  }
  const visible=ball.mode!=='held'||!!owner;
  if(body.current){
   body.current.visible=visible;body.current.position.set(x,y,z);
   const travel=Math.hypot(x-previous.current.x,y-previous.current.y,z-previous.current.z);
   if(!reducedMotion&&travel<2){body.current.rotation.x+=travel/COURT.radius*.25;body.current.rotation.z+=travel/COURT.radius*.17;}
  }
  previous.current={x,y,z};
  if(shadow.current){shadow.current.visible=visible;shadow.current.position.set(x,COURT.floor+.015,z);shadow.current.scale.setScalar(Math.max(.4,1-(y-.4)*.08));}
  const aiming=mine&&ball.mode==='held';
  if(guide.current){
   guide.current.visible=aiming;
   if(aiming){
    const command={action:'shoot' as const,...basketballAim(angles.current.yaw,angles.current.pitch),power:currentShotPower(charge.current,now)};
    let count=0;
    for(let i=0;i<24;i++){
     const point=shotGuide(focus.current,command,(i+1)*.085);
     if(point.y<COURT.floor+COURT.radius||point.x<COURT.minX||point.x>COURT.maxX||point.z<COURT.minZ||point.z>COURT.maxZ)break;
     transform.position.set(point.x,point.y,point.z);transform.rotation.set(0,0,0);transform.scale.setScalar(1);transform.updateMatrix();guide.current.setMatrixAt(count++,transform.matrix);
    }
    guide.current.count=count;guide.current.instanceMatrix.needsUpdate=true;guide.current.computeBoundingSphere();
   }
  }
  const near=Math.hypot(camera.position.x-x,camera.position.z-z,camera.position.y-y)<60;
  if((near&&(samples.length>1||(ball.mode==='held'&&!!owner&&!reducedMotion)))||(aiming&&charge.current.started!==null)){
   activityRef.current=true;invalidate();
  }
 });
 return <group name="playable-basketball-court">
  <lineSegments geometry={paint}><lineBasicMaterial color="#f1e9d5"/></lineSegments>
  <instancedMesh name="basketball-rims" ref={rims} args={[undefined,undefined,2]}><torusGeometry args={[COURT.rimRadius,COURT.rimTube,6,32]}/><meshLambertMaterial color="#e89444"/></instancedMesh>
  <instancedMesh name="basketball-nets" ref={nets} args={[undefined,undefined,2]}><cylinderGeometry args={[COURT.rimRadius,.24,.6,12,3,true]}/><meshBasicMaterial color="#ecf3e5" wireframe transparent opacity={.7}/></instancedMesh>
  <group name="basketball" ref={body}><mesh><sphereGeometry args={[COURT.radius,18,12]}/><meshLambertMaterial color="#dd792f" emissive="#6b2f0b" emissiveIntensity={.18}/></mesh><lineSegments geometry={seams}><lineBasicMaterial color="#563623"/></lineSegments></group>
  <mesh name="basketball-ground-marker" ref={shadow} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.27,.34,24]}/><meshBasicMaterial color="#ebba5a" transparent opacity={.65} depthWrite={false}/></mesh>
  <instancedMesh name="basketball-shot-guide" ref={guide} args={[undefined,undefined,24]}><sphereGeometry args={[.045,6,4]}/><meshBasicMaterial color="#f6e6a4" transparent opacity={.8}/></instancedMesh>
 </group>;
}

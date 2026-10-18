"use client";
import {Canvas,useFrame,useThree} from "@react-three/fiber";
import {useCallback,useEffect,useLayoutEffect,useMemo,useRef,useState} from "react";
import {Vector3,type Group} from "three";
import {AVATAR_COLOURS,SEATS,type Player,type Snapshot} from "@/lib/campus/protocol";
import {SCHOOL_PLACES} from "@/lib/campus/school-layout";
import {advancePresentation,createPresentation,receivePresentation} from "@/lib/campus/presentation";
import {createRenderBudget,reduceRenderQuality} from "@/lib/campus/render-budget";
import SchoolModel from "./SchoolModel";
type ViewPosition={current:{x:number;z:number}};
type FrameActivity={current:boolean};
export type SchoolView="overview"|"follow"|"place";
function Avatar({ player, self, onPosition, activityRef }: { player: Player; self: boolean; onPosition: (x: number, z: number) => void; activityRef:FrameActivity }) {
  const group = useRef<Group>(null);
  const motion = useRef(createPresentation(player, 0));
  const invalidate = useThree(s => s.invalidate);
  useLayoutEffect(() => { receivePresentation(motion.current, player, performance.now()); invalidate(); }, [player, invalidate]);
  useFrame(() => {
    const view = motion.current;
    const moving = advancePresentation(view, performance.now());
    group.current?.position.set(view.x, player.seat ? .4 : 0, view.z);
    if (group.current) group.current.rotation.y = view.rotation;
    if (self) onPosition(view.x, view.z);
    if (moving) { activityRef.current=true; invalidate(); }
  }, -1);
  return <group ref={group}>
    <mesh position={[0, .75, 0]}><capsuleGeometry args={[.28, player.seat ? .25 : .55, 4, 8]} /><meshStandardMaterial color={AVATAR_COLOURS[player.colour]} /></mesh>
    <mesh position={[0, player.seat ? 1.27 : 1.42, 0]}><sphereGeometry args={[.23, 12, 12]} /><meshStandardMaterial color="#e9c5a0" /></mesh>
    {!player.seat && <mesh position={[0, .135, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[.4, 16]} /><meshBasicMaterial color="#25483d" transparent opacity={.15} depthWrite={false} />
    </mesh>}
    {self && <mesh position={[0, .16, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[.43, .52, 24]} /><meshBasicMaterial color="#205e52" />
    </mesh>}
  </group>;
}
function Camera({focus,present,reducedMotion,view,placeId,activityRef}:{focus:ViewPosition;present:boolean;reducedMotion:boolean;view:SchoolView;placeId:string;activityRef:FrameActivity}) {
 const camera=useThree(s=>s.camera),invalidate=useThree(s=>s.invalidate);
 const target=useMemo(()=>new Vector3(),[]),look=useMemo(()=>new Vector3(),[]),aim=useMemo(()=>new Vector3(),[]);
 const place=SCHOOL_PLACES.find(p=>p.id===placeId)??SCHOOL_PLACES[7];
 useFrame((_,delta)=>{
  if(view==="overview"){target.set(87,124,133);aim.set(0,0,0);}
  else{const x=view==="place"||reducedMotion?place.x:present?focus.current.x:0,z=view==="place"||reducedMotion?place.z:present?focus.current.z:0;
   target.set(x+13,16,z+20);aim.set(x,0,z-1);}
  const settled=camera.position.distanceToSquared(target)<.00001&&look.distanceToSquared(aim)<.00001;
  if(reducedMotion||settled){camera.position.copy(target);look.copy(aim);}
  else{const step=1-Math.exp(-delta*4);camera.position.lerp(target,step);look.lerp(aim,step);activityRef.current=true;invalidate();}
  camera.lookAt(look);
 });return null;
}
function Labels({elements,view}:{elements:Map<string,HTMLSpanElement>;view:SchoolView}){
 const point=useMemo(()=>new Vector3(),[]);
 useFrame(({camera,size})=>{
  for(const place of SCHOOL_PLACES){const el=elements.get(place.id);if(!el)continue;
   point.set(place.x,4.8,place.z-6);const near=point.distanceTo(camera.position)<47;
   point.project(camera);const x=(point.x+1)*size.width/2,y=(1-point.y)*size.height/2;
   const visible=point.z>-1&&point.z<1&&x>0&&x<size.width&&y>0&&y<size.height&&(view==='overview'||near);
   const display=visible?'block':'none';if(el.style.display!==display)el.style.display=display;
   if(visible){const transform=`translate(${Math.round(x)}px,${Math.round(y)}px) translate(-50%,-50%)`;if(el.style.transform!==transform)el.style.transform=transform;}
  }
 });return null;
}
function RenderBudget({scale,onSlow,activityRef,active}:{scale:number;onSlow:()=>void;activityRef:FrameActivity;active:boolean}){
 const sample=useRef(createRenderBudget());
 useLayoutEffect(()=>{sample.current=createRenderBudget();activityRef.current=false;},[scale,active,activityRef]);
 useFrame((_,delta)=>{
  const continuous=activityRef.current;activityRef.current=false;
  if(scale<=.45||sample.current.requested)return;
  if(reduceRenderQuality(sample.current,delta,continuous))onSlow();
 },-2);return null;
}
export default function CampusScene({snapshot,active,onUnavailable,view="follow",placeId="library"}:{snapshot:Snapshot;active:boolean;onUnavailable:()=>void;view?:SchoolView;placeId?:string}){
 const [renderScale,setRenderScale]=useState(1);
 const reduceResolution=useCallback(()=>setRenderScale(.45),[]);
 const activityRef=useRef(false);
 const focus=useRef({x:0,z:0}),elements=useMemo(()=>new Map<string,HTMLSpanElement>(),[]);
 const follow=useCallback((x:number,z:number)=>{focus.current.x=x;focus.current.z=z;},[]);
 useEffect(()=>{const canvas=document.createElement("canvas"),context=canvas.getContext("webgl2");if(!context)onUnavailable();else context.getExtension("WEBGL_lose_context")?.loseContext();},[onUnavailable]);
 const occupied=SEATS.reduce((mask,seat,i)=>mask|(snapshot.occupied.includes(seat.id)?1<<i:0),0);
 return <div className={`school-scene school-view-${view}`} style={{position:"relative",width:"100%",height:"100%"}}>
  <Canvas shadows={renderScale===1} dpr={renderScale} frameloop={active?"demand":"never"} camera={{fov:43,position:view==='overview'?[87,124,133]:[13,16,20],far:500}}
    fallback={<p>3D is unavailable. You can open your courses directly.</p>}
    onCreated={({gl})=>gl.domElement.addEventListener("webglcontextlost",onUnavailable)}>
   <SchoolModel occupied={occupied}/>
   {snapshot.players.map(p=><Avatar key={p.id} player={p} self={p.id===snapshot.self} onPosition={follow} activityRef={activityRef}/>)}
   <Camera focus={focus} present={snapshot.players.some(p=>p.id===snapshot.self)} reducedMotion={typeof window!=="undefined"&&window.matchMedia("(prefers-reduced-motion: reduce)").matches} view={view} placeId={placeId} activityRef={activityRef}/>
   <Labels elements={elements} view={view}/>
   <RenderBudget scale={renderScale} onSlow={reduceResolution} activityRef={activityRef} active={active}/>
  </Canvas>
  <div className="school-signs" aria-hidden="true">{SCHOOL_PLACES.map(p=><span key={p.id} ref={el=>{if(el)elements.set(p.id,el);else elements.delete(p.id);}}>{p.name}</span>)}</div>
 </div>;
}

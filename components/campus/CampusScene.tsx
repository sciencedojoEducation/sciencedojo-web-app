"use client";
import {Canvas,useFrame,useThree} from "@react-three/fiber";
import {useCallback,useEffect,useLayoutEffect,useMemo,useRef,useState} from "react";
import {PerspectiveCamera,Vector3,type Group} from "three";
import {AVATAR_COLOURS,SEATS,type Player,type Snapshot} from "@/lib/campus/protocol";
import {SCHOOL_PLACES} from "@/lib/campus/school-layout";
import {advancePresentation,createPresentation,receivePresentation} from "@/lib/campus/presentation";
import {createRenderBudget,reduceRenderQuality} from "@/lib/campus/render-budget";
import {DEFAULT_LOOK,boundedLook,type CameraLook,type SchoolView} from "@/lib/campus/cube-experience";
import SchoolModel from "./SchoolModel";
import CubeArchitecture from "./CubeArchitecture";
import CubeEnvironment from "./CubeEnvironment";
type ViewPosition={current:{x:number;z:number;eye:number}};
type FrameActivity={current:boolean};
export type {SchoolView} from "@/lib/campus/cube-experience";
function Avatar({ player, self, onPosition, activityRef,hidden }: { player: Player; self: boolean; onPosition: (x: number, z: number,eye:number) => void; activityRef:FrameActivity;hidden:boolean }) {
  const group = useRef<Group>(null);
  const motion = useRef(createPresentation(player, 0));
  const invalidate = useThree(s => s.invalidate);
  useLayoutEffect(() => { receivePresentation(motion.current, player, performance.now()); invalidate(); }, [player, invalidate]);
  useFrame(() => {
    const view = motion.current;
    const moving = advancePresentation(view, performance.now());
    group.current?.position.set(view.x, player.seat ? .4 : 0, view.z);
    if (group.current) group.current.rotation.y = view.rotation;
    if (self) onPosition(view.x, view.z,player.seat?1.25:1.67);
    if (moving) { activityRef.current=true; invalidate(); }
  }, -1);
  return <group ref={group} visible={!hidden}>
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
function Camera({focus,present,reducedMotion,view,placeId,activityRef,angles}:{focus:ViewPosition;present:boolean;reducedMotion:boolean;view:SchoolView;placeId:string;activityRef:FrameActivity;angles:CameraLook}) {
 const camera=useThree(s=>s.camera),invalidate=useThree(s=>s.invalidate);
 const target=useMemo(()=>new Vector3(),[]),look=useMemo(()=>new Vector3(),[]),aim=useMemo(()=>new Vector3(),[]);
 const initializedRef=useRef(false);
 const place=SCHOOL_PLACES.find(p=>p.id===placeId)??SCHOOL_PLACES[7];
 useLayoutEffect(()=>{
  if(camera instanceof PerspectiveCamera)camera.setFocalLength(camera.getFilmHeight()/(2*Math.tan((view==="first-person"?70:43)*Math.PI/360)));
  invalidate();
 },[camera,view,invalidate]);
 useFrame((_,delta)=>{
  if(view==="first-person"){
   target.set(present?focus.current.x:0,present?focus.current.eye:1.67,present?focus.current.z:4);
   aim.copy(target).add(look.set(Math.sin(angles.yaw)*Math.cos(angles.pitch),Math.sin(angles.pitch),-Math.cos(angles.yaw)*Math.cos(angles.pitch)));
   initializedRef.current=true;camera.position.copy(target);camera.lookAt(aim);camera.updateMatrixWorld();return;
  }
  if(view==="exterior"){target.set(215,92,245);aim.set(0,61,1);}
  else if(view==="overview"){target.set(87,124,133);aim.set(0,0,0);}
  else if(view==="orbit"){
   const x=present&&!reducedMotion?focus.current.x:place.x,z=present&&!reducedMotion?focus.current.z:place.z,d=angles.distance;
   target.set(x-Math.sin(angles.yaw)*Math.cos(angles.pitch)*d,2+Math.sin(angles.pitch)*d,z+Math.cos(angles.yaw)*Math.cos(angles.pitch)*d);aim.set(x,2,z);
  }
  else{const x=view==="place"||reducedMotion?place.x:present?focus.current.x:0,z=view==="place"||reducedMotion?place.z:present?focus.current.z:0;
   target.set(x+13,16,z+20);aim.set(x,0,z-1);}
  const settled=camera.position.distanceToSquared(target)<.00001&&look.distanceToSquared(aim)<.00001;
  if(!initializedRef.current||reducedMotion||settled){initializedRef.current=true;camera.position.copy(target);look.copy(aim);}
  else{const step=1-Math.exp(-delta*4);camera.position.lerp(target,step);look.lerp(aim,step);activityRef.current=true;invalidate();}
  camera.lookAt(look);
  camera.updateMatrixWorld();
 });return null;
}
function Labels({elements,view}:{elements:Map<string,HTMLSpanElement>;view:SchoolView}){
 const point=useMemo(()=>new Vector3(),[]);
 useFrame(({camera,size})=>{
  for(const place of SCHOOL_PLACES){const el=elements.get(place.id);if(!el)continue;
   point.set(place.x,4.8,place.z-6);const near=point.distanceTo(camera.position)<47;
   point.project(camera);const x=(point.x+1)*size.width/2,y=(1-point.y)*size.height/2;
   const visible=view!=="exterior"&&view!=="first-person"&&point.z>-1&&point.z<1&&x>0&&x<size.width&&y>0&&y<size.height&&(view==='overview'||near);
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
export default function CampusScene({snapshot,active,onUnavailable,view="follow",placeId="library",hour=12,look=DEFAULT_LOOK,onLookChange}:{snapshot:Snapshot;active:boolean;onUnavailable:()=>void;view?:SchoolView;placeId?:string;hour?:number;look?:CameraLook;onLookChange?:(next:CameraLook)=>void}){
 const [renderScale,setRenderScale]=useState(1);
 const reduceResolution=useCallback(()=>setRenderScale(.45),[]);
 const activityRef=useRef(false);
 const focus=useRef({x:0,z:4,eye:1.67}),elements=useMemo(()=>new Map<string,HTMLSpanElement>(),[]);
 const dragRef=useRef<{x:number;y:number}|null>(null);
 const follow=useCallback((x:number,z:number,eye:number)=>{focus.current={x,z,eye};},[]);
 const interactive=view==="first-person"||view==="orbit";
 const angles=boundedLook(look,view);
 useEffect(()=>{const canvas=document.createElement("canvas"),context=canvas.getContext("webgl2");if(!context)onUnavailable();else context.getExtension("WEBGL_lose_context")?.loseContext();},[onUnavailable]);
 const occupied=SEATS.reduce((mask,seat,i)=>mask|(snapshot.occupied.includes(seat.id)?1<<i:0),0);
 return <div className={`school-scene school-view-${view}`} style={{position:"relative",width:"100%",height:"100%",touchAction:interactive?"none":"auto",cursor:interactive?"grab":"default"}}
   onPointerDown={event=>{if(!interactive||!active||event.button!==0)return;event.preventDefault();event.currentTarget.parentElement?.focus();event.currentTarget.setPointerCapture(event.pointerId);dragRef.current={x:event.clientX,y:event.clientY};}}
   onPointerMove={event=>{const previous=dragRef.current;if(!previous||!interactive||!active)return;onLookChange?.(boundedLook({...angles,yaw:angles.yaw+(event.clientX-previous.x)*.006,pitch:angles.pitch-(event.clientY-previous.y)*.005},view));dragRef.current={x:event.clientX,y:event.clientY};}}
   onPointerUp={event=>{dragRef.current=null;if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);}}
   onPointerCancel={()=>{dragRef.current=null;}} onLostPointerCapture={()=>{dragRef.current=null;}}>
  <Canvas shadows dpr={renderScale} frameloop={active?"demand":"never"} camera={{fov:view==="first-person"?70:43,position:view==='exterior'?[215,92,245]:view==='overview'?[87,124,133]:[13,16,20],far:2200,near:.08}}
    fallback={<p>3D is unavailable. You can open your courses directly.</p>}
    onCreated={({gl})=>gl.domElement.addEventListener("webglcontextlost",onUnavailable)}>
   <CubeEnvironment hour={hour} cutaway={view==="overview"}/><SchoolModel occupied={occupied} detailedShadows={renderScale===1}/><CubeArchitecture cutaway={view==="overview"}/>
   {snapshot.players.map(p=><Avatar key={p.id} player={p} self={p.id===snapshot.self} onPosition={follow} activityRef={activityRef} hidden={view==="first-person"&&p.id===snapshot.self}/>)}
   <Camera focus={focus} present={snapshot.players.some(p=>p.id===snapshot.self)} reducedMotion={typeof window!=="undefined"&&window.matchMedia("(prefers-reduced-motion: reduce)").matches} view={view} placeId={placeId} activityRef={activityRef} angles={angles}/>
   <Labels elements={elements} view={view}/>
   <RenderBudget scale={renderScale} onSlow={reduceResolution} activityRef={activityRef} active={active}/>
  </Canvas>
  <div className="school-signs" aria-hidden="true">{SCHOOL_PLACES.map(p=><span key={p.id} ref={el=>{if(el)elements.set(p.id,el);else elements.delete(p.id);}}>{p.name}</span>)}</div>
  {view==="first-person"&&<span className="cube-crosshair" aria-hidden="true"/>}
  {interactive&&<span className="cube-look-hint">Drag to look · Q / E to turn</span>}
 </div>;
}

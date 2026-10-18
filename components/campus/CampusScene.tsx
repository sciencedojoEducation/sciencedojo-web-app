"use client";
import {Canvas,useFrame,useThree} from "@react-three/fiber";
import {useCallback,useEffect,useLayoutEffect,useMemo,useRef,useState} from "react";
import {PerspectiveCamera,Vector3,type Group} from "three";
import {AVATAR_COLOURS,SEATS,type Player,type Snapshot} from "@/lib/campus/protocol";
import {SCHOOL_PLACES,schoolPlaceAt,floorHeight,postureEye} from "@/lib/campus/school-layout";
import {advancePresentation,createPresentation,receivePresentation} from "@/lib/campus/presentation";
import {createRenderBudget,initialRenderScale,reduceRenderQuality} from "@/lib/campus/render-budget";
import {DEFAULT_LOOK,type CameraLook,type SchoolView} from "@/lib/campus/cube-experience";
import CampusTransport from "./CampusTransport";
import SchoolModel from "./SchoolModel";
import CubeArchitecture from "./CubeArchitecture";
import CubeEnvironment from "./CubeEnvironment";
import AvatarBody from "./AvatarBody";
import {useSceneLook} from "./useSceneLook";
import BasketballCourt from "./BasketballCourt";
import {basketballSnapshot,createBasketball,type ShotControl} from "@/lib/campus/basketball";
const DEFAULT_BALL=basketballSnapshot(createBasketball(),[]);
type ViewPosition={current:{x:number;z:number;eye:number}};
type FrameActivity={current:boolean};
export type {SchoolView} from "@/lib/campus/cube-experience";
function Avatar({ player, self, onPosition, activityRef,hidden,reducedMotion,ballHeld }: { player: Player; self: boolean; onPosition: (x: number, z: number,eye:number) => void; activityRef:FrameActivity;hidden:boolean;reducedMotion:boolean;ballHeld:boolean }) {
  const group = useRef<Group>(null);
  const motion = useRef(createPresentation(player, 0));
  const invalidate = useThree(s => s.invalidate);
  useLayoutEffect(() => { receivePresentation(motion.current, player, performance.now()); invalidate(); }, [player, invalidate]);
  useFrame(() => {
    const view = motion.current;
    const moving = advancePresentation(view, performance.now());
    group.current?.position.set(view.x, .1+view.elevation, view.z);
    if (group.current) group.current.rotation.y = view.rotation;
    if (self) onPosition(view.x, view.z,view.elevation+(player.seat?1.25:postureEye(player.stance)));
    if (moving) { activityRef.current=true; invalidate(); }
  }, -1);
  return <group name={self?"campus-self-avatar":"campus-avatar"} ref={group} visible={!hidden}>
    <AvatarBody colour={AVATAR_COLOURS[player.colour]} motion={motion} seated={!!player.seat} hidden={hidden} reducedMotion={reducedMotion} activityRef={activityRef} ballHeld={ballHeld} stance={player.stance}/>
    {player.travel==="lift"&&<><mesh name="campus-lift-platform" position={[0,-.05,0]}><boxGeometry args={[2.8,.12,2.8]}/><meshLambertMaterial color="#8bac9f"/></mesh><mesh name="campus-lift-capsule" position={[0,1.2,0]}><boxGeometry args={[2.8,2.4,2.8]}/><meshBasicMaterial color="#b7e3d5" transparent opacity={.12} depthWrite={false}/></mesh></>}
    {!player.seat && <mesh position={[0, .015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[.4, 16]} /><meshBasicMaterial color="#25483d" transparent opacity={.15} depthWrite={false} />
    </mesh>}
    {self && <mesh position={[0, .02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[.43, .52, 24]} /><meshBasicMaterial color="#205e52" />
    </mesh>}
  </group>;
}
function Camera({focus,present,reducedMotion,view,placeId,activityRef,angles}:{focus:ViewPosition;present:boolean;reducedMotion:boolean;view:SchoolView;placeId:string;activityRef:FrameActivity;angles:{current:CameraLook}}) {
 const camera=useThree(s=>s.camera),invalidate=useThree(s=>s.invalidate);
 const target=useMemo(()=>new Vector3(),[]),look=useMemo(()=>new Vector3(),[]),aim=useMemo(()=>new Vector3(),[]);
 const initializedRef=useRef(false);
 const place=SCHOOL_PLACES.find(p=>p.id===placeId)??SCHOOL_PLACES[7];
 useLayoutEffect(()=>{
  if(camera instanceof PerspectiveCamera)camera.setFocalLength(camera.getFilmHeight()/(2*Math.tan((view==="first-person"?70:43)*Math.PI/360)));
  invalidate();
 },[camera,view,invalidate]);
 useFrame((_,delta)=>{
  const facing=angles.current;
  if(view==="first-person"){
   target.set(present?focus.current.x:0,present?focus.current.eye:1.67,present?focus.current.z:4);
   aim.copy(target).add(look.set(Math.sin(facing.yaw)*Math.cos(facing.pitch),Math.sin(facing.pitch),-Math.cos(facing.yaw)*Math.cos(facing.pitch)));
   initializedRef.current=true;camera.position.copy(target);camera.lookAt(aim);camera.updateMatrixWorld();return;
  }
  if(view==="exterior"){target.set(215,92,245);aim.set(0,61,1);}
  else if(view==="overview"){target.set(87,124,133);aim.set(0,0,0);}
  else if(view==="orbit"){
   const x=present&&!reducedMotion?focus.current.x:place.x,z=present&&!reducedMotion?focus.current.z:place.z,d=facing.distance;
   target.set(x-Math.sin(facing.yaw)*Math.cos(facing.pitch)*d,(present?focus.current.eye:floorHeight(place.floor)+1.67)+.33+Math.sin(facing.pitch)*d,z+Math.cos(facing.yaw)*Math.cos(facing.pitch)*d);aim.set(x,(present?focus.current.eye:floorHeight(place.floor)+1.67)+.33,z);
   // Confirmed avatar poses already provide smooth following. Apply orbit
   // rotation immediately so WASD follows the view the player actually sees.
   initializedRef.current=true;camera.position.copy(target);look.copy(aim);camera.lookAt(look);camera.updateMatrixWorld();return;
  }
  else{const x=view==="place"||reducedMotion?place.x:present?focus.current.x:0,z=view==="place"||reducedMotion?place.z:present?focus.current.z:0;
   const y=view==="place"||reducedMotion?floorHeight(place.floor):present?focus.current.eye-1.67:0;target.set(x+9,y+9,z+13);aim.set(x,y+1,z-1);}
  const settled=camera.position.distanceToSquared(target)<.00001&&look.distanceToSquared(aim)<.00001;
  if(!initializedRef.current||reducedMotion||settled){initializedRef.current=true;camera.position.copy(target);look.copy(aim);}
  else{const step=1-Math.exp(-delta*4);camera.position.lerp(target,step);look.lerp(aim,step);activityRef.current=true;invalidate();}
  camera.lookAt(look);
  camera.updateMatrixWorld();
 });return null;
}
function Labels({elements,view,floor}:{elements:Map<string,HTMLSpanElement>;view:SchoolView;floor:number}){
 const point=useMemo(()=>new Vector3(),[]);
 useFrame(({camera,size})=>{
  for(const place of SCHOOL_PLACES){const el=elements.get(place.id);if(!el)continue;
   point.set(place.x,floorHeight(place.floor)+4.8,place.z-6);const near=point.distanceTo(camera.position)<47;
   point.project(camera);const x=(point.x+1)*size.width/2,y=(1-point.y)*size.height/2;
   const visible=(place.floor??0)===floor&&view!=="exterior"&&view!=="first-person"&&point.z>-1&&point.z<1&&x>0&&x<size.width&&y>0&&y<size.height&&(view==='overview'||near);
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
export default function CampusScene({snapshot,active,onUnavailable,view="follow",placeId="library",hour=12,look=DEFAULT_LOOK,onLookChange,canLock=true,onRelease,charge,charging=false,shotPower=.55}:{snapshot:Snapshot;active:boolean;onUnavailable:()=>void;view?:SchoolView;placeId?:string;hour?:number;look?:CameraLook;onLookChange?:(next:CameraLook)=>void;canLock?:boolean;onRelease?:()=>void;charge?:{current:ShotControl};charging?:boolean;shotPower?:number}){
 const [renderScale,setRenderScale]=useState(1);
 const reduceResolution=useCallback(()=>setRenderScale(.45),[]);
 const activityRef=useRef(false);
 const idleCharge=useRef<ShotControl>({started:null,power:.55});
 const focus=useRef({x:0,z:4,eye:1.67}),elements=useMemo(()=>new Map<string,HTMLSpanElement>(),[]);
 const follow=useCallback((x:number,z:number,eye:number)=>{focus.current={x,z,eye};},[]);
 const interactive=view==="first-person"||view==="orbit";
 const {element:sceneElement,angles:cameraAngles,bindInvalidate,mode:lookMode,handlers:lookHandlers}=useSceneLook({look,view,active,canLock,onLookChange,onRelease});
 useEffect(()=>{const canvas=document.createElement("canvas"),context=canvas.getContext("webgl2");if(!context)onUnavailable();else context.getExtension("WEBGL_lose_context")?.loseContext();},[onUnavailable]);
 const current=snapshot.players.find(p=>p.id===snapshot.self);
 const shownFloor=view==="exterior"?2:view==="place"||view==="overview"?SCHOOL_PLACES.find(p=>p.id===placeId)?.floor??0:current?.travel?Math.max(current.floor??0,Math.ceil((current.elevation??0)/12)):current?.floor??0;
 const occupied=SEATS.reduce((mask,seat,i)=>mask|(snapshot.occupied.includes(seat.id)?1<<i:0),0);
 const reducedMotion=typeof window!=="undefined"&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
 return <div ref={sceneElement} {...lookHandlers} className={`school-scene school-view-${view}`} style={{position:"relative",width:"100%",height:"100%",touchAction:interactive?"none":"auto",cursor:view==="first-person"?lookMode==="locked"?"none":"crosshair":interactive?"grab":"default"}}>
  <Canvas shadows dpr={renderScale} frameloop={active?"demand":"never"} camera={{fov:view==="first-person"?70:43,position:view==='exterior'?[215,92,245]:view==='overview'?[87,124,133]:[13,16,20],far:2200,near:.08}}
    fallback={<p>3D is unavailable. You can open your courses directly.</p>}
    onCreated={({gl,invalidate})=>{
     bindInvalidate(invalidate);
     const context=gl.getContext(),info=context.getExtension("WEBGL_debug_renderer_info");
     if(info)setRenderScale(initialRenderScale(String(context.getParameter(info.UNMASKED_RENDERER_WEBGL))));
     gl.domElement.addEventListener("webglcontextlost",onUnavailable);
    }}>
   <CubeEnvironment hour={hour} cutaway={view==="overview"}/><SchoolModel occupied={occupied} detailedShadows={renderScale===1} frosted={snapshot.frosted} visibleFloor={shownFloor}/><CampusTransport hour={hour} reducedMotion={reducedMotion} activityRef={activityRef} floor={shownFloor} animate={snapshot.players.some(p=>p.travel==="escalator")}/><CubeArchitecture cutaway={view==="overview"}/>
   {snapshot.players.map(p=><Avatar key={p.id} player={p} self={p.id===snapshot.self} onPosition={follow} activityRef={activityRef} hidden={(view==="first-person"&&p.id===snapshot.self)||(view!=="exterior"&&(p.elevation??floorHeight(p.floor))>shownFloor*12+3&&p.id!==snapshot.self)} reducedMotion={reducedMotion} ballHeld={snapshot.basketball?.holder===p.id}/>)}
   <BasketballCourt ball={snapshot.basketball??DEFAULT_BALL} players={snapshot.players} self={snapshot.self} view={view} angles={cameraAngles} focus={focus} charge={charge??idleCharge} charging={charging} power={shotPower} reducedMotion={reducedMotion} activityRef={activityRef}/>
   <Camera focus={focus} present={snapshot.players.some(p=>p.id===snapshot.self)} reducedMotion={reducedMotion} view={view} placeId={reducedMotion&&current&&["follow","orbit"].includes(view)?schoolPlaceAt(current)?.id??placeId:placeId} activityRef={activityRef} angles={cameraAngles}/>
   <Labels elements={elements} view={view} floor={shownFloor}/>
   <RenderBudget scale={renderScale} onSlow={reduceResolution} activityRef={activityRef} active={active}/>
  </Canvas>
  <div className="school-signs" aria-hidden="true">{SCHOOL_PLACES.map(p=><span key={p.id} ref={el=>{if(el)elements.set(p.id,el);else elements.delete(p.id);}}>{p.name}</span>)}</div>
  {view==="first-person"&&<span className="cube-crosshair" aria-hidden="true"/>}
  {interactive&&<span className="cube-look-hint">{view==="first-person"?(lookMode==="locked"?"Mouse captured · 360° look · E to interact · Esc releases":lookMode==="paused"?"Click school to resume mouse look · E to interact":"Mouse to look · Edges keep turning · Click for 360° · Esc pauses"):"Drag to orbit · Use look buttons to turn"}</span>}
 </div>;
}

"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Component,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { connectCampus, requestCampusAdmission, type CampusConnection } from "@/lib/campus/connection";
import {availableJourneys,nearbyGlassSwitch} from "@/lib/campus/locomotion";
import {createInputDispatcher} from "@/lib/campus/input-dispatch";
import type {GraphicsQuality} from "@/lib/campus/render-budget";
import { SEATS, type Snapshot } from "@/lib/campus/protocol";
import { SCHOOL_PLACES,SCHOOL_FLOORS,SCHOOL_CONNECTORS,floorHeight, type Stance, schoolPlaceAt, schoolRoute, type Point } from "@/lib/campus/school-layout";
import {DEFAULT_LOOK,boundedLook,cameraDirection,keyboardDirection,clockLabel,schoolSky,type CameraLook,type SchoolView} from "@/lib/campus/cube-experience";
import "./campus.css";
import {useCampusFullscreen} from "./useCampusFullscreen";
import BasketballHud from "./BasketballHud";
import {HOOPS,COURT,onCourt,canTakeBasketball,basketballAim,currentShotPower,suggestedShot,type ShotControl} from "@/lib/campus/basketball";

const subscribeClock=(notify:()=>void)=>{const timer=setInterval(notify,1000);return()=>clearInterval(timer);};
const readLocalHour=()=>{const now=new Date();return now.getHours()+now.getMinutes()/60;};
const serverHour=()=>12;

const Scene = dynamic(() => import("./CampusScene"), {
  ssr: false,
  loading: () => <div className="campus-loading">Preparing your school…</div>,
});
class CanvasBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <p className="campus-loading">
        3D could not start. Use the accessible school controls or open your
        courses directly.
      </p>
    ) : (
      this.props.children
    );
  }
}
export type CampusCourse = { key: string; title: string };
export default function CampusClient({
  courses,
  dashboardHref = "/dashboard/user",
  initialBlocked = [],
}: {
  courses: CampusCourse[];
  dashboardHref?: string;
  initialBlocked?: string[];
}) {
  const requestInput=useRef<() => void>(() => {});
  const [snapshot, setSnapshot] = useState<Snapshot>({
    self: "",
    players: [],
    occupied: [],
  });
  const [connection, setConnection] = useState("Ready to enter"),
    [connected, setConnected] = useState(false);
  const [notice, setNotice] = useState(""),
    [hub, setHub] = useState(false),
    [course, setCourse] = useState("");
  const [hubTool,setHubTool]=useState<"courses"|"dashboard">("courses"),[dashboardReady,setDashboardReady]=useState(false);
  const [identityRead, setIdentityRead] = useState(false),
    [no3d, setNo3d] = useState(false),
    [blocked, setBlocked] = useState(initialBlocked);
  const [reason, setReason] = useState("harassment"),
    [busy, setBusy] = useState(false),
    [help, setHelp] = useState(false);
  const [view, setView] = useState<SchoolView>("exterior");
  const [graphics,setGraphics]=useState<GraphicsQuality>("auto");
  const [look,setLook]=useState<CameraLook>(DEFAULT_LOOK);
  const rememberedLook=useRef<CameraLook>(DEFAULT_LOOK);
  const rememberLook=useCallback((next:CameraLook)=>{rememberedLook.current=next;cameraRef.current.yaw=next.yaw;requestInput.current();},[]);
  const [usedDesk,setUsedDesk]=useState(false);
  const [charging,setCharging]=useState(false),[shotPower,setShotPower]=useState(.55);
  const [targetHoop,setTargetHoop]=useState<"north"|"south">("north");
  const ballCharge=useRef<ShotControl>({started:null,power:.55});
  const lastInteraction=useRef(0);
  const [manualHour,setManualHour]=useState<number|null>(null);
  const liveHour=useSyncExternalStore(subscribeClock,readLocalHour,serverHour),hour=manualHour??liveHour;
  const sky=schoolSky(hour);
  const cameraRef=useRef({view: "exterior" as SchoolView,yaw:0});
  useLayoutEffect(()=>{cameraRef.current={view,yaw:rememberedLook.current.yaw};},[view,look.yaw]);
  const [selectedPlace, setSelectedPlace] = useState("library"), [walkingTo, setWalkingTo] = useState("");
  const navigation = useRef<{ points: Point[]; name: string } | null>(null);
  const latestSelf = useRef<Point | null>(null);
  const motionIntent=useRef({run:false,jump:false,stance:"stand" as Stance});
  const [stance,setStance]=useState<Stance>("stand");
  const [touchRun,setTouchRun]=useState(false);const touchRunMode=useRef(false);
  const posture=(next:Stance)=>{motionIntent.current.stance=next;setStance(next);stage.current?.focus();requestInput.current();};
  const jump=()=>{motionIntent.current.jump=true;motionIntent.current.stance="stand";setStance("stand");stage.current?.focus();requestInput.current();};
  const heldMovementKeys=useRef(new Set<string>());
  const room = useRef<CampusConnection | null>(null),
    direction = useRef({ x: 0, z: 0 }),
    stepTimer = useRef<ReturnType<typeof setTimeout> | null>(null),
    pointerStarted = useRef(0),
    sequence = useRef(0),
    connecting = useRef(false),
    admissionRequest = useRef<AbortController | null>(null),
    generation = useRef(0);
  const people = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null),
    frame = useRef<HTMLIFrameElement>(null),
    hubButton = useRef<HTMLButtonElement>(null),
    hubDialog = useRef<HTMLDialogElement>(null);
  const self = snapshot.players.find((p) => p.id === snapshot.self);
  const currentPlace = self ? schoolPlaceAt(self) : undefined;
  const selected = SCHOOL_PLACES.find(p => p.id === selectedPlace)!;
  const visibleSeats = SEATS.filter(s => s.place === (currentPlace?.id ?? "library"));
  const walkToPlace = () => {
    if (!self || self.seat||self.travel) { setNotice("Stand up before walking to another place."); return; }
    motionIntent.current.stance="stand";setStance("stand");
    const different=(self.floor??0)!==(selected.floor??0);
    const target=different?{x:SCHOOL_CONNECTORS[0].x,z:SCHOOL_CONNECTORS[0].z,floor:self.floor}:{x:selected.x,z:selected.z+2,floor:selected.floor};
    const points = schoolRoute(self,target);
    if (!points.length) { setNotice("Use the direction controls to reach an open path first."); return; }
    navigation.current = { points, name: different?`Glass elevator · choose level ${selected.floor??0}`:selected.name };setWalkingTo(selected.name);setView("follow");stage.current?.focus();
  };
  const walkToConnector=(id:string,reverse=false)=>{
    if(!self||self.seat||self.travel)return;
    const c=SCHOOL_CONNECTORS.find(c=>c.id===id)!;stopMovement();motionIntent.current.stance="stand";setStance("stand");
    const points=schoolRoute(self,{x:reverse?c.exitX:c.x,z:reverse?c.exitZ:c.z,floor:self.floor});
    if(!points.length){setNotice("Move to an open path first.");return;}
    navigation.current={points,name:c.name};setWalkingTo(c.name);setView("follow");stage.current?.focus();
  };
  const unavailable = useCallback(() => setNo3d(true), []);
  const stopMovement = useCallback(() => {
    if (stepTimer.current) clearTimeout(stepTimer.current);
    stepTimer.current = null;
    direction.current = { x: 0, z: 0 };
    heldMovementKeys.current.clear();motionIntent.current.run=false;motionIntent.current.jump=false;
    navigation.current = null;setWalkingTo("");
    ballCharge.current.started=null;setCharging(false);
    requestInput.current();
  }, []);
  const {shell,button:fullscreenButton,immersive,enter:enterFullscreen,exit:exitFullscreen}=useCampusFullscreen(stopMovement);
  const [schoolPanel,setSchoolPanel]=useState<"map"|"sky"|"desk"|"people"|"controls"|null>(null);
  const openPanel=(panel:typeof schoolPanel)=>{
    stopMovement();document.exitPointerLock?.();setSchoolPanel(panel);
    if (!immersive && panel==="people") people.current?.focus();
  };
  const closePanel=()=>{setSchoolPanel(null);stage.current?.focus();};
  useEffect(()=>{
    if(!immersive||!schoolPanel)return;
    shell.current?.querySelector<HTMLElement>(`[data-campus-panel="${schoolPanel}"]`)?.focus();
  },[immersive,schoolPanel,shell]);
  const stepDirection = useCallback((x: number, z: number) => {
    stopMovement();
    direction.current = { x, z };
    requestInput.current();
    // A native button click must last long enough to reach the input loop.
    stepTimer.current = setTimeout(stopMovement, 300);
  }, [stopMovement]);
  const changeLook=(next:CameraLook)=>{rememberLook(next);setLook(next);};
  const chooseCamera=(next:SchoolView)=>{
    stopMovement();setView(next);
    changeLook(boundedLook({...rememberedLook.current,pitch:next==="first-person"?0:next==="orbit"?.55:rememberedLook.current.pitch},next));
    stage.current?.focus();
  };
  const turn=(yaw:number,pitch=0)=>changeLook(boundedLook({...rememberedLook.current,yaw:rememberedLook.current.yaw+yaw,pitch:rememberedLook.current.pitch+pitch},view));
  useEffect(() => {
    if (hub) hubDialog.current?.showModal();
    else hubDialog.current?.close();
  }, [hub]);
  const send = useCallback(
    (type: string, data: unknown) => {
      if (room.current && connected) room.current.send(type, data);
    },
    [connected],
  );
  const enter = async () => {
    if (connecting.current || connected) return;
    connecting.current = true;
    const attempt = generation.current;
    const controller = new AbortController();
    admissionRequest.current = controller;
    setNotice("");
    setUsedDesk(false);touchRunMode.current=false;setTouchRun(false);
    setConnection("Connecting…");
    try {
      const admission = await requestCampusAdmission({ signal: controller.signal });
      const next = await connectCampus(admission);
      if (attempt !== generation.current) {
        void next.leave();
        return;
      }
      next.onMessage<Snapshot>("snapshot", (data) => {
        const nextSelf=data.players.find(p=>p.id===data.self)??null;
        if(nextSelf&&latestSelf.current&&(nextSelf.floor??0)!==(latestSelf.current.floor??0)){
          stopMovement();motionIntent.current.stance="stand";setStance("stand");
          setSelectedPlace(previous=>(SCHOOL_PLACES.find(p=>p.id===previous)?.floor??0)===(nextSelf.floor??0)?previous:SCHOOL_PLACES.find(p=>(p.floor??0)===(nextSelf.floor??0))!.id);
        }
        latestSelf.current = nextSelf;
        if(data.basketball?.holder!==data.self&&ballCharge.current.started!==null){ballCharge.current.started=null;setCharging(false);}
        setSnapshot(data);
      });
      next.onMessage<string>("notice", (data) => setNotice(data));
      next.onLeave(() => {
        if (room.current !== next) return;
        room.current = null;
        setConnected(false);
        setSnapshot({ self: "", players: [], occupied: [] });
        setConnection("Disconnected — your course stays open");
        stopMovement();
      });
      next.onError(() =>
        setNotice(
          "Connection interrupted. Your course work stays in the Study Hub.",
        ),
      );
      room.current = next;
      sequence.current = 0;
      setConnected(true);
      setConnection("In the school");
      setView("follow");
      stage.current?.focus();
    } catch (error) {
      if (attempt !== generation.current) return;
      setConnection("Unable to enter");
      setNotice(error instanceof Error ? error.message : "Please try again.");
    } finally {
      if (admissionRequest.current === controller) {
        admissionRequest.current = null;
        connecting.current = false;
      }
    }
  };
  useEffect(() => {
    const dispatcher=createInputDispatcher(() => {
      if(!room.current) return null;
      const route=navigation.current;
      return {...(["first-person","orbit"].includes(cameraRef.current.view)&&!route
        ?cameraDirection(direction.current.x,direction.current.z,cameraRef.current.yaw):direction.current),
        run:motionIntent.current.run||touchRunMode.current,jump:motionIntent.current.jump,stance:motionIntent.current.stance};
    }, input => {
      room.current?.send("input",{...input,seq:sequence.current++});
      motionIntent.current.jump=false;
    });
    requestInput.current=dispatcher.request;
    const timer = setInterval(() => {
      const route = navigation.current, position = latestSelf.current;
      if (route && position) {
        while (route.points.length && Math.hypot(route.points[0].x - position.x, route.points[0].z - position.z) < .3) route.points.shift();
        if (!route.points.length) { navigation.current = null;setWalkingTo("");direction.current = { x: 0, z: 0 };setNotice(`Arrived at ${route.name}.`); }
        else { const dx = route.points[0].x - position.x, dz = route.points[0].z - position.z, length = Math.max(1, Math.hypot(dx, dz));direction.current = { x: dx / length, z: dz / length }; }
      }
      dispatcher.request();
    }, 100);
    const stop = stopMovement;
    window.addEventListener("blur", stop);
    document.addEventListener("visibilitychange", stop);
    return () => {
      // Intentionally invalidate the latest attempt counter; this is not a DOM ref.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      generation.current++;
      admissionRequest.current?.abort();
      stop();
      dispatcher.dispose();requestInput.current=()=>{};
      clearInterval(timer);
      window.removeEventListener("blur", stop);
      document.removeEventListener("visibilitychange", stop);
      void room.current?.leave();
    };
  }, [stopMovement]);
  const leave = () => {
    generation.current++;
    admissionRequest.current?.abort();
    connecting.current = false;
    stopMovement();
    void room.current?.leave();
    room.current = null;
    setConnected(false);
    setSnapshot({ self: "", players: [], occupied: [] });
    setConnection("You left the school");
  };
  const safety = async (target: string, action: string) => {
    setBusy(true);
    try {
      const response = await fetch("/api/campus/safety", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ target, action, reason }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (action === "block") setBlocked((prev) => [...prev, target]);
      if (action === "unblock")
        setBlocked((prev) => prev.filter((id) => id !== target));
      room.current?.send("refresh");
      setNotice(
        action === "report"
          ? "Report saved for the session moderator. Contact your supervisor if you need immediate help."
          : "Your presence preference was saved.",
      );
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Action failed. Contact your supervisor.",
      );
    } finally {
      setBusy(false);
    }
  };
  const openHub = () => {
    stopMovement();
    document.exitPointerLock?.();
    setSchoolPanel(null);
    send("action", "study");
    setUsedDesk(true);
    setHub(true);
  };
  const nearbyDesk = self && !self.seat ? SEATS
    .filter(seat => (seat.floor??0)===(self.floor??0)&&!self.travel&&Math.abs((self.elevation??0)-floorHeight(self.floor))<.05&&!snapshot.occupied.includes(seat.id) && Math.hypot(self.x-seat.x,self.z-seat.z)<=2.1)
    .sort((a,b)=>Math.hypot(self.x-a.x,self.z-a.z)-Math.hypot(self.x-b.x,self.z-b.z))[0] : undefined;
  const ball=snapshot.basketball,mine=!!self&&ball?.holder===self.id;
  const atCourt=!!self&&onCourt(self),takeBall=!!ball&&!!self&&canTakeBasketball(ball,self);
  const setPower=(power:number)=>{ballCharge.current.power=power;setShotPower(power);};
  const shootBall=(power=ballCharge.current.power)=>{
    ballCharge.current.started=null;setCharging(false);
    if(!connected||hub||!mine||!atCourt)return;
    setPower(power);
    send("basketball",{action:"shoot",...basketballAim(rememberedLook.current.yaw,rememberedLook.current.pitch),power});
    stage.current?.focus();
  };
  const startShot=()=>{
    if(!connected||hub||!mine||ballCharge.current.started!==null)return;
    if(navigation.current){navigation.current=null;direction.current={x:0,z:0};setWalkingTo("");}
    ballCharge.current.started=performance.now();setCharging(true);
  };
  const faceHoop=(side:"north"|"south")=>{
    if(!self)return;
    const hoop=HOOPS.find(h=>h.id===side)!;
    setTargetHoop(side);
    stopMovement();setView("first-person");
    changeLook(boundedLook({...rememberedLook.current,yaw:Math.atan2(hoop.x-self.x,self.z-hoop.z),pitch:Math.atan2(COURT.rimY-1.67,Math.max(.1,Math.hypot(hoop.x-self.x,hoop.z-self.z)) )},"first-person"));
    stage.current?.focus();
  };
  const journeys=self?availableJourneys(self):[];
  const switchRoom=self?nearbyGlassSwitch(self):undefined;
  const journey=journeys.find(j=>j.to===(selected.floor??0))??journeys[0];
  const travel=(via:string,to:number)=>{stopMovement();send("environment",{action:"travel",via,to});stage.current?.focus();};
  const toggleGlass=(id:string)=>{stopMovement();send("environment",{action:"glass",room:id});stage.current?.focus();};
  const courtInteraction=atCourt&&!!ball;
  const interactionLabel = self?.travel?`Riding ${self.travel}…`:journey?`${journey.connector.name} → level ${journey.to}`:switchRoom?`${snapshot.frosted?.includes(switchRoom.id)?"Clear":"Screen"} room glass`:courtInteraction?(mine?charging?"Release E to shoot":"Hold E, release to shoot":takeBall?"Pick up basketball":ball.mode==="held"?"Ball in use · wait for a rebound":"Move near the basketball"):self?.seat ? usedDesk ? "Stand up" : "Use computer" : nearbyDesk ? `Sit at ${nearbyDesk.name}` : "Move near a free study desk";
  const interact = () => {
    if (!connected || hub || performance.now()-lastInteraction.current<400) return;
    lastInteraction.current=performance.now();
    stopMovement();
    if(self?.travel)return;
    if(journey){travel(journey.connector.id,journey.to);return;}
    if(switchRoom){toggleGlass(switchRoom.id);return;}
    if(courtInteraction){
      if(mine)shootBall();
      else if(takeBall){send("basketball",{action:"take"});faceHoop(suggestedShot(self!).hoop.id);}
      return;
    }
    if (self?.seat) {
      if (usedDesk) { send("action","stand");setUsedDesk(false); }
      else openHub();
    } else if (nearbyDesk) { setUsedDesk(false);send("sit",nearbyDesk.id); }
  };
  const closeHub = () => {
    // Retain the mounted frame and its DOM, including unsaved local answers and in-flight saves.
    hubDialog.current?.close();
    setHub(false);
    send("action", "close");
    // A retained iframe's Escape listener may predate this camera/fullscreen mode.
    if (shell.current?.classList.contains("campus-immersive")||cameraRef.current.view==="first-person") stage.current?.focus();
    else hubButton.current?.focus();
  };
  return (
    <main ref={shell} className={`campus-shell cube-campus${immersive?" campus-immersive":""}`}>
      {immersive && <nav className="campus-immersive-nav" aria-label="Fullscreen school tools">
        <span className="campus-immersive-brand">sciencedojo.</span>
        <button className="secondary" aria-pressed={schoolPanel==="map"} onClick={()=>openPanel("map")}>School map</button>
        <button className="secondary" aria-pressed={schoolPanel==="sky"} onClick={()=>openPanel("sky")}>Sky &amp; view</button>
        <button className="secondary" aria-pressed={schoolPanel==="desk"} onClick={()=>openPanel("desk")}>Study desk</button>
        <Link href={dashboardHref} target="_blank" rel="noopener noreferrer">My dashboard ↗</Link>
      </nav>}
      {immersive && schoolPanel && <button className="campus-panel-close secondary" aria-label="Close school panel" onClick={closePanel}>×</button>}
      <header className="campus-header">
        <Link className="campus-brand" href={dashboardHref}>
          sciencedojo<span>.</span>
        </Link>
        <span className="campus-pilot">VIRTUAL SCIENCEDOJO · BETA</span>
        <Link href={dashboardHref} className="campus-link">
          My dashboard ↗
        </Link>
      </header>
      <div className="campus-layout">
        <section className="campus-world-panel" aria-label="Shared school">
          <div className="campus-world-heading">
            <div>
              <p className="campus-eyebrow">The Cube · A school without ordinary walls</p>
              <h1>A world of possibility.<br/>Inside one Cube.</h1>
              <p className="campus-beta-note">Glass, green spaces and a sky that changes with your day. Three levels, 27 places and room to find your focus.</p>
            </div>
            <span className="campus-presence">
              <i />
              {
                snapshot.players.filter((p) => !blocked.includes(p.id)).length
              }{" "}
              here
            </span>
          </div>
          <div
            className="campus-stage"
            tabIndex={0}
            ref={stage}
            role="region"
            aria-label="3D school. Use arrow keys or WASD to walk. In First person, move the mouse to look. Shift runs, Space jumps, C crouches, Z lies prone. E interacts with a nearby desk, glass switch, lift or basketball; hold and release E to shoot. Escape releases the mouse. Tab to school controls."
            onBlur={event => {
              if (event.relatedTarget !== event.currentTarget) {
                stopMovement();
                if (event.currentTarget.contains(document.pointerLockElement)) document.exitPointerLock?.();
              }
            }}
            onKeyDown={(event) => {
              if (event.target !== event.currentTarget) return;
              if (event.key === "Escape") {
                stopMovement();
                document.exitPointerLock?.();
                return;
              }
              if(event.key.toLowerCase()==="e"&&!event.altKey&&!event.ctrlKey&&!event.metaKey){event.preventDefault();if(!event.repeat){if(courtInteraction&&mine)startShot();else interact();}return;}
              if (!connected || self?.seat || hub) return;
              const key = event.key.toLowerCase();
              if(!event.altKey&&!event.ctrlKey&&!event.metaKey){
                if(key==="shift"){event.preventDefault();motionIntent.current.run=true;requestInput.current();return;}
                if(key===" "){event.preventDefault();if(!event.repeat)jump();return;}
                if(key==="c"||key==="z"){event.preventDefault();if(!event.repeat){const next=key==="c"?"crouch":"prone";posture(motionIntent.current.stance===next?"stand":next);}return;}
              }
              if (!(
                [
                  "arrowleft",
                  "a",
                  "arrowright",
                  "d",
                  "arrowup",
                  "w",
                  "arrowdown",
                  "s",
                ].includes(key)
              )||event.altKey||event.ctrlKey||event.metaKey) return;
              event.preventDefault();
              if (navigation.current) stopMovement();
              heldMovementKeys.current.add(key);
              direction.current=keyboardDirection(heldMovementKeys.current);
              requestInput.current();
            }}
            onKeyUp={(event) => {
              if(event.target!==event.currentTarget)return;
              if(event.key.toLowerCase()==="e"&&ballCharge.current.started!==null){event.preventDefault();shootBall(currentShotPower(ballCharge.current,performance.now()));return;}
              if(event.key==="Shift"){motionIntent.current.run=false;}
              if(heldMovementKeys.current.delete(event.key.toLowerCase()))
                direction.current=keyboardDirection(heldMovementKeys.current);
              requestInput.current();
            }}
          >
            {no3d ? (
              <div className="campus-loading">
                <p>3D is unavailable on this device.</p>
                <Link href="/dashboard/academy">
                  Open your courses directly →
                </Link>
              </div>
            ) : (
              <CanvasBoundary>
                <Scene
                  snapshot={{
                    ...snapshot,
                    players: snapshot.players.filter(
                      (p) => !blocked.includes(p.id),
                    ),
                  }}
                  active={!hub}
                  onUnavailable={unavailable}
                  view={view}
                  placeId={selectedPlace}
                  hour={hour}
                  look={look}
                  onLookChange={rememberLook}
                  canLock={connected}
                  onRelease={stopMovement}
                  charge={ballCharge}
                  charging={charging}
                  shotPower={shotPower}
                  quality={graphics}
                />
              </CanvasBoundary>
            )}
            <button ref={fullscreenButton} className="secondary campus-fullscreen-button" aria-pressed={immersive} onClick={()=>{setSchoolPanel(null);if(immersive)exitFullscreen();else enterFullscreen();}}>{immersive?"Exit full screen":"Full screen"}</button>
            <div className="school-camera-controls" aria-label="School camera">
              <button className="secondary" aria-pressed={view === "exterior"} onClick={() => chooseCamera("exterior")}>The Cube</button>
              <button className="secondary" aria-pressed={view === "overview"} onClick={() => chooseCamera("overview")}>Whole school</button>
              <button className="secondary" aria-pressed={view === "follow"} onClick={() => chooseCamera("follow")}>Follow me</button>
              <button className="secondary" aria-pressed={view === "first-person"} onClick={() => chooseCamera("first-person")}>First person</button>
              <button className="secondary" aria-pressed={view === "orbit"} onClick={() => chooseCamera("orbit")}>Orbit view</button>
              <button className="secondary" onClick={() => openPanel("people")}>People &amp; safety</button>
              {walkingTo && <button className="secondary" onClick={stopMovement}>Stop walking</button>}
            </div>
            {connected && !hub && <button className="campus-interact" disabled={!!self?.travel||(!journey&&!switchRoom&&(courtInteraction?!mine&&!takeBall:!self?.seat&&!nearbyDesk))}
              onPointerDown={event=>{if(!mine)return;event.preventDefault();stage.current?.focus();event.currentTarget.setPointerCapture(event.pointerId);startShot();}}
              onPointerUp={event=>{if(ballCharge.current.started!==null){shootBall(currentShotPower(ballCharge.current,performance.now()));if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);}}}
              onPointerCancel={()=>{ballCharge.current.started=null;setCharging(false);}}
              onLostPointerCapture={()=>{if(ballCharge.current.started!==null){ballCharge.current.started=null;setCharging(false);}}}
              onClick={event=>{if(mine){if(event.detail===0)shootBall();}else interact();}}><kbd>E</kbd> {interactionLabel}</button>}
            {connected&&self&&!hub&&<div className="campus-body-tools" aria-label="Body and room controls">
              <span>{SCHOOL_FLOORS[self.floor??0].name} · {self.travel?`Riding ${self.travel}`:self.stance??"stand"}</span>
              {currentPlace&&!currentPlace.outdoor&&!self.travel&&<button aria-pressed={snapshot.frosted?.includes(currentPlace.id)??false} onClick={()=>toggleGlass(currentPlace.id)}>{snapshot.frosted?.includes(currentPlace.id)?"Clear room glass":"Screen room glass"}</button>}
              {journeys.map(j=><button key={`${j.connector.id}-${j.to}`} onClick={()=>travel(j.connector.id,j.to)}>{j.connector.name} → level {j.to}</button>)}
            </div>}
            {connected&&atCourt&&ball&&self&&!hub&&<BasketballHud ball={ball} self={self} charge={ballCharge} charging={charging} power={shotPower} target={targetHoop} onPower={setPower} onFace={faceHoop} onShoot={()=>shootBall()} onDrop={()=>{stopMovement();send("basketball",{action:"drop"});stage.current?.focus();}}/>}
            <div className="campus-stage-caption">
              THE CUBE / {view === "exterior"?"GLASS. NATURE. POSSIBILITY.":view === "overview" ? "WHOLE SCHOOL" : view === "place" ? selected.name.toUpperCase() : (currentPlace?.name ?? "Ground campus").toUpperCase()}
              <span>{view === "exterior"?"A scientific school beneath one transparent sky.":view === "overview" ? "Choose a place on the map below." : "Connected places. Shared learning."}</span>
            </div>
          </div>
          <section className="cube-world-controls" data-campus-panel="sky" hidden={immersive&&schoolPanel!=="sky"} tabIndex={immersive?-1:undefined} aria-label="Sky and camera controls">
            <div className="cube-clock-heading"><div><p className="campus-eyebrow">Your sky · 24-hour world</p><time dateTime={clockLabel(hour)}>{clockLabel(hour)}</time></div><span>{manualHour===null?"Local time":"Your chosen time"} · {sky.phase}</span></div>
            <label className="cube-time-range">Time of day<input aria-label="Time of day" type="range" min="0" max="23.75" step="0.25" value={hour} onChange={event=>{stopMovement();setManualHour(Number(event.target.value));}}/></label>
            <div className="cube-time-presets">{[["Sunrise",6.25],["Daylight",12],["Sunset",17.75],["Night sky",22]].map(([name,time])=><button className="secondary" key={name} onClick={()=>{stopMovement();setManualHour(Number(time));}}>{name}</button>)}<button className="secondary" aria-pressed={manualHour===null} onClick={()=>setManualHour(null)}>Live local time</button></div>
            <fieldset className="cube-graphics-controls"><legend>Graphics</legend>
              <div className="cube-time-presets">{([["auto","Auto"],["sharp","Sharp"],["performance","Performance"]] as const).map(([value,label])=><button key={value} className="secondary" aria-pressed={graphics===value} onClick={()=>setGraphics(value)}>{label}</button>)}</div>
              <p>{graphics==="auto"?"Sharper when still; adjusts while moving to keep controls smooth.":graphics==="sharp"?"Clearer edges and detail. May reduce frame rate on slower devices.":"Lower resolution for smoother movement and less GPU work."}</p>
            </fieldset>
            {(view==="first-person"||view==="orbit")&&<div className="cube-look-controls" aria-label="Look controls">
              <span>{view==="first-person"?"Your eyes inside the Cube":"Orbit the school"}</span>
              <button className="secondary" aria-label="Look left" onClick={()=>turn(-.22)}>←</button><button className="secondary" aria-label="Look right" onClick={()=>turn(.22)}>→</button>
              <button className="secondary" aria-label="Look up" onClick={()=>turn(0,.18)}>↑</button><button className="secondary" aria-label="Look down" onClick={()=>turn(0,-.18)}>↓</button>
              {view==="orbit"&&<><button className="secondary" aria-label="Zoom in" onClick={()=>changeLook(boundedLook({...rememberedLook.current,distance:rememberedLook.current.distance*.8},view))}>＋</button><button className="secondary" aria-label="Zoom out" onClick={()=>changeLook(boundedLook({...rememberedLook.current,distance:rememberedLook.current.distance*1.25},view))}>−</button></>}
            </div>}
          </section>
          <div className="campus-controls">
            {immersive&&<span className="campus-immersive-presence">{snapshot.players.filter(p=>!blocked.includes(p.id)).length} here</span>}
            <div>
              <strong>{self?.pseudonym || "Your own quiet corner"}</strong>
              <p role="status">
                {connection}
                {connected && self ? ` · ${self.status}` : ""}
              </p>
            </div>
            <div className="campus-actions">
              <button
                onClick={() => void enter()}
                disabled={connected || connecting.current}
              >
                {connected ? "Connected" : "Enter school"}
              </button>
              <button
                className="secondary"
                onClick={leave}
                disabled={!connected && !connecting.current}
              >
                Leave
              </button>
              <button
                className="secondary"
                onClick={() => {if(immersive)openPanel(schoolPanel==="controls"?null:"controls");else setHelp(!help);}}
                aria-expanded={immersive?schoolPanel==="controls":help}
              >
                Controls
              </button>
            </div>
          </div>
          {(help || connected || immersive) && (
            <div className="campus-help" data-campus-panel="controls" hidden={immersive&&schoolPanel!=="controls"} tabIndex={immersive?-1:undefined} aria-label="Movement controls">
              <p>
                Shift runs. Space jumps. C toggles crouching; Z toggles lying prone.
                Tables, shelves and boards are solid, including while jumping.
                Focus the school and use WASD or arrow keys to walk. Tap a
                direction button for a step, or hold it to keep walking. Move near
                a desk and press E to sit, then E to use its computer. After
                returning to school, E stands up. In First person, move the mouse
                to look; click the scene for continuous mouse look. Escape stops
                walking and releases the mouse. Touch users can drag to look.
                In Orbit view, WASD follows the camera and your character faces
                the direction of travel. Drag to rotate the camera.
                On the sports court, E picks up the basketball. Aim at a hoop,
                hold E while power rises and falls, then release to shoot. Escape
                cancels charging and keeps the ball. The dotted arc and power
                guide help you line up shots.
                Walk to the glass elevator, moving escalator or garden slide and
                press E to ride. Room switches screen the glass for shared visual
                focus; doors stay open and presence stays shared. All actions also have visible buttons.
              </p>
              <div className="campus-posture-controls" aria-label="Posture controls">
              <button className="secondary" disabled={!connected||!!self?.seat||!!self?.travel} aria-pressed={touchRun} onClick={()=>{touchRunMode.current=!touchRunMode.current;setTouchRun(touchRunMode.current);stage.current?.focus();requestInput.current();}}>Run · Shift</button>
              <button className="secondary" disabled={!connected||!!self?.seat||!!self?.travel} onClick={jump}>Jump · Space</button>
              <button className="secondary" disabled={!connected||!!self?.seat||!!self?.travel} aria-pressed={stance==="crouch"} onClick={()=>posture(stance==="crouch"?"stand":"crouch")}>Crouch · C</button>
              <button className="secondary" disabled={!connected||!!self?.seat||!!self?.travel} aria-pressed={stance==="prone"} onClick={()=>posture(stance==="prone"?"stand":"prone")}>Lie down · Z</button>
              </div>
              <div className="campus-direction-pad">
                {[
                  { name: "Walk forward", x: 0, z: -1, label: "↑" },
                  { name: "Walk left", x: -1, z: 0, label: "←" },
                  { name: "Walk back", x: 0, z: 1, label: "↓" },
                  { name: "Walk right", x: 1, z: 0, label: "→" },
                ].map((d) => (
                  <button
                    key={d.name}
                    aria-label={d.name}
                    disabled={!connected || Boolean(self?.seat)}
                    onPointerDown={(e) => {
                      stopMovement();
                      pointerStarted.current = performance.now();
                      e.currentTarget.setPointerCapture(e.pointerId);
                      direction.current = { x: d.x, z: d.z };
                      requestInput.current();
                    }}
                    onPointerUp={() => {
                      if (performance.now() - pointerStarted.current < 200)
                        stepDirection(d.x, d.z);
                      else stopMovement();
                    }}
                    onPointerCancel={stopMovement}
                    onClick={(e) => {
                      // Keyboard and assistive activation have no pointer sequence.
                      if (e.detail === 0) stepDirection(d.x, d.z);
                    }}
                    onBlur={stopMovement}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {walkingTo && <p className="school-route-status" role="status">Walking to {walkingTo}… <button className="secondary" onClick={stopMovement}>Stop walking</button></p>}
          <section className="school-map-panel" data-campus-panel="map" hidden={immersive&&schoolPanel!=="map"} tabIndex={immersive?-1:undefined} aria-label="School map">
            <div className="school-map-heading"><div><p className="campus-eyebrow">Make yourself at home</p><h2>Find your place.</h2></div><span>3 levels · 27 places · 20 study stations</span></div>
            <div className="school-floor-tabs" aria-label="School levels">{SCHOOL_FLOORS.map(f=><button key={f.id} className="secondary" aria-pressed={(selected.floor??0)===f.id} onClick={()=>{stopMovement();setSelectedPlace(SCHOOL_PLACES.find(p=>(p.floor??0)===f.id)!.id);setView("place");}}>{f.name}</button>)}</div>
            <div className="school-map-grid">
              {SCHOOL_PLACES.filter(place=>(place.floor??0)===(selected.floor??0)).map(place => <button key={place.id} className={`school-map-place ${selectedPlace === place.id ? "selected" : ""}`} aria-pressed={selectedPlace === place.id}
                style={{ backgroundColor: place.colour }} onClick={() => { stopMovement();setSelectedPlace(place.id);setView("place"); }}>
                <span className="school-map-symbol" aria-hidden="true">{place.outdoor ? "✳" : "▤"}</span><strong>{place.name}</strong>{currentPlace?.id === place.id && <small>You are here</small>}
              </button>)}
            </div>
            {connected&&<div className="school-floor-tabs" aria-label="Travel connections"><button className="secondary" onClick={()=>walkToConnector("lift")}>Walk to glass elevator</button>{(self?.floor??0)<2&&<button className="secondary" onClick={()=>walkToConnector("escalator")}>Walk to escalator up</button>}{(self?.floor??0)>0&&<><button className="secondary" onClick={()=>walkToConnector("escalator",true)}>Walk to escalator down</button><button className="secondary" onClick={()=>walkToConnector("slide")}>Walk to garden slide</button></>}</div>}
            <div className="school-place-detail"><div><h3>{selected.name}</h3><p>{selected.description}</p></div>
              <button disabled={!connected || Boolean(self?.seat)||Boolean(self?.travel)} onClick={walkToPlace}>Walk here →</button>
            </div>
            {!connected && <p className="school-map-hint">Look around freely. Enter the school to walk between places.</p>}
          </section>
          {notice && (
            <p className="campus-notice" role="status">
              {notice}
            </p>
          )}
        </section>
        <aside className="campus-sidebar">
          <section className="campus-card" data-campus-panel="desk" hidden={immersive&&schoolPanel!=="desk"} tabIndex={immersive?-1:undefined} aria-label="Study desk">
            <p className="campus-eyebrow">Make yourself comfortable</p>
            <h2>Your study desk</h2>
            <p>
              Take a seat at a computer or laptop to access your own dashboard
              and courses. Your usual access and progress carry over.
            </p>
            {!visibleSeats.length && <p>Study computers are in the library, labs, classrooms and upper quiet lounge. Use the school map to find them.</p>}
            <div className="campus-seats">
              {visibleSeats.map((seat) => (
                <button
                  key={seat.id}
                  disabled={
                    !connected ||
                    Boolean(self?.seat) ||
                    snapshot.occupied.includes(seat.id)
                  }
                  onClick={() => { setUsedDesk(false);send("sit", seat.id); }}
                >
                  <span>{seat.name}</span>
                  <small>
                    {self?.seat === seat.id
                      ? "Your seat"
                      : snapshot.occupied.includes(seat.id)
                        ? "Occupied"
                        : "Sit →"}
                  </small>
                </button>
              ))}
            </div>
            <div className="campus-actions">
              <button
                ref={hubButton}
                disabled={connected ? !self?.seat : !course}
                onClick={openHub}
              >
                Open Study Hub
              </button>
              <button
                className="secondary"
                disabled={!connected || !self?.seat}
                onClick={() => {setUsedDesk(false);send("action", "stand");}}
              >
                Stand up
              </button>
            </div>
          </section>
          <section className="campus-card" data-campus-panel="people" hidden={immersive&&schoolPanel!=="people"} ref={people} tabIndex={-1} aria-label="People and safety">
            <p className="campus-eyebrow">In good company</p>
            <h2>People at school</h2>
            <button className="secondary" onClick={leave} disabled={!connected}>Leave school</button>
            <p>Campus pseudonyms only. No chat or voice.</p>
            <label className="campus-reason">
              Report reason
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <option value="harassment">Harassment</option>
                <option value="inappropriate-behaviour">
                  Inappropriate behaviour
                </option>
                <option value="technical">Technical problem</option>
                <option value="other">Other concern</option>
              </select>
            </label>
            <ul className="campus-people">
              {snapshot.players
                .filter((p) => !blocked.includes(p.id))
                .map((p) => (
                  <li key={p.id}>
                    <div>
                      <strong>
                        {p.pseudonym}
                        {p.id === snapshot.self ? " (you)" : ""}
                      </strong>
                      <small>{p.status}</small>
                    </div>
                    {p.id !== snapshot.self && (
                      <div>
                        <button
                          disabled={busy || !connected}
                          onClick={() => void safety(p.id, "report")}
                        >
                          Report
                        </button>
                        <button
                          disabled={busy || !connected}
                          onClick={() => void safety(p.id, "block")}
                        >
                          Block
                        </button>
                      </div>
                    )}
                  </li>
                ))}
            </ul>
            {blocked.length > 0 && (
              <details>
                <summary>Blocked participants ({blocked.length})</summary>
                {blocked.map((id, i) => (
                  <button
                    className="campus-unblock"
                    key={id}
                    disabled={busy || !connected}
                    onClick={() => void safety(id, "unblock")}
                  >
                    Unblock participant {i + 1}
                  </button>
                ))}
              </details>
            )}
            <p className="campus-small">
              The supervisor named in your invitation is your contact during
              this session. You can leave at any time.
            </p>
          </section>
          <Link className="campus-direct" href={dashboardHref}>
            Prefer the usual view? Open my dashboard ↗
          </Link>
        </aside>
      </div>
      <dialog
        ref={hubDialog}
        className={`campus-hub ${hub ? "is-open" : ""}`}
        aria-label="Study Hub"
        onCancel={(e) => {
          e.preventDefault();
          closeHub();
        }}
      >
        <header>
          <div>
            <p className="campus-eyebrow">Your learning, in focus</p>
            <h2>Study Hub</h2>
          </div>
          <button onClick={closeHub}>Return to school →</button>
        </header>
        <nav className="campus-hub-shortcuts" aria-label="Your existing learning tools">
          <p>This beta connects to your existing ScienceDojo account.</p>
          <button aria-pressed={hubTool==="dashboard"} onClick={()=>{setDashboardReady(true);setHubTool("dashboard");}}>My dashboard</button>
          <button aria-pressed={hubTool==="courses"} onClick={()=>setHubTool("courses")}>My courses</button>
          <Link href={dashboardHref} target="_blank" rel="noopener noreferrer">
            My dashboard · opens a new tab ↗
          </Link>
          <Link href="/dashboard/academy" target="_blank" rel="noopener noreferrer">
            My Courses · opens a new tab ↗
          </Link>
        </nav>
        {dashboardReady&&<div className="campus-tool-panel" hidden={hubTool!=="dashboard"}>
          <iframe title="Your personal dashboard" data-campus-dashboard="true" src={dashboardHref} referrerPolicy="same-origin"
            onLoad={event=>{
              try{event.currentTarget.contentDocument?.addEventListener("keydown",key=>{
                if(key.key==="Escape"&&!key.defaultPrevented){key.preventDefault();closeHub();}
              });}catch{/* The visible return control remains available after external navigation. */}
            }}/>
        </div>}
        <div className="campus-tool-panel" hidden={hubTool!=="courses"}>
        {!course ? (
          <div className="campus-hub-courses">
            <p>
              Your campus pseudonym is used in the shared world. Course
              discussions use your existing profile name and avatar; course
              reviews can show your name publicly.
            </p>
            <label className="campus-consent">
              <input
                type="checkbox"
                checked={identityRead}
                onChange={(e) => setIdentityRead(e.target.checked)}
              />
              I understand these course identity rules.
            </label>
            {courses.length ? (
              courses.map((c) => (
                <button
                  disabled={!identityRead}
                  key={c.key}
                  onClick={() => setCourse(c.key)}
                >
                  {c.title}
                  <span>Open course →</span>
                </button>
              ))
            ) : (
              <p>
                No accessible courses yet.{" "}
                <Link href="/courses">Browse the existing course catalog</Link>{" "}
                to enroll or join a waitlist.
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="campus-course-note">
              Course work stays open when you return to the school. Save your
              work in the course before leaving this page.{" "}
              <Link
                href={`/dashboard/academy/${encodeURIComponent(course)}`}
                target="_blank"
                rel="noreferrer"
              >
                Open course in its own tab ↗
              </Link>
            </div>
            <iframe
              ref={frame}
              title="Your Academy course"
              src={`/dashboard/academy/${encodeURIComponent(course)}`}
              referrerPolicy="same-origin"
              onLoad={(event) => {
                // Keyboard events do not bubble across an iframe boundary.
                // Read only the Escape key; keep learning content inside the frame.
                try {
                  event.currentTarget.contentDocument?.addEventListener(
                    "keydown",
                    (key) => {
                      if (key.key === "Escape" && !key.defaultPrevented) {
                        key.preventDefault();
                        closeHub();
                      }
                    },
                  );
                } catch {
                  /* Cross-origin navigation keeps the external return control. */
                }
              }}
            />
          </>
        )}
        </div>
      </dialog>
    </main>
  );
}

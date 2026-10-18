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
import { SEATS, type Snapshot } from "@/lib/campus/protocol";
import { SCHOOL_PLACES, schoolPlaceAt, schoolRoute, type Point } from "@/lib/campus/school-layout";
import {DEFAULT_LOOK,boundedLook,cameraDirection,clockLabel,schoolSky,type CameraLook,type SchoolView} from "@/lib/campus/cube-experience";
import "./campus.css";

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
  const [identityRead, setIdentityRead] = useState(false),
    [no3d, setNo3d] = useState(false),
    [blocked, setBlocked] = useState(initialBlocked);
  const [reason, setReason] = useState("harassment"),
    [busy, setBusy] = useState(false),
    [help, setHelp] = useState(false);
  const [view, setView] = useState<SchoolView>("exterior");
  const [look,setLook]=useState<CameraLook>(DEFAULT_LOOK);
  const rememberedLook=useRef<CameraLook>(DEFAULT_LOOK);
  const rememberLook=useCallback((next:CameraLook)=>{rememberedLook.current=next;cameraRef.current.yaw=next.yaw;},[]);
  const [usedDesk,setUsedDesk]=useState(false);
  const lastInteraction=useRef(0);
  const [manualHour,setManualHour]=useState<number|null>(null);
  const liveHour=useSyncExternalStore(subscribeClock,readLocalHour,serverHour),hour=manualHour??liveHour;
  const sky=schoolSky(hour);
  const cameraRef=useRef({view: "exterior" as SchoolView,yaw:0});
  useLayoutEffect(()=>{cameraRef.current={view,yaw:rememberedLook.current.yaw};},[view,look.yaw]);
  const [selectedPlace, setSelectedPlace] = useState("library"), [walkingTo, setWalkingTo] = useState("");
  const navigation = useRef<{ points: Point[]; name: string } | null>(null);
  const latestSelf = useRef<Point | null>(null);
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
    if (!self || self.seat) { setNotice("Stand up before walking to another place."); return; }
    const points = schoolRoute(self, { x: selected.x, z: selected.z + 2 });
    if (!points.length) { setNotice("Use the direction controls to reach an open path first."); return; }
    navigation.current = { points, name: selected.name };setWalkingTo(selected.name);setView("follow");stage.current?.focus();
  };
  const unavailable = useCallback(() => setNo3d(true), []);
  const stopMovement = useCallback(() => {
    if (stepTimer.current) clearTimeout(stepTimer.current);
    stepTimer.current = null;
    direction.current = { x: 0, z: 0 };
    navigation.current = null;setWalkingTo("");
  }, []);
  const stepDirection = useCallback((x: number, z: number) => {
    stopMovement();
    direction.current = { x, z };
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
    setUsedDesk(false);
    setConnection("Connecting…");
    try {
      const admission = await requestCampusAdmission({ signal: controller.signal });
      const next = await connectCampus(admission);
      if (attempt !== generation.current) {
        void next.leave();
        return;
      }
      next.onMessage<Snapshot>("snapshot", (data) => {
        latestSelf.current = data.players.find(p => p.id === data.self) ?? null;
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
    const timer = setInterval(() => {
      const route = navigation.current, position = latestSelf.current;
      if (route && position) {
        while (route.points.length && Math.hypot(route.points[0].x - position.x, route.points[0].z - position.z) < .3) route.points.shift();
        if (!route.points.length) { navigation.current = null;setWalkingTo("");direction.current = { x: 0, z: 0 };setNotice(`Arrived at ${route.name}.`); }
        else { const dx = route.points[0].x - position.x, dz = route.points[0].z - position.z, length = Math.max(1, Math.hypot(dx, dz));direction.current = { x: dx / length, z: dz / length }; }
      }
      if (room.current)
        room.current.send("input", {
          ...(cameraRef.current.view==="first-person"&&!route?cameraDirection(direction.current.x,direction.current.z,cameraRef.current.yaw):direction.current),
          seq: sequence.current++,
        });
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
    send("action", "study");
    setUsedDesk(true);
    setHub(true);
  };
  const nearbyDesk = self && !self.seat ? SEATS
    .filter(seat => !snapshot.occupied.includes(seat.id) && Math.hypot(self.x-seat.x,self.z-seat.z)<=2.1)
    .sort((a,b)=>Math.hypot(self.x-a.x,self.z-a.z)-Math.hypot(self.x-b.x,self.z-b.z))[0] : undefined;
  const interactionLabel = self?.seat ? usedDesk ? "Stand up" : "Use computer" : nearbyDesk ? `Sit at ${nearbyDesk.name}` : "Move near a free study desk";
  const interact = () => {
    if (!connected || hub || performance.now()-lastInteraction.current<400) return;
    lastInteraction.current=performance.now();
    stopMovement();
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
    if (view==="first-person") stage.current?.focus();
    else hubButton.current?.focus();
  };
  return (
    <main className="campus-shell cube-campus">
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
              <p className="campus-beta-note">Glass, green spaces and a sky that changes with your day. 15 places to discover.</p>
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
            aria-label="3D school. Use arrow keys or WASD to walk. In First person, move the mouse to look. E interacts with a nearby desk. Escape releases the mouse. Tab to school controls."
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
              if(event.key.toLowerCase()==="e"&&!event.altKey&&!event.ctrlKey&&!event.metaKey){event.preventDefault();if(!event.repeat)interact();return;}
              if (!connected || self?.seat || hub) return;
              if (navigation.current) stopMovement();
              const key = event.key.toLowerCase();
              if (
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
              )
                event.preventDefault();
              if (["arrowleft", "a"].includes(key)) direction.current.x = -1;
              if (["arrowright", "d"].includes(key)) direction.current.x = 1;
              if (["arrowup", "w"].includes(key)) direction.current.z = -1;
              if (["arrowdown", "s"].includes(key)) direction.current.z = 1;
            }}
            onKeyUp={(event) => {
              if (
                ["arrowleft", "a", "arrowright", "d"].includes(
                  event.key.toLowerCase(),
                )
              )
                direction.current.x = 0;
              if (
                ["arrowup", "w", "arrowdown", "s"].includes(
                  event.key.toLowerCase(),
                )
              )
                direction.current.z = 0;
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
                />
              </CanvasBoundary>
            )}
            <div className="school-camera-controls" aria-label="School camera">
              <button className="secondary" aria-pressed={view === "exterior"} onClick={() => chooseCamera("exterior")}>The Cube</button>
              <button className="secondary" aria-pressed={view === "overview"} onClick={() => chooseCamera("overview")}>Whole school</button>
              <button className="secondary" aria-pressed={view === "follow"} onClick={() => chooseCamera("follow")}>Follow me</button>
              <button className="secondary" aria-pressed={view === "first-person"} onClick={() => chooseCamera("first-person")}>First person</button>
              <button className="secondary" aria-pressed={view === "orbit"} onClick={() => chooseCamera("orbit")}>Orbit view</button>
              <button className="secondary" onClick={() => { stopMovement();people.current?.focus(); }}>People &amp; safety</button>
              {walkingTo && <button className="secondary" onClick={stopMovement}>Stop walking</button>}
            </div>
            {connected && !hub && <button className="campus-interact" disabled={!self?.seat&&!nearbyDesk} onClick={interact}><kbd>E</kbd> {interactionLabel}</button>}
            <div className="campus-stage-caption">
              THE CUBE / {view === "exterior"?"GLASS. NATURE. POSSIBILITY.":view === "overview" ? "WHOLE SCHOOL" : view === "place" ? selected.name.toUpperCase() : (currentPlace?.name ?? "Ground campus").toUpperCase()}
              <span>{view === "exterior"?"A scientific school beneath one transparent sky.":view === "overview" ? "Choose a place on the map below." : "Connected places. Shared learning."}</span>
            </div>
          </div>
          <section className="cube-world-controls" aria-label="Sky and camera controls">
            <div className="cube-clock-heading"><div><p className="campus-eyebrow">Your sky · 24-hour world</p><time dateTime={clockLabel(hour)}>{clockLabel(hour)}</time></div><span>{manualHour===null?"Local time":"Your chosen time"} · {sky.phase}</span></div>
            <label className="cube-time-range">Time of day<input aria-label="Time of day" type="range" min="0" max="23.75" step="0.25" value={hour} onChange={event=>{stopMovement();setManualHour(Number(event.target.value));}}/></label>
            <div className="cube-time-presets">{[["Sunrise",6.25],["Daylight",12],["Sunset",17.75],["Night sky",22]].map(([name,time])=><button className="secondary" key={name} onClick={()=>{stopMovement();setManualHour(Number(time));}}>{name}</button>)}<button className="secondary" aria-pressed={manualHour===null} onClick={()=>setManualHour(null)}>Live local time</button></div>
            {(view==="first-person"||view==="orbit")&&<div className="cube-look-controls" aria-label="Look controls">
              <span>{view==="first-person"?"Your eyes inside the Cube":"Orbit the school"}</span>
              <button className="secondary" aria-label="Look left" onClick={()=>turn(-.22)}>←</button><button className="secondary" aria-label="Look right" onClick={()=>turn(.22)}>→</button>
              <button className="secondary" aria-label="Look up" onClick={()=>turn(0,.18)}>↑</button><button className="secondary" aria-label="Look down" onClick={()=>turn(0,-.18)}>↓</button>
              {view==="orbit"&&<><button className="secondary" aria-label="Zoom in" onClick={()=>changeLook(boundedLook({...rememberedLook.current,distance:rememberedLook.current.distance*.8},view))}>＋</button><button className="secondary" aria-label="Zoom out" onClick={()=>changeLook(boundedLook({...rememberedLook.current,distance:rememberedLook.current.distance*1.25},view))}>−</button></>}
            </div>}
          </section>
          <div className="campus-controls">
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
                onClick={() => setHelp(!help)}
                aria-expanded={help}
              >
                Controls
              </button>
            </div>
          </div>
          {(help || connected) && (
            <div className="campus-help">
              <p>
                Focus the school and use WASD or arrow keys to walk. Tap a
                direction button for a step, or hold it to keep walking. Move near
                a desk and press E to sit, then E to use its computer. After
                returning to school, E stands up. In First person, move the mouse
                to look; click the scene for continuous mouse look. Escape stops
                walking and releases the mouse. Touch users can drag to look.
                All actions also have visible buttons.
              </p>
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
          <section className="school-map-panel" aria-label="School map">
            <div className="school-map-heading"><div><p className="campus-eyebrow">Make yourself at home</p><h2>Find your place.</h2></div><span>15 places · 10 study stations</span></div>
            <div className="school-map-grid">
              {SCHOOL_PLACES.map(place => <button key={place.id} className={`school-map-place ${selectedPlace === place.id ? "selected" : ""}`} aria-pressed={selectedPlace === place.id}
                style={{ backgroundColor: place.colour }} onClick={() => { stopMovement();setSelectedPlace(place.id);setView("place"); }}>
                <span className="school-map-symbol" aria-hidden="true">{place.outdoor ? "✳" : "▤"}</span><strong>{place.name}</strong>{currentPlace?.id === place.id && <small>You are here</small>}
              </button>)}
            </div>
            <div className="school-place-detail"><div><h3>{selected.name}</h3><p>{selected.description}</p></div>
              <button disabled={!connected || Boolean(self?.seat)} onClick={walkToPlace}>Walk here →</button>
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
          <section className="campus-card">
            <p className="campus-eyebrow">Make yourself comfortable</p>
            <h2>Your study desk</h2>
            <p>
              Take a seat at a computer or laptop to access your own dashboard
              and courses. Your usual access and progress carry over.
            </p>
            {!visibleSeats.length && <p>Study computers are in the Library, Computer lab and Classroom A. Use the school map to find them.</p>}
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
          <section className="campus-card" ref={people} tabIndex={-1} aria-label="People and safety">
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
          <Link href={dashboardHref} target="_blank" rel="noopener noreferrer">
            My dashboard · opens a new tab ↗
          </Link>
          <Link href="/dashboard/academy" target="_blank" rel="noopener noreferrer">
            My Courses · opens a new tab ↗
          </Link>
        </nav>
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
      </dialog>
    </main>
  );
}

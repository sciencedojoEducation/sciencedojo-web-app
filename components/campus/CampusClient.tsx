"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Client, type Room } from "@colyseus/sdk";
import { SEATS, type Snapshot } from "@/lib/campus/protocol";
import "./campus.css";

const Scene = dynamic(() => import("./CampusScene"), {
  ssr: false,
  loading: () => <div className="campus-loading">Preparing the library…</div>,
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
        3D could not start. Use the accessible library controls or open your
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
  const room = useRef<Room | null>(null),
    direction = useRef({ x: 0, z: 0 }),
    stepTimer = useRef<ReturnType<typeof setTimeout> | null>(null),
    pointerStarted = useRef(0),
    sequence = useRef(0),
    connecting = useRef(false),
    generation = useRef(0);
  const stage = useRef<HTMLDivElement>(null),
    frame = useRef<HTMLIFrameElement>(null),
    hubButton = useRef<HTMLButtonElement>(null),
    hubDialog = useRef<HTMLDialogElement>(null);
  const self = snapshot.players.find((p) => p.id === snapshot.self);
  const unavailable = useCallback(() => setNo3d(true), []);
  const stopMovement = useCallback(() => {
    if (stepTimer.current) clearTimeout(stepTimer.current);
    stepTimer.current = null;
    direction.current = { x: 0, z: 0 };
  }, []);
  const stepDirection = useCallback((x: number, z: number) => {
    stopMovement();
    direction.current = { x, z };
    // A native button click must last long enough to reach the input loop.
    stepTimer.current = setTimeout(stopMovement, 300);
  }, [stopMovement]);
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
    setNotice("");
    setConnection("Connecting…");
    try {
      const response = await fetch("/api/campus/admission", { method: "POST" });
      const admission = await response.json();
      if (!response.ok) throw new Error(admission.error || "Unable to enter.");
      const next = await new Client(admission.endpoint).joinById(
        admission.room,
        { ticket: admission.ticket },
      );
      next.reconnection.enabled = false;
      if (attempt !== generation.current) {
        void next.leave();
        return;
      }
      next.onMessage<Snapshot>("snapshot", (data) => {
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
      setConnection("In the library");
      stage.current?.focus();
    } catch (error) {
      setConnection("Unable to enter");
      setNotice(error instanceof Error ? error.message : "Please try again.");
    } finally {
      connecting.current = false;
    }
  };
  useEffect(() => {
    const timer = setInterval(() => {
      if (room.current)
        room.current.send("input", {
          ...direction.current,
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
      stop();
      clearInterval(timer);
      window.removeEventListener("blur", stop);
      document.removeEventListener("visibilitychange", stop);
      void room.current?.leave();
    };
  }, [stopMovement]);
  const leave = () => {
    stopMovement();
    void room.current?.leave();
    room.current = null;
    setConnected(false);
    setSnapshot({ self: "", players: [], occupied: [] });
    setConnection("You left the library");
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
  const closeHub = () => {
    // Retain the mounted frame and its DOM, including unsaved local answers and in-flight saves.
    setHub(false);
    send("action", "close");
    hubButton.current?.focus();
  };
  return (
    <main className="campus-shell">
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
        <section className="campus-world-panel" aria-label="Shared library">
          <div className="campus-world-heading">
            <div>
              <p className="campus-eyebrow">A little space to focus</p>
              <h1>Learn, together.</h1>
              <p className="campus-beta-note">An optional virtual library for your existing learning.</p>
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
            aria-label="3D library. Use arrow keys or WASD to walk. Tab to library controls."
            onBlur={stopMovement}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                direction.current = { x: 0, z: 0 };
                document.exitPointerLock?.();
                return;
              }
              if (!connected || self?.seat || hub) return;
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
                />
              </CanvasBoundary>
            )}
            <div className="campus-stage-caption">
              THE CUBE / LIBRARY FLOOR<span>Quiet company. Real learning.</span>
            </div>
          </div>
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
                {connected ? "Connected" : "Enter library"}
              </button>
              <button
                className="secondary"
                onClick={leave}
                disabled={!connected}
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
          {help && (
            <div className="campus-help">
              <p>
                Focus the library and use WASD or arrow keys to walk. Tap a
                direction button for a step, or hold it to keep walking. Move near
                a desk, then choose its Sit button. Escape stops movement. All
                actions are available below without pointer capture.
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
            <div className="campus-seats">
              {SEATS.map((seat, i) => (
                <button
                  key={seat.id}
                  disabled={
                    !connected ||
                    Boolean(self?.seat) ||
                    snapshot.occupied.includes(seat.id)
                  }
                  onClick={() => send("sit", seat.id)}
                >
                  <span>Desk {i + 1}</span>
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
                onClick={() => {
                  stopMovement();
                  send("action", "study");
                  setHub(true);
                }}
              >
                Open Study Hub
              </button>
              <button
                className="secondary"
                disabled={!connected || !self?.seat}
                onClick={() => send("action", "stand")}
              >
                Stand up
              </button>
            </div>
          </section>
          <section className="campus-card">
            <p className="campus-eyebrow">In good company</p>
            <h2>People in the library</h2>
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
          <button onClick={closeHub}>Return to library →</button>
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
              Course work stays open when you return to the library. Save your
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

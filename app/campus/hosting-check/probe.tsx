"use client";
import { useEffect, useRef, useState } from "react";

type Result = { round: number; peer: number; ok: boolean; instance?: string };
export default function HostingCheck() {
  const [results, setResults] = useState<Result[]>([]);
  const [running, setRunning] = useState(false);
  const sockets = useRef(new Set<WebSocket>());
  const generation = useRef(0);
  useEffect(() => () => {
    generation.current++;
    for (const socket of sockets.current) socket.close();
  }, []);
  async function run() {
    if (running) return;
    const attempt = ++generation.current;
    setResults([]);
    setRunning(true);
    const collected: Result[] = [];
    for (let round = 1; round <= 2; round++) {
      if (attempt !== generation.current) return;
      const batch = await Promise.all([1, 2].map((peer) => new Promise<Result>((resolve) => {
        const url = new URL("/api/campus-hosting-check", location.origin);
        url.protocol = "wss:";
        const socket = new WebSocket(url);
        sockets.current.add(socket);
        let settled = false;
        const done = (ok: boolean, instance?: string) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          sockets.current.delete(socket);
          socket.close();
          resolve({ round, peer, ok, instance });
        };
        const timer = setTimeout(() => done(false), 10000);
        socket.onopen = () => socket.send("probe");
        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "pong" && typeof data.instance === "string" &&
              /^[0-9a-f-]{36}$/.test(data.instance)) done(true, data.instance);
            else done(false);
          } catch { done(false); }
        };
        socket.onerror = () => done(false);
        socket.onclose = () => done(false);
      })));
      collected.push(...batch);
      if (attempt === generation.current) setResults([...collected]);
    }
    if (attempt === generation.current) setRunning(false);
  }
  return <section className="mt-8" aria-label="Connection results">
    <button onClick={() => void run()} disabled={running}
      className="min-h-12 rounded-full bg-[#173b39] px-6 text-white disabled:opacity-60">
      {running ? "Testing connections…" : "Run connection check"}
    </button>
    <div role="status" className="mt-5 leading-7">
      {results.length === 4
        ? results.every((r) => r.ok)
          ? "Passed: four live connections, including fresh connections after closing."
          : "The connection check failed. The existing website and courses remain available."
        : running ? "Checking two connections, then closing and connecting again…" : "Ready to check."}
    </div>
    {results.length > 0 && <ul className="mt-4 text-sm leading-7">
      {results.map((r) => <li key={`${r.round}-${r.peer}`}>
        Round {r.round}, connection {r.peer}: {r.ok ? "connected" : "failed"}
      </li>)}
    </ul>}
    {results.length === 4 && results.every((r) => r.ok) && <p className="mt-4 text-sm leading-6">
      Observed {new Set(results.map((r) => r.instance)).size} server instance(s).
      Even if all four use one instance, future connections can use another.
    </p>}
  </section>;
}

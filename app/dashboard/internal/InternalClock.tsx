"use client";

import { useEffect, useState } from "react";

function formatTime(date: Date) {
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export default function InternalClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm md:rounded-[2rem]">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700/50">Clock</p>
      <p className="mt-3 text-4xl font-black tracking-tight text-emerald-950">{formatTime(now)}</p>
      <p className="mt-2 text-sm font-bold text-emerald-800/55">{formatDate(now)}</p>
    </div>
  );
}

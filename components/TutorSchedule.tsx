"use client";

import { Booking } from "@/lib/supabase-queries";
import { useState } from "react";

interface TutorScheduleProps {
  bookings: Booking[];
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-primary/15 border-primary/40 text-primary",
  accepted:  "bg-accent/15 border-accent/40 text-accent",
  requested: "bg-yellow-50 border-yellow-300 text-yellow-700",
};

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM – 8 PM

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sun
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

export default function TutorSchedule({ bookings }: TutorScheduleProps) {
  const [weekOffset, setWeekOffset] = useState(0);

  const today = new Date();
  const weekStart = addDays(startOfWeek(today), weekOffset * 7);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const scheduled = bookings.filter(
    (b) => b.status === "confirmed" || b.status === "accepted" || b.status === "requested"
  );

  // Group bookings by day index (0-6) within the current week
  const bookingsByDay: Record<number, { booking: Booking; hour: number; minute: number }[]> = {};
  for (let i = 0; i < 7; i++) bookingsByDay[i] = [];

  for (const booking of scheduled) {
    const date = new Date(booking.requested_date);
    for (let i = 0; i < 7; i++) {
      if (isSameDay(date, weekDays[i])) {
        bookingsByDay[i].push({
          booking,
          hour: date.getHours(),
          minute: date.getMinutes(),
        });
      }
    }
  }

  const monthLabel = (() => {
    const s = weekDays[0];
    const e = weekDays[6];
    if (s.getMonth() === e.getMonth()) {
      return `${MONTH_NAMES[s.getMonth()]} ${s.getFullYear()}`;
    }
    return `${MONTH_NAMES[s.getMonth()]} – ${MONTH_NAMES[e.getMonth()]} ${e.getFullYear()}`;
  })();

  return (
    <section className="bg-white rounded-[2rem] border border-secondary/10 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-secondary/5">
        <div>
          <h2 className="text-xl font-black text-secondary">Weekly Schedule</h2>
          <p className="text-xs text-secondary/40 font-bold uppercase tracking-widest mt-0.5">{monthLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-secondary/10 flex items-center justify-center text-secondary transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className="px-3 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-secondary/10 text-xs font-black text-secondary uppercase tracking-widest transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-secondary/10 flex items-center justify-center text-secondary transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-[3rem_repeat(7,1fr)] border-b border-secondary/5">
        <div /> {/* time gutter */}
        {weekDays.map((day, i) => {
          const isToday = isSameDay(day, today);
          return (
            <div key={i} className="py-3 text-center border-l border-secondary/5 first:border-l-0">
              <p className={`text-[10px] font-black uppercase tracking-widest ${isToday ? "text-primary" : "text-secondary/40"}`}>
                {DAY_LABELS[day.getDay()]}
              </p>
              <p className={`text-lg font-black mt-0.5 ${isToday ? "text-white bg-primary rounded-full w-8 h-8 flex items-center justify-center mx-auto" : "text-secondary"}`}>
                {day.getDate()}
              </p>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="overflow-y-auto max-h-[28rem]">
        {HOURS.map((hour) => (
          <div key={hour} className="grid grid-cols-[3rem_repeat(7,1fr)] min-h-[3.5rem]">
            {/* Hour label */}
            <div className="flex items-start justify-end pr-2 pt-1">
              <span className="text-[10px] font-bold text-secondary/30">
                {hour === 12 ? "12pm" : hour > 12 ? `${hour - 12}pm` : `${hour}am`}
              </span>
            </div>

            {/* Day cells */}
            {weekDays.map((_, dayIdx) => {
              const slots = bookingsByDay[dayIdx].filter(
                ({ hour: h }) => h === hour
              );
              return (
                <div
                  key={dayIdx}
                  className="border-l border-t border-secondary/5 relative px-1 py-1 min-h-[3.5rem]"
                >
                  {slots.map(({ booking, minute }) => (
                    <div
                      key={booking.id}
                      style={{ top: `${(minute / 60) * 100}%` }}
                      className={`rounded-lg border px-2 py-1 mb-0.5 ${STATUS_COLORS[booking.status] || "bg-slate-100 border-slate-200 text-secondary"}`}
                    >
                      <p className="text-[10px] font-black uppercase truncate">{booking.subject}</p>
                      <p className="text-[9px] font-bold opacity-70">
                        {new Date(booking.requested_date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      </p>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-6 py-3 border-t border-secondary/5 bg-slate-50/50">
        <span className="text-[10px] font-black text-secondary/30 uppercase tracking-widest">Legend</span>
        {[
          { label: "Confirmed", cls: "bg-primary/15 border-primary/40 text-primary" },
          { label: "Accepted",  cls: "bg-accent/15 border-accent/40 text-accent" },
          { label: "Requested", cls: "bg-yellow-50 border-yellow-300 text-yellow-700" },
        ].map(({ label, cls }) => (
          <span key={label} className={`flex items-center gap-1.5 border rounded-full px-2.5 py-0.5 text-[10px] font-black ${cls}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {label}
          </span>
        ))}
      </div>
    </section>
  );
}

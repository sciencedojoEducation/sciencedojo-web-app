"use client";

import { AvailabilitySlot } from "@/lib/supabase-queries";
import { addAvailabilitySlot, deleteAvailabilitySlot } from "@/app/tutor/actions";
import { useState, useTransition } from "react";

interface Props {
  slots: AvailabilitySlot[];
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];
const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// Helper: Format '09:00:00' to '9am'
function formatTime(timeStr: string) {
  const [h, m] = timeStr.split(':');
  const d = new Date();
  d.setHours(parseInt(h, 10), parseInt(m, 10));
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase().replace(':00', '');
}

export default function TutorAvailabilityCalendar({ slots }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isPending, startTransition] = useTransition();

  // For the time range inputs
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDateOfMonth = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay(); 
  const totalDays = lastDateOfMonth.getDate();

  // Navigation
  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const handleDayClick = (dayStr: string) => {
    const d = new Date(dayStr);
    // Ignore clicks on past dates
    const today = new Date();
    today.setHours(0,0,0,0);
    if (d < today) return;

    setSelectedDate(d);
  };

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;

    startTransition(async () => {
      try {
        const formData = new FormData();
        // Convert local date to YYYY-MM-DD
        const dateStr = [
          selectedDate.getFullYear(),
          String(selectedDate.getMonth() + 1).padStart(2, '0'),
          String(selectedDate.getDate()).padStart(2, '0')
        ].join('-');

        formData.append("date", dateStr);
        formData.append("startTime", startTime);
        formData.append("endTime", endTime);

        await addAvailabilitySlot(formData);
      } catch (err: any) {
        alert(err.message || "Failed to save slot. It may overlap with an existing slot.");
      }
    });
  };

  const handleDeleteSlot = (id: string) => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("id", id);
        await deleteAvailabilitySlot(formData);
      } catch (err: any) {
        alert("Failed to delete slot.");
      }
    });
  };

  // Convert "2026-04-15" string to local Date obj (ignoring timezone shift)
  const toLocalDate = (ymdStr: string) => {
    const [y, m, d] = ymdStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  // Build grid
  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null); // Empty prepending slots
  }
  for (let i = 1; i <= totalDays; i++) {
    days.push(new Date(year, month, i));
  }

  // Generate standard 1-hour quick blocks
  const QUICK_BLOCKS = [
    { start: "08:00", end: "09:00", label: "8am" },
    { start: "09:00", end: "10:00", label: "9am" },
    { start: "10:00", end: "11:00", label: "10am" },
    { start: "11:00", end: "12:00", label: "11am" },
    { start: "12:00", end: "13:00", label: "12pm" },
    { start: "13:00", end: "14:00", label: "1pm" },
    { start: "14:00", end: "15:00", label: "2pm" },
    { start: "15:00", end: "16:00", label: "3pm" },
    { start: "16:00", end: "17:00", label: "4pm" },
    { start: "17:00", end: "18:00", label: "5pm" },
    { start: "18:00", end: "19:00", label: "6pm" },
    { start: "19:00", end: "20:00", label: "7pm" },
  ];

  const handleQuickAdd = (start: string, end: string) => {
    if (!selectedDate) return;
    startTransition(async () => {
      try {
        const formData = new FormData();
        const dateStr = [
          selectedDate.getFullYear(),
          String(selectedDate.getMonth() + 1).padStart(2, '0'),
          String(selectedDate.getDate()).padStart(2, '0')
        ].join('-');

        formData.append("date", dateStr);
        formData.append("startTime", start);
        formData.append("endTime", end);

        await addAvailabilitySlot(formData);
      } catch (err: any) {
        alert("Failed to save slot. Time may overlap.");
      }
    });
  };

  return (
    <div className="flex min-w-0 flex-col overflow-hidden rounded-[1.5rem] border border-secondary/10 bg-white shadow-sm lg:flex-row lg:rounded-[2rem]">
      {/* LEFT: Calendar Grid */}
      <div className="w-full min-w-0 border-b border-secondary/5 p-4 sm:p-6 lg:w-1/2 lg:border-b-0 lg:border-r lg:p-8">
        <div className="mb-5 flex items-center justify-between gap-3 md:mb-8">
          <div>
            <h2 className="text-xl font-black text-secondary">{MONTH_NAMES[month]}</h2>
            <p className="text-sm font-bold text-secondary/40">{year}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button onClick={handlePrevMonth} className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-secondary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={handleToday} className="px-3 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-[10px] font-black uppercase text-secondary">Today</button>
            <button onClick={handleNextMonth} className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-secondary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAY_LABELS.map(day => (
            <div key={day} className="text-center text-[10px] font-black text-secondary/40 uppercase tracking-widest py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} className="p-2" />;
            
            const isToday = day.toDateString() === new Date().toDateString();
            const isSelected = selectedDate?.toDateString() === day.toDateString();
            
            // Is it in the past?
            const todayReset = new Date();
            todayReset.setHours(0,0,0,0);
            const isPast = day < todayReset;

            // Does it have slots?
            const dayStr = [
              day.getFullYear(),
              String(day.getMonth() + 1).padStart(2, '0'),
              String(day.getDate()).padStart(2, '0')
            ].join('-');
            
            const daySlots = slots.filter(s => s.date === dayStr);

            return (
              <button
                key={i}
                disabled={isPast}
                onClick={() => handleDayClick(dayStr)}
                className={`
                  relative aspect-square p-1 rounded-xl flex items-center justify-center text-sm font-bold transition-all
                  ${isPast ? 'text-secondary/20 cursor-not-allowed bg-transparent' : 'hover:border-primary/30 border border-transparent'}
                  ${isSelected ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105' : 'text-secondary bg-surface'}
                  ${isToday && !isSelected ? 'text-primary' : ''}
                `}
              >
                {day.getDate()}
                
                {/* Dot indicator if slots exist */}
                {daySlots.length > 0 && (
                  <div className="absolute bottom-1.5 flex gap-0.5">
                    <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-primary'}`}></span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Slot Editor */}
      <div className="flex w-full min-w-0 flex-col bg-slate-50/50 p-4 text-left sm:p-6 lg:w-1/2 lg:p-8">
        {!selectedDate ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center text-center text-secondary/40">
            <svg className="mx-auto mb-4 h-12 w-12 opacity-50 md:h-16 md:w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mb-1 text-base font-black text-secondary/60 md:text-lg">Select a date</p>
            <p className="max-w-xs text-sm font-medium leading-relaxed">Choose a future date to manage published lesson slots.</p>
          </div>
        ) : (
          <div className="flex h-full w-full min-w-0 flex-col animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="mb-4 border-b border-secondary/10 pb-4 md:mb-6 md:pb-6">
              <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.16em] text-primary md:text-xs md:tracking-widest">Managing Availability</span>
              <h3 className="break-words text-xl font-black text-secondary md:text-2xl">
                {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
            </div>

            {/* List existing slots */}
            <div className="mb-5 min-w-0 flex-1 md:mb-8">
              <h4 className="mb-3 text-[10px] font-black uppercase tracking-widest text-secondary/40">Published slots</h4>
              {slots.filter(s => {
                  const [y,m,d] = s.date.split('-');
                  const slotDateStr = new Date(Number(y), Number(m)-1, Number(d)).toDateString();
                  return slotDateStr === selectedDate.toDateString();
                }).length === 0 ? (
                <div className="rounded-2xl border border-dashed border-secondary/10 bg-white/70 p-4">
                  <p className="text-sm font-bold text-secondary/60">No slots published yet.</p>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-secondary/40">Add a quick block or custom range so families can request this time.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {slots
                    .filter(s => {
                      const [y,m,d] = s.date.split('-');
                      const slotDateStr = new Date(Number(y), Number(m)-1, Number(d)).toDateString();
                      return slotDateStr === selectedDate.toDateString();
                    })
                    .sort((a,b) => a.start_time.localeCompare(b.start_time))
                    .map(slot => (
                    <div key={slot.id} className="group flex min-w-0 items-center justify-between gap-3 rounded-xl border border-secondary/10 bg-white p-3 shadow-sm">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-green-500"></span>
                        <span className="min-w-0 break-words text-sm font-bold text-secondary">
                          {formatTime(slot.start_time)} — {formatTime(slot.end_time)}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleDeleteSlot(slot.id)}
                        disabled={isPending}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-red-400 opacity-100 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50 sm:opacity-0 sm:group-hover:opacity-100"
                        title="Remove slot"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add new slots */}
            <div className="mt-auto min-w-0 rounded-2xl border border-secondary/10 bg-white p-4 shadow-sm md:p-6">
              <h4 className="mb-3 text-[10px] font-black uppercase tracking-widest text-secondary/40 md:mb-4">Quick add</h4>
              <div className="no-scrollbar mb-4 flex max-w-full snap-x gap-2 overflow-x-auto pb-3">
                {QUICK_BLOCKS.map(block => (
                  <button
                    key={block.start}
                    disabled={isPending}
                    onClick={() => handleQuickAdd(block.start, block.end)}
                    className="shrink-0 snap-start px-4 py-2 bg-slate-50 border border-secondary/10 rounded-xl text-xs font-bold text-secondary hover:border-primary hover:text-primary transition-colors hover:-translate-y-0.5 hover:shadow-sm disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {block.label}
                  </button>
                ))}
              </div>

              <div className="flex min-w-0 items-center gap-3 py-2">
                <div className="h-px bg-secondary/10 flex-1"></div>
                <span className="shrink-0 text-[10px] font-black uppercase text-secondary/30">Custom range</span>
                <div className="h-px bg-secondary/10 flex-1"></div>
              </div>

              <form onSubmit={handleAddSlot} className="mt-4 flex min-w-0 flex-col gap-4">
                <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3">
                  <input 
                    type="time" 
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    required
                    disabled={isPending}
                    className="min-w-0 rounded-xl border border-secondary/10 bg-slate-50 p-3 text-sm font-bold text-secondary outline-none focus:border-primary" 
                  />
                  <span className="font-black text-secondary/40">—</span>
                  <input 
                    type="time" 
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    required
                    disabled={isPending}
                    className="min-w-0 rounded-xl border border-secondary/10 bg-slate-50 p-3 text-sm font-bold text-secondary outline-none focus:border-primary" 
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isPending}
                  className="w-full py-3 bg-primary text-white rounded-xl font-black text-sm hover:bg-primary-hover transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                      Add Custom Range
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

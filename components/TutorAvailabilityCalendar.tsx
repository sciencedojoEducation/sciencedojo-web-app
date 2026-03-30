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
    <div className="bg-white rounded-[2rem] border border-secondary/10 shadow-sm overflow-hidden flex flex-col md:flex-row">
      {/* LEFT: Calendar Grid */}
      <div className="w-full md:w-1/2 p-6 md:p-8 border-b md:border-b-0 md:border-r border-secondary/5">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-black text-secondary">{MONTH_NAMES[month]}</h2>
            <p className="text-sm font-bold text-secondary/40">{year}</p>
          </div>
          <div className="flex gap-2">
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
      <div className="w-full md:w-1/2 p-6 md:p-8 bg-slate-50/50 flex flex-col items-center justify-center text-center">
        {!selectedDate ? (
          <div className="text-secondary/40">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="font-bold text-lg mb-1 text-secondary/60">Select a Date</p>
            <p className="text-sm">Click any future date on the calendar to manage your availability slots.</p>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-left border-b border-secondary/10 pb-6 mb-6">
              <span className="text-xs font-black uppercase tracking-widest text-primary mb-1 block">Managing Availability</span>
              <h3 className="text-2xl font-black text-secondary">
                {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
            </div>

            {/* List existing slots */}
            <div className="text-left mb-8 flex-1">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-secondary/40 mb-3">Published Slots</h4>
              {slots.filter(s => {
                  const [y,m,d] = s.date.split('-');
                  const slotDateStr = new Date(Number(y), Number(m)-1, Number(d)).toDateString();
                  return slotDateStr === selectedDate.toDateString();
                }).length === 0 ? (
                <p className="text-sm font-medium text-secondary/50 italic">No slots published for this day.</p>
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
                    <div key={slot.id} className="flex items-center justify-between p-3 rounded-xl bg-white border border-secondary/10 shadow-sm group">
                      <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="font-bold text-secondary text-sm">
                          {formatTime(slot.start_time)} — {formatTime(slot.end_time)}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleDeleteSlot(slot.id)}
                        disabled={isPending}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
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
            <div className="text-left bg-white p-6 rounded-2xl border border-secondary/10 shadow-sm mt-auto">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-secondary/40 mb-4">Quick Add 1-Hour Blocks</h4>
              <div className="flex gap-2 overflow-x-auto pb-4 mb-4 snap-x no-scrollbar">
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

              <div className="flex items-center gap-4 py-2">
                <div className="h-px bg-secondary/10 flex-1"></div>
                <span className="text-[10px] font-black uppercase text-secondary/30">OR CUSTOM RANGE</span>
                <div className="h-px bg-secondary/10 flex-1"></div>
              </div>

              <form onSubmit={handleAddSlot} className="mt-4 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <input 
                    type="time" 
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    required
                    disabled={isPending}
                    className="flex-1 p-3 bg-slate-50 border border-secondary/10 rounded-xl text-sm font-bold text-secondary focus:border-primary outline-none" 
                  />
                  <span className="text-secondary/40 font-black">—</span>
                  <input 
                    type="time" 
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    required
                    disabled={isPending}
                    className="flex-1 p-3 bg-slate-50 border border-secondary/10 rounded-xl text-sm font-bold text-secondary focus:border-primary outline-none" 
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

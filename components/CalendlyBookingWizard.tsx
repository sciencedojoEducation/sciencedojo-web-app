"use client";

import { AvailabilitySlot, TutorProfile } from "@/lib/supabase-queries";
import { useState, useTransition, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { fetchTutorSlots } from "@/app/tutor/actions";
import { createBookingRequest } from "@/app/tutor/actions";

interface Props {
  tutor: TutorProfile;
  initialSlots: AvailabilitySlot[];
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];
const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function formatTime(timeStr: string) {
  const [h, m] = timeStr.split(':');
  const d = new Date();
  d.setHours(parseInt(h, 10), parseInt(m, 10));
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase().replace(':00', '');
}

export default function CalendlyBookingWizard({ tutor, initialSlots }: Props) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>(initialSlots);
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [isPending, startTransition] = useTransition();

  // Booking State
  const [step, setStep] = useState<"calendar" | "details">("calendar");
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null); // YYYY-MM-DD
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<AvailabilitySlot | null>(null);
  
  // Refetch slots when month changes
  useEffect(() => {
    const y = currentMonthDate.getFullYear();
    const m = currentMonthDate.getMonth() + 1; // 1-12
    startTransition(async () => {
      const newSlots = await fetchTutorSlots(tutor.id, y, m);
      setSlots(newSlots);
    });
  }, [currentMonthDate, tutor.id]);

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDateOfMonth = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay(); 
  const totalDays = lastDateOfMonth.getDate();

  const handlePrevMonth = () => setCurrentMonthDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentMonthDate(new Date(year, month + 1, 1));

  // Build grid
  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= totalDays; i++) {
    days.push(new Date(year, month, i));
  }

  // Which slots are available on the selected date?
  const selectedDaySlots = selectedDateStr 
    ? slots.filter(s => s.date === selectedDateStr).sort((a,b) => a.start_time.localeCompare(b.start_time))
    : [];

  // If a slot is selected, check if we can extend to 2 hours
  let canBookTwoHours = false;
  if (selectedTimeSlot) {
    // If the tutor has another slot starting exactly when this one ends
    const consecutiveSlot = selectedDaySlots.find(s => s.start_time === selectedTimeSlot.end_time);
    if (consecutiveSlot) canBookTwoHours = true;
  }

  const [duration, setDuration] = useState<1 | 2>(1);
  const [recurrenceCount, setRecurrenceCount] = useState<number>(1);

  // If we pick a new slot that doesn't allow 2 hours, reset it
  useEffect(() => {
    if (!canBookTwoHours) setDuration(1);
  }, [selectedTimeSlot, canBookTwoHours]);

  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl border border-secondary/5 overflow-hidden flex flex-col md:flex-row relative min-h-[600px]">
      
      {/* Left Sidebar (Tutor Details) */}
      <div className="w-full md:w-[35%] bg-slate-50 border-b md:border-b-0 md:border-r border-secondary/10 p-8 md:p-12">
        <div className="h-20 w-20 rounded-2xl overflow-hidden border-4 border-white shadow-md mb-6">
          <Image 
            src={tutor.avatar_url || "/tutor_placeholder.webp"} 
            alt={tutor.full_name} 
            width={80} 
            height={80} 
            className="object-cover h-full w-full"
          />
        </div>
        <p className="text-secondary/40 font-black uppercase tracking-widest text-xs mb-1">Book a Session</p>
        <h2 className="text-2xl font-black text-secondary mb-8">{tutor.full_name.split(' ')[0]}</h2>

        <div className="space-y-4 text-sm font-bold text-secondary/70">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-secondary/30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {selectedTimeSlot ? `${duration} hour session` : "1 hour session (default)"}
          </div>
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-secondary/30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            Video Meeting
          </div>
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-secondary/30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            £{tutor.hourly_rate} / hour
          </div>

          {selectedTimeSlot && selectedDateStr && (
            <div className="pt-6 mt-6 border-t border-secondary/10 text-primary">
               <div className="flex items-center gap-3 mb-2">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                 {new Date(selectedDateStr.replace(/-/g, '/')).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric'})}
               </div>
               <div className="pl-8 mb-4">
                 {formatTime(selectedTimeSlot.start_time)}
               </div>
               <div className="space-y-2 text-xs font-bold text-secondary/60">
                 <div className="flex justify-between">
                    <span>Duration</span>
                    <span className="font-medium text-secondary">{duration} Hour{duration > 1 ? 's' : ''}</span>
                 </div>
                 {recurrenceCount > 1 && (
                   <div className="flex justify-between text-yellow-600">
                      <span>Recurring</span>
                      <span>{recurrenceCount} Weeks</span>
                   </div>
                 )}
               </div>
               {step === "details" && (
                <div className="p-4 mt-4 bg-primary/10 rounded-xl">
                   <div className="flex justify-between font-bold text-lg text-primary">
                      <span>Total</span>
                      <span>£{tutor.hourly_rate * duration * recurrenceCount}</span>
                   </div>
                   {recurrenceCount > 1 && (
                     <p className="text-[10px] text-primary/60 mt-1 uppercase font-black tracking-widest text-right">
                       £{tutor.hourly_rate * duration} × {recurrenceCount} weeks
                     </p>
                   )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Content Area */}
      <div className="w-full md:w-[65%] p-8 md:p-12 relative h-full">
        {step === "calendar" && (
          <div className="flex flex-col md:flex-row gap-10 animate-in fade-in h-full">
            
            {/* Calendar View */}
            <div className="flex-1">
              <h3 className="text-xl font-black text-secondary mb-8">Select a Date & Time</h3>
              
              <div className="flex items-center justify-between mb-6">
                <span className="font-bold text-secondary">{MONTH_NAMES[month]} {year}</span>
                <div className="flex gap-2">
                  <button onClick={handlePrevMonth} className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-secondary">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                  </button>
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
                  
                  const todayReset = new Date();
                  todayReset.setHours(0,0,0,0);
                  const isPast = day < todayReset;

                  const dayStr = [
                    day.getFullYear(),
                    String(day.getMonth() + 1).padStart(2, '0'),
                    String(day.getDate()).padStart(2, '0')
                  ].join('-');
                  
                  const isSelected = selectedDateStr === dayStr;
                  const hasSlots = slots.some(s => s.date === dayStr);

                  return (
                    <button
                      key={i}
                      disabled={isPast || !hasSlots}
                      onClick={() => {
                        setSelectedDateStr(dayStr);
                        setSelectedTimeSlot(null);
                      }}
                      className={`
                        relative aspect-square p-1 rounded-full flex items-center justify-center text-sm font-bold transition-all
                        ${isPast || !hasSlots ? 'text-secondary/20 cursor-not-allowed bg-transparent' : 'hover:bg-primary/10 text-primary bg-primary/5'}
                        ${isSelected ? '!bg-primary text-white shadow-md shadow-primary/20 scale-105' : ''}
                      `}
                    >
                      {day.getDate()}
                      {hasSlots && !isSelected && !isPast && (
                        <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary/40"></span>
                      )}
                    </button>
                  );
                })}
              </div>

              {slots.length === 0 && !isPending && (
                <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-sm font-medium">
                  This tutor has no available sessions this month.
                </div>
              )}
            </div>

            {/* Time Slot Picker */}
            {selectedDateStr && (
              <div className="w-full md:w-48 flex flex-col pt-[4.5rem] animate-in slide-in-from-right-8 duration-300">
                <span className="text-xs font-black uppercase tracking-widest text-secondary/40 mb-4 block">
                  {new Date(selectedDateStr.replace(/-/g, '/')).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric' })}
                </span>
                
                <div className="flex flex-col gap-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                  {selectedDaySlots.map((slot) => {
                    const isSelected = selectedTimeSlot?.id === slot.id;
                    return (
                      <div key={slot.id} className="relative">
                        <button
                          onClick={() => setSelectedTimeSlot(slot)}
                          className={`
                            w-full py-3.5 rounded-xl font-bold text-sm transition-all border
                            ${isSelected 
                                ? "bg-secondary text-white border-secondary" 
                                : "bg-white text-primary border-primary/20 hover:border-primary"
                            }
                          `}
                        >
                          {formatTime(slot.start_time)}
                        </button>
                        
                        {/* Expand to Next Button when selected */}
                        {isSelected && (
                          <div className="flex gap-2 mt-2 animate-in slide-in-from-top-2 fade-in duration-200">
                             <button
                               onClick={() => setStep("details")}
                               className="flex-1 py-3 bg-primary text-white font-black text-sm rounded-xl shadow-lg hover:bg-primary-hover active:scale-95 transition-all"
                             >
                               Next
                             </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
          </div>
        )}

        {/* DETAILS STEP */}
        {step === "details" && selectedTimeSlot && selectedDateStr && (
          <form action={createBookingRequest} className="animate-in fade-in slide-in-from-right-4 duration-300 h-full flex flex-col">
            <input type="hidden" name="tutorId" value={tutor.id} />
            <input type="hidden" name="hourlyRate" value={tutor.hourly_rate} />
            
            {/* We must construct the true datetime local format for requestedDate: YYYY-MM-DDTHH:MM */}
            <input type="hidden" name="requestedDate" value={`${selectedDateStr}T${selectedTimeSlot.start_time.substring(0, 5)}`} />
            <input type="hidden" name="durationHours" value={duration} />
            <input type="hidden" name="recurrenceCount" value={recurrenceCount} />

            <div className="flex items-center gap-4 mb-8">
              <button 
                type="button" 
                onClick={() => setStep("calendar")}
                className="w-10 h-10 rounded-full border border-secondary/10 flex items-center justify-center text-secondary/40 hover:text-secondary hover:bg-slate-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <h3 className="text-2xl font-black text-secondary">Session Details</h3>
            </div>

            <div className="space-y-6 flex-1">
              {/* Duration Toggle */}
              {canBookTwoHours && (
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-secondary/60 mb-2">Duration</label>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => setDuration(1)}
                      className={`flex-1 py-3 rounded-xl font-bold border transition-colors ${duration === 1 ? 'bg-primary border-primary text-white shadow-md' : 'bg-white border-secondary/10 text-secondary hover:border-primary/50'}`}
                    >
                      1 Hour
                    </button>
                    <button 
                      type="button"
                      onClick={() => setDuration(2)}
                      className={`flex-1 py-3 rounded-xl font-bold border transition-colors ${duration === 2 ? 'bg-primary border-primary text-white shadow-md' : 'bg-white border-secondary/10 text-secondary hover:border-primary/50'}`}
                    >
                      2 Hours (Consecutive)
                    </button>
                  </div>
                </div>
              )}

              {/* Recurrence Dropdown */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-secondary/60 mb-2">Schedule</label>
                <div className="relative">
                  <select 
                    name="recurrence"
                    value={recurrenceCount}
                    onChange={(e) => setRecurrenceCount(Number(e.target.value))}
                    className="w-full px-5 py-3 pr-12 rounded-xl bg-slate-50 border border-secondary/10 focus:border-primary outline-none transition-all font-bold text-secondary text-sm appearance-none cursor-pointer"
                  >
                    <option value={1}>Just Once</option>
                    <option value={4}>Weekly (4-week block) — Most Popular</option>
                    <option value={8}>Weekly (8-week block)</option>
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-secondary/40">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-secondary/60 mb-2">Select Subject</label>
                <div className="relative">
                  <select 
                    name="subject" 
                    required
                    className="w-full px-5 py-3 pr-12 rounded-xl bg-slate-50 border border-secondary/10 focus:border-primary outline-none transition-all font-bold text-secondary text-sm appearance-none cursor-pointer"
                  >
                    {tutor.subjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-secondary/40">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-secondary/60 mb-2">What do you need help with?</label>
                <textarea 
                  name="description" 
                  required
                  rows={4}
                  placeholder={`Hi ${tutor.full_name.split(' ')[0]}, I need help with...`}
                  className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-secondary/10 focus:border-primary outline-none transition-all font-medium text-secondary text-sm resize-none"
                ></textarea>
                <p className="mt-2 text-[10px] font-black uppercase text-secondary/30 italic">Not charged until tutor confirms.</p>
              </div>
            </div>

            <div className="pt-6 border-t border-secondary/10 mt-auto flex justify-end">
               <button 
                 type="submit"
                 className="w-full md:w-auto px-10 py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:-translate-y-1 hover:bg-primary-hover active:scale-95 transition-all text-sm"
               >
                 Request Session
               </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

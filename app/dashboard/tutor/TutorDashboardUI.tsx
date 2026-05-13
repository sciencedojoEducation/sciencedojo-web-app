"use client";

import { Booking, TutorProfile, AvailabilitySlot } from "@/lib/supabase-queries";
import { Announcement } from "@/lib/announcement-queries";
import { useState } from "react";
import Link from "next/link";
import { updateBookingStatus, updateTutorProfile, completeSessionAction } from "@/app/tutor/actions";
import TutorSchedule from "@/components/TutorSchedule";
import TutorAvailabilityCalendar from "@/components/TutorAvailabilityCalendar";
import ImageCropper from "@/components/ImageCropper";
import AnnouncementFeed from "@/components/AnnouncementFeed";

// Deterministically pick a gradient based on a string (name or id)
const AVATAR_GRADIENTS = [
  "from-violet-500 to-indigo-500",
  "from-pink-500 to-rose-500",
  "from-amber-500 to-orange-500",
  "from-emerald-500 to-teal-500",
  "from-sky-500 to-blue-500",
  "from-purple-500 to-fuchsia-500",
  "from-green-500 to-lime-500",
  "from-red-500 to-pink-500",
];

function getAvatarGradient(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

function StudentAvatar({ name, avatarUrl, sizePx = 64 }: { name: string; avatarUrl?: string; sizePx?: number }) {
  const gradient = getAvatarGradient(name);
  const initials = name
    .split(' ')
    .map(w => w.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const sizeStyle = { width: sizePx, height: sizePx, minWidth: sizePx };

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        style={sizeStyle}
        className="object-cover rounded-2xl shadow-lg"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }

  return (
    <div style={sizeStyle} className={`rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
      <span className="text-white font-black text-xl tracking-tight drop-shadow">{initials}</span>
    </div>
  );
}

interface TutorDashboardUIProps {
  userId: string;
  userName: string;
  avatarUrl?: string;
  bookings: Booking[];
  tutorData: TutorProfile | null;
  slots: AvailabilitySlot[];
  announcements: Announcement[];
}

export default function TutorDashboardUI({ userId, userName, avatarUrl, bookings, tutorData, slots, announcements }: TutorDashboardUIProps) {
  const [activeTab, setActiveTab] = useState<"schedule" | "requests" | "sessions" | "availability" | "students">("schedule");
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [bio, setBio] = useState(tutorData?.bio || "");
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCropImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (blob: Blob) => {
    setCroppedBlob(blob);
    setPreviewUrl(URL.createObjectURL(blob));
    setCropImage(null);
  };

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);
    
    const formData = new FormData(e.currentTarget);
    
    // If we have a cropped blob, replace the original 'avatar' field
    if (croppedBlob) {
      formData.set("avatar", croppedBlob, "avatar.jpg");
    }

    try {
      await updateTutorProfile(formData);
      setShowProfileModal(false);
      // Optional: window.location.reload() or refresh data if needed
      // Actually actions usually handle revalidation
    } catch (err) {
      console.error("Profile update failed:", err);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const requested = bookings.filter(b => b.status === "requested");
  const groupedRequested = Object.values(requested.reduce((acc, booking) => {
    const groupId = booking.recurrence_group_id || booking.id;
    if (!acc[groupId]) {
      acc[groupId] = {
        id: groupId,
        isGroup: !!booking.recurrence_group_id,
        count: 0,
        mainBooking: booking,
        items: []
      };
    }
    acc[groupId].items.push(booking);
    acc[groupId].count++;
    return acc;
  }, {} as Record<string, { id: string, isGroup: boolean, count: number, mainBooking: Booking, items: Booking[] }>));

  const upcoming = bookings.filter(b => b.status === "confirmed" || b.status === "accepted");
  const past = bookings.filter(b => b.status === "completed");

  const totalEarnings = past.reduce((sum, b) => sum + Number(b.price_at_booking), 0);
  const hoursTaught = past.length; // Assuming 1 hour per session for now

  const TABS = [
    {
      id: "schedule" as const,
      label: "Schedule",
      mobileLabel: "Today",
      helper: "What needs teaching next.",
      badge: null,
    },
    {
      id: "requests" as const,
      label: "Requests",
      mobileLabel: "Requests",
      helper: "Requests awaiting response.",
      badge: requested.length || null,
    },
    {
      id: "sessions" as const,
      label: "Sessions",
      mobileLabel: "Sessions",
      helper: "Confirmed lessons and summaries.",
      badge: upcoming.length || null,
    },
    {
      id: "students" as const,
      label: "Students",
      mobileLabel: "Students",
      helper: "Student history and classrooms.",
      badge: null,
    },
    {
      id: "availability" as const,
      label: "Availability",
      mobileLabel: "Availability",
      helper: "Manage requestable times.",
      badge: slots.length > 0 ? "Set" : null,
    },
  ];

  // Classroom grouping logic
  const studentsMap: Record<string, { name: string; avatar: string; classId?: string; history: Booking[] }> = {};
  past.forEach(b => {
    if (!studentsMap[b.student_id]) {
      studentsMap[b.student_id] = { 
        name: b.student_name || "ScienceDojo Student", 
        avatar: b.student_avatar || "", 
        classId: (b as any).class_id,
        history: [] 
      };
    }
    studentsMap[b.student_id].history.push(b);
  });
  const studentList = Object.entries(studentsMap).map(([id, data]) => ({ id, ...data }));
  const activeTabDetails = TABS.find((tab) => tab.id === activeTab) || TABS[0];

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-3 py-5 sm:p-6 md:space-y-10 md:p-8">
      {/* Verification Status Banner */}
      {!tutorData?.is_verified && (
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-[1.5rem] flex flex-col md:flex-row items-center gap-4 shadow-sm shadow-amber-900/5 animate-in slide-in-from-top-4 duration-500 md:border-2 md:p-8 md:rounded-[2rem] md:gap-6 md:shadow-xl">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-2xl shrink-0 md:h-16 md:w-16 md:rounded-2xl md:text-3xl">⏳</div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-xl font-black text-amber-900 tracking-tight mb-1">Account Under Review 🥋</h2>
            <p className="text-amber-700/70 text-sm font-medium leading-relaxed">
              Welcome to the ScienceDojo team! Our admins are currently reviewing your profile. 
              Until you're verified, your profile won't appear in the public marketplace, but you can still set your availability and polish your bio below.
            </p>
          </div>
          <div className="shrink-0">
            <span className="px-4 py-2 bg-amber-200/50 text-amber-800 text-[10px] font-black uppercase tracking-widest rounded-full border border-amber-300">Pending Review</span>
          </div>
        </div>
      )}

      {/* Platform Announcements Hub */}
      {announcements.length > 0 && (
         <AnnouncementFeed announcements={announcements} />
      )}

      <div data-tour="tutor-welcome" className="rounded-[1.5rem] border border-secondary/5 bg-white p-4 shadow-sm md:rounded-[2rem] md:p-6">
         <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex h-14 w-14 shrink-0 rotate-2 items-center justify-center overflow-hidden rounded-2xl border-2 border-white bg-accent/10 shadow-md transition-transform hover:rotate-0 sm:h-20 sm:w-20 sm:border-4 sm:shadow-xl">
               {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
               ) : (
                  <span className="text-2xl font-black text-accent sm:text-3xl">{userName.charAt(0)}</span>
               )}
            </div>
            <div className="min-w-0">
               <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-secondary/35">Tutor workspace</p>
               <h1 className="mb-1 break-words bg-gradient-to-r from-accent to-accent-hover bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-4xl">
                  Hello, {userName.trim().split(' ')[0]}!
               </h1>
               <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <p className="flex items-center gap-2 text-sm font-bold text-secondary/60">
                    <span className="h-2 w-2 rounded-full bg-accent"></span>
                    Teach, review, and manage today’s support.
                  </p>
                  <button 
                    onClick={() => setShowProfileModal(true)}
                    data-tour="tutor-profile"
                    className="text-[10px] font-black uppercase tracking-widest text-accent underline-offset-4 hover:underline"
                  >
                    Edit Profile
                  </button>
               </div>
            </div>
         </div>

         <div className="mt-4 grid grid-cols-3 gap-2 border-t border-secondary/5 pt-4 md:gap-3">
           <div className="rounded-2xl bg-slate-50 p-3">
             <p className="text-[9px] font-black uppercase tracking-widest text-secondary/35">Upcoming</p>
             <p className="mt-1 text-lg font-black text-secondary">{upcoming.length}</p>
           </div>
           <div className="rounded-2xl bg-slate-50 p-3">
             <p className="text-[9px] font-black uppercase tracking-widest text-secondary/35">Requests</p>
             <p className="mt-1 text-lg font-black text-accent">{requested.length}</p>
           </div>
           <div className="rounded-2xl bg-slate-50 p-3">
             <p className="text-[9px] font-black uppercase tracking-widest text-secondary/35">Students</p>
             <p className="mt-1 text-lg font-black text-secondary">{studentList.length}</p>
           </div>
         </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-10">
         <div className="lg:col-span-2 space-y-6">

            {/* Workspace navigation */}
            <div data-tour="tutor-tabs" className="space-y-3">
              <div className="lg:hidden">
                <div className="grid grid-cols-5 gap-1 rounded-2xl bg-slate-100/80 p-1.5">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative min-w-0 rounded-xl px-1.5 py-2.5 text-center transition-all ${
                        activeTab === tab.id
                          ? "bg-white text-secondary shadow-sm"
                          : "text-secondary/40 hover:text-secondary/70"
                      }`}
                    >
                      <span className="block truncate text-[11px] font-black sm:text-xs">{tab.mobileLabel}</span>
                      {tab.badge !== null && (
                        <span className={`absolute -right-1 -top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full px-1 text-[8px] font-black ${
                          activeTab === tab.id ? "bg-accent text-white" : "bg-secondary/10 text-secondary/50"
                        }`}>
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="hidden items-center gap-1 overflow-x-auto rounded-2xl bg-slate-100/80 p-1.5 lg:flex">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-black transition-all ${
                      activeTab === tab.id
                        ? "bg-white shadow-sm text-secondary"
                        : "text-secondary/40 hover:text-secondary/70"
                    }`}
                  >
                    {tab.label}
                    {tab.badge !== null && (
                      <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-black ${
                        activeTab === tab.id ? "bg-accent text-white" : "bg-secondary/10 text-secondary/50"
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-start justify-between gap-3 rounded-2xl border border-secondary/5 bg-white px-4 py-3 shadow-sm lg:hidden">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-secondary/35">Workspace</p>
                <h2 className="mt-1 text-base font-black text-secondary">{activeTabDetails.mobileLabel}</h2>
                <p className="mt-0.5 text-xs font-medium leading-relaxed text-secondary/50">{activeTabDetails.helper}</p>
              </div>
              {activeTabDetails.badge !== null && (
                <span className="shrink-0 rounded-full bg-accent/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-accent">
                  {activeTabDetails.badge}
                </span>
              )}
            </div>

            {/* Schedule Tab */}
            {activeTab === "schedule" && (
              <div data-tour="tutor-main-action">
                <TutorSchedule bookings={bookings} />
              </div>
            )}

            {/* Availability Tab */}
            {activeTab === "availability" && (
              <TutorAvailabilityCalendar slots={slots} />
            )}
            {/* Requests Tab */}
            {activeTab === "requests" && (
              <section className="bg-white rounded-[1.5rem] p-4 border border-accent/20 shadow-sm shadow-accent/5 md:rounded-[2rem] md:p-8 md:border-2 md:shadow-xl">
                <h2 className="text-xl font-black text-secondary mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:text-2xl md:mb-6">
                  <span>New lesson requests</span>
                  <span className="px-3 py-1 bg-accent/10 text-accent text-[10px] rounded-full tracking-widest uppercase">Awaiting response</span>
                </h2>
                <div className="space-y-6">
                   {groupedRequested.map(group => {
                      const booking = group.mainBooking;
                      return (
                      <div key={group.id} className="p-4 rounded-2xl bg-slate-50 border border-secondary/5 flex flex-col gap-4 md:p-6">
                         <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
                            <div className="flex flex-col gap-2">
                               <div className="flex items-center gap-4">
                                 <span className="px-3 py-1 bg-white border border-secondary/10 text-secondary text-[10px] font-black rounded-lg uppercase tracking-wider">{booking.subject}</span>
                                 <div className="flex items-center gap-1.5 text-xs font-black text-accent uppercase tracking-tight">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
                                    {new Date(booking.requested_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                 </div>
                               </div>
                               {group.isGroup && (
                                 <span className="inline-block px-2 py-0.5 bg-yellow-100 text-yellow-800 text-[9px] font-black uppercase tracking-widest rounded w-fit">
                                   Recurring: {group.count} Sessions
                                 </span>
                               )}
                            </div>
                            <div className="text-right">
                               <div className="text-xl font-black text-secondary">
                                 £{booking.price_at_booking * group.count}
                                 <span className="text-[10px] text-secondary/40">/total</span>
                               </div>
                               {group.isGroup && (
                                 <div className="text-[10px] text-secondary/40 font-bold">
                                   (£{booking.price_at_booking}/session)
                                 </div>
                               )}
                            </div>
                         </div>
                         
                         <p className="text-secondary/70 text-sm font-medium leading-relaxed italic">
                            "{booking.description}"
                         </p>

                         <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                            <form action={updateBookingStatus} className="flex-1">
                               <input type="hidden" name="bookingId" value={booking.id} />
                               {group.isGroup && <input type="hidden" name="recurrenceGroupId" value={booking.recurrence_group_id || ""} />}
                               <input type="hidden" name="status" value="accepted" />
                               <button className="w-full py-3 bg-secondary text-white font-black rounded-xl hover:bg-secondary/90 transition-all shadow-lg active:scale-95 text-sm">
                                  Accept and invoice
                               </button>
                            </form>
                            <form action={updateBookingStatus} className="sm:w-auto">
                               <input type="hidden" name="bookingId" value={booking.id} />
                               {group.isGroup && <input type="hidden" name="recurrenceGroupId" value={booking.recurrence_group_id || ""} />}
                               <input type="hidden" name="status" value="declined" />
                               <button className="w-full px-6 py-3 bg-white text-secondary/40 font-bold rounded-xl border border-secondary/10 hover:text-red-500 hover:border-red-500 transition-all text-sm sm:w-auto">
                                  Decline
                               </button>
                            </form>
                         </div>
                      </div>
                   )})}
                </div>
              </section>
            )}

            {/* Sessions Tab */}
            {activeTab === "sessions" && (
              <section>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5 md:mb-6">
                   <h2 className="text-xl font-black text-secondary md:text-2xl">Confirmed Sessions</h2>
                   <a href={`/api/calendar?id=${userId}`} target="_blank" className="px-4 py-2 bg-slate-100 text-secondary/60 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
                      Sync iCal
                   </a>
                </div>
                <div className="space-y-4">
                 {upcoming.map(booking => (
                    <div key={booking.id} className="bg-white p-4 rounded-2xl border-l-4 border-l-primary border border-secondary/10 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:shadow-md transition-shadow md:p-6 md:rounded-3xl md:border-l-8">
                       <div>
                          <div className="text-xs font-black text-primary mb-1 uppercase tracking-[0.2em]">{booking.subject}</div>
                          <h3 className="font-black text-secondary text-xl">
                             {new Date(booking.requested_date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                          </h3>
                        <div className="flex items-center gap-4 mt-1">
                           <StudentAvatar name={booking.student_name || "Student"} avatarUrl={booking.student_avatar} sizePx={32} />
                           <p className="text-secondary/60 text-sm font-bold">{booking.student_name}</p>
                        </div>
                       </div>
                       <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                          <a href={booking.meeting_url || "#"} target="_blank" rel="noreferrer" className="px-6 py-3 bg-primary text-center text-white font-black rounded-2xl hover:bg-primary-hover transition-all shadow-xl text-sm md:px-8">
                             Launch Dojo
                          </a>
                          <button 
                             onClick={() => {
                               setSelectedBookingId(booking.id);
                               setShowNotesModal(true);
                             }}
                             className="px-6 py-3 bg-secondary text-white font-black rounded-2xl hover:bg-secondary/90 transition-all shadow-md text-sm"
                          >
                             Mark as Complete
                          </button>
                       </div>
                    </div>
                 ))}
                 {upcoming.length === 0 && (
                    <div className="p-7 bg-white rounded-[1.5rem] border border-dashed border-secondary/10 text-center text-secondary/30 font-bold uppercase tracking-[0.12em] md:p-12 md:rounded-[2rem] md:border-2 md:tracking-widest">
                       Confirmed lessons will appear here.
                    </div>
                 )}
                </div>
              </section>
            )}

            {/* Students Tab */}
            {activeTab === "students" && (
               <section className="space-y-5 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-secondary md:text-2xl">Your Students</h2>
                    <span className="text-[10px] font-black text-secondary/40 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">Total: {studentList.length}</span>
                  </div>
                  
                  <div className="space-y-4 md:space-y-6">
                     {studentList.map(student => (
                        <div key={student.id} className="bg-white rounded-[2rem] border border-secondary/5 overflow-hidden shadow-xl hover:shadow-2xl transition-all group">
                           <div className="p-4 flex flex-col gap-4 bg-slate-50/50 sm:flex-row sm:items-center sm:justify-between md:p-8">
                              <div className="flex items-center gap-4 md:gap-5">
                                 <StudentAvatar name={student.name} avatarUrl={student.avatar} sizePx={52} />
                                 <div>
                                    <h3 className="text-xl font-black text-secondary">{student.name}</h3>
                                    <p className="text-xs font-bold text-secondary/40">{student.history.length} lessons completed</p>
                                 </div>
                              </div>
                              <Link href={(student.classId && student.classId !== "undefined") ? `/dashboard/classes/${student.classId}` : "/dashboard/classes"} className="text-[10px] font-black py-2 px-4 bg-accent/10 hover:bg-accent/20 transition-colors text-accent rounded-full uppercase tracking-widest flex items-center gap-2">
                                 Open Classroom <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                              </Link>
                           </div>
                           
                           <div className="p-4 space-y-4 md:p-8">
                              <h4 className="text-[10px] font-black text-secondary/30 uppercase tracking-[0.14em] mb-4">Lesson timeline</h4>
                              <div className="relative pl-5 border-l-2 border-slate-100 space-y-5 md:pl-8 md:space-y-8">
                                 {student.history.map((lesson, idx) => (
                                    <div key={lesson.id} className="relative">
                                       {/* Timeline Dot */}
                                       <div className="absolute -left-[1.85rem] top-1 w-3 h-3 rounded-full border-2 border-white bg-primary shadow-md md:-left-[3.1rem] md:h-4 md:w-4 md:border-4"></div>
                                       
                                       <div className="flex flex-col gap-2">
                                          <div className="flex items-center justify-between">
                                             <span className="text-xs font-black text-secondary">{new Date(lesson.requested_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                             <span className="text-[9px] font-black text-secondary/40 bg-slate-100 px-2 py-0.5 rounded uppercase">{lesson.subject}</span>
                                          </div>
                                          <div className="bg-slate-50 p-4 rounded-2xl border border-secondary/5 md:p-6">
                                             <div className="mb-3">
                                                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Lesson Recap</p>
                                                <p className="text-sm text-secondary/70 font-medium italic">"{lesson.lesson_notes?.summary || "No notes provided."}"</p>
                                             </div>
                                             {lesson.lesson_notes?.homework && (
                                                <div className="pt-3 border-t border-secondary/5">
                                                   <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Homework Assigned</p>
                                                   <p className="text-sm text-secondary/70 font-medium italic">"{lesson.lesson_notes?.homework}"</p>
                                                </div>
                                             )}
                                          </div>
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        </div>
                     ))}
                     {studentList.length === 0 && (
                        <div className="p-8 text-center bg-white rounded-[1.5rem] border border-dashed border-secondary/10 flex flex-col items-center gap-4 md:p-20 md:rounded-[2.5rem] md:border-2">
                           <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-3xl opacity-20 text-secondary">🎓</div>
                           <p className="text-secondary/35 font-black uppercase tracking-[0.12em] text-xs">Your student list will build as lessons are completed.</p>
                        </div>
                     )}
                  </div>
               </section>
            )}

         </div>

         <div className="space-y-5 md:space-y-8">
            <h2 className="text-xl font-black text-secondary mb-4 flex items-center gap-3">
              <span className="h-6 w-1 bg-accent rounded-full"></span>
              Tutor overview
            </h2>
            <div data-tour="tutor-stats" className="group relative overflow-hidden rounded-[1.5rem] border border-secondary/5 bg-white p-5 shadow-sm md:rounded-[2rem] md:p-7">
               <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-bl-[4rem] group-hover:scale-110 transition-transform"></div>
               <h3 className="font-black text-secondary mb-2">Tutor snapshot</h3>
               <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm font-bold">
                     <span className="text-secondary/40">Total Earnings</span>
                     <span className="text-secondary font-black text-lg">£{totalEarnings.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold">
                     <span className="text-secondary/40">Hours Taught</span>
                     <span className="text-secondary font-black">{hoursTaught.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold">
                     <span className="text-secondary/40">Open Requests</span>
                     <span className="text-accent font-black">{requested.length}</span>
                  </div>
               </div>
               
               <div className="mt-6 border-t border-secondary/5 pt-6 text-center md:mt-8 md:pt-8">
                  <p className="text-[10px] text-secondary/30 font-black uppercase tracking-[0.3em] mb-4">
                    {tutorData?.is_verified ? "Verified tutor" : "Verification in progress"}
                  </p>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r from-accent to-accent-hover rounded-full transition-all duration-1000 ${tutorData?.is_verified ? 'w-full' : 'w-1/2 animate-pulse'}`}></div>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {showProfileModal && (
         <div className="fixed inset-0 bg-secondary/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-8">
               <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-black text-secondary">Tutor profile</h2>
                  <button onClick={() => setShowProfileModal(false)} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-secondary/40 hover:text-secondary transition-colors text-xl">×</button>
               </div>
               
               <form onSubmit={handleProfileSubmit} className="space-y-6">
                  {/* Real Avatar Upload */}
                  <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-[2rem] border border-secondary/5 group/avatar">
                     <div className="w-20 h-20 rounded-2xl bg-accent/10 overflow-hidden flex-shrink-0 relative">
                        {previewUrl ? <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                           <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                     </div>
                     <div className="flex-1">
                        <label className="block text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-1">Update Photo</label>
                        <input 
                           name="avatar" 
                           type="file" 
                           accept="image/*" 
                           onChange={handleFileChange}
                           className="w-full text-xs font-bold text-secondary focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-accent/10 file:text-accent hover:file:bg-accent/20 transition-all cursor-pointer" 
                        />
                        <input name="currentAvatarUrl" type="hidden" value={avatarUrl} />
                     </div>
                  </div>

                  <div>
                     <div className="flex justify-between items-center mb-2">
                        <label className="block text-[10px] font-black text-secondary/40 uppercase tracking-widest">Your Professional Bio</label>
                        <span className="text-[10px] font-bold text-secondary/20">Profile preview</span>
                     </div>
                     <div className="relative">
                        <textarea 
                           name="bio"
                           rows={4} 
                           value={bio}
                           onChange={(e) => setBio(e.target.value)}
                           className="w-full p-4 rounded-2xl border border-secondary/10 bg-slate-50 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all font-medium text-secondary relative z-10 bg-transparent"
                        ></textarea>
                        {!bio && (
                           <div className="absolute top-4 left-4 text-secondary/20 font-medium pointer-events-none italic text-sm">
                              PhD in Chemistry from MIT. Specializes in making complex molecular concepts simple and intuitive... (Suggestion)
                           </div>
                        )}
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2">Hourly Rate (£)</label>
                        <input name="hourlyRate" type="number" defaultValue={tutorData?.hourly_rate || 0} className="w-full p-4 rounded-2xl border border-secondary/10 bg-slate-50 focus:outline-none focus:border-accent font-black text-secondary" />
                     </div>
                     <div>
                        <label className="block text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2">Subjects (CSV)</label>
                        <input name="subjects" type="text" defaultValue={tutorData?.subjects.join(', ')} className="w-full p-4 rounded-2xl border border-secondary/10 bg-slate-50 focus:outline-none focus:border-accent font-bold text-secondary text-sm" placeholder="Math, Physics..." />
                     </div>
                  </div>

                  <div className="pt-4">
                     <button 
                        type="submit" 
                        disabled={isUploading}
                        className="w-full py-4 bg-accent text-white font-black rounded-2xl hover:bg-accent-hover transition-all shadow-xl shadow-accent/20 active:scale-[0.98] disabled:opacity-50 h-[60px] flex items-center justify-center"
                     >
                        {isUploading ? (
                          <span className="flex items-center gap-3">
                             <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                             Saving...
                          </span>
                        ) : "Save Public Profile"}
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {cropImage && (
         <ImageCropper 
           image={cropImage || ""} 
           onCropComplete={handleCropComplete} 
           onCancel={() => setCropImage(null)} 
         />
      )}

      {showNotesModal && (
         <div className="fixed inset-0 bg-secondary/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
               <div className="flex justify-between items-center mb-6">
                  <h2 className="text-3xl font-black text-secondary">Session Summary</h2>
                  <button onClick={() => setShowNotesModal(false)} className="text-2xl text-secondary/40 hover:text-secondary transition-colors">×</button>
               </div>
               <p className="text-sm text-secondary/50 font-medium mb-8">This note will be emailed directly to the parent's registered email address for transparency.</p>
               
               <form action={completeSessionAction} className="space-y-6">
                  <input type="hidden" name="bookingId" value={selectedBookingId || ""} />
                  <div>
                     <label className="block text-xs font-black text-secondary/40 uppercase tracking-widest mb-2">What was covered?</label>
                     <textarea 
                        name="summary"
                        required
                        rows={3} 
                        className="w-full p-4 rounded-2xl border border-secondary/10 bg-slate-50 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium" 
                        placeholder="Today we focused on stoichiometry and balancing equations..."
                     ></textarea>
                  </div>
                  <div>
                     <label className="block text-xs font-black text-secondary/40 uppercase tracking-widest mb-2">Homework Assigned</label>
                     <textarea 
                        name="homework"
                        rows={2} 
                        className="w-full p-4 rounded-2xl border border-secondary/10 bg-slate-50 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium" 
                        placeholder="Complete worksheets 4A and 4B..."
                     ></textarea>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                     <button type="button" onClick={() => setShowNotesModal(false)} className="px-8 py-3 text-secondary/40 font-bold hover:text-secondary rounded-xl transition-colors">Discard</button>
                     <button type="submit" className="px-10 py-3 bg-primary text-white font-black rounded-xl hover:bg-primary-hover transition-all shadow-lg active:scale-95">
                        Submit Summary & Earn
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}
    </div>
  );
}

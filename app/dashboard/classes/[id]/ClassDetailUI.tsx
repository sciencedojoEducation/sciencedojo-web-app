"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClassRoom, ClassPost } from "@/lib/class-queries";
import ClassPostComposer from "@/components/ClassPostComposer";
import ClassFeed from "@/components/ClassFeed";
import LessonHistoryTable from "@/components/LessonHistoryTable";
import { updateClassSettings, archiveClass, unarchiveClass, fetchPostById } from "@/app/classes/actions";
import { createClient } from "@/utils/supabase/client";
import { createMeetingUrl } from "@/lib/meetings";
import { CLASS_THEME_SWATCHES, getClassSubjectTheme } from "@/lib/class-theme";
import MissionsDashboard from "./missions/MissionsDashboard";



interface ClassDetailUIProps {
  classRoom: ClassRoom;
  posts: ClassPost[];
  bookings: any[];
  isTutor: boolean;
  currentUserId: string;
}

export default function ClassDetailUI({ classRoom, posts: initialPosts, bookings, isTutor, currentUserId }: ClassDetailUIProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"stream" | "assignments" | "sessions">("stream");
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(classRoom.display_name);
  const [isArchiving, setIsArchiving] = useState(false);
  const initialTheme = getClassSubjectTheme(classRoom.subject, classRoom.cover_color);
  const [currentCoverColor, setCurrentCoverColor] = useState(initialTheme.color);
  const [isSettingUpMeeting, setIsSettingUpMeeting] = useState(false);

  
  // Real-time State
  const [posts, setPosts] = useState<ClassPost[]>(initialPosts);

  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  const isStudent = currentUserId === classRoom.student_id;
  const otherName = isStudent ? classRoom.tutor_name : classRoom.student_name;
  const otherAvatar = isStudent ? classRoom.tutor_avatar : classRoom.student_avatar;

  // 💎 Real-time Sync Logic
  useEffect(() => {
    const supabase = createClient();
    
    const channel = supabase
      .channel(`class-stream-${classRoom.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'class_posts',
          filter: `class_id=eq.${classRoom.id}`
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const fullPost = await fetchPostById(payload.new.id);
            if (fullPost) {
               setPosts(current => current.some(post => post.id === fullPost.id) ? current : [fullPost, ...current]);
            }
          } else if (payload.eventType === 'UPDATE') {
             const fullPost = await fetchPostById(payload.new.id);
             if (fullPost) {
                setPosts(current => current.map(p => p.id === fullPost.id ? fullPost : p));
             }
          } else if (payload.eventType === 'DELETE') {
             setPosts(current => current.filter(p => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [classRoom.id]);

  const handleNameSave = async () => {
    if (displayName.trim() && displayName !== classRoom.display_name) {
      const formData = new FormData();
      formData.set("classId", classRoom.id);
      formData.set("displayName", displayName);
      try {
         await updateClassSettings(formData);
      } catch(e) {
         console.error(e);
      }
    }
    setIsEditingName(false);
  };

  const handleColorChange = async (color: string) => {
    setCurrentCoverColor(color);
    const formData = new FormData();
    formData.set("classId", classRoom.id);
    formData.set("coverColor", color);
    try {
      await updateClassSettings(formData);
    } catch(e) {
      console.error(e);
    }
  };

  const assignmentPosts = posts.filter(p => p.post_type === "assignment");
  const pastBookings = bookings.filter(b => b.status === "completed");
  const currentTheme = getClassSubjectTheme(classRoom.subject, currentCoverColor);

  const handleArchiveToggle = async () => {
     const isArchived = classRoom.is_archived;
     const confirmMsg = isArchived 
        ? "Restore this class to active status?" 
        : "Archive this class? It will be removed from your active dashboard.";
     
     if (confirm(confirmMsg)) {
         setIsArchiving(true);
         try {
             if (isArchived) {
                 await unarchiveClass(classRoom.id);
             } else {
                 await archiveClass(classRoom.id);
             }
         } catch(e) {
             console.error(e);
             alert("Action failed.");
         }
         setIsArchiving(false);
     }
  };


  const startLiveClass = async () => {
    setIsSettingUpMeeting(true);
    try {
      // Launch the Premium ScienceDojo Call Hub in the same window 🏎️🚀
      router.push(`/dashboard/classes/${classRoom.id}/call`);
    } catch (e) {
      console.error(e);
      alert("Failed to start classroom.");
    }
    setIsSettingUpMeeting(false);
  };


  return (
    <div className="min-h-screen bg-background">
      {/* 📁 Archived Banner */}
      {classRoom.is_archived && (
         <div className="bg-amber-400 py-3 text-center border-b border-amber-500 shadow-sm relative z-50">
            <p className="text-amber-950 text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
               This class is archived and is currently read-only
            </p>
         </div>
      )}

      {/* Dynamic Header */}
      <div 
        className="relative flex min-h-[21rem] items-end p-4 transition-colors duration-500 md:h-64 md:min-h-0 md:p-8"
        style={{ background: currentTheme.gradient }}
      >
        <div className="absolute inset-0 opacity-20 flex justify-center items-center overflow-hidden">
           <svg className="w-full h-[200%] max-w-7xl absolute opacity-30 text-white animate-[pulse_20s_ease-in-out_infinite]" fill="currentColor" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0 100 C 20 0 50 0 100 100 Z"/>
           </svg>
           <div className="absolute top-10 right-20 w-32 h-32 border-[8px] border-white/40 rounded-full blur-[2px]"></div>
           <div className="absolute top-24 right-40 w-16 h-16 bg-white/30 rounded-full blur-[4px]"></div>
        </div>
        
        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0 flex-1 md:pr-6">
            <Link href="/dashboard/classes" className="mb-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/70 transition-colors hover:text-white">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              All Classes
            </Link>
            
            {isEditingName ? (
              <div className="flex items-center gap-3">
                 <input 
                   autoFocus
                   value={displayName}
                   onChange={e => setDisplayName(e.target.value)}
                   className="min-w-0 rounded-xl border border-white/30 bg-white/20 p-2 text-3xl font-black tracking-tight text-white focus:outline-none focus:ring-2 focus:ring-white md:text-4xl"
                   onBlur={handleNameSave}
                   onKeyDown={e => e.key === "Enter" && handleNameSave()}
                 />
              </div>
            ) : (
              <div className="flex items-center gap-3 group">
                 <h1 className="max-w-2xl truncate text-4xl font-black tracking-tight text-white drop-shadow-md text-shadow-lg md:text-5xl">
                   {classRoom.display_name}
                 </h1>
                 {isTutor && !classRoom.is_archived && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => setIsEditingName(true)} className="p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 hover:bg-white/30 rounded-xl text-white backdrop-blur-sm">
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                    </div>
                 )}
              </div>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-3 md:gap-4">
              <p className="flex items-center gap-3 text-lg font-bold text-white">
                <span className="rounded-lg border border-white/20 bg-white/20 px-3 py-1 text-xs uppercase tracking-widest backdrop-blur-md">{currentTheme.label}</span>
              </p>
              
              {/* 🎨 Color Presets Picker (Tutor Only) */}
              {isTutor && !classRoom.is_archived && (
                <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-sm p-1.5 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                  {CLASS_THEME_SWATCHES.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleColorChange(color)}
                      className={`w-4 h-4 rounded-full border border-white/30 transition-transform hover:scale-125 ${currentCoverColor === color ? 'ring-2 ring-white scale-125' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="relative flex w-fit max-w-full items-center gap-3 rounded-2xl border border-white/20 bg-white/10 p-3 shadow-lg backdrop-blur-md md:bottom-[-1rem] md:gap-4">
             <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border-2 border-white/50 bg-white/10 shadow-sm md:h-14 md:w-14">
                {otherAvatar ? (
                  <img src={otherAvatar} alt={otherName || ""} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-black text-lg">
                    {(otherName || "U").charAt(0)}
                  </div>
                )}
             </div>
             <div className="min-w-0 pr-1 md:pr-2">
                <p className="text-xs text-white/60 font-black uppercase tracking-widest mb-0.5">{isStudent ? "Tutor" : "Student"}</p>
                <p className="truncate text-sm font-bold text-white md:whitespace-nowrap">{otherName}</p>
             </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-5xl flex-col gap-5 px-3 py-5 sm:px-4 md:px-8 md:py-8 lg:flex-row lg:gap-8">
        
        {/* Left Sidebar Info / Navigation */}
        <div className="flex w-full flex-shrink-0 flex-col gap-4 lg:w-64 lg:gap-6">
           <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-[1.5rem] border border-secondary/10 bg-white p-2 shadow-sm shadow-black/5 lg:flex-col lg:rounded-[2rem] lg:shadow-lg">
              {[
                { id: "stream", label: "Stream", emoji: "📢" },
                { id: "assignments", label: "Assignments", emoji: "📋" },
                { id: "sessions", label: "Sessions", emoji: "📅" },
                { id: "missions", label: "Missions", emoji: "🚀"}
              ].map(tab => (
                 <button 
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id as any)}
                   className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition-all lg:w-full lg:gap-3 lg:px-6 lg:py-4 ${
                     activeTab === tab.id 
                       ? "bg-slate-50 text-secondary shadow-sm border border-secondary/5" 
                       : "text-secondary/50 hover:bg-slate-50/50 hover:text-secondary/80 border border-transparent"
                   }`}
                 >
                   <span className="text-xl">{tab.emoji}</span>
                   {tab.label}
                 </button>
              ))}
           </div>
           
           {/* Upcoming Mini Card */}
           <div className="group relative overflow-hidden rounded-[1.5rem] border border-secondary/10 bg-white p-4 shadow-sm lg:rounded-[2rem] lg:p-6">
              <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-[2rem] group-hover:scale-125 transition-transform"></div>
              
              {!classRoom.is_archived && (
                 <button 
                   onClick={startLiveClass}
                   disabled={isSettingUpMeeting}
                   className="mb-5 flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 p-3 text-xs font-black uppercase tracking-widest text-white shadow-md shadow-blue-200 transition-all hover:bg-blue-700 disabled:opacity-50 lg:mb-6 lg:p-4 lg:shadow-lg"
                 >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    {isSettingUpMeeting ? "Connecting..." : (isTutor ? "Start Live Class" : "Join Live Class")}
                 </button>
              )}

              <h3 className="mb-4 text-sm font-black text-secondary">Class continuity</h3>

              <div className="space-y-3">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-secondary/40 uppercase tracking-widest">Total Sessions</span>
                    <span className="font-bold text-secondary text-sm">{pastBookings.length}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-secondary/40 uppercase tracking-widest">Assignments</span>
                    <span className="font-bold text-secondary text-sm">{assignmentPosts.length}</span>
                 </div>
              </div>
              {isTutor && (
                 <div className="mt-5 border-t border-secondary/5 pt-5 text-center lg:mt-6 lg:pt-6">
                    <button 
                      onClick={handleArchiveToggle}
                      disabled={isArchiving}
                      className={`text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 mx-auto px-4 py-2 rounded-xl border ${
                        classRoom.is_archived 
                        ? "text-primary border-primary/20 hover:bg-primary/5" 
                        : "text-red-400 border-red-400/20 hover:bg-red-50"
                      }`}
                    >
                       <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d={classRoom.is_archived ? "M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" : "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"} />
                       </svg>
                       {isArchiving ? "Updating..." : (classRoom.is_archived ? "Restore Class" : "Archive Class")}
                    </button>
                 </div>
              )}
           </div>
        </div>

        {/* Main Content Area */}
        <div className="min-w-0 flex-1">
           {activeTab === "stream" && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {!classRoom.is_archived && (
                  <ClassPostComposer
                    classId={classRoom.id}
                    isTutor={isTutor}
                    onPostCreated={(post) => {
                      setPosts(current => current.some(existing => existing.id === post.id) ? current : [post, ...current]);
                    }}
                  />
                )}
                <ClassFeed posts={posts} classId={classRoom.id} isTutor={isTutor} />
             </div>
           )}

           {activeTab === "assignments" && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="mb-4 flex flex-wrap items-center gap-3 text-xl font-black text-secondary md:mb-6 md:text-2xl">
                   Assigned Coursework 
                   <span className="bg-primary/10 text-primary text-[10px] uppercase tracking-widest px-3 py-1 rounded-full">{assignmentPosts.length} total</span>
                </h2>
                <ClassFeed posts={assignmentPosts} classId={classRoom.id} isTutor={isTutor} />
             </div>
           )}
           
           {activeTab === "sessions" && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="mb-4 text-xl font-black text-secondary md:mb-6 md:text-2xl">Session history</h2>
                <div className="overflow-hidden rounded-[1.5rem] border border-secondary/10 bg-white p-2 shadow-sm md:rounded-[2.5rem] md:p-4 md:shadow-xl">
                   <LessonHistoryTable bookings={pastBookings} />
                </div>
             </div>
           )}

           {activeTab === "missions" as any && (
             <MissionsDashboard classId={classRoom.id} studentId={classRoom.student_id} tutorId={classRoom.tutor_id} />
           )}
        </div>
      </div>

    </div>
  );
}

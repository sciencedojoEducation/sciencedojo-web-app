"use client";

import { useState } from "react";
import { ClassPost } from "@/lib/class-queries";
import ClassCommentThread from "./ClassCommentThread";
import LinkPreview from "./LinkPreview";
import { togglePinPost } from "@/app/classes/actions";

interface ClassFeedProps {
  posts: ClassPost[];
  classId: string;
  isTutor: boolean;
}

export default function ClassFeed({ posts, classId, isTutor }: ClassFeedProps) {
  const [filter, setFilter] = useState<"all" | "assignments" | "reports">("all");

  const filteredPosts = posts.filter(post => {
    if (filter === "assignments") return post.post_type === "assignment";
    if (filter === "reports") return post.post_type === "lesson_report";
    return true;
  });

  if (posts.length === 0) {
    return (
      <div className="mt-4 rounded-[1.5rem] border border-dashed border-secondary/10 bg-white p-8 text-center md:mt-6 md:rounded-[2rem] md:border-2 md:p-16">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 text-3xl text-secondary opacity-20 md:h-16 md:w-16">💬</div>
        <p className="font-bold text-secondary/40">This class feed is ready.</p>
        <p className="mt-2 text-xs font-black uppercase tracking-widest text-secondary/30">Updates, lesson notes, and resources will appear here.</p>
      </div>
    );
  }

  const handleTogglePin = async (postId: string) => {
    try {
      await togglePinPost(postId, classId);
    } catch (err) {
      console.error(err);
      alert("Failed to pin post.");
    }
  };

  return (
    <div className="mt-5 space-y-4 md:mt-8 md:space-y-6">
      {/* Filters (Optional, nice to have) */}
      <div className="mb-3 flex gap-2 overflow-x-auto pb-2 md:mb-6">
         {["all", "assignments", "reports"].map((f) => (
            <button 
              key={f}
              onClick={() => setFilter(f as any)} 
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors ${
                filter === f 
                  ? "bg-secondary text-white shadow-md"
                  : "bg-white text-secondary/40 hover:bg-slate-50 border border-secondary/10"
              }`}
            >
              {f === 'all' ? 'Everything' : f}
            </button>
         ))}
      </div>

      {filteredPosts.map((post) => {
        // Post header styling depends on type
        const isAssignment = post.post_type === "assignment";
        const isReport = post.post_type === "lesson_report";
        const isPinned = post.is_pinned;

        return (
          <div 
            key={post.id} 
            className={`relative overflow-hidden rounded-[1.5rem] border bg-white p-4 shadow-sm transition-shadow hover:shadow-md md:rounded-[2rem] md:p-6 ${
              isPinned ? "border-amber-300 ring-2 ring-amber-50" :
              isAssignment ? "border-primary/20" : 
              isReport ? "border-green-500/20" : "border-secondary/10"
            }`}
          >
            {/* Background flavor stripes left edge */}
            {isAssignment && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary/20"></div>}
            {isReport && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-green-500/20"></div>}
            
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-sm ${
                   isReport ? "bg-green-100" : isAssignment ? "bg-primary/10" : "bg-slate-100"
                }`}>
                  {isReport ? <span className="text-lg">✅</span> :
                   isAssignment ? <span className="text-lg">📋</span> :
                   post.author_avatar ? <img src={post.author_avatar} alt={post.author_name} className="w-full h-full object-cover" /> :
                   <span className="font-black text-secondary">{post.author_name?.charAt(0)}</span>}
                </div>
                <div className="min-w-0">
                  <h3 className="flex min-w-0 flex-wrap items-center gap-2 text-sm font-bold text-secondary">
                    {post.author_name}
                    {isPinned && <span className="text-[10px] text-amber-600 font-black uppercase tracking-[0.2em] bg-amber-100 px-2 py-0.5 rounded-full">Pinned</span>}
                  </h3>
                  <p className="text-[10px] text-secondary/40 font-bold uppercase tracking-wider flex gap-2">
                     <span>{new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                  </p>
                </div>
              </div>
              
              {/* Context menu / Pin toggle for Tutor */}
              {isTutor && (
                 <button onClick={() => handleTogglePin(post.id)} className="shrink-0 p-2 text-secondary/20 transition-colors hover:text-amber-500 tooltip-trigger" title={isPinned ? "Unpin Post" : "Pin to Top"}>
                    <svg className={`w-5 h-5 ${isPinned ? "text-amber-500 fill-current" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                 </button>
              )}
            </div>

            {/* Main Content Area */}
            <div className="min-w-0 sm:pl-[52px]">
               {isAssignment && (
                 <div className="mb-2">
                    <span className="inline-block px-2.5 py-1 bg-primary text-white text-[10px] font-black rounded uppercase tracking-[0.2em] shadow-sm mb-3">
                       New Assignment
                    </span>
                    {post.due_date && (
                       <span className="ml-2 inline-block px-2 py-1 bg-orange-100 text-orange-700 text-[10px] font-black rounded uppercase tracking-widest border border-orange-200">
                         Due: {new Date(post.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                       </span>
                    )}
                 </div>
               )}

               {isReport && (
                 <div className="mb-2">
                    <span className="inline-block px-2.5 py-1 bg-green-500 text-white text-[10px] font-black rounded uppercase tracking-[0.2em] shadow-sm mb-3">
                       Lesson Recap
                    </span>
                 </div>
               )}

               <div className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-secondary/80 md:text-base">
                  {post.content}
               </div>

               {/* Attachments / Previews */}
               {post.link_url && (
                 <LinkPreview url={post.link_url} />
               )}

               {post.file_url && (
                 <a 
                   href={post.file_url} 
                   target="_blank" 
                   rel="noreferrer"
                   className={`inline-flex items-center gap-3 mt-4 px-4 py-3 rounded-xl border transition-colors group max-w-sm w-full ${
                     isAssignment ? 'bg-primary/5 border-primary/20 hover:bg-primary/10' : 'bg-slate-50 border-secondary/10 hover:bg-slate-100'
                   }`}
                 >
                   <div className={`p-2 rounded-lg ${isAssignment ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                     </svg>
                   </div>
                   <div className="flex-1 min-w-0">
                     <p className={`font-bold text-sm truncate ${isAssignment ? 'text-primary' : 'text-secondary'}`}>{post.file_name}</p>
                     <p className="text-[10px] uppercase font-black opacity-50 tracking-widest mt-0.5">Attached Resource</p>
                   </div>
                 </a>
               )}

               {/* Comment Thread */}
               <ClassCommentThread 
                 postId={post.id} 
                 classId={classId} 
                 isAssignment={isAssignment} 
                 isTutor={isTutor} 
                 initialCommentsCount={post.comment_count || 0} 
               />
            </div>
          </div>
        );
      })}
    </div>
  );
}

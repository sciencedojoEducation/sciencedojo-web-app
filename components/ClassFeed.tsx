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
      <div className="p-16 text-center bg-white rounded-[2rem] border-2 border-dashed border-secondary/10 mt-6">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-3xl opacity-20 text-secondary mx-auto mb-4">💬</div>
        <p className="text-secondary/40 font-bold">This class feed is currently empty.</p>
        <p className="text-xs text-secondary/30 uppercase tracking-widest font-black mt-2">Start the conversation above</p>
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
    <div className="mt-8 space-y-6">
      {/* Filters (Optional, nice to have) */}
      <div className="flex gap-2 mb-6 overscroll-x-auto pb-2">
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
            className={`bg-white rounded-[2rem] p-6 shadow-sm border transition-shadow hover:shadow-md relative overflow-hidden ${
              isPinned ? "border-amber-300 ring-2 ring-amber-50" :
              isAssignment ? "border-primary/20" : 
              isReport ? "border-green-500/20" : "border-secondary/10"
            }`}
          >
            {/* Background flavor stripes left edge */}
            {isAssignment && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary/20"></div>}
            {isReport && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-green-500/20"></div>}
            
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl overflow-hidden shadow-sm flex-shrink-0 flex items-center justify-center ${
                   isReport ? "bg-green-100" : isAssignment ? "bg-primary/10" : "bg-slate-100"
                }`}>
                  {isReport ? <span className="text-lg">✅</span> :
                   isAssignment ? <span className="text-lg">📋</span> :
                   post.author_avatar ? <img src={post.author_avatar} alt={post.author_name} className="w-full h-full object-cover" /> :
                   <span className="font-black text-secondary">{post.author_name?.charAt(0)}</span>}
                </div>
                <div>
                  <h3 className="font-bold text-secondary text-sm flex items-center gap-2">
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
                 <button onClick={() => handleTogglePin(post.id)} className="p-2 text-secondary/20 hover:text-amber-500 transition-colors tooltip-trigger" title={isPinned ? "Unpin Post" : "Pin to Top"}>
                    <svg className={`w-5 h-5 ${isPinned ? "text-amber-500 fill-current" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                 </button>
              )}
            </div>

            {/* Main Content Area */}
            <div className="pl-[52px]">
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

               <div className="text-secondary/80 font-medium whitespace-pre-wrap leading-relaxed">
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

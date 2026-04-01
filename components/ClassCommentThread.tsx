"use client";

import { useState, useRef, useEffect } from "react";
import { ClassComment } from "@/lib/class-queries";
import { createClassComment, fetchCommentsForPost } from "@/app/classes/actions";

interface ClassCommentThreadProps {
  postId: string;
  classId: string;
  isAssignment: boolean;
  isTutor: boolean;
  initialCommentsCount: number;
}

export default function ClassCommentThread({
  postId,
  classId,
  isAssignment,
  isTutor,
  initialCommentsCount,
}: ClassCommentThreadProps) {
  const [comments, setComments] = useState<ClassComment[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Ref to form for resetting
  const formRef = useRef<HTMLFormElement>(null);

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const data = await fetchCommentsForPost(postId);
      setComments(data);
    } catch (err) {
      console.error("Failed to load comments", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = () => {
    if (!isOpen && comments.length === 0 && initialCommentsCount > 0) {
      loadComments();
    }
    setIsOpen(!isOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() && !file) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.set("postId", postId);
    formData.set("classId", classId);
    formData.set("content", newComment);
    // If it's an assignment and not a tutor commenting, it's a submission
    formData.set("isSubmission", (!isTutor && isAssignment).toString());
    
    if (file) {
      formData.set("file", file);
    }

    try {
      await createClassComment(formData);
      setNewComment("");
      setFile(null);
      await loadComments(); // Reload to get the new comment
    } catch (err) {
      console.error("Failed to post comment", err);
      alert("Failed to post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-secondary/5">
      <button
        onClick={handleToggle}
        className="text-xs font-bold text-secondary/40 hover:text-secondary flex items-center gap-2 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {initialCommentsCount > 0 ? `${initialCommentsCount} class comments` : "Add class comment"}
      </button>

      {isOpen && (
        <div className="mt-6 space-y-6">
          {isLoading ? (
            <div className="text-center py-4 text-xs font-bold text-secondary/40 animate-pulse">Loading comments...</div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className={`flex gap-3 ${comment.is_submission ? 'bg-primary/5 p-4 rounded-2xl border border-primary/10' : ''}`}>
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-secondary/10">
                    {comment.author_avatar ? (
                      <img src={comment.author_avatar} alt={comment.author_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-secondary font-black text-[10px]">
                        {comment.author_name?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="font-bold text-secondary text-xs">{comment.author_name}</span>
                      <span className="text-[9px] font-bold text-secondary/40">
                        {new Date(comment.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </span>
                      {comment.is_submission && (
                        <span className="ml-auto px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-black rounded uppercase tracking-widest">
                          Submission
                        </span>
                      )}
                    </div>
                    <p className="text-secondary/80 text-sm whitespace-pre-wrap">{comment.content}</p>
                    
                    {comment.file_url && (
                      <a 
                        href={comment.file_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-white border border-secondary/10 rounded-lg text-xs font-bold text-secondary hover:bg-slate-50 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        <span className="truncate max-w-[200px]">{comment.file_name}</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <form ref={formRef} onSubmit={handleSubmit} className="flex gap-3 items-start relative">
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-secondary/10 border border-secondary/5 flex items-center justify-center text-xs">
              👤
            </div>
            <div className="flex-1 relative">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={isAssignment && !isTutor ? "Add class comment or submission note..." : "Add a class comment..."}
                rows={1}
                className="w-full pl-4 pr-12 py-3 rounded-2xl border border-secondary/10 bg-slate-50 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-secondary text-sm resize-none"
                style={{ minHeight: "44px" }}
              />
              <button
                type="submit"
                disabled={isSubmitting || (!newComment.trim() && !file)}
                className="absolute right-2 top-2 p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
              </button>
              
              {/* Optional Assignment Submission File Upload */}
              {isAssignment && !isTutor && (
                <div className="mt-2">
                   <div className="flex items-center gap-3">
                     <label className="cursor-pointer flex items-center gap-2 px-3 py-1.5 bg-primary/5 text-primary rounded-lg hover:bg-primary/10 transition-colors text-xs font-bold border border-primary/10">
                       <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                       </svg>
                       {file ? file.name : "Attach Homework File"}
                       <input
                         type="file"
                         accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.xlsx"
                         onChange={(e) => setFile(e.target.files?.[0] || null)}
                         className="hidden"
                       />
                     </label>
                     {file && (
                       <button
                         type="button"
                         onClick={() => setFile(null)}
                         className="text-[10px] font-bold text-red-400 hover:text-red-600"
                       >
                         Remove
                       </button>
                     )}
                   </div>
                </div>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

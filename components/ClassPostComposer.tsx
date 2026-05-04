"use client";

import { useState, useRef } from "react";
import { createClassPost } from "@/app/classes/actions";
import type { ClassPost } from "@/lib/class-queries";

interface ClassPostComposerProps {
  classId: string;
  isTutor: boolean;
  onPostCreated?: (post: ClassPost) => void;
}

export default function ClassPostComposer({ classId, isTutor, onPostCreated }: ClassPostComposerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [postType, setPostType] = useState<"post" | "assignment" | "link">("post");
  const [content, setContent] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);

    const formData = new FormData();
    formData.set("classId", classId);
    formData.set("content", content);
    formData.set("postType", postType);
    if (linkUrl) formData.set("linkUrl", linkUrl);
    if (dueDate) formData.set("dueDate", new Date(dueDate).toISOString());
    if (file) formData.set("file", file);

    try {
      const createdPost = await createClassPost(formData);
      if (createdPost) {
        onPostCreated?.(createdPost);
      }
      setContent("");
      setLinkUrl("");
      setDueDate("");
      setFile(null);
      setPostType("post");
      setIsExpanded(false);
    } catch (err) {
      console.error("Failed to create post:", err);
      alert("Failed to create post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-detect YouTube links
  const isYouTubeLink = (url: string) => {
    return /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/.test(url);
  };

  return (
    <div className="bg-white rounded-[2rem] border border-secondary/10 shadow-lg overflow-hidden transition-all">
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full p-6 text-left flex items-center gap-4 hover:bg-slate-50/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-secondary/40 font-bold text-sm">Share something with your class...</span>
        </button>
      ) : (
        <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Post Type Tabs */}
          <div className="flex items-center gap-1 bg-slate-100/80 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setPostType("post")}
              className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${
                postType === "post" ? "bg-white shadow-sm text-secondary" : "text-secondary/40 hover:text-secondary/70"
              }`}
            >
              📝 Post
            </button>
            {isTutor && (
              <button
                type="button"
                onClick={() => setPostType("assignment")}
                className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${
                  postType === "assignment" ? "bg-white shadow-sm text-secondary" : "text-secondary/40 hover:text-secondary/70"
                }`}
              >
                📋 Assignment
              </button>
            )}
            <button
              type="button"
              onClick={() => setPostType("link")}
              className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${
                postType === "link" ? "bg-white shadow-sm text-secondary" : "text-secondary/40 hover:text-secondary/70"
              }`}
            >
              🔗 Link
            </button>
          </div>

          {/* Content */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              postType === "assignment"
                ? "Describe the assignment..."
                : postType === "link"
                ? "Add a description for the link..."
                : "Write something to share..."
            }
            rows={3}
            className="w-full p-4 rounded-2xl border border-secondary/10 bg-slate-50 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-secondary resize-none"
          />

          {/* Link URL (for link posts) */}
          {postType === "link" && (
            <div>
              <label className="block text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-1.5">
                Link URL
              </label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=... or any URL"
                className="w-full p-3 rounded-xl border border-secondary/10 bg-slate-50 focus:outline-none focus:border-primary font-medium text-secondary text-sm"
              />
              {linkUrl && isYouTubeLink(linkUrl) && (
                <div className="mt-2 flex items-center gap-2 text-[10px] font-black text-red-500">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  YouTube video detected — will embed player
                </div>
              )}
            </div>
          )}

          {/* Due Date (for assignments) */}
          {postType === "assignment" && (
            <div>
              <label className="block text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-1.5">
                Due Date (Optional)
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-3 rounded-xl border border-secondary/10 bg-slate-50 focus:outline-none focus:border-primary font-medium text-secondary text-sm"
              />
            </div>
          )}

          {/* File Attachment */}
          <div className="flex items-center gap-3">
            <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors text-xs font-bold text-secondary/60">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              {file ? file.name : "Attach File"}
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

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsExpanded(false);
                setContent("");
                setPostType("post");
              }}
              className="px-6 py-2.5 text-secondary/40 font-bold text-sm hover:text-secondary rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="px-8 py-2.5 bg-primary text-white font-black text-sm rounded-xl hover:bg-primary-hover transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Posting...
                </span>
              ) : (
                postType === "assignment" ? "Assign" : "Post"
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

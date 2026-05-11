import React from 'react';
import { ClassPost } from '@/lib/class-queries';

interface HomeworkFeedProps {
  assignments: (ClassPost & { class_display_name?: string; tutor_name?: string; tutor_avatar?: string })[];
  showEmptyState?: boolean;
}

export default function HomeworkFeed({ assignments, showEmptyState = false }: HomeworkFeedProps) {
  if (!assignments || assignments.length === 0) {
    if (!showEmptyState) return null;

    return (
      <section className="rounded-[2rem] border border-dashed border-primary/20 bg-primary/5 p-5 shadow-sm sm:p-6 md:rounded-[2.5rem] md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">Tutor-guided practice</p>
            <h2 className="mt-2 text-2xl font-black text-secondary">Next practice tasks</h2>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-secondary/55">
              Once your child&apos;s tutor sets practice, it will appear here with the reason it matters and the next step to take.
            </p>
          </div>
        </div>
        <div className="mt-6 rounded-3xl bg-white p-5 text-sm font-bold leading-6 text-secondary/55 shadow-sm">
          This area will help you understand what your child should practise between lessons, without turning support into another dashboard to monitor.
        </div>
      </section>
    );
  }

  return (
    <section className="bg-primary/5 rounded-[2rem] p-5 border-2 border-primary/20 shadow-xl shadow-primary/5 mb-12 sm:p-6 md:rounded-[2.5rem] md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-8">
        <h2 className="text-2xl font-black text-secondary flex items-center gap-4">
          <span className="p-2 bg-primary text-white rounded-xl">
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
             </svg>
          </span>
          Next practice tasks
        </h2>
        <span className="text-xs font-black text-primary uppercase tracking-[0.2em]">Tutor-guided practice</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {assignments.slice(0, 4).map(post => (
            <div key={`hw-${post.id}`} className="bg-white p-6 rounded-[2rem] border border-primary/10 shadow-lg flex gap-4 relative overflow-hidden group">
               <div className="w-1.5 bg-primary/20 absolute left-0 top-0 bottom-0 rounded-l-[2rem] group-hover:bg-primary transition-colors"></div>
               
               <div className="flex-1 pl-2">
                 <div className="flex justify-between items-start mb-2">
                    <span className="inline-block px-2.5 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded-lg uppercase tracking-wider">
                       {post.class_display_name || "Class"}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-secondary/40">
                       {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                 </div>
                 
                 <p className="text-secondary font-medium text-sm my-3 italic border-l-2 border-secondary/10 pl-3 py-1 line-clamp-3">
                    "{post.content}"
                 </p>
                 
                 {post.due_date && (
                   <div className="mb-3 text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-1 rounded inline-block">
                      Due: {new Date(post.due_date).toLocaleDateString()}
                   </div>
                 )}
                 
                 <div className="flex items-center gap-2 mt-4 pt-4 border-t border-secondary/5">
                    <img 
                      src={post.tutor_avatar || "/tutor_placeholder.webp"} 
                      alt={post.tutor_name || "Tutor"} 
                      className="w-6 h-6 rounded-full object-cover shadow-sm bg-secondary/10" 
                    />
                    <span className="text-xs font-bold text-secondary/60">
                       Recommended by <span className="text-secondary">{post.tutor_name}</span>
                    </span>
                 </div>
               </div>
            </div>
         ))}
      </div>
    </section>
  );
}

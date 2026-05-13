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
      <section className="rounded-[1.5rem] border border-dashed border-primary/20 bg-primary/5 p-4 shadow-sm sm:p-5 md:rounded-[2.5rem] md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary/65">Tutor-guided practice</p>
            <h2 className="mt-2 text-xl font-black text-secondary md:text-2xl">Next practice tasks</h2>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-secondary/55">
              Once your child&apos;s tutor sets practice, it will appear here with the reason it matters and the next step to take.
            </p>
          </div>
        </div>
        <p className="mt-4 border-t border-primary/10 pt-3 text-xs font-bold leading-5 text-secondary/55 md:mt-5">
          <span className="text-primary/70">Next step &rarr; </span>Schedule a lesson to begin building tutor-guided practice.
        </p>
      </section>
    );
  }

  return (
    <section className="bg-primary/5 rounded-[1.5rem] p-4 border border-primary/20 shadow-sm mb-8 sm:p-5 md:mb-12 md:rounded-[2.5rem] md:border-2 md:p-8 md:shadow-xl md:shadow-primary/5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-5 md:mb-8">
        <h2 className="text-xl font-black text-secondary flex items-center gap-3 md:text-2xl md:gap-4">
          <span className="p-1.5 bg-primary text-white rounded-xl md:p-2">
             <svg className="w-5 h-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
             </svg>
          </span>
          Next practice tasks
        </h2>
        <span className="text-[10px] font-black text-primary/65 uppercase tracking-[0.16em]">Tutor-guided practice</span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-6">
         {assignments.slice(0, 4).map(post => (
            <div key={`hw-${post.id}`} className="bg-white p-4 rounded-[1.5rem] border border-primary/10 shadow-sm flex gap-3 relative overflow-hidden group md:p-6 md:rounded-[2rem] md:shadow-lg md:gap-4">
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

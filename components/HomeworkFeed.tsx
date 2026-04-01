import React from 'react';
import { ClassPost } from '@/lib/class-queries';

interface HomeworkFeedProps {
  assignments: (ClassPost & { class_display_name?: string; tutor_name?: string; tutor_avatar?: string })[];
}

export default function HomeworkFeed({ assignments }: HomeworkFeedProps) {
  if (!assignments || assignments.length === 0) return null;

  return (
    <section className="bg-primary/5 rounded-[2.5rem] p-8 border-2 border-primary/20 shadow-xl shadow-primary/5 mb-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black text-secondary flex items-center gap-4">
          <span className="p-2 bg-primary text-white rounded-xl">
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
             </svg>
          </span>
          Recent Assignments
        </h2>
        <span className="text-xs font-black text-primary uppercase tracking-[0.2em]">Homework Feed</span>
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
                       Assigned by <span className="text-secondary">{post.tutor_name}</span>
                    </span>
                 </div>
               </div>
            </div>
         ))}
      </div>
    </section>
  );
}


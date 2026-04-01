"use client";

import { useState } from "react";
import Image from "next/image";
import UserAvatar from "@/components/UserAvatar";
import { adminCreateUser, adminDeleteUser } from "./actions";

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url: string;
  created_at: string;
}

export default function UserManagementUI({ users, currentUserId }: { users: UserProfile[], currentUserId: string }) {
  const [filter, setFilter] = useState("all");
  
  // Modals
  const [isCreating, setIsCreating] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);

  // Loaders
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtered List
  const displayUsers = filter === "all" ? users : users.filter(u => u.role === filter);

  // Metric Counts
  const tutorCount = users.filter(u => u.role === 'tutor').length;
  const parentCount = users.filter(u => u.role === 'parent').length;
  const adminCount = users.filter(u => u.role === 'admin').length;

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const formData = new FormData(e.currentTarget);
      await adminCreateUser(formData);
      setIsCreating(false);
    } catch (err: any) {
      setError(err.message || "Failed to create user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    setIsSubmitting(true);
    setError(null);
    
    try {
      await adminDeleteUser(deletingUser.id);
      setDeletingUser(null);
    } catch (err: any) {
      setError(err.message || "Failed to delete user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
           <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">User Directory 👥</h1>
           <p className="text-slate-500 font-medium tracking-tight max-w-xl">
             Manage all active accounts on ScienceDojo. Note: Deleting a user permanently wipes all their lessons, payouts, and history.
           </p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="px-6 py-3 bg-slate-800 text-white font-black tracking-widest text-[10px] uppercase rounded-xl hover:bg-black transition-all whitespace-nowrap shadow-lg shadow-slate-200"
        >
          + Add New User
        </button>
      </div>

      {/* METRICS & FILTERS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pt-6 border-t border-slate-200">
        <div className="flex gap-2">
           <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${filter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>All ({users.length})</button>
           <button onClick={() => setFilter('tutor')} className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${filter === 'tutor' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>Tutors ({tutorCount})</button>
           <button onClick={() => setFilter('parent')} className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${filter === 'parent' ? 'bg-violet-600 text-white' : 'bg-violet-50 text-violet-600 hover:bg-violet-100'}`}>Parents ({parentCount})</button>
           <button onClick={() => setFilter('admin')} className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${filter === 'admin' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}>Admins ({adminCount})</button>
        </div>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl font-bold shadow-sm animate-in fade-in slide-in-from-top-4">
          {error}
        </div>
      )}

      {/* DIRECTORY TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden relative min-h-[400px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50 text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">
              <th className="p-6">User Profile</th>
              <th className="p-6">Role</th>
              <th className="p-6">Joined Date</th>
              <th className="p-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="font-medium text-slate-600">
            {displayUsers.map(u => (
               <tr key={u.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="p-6">
                     <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-slate-100 border-2 border-white shadow-sm overflow-hidden relative">
                         <UserAvatar src={u.avatar_url} alt={u.full_name} fill className="object-cover" />
                       </div>
                       <div>
                         <div className="font-bold text-slate-800">{u.full_name || "New User"}</div>
                         <div className="text-xs text-slate-400">{u.email}</div>
                       </div>
                     </div>
                  </td>
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      u.role === 'admin' ? 'bg-amber-100 text-amber-700' :
                      u.role === 'tutor' ? 'bg-blue-100 text-blue-700' :
                      'bg-violet-100 text-violet-700'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-6 text-sm text-slate-500">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-6 text-right">
                    {u.id !== currentUserId ? (
                      <button 
                         onClick={() => setDeletingUser(u)}
                         className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                         Delete
                      </button>
                    ) : (
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 px-4">You</span>
                    )}
                  </td>
               </tr>
            ))}
            
            {displayUsers.length === 0 && (
               <tr>
                 <td colSpan={4} className="p-12 text-center text-slate-400 italic">No users found for this filter.</td>
               </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* DELETE SAFEGUARD MODAL */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !isSubmitting && setDeletingUser(null)}></div>
          <div className="bg-white rounded-[2rem] shadow-2xl p-8 w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200">
             <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-6 mx-auto">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
             </div>
             <h3 className="text-xl font-black text-center text-slate-900 mb-2">Delete this Account?</h3>
             <p className="text-slate-500 text-sm text-center mb-8 px-4 font-medium leading-relaxed">
               You are about to permanently delete <strong className="text-slate-800">{deletingUser.full_name} ({deletingUser.email})</strong>. This action is irreversible and will cascade-delete all of their history.
             </p>
             <div className="flex gap-3">
               <button onClick={() => setDeletingUser(null)} disabled={isSubmitting} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors disabled:opacity-50">Cancel</button>
               <button onClick={handleDelete} disabled={isSubmitting} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-black tracking-tight rounded-xl shadow-lg shadow-red-200 transition-all disabled:opacity-50">
                 {isSubmitting ? 'Deleting...' : 'Yes, Delete Permanently'}
               </button>
             </div>
          </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !isSubmitting && setIsCreating(false)}></div>
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg relative animate-in slide-in-from-right-8 duration-300 overflow-hidden flex flex-col max-h-[90vh]">
             <div className="p-8 bg-slate-900 text-white shrink-0">
                <h3 className="text-2xl font-black tracking-tight">Add New User ⚡</h3>
                <p className="text-slate-400 text-sm font-medium mt-1">This bypasses email confirmation so they can log in instantly.</p>
             </div>
             
             <form onSubmit={handleCreate} className="p-8 overflow-y-auto space-y-6 bg-slate-50 flex-1">
               <div>
                 <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Role Type</label>
                 <div className="grid grid-cols-3 gap-2">
                   {['parent', 'tutor', 'admin'].map(r => (
                     <label key={r} className="cursor-pointer relative">
                       <input type="radio" name="role" value={r} defaultChecked={r === 'parent'} className="peer sr-only" />
                       <div className="px-3 py-3 rounded-xl border-2 border-slate-200 text-center font-bold text-slate-500 text-xs peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-primary transition-all capitalize hover:bg-white">{r}</div>
                     </label>
                   ))}
                 </div>
               </div>

               <div>
                 <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Legal Full Name</label>
                 <input name="full_name" type="text" required placeholder="John Doe" className="w-full p-4 rounded-xl border border-slate-200 bg-white font-bold focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-sm" />
               </div>

               <div>
                 <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Email Address</label>
                 <input name="email" type="email" required placeholder="john@example.com" className="w-full p-4 rounded-xl border border-slate-200 bg-white font-bold focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-sm" />
               </div>

               <div>
                 <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Temporary Password</label>
                 <input name="password" type="password" required minLength={6} placeholder="Min. 6 characters" className="w-full p-4 rounded-xl border border-slate-200 bg-white font-bold focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-sm" />
               </div>

               <div className="flex gap-3 pt-6 shrink-0">
                  <button type="button" onClick={() => setIsCreating(false)} disabled={isSubmitting} className="px-6 py-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl transition-colors disabled:opacity-50">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 py-4 bg-slate-800 hover:bg-black text-white font-black tracking-tight rounded-xl shadow-lg shadow-slate-200 transition-all disabled:opacity-50">
                    {isSubmitting ? 'Creating User...' : 'Create & Verify Instantly'}
                  </button>
               </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}

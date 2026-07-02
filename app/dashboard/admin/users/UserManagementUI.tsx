"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import UserAvatar from "@/components/UserAvatar";
import {
  adminCreateUser,
  adminDeactivateUser,
  adminPermanentlyDeleteTestUser,
  adminPermanentlyDeleteTestUserByEmail,
} from "./actions";

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url: string;
  created_at: string;
  is_suspended?: boolean | null;
}

export default function UserManagementUI({ users, currentUserId }: { users: UserProfile[], currentUserId: string }) {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modals
  const [isCreating, setIsCreating] = useState(false);
  const [deactivatingUser, setDeactivatingUser] = useState<UserProfile | null>(null);
  const [permanentDeleteUser, setPermanentDeleteUser] = useState<UserProfile | null>(null);
  const [permanentDeleteConfirmation, setPermanentDeleteConfirmation] = useState("");
  const [isDeletingByEmail, setIsDeletingByEmail] = useState(false);
  const [deleteByEmailValue, setDeleteByEmailValue] = useState("");
  const [deleteByEmailConfirmation, setDeleteByEmailConfirmation] = useState("");

  // Loaders
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtered List
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const displayUsers = users.filter((user) => {
    const matchesRole = filter === "all" || user.role === filter;
    const searchable = [user.full_name, user.email, user.role].filter(Boolean).join(" ").toLowerCase();
    const matchesSearch = !normalizedSearch || searchable.includes(normalizedSearch);
    return matchesRole && matchesSearch;
  });

  // Metric Counts
  const tutorCount = users.filter(u => u.role === 'tutor').length;
  const parentCount = users.filter(u => u.role === 'parent').length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const roleTone = (role: string) => (
    role === 'admin' ? 'bg-amber-100 text-amber-700 border-amber-200' :
    role === 'tutor' ? 'bg-blue-100 text-blue-700 border-blue-200' :
    'bg-violet-100 text-violet-700 border-violet-200'
  );
  const joinedDate = (date: string) => new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const normalizedDeleteByEmail = deleteByEmailValue.trim().toLowerCase();
  const normalizedDeleteByEmailConfirmation = deleteByEmailConfirmation.trim().toLowerCase();

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const formData = new FormData(e.currentTarget);
      await adminCreateUser(formData);
      setIsCreating(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivatingUser) return;
    setIsSubmitting(true);
    setError(null);
    
    try {
      await adminDeactivateUser(deactivatingUser.id);
      setDeactivatingUser(null);
      // Force RSC to re-fetch the latest database state
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to deactivate user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (!permanentDeleteUser) return;
    setIsSubmitting(true);
    setError(null);

    try {
      await adminPermanentlyDeleteTestUser(permanentDeleteUser.id, permanentDeleteConfirmation);
      setPermanentDeleteUser(null);
      setPermanentDeleteConfirmation("");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to permanently delete test user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePermanentDeleteByEmail = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await adminPermanentlyDeleteTestUserByEmail(deleteByEmailValue, deleteByEmailConfirmation);
      setIsDeletingByEmail(false);
      setDeleteByEmailValue("");
      setDeleteByEmailConfirmation("");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to permanently delete test user by email.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-3 py-5 sm:px-4 md:p-8">
      {/* HEADER SECTION */}
      <div className="mb-5 flex flex-col gap-4 lg:mb-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
           <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">User operations</p>
           <h1 className="mb-2 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">User Directory</h1>
           <p className="max-w-2xl text-sm font-medium leading-relaxed text-slate-500 md:text-base">
             Manage platform users quickly, clearly, and safely. Deactivate real users; permanently delete only test accounts that must sign up again.
           </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/admin/team"
            className="inline-flex min-h-10 w-fit items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-700 shadow-sm shadow-slate-100 transition-all hover:border-slate-300 hover:bg-slate-50 md:px-6 md:py-3"
          >
            Internal Team
          </Link>
          <button
            onClick={() => {
              setIsDeletingByEmail(true);
              setDeleteByEmailValue("");
              setDeleteByEmailConfirmation("");
            }}
            className="inline-flex min-h-10 w-fit items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] text-red-600 shadow-sm shadow-red-100 transition-all hover:border-red-300 hover:bg-red-100 md:px-6 md:py-3"
          >
            Delete test by email
          </button>
          <button 
            onClick={() => setIsCreating(true)}
            className="inline-flex min-h-10 w-fit items-center justify-center rounded-2xl bg-slate-900 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] text-white shadow-sm shadow-slate-200 transition-all hover:bg-black md:px-6 md:py-3"
          >
            + Add New User
          </button>
        </div>
      </div>

      {/* METRICS & FILTERS */}
      <div className="mb-4 border-t border-slate-200 pt-4 md:mb-6 md:pt-6">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
           <button onClick={() => setFilter('all')} className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold transition-all md:px-4 ${filter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>All ({users.length})</button>
           <button onClick={() => setFilter('tutor')} className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold transition-all md:px-4 ${filter === 'tutor' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>Tutors ({tutorCount})</button>
           <button onClick={() => setFilter('parent')} className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold transition-all md:px-4 ${filter === 'parent' ? 'bg-violet-600 text-white' : 'bg-violet-50 text-violet-600 hover:bg-violet-100'}`}>Parents ({parentCount})</button>
           <button onClick={() => setFilter('admin')} className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold transition-all md:px-4 ${filter === 'admin' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}>Admins ({adminCount})</button>
        </div>
      </div>

      <div className="relative mb-4 max-w-xl md:mb-6">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" /></svg>
        </span>
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search users"
          className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 text-sm font-bold text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10 md:placeholder:text-transparent"
          aria-label="Search users by name, email, or role"
        />
        <span className="pointer-events-none absolute left-11 top-1/2 hidden -translate-y-1/2 text-sm font-bold text-slate-400 md:block">
          {searchQuery ? "" : "Search users by name or email"}
        </span>
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            Clear
          </button>
        )}
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl font-bold shadow-sm animate-in fade-in slide-in-from-top-4">
          {error}
        </div>
      )}

      {/* DIRECTORY TABLE */}
      <div className="relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm shadow-slate-200/50 md:rounded-3xl md:shadow-xl">
        <div className="grid gap-3 p-3 lg:hidden">
          {displayUsers.map(u => (
            <article key={u.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl border-2 border-white bg-slate-100 shadow-sm">
                    <UserAvatar src={u.avatar_url} alt={u.full_name} fill className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="break-words text-sm font-black leading-tight text-slate-900">{u.full_name || "New User"}</h3>
                    <p className="mt-1 break-words text-xs font-medium text-slate-400">{u.email}</p>
                  </div>
                </div>
                <span className={`shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${roleTone(u.role)}`}>
                  {u.role}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Joined</p>
                  <p className="mt-1 text-xs font-black text-slate-700">{joinedDate(u.created_at)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Account</p>
                  <p className="mt-1 text-xs font-black capitalize text-slate-700">{u.is_suspended ? "Deactivated" : u.id === currentUserId ? "Current admin" : "Active"}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <a
                  href={`mailto:${u.email}`}
                  className="inline-flex min-h-10 items-center rounded-xl px-3 py-2 text-xs font-black text-slate-600 transition-colors hover:bg-slate-50"
                >
                  Email
                </a>
                {u.id !== currentUserId ? (
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      onClick={() => setDeactivatingUser(u)}
                      className="inline-flex min-h-10 items-center rounded-xl px-3 py-2 text-xs font-black text-amber-600 transition-colors hover:bg-amber-50"
                    >
                      Deactivate
                    </button>
                    <button
                      onClick={() => {
                        setPermanentDeleteUser(u);
                        setPermanentDeleteConfirmation("");
                      }}
                      className="inline-flex min-h-10 items-center rounded-xl px-3 py-2 text-xs font-black text-red-500 transition-colors hover:bg-red-50"
                    >
                      Delete test
                    </button>
                  </div>
                ) : (
                  <span className="inline-flex min-h-10 items-center rounded-xl px-3 py-2 text-xs font-black text-slate-300">
                    Protected
                  </span>
                )}
              </div>
            </article>
          ))}

          {displayUsers.length === 0 && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-center">
              <p className="font-black text-slate-700">No users found</p>
              <p className="mt-1 text-xs font-bold leading-relaxed text-slate-400">Try searching by another name, email, or role.</p>
            </div>
          )}
        </div>

        <table className="hidden w-full border-collapse text-left lg:table">
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
                    <span className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${roleTone(u.role)}`}>
                      {u.role}
                    </span>
                    {u.is_suspended && (
                      <span className="ml-2 inline-flex whitespace-nowrap rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-700">
                        inactive
                      </span>
                    )}
                  </td>
                  <td className="p-6 text-sm text-slate-500">
                    {joinedDate(u.created_at)}
                  </td>
                  <td className="p-6 text-right">
                    {u.id !== currentUserId ? (
                      <div className="flex justify-end gap-2">
                        <button
                           onClick={() => setDeactivatingUser(u)}
                           className="rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-wider text-amber-600 transition-colors hover:bg-amber-50"
                        >
                           Deactivate
                        </button>
                        <button 
                           onClick={() => {
                             setPermanentDeleteUser(u);
                             setPermanentDeleteConfirmation("");
                           }}
                           className="rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-wider text-red-500 transition-colors hover:bg-red-50"
                        >
                           Delete test
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 px-4">You</span>
                    )}
                  </td>
               </tr>
            ))}
            
            {displayUsers.length === 0 && (
               <tr>
                 <td colSpan={4} className="p-12 text-center">
                   <p className="font-black text-slate-600">No users found</p>
                   <p className="mt-2 text-sm font-bold text-slate-400">Try searching by another name, email, or role.</p>
                 </td>
               </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* DEACTIVATE SAFEGUARD MODAL */}
      {deactivatingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !isSubmitting && setDeactivatingUser(null)}></div>
          <div className="bg-white rounded-[2rem] shadow-2xl p-8 w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200">
             <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mb-6 mx-auto">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" /></svg>
             </div>
             <h3 className="text-xl font-black text-center text-slate-900 mb-2">Deactivate this account?</h3>
             <p className="text-slate-500 text-sm text-center mb-8 px-4 font-medium leading-relaxed">
               <strong className="text-slate-800">{deactivatingUser.full_name} ({deactivatingUser.email})</strong> will be suspended and memberships will be marked inactive. Their email remains reserved.
             </p>
             <div className="flex gap-3">
               <button onClick={() => setDeactivatingUser(null)} disabled={isSubmitting} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors disabled:opacity-50">Cancel</button>
               <button onClick={handleDeactivate} disabled={isSubmitting} className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-black tracking-tight rounded-xl shadow-lg shadow-amber-200 transition-all disabled:opacity-50">
                 {isSubmitting ? 'Deactivating...' : 'Deactivate'}
               </button>
             </div>
          </div>
        </div>
      )}

      {/* PERMANENT TEST DELETE BY EMAIL MODAL */}
      {isDeletingByEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !isSubmitting && setIsDeletingByEmail(false)}></div>
          <div className="bg-white rounded-[2rem] shadow-2xl p-8 w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200">
             <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-6 mx-auto">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16" /></svg>
             </div>
             <h3 className="text-xl font-black text-center text-slate-900 mb-2">Delete test account by email?</h3>
             <p className="text-slate-500 text-sm text-center mb-5 px-4 font-medium leading-relaxed">
               This purges matching app records, role rows, memberships, storage files, profile rows, and Supabase Auth users. Use only for test accounts that must sign up again.
             </p>
             <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Test account email</label>
             <input
               value={deleteByEmailValue}
               onChange={(event) => setDeleteByEmailValue(event.target.value)}
               placeholder="test@example.com"
               type="email"
               className="mb-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition-colors focus:border-red-400 focus:ring-4 focus:ring-red-100"
             />
             <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Type the same email to confirm</label>
             <input
               value={deleteByEmailConfirmation}
               onChange={(event) => setDeleteByEmailConfirmation(event.target.value)}
               placeholder={deleteByEmailValue || "test@example.com"}
               type="email"
               className="mb-6 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition-colors focus:border-red-400 focus:ring-4 focus:ring-red-100"
             />
             <div className="flex gap-3">
               <button onClick={() => setIsDeletingByEmail(false)} disabled={isSubmitting} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors disabled:opacity-50">Cancel</button>
               <button
                 onClick={handlePermanentDeleteByEmail}
                 disabled={isSubmitting || !normalizedDeleteByEmail || normalizedDeleteByEmail !== normalizedDeleteByEmailConfirmation}
                 className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-black tracking-tight rounded-xl shadow-lg shadow-red-200 transition-all disabled:opacity-50"
               >
                 {isSubmitting ? 'Deleting...' : 'Delete Test Email'}
               </button>
             </div>
          </div>
        </div>
      )}

      {/* PERMANENT TEST DELETE SAFEGUARD MODAL */}
      {permanentDeleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !isSubmitting && setPermanentDeleteUser(null)}></div>
          <div className="bg-white rounded-[2rem] shadow-2xl p-8 w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200">
             <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-6 mx-auto">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16" /></svg>
             </div>
             <h3 className="text-xl font-black text-center text-slate-900 mb-2">Permanently delete test user?</h3>
             <p className="text-slate-500 text-sm text-center mb-5 px-4 font-medium leading-relaxed">
               This removes app records, memberships, linked role rows, local storage files, and the Supabase Auth identity for <strong className="text-slate-800">{permanentDeleteUser.full_name} ({permanentDeleteUser.email})</strong>. Use only for test accounts that need to sign up fresh.
             </p>
             <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Type the email to confirm</label>
             <input
               value={permanentDeleteConfirmation}
               onChange={(event) => setPermanentDeleteConfirmation(event.target.value)}
               placeholder={permanentDeleteUser.email}
               className="mb-6 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition-colors focus:border-red-400 focus:ring-4 focus:ring-red-100"
             />
             <div className="flex gap-3">
               <button onClick={() => setPermanentDeleteUser(null)} disabled={isSubmitting} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors disabled:opacity-50">Cancel</button>
               <button onClick={handlePermanentDelete} disabled={isSubmitting || permanentDeleteConfirmation.trim().toLowerCase() !== permanentDeleteUser.email.toLowerCase()} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-black tracking-tight rounded-xl shadow-lg shadow-red-200 transition-all disabled:opacity-50">
                 {isSubmitting ? 'Deleting...' : 'Delete Test User'}
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

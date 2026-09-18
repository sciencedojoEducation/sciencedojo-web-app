"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MessagingUserResult } from "@/lib/messaging-queries";
import { createConversation, searchMessagingUsers } from "./actions";

export default function UserSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MessagingUserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runSearch(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const term = query.trim();
    if (term.length < 2) {
      setError("Type at least 2 characters.");
      return;
    }
    setSearching(true);
    const res = await searchMessagingUsers(term);
    setSearching(false);
    setSearched(true);
    if (res.error) {
      setError(res.error);
      setResults([]);
      return;
    }
    setResults(res.users || []);
  }

  async function startChat(userId: string) {
    setError(null);
    setPendingId(userId);
    const result = await createConversation(userId);
    setPendingId(null);
    if (result.error || !result.conversationId) {
      setError(result.error || "Could not start that conversation.");
      return;
    }
    router.push(`/dashboard/messages?id=${result.conversationId}`);
  }

  return (
    <section className="border-b border-secondary/10 bg-primary/5 p-4">
      <div className="mb-3">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-primary/60">Admin</p>
        <h3 className="mt-1 text-sm font-black text-secondary">Message anyone</h3>
      </div>

      <form onSubmit={runSearch} className="flex gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search users by name or email"
          className="min-w-0 flex-1 rounded-xl border border-secondary/10 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-primary/30"
        />
        <button
          type="submit"
          disabled={searching}
          className="shrink-0 rounded-xl bg-primary px-4 py-2 text-xs font-black uppercase tracking-[0.1em] text-white disabled:opacity-60"
        >
          {searching ? "…" : "Search"}
        </button>
      </form>

      {error && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-3 grid max-h-72 gap-2 overflow-y-auto">
          {results.map((user) => (
            <button
              key={user.id}
              type="button"
              disabled={pendingId === user.id}
              onClick={() => startChat(user.id)}
              className="flex min-w-0 items-center gap-3 rounded-2xl border border-secondary/10 bg-white p-3 text-left shadow-sm transition-colors hover:border-primary/20 hover:bg-primary/5 disabled:opacity-60"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-sm font-black text-primary">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-secondary">{user.name}</p>
                <p className="truncate text-[10px] font-bold uppercase tracking-[0.08em] text-secondary/40">
                  {user.role}
                  {user.email ? ` · ${user.email}` : ""}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-primary px-3 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-white">
                {pendingId === user.id ? "Opening" : "Chat"}
              </span>
            </button>
          ))}
        </div>
      )}

      {searched && !searching && !error && results.length === 0 && (
        <p className="mt-3 text-xs font-semibold text-secondary/40">No users found.</p>
      )}
    </section>
  );
}

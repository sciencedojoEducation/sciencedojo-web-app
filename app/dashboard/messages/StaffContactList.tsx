"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createConversation } from "./actions";

export type StaffContact = {
  id: string;
  name: string;
  role: string;
  title: string;
  avatar_url: string | null;
};

export default function StaffContactList({ contacts }: { contacts: StaffContact[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startChat(contactId: string) {
    setError(null);
    setPendingId(contactId);
    const result = await createConversation(contactId);
    setPendingId(null);

    if (result.error || !result.conversationId) {
      setError(result.error || "Could not start that conversation.");
      return;
    }

    router.push(`/dashboard/messages?id=${result.conversationId}`);
  }

  if (contacts.length === 0) {
    return null;
  }

  return (
    <section className="border-b border-secondary/10 bg-emerald-50/70 p-4">
      <div className="mb-3">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700/55">Internal contacts</p>
        <h3 className="mt-1 text-sm font-black text-emerald-950">Message team</h3>
      </div>

      {error && (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-2">
        {contacts.map((contact) => (
          <button
            key={contact.id}
            type="button"
            disabled={pendingId === contact.id}
            onClick={() => startChat(contact.id)}
            className="flex min-w-0 items-center gap-3 rounded-2xl border border-emerald-100 bg-white p-3 text-left shadow-sm transition-colors hover:border-emerald-200 hover:bg-emerald-50 disabled:opacity-60"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-100 text-sm font-black text-emerald-700">
              {contact.avatar_url ? (
                <img src={contact.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                contact.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-secondary">{contact.name}</p>
              <p className="truncate text-[10px] font-bold uppercase tracking-[0.08em] text-secondary/40">
                {contact.title || contact.role}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-emerald-600 px-3 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-white">
              {pendingId === contact.id ? "Opening" : "Chat"}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

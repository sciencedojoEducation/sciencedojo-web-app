import { getOrCreateSupportConversation } from "./actions";
import { Headphones, LockKeyhole } from "lucide-react";

export default function SupportPage() {
  return (
    <div className="dashboard-home mx-auto max-w-2xl space-y-6 px-4 py-6 md:px-8 md:py-10">
      <header>
        <p className="text-sm font-semibold text-[#4f53a5]">Help and support</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">ScienceDojo Support</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">Tell us what you need help with. Your message opens a private conversation with our team.</p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-7">
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Message the admin team</h2>
            <p className="mt-1 text-sm text-slate-600">We aim to reply within 24 hours on weekdays.</p>
          </div>

          <form action={getOrCreateSupportConversation} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="support-message" className="block text-sm font-semibold text-slate-800">
                What can we help you with?
              </label>
              <textarea
                id="support-message"
                name="message"
                rows={4}
                required
                placeholder="e.g. I'm having trouble with my booking, or I have a question about my account..."
                className="w-full resize-y rounded-xl border border-slate-300 bg-white p-4 text-sm leading-6 text-slate-900 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f53a5]"
              />
            </div>

            <button
              type="submit"
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1E5AA8] px-5 py-3 text-sm font-semibold text-white hover:bg-[#174a8b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f53a5] focus-visible:ring-offset-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Open support chat
            </button>
          </form>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4"><LockKeyhole size={19} className="mt-0.5 shrink-0 text-[#4f53a5]" /><div><h2 className="text-sm font-semibold text-slate-900">Private conversation</h2><p className="mt-1 text-xs leading-5 text-slate-600">Your support chat stays between you and the admin team.</p></div></div>
        <div className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4"><Headphones size={19} className="mt-0.5 shrink-0 text-[#4f53a5]" /><div><h2 className="text-sm font-semibold text-slate-900">Here to help</h2><p className="mt-1 text-xs leading-5 text-slate-600">Bookings, classes, account access, and platform questions.</p></div></div>
      </div>
    </div>
  );
}

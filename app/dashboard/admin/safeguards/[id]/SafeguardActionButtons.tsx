"use client"

import { useState, useTransition } from "react"
import { dismissFlaggedConversation, issueUserWarning } from "../actions"
import { useRouter } from "next/navigation"

interface SafeguardActionButtonsProps {
  conversationId: string
  offenderId: string
}

type ConfirmMode = null | 'dismiss' | 'warn'

export default function SafeguardActionButtons({ conversationId, offenderId }: SafeguardActionButtonsProps) {
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [confirmMode, setConfirmMode] = useState<ConfirmMode>(null)
  const router = useRouter()

  const handleDismissConfirmed = () => {
    startTransition(async () => {
      setConfirmMode(null)
      const result = await dismissFlaggedConversation(conversationId)
      if (result.success) {
        setStatus('success')
        router.refresh()
        router.push("/dashboard/admin/safeguards")
      } else {
        setStatus('error')
        setErrorMessage(result.error || "Failed to dismiss flags")
      }
    })
  }

  const handleWarningConfirmed = () => {
    startTransition(async () => {
      setConfirmMode(null)
      const result = await issueUserWarning(conversationId, offenderId)
      if (result.success) {
        setStatus('success')
        router.refresh()
        router.push("/dashboard/admin/safeguards")
      } else {
        setStatus('error')
        setErrorMessage(result.error || "Failed to issue warning")
      }
    })
  }

  if (status === 'success') {
    return (
      <div className="flex items-center gap-2 bg-green-50 text-green-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-green-100">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        Action Completed
      </div>
    )
  }

  // Inline confirmation panel for Dismiss
  if (confirmMode === 'dismiss') {
    return (
      <div className="flex flex-col items-end gap-3 bg-slate-50 border border-secondary/10 rounded-2xl px-6 py-4 w-full">
        <p className="text-sm font-bold text-secondary text-right">Are you sure you want to dismiss these flags as noise? They will be removed from the dashboard.</p>
        <div className="flex gap-3">
          <button
            onClick={() => setConfirmMode(null)}
            disabled={isPending}
            className="px-5 py-2 bg-white border border-secondary/15 text-secondary/60 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            id="confirm-dismiss-btn"
            onClick={handleDismissConfirmed}
            disabled={isPending}
            className="px-5 py-2 bg-slate-700 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all shadow disabled:opacity-50"
          >
            {isPending ? "Dismissing..." : "Yes, Dismiss"}
          </button>
        </div>
      </div>
    )
  }

  // Inline confirmation panel for Warn
  if (confirmMode === 'warn') {
    return (
      <div className="flex flex-col items-end gap-3 bg-red-50 border border-red-100 rounded-2xl px-6 py-4 w-full">
        <p className="text-sm font-bold text-secondary text-right">This will increment the user&apos;s warning count and send an automated safety notice to this chat. Continue?</p>
        <div className="flex gap-3">
          <button
            onClick={() => setConfirmMode(null)}
            disabled={isPending}
            className="px-5 py-2 bg-white border border-secondary/15 text-secondary/60 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            id="confirm-warn-btn"
            onClick={handleWarningConfirmed}
            disabled={isPending}
            className="px-5 py-2 bg-red-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-red-700 transition-all shadow disabled:opacity-50"
          >
            {isPending ? "Issuing..." : "Yes, Issue Warning"}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 items-end w-full">
      {status === 'error' && (
        <div className="text-red-500 text-[10px] font-bold mb-2">
          Error: {errorMessage}
        </div>
      )}
      <div className="flex justify-end gap-3">
        <button
          id="dismiss-noise-btn"
          onClick={() => setConfirmMode('dismiss')}
          disabled={isPending}
          className="px-6 py-3 bg-white border border-secondary/10 text-secondary/60 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          Dismiss as Noise
        </button>
        <button
          id="issue-warning-btn"
          onClick={() => setConfirmMode('warn')}
          disabled={isPending}
          className="px-6 py-3 bg-secondary text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-secondary/90 shadow-lg active:scale-95 transition-all disabled:opacity-50"
        >
          Issue Warning
        </button>
      </div>
    </div>
  )
}

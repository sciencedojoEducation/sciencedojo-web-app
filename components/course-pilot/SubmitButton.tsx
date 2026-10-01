"use client";
import { useFormStatus } from "react-dom";
export default function SubmitButton({
  children,
  pendingLabel = "Saving…",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="min-h-11 rounded-xl bg-[#1E5AA8] px-5 py-3 text-sm font-semibold text-white hover:bg-[#174a8b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

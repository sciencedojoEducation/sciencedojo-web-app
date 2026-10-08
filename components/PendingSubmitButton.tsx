"use client";

import { useFormStatus } from "react-dom";
import type { ComponentProps } from "react";

export default function PendingSubmitButton({ children, pendingLabel = "Saving…", disabled, ...props }: ComponentProps<"button"> & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return <button {...props} type="submit" disabled={disabled || pending} aria-busy={pending}>
    {pending ? <span role="status">{pendingLabel}</span> : children}
  </button>;
}

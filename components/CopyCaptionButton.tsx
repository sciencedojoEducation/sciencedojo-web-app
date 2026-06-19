"use client";

import { useState } from "react";

type CopyCaptionButtonProps = {
  caption: string;
};

export default function CopyCaptionButton({ caption }: CopyCaptionButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(caption);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex min-h-10 items-center justify-center rounded-full bg-primary px-4 text-xs font-black uppercase tracking-[0.12em] text-white shadow-sm shadow-primary/10 transition-all hover:-translate-y-0.5"
    >
      {copied ? "Copied" : "Copy caption"}
    </button>
  );
}

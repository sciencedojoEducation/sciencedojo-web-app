"use client";

import { use, useState } from "react";
import Link from "next/link";
import { Lock, Mail, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import AuthCard from "@/components/AuthCard";
import { internalLogin } from "./actions";

export default function InternalLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = use(searchParams);
  const errorMsg = resolvedParams?.error as string | undefined;
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <AuthCard
      title="Internal Login"
      subtitle="ScienceDojo team access"
      footer={
        <Link href="/login" className="text-xs font-black text-primary transition-all hover:text-black">
          Public user login
        </Link>
      }
    >
      <div className="space-y-2.5 md:space-y-6">
        <div className="rounded-2xl border border-primary/10 bg-primary/5 p-3 text-center text-[10px] font-black uppercase tracking-wider text-primary md:p-4">
          <ShieldCheck className="mx-auto mb-2 h-4 w-4" aria-hidden="true" />
          Limited internal team access only
        </div>

        {errorMsg && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-3 text-center text-[10px] font-black uppercase tracking-wider text-red-500 animate-in shake duration-300 md:p-4">
            {errorMsg}
          </div>
        )}

        <form
          action={async (formData) => {
            setIsSubmitting(true);
            try {
              await internalLogin(formData);
            } finally {
              setIsSubmitting(false);
            }
          }}
          className="space-y-2.5 text-left md:space-y-4"
        >
          <div className="space-y-1.5 md:space-y-2">
            <label className="ml-4 flex items-center gap-2 text-[11px] font-bold text-navy/40 md:ml-6 md:text-xs">
              <Mail size={12} /> Email Address
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="team@sciencedojo.com"
              className="w-full rounded-[1.25rem] border border-white/40 bg-white/60 px-4 py-3 text-base font-bold text-navy shadow-sm outline-none backdrop-blur-md transition-all placeholder:text-navy/20 focus:ring-4 focus:ring-mint/10 md:rounded-[2rem] md:px-8 md:py-5"
            />
          </div>

          <div className="space-y-1.5 md:space-y-2">
            <label className="ml-4 flex items-center gap-2 text-[11px] font-bold text-navy/40 md:ml-6 md:text-xs">
              <Lock size={12} /> Password
            </label>
            <input
              name="password"
              type="password"
              required
              placeholder="Temporary password"
              className="w-full rounded-[1.25rem] border border-white/40 bg-white/60 px-4 py-3 text-base font-bold tracking-widest text-navy shadow-sm outline-none backdrop-blur-md transition-all placeholder:text-navy/20 focus:ring-4 focus:ring-mint/10 md:rounded-[2rem] md:px-8 md:py-5"
            />
          </div>

          <div className="pt-1 md:pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full overflow-hidden rounded-[1.25rem] bg-primary py-3 text-sm font-black tracking-tight text-white shadow-xl shadow-primary/20 transition-all hover:bg-primary-hover active:scale-95 disabled:opacity-50 md:rounded-[2rem] md:py-5 md:text-lg md:shadow-2xl"
            >
              <span className="relative z-10">{isSubmitting ? "Logging in..." : "Log In"}</span>
              <motion.div
                initial={{ x: "-100%" }}
                animate={isSubmitting ? { x: "100%" } : {}}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="absolute left-0 top-0 h-full w-full skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              />
            </button>
          </div>
        </form>
      </div>
    </AuthCard>
  );
}

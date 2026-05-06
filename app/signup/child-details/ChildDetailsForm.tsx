"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, User, Users } from "lucide-react";
import { completeGoogleParentOnboarding } from "@/app/login/actions";

type ChildDetailsFormProps = {
  role: "parent" | "student";
  fullName: string;
  email: string;
  next: string;
};

export default function ChildDetailsForm({ role, fullName, email, next }: ChildDetailsFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(completeGoogleParentOnboarding, {});
  const isStudent = role === "student";

  useEffect(() => {
    if (!state.success) return;

    const timer = window.setTimeout(() => {
      router.replace(state.redirectTo || (isStudent ? "/dashboard/student" : "/dashboard/parent"));
    }, 900);

    return () => window.clearTimeout(timer);
  }, [router, state.success]);

  if (state.success) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto w-16 h-16 rounded-3xl bg-mint/15 border border-mint/30 flex items-center justify-center shadow-xl shadow-mint/10">
          <span className="w-3 h-3 rounded-full bg-mint animate-pulse" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-navy tracking-tight">
            Welcome to ScienceDojo!
          </h2>
          <p className="text-sm font-bold text-navy/40">
            {isStudent ? "Taking you to your student dashboard." : "Taking you to your parent dashboard."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      <div className="space-y-2">
        <label className="text-xs font-bold text-navy/40 ml-6 flex items-center gap-2">
          <User size={12} /> {isStudent ? "Student name" : "Parent name"}
        </label>
        <input
          name="parent_name"
          type="text"
          required
          defaultValue={fullName}
          placeholder="Your full name"
          className="w-full bg-white/60 backdrop-blur-md border border-white/40 rounded-[2rem] px-8 py-5 text-navy font-bold focus:ring-4 focus:ring-mint/10 outline-none transition-all placeholder:text-navy/20 shadow-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-navy/40 ml-6 flex items-center gap-2">
          <Mail size={12} /> Email
        </label>
        <input
          type="email"
          value={email}
          disabled
          className="w-full bg-slate-100/80 border border-white/40 rounded-[2rem] px-8 py-5 text-navy/60 font-bold shadow-sm cursor-not-allowed"
        />
      </div>

      {!isStudent && (
        <div className="space-y-2">
          <label className="text-xs font-bold text-navy/40 ml-6 flex items-center gap-2">
            <Users size={12} /> Student&apos;s full name
          </label>
          <input
            name="student_name"
            type="text"
            required
            placeholder="Your child's name"
            className="w-full bg-white/60 backdrop-blur-md border border-white/40 rounded-[2rem] px-8 py-5 text-navy font-bold focus:ring-4 focus:ring-mint/10 outline-none transition-all placeholder:text-navy/20 shadow-sm"
          />
        </div>
      )}

      {state.error && (
        <p className="text-[10px] font-black uppercase text-red-500 tracking-wider text-center pt-2">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-5 bg-primary text-white rounded-[2rem] font-black tracking-tight text-lg shadow-2xl shadow-primary/20 hover:bg-primary-hover transition-all active:scale-95 disabled:opacity-50 overflow-hidden relative group"
      >
        <span className="relative z-10">{isPending ? "Saving details…" : "Complete Setup"}</span>
        <motion.div
          initial={{ x: "-100%" }}
          animate={isPending ? { x: "100%" } : {}}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
        />
      </button>
    </form>
  );
}

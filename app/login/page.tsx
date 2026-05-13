"use client";

import { useState, use } from "react";
import { login, signInWithGoogle } from "@/app/login/actions";
import Link from "next/link";
import AuthCard, { Divider } from "@/components/AuthCard";
import { User, Mail, Lock, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";

export default function LoginPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const resolvedParams = use(searchParams);
  const errorMsg = resolvedParams?.error as string | undefined;
  const successMsg = resolvedParams?.message as string | undefined;
  const nextParam = typeof resolvedParams?.next === "string" && resolvedParams.next.startsWith("/") && !resolvedParams.next.startsWith("//")
    ? resolvedParams.next
    : "";

  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <AuthCard 
      title="Welcome Back" 
      subtitle="Log in to your account"
      footer={
        <div className="space-y-4">
          <p className="text-xs font-bold text-navy/20 text-center">
            Don't have an account?
          </p>
          <Link 
            href={nextParam ? `/signup?next=${encodeURIComponent(nextParam)}` : "/signup"}
            className="block text-primary font-black text-xs hover:text-black transition-all text-center"
          >
            Create an Account
          </Link>
        </div>
      }
    >
      <div className="space-y-4 md:space-y-6">
        {successMsg && (
          <div className="p-4 rounded-2xl bg-mint/10 border border-mint/20 text-mint text-[10px] font-black uppercase tracking-wider text-center animate-in fade-in zoom-in-95">
             {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-500 text-[10px] font-black uppercase tracking-wider text-center animate-in shake duration-300">
             ⚠️ {errorMsg}
          </div>
        )}

        <form action={async (formData) => {
          setIsSubmitting(true);
          try {
            await login(formData);
          } finally {
            setIsSubmitting(false);
          }
        }} className="space-y-3 text-left md:space-y-4">
          {nextParam && <input type="hidden" name="next" value={nextParam} />}
          <div className="space-y-2">
             <label className="text-xs font-bold text-navy/40 ml-6 flex items-center gap-2">
               <Mail size={12} /> Email Address
             </label>
             <input 
               name="email" 
               type="email" 
               required 
               placeholder="you@dojo.com" 
               className="w-full rounded-[1.5rem] border border-white/40 bg-white/60 px-6 py-4 font-bold text-navy shadow-sm outline-none backdrop-blur-md transition-all placeholder:text-navy/20 focus:ring-4 focus:ring-mint/10 md:rounded-[2rem] md:px-8 md:py-5"
             />
          </div>

          <div className="space-y-2 relative">
             <div className="flex justify-between items-center pr-6">
               <label className="text-xs font-bold text-navy/40 ml-6 flex items-center gap-2">
                 <Lock size={12} /> Password
               </label>
               <Link href="/forgot-password" title="Forgot Password" className="text-xs font-bold text-primary/40 hover:text-primary transition-all">
                 Forgot Password?
               </Link>
             </div>
             <input 
               name="password" 
               type="password" 
               required 
               placeholder="••••••••" 
                className="w-full rounded-[1.5rem] border border-white/40 bg-white/60 px-6 py-4 font-bold tracking-widest text-navy shadow-sm outline-none backdrop-blur-md transition-all placeholder:text-navy/20 focus:ring-4 focus:ring-mint/10 md:rounded-[2rem] md:px-8 md:py-5"
             />
          </div>

          <div className="pt-2 md:pt-4">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full overflow-hidden rounded-[1.5rem] bg-primary py-4 text-base font-black tracking-tight text-white shadow-2xl shadow-primary/20 transition-all hover:bg-primary-hover active:scale-95 disabled:opacity-50 md:rounded-[2rem] md:py-5 md:text-lg"
            >
              <span className="relative z-10">{isSubmitting ? 'Logging in...' : 'Log In'}</span>
              <motion.div 
                initial={{ x: '-100%' }}
                animate={isSubmitting ? { x: '100%' } : {}}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
              />
            </button>
          </div>
        </form>

        <Divider label="OR" />

        {/* Google Login */}
        <button 
          onClick={() => signInWithGoogle(undefined, undefined, nextParam)}
          className="group relative flex w-full transform items-center justify-center gap-3 overflow-hidden rounded-[1.5rem] border border-navy/5 bg-white py-4 shadow-xl shadow-navy/5 transition-all hover:border-navy/10 hover:shadow-navy/10 active:scale-95 md:gap-4 md:rounded-[2rem] md:py-5"
        >
          <div className="w-5 h-5 relative">
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
            </svg>
          </div>
          <span className="font-black text-navy text-sm">Continue with Google</span>
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-navy/5 via-transparent to-navy/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"
          />
        </button>
      </div>
    </AuthCard>
  );
}

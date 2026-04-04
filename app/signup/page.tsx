"use client";

import { useState, use } from "react";
import { signup, signInWithGoogle } from "@/app/login/actions";
import Link from "next/link";
import AuthCard, { RoleCard, Divider } from "@/components/AuthCard";
import { motion, AnimatePresence } from "framer-motion";
import { User, GraduationCap, Mail, Lock, ShieldCheck } from "lucide-react";
import Image from "next/image";

export default function SignupPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const resolvedParams = use(searchParams);
  const errorMsg = resolvedParams?.error as string | undefined;

  const [role, setRole] = useState<"parent" | "tutor" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <AuthCard 
      title="Join the Dojo" 
      subtitle="Create your account to get started"
      footer={
        <div className="space-y-4">
          <p className="text-xs font-bold text-navy/20 text-center">
            Already have an account?
          </p>
          <Link 
            href="/login" 
            className="block text-primary font-black text-xs hover:text-black transition-all text-center"
          >
            Log In Here
          </Link>
        </div>
      }
    >
      <AnimatePresence mode="wait">
        {!role ? (
          <motion.div 
            key="roles"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            <RoleCard 
              title="I am a Student / Parent"
              description="I want to find tutors and book sessions."
              onClick={() => setRole("parent")}
            />
            <RoleCard 
              title="I am a Tutor"
              description="I want to apply to teach on the platform."
              onClick={() => setRole("tutor")}
            />
          </motion.div>
        ) : (
          <motion.div 
            key="auth-options"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {/* Header for Step 2 */}
            <div className="flex items-center justify-between gap-4 mb-4">
              <button 
                onClick={() => { setRole(null); }}
                className="text-xs font-bold text-navy/20 hover:text-navy transition-all"
              >
                ← Back
              </button>
              <span className={`px-4 py-1.5 rounded-full text-xs font-bold bg-primary/10 text-primary`}>
                {role === 'tutor' ? 'Tutor' : 'Student'}
              </span>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              <form action={async (formData) => {
                formData.append('role', role);
                setIsSubmitting(true);
                try {
                  await signup(formData);
                } finally {
                  setIsSubmitting(false);
                }
              }} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-navy/40 ml-6 flex items-center gap-2">
                       <User size={12} /> Full Name
                    </label>
                    <input 
                      name="name" 
                      type="text" 
                      required 
                      placeholder="Enso Calibur" 
                      className="w-full bg-white/60 backdrop-blur-md border border-white/40 rounded-[2rem] px-8 py-5 text-navy font-bold focus:ring-4 focus:ring-mint/10 outline-none transition-all placeholder:text-navy/20 shadow-sm"
                    />
                </div>
                
                <div className="space-y-2">
                    <label className="text-xs font-bold text-navy/40 ml-6 flex items-center gap-2">
                      <Mail size={12} /> Email Address
                    </label>
                    <input 
                      name="email" 
                      type="email" 
                      required 
                      placeholder="you@dojo.com" 
                      className="w-full bg-white/60 backdrop-blur-md border border-white/40 rounded-[2rem] px-8 py-5 text-navy font-bold focus:ring-4 focus:ring-mint/10 outline-none transition-all placeholder:text-navy/20 shadow-sm"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-navy/40 ml-6 flex items-center gap-2">
                      <Lock size={12} /> Password
                    </label>
                    <input 
                      name="password" 
                      type="password" 
                      required 
                      placeholder="At least 8 characters" 
                      className="w-full bg-white/60 backdrop-blur-md border border-white/40 rounded-[2rem] px-8 py-5 text-navy font-bold focus:ring-4 focus:ring-mint/10 outline-none transition-all placeholder:text-navy/20 shadow-sm tracking-widest"
                    />
                </div>

                {errorMsg && (
                  <p className="text-[10px] font-black uppercase text-red-500 tracking-wider text-center pt-2">
                    ⚠️ {errorMsg}
                  </p>
                )}

                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-5 bg-primary text-white rounded-[2rem] font-black tracking-tight text-lg shadow-2xl shadow-primary/20 hover:bg-primary-hover transition-all active:scale-95 disabled:opacity-50 overflow-hidden relative group"
                    >
                      <span className="relative z-10">{isSubmitting ? 'Creating Account...' : 'Create My Account'}</span>
                      <motion.div 
                        initial={{ x: '-100%' }}
                        animate={isSubmitting ? { x: '100%' } : {}}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                        className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
                      />
                    </button>
              </form>

              <Divider label="OR" />

              {/* Google Signup */}
              <button 
                onClick={() => signInWithGoogle(role)}
                className="w-full flex items-center justify-center gap-4 py-5 bg-white border border-navy/5 rounded-[2rem] shadow-xl shadow-navy/5 hover:border-navy/10 hover:shadow-navy/10 transition-all transform active:scale-95 overflow-hidden group relative"
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthCard>
  );
}

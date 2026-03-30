"use client";

import { useState, use } from "react";
import { signup } from "@/app/login/actions";
import Link from "next/link";

export default function SignupPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const resolvedParams = use(searchParams);
  const errorMsg = resolvedParams?.error as string | undefined;

  const [role, setRole] = useState<"parent" | "tutor" | null>((resolvedParams?.role as any) || null);
  const [subRole, setSubRole] = useState<"student" | "parent" | null>((resolvedParams?.sub_role as any) || null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const hasLength = password.length > 7;
  const hasUpper = /[A-Z]/.test(password);
  const hasSpecial = /[0-9!@#\$%\^&\*]/.test(password);

  const strength = (hasLength ? 1 : 0) + (hasUpper && hasSpecial ? 1 : 0);
  const passwordMatch = password === confirmPassword && password.length > 0;
  const isSubmitDisabled = strength < 1 || !passwordMatch || password.length === 0;

  const handleBack = () => {
    if (subRole) {
      setSubRole(null);
    } else {
      setRole(null);
    }
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-background min-h-[calc(100vh-80px)] py-12 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-sm border border-secondary/10">
        
        {/* Step 1: Base Role Choice */}
        {!role ? (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h1 className="text-3xl font-bold text-center text-secondary mb-2">Join ScienceDojo</h1>
              <p className="text-center text-secondary/60 mb-8">How would you like to use the platform?</p>
              
              <div className="space-y-4">
                 <button 
                   onClick={() => setRole("parent")}
                   className="w-full p-6 bg-surface border border-secondary/10 rounded-2xl flex items-center justify-between text-left hover:border-primary/50 hover:shadow-md transition-all group"
                 >
                    <div>
                       <h3 className="font-bold text-secondary text-lg group-hover:text-primary transition-colors">I am a Student / Parent</h3>
                       <p className="text-sm text-secondary/60 mt-1">I want to find tutors and book sessions.</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">→</div>
                 </button>

                 <button 
                   onClick={() => setRole("tutor")}
                   className="w-full p-6 bg-surface border border-secondary/10 rounded-2xl flex items-center justify-between text-left hover:border-accent/50 hover:shadow-md transition-all group"
                 >
                    <div>
                       <h3 className="font-bold text-secondary text-lg group-hover:text-accent transition-colors">I am a Tutor</h3>
                       <p className="text-sm text-secondary/60 mt-1">I want to apply to teach on the platform.</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold">→</div>
                 </button>
              </div>
              <p className="text-center text-sm text-secondary/60 mt-8">
                 Already have an account? <Link href="/login" className="font-bold text-primary hover:underline">Log In</Link>
              </p>
           </div>
        ) : (role === "parent" && !subRole) ? (
           /* Step 2: Student vs Parent Choice */
           <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <button onClick={handleBack} className="text-sm font-bold text-secondary/50 hover:text-secondary mb-6 flex items-center gap-2">
                 ← Back
              </button>
              <h1 className="text-3xl font-bold text-secondary mb-2 text-center">Who is this for?</h1>
              <p className="text-center text-secondary/60 mb-8">Help us personalize your dashboard.</p>
              
              <div className="space-y-4">
                 <button 
                   onClick={() => setSubRole("student")}
                   className="w-full p-5 bg-surface border border-secondary/10 rounded-2xl text-left hover:border-primary/50 transition-all flex items-center gap-4 group"
                 >
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl">🎒</div>
                    <div>
                       <h3 className="font-bold text-secondary group-hover:text-primary transition-colors">I am the student</h3>
                       <p className="text-xs text-secondary/60">I will be attending the classes.</p>
                    </div>
                 </button>

                 <button 
                   onClick={() => setSubRole("parent")}
                   className="w-full p-5 bg-surface border border-secondary/10 rounded-2xl text-left hover:border-primary/50 transition-all flex items-center gap-4 group"
                 >
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-2xl">👨‍👩-👧</div>
                    <div>
                       <h3 className="font-bold text-secondary group-hover:text-primary transition-colors">I am a parent</h3>
                       <p className="text-xs text-secondary/60">I am booking for my child.</p>
                    </div>
                 </button>
              </div>
           </div>
        ) : (
           /* Step 3: Registration Form */
           <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <button onClick={handleBack} className="text-sm font-bold text-secondary/50 hover:text-secondary mb-6 flex items-center gap-2">
                 ← Back
              </button>
              <h1 className="text-3xl font-bold text-secondary mb-2">
                 {role === "tutor" ? "Apply as Tutor" : (subRole === "parent" ? "Parent's Portal" : "Student's Portal")}
              </h1>
              <p className="text-secondary/60 mb-8">Enter your details to securely set up your portal.</p>

              {errorMsg && (
                 <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
                   {errorMsg}
                 </div>
              )}

              <form className="space-y-4 text-left">
                <input type="hidden" name="role" value={role} />
                <input type="hidden" name="sub_role" value={subRole || ""} />
                
                <div>
                  <label className="block text-sm font-bold text-secondary mb-1">
                    {subRole === "parent" ? "Your Full Name" : "Full Name"}
                  </label>
                  <input
                    name="name"
                    type="text"
                    required
                    className="w-full rounded-xl border-secondary/20 bg-surface px-4 py-3 text-secondary focus:border-primary focus:ring-1 focus:ring-primary shadow-inner outline-none"
                    placeholder="Jane Doe"
                  />
                </div>

                {subRole === "parent" && (
                   <div>
                     <label className="block text-sm font-bold text-secondary mb-1">Student's Full Name</label>
                     <input
                       name="student_name"
                       type="text"
                       required
                       className="w-full rounded-xl border-secondary/20 bg-surface px-4 py-3 text-secondary focus:border-primary focus:ring-1 focus:ring-primary shadow-inner outline-none"
                       placeholder="Alex Mercer"
                     />
                   </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-secondary mb-1">Email</label>
                  <input
                    name="email"
                    type="email"
                    required
                    className="w-full rounded-xl border-secondary/20 bg-surface px-4 py-3 text-secondary focus:border-primary focus:ring-1 focus:ring-primary shadow-inner outline-none"
                    placeholder="you@example.com"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                     <label className="block text-sm font-bold text-secondary">Password</label>
                     {strength === 0 && <span className="text-[10px] font-bold text-red-500 uppercase">Weak</span>}
                     {strength === 1 && <span className="text-[10px] font-bold text-orange-500 uppercase">Medium</span>}
                     {strength === 2 && <span className="text-[10px] font-bold text-green-500 uppercase">Strong</span>}
                  </div>
                  <input
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border-secondary/20 bg-surface px-4 py-3 text-secondary focus:border-primary focus:ring-1 focus:ring-primary shadow-inner outline-none mb-1"
                    placeholder="••••••••"
                  />
                  <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden flex gap-1">
                     <div className={`h-full flex-1 transition-colors ${strength >= 0 ? (strength === 0 ? 'bg-red-500' : strength === 1 ? 'bg-orange-500' : 'bg-green-500') : 'bg-transparent'}`}></div>
                     <div className={`h-full flex-1 transition-colors ${strength >= 1 ? (strength === 1 ? 'bg-orange-500' : 'bg-green-500') : 'bg-transparent'}`}></div>
                     <div className={`h-full flex-1 transition-colors ${strength >= 2 ? 'bg-green-500' : 'bg-transparent'}`}></div>
                  </div>
                  
                  {/* Requirement Checklist */}
                  <div className="mt-3 space-y-1.5">
                    <div className={`flex items-center gap-2 text-xs transition-colors ${hasLength ? 'text-green-600' : 'text-secondary/40'}`}>
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border ${hasLength ? 'bg-green-500 border-green-500' : 'border-secondary/20'}`}>
                        {hasLength && <span className="text-[10px] text-white">✓</span>}
                      </div>
                      At least 8 characters
                    </div>
                    <div className={`flex items-center gap-2 text-xs transition-colors ${hasUpper ? 'text-green-600' : 'text-secondary/40'}`}>
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border ${hasUpper ? 'bg-green-500 border-green-500' : 'border-secondary/20'}`}>
                        {hasUpper && <span className="text-[10px] text-white">✓</span>}
                      </div>
                      One uppercase letter
                    </div>
                    <div className={`flex items-center gap-2 text-xs transition-colors ${hasSpecial ? 'text-green-600' : 'text-secondary/40'}`}>
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border ${hasSpecial ? 'bg-green-500 border-green-500' : 'border-secondary/20'}`}>
                        {hasSpecial && <span className="text-[10px] text-white">✓</span>}
                      </div>
                      One number or symbol
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                     <label className="block text-sm font-bold text-secondary">Confirm Password</label>
                     {!passwordMatch && confirmPassword.length > 0 && <span className="text-[10px] font-bold text-red-500 uppercase">Passwords do not match</span>}
                     {passwordMatch && confirmPassword.length > 0 && <span className="text-[10px] font-bold text-green-500 uppercase">Match!</span>}
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full rounded-xl border-secondary/20 bg-surface px-4 py-3 text-secondary focus:border-primary focus:ring-1 focus:ring-primary shadow-inner outline-none ${!passwordMatch && confirmPassword.length > 0 ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="••••••••"
                  />
                </div>

                <div className="pt-4">
                  {isSubmitDisabled && (
                    <p className="text-[11px] text-secondary/40 text-center mb-2 animate-in fade-in slide-in-from-bottom-1 duration-300">
                      {password.length === 0 ? "Enter a password to begin" : 
                       !hasLength ? "Password must be at least 8 characters" :
                       !passwordMatch ? "Passwords must match exactly" :
                       "Check requirements above"}
                    </p>
                  )}
                  <button 
                    formAction={signup}
                    disabled={isSubmitDisabled}
                    className={`w-full text-white font-bold py-3 text-lg rounded-xl transition-colors shadow-sm ${role === "tutor" ? "bg-accent hover:bg-accent/90" : "bg-primary hover:bg-primary-hover"} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {role === "tutor" ? "Submit Application" : "Create Account"}
                  </button>
                </div>
                
                {role === "tutor" && (
                   <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl mt-4 text-xs text-orange-800">
                      Tutors must be manually vetted by an administrator before their public directory profile becomes live.
                   </div>
                )}
              </form>
           </div>
        )}

      </div>
    </div>
  );
}

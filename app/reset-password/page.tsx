"use client";

import { use, useState } from "react";
import { updatePassword } from "@/app/login/actions";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const resolvedParams = use(searchParams);
  const errorMsg = resolvedParams?.error as string | undefined;
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  // Calculate Password Strength
  const getStrength = (pw: string) => {
     if (pw.length === 0) return -1;
     let score = 0;
     if (pw.length > 7) score += 1;
     if (/[A-Z]/.test(pw) && /[0-9!@#\$%\^&\*]/.test(pw)) score += 1;
     return score;
  };
  
  const strength = getStrength(password);
  const passwordMatch = password === confirmPassword;
  const isSubmitDisabled = strength < 1 || !passwordMatch || password.length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     setClientError(null);
     
     const result = await updatePassword(password);
     if (result?.error) {
        setClientError(result.error);
     } else {
        setIsSuccess(true);
        router.replace(result?.redirectTo || "/login");
     }
  };

  if (isSuccess) {
     return (
        <div className="flex flex-col flex-1 items-center justify-center bg-background min-h-[calc(100vh-140px)] py-12 px-4">
           <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-sm border border-secondary/10 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-600 mx-auto mb-6">
                 <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h1 className="text-3xl font-bold text-secondary mb-2">Password Updated!</h1>
              <p className="text-secondary/60 mb-8">Your password has been successfully reset. You can now log securely into your dashboard.</p>
              <p className="px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-sm w-full block">
                 Redirecting...
              </p>
           </div>
        </div>
     );
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-background min-h-[calc(100vh-140px)] py-12 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-sm border border-secondary/10">
        
        <h1 className="text-3xl font-bold text-secondary mb-2">Create New Password</h1>
        <p className="text-secondary/60 mb-8">Please enter and confirm your new strong password.</p>

        {(errorMsg || clientError) && (
           <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
             Error: {errorMsg || clientError}
           </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
           <div>
              <div className="flex justify-between items-center mb-1">
                 <label className="block text-sm font-medium text-secondary">New Password</label>
                 {strength === 0 && <span className="text-[10px] font-bold text-red-500 uppercase">Weak</span>}
                 {strength === 1 && <span className="text-[10px] font-bold text-orange-500 uppercase">Medium</span>}
                 {strength === 2 && <span className="text-[10px] font-bold text-green-500 uppercase">Strong</span>}
              </div>
              <input
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
           </div>

           <div>
              <div className="flex justify-between items-center mb-1">
                 <label className="block text-sm font-medium text-secondary">Confirm Password</label>
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

           <button 
             type="submit"
             disabled={isSubmitDisabled}
             className="w-full bg-primary text-white font-bold py-3 text-lg rounded-xl hover:bg-primary-hover transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
           >
             Save New Password
           </button>
        </form>

      </div>
    </div>
  );
}

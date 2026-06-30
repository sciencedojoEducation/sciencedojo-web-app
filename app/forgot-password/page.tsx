import { requestPasswordReset } from "@/app/login/actions";
import Link from "next/link";

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const resolvedParams = await searchParams;
  const errorMsg = resolvedParams?.error as string | undefined;
  const rawSuccessMsg = resolvedParams?.message as string | undefined;
  const isInternal = resolvedParams?.internal === "1";
  const email = typeof resolvedParams?.email === "string" ? resolvedParams.email : "";
  const invalidResetLink = rawSuccessMsg === "reset-link-invalid";
  const infoMsg = invalidResetLink
    ? "Your reset link may have expired or is invalid. Please request a new password reset link."
    : "";
  const successMsg = invalidResetLink ? "" : rawSuccessMsg;
  const returnHref = isInternal ? "/login/internal" : "/login";

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-background min-h-[calc(100vh-140px)] py-12 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-sm border border-secondary/10">
        
        <Link href={returnHref} className="text-sm font-bold text-secondary/50 hover:text-secondary mb-6 flex items-center gap-2">
           ← Back to {isInternal ? "Internal Login" : "Login"}
        </Link>
        <h1 className="text-3xl font-bold text-secondary mb-2">Reset Password</h1>
        <p className="text-secondary/60 mb-8">
          {isInternal
            ? "Enter your ScienceDojo internal team email, and we'll send you a secure link to set or reset your password."
            : "Enter your registered email below, and we'll send you a secure link to reset your password."}
        </p>

        {infoMsg && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-800">
            {infoMsg}
          </div>
        )}

        {successMsg ? (
           <div className="bg-green-50 border border-green-200 p-6 rounded-2xl text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 mx-auto mb-4">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="font-bold text-green-900 mb-2">Check your email</h3>
              <p className="text-sm text-green-800/80">
                We sent a password reset link to that address. Remember to check your spam folder!
              </p>
           </div>
        ) : (
           <form action={requestPasswordReset} className="space-y-6">
             {isInternal && <input type="hidden" name="internal" value="1" />}
             {errorMsg && (
                <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
                  Error: {errorMsg}
                </div>
             )}
             
             <div>
               <label className="block text-sm font-medium text-secondary mb-1" htmlFor="email">Email Address</label>
               <input
                 id="email"
                 name="email"
                 type="email"
                 required
                 defaultValue={email}
                 className="w-full rounded-xl border-secondary/20 bg-surface px-4 py-3 text-secondary focus:border-primary focus:ring-1 focus:ring-primary shadow-inner outline-none"
                 placeholder="you@example.com"
               />
             </div>

             <button 
               type="submit"
               className="w-full bg-primary text-white font-bold py-3 text-lg rounded-xl hover:bg-primary-hover transition-colors shadow-sm"
             >
               Send Recovery Link
             </button>
           </form>
        )}

      </div>
    </div>
  );
}

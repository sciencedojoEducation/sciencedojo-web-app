import { login, signup } from '@/app/login/actions'
import Link from 'next/link'

// Use a dynamic server component pattern by accepting searchParams directly in page props
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const resolvedParams = await searchParams;
  const errorMsg = resolvedParams?.error as string | undefined;
  const successMsg = resolvedParams?.message as string | undefined;

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-background min-h-[calc(100vh-140px)] py-12 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-sm border border-secondary/10">
        <h1 className="text-3xl font-bold text-center text-secondary mb-2">Welcome Back</h1>
        <p className="text-center text-secondary/60 mb-8">Sign in to manage your bookings and profile.</p>

        {successMsg && (
           <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm font-medium">
             {successMsg}
           </div>
        )}

        {errorMsg && (
           <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
             Error: {errorMsg}
             {errorMsg.toLowerCase().includes("email") && (
                <p className="mt-2 text-xs opacity-80">(Note: Supabase projects require you to confirm your email by default before logging in. Check your inbox!)</p>
             )}
           </div>
        )}

        <form className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-xl border-secondary/20 bg-surface px-4 py-3 text-secondary focus:border-primary focus:ring-1 focus:ring-primary shadow-inner outline-none"
              placeholder="you@example.com"
            />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
               <label className="block text-sm font-medium text-secondary" htmlFor="password">Password</label>
               <Link href="/forgot-password" className="text-xs font-bold text-primary hover:underline">Forgot Password?</Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-xl border-secondary/20 bg-surface px-4 py-3 text-secondary focus:border-primary focus:ring-1 focus:ring-primary shadow-inner outline-none"
              placeholder="••••••••"
            />
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button 
              formAction={login} 
              className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary-hover transition-colors shadow-sm"
            >
              Log in
            </button>
            <button 
              formAction={signup} 
              className="w-full bg-surface text-secondary font-bold py-3 rounded-xl border border-secondary/20 hover:bg-secondary/5 transition-colors"
            >
              Sign up
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

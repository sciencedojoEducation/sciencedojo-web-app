import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}?message=Email%20confirmed!%20You%20can%20now%20log%20in.`)
    }
    
    console.error("Auth callback error:", error.message)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('The confirmation link was invalid or has expired. Please try logging in or requesting a new password.')}`)
  }

  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('No confirmation code found in the link.')}`)
}

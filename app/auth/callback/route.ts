import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Check for pending role selection from signup
      const cookieStore = await cookies();
      const pendingRole = cookieStore.get('pending_role')?.value;
      const pendingSubRole = cookieStore.get('pending_sub_role')?.value;

      if (pendingRole) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Update profile and metadata
          await supabase.auth.updateUser({
            data: { 
              role: pendingRole, 
              sub_role: pendingSubRole || '' 
            }
          });

          await supabase.from('profiles').update({
            role: pendingRole,
            sub_role: pendingSubRole || ''
          }).eq('id', user.id);
        }

        // Cleanup
        cookieStore.delete('pending_role');
        cookieStore.delete('pending_sub_role');

        const redirectPath = pendingRole === 'tutor' ? '/tutor/onboarding' : `/dashboard/${pendingRole}`;
        return NextResponse.redirect(`${origin}${redirectPath}`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
    
    console.error("Auth callback error:", error.message)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('The confirmation link was invalid or has expired. Please try logging in or requesting a new password.')}`)
  }

  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('No confirmation code found in the link.')}`)
}

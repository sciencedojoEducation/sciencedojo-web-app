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
      // Check for pending role selection from signup (URL params first, then cookies)
      const cookieStore = await cookies();
      const pendingRole = searchParams.get('role') || cookieStore.get('pending_role')?.value;
      const pendingSubRole = searchParams.get('subRole') || cookieStore.get('pending_sub_role')?.value;

      if (pendingRole) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // 1. Update Auth Metadata
          await supabase.auth.updateUser({
            data: { 
              role: pendingRole, 
              sub_role: pendingSubRole || '',
              full_name: user.user_metadata.full_name || '',
              avatar_url: user.user_metadata.avatar_url || ''
            }
          });

          // 2. Upsert Profile (Ensure it exists with the correct role/names)
          await supabase.from('profiles').upsert({
            id: user.id,
            email: user.email?.toLowerCase() || '',
            full_name: user.user_metadata.full_name || '',
            avatar_url: user.user_metadata.avatar_url || '',
            role: pendingRole,
            sub_role: pendingSubRole || ''
          }, { onConflict: 'id' });

          // 3. Provision Tutor Row if applicable
          if (pendingRole === 'tutor') {
            await supabase.from('tutors').upsert({
              id: user.id,
              is_verified: false,
              is_available_now: true,
              bio: '',
              hourly_rate: 0
            }, { onConflict: 'id' });
          }
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

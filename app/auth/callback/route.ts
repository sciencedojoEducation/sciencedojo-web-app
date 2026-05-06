import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

function getSafeNextPath(nextPath?: string | null) {
  const path = String(nextPath || '').trim();

  if (!path.startsWith('/') || path.startsWith('//')) {
    return '';
  }

  if (path.startsWith('/api') || path.startsWith('/auth')) {
    return '';
  }

  return path;
}

function isTutorBookingPath(path: string) {
  return /^\/tutor\/[^/]+\/book(?:\?.*)?$/.test(path);
}

function withAuthReturnFlag(path: string) {
  if (!isTutorBookingPath(path)) {
    return path;
  }

  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}auth_return=1`;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const oauthError = searchParams.get('error') || searchParams.get('error_description')

  if (oauthError) {
    return NextResponse.redirect(`${origin}/signup?error=${encodeURIComponent('Google sign-up was cancelled or could not be completed. Please try again.')}`)
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Check for pending role selection from signup (URL params first, then cookies)
      const cookieStore = await cookies();
      const pendingRole = searchParams.get('role') || cookieStore.get('pending_role')?.value;
      const pendingSubRole = searchParams.get('subRole') || cookieStore.get('pending_sub_role')?.value;
      const pendingNext = getSafeNextPath(searchParams.get('next') || cookieStore.get('pending_next')?.value);

      if (pendingRole) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: currentProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();

          if (currentProfile?.role && currentProfile.role !== pendingRole) {
            cookieStore.delete('pending_role');
            cookieStore.delete('pending_sub_role');
            cookieStore.delete('pending_next');
            await supabase.auth.signOut();
            return NextResponse.redirect(`${origin}/signup?error=${encodeURIComponent('That email is already registered. Please log in instead.')}`)
          }

          const providerId = user.identities?.find(identity => identity.provider === 'google')?.id || '';
          const googleName = user.user_metadata.full_name || user.user_metadata.name || '';

          // 1. Update Auth Metadata
          await supabase.auth.updateUser({
            data: { 
              role: pendingRole, 
              sub_role: pendingSubRole || '',
              full_name: googleName,
              avatar_url: user.user_metadata.avatar_url || user.user_metadata.picture || '',
              auth_provider: 'google',
              google_id: providerId,
              provider_id: providerId,
              onboarding_completed: pendingRole === 'parent' || pendingRole === 'student' ? false : true
            }
          });

          // 2. Upsert Profile (Ensure it exists with the correct role/names)
          await supabase.from('profiles').upsert({
            id: user.id,
            email: user.email?.toLowerCase() || '',
            full_name: googleName,
            avatar_url: user.user_metadata.avatar_url || user.user_metadata.picture || '',
            role: pendingRole,
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
        cookieStore.delete('pending_next');

        const redirectPath = pendingRole === 'tutor'
          ? '/tutor/onboarding'
          : pendingRole === 'parent'
            ? `/signup/child-details${pendingNext ? `?next=${encodeURIComponent(pendingNext)}` : ''}`
            : pendingRole === 'student'
              ? `/signup/child-details${pendingNext ? `?next=${encodeURIComponent(pendingNext)}` : ''}`
              : pendingNext ? withAuthReturnFlag(pendingNext) : `/dashboard/${pendingRole}`;
        return NextResponse.redirect(`${origin}${redirectPath}`);
      }

      // No pending role — this is a returning user login via Google.
      // Check their existing profile to redirect correctly.
      const { data: { user: existingUser } } = await supabase.auth.getUser();
      if (existingUser) {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('role, student_name')
          .eq('id', existingUser.id)
          .single();

        const existingRole = existingProfile?.role || existingUser.user_metadata?.role || 'parent';
        const onboardingCompleted = existingUser.user_metadata?.onboarding_completed;
        const hasStudentName = Boolean(existingProfile?.student_name || existingUser.user_metadata?.student_name);
        const safeNext = getSafeNextPath(next);

        if (existingRole === 'parent' && (onboardingCompleted === false || !hasStudentName)) {
          return NextResponse.redirect(`${origin}/signup/child-details${safeNext ? `?next=${encodeURIComponent(safeNext)}` : ''}`);
        }

        if (existingRole === 'student' && onboardingCompleted === false) {
          return NextResponse.redirect(`${origin}/signup/child-details${safeNext ? `?next=${encodeURIComponent(safeNext)}` : ''}`);
        }

        return NextResponse.redirect(`${origin}${safeNext ? withAuthReturnFlag(safeNext) : `/dashboard/${existingRole}`}`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
    
    console.error("Auth callback error:", error.message)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('The confirmation link was invalid or has expired. Please try logging in or requesting a new password.')}`)
  }

  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('No confirmation code found in the link.')}`)
}

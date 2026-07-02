import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { cookies } from 'next/headers'
import { getActiveInternalMemberByUserId, repairLinkedInternalUserRole } from '@/lib/internal-auth'
import { upsertMembershipForRole } from '@/lib/account-memberships'

type PublicSignupRole = 'user' | 'parent' | 'student' | 'tutor';
type DashboardRole = PublicSignupRole | 'admin' | 'internal';

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

function normalizePublicSignupRole(role?: string | null): PublicSignupRole | null {
  return role === 'user' || role === 'parent' || role === 'student' || role === 'tutor' ? role : null;
}

function normalizeDashboardRole(role?: unknown): DashboardRole | null {
  return role === 'user' || role === 'parent' || role === 'student' || role === 'tutor' || role === 'admin' || role === 'internal' ? role : null;
}

function isFreshOAuthUser(createdAt?: string) {
  if (!createdAt) return false;

  const createdTime = new Date(createdAt).getTime();
  if (Number.isNaN(createdTime)) return false;

  return Date.now() - createdTime < 10 * 60 * 1000;
}

function clearPendingSignupCookies(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  cookieStore.delete('pending_role');
  cookieStore.delete('pending_sub_role');
  cookieStore.delete('pending_next');
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const oauthError = searchParams.get('error') || searchParams.get('error_description')
  const safeNextForNoCode = getSafeNextPath(next);

  if (oauthError) {
    const cookieStore = await cookies();
    clearPendingSignupCookies(cookieStore);
    return NextResponse.redirect(`${origin}/signup?error=${encodeURIComponent('Google sign-up was cancelled or could not be completed. Please try again.')}`)
  }

  if (!code) {
    if (safeNextForNoCode === '/reset-password') {
      return NextResponse.redirect(`${origin}/forgot-password?internal=1&message=reset-link-invalid`);
    }

    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('The confirmation link was invalid or has expired. Please request a new link.')}`)
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Check for pending role selection from signup (URL params first, then cookies)
      const cookieStore = await cookies();
      const rawPendingRole = searchParams.get('role') || cookieStore.get('pending_role')?.value;
      const pendingRole = normalizePublicSignupRole(rawPendingRole);
      const pendingSubRole = searchParams.get('subRole') || cookieStore.get('pending_sub_role')?.value;
      const pendingNext = getSafeNextPath(searchParams.get('next') || cookieStore.get('pending_next')?.value);

      if (rawPendingRole && !pendingRole) {
        clearPendingSignupCookies(cookieStore);
      }

      if (pendingRole) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const adminClient = createAdminClient();
          const { data: currentProfile } = await supabase
            .from('profiles')
            .select('role, student_name, is_suspended')
            .eq('id', user.id)
            .maybeSingle();

          if (currentProfile?.is_suspended || user.user_metadata?.is_suspended) {
            clearPendingSignupCookies(cookieStore);
            await supabase.auth.signOut();
            return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('This account has been deactivated. Please contact ScienceDojo support if you believe this is a mistake.')}`);
          }

          const profileRole = normalizeDashboardRole(currentProfile?.role);
          const metadataRole = normalizeDashboardRole(user.user_metadata?.role);
          const isGoogleUser = Boolean(user.identities?.some(identity => identity.provider === 'google'));
          const isPlaceholderProfile =
            isGoogleUser &&
            isFreshOAuthUser(user.created_at) &&
            profileRole === 'parent' &&
            !metadataRole &&
            !currentProfile?.student_name;
          const establishedRole = metadataRole || (isPlaceholderProfile ? null : profileRole);

          if (metadataRole === 'admin' || profileRole === 'admin') {
            clearPendingSignupCookies(cookieStore);
            await supabase.auth.signOut();
            return NextResponse.redirect(`${origin}/signup?error=${encodeURIComponent('That email is already registered. Please log in instead.')}`)
          }

          if (establishedRole && establishedRole !== pendingRole) {
            clearPendingSignupCookies(cookieStore);
            await supabase.auth.signOut();
            return NextResponse.redirect(`${origin}/signup?error=${encodeURIComponent('That email is already registered. Please log in instead.')}`)
          }

          const providerId = user.identities?.find(identity => identity.provider === 'google')?.id || '';
          const googleName = user.user_metadata.full_name || user.user_metadata.name || '';
          const googleAvatar = user.user_metadata.avatar_url || user.user_metadata.picture || '';
          const safeSubRole = normalizePublicSignupRole(pendingSubRole) || pendingRole;

          // 1. Update Auth Metadata
          await supabase.auth.updateUser({
            data: { 
              role: pendingRole, 
              sub_role: safeSubRole,
              full_name: googleName,
              avatar_url: googleAvatar,
              auth_provider: 'google',
              google_id: providerId,
              provider_id: providerId,
              onboarding_completed: pendingRole === 'parent' || pendingRole === 'student' ? false : true
            }
          });

          // 2. Upsert Profile (Ensure it exists with the correct role/names)
          await adminClient.from('profiles').upsert({
            id: user.id,
            email: user.email?.toLowerCase() || '',
            full_name: googleName,
            avatar_url: googleAvatar,
            role: pendingRole,
          }, { onConflict: 'id' });

          await upsertMembershipForRole(adminClient, user.id, pendingRole);

          // 3. Provision Tutor Row if applicable
          if (pendingRole === 'tutor') {
            await adminClient.from('tutors').upsert({
              id: user.id,
              is_verified: false,
              is_available_now: true,
              bio: '',
              hourly_rate: 0
            }, { onConflict: 'id' });

            await adminClient.from('applications').upsert({
              user_id: user.id,
              status: 'draft',
              full_name: googleName,
              data: { onboarding_status: 'screening', current_stage: 1 }
            }, { onConflict: 'user_id' });
          }
        }

        // Cleanup
        clearPendingSignupCookies(cookieStore);

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
        const safeNext = getSafeNextPath(next);
        const activeInternalMember = await getActiveInternalMemberByUserId(supabase, existingUser.id);

        if (activeInternalMember) {
          try {
            await repairLinkedInternalUserRole(existingUser.id);
          } catch (repairError) {
            console.error("[auth-callback] Internal role repair failed:", repairError);
          }

          return NextResponse.redirect(`${origin}${safeNext || '/dashboard/internal'}`);
        }

        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('role, student_name, is_suspended')
          .eq('id', existingUser.id)
          .maybeSingle();

        if (existingProfile?.is_suspended || existingUser.user_metadata?.is_suspended) {
          await supabase.auth.signOut();
          return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('This account has been deactivated. Please contact ScienceDojo support if you believe this is a mistake.')}`);
        }

        const existingRole = normalizeDashboardRole(existingProfile?.role) || normalizeDashboardRole(existingUser.user_metadata?.role) || 'user';
        if (existingRole === 'internal') {
          await supabase.auth.signOut();
          return NextResponse.redirect(`${origin}/login/internal?error=${encodeURIComponent('Your internal access is inactive or has not been linked yet.')}`);
        }

        if (!existingProfile && existingRole !== 'admin') {
          const adminClient = createAdminClient();
          await adminClient.from('profiles').upsert({
            id: existingUser.id,
            email: existingUser.email?.toLowerCase() || '',
            full_name: existingUser.user_metadata?.full_name || existingUser.user_metadata?.name || '',
            avatar_url: existingUser.user_metadata?.avatar_url || existingUser.user_metadata?.picture || '',
            role: existingRole,
            student_name: existingUser.user_metadata?.student_name || null,
          }, { onConflict: 'id' });
        }

        const onboardingCompleted = existingUser.user_metadata?.onboarding_completed;
        const hasStudentName = Boolean(existingProfile?.student_name || existingUser.user_metadata?.student_name);
        if (existingRole === 'parent' && (onboardingCompleted === false || !hasStudentName)) {
          return NextResponse.redirect(`${origin}/signup/child-details${safeNext ? `?next=${encodeURIComponent(safeNext)}` : ''}`);
        }

        if (existingRole === 'student' && onboardingCompleted === false) {
          return NextResponse.redirect(`${origin}/signup/child-details${safeNext ? `?next=${encodeURIComponent(safeNext)}` : ''}`);
        }

        return NextResponse.redirect(`${origin}${safeNext ? withAuthReturnFlag(safeNext) : `/dashboard/${existingRole}`}`);
      }

      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Google login completed but no user session was found. Please try again.')}`);
    }
    
    const cookieStore = await cookies();
    clearPendingSignupCookies(cookieStore);
    console.error("Auth callback error:", error.message)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('The confirmation link was invalid or has expired. Please try logging in or requesting a new password.')}`)
  }
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('The confirmation link was invalid or has expired. Please request a new link.')}`)
}

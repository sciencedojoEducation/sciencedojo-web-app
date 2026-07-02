'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies, headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { getSitePath } from '@/lib/site-url'
import { getActiveInternalMemberByUserId, repairLinkedInternalUserRole } from '@/lib/internal-auth'
import { upsertMembershipForRole } from '@/lib/account-memberships'

type PublicSignupRole = 'user' | 'parent' | 'student' | 'tutor';

type SupabaseAdminClient = Awaited<ReturnType<typeof import('@/utils/supabase/server').createAdminClient>>;

function normalizePublicSignupRole(role?: string | null): PublicSignupRole {
  return role === 'parent' || role === 'student' || role === 'tutor' || role === 'user'
    ? role
    : 'parent';
}

function getSafeNextPath(nextPath?: FormDataEntryValue | string | null) {
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

async function listAuthUsersByEmail(adminClient: SupabaseAdminClient, email: string) {
  const normalizedEmail = email.toLowerCase();
  const matches = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });

    if (error) {
      console.error("Auth duplicate lookup failed:", error.message);
      return { users: matches, error };
    }

    matches.push(
      ...data.users.filter(user => user.email?.toLowerCase() === normalizedEmail)
    );

    if (data.users.length < perPage) {
      return { users: matches, error: null };
    }

    page += 1;
  }
}

async function deleteAuthOnlyUsersByEmail(adminClient: SupabaseAdminClient, email: string) {
  const { users, error } = await listAuthUsersByEmail(adminClient, email);

  if (error) {
    return false;
  }

  for (const authUser of users) {
    const { data: profile } = await adminClient
      .from('profiles')
      .select('id')
      .eq('id', authUser.id)
      .maybeSingle();

    if (profile) {
      return false;
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(authUser.id);

    if (deleteError && !deleteError.message?.includes("User not found")) {
      console.error("Failed to remove orphaned auth user during signup:", deleteError.message);
      return false;
    }
  }

  return true;
}

export async function login(formData: FormData) {
  const supabase = await createClient()
  const nextPath = getSafeNextPath(formData.get('next'));

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { data: { user }, error } = await supabase.auth.signInWithPassword(data)
  
  if (error || !user) {
    console.error("Login Error:", error?.message);
    redirect(`/login?error=${encodeURIComponent(error?.message || "Authentication failed.")}${nextPath ? `&next=${encodeURIComponent(nextPath)}` : ''}`)
  }

  const activeInternalMember = await getActiveInternalMemberByUserId(supabase, user.id);
  if (activeInternalMember) {
    try {
      await repairLinkedInternalUserRole(user.id);
    } catch (repairError) {
      console.error("[login] Internal role repair failed:", repairError);
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard/internal')
  }

  // PRIORITIZE Database Profile Role over Metadata
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_suspended')
    .eq('id', user.id)
    .single();

  if (profile?.is_suspended || user.user_metadata?.is_suspended) {
    await supabase.auth.signOut();
    redirect(`/login?error=${encodeURIComponent("This account has been deactivated. Please contact ScienceDojo support if you believe this is a mistake.")}`)
  }

  const role = profile?.role || user?.user_metadata?.role || 'user';

  if (role === 'internal') {
    await supabase.auth.signOut();
    redirect(`/login/internal?error=${encodeURIComponent("Your internal access is inactive or has not been linked yet.")}`)
  }
  
  revalidatePath('/', 'layout')
  redirect(nextPath ? withAuthReturnFlag(nextPath) : `/dashboard/${role}`)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signInWithGoogle(role?: string, subRole?: string, nextPath?: string) {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const headersList = await headers();
  const safeNextPath = getSafeNextPath(nextPath);

  // If a role is provided (signup flow), store it in a temporary cookie
  // The auth/callback route will read this to update the user's profile
  if (role) {
    cookieStore.set('pending_role', role, { maxAge: 60 * 10, path: '/' });
    if (subRole) {
      cookieStore.set('pending_sub_role', subRole, { maxAge: 60 * 10, path: '/' });
    }
  }

  if (safeNextPath) {
    cookieStore.set('pending_next', safeNextPath, { maxAge: 60 * 10, path: '/' });
  }

  const queryParams = new URLSearchParams();

  if (role) {
    queryParams.set('role', role);
  }

  if (subRole) {
    queryParams.set('subRole', subRole);
  }

  if (safeNextPath) {
    queryParams.set('next', safeNextPath);
  }

  const queryString = queryParams.toString();
  const redirectTo = `${getSitePath('/auth/callback', { headers: headersList })}${queryString ? `?${queryString}` : ''}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
    },
  });

  if (error) {
    console.error("OAuth Error:", error.message);
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  if (data.url) {
    redirect(data.url); // Redirect to Google
  }
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const { createAdminClient } = await import('@/utils/supabase/server');
  const adminClient = await createAdminClient();

  const data = {
    email: ((formData.get('email') as string) || '').trim().toLowerCase(),
    password: formData.get('password') as string,
  }
  
  const role = normalizePublicSignupRole(formData.get('role') as string | null);
  const subRole = (formData.get('sub_role') as string) || '';
  const nextPath = getSafeNextPath(formData.get('next'));

  const signupParams = `role=${encodeURIComponent(role)}&sub_role=${encodeURIComponent(subRole)}${nextPath ? `&next=${encodeURIComponent(nextPath)}` : ''}`;

  if (!data.email || !data.email.includes('@')) {
    redirect(`/signup?error=${encodeURIComponent("Please enter a valid email address.")}&${signupParams}`)
  }

  if (!data.password || data.password.length < 8) {
    redirect(`/signup?error=${encodeURIComponent("Password must be at least 8 characters.")}&${signupParams}`)
  }

  const fullName = ((formData.get('name') as string) || '').trim();
  const studentName = ((formData.get('student_name') as string) || '').trim();

  if (!fullName) {
    redirect(`/signup?error=${encodeURIComponent(role === 'parent' ? "Parent name is required." : "Full name is required.")}&${signupParams}`)
  }

  if (role === 'parent' && !studentName) {
    redirect(`/signup?error=${encodeURIComponent("Student full name is required.")}&${signupParams}`)
  }

  const duplicateEmailRedirect = `/signup?error=${encodeURIComponent("That email is already registered. Please log in instead.")}&${signupParams}`;

  // Pre-check: block emails already present in either public profiles or Supabase Auth.
  const { data: existingProfile } = await adminClient
    .from('profiles')
    .select('id')
    .eq('email', data.email)
    .maybeSingle();

  if (existingProfile) {
    redirect(duplicateEmailRedirect)
  }

  const { users: matchingAuthUsers, error: authUsersError } = await listAuthUsersByEmail(adminClient, data.email);

  if (!authUsersError && matchingAuthUsers.length > 0) {
    const removedOrphans = await deleteAuthOnlyUsersByEmail(adminClient, data.email);

    if (!removedOrphans) {
      redirect(duplicateEmailRedirect)
    }
  }

  // --- START SILENT TESTING PATH (PREVENTS BOUNCES) ---
  if (data.email.endsWith('@test.sciencedojo.com')) {
    // 1. Silent Create (No Email Sent)
    const { data: adminData, error: adminError } = await adminClient.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        role: role,
        sub_role: (formData.get('sub_role') as string) || '',
        full_name: fullName,
        student_name: role === 'student' ? fullName : studentName,
        auth_provider: 'email',
        onboarding_completed: role === 'parent' ? Boolean(studentName) : true,
      }
    });

    if (adminError) {
      console.error("[SILENT] Admin creation error:", adminError.message);
      // If user already exists, just try to log in
      if (!adminError.message.includes('already exists')) {
        redirect(`/signup?error=${encodeURIComponent(adminError.message)}`)
      }
    }

    if (adminData?.user) {
      await upsertMembershipForRole(adminClient, adminData.user.id, role);
    }

    console.log(`[SILENT MODE] Created/Verified user: ${data.email}`);
    
    // 2. Establish Session (Silent Login)
    const { error: loginError } = await supabase.auth.signInWithPassword(data);
    if (loginError) {
       console.error("[SILENT] Sign-in error:", loginError.message);
       redirect(`/login?error=${encodeURIComponent(loginError.message)}`)
    }

    revalidatePath('/', 'layout')
    if (role === 'tutor') {
      redirect('/tutor/onboarding')
    } else {
      redirect(nextPath ? withAuthReturnFlag(nextPath) : `/dashboard/${role}`)
    }
    return; // Early return for silent path
  }
  // --- END SILENT TESTING PATH ---

  const { error, data: authData } = await supabase.auth.signUp({
      email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: `${getSitePath('/auth/callback')}?next=${encodeURIComponent(nextPath || '/login')}`,
      data: {
        role: role,
        sub_role: (formData.get('sub_role') as string) || '',
        full_name: fullName,
        student_name: role === 'student' ? fullName : studentName,
        auth_provider: 'email',
        onboarding_completed: role === 'parent' ? Boolean(studentName) : true,
      }
    }
  })

  if (error) {
    console.error("Signup error:", error.message);
    const normalizedError = error.message.toLowerCase();
    if (
      normalizedError.includes('already registered') ||
      normalizedError.includes('already exists') ||
      normalizedError.includes('user already')
    ) {
      redirect(duplicateEmailRedirect)
    }

    redirect(`/signup?error=${encodeURIComponent(error.message)}&${signupParams}`)
  }

  // --- ENSURE PROFILE EXISTS WITH CORRECT ROLE ---
  if (authData?.user) {
    await supabase.from('profiles').upsert({
      id: authData.user.id,
      email: data.email,
      full_name: fullName,
      role: role,
      student_name: role === 'student' ? fullName : studentName,
    }, { onConflict: 'id' });

    await upsertMembershipForRole(supabase, authData.user.id, role);

    if (role === 'tutor') {
      // Create a skeleton application row immediately to lock in the tutor path
      await supabase.from('applications').upsert({
        user_id: authData.user.id,
        status: 'draft',
        full_name: fullName,
        data: { onboarding_status: 'screening', current_stage: 1 }
      }, { onConflict: 'user_id' });

      await supabase.from('tutors').upsert({
        id: authData.user.id,
        is_verified: false,
        is_available_now: true,
        bio: '',
        hourly_rate: 0
      }, { onConflict: 'id' });
    }
  }

  if (authData?.user && authData?.session === null) {
    redirect(`/login?message=${encodeURIComponent('Account created! Please check your email to confirm your account before logging in.')}${nextPath ? `&next=${encodeURIComponent(nextPath)}` : ''}`)
  }

  revalidatePath('/', 'layout')
  if (role === 'tutor') {
    redirect('/tutor/onboarding')
  } else {
    redirect(nextPath ? withAuthReturnFlag(nextPath) : `/dashboard/${role}`)
  }
}

type ParentOnboardingState = {
  error?: string;
  success?: boolean;
  redirectTo?: string;
};

export async function completeGoogleParentOnboarding(
  _prevState: ParentOnboardingState,
  formData: FormData
): Promise<ParentOnboardingState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please log in again to complete setup." };
  }

  const parentName = ((formData.get('parent_name') as string) || '').trim();
  const studentName = ((formData.get('student_name') as string) || '').trim();
  const nextPath = getSafeNextPath(formData.get('next'));
  const email = user.email?.toLowerCase() || '';
  const providerId = user.identities?.find(identity => identity.provider === 'google')?.id || '';
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  const role = profile?.role || user.user_metadata?.role || 'parent';

  if (!parentName) {
    return { error: role === 'student' ? "Student name is required." : "Parent name is required." };
  }

  if (!email) {
    return { error: "Google did not return an email address. Please try again." };
  }

  if (role === 'parent' && !studentName) {
    return { error: "Student full name is required." };
  }

  const metadata = {
    ...user.user_metadata,
    role,
    sub_role: role,
    full_name: parentName,
    student_name: role === 'parent' ? studentName : parentName,
    auth_provider: 'google',
    google_id: providerId,
    provider_id: providerId,
    onboarding_completed: true,
  };

  const { error: metadataError } = await supabase.auth.updateUser({
    data: metadata,
  });

  if (metadataError) {
    console.error("Google parent onboarding metadata error:", metadataError.message);
    return { error: "We could not save your details. Please try again." };
  }

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: user.id,
    email,
    full_name: parentName,
    avatar_url: user.user_metadata.avatar_url || '',
    role,
    student_name: role === 'parent' ? studentName : parentName,
  }, { onConflict: 'id' });

  if (profileError) {
    console.error("Google parent onboarding profile error:", profileError.message);
    return { error: "We could not save your child details. Please try again." };
  }

  await upsertMembershipForRole(supabase, user.id, role);

  revalidatePath('/', 'layout');
  return { success: true, redirectTo: nextPath ? withAuthReturnFlag(nextPath) : `/dashboard/${role}` };
}

export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get('email') || '').trim();
  const isInternal = String(formData.get('internal') || '') === '1';
  const internalParam = isInternal ? '&internal=1' : '';

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getSitePath('/auth/callback')}?next=/reset-password`,
  });

  if (error) {
    console.error("Password reset request error:", error.message);
    redirect(`/forgot-password?error=${encodeURIComponent('We could not send that reset link. Please check the email address and try again.')}${internalParam}`);
  }

  redirect(`/forgot-password?message=${encodeURIComponent('Check your email for a secure reset link!')}${internalParam}`);
}

export async function updatePassword(password: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.auth.updateUser({
    password: password 
  });

  if (error) {
    console.error("Password update error:", error.message);
    return { error: error.message };
  }

  if (!user) {
    return { success: true, redirectTo: '/login' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const activeInternalMember = await getActiveInternalMemberByUserId(supabase, user.id);
  if (activeInternalMember) {
    try {
      await repairLinkedInternalUserRole(user.id);
    } catch (repairError) {
      console.error("[updatePassword] Internal role repair failed:", repairError);
    }

    return { success: true, redirectTo: '/dashboard/internal' };
  }

  const role = profile?.role || user.user_metadata?.role;

  return { success: true, redirectTo: role === 'internal' ? '/dashboard/internal' : '/login' };
}

export async function updateAccount(formData: FormData) {
  const supabase = await createClient();
  const full_name = formData.get('name') as string;
  const student_name = formData.get('student_name') as string | null;
  const avatarFile = formData.get('avatar') as File | null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const updateData: {
    full_name: string;
    student_name?: string;
    avatar_url?: string;
  } = { full_name };
  if (student_name) updateData.student_name = student_name;

  // Handle Avatar Upload if file is provided
  if (avatarFile && avatarFile.size > 0) {
    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, avatarFile);

    if (uploadError) {
      console.error("Upload error:", uploadError.message);
      // We continue with name update even if avatar fails
    } else {
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      updateData.avatar_url = publicUrl;
      
      // Sync to profiles table as well
      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);
    }
  }

  const { error } = await supabase.auth.updateUser({
    data: updateData
  });

  if (error) {
    console.error("Update account error:", error.message);
    const role = user?.user_metadata?.role || 'user';
    redirect(`/dashboard/${role}/settings?error=${encodeURIComponent(error.message)}`);
  }

  const role = user?.user_metadata?.role || 'user';
  revalidatePath('/', 'layout');
  redirect(`/dashboard/${role}/settings?message=Profile updated successfully!`);
}

export async function uploadAvatarOnly(formData: FormData) {
  const supabase = await createClient();
  const file = formData.get('avatar') as File;
  if (!file) return { error: "No file provided" };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const fileName = `${user.id}-${Date.now()}.jpg`;
  const filePath = `avatars/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file);

  if (uploadError) {
    console.error("Storage upload error:", uploadError.message);
    return { error: uploadError.message };
  }

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);
  
  // Update auth user metadata
  const { error: updateError } = await supabase.auth.updateUser({
    data: { avatar_url: publicUrl }
  });

  if (updateError) {
    console.error("Profile update error:", updateError.message);
    return { error: updateError.message };
  }

  // Also sync to the profiles table so DB queries (e.g. tutor's student list) see the new photo
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', user.id);

  if (profileError) {
    console.error("Profiles table sync error:", profileError.message);
    // Non-fatal — auth metadata was updated, just log it
  }

  revalidatePath('/', 'layout');
  return { success: true, url: publicUrl };
}

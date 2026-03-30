'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { data: { user }, error } = await supabase.auth.signInWithPassword(data)
  
  if (error) {
    console.error("Login Error:", error.message);
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  const role = user?.user_metadata?.role || 'parent'
  
  revalidatePath('/', 'layout')
  redirect(`/dashboard/${role}`)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }
  
  let role = (formData.get('role') as string) || 'parent';
  const subRole = (formData.get('sub_role') as string) || '';

  // Security: Prevent unauthorized admin signup
  if (role === 'admin') {
    role = 'parent';
  }

  // Pre-check: Check if email already exists in profiles (case-insensitive)
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', data.email.toLowerCase())
    .single();

  if (existingProfile) {
    redirect(`/signup?error=${encodeURIComponent("Email already in use. Please log in instead.")}&role=${role}&sub_role=${subRole}`)
  }

  const { error, data: authData } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/login`,
      data: {
        role: role,
        sub_role: (formData.get('sub_role') as string) || '',
        full_name: formData.get('name') as string || '',
        student_name: formData.get('student_name') as string || '',
      }
    }
  })

  if (error) {
    console.error("Signup error:", error.message);
    const subRole = (formData.get('sub_role') as string) || '';
    redirect(`/signup?error=${encodeURIComponent(error.message)}&role=${role}&sub_role=${subRole}`)
  }

  if (authData?.user && authData?.session === null) {
    redirect('/login?message=Account created! Please check your email to confirm your account before logging in.')
  }

  revalidatePath('/', 'layout')
  redirect(`/dashboard/${role}`)
}

export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get('email') as string;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/reset-password`,
  });

  if (error) {
    console.error("Password reset request error:", error.message);
    redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect('/forgot-password?message=Check your email for a secure reset link!');
}

export async function updatePassword(password: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password: password 
  });

  if (error) {
    console.error("Password update error:", error.message);
    return { error: error.message };
  }

  return { success: true };
}

export async function updateAccount(formData: FormData) {
  const supabase = await createClient();
  const full_name = formData.get('name') as string;
  const student_name = formData.get('student_name') as string | null;
  const avatarFile = formData.get('avatar') as File | null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const updateData: any = { full_name };
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
    const role = user?.user_metadata?.role || 'parent';
    redirect(`/dashboard/${role}/settings?error=${encodeURIComponent(error.message)}`);
  }

  const role = user?.user_metadata?.role || 'parent';
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


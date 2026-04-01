import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugAdmin() {
  const email = 'piumal@live.com';
  
  // 1. Check profile role
  const { data: profile, error: pError } = await supabase
    .from('profiles')
    .select('id, role, email')
    .eq('email', email)
    .maybeSingle();

  if (pError) {
    console.error('Error fetching profile:', pError.message);
  } else if (!profile) {
    console.error(`No profile found for email: ${email}`);
  } else {
    console.log('Profile found:', JSON.stringify(profile, null, 2));
  }

  // 2. Check announcements
  const { data: announcements, error: aError } = await supabase
    .from('announcements')
    .select('id, title, sender_id');

  if (aError) {
    console.error('Error fetching announcements (as anon):', aError.message);
  } else {
    console.log(`Found ${announcements.length} announcements.`);
  }
}

debugAdmin();

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debug() {
  // 1. Get user profile (assuming we know the user is 'piumalmahawasala' from context? No, I don't have the user ID).
  // But I can list all announcements.
  console.log('Listing announcements:');
  const { data: ann, error: err1 } = await supabase.from('announcements').select('*');
  if (err1) console.error('Error fetching ann:', err1.message);
  else console.log('Announcements:', ann);

  console.log('Checking profiles for admin role:');
  const { data: prof, error: err2 } = await supabase.from('profiles').select('id, full_name, role').eq('role', 'admin');
  if (err2) console.error('Error fetching profiles:', err2.message);
  else console.log('Admins found:', prof);
}

debug();

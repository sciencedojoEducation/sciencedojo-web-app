import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const testUser = {
  email: 'grandmaster-test@test.sciencedojo.com',
  password: 'Password123!',
  email_confirm: true,
  user_metadata: {
    role: 'tutor',
    full_name: 'Grandmaster Test'
  }
};

async function seed() {
  console.log(`🌱 Seeding test user: ${testUser.email}...`);
  
  const { data, error } = await supabase.auth.admin.createUser(testUser);
  
  if (error) {
    if (error.message.includes('already exists')) {
      console.log("ℹ️ Test user already exists. Ready for audit.");
    } else {
      console.error("❌ Seeding failed:", error.message);
    }
  } else {
    console.log("✅ Test user created and confirmed silently.");
  }
}

seed();

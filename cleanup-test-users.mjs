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

async function cleanup() {
  console.log("🔍 Searching for test users...");
  
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error("Error listing users:", error.message);
    return;
  }

  const testUsers = users.filter(u => u.email?.endsWith('@test.sciencedojo.com'));
  
  console.log(`Found ${testUsers.length} test users.`);

  for (const user of testUsers) {
    console.log(`🗑️ Deleting user: ${user.email} (${user.id})`);
    
    // 1. Delete from profiles (if exists due to triggers)
    await supabase.from('profiles').delete().eq('id', user.id);
    
    // 2. Delete from applications (if exists)
    await supabase.from('applications').delete().eq('user_id', user.id);
    
    // 3. Delete from Auth
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
    
    if (deleteError) {
      console.error(`Failed to delete ${user.email}:`, deleteError.message);
    } else {
      console.log(`✅ ${user.email} deleted successfully.`);
    }
  }

  console.log("✨ Cleanup complete.");
}

cleanup();

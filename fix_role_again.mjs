import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  "https://jckwqwqpbwtgnylagyum.supabase.co",
  "sb_secret_NmmTrm-2dSDxoPUyIPwW4A_zsw8g724"
);

async function fix() {
  const email = 'mpiumal@yahoo.com';
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === email);
  if (!user) return;

  // Clear sub_role if it's set to parent
  const newMetadata = { ...user.user_metadata };
  if (newMetadata.sub_role === 'parent') {
    delete newMetadata.sub_role;
  }
  newMetadata.role = 'tutor';

  await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: newMetadata
  });

  await supabase.from('profiles').update({ role: 'tutor' }).eq('id', user.id);
  console.log('Fixed mpiumal@yahoo.com role and cleared parent subRole.');
}

fix();

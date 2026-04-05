import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  "https://jckwqwqpbwtgnylagyum.supabase.co",
  "sb_secret_NmmTrm-2dSDxoPUyIPwW4A_zsw8g724"
);

async function diagnose() {
  // 1. Check all tutor profiles
  const { data: tutorProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .eq('role', 'tutor');
  
  console.log(`\n👤 Tutor profiles (${tutorProfiles?.length || 0}):`);
  tutorProfiles?.forEach(p => {
    console.log(`   - ${p.full_name} | ${p.email} | id=${p.id}`);
  });

  // 2. Check ALL applications
  const { data: allApps, error: allError } = await supabase
    .from('applications')
    .select('*');
  
  if (allError) {
    console.log(`\n❌ Applications error: ${allError.message}`);
  } else {
    console.log(`\n📋 All applications (${allApps?.length || 0}):`);
    allApps?.forEach(a => {
      console.log(`   - user_id=${a.user_id} | name=${a.full_name} | status=${a.status}`);
      console.log(`     has data column: ${a.data !== undefined && a.data !== null}`);
      if (a.data) {
        console.log(`     current_stage: ${a.data.current_stage}`);
        console.log(`     onboarding_status: ${a.data.onboarding_status}`);
      }
    });
  }

  // 3. Cross-reference: which tutors have no application?
  const appUserIds = new Set(allApps?.map(a => a.user_id) || []);
  const tutorsWithoutApp = tutorProfiles?.filter(p => !appUserIds.has(p.id)) || [];
  console.log(`\n⚠️  Tutors WITHOUT application record (${tutorsWithoutApp.length}):`);
  tutorsWithoutApp.forEach(t => {
    console.log(`   - ${t.full_name} | ${t.email} | id=${t.id}`);
  });
}

diagnose();

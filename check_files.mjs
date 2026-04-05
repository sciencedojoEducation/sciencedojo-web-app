import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  "https://jckwqwqpbwtgnylagyum.supabase.co",
  "sb_secret_NmmTrm-2dSDxoPUyIPwW4A_zsw8g724"
);

async function diagnoseApps() {
  const { data: apps, error } = await supabase.from('applications').select('*');
  if (error) {
    console.error(error);
    return;
  }
  
  apps.forEach(app => {
    console.log(`\n\n--- App for User: ${app.full_name} (${app.user_id}) ---`);
    if (app.data) {
      // Look for certificate and proof keys
      const certs = Object.keys(app.data).filter(k => k.includes('cert') || k.includes('url') || k.includes('proof') || k.includes('transcript'));
      console.log('Document related keys found at root:', certs);
      
      // Let's print the structure of education and work history
      console.log('Has education array?', Array.isArray(app.data.education), app.data.education);
      console.log('Has work_history array?', Array.isArray(app.data.work_history), app.data.work_history);
      
      // Full dump of just the keys
      console.log('All keys:', Object.keys(app.data));
    } else {
      console.log('No data JSONB payload found.');
    }
  });
}

diagnoseApps();

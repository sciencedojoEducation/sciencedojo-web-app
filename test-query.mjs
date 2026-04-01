import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testQuery() {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id,
      price_at_booking,
      tutor_id,
      profiles!bookings_tutor_id_fkey(full_name, email)
    `)
    .eq('status', 'completed');

  if (error) {
    console.error('Error fetching bookings:', error);
  } else {
    console.log(`Found ${data.length} completed bookings.`);
    console.log(JSON.stringify(data.slice(0, 2), null, 2));
  }
}

testQuery();

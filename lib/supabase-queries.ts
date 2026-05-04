import { createClient } from "@/utils/supabase/server";

export type Subject = "Science" | "Math" | "Physics" | "Chemistry" | "Biology" | "Programming";

export interface TutorProfile {
  id: string;
  full_name: string;
  avatar_url: string;
  bio: string;
  subjects: Subject[];
  hourly_rate: number;
  rating: number;
  review_count: number;
  is_verified: boolean;
  is_available_now: boolean;
  chat_availability?: any;
  youtube_intro_url?: string | null;

  // New credential fields
  education_level?: string;
  university?: string;
  experience_summary?: string;
  has_teaching_license?: boolean;
  cv_url?: string;
}

export async function getTutors(searchTerm: string = "", subject: string = "All", limit?: number): Promise<TutorProfile[]> {
  const supabase = await createClient();
  
  // Fetch basic tutor info (those guaranteed to be in the cache)
  let query = supabase
    .from('tutors')
    .select(`
      id,
      bio,
      subjects,
      hourly_rate,
      rating,
      review_count,
      is_verified,
      is_available_now,
      profiles (
        full_name,
        avatar_url
      )
    `)
    .eq('is_verified', true);

  if (subject !== "All") {
    query = query.contains('subjects', [subject]);
  }

  if (limit && !searchTerm && subject === "All") {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching tutors:", error.message);
    return [];
  }

  // 1. Resiliently fetch new columns if available, to bypass cache delay
  const tutorIds = data.map((t: any) => t.id);
  const { data: newFieldsData } = tutorIds.length > 0
    ? await supabase
      .from('tutors')
      .select('id, youtube_intro_url, education_level, university, experience_summary, has_teaching_license, cv_url')
      .in('id', tutorIds)
    : { data: [] };

  const newFieldsMap: Record<string, any> = {};
  if (newFieldsData) {
    newFieldsData.forEach(row => {
      newFieldsMap[row.id] = row;
    });
  }

  // Flatten the join results
  return (data as any[]).map(tutor => ({
    id: tutor.id,
    full_name: tutor.profiles?.full_name || 'Verified Tutor',
    avatar_url: tutor.profiles?.avatar_url || '',
    bio: tutor.bio,
    subjects: tutor.subjects,
    hourly_rate: tutor.hourly_rate,
    rating: tutor.rating,
    review_count: tutor.review_count,
    is_verified: tutor.is_verified,
    is_available_now: tutor.is_available_now,
    youtube_intro_url: newFieldsMap[tutor.id]?.youtube_intro_url || null,
    education_level: newFieldsMap[tutor.id]?.education_level,
    university: newFieldsMap[tutor.id]?.university,
    experience_summary: newFieldsMap[tutor.id]?.experience_summary,
    has_teaching_license: newFieldsMap[tutor.id]?.has_teaching_license,
    cv_url: newFieldsMap[tutor.id]?.cv_url,
  })).filter(t => 
    (t.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (t.bio?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );
}

export async function getTutorById(id: string): Promise<TutorProfile | null> {
  const supabase = await createClient();
  
  // Fetch basic info first to avoid cache errors
  const { data, error } = await supabase
    .from('tutors')
    .select(`
      id,
      bio,
      subjects,
      hourly_rate,
      rating,
      review_count,
      is_verified,
      is_available_now,
      youtube_intro_url,
      education_level,
      university,
      experience_summary,
      has_teaching_license,
      cv_url,
      profiles (
        full_name,
        avatar_url
      )
    `)
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    if (error && error.code !== 'PGRST116') {
      console.error("Error fetching tutor by ID:", error?.message || error);
    }
    return null;
  }

  // 2. Resiliently fetch extended metadata
  const { data: extended } = await supabase
    .from('tutors')
    .select('chat_availability, youtube_intro_url')
    .eq('id', id)
    .maybeSingle();

  const tutor = data as any;
  const extendedData = extended as any;
  return {
    id: tutor.id,
    full_name: tutor.profiles?.full_name || 'Verified Tutor',
    avatar_url: tutor.profiles?.avatar_url || '',
    bio: tutor.bio,
    subjects: tutor.subjects,
    hourly_rate: tutor.hourly_rate,
    rating: tutor.rating,
    review_count: tutor.review_count,
    is_verified: tutor.is_verified,
    is_available_now: tutor.is_available_now,
    chat_availability: extendedData?.chat_availability,
    youtube_intro_url: extendedData?.youtube_intro_url,
  };
}

export interface Booking {
  id: string;
  student_id: string;
  tutor_id: string;
  subject: string;
  description: string;
  requested_date: string;
  status: 'requested' | 'accepted' | 'declined' | 'confirmed' | 'completed' | 'cancelled';
  meeting_url?: string;
  price_at_booking: number;
  tutor_name?: string;
  tutor_avatar?: string;
  student_name?: string;
  student_avatar?: string;
  lesson_notes?: {
    summary: string;
    homework: string;
  };
  has_review?: boolean;
  recurrence_group_id?: string | null;
  is_recurring?: boolean;
  recurrence_count?: number;
  recurrence_index?: number;
  duration_hours?: number;
}

export async function getBookingsByUserId(userId: string): Promise<Booking[]> {
  const supabase = await createClient();

  // Fetch bookings without the join to avoid schema cache "relationship" errors
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .or(`student_id.eq.${userId},tutor_id.eq.${userId}`)
    .order('requested_date', { ascending: false });

  if (error) {
    console.error('Error fetching bookings:', error.message);
    return [];
  }

  if (!data || data.length === 0) return [];

  // 1. Fetch Lesson Notes separately
  const bookingIds = data.map((b: any) => b.id);
  const { data: notesData } = await supabase
    .from('lesson_notes')
    .select('*')
    .in('booking_id', bookingIds);

  const notesMap: Record<string, { summary: string; homework: string }> = {};
  for (const n of (notesData || []) as any[]) {
    notesMap[n.booking_id] = {
      summary: n.summary,
      homework: n.homework
    };
  }

  // 1.5 Fetch Reviews to flag already-reviewed bookings
  const { data: reviewsData } = await supabase
    .from('reviews')
    .select('booking_id')
    .in('booking_id', bookingIds);
    
  const reviewedBookingIds = new Set((reviewsData || []).map((r: any) => r.booking_id));

  // 2. Resolve Tutor & Student Info
  const tutorIds = [...new Set(data.map((b: any) => b.tutor_id))];
  const { data: tutorRows } = await supabase
    .from('tutors')
    .select('id, profiles(full_name, avatar_url)')
    .in('id', tutorIds);

  const tutorMap: Record<string, { full_name: string; avatar_url: string }> = {};
  for (const t of (tutorRows || []) as any[]) {
    tutorMap[t.id] = {
      full_name: t.profiles?.full_name || 'Verified Tutor',
      avatar_url: t.profiles?.avatar_url || '',
    };
  }

  // Collect unique student IDs
  const studentIds = [...new Set(data.map((b: any) => b.student_id))];
  const { data: studentRows } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', studentIds);

  const studentMap: Record<string, { full_name: string; avatar_url: string }> = {};
  for (const s of (studentRows || []) as any[]) {
    studentMap[s.id] = {
      full_name: s.full_name || 'ScienceDojo Student',
      avatar_url: s.avatar_url || '',
    };
  }

  return data.map((booking: any) => ({
    ...booking,
    tutor_name: tutorMap[booking.tutor_id]?.full_name || 'Verified Tutor',
    tutor_avatar: tutorMap[booking.tutor_id]?.avatar_url,
    student_name: studentMap[booking.student_id]?.full_name || 'ScienceDojo Student',
    student_avatar: studentMap[booking.student_id]?.avatar_url,
    lesson_notes: notesMap[booking.id] || null,
    has_review: reviewedBookingIds.has(booking.id),
  }));
}

export async function getBookingById(bookingId: string) {
  const supabase = await createClient();

  // Fetch booking without the ambiguous FK join on profiles
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (error) {
    console.error('Error fetching booking:', error.message);
    return null;
  }

  // Resolve tutor display info via tutors→profiles join
  const { data: tutorRow } = await supabase
    .from('tutors')
    .select('id, profiles(full_name, avatar_url)')
    .eq('id', (data as any).tutor_id)
    .maybeSingle();

  return {
    ...data,
    tutor_name: (tutorRow as any)?.profiles?.full_name || 'Verified Tutor',
    tutor_avatar: (tutorRow as any)?.profiles?.avatar_url,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Availability
// ─────────────────────────────────────────────────────────────────────────────

export interface AvailabilitySlot {
  id: string;
  tutor_id: string;
  date: string;        // 'YYYY-MM-DD'
  start_time: string;  // 'HH:MM:SS'
  end_time: string;    // 'HH:MM:SS'
  created_at: string;
}

/** All slots for a tutor — used on the tutor's own dashboard calendar. */
export async function getAvailabilityByTutorId(tutorId: string): Promise<AvailabilitySlot[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tutor_availability')
    .select('*')
    .eq('tutor_id', tutorId)
    .gte('date', new Date().toISOString().split('T')[0]) // future only
    .order('date')
    .order('start_time');

  if (error) {
    console.error('Error fetching availability:', error.message);
    return [];
  }
  return data as AvailabilitySlot[];
}

/** Slots for a tutor within a specific month — used on the student booking calendar. */
export async function getAvailabilityByTutorIdForMonth(
  tutorId: string,
  year: number,
  month: number,   // 1-12
): Promise<AvailabilitySlot[]> {
  const supabase = await createClient();
  const from = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const { data, error } = await supabase
    .from('tutor_availability')
    .select('*')
    .eq('tutor_id', tutorId)
    .gte('date', from)
    .lte('date', to)
    .order('date')
    .order('start_time');

  if (error) {
    console.error('Error fetching availability for month:', error.message);
    return [];
  }
  return data as AvailabilitySlot[];
}

/** Slots for a tutor on a specific date — used by the student slot picker. */
export async function getAvailabilityByTutorIdForDate(
  tutorId: string,
  date: string,  // 'YYYY-MM-DD'
): Promise<AvailabilitySlot[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tutor_availability')
    .select('*')
    .eq('tutor_id', tutorId)
    .eq('date', date)
    .order('start_time');

  if (error) {
    console.error('Error fetching availability for date:', error.message);
    return [];
  }
  return data as AvailabilitySlot[];
}


/** Fetch a lesson note by booking ID. */
export async function getLessonNoteByBookingId(bookingId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('lesson_notes')
    .select('*')
    .eq('booking_id', bookingId)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('Error fetching lesson note:', error.message);
    }
    return null;
  }
  return data;
}

/** Calculate total historical earnings for a tutor. */
export async function getTutorEarnings(tutorId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('bookings')
    .select('price_at_booking')
    .eq('tutor_id', tutorId)
    .eq('status', 'completed');

  if (error) {
    console.error('Error calculating earnings:', error.message);
    return 0;
  }

  return data.reduce((sum: number, b: any) => sum + Number(b.price_at_booking), 0);
}

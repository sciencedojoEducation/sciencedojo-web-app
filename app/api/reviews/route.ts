import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    
    // Ensure user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { bookingId, tutorId, rating, comment } = body;

    // Validate input
    if (!bookingId || !tutorId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
    }

    // Verify the booking belongs to this user and is completed
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, status, student_id')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.student_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized for this booking' }, { status: 403 });
    }

    if (booking.status !== 'completed') {
      return NextResponse.json({ error: 'Cannot review an incomplete session' }, { status: 400 });
    }

    // Check if review already exists
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('booking_id', bookingId)
      .single();

    if (existingReview) {
      return NextResponse.json({ error: 'A review already exists for this session' }, { status: 400 });
    }

    // Insert the review
    const { error: insertError } = await supabase
      .from('reviews')
      .insert({
        booking_id: bookingId,
        student_id: user.id,
        tutor_id: tutorId,
        rating: rating,
        comment: comment || null
      });

    if (insertError) {
      console.error('Error inserting review:', insertError);
      return NextResponse.json({ error: insertError.message || 'Failed to submit review' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Review submitted successfully' });
    
  } catch (error: any) {
    console.error('Review submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

function formatICSDate(dateStr: string) {
  // Simple format for ICS: YYYYMMDDTHHMMSSZ
  const d = new Date(dateStr);
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('id');

  if (!userId) {
    return new NextResponse('Missing user ID. Usage: ?id=USER_ID', { status: 400 });
  }

  // To truly protect this, we should use a signed token instead of a raw user ID,
  // but for MVP purposes, we look up their public/non-confidential schedule info
  const supabase = await createClient();
  
  // Fetch active sessions
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, subject, requested_date, status')
    .or(`student_id.eq.${userId},tutor_id.eq.${userId}`)
    .in('status', ['confirmed', 'accepted', 'completed']);

  if (!bookings) {
    return new NextResponse('No bookings found', { status: 404 });
  }

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ScienceDojo//NONSGML v1.0//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:ScienceDojo Schedule'
  ];

  bookings.forEach((b: any) => {
    // Assuming 1-hour sessions 
    const start = formatICSDate(b.requested_date);
    
    // Add 1 hour to start for end
    const startDateObj = new Date(b.requested_date);
    startDateObj.setHours(startDateObj.getHours() + 1);
    const end = startDateObj.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    icsContent.push('BEGIN:VEVENT');
    icsContent.push(`UID:${b.id}@sciencedojo.com`);
    icsContent.push(`DTSTAMP:${formatICSDate(new Date().toISOString())}`);
    icsContent.push(`DTSTART:${start}`);
    icsContent.push(`DTEND:${end}`);
    icsContent.push(`SUMMARY:ScienceDojo: ${b.subject} Session`);
    icsContent.push(`STATUS:${b.status === 'confirmed' ? 'CONFIRMED' : 'TENTATIVE'}`);
    icsContent.push('END:VEVENT');
  });

  icsContent.push('END:VCALENDAR');

  return new NextResponse(icsContent.join('\r\n'), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="sciencedojo.ics"',
    },
  });
}

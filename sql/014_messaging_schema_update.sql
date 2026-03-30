-- Update Conversations table to support session-specific threads
ALTER TABLE public.conversations 
  ADD COLUMN IF NOT EXISTS booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL;

-- Drop old single-thread constraint
DROP INDEX IF EXISTS public.conversations_unique_participants_idx;

-- New constraint: One "General" thread plus N "Session" threads between same users
CREATE UNIQUE INDEX IF NOT EXISTS conversations_unique_context_idx ON public.conversations 
  (LEAST(participant_1_id, participant_2_id), GREATEST(participant_1_id, participant_2_id), COALESCE(booking_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Update Messages table for flagging and files
ALTER TABLE public.messages 
  ADD COLUMN IF NOT EXISTS is_flagged boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS flagged_reason text,
  ADD COLUMN IF NOT EXISTS is_file boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS file_url text,
  ADD COLUMN IF NOT EXISTS file_name text;

-- Update Tutors table for office hours
ALTER TABLE public.tutors
  ADD COLUMN IF NOT EXISTS chat_availability jsonb DEFAULT '{"mon":[9,17],"tue":[9,17],"wed":[9,17],"thu":[9,17],"fri":[9,17],"sat":[10,14],"sun":null}'::jsonb;

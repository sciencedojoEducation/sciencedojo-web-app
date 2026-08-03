-- ScienceDojo moderated GCSE and A-Level community.
-- Public users can only read published content. All writes are account-bound and
-- moderation status cannot be changed through the public API.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE public.community_content_status AS ENUM ('pending', 'published', 'rejected', 'hidden', 'locked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.community_badge AS ENUM ('member', 'tutor', 'teacher', 'moderator', 'staff');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.community_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pseudonym TEXT NOT NULL UNIQUE CHECK (char_length(pseudonym) BETWEEN 3 AND 30),
  badge public.community_badge NOT NULL DEFAULT 'member',
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_trusted BOOLEAN NOT NULL DEFAULT false,
  is_restricted BOOLEAN NOT NULL DEFAULT false,
  reputation INTEGER NOT NULL DEFAULT 0 CHECK (reputation >= 0),
  contribution_count INTEGER NOT NULL DEFAULT 0 CHECK (contribution_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN ('GCSE', 'A-Level', 'General', 'Official')),
  icon TEXT NOT NULL DEFAULT 'MessagesSquare',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.community_categories(id) ON DELETE RESTRICT,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 10 AND 140),
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 20 AND 8000),
  status public.community_content_status NOT NULL DEFAULT 'pending',
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_sensitive BOOLEAN NOT NULL DEFAULT false,
  seeded_author_name TEXT,
  view_count INTEGER NOT NULL DEFAULT 0,
  reply_count INTEGER NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES public.community_topics(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 2 AND 5000),
  status public.community_content_status NOT NULL DEFAULT 'pending',
  is_accepted BOOLEAN NOT NULL DEFAULT false,
  seeded_author_name TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_reactions (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES public.community_topics(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES public.community_replies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((topic_id IS NOT NULL)::int + (reply_id IS NOT NULL)::int = 1),
  UNIQUE NULLS NOT DISTINCT (user_id, topic_id, reply_id)
);

CREATE TABLE IF NOT EXISTS public.community_bookmarks (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES public.community_topics(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, topic_id)
);

CREATE TABLE IF NOT EXISTS public.community_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES public.community_topics(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES public.community_replies(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('safeguarding', 'personal_information', 'harassment', 'cheating', 'exam_leak', 'misinformation', 'spam', 'other')),
  details TEXT CHECK (details IS NULL OR char_length(details) <= 1000),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent')),
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((topic_id IS NOT NULL)::int + (reply_id IS NOT NULL)::int = 1)
);

CREATE TABLE IF NOT EXISTS public.community_moderation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  topic_id UUID REFERENCES public.community_topics(id) ON DELETE SET NULL,
  reply_id UUID REFERENCES public.community_replies(id) ON DELETE SET NULL,
  report_id UUID REFERENCES public.community_reports(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT,
  note TEXT CHECK (note IS NULL OR char_length(note) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_exam_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 10 AND 160),
  summary TEXT NOT NULL CHECK (char_length(summary) BETWEEN 20 AND 3000),
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL CHECK (source_url ~ '^https://'),
  source_published_at DATE NOT NULL,
  editorial_note TEXT CHECK (editorial_note IS NULL OR char_length(editorial_note) <= 2000),
  status public.community_content_status NOT NULL DEFAULT 'pending',
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE public.community_topics ADD CONSTRAINT community_topics_author_profile_fkey FOREIGN KEY (author_id) REFERENCES public.community_profiles(user_id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.community_replies ADD CONSTRAINT community_replies_author_profile_fkey FOREIGN KEY (author_id) REFERENCES public.community_profiles(user_id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS community_topics_category_status_idx ON public.community_topics(category_id, status, last_activity_at DESC);
CREATE INDEX IF NOT EXISTS community_topics_status_published_idx ON public.community_topics(status, published_at DESC);
CREATE INDEX IF NOT EXISTS community_replies_topic_status_idx ON public.community_replies(topic_id, status, created_at);
CREATE INDEX IF NOT EXISTS community_reports_status_priority_idx ON public.community_reports(status, priority, created_at);

CREATE OR REPLACE FUNCTION public.is_community_moderator(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = check_user_id AND p.role IN ('admin', 'internal')
  ) OR EXISTS (
    SELECT 1 FROM public.community_profiles cp
    WHERE cp.user_id = check_user_id AND cp.is_verified AND cp.badge IN ('moderator', 'staff')
  );
$$;

CREATE OR REPLACE FUNCTION public.community_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.community_lock_moderation_fields()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_community_moderator(auth.uid()) THEN
    NEW.status := OLD.status;
    IF TG_TABLE_NAME = 'community_topics' THEN
      NEW.is_pinned := OLD.is_pinned;
      NEW.is_sensitive := OLD.is_sensitive;
      NEW.published_at := OLD.published_at;
    ELSIF TG_TABLE_NAME = 'community_replies' THEN
      NEW.is_accepted := OLD.is_accepted;
      NEW.published_at := OLD.published_at;
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS community_topics_touch ON public.community_topics;
CREATE TRIGGER community_topics_touch BEFORE UPDATE ON public.community_topics FOR EACH ROW EXECUTE FUNCTION public.community_touch_updated_at();
DROP TRIGGER IF EXISTS community_replies_touch ON public.community_replies;
CREATE TRIGGER community_replies_touch BEFORE UPDATE ON public.community_replies FOR EACH ROW EXECUTE FUNCTION public.community_touch_updated_at();
DROP TRIGGER IF EXISTS community_profiles_touch ON public.community_profiles;
CREATE TRIGGER community_profiles_touch BEFORE UPDATE ON public.community_profiles FOR EACH ROW EXECUTE FUNCTION public.community_touch_updated_at();
DROP TRIGGER IF EXISTS community_updates_touch ON public.community_exam_updates;
CREATE TRIGGER community_updates_touch BEFORE UPDATE ON public.community_exam_updates FOR EACH ROW EXECUTE FUNCTION public.community_touch_updated_at();
DROP TRIGGER IF EXISTS community_topics_protect_moderation ON public.community_topics;
CREATE TRIGGER community_topics_protect_moderation BEFORE UPDATE ON public.community_topics FOR EACH ROW EXECUTE FUNCTION public.community_lock_moderation_fields();
DROP TRIGGER IF EXISTS community_replies_protect_moderation ON public.community_replies;
CREATE TRIGGER community_replies_protect_moderation BEFORE UPDATE ON public.community_replies FOR EACH ROW EXECUTE FUNCTION public.community_lock_moderation_fields();

ALTER TABLE public.community_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_moderation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_exam_updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads community pseudonyms" ON public.community_profiles;
CREATE POLICY "Public reads community pseudonyms" ON public.community_profiles FOR SELECT USING (NOT is_restricted OR user_id = auth.uid() OR public.is_community_moderator());
DROP POLICY IF EXISTS "Users create own community profile" ON public.community_profiles;
CREATE POLICY "Users create own community profile" ON public.community_profiles FOR INSERT WITH CHECK (user_id = auth.uid() AND badge = 'member' AND NOT is_verified AND NOT is_trusted AND NOT is_restricted AND reputation = 0);
DROP POLICY IF EXISTS "Moderators manage community profiles" ON public.community_profiles;
CREATE POLICY "Moderators manage community profiles" ON public.community_profiles FOR ALL USING (public.is_community_moderator()) WITH CHECK (public.is_community_moderator());

DROP POLICY IF EXISTS "Public reads active community categories" ON public.community_categories;
CREATE POLICY "Public reads active community categories" ON public.community_categories FOR SELECT USING (is_active OR public.is_community_moderator());

DROP POLICY IF EXISTS "Public reads published community topics" ON public.community_topics;
CREATE POLICY "Public reads published community topics" ON public.community_topics FOR SELECT USING (status IN ('published', 'locked') OR author_id = auth.uid() OR public.is_community_moderator());
DROP POLICY IF EXISTS "Users submit pending community topics" ON public.community_topics;
CREATE POLICY "Users submit pending community topics" ON public.community_topics FOR INSERT WITH CHECK (
  author_id = auth.uid() AND status = 'pending' AND NOT is_pinned AND NOT is_sensitive
  AND EXISTS (SELECT 1 FROM public.community_profiles cp WHERE cp.user_id = auth.uid() AND NOT cp.is_restricted)
);
DROP POLICY IF EXISTS "Moderators manage community topics" ON public.community_topics;
CREATE POLICY "Moderators manage community topics" ON public.community_topics FOR ALL USING (public.is_community_moderator()) WITH CHECK (public.is_community_moderator());

DROP POLICY IF EXISTS "Public reads published community replies" ON public.community_replies;
CREATE POLICY "Public reads published community replies" ON public.community_replies FOR SELECT USING (status = 'published' OR author_id = auth.uid() OR public.is_community_moderator());
DROP POLICY IF EXISTS "Users submit community replies" ON public.community_replies;
CREATE POLICY "Users submit community replies" ON public.community_replies FOR INSERT WITH CHECK (
  author_id = auth.uid() AND status IN ('pending', 'published') AND NOT is_accepted
  AND EXISTS (SELECT 1 FROM public.community_profiles cp WHERE cp.user_id = auth.uid() AND NOT cp.is_restricted AND (status = 'pending' OR cp.is_trusted))
  AND EXISTS (SELECT 1 FROM public.community_topics ct WHERE ct.id = topic_id AND ct.status = 'published')
);
DROP POLICY IF EXISTS "Moderators manage community replies" ON public.community_replies;
CREATE POLICY "Moderators manage community replies" ON public.community_replies FOR ALL USING (public.is_community_moderator()) WITH CHECK (public.is_community_moderator());

DROP POLICY IF EXISTS "Users manage own reactions" ON public.community_reactions;
CREATE POLICY "Users manage own reactions" ON public.community_reactions FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Public counts reactions" ON public.community_reactions;
CREATE POLICY "Public counts reactions" ON public.community_reactions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users manage own bookmarks" ON public.community_bookmarks;
CREATE POLICY "Users manage own bookmarks" ON public.community_bookmarks FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users create reports" ON public.community_reports;
CREATE POLICY "Users create reports" ON public.community_reports FOR INSERT WITH CHECK (reporter_id = auth.uid() AND status = 'open' AND resolved_by IS NULL AND resolved_at IS NULL);
DROP POLICY IF EXISTS "Users read own reports" ON public.community_reports;
CREATE POLICY "Users read own reports" ON public.community_reports FOR SELECT USING (reporter_id = auth.uid() OR public.is_community_moderator());
DROP POLICY IF EXISTS "Moderators manage reports" ON public.community_reports;
CREATE POLICY "Moderators manage reports" ON public.community_reports FOR ALL USING (public.is_community_moderator()) WITH CHECK (public.is_community_moderator());
DROP POLICY IF EXISTS "Moderators read moderation log" ON public.community_moderation_log;
CREATE POLICY "Moderators read moderation log" ON public.community_moderation_log FOR SELECT USING (public.is_community_moderator());
DROP POLICY IF EXISTS "Moderators write moderation log" ON public.community_moderation_log;
CREATE POLICY "Moderators write moderation log" ON public.community_moderation_log FOR INSERT WITH CHECK (public.is_community_moderator());
DROP POLICY IF EXISTS "Public reads sourced exam updates" ON public.community_exam_updates;
CREATE POLICY "Public reads sourced exam updates" ON public.community_exam_updates FOR SELECT USING (status = 'published' OR public.is_community_moderator());
DROP POLICY IF EXISTS "Moderators manage exam updates" ON public.community_exam_updates;
CREATE POLICY "Moderators manage exam updates" ON public.community_exam_updates FOR ALL USING (public.is_community_moderator()) WITH CHECK (public.is_community_moderator());

-- The public API exposes only deliberate community identity fields, never the
-- private auth-user link or moderation flags.
REVOKE SELECT ON public.community_profiles FROM anon, authenticated;
GRANT SELECT (pseudonym, badge, is_verified, reputation, contribution_count, created_at)
  ON public.community_profiles TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.community_refresh_reply_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE affected_topic UUID;
BEGIN
  affected_topic := COALESCE(NEW.topic_id, OLD.topic_id);
  UPDATE public.community_topics
  SET reply_count = (SELECT count(*) FROM public.community_replies WHERE topic_id = affected_topic AND status = 'published'),
      last_activity_at = COALESCE((SELECT max(created_at) FROM public.community_replies WHERE topic_id = affected_topic AND status = 'published'), created_at)
  WHERE id = affected_topic;
  RETURN COALESCE(NEW, OLD);
END; $$;
DROP TRIGGER IF EXISTS community_replies_refresh_topic ON public.community_replies;
CREATE TRIGGER community_replies_refresh_topic AFTER INSERT OR UPDATE OR DELETE ON public.community_replies FOR EACH ROW EXECUTE FUNCTION public.community_refresh_reply_count();

INSERT INTO public.community_categories (slug, name, description, stage, icon, display_order) VALUES
  ('gcse-maths', 'GCSE Maths', 'Methods, mock questions, revision and exam technique for GCSE Maths.', 'GCSE', 'Calculator', 10),
  ('gcse-biology', 'GCSE Biology', 'Biology concepts, required practicals and exam answers.', 'GCSE', 'Dna', 20),
  ('gcse-chemistry', 'GCSE Chemistry', 'Chemistry calculations, concepts, practicals and revision.', 'GCSE', 'FlaskConical', 30),
  ('gcse-physics', 'GCSE Physics', 'Equations, required practicals and unfamiliar exam contexts.', 'GCSE', 'Atom', 40),
  ('gcse-english', 'GCSE English', 'English Language and Literature planning and exam technique.', 'GCSE', 'BookOpen', 50),
  ('a-level-stem', 'A-Level STEM', 'A-Level Maths, Biology, Chemistry and Physics discussion.', 'A-Level', 'Microscope', 60),
  ('revision-exam-technique', 'Revision & Exam Technique', 'Revision routines, mock preparation, timing and confidence.', 'General', 'Timer', 70),
  ('results-next-steps', 'Results & Next Steps', 'Results day, retakes, subject choices and next-step guidance.', 'General', 'GraduationCap', 80),
  ('official-exam-updates', 'Official Exam Updates', 'Sourced updates from UK exam boards and official education bodies.', 'Official', 'BadgeCheck', 90)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, display_order = EXCLUDED.display_order;

-- Foundational prompts give the private seed a useful shape without pretending
-- they are organic student activity. seeded_author_name is always shown clearly.
WITH prompts(category_slug, slug, title, body) AS (VALUES
  ('gcse-maths','how-to-use-a-maths-error-log','How should I use an error log for GCSE Maths?','Record the question topic, the mistake you made, the correct method, and one similar question to retry later. What format has helped you revisit mistakes consistently?'),
  ('gcse-maths','calculator-paper-time-management','How do you manage time on a GCSE Maths calculator paper?','I want a reliable way to avoid spending too long on one difficult question while still showing enough working. What timing strategy works best?'),
  ('gcse-maths','foundation-to-higher-tier-decision','What should students consider before moving from Foundation to Higher tier?','Which evidence from mocks, topic tests, and teacher feedback should guide a tier decision without focusing on one result alone?'),
  ('gcse-maths','aqa-maths-mock-review-routine','A practical routine for reviewing an AQA Maths mock','Instead of checking only the grade, sort lost marks into knowledge, method, accuracy, and timing. Which category tends to create the biggest improvement?'),
  ('gcse-maths','remembering-circle-theorems','How can I remember and apply circle theorems?','Knowing the theorem statement is not always enough when the diagram changes. How do you connect each theorem to visual clues?'),
  ('gcse-biology','six-mark-biology-answers','How do you structure a six-mark GCSE Biology answer?','How much planning should you do, and how can you make sure the answer includes linked scientific reasoning instead of disconnected facts?'),
  ('gcse-biology','required-practicals-revision','Best way to revise GCSE Biology required practicals','Is it better to memorise methods or practise variables, improvements, graphs, and conclusions using exam questions?'),
  ('gcse-biology','food-tests-common-errors','What are the most common mistakes in food-test questions?','Students often mix up reagents, conditions, and positive results. What is an efficient way to practise all three together?'),
  ('gcse-biology','inheritance-crosses-checking','How can I check a genetic cross answer?','What checks can catch errors with alleles, parent genotypes, gametes, ratios, and probabilities before moving on?'),
  ('gcse-biology','ecology-sampling-questions','How should I approach ecology sampling questions?','How do you decide whether a question needs a quadrat, transect, random sample, or calculation of abundance?'),
  ('gcse-chemistry','moles-question-starting-point','How do you find the starting point in a moles question?','Moles problems can look very different. Which quantities and unit conversions should you identify before choosing an equation?'),
  ('gcse-chemistry','bonding-comparison-answers','How do you improve answers comparing bonding and properties?','How can students build a complete chain from structure and bonding to forces, energy, and the observed property?'),
  ('gcse-chemistry','electrolysis-rules','A simple way to apply electrolysis rules','What decision process helps identify products at each electrode for molten and aqueous compounds?'),
  ('gcse-chemistry','titration-calculation-checks','What checks help with titration calculations?','How do you keep concentration units, reacting ratios, transferred volumes, and significant figures under control?'),
  ('gcse-chemistry','chemistry-practical-evaluation','How do I evaluate a chemistry practical properly?','What makes an improvement specific, realistic, and clearly connected to the source of uncertainty?'),
  ('gcse-physics','choosing-the-right-equation','How do you choose the right GCSE Physics equation?','Instead of scanning the equation sheet randomly, how can you connect the quantities in the question to the physical model?'),
  ('gcse-physics','required-practical-graphs','What makes a strong required-practical graph answer?','Which details about axes, units, scale, best-fit lines, gradients, and anomalies are most often missed?'),
  ('gcse-physics','electricity-circuit-reasoning','How do you reason through unfamiliar circuit questions?','What should you establish about current, potential difference, resistance, series paths, and parallel branches before calculating?'),
  ('gcse-physics','radiation-explanation-questions','How detailed should radiation explanation answers be?','How can students connect type, penetration, ionisation, half-life, exposure, and risk without adding irrelevant facts?'),
  ('gcse-physics','physics-unit-conversions','Best way to prevent unit-conversion mistakes in Physics','Which conversions should students write explicitly before substitution, and what final checks reveal an unreasonable answer?'),
  ('gcse-english','english-language-question-timing','How should I divide time in GCSE English Language?','How do you balance reading, planning, analytical questions, and the longer writing task without rushing the final section?'),
  ('gcse-english','using-short-quotations','Why are short quotations often stronger in analysis?','How can a short quotation make it easier to analyse a precise word, method, effect, and alternative interpretation?'),
  ('gcse-english','literature-theme-revision','How do you revise themes without memorising whole essays?','What is a good way to connect a small quotation bank with characters, themes, context, and flexible arguments?'),
  ('gcse-english','creative-writing-opening','What makes an effective creative-writing opening?','How can an opening establish voice, setting, tension, and control without using an overly dramatic list of techniques?'),
  ('gcse-english','comparison-question-plan','How should I plan a comparison answer?','What planning structure keeps similarities and differences connected to a clear argument throughout the response?'),
  ('a-level-stem','a-level-chemistry-mechanisms','How should I revise A-Level Chemistry mechanisms?','How can students connect reagents, conditions, curly arrows, intermediates, products, and mechanism names rather than memorising isolated diagrams?'),
  ('a-level-stem','a-level-physics-multi-step-problems','Approaching multi-step A-Level Physics problems','What should you write down when the final quantity is several equations away from the information provided?'),
  ('a-level-stem','a-level-biology-essay-planning','How do you plan an A-Level Biology essay?','How can a plan select broad, relevant biological ideas while keeping every paragraph accurate and connected to the title?'),
  ('a-level-stem','a-level-maths-proof-practice','How can I get better at A-Level Maths proofs?','What clues distinguish proof by deduction, exhaustion, contradiction, and counterexample, and how should practice be organised?'),
  ('a-level-stem','moving-from-gcse-to-a-level','What feels most different when moving from GCSE to A-Level STEM?','Which study habits need to change when topics become deeper, lessons move faster, and independent practice matters more?'),
  ('revision-exam-technique','two-week-mock-plan','How should I build a realistic two-week mock plan?','How do you prioritise subjects and weak topics while leaving time for retrieval practice, exam questions, rest, and adjustment?'),
  ('revision-exam-technique','active-recall-vs-past-papers','When should I use active recall versus past papers?','At what stage should revision move from learning and retrieval into timed application and complete papers?'),
  ('revision-exam-technique','exam-anxiety-first-five-minutes','What can help during the first five minutes of an exam?','Which simple routines help settle breathing, read instructions, scan the paper, and begin without losing useful time?'),
  ('revision-exam-technique','revision-session-length','How long should a focused revision session be?','Is there a best session length, or should it change with the task, attention level, and distance from the exam?'),
  ('revision-exam-technique','recovering-after-bad-mock','How should you respond to a disappointing mock result?','How can students turn a result into specific next actions without treating one paper as a prediction of the final grade?'),
  ('revision-exam-technique','using-mark-schemes-well','How do you use a mark scheme without just copying it?','What process helps compare reasoning, identify missing ideas, and retry the question from memory?'),
  ('revision-exam-technique','weekly-revision-review','What should be included in a weekly revision review?','Which questions help decide what improved, what remains weak, and what should change in next week’s plan?'),
  ('revision-exam-technique','sleep-before-exams','How should revision and sleep be balanced before exams?','What routine protects sleep while still giving enough time for review, preparation, and a calm start the next day?'),
  ('results-next-steps','results-day-preparation','What should students prepare before results day?','Which documents, contact details, course requirements, and backup options are useful to have ready?'),
  ('results-next-steps','when-to-consider-a-retake','When might an exam retake be worth considering?','What should students discuss with their school or college about requirements, timing, workload, cost, and alternative routes?'),
  ('results-next-steps','choosing-a-level-subjects','How should students choose A-Level subjects?','How can interest, current evidence, course combinations, future requirements, and workload be weighed together?'),
  ('results-next-steps','missing-a-course-offer','What should you do if results miss a course offer?','What calm sequence of checks and conversations should happen before making a rushed decision?'),
  ('results-next-steps','interpreting-grade-boundaries','What do grade boundaries actually tell you?','Why can boundaries change between papers and years, and why should unofficial predictions be treated cautiously?'),
  ('official-exam-updates','how-official-updates-are-checked','How ScienceDojo checks official exam updates','ScienceDojo links every exam update to a primary source such as an exam board, JCQ, Ofqual, GOV.UK, or UCAS. We separate the sourced facts from our own practical explanation.'),
  ('official-exam-updates','avoiding-exam-rumours','How to check an exam rumour before sharing it','Look for the claim on the relevant exam board or regulator website, check the publication date, and avoid screenshots without a verifiable source link.'),
  ('official-exam-updates','where-exam-timetables-come-from','Where should students check official exam timetables?','Use the timetable published by your exam board and confirm individual arrangements with your school or college. Social posts and revision apps should not be the final authority.'),
  ('official-exam-updates','results-day-official-sources','Which official sources are useful around results day?','Exam boards explain results and reviews of marking, while UCAS and GOV.UK publish guidance for next steps. Always check dates and eligibility on the linked official page.'),
  ('official-exam-updates','source-date-matters','Why does the date on exam guidance matter?','Rules, deadlines, specifications, and processes can change. Check that guidance applies to your qualification, exam series, board, and current year.'),
  ('revision-exam-technique','asking-a-useful-community-question','How to ask a question that gets a useful answer','Include the subject, qualification, exam board when relevant, what you have tried, and the exact point of confusion. Never include your full name, school, contact details, or candidate information.'),
  ('revision-exam-technique','community-safety-basics','Community safety basics for students','Use a pseudonym, keep personal details private, report anything worrying, and remember that community guidance cannot replace help from a parent, teacher, school, or safeguarding professional.')
)
INSERT INTO public.community_topics (category_id, slug, title, body, status, seeded_author_name, published_at)
SELECT c.id, p.slug, p.title, p.body, 'published', 'ScienceDojo Editorial Team', now()
FROM prompts p JOIN public.community_categories c ON c.slug = p.category_slug
ON CONFLICT (slug) DO NOTHING;

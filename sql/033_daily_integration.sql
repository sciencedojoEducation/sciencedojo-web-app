-- 033_daily_integration.sql 🏎️🚀
-- Pivoting ScienceDojo from Zoom to Daily.co.
-- Storing API credentials securely in platform_integrations.

-- 1. Insert/Update Daily.co as a provider with your credentials
INSERT INTO public.platform_integrations (provider, key_1, key_2, is_active)
VALUES (
  'daily', 
  'f58648afd2476812b41206795719ea93f124bd0ffde2b8348163e833d1974221', -- Daily API Key
  'sciencedojo.daily.co', -- Daily Domain
  true
)
ON CONFLICT (provider) DO UPDATE 
SET 
  key_1 = EXCLUDED.key_1,
  key_2 = EXCLUDED.key_2,
  is_active = true;

-- 2. Metadata Labels
COMMENT ON COLUMN public.platform_integrations.key_1 IS 'Daily.co API Key (Secret)';
COMMENT ON COLUMN public.platform_integrations.key_2 IS 'Daily.co Domain (e.g. sciencedojo.daily.co)';

-- 3. Verify RLS (Already inherited from base table in 013)
-- Only admins can read/write these keys.

DO $$
BEGIN
  RAISE NOTICE 'Daily.co Integration LIVE! 🏎️🚀✨';
END $$;

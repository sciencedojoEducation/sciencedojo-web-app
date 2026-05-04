-- 033_jitsi_video_provider.sql
-- Daily.co has been removed from ScienceDojo video calls.
-- Live classrooms now use generated meet.jit.si room URLs and do not require API keys.
--
-- Security note:
-- If the old 033_daily_integration.sql was ever committed or deployed, rotate the
-- exposed Daily.co API key in the Daily dashboard.

DELETE FROM public.platform_integrations
WHERE provider = 'daily';

# Database authorization and advisor maintenance

## Control contract

SQL 078 and 079 are independent of optional campus game migration 077. They do not enable features, admit accounts, alter course entitlements or change existing learning/file data. Apply each forward change only to an authorized, verified environment after capturing an affected-schema baseline and testing its current policies. A schema baseline is not a full user-data backup. Keep deployed findings and environment-specific authorization evidence in ignored private records.

- Authorization uses the existing active database-admin check, never editable `user_metadata.role`. Public signup may select user/parent/student/tutor; privileged account provisioning stays with the trusted backend. Missing OAuth signup roles still defer profile creation to the callback.
- Self profile insertion cannot assign admin/internal, suspension or warning fields. Profile updates protect privileged roles and safety fields. The existing backend and active database admins retain moderation capability.
- Pin legacy function search paths to `pg_catalog, public, pg_temp`, with a precondition that API roles cannot create in public. Preserve existing schema-qualified campus functions and their private protocol boundaries.
- Attached trigger functions execute through their triggers; they need no anonymous/authenticated direct RPC grant. Tutor rating aggregation remains callable by the existing service role. Do not remove required public/signed-in application RPC grants merely to erase advisor warnings: inspect callers, RLS dependencies and internal authorization first.
- Course parent visibility/lesson validation and assigned staff-project updates have no anonymous RPC grant. Their signed-in/service grants and function bodies remain unchanged. The public course catalog/access projections remain available.
- Public media URLs retain their existing behavior. Storage listing of avatars, Academy media and class files is limited to the owner or active admin. Authenticated object downloads use Supabase's operation-aware helpers. Server media browsing still uses the existing service client. This does not convert public buckets into private storage.
- Service-only campus/business/workbook tables may deliberately have RLS enabled without client policies. Never add permissive policies to silence those suggestions. Retain campus staff allowlisting, restrictive campus flag policies and default admission gates.

## Verification

Run `node --test tests/security-advisor.test.mjs tests/course-pilot.test.mjs tests/course-pilot-catalog.test.mjs tests/course-pilot-auth.test.mjs`. The security suite executes RLS under separate SQL roles, including forged metadata, real active admins, suspended admins, public signup/OAuth, privileged profile insertion, retained profile editing, safety fields, storage owner/peer/anonymous reads, trigger grants, idempotent forward application and retained enrolled discussion behavior.

Use the actual current function/policy definitions for a separate private replay before hosted changes. After application, rerun Security Advisor and verify catalogs/grants, anonymous storage enumeration and denied private RPC calls. Keep results environment-specific; these checks do not establish full platform auditing, human usability or a campus release gate.

Supabase's leaked-password protection is a Pro-plan setting. Do not change billing or substitute a client-only password check for that server protection. See [Supabase password security](https://supabase.com/docs/guides/auth/password-security), [function security](https://supabase.com/docs/guides/database/functions) and [Storage access control](https://supabase.com/docs/guides/storage/security/access-control).

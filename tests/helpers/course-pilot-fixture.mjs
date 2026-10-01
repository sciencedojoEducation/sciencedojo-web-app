import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

export const course = "10000000-0000-0000-0000-000000000001";
export const internal = "10000000-0000-0000-0000-000000000002";
export const version = "20000000-0000-0000-0000-000000000001";
export const id = (n) =>
  `30000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
export async function fixture(db = new PGlite()) {
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY,email_confirmed_at timestamptz,raw_user_meta_data jsonb DEFAULT '{}');
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT coalesce(current_setting('request.jwt.claims',true),'{}')::jsonb $$;
    CREATE TABLE profiles(id uuid PRIMARY KEY REFERENCES auth.users(id),role text,is_suspended boolean DEFAULT false,full_name text,avatar_url text);
    CREATE TABLE applications(user_id uuid);
    CREATE TABLE feature_flags(key text PRIMARY KEY,label text,description text,enabled boolean,category text);
  `);
  await db.exec(
    await readFile(
      new URL("../../sql/055_tutor_academy.sql", import.meta.url),
      "utf8",
    ),
  );
  const base = await readFile(
    new URL("../../sql/057_academy_course_builder.sql", import.meta.url),
    "utf8",
  );
  await db.exec(base.slice(0, base.indexOf("INSERT INTO storage.buckets")));
  await db.exec(
    `ALTER TABLE tutor_academy_progress ADD COLUMN completed_lesson_ids text[] NOT NULL DEFAULT '{}';`,
  );
  await db.exec(
    await readFile(
      new URL("../../sql/067_course_pilot.sql", import.meta.url),
      "utf8",
    ),
  );
  await db.exec(`
    GRANT USAGE ON SCHEMA public,auth TO anon,authenticated;
    GRANT SELECT ON academy_courses,academy_course_versions,profiles TO authenticated;
    GRANT SELECT,INSERT,UPDATE ON tutor_academy_progress TO authenticated;
    UPDATE feature_flags SET enabled=true WHERE key='course_pilot_enabled';
    INSERT INTO academy_courses(id,course_key,title,status,audience_roles,draft_content) VALUES
    ('${course}','pilot','Pilot','published',ARRAY['student'],'{"private":"draft secret"}'),
    ('${internal}','internal','Internal','published',ARRAY['student'],'{}');
    INSERT INTO academy_course_versions(id,course_id,version_number,quiz_revision,content) VALUES
    ('${version}','${course}',1,1,'{"title":"Pilot","description":"Learn","estimatedMinutes":30,"lessons":[{"slug":"one","title":"Lesson one","blocks":[{"secret":"private content"}]}],"quiz":[{"answer":"secret"}]}'),
    ('20000000-0000-0000-0000-000000000002','${internal}',1,1,'{"title":"Internal","lessons":[]}');
    UPDATE academy_courses SET published_version_id='${version}' WHERE id='${course}';
    UPDATE academy_courses SET published_version_id='20000000-0000-0000-0000-000000000002' WHERE id='${internal}';
    INSERT INTO course_pilot_listings(course_id,listed) VALUES('${course}',true);
  `);
  for (let n = 1; n <= 15; n++) {
    await db.query(
      "INSERT INTO auth.users(id,email_confirmed_at) VALUES($1,now());",
      [id(n)],
    );
    await db.query("INSERT INTO profiles(id,role,full_name) VALUES($1,$2,$3)", [
      id(n),
      n === 15
        ? "admin"
        : ["user", "student", "parent", "tutor", "internal"][n % 5],
      `Learner ${n}`,
    ]);
  }
  const as = async (n, fn) => {
    await db.exec("SET ROLE authenticated");
    await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [
      id(n),
    ]);
    try {
      return await fn();
    } finally {
      await db.exec("RESET ROLE");
    }
  };
  const join = (n, waitlist = false) =>
    as(n, () =>
      db.query("SELECT course_pilot_join($1,$2) AS status", [
        "pilot",
        waitlist,
      ]),
    );
  return { db, as, join };
}

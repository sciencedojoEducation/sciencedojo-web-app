import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import {
  fixture,
  course,
  internal,
  version,
  id,
} from "./helpers/course-pilot-fixture.mjs";

test("public catalogue is identical for anonymous visitors and every account role", async () => {
  const { db, as } = await fixture();
  try {
    await db.exec("SET ROLE anon");
    const publicCourses = (await db.query("SELECT course_pilot_catalog() AS courses")).rows[0].courses;
    await db.exec("RESET ROLE");
    assert.equal(publicCourses.length, 1);
    // The fixture covers student, parent, tutor, internal, user, and admin.
    for (const n of [1, 2, 3, 4, 5, 15]) {
      await as(n, async () => {
        const courses = (await db.query("SELECT course_pilot_catalog() AS courses")).rows[0].courses;
        assert.deepEqual(courses, publicCourses);
      });
    }
    // Browsing requires neither verification nor enrollment.
    await db.query("UPDATE auth.users SET email_confirmed_at=NULL WHERE id=$1", [id(1)]);
    await as(1, async () => {
      const courses = (await db.query("SELECT course_pilot_catalog() AS courses")).rows[0].courses;
      assert.deepEqual(courses, publicCourses);
    });
  } finally {
    await db.close();
  }
});

test("pilot migration: capacity, idempotency, waitlist, verified accounts, and retained places", async () => {
  const { db, as, join } = await fixture();
  try {
    await db.query(
      "UPDATE auth.users SET email_confirmed_at=NULL WHERE id=$1",
      [id(14)],
    );
    await assert.rejects(join(14), /verified active account/);
    await db.query("UPDATE profiles SET is_suspended=true WHERE id=$1", [
      id(13),
    ]);
    await assert.rejects(join(13), /verified active account/);
    for (let n = 1; n <= 9; n++)
      assert.equal((await join(n)).rows[0].status, "enrolled");
    // Concurrent submission queue executes the actual SQL transaction for each identity.
    // PGlite serializes connections; a source assertion below checks the cross-connection lock.
    const lastClaims = await Promise.all([
      db.query(
        "SELECT set_config('request.jwt.claim.sub',$1,false),course_pilot_join('pilot',false) AS status",
        [id(10)],
      ),
      db.query(
        "SELECT set_config('request.jwt.claim.sub',$1,false),course_pilot_join('pilot',false) AS status",
        [id(11)],
      ),
    ]);
    assert.deepEqual(
      lastClaims.map((r) => r.rows[0].status),
      ["enrolled", "waitlisted"],
    );
    assert.equal((await join(10)).rows[0].status, "enrolled");
    assert.equal((await join(11, true)).rows[0].status, "waitlisted");
    assert.equal((await join(12)).rows[0].status, "waitlisted");
    const count = await db.query(
      "SELECT status,count(*)::int AS n FROM course_pilot_memberships GROUP BY status ORDER BY status",
    );
    assert.deepEqual(count.rows, [
      { status: "enrolled", n: 10 },
      { status: "waitlisted", n: 2 },
    ]);
    await assert.rejects(
      as(15, () =>
        db.query("SELECT course_pilot_promote($1,$2)", [course, id(11)]),
      ),
      /ten places/,
    );
    await db.query("DELETE FROM profiles WHERE id=$1", [id(1)]);
    await db.query("DELETE FROM auth.users WHERE id=$1", [id(1)]);
    assert.equal(
      (
        await db.query(
          "SELECT count(*)::int AS n FROM course_pilot_memberships WHERE status='enrolled'",
        )
      ).rows[0].n,
      10,
    );
    assert.equal((await join(11)).rows[0].status, "waitlisted");
  } finally {
    await db.close();
  }
});

test("pilot migration: public projection, enrollment RLS, unlisting, and internal compatibility", async () => {
  const { db, as, join } = await fixture();
  try {
    await db.exec("SET ROLE anon");
    const catalog = (await db.query("SELECT course_pilot_catalog() AS courses"))
      .rows[0].courses;
    assert.equal(catalog[0].key, "pilot");
    assert.deepEqual(catalog[0].curriculum, [{ title: "Lesson one" }]);
    assert.doesNotMatch(
      JSON.stringify(catalog),
      /private content|draft secret|answer|blocks|quiz|email|author_id/,
    );
    await assert.rejects(
      db.query("SELECT content FROM academy_course_versions"),
      /permission denied/,
    );
    await db.exec("RESET ROLE");
    await as(1, async () =>
      assert.equal(
        (
          await db.query(
            "SELECT count(*)::int AS n FROM academy_courses WHERE id=$1",
            [course],
          )
        ).rows[0].n,
        0,
      ),
    );
    // Student audience does not bypass enrollment for the public pilot.
    await as(1, async () =>
      assert.equal(
        (
          await db.query(
            "SELECT count(*)::int AS n FROM academy_courses WHERE id=$1",
            [internal],
          )
        ).rows[0].n,
        1,
      ),
    );
    await as(2, async () => {
      await db.query("SELECT set_config('request.jwt.claims',$1,false)", [
        JSON.stringify({ user_metadata: { role: "admin" } }),
      ]);
      assert.equal(
        (
          await db.query(
            "SELECT count(*)::int AS n FROM academy_courses WHERE id=$1",
            [course],
          )
        ).rows[0].n,
        0,
      );
    });
    await join(1);
    await as(1, async () =>
      assert.equal(
        (
          await db.query(
            "SELECT count(*)::int AS n FROM academy_course_versions WHERE id=$1",
            [version],
          )
        ).rows[0].n,
        1,
      ),
    );
    await db.query(
      "UPDATE course_pilot_listings SET listed=false WHERE course_id=$1",
      [course],
    );
    assert.equal(
      (await db.query("SELECT course_pilot_catalog() AS courses")).rows[0]
        .courses.length,
      0,
    );
    await as(1, async () =>
      assert.equal(
        (await db.query("SELECT course_pilot_access('pilot') AS access"))
          .rows[0].access.allowed,
        true,
      ),
    );
    await assert.rejects(join(2), /not open/);
    await db.exec(
      "UPDATE feature_flags SET enabled=false WHERE key='course_pilot_enabled'",
    );
    await as(1, async () =>
      assert.equal(
        (await db.query("SELECT course_pilot_access('pilot') AS access"))
          .rows[0].access.allowed,
        false,
      ),
    );
    await as(1, async () =>
      assert.equal(
        (
          await db.query(
            "SELECT count(*)::int AS n FROM academy_courses WHERE id=$1",
            [internal],
          )
        ).rows[0].n,
        1,
      ),
    );
  } finally {
    await db.close();
  }
});

test("pilot migration: notes privacy, discussion scope, reporting, reviews, and moderation", async () => {
  const { db, as, join } = await fixture();
  try {
    await join(1);
    await join(2);
    await as(1, () =>
      db.query(
        "INSERT INTO course_pilot_notes(course_id,user_id,body) VALUES($1,$2,$3)",
        [course, id(1), "private reflection"],
      ),
    );
    await as(2, async () =>
      assert.equal(
        (await db.query("SELECT * FROM course_pilot_notes")).rows.length,
        0,
      ),
    );
    await as(15, async () =>
      assert.equal(
        (await db.query("SELECT * FROM course_pilot_notes")).rows.length,
        0,
      ),
    );
    await assert.rejects(
      as(1, () =>
        db.query(
          "INSERT INTO course_pilot_notes(course_id,user_id,body) VALUES($1,$2,$3)",
          [course, id(2), "forged"],
        ),
      ),
      /row-level security/,
    );
    await assert.rejects(
      as(1, () =>
        db.query(
          "INSERT INTO course_pilot_notes(course_id,user_id,lesson_slug,body) VALUES($1,$2,'missing','x')",
          [course, id(1)],
        ),
      ),
      /Unknown lesson/,
    );
    await assert.rejects(
      as(3, () =>
        db.query("SELECT course_pilot_post($1,$2)", [course, "not enrolled"]),
      ),
      /Enrollment required/,
    );
    await as(1, () =>
      db.query("SELECT course_pilot_post($1,$2,$3)", [
        course,
        "Question",
        "one",
      ]),
    );
    const post = (await db.query("SELECT id FROM course_pilot_posts")).rows[0]
      .id;
    await assert.rejects(
      as(1, () =>
        db.query("SELECT course_pilot_post($1,$2,$3,$4)", [
          internal,
          "wrong course",
          "one",
          post,
        ]),
      ),
      /Enrollment required/,
    );
    await assert.rejects(
      as(2, () =>
        db.query("SELECT course_pilot_post($1,$2,$3,$4)", [
          course,
          "wrong lesson",
          "",
          post,
        ]),
      ),
      /Invalid discussion reply/,
    );
    await as(2, () =>
      db.query("SELECT course_pilot_post($1,$2,$3,$4)", [
        course,
        "Answer",
        "one",
        post,
      ]),
    );
    await as(2, () =>
      db.query("SELECT course_pilot_report($1,$2)", [post, "Please check"]),
    );
    await as(2, () =>
      db.query("SELECT course_pilot_report($1,$2)", [post, "Repeated report"]),
    );
    assert.equal(
      (await db.query("SELECT * FROM course_pilot_reports")).rows.length,
      1,
    );
    await as(2, async () =>
      assert.equal(
        (await db.query("SELECT * FROM course_pilot_reports")).rows.length,
        0,
      ),
    );
    // RLS unauthorized update succeeds with zero affected rows, rather than leaking records.
    await as(2, async () =>
      assert.equal(
        (
          await db.query(
            "UPDATE course_pilot_posts SET hidden=true RETURNING id",
          )
        ).rows.length,
        0,
      ),
    );
    await as(15, () =>
      db.query("UPDATE course_pilot_posts SET hidden=true WHERE id=$1", [post]),
    );
    await as(2, async () =>
      assert.equal(
        (await db.query("SELECT * FROM course_pilot_posts")).rows.length,
        0,
      ),
    );
    await assert.rejects(
      as(1, () =>
        db.query("SELECT course_pilot_review($1,5,$2)", [course, "too early"]),
      ),
      /Complete a lesson/,
    );
    await db.query(
      "INSERT INTO tutor_academy_progress(user_id,course_key,completed_lessons) VALUES($1,'pilot',ARRAY['one'])",
      [id(1)],
    );
    await as(1, () =>
      db.query("SELECT course_pilot_review($1,5,$2)", [course, "Great"]),
    );
    await as(1, () =>
      db.query("SELECT course_pilot_review($1,4,$2)", [course, "Updated"]),
    );
    assert.equal(
      (await db.query("SELECT * FROM course_pilot_reviews")).rows.length,
      1,
    );
    assert.equal(
      (await db.query("SELECT course_pilot_catalog() AS courses")).rows[0]
        .courses[0].reviews[0].rating,
      4,
    );
    await as(15, () =>
      db.query(
        "UPDATE course_pilot_reviews SET hidden=true WHERE course_id=$1",
        [course],
      ),
    );
    await as(1, () =>
      db.query("SELECT course_pilot_review($1,5,$2)", [
        course,
        "Edited hidden review",
      ]),
    );
    assert.equal(
      (await db.query("SELECT course_pilot_catalog() AS courses")).rows[0]
        .courses[0].reviews.length,
      0,
    );
    await assert.rejects(
      as(2, () =>
        db.query(
          "INSERT INTO course_pilot_memberships(course_id,user_id,status) VALUES($1,$2,$3)",
          [course, id(3), "enrolled"],
        ),
      ),
      /permission denied|row-level security/,
    );
  } finally {
    await db.close();
  }
});

test("all account roles can learn when enrolled, and admins can manually promote", async () => {
  const { db, as, join } = await fixture();
  try {
    for (const n of [1, 2, 3, 4, 5, 15]) {
      await join(n);
      await as(n, async () => {
        assert.equal(
          (
            await db.query(
              "SELECT count(*)::int AS n FROM academy_course_versions WHERE id=$1",
              [version],
            )
          ).rows[0].n,
          1,
        );
      });
    }
    await db.query(
      "INSERT INTO course_pilot_memberships(course_id,user_id,status) VALUES($1,$2,'waitlisted')",
      [course, id(12)],
    );
    await assert.rejects(
      as(1, () =>
        db.query("SELECT course_pilot_promote($1,$2)", [course, id(12)]),
      ),
      /Unauthorized/,
    );
    await as(15, () =>
      db.query("SELECT course_pilot_promote($1,$2)", [course, id(12)]),
    );
    await as(12, async () => {
      assert.equal(
        (
          await db.query("SELECT course_pilot_enrolled($1) AS allowed", [
            course,
          ])
        ).rows[0].allowed,
        true,
      );
    });
  } finally {
    await db.close();
  }
});

test("account deletion removes discussions and reports without recycling the enrolled place", async () => {
  const { db, as, join } = await fixture();
  try {
    await join(1);
    await join(2);
    await as(1, () =>
      db.query("SELECT course_pilot_post($1,'Question')", [course]),
    );
    const post = (await db.query("SELECT id FROM course_pilot_posts")).rows[0]
      .id;
    await as(2, () =>
      db.query("SELECT course_pilot_post($1,'Reply','',$2)", [course, post]),
    );
    await as(2, () =>
      db.query("SELECT course_pilot_report($1,'Check this')", [post]),
    );
    await db.query("DELETE FROM profiles WHERE id=$1", [id(1)]);
    await db.query("DELETE FROM auth.users WHERE id=$1", [id(1)]);
    assert.equal(
      (await db.query("SELECT count(*)::int AS n FROM course_pilot_posts"))
        .rows[0].n,
      0,
    );
    assert.equal(
      (await db.query("SELECT count(*)::int AS n FROM course_pilot_reports"))
        .rows[0].n,
      0,
    );
    assert.equal(
      (
        await db.query(
          "SELECT count(*)::int AS n FROM course_pilot_memberships WHERE status='enrolled'",
        )
      ).rows[0].n,
      2,
    );
  } finally {
    await db.close();
  }
});

test("claims and promotions lock the same course row for separate PostgreSQL connections", async () => {
  const sql = await readFile(
    new URL("../sql/067_course_pilot.sql", import.meta.url),
    "utf8",
  );
  assert.match(sql, /l\.listed FOR UPDATE OF c/);
  assert.match(
    sql,
    /FROM academy_courses WHERE id=target AND status='published' FOR UPDATE/,
  );
  assert.match(sql, /IF existing IS NOT NULL THEN RETURN existing/);
});

import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const stagingUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const accountsPath = new URL("../.env.showcase-accounts.local", import.meta.url);

if (process.env.SHOWCASE_STAGING !== "true" || !stagingUrl || !serviceKey) {
  throw new Error("Set SHOWCASE_STAGING=true and staging Supabase URL/service key before seeding.");
}

if (new URL(stagingUrl).host !== "mhjlcrrqxumsywkalusk.supabase.co") {
  throw new Error("Refusing to seed a project other than the ScienceDojo showcase staging project.");
}

const productionEnv = await readFile(new URL("../.env.local", import.meta.url), "utf8").catch(() => "");
const productionUrl = productionEnv.match(/^NEXT_PUBLIC_SUPABASE_URL=["']?([^"'\r\n]+)/m)?.[1];
if (productionUrl && new URL(stagingUrl).host === new URL(productionUrl).host) {
  throw new Error("Refusing to seed the project configured in .env.local.");
}

const supabase = createClient(stagingUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function check({ data, error }, label) {
  if (error) throw new Error(`${label}: ${error.message}`);
  return data;
}

function dateOffset(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(16, 0, 0, 0);
  return date.toISOString();
}

const people = [
  { role: "parent", email: "showcase-parent@example.test", name: "Alex Morgan", studentName: "Jamie" },
  { role: "student", email: "showcase-student@example.test", name: "Sam Rivera" },
  { role: "tutor", email: "showcase-tutor@example.test", name: "Taylor Lee" },
  { role: "admin", email: "showcase-admin@example.test", name: "ScienceDojo QA" },
];

const existingAccounts = await readFile(accountsPath, "utf8").catch(() => "");
const accountPasswords = Object.fromEntries(
  [...existingAccounts.matchAll(/^SHOWCASE_(PARENT|STUDENT|TUTOR|ADMIN)_PASSWORD=(.+)$/gm)].map((match) => [match[1].toLowerCase(), match[2]]),
);
const authUsers = check(await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }), "List staging users").users;
const ids = {};

for (const person of people) {
  const existing = authUsers.find((user) => user.email === person.email);
  if (existing && !accountPasswords[person.role]) {
    throw new Error(`Existing ${person.role} account has no saved local password; restore .env.showcase-accounts.local before continuing.`);
  }
  const password = accountPasswords[person.role] || randomBytes(30).toString("base64url");
  accountPasswords[person.role] = password;
  const user = existing || check(await supabase.auth.admin.createUser({
    email: person.email,
    password,
    email_confirm: true,
    user_metadata: {
      role: person.role,
      sub_role: person.role,
      full_name: person.name,
      ...(person.studentName ? { student_name: person.studentName } : {}),
    },
  }), `Create ${person.role} account`).user;
  ids[person.role] = user.id;
  check(await supabase.from("profiles").upsert({
    id: user.id,
    email: person.email,
    full_name: person.name,
    role: person.role,
    student_name: person.studentName || null,
    avatar_url: null,
  }), `Save ${person.role} profile`);
}

await writeFile(accountsPath, people.map((person) =>
  `SHOWCASE_${person.role.toUpperCase()}_EMAIL=${person.email}\nSHOWCASE_${person.role.toUpperCase()}_PASSWORD=${accountPasswords[person.role]}`,
).join("\n") + "\n", { mode: 0o600 });

check(await supabase.from("tutors").upsert({
  id: ids.tutor,
  bio: "Math and physics tutoring with patient explanations and practical examples.",
  subjects: ["Math", "Physics"],
  hourly_rate: 28,
  is_verified: true,
  is_publicly_listed: true,
  tutor_status: "verified",
  is_available_now: true,
}), "Save sample tutor");

for (const days of [2, 5, 7]) {
  check(await supabase.from("tutor_availability").upsert({
    tutor_id: ids.tutor,
    date: dateOffset(days).slice(0, 10),
    start_time: "16:00:00",
    end_time: "17:00:00",
  }, { onConflict: "tutor_id,date,start_time" }), `Save tutor availability for day ${days}`);
}

const bookingSamples = [
  { key: "parent-upcoming", studentId: ids.parent, subject: "Math", status: "confirmed", days: 4 },
  { key: "parent-completed-1", studentId: ids.parent, subject: "Math", status: "completed", days: -7 },
  { key: "parent-completed-2", studentId: ids.parent, subject: "Physics", status: "completed", days: -15 },
  { key: "student-upcoming", studentId: ids.student, subject: "Physics", status: "confirmed", days: 3 },
  { key: "student-completed-1", studentId: ids.student, subject: "Math", status: "completed", days: -5 },
  { key: "student-completed-2", studentId: ids.student, subject: "Math", status: "completed", days: -12 },
  { key: "student-completed-3", studentId: ids.student, subject: "Physics", status: "completed", days: -20 },
  { key: "student-request", studentId: ids.student, subject: "Math", status: "requested", days: 10 },
];
const bookingIds = {};
for (const sample of bookingSamples) {
  const description = `Showcase sample: ${sample.key}`;
  const existing = check(await supabase.from("bookings").select("id").eq("description", description).maybeSingle(), `Find ${sample.key}`);
  const values = {
    student_id: sample.studentId,
    tutor_id: ids.tutor,
    subject: sample.subject,
    description,
    requested_date: dateOffset(sample.days),
    status: sample.status,
    price_at_booking: 28,
    duration_hours: 1,
  };
  const booking = check(existing
    ? await supabase.from("bookings").update(values).eq("id", existing.id).select("id").single()
    : await supabase.from("bookings").insert(values).select("id").single(), `Save ${sample.key}`);
  bookingIds[sample.key] = booking.id;
}

for (const [bookingKey, summary, homework] of [
  ["parent-completed-1", "Jamie confidently used a number line to compare fractions.", "Practise three fraction questions before next week."],
  ["parent-completed-2", "Jamie explained forces using everyday examples.", "Look for two examples of balanced forces."],
  ["student-completed-1", "Sam solved ratio problems with a clear method.", "Try the short ratio practice in class."],
]) {
  check(await supabase.from("lesson_notes").upsert({
    booking_id: bookingIds[bookingKey], summary, homework,
  }, { onConflict: "booking_id" }), `Save ${bookingKey} lesson notes`);
}

const classSamples = [
  { key: "parent", studentId: ids.parent, subject: "Math", displayName: "Jamie's Maths class" },
  { key: "student", studentId: ids.student, subject: "Math", displayName: "Sam's Maths class" },
];
const classIds = {};
for (const sample of classSamples) {
  const classRow = check(await supabase.from("classes").upsert({
    student_id: sample.studentId,
    tutor_id: ids.tutor,
    subject: sample.subject,
    display_name: sample.displayName,
    cover_color: "#5676b8",
  }, { onConflict: "student_id,tutor_id,subject" }).select("id").single(), `Save ${sample.key} class`);
  classIds[sample.key] = classRow.id;
  const content = sample.key === "parent"
    ? "Practise three fraction comparisons using the number line from our lesson."
    : "Try two ratio questions, then share how you found each answer.";
  const existingPost = check(await supabase.from("class_posts").select("id").eq("class_id", classRow.id).eq("content", content).maybeSingle(), `Find ${sample.key} practice`);
  if (!existingPost) check(await supabase.from("class_posts").insert({
    class_id: classRow.id,
    author_id: ids.tutor,
    content,
    post_type: "assignment",
    due_date: dateOffset(8),
  }), `Save ${sample.key} practice`);
}

const missionTopic = "Ratios and Proportions";
const existingMission = check(await supabase.from("student_missions").select("id").eq("student_id", ids.student).eq("status", "pending_assessment").maybeSingle(), "Find student Mission");
if (!existingMission) check(await supabase.from("student_missions").insert({
  student_id: ids.student,
  tutor_id: ids.tutor,
  class_id: classIds.student,
  mission_tier: "weekly",
  status: "pending_assessment",
  mission_blueprint: { topic: missionTopic, questions: [] },
}), "Save student Mission");

for (const key of ["parent_dashboard_enabled", "student_dashboard_enabled", "tutor_dashboard_enabled", "booking_enabled", "free_assessment_enabled"]) {
  const category = key === "free_assessment_enabled" ? "Public Website" : key === "booking_enabled" ? "Booking & Payments" : "Dashboards";
  check(await supabase.from("feature_flags").upsert({
    key, label: key.replaceAll("_", " "), enabled: true, category,
  }, { onConflict: "key" }), `Enable ${key} in staging`);
}

console.log("Staging showcase data is ready. Synthetic account credentials are in .env.showcase-accounts.local.");

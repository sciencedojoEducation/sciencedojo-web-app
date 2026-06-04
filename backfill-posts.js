const https = require("https");
const fs = require("fs");

function loadLocalEnv() {
  if (!fs.existsSync(".env.local")) return;

  const env = fs.readFileSync(".env.local", "utf8");
  env.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

    const firstEqual = trimmed.indexOf("=");
    if (firstEqual === -1) return;

    const key = trimmed.slice(0, firstEqual).trim();
    let value = trimmed.slice(firstEqual + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] ||= value;
  });
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

loadLocalEnv();

const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

const CONFIG = {
  SUPABASE_URL: supabaseUrl,
  HEADERS: {
    "apikey": serviceRoleKey,
    "Authorization": `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates"
  }
};

async function postData(path, body) {
  return new Promise((resolve, reject) => {
    const options = {
      method: "POST",
      hostname: CONFIG.SUPABASE_URL.replace("https://", ""),
      path: "/rest/v1" + path,
      headers: CONFIG.HEADERS
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => resolve(data));
    });
    req.on("error", (e) => reject(e));
    req.write(JSON.stringify(body));
    req.end();
  });
}

async function fetchData(path) {
  return new Promise((resolve, reject) => {
    const options = {
      method: "GET",
      hostname: CONFIG.SUPABASE_URL.replace("https://", ""),
      path: "/rest/v1" + path,
      headers: CONFIG.HEADERS
    };
    https.get(options, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => resolve(JSON.parse(data)));
    }).on("error", (e) => reject(e));
  });
}

async function runMigration() {
  console.log("🚀 Starting Classroom Content Backfill...");

  // 1. Fetch all lesson notes joined with bookings
  const notes = await fetchData("/lesson_notes?select=*,booking:bookings(id,student_id,tutor_id,subject,requested_date)");
  console.log(`🔍 Found ${notes.length} lesson notes to process...`);

  // 2. Fetch all classes to map them
  const classes = await fetchData("/classes?select=id,student_id,tutor_id,subject");
  console.log(`📊 Loaded ${classes.length} existing classes...`);

  const classMap = {};
  classes.forEach(c => {
    const key = `${c.student_id}|${c.tutor_id}|${c.subject}`;
    classMap[key] = c.id;
  });

  let reportCount = 0;
  let assignmentCount = 0;

  for (const note of notes) {
    const booking = note.booking;
    if (!booking) continue;

    const classKey = `${booking.student_id}|${booking.tutor_id}|${booking.subject}`;
    const classId = classMap[classKey];

    if (!classId) {
      console.warn(`⚠️ No class found for ${booking.subject} (Tutor: ${booking.tutor_id}). Skipping.`);
      continue;
    }

    // A. Create Lesson Report Post
    if (note.summary) {
      await postData("/class_posts", {
        class_id: classId,
        author_id: booking.tutor_id,
        content: note.summary,
        post_type: "lesson_report",
        booking_id: booking.id,
        created_at: booking.requested_date // Match the original session date
      });
      reportCount++;
    }

    // B. Create Assignment Post
    if (note.homework && note.homework !== "No homework assigned.") {
      await postData("/class_posts", {
        class_id: classId,
        author_id: booking.tutor_id,
        content: note.homework,
        post_type: "assignment",
        booking_id: booking.id,
        created_at: booking.requested_date
      });
      assignmentCount++;
    }
  }

  console.log(`✨ Migration Complete!`);
  console.log(`📝 Generated ${reportCount} Lesson Reports.`);
  console.log(`🎓 Generated ${assignmentCount} Assignments.`);
}

runMigration().catch(console.error);

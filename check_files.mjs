import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';

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

const supabase = createClient(
  requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  requireEnv("SUPABASE_SERVICE_ROLE_KEY")
);

async function diagnoseApps() {
  const { data: apps, error } = await supabase.from('applications').select('*');
  if (error) {
    console.error(error);
    return;
  }
  
  apps.forEach(app => {
    console.log(`\n\n--- App for User: ${app.full_name} (${app.user_id}) ---`);
    if (app.data) {
      // Look for certificate and proof keys
      const certs = Object.keys(app.data).filter(k => k.includes('cert') || k.includes('url') || k.includes('proof') || k.includes('transcript'));
      console.log('Document related keys found at root:', certs);
      
      // Let's print the structure of education and work history
      console.log('Has education array?', Array.isArray(app.data.education), app.data.education);
      console.log('Has work_history array?', Array.isArray(app.data.work_history), app.data.work_history);
      
      // Full dump of just the keys
      console.log('All keys:', Object.keys(app.data));
    } else {
      console.log('No data JSONB payload found.');
    }
  });
}

diagnoseApps();

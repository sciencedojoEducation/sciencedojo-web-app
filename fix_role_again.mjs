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

async function fix() {
  const email = 'mpiumal@yahoo.com';
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === email);
  if (!user) return;

  // Clear sub_role if it's set to parent
  const newMetadata = { ...user.user_metadata };
  if (newMetadata.sub_role === 'parent') {
    delete newMetadata.sub_role;
  }
  newMetadata.role = 'tutor';

  await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: newMetadata
  });

  await supabase.from('profiles').update({ role: 'tutor' }).eq('id', user.id);
  console.log('Fixed mpiumal@yahoo.com role and cleared parent subRole.');
}

fix();

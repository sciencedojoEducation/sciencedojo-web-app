import { createHash } from "node:crypto";
import { lstat, readFile, realpath } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const releaseFiles = [
  "lib/campus/basketball.ts",
  "lib/campus/locomotion.ts",
  "lib/campus/protocol.ts",
  "lib/campus/school-geometry.ts",
  "lib/campus/school-layout.ts",
  "lib/campus/school-plan.ts",
  "lib/campus/world.ts",
  "services/campus-server/.env.example",
  "services/campus-server/DEPLOYMENT.md",
  "services/campus-server/admission-limit.mjs",
  "services/campus-server/index.mjs",
  "services/campus-server/package-lock.json",
  "services/campus-server/package.json",
  "services/campus-server/server.mjs",
  "verify-release.mjs",
];

export async function verifyCampusRelease(directory) {
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major < 22 || (major === 22 && minor < 18))
    throw new Error("Node.js 22.18+ is required");
  const root = await realpath(directory);
  const manifestPath = join(root, "release-manifest.json");
  if ((await realpath(manifestPath)) !== manifestPath || !(await lstat(manifestPath)).isFile())
    throw new Error("Release manifest must be regular");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  if (manifest.format !== 1 || manifest.minimumNode !== "22.18.0" || !Array.isArray(manifest.files) || !/^[a-f0-9]{40}$/.test(manifest.sourceRevision))
    throw new Error("Invalid campus release manifest");
  if (JSON.stringify(manifest.files.map((file) => file.path).sort()) !== JSON.stringify(releaseFiles))
    throw new Error("Unexpected campus release file list");
  for (const file of manifest.files) {
    const path = join(root, file.path);
    if ((await realpath(path)) !== path || !(await lstat(path)).isFile())
      throw new Error(`Release file must be regular: ${file.path}`);
    const bytes = await readFile(path);
    if (bytes.length !== file.bytes || createHash("sha256").update(bytes).digest("hex") !== file.sha256)
      throw new Error(`Release checksum mismatch: ${file.path}`);
  }
  return manifest;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const manifest = await verifyCampusRelease(process.argv[2] || dirname(fileURLToPath(import.meta.url)));
  console.log(JSON.stringify({ verified: true, sourceRevision: manifest.sourceRevision, files: manifest.files.length }));
}

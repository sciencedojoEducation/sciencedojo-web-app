import { createHash } from "node:crypto";
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import { chmod, copyFile, lstat, mkdir, mkdtemp, open, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { releaseFiles, verifyCampusRelease } from "./verify-campus-release.mjs";

const exec = promisify(execFile);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Explicit public runtime files only: never archive a checkout or a service directory recursively. */
export async function packageCampusService(output) {
  const stage = await mkdtemp(join(tmpdir(), "sciencedojo-campus-package-"));
  const target = resolve(output);
  let handle, created = false, complete = false;
  try {
    const { stdout } = await exec("git", ["rev-parse", "HEAD"], { cwd: root });
    const files = [];
    for (const path of releaseFiles) {
      const source = join(root, path === "verify-release.mjs" ? "scripts/verify-campus-release.mjs" : path);
      if (!(await lstat(source)).isFile()) throw new Error(`Regular source file required: ${path}`);
      const destination = join(stage, path);
      await mkdir(dirname(destination), { recursive: true });
      await copyFile(source, destination);
      await chmod(destination, 0o644);
      const bytes = await readFile(destination);
      files.push({ path, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") });
    }
    const manifest = { format: 1, sourceRevision: stdout.trim(), minimumNode: "22.18.0", files };
    await writeFile(join(stage, "release-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
    await verifyCampusRelease(stage);
    await mkdir(dirname(target), { recursive: true });
    handle = await open(target, "wx", 0o600);
    created = true;
    await new Promise((accept, reject) => {
      const tar = spawn("tar", ["-czf", "-", "-C", stage, ...releaseFiles, "release-manifest.json"], {
        env: { PATH: process.env.PATH, COPYFILE_DISABLE: "1", LC_ALL: "C" }, stdio: ["ignore", handle.fd, "pipe"],
      });
      tar.stderr.resume();
      tar.once("error", reject);
      tar.once("close", (code) => code === 0 ? accept() : reject(new Error(`Release archive failed (${code})`)));
    });
    await handle.close();
    handle = null;
    const sha256 = createHash("sha256").update(await readFile(target)).digest("hex");
    complete = true;
    return { archive: target, sha256, ...manifest };
  } finally {
    await handle?.close();
    if (created && !complete) await rm(target, { force: true });
    await rm(stage, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 3) throw new Error("Usage: npm run campus:package -- /absolute/output.tar.gz");
  const release = await packageCampusService(process.argv[2]);
  console.log(JSON.stringify({ archive: release.archive, sha256: release.sha256, sourceRevision: release.sourceRevision, files: release.files.length }));
}

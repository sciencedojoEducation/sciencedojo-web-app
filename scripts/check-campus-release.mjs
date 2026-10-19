/** Clean release installation and process restart; synthetic app callback, loopback only. */
import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { setTimeout as delay } from "node:timers/promises";
import { packageCampusService } from "./package-campus-service.mjs";
import { verifyCampusRelease } from "./verify-campus-release.mjs";
import NodeWebSocket from "../services/campus-server/node_modules/ws/wrapper.mjs";

globalThis.WebSocket = NodeWebSocket;
const { Client } = await import("@colyseus/sdk");
const exec = promisify(execFile);
const directory = await mkdtemp(join(tmpdir(), "sciencedojo-campus-release-"));
const scratch = await mkdtemp(join(tmpdir(), "sciencedojo-campus-release-work-"));
const extracted = join(scratch, "release");
const checks = [], rooms = [], children = [];
const serviceKey = randomBytes(32).toString("hex"), tickets = new Map();
const issuedTickets = [];
const who = { id: "40000000-0000-0000-0000-000000000001", pseudonym: "Quiet Maple abc123", colour: 1, blocked: [] };
let callbackRequests = 0;
const app = createServer(async (request, response) => {
  try {
    assert.equal(request.url, "/api/campus/service");
    assert.equal(request.headers.authorization, `Bearer ${serviceKey}`);
    let body = "";
    for await (const chunk of request) { body += chunk; assert(body.length <= 2048); }
    const payload = JSON.parse(body);
    assert.deepEqual(Object.keys(payload).sort(), ["operation", "value"]);
    callbackRequests++;
    let identity;
    if (payload.operation === "redeem") { identity = tickets.get(payload.value); tickets.delete(payload.value); }
    else if (payload.operation === "check" && payload.value === who.id) identity = who;
    response.writeHead(identity ? 200 : 403, { "content-type": "application/json" });
    response.end(JSON.stringify(identity || { error: "Fixture admission denied" }));
  } catch {
    response.writeHead(403).end();
  }
});
let origin, archive, result;
const port = 2571;
function start(secret = serviceKey) {
  const child = spawn(process.execPath, ["--experimental-strip-types", "services/campus-server/index.mjs"], {
    cwd: extracted,
    env: { PATH: process.env.PATH, NODE_ENV: "production", CAMPUS_APP_ORIGIN: origin, CAMPUS_SERVICE_KEY: secret, CAMPUS_BIND_HOST: "127.0.0.1", PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.output = "";
  child.done = new Promise((accept, reject) => {
    child.once("error", reject);
    child.once("close", (code) => accept(code));
  });
  for (const stream of [child.stdout, child.stderr]) stream.on("data", (chunk) => { child.output += chunk; });
  children.push(child);
  return child;
}
async function until(predicate, label, child) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (await predicate()) return;
    if (child?.exitCode !== null && child?.exitCode !== undefined)
      throw new Error(`Release exited before ${label}`);
    await delay(75);
  }
  throw new Error(`Release timeout: ${label}`);
}
async function healthy(child) {
  await until(async () => {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`, { signal: AbortSignal.timeout(500) });
      return response.ok && (await response.json()).ready === true;
    } catch { return false; }
  }, "health", child);
}
async function stop(child) {
  child.kill("SIGTERM");
  const code = await Promise.race([child.done, delay(10000, "timeout", { ref: false })]);
  assert.equal(code, 0, "Release did not shut down cleanly");
}
function issue() {
  const ticket = randomBytes(32).toString("hex");
  issuedTickets.push(ticket);
  tickets.set(ticket, who);
  return ticket;
}
async function connect(ticket) {
  const room = await new Client(`ws://127.0.0.1:${port}`, { headers: { origin } }).joinById("library", { ticket });
  room.reconnection.enabled = false;
  room.onMessage("notice", () => {});
  room.onMessage("snapshot", (value) => { room.latest = value; });
  room.onError(() => {});
  rooms.push(room);
  await until(() => room.latest, "first snapshot");
  return room;
}
try {
  archive = await packageCampusService(join(directory, "campus-service.tar.gz"));
  const { stdout: listing } = await exec("tar", ["-tzf", archive.archive]);
  const entries = listing.trim().split("\n");
  assert.equal(entries.length, 16);
  assert(entries.includes("lib/campus/school-layout.ts"));
  assert(entries.includes("lib/campus/basketball.ts"));
  assert(entries.every((path) => !path.startsWith("/") && !path.split("/").includes("..")));
  assert(entries.every((path) => !/(^|\/)(\.git|\.campus-private|\.business-private|node_modules|private-materials)(\/|$)/.test(path)));
  assert.deepEqual(entries.filter((path) => /(^|\/)\.env/.test(path)), ["services/campus-server/.env.example"]);
  assert(!entries.includes("package.json") && !entries.some((path) => path.startsWith("app/")));
  await mkdir(extracted);
  await exec("tar", ["-xzf", archive.archive, "-C", extracted]);
  await verifyCampusRelease(extracted);
  assert.match(await readFile(join(extracted, "services/campus-server/.env.example"), "utf8"), /^CAMPUS_SERVICE_KEY=$/m);
  checks.push("Archive has only runtime/public setup files; no checkout, private material, working environment or root app");
  const protocol = join(extracted, "lib/campus/protocol.ts");
  const original = await readFile(protocol);
  await writeFile(protocol, "// Deliberate integrity-test edit\n");
  await assert.rejects(verifyCampusRelease(extracted), /checksum mismatch/);
  await rm(protocol);
  const outside = join(scratch, "outside-canary.txt");
  await writeFile(outside, "Synthetic outside-file canary");
  await symlink(outside, protocol);
  await assert.rejects(verifyCampusRelease(extracted), /must be regular/);
  await rm(protocol);
  await writeFile(protocol, original);
  const manifestPath = join(extracted, "release-manifest.json"), manifestBytes = await readFile(manifestPath);
  await rm(manifestPath);
  await symlink(outside, manifestPath);
  await assert.rejects(verifyCampusRelease(extracted), /manifest must be regular/);
  await rm(manifestPath);
  await writeFile(manifestPath, manifestBytes);
  await assert.rejects(packageCampusService(archive.archive), (error) => error.code === "EEXIST");
  checks.push("Altered/symlinked payloads rejected and existing archive cannot be overwritten");
  await exec("npm", ["ci", "--omit=dev", "--prefix", "services/campus-server"], { cwd: extracted, timeout: 120000 });
  const { stdout: verification } = await exec(process.execPath, ["verify-release.mjs"], { cwd: extracted });
  assert.deepEqual(JSON.parse(verification), { verified: true, sourceRevision: archive.sourceRevision, files: 15 });
  checks.push("Clean extraction installs only the service lockfile and passes its standalone verifier");
  await new Promise((accept) => app.listen(0, "127.0.0.1", accept));
  origin = `http://127.0.0.1:${app.address().port}`;
  const noSecret = start("");
  assert.notEqual(await noSecret.done, 0);
  assert.match(noSecret.output, /32\+ character CAMPUS_SERVICE_KEY/);
  checks.push("Packaged entry point refuses startup without its private service credential");
  const first = start();
  await healthy(first);
  const oldTicket = issue(), learner = await connect(oldTicket);
  const privateContext=async()=>{
    const response=await fetch(`http://127.0.0.1:${port}/games-context`,{headers:{authorization:`Bearer ${serviceKey}`},signal:AbortSignal.timeout(1500)});
    assert.equal(response.status,200);return response.json();
  };
  assert.equal((await fetch(`http://127.0.0.1:${port}/games-context`)).status,401);
  const beforeContext=await privateContext();assert.equal(beforeContext.players.length,1);
  let seq = 0;
  const deadline = Date.now() + 5000;
  while (learner.latest.players[0].z > -1.5 && Date.now() < deadline) {
    learner.send("input", { x: 0, z: -1, seq: seq++ });
    await delay(100);
  }
  learner.send("input", { x: 0, z: 0, seq: seq++ });
  learner.send("sit", "desk-2");
  await until(() => learner.latest.occupied.includes("desk-2"), "seat ownership", first);
  assert(callbackRequests >= 2);
  checks.push("Actual packaged process authenticates through the protected synthetic app callback and owns a seat");
  await stop(first);
  await until(() => !learner.connection.isOpen, "old connection closed");
  const second = start();
  await healthy(second);
  await assert.rejects(connect(oldTicket));
  const fresh = await connect(issue());
  const afterContext=await privateContext();assert.equal(afterContext.players.length,1);
  assert.notEqual(afterContext.players[0].connection,beforeContext.players[0].connection);
  checks.push("Private live game context denies unauthenticated requests and binds fresh process admission to a new connection generation");
  assert.equal(fresh.latest.players.length, 1);
  assert.equal(fresh.latest.players[0].status, "walking");
  assert.equal(fresh.latest.players[0].seat, null);
  assert.deepEqual(fresh.latest.occupied, []);
  checks.push("SIGTERM/restart closes old connections, clears seats/presence, rejects consumed tickets and requires fresh admission");
  await stop(second);
  for (const child of children) {
    assert(child.output.length < 65536);
    assert(![serviceKey, ...issuedTickets].some((value) => child.output.includes(value)), "Synthetic credential appeared in process logs");
  }
  checks.push("Captured packaged-process logs contain no issued synthetic credential");
  result = { passed: true, sourceRevision: archive.sourceRevision, sha256: archive.sha256, node: process.versions.node, fixture: "Clean release + actual process, synthetic loopback application only", checks };
  await writeFile(join(directory, "campus-service.sha256"), `${archive.sha256}  campus-service.tar.gz\n`);
  await writeFile(join(directory, "evidence.json"), JSON.stringify(result, null, 2) + "\n");
  console.log(JSON.stringify({ ...result, directory }, null, 2));
} finally {
  for (const room of rooms) if (room.connection?.isOpen) await Promise.race([room.leave().catch(() => {}), delay(1000, undefined, { ref: false })]);
  for (const child of children) if (child.exitCode === null) {
    child.kill("SIGTERM");
    await Promise.race([child.done.catch(() => {}), delay(2000, undefined, { ref: false })]);
    if (child.exitCode === null) child.kill("SIGKILL");
  }
  await new Promise((accept) => app.close(accept));
  await rm(scratch, { recursive: true, force: true });
}

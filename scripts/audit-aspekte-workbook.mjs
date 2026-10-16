/** Audit private source assets and interactive coverage; no network calls. */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";
const base = resolve(import.meta.dirname, "../private-materials/aspekte-neu-b2/derived");
const manifest = JSON.parse(readFileSync(join(base, "manifest.json"), "utf8"));
const issues = [], missingPages = [], chapters = [];
for (let i = 1; i <= 185; i++) {
  const image = join(base, "pages", `page-${String(i).padStart(3, "0")}.jpg`);
  if (!existsSync(image) || readFileSync(image).subarray(0, 2).toString("hex") !== "ffd8") issues.push(`Missing/invalid PDF page image ${i}`);
}
for (const track of manifest.tracks) {
  const path = join(base, "audio", `${String(track.number).padStart(2, "0")}.wav`);
  if (!track.available || !existsSync(path)) { issues.push(`Track ${track.number} not ready`); continue; }
  const bytes = readFileSync(path);
  if (bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 12) !== "WAVE" || bytes.length !== track.bytes) issues.push(`Invalid audio ${track.number}`);
  const source = readFileSync(join(base, "..", "audio", track.source));
  if (createHash("sha256").update(source).digest("hex") !== track.sha256) issues.push(`Track ${track.number} source changed; run preparation again`);
}
const trackPages = {};
for (const chapter of manifest.chapters) {
  const stats = { chapter: chapter.number, pages: 0, nativePages: 0, exercises: 0, fixed: 0, review: 0, self: 0, tracks: [] };
  for (let n = chapter.firstPage; n <= chapter.lastPage; n++) {
    const path = join(base, "content", `${String(n).padStart(3, "0")}.json`);
    if (!existsSync(path)) { missingPages.push(n); continue; }
    const page = JSON.parse(readFileSync(path, "utf8"));
    if (page.bookPage !== n) issues.push(`Page mapping mismatch ${n}`);
    stats.pages++;
    if (process.argv.includes("--require-complete") && page.symbolContentVersion !== 1) issues.push(`Source symbols have not been reviewed on page ${n}`);
    if (page.symbolContentVersion) {
      const markers = [...(page.markers || []), ...page.exercises.flatMap(e => e.markers || [])];
      const tracks = [...new Set(markers.filter(m => m.type === "audio").map(m => m.track))].sort((a, b) => a - b);
      if (JSON.stringify(tracks) !== JSON.stringify(page.tracks)) issues.push(`Listening marker/page summary mismatch ${n}`);
      for (const marker of markers) {
        if (!["audio", "solution", "exam"].includes(marker.type) || !marker.sourcePosition) issues.push(`Unverified source marker ${n}`);
        if (marker.type === "audio" && (!Number.isInteger(marker.track) || marker.track < 2 || marker.track > 51)) issues.push(`Invalid listening marker ${n}`);
        if (marker.type === "solution" && (!Number.isInteger(marker.referencePage) || marker.referencePage < 147 || marker.referencePage > 158)) issues.push(`Invalid solution marker ${n}`);
        if (marker.type === "exam" && !/^(GI|TELC|GI \/ TELC)$/.test(marker.label)) issues.push(`Invalid exam marker ${n}`);
      }
    }
    if (page.nativeContentVersion) stats.nativePages++;
    const checkBlocks = (blocks, fieldIds, location, segmentCounts = {}) => {
      const seen = new Set();
      for (const block of blocks || []) {
        if (block.asset && (!/^[1-9]\d{0,2}-[1-9]\d?$/.test(block.asset) || !existsSync(join(base, "figures", `${block.asset}.jpg`)))) issues.push(`Missing artwork ${location}:${block.asset}`);
        const refs = [block.text || "", ...(block.rows || []).flat()].flatMap(text => [...text.matchAll(/\{\{([^}]+)\}\}/g)].map(match => match[1]));
        for (const reference of refs) {
          const [id, part] = reference.split("#");
          if (!fieldIds.has(id) || seen.has(reference) || part && (!/^[1-6]$/.test(part) || Number(part) > (segmentCounts[id] || 0))) issues.push(`Invalid/duplicate inline field ${location}:${reference}`);
          seen.add(reference);
        }
      }
    };
    checkBlocks(page.content, new Set(), String(n));
    const exercises = new Set();
    for (const exercise of page.exercises) {
      if (!exercise.id || exercises.has(exercise.id)) issues.push(`Duplicate exercise on page ${n}: ${exercise.id}`);
      exercises.add(exercise.id); stats.exercises++;
      for (const reference of exercise.contextExercises || []) {
        const match = /^(\d{1,3}):([^:]+)$/.exec(reference);
        if (!match) { issues.push(`Invalid context reference ${n}:${reference}`); continue; }
        const contextPath = join(base, "content", `${match[1].padStart(3, "0")}.json`);
        if (!existsSync(contextPath) || !JSON.parse(readFileSync(contextPath, "utf8")).exercises.some(e => e.id === match[2])) issues.push(`Missing linked exercise ${n}:${reference}`);
      }
      for (const track of exercise.relatedTracks || []) if (!Number.isInteger(track) || track < 2 || track > 51) issues.push(`Invalid repeat-listening track ${n}:${exercise.id}`);
      const fields = new Set();
      for (const field of exercise.fields) {
        if (!field.id || fields.has(field.id) || !field.label) issues.push(`Invalid/duplicate field ${n}:${exercise.id}:${field.id}`);
        fields.add(field.id);
        if (["exact", "set"].includes(field.evaluation)) {
          stats.fixed++;
          if (!field.answers.length || !exercise.solutionEvidence || exercise.solutionPage < 146 || exercise.solutionPage > 157) issues.push(`Fixed answer lacks source evidence: ${n}:${exercise.id}:${field.id}`);
          if (field.options.length && field.answers.some(a => !field.options.some(o => o.toLowerCase() === a.toLowerCase()))) issues.push(`Answer not in options ${n}:${exercise.id}:${field.id}`);
        } else if (field.evaluation === "review") stats.review++;
        else if (field.evaluation === "self") { stats.self++; if (field.answers.length) issues.push(`Self-assessment incorrectly has official answers ${n}:${exercise.id}`); }
        else issues.push(`Unknown evaluation mode ${n}:${exercise.id}:${field.id}`);
      }
      checkBlocks(exercise.content, fields, `${n}:${exercise.id}`, Object.fromEntries(exercise.fields.map(field => [field.id, field.segments || 0])));
    }
    for (const track of page.tracks) {
      if (!Number.isInteger(track) || track < 1 || track > 51) issues.push(`Invalid track on page ${n}`);
      trackPages[track] ||= []; trackPages[track].push(n);
      if (!stats.tracks.includes(track)) stats.tracks.push(track);
    }
  }
  chapters.push(stats);
}
const report = { checkedAt: new Date().toISOString(), sourceImages: 185, audioTracks: manifest.tracks.length, chapters, missingPages, trackPages,
  issues, structuralChecksPassed: issues.length === 0, contentCoverageComplete: missingPages.length === 0 && chapters.reduce((n, c) => n + c.nativePages, 0) === 140,
  sourceFidelityReview: "Requires review against the original tasks; structural checks alone do not prove semantic completeness." };
writeFileSync(join(base, "audit.json"), JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ ...report, missingPages: `${missingPages.length} pages`, trackPages: undefined }, null, 2));
if (issues.length || (process.argv.includes("--require-complete") && !report.contentCoverageComplete)) process.exitCode = 1;

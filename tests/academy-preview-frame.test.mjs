import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { academyPreviewFrame } from "../lib/academy-preview-frame.ts";
import { academyPreviewDevices } from "../lib/academy-preview-devices.ts";

test("tablet screen proportions match portrait 3:4 and landscape 4:3 with equal bezels", () => {
  const portrait = academyPreviewFrame("tablet-portrait", 1600, 1600);
  const landscape = academyPreviewFrame("tablet-landscape", 1600, 1600);
  assert.equal(portrait.device.width / portrait.device.height, 3 / 4);
  assert.equal(landscape.device.width / landscape.device.height, 4 / 3);
  assert.equal(portrait.inset, landscape.inset);
  assert.equal(portrait.width, landscape.height);
  assert.equal(portrait.height, landscape.width);
  assert.equal(portrait.radius, 56);
});

test("all devices fit preview area without stretching or changing the emulated viewport", () => {
  for (const device of academyPreviewDevices) {
    for (const [width, height] of [[1440, 900], [800, 600], [390, 700]]) {
      const frame = academyPreviewFrame(device.id, width, height);
      assert.ok(frame.scale > 0 && frame.scale <= 1);
      assert.ok(frame.width * frame.scale <= width - 32 + 0.001);
      assert.ok(frame.height * frame.scale <= height - 64 + 0.001);
      assert.equal(frame.device.width, device.width);
      assert.equal(frame.device.height, device.height);
    }
  }
});

test("course and template studios use the same frame and orientation changes preserve the iframe", () => {
  const frame = readFileSync(new URL("../components/admin/academy-builder/AcademyPreviewFrame.tsx", import.meta.url), "utf8");
  assert.equal((frame.match(/<iframe\b/g) || []).length, 1, "one stable iframe across desktop/tablet/phone");
  assert.match(frame, /<iframe key=\{previewKey\}/);
  assert.doesNotMatch(frame, /if \(deviceId.*return/);
  for (const file of ["components/admin/AcademyCourseEditor.tsx", "components/admin/academy-builder/AcademyTemplatePreviewStudio.tsx"]) {
    const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    assert.match(source, /<AcademyPreviewFrame\s*deviceId=\{deviceId\}/);
    assert.match(source, /previewKey=\{`\$\{view\}-\$\{lessonSlug\}`\}/);
    assert.doesNotMatch(source, /style=\{\{ width: device.width, height: device.height \}\}/);
  }
});

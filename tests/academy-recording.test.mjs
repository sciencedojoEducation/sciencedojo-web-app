import assert from "node:assert/strict";
import { test } from "node:test";

import { getAcademyRecordingFormat } from "../lib/academy-recording.ts";

test("accepts browser-produced audio MIME types with codec parameters", () => {
  assert.deepEqual(getAcademyRecordingFormat("audio/mp4;codecs=mp4a.40.2"),
    { contentType: "audio/mp4", extension: "m4a" });
  assert.deepEqual(getAcademyRecordingFormat("audio/webm;codecs=opus"),
    { contentType: "audio/webm", extension: "webm" });
  assert.deepEqual(getAcademyRecordingFormat("audio/ogg;codecs=opus"),
    { contentType: "audio/ogg", extension: "ogg" });
});

test("rejects unsupported recording formats", () => {
  assert.equal(getAcademyRecordingFormat(""), null);
  assert.equal(getAcademyRecordingFormat("video/mp4"), null);
  assert.equal(getAcademyRecordingFormat("audio/mpeg"), null);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { replaceAcademyCourseText } from "../lib/academy-find-replace.ts";
import { academyPreviewDevices } from "../lib/academy-preview-devices.ts";

const course = {
  key: "safe-example",
  title: "Science lesson",
  shortTitle: "Science",
  description: "Learn science safely",
  heroImage: "/science.png",
  lessons: [
    {
      id: "lesson-science",
      slug: "science",
      section: "Science",
      title: "Science practice",
      summary: "Science matters",
      blocks: [
        {
          id: "block-science",
          type: "text",
          content: {
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "SCIENCE is useful" }],
              },
            ],
          },
          paragraphs: [],
        },
        {
          id: "image",
          type: "image",
          src: "https://example.com/science.png",
          alt: "Science experiment",
          caption: "Science equipment",
        },
      ],
    },
  ],
  quiz: [
    {
      id: "question",
      prompt: "What is science?",
      options: [{ id: "a", label: "Science" }],
      correctOptionId: "a",
      explanation: "Science is a method",
    },
  ],
};

test("course-wide replacement previews copy without changing IDs or media paths", () => {
  const result = replaceAcademyCourseText(course, "science", "Physics");
  assert.ok(result.changes.length >= 8);
  assert.equal(result.course.title, "Physics lesson");
  assert.equal(
    result.course.lessons[0].blocks[0].content.content[0].content[0].text,
    "Physics is useful",
  );
  assert.equal(result.course.lessons[0].blocks[1].alt, "Physics experiment");
  assert.equal(
    result.course.lessons[0].blocks[1].src,
    "https://example.com/science.png",
  );
  assert.equal(result.course.lessons[0].id, "lesson-science");
  assert.equal(result.course.quiz[0].correctOptionId, "a");
  assert.equal(course.title, "Science lesson");
});

test("case-sensitive replacement is literal and empty searches do nothing", () => {
  assert.equal(
    replaceAcademyCourseText(course, "SCIENCE", "Biology", true).changes.length,
    1,
  );
  assert.equal(
    replaceAcademyCourseText(course, "", "Biology").changes.length,
    0,
  );
  assert.equal(
    replaceAcademyCourseText(course, ".*", "Biology").changes.length,
    0,
  );
});

test("preview covers desktop, both tablet orientations, and both phone orientations", () => {
  assert.equal(academyPreviewDevices.length, 5);
  assert.equal(
    new Set(academyPreviewDevices.map((device) => device.id)).size,
    5,
  );
  for (const device of academyPreviewDevices)
    assert.ok(device.width > 0 && device.height > 0);
  assert.ok(
    academyPreviewDevices.find((device) => device.id === "tablet-portrait")
      .height >
      academyPreviewDevices.find((device) => device.id === "tablet-portrait")
        .width,
  );
  assert.ok(
    academyPreviewDevices.find((device) => device.id === "phone-landscape")
      .width >
      academyPreviewDevices.find((device) => device.id === "phone-landscape")
        .height,
  );
});

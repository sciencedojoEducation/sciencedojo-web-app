import type { AcademyCourse } from "./tutor-academy.ts";

const COPY_FIELDS = new Set([
  "title",
  "shortTitle",
  "description",
  "summary",
  "section",
  "heading",
  "paragraphs",
  "body",
  "prompt",
  "label",
  "quote",
  "attribution",
  "caption",
  "transcript",
  "problem",
  "answer",
  "explanation",
  "alt",
  "lowLabel",
  "highLabel",
  "submitLabel",
  "eyebrow",
  "columns",
  "rows",
  "items",
]);

export type AcademyTextChange = {
  path: string;
  before: string;
  after: string;
  matches: number;
};

export function replaceAcademyCourseText(
  course: AcademyCourse,
  search: string,
  replacement: string,
  caseSensitive = false,
): { course: AcademyCourse; changes: AcademyTextChange[] } {
  if (!search) return { course, changes: [] };
  const expression = new RegExp(
    search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    caseSensitive ? "g" : "gi",
  );
  const changes: AcademyTextChange[] = [];

  function visit(value: unknown, path: string, copyField = false): unknown {
    if (typeof value === "string") {
      if (!copyField) return value;
      const matches = [...value.matchAll(expression)].length;
      if (!matches) return value;
      const after = value.replace(expression, () => replacement);
      changes.push({ path, before: value, after, matches });
      return after;
    }
    if (Array.isArray(value))
      return value.map((item, index) =>
        visit(item, `${path}[${index}]`, copyField),
      );
    if (!value || typeof value !== "object") return value;
    const object = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(object).map(([key, item]) => [
        key,
        visit(
          item,
          path ? `${path}.${key}` : key,
          COPY_FIELDS.has(key) || (key === "text" && object.type === "text"),
        ),
      ]),
    );
  }

  return { course: visit(course, "") as AcademyCourse, changes };
}

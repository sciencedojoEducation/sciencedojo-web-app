import type { GeneratedQuestion } from "./question-generator.ts";

const fields = ["question", "answer", "working", "skill", "difficulty"] as const;

function splitRow(line: string) {
  // Match MathText's parser: every pipe delimits a cell, including escaped pipes.
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
}

function isSeparator(line: string) {
  const cells = splitRow(line);
  return cells.length > 1 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function isMissingCell(cell: string) {
  const visible = cell
    .replace(/\\[()[\]]|\$|[*_`]/g, "")
    .replace(/\\(?:text|mathrm|mathbf)\{([^{}]*)\}/g, "$1")
    .trim();
  return /^(?:|[-–—?…]+|\.{2,}|_{2,}|n\/?a|null|undefined|missing|blank|tbd|todo|unknown|\[\s*\]|\[(?:insert|enter|value|data|temperature)(?:\s+(?:here|value|data))?\]|(?:insert|enter)\s+(?:value|data|temperature)(?:\s+here)?)$/i.test(visible);
}

function validateTables(text: string): { issues: string[]; tableCount: number } {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const issues: string[] = [];
  let tableCount = 0;
  if (/<\/?(?:table|tr|td|th)\b/i.test(text)) issues.push("HTML tables are not supported");

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const next = lines[index + 1];
    if (line.includes("|") && next && isSeparator(next)) {
      tableCount += 1;
      const headers = splitRow(line);
      const width = headers.length;
      if (width !== splitRow(next).length) issues.push("header and separator column counts differ");
      if (headers.some(isMissingCell)) issues.push("table header is missing");
      index += 2;
      let rowCount = 0;
      while (index < lines.length && lines[index].includes("|")) {
        const cells = splitRow(lines[index]);
        rowCount += 1;
        if (isSeparator(lines[index])) issues.push("unexpected table separator in data");
        if (cells.length !== width) issues.push("table row column count differs from header");
        if (cells.some(isMissingCell)) issues.push("table contains missing or placeholder data");
        index += 1;
      }
      if (!rowCount) issues.push("table has no data rows");
      index -= 1;
    } else if (
      /^\s*\|.*\|\s*$/.test(line)
      || (line.includes("|") && next?.includes("|"))
      || isSeparator(line)
    ) {
      issues.push("table-like content has no valid header and separator");
    }
  }
  return { issues, tableCount };
}

export function validateGeneratedQuestionSet(value: unknown, count: number):
  | { valid: true; questions: GeneratedQuestion[] }
  | { valid: false; issues: string[] } {
  if (!value || typeof value !== "object" || !("questions" in value) || !Array.isArray(value.questions)) {
    return { valid: false, issues: ["response must contain a questions array"] };
  }
  if (value.questions.length !== count) {
    return { valid: false, issues: [`expected ${count} questions`] };
  }
  const issues: string[] = [];
  value.questions.forEach((item: unknown, index: number) => {
    const record = item as Record<string, unknown> | null;
    if (!record || typeof record !== "object" || fields.some((field) => typeof record[field] !== "string" || !record[field].trim())) {
      issues.push(`question ${index + 1}: required fields must be non-empty strings`);
      return;
    }
    const question = item as GeneratedQuestion;
    for (const field of ["question", "answer", "working"] as const) {
      const result = validateTables(question[field]);
      issues.push(...result.issues.map((issue) => `question ${index + 1} ${field}: ${issue}`));
      if (field === "question" && !result.tableCount && /\b(?:the|this|following|above|below|given)\s+table\b|\btable\s+(?:shows|below|above|gives|contains)\b/i.test(question.question)) {
        issues.push(`question ${index + 1}: referenced table is missing from the question`);
      }
    }
  });
  return issues.length ? { valid: false, issues: [...new Set(issues)] } : { valid: true, questions: value.questions as GeneratedQuestion[] };
}

/** Returns null after two failed attempts so the server action can use its fallback. */
export async function generateValidatedQuestionSet(options: {
  count: number;
  prompt: string;
  generate: (prompt: string) => Promise<string>;
  format: (question: GeneratedQuestion) => GeneratedQuestion;
  onFailure: (attempt: number, issues: string[]) => void;
}): Promise<GeneratedQuestion[] | null> {
  let feedback: string[] = [];
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const prompt = options.prompt + (attempt === 2
        ? `\n\nThe previous set failed validation: ${feedback.slice(0, 8).join("; ")}. Generate a replacement complete set. Include all source data in the question and fully populated, consistent Markdown tables.`
        : "");
      const parsed: unknown = JSON.parse(await options.generate(prompt));
      const raw = validateGeneratedQuestionSet(parsed, options.count);
      if (!raw.valid) {
        feedback = raw.issues;
      } else {
        const formatted = validateGeneratedQuestionSet({ questions: raw.questions.map(options.format) }, options.count);
        if (formatted.valid) return formatted.questions;
        feedback = formatted.issues;
      }
    } catch (error) {
      feedback = [error instanceof SyntaxError ? "response was not valid JSON" : "generation or formatting failed"];
    }
    options.onFailure(attempt, feedback);
  }
  return null;
}

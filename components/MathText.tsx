import katex from "katex";
import type { ReactNode } from "react";

type MathTextProps = {
  text: string;
  className?: string;
};

type TableBlock = {
  type: "table";
  headers: string[];
  alignments: Array<"left" | "center" | "right">;
  rows: string[][];
};

type TextBlock = {
  type: "text";
  lines: string[];
};

type ContentBlock = TableBlock | TextBlock;

function renderMath(source: string, displayMode: boolean) {
  return katex.renderToString(source, {
    displayMode,
    throwOnError: false,
    trust: false,
    strict: "warn",
  });
}

function findNextDelimiter(text: string, startIndex: number) {
  const inlineIndex = text.indexOf("\\(", startIndex);
  const displayIndex = text.indexOf("\\[", startIndex);

  if (inlineIndex === -1 && displayIndex === -1) return null;
  if (displayIndex === -1 || (inlineIndex !== -1 && inlineIndex < displayIndex)) {
    return { index: inlineIndex, open: "\\(", close: "\\)", displayMode: false };
  }

  return { index: displayIndex, open: "\\[", close: "\\]", displayMode: true };
}

function normalizeMathTextInput(text: string) {
  return text
    .replace(/\$begin:math:text\$/g, "\\(")
    .replace(/\$end:math:text\$/g, "\\)")
    .replace(/\$begin:math:display\$/g, "\\[")
    .replace(/\$end:math:display\$/g, "\\]")
    .replace(/\$\$([\s\S]+?)\$\$/g, (_match, source: string) => `\\[${source.trim()}\\]`)
    .replace(/(^|[^\\])\$([^$\n]+?)\$/g, (_match, prefix: string, source: string) => `${prefix}\\(${source.trim()}\\)`);
}

function renderMathFragments(text: string) {
  const parts: ReactNode[] = [];
  const normalizedText = normalizeMathTextInput(text);
  let cursor = 0;

  while (cursor < normalizedText.length) {
    const delimiter = findNextDelimiter(normalizedText, cursor);

    if (!delimiter) {
      parts.push(normalizedText.slice(cursor));
      break;
    }

    const closeIndex = normalizedText.indexOf(delimiter.close, delimiter.index + delimiter.open.length);

    if (closeIndex === -1) {
      parts.push(normalizedText.slice(cursor));
      break;
    }

    if (delimiter.index > cursor) {
      parts.push(normalizedText.slice(cursor, delimiter.index));
    }

    const source = normalizedText.slice(delimiter.index + delimiter.open.length, closeIndex);
    parts.push(
      <span
        key={`${delimiter.index}-${closeIndex}`}
        className={delimiter.displayMode ? "my-3 block max-w-full overflow-x-auto" : "inline-block max-w-full overflow-x-auto align-middle"}
        dangerouslySetInnerHTML={{
          __html: renderMath(source, delimiter.displayMode),
        }}
      />,
    );

    cursor = closeIndex + delimiter.close.length;
  }

  return parts.length ? parts : normalizedText;
}

function splitTableRow(line: string) {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((cell) => cell.trim());
}

function isSeparatorLine(line: string) {
  const cells = splitTableRow(line);
  return cells.length > 1 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function getAlignments(separatorLine: string): TableBlock["alignments"] {
  return splitTableRow(separatorLine).map((cell) => {
    if (cell.startsWith(":") && cell.endsWith(":")) return "center";
    if (cell.endsWith(":")) return "right";
    return "left";
  });
}

function parseBlocks(text: string): ContentBlock[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: ContentBlock[] = [];
  let pendingText: string[] = [];

  function flushText() {
    const trimmedLines = pendingText.map((line) => line.trim()).filter(Boolean);
    if (trimmedLines.length) {
      blocks.push({ type: "text", lines: trimmedLines });
    }
    pendingText = [];
  }

  for (let index = 0; index < lines.length; index += 1) {
    const currentLine = lines[index];
    const separatorLine = lines[index + 1];

    if (currentLine?.includes("|") && separatorLine && isSeparatorLine(separatorLine)) {
      flushText();

      const headers = splitTableRow(currentLine);
      const alignments = getAlignments(separatorLine);
      const rows: string[][] = [];
      index += 2;

      while (index < lines.length && lines[index].includes("|") && !isSeparatorLine(lines[index])) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }

      index -= 1;
      blocks.push({ type: "table", headers, alignments, rows });
    } else {
      pendingText.push(currentLine);
    }
  }

  flushText();
  return blocks;
}

function alignmentClass(alignment: "left" | "center" | "right") {
  if (alignment === "center") return "text-center";
  if (alignment === "right") return "text-right";
  return "text-left";
}

export default function MathText({ text, className }: MathTextProps) {
  const blocks = parseBlocks(text);

  return (
    <div className={`${className || ""} sd-math-text min-w-0 max-w-full overflow-hidden break-words`}>
      {blocks.map((block, blockIndex) => {
        if (block.type === "table") {
          return (
            <div key={`table-${blockIndex}`} className="my-4 max-w-full overflow-x-auto rounded-xl border border-secondary/10 bg-white">
              <table className="w-max min-w-full max-w-none table-auto border-collapse text-sm">
                <thead className="bg-secondary/[0.04]">
                  <tr>
                    {block.headers.map((header, cellIndex) => (
                      <th
                        key={`${header}-${cellIndex}`}
                        className={`max-w-[18rem] whitespace-normal break-words border-b border-secondary/10 px-4 py-3 align-top font-black text-secondary ${alignmentClass(block.alignments[cellIndex] || "left")}`}
                      >
                        {renderMathFragments(header)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, rowIndex) => (
                    <tr key={`row-${rowIndex}`} className="border-t border-secondary/8 first:border-t-0">
                      {block.headers.map((_, cellIndex) => (
                        <td
                          key={`cell-${rowIndex}-${cellIndex}`}
                          className={`max-w-[18rem] whitespace-normal break-words px-4 py-3 align-top text-secondary/75 ${alignmentClass(block.alignments[cellIndex] || "left")}`}
                        >
                          {renderMathFragments(row[cellIndex] || "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        return (
          <div key={`text-${blockIndex}`} className={`${blockIndex > 0 ? "mt-3 " : ""}min-w-0 max-w-full overflow-hidden break-words`}>
            {block.lines.map((line, lineIndex) => (
              <div key={`${line}-${lineIndex}`} className={`${lineIndex > 0 ? "mt-2 " : ""}min-w-0 max-w-full overflow-hidden break-words`}>
                {renderMathFragments(line)}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

import { academyTextColors } from "./academy-text-colors.ts";
import type { AcademyRichTextDocument } from "./tutor-academy.ts";

type Node = {
  type?: string;
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  content?: Node[];
};

// Add colour to existing emphasis without changing words, layout or other marks.
export function colorNicosWegA1Document(input: AcademyRichTextDocument, models: boolean): AcademyRichTextDocument {
  const document = structuredClone(input);
  function visit(node: Node) {
    if (node.type === "text") {
      const marks = node.marks || [];
      const has = (type: string) => marks.some((mark) => mark.type === type);
      const color = has("underline") || ["Nominativ", "Akkusativ", "Dativ"].includes(node.text || "")
        ? academyTextColors.red
        : has("highlight") ? academyTextColors.blue
        : models && has("bold") ? academyTextColors.green : undefined;
      if (color && !has("textStyle")) node.marks = [...marks, { type: "textStyle", attrs: { color } }];
    }
    node.content?.forEach(visit);
  }
  visit(document as Node);
  return document;
}

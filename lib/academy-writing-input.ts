export type WritingInput =
  | { kind: "blanks"; parts: string[]; hint?: string }
  | { kind: "order"; tokens: string[]; punctuation: string }
  | { kind: "text" };

export function getWritingInput(prompt: string): WritingInput {
  if (/_{2,}/.test(prompt)) {
    const sentence = prompt.replace(/^Complete:\s*/i, "");
    const hint = sentence.match(/(?<=[.!?])\s+\(([^)]+)\)$/);
    return { kind: "blanks", parts: (hint ? sentence.slice(0, hint.index) : sentence).split(/_{2,}/), ...(hint ? { hint: hint[1] } : {}) };
  }
  const order = prompt.match(/^Put in order:\s*(.+)$/i);
  if (order) {
    const punctuation = order[1].match(/[.!?]$/)?.[0] || "";
    const tokens = order[1].replace(/[.!?]$/, "").split(/\s*\/\s*/).map(word => word.trim()).filter(Boolean);
    if (tokens.length > 1) return { kind: "order", tokens, punctuation };
  }
  return { kind: "text" };
}

const escapePattern = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function readBlankAnswer(parts: string[], text: string): string[] | null {
  if (!text) return parts.slice(1).map(() => "");
  const match = text.replace(/^Complete:\s*/i, "").match(new RegExp(`^${parts.map(escapePattern).join("(.*?)")}$`, "is"));
  if (match) return match.slice(1);
  // Older activities saved only the missing word, rather than the completed prompt.
  if (parts.length === 2 && !/\s/.test(text.trim())) return [text.trim()];
  return null;
}

export function assembleBlankAnswer(parts: string[], values: string[]): string {
  if (values.every(value => !value.trim())) return "";
  return parts.map((part, index) => part + (values[index] || "")).join("");
}

export function assembleWordAnswer(tokens: string[], selected: number[], punctuation: string): string {
  const sentence = selected.map(index => tokens[index]).join(" ");
  return sentence ? sentence[0].toLocaleUpperCase("de") + sentence.slice(1) + punctuation : "";
}

export function readWordAnswer(tokens: string[], text: string): number[] | null {
  let remaining = text.trim().replace(/[.!?]$/, "");
  const selected: number[] = [];
  while (remaining) {
    const candidates = tokens.map((token, index) => ({ token, index }))
      .filter(({ index }) => !selected.includes(index))
      .sort((a, b) => b.token.length - a.token.length);
    const next = candidates.find(({ token }) => remaining.toLocaleLowerCase("de") === token.toLocaleLowerCase("de") || remaining.toLocaleLowerCase("de").startsWith(token.toLocaleLowerCase("de") + " "));
    if (!next) return null;
    selected.push(next.index);
    remaining = remaining.slice(next.token.length).trimStart();
  }
  return selected;
}

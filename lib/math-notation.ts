export function normalizeMalformedLatexCommands(text: string) {
  return text.replace(/\\rac(?=\s*\{)/g, "\\frac");
}

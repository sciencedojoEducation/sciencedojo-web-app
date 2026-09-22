import katex from "katex";

export default function AcademyMath({
  latex,
  display = false,
  label,
  description,
}: {
  latex: string;
  display?: boolean;
  label?: string;
  description?: string;
}) {
  let html: string | null = null;
  try {
    html = katex.renderToString(latex, {
      displayMode: display,
      throwOnError: false,
      strict: "warn",
      trust: false,
      output: "htmlAndMathml",
    });
  } catch {
    html = null;
  }
  if (!html) return <code className="font-mono text-[#173A63]">{latex}</code>;
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      className={display ? "block" : "inline"}
    >
      <span
        aria-hidden={label ? "true" : undefined}
        className={
          display
            ? "sd-math-text block overflow-x-auto py-2 text-center"
            : "sd-math-text inline"
        }
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {description ? <span className="sr-only">{description}</span> : null}
    </span>
  );
}

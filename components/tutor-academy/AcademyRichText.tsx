import type { AcademyRichTextDocument } from "@/lib/tutor-academy";
import AcademyMath from "@/components/tutor-academy/AcademyMath";

type RichNode = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: Array<{ type?: string; attrs?: Record<string, unknown> }>;
  content?: RichNode[];
};

function renderChildren(
  nodes: RichNode[] | undefined,
  key: string,
): React.ReactNode {
  return nodes?.map((node, index) => renderNode(node, `${key}-${index}`));
}

function safeLink(href: string) {
  if (href.startsWith("/") || href.startsWith("#")) return href;
  try {
    const url = new URL(href);
    return new Set(["https:", "http:", "mailto:"]).has(url.protocol)
      ? href
      : null;
  } catch {
    return null;
  }
}

function renderNode(node: RichNode, key: string): React.ReactNode {
  if (node.type === "text") {
    let content: React.ReactNode = node.text || "";
    for (const mark of node.marks || []) {
      if (mark.type === "bold") content = <strong>{content}</strong>;
      if (mark.type === "italic") content = <em>{content}</em>;
      if (mark.type === "strike") content = <s>{content}</s>;
      if (mark.type === "code")
        content = (
          <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.9em]">
            {content}
          </code>
        );
      if (mark.type === "link" && typeof mark.attrs?.href === "string") {
        const href = safeLink(mark.attrs.href);
        if (href)
          content = (
            <a
              href={href}
              className="font-semibold text-[#1E5AA8] underline underline-offset-4"
              rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
            >
              {content}
            </a>
          );
      }
    }
    return <span key={key}>{content}</span>;
  }
  const children = renderChildren(node.content, key);
  if (node.type === "heading") {
    const level = Number(node.attrs?.level || 2);
    if (level === 3)
      return (
        <h3 key={key} className="text-2xl font-bold leading-8 text-[#101010]">
          {children}
        </h3>
      );
    return (
      <h2
        key={key}
        className="text-[28px] font-bold leading-9 tracking-[-0.02em] text-[#101010] sm:text-[32px] sm:leading-10"
      >
        {children}
      </h2>
    );
  }
  if (node.type === "paragraph")
    return (
      <p
        key={key}
        className="font-[family-name:var(--font-academy-serif)] text-[17px] leading-[30px] text-[#36373A] sm:leading-[33px]"
      >
        {children}
      </p>
    );
  if (node.type === "bulletList")
    return (
      <ul
        key={key}
        className="list-disc space-y-2 pl-6 font-[family-name:var(--font-academy-serif)] text-[17px] leading-8 text-[#36373A]"
      >
        {children}
      </ul>
    );
  if (node.type === "orderedList")
    return (
      <ol
        key={key}
        className="list-decimal space-y-2 pl-6 font-[family-name:var(--font-academy-serif)] text-[17px] leading-8 text-[#36373A]"
      >
        {children}
      </ol>
    );
  if (node.type === "listItem") return <li key={key}>{children}</li>;
  if (node.type === "blockquote")
    return (
      <blockquote
        key={key}
        className="border-l-4 border-[#1E5AA8] pl-6 text-xl italic text-[#36373A]"
      >
        {children}
      </blockquote>
    );
  if (node.type === "codeBlock")
    return (
      <pre
        key={key}
        className="overflow-x-auto bg-[#101820] p-5 text-sm text-white"
      >
        <code>{children}</code>
      </pre>
    );
  if (node.type === "hardBreak") return <br key={key} />;
  if (node.type === "inlineMath" || node.type === "blockMath")
    return (
      <AcademyMath
        key={key}
        latex={String(node.attrs?.latex || "")}
        display={node.type === "blockMath"}
        label={
          typeof node.attrs?.ariaLabel === "string"
            ? node.attrs.ariaLabel
            : undefined
        }
        description={
          typeof node.attrs?.description === "string"
            ? node.attrs.description
            : undefined
        }
      />
    );
  return <span key={key}>{children}</span>;
}

export default function AcademyRichText({
  document,
  className = "",
}: {
  document: AcademyRichTextDocument;
  className?: string;
}) {
  return (
    <div className={`space-y-5 ${className}`}>
      {renderChildren(document.content as RichNode[] | undefined, "root")}
    </div>
  );
}

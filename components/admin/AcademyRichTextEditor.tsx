"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Mathematics from "@tiptap/extension-mathematics";
import {
  Bold,
  Code,
  Heading2,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Sigma,
} from "lucide-react";
import type { AcademyRichTextDocument } from "@/lib/tutor-academy";

export function paragraphsToRichText(
  heading: string | undefined,
  paragraphs: string[],
): AcademyRichTextDocument {
  return {
    type: "doc",
    content: [
      ...(heading
        ? [
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: heading }],
            },
          ]
        : []),
      ...paragraphs.map((paragraph) => ({
        type: "paragraph",
        content: paragraph ? [{ type: "text", text: paragraph }] : [],
      })),
    ],
  };
}

export default function AcademyRichTextEditor({
  value,
  onChange,
  active = false,
  layout = "single",
}: {
  value: AcademyRichTextDocument;
  onChange: (value: AcademyRichTextDocument) => void;
  active?: boolean;
  layout?: "single" | "two-column";
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder: "Start writing…" }),
      Mathematics.configure({ katexOptions: { throwOnError: false } }),
    ],
    content: value,
    onUpdate: ({ editor: current }) =>
      onChange(current.getJSON() as AcademyRichTextDocument),
    editorProps: {
      attributes: {
        class:
          "min-h-32 space-y-3 px-1 py-2 text-[17px] leading-8 outline-none [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:text-xl [&_h3]:font-bold [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4",
      },
    },
  });
  useEffect(() => {
    if (!editor) return;
    if (JSON.stringify(editor.getJSON()) !== JSON.stringify(value)) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);
  if (!editor) return <div className="min-h-52 animate-pulse bg-slate-50" />;
  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const href = window.prompt("Link URL", previous || "https://");
    if (href === null) return;
    if (!href) editor.chain().focus().unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  };
  const insertMath = () => {
    const latex = window.prompt("LaTeX equation", "x^2 + y^2 = z^2");
    if (latex) editor.chain().focus().insertInlineMath({ latex }).run();
  };
  const buttons = [
    {
      label: "Bold",
      icon: Bold,
      active: editor.isActive("bold"),
      run: () => editor.chain().focus().toggleBold().run(),
    },
    {
      label: "Italic",
      icon: Italic,
      active: editor.isActive("italic"),
      run: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      label: "Heading",
      icon: Heading2,
      active: editor.isActive("heading", { level: 2 }),
      run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: "Bulleted list",
      icon: List,
      active: editor.isActive("bulletList"),
      run: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: "Numbered list",
      icon: ListOrdered,
      active: editor.isActive("orderedList"),
      run: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      label: "Quote",
      icon: Quote,
      active: editor.isActive("blockquote"),
      run: () => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      label: "Code",
      icon: Code,
      active: editor.isActive("code"),
      run: () => editor.chain().focus().toggleCode().run(),
    },
    {
      label: "Link",
      icon: Link2,
      active: editor.isActive("link"),
      run: setLink,
    },
    {
      label: "Equation",
      icon: Sigma,
      active: editor.isActive("inlineMath"),
      run: insertMath,
    },
  ];
  return (
    <div
      className={`min-w-0 bg-transparent ${active ? "ring-2 ring-primary/10" : ""}`}
    >
      {active ? (
        <div
          role="toolbar"
          aria-label="Text formatting"
          className="mb-4 inline-flex min-h-14 w-fit max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-secondary/15 bg-white p-1.5 align-top shadow-sm"
        >
          {buttons.map(({ label, icon: Icon, active, run }) => (
            <button
              key={label}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={run}
              aria-label={label}
              aria-pressed={active}
              className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary ${active ? "bg-[#163D73] text-white ring-2 ring-inset ring-[#0E2D59]" : "text-secondary/55 hover:bg-slate-100 active:bg-slate-200"}`}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>
      ) : null}
      <div
        className={
          layout === "two-column"
            ? "[&_.ProseMirror]:md:columns-2 [&_.ProseMirror]:md:gap-10 [&_.ProseMirror>*]:break-inside-avoid"
            : ""
        }
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

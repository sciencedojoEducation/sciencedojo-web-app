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
}: {
  value: AcademyRichTextDocument;
  onChange: (value: AcademyRichTextDocument) => void;
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
          "min-h-44 space-y-3 px-5 py-4 text-[17px] leading-8 outline-none [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:text-xl [&_h3]:font-bold [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4",
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
    <div className="overflow-hidden rounded-xl border border-secondary/15 bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
      <div className="flex flex-wrap gap-1 border-b border-secondary/10 bg-slate-50 p-2">
        {buttons.map(({ label, icon: Icon, active, run }) => (
          <button
            key={label}
            type="button"
            onClick={run}
            aria-label={label}
            aria-pressed={active}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${active ? "bg-primary text-white" : "text-secondary/55 hover:bg-white"}`}
          >
            <Icon size={16} />
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

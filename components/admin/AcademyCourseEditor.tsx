"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import {
  Archive,
  ArrowDown,
  ArrowUp,
  BookOpen,
  ChevronDown,
  Clock3,
  Columns3,
  Copy,
  Eye,
  GripVertical,
  History,
  Menu,
  Palette,
  Pencil,
  Plus,
  Redo2,
  RotateCcw,
  Save,
  Search,
  Settings2,
  SlidersHorizontal,
  Trash2,
  Undo2,
  Upload,
  X,
} from "lucide-react";
import AcademyLessonBlocks from "@/components/tutor-academy/AcademyLessonBlocks";
import AcademyBlockIcon from "@/components/admin/academy-builder/AcademyBlockIcon";
import BlockInsertionTray from "@/components/admin/academy-builder/BlockInsertionTray";
import AcademyRichTextEditor, {
  paragraphsToRichText,
} from "@/components/admin/AcademyRichTextEditor";
import {
  archiveAcademyCourse,
  deleteAcademyMedia,
  discardAcademyDraftV2,
  duplicateAcademyCourse,
  publishAcademyCourseV2,
  restoreAcademySnapshot,
  saveAcademyCourseDraft,
  uploadAcademyMedia,
  type AcademyAdminActionResult,
} from "@/app/dashboard/admin/academy/actions";
import { academySlugify } from "@/lib/academy-course-validation";
import {
  academyBlockRegistry,
  createAcademyId,
  createAcademyLesson,
  createQuestion,
  getAcademyBlockDefinition,
  migrateAcademyCourse,
} from "@/lib/academy-schema";
import { useAcademyEditorStore } from "@/lib/academy-editor-store";
import {
  deleteAcademyRecoveryDraft,
  readAcademyRecoveryDraft,
  writeAcademyRecoveryDraft,
  type AcademyRecoveryDraft,
} from "@/lib/academy-draft-recovery";
import type {
  AcademyAudienceRole,
  AcademyCourse,
  AcademyLesson,
  LessonBlock,
  QuizQuestion,
} from "@/lib/tutor-academy";

type Snapshot = {
  id: string;
  draft_revision: number;
  schema_version: number;
  reason: string;
  created_at: string;
  created_by: string | null;
};
type Media = {
  id?: string;
  path: string;
  name: string;
  url: string;
  mediaType?: "image" | "document";
  mimeType?: string;
  byteSize?: number;
  altText?: string | null;
};

const inputClass =
  "min-h-10 w-full rounded-lg border border-secondary/15 bg-white px-3 text-sm text-secondary outline-none focus:border-primary focus:ring-2 focus:ring-primary/10";
const textareaClass = `${inputClass} py-2.5 leading-6`;
const audienceOptions: Array<{ value: AcademyAudienceRole; label: string }> = [
  { value: "tutor_applicant", label: "Tutor applicants" },
  { value: "tutor", label: "Tutors" },
  { value: "student", label: "Students" },
  { value: "parent", label: "Parents" },
];

function useDialogFocus(active: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    if (!active) return;
    const container = ref.current;
    const focusable = container?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    focusable?.[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeRef.current();
        return;
      }
      if (event.key !== "Tab" || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [active]);
  return ref;
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.13em] text-secondary/45">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="mt-1 block text-[11px] leading-4 text-secondary/45">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

function SaveState({
  state,
  savedAt,
  message,
}: {
  state: string;
  savedAt: string | null;
  message: string;
}) {
  const label =
    state === "saving"
      ? "Saving…"
      : state === "dirty"
        ? "Unsaved changes"
        : state === "conflict"
          ? "Save conflict"
          : state === "offline"
            ? "Offline — recovery stored"
            : state === "error"
              ? "Save failed"
              : savedAt
                ? `Saved ${new Date(savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                : "Saved";
  return (
    <div className="flex items-center gap-2 text-xs font-bold text-secondary/55">
      <span
        className={`h-2 w-2 rounded-full ${state === "saved" ? "bg-emerald-500" : state === "saving" ? "animate-pulse bg-amber-500" : state === "conflict" || state === "error" ? "bg-red-500" : "bg-amber-500"}`}
      />
      <span>{message || label}</span>
    </div>
  );
}

type TextPreset =
  | "paragraph"
  | "paragraph-heading"
  | "paragraph-subheading"
  | "heading"
  | "subheading"
  | "two-column"
  | "statement"
  | "note";

const textPresets: Array<{
  value: TextPreset;
  label: string;
  description: string;
}> = [
  { value: "paragraph", label: "Paragraph", description: "Body copy" },
  {
    value: "paragraph-heading",
    label: "Paragraph with heading",
    description: "Heading and body copy",
  },
  {
    value: "paragraph-subheading",
    label: "Paragraph with subheading",
    description: "Subheading and body copy",
  },
  { value: "heading", label: "Heading", description: "Primary section title" },
  {
    value: "subheading",
    label: "Subheading",
    description: "Secondary section title",
  },
  {
    value: "two-column",
    label: "Two columns",
    description: "Responsive editorial columns",
  },
  { value: "statement", label: "Statement", description: "Editorial quote" },
  { value: "note", label: "Note", description: "Highlighted callout" },
];

function TextPresetPicker({
  onApply,
  onClose,
}: {
  onApply: (preset: TextPreset) => void;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    panelRef.current?.querySelector<HTMLElement>("button")?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);
  return (
    <div
      ref={panelRef}
      className="absolute left-0 top-12 z-40 w-[min(310px,calc(100vw-3rem))] overflow-hidden rounded-xl border border-secondary/15 bg-white text-left shadow-2xl sm:left-12 sm:top-0"
      role="dialog"
      aria-label="Text layout"
    >
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-primary/60">
            Text layout
          </p>
          <p className="text-sm font-black">Choose a presentation</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Close text layout"
        >
          <X size={17} />
        </button>
      </div>
      <div className="max-h-[min(560px,70vh)] overflow-y-auto p-2">
        {textPresets.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => onApply(preset.value)}
            className="grid min-h-16 w-full grid-cols-[1fr_88px] items-center gap-4 rounded-lg px-3 py-2 text-left outline-none hover:bg-[#F3F4F6] focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span>
              <strong className="block text-sm">{preset.label}</strong>
              <span className="mt-0.5 block text-[11px] text-secondary/45">
                {preset.description}
              </span>
            </span>
            <span
              className={`block rounded border border-secondary/10 bg-white p-2 ${preset.value === "two-column" ? "grid grid-cols-2 gap-1" : ""}`}
              aria-hidden="true"
            >
              {preset.value.includes("heading") || preset.value === "heading" ? (
                <span className="mb-1 block h-1.5 w-8 rounded-full bg-secondary/70" />
              ) : null}
              <span className="block space-y-1">
                <span className="block h-1 w-full rounded-full bg-secondary/20" />
                <span className="block h-1 w-4/5 rounded-full bg-secondary/20" />
                <span className="block h-1 w-3/5 rounded-full bg-secondary/20" />
              </span>
              {preset.value === "two-column" ? (
                <span className="block space-y-1">
                  <span className="block h-1 w-full rounded-full bg-secondary/20" />
                  <span className="block h-1 w-4/5 rounded-full bg-secondary/20" />
                  <span className="block h-1 w-3/5 rounded-full bg-secondary/20" />
                </span>
              ) : null}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function DraggableBlockFrame({
  block,
  lessonId,
  index,
  selected,
  onSelect,
  onEdit,
  onMove,
  onMoveDirection,
  onDuplicate,
  onDelete,
  onOpenSettings,
  onApplyTextPreset,
  children,
}: {
  block: LessonBlock;
  lessonId: string;
  index: number;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onMove: (from: number, to: number) => void;
  onMoveDirection: (direction: -1 | 1) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onOpenSettings: () => void;
  onApplyTextPreset: (preset: TextPreset) => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLButtonElement>(null);
  const [dragging, setDragging] = useState(false);
  const [presetOpen, setPresetOpen] = useState(false);
  const presetButtonRef = useRef<HTMLButtonElement>(null);
  const closePreset = () => {
    setPresetOpen(false);
    window.requestAnimationFrame(() => presetButtonRef.current?.focus());
  };
  useEffect(() => {
    const element = ref.current;
    const handle = handleRef.current;
    if (!element || !handle) return;
    return combine(
      draggable({
        element,
        dragHandle: handle,
        getInitialData: () => ({ type: "academy-block", lessonId, index }),
        onDragStart: () => setDragging(true),
        onDrop: () => setDragging(false),
      }),
      dropTargetForElements({
        element,
        canDrop: ({ source }) =>
          source.data.type === "academy-block" &&
          source.data.lessonId === lessonId,
        getData: () => ({ index }),
        onDrop: ({ source }) => {
          const from = Number(source.data.index);
          if (from !== index) onMove(from, index);
        },
      }),
    );
  }, [index, lessonId, onMove]);
  return (
    <div
      ref={ref}
      data-block-id={block.id}
      onClick={onSelect}
      className={`group relative rounded-sm outline outline-2 outline-offset-[10px] transition-opacity motion-reduce:transition-none ${dragging ? "opacity-40" : ""} ${selected ? "outline-primary" : "outline-transparent hover:outline-primary/25"}`}
    >
      <div
        role="toolbar"
        aria-label={`${getAcademyBlockDefinition(block.type).label} block actions`}
        className={`absolute -top-14 left-0 z-30 flex items-center gap-1 rounded-xl border border-secondary/15 bg-white p-1 shadow-lg transition-opacity motion-reduce:transition-none sm:-left-[76px] sm:top-0 sm:flex-col ${selected ? "opacity-100" : "pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"}`}
      >
        <button
          ref={handleRef}
          type="button"
          aria-label={`Move ${getAcademyBlockDefinition(block.type).label}`}
          className="inline-flex h-10 w-10 cursor-grab items-center justify-center rounded-lg text-secondary/45 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-primary"
        >
          <GripVertical size={16} />
        </button>
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${getAcademyBlockDefinition(block.type).label}`}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-secondary/45 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Pencil size={16} />
        </button>
        <button
          ref={presetButtonRef}
          type="button"
          onClick={() =>
            block.type === "text"
              ? setPresetOpen((value) => !value)
              : onOpenSettings()
          }
          aria-label={block.type === "text" ? "Change text style" : "Edit block style"}
          aria-expanded={block.type === "text" ? presetOpen : undefined}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-secondary/45 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Palette size={16} />
        </button>
        <button
          type="button"
          onClick={() =>
            block.type === "text"
              ? setPresetOpen((value) => !value)
              : onOpenSettings()
          }
          aria-label="Change block layout"
          className="hidden h-10 w-10 items-center justify-center rounded-lg text-secondary/45 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-primary sm:inline-flex"
        >
          <Columns3 size={16} />
        </button>
        <button
          type="button"
          onClick={onDuplicate}
          aria-label="Duplicate block"
          className="hidden h-10 w-10 items-center justify-center rounded-lg text-secondary/45 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-primary sm:inline-flex"
        >
          <Copy size={16} />
        </button>
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Open advanced block settings"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-secondary/45 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-primary"
        >
          <SlidersHorizontal size={16} />
        </button>
        <div className="hidden border-t border-secondary/10 pt-1 sm:block">
          <button
            type="button"
            onClick={() => onMoveDirection(-1)}
            aria-label="Move block up"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-secondary/45 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ArrowUp size={16} />
          </button>
          <button
            type="button"
            onClick={() => onMoveDirection(1)}
            aria-label="Move block down"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-secondary/45 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ArrowDown size={16} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete block"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-red-500 outline-none hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <Trash2 size={16} />
          </button>
        </div>
        {presetOpen && selected && block.type === "text" ? (
          <TextPresetPicker
            onClose={closePreset}
            onApply={(preset) => {
              onApplyTextPreset(preset);
              closePreset();
            }}
          />
        ) : null}
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}

function ItemEditor({
  items,
  onChange,
  kind,
}: {
  items: Array<Record<string, unknown>>;
  onChange: (items: Array<Record<string, unknown>>) => void;
  kind: "standard" | "media" | "gallery" | "resource";
}) {
  const add = () =>
    onChange([
      ...items,
      kind === "resource"
        ? {
            id: createAcademyId("item"),
            title: "Resource",
            description: "",
            url: "",
          }
        : kind === "gallery"
          ? { id: createAcademyId("item"), src: "", alt: "", caption: "" }
          : kind === "media"
            ? {
                id: createAcademyId("item"),
                eyebrow: "",
                title: "New card",
                body: "",
                src: "",
                alt: "",
              }
            : { id: createAcademyId("item"), title: "New item", body: "" },
    ]);
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div
          key={String(item.id || index)}
          className="rounded-xl border border-secondary/10 bg-slate-50 p-3"
        >
          <div className="mb-3 flex items-center justify-between">
            <strong className="text-xs text-secondary/50">
              Item {index + 1}
            </strong>
            <button
              type="button"
              onClick={() =>
                onChange(items.filter((_, itemIndex) => itemIndex !== index))
              }
              aria-label={`Remove item ${index + 1}`}
              className="text-red-500"
            >
              <Trash2 size={15} />
            </button>
          </div>
          <div className="space-y-3">
            {kind !== "gallery" ? (
              <Field label="Title">
                <input
                  className={inputClass}
                  value={String(item.title || "")}
                  onChange={(event) =>
                    onChange(
                      items.map((current, itemIndex) =>
                        itemIndex === index
                          ? { ...current, title: event.target.value }
                          : current,
                      ),
                    )
                  }
                />
              </Field>
            ) : null}
            {kind === "media" ? (
              <Field label="Eyebrow">
                <input
                  className={inputClass}
                  value={String(item.eyebrow || "")}
                  onChange={(event) =>
                    onChange(
                      items.map((current, itemIndex) =>
                        itemIndex === index
                          ? { ...current, eyebrow: event.target.value }
                          : current,
                      ),
                    )
                  }
                />
              </Field>
            ) : null}
            {kind === "standard" || kind === "media" ? (
              <Field label="Body">
                <textarea
                  rows={3}
                  className={textareaClass}
                  value={String(item.body || "")}
                  onChange={(event) =>
                    onChange(
                      items.map((current, itemIndex) =>
                        itemIndex === index
                          ? { ...current, body: event.target.value }
                          : current,
                      ),
                    )
                  }
                />
              </Field>
            ) : null}
            {kind === "resource" ? (
              <>
                <Field label="Description">
                  <textarea
                    rows={2}
                    className={textareaClass}
                    value={String(item.description || "")}
                    onChange={(event) =>
                      onChange(
                        items.map((current, itemIndex) =>
                          itemIndex === index
                            ? { ...current, description: event.target.value }
                            : current,
                        ),
                      )
                    }
                  />
                </Field>
                <Field label="URL">
                  <input
                    className={inputClass}
                    value={String(item.url || "")}
                    onChange={(event) =>
                      onChange(
                        items.map((current, itemIndex) =>
                          itemIndex === index
                            ? { ...current, url: event.target.value }
                            : current,
                        ),
                      )
                    }
                  />
                </Field>
              </>
            ) : null}
            {kind === "media" || kind === "gallery" ? (
              <>
                <Field label="Image URL">
                  <input
                    className={inputClass}
                    value={String(item.src || "")}
                    onChange={(event) =>
                      onChange(
                        items.map((current, itemIndex) =>
                          itemIndex === index
                            ? { ...current, src: event.target.value }
                            : current,
                        ),
                      )
                    }
                  />
                </Field>
                <Field label="Alt text">
                  <input
                    className={inputClass}
                    value={String(item.alt || "")}
                    onChange={(event) =>
                      onChange(
                        items.map((current, itemIndex) =>
                          itemIndex === index
                            ? { ...current, alt: event.target.value }
                            : current,
                        ),
                      )
                    }
                  />
                </Field>
                <Field label="Caption">
                  <input
                    className={inputClass}
                    value={String(item.caption || "")}
                    onChange={(event) =>
                      onChange(
                        items.map((current, itemIndex) =>
                          itemIndex === index
                            ? { ...current, caption: event.target.value }
                            : current,
                        ),
                      )
                    }
                  />
                </Field>
              </>
            ) : null}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-2 text-xs font-black text-primary"
      >
        <Plus size={14} />
        Add item
      </button>
    </div>
  );
}

function QuestionEditor({
  question,
  onChange,
}: {
  question: QuizQuestion;
  onChange: (question: QuizQuestion) => void;
}) {
  const type = question.type || "single-choice";
  return (
    <div className="space-y-4">
      <Field label="Question type">
        <select
          className={inputClass}
          value={type}
          onChange={(event) =>
            onChange({
              ...question,
              type: event.target.value as QuizQuestion["type"],
              options:
                event.target.value === "reflection"
                  ? []
                  : question.options.length
                    ? question.options
                    : createQuestion("single-choice").options,
            })
          }
        >
          <option value="single-choice">Single choice</option>
          <option value="multiple-response">Multiple response</option>
          <option value="reflection">Reflection</option>
        </select>
      </Field>
      <Field label="Prompt">
        <textarea
          rows={3}
          className={textareaClass}
          value={question.prompt}
          onChange={(event) =>
            onChange({ ...question, prompt: event.target.value })
          }
        />
      </Field>
      {type !== "reflection" ? (
        <div className="space-y-2">
          {question.options.map((option, index) => (
            <div
              key={option.id}
              className="grid grid-cols-[28px_1fr_32px] items-center gap-2"
            >
              <input
                type={type === "multiple-response" ? "checkbox" : "radio"}
                aria-label={`Mark answer ${index + 1} correct`}
                checked={
                  type === "multiple-response"
                    ? (question.correctOptionIds || []).includes(option.id)
                    : question.correctOptionId === option.id
                }
                onChange={() =>
                  onChange(
                    type === "multiple-response"
                      ? {
                          ...question,
                          correctOptionIds: (
                            question.correctOptionIds || []
                          ).includes(option.id)
                            ? (question.correctOptionIds || []).filter(
                                (id) => id !== option.id,
                              )
                            : [...(question.correctOptionIds || []), option.id],
                        }
                      : { ...question, correctOptionId: option.id },
                  )
                }
              />
              <input
                className={inputClass}
                value={option.label}
                onChange={(event) =>
                  onChange({
                    ...question,
                    options: question.options.map((current, optionIndex) =>
                      optionIndex === index
                        ? { ...current, label: event.target.value }
                        : current,
                    ),
                  })
                }
              />
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...question,
                    options: question.options.filter(
                      (_, optionIndex) => optionIndex !== index,
                    ),
                  })
                }
                aria-label={`Remove answer ${index + 1}`}
                className="text-red-500"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              onChange({
                ...question,
                options: [
                  ...question.options,
                  { id: createAcademyId("option"), label: "New answer" },
                ],
              })
            }
            className="text-xs font-black text-primary"
          >
            <Plus size={13} className="mr-1 inline" />
            Add answer
          </button>
        </div>
      ) : null}
      <Field
        label={
          type === "reflection" ? "Reflection guidance" : "Answer explanation"
        }
      >
        <textarea
          rows={3}
          className={textareaClass}
          value={question.explanation}
          onChange={(event) =>
            onChange({ ...question, explanation: event.target.value })
          }
        />
      </Field>
    </div>
  );
}

function BlockInspector({
  block,
  onChange,
  onDelete,
  onDuplicate,
  onMove,
  mediaLibrary,
}: {
  block: LessonBlock;
  onChange: (block: LessonBlock) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMove: (direction: -1 | 1) => void;
  mediaLibrary: Media[];
}) {
  const tab = useAcademyEditorStore((state) => state.inspectorTab);
  const setTab = useAcademyEditorStore((state) => state.setInspectorTab);
  const updateItems = (items: Array<Record<string, unknown>>) =>
    onChange({ ...block, items } as LessonBlock);
  return (
    <>
      <div className="border-b border-secondary/10 px-5 py-4">
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-primary/60">
          Selected block
        </p>
        <div className="mt-1 flex items-center justify-between">
          <h2 className="text-lg font-black text-secondary">
            {getAcademyBlockDefinition(block.type).label}
          </h2>
          <div className="flex">
            <button
              type="button"
              onClick={() => onMove(-1)}
              aria-label="Move block up"
              className="p-2 text-secondary/45"
            >
              <ArrowUp size={15} />
            </button>
            <button
              type="button"
              onClick={() => onMove(1)}
              aria-label="Move block down"
              className="p-2 text-secondary/45"
            >
              <ArrowDown size={15} />
            </button>
            <button
              type="button"
              onClick={onDuplicate}
              aria-label="Duplicate block"
              className="p-2 text-secondary/45"
            >
              <Copy size={15} />
            </button>
            <button
              type="button"
              onClick={onDelete}
              aria-label="Delete block"
              className="p-2 text-red-500"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-4 border-b border-secondary/10">
        {(["content", "design", "accessibility", "logic"] as const).map(
          (item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`border-b-2 px-1 py-3 text-[9px] font-black uppercase tracking-[0.08em] ${tab === item ? "border-primary text-primary" : "border-transparent text-secondary/40"}`}
            >
              {item}
            </button>
          ),
        )}
      </div>
      <div className="space-y-4 overflow-y-auto p-5">
        {tab === "logic" ? (
          <>
            <Field label="Completion">
              <select
                className={inputClass}
                value={block.completion || "view"}
                onChange={(event) =>
                  onChange({
                    ...block,
                    completion: event.target.value as LessonBlock["completion"],
                  })
                }
              >
                <option value="view">Complete on view</option>
                <option value="interact">Complete on interaction</option>
                <option value="pass">Complete on pass</option>
              </select>
            </Field>
            {block.type === "knowledge-check" ? (
              <label className="flex items-center gap-2 text-sm font-bold">
                <input
                  type="checkbox"
                  checked={Boolean(block.required)}
                  onChange={(event) =>
                    onChange({ ...block, required: event.target.checked })
                  }
                />
                Required to complete lesson
              </label>
            ) : null}
          </>
        ) : null}
        {tab === "design" ? (
          block.type === "image" ? (
            <>
              <Field label="Width">
                <select
                  className={inputClass}
                  value={block.width || "wide"}
                  onChange={(event) =>
                    onChange({
                      ...block,
                      width: event.target.value as typeof block.width,
                    })
                  }
                >
                  <option value="reading">Reading width</option>
                  <option value="wide">Wide</option>
                  <option value="full">Full bleed</option>
                </select>
              </Field>
              <Field label="Aspect">
                <select
                  className={inputClass}
                  value={block.aspect || "wide"}
                  onChange={(event) =>
                    onChange({
                      ...block,
                      aspect: event.target.value as typeof block.aspect,
                    })
                  }
                >
                  <option value="wide">Wide</option>
                  <option value="landscape">Landscape</option>
                  <option value="square">Square</option>
                </select>
              </Field>
            </>
          ) : (
            <p className="text-sm leading-6 text-secondary/50">
              This block inherits the course theme so learner output stays
              consistent and accessible.
            </p>
          )
        ) : null}
        {tab === "accessibility" ? (
          <>
            {block.type === "image" ? (
              <>
                <label className="flex items-center gap-2 text-sm font-bold">
                  <input
                    type="checkbox"
                    checked={Boolean(block.decorative)}
                    onChange={(event) =>
                      onChange({
                        ...block,
                        decorative: event.target.checked,
                        alt: event.target.checked ? "" : block.alt,
                      })
                    }
                  />
                  Decorative image
                </label>
                {!block.decorative ? (
                  <Field label="Alt text">
                    <textarea
                      rows={3}
                      className={textareaClass}
                      value={block.alt}
                      onChange={(event) =>
                        onChange({ ...block, alt: event.target.value })
                      }
                    />
                  </Field>
                ) : null}
              </>
            ) : null}
            {block.type === "video" || block.type === "audio" ? (
              <Field label="Transcript">
                <textarea
                  rows={8}
                  className={textareaClass}
                  value={block.transcript || ""}
                  onChange={(event) =>
                    onChange({ ...block, transcript: event.target.value })
                  }
                />
              </Field>
            ) : null}
            {block.type !== "image" &&
            block.type !== "video" &&
            block.type !== "audio" ? (
              <p className="text-sm leading-6 text-secondary/50">
                Semantic headings, keyboard controls, focus order, and reduced
                motion are supplied by the shared learner renderer.
              </p>
            ) : null}
          </>
        ) : null}
        {tab === "content" ? (
          <BlockContentFields
            block={block}
            onChange={onChange}
            updateItems={updateItems}
            mediaLibrary={mediaLibrary}
          />
        ) : null}
      </div>
    </>
  );
}

function BlockContentFields({
  block,
  onChange,
  updateItems,
  mediaLibrary,
}: {
  block: LessonBlock;
  onChange: (block: LessonBlock) => void;
  updateItems: (items: Array<Record<string, unknown>>) => void;
  mediaLibrary: Media[];
}) {
  if (block.type === "text")
    return (
      <p className="text-sm leading-6 text-secondary/50">
        Edit rich text directly in the course canvas.
      </p>
    );
  if (block.type === "image")
    return (
      <>
        <Field label="Image URL">
          <input
            className={inputClass}
            value={block.src}
            onChange={(event) =>
              onChange({ ...block, src: event.target.value })
            }
          />
        </Field>
        <Field label="Caption">
          <input
            className={inputClass}
            value={block.caption || ""}
            onChange={(event) =>
              onChange({ ...block, caption: event.target.value })
            }
          />
        </Field>
        {mediaLibrary.some((media) => media.mediaType !== "document") ? (
          <div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.13em] text-secondary/45">
              Media library
            </p>
            <div className="grid grid-cols-3 gap-2">
              {mediaLibrary
                .filter((media) => media.mediaType !== "document")
                .slice(0, 12)
                .map((media) => (
                  <button
                    key={media.path}
                    type="button"
                    onClick={() =>
                      onChange({
                        ...block,
                        src: media.url,
                        alt: block.alt || media.altText || "",
                      })
                    }
                    className="aspect-square overflow-hidden rounded-lg border bg-slate-100"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- admin-selected storage URLs are not constrained to configured image hosts */}
                    <img
                      src={media.url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
            </div>
          </div>
        ) : null}
      </>
    );
  if (block.type === "callout")
    return (
      <>
        <Field label="Heading">
          <input
            className={inputClass}
            value={block.heading}
            onChange={(event) =>
              onChange({ ...block, heading: event.target.value })
            }
          />
        </Field>
        <Field label="Body">
          <textarea
            rows={5}
            className={textareaClass}
            value={block.body}
            onChange={(event) =>
              onChange({ ...block, body: event.target.value })
            }
          />
        </Field>
        <Field label="Tone">
          <select
            className={inputClass}
            value={block.tone}
            onChange={(event) =>
              onChange({
                ...block,
                tone: event.target.value as typeof block.tone,
              })
            }
          >
            {["blue", "teal", "amber", "navy"].map((tone) => (
              <option key={tone}>{tone}</option>
            ))}
          </select>
        </Field>
      </>
    );
  if (block.type === "quote")
    return (
      <>
        <Field label="Quote">
          <textarea
            rows={5}
            className={textareaClass}
            value={block.quote}
            onChange={(event) =>
              onChange({ ...block, quote: event.target.value })
            }
          />
        </Field>
        <Field label="Attribution">
          <input
            className={inputClass}
            value={block.attribution}
            onChange={(event) =>
              onChange({ ...block, attribution: event.target.value })
            }
          />
        </Field>
      </>
    );
  if (block.type === "divider")
    return (
      <Field label="Optional label">
        <input
          className={inputClass}
          value={block.label || ""}
          onChange={(event) =>
            onChange({ ...block, label: event.target.value })
          }
        />
      </Field>
    );
  if (block.type === "comparison-table")
    return (
      <>
        <Field label="Heading">
          <input
            className={inputClass}
            value={block.heading || ""}
            onChange={(event) =>
              onChange({ ...block, heading: event.target.value })
            }
          />
        </Field>
        <Field label="Columns, separated by |">
          <input
            className={inputClass}
            value={block.columns.join(" | ")}
            onChange={(event) =>
              onChange({
                ...block,
                columns: event.target.value
                  .split("|")
                  .map((value) => value.trim()),
              })
            }
          />
        </Field>
        <Field label="Rows, one per line">
          <textarea
            rows={8}
            className={textareaClass}
            value={block.rows.map((row) => row.join(" | ")).join("\n")}
            onChange={(event) =>
              onChange({
                ...block,
                rows: event.target.value
                  .split("\n")
                  .map((row) => row.split("|").map((value) => value.trim())),
              })
            }
          />
        </Field>
      </>
    );
  if (block.type === "video" || block.type === "audio")
    return (
      <>
        <Field label="Heading">
          <input
            className={inputClass}
            value={block.heading || ""}
            onChange={(event) =>
              onChange({ ...block, heading: event.target.value })
            }
          />
        </Field>
        <Field
          label={
            block.type === "video"
              ? "YouTube or Vimeo URL"
              : "Spotify or SoundCloud URL"
          }
        >
          <input
            className={inputClass}
            value={block.url}
            onChange={(event) =>
              onChange({ ...block, url: event.target.value })
            }
          />
        </Field>
        <Field label="Caption">
          <textarea
            rows={3}
            className={textareaClass}
            value={block.caption || ""}
            onChange={(event) =>
              onChange({ ...block, caption: event.target.value })
            }
          />
        </Field>
      </>
    );
  if (block.type === "worked-example")
    return (
      <>
        <Field label="Heading">
          <input
            className={inputClass}
            value={block.heading || ""}
            onChange={(event) =>
              onChange({ ...block, heading: event.target.value })
            }
          />
        </Field>
        <Field label="Problem">
          <textarea
            rows={4}
            className={textareaClass}
            value={block.problem}
            onChange={(event) =>
              onChange({ ...block, problem: event.target.value })
            }
          />
        </Field>
        <Field label="Optional LaTeX">
          <input
            className={inputClass}
            value={block.latex || ""}
            onChange={(event) =>
              onChange({ ...block, latex: event.target.value })
            }
          />
        </Field>
        <ItemEditor
          items={block.steps as unknown as Array<Record<string, unknown>>}
          onChange={(items) =>
            onChange({ ...block, steps: items as typeof block.steps })
          }
          kind="standard"
        />
        <Field label="Answer">
          <textarea
            rows={3}
            className={textareaClass}
            value={block.answer}
            onChange={(event) =>
              onChange({ ...block, answer: event.target.value })
            }
          />
        </Field>
      </>
    );
  if (block.type === "knowledge-check")
    return (
      <>
        <Field label="Heading">
          <input
            className={inputClass}
            value={block.heading || ""}
            onChange={(event) =>
              onChange({ ...block, heading: event.target.value })
            }
          />
        </Field>
        <QuestionEditor
          question={block.question}
          onChange={(question) => onChange({ ...block, question })}
        />
      </>
    );
  if (block.type === "gallery")
    return (
      <>
        <Field label="Heading">
          <input
            className={inputClass}
            value={block.heading || ""}
            onChange={(event) =>
              onChange({ ...block, heading: event.target.value })
            }
          />
        </Field>
        <Field label="Columns">
          <select
            className={inputClass}
            value={block.columns || 2}
            onChange={(event) =>
              onChange({
                ...block,
                columns: Number(event.target.value) as 2 | 3,
              })
            }
          >
            <option value={2}>Two</option>
            <option value={3}>Three</option>
          </select>
        </Field>
        <ItemEditor
          items={block.items as unknown as Array<Record<string, unknown>>}
          onChange={updateItems}
          kind="gallery"
        />
      </>
    );
  if (block.type === "carousel")
    return (
      <>
        <Field label="Heading">
          <input
            className={inputClass}
            value={block.heading || ""}
            onChange={(event) =>
              onChange({ ...block, heading: event.target.value })
            }
          />
        </Field>
        <ItemEditor
          items={block.items as unknown as Array<Record<string, unknown>>}
          onChange={updateItems}
          kind="media"
        />
      </>
    );
  if (block.type === "resources")
    return (
      <>
        <Field label="Heading">
          <input
            className={inputClass}
            value={block.heading || ""}
            onChange={(event) =>
              onChange({ ...block, heading: event.target.value })
            }
          />
        </Field>
        <ItemEditor
          items={block.items as unknown as Array<Record<string, unknown>>}
          onChange={updateItems}
          kind="resource"
        />
      </>
    );
  if ("items" in block)
    return (
      <>
        <Field label="Heading">
          <input
            className={inputClass}
            value={block.heading || ""}
            onChange={(event) =>
              onChange({ ...block, heading: event.target.value })
            }
          />
        </Field>
        <ItemEditor
          items={block.items as unknown as Array<Record<string, unknown>>}
          onChange={updateItems}
          kind="standard"
        />
      </>
    );
  return null;
}

function richTextPlainText(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const node = value as {
    text?: unknown;
    content?: unknown[];
  };
  const ownText = typeof node.text === "string" ? node.text : "";
  const childText = Array.isArray(node.content)
    ? node.content.map(richTextPlainText).filter(Boolean).join(" ")
    : "";
  return `${ownText} ${childText}`.trim();
}

function applyTextPresentation(
  block: Extract<LessonBlock, { type: "text" }>,
  preset: TextPreset,
): LessonBlock {
  const content = structuredClone(
    block.content || paragraphsToRichText(block.heading, block.paragraphs),
  );
  const nodes = (content.content || []) as Array<Record<string, unknown>>;
  const ensureFirstNode = () => {
    if (!nodes.length)
      nodes.push({
        type: "paragraph",
        content: [{ type: "text", text: "Start writing here." }],
      });
    return nodes[0];
  };
  const setFirstNode = (type: "paragraph" | "heading", level?: 2 | 3) => {
    const first = ensureFirstNode();
    first.type = type;
    if (type === "heading") first.attrs = { level };
    else delete first.attrs;
  };

  if (preset === "statement" || preset === "note") {
    const text = richTextPlainText(content).trim() || "Add your content.";
    if (preset === "statement")
      return {
        id: block.id,
        schemaVersion: block.schemaVersion,
        completion: block.completion,
        type: "quote",
        quote: text,
        attribution: "Source",
      };
    return {
      id: block.id,
      schemaVersion: block.schemaVersion,
      completion: block.completion,
      type: "callout",
      heading: block.heading || "Note",
      body: text,
      tone: "blue",
    };
  }

  if (preset === "two-column")
    return { ...block, content, layout: "two-column" };
  if (preset === "paragraph") setFirstNode("paragraph");
  if (preset === "heading") setFirstNode("heading", 2);
  if (preset === "subheading") setFirstNode("heading", 3);
  if (preset === "paragraph-heading") {
    setFirstNode("heading", 2);
    if (nodes.length === 1) nodes.push({ type: "paragraph" });
  }
  if (preset === "paragraph-subheading") {
    setFirstNode("heading", 3);
    if (nodes.length === 1) nodes.push({ type: "paragraph" });
  }
  content.content = nodes;
  return { ...block, content, layout: "single" };
}

export default function AcademyCourseEditor({
  initialCourse,
  status,
  mediaLibrary = [],
  initialRevision = 1,
  snapshots = [],
}: {
  initialCourse: AcademyCourse;
  status: "draft" | "published" | "archived";
  mediaLibrary?: Media[];
  initialRevision?: number;
  snapshots?: Snapshot[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [librarySearch, setLibrarySearch] = useState("");
  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [assessmentOpen, setAssessmentOpen] = useState(false);
  const [outlineOpen, setOutlineOpen] = useState(true);
  const [outlineSearch, setOutlineSearch] = useState("");
  const [result, setResult] = useState<AcademyAdminActionResult | null>(null);
  const [recovery, setRecovery] = useState<AcademyRecoveryDraft | null>(null);
  const initialized = useRef(false);
  const inspectorReturnFocusRef = useRef<HTMLElement | null>(null);
  const closeInspector = () => {
    setInspectorOpen(false);
    window.requestAnimationFrame(() => inspectorReturnFocusRef.current?.focus());
  };
  const libraryDialogRef = useDialogFocus(libraryOpen, () =>
    setLibraryOpen(false),
  );
  const inspectorDialogRef = useDialogFocus(inspectorOpen, closeInspector);
  const document = useAcademyEditorStore((state) => state.document);
  const revision = useAcademyEditorStore((state) => state.revision);
  const selectedLessonId = useAcademyEditorStore(
    (state) => state.selectedLessonId,
  );
  const selectedBlockId = useAcademyEditorStore(
    (state) => state.selectedBlockId,
  );
  const saveState = useAcademyEditorStore((state) => state.saveState);
  const savedAt = useAcademyEditorStore((state) => state.savedAt);
  const message = useAcademyEditorStore((state) => state.message);
  const initialize = useAcademyEditorStore((state) => state.initialize);
  const command = useAcademyEditorStore((state) => state.command);
  const selectLesson = useAcademyEditorStore((state) => state.selectLesson);
  const selectBlock = useAcademyEditorStore((state) => state.selectBlock);
  const setSaveState = useAcademyEditorStore((state) => state.setSaveState);
  const markSaved = useAcademyEditorStore((state) => state.markSaved);
  const undo = useAcademyEditorStore((state) => state.undo);
  const redo = useAcademyEditorStore((state) => state.redo);
  const past = useAcademyEditorStore((state) => state.past);
  const future = useAcademyEditorStore((state) => state.future);
  useEffect(() => {
    if (!initialized.current) {
      initialize(migrateAcademyCourse(initialCourse), initialRevision);
      initialized.current = true;
      if (initialCourse.id)
        readAcademyRecoveryDraft(initialCourse.id)
          .then((draft) => {
            if (draft && draft.baseRevision >= initialRevision)
              setRecovery(draft);
          })
          .catch(() => undefined);
    }
  }, [initialCourse, initialRevision, initialize]);
  useEffect(() => {
    if (!document?.id || saveState !== "dirty") return;
    const timer = window.setTimeout(async () => {
      const documentAtSave = document;
      const serializedAtSave = JSON.stringify(documentAtSave);
      setSaveState("saving");
      await writeAcademyRecoveryDraft({
        courseId: documentAtSave.id!,
        baseRevision: revision,
        savedAt: new Date().toISOString(),
        document: documentAtSave,
      }).catch(() => undefined);
      try {
        const response = await fetch(
          `/api/admin/academy/courses/${documentAtSave.id}/draft`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              baseRevision: revision,
              document: documentAtSave,
              reason: "autosave",
            }),
          },
        );
        const body = await response.json();
        if (response.status === 409) {
          setSaveState("conflict", "A newer draft exists");
          return;
        }
        if (!response.ok) throw new Error(body.message || "Autosave failed");
        const unchanged =
          JSON.stringify(useAcademyEditorStore.getState().document) ===
          serializedAtSave;
        if (unchanged) {
          markSaved(body.revision, body.savedAt);
          await deleteAcademyRecoveryDraft(documentAtSave.id!);
        } else {
          useAcademyEditorStore.setState({
            revision: body.revision,
            savedAt: body.savedAt,
            saveState: "dirty",
            message: "",
          });
        }
      } catch (error) {
        if (!navigator.onLine) setSaveState("offline");
        else
          setSaveState(
            "error",
            error instanceof Error ? error.message : "Autosave failed",
          );
      }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [document, revision, saveState, markSaved, setSaveState]);
  useEffect(() => {
    const listener = (event: BeforeUnloadEvent) => {
      if (saveState !== "saved") event.preventDefault();
    };
    window.addEventListener("beforeunload", listener);
    return () => window.removeEventListener("beforeunload", listener);
  }, [saveState]);
  if (!document)
    return <div className="min-h-[70vh] animate-pulse bg-slate-50" />;
  const selectedLesson =
    document.lessons.find((lesson) => lesson.id === selectedLessonId) ||
    document.lessons[0];
  const selectedBlock =
    selectedLesson?.blocks.find((block) => block.id === selectedBlockId) ||
    null;
  const updateLesson = (
    recipe: (lesson: AcademyLesson) => void,
    label = "Edit lesson",
  ) =>
    command(label, (draft) => {
      const lesson = draft.lessons.find(
        (item) => item.id === selectedLesson?.id,
      );
      if (lesson) recipe(lesson);
    });
  const updateBlock = (next: LessonBlock) =>
    updateLesson((lesson) => {
      const index = lesson.blocks.findIndex((block) => block.id === next.id);
      if (index >= 0) lesson.blocks[index] = next;
    }, `Edit ${next.id}`);
  const moveBlock = (from: number, to: number) =>
    updateLesson((lesson) => {
      if (to < 0 || to >= lesson.blocks.length) return;
      const [moving] = lesson.blocks.splice(from, 1);
      lesson.blocks.splice(to, 0, moving);
    }, "Move block");
  const insertBlock = (
    type: LessonBlock["type"],
    targetIndex = insertIndex ?? selectedLesson?.blocks.length ?? 0,
  ) => {
    const block = getAcademyBlockDefinition(type).create();
    updateLesson(
      (lesson) => lesson.blocks.splice(targetIndex, 0, block),
      "Insert block",
    );
    selectBlock(selectedLesson.id!, block.id!);
    setLibraryOpen(false);
    setInsertIndex(null);
  };
  const applyTextPreset = (block: LessonBlock, preset: TextPreset) => {
    if (block.type !== "text") return;
    if (
      (preset === "statement" || preset === "note") &&
      !window.confirm(
        `Convert this text to a ${preset}? Text styling will be simplified, but the copy will be preserved.`,
      )
    )
      return;
    updateBlock(applyTextPresentation(block, preset));
  };
  const manualSave = async () => {
    if (!document.id) {
      const created = await saveAcademyCourseDraft(document);
      setResult(created);
      if (created.ok)
        router.replace(`/dashboard/admin/academy/${created.courseKey}`);
      return created;
    }
    const documentAtSave = document;
    const serializedAtSave = JSON.stringify(documentAtSave);
    setSaveState("saving");
    const response = await fetch(
      `/api/admin/academy/courses/${document.id}/draft`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseRevision: revision,
          document: documentAtSave,
          reason: "manual",
        }),
      },
    );
    const body = await response.json();
    if (!response.ok) {
      setSaveState(
        response.status === 409 ? "conflict" : "error",
        body.message,
      );
      return { ok: false, message: body.message } as AcademyAdminActionResult;
    }
    const unchanged =
      JSON.stringify(useAcademyEditorStore.getState().document) ===
      serializedAtSave;
    if (unchanged) {
      markSaved(body.revision, body.savedAt);
      await deleteAcademyRecoveryDraft(document.id);
    } else {
      useAcademyEditorStore.setState({
        revision: body.revision,
        savedAt: body.savedAt,
        saveState: "dirty",
        message: "",
      });
    }
    return {
      ok: true,
      message: "Draft saved.",
      revision: body.revision,
    } as AcademyAdminActionResult;
  };
  const run = (
    work: () => Promise<AcademyAdminActionResult>,
    after?: (value: AcademyAdminActionResult) => void,
  ) =>
    startTransition(async () => {
      const value = await work();
      setResult(value);
      if (value.ok) after?.(value);
    });
  const filteredBlocks = academyBlockRegistry.filter((definition) =>
    `${definition.label} ${definition.description} ${definition.keywords.join(" ")}`
      .toLowerCase()
      .includes(librarySearch.toLowerCase()),
  );
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F5F6F8] text-secondary">
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-secondary/10 bg-white px-3 sm:px-5">
        <button
          type="button"
          onClick={() => setOutlineOpen((value) => !value)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-100"
          aria-label="Toggle course outline"
        >
          <Menu size={19} />
        </button>
        <Link
          href="/dashboard/admin/academy"
          className="hidden text-xs font-black uppercase tracking-[0.14em] text-primary sm:block"
        >
          Academy
        </Link>
        <span className="hidden text-secondary/20 sm:block">/</span>
        <input
          value={document.title}
          onChange={(event) =>
            command("Rename course", (draft) => {
              draft.title = event.target.value;
            })
          }
          className="min-w-0 flex-1 bg-transparent text-sm font-black outline-none sm:max-w-sm"
          aria-label="Course title"
        />
        <span className="hidden rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-secondary/45 md:inline-flex">
          {status}
        </span>
        <SaveState state={saveState} savedAt={savedAt} message={message} />
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={undo}
            disabled={!past.length}
            className="p-2.5 text-secondary/55 disabled:opacity-25"
            aria-label="Undo"
          >
            <Undo2 size={18} />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={!future.length}
            className="p-2.5 text-secondary/55 disabled:opacity-25"
            aria-label="Redo"
          >
            <Redo2 size={18} />
          </button>
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="hidden p-2.5 text-secondary/55 sm:block"
            aria-label="Revision history"
          >
            <History size={18} />
          </button>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="p-2.5 text-secondary/55"
            aria-label="Course settings"
          >
            <Settings2 size={18} />
          </button>
          <button
            type="button"
            disabled={pending || saveState === "saved"}
            onClick={() =>
              startTransition(async () => {
                const value = await manualSave();
                setResult(value);
              })
            }
            className="hidden min-h-10 items-center gap-2 rounded-lg border px-3 text-xs font-black md:inline-flex disabled:opacity-35"
            aria-label="Save draft"
          >
            <Save size={15} />
            Save
          </button>
          {document.id && status === "published" ? (
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    "Discard all draft changes and restore the published version?",
                  )
                )
                  run(
                    () => discardAcademyDraftV2(document.id!, revision),
                    () => window.location.reload(),
                  );
              }}
              className="hidden p-2.5 text-secondary/55 lg:block"
              aria-label="Discard draft changes"
            >
              <RotateCcw size={18} />
            </button>
          ) : null}
          {document.id ? (
            <button
              type="button"
              onClick={() =>
                run(
                  () => duplicateAcademyCourse(document),
                  (value) =>
                    value.courseKey &&
                    router.push(`/dashboard/admin/academy/${value.courseKey}`),
                )
              }
              className="hidden p-2.5 text-secondary/55 lg:block"
              aria-label="Duplicate course"
            >
              <Copy size={18} />
            </button>
          ) : null}
          {document.id && status !== "archived" ? (
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    "Archive this course? Learners will no longer see it.",
                  )
                )
                  run(
                    () => archiveAcademyCourse(document.id!),
                    () => router.push("/dashboard/admin/academy"),
                  );
              }}
              className="hidden p-2.5 text-red-500 lg:block"
              aria-label="Archive course"
            >
              <Archive size={18} />
            </button>
          ) : null}
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const saved = await manualSave();
                if (saved.ok)
                  router.push(
                    `/dashboard/admin/academy/${saved.courseKey || document.key}/preview`,
                  );
              })
            }
            className="hidden min-h-10 items-center gap-2 rounded-lg border px-4 text-xs font-black md:inline-flex"
          >
            <Eye size={15} />
            Preview
          </button>
          <button
            type="button"
            disabled={pending || saveState === "conflict"}
            onClick={() =>
              startTransition(async () => {
                const saved = await manualSave();
                const courseId = document.id || saved.courseId;
                if (!saved.ok || !courseId) return;
                const value = await publishAcademyCourseV2(
                  courseId,
                  saved.revision || revision,
                );
                setResult(value);
                if (value.ok && saved.courseKey)
                  router.replace(`/dashboard/admin/academy/${saved.courseKey}`);
              })
            }
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-black text-white disabled:opacity-40"
          >
            {pending ? "Working…" : "Publish"}
          </button>
        </div>
      </header>
      {recovery ? (
        <div className="flex flex-wrap items-center justify-center gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-950">
          <span>
            A local recovery draft from{" "}
            {new Date(recovery.savedAt).toLocaleString()} is available.
          </span>
          <button
            type="button"
            onClick={() => {
              initialize(recovery.document, recovery.baseRevision);
              setSaveState("dirty");
              setRecovery(null);
            }}
            className="underline"
          >
            Restore it
          </button>
          <button
            type="button"
            onClick={() => {
              if (document.id) deleteAcademyRecoveryDraft(document.id);
              setRecovery(null);
            }}
            className="underline"
          >
            Discard it
          </button>
        </div>
      ) : null}
      {saveState === "conflict" ? (
        <div className="flex flex-wrap items-center justify-center gap-3 border-b border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-900">
          <span>Autosave paused because a newer server revision exists.</span>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="underline"
          >
            Load server draft
          </button>
          <button
            type="button"
            onClick={() =>
              navigator.clipboard.writeText(JSON.stringify(document, null, 2))
            }
            className="underline"
          >
            Copy local draft JSON
          </button>
        </div>
      ) : null}
      <div className="flex min-h-0 flex-1">
        {outlineOpen ? (
          <aside className="absolute inset-y-16 left-0 z-30 flex w-[272px] flex-col border-r border-secondary/10 bg-white shadow-xl lg:static lg:shadow-none">
            <div className="border-b border-secondary/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-primary/60">
                    Course outline
                  </p>
                  <p className="mt-1 text-sm font-black">
                    {document.lessons.length} lessons
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const lesson = createAcademyLesson(document);
                    command("Add lesson", (draft) => {
                      if (!draft.sections?.length)
                        draft.sections = [
                          { id: lesson.sectionId!, title: lesson.section },
                        ];
                      draft.lessons.push(lesson);
                    });
                    selectLesson(lesson.id!);
                  }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white"
                  aria-label="Add lesson"
                >
                  <Plus size={17} />
                </button>
              </div>
              <button
                type="button"
                onClick={() =>
                  command("Add section", (draft) => {
                    draft.sections ||= [];
                    draft.sections.push({
                      id: createAcademyId("section"),
                      title: `Section ${draft.sections.length + 1}`,
                    });
                  })
                }
                className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-black text-primary"
              >
                <Plus size={13} /> Add section
              </button>
              <div className="relative mt-3">
                <Search
                  size={14}
                  className="absolute left-3 top-3 text-secondary/35"
                />
                <input
                  className={`${inputClass} pl-9`}
                  placeholder="Search lessons"
                  value={outlineSearch}
                  onChange={(event) => setOutlineSearch(event.target.value)}
                />
              </div>
            </div>
            <nav
              className="flex-1 overflow-y-auto py-3"
              aria-label="Course outline"
            >
              {(document.sections || []).map((section, sectionIndex) => (
                <div key={section.id} className="mb-3">
                  <div className="flex items-center gap-1 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-secondary/40">
                    <ChevronDown size={13} />
                    <input
                      value={section.title}
                      aria-label={`Section ${sectionIndex + 1} title`}
                      onChange={(event) =>
                        command("Rename section", (draft) => {
                          const target = draft.sections?.find(
                            (item) => item.id === section.id,
                          );
                          if (target) {
                            target.title = event.target.value;
                            draft.lessons
                              .filter(
                                (lesson) => lesson.sectionId === section.id,
                              )
                              .forEach((lesson) => {
                                lesson.section = event.target.value;
                              });
                          }
                        })
                      }
                      className="min-w-0 flex-1 bg-transparent font-black uppercase outline-none"
                    />
                    <button
                      type="button"
                      disabled={sectionIndex === 0}
                      onClick={() =>
                        command("Move section", (draft) => {
                          const sections = draft.sections || [];
                          const [moving] = sections.splice(sectionIndex, 1);
                          sections.splice(sectionIndex - 1, 0, moving);
                        })
                      }
                      className="p-1 disabled:opacity-20"
                      aria-label={`Move ${section.title} up`}
                    >
                      <ArrowUp size={12} />
                    </button>
                    <button
                      type="button"
                      disabled={
                        sectionIndex === (document.sections?.length || 0) - 1
                      }
                      onClick={() =>
                        command("Move section", (draft) => {
                          const sections = draft.sections || [];
                          const [moving] = sections.splice(sectionIndex, 1);
                          sections.splice(sectionIndex + 1, 0, moving);
                        })
                      }
                      className="p-1 disabled:opacity-20"
                      aria-label={`Move ${section.title} down`}
                    >
                      <ArrowDown size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const lesson = createAcademyLesson(
                          document,
                          section.id,
                        );
                        command("Add lesson", (draft) => {
                          draft.lessons.push(lesson);
                        });
                        selectLesson(lesson.id!);
                      }}
                      className="p-1 text-primary"
                      aria-label={`Add lesson to ${section.title}`}
                    >
                      <Plus size={13} />
                    </button>
                    <button
                      type="button"
                      disabled={document.lessons.some(
                        (lesson) => lesson.sectionId === section.id,
                      )}
                      onClick={() =>
                        command("Delete section", (draft) => {
                          draft.sections = draft.sections?.filter(
                            (item) => item.id !== section.id,
                          );
                        })
                      }
                      className="p-1 text-red-500 disabled:opacity-20"
                      aria-label={`Delete ${section.title}`}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  {document.lessons
                    .filter((lesson) => lesson.sectionId === section.id)
                    .filter((lesson) =>
                      lesson.title
                        .toLowerCase()
                        .includes(outlineSearch.toLowerCase()),
                    )
                    .map((lesson, index) => (
                      <div
                        key={lesson.id}
                        className={`group flex items-center border-l-4 ${selectedLesson?.id === lesson.id ? "border-primary bg-primary/5" : "border-transparent hover:bg-slate-50"}`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            selectLesson(lesson.id!);
                            if (window.innerWidth < 1024) setOutlineOpen(false);
                          }}
                          className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left"
                        >
                          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-black text-secondary/45">
                            {index + 1}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-black">
                              {lesson.title}
                            </span>
                            <span className="mt-0.5 block text-[10px] text-secondary/40">
                              {lesson.blocks.length} blocks ·{" "}
                              {lesson.durationMinutes} min
                            </span>
                          </span>
                        </button>
                        <div className="mr-2 hidden shrink-0 items-center group-hover:flex group-focus-within:flex">
                          <button
                            type="button"
                            disabled={
                              document.lessons.findIndex(
                                (item) => item.id === lesson.id,
                              ) === 0
                            }
                            onClick={() =>
                              command("Move lesson", (draft) => {
                                const from = draft.lessons.findIndex(
                                  (item) => item.id === lesson.id,
                                );
                                const [moving] = draft.lessons.splice(from, 1);
                                draft.lessons.splice(from - 1, 0, moving);
                              })
                            }
                            className="p-1 disabled:opacity-20"
                            aria-label={`Move ${lesson.title} up`}
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            type="button"
                            disabled={
                              document.lessons.findIndex(
                                (item) => item.id === lesson.id,
                              ) ===
                              document.lessons.length - 1
                            }
                            onClick={() =>
                              command("Move lesson", (draft) => {
                                const from = draft.lessons.findIndex(
                                  (item) => item.id === lesson.id,
                                );
                                const [moving] = draft.lessons.splice(from, 1);
                                draft.lessons.splice(from + 1, 0, moving);
                              })
                            }
                            className="p-1 disabled:opacity-20"
                            aria-label={`Move ${lesson.title} down`}
                          >
                            <ArrowDown size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              command("Duplicate lesson", (draft) => {
                                const from = draft.lessons.findIndex(
                                  (item) => item.id === lesson.id,
                                );
                                const copy = structuredClone(lesson);
                                copy.id = createAcademyId("lesson");
                                copy.slug = `${lesson.slug}-copy-${Date.now().toString(36)}`;
                                copy.title = `${lesson.title} copy`;
                                copy.blocks = copy.blocks.map((block) => ({
                                  ...block,
                                  id: createAcademyId("block"),
                                }));
                                draft.lessons.splice(from + 1, 0, copy);
                              })
                            }
                            className="p-1"
                            aria-label={`Duplicate ${lesson.title}`}
                          >
                            <Copy size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete “${lesson.title}”?`))
                                command("Delete lesson", (draft) => {
                                  draft.lessons = draft.lessons.filter(
                                    (item) => item.id !== lesson.id,
                                  );
                                });
                            }}
                            className="p-1 text-red-500"
                            aria-label={`Delete ${lesson.title}`}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              ))}
            </nav>
            <div className="border-t border-secondary/10 p-3">
              <button
                type="button"
                onClick={() => setAssessmentOpen(true)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-black hover:bg-slate-50"
              >
                <BookOpen size={16} />
                Final assessment{" "}
                <span className="ml-auto text-secondary/35">
                  {document.quiz.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-black hover:bg-slate-50"
              >
                <Palette size={16} />
                Theme & course settings
              </button>
            </div>
          </aside>
        ) : null}
        <main className="min-w-0 flex-1 overflow-y-auto px-6 py-10 sm:px-10">
          <div className="mx-auto max-w-[760px]">
            {result ? (
              <div
                role="status"
                className={`mb-5 border-l-4 p-4 text-sm font-bold ${result.ok ? "border-emerald-600 bg-emerald-50 text-emerald-900" : "border-red-600 bg-red-50 text-red-900"}`}
              >
                {result.message}
                {result.errors?.length ? (
                  <ul className="mt-2 list-disc pl-5 font-medium">
                    {result.errors.slice(0, 5).map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
            {selectedLesson ? (
              <article className="bg-white px-8 py-12 shadow-[0_10px_35px_rgba(0,26,68,0.07)] sm:px-12">
                <header className="border-b border-[#DEDFE1] pb-9">
                  <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-[#717376]">
                    <span>{selectedLesson.section}</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock3 size={13} />
                      {selectedLesson.durationMinutes} min
                    </span>
                  </div>
                  <input
                    value={selectedLesson.title}
                    onChange={(event) =>
                      updateLesson((lesson) => {
                        lesson.title = event.target.value;
                      }, "Edit lesson title")
                    }
                    className="mt-4 w-full bg-transparent text-[36px] font-black leading-tight tracking-tight outline-none"
                    aria-label="Lesson title"
                  />
                  <div className="mt-5 h-1 w-12 bg-primary" />
                  <textarea
                    value={selectedLesson.summary}
                    onChange={(event) =>
                      updateLesson((lesson) => {
                        lesson.summary = event.target.value;
                      }, "Edit lesson summary")
                    }
                    rows={2}
                    className="mt-5 w-full resize-none bg-transparent font-serif text-[17px] leading-8 text-[#4A4B4E] outline-none"
                    aria-label="Lesson summary"
                  />
                  <div className="mt-6 grid gap-4 border-t border-[#ECEDEF] pt-5 sm:grid-cols-3">
                    <Field label="Lesson slug">
                      <input
                        value={selectedLesson.slug}
                        onChange={(event) =>
                          updateLesson((lesson) => {
                            lesson.slug = academySlugify(event.target.value);
                          }, "Edit lesson slug")
                        }
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Section">
                      <select
                        value={selectedLesson.sectionId}
                        onChange={(event) =>
                          updateLesson((lesson) => {
                            const section = document.sections?.find(
                              (item) => item.id === event.target.value,
                            );
                            if (section) {
                              lesson.sectionId = section.id;
                              lesson.section = section.title;
                            }
                          }, "Move lesson to section")
                        }
                        className={inputClass}
                      >
                        {(document.sections || []).map((section) => (
                          <option key={section.id} value={section.id}>
                            {section.title}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Minutes">
                      <input
                        type="number"
                        min={1}
                        value={selectedLesson.durationMinutes}
                        onChange={(event) =>
                          updateLesson((lesson) => {
                            lesson.durationMinutes = Math.max(
                              1,
                              Number(event.target.value),
                            );
                          }, "Edit lesson duration")
                        }
                        className={inputClass}
                      />
                    </Field>
                  </div>
                </header>
                <div className="py-10">
                  <BlockInsertionTray
                    expanded={
                      selectedLesson.blocks.length === 0 || insertIndex === 0
                    }
                    firstBlock={selectedLesson.blocks.length === 0}
                    onToggle={() =>
                      setInsertIndex((value) => (value === 0 ? null : 0))
                    }
                    onInsert={(type) => insertBlock(type, 0)}
                    onOpenLibrary={() => {
                      setInsertIndex(0);
                      setLibraryOpen(true);
                    }}
                  />
                  {selectedLesson.blocks.map((block, index) => (
                    <div key={block.id || index} className="py-8 sm:py-10">
                      <DraggableBlockFrame
                        block={block}
                        lessonId={selectedLesson.id!}
                        index={index}
                        selected={selectedBlock?.id === block.id}
                        onSelect={() =>
                          selectBlock(selectedLesson.id!, block.id!)
                        }
                        onEdit={() => {
                          selectBlock(selectedLesson.id!, block.id!);
                          if (block.type === "text")
                            window.requestAnimationFrame(() =>
                              globalThis.document
                                .querySelector<HTMLElement>(
                                  `[data-block-id="${block.id}"] .ProseMirror`,
                                )
                                ?.focus(),
                            );
                          else {
                            inspectorReturnFocusRef.current =
                              globalThis.document.activeElement as HTMLElement | null;
                            setInspectorOpen(true);
                          }
                        }}
                        onMove={moveBlock}
                        onMoveDirection={(direction) =>
                          moveBlock(index, index + direction)
                        }
                        onDuplicate={() =>
                          updateLesson((lesson) => {
                            const copy = structuredClone(block);
                            copy.id = createAcademyId("block");
                            lesson.blocks.splice(index + 1, 0, copy);
                          }, "Duplicate block")
                        }
                        onDelete={() => {
                          if (
                            window.confirm(
                              `Delete this ${getAcademyBlockDefinition(block.type).label.toLowerCase()} block?`,
                            )
                          )
                            updateLesson((lesson) => {
                              lesson.blocks = lesson.blocks.filter(
                                (item) => item.id !== block.id,
                              );
                            }, "Delete block");
                        }}
                        onOpenSettings={() => {
                          selectBlock(selectedLesson.id!, block.id!);
                          inspectorReturnFocusRef.current =
                            globalThis.document.activeElement as HTMLElement | null;
                          setInspectorOpen(true);
                        }}
                        onApplyTextPreset={(preset) =>
                          applyTextPreset(block, preset)
                        }
                      >
                        {block.type === "text" ? (
                          <AcademyRichTextEditor
                            value={
                              block.content ||
                              paragraphsToRichText(
                                block.heading,
                                block.paragraphs,
                              )
                            }
                            onChange={(content) =>
                              updateBlock({ ...block, content })
                            }
                            active={selectedBlock?.id === block.id}
                            layout={block.layout || "single"}
                          />
                        ) : (
                          <AcademyLessonBlocks blocks={[block]} />
                        )}
                      </DraggableBlockFrame>
                      <BlockInsertionTray
                        expanded={insertIndex === index + 1}
                        onToggle={() =>
                          setInsertIndex((value) =>
                            value === index + 1 ? null : index + 1,
                          )
                        }
                        onInsert={(type) => insertBlock(type, index + 1)}
                        onOpenLibrary={() => {
                          setInsertIndex(index + 1);
                          setLibraryOpen(true);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </article>
            ) : (
              <div className="py-24 text-center text-secondary/40">
                Add a lesson to begin.
              </div>
            )}
          </div>
        </main>
      </div>
      {inspectorOpen && selectedBlock && selectedLesson ? (
        <div
          className="fixed inset-0 z-[75] flex justify-end bg-secondary/30"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            onClick={closeInspector}
            aria-label="Close advanced block settings"
          />
          <aside
            ref={inspectorDialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Advanced settings for ${getAcademyBlockDefinition(selectedBlock.type).label}`}
            className="relative flex h-full w-full max-w-[380px] flex-col border-l border-secondary/10 bg-white shadow-2xl"
          >
            <button
              type="button"
              onClick={closeInspector}
              className="absolute right-3 top-3 z-20 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white text-secondary/45 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Close advanced block settings"
            >
              <X size={18} />
            </button>
            <BlockInspector
              block={selectedBlock}
              onChange={updateBlock}
              onDelete={() => {
                updateLesson((lesson) => {
                  lesson.blocks = lesson.blocks.filter(
                    (block) => block.id !== selectedBlock.id,
                  );
                }, "Delete block");
                closeInspector();
              }}
              onDuplicate={() =>
                updateLesson((lesson) => {
                  const index = lesson.blocks.findIndex(
                    (block) => block.id === selectedBlock.id,
                  );
                  const copy = structuredClone(selectedBlock);
                  copy.id = createAcademyId("block");
                  lesson.blocks.splice(index + 1, 0, copy);
                }, "Duplicate block")
              }
              onMove={(direction) => {
                const index = selectedLesson.blocks.findIndex(
                  (block) => block.id === selectedBlock.id,
                );
                moveBlock(index, index + direction);
              }}
              mediaLibrary={mediaLibrary}
            />
          </aside>
        </div>
      ) : null}
      {libraryOpen ? (
        <div
          ref={libraryDialogRef}
          className="fixed inset-0 z-[70] flex items-end justify-center bg-secondary/40 p-0 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Block library"
        >
          <div className="max-h-[88vh] w-full max-w-4xl overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
            <div className="flex items-center gap-4 border-b p-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-primary/60">
                  Block library
                </p>
                <h2 className="text-2xl font-black">
                  What should learners see next?
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setLibraryOpen(false)}
                className="ml-auto p-2"
                aria-label="Close block library"
              >
                <X />
              </button>
            </div>
            <div className="p-5">
              <div className="relative">
                <Search
                  className="absolute left-3 top-3 text-secondary/35"
                  size={17}
                />
                <input
                  autoFocus
                  className={`${inputClass} pl-10`}
                  value={librarySearch}
                  onChange={(event) => setLibrarySearch(event.target.value)}
                  placeholder="Search text, carousel, quiz, media…"
                />
              </div>
              <div className="mt-5 max-h-[62vh] overflow-y-auto">
                {[
                  "Text",
                  "Media",
                  "Interactive",
                  "Data & STEM",
                  "Assessment",
                ].map((category) => {
                  const definitions = filteredBlocks.filter(
                    (definition) => definition.category === category,
                  );
                  return definitions.length ? (
                    <section key={category} className="mb-6">
                      <h3 className="mb-3 text-[10px] font-black uppercase tracking-[0.15em] text-secondary/40">
                        {category}
                      </h3>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {definitions.map((definition) => (
                          <button
                            key={definition.type}
                            type="button"
                            onClick={() => insertBlock(definition.type)}
                            className="group min-h-28 rounded-xl border border-secondary/10 p-4 text-left hover:border-primary hover:bg-primary/[0.03]"
                          >
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <AcademyBlockIcon
                                name={definition.icon}
                                size={18}
                              />
                            </span>
                            <strong className="mt-3 block text-sm">
                              {definition.label}
                            </strong>
                            <span className="mt-1 block text-xs leading-5 text-secondary/50">
                              {definition.description}
                            </span>
                          </button>
                        ))}
                      </div>
                    </section>
                  ) : null;
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {settingsOpen ? (
        <CourseSettingsModal
          course={document}
          onClose={() => setSettingsOpen(false)}
          onChange={(recipe, label) => command(label, recipe)}
          mediaLibrary={mediaLibrary}
        />
      ) : null}
      {assessmentOpen ? (
        <AssessmentModal
          course={document}
          onClose={() => setAssessmentOpen(false)}
          onChange={(recipe, label) => command(label, recipe)}
        />
      ) : null}
      {historyOpen ? (
        <HistoryModal
          snapshots={snapshots}
          onClose={() => setHistoryOpen(false)}
          onRestore={(snapshotId) => {
            if (!document.id) return;
            run(
              () => restoreAcademySnapshot(document.id!, snapshotId, revision),
              () => window.location.reload(),
            );
          }}
        />
      ) : null}
      <div aria-live="polite" className="sr-only">
        {message}
      </div>
    </div>
  );
}

function CourseSettingsModal({
  course,
  onClose,
  onChange,
  mediaLibrary,
}: {
  course: AcademyCourse;
  onClose: () => void;
  onChange: (recipe: (course: AcademyCourse) => void, label: string) => void;
  mediaLibrary: Media[];
}) {
  const [tab, setTab] = useState<"details" | "theme" | "rules" | "media">(
    "details",
  );
  const dialogRef = useDialogFocus(true, onClose);
  const upload = (file: File) => {
    const data = new FormData();
    data.set("file", file);
    uploadAcademyMedia(data).then((result) => {
      if (result.ok && result.url)
        onChange((draft) => {
          draft.heroImage = result.url;
        }, "Update hero");
    });
  };
  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-secondary/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Course settings"
    >
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center border-b px-5 py-4">
          <h2 className="text-xl font-black">Course settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto p-2"
            aria-label="Close settings"
          >
            <X />
          </button>
        </div>
        <div className="flex border-b">
          {(["details", "theme", "rules", "media"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`border-b-2 px-5 py-3 text-xs font-black capitalize ${tab === item ? "border-primary text-primary" : "border-transparent text-secondary/45"}`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="space-y-5 overflow-y-auto p-6">
          {tab === "details" ? (
            <>
              <Field label="Title">
                <input
                  className={inputClass}
                  value={course.title}
                  onChange={(event) =>
                    onChange((draft) => {
                      draft.title = event.target.value;
                    }, "Rename course")
                  }
                />
              </Field>
              <Field label="Short title">
                <input
                  className={inputClass}
                  value={course.shortTitle}
                  onChange={(event) =>
                    onChange((draft) => {
                      draft.shortTitle = event.target.value;
                    }, "Edit short title")
                  }
                />
              </Field>
              <Field label="Description">
                <textarea
                  rows={4}
                  className={textareaClass}
                  value={course.description}
                  onChange={(event) =>
                    onChange((draft) => {
                      draft.description = event.target.value;
                    }, "Edit description")
                  }
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Duration">
                  <input
                    type="number"
                    min={1}
                    className={inputClass}
                    value={course.estimatedMinutes}
                    onChange={(event) =>
                      onChange((draft) => {
                        draft.estimatedMinutes = Number(event.target.value);
                      }, "Edit duration")
                    }
                  />
                </Field>
                <Field label="Course key">
                  <input
                    disabled={Boolean(course.id)}
                    className={`${inputClass} disabled:bg-slate-100`}
                    value={course.key}
                    onChange={(event) =>
                      onChange((draft) => {
                        draft.key = academySlugify(event.target.value);
                      }, "Edit course key")
                    }
                  />
                </Field>
              </div>
              <fieldset>
                <legend className="mb-2 text-[10px] font-black uppercase tracking-[0.13em] text-secondary/45">
                  Audience
                </legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {audienceOptions.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 rounded-lg border p-3 text-sm font-bold"
                    >
                      <input
                        type="checkbox"
                        checked={course.audienceRoles?.includes(option.value)}
                        onChange={(event) =>
                          onChange((draft) => {
                            draft.audienceRoles = event.target.checked
                              ? [...(draft.audienceRoles || []), option.value]
                              : (draft.audienceRoles || []).filter(
                                  (role) => role !== option.value,
                                );
                          }, "Edit audience")
                        }
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </fieldset>
            </>
          ) : null}
          {tab === "theme" ? (
            <>
              <Field label="Theme preset">
                <select
                  className={inputClass}
                  value={course.theme?.preset || "editorial"}
                  onChange={(event) =>
                    onChange((draft) => {
                      draft.theme!.preset = event.target.value as NonNullable<
                        AcademyCourse["theme"]
                      >["preset"];
                    }, "Change theme")
                  }
                >
                  <option value="editorial">Editorial</option>
                  <option value="modern">Modern</option>
                  <option value="calm">Calm</option>
                </select>
              </Field>
              <Field label="Accent">
                <select
                  className={inputClass}
                  value={course.theme?.accent || "blue"}
                  onChange={(event) =>
                    onChange((draft) => {
                      draft.theme!.accent = event.target.value as NonNullable<
                        AcademyCourse["theme"]
                      >["accent"];
                    }, "Change accent")
                  }
                >
                  <option value="blue">ScienceDojo blue</option>
                  <option value="teal">Teal</option>
                  <option value="navy">Navy</option>
                  <option value="amber">Amber</option>
                </select>
              </Field>
              <Field label="Typography">
                <select
                  className={inputClass}
                  value={course.theme?.typography || "editorial"}
                  onChange={(event) =>
                    onChange((draft) => {
                      draft.theme!.typography = event.target
                        .value as NonNullable<
                        AcademyCourse["theme"]
                      >["typography"];
                    }, "Change typography")
                  }
                >
                  <option value="editorial">
                    Sans headings + serif reading
                  </option>
                  <option value="sans">Sans throughout</option>
                </select>
              </Field>
              <Field label="Density">
                <select
                  className={inputClass}
                  value={course.theme?.density || "comfortable"}
                  onChange={(event) =>
                    onChange((draft) => {
                      draft.theme!.density = event.target.value as NonNullable<
                        AcademyCourse["theme"]
                      >["density"];
                    }, "Change density")
                  }
                >
                  <option value="comfortable">Comfortable</option>
                  <option value="compact">Compact</option>
                </select>
              </Field>
            </>
          ) : null}
          {tab === "rules" ? (
            <>
              <Field label="Navigation">
                <select
                  className={inputClass}
                  value={course.rules?.navigation || "free"}
                  onChange={(event) =>
                    onChange((draft) => {
                      draft.rules!.navigation = event.target.value as
                        | "free"
                        | "linear";
                    }, "Change navigation")
                  }
                >
                  <option value="free">Free exploration</option>
                  <option value="linear">Linear progression</option>
                </select>
              </Field>
              <Field label="Lesson completion">
                <select
                  className={inputClass}
                  value={course.rules?.lessonCompletion || "manual"}
                  onChange={(event) =>
                    onChange((draft) => {
                      draft.rules!.lessonCompletion = event.target.value as
                        | "manual"
                        | "required-blocks";
                    }, "Change completion")
                  }
                >
                  <option value="manual">Manual completion</option>
                  <option value="required-blocks">
                    Complete required interactions
                  </option>
                </select>
              </Field>
              <label className="flex items-center gap-2 text-sm font-bold">
                <input
                  type="checkbox"
                  checked={course.rules?.requireFinalAssessment ?? true}
                  onChange={(event) =>
                    onChange((draft) => {
                      draft.rules!.requireFinalAssessment =
                        event.target.checked;
                    }, "Change final assessment")
                  }
                />
                Require final assessment
              </label>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Pass mark">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    className={inputClass}
                    value={course.passMark || 80}
                    onChange={(event) =>
                      onChange((draft) => {
                        draft.passMark = Number(event.target.value);
                      }, "Change pass mark")
                    }
                  />
                </Field>
                <Field label="Attempt limit" hint="0 means unlimited">
                  <input
                    type="number"
                    min={0}
                    max={10}
                    className={inputClass}
                    value={course.rules?.attemptLimit || 0}
                    onChange={(event) =>
                      onChange((draft) => {
                        draft.rules!.attemptLimit =
                          Number(event.target.value) || null;
                      }, "Change attempts")
                    }
                  />
                </Field>
              </div>
              <Field label="Feedback">
                <select
                  className={inputClass}
                  value={course.rules?.feedbackTiming || "after-submit"}
                  onChange={(event) =>
                    onChange((draft) => {
                      draft.rules!.feedbackTiming = event.target
                        .value as NonNullable<
                        AcademyCourse["rules"]
                      >["feedbackTiming"];
                    }, "Change feedback")
                  }
                >
                  <option value="immediate">Immediately</option>
                  <option value="after-submit">After submission</option>
                  <option value="after-pass">After passing</option>
                </select>
              </Field>
            </>
          ) : null}
          {tab === "media" ? (
            <>
              <Field label="Hero image URL">
                <input
                  className={inputClass}
                  value={course.heroImage || ""}
                  onChange={(event) =>
                    onChange((draft) => {
                      draft.heroImage = event.target.value;
                    }, "Update hero")
                  }
                />
              </Field>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-black text-white">
                <Upload size={15} />
                Upload image or PDF
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) upload(file);
                  }}
                />
              </label>
              <div className="grid grid-cols-3 gap-3">
                {mediaLibrary
                  .filter((media) => media.mediaType !== "document")
                  .map((media) => (
                    <div
                      key={media.path}
                      className="group relative aspect-video overflow-hidden rounded-lg border bg-slate-100"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          onChange((draft) => {
                            draft.heroImage = media.url;
                          }, "Update hero")
                        }
                        className="absolute inset-0 z-10"
                        aria-label={`Use ${media.name} as hero image`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- admin-selected storage URLs are not constrained to configured image hosts */}
                        <img
                          src={media.url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Remove unused asset “${media.name}”?`,
                            )
                          )
                            deleteAcademyMedia(media.path, media.url).then(
                              (result) => {
                                if (!result.ok) window.alert(result.message);
                              },
                            );
                        }}
                        className="absolute right-1 top-1 z-20 rounded bg-white/90 p-1.5 text-red-600 opacity-0 shadow group-hover:opacity-100 focus:opacity-100"
                        aria-label={`Remove ${media.name}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
              </div>
            </>
          ) : null}
        </div>
        <div className="border-t p-4 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-secondary px-5 py-2.5 text-xs font-black text-white"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function HistoryModal({
  snapshots,
  onClose,
  onRestore,
}: {
  snapshots: Snapshot[];
  onClose: () => void;
  onRestore: (id: string) => void;
}) {
  const dialogRef = useDialogFocus(true, onClose);
  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-secondary/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Revision history"
    >
      <div className="max-h-[85vh] w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center border-b p-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-primary/60">
              Recovery
            </p>
            <h2 className="text-xl font-black">Revision history</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto p-2"
            aria-label="Close history"
          >
            <X />
          </button>
        </div>
        <div className="max-h-[65vh] divide-y overflow-y-auto">
          {snapshots.map((snapshot) => (
            <div key={snapshot.id} className="flex items-center gap-4 p-4">
              <History className="text-primary" size={18} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black capitalize">
                  {snapshot.reason} snapshot
                </p>
                <p className="text-xs text-secondary/45">
                  Revision {snapshot.draft_revision} ·{" "}
                  {new Date(snapshot.created_at).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRestore(snapshot.id)}
                className="rounded-lg border px-3 py-2 text-xs font-black"
              >
                Restore
              </button>
            </div>
          ))}
          {!snapshots.length ? (
            <p className="p-8 text-center text-sm font-semibold text-secondary/40">
              Snapshots appear after manual saves, restores, migrations, and
              publishes.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function AssessmentModal({
  course,
  onClose,
  onChange,
}: {
  course: AcademyCourse;
  onClose: () => void;
  onChange: (recipe: (course: AcademyCourse) => void, label: string) => void;
}) {
  const dialogRef = useDialogFocus(true, onClose);
  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-secondary/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Final assessment editor"
    >
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center border-b p-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-primary/60">
              Assessment
            </p>
            <h2 className="text-xl font-black">Final knowledge check</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto p-2"
            aria-label="Close assessment editor"
          >
            <X />
          </button>
        </div>
        <div className="space-y-4 overflow-y-auto bg-slate-50 p-5">
          {course.quiz.map((question, index) => (
            <details
              key={question.id}
              open={index === 0}
              className="rounded-xl border bg-white"
            >
              <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">
                  {index + 1}
                </span>
                <strong className="min-w-0 flex-1 truncate text-sm">
                  {question.prompt}
                </strong>
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    onChange((draft) => {
                      draft.quiz.splice(index, 1);
                    }, "Delete assessment question");
                  }}
                  className="p-2 text-red-500"
                  aria-label={`Delete question ${index + 1}`}
                >
                  <Trash2 size={15} />
                </button>
              </summary>
              <div className="border-t p-4">
                <QuestionEditor
                  question={question}
                  onChange={(next) =>
                    onChange((draft) => {
                      draft.quiz[index] = next;
                    }, `Edit final question ${question.id}`)
                  }
                />
              </div>
            </details>
          ))}
          <button
            type="button"
            onClick={() =>
              onChange((draft) => {
                draft.quiz.push(createQuestion("single-choice"));
              }, "Add assessment question")
            }
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-black text-white"
          >
            <Plus size={15} />
            Add question
          </button>
        </div>
        <div className="border-t p-4 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-secondary px-5 py-2.5 text-xs font-black text-white"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

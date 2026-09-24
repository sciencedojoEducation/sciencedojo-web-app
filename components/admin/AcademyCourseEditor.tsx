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
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BookOpen,
  ChevronDown,
  Clock3,
  CheckCircle2,
  Columns3,
  Copy,
  Eye,
  GripVertical,
  History,
  List,
  ListOrdered,
  Menu,
  MessageSquare,
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
  Sigma,
  Table2,
  Undo2,
  Upload,
  X,
} from "lucide-react";
import AcademyLessonBlocks from "@/components/tutor-academy/AcademyLessonBlocks";
import AcademyMath from "@/components/tutor-academy/AcademyMath";
import AcademyBlockIcon from "@/components/admin/academy-builder/AcademyBlockIcon";
import BlockInsertionTray from "@/components/admin/academy-builder/BlockInsertionTray";
import AcademyMediaChooser from "@/components/admin/academy-builder/AcademyMediaChooser";
import AcademyPreviewDevicePicker from "@/components/admin/academy-builder/AcademyPreviewDevicePicker";
import AcademyRichTextEditor, {
  paragraphsToRichText,
} from "@/components/admin/AcademyRichTextEditor";
import {
  archiveAcademyCourse,
  createAcademySnapshot,
  inviteAcademyReviewer,
  deleteAcademyMedia,
  discardAcademyDraftV2,
  duplicateAcademyCourse,
  publishAcademyCourseV2,
  restoreAcademySnapshot,
  revokeAcademyReviewInvitation,
  saveAcademyCourseDraft,
  setAcademyReviewCommentResolved,
  uploadAcademyMedia,
  type AcademyAdminActionResult,
  type AcademySnapshotResult,
} from "@/app/dashboard/admin/academy/actions";
import {
  academySlugify,
  groupAcademyValidationIssues,
  validateAcademyCourse,
  type AcademyValidationIssue,
} from "@/lib/academy-course-validation";
import AcademyThemeScope from "@/components/tutor-academy/AcademyThemeScope";
import { academyAccentPalettes, isAcademyJourneyPalette } from "@/lib/academy-theme";
import {
  academyBlockRegistry,
  type AcademyBlockCategory,
  createAcademyId,
  createAcademyLesson,
  createQuestion,
  getAcademyBlockDefinition,
  migrateAcademyCourse,
} from "@/lib/academy-schema";
import { useAcademyEditorStore } from "@/lib/academy-editor-store";
import { replaceAcademyCourseText } from "@/lib/academy-find-replace";
import { academyRecipes, createAcademyRecipe, type AcademyRecipeKey } from "@/lib/academy-recipes";
import type {
  AcademyReviewComment,
  AcademyReviewInvitation,
} from "@/lib/academy-review";
import {
  academyPreviewDevices,
  type AcademyPreviewDeviceId,
} from "@/lib/academy-preview-devices";
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
  AcademyMediaCaptionItem,
  LessonBlock,
  QuizQuestion,
} from "@/lib/tutor-academy";

type Snapshot = {
  id: string;
  draft_revision: number;
  schema_version: number;
  reason: string;
  label: string | null;
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

type CaptionedMediaBlock = Extract<
  LessonBlock,
  { type: "image" | "video" | "audio" }
>;

type InlineInsertKind =
  | "table"
  | "ordered-list"
  | "unordered-list"
  | "equation";

const inputClass =
  "min-h-10 w-full rounded-lg border border-secondary/15 bg-white px-3 text-sm text-secondary outline-none focus:border-primary focus:ring-2 focus:ring-primary/10";
const textareaClass = `${inputClass} py-2.5 leading-6`;
const audienceOptions: Array<{ value: AcademyAudienceRole; label: string }> = [
  { value: "tutor_applicant", label: "Tutor applicants" },
  { value: "tutor", label: "Tutors" },
  { value: "student", label: "Students" },
  { value: "parent", label: "Parents" },
];
const RECENT_BLOCKS_STORAGE_KEY = "academy-builder-recent-blocks-v1";
const blockLibraryCategories: Array<"All" | AcademyBlockCategory> = [
  "All",
  "Text",
  "Media",
  "Interactive",
  "Data & STEM",
  "Assessment",
];

function useDialogFocus(active: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const triggerRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    if (!active) return;
    const container = ref.current;
    if (!container) return;
    triggerRef.current = document.activeElement as HTMLElement | null;
    const getFocusable = () =>
      container.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
    const focusFrame = window.requestAnimationFrame(() => {
      getFocusable()[0]?.focus();
    });
    const onKeyDown = (event: KeyboardEvent) => {
      const dialogs = document.querySelectorAll<HTMLElement>(
        '[role="dialog"][aria-modal="true"]',
      );
      if (dialogs[dialogs.length - 1] !== container) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
        return;
      }
      const focusable = getFocusable();
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
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", onKeyDown);
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    };
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
      className="absolute left-0 top-14 z-40 w-[min(310px,calc(100vw-3rem))] overflow-hidden rounded-xl border border-secondary/15 bg-white text-left shadow-2xl"
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
              {preset.value.includes("heading") ||
              preset.value === "heading" ? (
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
  editing,
  activeSettingsTab,
  onSelect,
  onEdit,
  onMove,
  onMoveDirection,
  canMoveUp,
  canMoveDown,
  onDuplicate,
  onDelete,
  onOpenSettings,
  onOpenLayout,
  onApplyTextPreset,
  children,
}: {
  block: LessonBlock;
  lessonId: string;
  index: number;
  selected: boolean;
  editing: boolean;
  activeSettingsTab: "content" | "design" | "accessibility" | "logic" | null;
  onSelect: () => void;
  onEdit: () => void;
  onMove: (from: number, to: number) => void;
  onMoveDirection: (direction: -1 | 1) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onDuplicate: () => void;
  onDelete: () => void;
  onOpenSettings: (
    tab: "content" | "design" | "accessibility" | "logic",
  ) => void;
  onOpenLayout: () => void;
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
  const hasLayoutTool = block.type === "text";
  const hasLogicTool = [
    "accordion",
    "carousel",
    "tabs",
    "flashcards",
    "process",
    "survey",
    "knowledge-check",
  ].includes(block.type);
  const activeToolClass = "bg-[#163D73] text-white hover:bg-[#0E2D59]";
  const idleToolClass = "text-secondary/45 hover:bg-slate-100 active:bg-slate-200";
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
        onClick={(event) => event.stopPropagation()}
        className={`relative z-30 mb-4 inline-block min-h-14 w-fit max-w-full align-top transition-opacity motion-reduce:transition-none ${selected ? "opacity-100" : "pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"}`}
      >
        <div className="flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-secondary/15 bg-white p-1 shadow-sm">
          <span className="shrink-0 px-2 text-[10px] font-bold uppercase tracking-[0.08em] text-primary">
            {getAcademyBlockDefinition(block.type).label}
          </span>
          <button
            ref={handleRef}
            type="button"
            aria-label={`Move ${getAcademyBlockDefinition(block.type).label}`}
            title="Drag to reorder · Alt+↑/↓ also moves this block"
            onKeyDown={(event) => {
              if (!event.altKey) return;
              if (event.key === "ArrowUp" && canMoveUp) {
                event.preventDefault();
                onMoveDirection(-1);
              }
              if (event.key === "ArrowDown" && canMoveDown) {
                event.preventDefault();
                onMoveDirection(1);
              }
            }}
            className="inline-flex h-11 w-11 shrink-0 cursor-grab items-center justify-center rounded-lg text-secondary/45 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-primary"
          >
            <GripVertical size={16} />
          </button>
          <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${getAcademyBlockDefinition(block.type).label}`}
          aria-pressed={editing || activeSettingsTab === "content"}
          title="Edit content"
          className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary ${editing || activeSettingsTab === "content" ? activeToolClass : idleToolClass}`}
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
          onClick={() => onOpenSettings("design")}
          aria-label="Edit block design"
          aria-pressed={activeSettingsTab === "design"}
          title="Design: style, surface and spacing"
          className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary ${activeSettingsTab === "design" ? activeToolClass : idleToolClass}`}
          >
            <Palette size={16} />
          </button>
          {hasLayoutTool ? (
            <button
              ref={presetButtonRef}
              type="button"
            onClick={() => {
              onSelect();
              onOpenLayout();
              setPresetOpen((value) => !value);
              }}
              aria-label="Change block layout"
              aria-expanded={presetOpen}
              aria-pressed={presetOpen}
              title="Choose a text layout"
              className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary ${presetOpen ? activeToolClass : idleToolClass}`}
            >
              <Columns3 size={16} />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onDuplicate}
            aria-label="Duplicate block"
            title="Duplicate block"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-secondary/45 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Copy size={16} />
          </button>
          {hasLogicTool ? (
            <button
              type="button"
              onClick={() => onOpenSettings("logic")}
              aria-label="Edit block completion rules"
              aria-pressed={activeSettingsTab === "logic"}
              title="Completion and interaction rules"
              className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary ${activeSettingsTab === "logic" ? activeToolClass : idleToolClass}`}
            >
              <SlidersHorizontal size={16} />
            </button>
          ) : null}
          <div className="flex shrink-0 border-l border-secondary/10 pl-1">
            <button
              type="button"
              onClick={() => onMoveDirection(-1)}
              disabled={!canMoveUp}
              aria-label="Move block up"
              title="Move block up"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-secondary/45 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-20"
            >
              <ArrowUp size={16} />
            </button>
            <button
              type="button"
              onClick={() => onMoveDirection(1)}
              disabled={!canMoveDown}
              aria-label="Move block down"
              title="Move block down"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-secondary/45 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-20"
            >
              <ArrowDown size={16} />
            </button>
            <button
              type="button"
              onClick={onDelete}
              aria-label="Delete block"
              title="Delete block"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-red-500 outline-none hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-500"
            >
              <Trash2 size={16} />
            </button>
          </div>
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
  mediaLibrary = [],
}: {
  items: Array<Record<string, unknown>>;
  onChange: (items: Array<Record<string, unknown>>) => void;
  kind: "standard" | "media" | "gallery" | "resource";
  mediaLibrary?: Media[];
}) {
  const [mediaItemIndex, setMediaItemIndex] = useState<number | null>(null);
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
            <div className="flex items-center">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => {
                  const next = [...items];
                  [next[index - 1], next[index]] = [
                    next[index],
                    next[index - 1],
                  ];
                  onChange(next);
                }}
                aria-label={`Move item ${index + 1} up`}
                className="inline-flex h-10 w-10 items-center justify-center text-secondary/45 disabled:opacity-20"
              >
                <ArrowUp size={15} />
              </button>
              <button
                type="button"
                disabled={index === items.length - 1}
                onClick={() => {
                  const next = [...items];
                  [next[index], next[index + 1]] = [
                    next[index + 1],
                    next[index],
                  ];
                  onChange(next);
                }}
                aria-label={`Move item ${index + 1} down`}
                className="inline-flex h-10 w-10 items-center justify-center text-secondary/45 disabled:opacity-20"
              >
                <ArrowDown size={15} />
              </button>
              <button
                type="button"
                onClick={() =>
                  onChange(items.filter((_, itemIndex) => itemIndex !== index))
                }
                aria-label={`Remove item ${index + 1}`}
                className="inline-flex h-10 w-10 items-center justify-center text-red-500"
              >
                <Trash2 size={15} />
              </button>
            </div>
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
                <button
                  type="button"
                  onClick={() => setMediaItemIndex(index)}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-primary/20 bg-white px-3 text-xs font-black text-primary"
                >
                  <Upload size={14} /> Choose image
                </button>
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
      <AcademyMediaChooser
        open={mediaItemIndex !== null}
        title="Choose item image"
        library={mediaLibrary}
        selectedUrl={
          mediaItemIndex === null
            ? undefined
            : String(items[mediaItemIndex]?.src || "")
        }
        onClose={() => setMediaItemIndex(null)}
        onChoose={(choice) => {
          if (mediaItemIndex === null) return;
          onChange(
            items.map((item, index) =>
              index === mediaItemIndex
                ? {
                    ...item,
                    src: choice.url,
                    alt: item.alt || choice.altText || "",
                  }
                : item,
            ),
          );
        }}
        onUpload={async (file) => {
          const data = new FormData();
          data.set("file", file);
          const result = await uploadAcademyMedia(data);
          if (!result.ok || !result.url) {
            window.alert(result.message);
            return null;
          }
          return { name: file.name, url: result.url, mediaType: "image" };
        }}
      />
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
      <div className="border-b border-secondary/10 px-5 py-4 pr-16">
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-primary/60">
          Selected block
        </p>
        <div className="mt-1">
          <h2 className="text-lg font-black text-secondary">
            {getAcademyBlockDefinition(block.type).label}
          </h2>
          <div
            className="mt-3 flex items-center gap-1"
            aria-label="Selected block actions"
          >
            <button
              type="button"
              onClick={() => onMove(-1)}
              aria-label="Move block up"
              title="Move block up"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-secondary/50 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ArrowUp size={17} />
            </button>
            <button
              type="button"
              onClick={() => onMove(1)}
              aria-label="Move block down"
              title="Move block down"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-secondary/50 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ArrowDown size={17} />
            </button>
            <button
              type="button"
              onClick={onDuplicate}
              aria-label="Duplicate block"
              title="Duplicate block"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-secondary/50 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Copy size={17} />
            </button>
            <button
              type="button"
              onClick={onDelete}
              aria-label="Delete block"
              title="Delete block"
              className="ml-auto inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-xs font-bold text-red-600 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-500"
            >
              <Trash2 size={17} />
              Delete
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
                {[
                  "accordion",
                  "carousel",
                  "tabs",
                  "flashcards",
                  "process",
                  "survey",
                  "knowledge-check",
                ].includes(block.type) ? (
                  <option value="interact">Complete on interaction</option>
                ) : null}
                {block.type === "knowledge-check" ? (
                  <option value="pass">Complete on pass</option>
                ) : null}
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
          <>
            <div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.13em] text-secondary/45">
                Style
              </p>
              <div className="grid grid-cols-3 gap-2">
                {getAcademyBlockDefinition(block.type).variants.map(
                  (variant) => (
                    <button
                      key={variant.key}
                      type="button"
                      title={variant.description}
                      onClick={() =>
                        onChange({
                          ...block,
                          appearance: {
                            variant: variant.key,
                            surface: block.appearance?.surface || "plain",
                            spacing: block.appearance?.spacing || "comfortable",
                            width: block.appearance?.width || "reading",
                          },
                        })
                      }
                      className={`min-h-16 rounded-lg border p-2 text-left text-[11px] font-black ${block.appearance?.variant === variant.key ? "border-primary bg-primary/5 text-primary" : "border-secondary/10"}`}
                    >
                      {variant.label}
                      <BlockVariantPreview
                        type={block.type}
                        variant={variant.key}
                      />
                    </button>
                  ),
                )}
              </div>
            </div>
            <Field label="Content width">
              <div className="grid grid-cols-3 rounded-xl bg-slate-100 p-1">
                {(["narrow", "reading", "wide"] as const).map((width) => (
                  <button
                    key={width}
                    type="button"
                    onClick={() =>
                      onChange({
                        ...block,
                        appearance: {
                          variant:
                            block.appearance?.variant ||
                            getAcademyBlockDefinition(block.type).variants[0]
                              .key,
                          surface: block.appearance?.surface || "plain",
                          spacing: block.appearance?.spacing || "comfortable",
                          width,
                        },
                      })
                    }
                    className={`min-h-10 rounded-lg text-[11px] font-black capitalize ${
                      (block.appearance?.width || "reading") === width
                        ? "bg-white text-primary shadow-sm"
                        : "text-secondary/45"
                    }`}
                  >
                    {width}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Surface">
              <div className="space-y-2">
                {(
                  [
                    ["plain", "Light", "bg-white"],
                    ["subtle", "Soft tint", "bg-primary/5"],
                    [
                      "accent",
                      "Accent edge",
                      "border-l-4 border-primary bg-white",
                    ],
                  ] as const
                ).map(([surface, label, preview]) => (
                  <button
                    key={surface}
                    type="button"
                    onClick={() =>
                      onChange({
                        ...block,
                        appearance: {
                          variant:
                            block.appearance?.variant ||
                            getAcademyBlockDefinition(block.type).variants[0]
                              .key,
                          surface,
                          spacing: block.appearance?.spacing || "comfortable",
                          width: block.appearance?.width || "reading",
                        },
                      })
                    }
                    className={`flex min-h-12 w-full items-center justify-between rounded-lg border px-3 text-left text-xs font-black ${block.appearance?.surface === surface ? "border-primary text-primary" : "border-secondary/10 text-secondary"}`}
                  >
                    {label}
                    <span
                      className={`h-7 w-16 rounded border border-secondary/10 ${preview}`}
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Spacing">
              <select
                className={inputClass}
                value={block.appearance?.spacing || "comfortable"}
                onChange={(event) =>
                  onChange({
                    ...block,
                    appearance: {
                      variant:
                        block.appearance?.variant ||
                        getAcademyBlockDefinition(block.type).variants[0].key,
                      surface: block.appearance?.surface || "plain",
                      spacing: event.target.value as
                        | "compact"
                        | "comfortable"
                        | "spacious",
                      width: block.appearance?.width || "reading",
                    },
                  })
                }
              >
                <option value="compact">Compact</option>
                <option value="comfortable">Comfortable</option>
                <option value="spacious">Spacious</option>
              </select>
            </Field>
            {block.type === "image" ? (
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
                <Field label="Focal point">
                  <select
                    className={inputClass}
                    value={block.focalPoint || "center"}
                    onChange={(event) =>
                      onChange({ ...block, focalPoint: event.target.value })
                    }
                  >
                    <option value="center">Centre</option>
                    <option value="center top">Top</option>
                    <option value="center bottom">Bottom</option>
                    <option value="left center">Left</option>
                    <option value="right center">Right</option>
                  </select>
                </Field>
              </>
            ) : null}
          </>
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

function BlockVariantPreview({
  type,
  variant,
}: {
  type: LessonBlock["type"];
  variant: string;
}) {
  if (["image", "gallery", "carousel", "video"].includes(type))
    return (
      <span
        className="relative mt-2 block h-12 overflow-hidden rounded-md bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(180deg, transparent, rgba(7,25,48,.42)), url('/images/home/8.professional-online-teacher.jpg')",
        }}
        aria-hidden="true"
      >
        {variant === "framed" ? (
          <span className="absolute inset-1 rounded border border-white/80" />
        ) : null}
        {variant === "captioned" ? (
          <span className="absolute inset-x-1 bottom-1 h-1 rounded-full bg-white/90" />
        ) : null}
      </span>
    );
  if (type === "numbered-list")
    return (
      <span className="mt-2 block space-y-1.5" aria-hidden="true">
        {[1, 2, 3].map((number) => (
          <span key={number} className="flex items-center gap-1.5">
            <span
              className={`inline-flex h-3.5 w-3.5 items-center justify-center text-[7px] font-black ${
                variant === "numbered"
                  ? "rounded-full bg-current text-white"
                  : variant === "checklist"
                    ? "rounded-sm border border-current"
                    : "text-current"
              }`}
            >
              {variant === "bulleted"
                ? "•"
                : variant === "checklist"
                  ? "✓"
                  : number}
            </span>
            <span className="h-1 flex-1 rounded bg-current opacity-15" />
          </span>
        ))}
      </span>
    );
  if (type === "process")
    return variant === "build-up" ? (
      <span
        className="mt-2 block space-y-1 rounded border border-current/15 p-1.5"
        aria-hidden="true"
      >
        {[1, 2, 3].map((number, index) => (
          <span key={number} className="flex items-center gap-1.5">
            <span className="grid h-2.5 w-2.5 shrink-0 place-items-center rounded-full bg-current text-[6px] font-bold text-white">
              {number}
            </span>
            <span className={`h-1 flex-1 rounded bg-current ${index === 2 ? "opacity-10" : "opacity-25"}`} />
          </span>
        ))}
      </span>
    ) : variant === "slides" ? (
      <span
        className="mt-2 block rounded border border-current/15 p-1.5"
        aria-hidden="true"
      >
        <span className="block h-1 w-1/2 rounded bg-current opacity-30" />
        <span className="mt-1 block h-1 w-full rounded bg-current opacity-15" />
        <span className="mx-auto mt-2 block h-1.5 w-8 rounded-full bg-current opacity-35" />
      </span>
    ) : (
      <span
        className="mt-2 block space-y-1.5 border-l border-current/25 pl-2"
        aria-hidden="true"
      >
        {[1, 2, 3].map((item) => (
          <span
            key={item}
            className="block h-1 w-full rounded bg-current opacity-20"
          />
        ))}
      </span>
    );
  if (type === "flashcards")
    return (
      <span
        className={`mt-2 grid gap-1 ${variant === "flip-grid" ? "grid-cols-2" : "grid-cols-1"}`}
        aria-hidden="true"
      >
        <span className="h-7 rounded border border-current/20 bg-current/5" />
        {variant === "flip-grid" ? (
          <span className="h-7 rounded border border-current/20 bg-current/5" />
        ) : null}
      </span>
    );
  if (type === "survey")
    return (
      <span className="mt-3 flex justify-between" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((item) => (
          <span
            key={item}
            className="h-2.5 w-2.5 rounded-full border border-current/40"
          />
        ))}
      </span>
    );
  return (
    <span
      className={`mt-2 block border border-secondary/10 bg-white ${variant === "compact" ? "p-1.5" : "p-2"}`}
      aria-hidden="true"
    >
      <span
        className={`mb-1 block h-1.5 bg-current opacity-30 ${variant === "editorial" ? "w-12 rounded-none" : "w-8 rounded-full"}`}
      />
      <span className="block h-1 w-full rounded-full bg-current opacity-15" />
      <span className="mt-1 block h-1 w-4/5 rounded-full bg-current opacity-15" />
      {variant !== "compact" ? (
        <span className="mt-1 block h-1 w-3/5 rounded-full bg-current opacity-10" />
      ) : null}
    </span>
  );
}

function BlockLibraryPreview({ type }: { type: LessonBlock["type"] }) {
  const frame =
    "relative h-28 overflow-hidden border-b border-secondary/10 bg-[#F6F3ED]";
  const photo =
    type === "gallery"
      ? "/images/home/12.happy-learning-moment.jpg"
      : type === "carousel"
        ? "/images/home/9.modern-online-tutoring.jpg"
        : "/images/home/8.professional-online-teacher.jpg";

  if (["image", "gallery", "carousel", "video"].includes(type))
    return (
      <span className={`${frame} block`} aria-hidden="true">
        <span
          className="absolute inset-0 bg-cover bg-center transition duration-300 group-hover:scale-105 motion-reduce:transition-none"
          style={{ backgroundImage: `url('${photo}')` }}
        />
        <span className="absolute inset-0 bg-gradient-to-t from-secondary/55 via-transparent to-transparent" />
        {type === "gallery" ? (
          <span className="absolute inset-3 grid grid-cols-2 gap-1.5">
            <span className="rounded-md border-2 border-white/80 bg-white/10" />
            <span className="rounded-md border-2 border-white/80 bg-white/10" />
          </span>
        ) : null}
        {type === "carousel" ? (
          <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2 py-1 text-[9px] font-bold text-secondary">
            1 / 3 →
          </span>
        ) : null}
        {type === "video" ? (
          <span className="absolute left-1/2 top-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-primary shadow-lg">
            ▶
          </span>
        ) : null}
        {type === "image" ? (
          <span className="absolute inset-x-3 bottom-3 text-[10px] font-semibold text-white">
            Image + caption
          </span>
        ) : null}
      </span>
    );

  if (type === "text")
    return (
      <span className={`${frame} block p-5 text-left`} aria-hidden="true">
        <span className="academy-editorial-copy block text-lg font-bold leading-none text-secondary">
          A clear idea
        </span>
        <span className="mt-3 block h-1.5 w-full rounded-full bg-secondary/15" />
        <span className="mt-2 block h-1.5 w-5/6 rounded-full bg-secondary/15" />
        <span className="mt-2 block h-1.5 w-2/3 rounded-full bg-secondary/15" />
      </span>
    );
  if (type === "quote")
    return (
      <span className={`${frame} block p-5 text-left`} aria-hidden="true">
        <span className="academy-editorial-copy text-3xl leading-none text-[#B56B2E]">
          “
        </span>
        <span className="academy-editorial-copy mt-1 block text-sm italic leading-5 text-secondary">
          Learning begins with curiosity.
        </span>
        <span className="mt-2 block text-[9px] font-semibold uppercase tracking-widest text-secondary/50">
          — Tutor voice
        </span>
      </span>
    );
  if (type === "callout")
    return (
      <span className={`${frame} block p-4`} aria-hidden="true">
        <span className="block rounded-lg border-l-4 border-[#B56B2E] bg-[#FFF4E8] p-3 text-left">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-[#94501D]">
            Key point
          </span>
          <span className="mt-1 block text-xs leading-4 text-secondary/70">
            Pause and connect this idea.
          </span>
        </span>
      </span>
    );
  if (type === "numbered-list")
    return (
      <span className={`${frame} block space-y-2 p-4`} aria-hidden="true">
        {["Prepare", "Practise", "Reflect"].map((label, index) => (
          <span
            key={label}
            className="flex items-center gap-2 text-[10px] font-semibold text-secondary/70"
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-white">
              {index + 1}
            </span>
            {label}
          </span>
        ))}
      </span>
    );
  if (type === "divider")
    return (
      <span
        className={`${frame} grid place-items-center px-5`}
        aria-hidden="true"
      >
        <span className="flex w-full items-center gap-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-secondary/45">
          <span className="h-px flex-1 bg-secondary/20" />
          Next idea
          <span className="h-px flex-1 bg-secondary/20" />
        </span>
      </span>
    );
  if (type === "audio")
    return (
      <span
        className={`${frame} flex items-center gap-3 p-5`}
        aria-hidden="true"
      >
        <span className="grid h-10 w-10 place-items-center rounded-full bg-[#39766C] text-white">
          ▶
        </span>
        <span className="flex flex-1 items-center gap-1">
          {[12, 22, 15, 30, 18, 25, 11, 20, 14].map((height, index) => (
            <span
              key={index}
              className="w-1 rounded-full bg-[#39766C]/55"
              style={{ height }}
            />
          ))}
        </span>
        <span className="text-[9px] font-semibold text-secondary/50">
          02:14
        </span>
      </span>
    );
  if (type === "resources")
    return (
      <span className={`${frame} block space-y-2 p-4`} aria-hidden="true">
        {["Lesson guide.pdf", "Useful link"].map((label, index) => (
          <span
            key={label}
            className="flex items-center gap-2 rounded-md bg-white px-3 py-2 text-[10px] font-semibold text-secondary shadow-sm"
          >
            <span className="text-primary">{index ? "↗" : "↓"}</span>
            {label}
          </span>
        ))}
      </span>
    );
  if (type === "accordion")
    return (
      <span className={`${frame} block space-y-1.5 p-4`} aria-hidden="true">
        {["Why it matters", "Try an example", "Go further"].map(
          (label, index) => (
            <span
              key={label}
              className={`flex items-center justify-between border-b border-secondary/15 py-1.5 text-[10px] font-semibold ${index === 0 ? "text-primary" : "text-secondary/70"}`}
            >
              <span>{label}</span>
              <span>＋</span>
            </span>
          ),
        )}
      </span>
    );
  if (type === "tabs")
    return (
      <span className={`${frame} block p-4`} aria-hidden="true">
        <span className="flex gap-3 border-b border-secondary/15 text-[9px] font-semibold">
          <span className="border-b-2 border-primary pb-2 text-primary">
            Concept
          </span>
          <span className="pb-2 text-secondary/45">Example</span>
        </span>
        <span className="mt-3 block h-10 rounded-md bg-white p-2 shadow-sm">
          <span className="block h-1.5 w-full rounded bg-secondary/15" />
          <span className="mt-2 block h-1.5 w-2/3 rounded bg-secondary/10" />
        </span>
      </span>
    );
  if (type === "flashcards")
    return (
      <span
        className={`${frame} grid place-items-center p-4`}
        aria-hidden="true"
      >
        <span className="grid h-20 w-32 rotate-[-2deg] place-items-center rounded-lg bg-[#243B55] px-3 text-center text-xs font-semibold text-white shadow-[8px_7px_0_#C7D8EA]">
          What would you do?
        </span>
      </span>
    );
  if (type === "process")
    return (
      <span className={`${frame} flex items-center px-4`} aria-hidden="true">
        {["Plan", "Teach", "Review"].map((label, index) => (
          <span key={label} className="contents">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-[10px] font-bold text-white">
              {index + 1}
            </span>
            {index < 2 ? <span className="h-0.5 flex-1 bg-primary/25" /> : null}
          </span>
        ))}
      </span>
    );
  if (type === "survey")
    return (
      <span className={`${frame} block p-4 text-left`} aria-hidden="true">
        <span className="text-[10px] font-semibold text-secondary/70">
          How confident do you feel?
        </span>
        <span className="mt-4 flex justify-between">
          {[1, 2, 3, 4, 5].map((number) => (
            <span
              key={number}
              className={`grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold ${number === 4 ? "bg-[#39766C] text-white" : "border border-secondary/20 bg-white text-secondary/55"}`}
            >
              {number}
            </span>
          ))}
        </span>
      </span>
    );
  if (type === "comparison-table")
    return (
      <span className={`${frame} block p-4`} aria-hidden="true">
        <span className="grid grid-cols-2 overflow-hidden rounded-md border border-secondary/15 text-[9px] text-secondary/65">
          <span className="bg-[#DCE9F7] p-2 font-bold">Option A</span>
          <span className="bg-[#DCE9F7] p-2 font-bold">Option B</span>
          <span className="border-t border-secondary/10 bg-white p-2">
            Flexible
          </span>
          <span className="border-l border-t border-secondary/10 bg-white p-2">
            Guided
          </span>
        </span>
      </span>
    );
  if (type === "worked-example")
    return (
      <span className={`${frame} block p-4 text-left`} aria-hidden="true">
        <span className="academy-editorial-copy block text-sm font-bold text-secondary">
          2x + 4 = 12
        </span>
        <span className="mt-2 block border-l-2 border-[#B56B2E] pl-3 text-[10px] leading-5 text-secondary/60">
          Subtract 4<br />
          Divide by 2
        </span>
        <span className="mt-1 block text-right text-xs font-bold text-[#39766C]">
          x = 4
        </span>
      </span>
    );
  return (
    <span className={`${frame} block p-4 text-left`} aria-hidden="true">
      <span className="text-[10px] font-semibold text-secondary">
        Which answer fits best?
      </span>
      <span className="mt-3 block space-y-2">
        {["A thoughtful response", "Another option"].map((label, index) => (
          <span
            key={label}
            className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-[9px] ${index === 0 ? "border-primary bg-primary/5 text-primary" : "border-secondary/15 bg-white text-secondary/55"}`}
          >
            <span className="h-2.5 w-2.5 rounded-full border border-current" />
            {label}
          </span>
        ))}
      </span>
    </span>
  );
}

function isCaptionedMediaBlock(
  block: LessonBlock,
): block is CaptionedMediaBlock {
  return (
    block.type === "image" || block.type === "video" || block.type === "audio"
  );
}

function InlineMediaCaption({
  block,
  onChange,
}: {
  block: CaptionedMediaBlock;
  onChange: (block: CaptionedMediaBlock) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [equationOpen, setEquationOpen] = useState(false);
  const [latex, setLatex] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [longDescription, setLongDescription] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const closeEquation = () => setEquationOpen(false);
  const equationDialogRef = useDialogFocus(equationOpen, closeEquation);
  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [menuOpen]);
  const items: Array<{
    kind: InlineInsertKind;
    label: string;
    description: string;
    icon: typeof Table2;
  }> = [
    {
      kind: "table",
      label: "Table",
      description: "Compare information",
      icon: Table2,
    },
    {
      kind: "ordered-list",
      label: "Ordered list",
      description: "Add numbered steps",
      icon: ListOrdered,
    },
    {
      kind: "unordered-list",
      label: "Unordered list",
      description: "Add bullet points",
      icon: List,
    },
    {
      kind: "equation",
      label: "Equation",
      description: "Insert LaTeX mathematics",
      icon: Sigma,
    },
  ];
  const captionItems = block.captionItems || [];
  const addItem = (kind: Exclude<InlineInsertKind, "equation">) => {
    const item: AcademyMediaCaptionItem =
      kind === "table"
        ? {
            id: createAcademyId("caption"),
            type: "table",
            columns: ["Heading 1", "Heading 2"],
            rows: [["Cell 1", "Cell 2"]],
          }
        : {
            id: createAcademyId("caption"),
            type: kind,
            items: ["Add a caption item"],
          };
    onChange({ ...block, captionItems: [...captionItems, item] });
  };
  const updateItem = (next: AcademyMediaCaptionItem) =>
    onChange({
      ...block,
      captionItems: captionItems.map((item) =>
        item.id === next.id ? next : item,
      ),
    });
  const removeItem = (id: string) =>
    onChange({
      ...block,
      captionItems: captionItems.filter((item) => item.id !== id),
    });
  return (
    <div
      className="relative mt-3 border-b border-secondary/20 pb-3"
      ref={menuRef}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          aria-label="Add structured content to this media caption"
          aria-expanded={menuOpen}
          className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border bg-white shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-primary ${menuOpen ? "rotate-45 border-secondary text-secondary" : "border-secondary/20 text-primary hover:border-primary"}`}
        >
          <Plus size={20} />
        </button>
        <label className="min-w-0 flex-1">
          <span className="sr-only">Media caption</span>
          <textarea
            rows={1}
            value={block.caption || ""}
            onChange={(event) =>
              onChange({ ...block, caption: event.target.value })
            }
            placeholder="Add a caption"
            className="min-h-11 w-full resize-none bg-transparent px-1 py-2 font-[family-name:var(--font-academy-serif)] text-[14px] leading-6 text-secondary outline-none placeholder:text-secondary/40"
          />
        </label>
      </div>
      {captionItems.length ? (
        <div
          className="ml-14 mt-3 space-y-3"
          aria-label="Structured caption content"
        >
          {captionItems.map((item) => (
            <div
              key={item.id}
              className="relative rounded-lg border border-secondary/10 bg-[#F8F7F4] p-3 pr-11"
            >
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                aria-label="Remove caption item"
                className="absolute right-1.5 top-1.5 grid h-9 w-9 place-items-center rounded-lg text-red-500 hover:bg-red-50"
              >
                <Trash2 size={15} />
              </button>
              {item.type === "ordered-list" ||
              item.type === "unordered-list" ? (
                <label className="block">
                  <span className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.12em] text-secondary/45">
                    {item.type === "ordered-list"
                      ? "Ordered list"
                      : "Unordered list"}
                  </span>
                  <textarea
                    rows={Math.max(2, item.items.length)}
                    value={item.items.join("\n")}
                    onChange={(event) =>
                      updateItem({
                        ...item,
                        items: event.target.value.split("\n"),
                      })
                    }
                    className="w-full resize-y bg-transparent font-[family-name:var(--font-academy-serif)] text-sm leading-7 outline-none"
                    aria-label={`${item.type === "ordered-list" ? "Ordered" : "Unordered"} caption items, one per line`}
                  />
                </label>
              ) : item.type === "table" ? (
                <div>
                  <span className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.12em] text-secondary/45">
                    Caption table
                  </span>
                  <div className="grid grid-cols-2 overflow-hidden rounded border border-secondary/15">
                    {item.columns.map((column, columnIndex) => (
                      <input
                        key={`column-${columnIndex}`}
                        value={column}
                        onChange={(event) =>
                          updateItem({
                            ...item,
                            columns: item.columns.map((value, index) =>
                              index === columnIndex
                                ? event.target.value
                                : value,
                            ),
                          })
                        }
                        className="min-w-0 border-b border-r border-secondary/10 bg-primary/5 p-2 text-xs font-bold outline-none last:border-r-0"
                        aria-label={`Table heading ${columnIndex + 1}`}
                      />
                    ))}
                    {item.rows[0]?.map((cell, cellIndex) => (
                      <input
                        key={`cell-${cellIndex}`}
                        value={cell}
                        onChange={(event) =>
                          updateItem({
                            ...item,
                            rows: [
                              item.rows[0].map((value, index) =>
                                index === cellIndex
                                  ? event.target.value
                                  : value,
                              ),
                              ...item.rows.slice(1),
                            ],
                          })
                        }
                        className="min-w-0 border-r border-secondary/10 bg-white p-2 text-xs outline-none last:border-r-0"
                        aria-label={`Table cell ${cellIndex + 1}`}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <span className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.12em] text-secondary/45">
                    Equation · {item.shortDescription}
                  </span>
                  <AcademyMath
                    latex={item.latex}
                    display
                    label={item.shortDescription}
                    description={item.longDescription}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : null}
      {menuOpen ? (
        <div
          role="menu"
          aria-label="Insert beneath media"
          className="absolute left-0 top-14 z-40 grid w-[min(360px,calc(100vw-4rem))] grid-cols-2 gap-1 rounded-xl border border-secondary/15 bg-white p-2 shadow-2xl"
        >
          {items.map(({ kind, label, description, icon: Icon }) => (
            <button
              key={kind}
              type="button"
              role="menuitem"
              onClick={() => {
                if (kind === "equation") {
                  setMenuOpen(false);
                  setEquationOpen(true);
                  return;
                } else addItem(kind);
                setMenuOpen(false);
              }}
              className="flex min-h-16 items-start gap-2 rounded-lg p-2 text-left outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <Icon size={17} />
              </span>
              <span>
                <strong className="block text-xs text-secondary">
                  {label}
                </strong>
                <span className="mt-0.5 block text-[10px] leading-4 text-secondary/45">
                  {description}
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : null}
      {equationOpen ? (
        <div
          className="fixed inset-0 z-[130] grid place-items-center bg-secondary/25 p-4"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            onClick={closeEquation}
            aria-label="Close equation editor"
          />
          <div
            ref={equationDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="academy-equation-title"
            className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center gap-4 border-b border-secondary/10 px-6 py-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                  Mathematics
                </p>
                <h2
                  id="academy-equation-title"
                  className="academy-studio-heading mt-1 text-2xl text-secondary"
                >
                  Insert an equation
                </h2>
              </div>
              <button
                type="button"
                onClick={closeEquation}
                className="ml-auto grid h-11 w-11 place-items-center rounded-full hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Close equation editor"
              >
                <X size={20} />
              </button>
            </div>
            <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto p-6 md:grid-cols-2">
              <div>
                <Field label="LaTeX markup">
                  <textarea
                    autoFocus
                    rows={10}
                    value={latex}
                    onChange={(event) => setLatex(event.target.value)}
                    placeholder="e.g. x^2 + y^2 = z^2"
                    className={`${textareaClass} font-mono`}
                  />
                </Field>
                <div className="mt-5 min-h-32 rounded-xl border border-secondary/10 bg-[#F6F3ED] p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-secondary/45">
                    Preview
                  </p>
                  <div className="mt-5 text-center text-xl text-secondary">
                    {latex.trim() ? (
                      <AcademyMath latex={latex} display />
                    ) : (
                      <span className="text-sm text-secondary/40">
                        Enter an equation to see it rendered.
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-5">
                <Field
                  label="Short description"
                  hint="A concise spoken description for learners using a screen reader."
                >
                  <input
                    className={inputClass}
                    value={shortDescription}
                    onChange={(event) =>
                      setShortDescription(event.target.value)
                    }
                    placeholder="For example: Pythagoras’ theorem"
                  />
                </Field>
                <Field
                  label="Long description"
                  hint="Explain notation or meaning when the equation cannot be understood from the short label alone."
                >
                  <textarea
                    rows={8}
                    className={textareaClass}
                    value={longDescription}
                    onChange={(event) => setLongDescription(event.target.value)}
                    placeholder="Optional detailed explanation"
                  />
                </Field>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-secondary/10 px-6 py-4">
              <button
                type="button"
                onClick={closeEquation}
                className="min-h-11 rounded-lg px-5 text-sm font-semibold text-secondary hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!latex.trim() || !shortDescription.trim()}
                onClick={() => {
                  onChange({
                    ...block,
                    captionItems: [
                      ...captionItems,
                      {
                        id: createAcademyId("caption"),
                        type: "equation",
                        latex: latex.trim(),
                        shortDescription: shortDescription.trim(),
                        longDescription: longDescription.trim(),
                      },
                    ],
                  });
                  setLatex("");
                  setShortDescription("");
                  setLongDescription("");
                  closeEquation();
                }}
                className="min-h-11 rounded-lg bg-primary px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-35"
              >
                Insert equation
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
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
  const [mediaChooserOpen, setMediaChooserOpen] = useState(false);
  if (block.type === "text")
    return (
      <p className="text-sm leading-6 text-secondary/50">
        Edit rich text directly in the course canvas.
      </p>
    );
  if (block.type === "image")
    return (
      <>
        <button
          type="button"
          onClick={() => setMediaChooserOpen(true)}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-xs font-black text-white"
        >
          <Upload size={15} /> {block.src ? "Replace image" : "Choose image"}
        </button>
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
        <AcademyMediaChooser
          open={mediaChooserOpen}
          title="Choose image"
          library={mediaLibrary}
          selectedUrl={block.src}
          onClose={() => setMediaChooserOpen(false)}
          onChoose={(choice) =>
            onChange({
              ...block,
              src: choice.url,
              alt: block.alt || choice.altText || "",
            })
          }
          onUpload={async (file) => {
            const data = new FormData();
            data.set("file", file);
            const result = await uploadAcademyMedia(data);
            if (!result.ok || !result.url) {
              window.alert(result.message);
              return null;
            }
            return { name: file.name, url: result.url, mediaType: "image" };
          }}
        />
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
  if (block.type === "survey")
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
        <Field label="Survey question">
          <textarea
            rows={4}
            className={textareaClass}
            value={block.prompt}
            onChange={(event) =>
              onChange({ ...block, prompt: event.target.value })
            }
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Low label">
            <input
              className={inputClass}
              value={block.lowLabel}
              onChange={(event) =>
                onChange({ ...block, lowLabel: event.target.value })
              }
            />
          </Field>
          <Field label="High label">
            <input
              className={inputClass}
              value={block.highLabel}
              onChange={(event) =>
                onChange({ ...block, highLabel: event.target.value })
              }
            />
          </Field>
        </div>
        <Field label="Scale points">
          <div className="grid grid-cols-3 gap-2">
            {([3, 5, 7] as const).map((scale) => (
              <button
                key={scale}
                type="button"
                onClick={() => onChange({ ...block, scale })}
                className={`min-h-11 rounded-lg border text-sm font-black ${block.scale === scale ? "border-primary bg-primary/5 text-primary" : "border-secondary/10"}`}
              >
                {scale}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Button label">
          <input
            className={inputClass}
            value={block.submitLabel || "Submit"}
            onChange={(event) =>
              onChange({ ...block, submitLabel: event.target.value })
            }
          />
        </Field>
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
          mediaLibrary={mediaLibrary}
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
          mediaLibrary={mediaLibrary}
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
        {[
          "numbered-list",
          "accordion",
          "tabs",
          "flashcards",
          "process",
        ].includes(block.type) ? (
          <div className="rounded-xl border border-primary/15 bg-primary/[0.035] p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.13em] text-primary/65">
              Instant convert
            </p>
            <p className="mt-1 text-xs leading-5 text-secondary/50">
              Keep this content and present it in another learner format.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(
                [
                  "numbered-list",
                  "accordion",
                  "tabs",
                  "flashcards",
                  "process",
                ] as LessonBlock["type"][]
              )
                .filter((type) => type !== block.type)
                .map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      const created = getAcademyBlockDefinition(type).create();
                      if (!("items" in created)) return;
                      onChange({
                        ...created,
                        id: block.id,
                        heading: block.heading,
                        items: structuredClone(block.items),
                        completion:
                          type === "numbered-list"
                            ? "view"
                            : block.completion === "pass"
                              ? "interact"
                              : block.completion,
                      } as LessonBlock);
                    }}
                    className="flex min-h-11 items-center gap-2 rounded-lg border border-secondary/10 bg-white px-3 text-left text-[11px] font-black hover:border-primary/30 hover:text-primary"
                  >
                    <AcademyBlockIcon
                      name={getAcademyBlockDefinition(type).icon}
                      size={15}
                    />
                    {getAcademyBlockDefinition(type).shortLabel}
                  </button>
                ))}
            </div>
          </div>
        ) : null}
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
  reviewInvitations = [],
  reviewComments = [],
  initialLessonId,
  initialAssessmentOpen = false,
}: {
  initialCourse: AcademyCourse;
  status: "draft" | "published" | "archived";
  mediaLibrary?: Media[];
  initialRevision?: number;
  snapshots?: Snapshot[];
  reviewInvitations?: AcademyReviewInvitation[];
  reviewComments?: AcademyReviewComment[];
  initialLessonId?: string;
  initialAssessmentOpen?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryCategory, setLibraryCategory] = useState<
    "All" | AcademyBlockCategory
  >("All");
  const [recentBlockTypes, setRecentBlockTypes] = useState<
    LessonBlock["type"][]
  >([]);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [editingTextBlockId, setEditingTextBlockId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [invitations, setInvitations] = useState(reviewInvitations);
  const [comments, setComments] = useState(reviewComments);
  const [findReplaceOpen, setFindReplaceOpen] = useState(false);
  const [snapshotEntries, setSnapshotEntries] = useState(snapshots);
  const [assessmentOpen, setAssessmentOpen] = useState(initialAssessmentOpen);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [readinessOpen, setReadinessOpen] = useState(false);
  const [outlineOpen, setOutlineOpen] = useState(true);
  const [outlineSearch, setOutlineSearch] = useState("");
  const [lessonSettingsOpen, setLessonSettingsOpen] = useState(false);
  const [draggedLessonId, setDraggedLessonId] = useState<string | null>(null);
  const [collapsedSectionIds, setCollapsedSectionIds] = useState<string[]>([]);
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
  const [deletedNotice, setDeletedNotice] = useState("");
  const [result, setResult] = useState<AcademyAdminActionResult | null>(null);
  const [recovery, setRecovery] = useState<AcademyRecoveryDraft | null>(null);
  const initialized = useRef(false);
  const inspectorReturnFocusRef = useRef<HTMLElement | null>(null);
  const closeInspector = () => {
    setInspectorOpen(false);
    window.requestAnimationFrame(() =>
      inspectorReturnFocusRef.current?.focus(),
    );
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
  const inspectorTab = useAcademyEditorStore((state) => state.inspectorTab);
  useEffect(() => {
    if (editingTextBlockId && editingTextBlockId !== selectedBlockId)
      setEditingTextBlockId(null);
  }, [editingTextBlockId, selectedBlockId]);
  const saveState = useAcademyEditorStore((state) => state.saveState);
  const savedAt = useAcademyEditorStore((state) => state.savedAt);
  const message = useAcademyEditorStore((state) => state.message);
  const initialize = useAcademyEditorStore((state) => state.initialize);
  const command = useAcademyEditorStore((state) => state.command);
  const selectLesson = useAcademyEditorStore((state) => state.selectLesson);
  const selectBlock = useAcademyEditorStore((state) => state.selectBlock);
  const setInspectorTab = useAcademyEditorStore(
    (state) => state.setInspectorTab,
  );
  const setSaveState = useAcademyEditorStore((state) => state.setSaveState);
  const markSaved = useAcademyEditorStore((state) => state.markSaved);
  const undo = useAcademyEditorStore((state) => state.undo);
  const redo = useAcademyEditorStore((state) => state.redo);
  const past = useAcademyEditorStore((state) => state.past);
  const future = useAcademyEditorStore((state) => state.future);
  useEffect(() => {
    if (!initialized.current) {
      initialize(migrateAcademyCourse(initialCourse), initialRevision);
      const requestedLesson = initialCourse.lessons.find(
        (lesson) =>
          lesson.id === initialLessonId || lesson.slug === initialLessonId,
      );
      if (requestedLesson?.id) selectLesson(requestedLesson.id);
      initialized.current = true;
      if (initialCourse.id)
        readAcademyRecoveryDraft(initialCourse.id)
          .then((draft) => {
            if (draft && draft.baseRevision >= initialRevision)
              setRecovery(draft);
          })
          .catch(() => undefined);
    }
  }, [
    initialCourse,
    initialLessonId,
    initialRevision,
    initialize,
    selectLesson,
  ]);
  useEffect(() => {
    try {
      const stored = JSON.parse(
        window.localStorage.getItem(RECENT_BLOCKS_STORAGE_KEY) || "[]",
      ) as LessonBlock["type"][];
      const allowed = new Set(academyBlockRegistry.map((item) => item.type));
      setRecentBlockTypes(
        stored.filter((type) => allowed.has(type)).slice(0, 4),
      );
    } catch {
      // Recent blocks are a convenience; a corrupt local value is disposable.
    }
  }, []);
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
  const moveSection = (from: number, to: number) =>
    command("Move section", (draft) => {
      const sections = draft.sections || [];
      if (
        from < 0 ||
        to < 0 ||
        from >= sections.length ||
        to >= sections.length
      )
        return;
      const [moving] = sections.splice(from, 1);
      sections.splice(to, 0, moving);
      const order = new Map(
        sections.map((section, index) => [section.id, index]),
      );
      draft.lessons = draft.lessons
        .map((lesson, index) => ({ lesson, index }))
        .sort(
          (left, right) =>
            (order.get(left.lesson.sectionId || "") ?? sections.length) -
              (order.get(right.lesson.sectionId || "") ?? sections.length) ||
            left.index - right.index,
        )
        .map(({ lesson }) => lesson);
    });
  const insertCreatedBlock = (
    block: LessonBlock,
    targetIndex: number,
    historyLabel = "Insert block",
  ) => {
    updateLesson(
      (lesson) => lesson.blocks.splice(targetIndex, 0, block),
      historyLabel,
    );
    selectBlock(selectedLesson.id!, block.id!);
    setRecentBlockTypes((current) => {
      const next = [
        block.type,
        ...current.filter((item) => item !== block.type),
      ].slice(0, 4);
      try {
        window.localStorage.setItem(
          RECENT_BLOCKS_STORAGE_KEY,
          JSON.stringify(next),
        );
      } catch {
        // Authoring remains fully functional when storage is unavailable.
      }
      return next;
    });
    setLibraryOpen(false);
    setInsertIndex(null);
  };
  const insertBlock = (
    type: LessonBlock["type"],
    targetIndex = insertIndex ?? selectedLesson?.blocks.length ?? 0,
  ) =>
    insertCreatedBlock(getAcademyBlockDefinition(type).create(), targetIndex);
  const insertRecipe = (key: AcademyRecipeKey) => {
    if (!selectedLesson?.id) return;
    const blocks = createAcademyRecipe(key);
    const targetIndex = insertIndex ?? selectedLesson.blocks.length;
    updateLesson((lesson) => lesson.blocks.splice(targetIndex, 0, ...blocks), `Insert ${academyRecipes.find((recipe) => recipe.key === key)?.title || "learning sequence"}`);
    selectBlock(selectedLesson.id, blocks[0].id!);
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
  const filteredBlocks = academyBlockRegistry.filter(
    (definition) =>
      (libraryCategory === "All" || definition.category === libraryCategory) &&
      `${definition.label} ${definition.description} ${definition.keywords.join(" ")}`
        .toLowerCase()
        .includes(librarySearch.toLowerCase()),
  );
  const readiness = validateAcademyCourse(document);
  const showDeletedNotice = (label: string) => {
    setDeletedNotice(label);
    window.setTimeout(() => setDeletedNotice(""), 7000);
  };
  const navigateToIssue = (issue: AcademyValidationIssue) => {
    setReadinessOpen(false);
    if (issue.scope === "course") {
      setSettingsOpen(true);
      return;
    }
    if (issue.scope === "assessment") {
      setAssessmentOpen(true);
      return;
    }
    if (issue.lessonId) selectLesson(issue.lessonId);
    if (issue.scope === "lesson") {
      setLessonSettingsOpen(true);
      return;
    }
    if (issue.lessonId && issue.blockId) {
      selectBlock(issue.lessonId, issue.blockId);
      setInspectorTab(issue.scope === "media" ? "accessibility" : "content");
      setInspectorOpen(true);
      window.requestAnimationFrame(() =>
        globalThis.document
          .querySelector<HTMLElement>(`[data-block-id="${issue.blockId}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" }),
      );
    }
  };
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
        <Link
          href={`/dashboard/admin/academy/${document.key}/overview`}
          className="hidden text-xs font-semibold text-secondary/50 hover:text-primary lg:block"
        >
          Overview
        </Link>
        <span className="hidden text-secondary/20 lg:block">/</span>
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
            onClick={() => setFindReplaceOpen(true)}
            className="hidden p-2.5 text-secondary/55 outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-primary sm:block"
            aria-label="Find and replace course text"
            title="Find and replace course text"
          >
            <Search size={18} />
          </button>
          <button
            type="button"
            onClick={() => setReviewOpen(true)}
            className="hidden p-2.5 text-secondary/55 outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-primary sm:block"
            aria-label={`Course review comments${comments.filter((comment) => !comment.resolved_at).length ? `, ${comments.filter((comment) => !comment.resolved_at).length} open` : ""}`}
            title="Course review comments"
          >
            <MessageSquare size={18} />
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
                if (saved.ok) setPreviewOpen(true);
              })
            }
            className="inline-flex h-10 w-10 items-center justify-center gap-2 rounded-lg border text-xs font-black md:w-auto md:px-4"
            aria-label="Preview course"
          >
            <Eye size={15} />
            <span className="hidden md:inline">Preview</span>
          </button>
          <button
            type="button"
            disabled={pending || saveState === "conflict"}
            onClick={() => setReadinessOpen(true)}
            className="relative inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-black text-white disabled:opacity-40"
          >
            {pending ? "Working…" : "Publish"}
            {!readiness.valid ? (
              <span
                className="inline-flex min-w-5 items-center justify-center rounded-full bg-white px-1.5 py-0.5 text-[9px] text-primary"
                aria-label={`${readiness.issues.length} publishing issues`}
              >
                {readiness.issues.length}
              </span>
            ) : null}
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
      <div className="border-b border-blue-200 bg-blue-50 px-4 py-2 text-center text-[11px] font-semibold text-blue-950 md:hidden">
        Mobile supports text corrections, preview, and publishing checks. Use a
        tablet or desktop for structure, media, and theme changes.
      </div>
      <div className="flex min-h-0 flex-1">
        {outlineOpen ? (
          <aside className="absolute inset-y-16 left-0 z-30 flex w-[min(352px,calc(100vw-24px))] flex-col border-r border-black/10 bg-[#F8F7F3] shadow-2xl lg:static lg:w-[336px] lg:shadow-none">
            <div className="border-b border-black/8 px-5 pb-5 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#49627A]">
                    Course structure
                  </p>
                  <p className="academy-studio-heading mt-1.5 text-[25px] leading-none text-[#18212B]">
                    Outline
                  </p>
                  <p className="mt-2 text-[11px] font-medium text-[#6C747C]">
                    {document.lessons.length} lessons ·{" "}
                    {document.lessons.reduce(
                      (total, lesson) => total + lesson.durationMinutes,
                      0,
                    )}{" "}
                    min
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
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#18212B] px-4 text-[11px] font-semibold text-white transition-colors hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  aria-label="Add lesson"
                >
                  <Plus size={15} /> Lesson
                </button>
              </div>
              <div className="relative mt-5">
                <Search
                  size={15}
                  className="absolute left-3.5 top-3.5 text-[#7B838B]"
                />
                <input
                  className="min-h-11 w-full rounded-xl border border-black/10 bg-white pl-10 pr-4 text-[13px] text-[#18212B] outline-none placeholder:text-[#8C9399] focus:border-primary focus:ring-2 focus:ring-primary/10"
                  placeholder="Search lessons"
                  value={outlineSearch}
                  onChange={(event) => setOutlineSearch(event.target.value)}
                />
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
                className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-full px-2 text-[11px] font-semibold text-primary outline-none hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Plus size={14} /> Add section
              </button>
            </div>
            <nav
              className="flex-1 overflow-y-auto px-3 py-4"
              aria-label="Course outline"
            >
              {(document.sections || []).map((section, sectionIndex) => (
                <div
                  key={section.id}
                  className="group/section mb-5"
                  onDragOver={(event) => {
                    if (draggedSectionId) event.preventDefault();
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    const from = (document.sections || []).findIndex(
                      (item) => item.id === draggedSectionId,
                    );
                    if (from >= 0 && from !== sectionIndex)
                      moveSection(from, sectionIndex);
                    setDraggedSectionId(null);
                  }}
                >
                  <div className="flex min-h-10 items-center gap-1 rounded-lg px-1.5 text-[#52606D]">
                    <button
                      type="button"
                      draggable
                      onDragStart={(event) => {
                        setDraggedSectionId(section.id);
                        event.dataTransfer.effectAllowed = "move";
                      }}
                      onDragEnd={() => setDraggedSectionId(null)}
                      className="hidden h-9 w-6 cursor-grab items-center justify-center rounded-md text-[#A4ABB1] outline-none hover:bg-white hover:text-primary focus-visible:ring-2 focus-visible:ring-primary lg:inline-flex"
                      aria-label={`Drag ${section.title} to reorder`}
                    >
                      <GripVertical size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCollapsedSectionIds((current) =>
                          current.includes(section.id)
                            ? current.filter((id) => id !== section.id)
                            : [...current, section.id],
                        )
                      }
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg outline-none hover:bg-white focus-visible:ring-2 focus-visible:ring-primary"
                      aria-label={`${collapsedSectionIds.includes(section.id) ? "Expand" : "Collapse"} ${section.title}`}
                      aria-expanded={!collapsedSectionIds.includes(section.id)}
                    >
                      <ChevronDown
                        size={15}
                        className={`transition-transform motion-reduce:transition-none ${collapsedSectionIds.includes(section.id) ? "-rotate-90" : ""}`}
                      />
                    </button>
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
                      className="min-w-0 flex-1 bg-transparent text-[10px] font-semibold uppercase tracking-[0.14em] text-[#52606D] outline-none focus:text-[#18212B]"
                      title={section.title}
                    />
                    <div className="flex shrink-0 items-center opacity-70 transition-opacity group-hover/section:opacity-100 group-focus-within/section:opacity-100">
                      <button
                        type="button"
                        disabled={sectionIndex === 0}
                        onClick={() =>
                          moveSection(sectionIndex, sectionIndex - 1)
                        }
                        className="inline-flex h-8 w-7 items-center justify-center rounded-md outline-none hover:bg-white hover:text-primary focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-20"
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
                          moveSection(sectionIndex, sectionIndex + 1)
                        }
                        className="inline-flex h-8 w-7 items-center justify-center rounded-md outline-none hover:bg-white hover:text-primary focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-20"
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
                        className="inline-flex h-8 w-7 items-center justify-center rounded-md text-primary outline-none hover:bg-white focus-visible:ring-2 focus-visible:ring-primary"
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
                        className="inline-flex h-8 w-7 items-center justify-center rounded-md text-red-500 outline-none hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-20"
                        aria-label={`Delete ${section.title}`}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  {!collapsedSectionIds.includes(section.id)
                    ? document.lessons
                        .filter((lesson) => lesson.sectionId === section.id)
                        .filter((lesson) =>
                          lesson.title
                            .toLowerCase()
                            .includes(outlineSearch.toLowerCase()),
                        )
                        .map((lesson, index) => (
                          <div
                            key={lesson.id}
                            onDragOver={(event) => {
                              if (draggedLessonId) event.preventDefault();
                            }}
                            onDrop={(event) => {
                              event.preventDefault();
                              if (
                                !draggedLessonId ||
                                draggedLessonId === lesson.id
                              )
                                return;
                              command("Move lesson", (draft) => {
                                const from = draft.lessons.findIndex(
                                  (item) => item.id === draggedLessonId,
                                );
                                const to = draft.lessons.findIndex(
                                  (item) => item.id === lesson.id,
                                );
                                if (from < 0 || to < 0) return;
                                const [moving] = draft.lessons.splice(from, 1);
                                draft.lessons.splice(to, 0, moving);
                              });
                              setDraggedLessonId(null);
                            }}
                            className={`group/lesson relative mb-1 flex items-stretch overflow-hidden rounded-xl border transition-colors motion-reduce:transition-none ${selectedLesson?.id === lesson.id ? "border-primary/20 bg-white shadow-[0_5px_18px_rgba(22,31,42,0.06)] before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-primary" : "border-transparent hover:border-black/8 hover:bg-white"}`}
                          >
                            <button
                              type="button"
                              draggable
                              onDragStart={(event) => {
                                setDraggedLessonId(lesson.id!);
                                event.dataTransfer.effectAllowed = "move";
                              }}
                              onDragEnd={() => setDraggedLessonId(null)}
                              className="hidden w-7 shrink-0 cursor-grab items-center justify-center text-[#A4ABB1] outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary lg:inline-flex"
                              aria-label={`Drag ${lesson.title} to reorder`}
                            >
                              <GripVertical size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                selectLesson(lesson.id!);
                                setLessonSettingsOpen(false);
                                if (window.innerWidth < 1024)
                                  setOutlineOpen(false);
                              }}
                              className="flex min-w-0 flex-1 items-center gap-3 py-3.5 pl-2 pr-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                              aria-current={
                                selectedLesson?.id === lesson.id
                                  ? "page"
                                  : undefined
                              }
                            >
                              <span
                                className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold ${selectedLesson?.id === lesson.id ? "border-primary bg-primary text-white" : "border-black/15 bg-[#F8F7F3] text-[#6C747C]"}`}
                              >
                                {index + 1}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-[13px] font-semibold leading-[1.35] text-[#18212B]">
                                  {lesson.title}
                                </span>
                                <span className="mt-1 block text-[10px] font-medium text-[#7B838B]">
                                  {lesson.blocks.length} blocks ·{" "}
                                  {lesson.durationMinutes} min
                                </span>
                              </span>
                            </button>
                            <div className="mr-1 hidden shrink-0 items-center bg-white/90 group-hover/lesson:flex group-focus-within/lesson:flex">
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
                                    const [moving] = draft.lessons.splice(
                                      from,
                                      1,
                                    );
                                    draft.lessons.splice(from - 1, 0, moving);
                                  })
                                }
                                className="inline-flex h-9 w-7 items-center justify-center rounded-md outline-none hover:bg-[#F4F3EF] hover:text-primary focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-20"
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
                                    const [moving] = draft.lessons.splice(
                                      from,
                                      1,
                                    );
                                    draft.lessons.splice(from + 1, 0, moving);
                                  })
                                }
                                className="inline-flex h-9 w-7 items-center justify-center rounded-md outline-none hover:bg-[#F4F3EF] hover:text-primary focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-20"
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
                                className="inline-flex h-9 w-7 items-center justify-center rounded-md outline-none hover:bg-[#F4F3EF] hover:text-primary focus-visible:ring-2 focus-visible:ring-primary"
                                aria-label={`Duplicate ${lesson.title}`}
                              >
                                <Copy size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (
                                    window.confirm(`Delete “${lesson.title}”?`)
                                  ) {
                                    command("Delete lesson", (draft) => {
                                      draft.lessons = draft.lessons.filter(
                                        (item) => item.id !== lesson.id,
                                      );
                                    });
                                    showDeletedNotice(
                                      `Deleted “${lesson.title}”.`,
                                    );
                                  }
                                }}
                                className="inline-flex h-9 w-7 items-center justify-center rounded-md text-red-500 outline-none hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-500"
                                aria-label={`Delete ${lesson.title}`}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const created = createAcademyLesson(
                                  document,
                                  section.id,
                                );
                                command("Insert lesson", (draft) => {
                                  const lessonIndex = draft.lessons.findIndex(
                                    (item) => item.id === lesson.id,
                                  );
                                  draft.lessons.splice(
                                    lessonIndex + 1,
                                    0,
                                    created,
                                  );
                                });
                                selectLesson(created.id!);
                              }}
                              className="absolute -bottom-3 left-1/2 z-10 inline-flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full border border-primary/25 bg-white text-primary opacity-0 shadow-sm outline-none transition-opacity group-hover/lesson:opacity-100 focus:opacity-100 focus-visible:ring-2 focus-visible:ring-primary"
                              aria-label={`Insert a lesson after ${lesson.title}`}
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                        ))
                    : null}
                  <button
                    type="button"
                    onClick={() =>
                      command("Insert section", (draft) => {
                        draft.sections ||= [];
                        draft.sections.splice(sectionIndex + 1, 0, {
                          id: createAcademyId("section"),
                          title: `Section ${draft.sections.length + 1}`,
                        });
                      })
                    }
                    className="mx-auto mt-2 flex min-h-9 items-center gap-1.5 rounded-full px-3 text-[9px] font-semibold uppercase tracking-[0.1em] text-secondary/40 opacity-0 outline-none hover:bg-white hover:text-primary focus:opacity-100 focus-visible:ring-2 focus-visible:ring-primary group-hover/section:opacity-100"
                    aria-label={`Insert a section after ${section.title}`}
                  >
                    <Plus size={11} /> Section
                  </button>
                </div>
              ))}
            </nav>
            <div className="border-t border-black/8 bg-white/75 p-3 backdrop-blur-sm">
              <button
                type="button"
                onClick={() => setAssessmentOpen(true)}
                className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-[12px] font-semibold text-[#18212B] outline-none hover:bg-[#F4F3EF] focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/8 text-primary">
                  <BookOpen size={16} />
                </span>
                <span>
                  <span className="block">Final assessment</span>
                  <span className="mt-0.5 block text-[9px] font-medium text-[#7B838B]">
                    Questions and pass mark
                  </span>
                </span>
                <span className="ml-auto rounded-full bg-[#F4F3EF] px-2 py-1 text-[10px] text-secondary/45">
                  {document.quiz.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="mt-1 flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-[12px] font-semibold text-[#18212B] outline-none hover:bg-[#F4F3EF] focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#EEF0EA] text-[#49627A]">
                  <Palette size={16} />
                </span>
                <span>
                  <span className="block">Course appearance</span>
                  <span className="mt-0.5 block text-[9px] font-medium text-[#7B838B]">
                    Theme, cover and settings
                  </span>
                </span>
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
              <AcademyThemeScope course={document}>
                <article className="bg-white px-8 py-12 shadow-[0_10px_35px_rgba(0,26,68,0.07)] sm:px-12">
                  <header className="border-b border-[#DEDFE1] pb-9">
                    <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-[#717376]">
                      <span>{selectedLesson.section}</span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock3 size={13} />
                        {selectedLesson.durationMinutes} min
                      </span>
                      <button
                        type="button"
                        onClick={() => setLessonSettingsOpen((value) => !value)}
                        className="ml-auto inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#DEDFE1] px-3 text-[10px] font-black uppercase tracking-[0.08em] text-secondary outline-none hover:border-primary focus-visible:ring-2 focus-visible:ring-primary"
                        aria-expanded={lessonSettingsOpen}
                      >
                        <Settings2 size={14} /> Lesson settings
                      </button>
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
                    {lessonSettingsOpen ? (
                      <div className="mt-6 grid gap-4 border-t border-[#ECEDEF] bg-[#FAFBFC] p-4 sm:grid-cols-3">
                        <Field label="Lesson slug">
                          <input
                            value={selectedLesson.slug}
                            onChange={(event) =>
                              updateLesson((lesson) => {
                                lesson.slug = academySlugify(
                                  event.target.value,
                                );
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
                    ) : null}
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
                          editing={editingTextBlockId === block.id}
                          activeSettingsTab={
                            inspectorOpen && selectedBlock?.id === block.id
                              ? inspectorTab
                              : null
                          }
                          onSelect={() =>
                            selectBlock(selectedLesson.id!, block.id!)
                          }
                          onEdit={() => {
                            selectBlock(selectedLesson.id!, block.id!);
                            if (block.type === "text") {
                              const opening = editingTextBlockId !== block.id;
                              setEditingTextBlockId(opening ? block.id! : null);
                              if (opening)
                                window.requestAnimationFrame(() =>
                                  globalThis.document
                                    .querySelector<HTMLElement>(
                                      `[data-block-id="${block.id}"] .ProseMirror`,
                                    )
                                    ?.focus(),
                                );
                            } else {
                              setEditingTextBlockId(null);
                              setInspectorTab("content");
                              inspectorReturnFocusRef.current = globalThis
                                .document.activeElement as HTMLElement | null;
                              setInspectorOpen(true);
                            }
                          }}
                          onMove={moveBlock}
                          onMoveDirection={(direction) =>
                            moveBlock(index, index + direction)
                          }
                          canMoveUp={index > 0}
                          canMoveDown={index < selectedLesson.blocks.length - 1}
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
                            ) {
                              updateLesson((lesson) => {
                                lesson.blocks = lesson.blocks.filter(
                                  (item) => item.id !== block.id,
                                );
                              }, "Delete block");
                              showDeletedNotice("Block deleted.");
                            }
                          }}
                          onOpenSettings={(tab) => {
                            setEditingTextBlockId(null);
                            selectBlock(selectedLesson.id!, block.id!);
                            setInspectorTab(tab);
                            inspectorReturnFocusRef.current = globalThis
                              .document.activeElement as HTMLElement | null;
                            setInspectorOpen(true);
                          }}
                          onOpenLayout={() => setEditingTextBlockId(null)}
                          onApplyTextPreset={(preset) =>
                            applyTextPreset(block, preset)
                          }
                        >
                          {block.type === "text" ? (
                            <div
                              data-block-variant={
                                block.appearance?.variant || "default"
                              }
                              className={`${
                                block.appearance?.width === "narrow"
                                  ? "mx-auto w-full max-w-xl"
                                  : block.appearance?.width === "wide"
                                    ? "relative left-1/2 w-[calc(100vw-48px)] max-w-[1000px] -translate-x-1/2 lg:w-[calc(100vw-328px)]"
                                    : "w-full"
                              } academy-block-surface-${
                                block.appearance?.surface || "plain"
                              } academy-block-spacing-${
                                block.appearance?.spacing || "comfortable"
                              }`}
                            >
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
                                active={
                                  selectedBlock?.id === block.id &&
                                  editingTextBlockId === block.id
                                }
                                layout={block.layout || "single"}
                              />
                            </div>
                          ) : isCaptionedMediaBlock(block) ? (
                            <>
                              <AcademyLessonBlocks
                                blocks={[
                                  { ...block, caption: "", captionItems: [] },
                                ]}
                              />
                              <InlineMediaCaption
                                block={block}
                                onChange={(next) => updateBlock(next)}
                              />
                            </>
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
              </AcademyThemeScope>
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
          className="fixed inset-0 z-[75] flex justify-end bg-secondary/5"
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
          className="fixed inset-0 z-[70] flex justify-end bg-secondary/25"
          role="dialog"
          aria-modal="true"
          aria-label="Block library"
        >
          <button
            type="button"
            tabIndex={-1}
            className="absolute inset-0"
            onClick={() => setLibraryOpen(false)}
            aria-label="Close block library"
          />
          <aside className="relative flex h-full w-full max-w-[520px] flex-col overflow-hidden bg-white shadow-2xl">
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
            <div className="flex min-h-0 flex-1 flex-col p-5">
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
              <div
                className="mt-4 flex gap-2 overflow-x-auto pb-2"
                role="tablist"
                aria-label="Block categories"
              >
                {blockLibraryCategories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    role="tab"
                    aria-selected={libraryCategory === category}
                    onClick={() => setLibraryCategory(category)}
                    className={`min-h-10 shrink-0 rounded-full border px-3 text-[10px] font-black uppercase tracking-[0.08em] ${libraryCategory === category ? "border-primary bg-primary text-white" : "border-secondary/10 text-secondary/55 hover:border-primary/40"}`}
                  >
                    {category}
                  </button>
                ))}
              </div>
              <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
                {libraryCategory === "All" && academyRecipes.some((recipe) => !librarySearch || `${recipe.title} ${recipe.description}`.toLowerCase().includes(librarySearch.toLowerCase())) ? (
                  <section className="mb-6">
                    <h3 className="mb-3 text-[10px] font-black uppercase tracking-[0.15em] text-secondary/40">Learning sequences</h3>
                    <p className="mb-3 text-xs text-secondary/55">Insert three editable blocks together. Author notes must be replaced before publishing.</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {academyRecipes.filter((recipe) => !librarySearch || `${recipe.title} ${recipe.description}`.toLowerCase().includes(librarySearch.toLowerCase())).map((recipe) => (
                        <button key={recipe.key} type="button" onClick={() => insertRecipe(recipe.key)} className="min-h-28 rounded-xl border border-secondary/10 bg-[var(--academy-accent-soft,#eef4fb)] p-4 text-left outline-none hover:border-primary focus-visible:ring-2 focus-visible:ring-primary">
                          <span className="flex gap-1.5" aria-hidden="true">{[1, 2, 3].map((number) => <span key={number} className="grid h-7 w-7 place-items-center rounded-full bg-primary text-[10px] font-bold text-white">{number}</span>)}</span>
                          <strong className="mt-3 block text-sm text-secondary">{recipe.title}</strong>
                          <span className="mt-1 block text-xs leading-5 text-secondary/55">{recipe.description}</span>
                        </button>
                      ))}
                    </div>
                  </section>
                ) : null}
                {!librarySearch &&
                libraryCategory === "All" &&
                recentBlockTypes.length ? (
                  <section className="mb-6">
                    <h3 className="mb-3 text-[10px] font-black uppercase tracking-[0.15em] text-secondary/40">
                      Recently used
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {recentBlockTypes.map((type) => {
                        const definition = getAcademyBlockDefinition(type);
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => insertBlock(type)}
                            className="group grid min-h-16 grid-cols-[64px_1fr] items-center overflow-hidden rounded-xl border border-secondary/10 bg-white text-left hover:border-primary hover:shadow-sm"
                          >
                            <span className="relative block h-16 overflow-hidden">
                              <span className="absolute left-0 top-0 block w-[116px] origin-top-left scale-[.56]">
                                <BlockLibraryPreview type={type} />
                              </span>
                            </span>
                            <span className="pr-3 text-xs font-bold text-secondary">
                              {definition.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ) : null}
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
                      <div className="grid gap-4 sm:grid-cols-2">
                        {definitions.map((definition) => (
                          <button
                            key={definition.type}
                            type="button"
                            onClick={() => insertBlock(definition.type)}
                            className="group overflow-hidden rounded-2xl border border-secondary/10 bg-white text-left transition hover:-translate-y-0.5 hover:border-primary hover:shadow-lg motion-reduce:transition-none"
                          >
                            <BlockLibraryPreview type={definition.type} />
                            <span className="block p-4">
                              <span className="flex items-center gap-2.5">
                                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                  <AcademyBlockIcon
                                    name={definition.icon}
                                    size={18}
                                  />
                                </span>
                                <strong className="block text-sm">
                                  {definition.label}
                                </strong>
                              </span>
                              <span className="mt-2 block text-xs leading-5 text-secondary/55">
                                {definition.description}
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </section>
                  ) : null;
                })}
                {!filteredBlocks.length ? (
                  <div className="rounded-xl border border-dashed border-secondary/15 bg-slate-50 px-6 py-12 text-center">
                    <Search className="mx-auto text-secondary/25" />
                    <p className="mt-3 text-sm font-black">No blocks found</p>
                    <p className="mt-1 text-xs text-secondary/50">
                      Try another search or category.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      ) : null}
      {deletedNotice ? (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-[120] flex min-h-12 -translate-x-1/2 items-center gap-4 rounded-xl bg-secondary px-4 py-2 text-xs font-bold text-white shadow-2xl"
        >
          <span>{deletedNotice}</span>
          <button
            type="button"
            onClick={() => {
              undo();
              setDeletedNotice("");
            }}
            className="min-h-10 rounded-lg bg-white/10 px-3 font-black text-white outline-none hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white"
          >
            Undo
          </button>
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
          snapshots={snapshotEntries}
          courseKey={document.key}
          onClose={() => setHistoryOpen(false)}
          onCreate={async (name) => {
            if (!document.id)
              return { ok: false, message: "Save the course before creating a snapshot." };
            if (saveState !== "saved") {
              const saved = await manualSave();
              if (!saved.ok) return saved;
            }
            const created = await createAcademySnapshot(document.id, name);
            if (created.snapshot)
              setSnapshotEntries((current) => [created.snapshot!, ...current]);
            return created;
          }}
          onRestore={(snapshotId) => {
            if (!document.id) return;
            if (!window.confirm("Restore this snapshot as the current draft? Your current draft will remain in the snapshot history.")) return;
            run(
              () => restoreAcademySnapshot(document.id!, snapshotId, revision),
              () => window.location.reload(),
            );
          }}
        />
      ) : null}
      {findReplaceOpen ? (
        <AcademyFindReplaceModal
          course={document}
          onClose={() => setFindReplaceOpen(false)}
          onApply={(search, replacement, caseSensitive) => {
            command("Find and replace course text", (draft) => {
              const result = replaceAcademyCourseText(
                draft,
                search,
                replacement,
                caseSensitive,
              );
              Object.assign(draft, result.course);
            });
            setFindReplaceOpen(false);
          }}
        />
      ) : null}
      {reviewOpen ? (
        <AcademyReviewModal
          courseId={document.id || null}
          courseKey={document.key}
          course={document}
          snapshots={snapshotEntries}
          invitations={invitations}
          comments={comments}
          onClose={() => setReviewOpen(false)}
          onInvite={async (snapshotId, email) => {
            if (!document.id) return { ok: false, message: "Save this course first." };
            const result = await inviteAcademyReviewer(document.id, snapshotId, email);
            if (result.invitation) setInvitations((current) => [result.invitation!, ...current]);
            return result;
          }}
          onResolve={async (commentId, resolved) => {
            if (!document.id) return { ok: false, message: "Save this course first." };
            const result = await setAcademyReviewCommentResolved(document.id, commentId, resolved);
            if (result.ok)
              setComments((current) => current.map((comment) => comment.id === commentId ? { ...comment, resolved_at: resolved ? new Date().toISOString() : null } : comment));
            return result;
          }}
          onRevoke={async (invitationId) => {
            if (!document.id) return { ok: false, message: "Save this course first." };
            const result = await revokeAcademyReviewInvitation(document.id, invitationId);
            if (result.ok)
              setInvitations((current) => current.map((invitation) => invitation.id === invitationId ? { ...invitation, revoked_at: new Date().toISOString() } : invitation));
            return result;
          }}
          onNavigate={(lessonId, blockId) => {
            setReviewOpen(false);
            selectLesson(lessonId);
            if (blockId) selectBlock(lessonId, blockId);
            if (blockId)
              window.requestAnimationFrame(() =>
                globalThis.document
                  .querySelector<HTMLElement>(`[data-block-id="${blockId}"]`)
                  ?.scrollIntoView({ behavior: "smooth", block: "center" }),
              );
          }}
        />
      ) : null}
      {previewOpen ? (
        <AcademyPreviewStudio
          course={document}
          initialLessonSlug={selectedLesson?.slug}
          onClose={() => {
            setPreviewOpen(false);
            window.requestAnimationFrame(() =>
              selectedBlock?.id
                ? globalThis.document
                    .querySelector<HTMLElement>(
                      `[data-block-id="${selectedBlock.id}"]`,
                    )
                    ?.scrollIntoView({ block: "center" })
                : undefined,
            );
          }}
        />
      ) : null}
      {readinessOpen ? (
        <PublishingReadinessPanel
          course={document}
          pending={pending}
          onClose={() => setReadinessOpen(false)}
          onNavigate={navigateToIssue}
          onPublish={() =>
            startTransition(async () => {
              const saved = await manualSave();
              const courseId = document.id || saved.courseId;
              if (!saved.ok || !courseId) return;
              const value = await publishAcademyCourseV2(
                courseId,
                saved.revision || revision,
              );
              setResult(value);
              if (value.ok) {
                setReadinessOpen(false);
                router.replace(
                  `/dashboard/admin/academy/${saved.courseKey || document.key}`,
                );
              }
            })
          }
        />
      ) : null}
      <div aria-live="polite" className="sr-only">
        {message}
      </div>
    </div>
  );
}

function AcademyPreviewStudio({
  course,
  onClose,
  initialLessonSlug,
}: {
  course: AcademyCourse;
  onClose: () => void;
  initialLessonSlug?: string;
}) {
  const [deviceId, setDeviceId] = useState<AcademyPreviewDeviceId>("desktop");
  const device = academyPreviewDevices.find((item) => item.id === deviceId)!;
  const [view, setView] = useState<"cover" | "lesson" | "quiz">(
    initialLessonSlug ? "lesson" : "cover",
  );
  const [lessonSlug, setLessonSlug] = useState(
    initialLessonSlug || course.lessons[0]?.slug || "",
  );
  const dialogRef = useDialogFocus(true, onClose);
  const query = new URLSearchParams({ view });
  if (view === "lesson" && lessonSlug) query.set("lesson", lessonSlug);
  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-[100] flex flex-col bg-[#17191d]"
      role="dialog"
      aria-modal="true"
      aria-label="Responsive course preview"
    >
      <header className="flex min-h-16 flex-wrap items-center gap-3 border-b border-white/10 bg-[#202329] px-4 text-white">
        <div className="mr-auto min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/45">
            Draft preview
          </p>
          <p className="truncate text-sm font-black">{course.title}</p>
        </div>
        <AcademyPreviewDevicePicker value={deviceId} onChange={setDeviceId} />
        <select
          value={view}
          onChange={(event) => setView(event.target.value as typeof view)}
          className="min-h-10 rounded-lg border border-white/15 bg-white/10 px-3 text-xs font-bold text-white"
          aria-label="Preview page"
        >
          <option className="text-secondary" value="cover">
            Course cover
          </option>
          <option className="text-secondary" value="lesson">
            Lesson
          </option>
          <option className="text-secondary" value="quiz">
            Final assessment
          </option>
        </select>
        {view === "lesson" ? (
          <select
            value={lessonSlug}
            onChange={(event) => setLessonSlug(event.target.value)}
            className="min-h-10 max-w-48 rounded-lg border border-white/15 bg-white/10 px-3 text-xs font-bold text-white"
            aria-label="Preview lesson"
          >
            {course.lessons.map((lesson) => (
              <option
                className="text-secondary"
                key={lesson.slug}
                value={lesson.slug}
              >
                {lesson.title}
              </option>
            ))}
          </select>
        ) : null}
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-white px-4 text-xs font-black text-secondary"
        >
          <X size={15} /> Return to editor
        </button>
      </header>
      <div className="flex flex-1 justify-center overflow-auto bg-[#111317] p-3 sm:p-6">
        <iframe
          key={`${view}-${lessonSlug}`}
          title={`${course.title} ${view} preview`}
          src={`/dashboard/admin/academy/${course.key}/preview?${query.toString()}`}
          className="shrink-0 border-0 bg-white shadow-2xl transition-[width,height] duration-200 motion-reduce:transition-none"
          style={{ width: device.width, height: device.height }}
        />
      </div>
    </div>
  );
}

function PublishingReadinessPanel({
  course,
  pending,
  onClose,
  onPublish,
  onNavigate,
}: {
  course: AcademyCourse;
  pending: boolean;
  onClose: () => void;
  onPublish: () => void;
  onNavigate: (issue: AcademyValidationIssue) => void;
}) {
  const result = validateAcademyCourse(course);
  const groups = groupAcademyValidationIssues(result.issues);
  const dialogRef = useDialogFocus(true, onClose);
  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-[95] flex justify-end bg-secondary/40"
      role="dialog"
      aria-modal="true"
      aria-label="Publishing readiness"
    >
      <button
        type="button"
        tabIndex={-1}
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Close publishing readiness"
      />
      <aside className="relative flex h-full w-full max-w-[460px] flex-col bg-white shadow-2xl">
        <header className="border-b p-6">
          <button
            type="button"
            onClick={onClose}
            className="float-right p-2"
            aria-label="Close"
          >
            <X />
          </button>
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-primary/60">
            Publish
          </p>
          <h2 className="mt-1 text-2xl font-black">Course readiness</h2>
          <p className="mt-2 text-sm leading-6 text-secondary/55">
            A final check of content, media, accessibility, and assessment
            settings.
          </p>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          {result.valid ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950">
              <CheckCircle2 className="mb-3" />
              <strong className="block">Ready to publish</strong>
              <p className="mt-1 text-sm leading-6">
                The draft passes all required checks. Publishing creates an
                immutable learner version.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
              <AlertTriangle className="mb-2" />
              <strong>
                {result.errors.length} issue
                {result.errors.length === 1 ? "" : "s"} to resolve
              </strong>
            </div>
          )}
          {(
            Object.entries(groups) as Array<
              [keyof typeof groups, AcademyValidationIssue[]]
            >
          ).map(([group, issues]) =>
            issues.length ? (
              <section key={group} className="mt-6">
                <h3 className="text-xs font-black capitalize">{group}</h3>
                <ul className="mt-2 space-y-2">
                  {issues.map((issue) => (
                    <li key={issue.code}>
                      <button
                        type="button"
                        onClick={() => onNavigate(issue)}
                        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg bg-slate-50 p-3 text-left text-xs leading-5 text-secondary/70 outline-none hover:bg-primary/5 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <span>{issue.message}</span>
                        <span aria-hidden="true">→</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null,
          )}
        </div>
        <footer className="flex gap-3 border-t p-5">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 flex-1 rounded-lg border text-xs font-black"
          >
            Return to editor
          </button>
          <button
            type="button"
            disabled={!result.valid || pending}
            onClick={onPublish}
            className="min-h-11 flex-1 rounded-lg bg-primary text-xs font-black text-white disabled:opacity-40"
          >
            {pending ? "Publishing…" : "Publish course"}
          </button>
        </footer>
      </aside>
    </div>
  );
}

function ThemeOptionThumbnail({
  group,
  option,
}: {
  group: string;
  option: string;
}) {
  if (group === "Cover layout") {
    if (option === "split-image")
      return (
        <span
          className="flex h-14 overflow-hidden rounded-md border border-secondary/10 bg-white"
          aria-hidden="true"
        >
          <span className="flex w-1/2 flex-col justify-end gap-1 p-2">
            <span className="h-1.5 w-4/5 rounded bg-secondary/70" />
            <span className="h-1 w-3/5 rounded bg-secondary/20" />
            <span className="mt-1 h-2 w-8 rounded-full bg-primary" />
          </span>
          <span className="w-1/2 bg-gradient-to-br from-primary/75 to-sky-200" />
        </span>
      );
    if (option === "minimal")
      return (
        <span
          className="flex h-14 flex-col justify-end gap-1 rounded-md bg-primary/10 p-2"
          aria-hidden="true"
        >
          <span className="h-1.5 w-3/5 rounded bg-secondary/70" />
          <span className="h-1 w-2/5 rounded bg-secondary/20" />
          <span className="mt-1 h-0.5 w-6 bg-primary" />
        </span>
      );
    return (
      <span
        className="relative flex h-14 flex-col justify-end gap-1 overflow-hidden rounded-md bg-gradient-to-br from-secondary to-primary/70 p-2"
        aria-hidden="true"
      >
        <span className="h-1.5 w-3/5 rounded bg-white/90" />
        <span className="h-1 w-2/5 rounded bg-white/50" />
        <span className="mt-1 h-2 w-8 rounded-full bg-white" />
      </span>
    );
  }
  if (group === "Lesson header") {
    return (
      <span
        className={`flex h-14 flex-col justify-end rounded-md border border-secondary/10 p-2 ${option === "media-led" ? "bg-gradient-to-r from-secondary to-primary/60" : option === "compact" ? "gap-0.5 bg-white" : "gap-1 bg-primary/5"}`}
        aria-hidden="true"
      >
        <span
          className={`h-1 w-8 rounded ${option === "media-led" ? "bg-white/50" : "bg-primary/60"}`}
        />
        <span
          className={`rounded ${option === "compact" ? "h-1.5 w-1/2" : "h-2 w-3/4"} ${option === "media-led" ? "bg-white" : "bg-secondary/75"}`}
        />
        <span
          className={`h-1 w-2/3 rounded ${option === "media-led" ? "bg-white/40" : "bg-secondary/15"}`}
        />
      </span>
    );
  }
  if (group === "Typography") {
    return (
      <span
        className={`flex h-14 items-end gap-2 rounded-md border border-secondary/10 bg-white p-2 ${option === "editorial" ? "font-serif" : option === "friendly-sans" ? "font-sans" : "font-sans tracking-tight"}`}
        aria-hidden="true"
      >
        <span
          className={`text-2xl font-bold leading-none ${option === "friendly-sans" ? "rounded text-primary" : "text-secondary"}`}
        >
          Aa
        </span>
        <span className="mb-0.5 flex flex-1 flex-col gap-1">
          <span className="h-1 w-full rounded bg-secondary/25" />
          <span className="h-1 w-3/4 rounded bg-secondary/15" />
        </span>
      </span>
    );
  }
  const gap =
    option === "compact" ? "gap-1" : option === "spacious" ? "gap-3" : "gap-2";
  return (
    <span
      className={`flex h-14 flex-col justify-center rounded-md border border-secondary/10 bg-white p-2 ${gap}`}
      aria-hidden="true"
    >
      <span className="h-1.5 w-4/5 rounded bg-secondary/55" />
      <span className="h-1 w-full rounded bg-secondary/15" />
      <span className="h-1 w-2/3 rounded bg-secondary/15" />
    </span>
  );
}

function ThemeCardGroup({
  label,
  value,
  options,
  onSelect,
}: {
  label: string;
  value: string;
  options: Array<[string, string, string]>;
  onSelect: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-[10px] font-black uppercase tracking-[0.13em] text-secondary/45">
        {label}
      </legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {options.map(([key, title, description]) => (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            aria-pressed={value === key}
            className={`min-h-24 rounded-xl border p-3 text-left ${value === key ? "border-primary bg-primary/5 ring-2 ring-primary/10" : "border-secondary/10 hover:border-secondary/25"}`}
          >
            <span className="mb-3 block">
              <ThemeOptionThumbnail group={label} option={key} />
            </span>
            <strong className="block text-xs">{title}</strong>
            <span className="mt-1 block text-[10px] leading-4 text-secondary/50">
              {description}
            </span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function ThemePreviewCard({ course }: { course: AcademyCourse }) {
  return (
    <AcademyThemeScope
      course={course}
      className="overflow-hidden rounded-xl border border-secondary/10 bg-white"
    >
      <div className="bg-[var(--academy-accent-soft)] p-5">
        <span className="text-[9px] font-black uppercase tracking-[0.16em] text-[var(--academy-accent)]">
          Live theme preview
        </span>
        <h3 className="mt-2 text-xl font-black text-secondary">
          {course.title || "Course title"}
        </h3>
        <p className="academy-reading-copy mt-2 max-w-lg text-sm leading-6 text-secondary/65">
          {course.description || "Your course description will appear here."}
        </p>
        <span className="mt-4 block h-1 w-16 bg-[var(--academy-accent)]" />
        {course.theme?.preset === "journey" ? (
          <div className="mt-5 flex items-center gap-3 rounded-xl bg-white p-3 text-xs font-bold text-[var(--academy-accent-ink)]">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--academy-spark)]">1</span>
            <span>Learn a little · Try it · See your progress</span>
          </div>
        ) : null}
      </div>
    </AcademyThemeScope>
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
  const [mediaChooserOpen, setMediaChooserOpen] = useState(false);
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
      className="fixed inset-0 z-[80] flex justify-end bg-secondary/25"
      role="dialog"
      aria-modal="true"
      aria-label="Course settings"
    >
      <button
        type="button"
        tabIndex={-1}
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Close course settings"
      />
      <aside className="relative flex h-full w-full max-w-[580px] flex-col overflow-hidden bg-white shadow-2xl">
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
              <ThemePreviewCard course={course} />
              <fieldset>
                <legend className="mb-2 text-[10px] font-black uppercase tracking-[0.13em] text-secondary/45">Learning experience</legend>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    ["standard", "Standard", "Keep the current course presentation"],
                    ["journey", "Learning Journey", "A vivid roadmap with short learning steps"],
                  ] as const).map(([value, label, description]) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={(course.theme?.preset === "journey") === (value === "journey")}
                      onClick={() => onChange((draft) => {
                        draft.theme!.preset = value === "journey" ? "journey" : "editorial";
                        if (value === "journey" && !isAcademyJourneyPalette(draft.theme!.accent)) draft.theme!.accent = "blue-citrus";
                        if (value === "standard" && isAcademyJourneyPalette(draft.theme!.accent)) draft.theme!.accent = "blue";
                      }, "Change learning experience")}
                      className={`min-h-20 rounded-xl border p-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary ${(course.theme?.preset === "journey") === (value === "journey") ? "border-primary bg-primary/5" : "border-secondary/10 bg-white"}`}
                    >
                      <strong className="block text-xs">{label}</strong>
                      <span className="mt-1 block text-[10px] leading-4 text-secondary/55">{description}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
              <ThemeCardGroup
                label="Cover layout"
                value={course.theme?.coverStyle || "full-image"}
                options={[
                  [
                    "full-image",
                    "Full image",
                    "Immersive image with overlaid title",
                  ],
                  ["split-image", "Split image", "Balanced copy and media"],
                  ["minimal", "Minimal", "Typography-led introduction"],
                ]}
                onSelect={(value) =>
                  onChange((draft) => {
                    draft.theme!.coverStyle = value as NonNullable<
                      AcademyCourse["theme"]
                    >["coverStyle"];
                  }, "Change cover layout")
                }
              />
              <ThemeCardGroup
                label="Lesson header"
                value={course.theme?.lessonHeaderStyle || "editorial"}
                options={[
                  [
                    "editorial",
                    "Editorial",
                    "Large title and generous introduction",
                  ],
                  ["compact", "Compact", "Fast, space-efficient opening"],
                  ["media-led", "Media-led", "Hero media anchors the lesson"],
                ]}
                onSelect={(value) =>
                  onChange((draft) => {
                    draft.theme!.lessonHeaderStyle = value as NonNullable<
                      AcademyCourse["theme"]
                    >["lessonHeaderStyle"];
                  }, "Change lesson header")
                }
              />
              <ThemeCardGroup
                label="Typography"
                value={course.theme?.typography || "editorial"}
                options={[
                  [
                    "editorial",
                    "Editorial",
                    "Sans headings with serif reading copy",
                  ],
                  ["modern-sans", "Modern sans", "Crisp sans serif throughout"],
                  [
                    "friendly-sans",
                    "Friendly sans",
                    "Softer, approachable rhythm",
                  ],
                ]}
                onSelect={(value) =>
                  onChange((draft) => {
                    draft.theme!.typography = value as NonNullable<
                      AcademyCourse["theme"]
                    >["typography"];
                  }, "Change typography")
                }
              />
              <ThemeCardGroup
                label="Density"
                value={course.theme?.density || "comfortable"}
                options={[
                  ["compact", "Compact", "For short, information-rich courses"],
                  ["comfortable", "Comfortable", "A balanced default"],
                  ["spacious", "Spacious", "More pause between ideas"],
                ]}
                onSelect={(value) =>
                  onChange((draft) => {
                    draft.theme!.density = value as NonNullable<
                      AcademyCourse["theme"]
                    >["density"];
                  }, "Change density")
                }
              />
              <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.13em] text-secondary/45">
                  Accessible accent
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {Object.entries(academyAccentPalettes).filter(([key]) => course.theme?.preset === "journey" ? isAcademyJourneyPalette(key) : !isAcademyJourneyPalette(key)).map(
                    ([key, palette]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() =>
                          onChange((draft) => {
                            draft.theme!.accent = key as NonNullable<
                              AcademyCourse["theme"]
                            >["accent"];
                          }, "Change accent")
                        }
                        className={`min-h-16 rounded-xl border p-3 text-left text-xs font-black ${course.theme?.accent === key ? "border-secondary ring-2 ring-secondary/10" : "border-secondary/10"}`}
                      >
                        <span className="mb-2 flex h-5 overflow-hidden rounded">
                          <span className="h-full w-2/3" style={{ backgroundColor: palette.accent }} />
                          <span className="h-full w-1/3" style={{ backgroundColor: palette.spark }} />
                        </span>
                        {palette.label}
                      </button>
                    ),
                  )}
                </div>
              </div>
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
              <button
                type="button"
                onClick={() => setMediaChooserOpen(true)}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-black text-white"
              >
                <Upload size={15} /> Choose cover image
              </button>
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
              <AcademyMediaChooser
                open={mediaChooserOpen}
                title="Choose course cover"
                library={mediaLibrary}
                selectedUrl={course.heroImage}
                onClose={() => setMediaChooserOpen(false)}
                onChoose={(choice) =>
                  onChange((draft) => {
                    draft.heroImage = choice.url;
                  }, "Update hero")
                }
                onUpload={async (file) => {
                  const data = new FormData();
                  data.set("file", file);
                  const result = await uploadAcademyMedia(data);
                  if (!result.ok || !result.url) {
                    window.alert(result.message);
                    return null;
                  }
                  return {
                    name: file.name,
                    url: result.url,
                    mediaType: "image",
                  };
                }}
              />
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
      </aside>
    </div>
  );
}

function AcademyReviewModal({
  courseId,
  courseKey,
  course,
  snapshots,
  invitations,
  comments,
  onClose,
  onInvite,
  onResolve,
  onRevoke,
  onNavigate,
}: {
  courseId: string | null;
  courseKey: string;
  course: AcademyCourse;
  snapshots: Snapshot[];
  invitations: AcademyReviewInvitation[];
  comments: AcademyReviewComment[];
  onClose: () => void;
  onInvite: (snapshotId: string, email: string) => Promise<AcademyAdminActionResult & { inviteUrl?: string }>;
  onResolve: (commentId: string, resolved: boolean) => Promise<AcademyAdminActionResult>;
  onRevoke: (invitationId: string) => Promise<AcademyAdminActionResult>;
  onNavigate: (lessonId: string, blockId: string | null) => void;
}) {
  const dialogRef = useDialogFocus(true, onClose);
  const [email, setEmail] = useState("");
  const [snapshotId, setSnapshotId] = useState(snapshots[0]?.id || "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [showResolved, setShowResolved] = useState(false);
  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Course reviews" className="fixed inset-0 z-[90] flex justify-end bg-[#111827]/60">
      <div className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
        <header className="flex items-center gap-3 border-b p-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Stakeholder feedback</p>
            <h2 className="text-xl font-bold text-secondary">Course reviews</h2>
          </div>
          <button type="button" onClick={onClose} className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-lg outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-primary" aria-label="Close course reviews"><X size={20} /></button>
        </header>
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5">
          <section aria-labelledby="review-invite-heading">
            <h3 id="review-invite-heading" className="text-sm font-bold">Invite a reviewer</h3>
            <p className="mt-1 text-xs text-secondary/60">Reviewers sign in with the invited email. They see an immutable snapshot, not your changing draft.</p>
            <form onSubmit={async (event) => {
              event.preventDefault();
              setBusy(true);
              const result = await onInvite(snapshotId, email);
              setBusy(false);
              setMessage(result.message);
              if (result.ok) { setEmail(""); setInviteUrl(result.inviteUrl || ""); }
            }} className="mt-4 space-y-3">
              <label className="block text-xs font-semibold">Reviewer email
                <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="colleague@example.com" className="mt-2 min-h-11 w-full rounded-lg border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary" />
              </label>
              <label className="block text-xs font-semibold">Snapshot to review
                <select value={snapshotId} onChange={(event) => setSnapshotId(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  {snapshots.map((snapshot) => <option key={snapshot.id} value={snapshot.id}>{snapshot.label || `${snapshot.reason} · revision ${snapshot.draft_revision}`} · {new Date(snapshot.created_at).toLocaleString()}</option>)}
                </select>
              </label>
              {!snapshots.length ? <p className="text-xs text-amber-800">Save a named snapshot in Revision history first.</p> : null}
              <button type="submit" disabled={busy || !courseId || !snapshotId || !email.trim()} className="min-h-11 rounded-lg bg-primary px-4 text-xs font-bold text-white disabled:opacity-40">{busy ? "Sending…" : "Send review invitation"}</button>
            </form>
            {message ? <p role="status" className="mt-3 text-xs text-secondary/70">{message}</p> : null}
            {inviteUrl ? <div className="mt-3 flex gap-2"><input readOnly aria-label="Review invitation link" value={inviteUrl} className="min-w-0 flex-1 rounded-lg border px-3 text-xs" /><button type="button" onClick={() => navigator.clipboard.writeText(inviteUrl)} className="min-h-11 rounded-lg border px-3 text-xs font-bold">Copy link</button></div> : null}
          </section>
          <section aria-labelledby="review-invitations-heading" className="border-t pt-5">
            <h3 id="review-invitations-heading" className="text-sm font-bold">Invitations</h3>
            <div className="mt-3 space-y-2">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex flex-wrap items-center gap-2 rounded-lg border p-3 text-xs">
                  <span className="min-w-0 flex-1 truncate font-medium">{invitation.email}<span className="ml-2 text-secondary/50">{invitation.revoked_at ? "Revoked" : new Date(invitation.expires_at) < new Date() ? "Expired" : "Active"}</span></span>
                  <Link href={`/dashboard/admin/academy/${encodeURIComponent(courseKey)}/preview?snapshot=${invitation.snapshot_id}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center px-2 font-semibold text-primary">Preview</Link>
                  {!invitation.revoked_at ? <button type="button" onClick={async () => { if (!window.confirm(`Revoke ${invitation.email}'s review access?`)) return; const result = await onRevoke(invitation.id); setMessage(result.message); }} className="min-h-11 px-2 font-semibold text-red-600">Revoke</button> : null}
                </div>
              ))}
              {!invitations.length ? <p className="text-xs text-secondary/50">No reviewers invited yet.</p> : null}
            </div>
          </section>
          <section aria-labelledby="review-comments-heading" className="border-t pt-5">
            <div className="flex items-center justify-between gap-2"><h3 id="review-comments-heading" className="text-sm font-bold">Comments ({comments.filter((comment) => !comment.resolved_at).length} open)</h3><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={showResolved} onChange={(event) => setShowResolved(event.target.checked)} /> Show resolved</label></div>
            <div className="mt-3 space-y-3">
              {comments.filter((comment) => showResolved || !comment.resolved_at).map((comment) => {
                const lesson = course.lessons.find((item) => item.id === comment.lesson_id);
                const reviewer = invitations.find((invitation) => invitation.id === comment.invitation_id);
                return <article key={comment.id} className="rounded-lg border p-3 text-xs">
                  <p className="font-semibold text-primary">{lesson?.title || "Earlier lesson version"}{comment.block_id ? " · Block" : ""}</p>
                  <p className="mt-1 text-secondary/50">{reviewer?.email || "Reviewer"} · {new Date(comment.created_at).toLocaleString()}</p>
                  <p className="mt-3 whitespace-pre-wrap break-words text-secondary">{comment.body}</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {lesson?.id ? <button type="button" onClick={() => onNavigate(lesson.id!, comment.block_id)} className="min-h-11 font-semibold text-primary">Go to {comment.block_id ? "block" : "lesson"}</button> : null}
                    <button type="button" onClick={async () => { const result = await onResolve(comment.id, !comment.resolved_at); setMessage(result.message); }} className="min-h-11 font-semibold text-primary">{comment.resolved_at ? "Reopen" : "Resolve"}</button>
                  </div>
                </article>;
              })}
              {!comments.length ? <p className="text-xs text-secondary/50">No feedback yet.</p> : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function AcademyFindReplaceModal({
  course,
  onClose,
  onApply,
}: {
  course: AcademyCourse;
  onClose: () => void;
  onApply: (search: string, replacement: string, caseSensitive: boolean) => void;
}) {
  const [search, setSearch] = useState("");
  const [replacement, setReplacement] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const dialogRef = useDialogFocus(true, onClose);
  const preview = replaceAcademyCourseText(course, search, replacement, caseSensitive);
  const matchCount = preview.changes.reduce((count, change) => count + change.matches, 0);
  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Find and replace course text"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[#111827]/60 p-4"
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b p-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Course-wide update</p>
            <h2 className="text-xl font-bold text-secondary">Find and replace</h2>
          </div>
          <button type="button" onClick={onClose} className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-lg outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-primary" aria-label="Close find and replace">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4 overflow-y-auto p-5">
          <label className="block text-xs font-semibold text-secondary">
            Find
            <input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-secondary/20 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary" />
          </label>
          <label className="block text-xs font-semibold text-secondary">
            Replace with
            <input value={replacement} onChange={(event) => setReplacement(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-secondary/20 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary" />
          </label>
          <label className="flex min-h-11 items-center gap-2 text-xs font-semibold text-secondary">
            <input type="checkbox" checked={caseSensitive} onChange={(event) => setCaseSensitive(event.target.checked)} className="h-4 w-4 accent-primary" />
            Match case
          </label>
          <div className="border-t pt-4">
            <p className="text-xs font-bold text-secondary" aria-live="polite">
              {search ? `${matchCount} ${matchCount === 1 ? "match" : "matches"} in ${preview.changes.length} fields` : "Enter a term to preview changes"}
            </p>
            <p className="mt-1 text-[11px] text-secondary/55">Course copy, lesson text, accessibility descriptions, and assessment wording are included. IDs, links, media paths, and equations are not changed.</p>
            <div className="mt-3 max-h-64 divide-y overflow-y-auto rounded-lg border">
              {preview.changes.slice(0, 30).map((change) => (
                <div key={change.path} className="space-y-1 p-3 text-xs">
                  <p className="font-semibold text-primary">{change.path}</p>
                  <p className="break-words text-secondary/55"><span className="sr-only">Before: </span>{change.before}</p>
                  <p className="break-words font-medium text-secondary"><span className="sr-only">After: </span>{change.after}</p>
                </div>
              ))}
              {preview.changes.length > 30 ? <p className="p-3 text-xs text-secondary/55">And {preview.changes.length - 30} more fields.</p> : null}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t p-4">
          <button type="button" onClick={onClose} className="min-h-11 rounded-lg border px-4 text-xs font-bold">Cancel</button>
          <button type="button" disabled={!search || !preview.changes.length} onClick={() => onApply(search, replacement, caseSensitive)} className="min-h-11 rounded-lg bg-primary px-4 text-xs font-bold text-white disabled:opacity-40">Replace {matchCount} matches</button>
        </div>
      </div>
    </div>
  );
}

function HistoryModal({
  snapshots,
  courseKey,
  onClose,
  onCreate,
  onRestore,
}: {
  snapshots: Snapshot[];
  courseKey: string;
  onClose: () => void;
  onCreate: (name: string) => Promise<AcademySnapshotResult>;
  onRestore: (id: string) => void;
}) {
  const dialogRef = useDialogFocus(true, onClose);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-[80] flex bg-[#F5F6F8]"
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
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            const result = await onCreate(name);
            setBusy(false);
            setMessage(result.message);
            if (result.ok) setName("");
          }}
          className="flex flex-wrap gap-2 border-b p-4"
        >
          <label className="sr-only" htmlFor="academy-snapshot-name">Snapshot name</label>
          <input
            id="academy-snapshot-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={120}
            placeholder="Name this recovery point"
            className="min-h-11 min-w-0 flex-1 rounded-lg border border-secondary/20 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          <button
            type="submit"
            disabled={busy || !name.trim()}
            className="min-h-11 rounded-lg bg-primary px-4 text-xs font-bold text-white disabled:opacity-40"
          >
            {busy ? "Saving…" : "Save snapshot"}
          </button>
          {message ? <p role="status" className="w-full text-xs text-secondary/70">{message}</p> : null}
        </form>
        <div className="max-h-[65vh] divide-y overflow-y-auto">
          {snapshots.map((snapshot) => (
            <div key={snapshot.id} className="flex items-center gap-4 p-4">
              <History className="text-primary" size={18} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black capitalize">
                  {snapshot.label || `${snapshot.reason} snapshot`}
                </p>
                <p className="text-xs text-secondary/45">
                  Revision {snapshot.draft_revision} ·{" "}
                  {new Date(snapshot.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link
                  href={`/dashboard/admin/academy/${encodeURIComponent(courseKey)}/preview?snapshot=${encodeURIComponent(snapshot.id)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center rounded-lg border px-3 text-xs font-bold outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Preview
                </Link>
                <button
                  type="button"
                  onClick={() => onRestore(snapshot.id)}
                  className="min-h-11 rounded-lg border px-3 text-xs font-bold outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Restore
                </button>
              </div>
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
  const [questionType, setQuestionType] =
    useState<NonNullable<QuizQuestion["type"]>>("single-choice");
  const [previewQuestionId, setPreviewQuestionId] = useState<string | null>(
    null,
  );
  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-secondary/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Final assessment editor"
    >
      <div className="mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden bg-white shadow-2xl">
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
        <div className="overflow-y-auto bg-slate-50 p-5">
          <section className="mb-5 rounded-xl border bg-white p-4">
            <h3 className="text-xs font-black uppercase tracking-[0.13em] text-secondary/45">
              Assessment settings
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
              <Field label="Feedback timing">
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
              <label className="flex min-h-10 items-center gap-2 text-sm font-bold">
                <input
                  type="checkbox"
                  checked={course.rules?.requireFinalAssessment ?? true}
                  onChange={(event) =>
                    onChange((draft) => {
                      draft.rules!.requireFinalAssessment =
                        event.target.checked;
                    }, "Change final assessment requirement")
                  }
                />{" "}
                Required for completion
              </label>
            </div>
          </section>
          <div className="space-y-4">
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
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        onChange((draft) => {
                          const copy = structuredClone(question);
                          copy.id = createAcademyId("question");
                          copy.prompt = `${copy.prompt} copy`;
                          draft.quiz.splice(index + 1, 0, copy);
                        }, "Duplicate assessment question");
                      }}
                      className="p-2 text-secondary/45"
                      aria-label={`Duplicate question ${index + 1}`}
                    >
                      <Copy size={15} />
                    </button>
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={(event) => {
                        event.preventDefault();
                        onChange((draft) => {
                          const [moving] = draft.quiz.splice(index, 1);
                          draft.quiz.splice(index - 1, 0, moving);
                        }, "Move assessment question");
                      }}
                      className="p-2 text-secondary/45 disabled:opacity-20"
                      aria-label={`Move question ${index + 1} up`}
                    >
                      <ArrowUp size={15} />
                    </button>
                    <button
                      type="button"
                      disabled={index === course.quiz.length - 1}
                      onClick={(event) => {
                        event.preventDefault();
                        onChange((draft) => {
                          const [moving] = draft.quiz.splice(index, 1);
                          draft.quiz.splice(index + 1, 0, moving);
                        }, "Move assessment question");
                      }}
                      className="p-2 text-secondary/45 disabled:opacity-20"
                      aria-label={`Move question ${index + 1} down`}
                    >
                      <ArrowDown size={15} />
                    </button>
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
                  </div>
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
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewQuestionId((value) =>
                        value === question.id ? null : question.id,
                      )
                    }
                    className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-xs font-black"
                  >
                    <Eye size={14} />{" "}
                    {previewQuestionId === question.id
                      ? "Hide preview"
                      : "Preview question"}
                  </button>
                  {previewQuestionId === question.id ? (
                    <div className="mt-4 rounded-xl bg-[var(--academy-accent-soft,#eef4fb)] p-5">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-primary">
                        Learner preview
                      </p>
                      <p className="mt-2 font-bold">{question.prompt}</p>
                      <div className="mt-3 space-y-2">
                        {question.options.map((option) => (
                          <div
                            key={option.id}
                            className="rounded-lg border bg-white px-3 py-2 text-sm"
                          >
                            {option.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </details>
            ))}
            <div className="rounded-xl border bg-white p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.13em] text-secondary/45">
                Add question
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {(
                  [
                    ["single-choice", "Single choice"],
                    ["multiple-response", "Multiple response"],
                    ["reflection", "Reflection"],
                  ] as const
                ).map(([type, label]) => (
                  <button
                    key={type}
                    type="button"
                    aria-pressed={questionType === type}
                    onClick={() => setQuestionType(type)}
                    className={`min-h-16 rounded-lg border p-3 text-left text-xs font-black ${questionType === type ? "border-primary bg-primary/5 text-primary" : "border-secondary/10"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() =>
                  onChange((draft) => {
                    draft.quiz.push(createQuestion(questionType));
                  }, "Add assessment question")
                }
                className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-black text-white"
              >
                <Plus size={15} /> Add {questionType.replaceAll("-", " ")}
              </button>
            </div>
          </div>
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

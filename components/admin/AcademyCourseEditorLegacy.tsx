"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  GripVertical,
  ImagePlus,
  Plus,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import {
  archiveAcademyCourse,
  discardAcademyDraft,
  deleteAcademyMedia,
  duplicateAcademyCourse,
  publishAcademyCourse,
  saveAcademyCourseDraft,
  uploadAcademyMedia,
  type AcademyAdminActionResult,
} from "@/app/dashboard/admin/academy/actions";
import { academySlugify } from "@/lib/academy-course-validation";
import type {
  AcademyAudienceRole,
  AcademyCourse,
  AcademyLesson,
  LessonBlock,
  QuizQuestion,
} from "@/lib/tutor-academy";

const audienceOptions: Array<{ value: AcademyAudienceRole; label: string }> = [
  { value: "tutor_applicant", label: "Tutor applicants" },
  { value: "tutor", label: "Tutors" },
  { value: "student", label: "Students" },
  { value: "parent", label: "Parents" },
];

type LegacyBlockType = Extract<
  LessonBlock["type"],
  | "text"
  | "image"
  | "callout"
  | "numbered-list"
  | "accordion"
  | "carousel"
  | "quote"
  | "comparison-table"
>;

const blockLabels: Record<LegacyBlockType, string> = {
  text: "Text",
  image: "Image",
  callout: "Callout",
  "numbered-list": "Numbered list",
  accordion: "Accordion",
  carousel: "Carousel",
  quote: "Quote",
  "comparison-table": "Comparison table",
};

function newBlock(type: LegacyBlockType): LessonBlock {
  if (type === "text")
    return { type, heading: "New section", paragraphs: [""] };
  if (type === "image") return { type, src: "", alt: "", caption: "" };
  if (type === "callout")
    return { type, heading: "Key point", body: "", tone: "blue" };
  if (type === "numbered-list" || type === "accordion")
    return { type, heading: "", items: [{ title: "New item", body: "" }] };
  if (type === "carousel")
    return {
      type,
      heading: "",
      items: [{ eyebrow: "Step 1", title: "New item", body: "" }],
    };
  if (type === "quote") return { type, quote: "", attribution: "" };
  return {
    type,
    heading: "",
    columns: ["Option", "Guidance"],
    rows: [["", ""]],
  };
}

function newLesson(index: number): AcademyLesson {
  return {
    slug: `new-lesson-${index + 1}`,
    section: "New section",
    title: `New lesson ${index + 1}`,
    summary: "Add a concise lesson summary.",
    durationMinutes: 5,
    blocks: [newBlock("text")],
  };
}

function newQuestion(index: number): QuizQuestion {
  return {
    id: `question-${index + 1}`,
    prompt: "New question",
    options: [
      { id: "a", label: "Answer A" },
      { id: "b", label: "Answer B" },
    ],
    correctOptionId: "a",
    explanation: "Explain why the answer is correct.",
  };
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-secondary/45">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "min-h-11 w-full rounded-xl border border-secondary/12 bg-white px-3 text-sm font-semibold text-secondary outline-none focus:border-primary focus:ring-2 focus:ring-primary/10";
const textareaClass = `${inputClass} py-3 leading-6`;

function ReorderButtons({
  index,
  total,
  onMove,
  onRemove,
  onDuplicate,
}: {
  index: number;
  total: number;
  onMove: (to: number) => void;
  onRemove: () => void;
  onDuplicate?: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        disabled={index === 0}
        onClick={() => onMove(index - 1)}
        className="rounded-lg p-2 text-secondary/45 hover:bg-slate-100 disabled:opacity-25"
        aria-label="Move up"
      >
        <ArrowUp size={15} />
      </button>
      <button
        type="button"
        disabled={index === total - 1}
        onClick={() => onMove(index + 1)}
        className="rounded-lg p-2 text-secondary/45 hover:bg-slate-100 disabled:opacity-25"
        aria-label="Move down"
      >
        <ArrowDown size={15} />
      </button>
      {onDuplicate ? (
        <button
          type="button"
          onClick={onDuplicate}
          className="rounded-lg p-2 text-secondary/45 hover:bg-slate-100"
          aria-label="Duplicate"
        >
          <Copy size={15} />
        </button>
      ) : null}
      <button
        type="button"
        onClick={onRemove}
        className="rounded-lg p-2 text-red-500 hover:bg-red-50"
        aria-label="Remove"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

function ImageUploadButton({
  onUploaded,
}: {
  onUploaded: (url: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-black text-primary">
        <Upload size={15} /> {pending ? "Uploading…" : "Upload image"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          disabled={pending}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const formData = new FormData();
            formData.set("file", file);
            startTransition(async () => {
              const result = await uploadAcademyMedia(formData);
              setMessage(result.message);
              if (result.ok && result.url) onUploaded(result.url);
            });
          }}
        />
      </label>
      {message ? (
        <span className="text-xs font-semibold text-secondary/50">
          {message}
        </span>
      ) : null}
    </div>
  );
}

function BlockEditor({
  block,
  onChange,
}: {
  block: LessonBlock;
  onChange: (block: LessonBlock) => void;
}) {
  if (block.type === "text")
    return (
      <div className="grid gap-4">
        <Field label="Heading">
          <input
            className={inputClass}
            value={block.heading || ""}
            onChange={(e) => onChange({ ...block, heading: e.target.value })}
          />
        </Field>
        <Field label="Paragraphs (one per line)">
          <textarea
            rows={5}
            className={textareaClass}
            value={block.paragraphs.join("\n")}
            onChange={(e) =>
              onChange({ ...block, paragraphs: e.target.value.split("\n") })
            }
          />
        </Field>
      </div>
    );
  if (block.type === "image")
    return (
      <div className="grid gap-4">
        <Field label="Image URL">
          <input
            className={inputClass}
            value={block.src}
            onChange={(e) => onChange({ ...block, src: e.target.value })}
          />
        </Field>
        <ImageUploadButton onUploaded={(src) => onChange({ ...block, src })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Alt text">
            <input
              className={inputClass}
              value={block.alt}
              onChange={(e) => onChange({ ...block, alt: e.target.value })}
            />
          </Field>
          <Field label="Caption">
            <input
              className={inputClass}
              value={block.caption || ""}
              onChange={(e) => onChange({ ...block, caption: e.target.value })}
            />
          </Field>
        </div>
      </div>
    );
  if (block.type === "callout")
    return (
      <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
        <Field label="Heading">
          <input
            className={inputClass}
            value={block.heading}
            onChange={(e) => onChange({ ...block, heading: e.target.value })}
          />
        </Field>
        <Field label="Tone">
          <select
            className={inputClass}
            value={block.tone}
            onChange={(e) =>
              onChange({ ...block, tone: e.target.value as typeof block.tone })
            }
          >
            {["blue", "teal", "amber", "navy"].map((tone) => (
              <option key={tone}>{tone}</option>
            ))}
          </select>
        </Field>
        <Field label="Body" className="sm:col-span-2">
          <textarea
            rows={4}
            className={textareaClass}
            value={block.body}
            onChange={(e) => onChange({ ...block, body: e.target.value })}
          />
        </Field>
      </div>
    );
  if (block.type === "quote")
    return (
      <div className="grid gap-4">
        <Field label="Quote">
          <textarea
            rows={4}
            className={textareaClass}
            value={block.quote}
            onChange={(e) => onChange({ ...block, quote: e.target.value })}
          />
        </Field>
        <Field label="Attribution">
          <input
            className={inputClass}
            value={block.attribution}
            onChange={(e) =>
              onChange({ ...block, attribution: e.target.value })
            }
          />
        </Field>
      </div>
    );
  if (block.type === "comparison-table")
    return (
      <div className="grid gap-4">
        <Field label="Heading">
          <input
            className={inputClass}
            value={block.heading || ""}
            onChange={(e) => onChange({ ...block, heading: e.target.value })}
          />
        </Field>
        <Field label="Columns (separate with |)">
          <input
            className={inputClass}
            value={block.columns.join(" | ")}
            onChange={(e) =>
              onChange({
                ...block,
                columns: e.target.value.split("|").map((item) => item.trim()),
              })
            }
          />
        </Field>
        <Field label="Rows (one row per line, cells separated with |)">
          <textarea
            rows={5}
            className={textareaClass}
            value={block.rows.map((row) => row.join(" | ")).join("\n")}
            onChange={(e) =>
              onChange({
                ...block,
                rows: e.target.value
                  .split("\n")
                  .map((row) => row.split("|").map((cell) => cell.trim())),
              })
            }
          />
        </Field>
      </div>
    );

  if (
    block.type !== "numbered-list" &&
    block.type !== "accordion" &&
    block.type !== "carousel"
  ) {
    return (
      <p className="text-sm text-secondary/50">
        This block is available in the new Academy authoring studio.
      </p>
    );
  }
  const items = block.items;
  return (
    <div className="grid gap-4">
      <Field label="Heading">
        <input
          className={inputClass}
          value={block.heading || ""}
          onChange={(e) => onChange({ ...block, heading: e.target.value })}
        />
      </Field>
      {items.map((item, itemIndex) => (
        <div
          key={itemIndex}
          className="rounded-xl border border-secondary/10 bg-slate-50 p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <strong className="text-xs text-secondary/55">
              Item {itemIndex + 1}
            </strong>
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...block,
                  items: items.filter((_, i) => i !== itemIndex),
                } as LessonBlock)
              }
              className="text-red-500"
            >
              <Trash2 size={15} />
            </button>
          </div>
          <div className="grid gap-3">
            {"eyebrow" in item ? (
              <Field label="Eyebrow">
                <input
                  className={inputClass}
                  value={item.eyebrow || ""}
                  onChange={(e) =>
                    onChange({
                      ...block,
                      items: items.map((current, i) =>
                        i === itemIndex
                          ? { ...current, eyebrow: e.target.value }
                          : current,
                      ),
                    } as LessonBlock)
                  }
                />
              </Field>
            ) : null}
            <Field label="Title">
              <input
                className={inputClass}
                value={item.title}
                onChange={(e) =>
                  onChange({
                    ...block,
                    items: items.map((current, i) =>
                      i === itemIndex
                        ? { ...current, title: e.target.value }
                        : current,
                    ),
                  } as LessonBlock)
                }
              />
            </Field>
            <Field label="Body">
              <textarea
                rows={3}
                className={textareaClass}
                value={item.body}
                onChange={(e) =>
                  onChange({
                    ...block,
                    items: items.map((current, i) =>
                      i === itemIndex
                        ? { ...current, body: e.target.value }
                        : current,
                    ),
                  } as LessonBlock)
                }
              />
            </Field>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange({
            ...block,
            items: [
              ...items,
              block.type === "carousel"
                ? { eyebrow: "", title: "New item", body: "" }
                : { title: "New item", body: "" },
            ],
          } as LessonBlock)
        }
        className="inline-flex w-fit items-center gap-2 text-xs font-black text-primary"
      >
        <Plus size={15} /> Add item
      </button>
    </div>
  );
}

export default function AcademyCourseEditorLegacy({
  initialCourse,
  status,
  mediaLibrary = [],
}: {
  initialCourse: AcademyCourse;
  status: "draft" | "published" | "archived";
  mediaLibrary?: Array<{ path: string; name: string; url: string }>;
}) {
  const [course, setCourse] = useState<AcademyCourse>(() =>
    structuredClone(initialCourse),
  );
  const [dirty, setDirty] = useState(false);
  const [result, setResult] = useState<AcademyAdminActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const [dragLesson, setDragLesson] = useState<number | null>(null);
  const [dragBlock, setDragBlock] = useState<{
    lesson: number;
    block: number;
  } | null>(null);
  const router = useRouter();
  const update = (next: AcademyCourse) => {
    setCourse(next);
    setDirty(true);
    setResult(null);
  };

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const run = (
    action: () => Promise<AcademyAdminActionResult>,
    after?: (value: AcademyAdminActionResult) => void,
  ) =>
    startTransition(async () => {
      const value = await action();
      setResult(value);
      if (value.ok) {
        setDirty(false);
        after?.(value);
        router.refresh();
      }
    });
  const moveLesson = (from: number, to: number) => {
    if (to < 0 || to >= course.lessons.length) return;
    const lessons = [...course.lessons];
    const [lesson] = lessons.splice(from, 1);
    lessons.splice(to, 0, lesson);
    update({ ...course, lessons });
  };
  const updateLesson = (index: number, lesson: AcademyLesson) =>
    update({
      ...course,
      lessons: course.lessons.map((item, i) => (i === index ? lesson : item)),
    });

  return (
    <div className="pb-28">
      <div className="grid gap-5 rounded-[1.5rem] border border-secondary/10 bg-white p-5 shadow-sm lg:grid-cols-2 lg:p-7">
        <Field label="Course title">
          <input
            className={inputClass}
            value={course.title}
            onChange={(e) =>
              update({
                ...course,
                title: e.target.value,
                shortTitle: course.shortTitle || e.target.value,
              })
            }
          />
        </Field>
        <Field label="Short title">
          <input
            className={inputClass}
            value={course.shortTitle}
            onChange={(e) => update({ ...course, shortTitle: e.target.value })}
          />
        </Field>
        <Field label="Course key">
          <input
            disabled={Boolean(course.id)}
            className={`${inputClass} disabled:bg-slate-100`}
            value={course.key}
            onChange={(e) =>
              update({ ...course, key: academySlugify(e.target.value) })
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
              onChange={(e) =>
                update({ ...course, estimatedMinutes: Number(e.target.value) })
              }
            />
          </Field>
          <Field label="Pass mark %">
            <input
              type="number"
              min={1}
              max={100}
              className={inputClass}
              value={course.passMark || 80}
              onChange={(e) =>
                update({ ...course, passMark: Number(e.target.value) })
              }
            />
          </Field>
        </div>
        <Field label="Description" className="lg:col-span-2">
          <textarea
            rows={4}
            className={textareaClass}
            value={course.description}
            onChange={(e) => update({ ...course, description: e.target.value })}
          />
        </Field>
        <Field label="Hero image URL" className="lg:col-span-2">
          <input
            className={inputClass}
            value={course.heroImage || ""}
            onChange={(e) => update({ ...course, heroImage: e.target.value })}
          />
        </Field>
        <div className="lg:col-span-2">
          <ImageUploadButton
            onUploaded={(heroImage) => update({ ...course, heroImage })}
          />
        </div>
        <fieldset className="lg:col-span-2">
          <legend className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-secondary/45">
            Required audiences
          </legend>
          <div className="flex flex-wrap gap-3">
            {audienceOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-2 rounded-xl border border-secondary/10 px-3 py-2 text-sm font-bold"
              >
                <input
                  type="checkbox"
                  checked={course.audienceRoles?.includes(option.value)}
                  onChange={(e) =>
                    update({
                      ...course,
                      audienceRoles: e.target.checked
                        ? [...(course.audienceRoles || []), option.value]
                        : (course.audienceRoles || []).filter(
                            (role) => role !== option.value,
                          ),
                    })
                  }
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <section className="mt-8 rounded-[1.5rem] border border-secondary/10 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary/60">
              Reusable assets
            </p>
            <h2 className="mt-1 text-xl font-black text-secondary">
              Media library
            </h2>
          </div>
          <ImagePlus className="text-primary/40" />
        </div>
        {mediaLibrary.length ? (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {mediaLibrary.map((media) => (
              <div
                key={media.path}
                className="group relative overflow-hidden rounded-xl border border-secondary/10 bg-slate-50"
              >
                <button
                  type="button"
                  onClick={() => update({ ...course, heroImage: media.url })}
                  className="relative block aspect-video w-full"
                  aria-label={`Use ${media.name} as course hero`}
                >
                  <Image
                    src={media.url}
                    alt=""
                    fill
                    sizes="160px"
                    className="object-cover"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      confirm(
                        "Remove this unused image from the media library?",
                      )
                    )
                      run(
                        () => deleteAcademyMedia(media.path, media.url),
                        () => window.location.reload(),
                      );
                  }}
                  className="absolute right-1 top-1 rounded-full bg-white/90 p-1.5 text-red-600 opacity-0 shadow group-hover:opacity-100 focus:opacity-100"
                  aria-label={`Delete ${media.name}`}
                >
                  <Trash2 size={13} />
                </button>
                <p className="truncate px-2 py-1.5 text-[9px] font-semibold text-secondary/45">
                  {media.name}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm font-semibold text-secondary/40">
            Uploaded course images will appear here for reuse.
          </p>
        )}
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary/60">
              Course structure
            </p>
            <h2 className="mt-1 text-2xl font-black text-secondary">Lessons</h2>
          </div>
          <button
            type="button"
            onClick={() =>
              update({
                ...course,
                lessons: [...course.lessons, newLesson(course.lessons.length)],
              })
            }
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-black text-white"
          >
            <Plus size={15} /> Add lesson
          </button>
        </div>
        <div className="space-y-5">
          {course.lessons.map((lesson, lessonIndex) => (
            <details
              key={`${lesson.slug}-${lessonIndex}`}
              open={lessonIndex === 0}
              draggable
              onDragStart={() => setDragLesson(lessonIndex)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragLesson !== null) moveLesson(dragLesson, lessonIndex);
                setDragLesson(null);
              }}
              className="rounded-[1.5rem] border border-secondary/10 bg-white shadow-sm"
            >
              <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4">
                <GripVertical size={17} className="text-secondary/25" />
                <span className="min-w-0 flex-1 font-black text-secondary">
                  {lesson.title || `Lesson ${lessonIndex + 1}`}
                </span>
                <ReorderButtons
                  index={lessonIndex}
                  total={course.lessons.length}
                  onMove={(to) => moveLesson(lessonIndex, to)}
                  onDuplicate={() =>
                    update({
                      ...course,
                      lessons: [
                        ...course.lessons.slice(0, lessonIndex + 1),
                        {
                          ...structuredClone(lesson),
                          slug: `${lesson.slug}-copy`,
                        },
                        ...course.lessons.slice(lessonIndex + 1),
                      ],
                    })
                  }
                  onRemove={() =>
                    update({
                      ...course,
                      lessons: course.lessons.filter(
                        (_, i) => i !== lessonIndex,
                      ),
                    })
                  }
                />
              </summary>
              <div className="border-t border-secondary/8 p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Section">
                    <input
                      className={inputClass}
                      value={lesson.section}
                      onChange={(e) =>
                        updateLesson(lessonIndex, {
                          ...lesson,
                          section: e.target.value,
                        })
                      }
                    />
                  </Field>
                  <Field label="Lesson title">
                    <input
                      className={inputClass}
                      value={lesson.title}
                      onChange={(e) =>
                        updateLesson(lessonIndex, {
                          ...lesson,
                          title: e.target.value,
                        })
                      }
                    />
                  </Field>
                  <Field label="Stable slug">
                    <input
                      className={inputClass}
                      value={lesson.slug}
                      onChange={(e) =>
                        updateLesson(lessonIndex, {
                          ...lesson,
                          slug: academySlugify(e.target.value),
                        })
                      }
                    />
                  </Field>
                  <Field label="Minutes">
                    <input
                      type="number"
                      min={1}
                      className={inputClass}
                      value={lesson.durationMinutes}
                      onChange={(e) =>
                        updateLesson(lessonIndex, {
                          ...lesson,
                          durationMinutes: Number(e.target.value),
                        })
                      }
                    />
                  </Field>
                  <Field label="Summary" className="sm:col-span-2">
                    <textarea
                      rows={3}
                      className={textareaClass}
                      value={lesson.summary}
                      onChange={(e) =>
                        updateLesson(lessonIndex, {
                          ...lesson,
                          summary: e.target.value,
                        })
                      }
                    />
                  </Field>
                </div>
                <div className="mt-6 space-y-4">
                  {lesson.blocks.map((block, blockIndex) => (
                    <details
                      key={blockIndex}
                      draggable
                      onDragStart={(event) => {
                        event.stopPropagation();
                        setDragBlock({
                          lesson: lessonIndex,
                          block: blockIndex,
                        });
                      }}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.stopPropagation();
                        if (
                          dragBlock?.lesson === lessonIndex &&
                          dragBlock.block !== blockIndex
                        ) {
                          const blocks = [...lesson.blocks];
                          const [moving] = blocks.splice(dragBlock.block, 1);
                          blocks.splice(blockIndex, 0, moving);
                          updateLesson(lessonIndex, { ...lesson, blocks });
                        }
                        setDragBlock(null);
                      }}
                      className="rounded-xl border border-secondary/10 bg-slate-50"
                      open
                    >
                      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3">
                        <GripVertical size={15} className="text-secondary/25" />
                        <span className="flex-1 text-sm font-black text-secondary">
                          {block.type in blockLabels
                            ? blockLabels[block.type as LegacyBlockType]
                            : "Advanced block"}
                        </span>
                        <ReorderButtons
                          index={blockIndex}
                          total={lesson.blocks.length}
                          onMove={(to) => {
                            const blocks = [...lesson.blocks];
                            const [moving] = blocks.splice(blockIndex, 1);
                            blocks.splice(to, 0, moving);
                            updateLesson(lessonIndex, { ...lesson, blocks });
                          }}
                          onDuplicate={() =>
                            updateLesson(lessonIndex, {
                              ...lesson,
                              blocks: [
                                ...lesson.blocks.slice(0, blockIndex + 1),
                                structuredClone(block),
                                ...lesson.blocks.slice(blockIndex + 1),
                              ],
                            })
                          }
                          onRemove={() =>
                            updateLesson(lessonIndex, {
                              ...lesson,
                              blocks: lesson.blocks.filter(
                                (_, i) => i !== blockIndex,
                              ),
                            })
                          }
                        />
                      </summary>
                      <div className="border-t border-secondary/8 p-4">
                        <BlockEditor
                          block={block}
                          onChange={(next) =>
                            updateLesson(lessonIndex, {
                              ...lesson,
                              blocks: lesson.blocks.map((item, i) =>
                                i === blockIndex ? next : item,
                              ),
                            })
                          }
                        />
                      </div>
                    </details>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {Object.entries(blockLabels).map(([type, label]) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        updateLesson(lessonIndex, {
                          ...lesson,
                          blocks: [
                            ...lesson.blocks,
                            newBlock(type as LegacyBlockType),
                          ],
                        })
                      }
                      className="rounded-full border border-primary/15 bg-white px-3 py-2 text-[11px] font-black text-primary"
                    >
                      <Plus size={13} className="mr-1 inline" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary/60">
              Assessment
            </p>
            <h2 className="mt-1 text-2xl font-black text-secondary">Quiz</h2>
          </div>
          <button
            type="button"
            onClick={() =>
              update({
                ...course,
                quiz: [...course.quiz, newQuestion(course.quiz.length)],
              })
            }
            className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-xs font-black text-white"
          >
            <Plus size={15} /> Add question
          </button>
        </div>
        <div className="space-y-4">
          {course.quiz.map((question, questionIndex) => (
            <div
              key={`${question.id}-${questionIndex}`}
              className="rounded-[1.5rem] border border-secondary/10 bg-white p-5 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between">
                <strong className="text-sm text-secondary">
                  Question {questionIndex + 1}
                </strong>
                <ReorderButtons
                  index={questionIndex}
                  total={course.quiz.length}
                  onMove={(to) => {
                    const quiz = [...course.quiz];
                    const [moving] = quiz.splice(questionIndex, 1);
                    quiz.splice(to, 0, moving);
                    update({ ...course, quiz });
                  }}
                  onDuplicate={() =>
                    update({
                      ...course,
                      quiz: [
                        ...course.quiz.slice(0, questionIndex + 1),
                        {
                          ...structuredClone(question),
                          id: `${question.id}-copy`,
                        },
                        ...course.quiz.slice(questionIndex + 1),
                      ],
                    })
                  }
                  onRemove={() =>
                    update({
                      ...course,
                      quiz: course.quiz.filter((_, i) => i !== questionIndex),
                    })
                  }
                />
              </div>
              <div className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
                  <Field label="Question ID">
                    <input
                      className={inputClass}
                      value={question.id}
                      onChange={(e) =>
                        update({
                          ...course,
                          quiz: course.quiz.map((item, i) =>
                            i === questionIndex
                              ? {
                                  ...question,
                                  id: academySlugify(e.target.value),
                                }
                              : item,
                          ),
                        })
                      }
                    />
                  </Field>
                  <Field label="Prompt">
                    <input
                      className={inputClass}
                      value={question.prompt}
                      onChange={(e) =>
                        update({
                          ...course,
                          quiz: course.quiz.map((item, i) =>
                            i === questionIndex
                              ? { ...question, prompt: e.target.value }
                              : item,
                          ),
                        })
                      }
                    />
                  </Field>
                </div>
                {question.options.map((option, optionIndex) => (
                  <div
                    key={optionIndex}
                    className="grid grid-cols-[42px_1fr_42px] gap-2"
                  >
                    <input
                      aria-label="Answer ID"
                      className={inputClass}
                      value={option.id}
                      onChange={(e) => {
                        const options = question.options.map((item, i) =>
                          i === optionIndex
                            ? { ...item, id: e.target.value }
                            : item,
                        );
                        update({
                          ...course,
                          quiz: course.quiz.map((item, i) =>
                            i === questionIndex
                              ? { ...question, options }
                              : item,
                          ),
                        });
                      }}
                    />
                    <input
                      aria-label="Answer text"
                      className={inputClass}
                      value={option.label}
                      onChange={(e) => {
                        const options = question.options.map((item, i) =>
                          i === optionIndex
                            ? { ...item, label: e.target.value }
                            : item,
                        );
                        update({
                          ...course,
                          quiz: course.quiz.map((item, i) =>
                            i === questionIndex
                              ? { ...question, options }
                              : item,
                          ),
                        });
                      }}
                    />
                    <button
                      type="button"
                      aria-label="Remove answer"
                      onClick={() =>
                        update({
                          ...course,
                          quiz: course.quiz.map((item, i) =>
                            i === questionIndex
                              ? {
                                  ...question,
                                  options: question.options.filter(
                                    (_, oi) => oi !== optionIndex,
                                  ),
                                }
                              : item,
                          ),
                        })
                      }
                      className="text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    update({
                      ...course,
                      quiz: course.quiz.map((item, i) =>
                        i === questionIndex
                          ? {
                              ...question,
                              options: [
                                ...question.options,
                                {
                                  id: String.fromCharCode(
                                    97 + question.options.length,
                                  ),
                                  label: "New answer",
                                },
                              ],
                            }
                          : item,
                      ),
                    })
                  }
                  className="w-fit text-xs font-black text-primary"
                >
                  <Plus size={14} className="mr-1 inline" />
                  Add answer
                </button>
                <Field label="Correct answer">
                  <select
                    className={inputClass}
                    value={question.correctOptionId}
                    onChange={(e) =>
                      update({
                        ...course,
                        quiz: course.quiz.map((item, i) =>
                          i === questionIndex
                            ? { ...question, correctOptionId: e.target.value }
                            : item,
                        ),
                      })
                    }
                  >
                    {question.options.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.id}: {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Answer explanation">
                  <textarea
                    rows={3}
                    className={textareaClass}
                    value={question.explanation}
                    onChange={(e) =>
                      update({
                        ...course,
                        quiz: course.quiz.map((item, i) =>
                          i === questionIndex
                            ? { ...question, explanation: e.target.value }
                            : item,
                        ),
                      })
                    }
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-secondary/10 bg-white/95 px-4 py-3 shadow-[0_-12px_30px_rgba(0,26,68,0.08)] backdrop-blur lg:left-72">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div>
            {result ? (
              <p
                className={`text-sm font-bold ${result.ok ? "text-emerald-700" : "text-red-700"}`}
              >
                {result.message}
              </p>
            ) : (
              <p className="text-xs font-semibold text-secondary/45">
                {dirty ? "Unsaved changes" : "All changes saved"}
              </p>
            )}
            {result?.errors?.length ? (
              <p className="mt-1 max-w-xl text-xs text-red-600">
                {result.errors.slice(0, 3).join(" ")}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {course.id ? (
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  run(
                    () => duplicateAcademyCourse(course),
                    (value) =>
                      router.push(
                        `/dashboard/admin/academy/${value.courseKey}`,
                      ),
                  )
                }
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border px-4 text-xs font-black"
              >
                <Copy size={15} /> Duplicate
              </button>
            ) : null}
            {course.id && status === "published" ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (
                    confirm(
                      "Discard all draft edits and restore the published version?",
                    )
                  )
                    run(
                      () => discardAcademyDraft(course.id!),
                      () => window.location.reload(),
                    );
                }}
                className="rounded-xl border px-4 text-xs font-black"
              >
                Discard draft
              </button>
            ) : null}
            {course.id ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (
                    confirm(
                      "Archive this course? Learners will no longer see it.",
                    )
                  )
                    run(
                      () => archiveAcademyCourse(course.id!),
                      () => router.push("/dashboard/admin/academy"),
                    );
                }}
                className="rounded-xl border border-red-200 px-4 text-xs font-black text-red-600"
              >
                Archive
              </button>
            ) : null}
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(
                  () => saveAcademyCourseDraft(course),
                  (value) => {
                    if (!course.id && value.courseId) {
                      setCourse((current) => ({
                        ...current,
                        id: value.courseId,
                      }));
                      router.replace(
                        `/dashboard/admin/academy/${value.courseKey}`,
                      );
                    }
                  },
                )
              }
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 text-xs font-black text-primary"
            >
              <Save size={15} /> Save draft
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(
                  () => saveAcademyCourseDraft(course),
                  (value) =>
                    router.push(
                      `/dashboard/admin/academy/${value.courseKey}/preview`,
                    ),
                )
              }
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border px-4 text-xs font-black"
            >
              <Eye size={15} /> Preview
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (confirm("Publish this draft to eligible learners?"))
                  run(() => publishAcademyCourse(course));
              }}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-5 text-xs font-black text-white"
            >
              <ImagePlus size={15} /> {pending ? "Working…" : "Publish"}
            </button>
            <Link
              href="/dashboard/admin/academy"
              className="inline-flex min-h-10 items-center rounded-xl px-3 text-xs font-black text-secondary/45"
            >
              Close
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

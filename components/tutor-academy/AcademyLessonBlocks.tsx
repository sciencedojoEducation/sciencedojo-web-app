import Image from "next/image";
import {
  Check,
  ExternalLink,
  FileText,
  Lightbulb,
  ShieldCheck,
} from "lucide-react";
import type {
  AcademyMediaCaptionItem,
  LessonBlock,
} from "@/lib/tutor-academy";
import AcademyCarousel from "./AcademyCarousel";
import AcademyRichText from "./AcademyRichText";
import AcademyMath from "./AcademyMath";
import {
  AcademyAccordion,
  AcademyFlashcards,
  AcademyKnowledgeCheck,
  AcademyProcess,
  AcademySurvey,
  AcademyTabs,
} from "./AcademyInteractiveBlocks";

const calloutClasses = {
  blue: "border-[#AFC8E7] bg-[#F1F6FC] text-[#173A63]",
  teal: "border-[#B9D8D3] bg-[#F2F8F7] text-[#244743]",
  amber: "border-[#E3CCA2] bg-[#FBF7EE] text-[#59451F]",
  navy: "border-[#1E5AA8] bg-[#EDF4FB] text-[#173A63]",
};

function AcademyMediaCaption({
  caption,
  items = [],
}: {
  caption?: string;
  items?: AcademyMediaCaptionItem[];
}) {
  if (!caption && !items.length) return null;
  return (
    <div className="space-y-4 px-5 py-4 font-[family-name:var(--font-academy-serif)] text-[13px] leading-6 text-[#5F6267]">
      {caption ? <p>{caption}</p> : null}
      {items.map((item) => {
        if (item.type === "ordered-list" || item.type === "unordered-list") {
          const ListTag = item.type === "ordered-list" ? "ol" : "ul";
          return (
            <ListTag
              key={item.id}
              className={`${item.type === "ordered-list" ? "list-decimal" : "list-disc"} space-y-1 pl-5`}
            >
              {item.items.filter(Boolean).map((value, index) => (
                <li key={`${item.id}-${index}`}>{value}</li>
              ))}
            </ListTag>
          );
        }
        if (item.type === "table")
          return (
            <div key={item.id} className="overflow-x-auto">
              <table className="w-full min-w-80 border-collapse text-left text-xs">
                <thead className="bg-[#F1F6FC] text-[#173A63]">
                  <tr>
                    {item.columns.map((column, index) => (
                      <th key={`${item.id}-heading-${index}`} className="border border-[#DEDFE1] px-3 py-2 font-bold">{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {item.rows.map((row, rowIndex) => (
                    <tr key={`${item.id}-row-${rowIndex}`}>
                      {row.map((cell, cellIndex) => (
                        <td key={`${item.id}-cell-${rowIndex}-${cellIndex}`} className="border border-[#DEDFE1] px-3 py-2">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        return (
          <div key={item.id} className="rounded-lg bg-[#F7F7F5] px-4 py-3 text-[#252629]">
            <AcademyMath latex={item.latex} display label={item.shortDescription} description={item.longDescription} />
          </div>
        );
      })}
    </div>
  );
}

export default function AcademyLessonBlocks({
  blocks,
  courseKey,
}: {
  blocks: LessonBlock[];
  courseKey?: string;
}) {
  return (
    <div className="academy-block-stack flex flex-col">
      {blocks.map((block, blockIndex) => {
        const content = (() => {
        if (block.type === "text") {
          if (block.content)
            return (
              <section key={block.id || blockIndex}>
                <AcademyRichText
                  document={block.content}
                  className={
                    block.layout === "two-column"
                      ? "md:columns-2 md:gap-10 [&>*]:break-inside-avoid"
                      : ""
                  }
                />
              </section>
            );
          return (
            <section
              key={blockIndex}
              className={`space-y-5 ${block.layout === "two-column" ? "md:columns-2 md:gap-10 [&>*]:break-inside-avoid" : ""}`}
            >
              {block.heading && (
                <h2 className="text-[28px] font-bold leading-9 tracking-[-0.02em] text-[#101010] sm:text-[32px] sm:leading-10">
                  {block.heading}
                </h2>
              )}
              {block.paragraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  className="font-[family-name:var(--font-academy-serif)] text-[17px] leading-[30px] text-[#36373A] sm:leading-[33px]"
                >
                  {paragraph}
                </p>
              ))}
            </section>
          );
        }

        if (block.type === "image") {
          const widthClass =
            block.width === "reading"
              ? "w-full"
              : block.width === "full"
                ? "relative left-1/2 w-screen -translate-x-1/2"
                : "relative left-1/2 w-[calc(100vw-48px)] max-w-[1000px] -translate-x-1/2 lg:w-[calc(100vw-328px)]";
          const aspectClass =
            block.aspect === "square"
              ? "aspect-square"
              : block.aspect === "landscape"
                ? "aspect-[4/3]"
                : "aspect-[16/9]";
          return (
            <figure
              key={block.id || blockIndex}
              className={`${widthClass} overflow-hidden border border-[#DEDFE1] bg-white`}
            >
              <div className={`relative ${aspectClass} w-full bg-slate-100`}>
                {block.src ? (
                  <Image
                    src={block.src}
                    alt={block.decorative ? "" : block.alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 1000px"
                    className="object-cover"
                    style={{ objectPosition: block.focalPoint || "center" }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm font-bold text-[#717376]">
                    Choose an image
                  </div>
                )}
              </div>
              {block.caption || block.captionItems?.length ? (
                <figcaption className="border-t border-[#DEDFE1]">
                  <AcademyMediaCaption
                    caption={block.caption}
                    items={block.captionItems}
                  />
                </figcaption>
              ) : null}
            </figure>
          );
        }

        if (block.type === "callout") {
          return (
            <aside
              key={blockIndex}
              className={`border-l-4 p-6 sm:p-7 ${calloutClasses[block.tone]}`}
            >
              <div className="flex items-start gap-4">
                <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center text-[#1E5AA8]">
                  {block.tone === "amber" ? (
                    <ShieldCheck size={21} />
                  ) : (
                    <Lightbulb size={21} />
                  )}
                </span>
                <div>
                  <h2 className="text-xl font-bold tracking-[-0.01em]">
                    {block.heading}
                  </h2>
                  <p className="mt-2 font-[family-name:var(--font-academy-serif)] text-[15px] leading-7 opacity-80">
                    {block.body}
                  </p>
                </div>
              </div>
            </aside>
          );
        }

        if (block.type === "numbered-list") {
          const listStyle = block.appearance?.variant || "numbered";
          return (
            <section key={blockIndex}>
              {block.heading && (
                <h2 className="mb-6 text-[28px] font-bold leading-9 tracking-[-0.02em] text-[#101010] sm:text-[32px] sm:leading-10">
                  {block.heading}
                </h2>
              )}
              <ol className="border-t border-[#DEDFE1]">
                {block.items.map((item, index) => (
                  <li
                    key={item.title}
                    className="grid grid-cols-[44px_1fr] gap-4 border-b border-[#DEDFE1] py-6"
                  >
                    <span
                      className={`inline-flex h-9 w-9 items-center justify-center text-sm font-bold ${listStyle === "bulleted" ? "text-2xl text-[#1E5AA8]" : listStyle === "checklist" ? "rounded-full bg-[#1E5AA8] text-white" : "rounded-full border-2 border-[#1E5AA8] text-[#1E5AA8]"}`}
                      aria-hidden="true"
                    >
                      {listStyle === "bulleted" ? "•" : listStyle === "checklist" ? <Check size={17} /> : index + 1}
                    </span>
                    <div>
                      <h3 className="text-lg font-bold text-[#252629]">
                        {item.title}
                      </h3>
                      <p className="mt-2 font-[family-name:var(--font-academy-serif)] text-[15px] leading-7 text-[#4A4B4E]">
                        {item.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          );
        }

        if (block.type === "accordion") {
          return (
            <section key={blockIndex}>
              {block.heading && (
                <h2 className="mb-6 text-[28px] font-bold leading-9 tracking-[-0.02em] text-[#101010] sm:text-[32px] sm:leading-10">
                  {block.heading}
                </h2>
              )}
              <AcademyAccordion
                items={block.items}
                courseKey={courseKey}
                blockId={block.id}
                completion={block.completion}
              />
            </section>
          );
        }

        if (block.type === "carousel") {
          return (
            <section key={blockIndex}>
              {block.heading && (
                <h2 className="mb-6 text-[28px] font-bold leading-9 tracking-[-0.02em] text-[#101010] sm:text-[32px] sm:leading-10">
                  {block.heading}
                </h2>
              )}
              <AcademyCarousel
                items={block.items}
                courseKey={courseKey}
                blockId={block.id}
                completion={block.completion}
              />
            </section>
          );
        }

        if (block.type === "quote") {
          return (
            <figure
              key={blockIndex}
              className="border-y border-[#DEDFE1] py-9 sm:px-8"
            >
              <blockquote className="font-[family-name:var(--font-academy-serif)] text-2xl font-bold leading-[1.55] text-[#252629] sm:text-[28px]">
                “{block.quote}”
              </blockquote>
              <figcaption className="mt-5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#1E5AA8]">
                — {block.attribution}
              </figcaption>
            </figure>
          );
        }

        if (block.type === "divider") {
          return (
            <div
              key={block.id || blockIndex}
              className="flex items-center gap-4 py-3"
              role="separator"
            >
              <span className="h-px flex-1 bg-[#DEDFE1]" />
              {block.label ? (
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#717376]">
                  {block.label}
                </span>
              ) : null}
              <span className="h-px flex-1 bg-[#DEDFE1]" />
            </div>
          );
        }

        if (block.type === "gallery") {
          return (
            <section key={block.id || blockIndex}>
              {block.heading ? (
                <h2 className="mb-6 text-[28px] font-bold sm:text-[32px]">
                  {block.heading}
                </h2>
              ) : null}
              <div
                className={`grid gap-4 ${block.columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
              >
                {block.items.map((item, index) => (
                  <figure
                    key={item.id || index}
                    className="overflow-hidden border border-[#DEDFE1] bg-white"
                  >
                    <div className="relative aspect-[4/3] bg-slate-100">
                      {item.src ? (
                        <Image
                          src={item.src}
                          alt={item.alt || ""}
                          fill
                          sizes="(max-width: 640px) 100vw, 360px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    {item.caption ? (
                      <figcaption className="p-3 text-sm text-[#717376]">
                        {item.caption}
                      </figcaption>
                    ) : null}
                  </figure>
                ))}
              </div>
            </section>
          );
        }

        if (block.type === "tabs") {
          return (
            <section key={block.id || blockIndex}>
              {block.heading ? (
                <h2 className="mb-6 text-[28px] font-bold sm:text-[32px]">
                  {block.heading}
                </h2>
              ) : null}
              <AcademyTabs
                items={block.items}
                courseKey={courseKey}
                blockId={block.id}
                completion={block.completion}
              />
            </section>
          );
        }

        if (block.type === "flashcards") {
          return (
            <section key={block.id || blockIndex}>
              {block.heading ? (
                <h2 className="mb-6 text-[28px] font-bold sm:text-[32px]">
                  {block.heading}
                </h2>
              ) : null}
              <AcademyFlashcards
                items={block.items}
                variant={
                  block.appearance?.variant === "stack"
                    ? "stack"
                    : "flip-grid"
                }
                courseKey={courseKey}
                blockId={block.id}
                completion={block.completion}
              />
            </section>
          );
        }

        if (block.type === "process") {
          if ((block.appearance?.variant || "slides") === "slides")
            return (
              <section key={block.id || blockIndex}>
                <AcademyProcess
                  heading={block.heading}
                  items={block.items}
                  courseKey={courseKey}
                  blockId={block.id}
                  completion={block.completion}
                />
              </section>
            );
          return (
            <section key={block.id || blockIndex}>
              {block.heading ? (
                <h2 className="mb-7 text-[28px] font-bold sm:text-[32px]">
                  {block.heading}
                </h2>
              ) : null}
              <ol className="relative ml-4 border-l-2 border-[#AFC8E7]">
                {block.items.map((item, index) => (
                  <li
                    key={item.id || index}
                    className="relative pb-8 pl-8 last:pb-0"
                  >
                    <span className="absolute -left-[17px] top-0 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#1E5AA8] text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <h3 className="text-lg font-bold text-[#252629]">
                      {item.title}
                    </h3>
                    <p className="mt-2 font-[family-name:var(--font-academy-serif)] text-[15px] leading-7 text-[#4A4B4E]">
                      {item.body}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          );
        }

        if (block.type === "survey") {
          return (
            <section key={block.id || blockIndex}>
              {block.heading ? (
                <h2 className="mb-6 text-[28px] font-bold sm:text-[32px]">
                  {block.heading}
                </h2>
              ) : null}
              <AcademySurvey
                prompt={block.prompt}
                lowLabel={block.lowLabel}
                highLabel={block.highLabel}
                scale={block.scale}
                submitLabel={block.submitLabel}
                variant={
                  block.appearance?.variant === "compact" ? "compact" : "scale"
                }
                courseKey={courseKey}
                blockId={block.id}
                completion={block.completion}
              />
            </section>
          );
        }

        if (block.type === "resources") {
          return (
            <section key={block.id || blockIndex}>
              {block.heading ? (
                <h2 className="mb-6 text-[28px] font-bold sm:text-[32px]">
                  {block.heading}
                </h2>
              ) : null}
              <div className="divide-y divide-[#DEDFE1] border-y border-[#DEDFE1]">
                {block.items.map((item, index) => (
                  <a
                    key={item.id || index}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-4 py-5 text-[#252629] hover:text-[#1E5AA8]"
                  >
                    <FileText className="shrink-0 text-[#1E5AA8]" />
                    <span className="min-w-0 flex-1">
                      <strong className="block">{item.title}</strong>
                      {item.description ? (
                        <span className="mt-1 block text-sm font-normal text-[#717376]">
                          {item.description}
                        </span>
                      ) : null}
                    </span>
                    <ExternalLink size={17} />
                  </a>
                ))}
              </div>
            </section>
          );
        }

        if (block.type === "video" || block.type === "audio") {
          const embed = getAcademyEmbedUrl(block.type, block.url);
          return (
            <section key={block.id || blockIndex}>
              {block.heading ? (
                <h2 className="mb-6 text-[28px] font-bold sm:text-[32px]">
                  {block.heading}
                </h2>
              ) : null}
              {embed ? (
                <iframe
                  src={embed}
                  title={block.heading || `${block.type} content`}
                  className={
                    block.type === "video"
                      ? "aspect-video w-full border-0"
                      : "h-40 w-full border-0"
                  }
                  allow={
                    block.type === "video"
                      ? "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      : "autoplay; clipboard-write; encrypted-media"
                  }
                  allowFullScreen={block.type === "video"}
                />
              ) : (
                <div className="border border-amber-200 bg-amber-50 p-5 text-sm font-semibold text-amber-950">
                  This media URL is not from an approved provider.
                </div>
              )}
              {block.caption || block.captionItems?.length ? (
                <div className="mt-3 border-t border-[#DEDFE1]">
                  <AcademyMediaCaption
                    caption={block.caption}
                    items={block.captionItems}
                  />
                </div>
              ) : null}
              {block.transcript ? (
                <details className="mt-4 border-y border-[#DEDFE1] py-4">
                  <summary className="cursor-pointer font-bold text-[#1E5AA8]">
                    Read transcript
                  </summary>
                  <p className="mt-3 whitespace-pre-wrap font-[family-name:var(--font-academy-serif)] text-[15px] leading-7 text-[#4A4B4E]">
                    {block.transcript}
                  </p>
                </details>
              ) : null}
            </section>
          );
        }

        if (block.type === "worked-example") {
          return (
            <section
              key={block.id || blockIndex}
              className="border border-[#DEDFE1] bg-[#FAFAFA] p-6 sm:p-8"
            >
              {block.heading ? (
                <h2 className="text-[28px] font-bold sm:text-[32px]">
                  {block.heading}
                </h2>
              ) : null}
              <p className="mt-5 font-[family-name:var(--font-academy-serif)] text-[17px] leading-8">
                {block.problem}
              </p>
              {block.latex ? (
                <div className="mt-5 overflow-x-auto border border-[#DEDFE1] bg-white p-4 text-lg text-[#173A63]">
                  <AcademyMath latex={block.latex} display />
                </div>
              ) : null}
              <ol className="mt-6 space-y-4">
                {block.steps.map((step, index) => (
                  <li
                    key={step.id || index}
                    className="grid grid-cols-[32px_1fr] gap-3"
                  >
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#1E5AA8] text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <div>
                      <strong>{step.title}</strong>
                      <p className="mt-1 text-sm leading-6 text-[#4A4B4E]">
                        {step.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-6 border-l-4 border-emerald-600 bg-emerald-50 p-4">
                <strong>Answer</strong>
                <p className="mt-1 text-sm leading-6">{block.answer}</p>
              </div>
            </section>
          );
        }

        if (block.type === "knowledge-check") {
          return (
            <section key={block.id || blockIndex}>
              {block.heading ? (
                <h2 className="mb-6 text-[28px] font-bold sm:text-[32px]">
                  {block.heading}
                </h2>
              ) : null}
              <AcademyKnowledgeCheck
                question={block.question}
                courseKey={courseKey}
                blockId={block.id}
                completion={block.completion}
              />
            </section>
          );
        }

        if (block.type === "comparison-table")
          return (
            <section key={blockIndex}>
              {block.heading && (
                <h2 className="mb-6 text-[28px] font-bold leading-9 tracking-[-0.02em] text-[#101010] sm:text-[32px] sm:leading-10">
                  {block.heading}
                </h2>
              )}
              <div className="overflow-x-auto border border-[#DEDFE1] bg-white">
                <table className="min-w-[42rem] w-full border-collapse text-left">
                  <thead className="bg-[#F3F3F3] text-[#252629]">
                    <tr>
                      {block.columns.map((column) => (
                        <th
                          key={column}
                          className="border-b border-[#DEDFE1] px-5 py-4 text-xs font-bold uppercase tracking-[0.1em]"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary/8">
                    {block.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="align-top">
                        {row.map((cell, cellIndex) => (
                          <td
                            key={cellIndex}
                            className={`px-5 py-4 text-sm leading-6 ${cellIndex === 0 ? "font-bold text-[#252629]" : "font-[family-name:var(--font-academy-serif)] text-[#4A4B4E]"}`}
                          >
                            {cellIndex > 0 && (
                              <Check
                                size={15}
                                className="mr-2 inline text-[#1E5AA8]"
                                aria-hidden="true"
                              />
                            )}
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );

          return null;
        })();
        const appearance = block.appearance || {
          variant: "default",
          surface: "plain",
          spacing: "comfortable",
          width: "reading",
        };
        const widthClass =
          appearance.width === "narrow"
            ? "mx-auto w-full max-w-xl"
            : appearance.width === "wide"
              ? "relative left-1/2 w-[calc(100vw-48px)] max-w-[1000px] -translate-x-1/2 lg:w-[calc(100vw-328px)]"
              : "w-full";
        return (
          <div
            key={block.id || blockIndex}
            data-block-variant={appearance.variant}
            className={`${widthClass} academy-block-surface-${appearance.surface} academy-block-spacing-${appearance.spacing}`}
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}

function getAcademyEmbedUrl(type: "video" | "audio", value: string) {
  try {
    const url = new URL(value);
    if (
      type === "video" &&
      (url.hostname === "youtube.com" ||
        url.hostname === "www.youtube.com" ||
        url.hostname === "youtu.be")
    ) {
      const id =
        url.hostname === "youtu.be"
          ? url.pathname.slice(1)
          : url.searchParams.get("v") || url.pathname.split("/").pop();
      return id
        ? `https://www.youtube.com/embed/${encodeURIComponent(id)}`
        : null;
    }
    if (
      type === "video" &&
      (url.hostname === "vimeo.com" ||
        url.hostname === "www.vimeo.com" ||
        url.hostname === "player.vimeo.com")
    ) {
      const id = url.pathname.split("/").filter(Boolean).pop();
      return id
        ? `https://player.vimeo.com/video/${encodeURIComponent(id)}`
        : null;
    }
    if (type === "audio" && url.hostname.endsWith("spotify.com"))
      return `https://open.spotify.com/embed${url.pathname.replace(/^\/embed/, "")}`;
    if (type === "audio" && url.hostname.endsWith("soundcloud.com"))
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(value)}`;
  } catch {
    return null;
  }
  return null;
}

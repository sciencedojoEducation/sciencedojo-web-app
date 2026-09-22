"use client";

import { Bot, ImagePlus, LayoutGrid, Plus, X } from "lucide-react";
import AcademyBlockIcon from "@/components/admin/academy-builder/AcademyBlockIcon";
import {
  academyBlockRegistry,
  type AcademyBlockDefinition,
} from "@/lib/academy-schema";
import type { LessonBlock } from "@/lib/tutor-academy";

const quickBlocks = academyBlockRegistry
  .filter((definition) => definition.quickAccessOrder)
  .sort(
    (left, right) =>
      (left.quickAccessOrder || 99) - (right.quickAccessOrder || 99),
  );

function BlockChoice({
  definition,
  onInsert,
}: {
  definition: AcademyBlockDefinition;
  onInsert: (type: LessonBlock["type"]) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onInsert(definition.type)}
      className="group/choice flex min-h-20 min-w-[76px] flex-col items-center justify-center gap-2 rounded-lg px-2 py-2 text-center text-[11px] font-bold text-[#353638] outline-none transition hover:bg-[#F2F5F9] hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      aria-label={`Insert ${definition.label}`}
    >
      <AcademyBlockIcon
        name={definition.icon}
        size={22}
        className="text-[#292A2C] transition group-hover/choice:text-primary"
      />
      <span className="whitespace-nowrap">{definition.shortLabel}</span>
    </button>
  );
}

function ComingSoonChoice({
  kind,
}: {
  kind: "AI block" | "AI image";
}) {
  const Icon = kind === "AI block" ? Bot : ImagePlus;
  const description = `${kind} is coming soon and is not available yet.`;
  return (
    <button
      type="button"
      aria-disabled="true"
      aria-label={description}
      title={description}
      className="flex min-h-20 min-w-[76px] cursor-not-allowed flex-col items-center justify-center gap-2 rounded-lg px-2 py-2 text-center text-[11px] font-bold text-secondary/35 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <span className="relative">
        <Icon aria-hidden="true" size={22} />
        <span className="absolute -right-4 -top-3 rounded-full bg-[#EEE9FF] px-1.5 py-0.5 text-[7px] font-black uppercase tracking-wide text-[#7052CC]">
          Soon
        </span>
      </span>
      <span>{kind}</span>
    </button>
  );
}

export default function BlockInsertionTray({
  expanded,
  firstBlock,
  onToggle,
  onInsert,
  onOpenLibrary,
}: {
  expanded: boolean;
  firstBlock?: boolean;
  onToggle: () => void;
  onInsert: (type: LessonBlock["type"]) => void;
  onOpenLibrary: () => void;
}) {
  if (!expanded)
    return (
      <div className="group/insert flex h-10 items-center" data-insert-point>
        <span className="h-px flex-1 bg-transparent transition group-hover/insert:bg-primary/20" />
        <button
          type="button"
          onClick={onToggle}
          className="mx-2 inline-flex h-8 w-8 scale-90 items-center justify-center rounded-full border border-primary/25 bg-white text-primary opacity-0 shadow-sm outline-none transition group-hover/insert:scale-100 group-hover/insert:opacity-100 focus:scale-100 focus:opacity-100 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-label="Add a block here"
          aria-expanded="false"
        >
          <Plus size={17} />
        </button>
        <span className="h-px flex-1 bg-transparent transition group-hover/insert:bg-primary/20" />
      </div>
    );

  return (
    <section
      className="my-5 border-y border-[#DCDDDF] bg-white py-5"
      aria-label={firstBlock ? "Add your first block" : "Add a block"}
      data-insert-point
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <p className="text-sm font-black text-[#171719]">
          {firstBlock ? "Add your first block" : "Choose a block"}
        </p>
        {!firstBlock ? (
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-secondary/45 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Close block choices"
          >
            <X size={18} />
          </button>
        ) : null}
      </div>
      <div className="flex items-stretch gap-1 overflow-x-auto rounded-xl border border-dashed border-[#C9CBCE] bg-white p-2 [scrollbar-width:thin]">
        <button
          type="button"
          onClick={onOpenLibrary}
          className="flex min-h-20 min-w-[92px] flex-col items-center justify-center gap-2 rounded-lg bg-[#171719] px-3 py-2 text-center text-[11px] font-black text-white outline-none hover:bg-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <LayoutGrid aria-hidden="true" size={22} />
          <span>Block library</span>
        </button>
        <ComingSoonChoice kind="AI block" />
        <ComingSoonChoice kind="AI image" />
        <span className="mx-1 w-px shrink-0 bg-[#E4E5E7]" aria-hidden="true" />
        {quickBlocks.map((definition) => (
          <BlockChoice
            key={definition.type}
            definition={definition}
            onInsert={onInsert}
          />
        ))}
      </div>
    </section>
  );
}

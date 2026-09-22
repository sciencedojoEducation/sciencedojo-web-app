"use client";

import { useId, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { recordAcademyBlockCompletion } from "@/app/dashboard/tutor/academy/actions";

type CarouselItem = {
  id?: string;
  title?: string;
  body?: string;
  eyebrow?: string;
  src?: string;
  alt?: string;
  caption?: string;
};

export default function AcademyCarousel({
  items,
  courseKey,
  blockId,
  completion,
}: {
  items: CarouselItem[];
  courseKey?: string;
  blockId?: string;
  completion?: "view" | "interact" | "pass";
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselId = useId();
  const safeIndex = Math.min(activeIndex, Math.max(0, items.length - 1));
  const item = items[safeIndex];
  const markInteracted = () => {
    if (completion === "interact" && courseKey && blockId)
      void recordAcademyBlockCompletion(courseKey, blockId);
  };

  if (!item) {
    return (
      <div className="border border-dashed border-[#C9CDD2] bg-[#FAFAFA] px-6 py-10 text-center text-sm text-[#717376]">
        No carousel cards have been added yet.
      </div>
    );
  }

  const selectSlide = (index: number) => {
    setActiveIndex(index);
    markInteracted();
  };

  return (
    <div
      className="overflow-hidden border border-[#DEDFE1] bg-white"
      role="region"
      aria-roledescription="carousel"
      aria-label="Content carousel"
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          selectSlide(Math.max(0, safeIndex - 1));
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          selectSlide(Math.min(items.length - 1, safeIndex + 1));
        }
      }}
    >
      {item.src ? (
        <div className="relative aspect-[16/8] w-full bg-slate-100">
          <Image
            src={item.src}
            alt={item.alt || ""}
            fill
            sizes="(max-width: 800px) 100vw, 728px"
            className="object-cover"
          />
        </div>
      ) : null}
      {item.caption ? (
        <p className="border-t border-[#DEDFE1] px-5 py-2 text-xs text-[#717376]">
          {item.caption}
        </p>
      ) : null}
      <div className="min-h-64 border-t-4 border-[var(--academy-accent)] p-7 sm:p-9">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--academy-accent)]">
          {item.eyebrow || `Card ${safeIndex + 1}`}
        </p>
        <h3 className="mt-4 text-2xl font-bold tracking-[-0.02em] text-[#252629] sm:text-[28px]">
          {item.title}
        </h3>
        <p className="mt-4 max-w-2xl font-[family-name:var(--font-academy-serif)] text-[16px] leading-8 text-[#4A4B4E]">
          {item.body}
        </p>
      </div>
      <div className="flex items-center justify-between border-t border-[#DEDFE1] bg-[#FAFAFA] px-5 py-4">
        <div
          className="flex gap-0.5"
          role="tablist"
          aria-label="Choose a carousel slide"
        >
          {items.map((carouselItem, index) => (
            <button
              key={carouselItem.id || `${carouselItem.title}-${index}`}
              type="button"
              id={`${carouselId}-tab-${index}`}
              role="tab"
              onClick={() => selectSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              aria-selected={index === safeIndex}
              tabIndex={index === safeIndex ? 0 : -1}
              className="inline-flex h-11 min-w-11 items-center justify-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--academy-accent)]"
            >
              <span
                className={`h-2 rounded-full transition-all motion-reduce:transition-none ${index === safeIndex ? "w-7 bg-[var(--academy-accent)]" : "w-2 bg-[#C9CDD2]"}`}
              />
            </button>
          ))}
        </div>
        <p className="sr-only" aria-live="polite">
          Slide {safeIndex + 1} of {items.length}: {item.title}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              selectSlide(Math.max(0, safeIndex - 1));
            }}
            disabled={safeIndex === 0}
            className="inline-flex h-11 w-11 items-center justify-center border border-[#C9CDD2] bg-white text-[#4A4B4E] outline-none hover:border-[var(--academy-accent)] hover:text-[var(--academy-accent)] focus-visible:ring-2 focus-visible:ring-[var(--academy-accent)] disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Previous slide"
          >
            <ChevronLeft size={19} />
          </button>
          <button
            type="button"
            onClick={() => {
              selectSlide(Math.min(items.length - 1, safeIndex + 1));
            }}
            disabled={safeIndex === items.length - 1}
            className="inline-flex h-11 w-11 items-center justify-center bg-[var(--academy-accent)] text-white outline-none focus-visible:ring-2 focus-visible:ring-[var(--academy-accent)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Next slide"
          >
            <ChevronRight size={19} />
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type CarouselItem = { title: string; body: string; eyebrow?: string };

export default function AcademyCarousel({ items }: { items: CarouselItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const item = items[activeIndex];

  return (
    <div className="overflow-hidden border border-[#DEDFE1] bg-white">
      <div className="min-h-64 border-t-4 border-[#1E5AA8] p-7 sm:p-9">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1E5AA8]">
          {item.eyebrow || `Step ${activeIndex + 1}`}
        </p>
        <h3 className="mt-4 text-2xl font-bold tracking-[-0.02em] text-[#252629] sm:text-[28px]">{item.title}</h3>
        <p className="mt-4 max-w-2xl font-[family-name:var(--font-academy-serif)] text-[16px] leading-8 text-[#4A4B4E]">{item.body}</p>
      </div>
      <div className="flex items-center justify-between border-t border-[#DEDFE1] bg-[#FAFAFA] px-5 py-4">
        <div className="flex gap-2" aria-label={`Slide ${activeIndex + 1} of ${items.length}`}>
          {items.map((carouselItem, index) => (
            <button
              key={carouselItem.title}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === activeIndex ? "true" : undefined}
              className={`h-2 rounded-full transition-all motion-reduce:transition-none ${index === activeIndex ? "w-7 bg-[#1E5AA8]" : "w-2 bg-[#C9CDD2] hover:bg-[#717376]"}`}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveIndex((index) => Math.max(0, index - 1))}
            disabled={activeIndex === 0}
            className="inline-flex h-10 w-10 items-center justify-center border border-[#C9CDD2] bg-white text-[#4A4B4E] hover:border-[#1E5AA8] hover:text-[#1E5AA8] disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Previous slide"
          >
            <ChevronLeft size={19} />
          </button>
          <button
            type="button"
            onClick={() => setActiveIndex((index) => Math.min(items.length - 1, index + 1))}
            disabled={activeIndex === items.length - 1}
            className="inline-flex h-10 w-10 items-center justify-center bg-[#1E5AA8] text-white hover:bg-[#174A8B] disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Next slide"
          >
            <ChevronRight size={19} />
          </button>
        </div>
      </div>
    </div>
  );
}

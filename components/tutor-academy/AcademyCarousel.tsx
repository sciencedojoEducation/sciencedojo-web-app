"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type CarouselItem = { title: string; body: string; eyebrow?: string };

export default function AcademyCarousel({ items }: { items: CarouselItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const item = items[activeIndex];

  return (
    <div className="overflow-hidden rounded-[2rem] border border-blue-100 bg-gradient-to-br from-white to-blue-50 shadow-sm">
      <div className="min-h-64 p-7 sm:p-9">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-primary/60">
          {item.eyebrow || `Step ${activeIndex + 1}`}
        </p>
        <h3 className="mt-4 text-2xl font-black tracking-tight text-secondary sm:text-3xl">{item.title}</h3>
        <p className="mt-4 max-w-2xl text-base font-medium leading-8 text-secondary/65">{item.body}</p>
      </div>
      <div className="flex items-center justify-between border-t border-blue-100 bg-white/80 px-5 py-4">
        <div className="flex gap-2" aria-label={`Slide ${activeIndex + 1} of ${items.length}`}>
          {items.map((carouselItem, index) => (
            <button
              key={carouselItem.title}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === activeIndex ? "true" : undefined}
              className={`h-2.5 rounded-full transition-all ${index === activeIndex ? "w-8 bg-primary" : "w-2.5 bg-secondary/15 hover:bg-secondary/30"}`}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveIndex((index) => Math.max(0, index - 1))}
            disabled={activeIndex === 0}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-secondary/10 bg-white text-secondary transition-colors hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Previous slide"
          >
            <ChevronLeft size={19} />
          </button>
          <button
            type="button"
            onClick={() => setActiveIndex((index) => Math.min(items.length - 1, index + 1))}
            disabled={activeIndex === items.length - 1}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Next slide"
          >
            <ChevronRight size={19} />
          </button>
        </div>
      </div>
    </div>
  );
}

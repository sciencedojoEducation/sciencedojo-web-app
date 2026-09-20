import Image from "next/image";
import { Check, Lightbulb, ShieldCheck } from "lucide-react";
import type { LessonBlock } from "@/lib/tutor-academy";
import AcademyCarousel from "./AcademyCarousel";

const calloutClasses = {
  blue: "border-[#AFC8E7] bg-[#F1F6FC] text-[#173A63]",
  teal: "border-[#B9D8D3] bg-[#F2F8F7] text-[#244743]",
  amber: "border-[#E3CCA2] bg-[#FBF7EE] text-[#59451F]",
  navy: "border-[#1E5AA8] bg-[#EDF4FB] text-[#173A63]",
};

export default function AcademyLessonBlocks({ blocks }: { blocks: LessonBlock[] }) {
  return (
    <div className="space-y-14">
      {blocks.map((block, blockIndex) => {
        if (block.type === "text") {
          return (
            <section key={blockIndex} className="space-y-5">
              {block.heading && <h2 className="text-[28px] font-bold leading-9 tracking-[-0.02em] text-[#101010] sm:text-[32px] sm:leading-10">{block.heading}</h2>}
              {block.paragraphs.map((paragraph) => (
                <p key={paragraph} className="font-[family-name:var(--font-academy-serif)] text-[17px] leading-[30px] text-[#36373A] sm:leading-[33px]">{paragraph}</p>
              ))}
            </section>
          );
        }

        if (block.type === "image") {
          return (
            <figure key={blockIndex} className="relative left-1/2 w-[calc(100vw-48px)] max-w-[1000px] -translate-x-1/2 overflow-hidden border border-[#DEDFE1] bg-white lg:w-[calc(100vw-328px)]">
              <div className="relative aspect-[16/9] w-full bg-slate-100">
                <Image src={block.src} alt={block.alt} fill sizes="(max-width: 1024px) 100vw, 900px" className="object-cover" />
              </div>
              {block.caption && <figcaption className="px-5 py-3 font-[family-name:var(--font-academy-serif)] text-[13px] leading-6 text-[#717376]">{block.caption}</figcaption>}
            </figure>
          );
        }

        if (block.type === "callout") {
          return (
            <aside key={blockIndex} className={`border-l-4 p-6 sm:p-7 ${calloutClasses[block.tone]}`}>
              <div className="flex items-start gap-4">
                <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center text-[#1E5AA8]">
                  {block.tone === "amber" ? <ShieldCheck size={21} /> : <Lightbulb size={21} />}
                </span>
                <div>
                  <h2 className="text-xl font-bold tracking-[-0.01em]">{block.heading}</h2>
                  <p className="mt-2 font-[family-name:var(--font-academy-serif)] text-[15px] leading-7 opacity-80">{block.body}</p>
                </div>
              </div>
            </aside>
          );
        }

        if (block.type === "numbered-list") {
          return (
            <section key={blockIndex}>
              {block.heading && <h2 className="mb-6 text-[28px] font-bold leading-9 tracking-[-0.02em] text-[#101010] sm:text-[32px] sm:leading-10">{block.heading}</h2>}
              <ol className="border-t border-[#DEDFE1]">
                {block.items.map((item, index) => (
                  <li key={item.title} className="grid grid-cols-[44px_1fr] gap-4 border-b border-[#DEDFE1] py-6">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#1E5AA8] text-sm font-bold text-[#1E5AA8]">{index + 1}</span>
                    <div><h3 className="text-lg font-bold text-[#252629]">{item.title}</h3>
                    <p className="mt-2 font-[family-name:var(--font-academy-serif)] text-[15px] leading-7 text-[#4A4B4E]">{item.body}</p></div>
                  </li>
                ))}
              </ol>
            </section>
          );
        }

        if (block.type === "accordion") {
          return (
            <section key={blockIndex}>
              {block.heading && <h2 className="mb-6 text-[28px] font-bold leading-9 tracking-[-0.02em] text-[#101010] sm:text-[32px] sm:leading-10">{block.heading}</h2>}
              <div className="border-y border-[#DEDFE1] bg-white">
                {block.items.map((item, index) => (
                  <details key={item.title} className="group" open={index === 0}>
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 border-b border-[#DEDFE1] px-1 py-5 font-bold text-[#252629] outline-none hover:text-[#1E5AA8] focus-visible:ring-2 focus-visible:ring-[#1E5AA8]">
                      <span>{item.title}</span>
                      <span className="text-xl text-primary transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                    </summary>
                    <p className="border-b border-[#DEDFE1] px-1 pb-6 font-[family-name:var(--font-academy-serif)] text-[15px] leading-7 text-[#4A4B4E]">{item.body}</p>
                  </details>
                ))}
              </div>
            </section>
          );
        }

        if (block.type === "carousel") {
          return (
            <section key={blockIndex}>
              {block.heading && <h2 className="mb-6 text-[28px] font-bold leading-9 tracking-[-0.02em] text-[#101010] sm:text-[32px] sm:leading-10">{block.heading}</h2>}
              <AcademyCarousel items={block.items} />
            </section>
          );
        }

        if (block.type === "quote") {
          return (
            <figure key={blockIndex} className="border-y border-[#DEDFE1] py-9 sm:px-8">
              <blockquote className="font-[family-name:var(--font-academy-serif)] text-2xl font-bold leading-[1.55] text-[#252629] sm:text-[28px]">“{block.quote}”</blockquote>
              <figcaption className="mt-5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#1E5AA8]">— {block.attribution}</figcaption>
            </figure>
          );
        }

        return (
          <section key={blockIndex}>
            {block.heading && <h2 className="mb-6 text-[28px] font-bold leading-9 tracking-[-0.02em] text-[#101010] sm:text-[32px] sm:leading-10">{block.heading}</h2>}
            <div className="overflow-x-auto border border-[#DEDFE1] bg-white">
              <table className="min-w-[42rem] w-full border-collapse text-left">
                <thead className="bg-[#F3F3F3] text-[#252629]">
                  <tr>{block.columns.map((column) => <th key={column} className="border-b border-[#DEDFE1] px-5 py-4 text-xs font-bold uppercase tracking-[0.1em]">{column}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-secondary/8">
                  {block.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="align-top">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className={`px-5 py-4 text-sm leading-6 ${cellIndex === 0 ? "font-bold text-[#252629]" : "font-[family-name:var(--font-academy-serif)] text-[#4A4B4E]"}`}>
                          {cellIndex > 0 && <Check size={15} className="mr-2 inline text-[#1E5AA8]" aria-hidden="true" />}{cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}

import Image from "next/image";
import { Check, Lightbulb, ShieldCheck } from "lucide-react";
import type { LessonBlock } from "@/lib/tutor-academy";
import AcademyCarousel from "./AcademyCarousel";

const calloutClasses = {
  blue: "border-blue-100 bg-blue-50 text-blue-950",
  teal: "border-teal-100 bg-teal-50 text-teal-950",
  amber: "border-amber-100 bg-amber-50 text-amber-950",
  navy: "border-slate-800 bg-secondary text-white",
};

export default function AcademyLessonBlocks({ blocks }: { blocks: LessonBlock[] }) {
  return (
    <div className="space-y-10">
      {blocks.map((block, blockIndex) => {
        if (block.type === "text") {
          return (
            <section key={blockIndex} className="space-y-4">
              {block.heading && <h2 className="text-2xl font-black tracking-tight text-secondary sm:text-3xl">{block.heading}</h2>}
              {block.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-base font-medium leading-8 text-secondary/68 sm:text-lg sm:leading-9">{paragraph}</p>
              ))}
            </section>
          );
        }

        if (block.type === "image") {
          return (
            <figure key={blockIndex} className="overflow-hidden rounded-[2rem] border border-secondary/5 bg-white shadow-lg shadow-secondary/5">
              <div className="relative aspect-[16/8] w-full bg-slate-100">
                <Image src={block.src} alt={block.alt} fill sizes="(max-width: 1024px) 100vw, 900px" className="object-cover" />
              </div>
              {block.caption && <figcaption className="px-6 py-4 text-sm font-bold text-secondary/50">{block.caption}</figcaption>}
            </figure>
          );
        }

        if (block.type === "callout") {
          return (
            <aside key={blockIndex} className={`rounded-[1.75rem] border p-6 sm:p-8 ${calloutClasses[block.tone]}`}>
              <div className="flex items-start gap-4">
                <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-primary shadow-sm">
                  {block.tone === "amber" ? <ShieldCheck size={21} /> : <Lightbulb size={21} />}
                </span>
                <div>
                  <h2 className="text-xl font-black tracking-tight">{block.heading}</h2>
                  <p className={`mt-2 font-medium leading-7 ${block.tone === "navy" ? "text-white/70" : "opacity-70"}`}>{block.body}</p>
                </div>
              </div>
            </aside>
          );
        }

        if (block.type === "numbered-list") {
          return (
            <section key={blockIndex}>
              {block.heading && <h2 className="mb-5 text-2xl font-black tracking-tight text-secondary sm:text-3xl">{block.heading}</h2>}
              <ol className="grid gap-4 sm:grid-cols-2">
                {block.items.map((item, index) => (
                  <li key={item.title} className="rounded-[1.5rem] border border-secondary/8 bg-white p-5 shadow-sm">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-black text-white">{index + 1}</span>
                    <h3 className="mt-4 text-lg font-black text-secondary">{item.title}</h3>
                    <p className="mt-2 text-sm font-medium leading-7 text-secondary/60">{item.body}</p>
                  </li>
                ))}
              </ol>
            </section>
          );
        }

        if (block.type === "accordion") {
          return (
            <section key={blockIndex}>
              {block.heading && <h2 className="mb-5 text-2xl font-black tracking-tight text-secondary sm:text-3xl">{block.heading}</h2>}
              <div className="divide-y divide-secondary/8 overflow-hidden rounded-[1.5rem] border border-secondary/10 bg-white">
                {block.items.map((item, index) => (
                  <details key={item.title} className="group" open={index === 0}>
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 font-black text-secondary outline-none transition-colors hover:bg-primary/5 focus-visible:bg-primary/5">
                      <span>{item.title}</span>
                      <span className="text-xl text-primary transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                    </summary>
                    <p className="px-5 pb-6 text-sm font-medium leading-7 text-secondary/62">{item.body}</p>
                  </details>
                ))}
              </div>
            </section>
          );
        }

        if (block.type === "carousel") {
          return (
            <section key={blockIndex}>
              {block.heading && <h2 className="mb-5 text-2xl font-black tracking-tight text-secondary sm:text-3xl">{block.heading}</h2>}
              <AcademyCarousel items={block.items} />
            </section>
          );
        }

        if (block.type === "quote") {
          return (
            <figure key={blockIndex} className="rounded-[2rem] bg-secondary p-7 text-white sm:p-10">
              <blockquote className="text-2xl font-black leading-tight tracking-tight sm:text-3xl">“{block.quote}”</blockquote>
              <figcaption className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-cyan-200/70">— {block.attribution}</figcaption>
            </figure>
          );
        }

        return (
          <section key={blockIndex}>
            {block.heading && <h2 className="mb-5 text-2xl font-black tracking-tight text-secondary sm:text-3xl">{block.heading}</h2>}
            <div className="overflow-x-auto rounded-[1.5rem] border border-secondary/10 bg-white shadow-sm">
              <table className="min-w-[42rem] w-full border-collapse text-left">
                <thead className="bg-secondary text-white">
                  <tr>{block.columns.map((column) => <th key={column} className="px-5 py-4 text-xs font-black uppercase tracking-[0.12em]">{column}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-secondary/8">
                  {block.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="align-top">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className={`px-5 py-4 text-sm leading-6 ${cellIndex === 0 ? "font-black text-secondary" : "font-medium text-secondary/62"}`}>
                          {cellIndex > 0 && <Check size={15} className="mr-2 inline text-teal-500" aria-hidden="true" />}{cell}
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

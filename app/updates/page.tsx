import Link from "next/link";
import { getPublicPlatformUpdates } from "@/lib/platform-announcements";

export default async function UpdatesPage() {
  const updates = await getPublicPlatformUpdates();

  return (
    <main className="min-h-screen bg-[#f7fbff] px-4 py-12 text-secondary sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl">
        <div className="mb-10">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-primary/70">Platform notes</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">sciencedojo updates</h1>
          <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-secondary/60">
            Small improvements, clearer learning, and a better experience for students, parents, and tutors.
          </p>
        </div>

        <div className="space-y-4">
          {updates.map((update) => (
            <article key={update.id} className="rounded-[1.5rem] border border-secondary/10 bg-white p-5 shadow-sm md:p-7">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
                  {update.category.replace(/_/g, " ")}
                </span>
                <time className="text-xs font-bold text-secondary/35">
                  {new Date(update.starts_at).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                </time>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-secondary">{update.title}</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-7 text-secondary/65">{update.message}</p>
              {update.cta_label && update.cta_url && (
                <Link href={update.cta_url} className="mt-5 inline-flex rounded-full bg-primary px-5 py-3 text-xs font-black uppercase tracking-widest text-white">
                  {update.cta_label}
                </Link>
              )}
            </article>
          ))}

          {updates.length === 0 && (
            <div className="rounded-[1.5rem] border border-dashed border-secondary/15 bg-white p-10 text-center">
              <h2 className="text-xl font-black text-secondary">No public updates yet.</h2>
              <p className="mt-2 text-sm font-semibold text-secondary/45">When ScienceDojo publishes platform updates, they will appear here.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

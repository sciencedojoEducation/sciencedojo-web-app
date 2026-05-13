import StudentTimer from "./StudentTimer";

export const metadata = {
  title: "Focus Zone | ScienceDojo",
  description: "A calm academic study environment for focused practice and exam timing.",
};

export default function TimersPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-5 px-3 py-5 sm:px-4 md:space-y-8 md:p-8">
      <div className="rounded-[1.5rem] border border-secondary/5 bg-white p-4 shadow-sm md:rounded-[2rem] md:p-6">
         <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-primary/60">Study environment</p>
         <h1 className="mb-2 text-3xl font-black tracking-tight text-navy">Focus Zone</h1>
         <p className="max-w-2xl text-sm font-medium leading-relaxed text-navy/55 md:text-base">
           Enter a calm study space for focused revision, structured breaks, or exam-style timing.
         </p>
      </div>

      <StudentTimer />
    </div>
  );
}

import StudentTimer from "./StudentTimer";

export const metadata = {
  title: "Focus Timers | ScienceDojo",
  description: "Stay focused with Pomodoro studying and Exam simulation modes.",
};

export default function TimersPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
         <h1 className="text-3xl font-black text-navy tracking-tight">Focus Zone</h1>
         <p className="text-navy/50 font-medium">Use the Pomodoro technique to study effectively, or simulate an Exam environment.</p>
      </div>

      <StudentTimer />
    </div>
  );
}

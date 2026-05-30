"use client";

type DashboardTourReplayButtonProps = {
  onReplay?: () => void;
  className?: string;
  iconClassName?: string;
};

export default function DashboardTourReplayButton({
  onReplay,
  className,
  iconClassName,
}: DashboardTourReplayButtonProps) {
  return (
    <button
      type="button"
      onClick={() => {
        onReplay?.();
        window.dispatchEvent(new Event("sciencedojo:replay-dashboard-tour"));
      }}
      className={className || "flex items-center justify-center w-full gap-2 px-4 py-3 border rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 bg-white border-slate-200 text-[#1E5AA8] hover:bg-[#1E5AA8] hover:text-white hover:border-[#1E5AA8] shadow-lg shadow-black/5"}
    >
      <span className={iconClassName || "text-base"}>?</span>
      <span>Replay tour</span>
    </button>
  );
}

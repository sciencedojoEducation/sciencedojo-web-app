import React from "react";

interface LogoProps {
  className?: string;
  dotClassName?: string;
  inverted?: boolean;
}

export default function Logo({ className = "text-2xl", dotClassName = "w-2 h-2", inverted = false }: LogoProps) {
  return (
    <div className={`flex items-baseline font-bold tracking-tight lowercase ${className}`}>
      <span className={`${inverted ? "text-white" : "text-secondary"} select-none`}>science</span>
      <span className={`${inverted ? "text-[#78d8ff]" : "text-primary"} select-none`}>dojo</span>
      <div className={`rounded-full bg-cyan ${dotClassName} mb-1 ms-0.5`} />
    </div>
  );
}

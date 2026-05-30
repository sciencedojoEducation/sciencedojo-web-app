type IllustrationType = "roadmap" | "match" | "structure" | "growth";

interface HomeHowItWorksIllustrationProps {
  type: IllustrationType;
}

const badges: Record<IllustrationType, string> = {
  roadmap: "Foundation",
  match: "Tutor Match",
  structure: "AI Practice",
  growth: "Mastery",
};

export default function HomeHowItWorksIllustration({ type }: HomeHowItWorksIllustrationProps) {
  return (
    <div className="relative mx-auto flex aspect-[4/3] w-full max-w-[260px] items-center justify-center overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-white via-[#f4fbff] to-[#eaf5ff] shadow-inner">
      <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-primary shadow-sm">
        {badges[type]}
      </div>

      {type === "roadmap" && (
        <svg className="relative h-[72%] w-[78%]" viewBox="0 0 220 170" fill="none" aria-hidden="true">
          <rect x="22" y="18" width="176" height="132" rx="22" fill="white" stroke="#D8E8FF" strokeWidth="3" />
          <path d="M54 116C72 72 100 102 116 68C126 47 144 46 166 42" stroke="#0066FF" strokeWidth="8" strokeLinecap="round" />
          <circle cx="54" cy="116" r="13" fill="#00B8E6" />
          <circle cx="116" cy="68" r="13" fill="#0066FF" />
          <circle cx="166" cy="42" r="13" fill="#00F5D4" />
          <rect x="48" y="132" width="124" height="8" rx="4" fill="#E8F2FF" />
          <rect x="48" y="28" width="58" height="10" rx="5" fill="#CFE3FF" />
        </svg>
      )}

      {type === "match" && (
        <svg className="relative h-[74%] w-[80%]" viewBox="0 0 220 170" fill="none" aria-hidden="true">
          <rect x="18" y="44" width="72" height="82" rx="20" fill="white" stroke="#D8E8FF" strokeWidth="3" />
          <rect x="130" y="44" width="72" height="82" rx="20" fill="white" stroke="#D8E8FF" strokeWidth="3" />
          <circle cx="54" cy="73" r="18" fill="#BFEFFF" />
          <circle cx="166" cy="73" r="18" fill="#CFE3FF" />
          <path d="M38 107C44 96 64 96 70 107" stroke="#0066FF" strokeWidth="7" strokeLinecap="round" />
          <path d="M150 107C156 96 176 96 182 107" stroke="#001A44" strokeWidth="7" strokeLinecap="round" />
          <path d="M94 84H126" stroke="#00B8E6" strokeWidth="7" strokeLinecap="round" />
          <path d="M114 72L126 84L114 96" stroke="#00B8E6" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}

      {type === "structure" && (
        <svg className="relative h-[74%] w-[80%]" viewBox="0 0 220 170" fill="none" aria-hidden="true">
          <rect x="22" y="24" width="176" height="122" rx="22" fill="white" stroke="#D8E8FF" strokeWidth="3" />
          <rect x="44" y="46" width="58" height="22" rx="8" fill="#0066FF" />
          <rect x="44" y="82" width="132" height="10" rx="5" fill="#DDEBFF" />
          <rect x="44" y="104" width="98" height="10" rx="5" fill="#DDEBFF" />
          <rect x="126" y="42" width="48" height="32" rx="12" fill="#E6FBFF" stroke="#00B8E6" strokeWidth="3" />
          <path d="M138 58H162M150 46V70" stroke="#00B8E6" strokeWidth="5" strokeLinecap="round" />
          <circle cx="166" cy="118" r="14" fill="#00F5D4" />
        </svg>
      )}

      {type === "growth" && (
        <svg className="relative h-[74%] w-[80%]" viewBox="0 0 220 170" fill="none" aria-hidden="true">
          <rect x="24" y="116" width="30" height="28" rx="8" fill="#BFEFFF" />
          <rect x="72" y="92" width="30" height="52" rx="8" fill="#7DDCFF" />
          <rect x="120" y="64" width="30" height="80" rx="8" fill="#0066FF" />
          <rect x="168" y="38" width="30" height="106" rx="8" fill="#00F5D4" />
          <path d="M38 80C72 82 98 54 128 50C148 47 164 34 182 24" stroke="#001A44" strokeWidth="7" strokeLinecap="round" />
          <path d="M169 22H184V37" stroke="#001A44" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="55" cy="45" r="16" fill="white" stroke="#D8E8FF" strokeWidth="3" />
          <path d="M48 45L53 50L63 38" stroke="#0066FF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

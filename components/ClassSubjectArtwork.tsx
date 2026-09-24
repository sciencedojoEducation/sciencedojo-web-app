import type { ClassSubjectArtwork as ArtworkKind } from "@/lib/class-theme";

export default function ClassSubjectArtwork({ kind }: { kind: ArtworkKind }) {
  const shared = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 440 220" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
      <circle cx="325" cy="112" r="125" fill="currentColor" opacity="0.08" />
      <circle cx="325" cy="112" r="91" {...shared} strokeWidth="1.5" opacity="0.2" />
      {kind === "mathematics" && (
        <g {...shared} strokeWidth="3">
          <path d="M166 164h224M212 190V32" opacity="0.55" />
          <path d="M180 173c40-5 60-27 75-70 15-43 31-57 51-44 18 12 24 52 45 63 13 7 27 6 43-7" strokeWidth="6" />
          <path d="M284 154l39-66 39 66z" opacity="0.72" />
          <circle cx="255" cy="103" r="6" fill="currentColor" stroke="none" />
        </g>
      )}
      {kind === "physics" && (
        <g {...shared} strokeWidth="3">
          <ellipse cx="300" cy="112" rx="112" ry="43" transform="rotate(-29 300 112)" />
          <ellipse cx="300" cy="112" rx="112" ry="43" transform="rotate(29 300 112)" />
          <ellipse cx="300" cy="112" rx="112" ry="43" transform="rotate(90 300 112)" />
          <circle cx="300" cy="112" r="16" fill="currentColor" stroke="none" />
          <circle cx="211" cy="61" r="7" fill="currentColor" stroke="none" />
          <circle cx="363" cy="72" r="7" fill="currentColor" stroke="none" />
        </g>
      )}
      {(kind === "chemistry" || kind === "science") && (
        <g {...shared} strokeWidth="4">
          <path d="M245 42l47 27v53l-47 27-47-27V69zM338 77l39 23v45l-39 23-39-23v-45z" />
          <path d="M292 95l46 5M245 149v34M198 95l-43 22" />
          <circle cx="245" cy="187" r="9" fill="currentColor" stroke="none" />
          <circle cx="151" cy="119" r="9" fill="currentColor" stroke="none" />
          <circle cx="381" cy="147" r="9" fill="currentColor" stroke="none" />
        </g>
      )}
      {kind === "biology" && (
        <g {...shared} strokeWidth="4">
          <path d="M299 181c-4-72 28-110 89-130-2 73-31 121-89 130z" />
          <path d="M299 181c-23-51-65-78-125-75 21 61 65 91 125 75z" />
          <path d="M210 131c42 14 66 29 89 50M299 181c18-42 45-75 76-102M299 181v29" />
          <circle cx="207" cy="52" r="13" /><circle cx="231" cy="66" r="5" fill="currentColor" stroke="none" />
        </g>
      )}
      {kind === "economics" && (
        <g {...shared} strokeWidth="4">
          <path d="M164 184h244" opacity="0.6" />
          <path d="M188 137h32v47h-32zM242 111h32v73h-32zM296 91h32v93h-32zM350 56h32v128h-32z" />
          <path d="M188 107l64-29 52 13 69-56M355 35h18v18" strokeWidth="5" />
        </g>
      )}
      {kind === "computer" && (
        <g {...shared} strokeWidth="4">
          <rect x="174" y="47" width="218" height="130" rx="14" />
          <path d="M218 94l-25 18 25 18M349 94l25 18-25 18M305 84l-37 59M244 177l-13 24h105l-13-24" />
          <circle cx="244" cy="68" r="4" fill="currentColor" stroke="none" />
          <circle cx="260" cy="68" r="4" fill="currentColor" stroke="none" />
        </g>
      )}
      {kind === "general" && (
        <g {...shared} strokeWidth="4">
          <path d="M300 63c-30-19-66-20-108-8v119c42-12 78-11 108 8 30-19 66-20 108-8V55c-42-12-78-11-108 8zM300 63v119" />
          <path d="M216 88c22-4 41-2 60 4M216 114c22-4 41-2 60 4M324 92c19-6 38-8 60-4M324 118c19-6 38-8 60-4" opacity="0.7" />
        </g>
      )}
    </svg>
  );
}

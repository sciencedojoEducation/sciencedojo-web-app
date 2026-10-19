import { VisualMotionToggle } from "./EngineeringVisualMotion";
import s from "./engineering.module.css";

/** Connected-interface artwork adapted from our Lovable design exploration. */
export default function EngineeringHeroArtwork() {
  return <figure className={s.heroArtwork} data-animate data-reveal>
    <div className={s.artPerspective} data-tilt><div className={s.artFrame}>
      <svg viewBox="0 0 560 520" className={s.connectedArtwork} role="img" aria-labelledby="engineering-connected-art-title">
          <title id="engineering-connected-art-title">
            Concept illustration: one continuous route connects a website, an enquiry, a course, saved progress and the next step. This is an illustrative journey, not a live product screen.
          </title>
          <defs>
            <linearGradient id="eng-glass" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" style={{ stopColor: "var(--cyan)", stopOpacity: 0.9 }} />
              <stop offset="0.55" style={{ stopColor: "var(--primary)", stopOpacity: 0.85 }} />
              <stop offset="1" style={{ stopColor: "var(--ink)", stopOpacity: 0.95 }} />
            </linearGradient>
            <linearGradient id="eng-glass-light" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style={{ stopColor: "white", stopOpacity: 0.95 }} />
              <stop offset="1" style={{ stopColor: "#edf5ff", stopOpacity: 0.6 }} />
            </linearGradient>
            <linearGradient id="eng-ribbon" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" style={{ stopColor: "var(--cyan)" }} />
              <stop offset="1" style={{ stopColor: "var(--primary)" }} />
            </linearGradient>
            <filter id="eng-soft" x="-20%" y="-20%" width="140%" height="160%">
              <feDropShadow dx="0" dy="18" stdDeviation="16" floodColor="#001A44" floodOpacity="0.18" />
            </filter>
          </defs>

          {/* architectural floor grid */}
          <g opacity="0.5" stroke="var(--line)">
            {Array.from({ length: 9 }).map((_, i) => (
              <line key={`h${i}`} x1="20" x2="540" y1={60 + i * 55} y2={60 + i * 55} />
            ))}
            {Array.from({ length: 10 }).map((_, i) => (
              <line key={`v${i}`} y1="40" y2="500" x1={30 + i * 56} x2={30 + i * 56} />
            ))}
          </g>

          {/* the one journey */}
          <path d="M109 121 C200 28 300 28 395 130 S365 225 280 260 S130 290 126 395 S330 475 470 400" fill="none" stroke="url(#eng-ribbon)" strokeWidth="14" strokeLinecap="round" opacity="0.18" />
          <path className={s.journeyRibbon} d="M109 121 C200 28 300 28 395 130 S365 225 280 260 S130 290 126 395 S330 475 470 400" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" />

          {/* glass blocks */}
          <g filter="url(#eng-soft)">
            <g className={s.visualFloat}>
              <rect x="34" y="78" width="150" height="86" rx="18" fill="url(#eng-glass-light)" stroke="var(--line)" />
              <rect x="50" y="96" width="60" height="8" rx="4" fill="var(--ink)" opacity="0.85" />
              <rect x="50" y="112" width="110" height="6" rx="3" fill="var(--muted)" opacity="0.3" />
              <rect x="50" y="132" width="54" height="18" rx="9" fill="var(--primary)" />
            </g>
            <g className={`${s.visualFloat} ${s.slowFloat}`}>
              <rect x="300" y="70" width="190" height="120" rx="22" fill="url(#eng-glass)" />
              <rect x="300" y="70" width="190" height="56" rx="22" fill="white" opacity="0.12" />
              <circle cx="330" cy="102" r="10" fill="white" opacity="0.9" />
              <rect x="350" y="96" width="100" height="6" rx="3" fill="white" opacity="0.7" />
              <rect x="320" y="146" width="150" height="6" rx="3" fill="white" opacity="0.35" />
              <rect x="320" y="160" width="96" height="6" rx="3" fill="white" opacity="0.35" />
            </g>
            <g className={s.visualFloat}>
              <rect x="200" y="214" width="160" height="96" rx="20" fill="url(#eng-glass-light)" stroke="var(--line)" />
              <rect x="218" y="234" width="124" height="10" rx="5" fill="#edf5ff" />
              <rect x="218" y="234" width="78" height="10" rx="5" fill="var(--cyan)" />
              <rect x="218" y="258" width="90" height="6" rx="3" fill="var(--ink)" opacity="0.6" />
              <rect x="218" y="272" width="60" height="6" rx="3" fill="var(--muted)" opacity="0.3" />
            </g>
            <g className={`${s.visualFloat} ${s.slowFloat}`}>
              <rect x="56" y="330" width="140" height="130" rx="24" fill="url(#eng-glass)" opacity="0.92" />
              <path d="M84 420 l22 -26 l18 14 l30 -40" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
            </g>
            <g>
              <rect x="410" y="350" width="120" height="100" rx="50" fill="url(#eng-glass-light)" stroke="var(--primary)" strokeWidth="1.5" />
              <circle cx="470" cy="400" r="18" fill="var(--primary)" />
              <path d="M462 400 l6 6 l11 -12" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </g>

          {/* node joints */}
          {[[109, 121], [395, 130], [280, 260], [126, 395]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="5" fill="var(--cyan)" stroke="white" strokeWidth="2" className={i === 2 ? s.nodePulse : undefined} />
          ))}

          <g fontFamily="inherit" fontSize="14" letterSpacing="1" fill="var(--muted)">
            <text x="34" y="64">WEBSITE</text>
            <text x="300" y="56">ENQUIRY</text>
            <text x="200" y="330">COURSE</text>
            <text x="56" y="482">PROGRESS</text>
            <text x="410" y="474" fill="var(--primary)">ONE JOURNEY</text>
          </g>
        </svg>
    </div></div>
    <figcaption className={s.artFooter}><span>From a first visit to a useful next step.<small>Concept illustration</small></span><VisualMotionToggle /></figcaption>
  </figure>;
}

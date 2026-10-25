import { useId } from "react";

export type JarMood = "happy" | "shaking" | "wow" | "sleepy";

type Props = {
  slips?: { id: string; color: string }[];
  mood?: JarMood;
  className?: string;
  title?: string;
};

// Deterministic jitter so slips don't jump around between renders.
function rand(i: number, salt: number) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const MAX_SLIPS = 60;
// Colours come from theme tokens: pastel in light mode, neon gothic in dark mode.
const ink = { stroke: "var(--jar-ink)" } as const;
const face = "var(--jar-face)";

const WING = "M34 96 C 18 76, -4 72, -24 84 C -13 90, -13 99, -17 108 C -6 103, 2 107, 4 118 C 12 109, 22 111, 34 124 Z";

/** Jarbo: the dare jar. Cute in light mode, a little cursed in dark mode. Slips inside are the real slips. */
export function Jar({ slips = [], mood = "happy", className, title = "The dare jar" }: Props) {
  const clip = useId();
  const shown = slips.slice(0, MAX_SLIPS);
  const shaking = mood === "shaking";

  return (
    <svg
      viewBox="-30 -14 280 290"
      className={`jar ${shaking ? "jar-shaking" : "jar-bob"} ${className ?? ""}`}
      role="img"
      aria-label={`${title}${slips.length ? `, ${slips.length} slips inside` : ", empty"}`}
    >
      <defs>
        <clipPath id={clip}>
          <path d="M44 74 Q36 74 36 92 V238 Q36 262 62 262 H158 Q184 262 184 238 V92 Q184 74 176 74 Z" />
        </clipPath>
      </defs>

      {/* bat wings */}
      <path className="jar-wing" d={WING} style={{ fill: "var(--jar-wing)", ...ink }} strokeWidth="5" strokeLinejoin="round" />
      <g transform="translate(220 0) scale(-1 1)">
        <path className="jar-wing" d={WING} style={{ fill: "var(--jar-wing)", ...ink }} strokeWidth="5" strokeLinejoin="round" />
      </g>

      {/* glass body */}
      <path
        d="M40 68 Q30 68 30 90 V240 Q30 268 60 268 H160 Q190 268 190 240 V90 Q190 68 180 68 Z"
        style={{ fill: "var(--jar-glass)", ...ink }}
        strokeWidth="6"
        strokeLinejoin="round"
      />

      {/* slips */}
      <g clipPath={`url(#${clip})`}>
        {shown.map((s, i) => {
          const row = Math.floor(i / 6);
          const col = i % 6;
          const x = 40 + col * 24 + (rand(i, 1) - 0.5) * 12;
          const y = 244 - row * 13 + (rand(i, 2) - 0.5) * 8;
          const r = (rand(i, 3) - 0.5) * 70;
          return (
            <g key={s.id + i} transform={`translate(${x} ${y}) rotate(${r})`}>
              <g className="jar-slip" style={{ animationDelay: `${(i % 5) * 40}ms` }}>
                <rect x="-2" y="-8" width="28" height="16" rx="3" fill={s.color} stroke="rgba(40,20,50,0.5)" strokeWidth="1.6" />
                <path d="M12 -8 V8" stroke="rgba(40,20,50,0.3)" strokeWidth="1.4" />
              </g>
            </g>
          );
        })}
      </g>

      {/* shine */}
      <path d="M50 96 Q46 150 52 226" style={{ stroke: "var(--jar-shine)" }} strokeOpacity="0.7" strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M62 92 L62 112" style={{ stroke: "var(--jar-shine)" }} strokeOpacity="0.55" strokeWidth="6" strokeLinecap="round" />

      {/* neck + lid */}
      <rect x="52" y="44" width="116" height="26" rx="10" style={{ fill: "var(--jar-glass)", ...ink }} strokeWidth="6" />
      <rect x="62" y="10" width="96" height="38" rx="13" style={{ fill: "var(--jar-lid)", ...ink }} strokeWidth="6" />
      <path d="M80 18 V40 M100 18 V40 M120 18 V40 M140 18 V40" style={{ stroke: "var(--jar-lid-line)" }} strokeWidth="4" strokeLinecap="round" />

      {/* light: a bow */}
      <g className="cute">
        <path d="M110 12 Q92 -6 90 10 Q92 22 110 14 Q128 22 130 10 Q128 -6 110 12 Z" fill="#f07a9a" style={ink} strokeWidth="4" strokeLinejoin="round" />
        <circle cx="110" cy="12" r="5" fill="#d24f74" style={ink} strokeWidth="3" />
      </g>
      {/* dark: a little skull */}
      <g className="goth">
        <path d="M97 10 a13 13 0 1 1 26 0 v7 h-4 v5 h-18 v-5 h-4 z" fill="#f3e9f7" style={ink} strokeWidth="3.5" strokeLinejoin="round" />
        <circle cx="105" cy="9" r="3.6" fill="#0b0710" />
        <circle cx="115" cy="9" r="3.6" fill="#0b0710" />
        <path d="M106 18 V22 M110 18 V22 M114 18 V22" stroke="#0b0710" strokeWidth="1.8" />
      </g>

      {/* label with face */}
      <rect x="58" y="150" width="104" height="74" rx="20" style={{ fill: "var(--jar-label)", ...ink }} strokeWidth="5" />
      <g className="cute">
        <ellipse cx="78" cy="198" rx="9" ry="5.5" fill="var(--jar-cheek)" opacity="0.55" />
        <ellipse cx="142" cy="198" rx="9" ry="5.5" fill="var(--jar-cheek)" opacity="0.55" />
        <CuteFace mood={mood} />
      </g>
      <g className="goth">
        <GothFace mood={mood} />
      </g>
    </svg>
  );
}

function CuteFace({ mood }: { mood: JarMood }) {
  if (mood === "shaking") {
    return (
      <g stroke={face} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M86 174 L96 182 L86 190" />
        <path d="M134 174 L124 182 L134 190" />
        <path d="M100 204 Q105 198 110 204 Q115 210 120 204" />
      </g>
    );
  }
  if (mood === "sleepy") {
    return (
      <g stroke={face} strokeWidth="5" strokeLinecap="round" fill="none">
        <path d="M84 184 Q92 190 100 184" />
        <path d="M120 184 Q128 190 136 184" />
        <path d="M104 204 H116" />
      </g>
    );
  }
  return (
    <g>
      <g className="jar-eye">
        <ellipse cx="92" cy="182" rx="8" ry="10" fill={face} />
        <circle cx="95" cy="178" r="3" fill="#fff" />
      </g>
      <g className="jar-eye">
        <ellipse cx="128" cy="182" rx="8" ry="10" fill={face} />
        <circle cx="131" cy="178" r="3" fill="#fff" />
      </g>
      {mood === "wow" ? (
        <ellipse cx="110" cy="206" rx="7" ry="8" fill={face} />
      ) : (
        <path d="M102 202 Q110 211 118 202" stroke={face} strokeWidth="5" strokeLinecap="round" fill="none" />
      )}
    </g>
  );
}

/** One glowing eye, one stitched-shut X, a stitched grin. */
function GothFace({ mood }: { mood: JarMood }) {
  const stitch = "M96 206 H124 M100 201 V211 M106 201 V211 M112 201 V211 M118 201 V211";
  return (
    <g>
      {mood === "sleepy" ? (
        <path d="M84 184 Q92 190 100 184" stroke={face} strokeWidth="5" strokeLinecap="round" fill="none" />
      ) : (
        <g className="glow-eye">
          <circle cx="92" cy="182" r={mood === "wow" ? 11 : 9} fill={face} />
          <circle cx="92" cy="182" r="3.5" fill="#0b0710" />
        </g>
      )}
      <path d="M121 174 L135 190 M135 174 L121 190" stroke="var(--jar-cheek)" strokeWidth="5" strokeLinecap="round" />
      {mood === "wow" ? (
        <ellipse cx="110" cy="207" rx="7" ry="8" fill="none" stroke={face} strokeWidth="4" />
      ) : (
        <path d={mood === "shaking" ? "M96 208 Q103 200 110 208 Q117 216 124 208" : stitch} stroke={face} strokeWidth="3.5" strokeLinecap="round" fill="none" />
      )}
    </g>
  );
}

export function LogoMark() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <path d="M8 16 C3 12 0 13 -1 17 C2 17 2 20 1 22 C4 20 6 22 7 24 Z" fill="var(--jar-wing)" stroke="var(--jar-ink)" strokeWidth="2" transform="translate(1 0)" />
      <path d="M32 16 C37 12 40 13 41 17 C38 17 38 20 39 22 C36 20 34 22 33 24 Z" fill="var(--jar-wing)" stroke="var(--jar-ink)" strokeWidth="2" transform="translate(-1 0)" />
      <rect x="12" y="3" width="16" height="8" rx="3" fill="var(--jar-lid)" stroke="var(--jar-ink)" strokeWidth="2.5" />
      <path d="M10 12 H30 Q34 12 34 17 V31 Q34 37 28 37 H12 Q6 37 6 31 V17 Q6 12 10 12 Z" fill="var(--jar-label)" stroke="var(--jar-ink)" strokeWidth="2.5" />
      <rect x="10" y="27" width="9" height="5" rx="1.5" fill="#f07a9a" transform="rotate(-14 14 29)" />
      <rect x="21" y="28" width="9" height="5" rx="1.5" fill="#b65bc2" transform="rotate(10 25 30)" />
      <circle cx="15.5" cy="20" r="2.2" fill="var(--jar-face)" />
      <path d="M23 18 L27 22 M27 18 L23 22" stroke="var(--jar-cheek)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

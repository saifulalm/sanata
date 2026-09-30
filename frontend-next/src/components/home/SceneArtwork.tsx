/**
 * SANATA Brand-Aligned Scene Artwork
 *
 * Colors follow the SANATA Brand Guidelines:
 * - Primary: Desert Charcoal #20282C
 * - Accent: Desert #C9AD82
 *
 * Previously used cyan/blue accents which violated brand guidelines.
 */

export type SceneVariant = "tower" | "transit" | "subsea";

// Brand-aligned color palette using Desert (#C9AD82) as primary accent
const PALETTES: Record<SceneVariant, { sky: [string, string]; accent: string; glow: string; ground: string }> = {
  // Desert Charcoal theme - professional construction aesthetic
  tower: { sky: ["#1A1F22", "#12181B"], accent: "#C9AD82", glow: "#D4B98C", ground: "#0C1012" },
  transit: { sky: ["#1A1F22", "#12181B"], accent: "#B89A6F", glow: "#C9AD82", ground: "#0C1012" },
  subsea: { sky: ["#1A1F22", "#12181B"], accent: "#9A7D54", glow: "#B89A6F", ground: "#0C1012" },
};

/** Tinggi menara per varian — angka tetap supaya render server & klien identik. */
const SKYLINES: Record<SceneVariant, number[]> = {
  tower: [86, 148, 210, 132, 176, 104],
  transit: [120, 96, 168, 142, 108, 190],
  subsea: [140, 188, 112, 160, 128, 96],
};

export function SceneArtwork({ variant, className }: { variant: SceneVariant; className?: string }) {
  const palette = PALETTES[variant];
  const skyline = SKYLINES[variant];
  const uid = `scene-${variant}`;

  return (
    <svg
      viewBox="0 0 800 450"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="presentation"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.sky[0]} />
          <stop offset="100%" stopColor={palette.sky[1]} />
        </linearGradient>
        <linearGradient id={`${uid}-tower`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.accent} stopOpacity="0.38" />
          <stop offset="100%" stopColor={palette.accent} stopOpacity="0.06" />
        </linearGradient>
        <radialGradient id={`${uid}-glow`} cx="50%" cy="42%" r="55%">
          <stop offset="0%" stopColor={palette.glow} stopOpacity="0.4" />
          <stop offset="100%" stopColor={palette.glow} stopOpacity="0" />
        </radialGradient>
        <pattern id={`${uid}-grid`} width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0H0V40" fill="none" stroke={palette.accent} strokeOpacity="0.16" strokeWidth="1" />
        </pattern>
      </defs>

      <rect width="800" height="450" fill={`url(#${uid}-sky)`} />
      <rect width="800" height="450" fill={`url(#${uid}-grid)`} />
      <rect width="800" height="450" fill={`url(#${uid}-glow)`} />

      {/* Cakrawala */}
      <line x1="0" y1="330" x2="800" y2="330" stroke={palette.accent} strokeOpacity="0.35" strokeWidth="1" />

      {/* Deretan menara */}
      <g>
        {skyline.map((height, index) => {
          const width = 74 - (index % 3) * 12;
          const x = 62 + index * 118;
          const y = 330 - height;
          return (
            <g key={`${uid}-t${index}`}>
              <rect
                x={x}
                y={y}
                width={width}
                height={height}
                rx="10"
                fill={`url(#${uid}-tower)`}
                stroke={palette.accent}
                strokeOpacity="0.28"
              />
              {/* Garis lantai */}
              {Array.from({ length: Math.floor(height / 26) }).map((_, floor) => (
                <line
                  key={`${uid}-t${index}-f${floor}`}
                  x1={x + 8}
                  x2={x + width - 8}
                  y1={y + 20 + floor * 26}
                  y2={y + 20 + floor * 26}
                  stroke={palette.accent}
                  strokeOpacity="0.2"
                  strokeWidth="1"
                />
              ))}
            </g>
          );
        })}
      </g>

      {/* Crane / lengan rakit */}
      <g stroke={palette.accent} strokeOpacity="0.55" strokeWidth="2" fill="none">
        <path d="M600 330V96" />
        <path d="M540 118h180" />
        <path d="M600 96l-58 22M600 96l60 22" />
        <path d="M676 118v46" />
        <rect x="666" y="164" width="20" height="14" rx="3" fill={palette.accent} fillOpacity="0.25" />
      </g>

      {/* Drone */}
      <g fill="none" stroke={palette.accent} strokeOpacity="0.75" strokeWidth="2">
        <circle cx="180" cy="126" r="11" />
        <path d="M169 126h-14M191 126h14" />
        <circle cx="368" cy="182" r="8" />
        <path d="M360 182h-10M376 182h10" />
      </g>

      {/* Lantai / permukaan */}
      <path d="M0 330h800v120H0z" fill={palette.ground} />
      <g stroke={palette.accent} strokeOpacity="0.18" strokeWidth="1">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <path key={`${uid}-p${i}`} d={`M${400 + (i - 3) * 60} 330 L${400 + (i - 3) * 220} 450`} />
        ))}
        <path d="M0 372h800M0 410h800" />
      </g>
    </svg>
  );
}

/** Varian dipetakan dari urutan slide supaya tiap scene tampil berbeda. */
export const SCENE_VARIANTS: SceneVariant[] = ["tower", "transit", "subsea"];

export function sceneVariantAt(index: number): SceneVariant {
  return SCENE_VARIANTS[index % SCENE_VARIANTS.length];
}

export function isSceneVariant(value: unknown): value is SceneVariant {
  return typeof value === "string" && (SCENE_VARIANTS as string[]).includes(value);
}

/**
 * SANATA Brand-aligned accent classes
 * Using Desert (#C9AD82) instead of cyan/blue colors
 */
export const SCENE_ACCENT_CLASSES = {
  desert: "from-desert-400/45 via-desert-500/20 to-transparent",
  sand: "from-desert-300/35 via-desert-400/20 to-transparent",
  amber: "from-desert-200/25 via-desert-300/15 to-transparent",
  bronze: "from-desert-500/35 via-desert-600/20 to-transparent",
} as const;

export type SceneAccent = keyof typeof SCENE_ACCENT_CLASSES;

export function sceneAccentClass(value: unknown, fallback: string): string {
  return typeof value === "string" && value in SCENE_ACCENT_CLASSES
    ? SCENE_ACCENT_CLASSES[value as SceneAccent]
    : fallback;
}

import type { CSSProperties } from "react";

// Anatomical schematic: two stylized figures (front + back).
// Each muscle region is a named <path>/<ellipse> that can be highlighted by
// intensity (0..1) for heatmap display, or selected for pick mode.

export type MuscleRegionKey =
  | "Chest"
  | "Back"
  | "Legs"
  | "Shoulders"
  | "Arms"
  | "Core"
  | "Full Body"
  | "Cardio"
  | "Mobility";

type BodyDiagramProps = {
  highlights?: Partial<Record<MuscleRegionKey, number>>;
  selected?: MuscleRegionKey | null;
  onSelect?: (group: MuscleRegionKey) => void;
  size?: "sm" | "md" | "lg";
  showLegend?: boolean;
};

// Regions we draw as interactive paths. "Full Body", "Cardio" and "Mobility"
// aren't anatomical — they glow the whole silhouette.
const anatomicalRegions: MuscleRegionKey[] = [
  "Shoulders",
  "Chest",
  "Arms",
  "Core",
  "Back",
  "Legs",
];

function intensity(
  highlights: Partial<Record<MuscleRegionKey, number>> | undefined,
  key: MuscleRegionKey,
) {
  const globalBoost = Math.max(
    highlights?.["Full Body"] ?? 0,
    highlights?.["Cardio"] ?? 0,
    highlights?.["Mobility"] ?? 0,
  );
  return Math.max(highlights?.[key] ?? 0, globalBoost * 0.55);
}

function fillFor(value: number) {
  if (value <= 0) return "rgba(18, 17, 16, 0.06)";
  // Ramp from soft paper-2 to accent
  const alpha = 0.15 + value * 0.75;
  return `rgba(255, 61, 0, ${Math.min(alpha, 0.92)})`;
}

export function BodyDiagram({
  highlights,
  selected,
  onSelect,
  size = "md",
  showLegend = true,
}: BodyDiagramProps) {
  const interactive = Boolean(onSelect);
  const width = size === "sm" ? 260 : size === "lg" ? 460 : 360;

  function regionProps(key: MuscleRegionKey) {
    const value = intensity(highlights, key);
    const isSelected = selected === key;
    const style: CSSProperties = {
      fill: isSelected ? "var(--accent)" : fillFor(value),
      stroke: isSelected ? "var(--accent-deep)" : "var(--ink)",
      strokeWidth: isSelected ? 1.4 : 0.8,
      cursor: interactive ? "pointer" : "default",
      transition: "fill 200ms ease, stroke 200ms ease",
    };
    return {
      style,
      onClick: interactive ? () => onSelect?.(key) : undefined,
      "data-group": key,
      "aria-label": key,
    };
  }

  return (
    <div className={`body-diagram body-diagram-${size}`} style={{ width }}>
      <svg
        viewBox="0 0 400 420"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Muscle group map"
      >
        {/* ================= FRONT ================= */}
        <g transform="translate(0,0)">
          {/* silhouette */}
          <path
            d="M 100 10
               C 82 10 72 28 72 46
               C 72 62 82 74 90 78
               L 86 92
               C 56 100 42 118 38 148
               L 32 210
               C 30 222 36 230 44 230
               L 48 168
               L 58 168
               L 58 232
               C 58 246 64 254 72 258
               L 72 320
               C 72 380 74 400 82 408
               L 94 408
               L 96 270
               L 104 270
               L 106 408
               L 118 408
               C 126 400 128 380 128 320
               L 128 258
               C 136 254 142 246 142 232
               L 142 168
               L 152 168
               L 156 230
               C 164 230 170 222 168 210
               L 162 148
               C 158 118 144 100 114 92
               L 110 78
               C 118 74 128 62 128 46
               C 128 28 118 10 100 10 Z"
            fill="var(--paper-2)"
            stroke="var(--ink)"
            strokeWidth="1"
          />

          {/* Shoulders (two pads) */}
          <ellipse cx="58" cy="104" rx="18" ry="14" {...regionProps("Shoulders")} />
          <ellipse cx="142" cy="104" rx="18" ry="14" {...regionProps("Shoulders")} />

          {/* Chest */}
          <path
            d="M 72 108
               C 82 120 118 120 128 108
               L 130 150
               C 118 160 82 160 70 150 Z"
            {...regionProps("Chest")}
          />

          {/* Biceps */}
          <ellipse cx="42" cy="142" rx="11" ry="22" {...regionProps("Arms")} />
          <ellipse cx="158" cy="142" rx="11" ry="22" {...regionProps("Arms")} />

          {/* Core / Abs */}
          <path
            d="M 78 158
               L 122 158
               L 122 232
               C 122 242 116 248 108 248
               L 92 248
               C 84 248 78 242 78 232 Z"
            {...regionProps("Core")}
          />

          {/* Quads (Legs, front) */}
          <path
            d="M 76 260
               L 96 262
               L 94 346
               C 94 354 90 360 84 360
               C 78 360 74 354 74 346 Z"
            {...regionProps("Legs")}
          />
          <path
            d="M 124 260
               L 104 262
               L 106 346
               C 106 354 110 360 116 360
               C 122 360 126 354 126 346 Z"
            {...regionProps("Legs")}
          />
        </g>

        {/* ================= BACK ================= */}
        <g transform="translate(200,0)">
          <path
            d="M 100 10
               C 82 10 72 28 72 46
               C 72 62 82 74 90 78
               L 86 92
               C 56 100 42 118 38 148
               L 32 210
               C 30 222 36 230 44 230
               L 48 168
               L 58 168
               L 58 232
               C 58 246 64 254 72 258
               L 72 320
               C 72 380 74 400 82 408
               L 94 408
               L 96 270
               L 104 270
               L 106 408
               L 118 408
               C 126 400 128 380 128 320
               L 128 258
               C 136 254 142 246 142 232
               L 142 168
               L 152 168
               L 156 230
               C 164 230 170 222 168 210
               L 162 148
               C 158 118 144 100 114 92
               L 110 78
               C 118 74 128 62 128 46
               C 128 28 118 10 100 10 Z"
            fill="var(--paper-2)"
            stroke="var(--ink)"
            strokeWidth="1"
          />

          {/* Shoulders / rear delts */}
          <ellipse cx="58" cy="104" rx="18" ry="14" {...regionProps("Shoulders")} />
          <ellipse cx="142" cy="104" rx="18" ry="14" {...regionProps("Shoulders")} />

          {/* Traps + upper back + lats (one Back region, two paths) */}
          <path
            d="M 80 100
               C 88 96 112 96 120 100
               L 122 132
               C 110 138 90 138 78 132 Z"
            {...regionProps("Back")}
          />
          <path
            d="M 72 140
               L 128 140
               L 128 222
               C 122 232 112 236 100 236
               C 88 236 78 232 72 222 Z"
            {...regionProps("Back")}
          />

          {/* Triceps */}
          <ellipse cx="42" cy="142" rx="11" ry="22" {...regionProps("Arms")} />
          <ellipse cx="158" cy="142" rx="11" ry="22" {...regionProps("Arms")} />

          {/* Glutes + hamstrings (Legs back) */}
          <path
            d="M 76 242
               L 98 242
               L 100 282
               L 78 282 Z"
            {...regionProps("Legs")}
          />
          <path
            d="M 124 242
               L 102 242
               L 100 282
               L 122 282 Z"
            {...regionProps("Legs")}
          />
          <path
            d="M 78 290
               L 98 290
               L 96 360
               C 96 368 92 372 86 372
               C 80 372 76 368 76 360 Z"
            {...regionProps("Legs")}
          />
          <path
            d="M 122 290
               L 102 290
               L 104 360
               C 104 368 108 372 114 372
               C 120 372 124 368 124 360 Z"
            {...regionProps("Legs")}
          />
        </g>

        {/* Labels */}
        <text
          x="100"
          y="418"
          textAnchor="middle"
          fontFamily="var(--mono)"
          fontSize="9"
          letterSpacing="2"
          fill="var(--ink-mute)"
        >
          FRONT
        </text>
        <text
          x="300"
          y="418"
          textAnchor="middle"
          fontFamily="var(--mono)"
          fontSize="9"
          letterSpacing="2"
          fill="var(--ink-mute)"
        >
          BACK
        </text>
      </svg>

      {showLegend ? (
        <div className="body-legend">
          {anatomicalRegions.map((region) => {
            const value = intensity(highlights, region);
            return (
              <button
                key={region}
                type="button"
                className={`body-legend-chip${selected === region ? " is-selected" : ""}`}
                onClick={interactive ? () => onSelect?.(region) : undefined}
                disabled={!interactive}
                style={{
                  ["--chip-fill" as string]: fillFor(value),
                }}
              >
                <span className="body-legend-swatch" />
                <span>{region}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

type RatingKind = "energy" | "mood" | "soreness";

type RatingPickerProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  kind?: RatingKind;
  hint?: string;
};

// Icons: dots filling up as rating increases
const palettes: Record<RatingKind, string[]> = {
  energy: ["low", "low", "mid", "high", "peak"],
  mood: ["low", "low", "mid", "high", "peak"],
  soreness: ["peak", "high", "mid", "low", "low"], // inverted meaning
};

const iconFor: Record<RatingKind, string[]> = {
  energy: ["▁", "▂", "▄", "▆", "█"],
  mood: ["◌", "◔", "◑", "◕", "●"],
  soreness: ["●", "◕", "◑", "◔", "◌"],
};

export function RatingPicker({
  label,
  value,
  onChange,
  kind = "energy",
  hint,
}: RatingPickerProps) {
  const icons = iconFor[kind];
  const palette = palettes[kind];

  return (
    <div className="rating-picker">
      <div className="rating-head">
        <span className="rating-label">{label}</span>
        <span className="rating-value">
          {value}
          <span>/5</span>
        </span>
      </div>
      <div className="rating-row" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n, idx) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            className={`rating-pip rating-${palette[idx]}${value === n ? " is-active" : ""}${
              value >= n ? " is-filled" : ""
            }`}
            onClick={() => onChange(n)}
          >
            <span aria-hidden className="rating-pip-icon">
              {icons[idx]}
            </span>
            <span className="rating-pip-num">{n}</span>
          </button>
        ))}
      </div>
      {hint ? <span className="rating-hint">{hint}</span> : null}
    </div>
  );
}

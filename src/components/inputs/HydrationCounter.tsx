type HydrationCounterProps = {
  label: string;
  value: number; // in liters
  onChange: (value: number) => void;
  glassLiters?: number;
  max?: number;
};

export function HydrationCounter({
  label,
  value,
  onChange,
  glassLiters = 0.25,
  max = 5,
}: HydrationCounterProps) {
  const glasses = Math.round(value / glassLiters);
  const totalGlasses = Math.ceil(max / glassLiters);
  const display = Math.max(0, Math.round(value * 10) / 10);

  function setGlasses(count: number) {
    const clamped = Math.max(0, Math.min(totalGlasses, count));
    onChange(+(clamped * glassLiters).toFixed(2));
  }

  return (
    <div className="hydration">
      <div className="hydration-head">
        <span className="stepper-label">{label}</span>
        <span className="hydration-value">
          {display}
          <span>L</span>
        </span>
      </div>

      <div className="hydration-grid" role="group" aria-label={label}>
        {Array.from({ length: totalGlasses }).map((_, idx) => {
          const filled = idx < glasses;
          return (
            <button
              key={idx}
              type="button"
              aria-label={`${idx + 1} glasses`}
              className={`glass${filled ? " is-filled" : ""}`}
              onClick={() => setGlasses(filled ? idx : idx + 1)}
            >
              <svg viewBox="0 0 24 28" aria-hidden>
                <path
                  d="M 4 3 L 20 3 L 18 25 C 18 26 17 27 16 27 L 8 27 C 7 27 6 26 6 25 Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                {filled ? (
                  <path
                    d="M 6 13 L 18 13 L 17 24 C 17 25 16 26 15 26 L 9 26 C 8 26 7 25 7 24 Z"
                    fill="currentColor"
                  />
                ) : null}
              </svg>
            </button>
          );
        })}
      </div>

      <div className="hydration-hint">
        <span>{glasses} glasses · {glassLiters * 1000}ml each</span>
        <button
          type="button"
          className="link-button"
          onClick={() => onChange(0)}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

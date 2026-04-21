type SleepDialProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
};

export function SleepDial({
  label,
  value,
  onChange,
  min = 0,
  max = 12,
}: SleepDialProps) {
  const rounded = Math.round(value * 2) / 2;
  const pct = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const circumference = 2 * Math.PI * 46;
  const dash = pct * circumference;

  function bump(delta: number) {
    onChange(Math.max(min, Math.min(max, +(value + delta).toFixed(1))));
  }

  return (
    <div className="sleep-dial">
      <div className="sleep-dial-head">
        <span className="stepper-label">{label}</span>
      </div>
      <div className="sleep-dial-ring">
        <svg viewBox="0 0 120 120" aria-hidden>
          <circle
            cx="60"
            cy="60"
            r="46"
            fill="none"
            stroke="var(--rule-soft)"
            strokeWidth="6"
          />
          <circle
            cx="60"
            cy="60"
            r="46"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            transform="rotate(-90 60 60)"
            style={{ transition: "stroke-dasharray 240ms ease" }}
          />
          <text
            x="60"
            y="60"
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="var(--display)"
            fontSize="30"
            fill="var(--ink)"
            fontStyle="italic"
          >
            {rounded}
          </text>
          <text
            x="60"
            y="80"
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="var(--mono)"
            fontSize="8"
            letterSpacing="2"
            fill="var(--ink-mute)"
          >
            HOURS
          </text>
        </svg>
      </div>
      <div className="sleep-dial-controls">
        <button
          type="button"
          className="stepper-btn small"
          onClick={() => bump(-0.5)}
        >
          −
        </button>
        <div className="sleep-quick">
          {[6, 7, 7.5, 8, 9].map((preset) => (
            <button
              key={preset}
              type="button"
              className={`chip chip-neutral${value === preset ? " is-active" : ""}`}
              onClick={() => onChange(preset)}
            >
              {preset}h
            </button>
          ))}
        </div>
        <button
          type="button"
          className="stepper-btn small"
          onClick={() => bump(0.5)}
        >
          +
        </button>
      </div>
    </div>
  );
}

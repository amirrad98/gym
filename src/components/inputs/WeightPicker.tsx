type WeightPickerProps = {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  presets?: number[];
  step?: number;
  max?: number;
};

const defaultPresets = [0, 10, 20, 40, 60, 80, 100, 120];

export function WeightPicker({
  label,
  value,
  onChange,
  presets = defaultPresets,
  step = 2.5,
  max = 300,
}: WeightPickerProps) {
  const current = value ?? 0;

  function bump(delta: number) {
    const next = Math.max(0, Math.min(max, +(current + delta).toFixed(2)));
    onChange(next);
  }

  return (
    <div className="weight-picker">
      <div className="stepper-head">
        <span className="stepper-label">{label}</span>
        <span className="stepper-unit">kg</span>
      </div>

      <div className="weight-display">
        <button
          type="button"
          className="weight-bw"
          onClick={() => onChange(null)}
          aria-pressed={value === null}
        >
          BW
        </button>
        <div className={`weight-number${value === null ? " is-bw" : ""}`}>
          {value === null ? "—" : current}
        </div>
        <div className="weight-nudge">
          <button type="button" className="stepper-btn small" onClick={() => bump(-step)}>
            −
          </button>
          <button type="button" className="stepper-btn small" onClick={() => bump(step)}>
            +
          </button>
        </div>
      </div>

      <div className="weight-ruler">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            className={`weight-tick${preset === value ? " is-active" : ""}`}
            onClick={() => onChange(preset)}
          >
            <span className="weight-tick-mark" />
            <span className="weight-tick-label">{preset}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

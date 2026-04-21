type StepperProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  presets?: number[];
};

export function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  unit,
  presets,
}: StepperProps) {
  function bump(delta: number) {
    const next = Math.max(min, Math.min(max, +(value + delta).toFixed(2)));
    onChange(next);
  }

  return (
    <div className="stepper">
      <div className="stepper-head">
        <span className="stepper-label">{label}</span>
        {unit ? <span className="stepper-unit">{unit}</span> : null}
      </div>
      <div className="stepper-control">
        <button
          type="button"
          className="stepper-btn"
          onClick={() => bump(-step)}
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <div className="stepper-value">{value}</div>
        <button
          type="button"
          className="stepper-btn"
          onClick={() => bump(step)}
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
      {presets && presets.length > 0 ? (
        <div className="stepper-presets">
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              className={`stepper-preset${preset === value ? " is-active" : ""}`}
              onClick={() => onChange(preset)}
            >
              {preset}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

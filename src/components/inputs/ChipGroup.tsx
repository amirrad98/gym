type ChipOption<T extends string> = {
  value: T;
  label: string;
  accent?: "light" | "steady" | "hard" | "neutral";
};

type ChipGroupProps<T extends string> = {
  label?: string;
  value: T;
  options: ChipOption<T>[] | readonly ChipOption<T>[];
  onChange: (value: T) => void;
};

export function ChipGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: ChipGroupProps<T>) {
  return (
    <div className="chip-group">
      {label ? <span className="chip-group-label">{label}</span> : null}
      <div className="chip-group-list">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`chip chip-${option.accent ?? "neutral"}${
              value === option.value ? " is-active" : ""
            }`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

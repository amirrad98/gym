import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { BodyDiagram, type MuscleRegionKey } from "../components/BodyDiagram";
import { ChipGroup } from "../components/inputs/ChipGroup";
import { Stepper } from "../components/inputs/Stepper";
import { WeightPicker } from "../components/inputs/WeightPicker";
import { PageHeader } from "../components/PageHeader";
import type { TrackerBundle, WorkoutEffort } from "../lib/types";
import {
  effortOptions,
  formatShortDate,
  formatWeight,
  getDateKey,
  muscleGroupOptions,
  toOptionalString,
} from "../lib/utils";

type WorkoutFormState = {
  exercise: string;
  muscleGroup: MuscleRegionKey;
  sets: number;
  reps: number;
  weightKg: number | null;
  durationMinutes: number;
  effort: WorkoutEffort;
  notes: string;
};

function defaultForm(): WorkoutFormState {
  return {
    exercise: "",
    muscleGroup: "Chest",
    sets: 4,
    reps: 8,
    weightKg: null,
    durationMinutes: 0,
    effort: "steady",
    notes: "",
  };
}

const muscleOptions = muscleGroupOptions.map((group) => ({
  value: group as MuscleRegionKey,
  label: group,
}));

const effortChipOptions = effortOptions.map((option) => ({
  value: option.value,
  label: option.label,
  accent: option.value,
})) as Array<{ value: WorkoutEffort; label: string; accent: WorkoutEffort }>;

type WorkoutsViewProps = {
  tracker: TrackerBundle;
  selectedDateKey: string;
  setSelectedDateKey: Dispatch<SetStateAction<string>>;
};

export function WorkoutsView({
  tracker,
  selectedDateKey,
  setSelectedDateKey,
}: WorkoutsViewProps) {
  const [form, setForm] = useState<WorkoutFormState>(defaultForm);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const logsForDay = tracker.dashboard.selectedLogs;

  // Highlights for the body picker = "this is what you've chosen" (one region
  // at full intensity) plus a ghost of today's already-logged groups.
  const highlights: Partial<Record<MuscleRegionKey, number>> = {};
  for (const log of logsForDay) {
    const key = log.muscleGroup as MuscleRegionKey;
    highlights[key] = Math.min(1, (highlights[key] ?? 0) + 0.35);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus(null);
    try {
      const exercise = form.exercise.trim();
      if (!exercise) throw new Error("Exercise is required.");
      const notes = toOptionalString(form.notes);
      await tracker.actions.createWorkout({
        dateKey: selectedDateKey,
        exercise,
        muscleGroup: form.muscleGroup,
        sets: form.sets,
        reps: form.reps,
        effort: form.effort,
        ...(form.weightKg !== null ? { weightKg: form.weightKg } : {}),
        ...(form.durationMinutes > 0
          ? { durationMinutes: form.durationMinutes }
          : {}),
        ...(notes ? { notes } : {}),
      });
      setForm((current) => ({
        ...defaultForm(),
        muscleGroup: current.muscleGroup,
        effort: current.effort,
      }));
      setStatus("Logged");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save.");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete(id: string) {
    setStatus(null);
    try {
      await tracker.actions.removeWorkout(id);
      setStatus("Removed");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to remove.");
    }
  }

  return (
    <div className="view-stack">
      <PageHeader
        eyebrow="Workout log"
        title={formatShortDate(selectedDateKey)}
        description="Tap a muscle group on the map, then dial in the set."
        actions={
          <>
            <label className="field inline-field">
              <span className="field-label">Date</span>
              <input
                className="date-picker"
                type="date"
                value={selectedDateKey}
                onChange={(event) => setSelectedDateKey(event.target.value)}
              />
            </label>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setSelectedDateKey(getDateKey())}
            >
              Today
            </button>
          </>
        }
      />

      <section className="tool-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow eyebrow-dark">New entry</p>
            <h2>Target · {form.muscleGroup}</h2>
          </div>
          <span className="status-text">{status}</span>
        </div>

        <form className="stacked-form workout-builder" onSubmit={handleSubmit}>
          <div className="workout-builder-grid">
            {/* Body diagram picker */}
            <div className="body-picker-wrap">
              <BodyDiagram
                selected={form.muscleGroup}
                highlights={highlights}
                onSelect={(group) =>
                  setForm((current) => ({ ...current, muscleGroup: group }))
                }
                showLegend
              />
              <div className="body-picker-note">
                <span className="eyebrow eyebrow-dark">Tap to switch focus</span>
                <p>
                  Ghosted regions show what you&rsquo;ve already hit today.
                </p>
              </div>
            </div>

            {/* Main controls */}
            <div className="workout-controls">
              <label className="field">
                <span className="field-label">Exercise</span>
                <input
                  list="exercise-library"
                  required
                  placeholder="Incline dumbbell press"
                  value={form.exercise}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, exercise: event.target.value }))
                  }
                />
                <datalist id="exercise-library">
                  {tracker.exercises.map((ex) => (
                    <option key={ex._id} value={ex.name} />
                  ))}
                </datalist>
              </label>

              <ChipGroup
                label="Focus (quick pick)"
                value={form.muscleGroup}
                options={muscleOptions}
                onChange={(value) =>
                  setForm((current) => ({ ...current, muscleGroup: value }))
                }
              />

              <div className="field-grid two-up">
                <Stepper
                  label="Sets"
                  value={form.sets}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, sets: value }))
                  }
                  min={1}
                  max={20}
                  presets={[3, 4, 5]}
                />
                <Stepper
                  label="Reps"
                  value={form.reps}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, reps: value }))
                  }
                  min={1}
                  max={50}
                  presets={[5, 8, 10, 12]}
                />
              </div>

              <WeightPicker
                label="Weight"
                value={form.weightKg}
                onChange={(value) =>
                  setForm((current) => ({ ...current, weightKg: value }))
                }
              />

              <div className="field-grid two-up">
                <Stepper
                  label="Duration"
                  value={form.durationMinutes}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, durationMinutes: value }))
                  }
                  min={0}
                  max={240}
                  step={5}
                  unit="min"
                  presets={[10, 20, 30, 45]}
                />
                <ChipGroup
                  label="Effort"
                  value={form.effort}
                  options={effortChipOptions}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, effort: value }))
                  }
                />
              </div>

              <label className="field">
                <span className="field-label">Session notes</span>
                <textarea
                  rows={3}
                  placeholder="Paused reps, straps on final set, left shoulder felt stable."
                  value={form.notes}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, notes: event.target.value }))
                  }
                />
              </label>

              <button className="primary-button" type="submit" disabled={pending}>
                <span>{pending ? "Logging..." : "Add workout entry"}</span>
              </button>
            </div>
          </div>
        </form>
      </section>

      <section className="tool-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow eyebrow-dark">Today&rsquo;s log</p>
            <h2>
              {logsForDay.length} {logsForDay.length === 1 ? "entry" : "entries"}
            </h2>
          </div>
        </div>
        <div className="log-list no-top-margin">
          {logsForDay.length === 0 ? (
            <div className="empty-state">No exercise entries for this date yet.</div>
          ) : (
            logsForDay.map((log) => (
              <article className="log-row" key={log._id}>
                <div>
                  <div className="log-title-row">
                    <h3>{log.exercise}</h3>
                    <span className={`effort-pill effort-${log.effort}`}>
                      {log.effort}
                    </span>
                  </div>
                  <p className="log-meta">
                    <span className="log-focus">{log.muscleGroup}</span>
                    {log.sets}×{log.reps} · {formatWeight(log.weightKg)}
                    {log.durationMinutes ? ` · ${log.durationMinutes} min` : ""}
                  </p>
                  {log.notes ? <p className="log-notes">{log.notes}</p> : null}
                </div>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => void handleDelete(log._id)}
                >
                  Remove
                </button>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

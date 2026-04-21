import { useEffect, useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { HydrationCounter } from "../components/inputs/HydrationCounter";
import { RatingPicker } from "../components/inputs/RatingPicker";
import { SleepDial } from "../components/inputs/SleepDial";
import { WeightPicker } from "../components/inputs/WeightPicker";
import { PageHeader } from "../components/PageHeader";
import type { CheckinRecord, TrackerBundle } from "../lib/types";
import {
  formatShortDate,
  getDateKey,
  toOptionalString,
} from "../lib/utils";

type CheckinFormState = {
  bodyWeightKg: number | null;
  sleepHours: number;
  energy: number;
  mood: number;
  soreness: number;
  hydrationLiters: number;
  completedWorkout: boolean;
  notes: string;
};

function defaultForm(): CheckinFormState {
  return {
    bodyWeightKg: null,
    sleepHours: 7.5,
    energy: 3,
    mood: 3,
    soreness: 2,
    hydrationLiters: 0,
    completedWorkout: false,
    notes: "",
  };
}

function formFromRecord(record: CheckinRecord | null): CheckinFormState {
  const state = defaultForm();
  if (!record) return state;
  state.bodyWeightKg = record.bodyWeightKg ?? null;
  state.sleepHours = record.sleepHours;
  state.energy = record.energy;
  state.mood = record.mood;
  state.soreness = record.soreness;
  state.hydrationLiters = record.hydrationLiters ?? 0;
  state.completedWorkout = record.completedWorkout;
  state.notes = record.notes ?? "";
  return state;
}

type CheckinsViewProps = {
  tracker: TrackerBundle;
  selectedDateKey: string;
  setSelectedDateKey: Dispatch<SetStateAction<string>>;
};

export function CheckinsView({
  tracker,
  selectedDateKey,
  setSelectedDateKey,
}: CheckinsViewProps) {
  const existing = tracker.dashboard.selectedCheckin;
  const [form, setForm] = useState<CheckinFormState>(() => formFromRecord(existing));
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setForm(formFromRecord(existing));
  }, [existing?._id, selectedDateKey]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus(null);
    try {
      const notes = toOptionalString(form.notes);
      await tracker.actions.saveCheckin({
        dateKey: selectedDateKey,
        sleepHours: form.sleepHours,
        energy: form.energy,
        mood: form.mood,
        soreness: form.soreness,
        completedWorkout: form.completedWorkout,
        ...(form.bodyWeightKg !== null ? { bodyWeightKg: form.bodyWeightKg } : {}),
        ...(form.hydrationLiters > 0
          ? { hydrationLiters: form.hydrationLiters }
          : {}),
        ...(notes ? { notes } : {}),
      });
      setStatus("Saved");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="view-stack">
      <PageHeader
        eyebrow="Daily check-in"
        title={`Recovery · ${formatShortDate(selectedDateKey)}`}
        description="How did you walk in today? Tap, don't type."
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
            <p className="eyebrow eyebrow-dark">Readiness</p>
            <h2>{existing ? "Update entry" : "New entry"}</h2>
          </div>
          <span className="status-text">{status}</span>
        </div>

        <form className="stacked-form checkin-form" onSubmit={handleSubmit}>
          <div className="checkin-top-grid">
            <SleepDial
              label="Sleep"
              value={form.sleepHours}
              onChange={(value) =>
                setForm((current) => ({ ...current, sleepHours: value }))
              }
            />
            <WeightPicker
              label="Body weight"
              value={form.bodyWeightKg}
              onChange={(value) =>
                setForm((current) => ({ ...current, bodyWeightKg: value }))
              }
              presets={[60, 70, 75, 80, 85, 90, 100]}
              step={0.1}
            />
          </div>

          <div className="checkin-ratings">
            <RatingPicker
              label="Energy"
              kind="energy"
              value={form.energy}
              onChange={(value) =>
                setForm((current) => ({ ...current, energy: value }))
              }
              hint="Sharpness walking in"
            />
            <RatingPicker
              label="Mood"
              kind="mood"
              value={form.mood}
              onChange={(value) =>
                setForm((current) => ({ ...current, mood: value }))
              }
              hint="Simple 1-5 signal"
            />
            <RatingPicker
              label="Soreness"
              kind="soreness"
              value={form.soreness}
              onChange={(value) =>
                setForm((current) => ({ ...current, soreness: value }))
              }
              hint="Lower is fresher"
            />
          </div>

          <HydrationCounter
            label="Hydration"
            value={form.hydrationLiters}
            onChange={(value) =>
              setForm((current) => ({ ...current, hydrationLiters: value }))
            }
          />

          <div className="workout-toggle">
            <button
              type="button"
              className={`toggle-pill${form.completedWorkout ? " is-on" : ""}`}
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  completedWorkout: !current.completedWorkout,
                }))
              }
              aria-pressed={form.completedWorkout}
            >
              <span className="toggle-pill-indicator" />
              <span>
                {form.completedWorkout
                  ? "Workout completed"
                  : "Mark workout complete"}
              </span>
            </button>
          </div>

          <label className="field">
            <span className="field-label">Notes</span>
            <textarea
              rows={3}
              placeholder="Energy was flat until warm-up, knee felt fine, bench moved well."
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({ ...current, notes: event.target.value }))
              }
            />
          </label>

          <button className="primary-button" type="submit" disabled={pending}>
            <span>{pending ? "Saving..." : "Save check-in"}</span>
          </button>
        </form>
      </section>

      <section className="tool-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow eyebrow-dark">History</p>
            <h2>Recent days</h2>
          </div>
        </div>
        <div className="history-list no-top-margin">
          {tracker.dashboard.recentDays.length === 0 ? (
            <div className="empty-state">No past check-ins yet.</div>
          ) : (
            tracker.dashboard.recentDays.map((day) => (
              <button
                className={`history-row${day.dateKey === selectedDateKey ? " is-active" : ""}`}
                key={day.dateKey}
                type="button"
                onClick={() => setSelectedDateKey(day.dateKey)}
              >
                <div>
                  <strong>{formatShortDate(day.dateKey)}</strong>
                  <span>
                    {day.energy !== null ? `Energy ${day.energy}/5` : "No check-in"}
                  </span>
                </div>
                <div className="history-metrics">
                  <span>{day.totalSets} sets</span>
                  <span>
                    {day.bodyWeightKg === null ? "—" : `${day.bodyWeightKg} kg`}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

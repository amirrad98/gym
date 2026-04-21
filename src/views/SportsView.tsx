import { useMemo, useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { ChipGroup } from "../components/inputs/ChipGroup";
import { Stepper } from "../components/inputs/Stepper";
import { PageHeader } from "../components/PageHeader";
import type { SportIntensity, TrackerBundle } from "../lib/types";
import {
  formatShortDate,
  getDateKey,
  toOptionalNumber,
  toOptionalString,
} from "../lib/utils";

const sportOptions = [
  { value: "Running", icon: "⛰" },
  { value: "Cycling", icon: "⚙" },
  { value: "Swimming", icon: "~" },
  { value: "Hiking", icon: "△" },
  { value: "Rowing", icon: "≋" },
  { value: "Football", icon: "●" },
  { value: "Basketball", icon: "◐" },
  { value: "Tennis", icon: "◎" },
  { value: "Climbing", icon: "⬢" },
  { value: "Yoga", icon: "✶" },
  { value: "Other", icon: "◇" },
];

const intensityChipOptions = [
  { value: "light", label: "Light", accent: "light" },
  { value: "steady", label: "Steady", accent: "steady" },
  { value: "hard", label: "Hard", accent: "hard" },
] as const;

type FormState = {
  sport: string;
  durationMinutes: number;
  distanceKm: string;
  avgPaceSecPerKm: string;
  elevationM: string;
  intensity: SportIntensity;
  location: string;
  notes: string;
};

function defaultForm(): FormState {
  return {
    sport: "Running",
    durationMinutes: 30,
    distanceKm: "",
    avgPaceSecPerKm: "",
    elevationM: "",
    intensity: "steady",
    location: "",
    notes: "",
  };
}

function formatPace(secPerKm?: number) {
  if (secPerKm === undefined || !Number.isFinite(secPerKm)) return null;
  const minutes = Math.floor(secPerKm / 60);
  const seconds = Math.round(secPerKm - minutes * 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}/km`;
}

type SportsViewProps = {
  tracker: TrackerBundle;
  selectedDateKey: string;
  setSelectedDateKey: Dispatch<SetStateAction<string>>;
};

export function SportsView({
  tracker,
  selectedDateKey,
  setSelectedDateKey,
}: SportsViewProps) {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const sessionsForDay = useMemo(
    () => tracker.sports.filter((s) => s.dateKey === selectedDateKey),
    [tracker.sports, selectedDateKey],
  );

  const totals = useMemo(() => {
    const minutes = sessionsForDay.reduce(
      (sum, s) => sum + s.durationMinutes,
      0,
    );
    const km = sessionsForDay.reduce(
      (sum, s) => sum + (s.distanceKm ?? 0),
      0,
    );
    return { minutes, km };
  }, [sessionsForDay]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus(null);
    try {
      const sport = form.sport.trim();
      if (!sport) throw new Error("Sport is required.");
      const distanceKm = toOptionalNumber(form.distanceKm);
      const pace = toOptionalNumber(form.avgPaceSecPerKm);
      const elev = toOptionalNumber(form.elevationM);
      const location = toOptionalString(form.location);
      const notes = toOptionalString(form.notes);
      await tracker.actions.createSport({
        dateKey: selectedDateKey,
        sport,
        durationMinutes: form.durationMinutes,
        intensity: form.intensity,
        ...(distanceKm !== undefined ? { distanceKm } : {}),
        ...(pace !== undefined ? { avgPaceSecPerKm: pace } : {}),
        ...(elev !== undefined ? { elevationM: elev } : {}),
        ...(location ? { location } : {}),
        ...(notes ? { notes } : {}),
      });
      setForm((current) => ({
        ...defaultForm(),
        sport: current.sport,
        intensity: current.intensity,
      }));
      setStatus("Session logged");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save.");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete(id: string) {
    setStatus(null);
    try {
      await tracker.actions.removeSport(id);
      setStatus("Removed");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to remove.");
    }
  }

  return (
    <div className="view-stack">
      <PageHeader
        eyebrow="Sports"
        title={`Sessions · ${formatShortDate(selectedDateKey)}`}
        description="Running, cycling, swimming, team play — anything that moves the body."
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

      <div className="stat-grid">
        <div className="metric-card">
          <span>Sessions today</span>
          <strong>{sessionsForDay.length}</strong>
          <p>Logged entries</p>
        </div>
        <div className="metric-card">
          <span>Minutes</span>
          <strong>{totals.minutes}</strong>
          <p>Active time</p>
        </div>
        <div className="metric-card">
          <span>Distance</span>
          <strong>{totals.km > 0 ? totals.km.toFixed(1) : "—"}</strong>
          <p>Kilometres</p>
        </div>
        <div className="metric-card">
          <span>Total logged</span>
          <strong>{tracker.sports.length}</strong>
          <p>All-time sessions</p>
        </div>
      </div>

      <section className="tool-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow eyebrow-dark">New entry</p>
            <h2>Log a session</h2>
          </div>
          <span className="status-text">{status}</span>
        </div>

        <form className="stacked-form" onSubmit={handleSubmit}>
          <div className="chip-group">
            <span className="chip-group-label">Sport</span>
            <div className="chip-group-list">
              {sportOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`chip${form.sport === option.value ? " is-active" : ""}`}
                  onClick={() =>
                    setForm((current) => ({ ...current, sport: option.value }))
                  }
                >
                  <span style={{ marginRight: 6 }}>{option.icon}</span>
                  {option.value}
                </button>
              ))}
            </div>
          </div>

          <div className="field-grid two-up">
            <Stepper
              label="Duration"
              value={form.durationMinutes}
              onChange={(value) =>
                setForm((current) => ({ ...current, durationMinutes: value }))
              }
              min={1}
              max={600}
              step={5}
              unit="min"
              presets={[15, 30, 45, 60, 90]}
            />
            <ChipGroup
              label="Intensity"
              value={form.intensity}
              options={intensityChipOptions as never}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  intensity: value as SportIntensity,
                }))
              }
            />
          </div>

          <div className="field-grid three-up">
            <label className="field">
              <span className="field-label">Distance (km)</span>
              <input
                type="number"
                min="0"
                step="0.1"
                inputMode="decimal"
                placeholder="5.0"
                value={form.distanceKm}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    distanceKm: event.target.value,
                  }))
                }
              />
            </label>
            <label className="field">
              <span className="field-label">Avg pace (s/km)</span>
              <input
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                placeholder="e.g. 330 = 5:30/km"
                value={form.avgPaceSecPerKm}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    avgPaceSecPerKm: event.target.value,
                  }))
                }
              />
            </label>
            <label className="field">
              <span className="field-label">Elevation (m)</span>
              <input
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                placeholder="Optional"
                value={form.elevationM}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    elevationM: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          <label className="field">
            <span className="field-label">Location</span>
            <input
              placeholder="Park loop, pool, home court..."
              value={form.location}
              onChange={(event) =>
                setForm((current) => ({ ...current, location: event.target.value }))
              }
            />
          </label>

          <label className="field">
            <span className="field-label">Session notes</span>
            <textarea
              rows={3}
              placeholder="Felt strong on the hills, easy effort overall, legs heavy."
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({ ...current, notes: event.target.value }))
              }
            />
          </label>

          <button className="primary-button" type="submit" disabled={pending}>
            {pending ? "Logging..." : "Add session"}
          </button>
        </form>
      </section>

      <section className="tool-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow eyebrow-dark">Today</p>
            <h2>
              {sessionsForDay.length} session{sessionsForDay.length === 1 ? "" : "s"}
            </h2>
          </div>
        </div>
        <div className="log-list no-top-margin">
          {sessionsForDay.length === 0 ? (
            <div className="empty-state">No sport sessions logged today.</div>
          ) : (
            sessionsForDay.map((session) => (
              <article className="log-row" key={session._id}>
                <div>
                  <div className="log-title-row">
                    <h3>{session.sport}</h3>
                    <span className={`effort-pill effort-${session.intensity}`}>
                      {session.intensity}
                    </span>
                  </div>
                  <p className="log-meta">
                    {session.durationMinutes} min
                    {session.distanceKm ? ` · ${session.distanceKm} km` : ""}
                    {formatPace(session.avgPaceSecPerKm)
                      ? ` · ${formatPace(session.avgPaceSecPerKm)}`
                      : ""}
                    {session.elevationM ? ` · ${session.elevationM}m` : ""}
                    {session.location ? ` · ${session.location}` : ""}
                  </p>
                  {session.notes ? <p className="log-notes">{session.notes}</p> : null}
                </div>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => void handleDelete(session._id)}
                >
                  Remove
                </button>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="tool-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow eyebrow-dark">History</p>
            <h2>Recent sessions</h2>
          </div>
        </div>
        <div className="log-list no-top-margin">
          {tracker.sports.length === 0 ? (
            <div className="empty-state">No sports sessions yet.</div>
          ) : (
            tracker.sports.slice(0, 12).map((session) => (
              <article className="log-row" key={session._id}>
                <div>
                  <div className="log-title-row">
                    <h3>{session.sport}</h3>
                    <span className="log-focus">
                      {formatShortDate(session.dateKey)}
                    </span>
                    <span className={`effort-pill effort-${session.intensity}`}>
                      {session.intensity}
                    </span>
                  </div>
                  <p className="log-meta">
                    {session.durationMinutes} min
                    {session.distanceKm ? ` · ${session.distanceKm} km` : ""}
                    {formatPace(session.avgPaceSecPerKm)
                      ? ` · ${formatPace(session.avgPaceSecPerKm)}`
                      : ""}
                  </p>
                </div>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => void handleDelete(session._id)}
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

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { anyApi } from "convex/server";
import { useMutation, useQuery } from "convex/react";
import "./App.css";

type AppProps = {
  convexReady: boolean;
};

type WorkoutEffort = "light" | "steady" | "hard";

type CheckinFormState = {
  bodyWeightKg: string;
  sleepHours: string;
  energy: number;
  mood: number;
  soreness: number;
  hydrationLiters: string;
  completedWorkout: boolean;
  notes: string;
};

type WorkoutFormState = {
  exercise: string;
  muscleGroup: string;
  sets: string;
  reps: string;
  weightKg: string;
  durationMinutes: string;
  effort: WorkoutEffort;
  notes: string;
};

type CheckinRecord = {
  _id: string;
  bodyWeightKg?: number;
  sleepHours: number;
  energy: number;
  mood: number;
  soreness: number;
  hydrationLiters?: number;
  completedWorkout: boolean;
  notes?: string;
};

type WorkoutLogRecord = {
  _id: string;
  exercise: string;
  muscleGroup: string;
  sets: number;
  reps: number;
  weightKg?: number;
  durationMinutes?: number;
  effort: WorkoutEffort;
  notes?: string;
  createdAt: number;
};

type DailySummary = {
  dateKey: string;
  totalSets: number;
  totalReps: number;
  totalVolume: number;
  totalMinutes: number;
  workoutCount: number;
  completedWorkout: boolean;
  energy: number | null;
  mood: number | null;
  bodyWeightKg: number | null;
};

type ExerciseHighlight = {
  exercise: string;
  muscleGroup: string;
  bestWeightKg: number | null;
  totalSets: number;
  totalVolume: number;
  lastLoggedAt: number;
};

type MuscleGroupStat = {
  muscleGroup: string;
  workoutCount: number;
};

type DashboardData = {
  selectedDateKey: string;
  selectedCheckin: CheckinRecord | null;
  selectedLogs: WorkoutLogRecord[];
  streak: number;
  recentDays: DailySummary[];
  weeklySummary: {
    activeDays: number;
    totalSets: number;
    totalVolume: number;
    totalMinutes: number;
  };
  muscleGroupBreakdown: MuscleGroupStat[];
  exerciseHighlights: ExerciseHighlight[];
};

type SaveCheckinArgs = {
  dateKey: string;
  sleepHours: number;
  energy: number;
  mood: number;
  soreness: number;
  completedWorkout: boolean;
  bodyWeightKg?: number;
  hydrationLiters?: number;
  notes?: string;
};

const checkinSliders = [
  {
    key: "energy",
    label: "Energy",
    hint: "How sharp you felt walking in.",
  },
  {
    key: "mood",
    label: "Mood",
    hint: "Keep a simple 1-5 signal.",
  },
  {
    key: "soreness",
    label: "Soreness",
    hint: "Useful when volume starts stacking up.",
  },
] as const;

const muscleGroupOptions = [
  "Chest",
  "Back",
  "Legs",
  "Shoulders",
  "Arms",
  "Core",
  "Full Body",
  "Cardio",
  "Mobility",
];

const effortOptions: Array<{ value: WorkoutEffort; label: string }> = [
  { value: "light", label: "Light" },
  { value: "steady", label: "Steady" },
  { value: "hard", label: "Hard" },
];

const bannerStyle = {
  backgroundImage:
    "linear-gradient(110deg, rgba(14, 18, 15, 0.9) 15%, rgba(14, 18, 15, 0.48) 52%, rgba(14, 18, 15, 0.88) 100%), url('/gym-banner.jpg')",
};

const numberFormatter = new Intl.NumberFormat("en-US");
const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
});
const longDateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

function createDefaultCheckinState(): CheckinFormState {
  return {
    bodyWeightKg: "",
    sleepHours: "7.5",
    energy: 3,
    mood: 3,
    soreness: 2,
    hydrationLiters: "",
    completedWorkout: false,
    notes: "",
  };
}

function createCheckinStateFromRecord(checkin: CheckinRecord | null): CheckinFormState {
  const state = createDefaultCheckinState();

  if (!checkin) {
    return state;
  }

  state.bodyWeightKg = checkin.bodyWeightKg?.toString() ?? "";
  state.sleepHours = checkin.sleepHours.toString();
  state.energy = checkin.energy;
  state.mood = checkin.mood;
  state.soreness = checkin.soreness;
  state.hydrationLiters = checkin.hydrationLiters?.toString() ?? "";
  state.completedWorkout = checkin.completedWorkout;
  state.notes = checkin.notes ?? "";

  return state;
}

function createDefaultWorkoutState(): WorkoutFormState {
  return {
    exercise: "",
    muscleGroup: "Chest",
    sets: "4",
    reps: "8",
    weightKg: "",
    durationMinutes: "",
    effort: "steady",
    notes: "",
  };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function getDateKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatLongDate(dateKey: string) {
  return longDateFormatter.format(parseDateKey(dateKey));
}

function formatShortDate(dateKey: string) {
  return shortDateFormatter.format(parseDateKey(dateKey));
}

function formatWeight(weightKg?: number | null) {
  if (weightKg === undefined || weightKg === null) {
    return "Bodyweight";
  }

  return `${weightKg} kg`;
}

function formatMetricValue(value: number | null, suffix = "") {
  if (value === null) {
    return "--";
  }

  return `${numberFormatter.format(Number(value.toFixed(1)))}${suffix}`;
}

function toOptionalNumber(rawValue: string) {
  const trimmed = rawValue.trim();

  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toRequiredNumber(rawValue: string, label: string) {
  const parsed = toOptionalNumber(rawValue);

  if (parsed === undefined) {
    throw new Error(`${label} is required.`);
  }

  return parsed;
}

function toOptionalString(rawValue: string) {
  const trimmed = rawValue.trim();
  return trimmed ? trimmed : undefined;
}

function App({ convexReady }: AppProps) {
  if (!convexReady) {
    return <BackendSetup />;
  }

  return <GymTracker />;
}

function BackendSetup() {
  return (
    <div className="page-shell">
      <section className="overview-band setup-band" style={bannerStyle}>
        <div className="section-inner">
          <div className="overview-copy">
            <p className="eyebrow">Gym log</p>
            <h1>Track daily training without wiring local state together by hand.</h1>
            <p className="overview-text">
              The UI is ready. Add a Convex deployment URL and the tracker will
              start persisting check-ins and workout logs immediately.
            </p>
          </div>
        </div>
      </section>

      <main className="section-inner setup-layout">
        <section className="tool-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Hosted Convex</p>
              <h2>Fastest path</h2>
            </div>
          </div>
          <ol className="setup-steps">
            <li>Run <code>npm install</code>.</li>
            <li>Run <code>npm install convex</code>.</li>
            <li>Run <code>npx convex dev</code> and let Convex create a dev deployment.</li>
            <li>
              Add <code>VITE_CONVEX_URL=&lt;your deployment url&gt;</code> to
              <code> .env.local</code>.
            </li>
            <li>Start the app with <code>npm run dev</code>.</li>
          </ol>
        </section>

        <section className="tool-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">OrbStack Option</p>
              <h2>Self-hosted Convex</h2>
            </div>
          </div>
          <ol className="setup-steps">
            <li>
              Start the bundled container with
              <code> docker compose -f docker-compose.convex.yml up -d</code>.
            </li>
            <li>
              Generate an admin key with
              <code>
                {" "}
                docker compose -f docker-compose.convex.yml exec backend
                ./generate_admin_key.sh
              </code>
              .
            </li>
            <li>
              Add <code>VITE_CONVEX_URL=http://127.0.0.1:3210</code> to
              <code> .env.local</code>.
            </li>
            <li>
              Add <code>CONVEX_SELF_HOSTED_URL</code> and
              <code> CONVEX_SELF_HOSTED_ADMIN_KEY</code> to the same file if
              you want CLI push/code updates against the container.
            </li>
          </ol>
        </section>
      </main>
    </div>
  );
}

function GymTracker() {
  const [selectedDateKey, setSelectedDateKey] = useState(getDateKey());
  const [workoutForm, setWorkoutForm] = useState<WorkoutFormState>(
    createDefaultWorkoutState,
  );
  const [workoutStatus, setWorkoutStatus] = useState<string | null>(null);
  const [workoutPending, setWorkoutPending] = useState(false);

  const dashboard = useQuery(anyApi.dashboard.get, {
    dateKey: selectedDateKey,
  }) as DashboardData | undefined;
  const saveCheckin = useMutation(anyApi.checkins.upsert);
  const createWorkoutLog = useMutation(anyApi.workoutLogs.create);
  const removeWorkoutLog = useMutation(anyApi.workoutLogs.remove);

  const selectedSummary = useMemo(() => {
    if (!dashboard) {
      return null;
    }

    return (
      dashboard.recentDays.find((day) => day.dateKey === dashboard.selectedDateKey) ?? {
        dateKey: dashboard.selectedDateKey,
        totalSets: 0,
        totalReps: 0,
        totalVolume: 0,
        totalMinutes: 0,
        workoutCount: 0,
        completedWorkout: false,
        energy: null,
        mood: null,
        bodyWeightKg: null,
      }
    );
  }, [dashboard]);

  async function handleWorkoutSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWorkoutPending(true);
    setWorkoutStatus(null);

    try {
      const exercise = workoutForm.exercise.trim();
      const weightKg = toOptionalNumber(workoutForm.weightKg);
      const durationMinutes = toOptionalNumber(workoutForm.durationMinutes);
      const notes = toOptionalString(workoutForm.notes);

      if (!exercise) {
        throw new Error("Exercise is required.");
      }

      const args = {
        dateKey: selectedDateKey,
        exercise,
        muscleGroup: workoutForm.muscleGroup,
        sets: toRequiredNumber(workoutForm.sets, "Sets"),
        reps: toRequiredNumber(workoutForm.reps, "Reps"),
        effort: workoutForm.effort,
        ...(weightKg !== undefined ? { weightKg } : {}),
        ...(durationMinutes !== undefined ? { durationMinutes } : {}),
        ...(notes ? { notes } : {}),
      };

      await createWorkoutLog(args);

      setWorkoutForm((current) => ({
        ...createDefaultWorkoutState(),
        muscleGroup: current.muscleGroup,
        effort: current.effort,
      }));
      setWorkoutStatus("Workout entry logged.");
    } catch (error) {
      setWorkoutStatus(
        error instanceof Error ? error.message : "Unable to save the workout entry.",
      );
    } finally {
      setWorkoutPending(false);
    }
  }

  async function handleDeleteWorkout(logId: string) {
    setWorkoutStatus(null);

    try {
      await removeWorkoutLog({ id: logId as never });
      setWorkoutStatus("Workout entry removed.");
    } catch (error) {
      setWorkoutStatus(
        error instanceof Error ? error.message : "Unable to remove the workout entry.",
      );
    }
  }

  if (!dashboard || !selectedSummary) {
    return (
      <div className="page-shell">
        <section className="overview-band loading-band" style={bannerStyle}>
          <div className="section-inner">
            <p className="eyebrow">Gym log</p>
            <h1>Loading your training dashboard.</h1>
          </div>
        </section>
      </div>
    );
  }

  const toneMessage =
    selectedSummary.totalSets > 0
      ? "Training volume is on the board."
      : "No workout logged yet for this day.";

  return (
    <div className="page-shell">
      <section className="overview-band" style={bannerStyle}>
        <div className="section-inner overview-grid">
          <div className="overview-copy">
            <p className="eyebrow">Gym log</p>
            <h1>{formatLongDate(selectedDateKey)}</h1>
            <p className="overview-text">
              {toneMessage} Use the check-in and lift log below to keep recovery,
              effort, and exercise volume in one place.
            </p>
          </div>

          <div className="overview-actions">
            <label className="field">
              <span className="field-label">Date</span>
              <input
                className="date-picker"
                type="date"
                value={selectedDateKey}
                onChange={(event) => setSelectedDateKey(event.target.value)}
              />
            </label>
            <button
              className="secondary-button"
              type="button"
              onClick={() => setSelectedDateKey(getDateKey())}
            >
              Jump to today
            </button>
          </div>
        </div>

        <div className="section-inner stat-grid">
          <MetricCard
            label="Current streak"
            value={`${dashboard.streak} day${dashboard.streak === 1 ? "" : "s"}`}
            hint="Consecutive logged training days"
          />
          <MetricCard
            label="Sets today"
            value={numberFormatter.format(selectedSummary.totalSets)}
            hint={`${selectedSummary.workoutCount} exercise entries`}
          />
          <MetricCard
            label="7-day volume"
            value={formatMetricValue(dashboard.weeklySummary.totalVolume, " kg")}
            hint={`${dashboard.weeklySummary.activeDays} active day${dashboard.weeklySummary.activeDays === 1 ? "" : "s"}`}
          />
          <MetricCard
            label="Body weight"
            value={formatMetricValue(selectedSummary.bodyWeightKg, " kg")}
            hint="Optional daily weigh-in"
          />
        </div>
      </section>

      <main className="section-inner app-layout">
        <div className="primary-column">
          <CheckinPanel
            key={`${selectedDateKey}:${dashboard.selectedCheckin?._id ?? "empty"}`}
            selectedDateKey={selectedDateKey}
            selectedCheckin={dashboard.selectedCheckin}
            onSave={saveCheckin as (args: SaveCheckinArgs) => Promise<unknown>}
          />

          <section className="tool-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Workout log</p>
                <h2>Exercises for {formatShortDate(selectedDateKey)}</h2>
              </div>
              <span className="status-text">{workoutStatus}</span>
            </div>

            <form className="stacked-form" onSubmit={handleWorkoutSubmit}>
              <div className="field-grid two-up">
                <label className="field">
                  <span className="field-label">Exercise</span>
                  <input
                    required
                    placeholder="Incline dumbbell press"
                    value={workoutForm.exercise}
                    onChange={(event) =>
                      setWorkoutForm((current) => ({
                        ...current,
                        exercise: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="field">
                  <span className="field-label">Focus</span>
                  <select
                    value={workoutForm.muscleGroup}
                    onChange={(event) =>
                      setWorkoutForm((current) => ({
                        ...current,
                        muscleGroup: event.target.value,
                      }))
                    }
                  >
                    {muscleGroupOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="field-grid three-up">
                <label className="field">
                  <span className="field-label">Sets</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    inputMode="numeric"
                    value={workoutForm.sets}
                    onChange={(event) =>
                      setWorkoutForm((current) => ({
                        ...current,
                        sets: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="field">
                  <span className="field-label">Reps</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    inputMode="numeric"
                    value={workoutForm.reps}
                    onChange={(event) =>
                      setWorkoutForm((current) => ({
                        ...current,
                        reps: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="field">
                  <span className="field-label">Weight (kg)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    inputMode="decimal"
                    placeholder="Optional"
                    value={workoutForm.weightKg}
                    onChange={(event) =>
                      setWorkoutForm((current) => ({
                        ...current,
                        weightKg: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <div className="field-grid two-up">
                <label className="field">
                  <span className="field-label">Duration (minutes)</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    placeholder="15"
                    value={workoutForm.durationMinutes}
                    onChange={(event) =>
                      setWorkoutForm((current) => ({
                        ...current,
                        durationMinutes: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="field">
                  <span className="field-label">Effort</span>
                  <select
                    value={workoutForm.effort}
                    onChange={(event) =>
                      setWorkoutForm((current) => ({
                        ...current,
                        effort: event.target.value as WorkoutEffort,
                      }))
                    }
                  >
                    {effortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="field">
                <span className="field-label">Session notes</span>
                <textarea
                  rows={4}
                  placeholder="Paused reps, straps on final set, left shoulder felt stable."
                  value={workoutForm.notes}
                  onChange={(event) =>
                    setWorkoutForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                />
              </label>

              <button className="primary-button" type="submit" disabled={workoutPending}>
                {workoutPending ? "Logging..." : "Add workout entry"}
              </button>
            </form>

            <div className="log-list">
              {dashboard.selectedLogs.length === 0 ? (
                <div className="empty-state">
                  No exercise entries for this date yet.
                </div>
              ) : (
                dashboard.selectedLogs.map((log) => (
                  <article className="log-row" key={log._id}>
                    <div>
                      <div className="log-title-row">
                        <h3>{log.exercise}</h3>
                        <span className={`effort-pill effort-${log.effort}`}>
                          {log.effort}
                        </span>
                      </div>
                      <p className="log-meta">
                        {log.muscleGroup} · {log.sets} sets x {log.reps} reps ·{" "}
                        {formatWeight(log.weightKg)}
                        {log.durationMinutes ? ` · ${log.durationMinutes} min` : ""}
                      </p>
                      {log.notes ? <p className="log-notes">{log.notes}</p> : null}
                    </div>
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => handleDeleteWorkout(log._id)}
                    >
                      Remove
                    </button>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>

        <aside className="secondary-column">
          <section className="insight-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Day summary</p>
                <h2>Snapshot</h2>
              </div>
            </div>

            <dl className="summary-list">
              <SummaryRow label="Total reps" value={numberFormatter.format(selectedSummary.totalReps)} />
              <SummaryRow
                label="Session volume"
                value={formatMetricValue(selectedSummary.totalVolume, " kg")}
              />
              <SummaryRow
                label="Tracked minutes"
                value={formatMetricValue(selectedSummary.totalMinutes, " min")}
              />
              <SummaryRow
                label="Energy"
                value={selectedSummary.energy === null ? "--" : `${selectedSummary.energy}/5`}
              />
              <SummaryRow
                label="Mood"
                value={selectedSummary.mood === null ? "--" : `${selectedSummary.mood}/5`}
              />
            </dl>
          </section>

          <section className="insight-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Recent days</p>
                <h2>Consistency</h2>
              </div>
            </div>

            <div className="history-list">
              {dashboard.recentDays.length === 0 ? (
                <div className="empty-state">Your first logged day will show up here.</div>
              ) : (
                dashboard.recentDays.map((day) => (
                  <button
                    className={`history-row${day.dateKey === selectedDateKey ? " is-active" : ""}`}
                    key={day.dateKey}
                    type="button"
                    onClick={() => setSelectedDateKey(day.dateKey)}
                  >
                    <div>
                      <strong>{formatShortDate(day.dateKey)}</strong>
                      <span>{day.workoutCount} entries</span>
                    </div>
                    <div className="history-metrics">
                      <span>{day.totalSets} sets</span>
                      <span>
                        {day.bodyWeightKg === null ? "--" : `${day.bodyWeightKg} kg`}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="insight-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Focus split</p>
                <h2>Last 2 weeks</h2>
              </div>
            </div>

            <div className="breakdown-list">
              {dashboard.muscleGroupBreakdown.length === 0 ? (
                <div className="empty-state">Log a few workouts to see your split.</div>
              ) : (
                dashboard.muscleGroupBreakdown.map((item) => (
                  <div className="breakdown-row" key={item.muscleGroup}>
                    <span>{item.muscleGroup}</span>
                    <strong>{item.workoutCount}</strong>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="insight-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Exercise board</p>
                <h2>Highlights</h2>
              </div>
            </div>

            <div className="highlight-list">
              {dashboard.exerciseHighlights.length === 0 ? (
                <div className="empty-state">Personal bests will build as you log sets.</div>
              ) : (
                dashboard.exerciseHighlights.map((item) => (
                  <article className="highlight-row" key={item.exercise}>
                    <div>
                      <h3>{item.exercise}</h3>
                      <p>{item.muscleGroup}</p>
                    </div>
                    <div className="highlight-metrics">
                      <strong>{formatWeight(item.bestWeightKg)}</strong>
                      <span>{item.totalSets} sets total</span>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{hint}</p>
    </article>
  );
}

function CheckinPanel({
  selectedDateKey,
  selectedCheckin,
  onSave,
}: {
  selectedDateKey: string;
  selectedCheckin: CheckinRecord | null;
  onSave: (args: SaveCheckinArgs) => Promise<unknown>;
}) {
  const [checkinForm, setCheckinForm] = useState<CheckinFormState>(() =>
    createCheckinStateFromRecord(selectedCheckin),
  );
  const [checkinStatus, setCheckinStatus] = useState<string | null>(null);
  const [checkinPending, setCheckinPending] = useState(false);

  async function handleCheckinSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCheckinPending(true);
    setCheckinStatus(null);

    try {
      const bodyWeightKg = toOptionalNumber(checkinForm.bodyWeightKg);
      const hydrationLiters = toOptionalNumber(checkinForm.hydrationLiters);
      const notes = toOptionalString(checkinForm.notes);
      const args = {
        dateKey: selectedDateKey,
        sleepHours: toRequiredNumber(checkinForm.sleepHours, "Sleep hours"),
        energy: checkinForm.energy,
        mood: checkinForm.mood,
        soreness: checkinForm.soreness,
        completedWorkout: checkinForm.completedWorkout,
        ...(bodyWeightKg !== undefined ? { bodyWeightKg } : {}),
        ...(hydrationLiters !== undefined ? { hydrationLiters } : {}),
        ...(notes ? { notes } : {}),
      };

      await onSave(args);
      setCheckinStatus("Daily check-in saved.");
    } catch (error) {
      setCheckinStatus(
        error instanceof Error ? error.message : "Unable to save the daily check-in.",
      );
    } finally {
      setCheckinPending(false);
    }
  }

  return (
    <section className="tool-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Daily check-in</p>
          <h2>Recovery and readiness</h2>
        </div>
        <span className="status-text">{checkinStatus}</span>
      </div>

      <form className="stacked-form" onSubmit={handleCheckinSubmit}>
        <div className="field-grid two-up">
          <label className="field">
            <span className="field-label">Body weight (kg)</span>
            <input
              type="number"
              min="0"
              step="0.1"
              inputMode="decimal"
              placeholder="77.4"
              value={checkinForm.bodyWeightKg}
              onChange={(event) =>
                setCheckinForm((current) => ({
                  ...current,
                  bodyWeightKg: event.target.value,
                }))
              }
            />
          </label>

          <label className="field">
            <span className="field-label">Sleep (hours)</span>
            <input
              type="number"
              min="0"
              step="0.1"
              inputMode="decimal"
              required
              value={checkinForm.sleepHours}
              onChange={(event) =>
                setCheckinForm((current) => ({
                  ...current,
                  sleepHours: event.target.value,
                }))
              }
            />
          </label>
        </div>

        <div className="field-grid slider-grid">
          {checkinSliders.map((slider) => (
            <label className="field slider-field" key={slider.key}>
              <div className="field-row">
                <span className="field-label">{slider.label}</span>
                <span className="slider-value">{checkinForm[slider.key]}</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={checkinForm[slider.key]}
                onChange={(event) =>
                  setCheckinForm((current) => ({
                    ...current,
                    [slider.key]: Number(event.target.value),
                  }))
                }
              />
              <span className="field-hint">{slider.hint}</span>
            </label>
          ))}
        </div>

        <div className="field-grid two-up">
          <label className="field">
            <span className="field-label">Water (liters)</span>
            <input
              type="number"
              min="0"
              step="0.1"
              inputMode="decimal"
              placeholder="2.8"
              value={checkinForm.hydrationLiters}
              onChange={(event) =>
                setCheckinForm((current) => ({
                  ...current,
                  hydrationLiters: event.target.value,
                }))
              }
            />
          </label>

          <label className="field checkbox-field">
            <span className="field-label">Workout done</span>
            <input
              type="checkbox"
              checked={checkinForm.completedWorkout}
              onChange={(event) =>
                setCheckinForm((current) => ({
                  ...current,
                  completedWorkout: event.target.checked,
                }))
              }
            />
          </label>
        </div>

        <label className="field">
          <span className="field-label">Notes</span>
          <textarea
            rows={4}
            placeholder="Energy was flat until warm-up, knee felt fine, bench moved well."
            value={checkinForm.notes}
            onChange={(event) =>
              setCheckinForm((current) => ({
                ...current,
                notes: event.target.value,
              }))
            }
          />
        </label>

        <button className="primary-button" type="submit" disabled={checkinPending}>
          {checkinPending ? "Saving..." : "Save check-in"}
        </button>
      </form>
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="summary-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export default App;

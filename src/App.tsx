import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, Dispatch, FormEvent, SetStateAction } from "react";
import { anyApi } from "convex/server";
import { useMutation, useQuery } from "convex/react";
import "./App.css";

type AppProps = {
  convexReady: boolean;
};

type TrackerMode = "convex" | "browser";
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
  dateKey: string;
  bodyWeightKg?: number;
  sleepHours: number;
  energy: number;
  mood: number;
  soreness: number;
  hydrationLiters?: number;
  completedWorkout: boolean;
  notes?: string;
  createdAt?: number;
  updatedAt?: number;
};

type WorkoutLogRecord = {
  _id: string;
  dateKey: string;
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

type SaveWorkoutArgs = {
  dateKey: string;
  exercise: string;
  muscleGroup: string;
  sets: number;
  reps: number;
  effort: WorkoutEffort;
  weightKg?: number;
  durationMinutes?: number;
  notes?: string;
};

type LocalTrackerStore = {
  checkins: CheckinRecord[];
  workoutLogs: WorkoutLogRecord[];
};

type DashboardLayoutProps = {
  mode: TrackerMode;
  selectedDateKey: string;
  setSelectedDateKey: Dispatch<SetStateAction<string>>;
  dashboard: DashboardData;
  workoutForm: WorkoutFormState;
  setWorkoutForm: Dispatch<SetStateAction<WorkoutFormState>>;
  workoutStatus: string | null;
  workoutPending: boolean;
  onWorkoutSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onDeleteWorkout: (logId: string) => Promise<void>;
  onCheckinSave: (args: SaveCheckinArgs) => Promise<unknown>;
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

const gymBannerUrl = `${import.meta.env.BASE_URL}gym-banner.jpg`;
const bannerStyle: CSSProperties = {
  backgroundImage: `linear-gradient(110deg, rgba(14, 18, 15, 0.9) 15%, rgba(14, 18, 15, 0.48) 52%, rgba(14, 18, 15, 0.88) 100%), url('${gymBannerUrl}')`,
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
const LOCAL_STORAGE_KEY = "gym-tracker-browser-data-v1";

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

function shiftDateKey(dateKey: string, offset: number) {
  const shifted = parseDateKey(dateKey);
  shifted.setDate(shifted.getDate() + offset);
  return getDateKey(shifted);
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

function createLocalId(prefix: "checkin" | "log") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function volumeForLog(log: {
  sets: number;
  reps: number;
  weightKg?: number;
}) {
  return log.weightKg ? log.weightKg * log.sets * log.reps : 0;
}

function ensureSummary(map: Map<string, DailySummary>, dateKey: string) {
  const existing = map.get(dateKey);

  if (existing) {
    return existing;
  }

  const next: DailySummary = {
    dateKey,
    totalSets: 0,
    totalReps: 0,
    totalVolume: 0,
    totalMinutes: 0,
    workoutCount: 0,
    completedWorkout: false,
    energy: null,
    mood: null,
    bodyWeightKg: null,
  };

  map.set(dateKey, next);
  return next;
}

function buildDashboardData(
  selectedDateKey: string,
  checkins: CheckinRecord[],
  workoutLogs: WorkoutLogRecord[],
): DashboardData {
  const selectedLogs = workoutLogs
    .filter((log) => log.dateKey === selectedDateKey)
    .sort((left, right) => right.createdAt - left.createdAt);

  const selectedCheckin =
    checkins.find((checkin) => checkin.dateKey === selectedDateKey) ?? null;

  const summaryByDate = new Map<string, DailySummary>();

  for (const checkin of checkins) {
    const summary = ensureSummary(summaryByDate, checkin.dateKey);
    summary.completedWorkout = summary.completedWorkout || checkin.completedWorkout;
    summary.energy = checkin.energy;
    summary.mood = checkin.mood;
    summary.bodyWeightKg = checkin.bodyWeightKg ?? null;
  }

  for (const log of workoutLogs) {
    const summary = ensureSummary(summaryByDate, log.dateKey);
    summary.totalSets += log.sets;
    summary.totalReps += log.sets * log.reps;
    summary.totalVolume += volumeForLog(log);
    summary.totalMinutes += log.durationMinutes ?? 0;
    summary.workoutCount += 1;
    summary.completedWorkout = true;
  }

  const recentDays = [...summaryByDate.values()]
    .sort((left, right) => right.dateKey.localeCompare(left.dateKey))
    .slice(0, 8);

  const weekKeys = Array.from({ length: 7 }, (_, offset) =>
    shiftDateKey(selectedDateKey, -offset),
  );

  const weeklySummary = weekKeys.reduce(
    (summary, dateKey) => {
      const day = summaryByDate.get(dateKey);

      if (!day) {
        return summary;
      }

      return {
        activeDays:
          summary.activeDays + (day.completedWorkout || day.totalSets > 0 ? 1 : 0),
        totalSets: summary.totalSets + day.totalSets,
        totalVolume: summary.totalVolume + day.totalVolume,
        totalMinutes: summary.totalMinutes + day.totalMinutes,
      };
    },
    {
      activeDays: 0,
      totalSets: 0,
      totalVolume: 0,
      totalMinutes: 0,
    },
  );

  const activeDates = new Set(
    [...summaryByDate.values()]
      .filter((day) => day.completedWorkout || day.totalSets > 0)
      .map((day) => day.dateKey),
  );

  let streak = 0;
  for (let cursor = selectedDateKey; activeDates.has(cursor); cursor = shiftDateKey(cursor, -1)) {
    streak += 1;
  }

  const recentWindowKeys = new Set(
    Array.from({ length: 14 }, (_, offset) => shiftDateKey(selectedDateKey, -offset)),
  );
  const muscleGroupMap = new Map<string, number>();
  const highlightMap = new Map<string, ExerciseHighlight>();

  for (const log of workoutLogs) {
    if (recentWindowKeys.has(log.dateKey)) {
      muscleGroupMap.set(
        log.muscleGroup,
        (muscleGroupMap.get(log.muscleGroup) ?? 0) + 1,
      );
    }

    const existing = highlightMap.get(log.exercise);
    if (existing) {
      existing.bestWeightKg = Math.max(
        existing.bestWeightKg ?? 0,
        log.weightKg ?? 0,
      ) || null;
      existing.totalSets += log.sets;
      existing.totalVolume += volumeForLog(log);
      existing.lastLoggedAt = Math.max(existing.lastLoggedAt, log.createdAt);
    } else {
      highlightMap.set(log.exercise, {
        exercise: log.exercise,
        muscleGroup: log.muscleGroup,
        bestWeightKg: log.weightKg ?? null,
        totalSets: log.sets,
        totalVolume: volumeForLog(log),
        lastLoggedAt: log.createdAt,
      });
    }
  }

  const muscleGroupBreakdown = [...muscleGroupMap.entries()]
    .map(([muscleGroup, workoutCount]) => ({ muscleGroup, workoutCount }))
    .sort((left, right) => right.workoutCount - left.workoutCount)
    .slice(0, 6);

  const exerciseHighlights = [...highlightMap.values()]
    .sort((left, right) => right.lastLoggedAt - left.lastLoggedAt)
    .slice(0, 6);

  return {
    selectedDateKey,
    selectedCheckin,
    selectedLogs,
    streak,
    recentDays,
    weeklySummary,
    muscleGroupBreakdown,
    exerciseHighlights,
  };
}

function loadLocalTrackerStore(): LocalTrackerStore {
  if (typeof window === "undefined") {
    return { checkins: [], workoutLogs: [] };
  }

  const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) {
    return { checkins: [], workoutLogs: [] };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<LocalTrackerStore>;

    return {
      checkins: Array.isArray(parsed.checkins) ? parsed.checkins : [],
      workoutLogs: Array.isArray(parsed.workoutLogs) ? parsed.workoutLogs : [],
    };
  } catch {
    return { checkins: [], workoutLogs: [] };
  }
}

function App({ convexReady }: AppProps) {
  return convexReady ? <ConvexGymTracker /> : <LocalGymTracker />;
}

function ConvexGymTracker() {
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

  if (!dashboard) {
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

  return (
    <DashboardLayout
      mode="convex"
      selectedDateKey={selectedDateKey}
      setSelectedDateKey={setSelectedDateKey}
      dashboard={dashboard}
      workoutForm={workoutForm}
      setWorkoutForm={setWorkoutForm}
      workoutStatus={workoutStatus}
      workoutPending={workoutPending}
      onWorkoutSubmit={handleWorkoutSubmit}
      onDeleteWorkout={handleDeleteWorkout}
      onCheckinSave={saveCheckin as (args: SaveCheckinArgs) => Promise<unknown>}
    />
  );
}

function LocalGymTracker() {
  const [selectedDateKey, setSelectedDateKey] = useState(getDateKey());
  const [workoutForm, setWorkoutForm] = useState<WorkoutFormState>(
    createDefaultWorkoutState,
  );
  const [workoutStatus, setWorkoutStatus] = useState<string | null>(null);
  const [workoutPending, setWorkoutPending] = useState(false);
  const [store, setStore] = useState<LocalTrackerStore>(loadLocalTrackerStore);

  useEffect(() => {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(store));
  }, [store]);

  const dashboard = useMemo(
    () => buildDashboardData(selectedDateKey, store.checkins, store.workoutLogs),
    [selectedDateKey, store],
  );

  async function handleCheckinSave(args: SaveCheckinArgs) {
    setStore((current) => {
      const existing = current.checkins.find((checkin) => checkin.dateKey === args.dateKey);
      const now = Date.now();
      const nextRecord: CheckinRecord = {
        _id: existing?._id ?? createLocalId("checkin"),
        dateKey: args.dateKey,
        sleepHours: args.sleepHours,
        energy: args.energy,
        mood: args.mood,
        soreness: args.soreness,
        completedWorkout: args.completedWorkout,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        ...(args.bodyWeightKg !== undefined ? { bodyWeightKg: args.bodyWeightKg } : {}),
        ...(args.hydrationLiters !== undefined
          ? { hydrationLiters: args.hydrationLiters }
          : {}),
        ...(args.notes ? { notes: args.notes } : {}),
      };

      return {
        ...current,
        checkins: existing
          ? current.checkins.map((checkin) =>
              checkin.dateKey === args.dateKey ? nextRecord : checkin,
            )
          : [...current.checkins, nextRecord],
      };
    });

    return null;
  }

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

      const args: SaveWorkoutArgs = {
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

      setStore((current) => ({
        ...current,
        workoutLogs: [
          ...current.workoutLogs,
          {
            _id: createLocalId("log"),
            createdAt: Date.now(),
            ...args,
          },
        ],
      }));

      setWorkoutForm((current) => ({
        ...createDefaultWorkoutState(),
        muscleGroup: current.muscleGroup,
        effort: current.effort,
      }));
      setWorkoutStatus("Workout entry logged in this browser.");
    } catch (error) {
      setWorkoutStatus(
        error instanceof Error ? error.message : "Unable to save the workout entry.",
      );
    } finally {
      setWorkoutPending(false);
    }
  }

  async function handleDeleteWorkout(logId: string) {
    setStore((current) => ({
      ...current,
      workoutLogs: current.workoutLogs.filter((log) => log._id !== logId),
    }));
    setWorkoutStatus("Workout entry removed.");
  }

  return (
    <DashboardLayout
      mode="browser"
      selectedDateKey={selectedDateKey}
      setSelectedDateKey={setSelectedDateKey}
      dashboard={dashboard}
      workoutForm={workoutForm}
      setWorkoutForm={setWorkoutForm}
      workoutStatus={workoutStatus}
      workoutPending={workoutPending}
      onWorkoutSubmit={handleWorkoutSubmit}
      onDeleteWorkout={handleDeleteWorkout}
      onCheckinSave={handleCheckinSave}
    />
  );
}

function DashboardLayout({
  mode,
  selectedDateKey,
  setSelectedDateKey,
  dashboard,
  workoutForm,
  setWorkoutForm,
  workoutStatus,
  workoutPending,
  onWorkoutSubmit,
  onDeleteWorkout,
  onCheckinSave,
}: DashboardLayoutProps) {
  const selectedSummary =
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
    };

  const toneMessage =
    selectedSummary.totalSets > 0
      ? "Training volume is on the board."
      : "No workout logged yet for this day.";

  const modeMeta =
    mode === "convex"
      ? {
          label: "Convex live sync",
          hint: "Data is stored in the configured Convex backend.",
        }
      : {
          label: "Browser storage mode",
          hint: "This deployment stays usable without a public backend.",
        };

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
              <span className="field-label field-label-light">Date</span>
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
            <div className="mode-panel">
              <strong>{modeMeta.label}</strong>
              <p>{modeMeta.hint}</p>
            </div>
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
            key={`${mode}:${selectedDateKey}:${dashboard.selectedCheckin?._id ?? "empty"}`}
            selectedDateKey={selectedDateKey}
            selectedCheckin={dashboard.selectedCheckin}
            onSave={onCheckinSave}
          />

          <section className="tool-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Workout log</p>
                <h2>Exercises for {formatShortDate(selectedDateKey)}</h2>
              </div>
              <span className="status-text">{workoutStatus}</span>
            </div>

            <form className="stacked-form" onSubmit={onWorkoutSubmit}>
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
                <div className="empty-state">No exercise entries for this date yet.</div>
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
                      onClick={() => void onDeleteWorkout(log._id)}
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

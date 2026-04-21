import type { Dispatch, SetStateAction } from "react";
import { BodyDiagram, type MuscleRegionKey } from "../components/BodyDiagram";
import { MetricCard } from "../components/MetricCard";
import type { DailySummary, TrackerBundle, ViewKey } from "../lib/types";
import {
  formatMetricValue,
  formatShortDate,
  formatWeight,
  getDateKey,
  numberFormatter,
  parseDateKey,
  shiftDateKey,
} from "../lib/utils";

type DashboardViewProps = {
  tracker: TrackerBundle;
  selectedDateKey: string;
  setSelectedDateKey: Dispatch<SetStateAction<string>>;
  goToView: (view: ViewKey) => void;
};

function emptySummary(dateKey: string): DailySummary {
  return {
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
}

const heroDay = new Intl.DateTimeFormat("en-US", { weekday: "long" });
const heroMonth = new Intl.DateTimeFormat("en-US", { month: "short" });

const anatomicalRegions: MuscleRegionKey[] = [
  "Shoulders",
  "Chest",
  "Arms",
  "Core",
  "Back",
  "Legs",
];

export function DashboardView({
  tracker,
  selectedDateKey,
  setSelectedDateKey,
  goToView,
}: DashboardViewProps) {
  const { dashboard } = tracker;
  const selectedSummary =
    dashboard.recentDays.find((day) => day.dateKey === dashboard.selectedDateKey) ??
    emptySummary(dashboard.selectedDateKey);

  const date = parseDateKey(selectedDateKey);
  const weekday = heroDay.format(date);
  const monthShort = heroMonth.format(date);
  const dayNumber = date.getDate();

  const recovery = buildRecoveryState(tracker.workoutLogs, selectedDateKey);
  const heatmapHighlights = buildMuscleHighlights(dashboard.muscleGroupBreakdown);

  return (
    <div className="view-stack">
      <section className="hero-slab">
        <div className="hero-main">
          <div className="hero-stamp">
            <span>Today</span>
            <span>{weekday}</span>
          </div>
          <h1 className="hero-title">
            {monthShort} <em>{dayNumber}</em>
          </h1>
          <p className="hero-sub">
            {selectedSummary.totalSets > 0
              ? `${selectedSummary.workoutCount} entries · ${numberFormatter.format(selectedSummary.totalSets)} sets`
              : "No volume logged yet"}
          </p>

          <div className="hero-actions">
            <label className="field inline-field hero-date">
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
              Jump to today
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={() => goToView("workouts")}
            >
              Log workout →
            </button>
          </div>
        </div>

        <div className="hero-aside">
          <div className="hero-stat-label">Current streak</div>
          <div className="hero-stat-number is-accent">{dashboard.streak}</div>
          <div className="hero-stat-foot">
            consecutive day{dashboard.streak === 1 ? "" : "s"} logged
          </div>
        </div>
      </section>

      <div className="stat-grid">
        <MetricCard
          label="Sets today"
          value={numberFormatter.format(selectedSummary.totalSets)}
          hint={`${selectedSummary.workoutCount} entries`}
        />
        <MetricCard
          label="7d volume"
          value={formatMetricValue(dashboard.weeklySummary.totalVolume, " kg")}
          hint={`${dashboard.weeklySummary.activeDays} active days`}
        />
        <MetricCard
          label="Body weight"
          value={formatMetricValue(selectedSummary.bodyWeightKg, " kg")}
          hint="Latest weigh-in"
        />
        <MetricCard
          label="7d minutes"
          value={formatMetricValue(dashboard.weeklySummary.totalMinutes, " min")}
          hint="Tracked time"
        />
      </div>

      <div className="dashboard-grid">
        <section className="insight-panel insight-panel-wide">
          <div className="panel-heading">
            <div>
              <p className="eyebrow eyebrow-dark">Muscle recovery</p>
              <h2>Readiness</h2>
            </div>
            <span className="status-text">3-day window</span>
          </div>
          <div className="recovery-panel">
            <BodyDiagram
              highlights={heatmapHighlights}
              size="md"
              showLegend={false}
            />
            <div className="recovery-list">
              {anatomicalRegions.map((region) => {
                const state = recovery[region];
                return (
                  <div className="recovery-row" key={region}>
                    <span
                      className={`recovery-dot is-${state.status}`}
                      aria-hidden
                    />
                    <div>
                      <div className="recovery-name">{region}</div>
                      <div className="recovery-sub">
                        {state.status === "ready"
                          ? "Fresh — ready to train"
                          : state.status === "moderate"
                            ? `Trained ${state.daysSince}d ago`
                            : state.status === "worked"
                              ? "Worked today"
                              : "Not in rotation"}
                      </div>
                    </div>
                    <span className="recovery-count">
                      {state.recentCount > 0
                        ? `${state.recentCount}×`
                        : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="insight-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow eyebrow-dark">Day summary</p>
              <h2>Snapshot</h2>
            </div>
            <button
              type="button"
              className="link-button"
              onClick={() => goToView("workouts")}
            >
              Log →
            </button>
          </div>
          <dl className="summary-list">
            <SummaryRow
              label="Total reps"
              value={numberFormatter.format(selectedSummary.totalReps)}
            />
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
              value={
                selectedSummary.energy === null ? "—" : `${selectedSummary.energy}/5`
              }
            />
            <SummaryRow
              label="Mood"
              value={selectedSummary.mood === null ? "—" : `${selectedSummary.mood}/5`}
            />
          </dl>
        </section>

        <section className="insight-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow eyebrow-dark">Consistency</p>
              <h2>Recent days</h2>
            </div>
          </div>
          <div className="history-list">
            {dashboard.recentDays.length === 0 ? (
              <div className="empty-state">
                Your first logged day will show up here.
              </div>
            ) : (
              dashboard.recentDays.map((day) => (
                <button
                  className={`history-row${
                    day.dateKey === selectedDateKey ? " is-active" : ""
                  }`}
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
                      {day.bodyWeightKg === null ? "—" : `${day.bodyWeightKg} kg`}
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
              <p className="eyebrow eyebrow-dark">Focus / 14d</p>
              <h2>Volume split</h2>
            </div>
          </div>
          {dashboard.muscleGroupBreakdown.length === 0 ? (
            <div className="empty-state">
              Log a few workouts to see your split.
            </div>
          ) : (
            <div className="breakdown-list">
              {dashboard.muscleGroupBreakdown.map((item) => {
                const max = Math.max(
                  ...dashboard.muscleGroupBreakdown.map((m) => m.workoutCount),
                );
                const pct = max > 0 ? (item.workoutCount / max) * 100 : 0;
                return (
                  <div className="breakdown-row" key={item.muscleGroup}>
                    <span>{item.muscleGroup}</span>
                    <div className="breakdown-bar">
                      <div
                        className="breakdown-bar-fill"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <strong>{item.workoutCount}</strong>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="insight-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow eyebrow-dark">Highlights</p>
              <h2>Exercise board</h2>
            </div>
            <button
              type="button"
              className="link-button"
              onClick={() => goToView("exercises")}
            >
              Library →
            </button>
          </div>
          <div className="highlight-list">
            {dashboard.exerciseHighlights.length === 0 ? (
              <div className="empty-state">
                Personal bests will build as you log sets.
              </div>
            ) : (
              dashboard.exerciseHighlights.map((item) => (
                <article className="highlight-row" key={item.exercise}>
                  <div>
                    <h3>{item.exercise}</h3>
                    <p>
                      <span className="log-focus">{item.muscleGroup}</span>
                      {item.totalSets} sets total
                    </p>
                  </div>
                  <div className="highlight-metrics">
                    <strong>{formatWeight(item.bestWeightKg)}</strong>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
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

function buildMuscleHighlights(
  breakdown: Array<{ muscleGroup: string; workoutCount: number }>,
): Partial<Record<MuscleRegionKey, number>> {
  if (breakdown.length === 0) return {};
  const max = Math.max(...breakdown.map((item) => item.workoutCount));
  const highlights: Partial<Record<MuscleRegionKey, number>> = {};
  for (const item of breakdown) {
    highlights[item.muscleGroup as MuscleRegionKey] =
      max > 0 ? item.workoutCount / max : 0;
  }
  return highlights;
}

type RecoveryStatus = "ready" | "moderate" | "worked" | "dormant";

type RecoveryInfo = {
  status: RecoveryStatus;
  daysSince: number | null;
  recentCount: number;
};

function buildRecoveryState(
  logs: Array<{ dateKey: string; muscleGroup: string }>,
  selectedDateKey: string,
): Record<MuscleRegionKey, RecoveryInfo> {
  const result = {} as Record<MuscleRegionKey, RecoveryInfo>;
  const windowKeys = Array.from({ length: 7 }, (_, offset) =>
    shiftDateKey(selectedDateKey, -offset),
  );

  for (const region of anatomicalRegions) {
    const relevant = logs.filter(
      (log) =>
        log.muscleGroup === region && windowKeys.includes(log.dateKey),
    );
    const recentCount = relevant.length;

    if (recentCount === 0) {
      result[region] = { status: "dormant", daysSince: null, recentCount: 0 };
      continue;
    }

    // Earliest offset in the 7-day window where we trained this region
    let minOffset = Infinity;
    for (const log of relevant) {
      const offset = windowKeys.indexOf(log.dateKey);
      if (offset !== -1 && offset < minOffset) minOffset = offset;
    }
    const daysSince = minOffset === Infinity ? null : minOffset;

    let status: RecoveryStatus;
    if (daysSince === 0) status = "worked";
    else if (daysSince !== null && daysSince <= 1) status = "worked";
    else if (daysSince !== null && daysSince <= 3) status = "moderate";
    else status = "ready";

    result[region] = { status, daysSince, recentCount };
  }

  return result;
}

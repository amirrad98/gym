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

const heroDay = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const heroMonth = new Intl.DateTimeFormat("en-US", { month: "short" });

function dayOfYear(dateKey: string) {
  const date = parseDateKey(dateKey);
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / 86_400_000);
}

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
  const weekday = heroDay.format(date).toUpperCase();
  const monthShort = heroMonth.format(date).toUpperCase();
  const dayNumber = String(date.getDate()).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  const dayIndex = String(dayOfYear(selectedDateKey)).padStart(3, "0");

  return (
    <div className="view-stack">
      <section className="hero-slab">
        <div className="hero-main">
          <div className="hero-stamp">
            <span>Entry № {dayIndex} / 365</span>
            <span>{weekday}</span>
          </div>
          <h1 className="hero-title">
            {monthShort}
            <br />
            <em>{dayNumber}</em>
            <span style={{ color: "rgba(242,237,228,0.35)", fontStyle: "normal" }}>
              &nbsp;&rsquo;{year}
            </span>
          </h1>
          <p className="hero-sub">
            {selectedSummary.totalSets > 0
              ? `${selectedSummary.workoutCount} ENTRIES · ${numberFormatter.format(selectedSummary.totalSets)} SETS`
              : "No volume logged"}
          </p>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginTop: 36,
            }}
          >
            <label className="field inline-field" style={{ gap: 4 }}>
              <span
                className="field-label"
                style={{ color: "rgba(242,237,228,0.55)" }}
              >
                Date
              </span>
              <input
                className="date-picker"
                type="date"
                value={selectedDateKey}
                onChange={(event) => setSelectedDateKey(event.target.value)}
                style={{
                  borderBottomColor: "rgba(242,237,228,0.4)",
                  color: "#f2ede4",
                  background: "transparent",
                  padding: "6px 0",
                }}
              />
            </label>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setSelectedDateKey(getDateKey())}
              style={{
                background: "transparent",
                borderColor: "rgba(242,237,228,0.35)",
                color: "#f2ede4",
              }}
            >
              Jump · Today
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
          label="Sets / today"
          value={numberFormatter.format(selectedSummary.totalSets)}
          hint={`${selectedSummary.workoutCount} entries`}
        />
        <MetricCard
          label="Volume / 7d"
          value={formatMetricValue(dashboard.weeklySummary.totalVolume, "")}
          hint={`${dashboard.weeklySummary.activeDays} active · kg`}
        />
        <MetricCard
          label="Body weight"
          value={formatMetricValue(selectedSummary.bodyWeightKg, "")}
          hint="kg · weigh-in"
        />
        <MetricCard
          label="Minutes / 7d"
          value={formatMetricValue(dashboard.weeklySummary.totalMinutes, "")}
          hint="tracked time"
        />
      </div>

      <div className="dashboard-grid">
        <section className="insight-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow eyebrow-dark">Day / Summary</p>
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
              <h2>Recent</h2>
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

        <section className="insight-panel insight-panel-wide">
          <div className="panel-heading">
            <div>
              <p className="eyebrow eyebrow-dark">Focus / 14d</p>
              <h2>Muscle map</h2>
            </div>
            <span className="status-text">
              {dashboard.muscleGroupBreakdown.reduce(
                (acc, item) => acc + item.workoutCount,
                0,
              )}{" "}
              entries
            </span>
          </div>
          {dashboard.muscleGroupBreakdown.length === 0 ? (
            <div className="empty-state">
              Log a few workouts to see your split.
            </div>
          ) : (
            <div className="muscle-map-grid">
              <BodyDiagram
                highlights={buildMuscleHighlights(dashboard.muscleGroupBreakdown)}
                size="md"
                showLegend={false}
              />
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
                      <strong>
                        {String(item.workoutCount).padStart(2, "0")}
                      </strong>
                    </div>
                  );
                })}
              </div>
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

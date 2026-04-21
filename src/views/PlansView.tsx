import { useMemo, useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { ChipGroup } from "../components/inputs/ChipGroup";
import { PageHeader } from "../components/PageHeader";
import type { PlanCategory, PlanDomain, TrackerBundle } from "../lib/types";
import {
  formatShortDate,
  getDateKey,
  toOptionalString,
} from "../lib/utils";

type FormState = {
  title: string;
  category: PlanCategory;
  domain: PlanDomain;
  notes: string;
};

function defaultForm(): FormState {
  return {
    title: "",
    category: "task",
    domain: "general",
    notes: "",
  };
}

const categoryOptions = [
  { value: "task", label: "Task" },
  { value: "habit", label: "Habit" },
  { value: "milestone", label: "Milestone" },
] as const;

const domainOptions = [
  { value: "general", label: "General" },
  { value: "training", label: "Training" },
  { value: "study", label: "Study" },
  { value: "life", label: "Life" },
] as const;

type PlansViewProps = {
  tracker: TrackerBundle;
  selectedDateKey: string;
  setSelectedDateKey: Dispatch<SetStateAction<string>>;
};

export function PlansView({
  tracker,
  selectedDateKey,
  setSelectedDateKey,
}: PlansViewProps) {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const todaysPlans = useMemo(
    () => tracker.plans.filter((p) => p.dateKey === selectedDateKey),
    [tracker.plans, selectedDateKey],
  );

  const upcoming = useMemo(
    () =>
      tracker.plans
        .filter((p) => !p.completed && p.dateKey > selectedDateKey)
        .slice(0, 10),
    [tracker.plans, selectedDateKey],
  );

  const completedToday = todaysPlans.filter((p) => p.completed);
  const activeToday = todaysPlans.filter((p) => !p.completed);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus(null);
    try {
      const title = form.title.trim();
      if (!title) throw new Error("Title is required.");
      const notes = toOptionalString(form.notes);
      await tracker.actions.createPlan({
        dateKey: selectedDateKey,
        title,
        category: form.category,
        domain: form.domain,
        ...(notes ? { notes } : {}),
      });
      setForm((current) => ({
        ...defaultForm(),
        category: current.category,
        domain: current.domain,
      }));
      setStatus("Added");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="view-stack">
      <PageHeader
        eyebrow="Plans"
        title={`Plan · ${formatShortDate(selectedDateKey)}`}
        description="Tasks, habits, and milestones across training, study, and life."
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
          <span>Open today</span>
          <strong>{activeToday.length}</strong>
          <p>Still to do</p>
        </div>
        <div className="metric-card">
          <span>Done today</span>
          <strong>{completedToday.length}</strong>
          <p>Checked off</p>
        </div>
        <div className="metric-card">
          <span>Upcoming</span>
          <strong>{upcoming.length}</strong>
          <p>Future items</p>
        </div>
        <div className="metric-card">
          <span>All-time</span>
          <strong>{tracker.plans.length}</strong>
          <p>Total items</p>
        </div>
      </div>

      <section className="tool-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow eyebrow-dark">New item</p>
            <h2>Add a plan item</h2>
          </div>
          <span className="status-text">{status}</span>
        </div>

        <form className="stacked-form" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field-label">What?</span>
            <input
              required
              placeholder="Morning run, pay rent, review convex schema..."
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
            />
          </label>

          <div className="field-grid two-up">
            <ChipGroup
              label="Category"
              value={form.category}
              options={categoryOptions as never}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  category: value as PlanCategory,
                }))
              }
            />
            <ChipGroup
              label="Domain"
              value={form.domain}
              options={domainOptions as never}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  domain: value as PlanDomain,
                }))
              }
            />
          </div>

          <label className="field">
            <span className="field-label">Notes</span>
            <textarea
              rows={2}
              placeholder="Optional context."
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({ ...current, notes: event.target.value }))
              }
            />
          </label>

          <button className="primary-button" type="submit" disabled={pending}>
            {pending ? "Adding..." : "Add item"}
          </button>
        </form>
      </section>

      <section className="tool-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow eyebrow-dark">Today</p>
            <h2>
              {activeToday.length} open · {completedToday.length} done
            </h2>
          </div>
        </div>
        <div className="log-list no-top-margin">
          {todaysPlans.length === 0 ? (
            <div className="empty-state">Nothing planned for this day yet.</div>
          ) : (
            todaysPlans.map((item) => (
              <PlanRow
                key={item._id}
                item={item}
                onToggle={(completed) =>
                  void tracker.actions.togglePlan(item._id, completed)
                }
                onRemove={() => void tracker.actions.removePlan(item._id)}
              />
            ))
          )}
        </div>
      </section>

      {upcoming.length > 0 ? (
        <section className="tool-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow eyebrow-dark">Upcoming</p>
              <h2>Next up</h2>
            </div>
          </div>
          <div className="log-list no-top-margin">
            {upcoming.map((item) => (
              <PlanRow
                key={item._id}
                item={item}
                onToggle={(completed) =>
                  void tracker.actions.togglePlan(item._id, completed)
                }
                onRemove={() => void tracker.actions.removePlan(item._id)}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

type PlanRowProps = {
  item: TrackerBundle["plans"][number];
  onToggle: (completed: boolean) => void;
  onRemove: () => void;
};

function PlanRow({ item, onToggle, onRemove }: PlanRowProps) {
  return (
    <article className={`log-row plan-row${item.completed ? " is-done" : ""}`}>
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 14 }}>
        <button
          type="button"
          className={`plan-check${item.completed ? " is-checked" : ""}`}
          onClick={() => onToggle(!item.completed)}
          aria-label={item.completed ? "Mark as not done" : "Mark as done"}
        >
          {item.completed ? "✓" : ""}
        </button>
        <div>
          <div className="log-title-row">
            <h3>{item.title}</h3>
            <span className="log-focus">{item.domain}</span>
            <span className={`effort-pill effort-steady`}>{item.category}</span>
          </div>
          <p className="log-meta">
            {formatShortDate(item.dateKey)}
            {item.completed ? " · Done" : ""}
          </p>
          {item.notes ? <p className="log-notes">{item.notes}</p> : null}
        </div>
      </div>
      <button type="button" className="ghost-button" onClick={onRemove}>
        Remove
      </button>
    </article>
  );
}

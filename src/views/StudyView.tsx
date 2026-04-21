import { useMemo, useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { RatingPicker } from "../components/inputs/RatingPicker";
import { Stepper } from "../components/inputs/Stepper";
import { PageHeader } from "../components/PageHeader";
import type { TrackerBundle } from "../lib/types";
import {
  formatShortDate,
  getDateKey,
  toOptionalNumber,
  toOptionalString,
} from "../lib/utils";

type FormState = {
  subject: string;
  topic: string;
  durationMinutes: number;
  focus: number;
  pomodoros: string;
  notes: string;
};

function defaultForm(): FormState {
  return {
    subject: "",
    topic: "",
    durationMinutes: 25,
    focus: 3,
    pomodoros: "",
    notes: "",
  };
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

type StudyViewProps = {
  tracker: TrackerBundle;
  selectedDateKey: string;
  setSelectedDateKey: Dispatch<SetStateAction<string>>;
};

export function StudyView({
  tracker,
  selectedDateKey,
  setSelectedDateKey,
}: StudyViewProps) {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const sessionsForDay = useMemo(
    () => tracker.studies.filter((s) => s.dateKey === selectedDateKey),
    [tracker.studies, selectedDateKey],
  );

  const totals = useMemo(() => {
    const minutes = sessionsForDay.reduce(
      (sum, s) => sum + s.durationMinutes,
      0,
    );
    const pomodoros = sessionsForDay.reduce(
      (sum, s) => sum + (s.pomodoros ?? 0),
      0,
    );
    const avgFocus =
      sessionsForDay.length > 0
        ? sessionsForDay.reduce((sum, s) => sum + s.focus, 0) /
          sessionsForDay.length
        : null;
    return { minutes, pomodoros, avgFocus };
  }, [sessionsForDay]);

  const subjectHistory = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const s of tracker.studies) {
      if (!seen.has(s.subject)) {
        seen.add(s.subject);
        out.push(s.subject);
      }
    }
    return out.slice(0, 20);
  }, [tracker.studies]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus(null);
    try {
      const subject = form.subject.trim();
      if (!subject) throw new Error("Subject is required.");
      const topic = toOptionalString(form.topic);
      const pomodoros = toOptionalNumber(form.pomodoros);
      const notes = toOptionalString(form.notes);
      await tracker.actions.createStudy({
        dateKey: selectedDateKey,
        subject,
        durationMinutes: form.durationMinutes,
        focus: form.focus,
        ...(topic ? { topic } : {}),
        ...(pomodoros !== undefined ? { pomodoros } : {}),
        ...(notes ? { notes } : {}),
      });
      setForm((current) => ({
        ...defaultForm(),
        subject: current.subject,
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
      await tracker.actions.removeStudy(id);
      setStatus("Removed");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to remove.");
    }
  }

  return (
    <div className="view-stack">
      <PageHeader
        eyebrow="Study"
        title={`Sessions · ${formatShortDate(selectedDateKey)}`}
        description="Subjects, topics, pomodoros, and focus — track deep-work time."
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
          <span>Total time</span>
          <strong>{formatDuration(totals.minutes)}</strong>
          <p>{totals.minutes} minutes</p>
        </div>
        <div className="metric-card">
          <span>Pomodoros</span>
          <strong>{totals.pomodoros || "—"}</strong>
          <p>Focus blocks</p>
        </div>
        <div className="metric-card">
          <span>Avg focus</span>
          <strong>
            {totals.avgFocus !== null ? totals.avgFocus.toFixed(1) : "—"}
          </strong>
          <p>out of 5</p>
        </div>
      </div>

      <section className="tool-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow eyebrow-dark">New entry</p>
            <h2>Log a study block</h2>
          </div>
          <span className="status-text">{status}</span>
        </div>

        <form className="stacked-form" onSubmit={handleSubmit}>
          <div className="field-grid two-up">
            <label className="field">
              <span className="field-label">Subject</span>
              <input
                required
                list="study-subject-list"
                placeholder="Organic chemistry"
                value={form.subject}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    subject: event.target.value,
                  }))
                }
              />
              <datalist id="study-subject-list">
                {subjectHistory.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </label>
            <label className="field">
              <span className="field-label">Topic</span>
              <input
                placeholder="Aromatic substitution"
                value={form.topic}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    topic: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          <div className="field-grid two-up">
            <Stepper
              label="Duration"
              value={form.durationMinutes}
              onChange={(value) =>
                setForm((current) => ({ ...current, durationMinutes: value }))
              }
              min={5}
              max={300}
              step={5}
              unit="min"
              presets={[25, 45, 60, 90, 120]}
            />
            <label className="field">
              <span className="field-label">Pomodoros</span>
              <input
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                placeholder="0"
                value={form.pomodoros}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    pomodoros: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          <RatingPicker
            label="Focus quality"
            kind="energy"
            value={form.focus}
            onChange={(value) =>
              setForm((current) => ({ ...current, focus: value }))
            }
            hint="How deep did the session go?"
          />

          <label className="field">
            <span className="field-label">Notes</span>
            <textarea
              rows={3}
              placeholder="Covered chapters 4-5, stuck on mechanism, review tomorrow."
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
            <div className="empty-state">No study sessions logged today.</div>
          ) : (
            sessionsForDay.map((session) => (
              <article className="log-row" key={session._id}>
                <div>
                  <div className="log-title-row">
                    <h3>{session.subject}</h3>
                    <span className="log-focus">Focus {session.focus}/5</span>
                  </div>
                  <p className="log-meta">
                    {formatDuration(session.durationMinutes)}
                    {session.topic ? ` · ${session.topic}` : ""}
                    {session.pomodoros ? ` · ${session.pomodoros} pomodoros` : ""}
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
          {tracker.studies.length === 0 ? (
            <div className="empty-state">No study sessions yet.</div>
          ) : (
            tracker.studies.slice(0, 12).map((session) => (
              <article className="log-row" key={session._id}>
                <div>
                  <div className="log-title-row">
                    <h3>{session.subject}</h3>
                    <span className="log-focus">
                      {formatShortDate(session.dateKey)}
                    </span>
                  </div>
                  <p className="log-meta">
                    {formatDuration(session.durationMinutes)}
                    {session.topic ? ` · ${session.topic}` : ""} · Focus{" "}
                    {session.focus}/5
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

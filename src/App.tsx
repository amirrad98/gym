import { useState } from "react";
import "./App.css";
import { Sidebar } from "./components/Sidebar";
import { useConvexTracker } from "./lib/convexTracker";
import { useLocalTracker } from "./lib/localStore";
import type { TrackerBundle, ViewKey } from "./lib/types";
import { getDateKey } from "./lib/utils";
import { CheckinsView } from "./views/CheckinsView";
import { DashboardView } from "./views/DashboardView";
import { ExercisesView } from "./views/ExercisesView";
import { GoalsView } from "./views/GoalsView";
import { MeasurementsView } from "./views/MeasurementsView";
import { PlansView } from "./views/PlansView";
import { ProgramsView } from "./views/ProgramsView";
import { SettingsView } from "./views/SettingsView";
import { SportsView } from "./views/SportsView";
import { StudyView } from "./views/StudyView";
import { WorkoutsView } from "./views/WorkoutsView";

type AppProps = {
  convexReady: boolean;
};

export default function App({ convexReady }: AppProps) {
  const [activeView, setActiveView] = useState<ViewKey>("dashboard");
  const [selectedDateKey, setSelectedDateKey] = useState(getDateKey());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return convexReady ? (
    <ConvexApp
      activeView={activeView}
      setActiveView={setActiveView}
      selectedDateKey={selectedDateKey}
      setSelectedDateKey={setSelectedDateKey}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
    />
  ) : (
    <LocalApp
      activeView={activeView}
      setActiveView={setActiveView}
      selectedDateKey={selectedDateKey}
      setSelectedDateKey={setSelectedDateKey}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
    />
  );
}

type ShellProps = {
  activeView: ViewKey;
  setActiveView: (view: ViewKey) => void;
  selectedDateKey: string;
  setSelectedDateKey: React.Dispatch<React.SetStateAction<string>>;
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

function ConvexApp(props: ShellProps) {
  const tracker = useConvexTracker(props.selectedDateKey);
  if (!tracker) return <LoadingScreen />;
  return <AppShell {...props} tracker={tracker} />;
}

function LocalApp(props: ShellProps) {
  const tracker = useLocalTracker(props.selectedDateKey);
  return <AppShell {...props} tracker={tracker} />;
}

function LoadingScreen() {
  return (
    <div className="loading-shell">
      <div>
        <p className="eyebrow eyebrow-dark">Gym log</p>
        <h1>Loading your training data.</h1>
      </div>
    </div>
  );
}

type AppShellProps = ShellProps & { tracker: TrackerBundle };

function AppShell({
  activeView,
  setActiveView,
  selectedDateKey,
  setSelectedDateKey,
  sidebarOpen,
  setSidebarOpen,
  tracker,
}: AppShellProps) {
  function goTo(view: ViewKey) {
    setActiveView(view);
    setSidebarOpen(false);
  }

  return (
    <div className={`app-shell${sidebarOpen ? " sidebar-open" : ""}`}>
      <div
        className="sidebar-overlay"
        onClick={() => setSidebarOpen(false)}
        aria-hidden
      />
      <aside className="sidebar-wrap">
        <Sidebar activeView={activeView} onSelect={goTo} mode={tracker.mode} />
      </aside>
      <div className="main-wrap">
        <header className="mobile-bar">
          <button
            type="button"
            className="icon-button"
            aria-label="Open navigation"
            onClick={() => setSidebarOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
          <span className="mobile-bar-title">Gym log</span>
        </header>
        <main className="main-content">
          {activeView === "dashboard" ? (
            <DashboardView
              tracker={tracker}
              selectedDateKey={selectedDateKey}
              setSelectedDateKey={setSelectedDateKey}
              goToView={goTo}
            />
          ) : null}
          {activeView === "workouts" ? (
            <WorkoutsView
              tracker={tracker}
              selectedDateKey={selectedDateKey}
              setSelectedDateKey={setSelectedDateKey}
            />
          ) : null}
          {activeView === "sports" ? (
            <SportsView
              tracker={tracker}
              selectedDateKey={selectedDateKey}
              setSelectedDateKey={setSelectedDateKey}
            />
          ) : null}
          {activeView === "study" ? (
            <StudyView
              tracker={tracker}
              selectedDateKey={selectedDateKey}
              setSelectedDateKey={setSelectedDateKey}
            />
          ) : null}
          {activeView === "checkins" ? (
            <CheckinsView
              tracker={tracker}
              selectedDateKey={selectedDateKey}
              setSelectedDateKey={setSelectedDateKey}
            />
          ) : null}
          {activeView === "plans" ? (
            <PlansView
              tracker={tracker}
              selectedDateKey={selectedDateKey}
              setSelectedDateKey={setSelectedDateKey}
            />
          ) : null}
          {activeView === "exercises" ? <ExercisesView tracker={tracker} /> : null}
          {activeView === "measurements" ? (
            <MeasurementsView tracker={tracker} />
          ) : null}
          {activeView === "goals" ? <GoalsView tracker={tracker} /> : null}
          {activeView === "programs" ? <ProgramsView tracker={tracker} /> : null}
          {activeView === "settings" ? <SettingsView tracker={tracker} /> : null}
        </main>
      </div>
    </div>
  );
}

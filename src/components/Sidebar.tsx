import type { ViewKey } from "../lib/types";

type NavItem = {
  key: ViewKey;
  label: string;
};

const navItems: NavItem[] = [
  { key: "dashboard", label: "Overview" },
  { key: "workouts", label: "Workouts" },
  { key: "checkins", label: "Check-ins" },
  { key: "exercises", label: "Exercises" },
  { key: "measurements", label: "Measurements" },
  { key: "goals", label: "Goals" },
  { key: "programs", label: "Programs" },
  { key: "settings", label: "Settings" },
];

type SidebarProps = {
  activeView: ViewKey;
  onSelect: (view: ViewKey) => void;
  mode: "convex" | "browser";
};

export function Sidebar({ activeView, onSelect, mode }: SidebarProps) {
  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-mark">GT</span>
        <span className="sidebar-brand-name">
          <span className="brand-title">Gym Training</span>
          <span className="brand-sub">Daily log</span>
        </span>
      </div>

      <ul className="sidebar-nav">
        {navItems.map((item, index) => (
          <li key={item.key}>
            <button
              type="button"
              className={`sidebar-link${activeView === item.key ? " is-active" : ""}`}
              onClick={() => onSelect(item.key)}
            >
              <span className="sidebar-index">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>{item.label}</span>
              <span className="sidebar-icon" aria-hidden>
                {activeView === item.key ? "→" : ""}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="sidebar-mode">
        <span className={`mode-dot mode-${mode}`} />
        <div>
          <strong>{mode === "convex" ? "Live sync" : "Local only"}</strong>
          <p>
            {mode === "convex"
              ? "Streaming to Convex"
              : "Data stays on device"}
          </p>
        </div>
      </div>
    </nav>
  );
}

import type { ViewKey } from "../lib/types";

type NavItem = {
  key: ViewKey;
  label: string;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    title: "Home",
    items: [{ key: "dashboard", label: "Overview" }],
  },
  {
    title: "Train",
    items: [
      { key: "workouts", label: "Workouts" },
      { key: "sports", label: "Sports" },
      { key: "checkins", label: "Check-ins" },
    ],
  },
  {
    title: "Study",
    items: [{ key: "study", label: "Sessions" }],
  },
  {
    title: "Plan",
    items: [
      { key: "plans", label: "Plans" },
      { key: "goals", label: "Goals" },
      { key: "programs", label: "Programs" },
    ],
  },
  {
    title: "Library",
    items: [
      { key: "exercises", label: "Exercises" },
      { key: "measurements", label: "Measurements" },
    ],
  },
  {
    title: "System",
    items: [{ key: "settings", label: "Settings" }],
  },
];

type SidebarProps = {
  activeView: ViewKey;
  onSelect: (view: ViewKey) => void;
  mode: "convex" | "browser";
};

export function Sidebar({ activeView, onSelect, mode }: SidebarProps) {
  // Running index across sections for the leading numerals
  let runningIndex = 0;

  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-mark">DL</span>
        <span className="sidebar-brand-name">
          <span className="brand-title">Daily Log</span>
          <span className="brand-sub">Train · Study · Plan</span>
        </span>
      </div>

      <div className="sidebar-sections">
        {navSections.map((section) => (
          <div className="sidebar-section" key={section.title}>
            <div className="sidebar-section-title">{section.title}</div>
            <ul className="sidebar-nav">
              {section.items.map((item) => {
                runningIndex += 1;
                return (
                  <li key={item.key}>
                    <button
                      type="button"
                      className={`sidebar-link${activeView === item.key ? " is-active" : ""}`}
                      onClick={() => onSelect(item.key)}
                    >
                      <span className="sidebar-index">
                        {String(runningIndex).padStart(2, "0")}
                      </span>
                      <span>{item.label}</span>
                      <span className="sidebar-icon" aria-hidden>
                        {activeView === item.key ? "→" : ""}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

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

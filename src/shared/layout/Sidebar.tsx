import { memo, useEffect, useState } from "react";

interface SidebarProps {
  isOpen: boolean;
  onNavigate: () => void;
}

const sections = [
  { label: "Overview", href: "#dashboard" },
  { label: "Events", href: "#events" },
];

export const Sidebar = memo(function Sidebar({
  isOpen,
  onNavigate,
}: SidebarProps) {
  const [activeHref, setActiveHref] = useState(
    window.location.hash || "#dashboard",
  );

  useEffect(() => {
    const syncActiveLink = () =>
      setActiveHref(window.location.hash || "#dashboard");
    window.addEventListener("hashchange", syncActiveLink);
    return () => window.removeEventListener("hashchange", syncActiveLink);
  }, []);

  return (
    <aside
      className="sidebar"
      id="primary-navigation"
      aria-label="Dashboard navigation"
      hidden={!isOpen}
    >
      <p className="sidebar-heading">MONITOR</p>
      <nav>
        {sections.map((section) => (
          <a
            className={
              activeHref === section.href
                ? "nav-link nav-link--active"
                : "nav-link"
            }
            href={section.href}
            key={section.href}
            onClick={() => {
              setActiveHref(section.href);
              onNavigate();
            }}
          >
            {section.label}
          </a>
        ))}
      </nav>
    </aside>
  );
});

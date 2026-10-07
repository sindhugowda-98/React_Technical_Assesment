import {
  useCallback,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { Button } from "../ui";

export function AppLayout({ children }: PropsWithChildren) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((open) => !open), []);

  useEffect(() => {
    if (!sidebarOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeSidebar();
        document.querySelector<HTMLButtonElement>(".sidebar-toggle")?.focus();
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [sidebarOpen, closeSidebar]);

  return (
    <div className="app-shell">
      <Header sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />
      <div className="app-body">
        <main id="dashboard" className="main-content">
          {children}
        </main>
      </div>
      {sidebarOpen && (
        <Button
          className="sidebar-backdrop"
          variant="ghost"
          type="button"
          aria-label="Close navigation"
          onClick={closeSidebar}
        />
      )}
      <Sidebar isOpen={sidebarOpen} onNavigate={closeSidebar} />
      <Footer />
    </div>
  );
}

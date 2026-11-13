import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Sidebar } from "../../components/shared/Sidebar";
import { TopBar } from "../../components/shared/TopBar";
import { useSessionStore } from "../../store/sessionStore";

const routeBySection: Record<string, string> = {
  Overview: "/",
  Orders: "/orders",
  Customers: "/customers",
  Services: "/services",
  Staff: "/staff",
  Notifications: "/notifications",
  Settings: "/settings",
  Profile: "/profile",
};
const sectionByRoute: Record<string, string> = Object.fromEntries(
  Object.entries(routeBySection).map(([label, path]) => [path, label]),
);

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const setUser = useSessionStore((state) => state.setUser);
  const [mobileOpen, setMobileOpen] = useState(false);
  const section = sectionByRoute[location.pathname] ?? "Overview";
  const onNavigate = (label: string) => {
    navigate(routeBySection[label] ?? "/");
    setMobileOpen(false);
  };
  const onSearch = () => {
    navigate("/orders");
    setMobileOpen(false);
    window.setTimeout(() => document.getElementById("order-search")?.focus(), 0);
  };

  return (
    <div className="app-shell">
      <Sidebar
        section={section}
        mobileOpen={mobileOpen}
        onNavigate={onNavigate}
        onClose={() => setMobileOpen(false)}
        onLogout={() => {
          setUser(null);
          navigate("/login", { replace: true });
        }}
      />
      <main className="main-area">
        <TopBar
          section={section}
          onOpenMenu={() => setMobileOpen(true)}
          onSearch={onSearch}
          onNotifications={() => onNavigate("Notifications")}
          onProfile={() => onNavigate("Profile")}
        />
        <Outlet />
      </main>
    </div>
  );
}

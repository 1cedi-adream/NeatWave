import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Sidebar } from "@/components/shared/Sidebar";
import { TopBar } from "@/components/shared/TopBar";
import { useLogout } from "@/features/auth/hooks/useAuth";
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
  const logout = useLogout();
  const [mobileOpen, setMobileOpen] = useState(false);
  const section = sectionByRoute[location.pathname] ?? "Overview";
  function onNavigate(label: string) {
    navigate(routeBySection[label] ?? "/");
    setMobileOpen(false);
  }
  return (
    <div className="app-shell">
      <Sidebar
        section={section}
        mobileOpen={mobileOpen}
        onNavigate={onNavigate}
        onClose={() => setMobileOpen(false)}
        isSigningOut={logout.isPending}
        onLogout={() =>
          logout.mutate(undefined, {
            onSettled: () => navigate("/login", { replace: true }),
          })
        }
      />
      <main className="main-area">
        <TopBar
          section={section}
          onOpenMenu={() => setMobileOpen(true)}
          onSearch={() => navigate("/orders")}
          onNotifications={() => onNavigate("Notifications")}
          onProfile={() => onNavigate("Profile")}
        />
        <Outlet />
      </main>
    </div>
  );
}

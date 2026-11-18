import { Building2, LayoutDashboard, LogOut } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useLogout } from "@/features/auth/hooks/useAuth";
import { RealtimeConnectionBadge } from "@/features/realtime/components/RealtimeConnectionBadge";

export default function AdminLayout() {
  const logout = useLogout();
  const navigate = useNavigate();
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div>
          <b>NeatWave</b>
          <small>Super admin</small>
        </div>
        <nav>
          <NavLink to="/admin" end>
            <LayoutDashboard size={17} />
            Overview
          </NavLink>
          <NavLink to="/admin/laundries">
            <Building2 size={17} />
            Laundries
          </NavLink>
        </nav>
        <RealtimeConnectionBadge />
        <button
          onClick={() =>
            logout.mutate(undefined, { onSettled: () => navigate("/login") })
          }
        >
          <LogOut size={17} />
          Sign out
        </button>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}

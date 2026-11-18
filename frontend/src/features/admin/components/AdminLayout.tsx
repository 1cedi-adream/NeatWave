import { Building2, LayoutDashboard, LoaderCircle, LogOut } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useLogout } from "@/features/auth/hooks/useAuth";

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
        <button
          type="button"
          className="disabled:cursor-wait disabled:opacity-60"
          disabled={logout.isPending}
          aria-busy={logout.isPending}
          onClick={() =>
            logout.mutate(undefined, {
              onSettled: () => navigate("/login", { replace: true }),
            })
          }
        >
          {logout.isPending ? (
            <LoaderCircle size={17} className="animate-spin" />
          ) : (
            <LogOut size={17} />
          )}
          {logout.isPending ? "Signing out…" : "Sign out"}
        </button>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}

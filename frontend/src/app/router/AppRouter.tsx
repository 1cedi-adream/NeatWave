import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/app/layouts/AppLayout";
import { restoreAccessToken } from "@/services/apiClient";
import { useCurrentUser } from "@/features/auth/hooks/useAuth";
import DashboardPage from "@/features/dashboard/pages/DashboardPage";
import OrdersPage from "@/features/orders/pages/OrdersPage";
import CustomersPage from "@/features/customers/pages/CustomersPage";
import CustomerOrderHistoryPage from "@/features/customers/pages/CustomerOrderHistoryPage";
import ServicesPage from "@/features/services/pages/ServicesPage";
import StaffPage from "@/features/staff/pages/StaffPage";
import NotificationsPage from "@/features/notifications/pages/NotificationsPage";
import MessageDeliveriesPage from "@/features/notifications/pages/MessageDeliveriesPage";
import SettingsPage from "@/features/settings/pages/SettingsPage";
import LoginPage from "@/features/auth/pages/LoginPage";
import ProfilePage from "@/features/auth/pages/ProfilePage";
import PublicTrackingPage from "@/features/tracking/pages/PublicTrackingPage";
import ResetPasswordPage from "@/features/auth/pages/ResetPasswordPage";
import AcceptInvitePage from "@/features/auth/pages/AcceptInvitePage";
import AdminLayout from "@/features/admin/components/AdminLayout";
import AdminDashboardPage from "@/features/admin/pages/AdminDashboardPage";
import TenantsPage from "@/features/admin/pages/TenantsPage";
import CreateTenantPage from "@/features/admin/pages/CreateTenantPage";
import TenantDetailPage from "@/features/admin/pages/TenantDetailPage";
import { RealtimeProvider } from "@/features/realtime/providers/RealtimeProvider";

export function AppRouter() {
  const [ready, setReady] = useState(false);
  const [canFetch, setCanFetch] = useState(false);
  const [hasEndedSession, setHasEndedSession] = useState(false);
  const queryClient = useQueryClient();
  useEffect(() => {
    void restoreAccessToken().then((restored) => {
      setCanFetch(restored);
      setReady(true);
    });
  }, []);
  const userQuery = useCurrentUser(canFetch);
  useEffect(() => {
    const expire = () => {
      setHasEndedSession(true);
      setCanFetch(false);
      queryClient.clear();
    };
    const startSession = () => {
      setHasEndedSession(false);
      setCanFetch(true);
    };
    window.addEventListener("neatwave:session-expired", expire);
    window.addEventListener("neatwave:session-started", startSession);
    return () => {
      window.removeEventListener("neatwave:session-expired", expire);
      window.removeEventListener("neatwave:session-started", startSession);
    };
  }, [queryClient]);
  if (!ready || (canFetch && userQuery.isPending))
    return (
      <main className="grid min-h-screen place-items-center bg-page text-sm text-gray-600">
        Loading workspace…
      </main>
    );
  const user = hasEndedSession ? undefined : userQuery.data;
  return (
    <RealtimeProvider user={user}>
      <Routes>
        <Route path="/track/:token" element={<PublicTrackingPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/accept-invite/:token" element={<AcceptInvitePage />} />
        <Route
          path="/login"
          element={
            user ? (
              <Navigate
                to={user.platformRole === "super_admin" ? "/admin" : "/"}
                replace
              />
            ) : (
              <LoginPage />
            )
          }
        />
        <Route
          element={
            user?.platformRole === "super_admin" ? (
              <AdminLayout />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/laundries" element={<TenantsPage />} />
          <Route path="/admin/laundries/new" element={<CreateTenantPage />} />
          <Route
            path="/admin/laundries/:tenantId"
            element={<TenantDetailPage />}
          />
        </Route>
        <Route
          element={
            user?.tenantId ? (
              <AppLayout />
            ) : (
              <Navigate
                to={user?.platformRole === "super_admin" ? "/admin" : "/login"}
                replace
              />
            )
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route
            path="customers/:customerId/order-history"
            element={<CustomerOrderHistoryPage />}
          />
          <Route path="services" element={<ServicesPage />} />
          <Route path="staff" element={<StaffPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route
            path="notifications/messages"
            element={<MessageDeliveriesPage />}
          />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </RealtimeProvider>
  );
}

import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout";
import DashboardPage from "../../features/dashboard/pages/DashboardPage";
import OrdersPage from "../../features/orders/pages/OrdersPage";
import CustomersPage from "../../features/customers/pages/CustomersPage";
import ServicesPage from "../../features/services/pages/ServicesPage";
import StaffPage from "../../features/staff/pages/StaffPage";
import NotificationsPage from "../../features/notifications/pages/NotificationsPage";
import SettingsPage from "../../features/settings/pages/SettingsPage";
import LoginPage from "../../features/auth/pages/LoginPage";
import ProfilePage from "../../features/auth/pages/ProfilePage";
import PublicTrackingPage from "../../features/tracking/pages/PublicTrackingPage";
import { useSessionStore } from "../../store/sessionStore";

export function AppRouter() {
  const user = useSessionStore((state) => state.user);
  return (
    <Routes>
      <Route path="/track" element={<PublicTrackingPage />} />
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route element={user ? <AppLayout /> : <Navigate to="/login" replace />}>
        <Route index element={<DashboardPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="staff" element={<StaffPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

import { Bell, Menu, Search } from "lucide-react";
import { useCurrentUser } from "@/features/auth/hooks/useAuth";
import { useNotifications } from "@/features/notifications/hooks/useNotifications";

type TopBarProps = {
  section: string;
  onOpenMenu: () => void;
  onSearch: () => void;
  onNotifications: () => void;
  onProfile: () => void;
};

export function TopBar({
  section,
  onOpenMenu,
  onSearch,
  onNotifications,
  onProfile,
}: TopBarProps) {
  const { data: user } = useCurrentUser();
  const { data: notifications = [] } = useNotifications();
  const hasUnread = notifications.some((item) => !item.readAt);
  const initials =
    user?.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";
  return (
    <header className="topbar">
      <button
        className="mobile-menu icon-button"
        onClick={onOpenMenu}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>
      <div className="crumb">
        Workspace <span>/</span> <b>{section}</b>
      </div>
      <div className="top-actions">
        <button
          className="top-icon"
          aria-label="Search orders"
          title="Search orders"
          onClick={onSearch}
        >
          <Search size={18} />
        </button>
        <button
          className="top-icon notification-button"
          aria-label="Notifications"
          onClick={onNotifications}
        >
          <Bell size={18} />
          {hasUnread && <i />}
        </button>
        <div className="top-divider" />
        <button
          className="avatar avatar-top"
          title="Open profile"
          aria-label="Open profile"
          onClick={onProfile}
        >
          {initials}
        </button>
      </div>
    </header>
  );
}

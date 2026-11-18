import { Bell, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { PanelSkeleton } from "@/components/shared/LoadingSkeletons";
import { getApiErrorMessage } from "@/lib/apiError";
import { formatDateTime } from "@/lib/formatDate";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "../hooks/useNotifications";
import { useCurrentUser } from "@/features/auth/hooks/useAuth";

export default function NotificationsPage() {
  const notifications = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const currentUser = useCurrentUser();
  const unreadCount =
    notifications.data?.filter((notification) => !notification.readAt).length ??
    0;

  return (
    <div className="page-content">
      <PageHeader
        title="Notifications"
        description="Order activity that needs your team’s attention."
        action={
          <div className="flex flex-wrap gap-2">
            {currentUser.data?.tenantRole === "manager" && (
              <Link
                className="button button-secondary"
                to="/notifications/messages"
              >
                <Mail size={16} />
                View Messages
              </Link>
            )}
            <button
              className="button button-secondary"
              disabled={!unreadCount || markAllRead.isPending}
              onClick={() =>
                markAllRead.mutate(undefined, {
                  onSuccess: () =>
                    toast.success("All notifications marked as read."),
                  onError: (error) => toast.error(getApiErrorMessage(error)),
                })
              }
            >
              Mark all read
            </button>
          </div>
        }
      />
      <section className="panel">
        {notifications.isPending ? (
          <PanelSkeleton label="Loading notifications" />
        ) : notifications.isError ? (
          <div className="empty-state">
            <b>Notifications could not be loaded</b>
            <button onClick={() => void notifications.refetch()}>Retry</button>
          </div>
        ) : notifications.data?.length ? (
          <ul className="notification-list">
            {notifications.data.map((notification) => (
              <li
                key={notification.id}
                className={notification.readAt ? "" : "is-unread"}
              >
                <div>
                  <b>{notification.title}</b>
                  <p>{notification.message}</p>
                  <small>{formatDateTime(notification.createdAt)}</small>
                </div>
                {!notification.readAt && (
                  <button
                    disabled={markRead.isPending}
                    onClick={() => markRead.mutate(notification.id)}
                  >
                    Mark read
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-state">
            <Bell size={22} />
            <b>No notifications</b>
            <span>New order activity will appear here.</span>
          </div>
        )}
      </section>
    </div>
  );
}

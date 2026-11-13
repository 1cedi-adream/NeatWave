import { Bell, Menu, Search } from 'lucide-react'
import { useSessionStore } from '../../store/sessionStore'
import { useNotificationStore } from '../../features/notifications/stores/notificationStore'

type TopBarProps = { section: string; onOpenMenu: () => void; onSearch: () => void; onNotifications: () => void; onProfile: () => void }

export function TopBar({ section, onOpenMenu, onSearch, onNotifications, onProfile }: TopBarProps) {
  const user = useSessionStore((state) => state.user)
  const hasUnread = useNotificationStore((state) => state.items.some((item) => !item.read))
  const initials = user?.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'U'
  return <header className="topbar"><button className="mobile-menu icon-button" onClick={onOpenMenu} aria-label="Open menu"><Menu size={20}/></button><div className="crumb">Workspace <span>/</span> <b>{section}</b></div><div className="top-actions"><div className="today-label"><span className="live-dot"/> Downtown shop</div><button className="top-icon" aria-label="Search orders" title="Search orders" onClick={onSearch}><Search size={18}/></button><button className="top-icon notification-button" aria-label="Notifications" onClick={onNotifications}><Bell size={18}/>{hasUnread && <i/>}</button><div className="top-divider"/><button className="avatar avatar-top" title="Open profile" aria-label="Open profile" onClick={onProfile}>{initials}</button></div></header>
}

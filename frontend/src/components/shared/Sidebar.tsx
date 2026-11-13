import { Activity, ArrowRight, Bell, CircleHelp, LayoutDashboard, LogOut, Settings, Shirt, Users, WashingMachine, X } from 'lucide-react'
import { useSessionStore } from '../../store/sessionStore'
import { useOrderStore } from '../../store/orderStore'
import { useNotificationStore } from '../../features/notifications/stores/notificationStore'

const primaryNavigation = [
  { label: 'Overview', icon: LayoutDashboard }, { label: 'Orders', icon: WashingMachine }, { label: 'Customers', icon: Users }, { label: 'Services', icon: Shirt },
]
const managementNavigation = [
  { label: 'Staff', icon: Activity }, { label: 'Notifications', icon: Bell }, { label: 'Settings', icon: Settings },
]

type SidebarProps = { section: string; mobileOpen: boolean; onNavigate: (label: string) => void; onClose: () => void; onLogout: () => void }

export function Sidebar({ section, mobileOpen, onNavigate, onClose, onLogout }: SidebarProps) {
  const user = useSessionStore((state) => state.user)
  const orderCount = useOrderStore((state) => state.orders.length)
  const unreadCount = useNotificationStore((state) => state.items.filter((item) => !item.read).length)
  const initials = user?.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'U'
  return <>
    <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-mark"><WashingMachine size={20} strokeWidth={2.1}/></div><span>washday<span className="brand-dot">.</span></span><button className="mobile-close icon-button" onClick={onClose} aria-label="Close menu"><X size={19}/></button></div>
      <div className="location-switch"><span className="location-icon"><span/></span><span className="location-copy"><b>Fresh & Fold</b><small>Downtown location</small></span></div>
      <div className="nav-label">WORKSPACE</div><nav>{primaryNavigation.map(({ label, icon: Icon }) => <button type="button" key={label} className={`nav-link ${section === label ? 'active' : ''}`} aria-current={section === label ? 'page' : undefined} onClick={() => onNavigate(label)}><Icon size={18}/><span>{label}</span>{label === 'Orders' && <i>{orderCount}</i>}</button>)}</nav>
      <div className="nav-label tools-label">MANAGE</div><nav>{managementNavigation.map(({ label, icon: Icon }) => <button type="button" key={label} className={`nav-link ${section === label ? 'active' : ''}`} aria-current={section === label ? 'page' : undefined} onClick={() => onNavigate(label)}><Icon size={18}/><span>{label}</span>{label === 'Notifications' && unreadCount > 0 && <i className="notification-count">{unreadCount}</i>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><CircleHelp size={17}/></div><b>Need help?</b><p>Contact the Fresh & Fold team about your shop account.</p><a href="mailto:hello@freshandfold.com">Email support <ArrowRight size={13}/></a></div><div className="profile"><div className="avatar avatar-staff">{initials}</div><span><b>{user?.name ?? 'Staff member'}</b><small>{user?.role ?? 'Staff'}</small></span><button className="ml-auto rounded-md p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800" onClick={onLogout} title="Sign out" aria-label="Sign out"><LogOut size={17}/></button></div></div>
    </aside>
    {mobileOpen && <button aria-label="Close navigation" className="mobile-backdrop" onClick={onClose}/>}
  </>
}

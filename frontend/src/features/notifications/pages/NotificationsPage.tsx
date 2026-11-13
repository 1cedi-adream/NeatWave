import { useMemo, useState } from 'react'
import { Bell, Check, CheckCheck, Clock3, PackageCheck, WashingMachine } from 'lucide-react'
import { PageHeader } from '../../../components/shared/PageHeader'
import { toast } from 'sonner'
import { useNotificationStore, type ShopNotification } from '../stores/notificationStore'

export default function NotificationsPage() {
  const items = useNotificationStore(state => state.items)
  const markAllRead = useNotificationStore(state => state.markAllRead)
  const toggleRead = useNotificationStore(state => state.toggleRead)
  const [filter, setFilter] = useState('All activity')
  const unread = items.filter(item => !item.read).length
  const visible = useMemo(() => items.filter(item => filter === 'All activity' || (filter === 'Unread' ? !item.read : item.read)), [items, filter])
  const Icon = ({ kind }: { kind: ShopNotification['kind'] }) => kind === 'ready' ? <PackageCheck size={18}/> : kind === 'delay' ? <Clock3 size={18}/> : <WashingMachine size={18}/>
  return <div className="page-content">
    <PageHeader title="Notifications" description="Order updates and shop activity." action={<button className="button button-secondary" disabled={!unread} onClick={() => { markAllRead(); toast.success('All notifications marked as read.'); }}><CheckCheck size={16}/> Mark all read</button>}/>
    <div className="notification-summary"><span className="notification-summary-icon"><Bell size={19}/></span><div><b>{unread} unread updates</b><small>Sample activity · read states stay in this session</small></div><span className="notification-summary-count">{unread}</span></div>
    <section className="panel notification-panel"><div className="notification-toolbar"><div className="segmented">{['All activity', 'Unread', 'Read'].map(name => <button type="button" key={name} className={filter === name ? 'selected' : ''} aria-pressed={filter === name} onClick={() => setFilter(name)}>{name}</button>)}</div></div><div className="notification-list">{visible.map(item => <article className={`notification-row ${item.read ? 'is-read' : ''}`} key={item.id}><span className={`notification-kind notification-${item.kind}`}><Icon kind={item.kind}/></span><div className="notification-copy"><b>{item.title}</b><p>{item.detail}</p><small>{item.time}</small></div>{!item.read && <span className="unread-dot" aria-label="Unread"/>}<button className="row-action" aria-pressed={item.read} onClick={() => toggleRead(item.id)}>{item.read ? 'Mark unread' : <><Check size={14}/> Mark read</>}</button></article>)}</div>{visible.length === 0 && <div className="empty-state"><Check size={22}/><b>You’re all caught up</b><span>No notifications in this view.</span></div>}</section>
  </div>
}

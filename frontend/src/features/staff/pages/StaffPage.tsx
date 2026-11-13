import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Activity, Plus, Search, Users, X } from 'lucide-react'
import { PageHeader } from '../../../components/shared/PageHeader'
import { CustomSelect } from '../../../components/ui/CustomSelect'
import { StatCard } from '../../../components/shared/StatCard'
import { toast } from 'sonner'

type StaffMember = { name: string; role: 'Manager' | 'Staff' | 'Superadmin'; email: string; orders: number; active: boolean }
const initialStaff: StaffMember[] = [
  { name: 'Jamie Lee', role: 'Manager', email: 'jamie@freshandfold.com', orders: 18, active: true },
  { name: 'Rosa Alvarez', role: 'Staff', email: 'rosa@freshandfold.com', orders: 24, active: true },
  { name: 'Darnell Brooks', role: 'Staff', email: 'darnell@freshandfold.com', orders: 16, active: true },
  { name: 'Priya Nair', role: 'Staff', email: 'priya@freshandfold.com', orders: 9, active: false },
]

export default function StaffPage() {
  const [staff, setStaff] = useState(initialStaff)
  const [query, setQuery] = useState('')
  const [adding, setAdding] = useState(false)
  const visible = useMemo(() => staff.filter(member => `${member.name} ${member.email} ${member.role}`.toLowerCase().includes(query.toLowerCase())), [staff, query])
  const addStaff = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); setStaff(current => [...current, { name: String(data.get('name')).trim(), role: String(data.get('role')) as StaffMember['role'], email: String(data.get('email')).trim(), orders: 0, active: true }]); setAdding(false); toast.success('Staff member added to the demo list.'); event.currentTarget.reset() }
  return <div className="page-content">
    <PageHeader title="Staff" description="Manage shop access and see who is handling orders." action={<button className="button button-primary" onClick={() => setAdding(true)}><Plus size={17}/> Add staff member</button>}/>
    <div className="stats-row"><StatCard label="Team members" value={String(staff.length)} caption="in this shop" icon={<Users size={18}/>} tone="mint"/><StatCard label="Active today" value={String(staff.filter(member => member.active).length)} caption="with shop access" icon={<Activity size={18}/>} tone="lavender"/><StatCard label="Orders handled" value={String(staff.reduce((sum, member) => sum + member.orders, 0))} caption="this week" icon={<Activity size={18}/>} tone="sky"/><StatCard label="Manager access" value={String(staff.filter(member => member.role !== 'Staff').length)} caption="assigned roles" icon={<Users size={18}/>} tone="peach"/></div>
    <p className="mb-4 text-xs text-gray-600">Sample staff records. New rows do not create sign-in access.</p>
    <section className="panel directory-panel"><div className="directory-toolbar"><div><h2>Team directory</h2><p>Roles determine which parts of the system each person can use.</p></div><label className="search-field directory-search"><Search size={15}/><input placeholder="Search staff" value={query} onChange={event => setQuery(event.target.value)}/></label></div><div className="table-scroll"><table><thead><tr><th>TEAM MEMBER</th><th>ROLE</th><th>ORDERS HANDLED</th><th>ACCESS</th><th/></tr></thead><tbody>{visible.map(member => <tr key={member.email}><td><div className="staff-name"><div className="avatar avatar-amber">{member.name.split(' ').map(part => part[0]).join('')}</div><span><b>{member.name}</b><small>{member.email}</small></span></div></td><td><span className={`role-tag role-${member.role.toLowerCase()}`}>{member.role}</span></td><td>{member.orders}</td><td><span className={`status ${member.active ? 'status-green' : 'status-rose'}`}><i/>{member.active ? 'Active' : 'Inactive'}</span></td><td><button className="row-action" onClick={() => setStaff(current => current.map(item => item.email === member.email ? { ...item, active: !item.active } : item))}>{member.active ? 'Deactivate' : 'Activate'}</button></td></tr>)}</tbody></table></div><div className="table-footer"><span><b>{visible.length}</b> team members</span><span>Roles: Superadmin, Manager, Staff</span></div></section>
    {adding && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setAdding(false) }}><section className="order-modal" role="dialog" aria-modal="true"><div className="modal-header"><div><h2>Add staff member</h2><p>Demo only; this does not create account access.</p></div><button className="icon-button" aria-label="Close" onClick={() => setAdding(false)}><X size={19}/></button></div><form onSubmit={addStaff}><label>Full name<input name="name" required placeholder="e.g. Alex Rivera"/></label><label>Email address<input name="email" type="email" required placeholder="alex@freshandfold.com"/></label><label>Role<CustomSelect name="role"><option>Staff</option><option>Manager</option><option>Superadmin</option></CustomSelect></label><div className="modal-actions"><button type="button" className="button button-secondary" onClick={() => setAdding(false)}>Cancel</button><button className="button button-primary" type="submit"><Plus size={16}/> Add to team</button></div></form></section></div>}
  </div>
}

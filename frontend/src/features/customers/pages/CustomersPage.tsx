import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Download, Pencil, Search, Users, X } from 'lucide-react'
import { PageHeader } from '../../../components/shared/PageHeader'
import { StatCard } from '../../../components/shared/StatCard'
import { useOrderStore } from '../../../store/orderStore'
import { toast } from 'sonner'
import type { FormEvent } from 'react'

type Customer = { name: string; phone: string; email: string; address: string; orders: number; lastVisit: string; sourceName?: string }
const sampleCustomers: Customer[] = [
  { name: 'Amara Okafor', phone: '(555) 014-6620', email: 'amara.o@email.com', address: '18 Pine Street', orders: 14, lastVisit: 'Today' },
  { name: 'Jonah Miller', phone: '(555) 019-4408', email: 'jonah.m@email.com', address: '204 Alder Avenue', orders: 8, lastVisit: 'Today' },
  { name: 'Sofia Chen', phone: '(555) 012-8831', email: 'sofia.chen@email.com', address: '77 Market Lane', orders: 21, lastVisit: 'Yesterday' },
  { name: 'Marcus Reed', phone: '(555) 018-2205', email: 'marcus.r@email.com', address: '9 Grove Road', orders: 3, lastVisit: 'Nov 10' },
  { name: 'Elena Petrova', phone: '(555) 016-3177', email: 'elena.p@email.com', address: '51 Cedar Court', orders: 11, lastVisit: 'Nov 9' },
  { name: 'Taylor Morgan', phone: '(555) 013-5574', email: 'taylor.m@email.com', address: '6 Willow Place', orders: 6, lastVisit: 'Nov 8' },
]

export default function CustomersPage() {
  const orders = useOrderStore(state => state.orders)
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try { return JSON.parse(localStorage.getItem('fresh-fold-customers') ?? 'null') ?? sampleCustomers }
    catch { return sampleCustomers }
  })
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Customer | null>(null)
  const [editing, setEditing] = useState(false)
  const customerRecords = useMemo(() => {
    const addedCustomers = new Map<string, Customer>()
    orders.forEach(order => {
      if (customers.some(customer => customer.name === order.name || customer.sourceName === order.name)) return
      const existing = addedCustomers.get(order.name)
      if (existing) {
        existing.orders += 1
        existing.phone = order.phone
        existing.lastVisit = order.due.split(',')[0]
      } else {
        addedCustomers.set(order.name, { name: order.name, sourceName: order.name, phone: order.phone, email: '—', address: 'Address not added', orders: 1, lastVisit: order.due.split(',')[0] })
      }
    })
    return [...customers, ...addedCustomers.values()]
  }, [orders, customers])
  const rows = useMemo(() => customerRecords.filter(customer => `${customer.name} ${customer.phone} ${customer.email}`.toLowerCase().includes(query.toLowerCase())), [customerRecords, query])
  const returningCount = customerRecords.filter(customer => customer.orders > 1).length
  const visitsToday = customerRecords.filter(customer => customer.lastVisit === 'Today').length
  const ordersOnFile = customerRecords.reduce((total, customer) => total + customer.orders, 0)
  useEffect(() => { localStorage.setItem('fresh-fold-customers', JSON.stringify(customers)) }, [customers])
  const saveCustomer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selected) return
    const data = new FormData(event.currentTarget)
    const updated = { ...selected, name: String(data.get('name')).trim(), phone: String(data.get('phone')).trim(), email: String(data.get('email')).trim(), address: String(data.get('address')).trim() }
    setCustomers(current => current.some(customer => customer.name === selected.name) ? current.map(customer => customer.name === selected.name ? updated : customer) : [...current, updated])
    setSelected(updated)
    setEditing(false)
    toast.success('Customer details updated in the demo list.')
  }
  const exportCsv = () => {
    const csv = ['Name,Phone,Email,Address,Orders,Last visit', ...rows.map(customer => [customer.name, customer.phone, customer.email, customer.address, customer.orders, customer.lastVisit].map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'fresh-and-fold-customers.csv'; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 0); toast.success('Customer list downloaded.')
  }
  return <div className="page-content">
    <PageHeader title="Customers" description="Customer records and visit history." action={<button className="button button-secondary" onClick={exportCsv}><Download size={16}/> Export CSV</button>}/>
    <div className="stats-row"><StatCard label="Customers" value={String(customerRecords.length)} caption="sample customer records" icon={<Users size={18}/>} tone="mint"/><StatCard label="Returning customers" value={String(returningCount)} caption="with more than one order" icon={<Users size={18}/>} tone="lavender"/><StatCard label="Orders on file" value={String(ordersOnFile)} caption="across listed customers" icon={<Users size={18}/>} tone="peach"/><StatCard label="Visits today" value={String(visitsToday)} caption="sample records last visited today" icon={<Users size={18}/>} tone="sky"/></div>
    <section className="panel directory-panel"><div className="directory-toolbar"><div><h2>Customer directory</h2><p>Customers are added when you create an order.</p></div><label className="search-field directory-search"><Search size={15}/><input placeholder="Search name, phone or email" value={query} onChange={event => setQuery(event.target.value)}/></label></div><div className="table-scroll"><table><caption className="sr-only">Customer names, contact details, order counts and recent visits</caption><thead><tr><th>CUSTOMER</th><th>PHONE</th><th>EMAIL</th><th>ORDERS</th><th>LAST VISIT</th><th>ACTIONS</th></tr></thead><tbody>{rows.map(customer => <tr key={customer.name}><td><div className="customer-cell"><div className="avatar avatar-green">{customer.name.split(' ').map(part => part[0]).join('')}</div><span>{customer.name}</span></div></td><td>{customer.phone}</td><td>{customer.email}</td><td>{customer.orders}</td><td>{customer.lastVisit}</td><td><button className="row-action" onClick={() => setSelected(customer)}>View profile <ArrowRight size={14}/></button></td></tr>)}</tbody></table>{rows.length === 0 && <div className="empty-state"><Users size={22}/><b>No matching customers</b><span>Try another name, phone number, or email.</span></div>}</div><div className="table-footer"><span><b>{rows.length}</b> customers</span><span>Sample customer records</span></div></section>
    {selected && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) { setSelected(null); setEditing(false) } }}><section className="profile-modal" role="dialog" aria-modal="true"><div className="modal-header"><div><h2>{editing ? 'Edit customer' : selected.name}</h2><p>{editing ? 'Update contact details.' : 'Customer profile'}</p></div><button className="icon-button" aria-label="Close profile" onClick={() => { setSelected(null); setEditing(false) }}><X size={19}/></button></div>{editing ? <form className="grid gap-4 p-5" onSubmit={saveCustomer}><label>Name<input name="name" required defaultValue={selected.name}/></label><label>Phone<input name="phone" type="tel" required defaultValue={selected.phone}/></label><label>Email<input name="email" type="email" defaultValue={selected.email === '—' ? '' : selected.email}/></label><label>Address<input name="address" required defaultValue={selected.address}/></label><div className="modal-actions"><button type="button" className="button button-secondary" onClick={() => setEditing(false)}>Cancel</button><button className="button button-primary" type="submit">Save changes</button></div></form> : <><div className="profile-details"><dl><dt>Phone</dt><dd>{selected.phone}</dd><dt>Email</dt><dd>{selected.email}</dd><dt>Address</dt><dd>{selected.address}</dd><dt>Orders</dt><dd>{selected.orders}</dd><dt>Last visit</dt><dd>{selected.lastVisit}</dd></dl><h3>Recent orders</h3><p>Order history is linked to the customer record when backend storage is connected.</p></div><div className="modal-actions px-5 pb-5"><button className="button button-secondary" onClick={() => setEditing(true)}><Pencil size={15}/> Edit details</button></div></>}</section></div>}
  </div>
}

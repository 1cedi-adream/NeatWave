import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Pencil, Plus, Search, Shirt, X } from 'lucide-react'
import { PageHeader } from '../../../components/shared/PageHeader'
import { toast } from 'sonner'
import { formatCurrency } from '../../../lib/formatCurrency'
import { CustomSelect } from '../../../components/ui/CustomSelect'

type Service = { name: string; category: string; rate: number; unit: string; turnaround: string; active: boolean }
const initialServices: Service[] = [
  { name: 'Wash & fold', category: 'Laundry', rate: 30.5, unit: 'per item', turnaround: '24 hours', active: true },
  { name: 'Dry cleaning', category: 'Special care', rate: 125, unit: 'per item', turnaround: '48 hours', active: true },
  { name: 'Wash & press', category: 'Laundry', rate: 39, unit: 'per item', turnaround: '24 hours', active: true },
  { name: 'Express wash', category: 'Express', rate: 90, unit: 'per load', turnaround: 'Same day', active: true },
  { name: 'Bedding', category: 'Special care', rate: 87, unit: 'per item', turnaround: '48 hours', active: true },
  { name: 'Shoe cleaning', category: 'Special care', rate: 75, unit: 'per pair', turnaround: '72 hours', active: false },
]

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>(() => {
    try { return JSON.parse(localStorage.getItem('fresh-fold-services') ?? 'null') ?? initialServices }
    catch { return initialServices }
  })
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All services')
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)
  const rows = useMemo(() => services.filter(service => (category === 'All services' || service.category === category) && service.name.toLowerCase().includes(query.toLowerCase())), [services, category, query])
  useEffect(() => { localStorage.setItem('fresh-fold-services', JSON.stringify(services)) }, [services])
  const saveService = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const updated: Service = { name: String(data.get('name')).trim(), category: String(data.get('category')), rate: Number(data.get('rate')), unit: String(data.get('unit')), turnaround: String(data.get('turnaround')).trim(), active: editing?.active ?? true }
    if (editing) {
      setServices(current => current.map(item => item.name === editing.name ? updated : item))
      toast.success('Service details updated in the demo list.')
    } else {
      setServices(current => [...current, updated])
      toast.success('Service added to the demo list.')
    }
    setAdding(false)
    setEditing(null)
    event.currentTarget.reset()
  }
  return <div className="page-content">
    <PageHeader title="Services" description="Set prices and turnaround times for the work your shop offers." action={<button className="button button-primary" onClick={() => { setEditing(null); setAdding(true) }}><Plus size={17}/> Add service</button>}/>
    <div className="service-summary"><div><span className="service-summary-icon"><Shirt size={19}/></span><span><b>{services.filter(service => service.active).length} active services</b><small>Sample menu · changes are not sent to a backend</small></span></div><span className="service-sample">Service prices shown in GHS</span></div>
    <section className="panel directory-panel"><div className="directory-toolbar"><div><h2>Service menu</h2><p>Update the services customers can order.</p></div><label className="search-field directory-search"><Search size={15}/><input placeholder="Find a service" value={query} onChange={event => setQuery(event.target.value)}/></label></div><div className="service-filters">{['All services', 'Laundry', 'Special care', 'Express'].map(name => <button key={name} className={category === name ? 'selected' : ''} onClick={() => setCategory(name)}>{name}</button>)}</div><div className="table-scroll"><table><thead><tr><th>SERVICE</th><th>CATEGORY</th><th>PRICE</th><th>TURNAROUND</th><th>STATUS</th><th/></tr></thead><tbody>{rows.map(service => <tr key={service.name}><td><b className="service-name">{service.name}</b></td><td>{service.category}</td><td><b>{formatCurrency(service.rate)}</b> <span className="muted">{service.unit}</span></td><td>{service.turnaround}</td><td><span className={`status ${service.active ? 'status-green' : 'status-rose'}`}><i/>{service.active ? 'Active' : 'Inactive'}</span></td><td><div className="flex items-center gap-3"><button className="row-action inline-flex items-center gap-1" onClick={() => { setEditing(service); setAdding(true) }}><Pencil size={13}/> Edit</button><button className="row-action" onClick={() => setServices(current => current.map(item => item.name === service.name ? { ...item, active: !item.active } : item))}>{service.active ? 'Deactivate' : 'Activate'}</button></div></td></tr>)}</tbody></table>{rows.length === 0 && <div className="empty-state"><Shirt size={22}/><b>No services match</b><span>Clear the search or choose another category.</span></div>}</div></section>
    {adding && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) { setAdding(false); setEditing(null) } }}><section className="order-modal" role="dialog" aria-modal="true"><div className="modal-header"><div><h2>{editing ? 'Edit service' : 'Add a service'}</h2><p>{editing ? 'Update the service details and price.' : 'Add a price and estimated turnaround.'}</p></div><button className="icon-button" aria-label="Close" onClick={() => { setAdding(false); setEditing(null) }}><X size={19}/></button></div><form onSubmit={saveService}><label>Service name<input name="name" required placeholder="e.g. Curtain cleaning" defaultValue={editing?.name}/></label><div className="form-row"><label>Category<CustomSelect name="category" defaultValue={editing?.category ?? 'Laundry'}><option>Laundry</option><option>Special care</option><option>Express</option></CustomSelect></label><label>Price (GHS)<input name="rate" type="number" min="0.01" step="0.01" required placeholder="0.00" defaultValue={editing?.rate}/></label></div><div className="form-row"><label>Priced by<CustomSelect name="unit" defaultValue={editing?.unit ?? 'per item'}><option>per item</option><option>per load</option><option>per kilogram</option><option>per pair</option></CustomSelect></label><label>Turnaround<input name="turnaround" required placeholder="e.g. 24 hours" defaultValue={editing?.turnaround}/></label></div><div className="modal-actions"><button type="button" className="button button-secondary" onClick={() => { setAdding(false); setEditing(null) }}>Cancel</button><button className="button button-primary" type="submit"><Plus size={16}/> {editing ? 'Save changes' : 'Save service'}</button></div></form></section></div>}
  </div>
}

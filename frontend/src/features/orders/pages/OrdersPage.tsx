import { useState } from 'react'
import type { FormEvent } from 'react'
import { Download, Plus, WashingMachine } from 'lucide-react'
import { PageHeader } from '../../../components/shared/PageHeader'
import { StatCard } from '../../../components/shared/StatCard'
import { OrdersTable } from '../components/OrdersTable'
import { CreateOrderDialog, ReceiptPreview } from '../components/CreateOrderDialog'
import { useOrderStore } from '../../../store/orderStore'
import type { Receipt } from '../types/order'
import { downloadOrdersCsv } from '../lib/downloadOrdersCsv'
import { toast } from 'sonner'
import type { OrderStatus } from '../../../constants/orderStatuses'

export default function OrdersPage() {
  const orders = useOrderStore(state => state.orders)
  const createOrder = useOrderStore(state => state.createOrder)
  const updateOrderStatus = useOrderStore(state => state.updateOrderStatus)
  const inProgressCount = orders.filter(order => ['Washing', 'Drying', 'Ironing'].includes(order.status)).length
  const readyCount = orders.filter(order => order.status === 'Ready for Pickup').length
  const completedCount = orders.filter(order => order.status === 'Completed').length
  const [tab, setTab] = useState(new URLSearchParams(location.search).get('status') === 'ready' ? 'Ready for Pickup' : 'All orders')
  const [creating, setCreating] = useState(false)
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const saveOrder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const values = new FormData(event.currentTarget)
    const items = values.getAll('itemName').map((name, index) => `${String(values.getAll('itemQuantity')[index])} ${String(name).trim()}`).join(', ')
    setReceipt(createOrder(String(values.get('name')).trim(), items, Number(values.get('amountDue')), String(values.get('payment')))); setCreating(false); event.currentTarget.reset()
  }
  const changeStatus = (orderId: string, status: OrderStatus) => { updateOrderStatus(orderId, status); toast.success(`Order ${orderId} moved to ${status}.`) }
  return <div className="page-content">
    <PageHeader title="Orders" description="Track laundry from drop-off through pickup." action={<><button className="button button-secondary" onClick={() => { downloadOrdersCsv(orders); toast.success('Order list downloaded.'); }}><Download size={16}/> Export list</button><button className="button button-primary" onClick={() => setCreating(true)}><Plus size={17}/> New order</button></>}/>
    <p className="mb-4 text-xs text-gray-600">Sample order data. New orders stay in this session.</p>
    <div className="stats-row"><StatCard label="Orders in list" value={String(orders.length)} caption="sample records" icon={<WashingMachine size={18}/>} tone="mint"/><StatCard label="In progress" value={String(inProgressCount)} caption="washing, drying or ironing" icon={<WashingMachine size={18}/>} tone="lavender"/><StatCard label="Ready for pickup" value={String(readyCount)} caption="awaiting collection" icon={<WashingMachine size={18}/>} tone="peach"/><StatCard label="Completed" value={String(completedCount)} caption="sample records marked complete" icon={<WashingMachine size={18}/>} tone="sky"/></div>
    <div className="orders-page-table"><OrdersTable orders={orders} section="Orders" tab={tab} onTabChange={setTab} onViewAll={() => setTab('All orders')} onNotice={(message) => toast.info(message)} onStatusChange={changeStatus}/></div>
    {creating && <CreateOrderDialog onClose={() => setCreating(false)} onSave={saveOrder}/>}{receipt && <ReceiptPreview receipt={receipt} onClose={() => setReceipt(null)}/>}
  </div>
}

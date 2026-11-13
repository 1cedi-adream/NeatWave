import { Suspense, lazy, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Check,
  Clock3,
  Download,
  Plus,
  Users,
  WashingMachine,
} from "lucide-react";
import { StatCard } from "../../../components/shared/StatCard";
import { PageHeader } from "../../../components/shared/PageHeader";
import {
  CreateOrderDialog,
  ReceiptPreview,
} from "../../orders/components/CreateOrderDialog";
import { useOrderStore } from "../../../store/orderStore";
import { useSessionStore } from "../../../store/sessionStore";
import { downloadOrdersCsv } from "../../orders/lib/downloadOrdersCsv";
import type { Receipt } from "../../orders/types/order";
import { toast } from "sonner";
import { formatCurrency } from "../../../lib/formatCurrency";

const OrderStatusChart = lazy(() => import("../components/OrderStatusChart"));

export default function DashboardPage() {
  const navigate = useNavigate();
  const orders = useOrderStore((state) => state.orders);
  const createOrder = useOrderStore((state) => state.createOrder);
  const user = useSessionStore((state) => state.user);
  const inProgressOrders = orders.filter((order) => order.status === "Washing" || order.status === "Out for Delivery");
  const readyOrders = orders.filter((order) => order.status === "Ready for Pickup");
  const orderValue = orders.reduce((total, order) => total + Number(order.amount.replace(/[^\d.]/g, "")), 0);
  const [createOpen, setCreateOpen] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const onSaveOrder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const result = createOrder(
      String(data.get("name")).trim(),
      String(data.get("phone")).trim(),
      "Items not specified",
      Number(data.get("amountDue")),
      String(data.get("payment")),
    );
    setCreateOpen(false);
    setReceipt(result);
    event.currentTarget.reset();
  };
  return (
    <div className="page-content">
      <PageHeader
        title={`Hello, ${user?.name.split(" ")[0] ?? "there"}`}
        description="Review the current orders and shop activity."
        action={
          <>
            <button
              className="button button-secondary"
              onClick={() => { downloadOrdersCsv(orders); toast.success("Order list downloaded."); }}
            >
              <Download size={16} /> Export
            </button>
            <button
              className="button button-primary"
              onClick={() => setCreateOpen(true)}
            >
              <Plus size={17} /> New order
            </button>
          </>
        }
      />
      <div className="stats-row">
        <StatCard
          label="Sample orders"
          value={String(orders.length)}
          caption="in the current order list"
          icon={<WashingMachine size={18} />}
          tone="mint"
        />
        <StatCard
          label="In progress"
          value={String(inProgressOrders.length)}
          caption="washing, drying or ironing"
          icon={<Clock3 size={18} />}
          tone="lavender"
        />
        <StatCard
          label="Ready for pickup"
          value={String(readyOrders.length)}
          caption="ready for pickup"
          icon={<Check size={18} />}
          tone="peach"
        />
        <StatCard
          label="Listed order value"
          value={formatCurrency(orderValue)}
          caption="total value in sample orders"
          icon={<Activity size={18} />}
          tone="sky"
        />
      </div>
      <div className="overview-grid">
        <Suspense fallback={<section className="panel status-chart-panel" aria-busy="true"><div className="panel-heading"><div><h2>Orders by status</h2><p>Loading current order totals…</p></div></div><div className="status-chart-canvas animate-pulse rounded-lg bg-gray-50" /></section>}>
          <OrderStatusChart orders={orders} onViewOrders={() => navigate("/orders")} />
        </Suspense>
        <div className="right-column">
          <section className="pickup-card">
            <div className="pickup-head">
              <div className="pickup-icon">
                <Clock3 size={17} />
              </div>
              <span>UP NEXT</span>
            </div>
            <div className="pickup-time">
              {readyOrders[0]?.due.split(", ").slice(1).join(", ") ?? "—"}
            </div>
            <h3>{readyOrders.length ? `${readyOrders.length} ${readyOrders.length === 1 ? "order" : "orders"} ready for pickup` : "No orders ready for pickup"}</h3>
            <p>{readyOrders.length ? "Review the current ready orders." : "Ready orders will appear here."}</p>
            <button onClick={() => navigate("/orders?status=ready")}>
              Review ready orders <ArrowRight size={15} />
            </button>
          </section>
          <section className="panel order-records-card">
            <div className="lower-title">
              <span className="lower-icon"><Users size={18} /></span>
              <span>
                <b>Order records</b>
                <small>Sample data for this session</small>
              </span>
            </div>
            <div className="repeat-number">
              <b>{orders.length}</b>
              <span>sample orders</span>
            </div>
            <button className="text-link" onClick={() => navigate("/customers")}>
              Customer list <ArrowRight size={15} />
            </button>
          </section>
        </div>
      </div>
      {createOpen && (
        <CreateOrderDialog
          onClose={() => setCreateOpen(false)}
          onSave={onSaveOrder}
        />
      )}
      {receipt && (
        <ReceiptPreview receipt={receipt} onClose={() => setReceipt(null)} />
      )}
    </div>
  );
}

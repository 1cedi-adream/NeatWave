import { useState } from "react";
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
import { OrdersTable } from "../../orders/components/OrdersTable";
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
import type { OrderStatus } from "../../../constants/orderStatuses";

export default function DashboardPage() {
  const navigate = useNavigate();
  const orders = useOrderStore((state) => state.orders);
  const createOrder = useOrderStore((state) => state.createOrder);
  const updateOrderStatus = useOrderStore((state) => state.updateOrderStatus);
  const user = useSessionStore((state) => state.user);
  const inProgressOrders = orders.filter((order) => ["Washing", "Drying", "Ironing"].includes(order.status));
  const readyOrders = orders.filter((order) => order.status === "Ready for Pickup");
  const orderValue = orders.reduce((total, order) => total + Number(order.amount.replace(/[^\d.]/g, "")), 0);
  const [createOpen, setCreateOpen] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [tab, setTab] = useState("All orders");
  const onSaveOrder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const result = createOrder(
      String(data.get("name")).trim(),
      data.getAll("itemName").map((name, index) => `${String(data.getAll("itemQuantity")[index])} ${String(name).trim()}`).join(", "),
      Number(data.get("amountDue")),
      String(data.get("payment")),
    );
    setCreateOpen(false);
    setReceipt(result);
    event.currentTarget.reset();
  };
  const changeStatus = (orderId: string, status: OrderStatus) => { updateOrderStatus(orderId, status); toast.success(`Order ${orderId} moved to ${status}.`); };
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
        <OrdersTable
          orders={orders}
          section="Overview"
          tab={tab}
          onTabChange={setTab}
          onViewAll={() => navigate("/orders")}
          onNotice={(message) => toast.info(message)}
          onStatusChange={changeStatus}
        />
        <div className="right-column">
          <section className="panel flow-panel">
            <div className="panel-heading compact">
              <div>
                <h2>Shop floor</h2>
                <p>Orders moving through today.</p>
              </div>
            </div>
            <div className="flow-total">
              <b>{orders.length}</b>
              <span>orders in sample data</span>
            </div>
            <div className="flow-bars">
              {[
                { label: "Received", value: orders.filter((order) => order.status === "Received").length, color: "bar-violet" },
                { label: "Washing", value: orders.filter((order) => order.status === "Washing").length, color: "bar-blue" },
                { label: "Drying", value: orders.filter((order) => order.status === "Drying").length, color: "bar-amber" },
                { label: "Ironing", value: orders.filter((order) => order.status === "Ironing").length, color: "bar-amber" },
                { label: "Ready", value: readyOrders.length, color: "bar-green" },
              ].map((item) => (
                <div className="flow-row" key={item.label}>
                  <div className="flow-label">
                    <span>{item.label}</span>
                    <b>{item.value}</b>
                  </div>
                  <div className="bar-track">
                    <span
                      className={item.color}
                      style={{ width: `${orders.length ? (item.value / orders.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <button className="flow-link" onClick={() => navigate("/orders")}>
              See order queue <ArrowRight size={15} />
            </button>
          </section>
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
        </div>
      </div>
      <section className="lower-strip">
        <div className="lower-title">
          <span className="lower-icon">
            <Users size={18} />
          </span>
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
      <footer className="page-footer">
        <span>
          Fresh & Fold <span>·</span> Downtown
        </span>
        <span>Sample shop data</span>
      </footer>
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

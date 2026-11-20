import { useMemo, useState } from "react";
import {
  Check,
  Clock3,
  Inbox,
  Plus,
  Search,
  Users,
  WashingMachine,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  CardSkeletonGrid,
  TableSkeleton,
} from "@/components/shared/LoadingSkeletons";
import { StatCard } from "@/components/shared/StatCard";
import { Pagination, usePagination } from "@/components/shared/Pagination";
import { formatCurrency } from "@/lib/formatCurrency";
import { formatDateTime } from "@/lib/formatDate";
import { useCurrentUser } from "@/features/auth/hooks/useAuth";
import { useDashboard } from "../hooks/useDashboard";
import { CreateOrderDialog } from "@/features/orders/components/CreateOrderDialog";

export default function DashboardPage() {
  const [orderSearch, setOrderSearch] = useState("");
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const { data: user } = useCurrentUser();
  const { data, isPending, isError, refetch } = useDashboard();
  const filteredReadyOrders = useMemo(() => {
    const searchValue = orderSearch.trim().toLowerCase();
    if (!searchValue) return data?.readyOrders ?? [];
    return (data?.readyOrders ?? []).filter((order) =>
      order.orderNumber.toLowerCase().includes(searchValue),
    );
  }, [data?.readyOrders, orderSearch]);
  const pagination = usePagination(filteredReadyOrders);

  if (isPending)
    return (
      <div className="page-content">
        <PageHeader
          title="Shop overview"
          description="Review current shop activity."
        />
        <CardSkeletonGrid label="Loading dashboard cards" />
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Ready orders</h2>
              <p>Orders awaiting customer pickup.</p>
            </div>
          </div>
          <TableSkeleton label="Loading ready orders" columns={3} rows={4} />
        </section>
      </div>
    );

  if (isError)
    return (
      <div className="page-content">
        <PageHeader
          title="Shop overview"
          description="Review current shop activity."
        />
        <div className="empty-state panel" role="alert">
          <b>Dashboard could not be loaded</b>
          <span>Check your connection, then try again.</span>
          <button
            className="button button-secondary"
            onClick={() => void refetch()}
          >
            Retry dashboard
          </button>
        </div>
      </div>
    );

  const washing =
    data?.ordersByStatus.find((item) => item.status === "Washing")?.value ?? 0;
  const received =
    data?.ordersByStatus.find((item) => item.status === "Received")?.value ?? 0;

  return (
    <div className="page-content">
      <PageHeader
        title={`Hello, ${user?.name.split(" ")[0] ?? "there"}`}
        description="Review current shop activity."
      />
      <div className="stats-row">
        <StatCard
          label="Orders"
          value={String(data?.totalOrders ?? 0)}
          caption="all orders"
          icon={<WashingMachine size={18} />}
          tone="mint"
        />
        <StatCard
          label="Washing"
          value={String(washing)}
          caption="in progress"
          icon={<Clock3 size={18} />}
          tone="lavender"
        />
        <StatCard
          label="Ready for pickup"
          value={String(data?.readyOrders.length ?? 0)}
          caption="awaiting collection"
          icon={<Check size={18} />}
          tone="peach"
        />
        {user?.tenantRole === "manager" && (
          <StatCard
            label="Order value"
            value={formatCurrency((data?.totalOrderValuePesewas ?? 0) / 100)}
            caption={`${data?.customerCount ?? 0} customers`}
            icon={<Users size={18} />}
            tone="sky"
          />
        )}
        {user?.tenantRole === "staff" && (
          <StatCard
            label="Received"
            value={String(received)}
            caption="awaiting washing"
            icon={<Inbox size={18} />}
            tone="sky"
          />
        )}
      </div>
      <div className="overview-order-toolbar">
        <label className="search-field">
          <Search size={17} aria-hidden="true" />
          <input
            aria-label="Search ready orders"
            placeholder="Search ready orders"
            value={orderSearch}
            onChange={(event) => setOrderSearch(event.target.value)}
          />
        </label>
        <button
          type="button"
          className="button button-primary"
          onClick={() => setShowCreateOrder(true)}
        >
          <Plus size={16} />
          Create an order
        </button>
      </div>
      <section className="panel directory-panel">
        <div className="panel-heading">
          <div>
            <h2>Ready orders</h2>
            <p>Orders awaiting customer pickup.</p>
          </div>
        </div>
        {filteredReadyOrders.length ? (
          <>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>ORDER</th>
                    <th>DUE</th>
                    <th>TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.items.map((order) => (
                    <tr key={order.id}>
                      <td>{order.orderNumber}</td>
                      <td>{formatDateTime(order.dueAt)}</td>
                      <td>{formatCurrency(order.totalPesewas / 100)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination {...pagination} label="ready orders" />
          </>
        ) : (
          <div className="empty-state">
            <Check size={22} />
            <b>
              {orderSearch ? "No matching ready orders" : "No orders ready"}
            </b>
            <span>
              {orderSearch
                ? "Try a different order number."
                : "Ready orders will appear here."}
            </span>
          </div>
        )}
      </section>
      {showCreateOrder && (
        <CreateOrderDialog
          onClose={() => setShowCreateOrder(false)}
          onCreated={() => setShowCreateOrder(false)}
        />
      )}
    </div>
  );
}

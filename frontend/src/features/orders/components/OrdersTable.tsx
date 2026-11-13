import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ListFilter,
  Search,
  WashingMachine,
} from "lucide-react";
import type { Order } from "../types/order";
import type { OrderStatus } from "../../../constants/orderStatuses";
import { CustomSelect } from "../../../components/ui/CustomSelect";

const orderTableStatuses = ["Received", "Washing", "Ready for Pickup", "Out for Delivery"] as const;

const statusClass: Record<string, string> = {
  Washing: "blue",
  "Ready for Pickup": "green",
  Drying: "amber",
  Received: "violet",
  Ironing: "rose",
  "Out for Delivery": "violet",
  Completed: "green",
  Cancelled: "rose",
};
type OrdersTableProps = {
  orders: Order[];
  tab: string;
  onTabChange: (tab: string) => void;
  onNotice: (message: string) => void;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
};

export function OrdersTable({
  orders,
  tab,
  onTabChange,
  onNotice,
  onStatusChange,
}: OrdersTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All orders");
  const [page, setPage] = useState(1);
  const filtered = useMemo(
    () =>
      orders.filter(
        (order) =>
          `${order.id} ${order.name} ${order.items} ${order.status}`
            .toLowerCase()
            .includes(search.toLowerCase()) &&
          (statusFilter === "All orders" || order.status === statusFilter) &&
          (tab === "All orders" ||
            (tab === "In progress"
              ? !["Ready for Pickup", "Completed", "Cancelled"].includes(
                  order.status,
                )
              : order.status === "Ready for Pickup")),
      ),
    [orders, search, statusFilter, tab],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / 5));
  const pageOrders = filtered.slice((page - 1) * 5, page * 5);

  return (
    <section className="panel orders-panel">
      <div className="panel-heading">
        <div>
          <h2>
            "All orders"
          </h2>
          <p>
            "Search, filter, and update orders across your shop."
          </p>
        </div>
      </div>
      <div className="table-toolbar">
        <div className="segmented">
          {["All orders", "In progress", "Ready"].map((name) => (
            <button
              key={name}
              className={
                tab === (name === "Ready" ? "Ready for Pickup" : name)
                  ? "selected"
                  : ""
              }
              onClick={() => {
                setPage(1);
                onTabChange(name === "Ready" ? "Ready for Pickup" : name);
              }}
              aria-pressed={tab === (name === "Ready" ? "Ready for Pickup" : name)}
            >
              {name}
              {name === "All orders" && <span>{orders.length}</span>}
            </button>
          ))}
        </div>
        <div className="table-tools">
          <label className="search-field">
            <Search size={15} />
            <input
              id="order-search"
              aria-label="Search orders"
              placeholder="Search orders"
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            />
          </label>
          <label className="filter-select">
            <ListFilter size={15} />
            <CustomSelect
              variant="compact"
              value={statusFilter}
              onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}
              aria-label="Filter by status"
            >
              <option>All orders</option>
              {orderTableStatuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </CustomSelect>
          </label>
        </div>
      </div>
      <div className="table-scroll">
        <table>
          <caption className="sr-only">Laundry orders with customer, due date, status and amount due</caption>
          <thead>
            <tr>
              <th>ORDER</th>
              <th>CUSTOMER</th>
              <th>DUE BY</th>
              <th>STATUS</th>
              <th className="amount-col">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {pageOrders.map((order) => (
              <tr key={order.id}>
                <td>
                  <button
                    className="order-id"
                    onClick={() =>
                      onNotice(
                        `${order.id} · ${order.name} · ${order.amount}`,
                      )
                    }
                  >
                    {order.id}
                  </button>
                </td>
                <td>
                  <div className="customer-cell">
                    <div className={`avatar avatar-${order.tone}`}>
                      {order.initials}
                    </div>
                    <span>{order.name}</span>
                  </div>
                </td>
                <td>
                  <span
                    className={`due ${order.due.startsWith("Today") ? "" : "muted"}`}
                  >
                    {order.due}
                  </span>
                </td>
                <td>
                  <CustomSelect
                    variant="status"
                    className={`status-${statusClass[order.status] || "blue"} cursor-pointer`}
                    aria-label={`Change status for ${order.id}`}
                    value={order.status}
                    onChange={(event) => onStatusChange(order.id, event.target.value as OrderStatus)}
                  >
                    {orderTableStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                  </CustomSelect>
                </td>
                <td className="amount-col">{order.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="empty-state">
            <WashingMachine size={22} />
            <b>No orders match that search</b>
            <span>Try a different name, order number or status.</span>
          </div>
        )}
      </div>
      <div className="table-footer">
        <span>
          Showing <b>{filtered.length === 0 ? 0 : (page - 1) * 5 + 1}–{Math.min(page * 5, filtered.length)}</b> of{" "}
          <b>{filtered.length}</b> sample orders
        </span>
        <div>
          <button aria-label="Previous page" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
            <ChevronLeft size={16} />
          </button>
          <span aria-live="polite">{page} / {totalPages}</span>
          <button aria-label="Next page" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}

import { useState } from "react";
import { Download, LoaderCircle, Plus, WashingMachine } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { TableSkeleton } from "@/components/shared/LoadingSkeletons";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { formatCurrency } from "@/lib/formatCurrency";
import { formatDateTime } from "@/lib/formatDate";
import { getApiErrorMessage } from "@/lib/apiError";
import type { OrderStatus } from "@/constants/orderStatuses";
import { exportOrders } from "../api/ordersApi";
import { CreateOrderDialog } from "../components/CreateOrderDialog";
import { OrderDetailDialog } from "../components/OrderDetailDialog";
import { useOrders, useUpdateOrderStatus } from "../hooks/useOrders";

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<OrderStatus | undefined>();
  const [creating, setCreating] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const orders = useOrders({
    page,
    pageSize: 10,
    search: search || undefined,
    status,
  });
  const updateStatus = useUpdateOrderStatus();

  async function download(period: string) {
    setExporting(true);
    setExportOpen(false);
    try {
      const rows = await exportOrders(period);
      const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
      const csv = [
        "Order,Customer,Phone,Status,Total",
        ...rows.map(({ order, customerName, customerPhone }) =>
          [
            order.orderNumber,
            customerName,
            customerPhone,
            order.status,
            (order.totalPesewas / 100).toFixed(2),
          ]
            .map((value) => escape(String(value)))
            .join(","),
        ),
      ].join("\n");
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `neatwave-orders-${period}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not export orders."));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="page-content">
      <PageHeader
        title="Orders"
        description="Track laundry from drop-off through pickup."
        action={
          <>
            <div className="export-menu-wrap">
              <button
                className="button button-secondary"
                aria-expanded={exportOpen}
                onClick={() => setExportOpen(!exportOpen)}
                disabled={exporting}
              >
                {exporting ? (
                  <LoaderCircle className="animate-spin" size={16} />
                ) : (
                  <Download size={16} />
                )}
                {exporting ? "Exporting…" : "Export"}
              </button>
              {exportOpen && (
                <div className="export-menu" role="menu">
                  {[
                    ["today", "Today"],
                    ["yesterday", "Yesterday"],
                    ["last-week", "Last week"],
                    ["last-month", "Last month"],
                    ["last-year", "Last year"],
                    ["all-time", "All time"],
                  ].map(([period, label]) => (
                    <button
                      key={period}
                      role="menuitem"
                      onClick={() => void download(period)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              className="button button-primary"
              onClick={() => setCreating(true)}
            >
              <Plus size={16} />
              New order
            </button>
          </>
        }
      />
      <section className="panel orders-panel">
        <div className="table-toolbar">
          <label className="search-field">
            <input
              aria-label="Search orders"
              placeholder="Search orders"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </label>
          <CustomSelect
            value={status ?? ""}
            onChange={(event) => {
              setStatus(
                (event.target.value || undefined) as OrderStatus | undefined,
              );
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option>Received</option>
            <option>Washing</option>
            <option>Ready for Pickup</option>
          </CustomSelect>
        </div>
        {orders.isPending ? (
          <TableSkeleton label="Loading orders" columns={5} />
        ) : orders.isError ? (
          <div className="empty-state">
            <b>Orders could not be loaded</b>
            <button onClick={() => void orders.refetch()}>Retry</button>
          </div>
        ) : orders.data?.data.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>ORDER</th>
                  <th>CUSTOMER</th>
                  <th>DUE</th>
                  <th>STATUS / NEXT STEP</th>
                  <th>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {orders.data.data.map(({ order, customerName }) => (
                  <tr key={order.id}>
                    <td>
                      <button
                        className="text-link"
                        onClick={() => setSelectedOrderId(order.id)}
                      >
                        {order.orderNumber}
                      </button>
                    </td>
                    <td>{customerName}</td>
                    <td>{formatDateTime(order.dueAt)}</td>
                    <td>
                      {order.status === "Ready for Pickup" ? (
                        <span className="order-status-label">
                          Ready for Pickup
                        </span>
                      ) : (
                        <div className="order-status-action">
                          <CustomSelect
                            aria-label={`Update status for order ${order.orderNumber}`}
                            variant="status"
                            value={order.status}
                            disabled={updatingOrderId === order.id}
                            onChange={(event) => {
                              setUpdatingOrderId(order.id);
                              updateStatus.mutate(
                                {
                                  id: order.id,
                                  status: event.target.value as OrderStatus,
                                },
                                {
                                  onSuccess: () =>
                                    toast.success("Order status updated."),
                                  onError: (error) =>
                                    toast.error(getApiErrorMessage(error)),
                                  onSettled: () => setUpdatingOrderId(null),
                                },
                              );
                            }}
                          >
                            {order.status === "Received" && (
                              <>
                                <option>Received</option>
                                <option>Washing</option>
                              </>
                            )}
                            {order.status === "Washing" && (
                              <>
                                <option>Washing</option>
                                <option>Ready for Pickup</option>
                              </>
                            )}
                          </CustomSelect>
                        </div>
                      )}
                      {updatingOrderId === order.id && (
                        <LoaderCircle
                          className="status-saving animate-spin"
                          size={16}
                          aria-label="Updating order status"
                        />
                      )}
                    </td>
                    <td>{formatCurrency(order.totalPesewas / 100)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <WashingMachine size={22} />
            <b>No orders found</b>
            <span>Create the first order or change your filters.</span>
          </div>
        )}
        {(orders.data?.meta.total ?? 0) > 10 && (
          <div className="table-footer">
            <span>{orders.data?.meta.total ?? 0} orders</span>
            <div>
              <button
                disabled={page === 1}
                onClick={() => setPage((value) => value - 1)}
              >
                Previous
              </button>
              <span>{page}</span>
              <button
                disabled={page >= (orders.data?.meta.totalPages ?? 1)}
                onClick={() => setPage((value) => value + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
      {creating && (
        <CreateOrderDialog
          onClose={() => setCreating(false)}
          onCreated={(orderId) => {
            setCreating(false);
            setSelectedOrderId(orderId);
          }}
        />
      )}
      {selectedOrderId && (
        <OrderDetailDialog
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId("")}
        />
      )}
    </div>
  );
}

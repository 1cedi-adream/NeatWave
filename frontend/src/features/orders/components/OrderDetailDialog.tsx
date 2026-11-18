import { Download, ExternalLink, LoaderCircle, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/shared/LoadingSkeletons";
import { formatCurrency } from "@/lib/formatCurrency";
import { formatDateTime } from "@/lib/formatDate";
import { getApiErrorMessage } from "@/lib/apiError";
import { useCurrentUser } from "@/features/auth/hooks/useAuth";
import { downloadOrderReceipt } from "../api/ordersApi";
import { useOrder } from "../hooks/useOrders";

export function OrderDetailDialog({
  orderId,
  onClose,
}: {
  orderId: string;
  onClose: () => void;
}) {
  const order = useOrder(orderId);
  const currentUser = useCurrentUser();
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownloadReceipt() {
    if (!order.data) return;
    setIsDownloading(true);
    try {
      const pdf = await downloadOrderReceipt(orderId);
      const downloadUrl = URL.createObjectURL(pdf);
      const downloadLink = document.createElement("a");
      downloadLink.href = downloadUrl;
      downloadLink.download = `${order.data.receipt?.receiptNumber ?? order.data.orderNumber}-receipt.pdf`;
      document.body.append(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      toast.success("Receipt downloaded.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not generate the receipt."));
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <section
        className="order-modal order-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-detail-title"
      >
        <div className="modal-header">
          <div>
            <h2 id="order-detail-title">
              {order.data?.orderNumber ?? "Order details"}
            </h2>
            <p>Saved receipt and order activity.</p>
          </div>
          <button className="icon-button" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        {order.isPending ? (
          <div className="order-detail-content">
            <div
              className="detail-skeleton"
              role="status"
              aria-label="Loading receipt"
            >
              <span />
              <span />
              <span />
              <span />
            </div>
            <TableSkeleton
              label="Loading receipt services"
              columns={3}
              rows={3}
            />
          </div>
        ) : order.isError || !order.data ? (
          <div className="empty-state">
            <b>Order could not be loaded</b>
            <button onClick={() => void order.refetch()}>Retry</button>
          </div>
        ) : (
          <div className="order-detail-content">
            <div className="receipt-customer-grid">
              <div>
                <small>Name</small>
                <b>{order.data.customer.fullName}</b>
              </div>
              <div>
                <small>Phone</small>
                <b>{order.data.customer.phone}</b>
              </div>
              <div>
                <small>Email</small>
                <b>{order.data.customer.email || "Not provided"}</b>
              </div>
            </div>
            <div className="receipt-meta">
              <div>
                <small>DUE</small>
                <b>{formatDateTime(order.data.dueAt)}</b>
              </div>
              <div>
                <small>STATUS</small>
                <b className="receipt-status">{order.data.status}</b>
              </div>
              <div>
                <small>RECEIPT</small>
                <b>{order.data.receipt?.receiptNumber ?? "Pending"}</b>
              </div>
            </div>
            <div className="table-scroll">
              <table className="receipt-lines-table">
                <thead>
                  <tr>
                    <th>SERVICE</th>
                    <th>DETAIL</th>
                    <th>AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {order.data.lines.map((line) => (
                    <tr key={line.id}>
                      <td>{line.serviceName}</td>
                      <td>
                        {line.basketName ??
                          (line.quantity
                            ? `Quantity: ${line.quantity}`
                            : "Flat fee")}
                      </td>
                      <td>{formatCurrency(line.lineTotalPesewas / 100)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="receipt-summary-layout">
              <section className="receipt-status-history">
                <h3>Status history</h3>
                <ul className="receipt-history-list">
                  {order.data.statusHistory.map((event) => (
                    <li key={`${event.toStatus}-${event.createdAt}`}>
                      <b>{event.toStatus}</b>
                      <span>{formatDateTime(event.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              </section>
              <dl className="receipt-totals receipt-detail-totals">
                <div>
                  <dt>Subtotal</dt>
                  <dd>{formatCurrency(order.data.subtotalPesewas / 100)}</dd>
                </div>
                <div>
                  <dt>Discount</dt>
                  <dd>-{formatCurrency(order.data.discountPesewas / 100)}</dd>
                </div>
                <div>
                  <dt>Tax</dt>
                  <dd>{formatCurrency(order.data.taxPesewas / 100)}</dd>
                </div>
                <div>
                  <dt>Total</dt>
                  <dd>{formatCurrency(order.data.totalPesewas / 100)}</dd>
                </div>
                <div>
                  <dt>Paid</dt>
                  <dd>{formatCurrency(order.data.netPaidPesewas / 100)}</dd>
                </div>
                <div>
                  <dt>Balance</dt>
                  <dd>{formatCurrency(order.data.balancePesewas / 100)}</dd>
                </div>
              </dl>
            </div>
            <div className="receipt-actions">
              {order.data.trackingUrl && (
                <a
                  className="button button-secondary"
                  href={order.data.trackingUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink size={16} />
                  Open public tracking
                </a>
              )}
              {currentUser.data?.tenantRole === "manager" && (
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => void handleDownloadReceipt()}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <Download size={16} />
                  )}
                  {isDownloading ? "Generating receipt…" : "Generate Receipt"}
                </button>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

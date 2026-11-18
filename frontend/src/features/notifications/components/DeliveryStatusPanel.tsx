import { LoaderCircle, Mail, MessageSquareText, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/shared/LoadingSkeletons";
import { getApiErrorMessage } from "@/lib/apiError";
import { formatDateTime } from "@/lib/formatDate";
import {
  useNotificationDeliveries,
  useRetryNotificationDelivery,
} from "../hooks/useNotifications";

export function DeliveryStatusPanel() {
  const deliveries = useNotificationDeliveries();
  const retryDelivery = useRetryNotificationDelivery();

  return (
    <section className="panel delivery-panel">
      <div className="panel-heading">
        <div>
          <h2>Customer message delivery</h2>
          <p>Recent SMS and email delivery attempts.</p>
        </div>
      </div>
      {deliveries.isPending ? (
        <TableSkeleton label="Loading message deliveries" columns={5} />
      ) : deliveries.isError ? (
        <div className="empty-state">
          <b>Message deliveries could not be loaded</b>
          <button onClick={() => void deliveries.refetch()}>Retry</button>
        </div>
      ) : deliveries.data.length ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>CREATED</th>
                <th>CHANNEL</th>
                <th>ORDER</th>
                <th>STATUS</th>
                <th>ATTEMPTS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.data.map((delivery) => (
                <tr key={delivery.id}>
                  <td>{formatDateTime(delivery.createdAt)}</td>
                  <td>
                    <span className="delivery-channel">
                      {delivery.channel === "email" ? (
                        <Mail size={15} />
                      ) : (
                        <MessageSquareText size={15} />
                      )}
                      {delivery.channel === "email" ? "Email" : "SMS"}
                    </span>
                  </td>
                  <td>{delivery.orderId?.slice(0, 8) ?? "Invitation"}</td>
                  <td>
                    <span className={`delivery-state is-${delivery.state}`}>
                      {delivery.state}
                    </span>
                  </td>
                  <td>{delivery.attempts}</td>
                  <td>
                    {delivery.state === "failed" && (
                      <button
                        className="button button-secondary delivery-retry-button"
                        disabled={retryDelivery.isPending}
                        onClick={() =>
                          retryDelivery.mutate(delivery.id, {
                            onSuccess: () =>
                              toast.success("Delivery queued to retry."),
                            onError: (error) =>
                              toast.error(getApiErrorMessage(error)),
                          })
                        }
                      >
                        {retryDelivery.isPending ? (
                          <LoaderCircle size={14} className="animate-spin" />
                        ) : (
                          <RotateCcw size={14} />
                        )}
                        Retry
                      </button>
                    )}
                    {delivery.state === "sent" && delivery.sentAt && (
                      <span className="delivery-sent-date">
                        Sent {formatDateTime(delivery.sentAt)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <Mail size={22} />
          <b>No customer messages yet</b>
          <span>Order update messages will appear here.</span>
        </div>
      )}
    </section>
  );
}

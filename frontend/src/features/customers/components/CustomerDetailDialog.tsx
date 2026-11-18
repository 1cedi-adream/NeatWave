import { useEffect, useState, type SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import {
  PanelSkeleton,
  TableSkeleton,
} from "@/components/shared/LoadingSkeletons";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/apiError";
import { useCustomer, useUpdateCustomer } from "../hooks/useCustomers";

export function CustomerDetailDialog({
  customerId,
  onClose,
}: {
  customerId: string;
  onClose: () => void;
}) {
  const customer = useCustomer(customerId);
  const navigate = useNavigate();
  const updateCustomer = useUpdateCustomer();
  const [editing, setEditing] = useState(false);
  useEffect(() => setEditing(false), [customerId]);
  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    updateCustomer.mutate(
      {
        id: customerId,
        fullName: String(form.get("fullName")),
        phone: String(form.get("phone")),
        email: String(form.get("email")) || undefined,
        instructions: String(form.get("instructions")) || undefined,
        smsConsent: form.get("smsConsent") === "on",
        emailConsent: form.get("emailConsent") === "on",
      },
      {
        onSuccess: () => {
          toast.success("Customer updated.");
          setEditing(false);
          void customer.refetch();
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  }
  return (
    <div className="modal-backdrop">
      <section
        className="order-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-detail-title"
      >
        <div className="modal-header">
          <div>
            <h2 id="customer-detail-title">
              {customer.data?.fullName ?? "Customer"}
            </h2>
            <p>Contact details and order history.</p>
          </div>
          <button className="icon-button" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        {customer.isPending ? (
          <div className="customer-dialog-loading">
            <PanelSkeleton label="Loading customer details" />
            <TableSkeleton
              label="Loading customer order history"
              columns={4}
              rows={3}
            />
          </div>
        ) : customer.isError || !customer.data ? (
          <div className="empty-state">
            <b>Customer could not be loaded</b>
            <button onClick={() => void customer.refetch()}>Retry</button>
          </div>
        ) : editing ? (
          <form onSubmit={submit}>
            <label>
              Full name
              <input
                name="fullName"
                defaultValue={customer.data.fullName}
                required
              />
            </label>
            <label>
              Phone
              <input name="phone" defaultValue={customer.data.phone} required />
            </label>
            <label>
              Email
              <input
                name="email"
                type="email"
                defaultValue={customer.data.email ?? ""}
              />
            </label>
            <label>
              Instructions
              <textarea
                name="instructions"
                defaultValue={customer.data.instructions ?? ""}
              />
            </label>
            <label>
              <input
                name="smsConsent"
                type="checkbox"
                defaultChecked={customer.data.smsConsent}
              />
              SMS updates
            </label>
            <label>
              <input
                name="emailConsent"
                type="checkbox"
                defaultChecked={customer.data.emailConsent}
              />
              Email updates
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
              <button
                className="button button-primary"
                disabled={updateCustomer.isPending}
              >
                Save changes
              </button>
            </div>
          </form>
        ) : (
          <div className="customer-detail">
            <div className="detail-grid">
              <div>
                <small>PHONE</small>
                <b>{customer.data.phone}</b>
              </div>
              <div>
                <small>EMAIL</small>
                <b>{customer.data.email || "Not provided"}</b>
              </div>
              <div>
                <small>UPDATES</small>
                <b>
                  {[
                    customer.data.smsConsent && "SMS",
                    customer.data.emailConsent && "Email",
                  ]
                    .filter(Boolean)
                    .join(", ") || "None"}
                </b>
              </div>
            </div>
            <button
              className="button button-secondary"
              onClick={() => setEditing(true)}
            >
              Edit customer
            </button>
            <h3>Order history</h3>
            <p>{customer.data.orders.length} orders on record.</p>
            <button
              type="button"
              className="button button-secondary"
              onClick={() =>
                navigate(`/customers/${customerId}/order-history`, {
                  state: { openedFromCustomerDialog: true },
                })
              }
            >
              View order history
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

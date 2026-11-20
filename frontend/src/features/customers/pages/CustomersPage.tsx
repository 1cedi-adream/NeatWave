import { useState, type SubmitEvent } from "react";
import { Plus, Search, Users, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { TableSkeleton } from "@/components/shared/LoadingSkeletons";
import { getApiErrorMessage } from "@/lib/apiError";
import { useCreateCustomer, useCustomers } from "../hooks/useCustomers";
import { CustomerDetailDialog } from "../components/CustomerDetailDialog";

export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const customers = useCustomers({
    page,
    pageSize: 10,
    search: search || undefined,
  });
  const createCustomer = useCreateCustomer();

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    createCustomer.mutate(
      {
        fullName: String(form.get("fullName")),
        phone: String(form.get("phone")),
        email: String(form.get("email")) || undefined,
        instructions: String(form.get("instructions")) || undefined,
        smsConsent: form.get("smsConsent") === "on",
        emailConsent: form.get("emailConsent") === "on",
      },
      {
        onSuccess: () => {
          toast.success("Customer added.");
          setShowForm(false);
        },
        onError: (error) =>
          toast.error(getApiErrorMessage(error, "Could not add customer.")),
      },
    );
  }

  return (
    <div className="page-content">
      <PageHeader
        title="Customers"
        description="Find customers and keep their contact details current."
        action={
          <button
            className="button button-primary"
            onClick={() => setShowForm(true)}
          >
            <Plus size={16} /> Add customer
          </button>
        }
      />
      <section className="panel">
        <div className="table-toolbar directory-toolbar-spacing">
          <label className="search-field">
            <Search size={16} />
            <input
              aria-label="Search customers"
              placeholder="Search name, phone, or email"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </label>
        </div>
        {customers.isPending ? (
          <TableSkeleton label="Loading customers" columns={4} />
        ) : customers.isError ? (
          <div className="empty-state">
            <b>Customers could not be loaded</b>
            <button onClick={() => void customers.refetch()}>Retry</button>
          </div>
        ) : customers.data?.data.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>NAME</th>
                  <th>PHONE</th>
                  <th>EMAIL</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {customers.data.data.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <button
                        className="text-link"
                        onClick={() => setSelectedCustomerId(customer.id)}
                      >
                        {customer.fullName}
                      </button>
                    </td>
                    <td>{customer.phone}</td>
                    <td>{customer.email || "—"}</td>
                    <td>{customer.active ? "Active" : "Inactive"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <Users size={22} />
            <b>No customers found</b>
            <span>Add a customer or change the search.</span>
          </div>
        )}
        {(customers.data?.meta.total ?? 0) > 10 && (
          <div className="table-footer">
            <span>{customers.data?.meta.total ?? 0} customers</span>
            <div>
              <button
                disabled={page === 1}
                onClick={() => setPage((current) => current - 1)}
              >
                Previous
              </button>
              <span>{page}</span>
              <button
                disabled={page >= (customers.data?.meta.totalPages ?? 1)}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
      {showForm && (
        <div className="modal-backdrop">
          <section
            className="order-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-form-title"
          >
            <div className="modal-header">
              <div>
                <h2 id="customer-form-title">Add customer</h2>
                <p>Save contact details and update consent preferences.</p>
              </div>
              <button
                className="icon-button"
                aria-label="Close"
                onClick={() => setShowForm(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submit}>
              <label>
                Full name
                <input name="fullName" required />
              </label>
              <label>
                Phone
                <input name="phone" required />
              </label>
              <label>
                Email
                <input name="email" type="email" />
              </label>
              <label>
                Instructions
                <textarea name="instructions" />
              </label>
              <label>
                <input name="smsConsent" type="checkbox" /> Send SMS updates
              </label>
              <label>
                <input name="emailConsent" type="checkbox" /> Send email updates
              </label>
              <div className="modal-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button
                  className="button button-primary"
                  disabled={createCustomer.isPending}
                >
                  {createCustomer.isPending ? "Saving…" : "Save customer"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {selectedCustomerId && (
        <CustomerDetailDialog
          customerId={selectedCustomerId}
          onClose={() => setSelectedCustomerId("")}
        />
      )}
    </div>
  );
}

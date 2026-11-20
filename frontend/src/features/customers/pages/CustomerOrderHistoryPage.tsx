import { ArrowLeft } from "lucide-react";
import {
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { TableSkeleton } from "@/components/shared/LoadingSkeletons";
import { Pagination, usePagination } from "@/components/shared/Pagination";
import { formatCurrency } from "@/lib/formatCurrency";
import { formatDate } from "@/lib/formatDate";
import { useCustomer } from "../hooks/useCustomers";

export default function CustomerOrderHistoryPage() {
  const { customerId = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const openedFromCustomerDialog =
    (location.state as { openedFromCustomerDialog?: boolean } | null)
      ?.openedFromCustomerDialog === true;
  const customer = useCustomer(customerId, openedFromCustomerDialog);
  const pagination = usePagination(customer.data?.orders ?? []);

  if (!openedFromCustomerDialog) return <Navigate to="/customers" replace />;

  return (
    <div className="page-content">
      <PageHeader
        title={
          customer.data
            ? `${customer.data.fullName} · Order history`
            : "Customer order history"
        }
        description="All orders recorded for this customer."
        action={
          <button
            className="button button-secondary"
            onClick={() => navigate("/customers")}
          >
            <ArrowLeft size={16} />
            Back to customers
          </button>
        }
      />
      <section className="panel">
        {customer.isPending ? (
          <TableSkeleton label="Loading customer order history" columns={4} />
        ) : customer.isError || !customer.data ? (
          <div className="empty-state" role="alert">
            <b>Order history could not be loaded</b>
            <button onClick={() => void customer.refetch()}>Retry</button>
          </div>
        ) : customer.data.orders.length ? (
          <>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>ORDER</th>
                    <th>STATUS</th>
                    <th>DATE</th>
                    <th>TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.items.map((order) => (
                    <tr key={order.id}>
                      <td>{order.orderNumber}</td>
                      <td>{order.status}</td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td>{formatCurrency(order.totalPesewas / 100)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination {...pagination} label="orders" />
          </>
        ) : (
          <div className="empty-state">
            <b>No orders yet</b>
            <span>This customer has no order history.</span>
          </div>
        )}
      </section>
    </div>
  );
}

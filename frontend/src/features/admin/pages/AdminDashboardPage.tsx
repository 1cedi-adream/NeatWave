import { Building2, CheckCircle2, ShoppingBag, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { formatDate } from "@/lib/formatDate";
import { StatCard } from "@/components/shared/StatCard";
import { Pagination, usePagination } from "@/components/shared/Pagination";
import { useAdminSummary } from "../hooks/useAdmin";

export default function AdminDashboardPage() {
  const summary = useAdminSummary();
  const pagination = usePagination(summary.data?.recentTenants ?? []);
  if (summary.isPending)
    return (
      <div className="page-content admin-dashboard-loading" aria-busy="true">
        <div className="admin-skeleton-heading">
          <span />
          <span />
        </div>
        <div className="stats-row">
          {Array.from({ length: 4 }, (_, index) => (
            <div className="admin-skeleton-stat" key={index}>
              <span />
              <span />
              <span />
            </div>
          ))}
        </div>
        <section className="panel admin-skeleton-table">
          <div className="admin-skeleton-table-heading">
            <span />
            <span />
          </div>
          {Array.from({ length: 5 }, (_, index) => (
            <div className="admin-skeleton-table-row" key={index}>
              <span />
              <span />
              <span />
              <span />
            </div>
          ))}
        </section>
        <span className="sr-only">Loading platform overview</span>
      </div>
    );
  if (summary.isError)
    return (
      <div className="page-content empty-state">
        <b>Overview unavailable</b>
        <button onClick={() => void summary.refetch()}>Retry</button>
      </div>
    );
  return (
    <div className="page-content">
      <PageHeader
        title="Platform overview"
        description="Monitor laundries using NeatWave."
        action={
          <Link className="button button-primary" to="/admin/laundries/new">
            Onboard laundry
          </Link>
        }
      />
      <div className="stats-row">
        <StatCard
          label="Laundries"
          value={String(summary.data?.totalTenants ?? 0)}
          caption="on the platform"
          icon={<Building2 size={18} />}
          tone="mint"
        />
        <StatCard
          label="Active"
          value={String(summary.data?.activeTenants ?? 0)}
          caption="active laundries"
          icon={<CheckCircle2 size={18} />}
          tone="sky"
        />
        <StatCard
          label="Customers"
          value={String(summary.data?.totalCustomers ?? 0)}
          caption="across laundries"
          icon={<Users size={18} />}
          tone="peach"
        />
        <StatCard
          label="Orders"
          value={String(summary.data?.totalOrders ?? 0)}
          caption="across laundries"
          icon={<ShoppingBag size={18} />}
          tone="lavender"
        />
      </div>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Recently onboarded</h2>
            <p>Latest laundries added to NeatWave.</p>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>LAUNDRY</th>
                <th>SLUG</th>
                <th>STATUS</th>
                <th>CREATED</th>
              </tr>
            </thead>
            <tbody>
              {pagination.items.map((tenant) => (
                <tr key={tenant.id}>
                  <td>
                    <Link to={`/admin/laundries/${tenant.id}`}>
                      {tenant.name}
                    </Link>
                  </td>
                  <td>{tenant.slug}</td>
                  <td>{tenant.active ? "Active" : "Inactive"}</td>
                  <td>{formatDate(tenant.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination {...pagination} label="laundries" />
      </section>
    </div>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { formatDate } from "@/lib/formatDate";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { useTenants } from "../hooks/useAdmin";

export default function TenantsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<"true" | "false" | undefined>();
  const tenants = useTenants({
    page,
    pageSize: 10,
    search: search || undefined,
    active,
  });
  return (
    <div className="page-content admin-tenants-page">
      <PageHeader
        title="Laundries"
        description="Onboard and manage tenant access."
        action={
          <Link className="button button-primary" to="/admin/laundries/new">
            <Plus size={16} />
            Onboard laundry
          </Link>
        }
      />
      <section
        className="panel admin-tenants-panel"
        aria-label="Laundry directory"
      >
        <div className="admin-directory-heading">
          <div>
            <h2>All laundries</h2>
            <p>Search workspaces and manage their platform access.</p>
          </div>
          {!tenants.isPending && !tenants.isError && (
            <span className="admin-result-count">
              {tenants.data?.meta.total ?? 0} total
            </span>
          )}
        </div>
        <div className="table-toolbar">
          <label className="search-field">
            <Search size={16} />
            <input
              aria-label="Search laundries"
              placeholder="Search name or slug"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </label>
          <CustomSelect
            value={active ?? ""}
            onChange={(event) => {
              setActive(
                (event.target.value || undefined) as
                  "true" | "false" | undefined,
              );
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </CustomSelect>
        </div>
        {tenants.isPending ? (
          <div className="admin-tenants-skeleton" aria-busy="true">
            <span className="sr-only">Loading laundries</span>
            <div className="admin-tenants-skeleton-head">
              {Array.from({ length: 4 }, (_, index) => (
                <span key={index} />
              ))}
            </div>
            {Array.from({ length: 7 }, (_, rowIndex) => (
              <div className="admin-tenants-skeleton-row" key={rowIndex}>
                <span />
                <span />
                <span />
                <span />
              </div>
            ))}
            <div className="admin-tenants-skeleton-footer">
              <span />
              <span />
            </div>
          </div>
        ) : tenants.isError ? (
          <div className="empty-state">
            <b>Laundries could not be loaded</b>
            <button onClick={() => void tenants.refetch()}>Retry</button>
          </div>
        ) : tenants.data?.data.length ? (
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
                {tenants.data.data.map((tenant) => (
                  <tr key={tenant.id}>
                    <td>
                      <Link
                        className="admin-tenant-name"
                        to={`/admin/laundries/${tenant.id}`}
                      >
                        <span className="admin-tenant-mark">
                          <Building2 size={16} />
                        </span>
                        <span>
                          {tenant.name}
                          <small>NeatWave workspace</small>
                        </span>
                      </Link>
                    </td>
                    <td>{tenant.slug}</td>
                    <td>
                      <span
                        className={
                          tenant.active
                            ? "tenant-status tenant-status-active"
                            : "tenant-status tenant-status-inactive"
                        }
                      >
                        {tenant.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>{formatDate(tenant.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <Building2 size={22} />
            <b>No laundries found</b>
            <span>Onboard a laundry or change the filters.</span>
          </div>
        )}
        {!tenants.isPending && !tenants.isError && tenants.data?.data.length ? (
          <div className="table-footer">
            <span>{tenants.data?.meta.total ?? 0} laundries</span>
            <div>
              <button
                disabled={page === 1}
                onClick={() => setPage((value) => value - 1)}
              >
                Previous
              </button>
              <span>{page}</span>
              <button
                disabled={page >= (tenants.data?.meta.totalPages ?? 1)}
                onClick={() => setPage((value) => value + 1)}
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

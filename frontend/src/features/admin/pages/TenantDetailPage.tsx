import { useState } from "react";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  Copy,
  Mail,
  RefreshCw,
  ShoppingBag,
  Users,
  XCircle,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { getApiErrorMessage } from "@/lib/apiError";
import { formatDate, formatDateTime } from "@/lib/formatDate";
import {
  useResendManagerInvitation,
  useTenant,
  useUpdateTenantStatus,
} from "../hooks/useAdmin";

export default function TenantDetailPage() {
  const { tenantId = "" } = useParams();
  const tenant = useTenant(tenantId);
  const updateStatus = useUpdateTenantStatus();
  const resendInvitation = useResendManagerInvitation();
  const [confirming, setConfirming] = useState(false);
  const [localInviteUrl, setLocalInviteUrl] = useState("");

  if (tenant.isPending)
    return (
      <div className="page-content">
        <div className="admin-detail-skeleton" aria-label="Loading laundry">
          <span />
          <span />
          <span />
        </div>
      </div>
    );
  if (tenant.isError || !tenant.data)
    return (
      <div className="page-content">
        <section className="panel empty-state">
          <Building2 size={24} />
          <b>Laundry could not be loaded</b>
          <span>Check the link or try loading the record again.</span>
          <button
            className="button button-secondary"
            onClick={() => void tenant.refetch()}
          >
            Retry
          </button>
        </section>
      </div>
    );

  const data = tenant.data;
  const teamCount = data.memberships.reduce(
    (total, membership) => total + membership.value,
    0,
  );
  const invitationStatus = data.managerInvitation?.acceptedAt
    ? "Accepted"
    : data.managerInvitation &&
        new Date(data.managerInvitation.expiresAt) > new Date()
      ? "Pending"
      : data.managerInvitation
        ? "Expired"
        : "Not sent";
  const invitationTone = invitationStatus.toLowerCase().replace(" ", "-");

  return (
    <div className="page-content admin-tenant-detail">
      <div className="admin-detail-back">
        <Link to="/admin/laundries">
          <ArrowLeft size={15} />
          Back to laundries
        </Link>
      </div>
      <PageHeader
        title={data.name}
        description={`Workspace /${data.slug}`}
        action={
          <button
            className={
              data.active
                ? "button button-secondary admin-danger-button"
                : "button button-primary"
            }
            disabled={updateStatus.isPending}
            onClick={() => setConfirming(true)}
          >
            {data.active ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
            {data.active ? "Deactivate laundry" : "Activate laundry"}
          </button>
        }
      />
      <div className="admin-status-strip">
        <span
          className={
            data.active
              ? "tenant-status tenant-status-active"
              : "tenant-status tenant-status-inactive"
          }
        >
          {data.active ? "Active" : "Inactive"}
        </span>
        <p>
          {data.active
            ? "This laundry can access its workspace and manage operations."
            : "Workspace access is currently blocked. Historical data remains available."}
        </p>
      </div>
      <div className="stats-row">
        <StatCard
          label="Orders"
          value={String(data.orderCount)}
          caption="all recorded orders"
          icon={<ShoppingBag size={18} />}
          tone="lavender"
        />
        <StatCard
          label="Customers"
          value={String(data.customerCount)}
          caption="customer records"
          icon={<Users size={18} />}
          tone="peach"
        />
        <StatCard
          label="Team members"
          value={String(teamCount)}
          caption="active and inactive"
          icon={<Users size={18} />}
          tone="sky"
        />
        <StatCard
          label="Onboarded"
          value={formatDate(data.createdAt)}
          caption="laundry workspace"
          icon={<CalendarDays size={18} />}
          tone="mint"
        />
      </div>
      <div className="admin-detail-grid">
        <section className="panel admin-detail-panel">
          <div className="admin-detail-heading">
            <span>
              <Building2 size={18} />
            </span>
            <div>
              <h2>Business details</h2>
              <p>Information configured for this laundry.</p>
            </div>
          </div>
          <dl className="admin-record-list">
            <div>
              <dt>Business name</dt>
              <dd>{data.settings?.businessName ?? data.name}</dd>
            </div>
            <div>
              <dt>Workspace slug</dt>
              <dd>/{data.slug}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>
                {data.settings?.email || (
                  <span className="not-configured">Not configured</span>
                )}
              </dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>
                {data.settings?.phone || (
                  <span className="not-configured">Not configured</span>
                )}
              </dd>
            </div>
            <div>
              <dt>Address</dt>
              <dd>
                {data.settings?.address || (
                  <span className="not-configured">Not configured</span>
                )}
              </dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatDateTime(data.createdAt)}</dd>
            </div>
          </dl>
        </section>
        <section className="panel admin-detail-panel">
          <div className="admin-detail-heading">
            <span>
              <Mail size={18} />
            </span>
            <div>
              <h2>Initial manager</h2>
              <p>Invitation used to establish laundry management.</p>
            </div>
          </div>
          {data.managerInvitation ? (
            <>
              <dl className="admin-record-list">
                <div>
                  <dt>Email</dt>
                  <dd>{data.managerInvitation.email}</dd>
                </div>
                <div>
                  <dt>Role</dt>
                  <dd>Manager</dd>
                </div>
                <div>
                  <dt>Invitation status</dt>
                  <dd>
                    <span
                      className={`invitation-status invitation-${invitationTone}`}
                    >
                      {invitationStatus}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>
                    {data.managerInvitation.acceptedAt ? "Accepted" : "Expires"}
                  </dt>
                  <dd>
                    {formatDateTime(
                      data.managerInvitation.acceptedAt ??
                        data.managerInvitation.expiresAt,
                    )}
                  </dd>
                </div>
              </dl>
              <div className="admin-invitation-actions">
                <button
                  className="button button-secondary"
                  disabled={resendInvitation.isPending}
                  onClick={() =>
                    resendInvitation.mutate(data.id, {
                      onSuccess: (result) => {
                        toast.success(`Invitation queued for ${result.email}.`);
                        setLocalInviteUrl(result.invitationUrl ?? "");
                      },
                      onError: (error) =>
                        toast.error(
                          getApiErrorMessage(
                            error,
                            "Could not resend invitation.",
                          ),
                        ),
                    })
                  }
                >
                  <RefreshCw
                    size={16}
                    className={resendInvitation.isPending ? "animate-spin" : ""}
                  />
                  {resendInvitation.isPending
                    ? "Sending invitation…"
                    : "Resend invitation"}
                </button>
                {localInviteUrl && (
                  <div className="admin-invite-link">
                    <label htmlFor="local-invitation-link">
                      Development invite link
                    </label>
                    <div>
                      <input
                        id="local-invitation-link"
                        readOnly
                        value={new URL(
                          localInviteUrl,
                          window.location.origin,
                        ).toString()}
                      />
                      <button
                        className="button button-secondary"
                        aria-label="Copy invitation link"
                        onClick={() =>
                          void navigator.clipboard
                            .writeText(
                              new URL(
                                localInviteUrl,
                                window.location.origin,
                              ).toString(),
                            )
                            .then(() =>
                              toast.success("Invitation link copied."),
                            )
                        }
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                    <small>
                      Use this link directly while testing local email delivery.
                    </small>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="admin-panel-empty">
              <Mail size={22} />
              <b>No manager invitation</b>
              <p>No initial manager invitation was found for this laundry.</p>
            </div>
          )}
        </section>
      </div>
      <ConfirmDialog
        open={confirming}
        destructive={data.active}
        title={`${data.active ? "Deactivate" : "Activate"} ${data.name}?`}
        description={
          data.active
            ? "Team members will lose access until the laundry is reactivated. Historical data will be retained."
            : "Team members will regain access to this laundry workspace."
        }
        confirmLabel={data.active ? "Deactivate laundry" : "Activate laundry"}
        isPending={updateStatus.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={() =>
          updateStatus.mutate(
            { id: data.id, active: !data.active },
            {
              onSuccess: () => {
                toast.success(
                  data.active ? "Laundry deactivated." : "Laundry activated.",
                );
                setConfirming(false);
              },
              onError: (error) => toast.error(getApiErrorMessage(error)),
            },
          )
        }
      />
    </div>
  );
}

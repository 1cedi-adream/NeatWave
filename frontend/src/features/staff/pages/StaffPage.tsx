import { useState, type SubmitEvent } from "react";
import { Plus, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { TableSkeleton } from "@/components/shared/LoadingSkeletons";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { getApiErrorMessage } from "@/lib/apiError";
import { useInviteStaff, useStaff, useUpdateStaff } from "../hooks/useStaff";

export default function StaffPage() {
  const [showInvite, setShowInvite] = useState(false);
  const staff = useStaff();
  const inviteStaff = useInviteStaff();
  const updateStaff = useUpdateStaff();

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    inviteStaff.mutate(
      {
        email: String(form.get("email")),
        role: String(form.get("role")) as "manager" | "staff",
      },
      {
        onSuccess: () => {
          toast.success("Invitation sent.");
          setShowInvite(false);
        },
        onError: (error) =>
          toast.error(getApiErrorMessage(error, "Could not send invitation.")),
      },
    );
  }

  return (
    <div className="page-content">
      <PageHeader
        title="Staff"
        description="Invite team members and control their access."
        action={
          <button
            className="button button-primary"
            onClick={() => setShowInvite(true)}
          >
            <Plus size={16} />
            Invite staff
          </button>
        }
      />
      <section className="panel">
        {staff.isPending ? (
          <TableSkeleton label="Loading staff" columns={5} />
        ) : staff.isError ? (
          <div className="empty-state">
            <b>Staff could not be loaded</b>
            <button onClick={() => void staff.refetch()}>Retry</button>
          </div>
        ) : staff.data?.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>TEAM MEMBER</th>
                  <th>CONTACT</th>
                  <th>ROLE</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {staff.data.map((member) => (
                  <tr key={member.membershipId}>
                    <td>
                      <b>{member.name}</b>
                    </td>
                    <td>
                      {member.email}
                      <br />
                      <small>{member.phone}</small>
                    </td>
                    <td>
                      <span
                        className={`role-tag ${member.role.toLowerCase() === "manager" ? "role-manager" : ""}`}
                      >
                        {member.role.toLowerCase() === "manager"
                          ? "Manager"
                          : "Staff"}
                      </span>
                    </td>
                    <td>{member.active ? "Active" : "Inactive"}</td>
                    <td>
                      <button
                        disabled={updateStaff.isPending}
                        onClick={() =>
                          updateStaff.mutate(
                            {
                              membershipId: member.membershipId,
                              active: !member.active,
                            },
                            {
                              onSuccess: () =>
                                toast.success(
                                  member.active
                                    ? "Staff access deactivated."
                                    : "Staff access restored.",
                                ),
                            },
                          )
                        }
                      >
                        {member.active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <UserRound size={22} />
            <b>No staff members yet</b>
            <span>Invite the first member of your team.</span>
          </div>
        )}
      </section>
      {showInvite && (
        <div className="modal-backdrop">
          <section
            className="order-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="invite-staff-title"
          >
            <div className="modal-header">
              <div>
                <h2 id="invite-staff-title">Invite staff</h2>
                <p>
                  They will receive an email invitation to join this laundry.
                </p>
              </div>
              <button
                className="icon-button"
                aria-label="Close"
                onClick={() => setShowInvite(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submit}>
              <label>
                Email
                <input name="email" type="email" required />
              </label>
              <label>
                Role
                <CustomSelect name="role" defaultValue="staff">
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                </CustomSelect>
              </label>
              <div className="modal-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setShowInvite(false)}
                >
                  Cancel
                </button>
                <button
                  className="button button-primary"
                  disabled={inviteStaff.isPending}
                >
                  Send invitation
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

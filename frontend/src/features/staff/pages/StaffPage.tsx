import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Activity, Plus, Search, Users, X } from "lucide-react";
import { PageHeader } from "../../../components/shared/PageHeader";
import { StatCard } from "../../../components/shared/StatCard";
import { ActionMenu } from "../../../components/ui/ActionMenu";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { CustomSelect } from "../../../components/ui/CustomSelect";
import { toast } from "sonner";

type StaffMember = { name: string; role: "Manager" | "Staff" | "Superadmin"; email: string; orders: number; active: boolean };
const initialStaff: StaffMember[] = [
  { name: "Jamie Lee", role: "Manager", email: "jamie@freshandfold.com", orders: 18, active: true },
  { name: "Rosa Alvarez", role: "Staff", email: "rosa@freshandfold.com", orders: 24, active: true },
  { name: "Darnell Brooks", role: "Staff", email: "darnell@freshandfold.com", orders: 16, active: true },
  { name: "Priya Nair", role: "Staff", email: "priya@freshandfold.com", orders: 9, active: false },
];

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>(() => {
    try { return JSON.parse(localStorage.getItem("fresh-fold-staff") ?? "null") ?? initialStaff; }
    catch { return initialStaff; }
  });
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [pendingDelete, setPendingDelete] = useState<StaffMember | null>(null);
  const visible = useMemo(() => staff.filter((member) => `${member.name} ${member.email} ${member.role}`.toLowerCase().includes(query.toLowerCase())), [staff, query]);

  useEffect(() => { localStorage.setItem("fresh-fold-staff", JSON.stringify(staff)); }, [staff]);

  function closeDialog() {
    setDialogOpen(false);
    setEditing(null);
  }

  function saveStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const member: StaffMember = {
      name: String(data.get("name")).trim(),
      role: String(data.get("role")) as StaffMember["role"],
      email: String(data.get("email")).trim(),
      orders: editing?.orders ?? 0,
      active: editing?.active ?? true,
    };
    if (editing) {
      setStaff((current) => current.map((item) => item.email === editing.email ? member : item));
      toast.success("Staff details updated.");
    } else {
      setStaff((current) => [...current, member]);
      toast.success("Staff member added to the demo list.");
    }
    closeDialog();
  }

  function deleteStaff(member: StaffMember) {
    setStaff((current) => current.filter((item) => item.email !== member.email));
    toast.success(`${member.name} removed from the team.`);
  }

  return (
    <div className="page-content">
      <PageHeader title="Staff" description="Manage shop access and see who is handling orders." action={<button className="button button-primary" onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus size={17} /> Add staff member</button>} />
      <div className="stats-row">
        <StatCard label="Team members" value={String(staff.length)} caption="in this shop" icon={<Users size={18} />} tone="mint" />
        <StatCard label="Active today" value={String(staff.filter((member) => member.active).length)} caption="with shop access" icon={<Activity size={18} />} tone="lavender" />
        <StatCard label="Orders handled" value={String(staff.reduce((sum, member) => sum + member.orders, 0))} caption="this week" icon={<Activity size={18} />} tone="sky" />
        <StatCard label="Manager access" value={String(staff.filter((member) => member.role !== "Staff").length)} caption="assigned roles" icon={<Users size={18} />} tone="peach" />
      </div>
      <p className="mb-4 text-xs text-gray-600">Sample staff records. Changes stay in this browser and do not create sign-in access.</p>
      <section className="panel directory-panel">
        <div className="directory-toolbar"><div><h2>Team directory</h2><p>Roles determine which parts of the system each person can use.</p></div><label className="search-field directory-search"><Search size={15} /><input placeholder="Search staff" value={query} onChange={(event) => setQuery(event.target.value)} /></label></div>
        <div className="table-scroll">
          <table>
            <caption className="sr-only">Team members, shop roles, handled orders and access status</caption>
            <thead><tr><th>TEAM MEMBER</th><th>ROLE</th><th>ORDERS HANDLED</th><th>ACCESS</th><th>ACTIONS</th></tr></thead>
            <tbody>
              {visible.map((member) => (
                <tr key={member.email}>
                  <td><div className="staff-name"><div className="avatar avatar-amber">{member.name.split(" ").map((part) => part[0]).join("")}</div><span><b>{member.name}</b><small>{member.email}</small></span></div></td>
                  <td><span className={`role-tag role-${member.role.toLowerCase()}`}>{member.role}</span></td>
                  <td>{member.orders}</td>
                  <td><span className={`status ${member.active ? "status-green" : "status-rose"}`}><i />{member.active ? "Active" : "Inactive"}</span></td>
                  <td><ActionMenu label={member.name} actions={[
                    { label: "Edit details", onSelect: () => { setEditing(member); setDialogOpen(true); } },
                    { label: member.active ? "Deactivate" : "Activate", onSelect: () => setStaff((current) => current.map((item) => item.email === member.email ? { ...item, active: !item.active } : item)) },
                    { label: "Delete staff member", destructive: true, onSelect: () => setPendingDelete(member) },
                  ]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {visible.length === 0 && <div className="empty-state"><Users size={22} /><b>No staff match</b><span>Try another name, email address or role.</span></div>}
        </div>
        <div className="table-footer"><span><b>{visible.length}</b> team members</span><span>Roles: Superadmin, Manager, Staff</span></div>
      </section>
      {dialogOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDialog(); }}>
          <section className="order-modal" role="dialog" aria-modal="true" aria-labelledby="staff-dialog-title">
            <div className="modal-header"><div><h2 id="staff-dialog-title">{editing ? "Edit staff member" : "Add staff member"}</h2><p>Demo only; this does not create account access.</p></div><button className="icon-button" aria-label="Close" onClick={closeDialog}><X size={19} /></button></div>
            <form onSubmit={saveStaff}>
              <label>Full name<input name="name" required placeholder="e.g. Alex Rivera" defaultValue={editing?.name} /></label>
              <label>Email address<input name="email" type="email" required placeholder="alex@freshandfold.com" defaultValue={editing?.email} /></label>
              <label>Role<CustomSelect name="role" defaultValue={editing?.role ?? "Staff"}><option>Staff</option><option>Manager</option><option>Superadmin</option></CustomSelect></label>
              <div className="modal-actions"><button type="button" className="button button-secondary" onClick={closeDialog}>Cancel</button><button className="button button-primary" type="submit">{editing ? "Save changes" : "Add to team"}</button></div>
            </form>
          </section>
        </div>
      )}
      {pendingDelete && <ConfirmDialog title="Remove staff member?" description={<>This will remove <b>{pendingDelete.name}</b> from the team list.</>} confirmLabel="Remove staff member" onCancel={() => setPendingDelete(null)} onConfirm={() => { deleteStaff(pendingDelete); setPendingDelete(null); }} />}
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Plus, Search, Shirt, X } from "lucide-react";
import { PageHeader } from "../../../components/shared/PageHeader";
import { ActionMenu } from "../../../components/ui/ActionMenu";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { CustomSelect } from "../../../components/ui/CustomSelect";
import { toast } from "sonner";

type Service = {
  name: string;
  category: string;
  turnaround: string;
  active: boolean;
};

const initialServices: Service[] = [
  { name: "Wash & fold", category: "Laundry", turnaround: "24 hours", active: true },
  { name: "Dry cleaning", category: "Special care", turnaround: "48 hours", active: true },
  { name: "Wash & press", category: "Laundry", turnaround: "24 hours", active: true },
  { name: "Express wash", category: "Express", turnaround: "Same day", active: true },
  { name: "Bedding", category: "Special care", turnaround: "48 hours", active: true },
  { name: "Shoe cleaning", category: "Special care", turnaround: "72 hours", active: false },
];

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("fresh-fold-services") ?? "null") ?? initialServices;
    } catch {
      return initialServices;
    }
  });
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All services");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Service | null>(null);

  const rows = useMemo(
    () => services.filter((service) =>
      (category === "All services" || service.category === category) &&
      service.name.toLowerCase().includes(query.toLowerCase()),
    ),
    [services, category, query],
  );

  useEffect(() => {
    localStorage.setItem("fresh-fold-services", JSON.stringify(services));
  }, [services]);

  function closeDialog() {
    setDialogOpen(false);
    setEditing(null);
  }

  function saveService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const updated: Service = {
      name: String(data.get("name")).trim(),
      category: String(data.get("category")),
      turnaround: String(data.get("turnaround")).trim(),
      active: editing?.active ?? true,
    };

    if (editing) {
      setServices((current) => current.map((service) => service.name === editing.name ? updated : service));
      toast.success("Service details updated.");
    } else {
      setServices((current) => [...current, updated]);
      toast.success("Service added.");
    }
    closeDialog();
  }

  function deleteService(service: Service) {
    setServices((current) => current.filter((item) => item.name !== service.name));
    toast.success(`${service.name} removed.`);
  }

  return (
    <div className="page-content">
      <PageHeader
        title="Services"
        description="Manage the work your shop offers."
        action={<button className="button button-primary" onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus size={17} /> Add service</button>}
      />
      <div className="service-summary">
        <div>
          <span className="service-summary-icon"><Shirt size={19} /></span>
          <span><b>{services.filter((service) => service.active).length} active services</b><small>Changes are saved in this browser.</small></span>
        </div>
      </div>
      <section className="panel directory-panel">
        <div className="directory-toolbar">
          <div><h2>Service menu</h2><p>Manage availability and turnaround times.</p></div>
          <label className="search-field directory-search"><Search size={15} /><input placeholder="Find a service" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        </div>
        <div className="service-filters">
          {["All services", "Laundry", "Special care", "Express"].map((name) => <button key={name} className={category === name ? "selected" : ""} onClick={() => setCategory(name)}>{name}</button>)}
        </div>
        <div className="table-scroll">
          <table>
            <caption className="sr-only">Laundry services, categories, turnaround estimates and availability</caption>
            <thead><tr><th>SERVICE</th><th>CATEGORY</th><th>TURNAROUND</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
            <tbody>
              {rows.map((service) => (
                <tr key={service.name}>
                  <td><b className="service-name">{service.name}</b></td>
                  <td>{service.category}</td>
                  <td>{service.turnaround}</td>
                  <td><span className={`status ${service.active ? "status-green" : "status-rose"}`}><i />{service.active ? "Active" : "Inactive"}</span></td>
                  <td><ActionMenu label={service.name} actions={[
                    { label: "Edit service", onSelect: () => { setEditing(service); setDialogOpen(true); } },
                    { label: service.active ? "Deactivate" : "Activate", onSelect: () => setServices((current) => current.map((item) => item.name === service.name ? { ...item, active: !item.active } : item)) },
                    { label: "Delete service", destructive: true, onSelect: () => setPendingDelete(service) },
                  ]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <div className="empty-state"><Shirt size={22} /><b>No services match</b><span>Clear the search or choose another category.</span></div>}
        </div>
      </section>
      {dialogOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDialog(); }}>
          <section className="order-modal" role="dialog" aria-modal="true" aria-labelledby="service-dialog-title">
            <div className="modal-header"><div><h2 id="service-dialog-title">{editing ? "Edit service" : "Add a service"}</h2><p>{editing ? "Update the service details." : "Add a service and estimated turnaround."}</p></div><button className="icon-button" aria-label="Close" onClick={closeDialog}><X size={19} /></button></div>
            <form onSubmit={saveService}>
              <label>Service name<input name="name" required placeholder="e.g. Curtain cleaning" defaultValue={editing?.name} /></label>
              <div className="form-row">
                <label>Category<CustomSelect name="category" defaultValue={editing?.category ?? "Laundry"}><option>Laundry</option><option>Special care</option><option>Express</option></CustomSelect></label>
                <label>Turnaround<input name="turnaround" required placeholder="e.g. 24 hours" defaultValue={editing?.turnaround} /></label>
              </div>
              <div className="modal-actions"><button type="button" className="button button-secondary" onClick={closeDialog}>Cancel</button><button className="button button-primary" type="submit">{editing ? "Save changes" : "Save service"}</button></div>
            </form>
          </section>
        </div>
      )}
      {pendingDelete && <ConfirmDialog title="Delete service?" description={<>This will remove <b>{pendingDelete.name}</b> from the service menu.</>} confirmLabel="Delete service" onCancel={() => setPendingDelete(null)} onConfirm={() => { deleteService(pendingDelete); setPendingDelete(null); }} />}
    </div>
  );
}

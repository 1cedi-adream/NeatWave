import { useState } from "react";
import { Building2, ReceiptText, Save, Settings2 } from "lucide-react";
import { PageHeader } from "../../../components/shared/PageHeader";
import { toast } from "sonner";

const sections = [
  { id: "business", label: "Business details", icon: Building2 },
  { id: "orders", label: "Order preferences", icon: Settings2 },
  { id: "receipts", label: "Receipts", icon: ReceiptText },
] as const;

type SectionId = (typeof sections)[number]["id"];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SectionId>("business");
  const [business, setBusiness] = useState({ name: "Fresh & Fold", address: "18 Market Street, Downtown", phone: "(555) 018-2040", email: "hello@freshandfold.com", tax: "0", completion: "24", footer: "Thank you for choosing Fresh & Fold.", showContact: true });
  const update = (field: keyof typeof business, value: string) => setBusiness((current) => ({ ...current, [field]: value }));

  return (
    <div className="page-content">
      <PageHeader title="Settings" description="Business details and order preferences." action={<button className="button button-primary" onClick={() => toast.success("Settings updated in this demo view.")}><Save size={16} /> Save changes</button>} />
      <p className="mb-4 text-xs text-gray-600">Sample preferences. Backend saving is not connected.</p>
      <div className="settings-layout settings-tabs-layout">
        <nav className="settings-nav" role="tablist" aria-label="Settings sections">
          {sections.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" role="tab" id={`settings-tab-${id}`} aria-controls={`settings-panel-${id}`} aria-selected={activeSection === id} className={activeSection === id ? "selected" : ""} onClick={() => setActiveSection(id)}>
              <Icon size={17} />{label}
            </button>
          ))}
        </nav>
        <div className="settings-sections">
          {activeSection === "business" && (
            <section className="panel settings-panel" role="tabpanel" id="settings-panel-business" aria-labelledby="settings-tab-business">
              <div className="settings-panel-heading"><span className="settings-icon"><Building2 size={18} /></span><div><h2>Business details</h2><p>Shown on order receipts and customer communications.</p></div></div>
              <div className="settings-fields"><label>Business name<input value={business.name} onChange={(event) => update("name", event.target.value)} /></label><label>Business address<input value={business.address} onChange={(event) => update("address", event.target.value)} /></label><div className="form-row"><label>Phone number<input value={business.phone} onChange={(event) => update("phone", event.target.value)} /></label><label>Email address<input type="email" value={business.email} onChange={(event) => update("email", event.target.value)} /></label></div><div className="settings-readonly"><span>Currency</span><b>GHS — Ghanaian cedi</b></div></div>
            </section>
          )}
          {activeSection === "orders" && (
            <section className="panel settings-panel" role="tabpanel" id="settings-panel-orders" aria-labelledby="settings-tab-orders">
              <div className="settings-panel-heading"><span className="settings-icon settings-icon-blue"><Settings2 size={18} /></span><div><h2>Order preferences</h2><p>Set defaults for new laundry orders.</p></div></div>
              <div className="settings-fields"><label>Default completion time<input type="number" min="1" value={business.completion} onChange={(event) => update("completion", event.target.value)} /><small className="field-hint">Hours from the time an order is received.</small></label><label>Tax rate (%)<input type="number" min="0" max="100" step="0.1" value={business.tax} onChange={(event) => update("tax", event.target.value)} /></label><div className="settings-readonly"><span>Order number format</span><b>WD-0000</b></div></div>
            </section>
          )}
          {activeSection === "receipts" && (
            <section className="panel settings-panel" role="tabpanel" id="settings-panel-receipts" aria-labelledby="settings-tab-receipts">
              <div className="settings-panel-heading"><span className="settings-icon settings-icon-peach"><ReceiptText size={18} /></span><div><h2>Receipt details</h2><p>Receipt information is included after an order is created.</p></div></div>
              <div className="settings-fields"><div className="settings-readonly"><span>Receipt number format</span><b>RC-0000</b></div><label>Receipt footer<input value={business.footer} onChange={(event) => update("footer", event.target.value)} /></label><label className="toggle-setting"><span><b>Show business contact details</b><small>Print your phone and address on each receipt.</small></span><input type="checkbox" checked={business.showContact} onChange={(event) => setBusiness((current) => ({ ...current, showContact: event.target.checked }))} /></label></div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

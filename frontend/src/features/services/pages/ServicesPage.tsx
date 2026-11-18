import { useState, type SubmitEvent } from "react";
import { Plus, Settings2, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { TableSkeleton } from "@/components/shared/LoadingSkeletons";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { useCurrentUser } from "@/features/auth/hooks/useAuth";
import { formatCurrency } from "@/lib/formatCurrency";
import { getApiErrorMessage } from "@/lib/apiError";
import {
  useCreateService,
  useServices,
  useUpdateService,
} from "../hooks/useServices";
import type { PricingModel } from "../types/laundryService";
import type { LaundryService } from "../types/laundryService";
import { EditServiceDialog } from "../components/EditServiceDialog";

export default function ServicesPage() {
  const [showForm, setShowForm] = useState(false);
  const [pricingModel, setPricingModel] = useState<PricingModel>("per_item");
  const [editingService, setEditingService] = useState<LaundryService | null>(
    null,
  );
  const services = useServices();
  const currentUser = useCurrentUser();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const canManage = currentUser.data?.tenantRole?.toLowerCase() === "manager";

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const pricePesewas = Math.round(Number(form.get("price")) * 100);
    const includedItemCount =
      Number(form.get("includedItemCount")) || undefined;

    const payload = {
      name: String(form.get("name")),
      estimatedHours: Number(form.get("estimatedHours")),
      pricingModel,
      basketOptions:
        pricingModel === "basket"
          ? [
              { name: "Small", pricePesewas, sortOrder: 0 },
              {
                name: "Large",
                pricePesewas: Math.round(Number(form.get("largePrice")) * 100),
                sortOrder: 1,
              },
            ]
          : [],
      price:
        pricingModel === "bundle"
          ? {
              basePricePesewas: pricePesewas,
              includedItemCount,
              overagePricePesewas: Math.round(
                Number(form.get("overagePrice")) * 100,
              ),
            }
          : pricingModel === "flat_fee"
            ? { unitPricePesewas: pricePesewas }
            : { unitPricePesewas: pricePesewas },
    };

    createService.mutate(payload, {
      onSuccess: () => {
        toast.success("Service created.");
        setShowForm(false);
      },
      onError: (error) =>
        toast.error(getApiErrorMessage(error, "Could not create service.")),
    });
  }

  return (
    <div className="page-content">
      <PageHeader
        title="Services"
        description={
          canManage
            ? "Configure the work your laundry offers and how each service is priced."
            : "Review the laundry services and pricing available to your team."
        }
        action={
          canManage && (
            <button
              type="button"
              className="button button-primary"
              onClick={() => setShowForm(true)}
            >
              <Plus size={16} />
              Add service
            </button>
          )
        }
      />
      <section className="panel">
        {services.isPending ? (
          <TableSkeleton label="Loading services" columns={canManage ? 6 : 5} />
        ) : services.isError ? (
          <div className="empty-state">
            <b>Services could not be loaded</b>
            <button onClick={() => void services.refetch()}>Retry</button>
          </div>
        ) : services.data?.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>SERVICE</th>
                  <th>MODEL</th>
                  <th>PRICE</th>
                  <th>TURNAROUND</th>
                  <th>STATUS</th>
                  {canManage && <th>ACTION</th>}
                </tr>
              </thead>
              <tbody>
                {services.data.map((service) => (
                  <tr key={service.id}>
                    <td>
                      <b>{service.name}</b>
                    </td>
                    <td>{service.pricingModel.replace(/_/g, " ")}</td>
                    <td>
                      {service.pricingModel === "basket"
                        ? `${service.basketOptions.length} options`
                        : formatCurrency(
                            (service.price?.unitPricePesewas ??
                              service.price?.basePricePesewas ??
                              0) / 100,
                          )}
                    </td>
                    <td>{service.estimatedHours} hours</td>
                    <td>{service.active ? "Active" : "Inactive"}</td>
                    {canManage && (
                      <td>
                        <button onClick={() => setEditingService(service)}>
                          Edit
                        </button>{" "}
                        <button
                          disabled={updateService.isPending}
                          onClick={() =>
                            updateService.mutate(
                              { id: service.id, active: !service.active },
                              {
                                onSuccess: () =>
                                  toast.success(
                                    service.active
                                      ? "Service deactivated."
                                      : "Service activated.",
                                  ),
                              },
                            )
                          }
                        >
                          {service.active ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <Settings2 size={22} />
            <b>No services configured</b>
            <span>Add the first priced service.</span>
          </div>
        )}
      </section>
      {showForm && (
        <div className="modal-backdrop">
          <section
            className="order-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-service-title"
          >
            <div className="modal-header">
              <div>
                <h2 id="add-service-title">Add service</h2>
                <p>Choose a pricing model that matches this service.</p>
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
                Name
                <input name="name" required />
              </label>
              <label>
                Pricing model
                <CustomSelect
                  value={pricingModel}
                  onChange={(event) =>
                    setPricingModel(event.target.value as PricingModel)
                  }
                >
                  <option value="per_item">Per item</option>
                  <option value="per_weight">Per weight</option>
                  <option value="bundle">Bundle with overage</option>
                  <option value="basket">Basket sizes</option>
                  <option value="flat_fee">Flat fee</option>
                </CustomSelect>
              </label>
              <label>
                {pricingModel === "basket"
                  ? "Small basket price (GHS)"
                  : "Price (GHS)"}
                <input
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                />
              </label>
              {pricingModel === "basket" && (
                <label>
                  Large basket price (GHS)
                  <input
                    name="largePrice"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                  />
                </label>
              )}
              {pricingModel === "bundle" && (
                <>
                  <label>
                    Items included
                    <input
                      name="includedItemCount"
                      type="number"
                      min="1"
                      required
                    />
                  </label>
                  <label>
                    Overage price per item (GHS)
                    <input
                      name="overagePrice"
                      type="number"
                      min="0"
                      step="0.01"
                      required
                    />
                  </label>
                </>
              )}
              <label>
                Estimated hours
                <input name="estimatedHours" type="number" min="1" required />
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
                  disabled={createService.isPending}
                >
                  Save service
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {editingService && (
        <EditServiceDialog
          service={editingService}
          onClose={() => setEditingService(null)}
        />
      )}
    </div>
  );
}

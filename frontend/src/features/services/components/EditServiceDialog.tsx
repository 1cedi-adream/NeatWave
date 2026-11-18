import { useState, type FormEvent } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { getApiErrorMessage } from "@/lib/apiError";
import { useUpdateService } from "../hooks/useServices";
import type {
  BasketOption,
  LaundryService,
  PricingModel,
} from "../types/laundryService";

export function EditServiceDialog({
  service,
  onClose,
}: {
  service: LaundryService;
  onClose: () => void;
}) {
  const [pricingModel, setPricingModel] = useState<PricingModel>(
    service.pricingModel,
  );
  const [basketOptions, setBasketOptions] = useState<BasketOption[]>(
    service.basketOptions.length
      ? service.basketOptions
      : [{ name: "Small", pricePesewas: 0, sortOrder: 0 }],
  );
  const updateService = useUpdateService();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const pricePesewas = Math.round(Number(form.get("price")) * 100);
    const price =
      pricingModel === "bundle"
        ? {
            basePricePesewas: pricePesewas,
            includedItemCount: Number(form.get("includedItemCount")),
            overagePricePesewas: Math.round(
              Number(form.get("overagePrice")) * 100,
            ),
          }
        : { unitPricePesewas: pricePesewas };
    updateService.mutate(
      {
        id: service.id,
        name: String(form.get("name")),
        estimatedHours: Number(form.get("estimatedHours")),
        pricingModel,
        price,
        basketOptions: pricingModel === "basket" ? basketOptions : [],
      },
      {
        onSuccess: () => {
          toast.success("Service updated.");
          onClose();
        },
        onError: (error) =>
          toast.error(getApiErrorMessage(error, "Could not update service.")),
      },
    );
  }
  const initialPrice =
    (service.price?.unitPricePesewas ?? service.price?.basePricePesewas ?? 0) /
    100;
  return (
    <div className="modal-backdrop">
      <section
        className="order-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-service-title"
      >
        <div className="modal-header">
          <div>
            <h2 id="edit-service-title">Edit service</h2>
            <p>Update details and pricing configuration.</p>
          </div>
          <button className="icon-button" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submit}>
          <label>
            Name
            <input name="name" defaultValue={service.name} required />
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
          {pricingModel !== "basket" && (
            <label>
              {pricingModel === "bundle"
                ? "Bundle base price (GHS)"
                : "Price (GHS)"}
              <input
                name="price"
                type="number"
                min="0.01"
                step="0.01"
                defaultValue={initialPrice}
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
                  defaultValue={service.price?.includedItemCount ?? 1}
                  required
                />
              </label>
              <label>
                Overage per item (GHS)
                <input
                  name="overagePrice"
                  type="number"
                  min="0.01"
                  step="0.01"
                  defaultValue={(service.price?.overagePricePesewas ?? 0) / 100}
                  required
                />
              </label>
            </>
          )}
          {pricingModel === "basket" && (
            <div className="basket-editor">
              <b>Basket options</b>
              <div className="basket-editor-options">
                {basketOptions.map((option, index) => (
                  <div key={option.id ?? index} className="basket-option">
                    <label
                      className="basket-option-name"
                      htmlFor={`basket-price-${index}`}
                    >
                      {option.name || `Basket ${index + 1}`}
                    </label>
                    <div className="basket-option-price-row">
                      <input
                        id={`basket-price-${index}`}
                        aria-label={`${option.name || `Basket ${index + 1}`} price in GHS`}
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={option.pricePesewas / 100}
                        onChange={(event) =>
                          setBasketOptions((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? {
                                    ...item,
                                    pricePesewas: Math.round(
                                      Number(event.target.value) * 100,
                                    ),
                                  }
                                : item,
                            ),
                          )
                        }
                        required
                      />
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={`Remove basket ${index + 1}`}
                        disabled={basketOptions.length === 1}
                        onClick={() =>
                          setBasketOptions((current) =>
                            current
                              .filter((_, itemIndex) => itemIndex !== index)
                              .map((item, itemIndex) => ({
                                ...item,
                                sortOrder: itemIndex,
                              })),
                          )
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="button button-secondary"
                onClick={() =>
                  setBasketOptions((current) => [
                    ...current,
                    {
                      name: `Basket ${current.length + 1}`,
                      pricePesewas: 0,
                      sortOrder: current.length,
                    },
                  ])
                }
              >
                <Plus size={16} />
                Add basket size
              </button>
            </div>
          )}
          <label>
            Estimated hours
            <input
              name="estimatedHours"
              type="number"
              min="1"
              defaultValue={service.estimatedHours}
              required
            />
          </label>
          <div className="modal-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="button button-primary"
              disabled={updateService.isPending}
            >
              Save changes
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { CustomSelect } from "@/components/ui/CustomSelect";
import {
  useCreateCustomer,
  useCustomers,
} from "@/features/customers/hooks/useCustomers";
import { useServices } from "@/features/services/hooks/useServices";
import { useSettings } from "@/features/settings/hooks/useSettings";
import { formatCurrency } from "@/lib/formatCurrency";
import { getApiErrorMessage } from "@/lib/apiError";
import { useCreateOrder } from "../hooks/useOrders";
import { estimateLineTotal } from "../utils";
import { CustomerCombobox } from "./CustomerCombobox";
import type { Customer } from "@/features/customers/types/customer";

type DraftLine = {
  key: number;
  serviceId: string;
  quantity: number;
  basketOptionId?: string;
};

export function CreateOrderDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (orderId: string) => void;
}) {
  const [step, setStep] = useState(1);
  const formRef = useRef<HTMLFormElement>(null);
  const [customerId, setCustomerId] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [newCustomer, setNewCustomer] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [debouncedCustomerSearch, setDebouncedCustomerSearch] = useState("");
  const [customerDraft, setCustomerDraft] = useState({
    fullName: "",
    phone: "",
    email: "",
    smsConsent: true,
    emailConsent: true,
  });
  const [lines, setLines] = useState<DraftLine[]>([
    { key: Date.now(), serviceId: "", quantity: 1 },
  ]);
  const [discountGhs, setDiscountGhs] = useState(0);
  const [taxBasisPoints, setTaxBasisPoints] = useState<number | undefined>();
  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => setDebouncedCustomerSearch(customerSearch.trim()),
      250,
    );
    return () => window.clearTimeout(timeoutId);
  }, [customerSearch]);
  const customers = useCustomers({
    page: 1,
    pageSize: 15,
    search: debouncedCustomerSearch || undefined,
  });
  const services = useServices();
  const settings = useSettings();
  const createCustomer = useCreateCustomer();
  const createOrder = useCreateOrder();
  const activeServices =
    services.data?.filter((service) => service.active) ?? [];
  const estimatedSubtotal = useMemo(
    () =>
      lines.reduce((total, line) => {
        const service = activeServices.find(
          (item) => item.id === line.serviceId,
        );
        return (
          total +
          (service
            ? estimateLineTotal(service, line.quantity, line.basketOptionId)
            : 0)
        );
      }, 0),
    [activeServices, lines],
  );
  const discountPesewas = Math.min(
    estimatedSubtotal,
    Math.round(discountGhs * 100),
  );
  const effectiveTaxBasisPoints =
    taxBasisPoints ?? settings.data?.taxBasisPoints ?? 0;
  const estimatedTax = Math.round(
    (estimatedSubtotal - discountPesewas) * (effectiveTaxBasisPoints / 10_000),
  );

  function updateLine(key: number, changes: Partial<DraftLine>) {
    setLines((current) =>
      current.map((line) =>
        line.key === key ? { ...line, ...changes } : line,
      ),
    );
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step !== 3) return;
    const form = new FormData(event.currentTarget);
    try {
      let selectedCustomerId = customerId;
      if (newCustomer) {
        const customer = await createCustomer.mutateAsync({
          ...customerDraft,
          email: customerDraft.email || undefined,
        });
        selectedCustomerId = customer.id;
      }
      const order = await createOrder.mutateAsync({
        customerId: selectedCustomerId,
        discountPesewas,
        taxBasisPoints: effectiveTaxBasisPoints,
        notes: String(form.get("notes")) || undefined,
        lines: lines.map(({ serviceId, quantity, basketOptionId }) => ({
          serviceId,
          quantity:
            activeServices.find((service) => service.id === serviceId)
              ?.pricingModel === "flat_fee" || basketOptionId
              ? undefined
              : quantity,
          basketOptionId,
        })),
      });
      toast.success(`${order.orderNumber} created.`);
      onCreated(order.id);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not create order."));
    }
  }

  const customerReady = newCustomer
    ? Boolean(customerDraft.fullName && customerDraft.phone)
    : Boolean(customerId);
  const linesReady =
    lines.length > 0 &&
    lines.every((line) => {
      const service = activeServices.find((item) => item.id === line.serviceId);
      return (
        Boolean(service) &&
        (service?.pricingModel !== "basket" || Boolean(line.basketOptionId))
      );
    });
  return (
    <div className="modal-backdrop">
      <section
        className="order-modal order-wizard"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-order-title"
      >
        <div className="modal-header">
          <div>
            <h2 id="create-order-title">Create order</h2>
            <p>
              Step {step} of 3 ·{" "}
              {step === 1 ? "Customer" : step === 2 ? "Services" : "Review"}
            </p>
          </div>
          <button className="icon-button" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <form ref={formRef} onSubmit={submit}>
          {step === 1 && (
            <div className="wizard-section">
              <label>
                Customer
                <CustomerCombobox
                  value={selectedCustomer?.fullName ?? customerSearch}
                  customers={customers.data?.data ?? []}
                  loading={customers.isFetching}
                  onChange={(searchValue) => {
                    setSelectedCustomer(null);
                    setCustomerId("");
                    setCustomerSearch(searchValue);
                  }}
                  onSelect={(customer) => {
                    setSelectedCustomer(customer);
                    setCustomerId(customer.id);
                    setCustomerSearch("");
                  }}
                />
              </label>
              <button
                type="button"
                className="text-link"
                onClick={() => {
                  setNewCustomer((value) => !value);
                  setCustomerId("");
                  setSelectedCustomer(null);
                  setCustomerSearch("");
                }}
              >
                {newCustomer
                  ? "Select an existing customer"
                  : "Create customer inline"}
              </button>
              {newCustomer && (
                <div className="form-grid">
                  <label>
                    Full name
                    <input
                      value={customerDraft.fullName}
                      onChange={(event) =>
                        setCustomerDraft((value) => ({
                          ...value,
                          fullName: event.target.value,
                        }))
                      }
                      required
                    />
                  </label>
                  <label>
                    Phone
                    <input
                      value={customerDraft.phone}
                      onChange={(event) =>
                        setCustomerDraft((value) => ({
                          ...value,
                          phone: event.target.value,
                        }))
                      }
                      required
                    />
                  </label>
                  <label>
                    Email
                    <input
                      type="email"
                      value={customerDraft.email}
                      onChange={(event) =>
                        setCustomerDraft((value) => ({
                          ...value,
                          email: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <div className="customer-consent-options">
                    <label>
                      <input
                        type="checkbox"
                        checked={customerDraft.smsConsent}
                        onChange={(event) =>
                          setCustomerDraft((value) => ({
                            ...value,
                            smsConsent: event.target.checked,
                          }))
                        }
                      />
                      SMS updates
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={customerDraft.emailConsent}
                        onChange={(event) =>
                          setCustomerDraft((value) => ({
                            ...value,
                            emailConsent: event.target.checked,
                          }))
                        }
                      />
                      Email updates
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}
          {step === 2 && (
            <div className="wizard-section">
              {lines.map((line, index) => {
                const service = activeServices.find(
                  (item) => item.id === line.serviceId,
                );
                return (
                  <fieldset key={line.key} className="service-line">
                    <legend>Service {index + 1}</legend>
                    <label>
                      Service
                      <CustomSelect
                        value={line.serviceId}
                        required
                        onChange={(event) =>
                          updateLine(line.key, {
                            serviceId: event.target.value,
                            basketOptionId: undefined,
                            quantity: 1,
                          })
                        }
                      >
                        <option value="">Select service</option>
                        {activeServices.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </CustomSelect>
                    </label>
                    {service?.pricingModel === "basket" ? (
                      <label>
                        Basket size
                        <CustomSelect
                          value={line.basketOptionId ?? ""}
                          required
                          onChange={(event) =>
                            updateLine(line.key, {
                              basketOptionId: event.target.value,
                            })
                          }
                        >
                          <option value="">Select basket</option>
                          {service.basketOptions
                            .filter((option) => option.active !== false)
                            .map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.name} ·{" "}
                                {formatCurrency(option.pricePesewas / 100)}
                              </option>
                            ))}
                        </CustomSelect>
                      </label>
                    ) : service && service.pricingModel !== "flat_fee" ? (
                      <label>
                        {service.pricingModel === "per_weight"
                          ? "Weight (kg)"
                          : "Item quantity"}
                        <input
                          type="number"
                          min="0.01"
                          step={
                            service.pricingModel === "per_weight" ? "0.01" : "1"
                          }
                          value={line.quantity}
                          onChange={(event) =>
                            updateLine(line.key, {
                              quantity: Number(event.target.value),
                            })
                          }
                        />
                      </label>
                    ) : null}
                    <div className="service-line-footer">
                      <b>
                        {formatCurrency(
                          (service
                            ? estimateLineTotal(
                                service,
                                line.quantity,
                                line.basketOptionId,
                              )
                            : 0) / 100,
                        )}
                      </b>
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={`Remove service ${index + 1}`}
                        disabled={lines.length === 1}
                        onClick={() =>
                          setLines((current) =>
                            current.filter((item) => item.key !== line.key),
                          )
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </fieldset>
                );
              })}
              <button
                type="button"
                className="button button-secondary"
                onClick={() =>
                  setLines((current) => [
                    ...current,
                    { key: Date.now(), serviceId: "", quantity: 1 },
                  ])
                }
              >
                <Plus size={16} />
                Add service
              </button>
            </div>
          )}
          {step === 3 && (
            <div className="wizard-section">
              <h3>Review order</h3>
              <p className="field-hint">
                Review the customer, services, discount, and tax before creating
                this order.
              </p>
              <div className="order-review-customer">
                <b>
                  {newCustomer
                    ? customerDraft.fullName
                    : customers.data?.data.find(
                        (customer) => customer.id === customerId,
                      )?.fullName}
                </b>
                <span>
                  {newCustomer
                    ? customerDraft.phone
                    : customers.data?.data.find(
                        (customer) => customer.id === customerId,
                      )?.phone}
                </span>
              </div>
              <ul>
                {lines.map((line) => {
                  const service = activeServices.find(
                    (item) => item.id === line.serviceId,
                  )!;
                  return (
                    <li key={line.key}>
                      <span>{service.name}</span>
                      <b>
                        {formatCurrency(
                          estimateLineTotal(
                            service,
                            line.quantity,
                            line.basketOptionId,
                          ) / 100,
                        )}
                      </b>
                    </li>
                  );
                })}
              </ul>
              <div className="form-grid order-review-adjustments">
                <label>
                  Discount (GHS)
                  <input
                    type="number"
                    min="0"
                    max={estimatedSubtotal / 100}
                    step="0.01"
                    value={discountGhs}
                    onChange={(event) =>
                      setDiscountGhs(Number(event.target.value))
                    }
                  />
                </label>
                <label>
                  Tax rate (%)
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={effectiveTaxBasisPoints / 100}
                    onChange={(event) =>
                      setTaxBasisPoints(
                        Math.round(Number(event.target.value) * 100),
                      )
                    }
                  />
                </label>
              </div>
              <dl className="receipt-totals">
                <div>
                  <dt>Subtotal</dt>
                  <dd>{formatCurrency(estimatedSubtotal / 100)}</dd>
                </div>
                <div>
                  <dt>Discount</dt>
                  <dd>-{formatCurrency(discountPesewas / 100)}</dd>
                </div>
                <div>
                  <dt>Tax ({(effectiveTaxBasisPoints / 100).toFixed(2)}%)</dt>
                  <dd>{formatCurrency(estimatedTax / 100)}</dd>
                </div>
                <div>
                  <dt>Estimated total</dt>
                  <dd>
                    {formatCurrency(
                      (estimatedSubtotal - discountPesewas + estimatedTax) /
                        100,
                    )}
                  </dd>
                </div>
              </dl>
              <label>
                Order notes
                <textarea name="notes" />
              </label>
            </div>
          )}
          <div className="modal-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={() =>
                step === 1 ? onClose() : setStep((value) => value - 1)
              }
            >
              {step === 1 ? "Cancel" : "Back"}
            </button>
            <button
              type="button"
              className="button button-primary"
              disabled={
                step === 1
                  ? !customerReady
                  : step === 2
                    ? !linesReady
                    : createOrder.isPending || createCustomer.isPending
              }
              onClick={() => {
                if (step < 3) setStep((value) => value + 1);
                else formRef.current?.requestSubmit();
              }}
            >
              {step === 3
                ? createOrder.isPending
                  ? "Creating…"
                  : "Create order"
                : "Continue"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

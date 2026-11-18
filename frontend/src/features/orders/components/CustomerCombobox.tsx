import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronsUpDown, LoaderCircle } from "lucide-react";
import type { Customer } from "@/features/customers/types/customer";

type CustomerComboboxProps = {
  customers: Customer[];
  value: string;
  loading: boolean;
  onChange: (value: string) => void;
  onSelect: (customer: Customer) => void;
};

export function CustomerCombobox({
  customers,
  value,
  loading,
  onChange,
  onSelect,
}: CustomerComboboxProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = "order-customer-options";

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.min(index + 1, customers.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && open && customers[activeIndex]) {
      event.preventDefault();
      onSelect(customers[activeIndex]);
      setOpen(false);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="customer-combobox" ref={containerRef}>
      <div className="customer-combobox-input-wrap">
        <input
          role="combobox"
          required
          aria-label="Select customer"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={
            open && customers[activeIndex]
              ? `customer-option-${customers[activeIndex].id}`
              : undefined
          }
          placeholder="Search by name, phone, or email"
          value={value}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setActiveIndex(0);
            setOpen(true);
            onChange(event.target.value);
          }}
          onKeyDown={handleKeyDown}
        />
        {loading ? (
          <LoaderCircle className="animate-spin" size={18} aria-hidden="true" />
        ) : (
          <ChevronsUpDown size={18} aria-hidden="true" />
        )}
      </div>
      {open && (
        <div
          className="customer-combobox-options"
          id={listboxId}
          role="listbox"
          aria-label="Matching customers"
        >
          {customers.map((customer, index) => (
            <button
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              id={`customer-option-${customer.id}`}
              key={customer.id}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => {
                onSelect(customer);
                setOpen(false);
              }}
            >
              <span>
                <b>{customer.fullName}</b>
                <small>
                  {customer.phone}
                  {customer.email ? ` · ${customer.email}` : ""}
                </small>
              </span>
              {value === customer.fullName && (
                <Check size={16} aria-hidden="true" />
              )}
            </button>
          ))}
          {!customers.length && !loading && (
            <p>
              {value.trim()
                ? "No matching customers found."
                : "Start typing to search customers."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

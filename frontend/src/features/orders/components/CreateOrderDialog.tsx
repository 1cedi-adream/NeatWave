import type { FormEvent } from "react";
import { Check, Download, Plus, WashingMachine, X } from "lucide-react";
import type { Receipt } from "../types/order";
import { CustomSelect } from "../../../components/ui/CustomSelect";

type CreateOrderDialogProps = {
  onClose: () => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
};

export function CreateOrderDialog({ onClose, onSave }: CreateOrderDialogProps) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="order-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <div>
            <h2 id="modal-title">Create an order</h2>
            <p>Add the customer's laundry and amount due.</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <X size={19} />
          </button>
        </div>
        <form onSubmit={onSave}>
          <label>
            Customer name
            <input
              name="name"
              autoFocus
              placeholder="e.g. Taylor Morgan"
              required
            />
          </label>
          <div className="form-row">
            <label>
              Phone number
              <input
                name="phone"
                placeholder="024 000 0000"
                type="tel"
                required
              />
            </label>
          </div>
          <label>
            Amount to pay (GHS)
            <input className="w-full" name="amountDue" type="number" min="0.01" step="0.01" placeholder="0.00" required />
          </label>
          <label>
            Payment method
            <CustomSelect name="payment">
              <option>Cash</option>
              <option>Mobile Money</option>
              <option>Card</option>
              <option>Bank transfer</option>
              <option>Other</option>
            </CustomSelect>
          </label>
          <div className="modal-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="button button-primary">
              <Plus size={16} /> Save order
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

type ReceiptPreviewProps = { receipt: Receipt; onClose: () => void };

export function ReceiptPreview({ receipt, onClose }: ReceiptPreviewProps) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="receipt-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="receipt-title"
      >
        <div className="receipt-success">
          <span>
            <Check size={18} />
          </span>
          Order saved · receipt created
        </div>
        <div className="receipt-paper">
          <div className="receipt-brand">
            <div className="brand-mark">
              <WashingMachine size={18} />
            </div>
            <span>Fresh & Fold</span>
          </div>
          <div className="receipt-address">
            18 Market Street · Downtown
            <br />
            (555) 018-2040
          </div>
          <h2 id="receipt-title">Receipt</h2>
          <div className="receipt-meta">
            <span>
              Receipt <b>RC-{receipt.id.slice(3)}</b>
            </span>
            <span>
              Order <b>{receipt.id}</b>
            </span>
            <span>Nov 13, 2026 · 10:42 AM</span>
          </div>
          <div className="receipt-rule" />
          <p className="receipt-customer">
            Customer <b>{receipt.name}</b>
          </p>
          <div className="receipt-item">
            <span>
              {receipt.items}
            </span>
            <b>{receipt.amount}</b>
          </div>
          <div className="receipt-rule" />
          <div className="receipt-total">
            <span>Total</span>
            <b>{receipt.amount}</b>
          </div>
          <div className="receipt-payment">
            Payment method <b>{receipt.payment}</b>
          </div>
          <div className="receipt-collect">
            Expected pickup <b>Today, 5:00 PM</b>
          </div>
          <p className="receipt-thanks">Thank you for choosing Fresh & Fold.</p>
        </div>
        <div className="receipt-actions">
          <button className="button button-secondary" onClick={onClose}>
            Close
          </button>
          <button
            className="button button-primary"
            onClick={() => window.print()}
          >
            <Download size={15} /> Print / save PDF
          </button>
        </div>
      </section>
    </div>
  );
}

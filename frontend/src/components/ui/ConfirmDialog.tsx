import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

type ConfirmDialogProps = {
  title: string;
  description: ReactNode;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({ title, description, confirmLabel, onCancel, onConfirm }: ConfirmDialogProps) {
  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
      <section className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl" role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-description">
        <div className="flex gap-4 p-5 sm:p-6">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-700"><AlertTriangle size={20} /></span>
          <div>
            <h2 id="confirm-dialog-title" className="font-display text-lg font-bold text-gray-900">{title}</h2>
            <p id="confirm-dialog-description" className="mt-2 text-sm leading-6 text-gray-600">{description}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4 sm:px-6">
          <button type="button" className="button button-secondary" onClick={onCancel}>Cancel</button>
          <button type="button" className="button border-rose-700 bg-rose-700 text-white hover:bg-rose-800" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </section>
    </div>
  );
}

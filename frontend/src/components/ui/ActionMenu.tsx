import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal } from "lucide-react";

export type RowAction = {
  label: string;
  onSelect: () => void;
  destructive?: boolean;
};

type ActionMenuProps = {
  label: string;
  actions: RowAction[];
};

export function ActionMenu({ label, actions }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, right: 8 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function closeOnOutsideClick(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node) && !buttonRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    function updatePosition() {
      const bounds = buttonRef.current?.getBoundingClientRect();
      if (!bounds) return;
      setPosition({
        top: Math.max(8, Math.min(bounds.bottom + 6, window.innerHeight - 150)),
        right: Math.max(8, window.innerWidth - bounds.right),
      });
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  function toggleMenu() {
    if (open) {
      setOpen(false);
      return;
    }
    const bounds = buttonRef.current?.getBoundingClientRect();
    if (bounds) {
      setPosition({ top: Math.max(8, Math.min(bounds.bottom + 6, window.innerHeight - 150)), right: Math.max(8, window.innerWidth - bounds.right) });
    }
    setOpen(true);
  }

  return (
    <div className="flex justify-end">
      <button
        ref={buttonRef}
        type="button"
        className="grid h-9 w-9 place-items-center rounded-lg border border-gray-200 bg-white text-emerald-900 transition hover:border-emerald-200 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
        aria-label={`Actions for ${label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggleMenu}
      >
        <MoreHorizontal size={18} />
      </button>
      {open && createPortal(
        <div ref={menuRef} className="fixed z-[80] min-w-44 rounded-lg border border-gray-200 bg-white p-1 shadow-lg" style={position} role="menu">
          {actions.map((action) => (
            <button
              type="button"
              role="menuitem"
              key={action.label}
              className={`block w-full rounded-md px-3 py-2 text-left text-sm transition hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-emerald-800 ${action.destructive ? "text-rose-700 hover:bg-rose-50" : "text-gray-800"}`}
              onClick={() => { setOpen(false); action.onSelect(); }}
            >
              {action.label}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}

import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

type CustomSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  variant?: "default" | "compact" | "status";
};

const selectStyles = {
  default:
    "h-11 w-full rounded-lg border border-gray-300 bg-white px-3 pr-10 text-sm text-gray-900 shadow-sm outline-none transition focus:border-emerald-800 focus:ring-4 focus:ring-emerald-800/10",
  compact:
    "h-9 w-full min-w-32 rounded-lg border border-gray-300 bg-white pl-3 pr-9 text-sm text-gray-800 outline-none transition focus:border-emerald-800 focus:ring-4 focus:ring-emerald-800/10",
  status:
    "h-8 max-w-44 appearance-none rounded-full border-0 py-1.5 pl-2.5 pr-7 text-xs font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-emerald-800",
};

export function CustomSelect({
  variant = "default",
  className = "",
  children,
  ...props
}: CustomSelectProps) {
  const compact = variant === "compact";
  const status = variant === "status";

  return (
    <span className={`relative inline-flex min-w-0 items-center ${compact ? "flex-1" : status ? "w-fit" : "w-full"}`}>
      <select
        className={`appearance-none ${selectStyles[variant]} ${className}`.trim()}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className={`pointer-events-none absolute right-3 text-gray-500 ${compact ? "h-4 w-4" : "h-4 w-4"}`}
        size={16}
      />
    </span>
  );
}

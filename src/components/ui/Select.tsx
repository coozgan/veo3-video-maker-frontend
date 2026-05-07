import { SelectHTMLAttributes, forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/cn";

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = forwardRef<HTMLSelectElement, Props>(
  ({ label, className, children, id, ...rest }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-xs font-medium text-fg-muted">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              "h-10 w-full appearance-none rounded-lg border border-border bg-surface px-3 pr-9 text-sm text-fg",
              "transition-colors hover:border-border-strong",
              "focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30",
              "disabled:cursor-not-allowed disabled:opacity-60",
              className
            )}
            {...rest}
          >
            {children}
          </select>
          <ChevronDown
            size={16}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-fg-muted"
          />
        </div>
      </div>
    );
  }
);
Select.displayName = "Select";

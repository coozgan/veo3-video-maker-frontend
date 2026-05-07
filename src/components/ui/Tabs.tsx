import { ReactNode } from "react";
import { cn } from "../../lib/cn";

export interface TabItem<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

interface Props<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (next: T) => void;
  disabled?: boolean;
}

export function Tabs<T extends string>({ items, value, onChange, disabled }: Props<T>) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-canvas p-1">
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(item.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              "disabled:cursor-not-allowed disabled:opacity-60",
              active
                ? "bg-surface-elevated text-fg shadow-sm"
                : "text-fg-muted hover:text-fg"
            )}
          >
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

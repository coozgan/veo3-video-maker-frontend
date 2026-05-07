import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { cn } from "../../lib/cn";
export function Tabs({ items, value, onChange, disabled }) {
    return (_jsx("div", { className: "inline-flex rounded-lg border border-border bg-canvas p-1", children: items.map((item) => {
            const active = item.value === value;
            return (_jsxs("button", { type: "button", disabled: disabled, onClick: () => onChange(item.value), className: cn("inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors", "disabled:cursor-not-allowed disabled:opacity-60", active
                    ? "bg-surface-elevated text-fg shadow-sm"
                    : "text-fg-muted hover:text-fg"), children: [item.icon, item.label] }, item.value));
        }) }));
}

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "../../lib/cn";
export function Toggle({ checked, onChange, label, disabled }) {
    return (_jsxs("label", { className: cn("inline-flex h-10 items-center gap-2.5 rounded-lg border border-border bg-surface px-3 text-sm", "transition-colors hover:border-border-strong", disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"), children: [_jsx("button", { type: "button", role: "switch", "aria-checked": checked, disabled: disabled, onClick: () => onChange(!checked), className: cn("relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors", checked ? "bg-accent" : "bg-border-strong"), children: _jsx("span", { className: cn("inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform", checked ? "translate-x-4" : "translate-x-0.5") }) }), _jsx("span", { className: "text-fg", children: label })] }));
}

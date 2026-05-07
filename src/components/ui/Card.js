import { jsx as _jsx } from "react/jsx-runtime";
import { forwardRef } from "react";
import { cn } from "../../lib/cn";
export const Card = forwardRef(({ className, ...rest }, ref) => (_jsx("div", { ref: ref, className: cn("rounded-2xl border border-border bg-surface shadow-sm", className), ...rest })));
Card.displayName = "Card";

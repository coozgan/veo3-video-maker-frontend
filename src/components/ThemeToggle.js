import { jsx as _jsx } from "react/jsx-runtime";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { cn } from "../lib/cn";
export function ThemeToggle() {
    const { theme, toggle } = useTheme();
    const isDark = theme === "dark";
    return (_jsx("button", { type: "button", onClick: toggle, "aria-label": isDark ? "Switch to light mode" : "Switch to dark mode", className: cn("inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-fg-muted", "transition-colors hover:text-fg hover:border-border-strong", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"), children: isDark ? _jsx(Sun, { size: 16 }) : _jsx(Moon, { size: 16 }) }));
}
